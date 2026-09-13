import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModel, refreshBatches, type Piece } from './models';
import { resolvePickNear } from './picking.ts';
import { byId, openLevel, type ExplorerState, type Selection } from './manifest';
import { isPhysical, levels } from './levels.ts';
import { inventoryLayout, smoothstep, spatialInventory } from './layout';
/**
 * How far off a part you may point and still mean it, in CSS pixels.
 *
 * A mouse gets a few pixels of slack, enough to catch a resistor without the
 * cursor sticking to everything it passes. A finger gets more: the browser
 * reports one contact point for a touch about 9 mm across, and it is rarely
 * where the viewer thought they were aiming.
 */
const MOUSE_AIM = 8,
  TOUCH_AIM = 14;

export type SceneCallbacks = {
  select: (selection: Selection | null) => void;
  /** The isolate-and-close-in ramp has finished; open the deeper scale now. */
  dived: () => void;
  hover: (name: string | null, x: number, y: number, opens: boolean) => void;
  stats: (visible: number) => void;
  error: (message: string) => void;
};

export function createViewer(
  host: HTMLDivElement,
  initial: ExplorerState,
  callbacks: SceneCallbacks,
) {
  const scene = new T.Scene();
  // A phone runs the same geometry as a desktop, several hundred meshes and
  // a third of a million triangles, on a fraction of the fill rate, with no
  // fan and a battery. Drawing that at a phone's native 3x pixel ratio with a
  // 2048-pixel shadow map costs roughly nine times the fragment work of a
  // laptop and puts orbiting below the frame rate at which it still feels
  // attached to your finger. Fewer pixels and a smaller shadow map cost
  // almost nothing visible at arm's length, so quality follows the device.
  const compact = matchMedia('(pointer: coarse)').matches || innerWidth < 900,
    maxPixelRatio = compact ? 1.5 : 2,
    shadowSize = compact ? 1024 : 2048;
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio));
  renderer.shadowMap.enabled = true;
  // three.js now maps the retired soft constant to PCF internally and warns on
  // every load. Naming the renderer's real mode keeps the console quiet.
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  // Pointer interaction owns the canvas. The surrounding controls provide the
  // keyboard path, so the drawing surface must not become an empty tab stop.
  renderer.domElement.tabIndex = -1;
  host.appendChild(renderer.domElement);
  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 1.0;
  room.dispose();
  pmrem.dispose();
  const fill = new T.HemisphereLight(0xe0e9ed, 0x292824, 0.65);
  scene.add(fill);
  const key = new T.DirectionalLight(0xfff4e6, 2.6);
  key.position.set(-3, 10, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, {
    left: -8,
    right: 8,
    top: 8,
    bottom: -8,
    near: 0.1,
    far: 35,
  });
  key.shadow.bias = -0.00015;
  // Halving the shadow map doubles the world size of a shadow texel, so the
  // offset that keeps a surface from shadowing itself has to grow with it.
  key.shadow.normalBias = compact ? 0.024 : 0.012;
  scene.add(key);
  const rim = new T.DirectionalLight(0xbed6e3, 2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  // A dim light from below and in front. Without it every downward face goes
  // flat black and the parts read as silhouettes rather than as objects.
  const kick = new T.DirectionalLight(0xa9c4d6, 0.62);
  kick.position.set(6, -5, 7);
  scene.add(kick);
  const camera = new T.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(9, 11, 14);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.enablePan = true;
  controls.mouseButtons = {
    LEFT: T.MOUSE.ROTATE,
    MIDDLE: T.MOUSE.DOLLY,
    RIGHT: T.MOUSE.PAN,
  };
  controls.touches = { ONE: T.TOUCH.ROTATE, TWO: T.TOUCH.DOLLY_PAN };
  let state = initial,
    model = buildModel(state.level),
    amount = state.explode / 100,
    frameId = 0,
    settle = 80,
    autoCamera = true,
    disposed = false,
    dragStart: [number, number] = [0, 0],
    activePointer: number | null = null,
    gestureMoved = false,
    pointerPosition: { clientX: number; clientY: number } | null = null,
    hovered: Piece | null = null;
  /**
   * Descending is one continuous move, not a cut. `out` shrinks everything
   * except the part being opened while the camera closes in on it, leaving it
   * alone on the stage; `in` grows the deeper scale back up in its place. The
   * ramp lives here rather than in React so it does not re-render every frame.
   */
  let dive: { concept: string; t: number; phase: 'out' | 'in' } | null = null;
  const OUT_SECONDS = 0.8,
    IN_SECONDS = 0.62;
  const ease = (t: number) => t * t * (3 - 2 * t);
  scene.add(model.root);
  const selectedBox = new T.Box3Helper(new T.Box3(), 0xeab878),
    hoverBox = new T.Box3Helper(new T.Box3(), 0xc4d8e3);
  selectedBox.visible = false;
  hoverBox.visible = false;
  scene.add(selectedBox, hoverBox);
  const targetPosition = new T.Vector3(),
    targetLook = new T.Vector3(),
    layoutPosition = new T.Vector3(),
    inventoryTarget = new T.Vector3(),
    matrix = new T.Matrix4(),
    scale = new T.Vector3(),
    quat = new T.Quaternion(),
    bounds = new T.Box3(),
    v = new T.Vector3(),
    color = new T.Color();
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  const turning = {
    extent: new T.Vector3(),
    centre: new T.Vector3(),
  };
  const activeTouches = new Set<number>(),
    selectionBounds = new T.Box3();
  function matches(p: Piece, selection: Selection | null) {
    return (
      !!selection &&
      p.concept === selection.concept &&
      (selection.instance === undefined || selection.instance === p.instance)
    );
  }
  function shown(p: Piece) {
    return (
      state.visible.includes(byId[p.concept].category) &&
      !state.hidden.includes(p.concept) &&
      (!state.isolated || matches(p, state.selection)) &&
      (p.reveal === 0 || state.explode / 100 > p.reveal)
    );
  }
  function disposeModel() {
    const gs = new Set<T.BufferGeometry>(),
      ms = new Set<T.Material>();
    model.root.traverse((o) => {
      if (o instanceof T.Mesh) {
        gs.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          ms.add(m),
        );
      }
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m) => {
      if (
        m instanceof T.MeshBasicMaterial ||
        m instanceof T.MeshStandardMaterial
      )
        for (const value of Object.values(m))
          if (value instanceof T.Texture) value.dispose();
      m.dispose();
    });
    scene.remove(model.root);
  }
  /** Which set of pieces the shelves were last packed for. */
  let layoutSignature = '';
  function refresh() {
    // Hardware is lit like hardware; diagrams are lit flat so the blocks read
    // as a drawing rather than as objects sitting on a table.
    const hardwareScale = isPhysical(state.level);
    // Shine comes from specular contrast, not from turning everything up:
    // a strong environment for highlights, a restrained key so the diffuse
    // surfaces keep their tone instead of blowing out to chalk.
    scene.environmentIntensity = hardwareScale ? 0.86 : 0.48;
    key.intensity = hardwareScale ? 2.5 : 0.85;
    rim.intensity = hardwareScale ? 1.7 : 0.7;
    kick.intensity = hardwareScale ? 0.62 : 0.28;
    const visible = model.pieces.filter(shown);
    // Packing the shelves is the one expensive thing in here, and `refresh`
    // runs on every state change, which includes every step of the explode
    // slider. The packing only depends on which pieces are on stage and on the
    // shape of the viewport, so it is redone when one of those changes and not
    // sixty times a second while the parts are in flight.
    const aspect = host.clientWidth / host.clientHeight;
    const signature =
      state.level +
      '|' +
      aspect.toFixed(3) +
      '|' +
      visible.map((p) => p.key).join(',');
    if (signature !== layoutSignature) {
      layoutSignature = signature;
      const positions = inventoryLayout(visible.length, Math.max(0.6, aspect));
      const hardware = hardwareScale
        ? spatialInventory(
            visible.map((p) => ({
              extent: (p.lieExtent ?? p.extent).toArray() as [
                number,
                number,
                number,
              ],
              size: p.size,
            })),
            aspect,
          )
        : null;
      visible.forEach((p, i) => {
        p.inventory.set(...(hardware?.[i].position ?? positions[i]));
        p.inventoryScale = hardware?.[i].scale ?? 1.12 / p.size;
      });
    }
    for (const p of model.pieces) p.visible = shown(p);
    for (const child of model.root.children)
      if (child.userData.contextFrame)
        child.visible =
          visible.length > 0 && !state.isolated && state.explode < 20;
    callbacks.stats(visible.length);
    host.dataset.visible = String(visible.length);
    host.dataset.level = state.level;
    host.dataset.componentTypes = String(
      new Set(visible.map((p) => p.concept)).size,
    );
    settle = 90;
    autoCamera = true;
  }
  /**
   * How far the parts have settled onto the shelves, 0 to 1.
   *
   * It starts where the explosion finishes (`smoothstep(0.22, 0.68, …)` above)
   * rather than at 0.8. The gap between the two left the slider doing nothing
   * at all between 68% and 80% and then moving every part at once over the
   * last fifth, which is what read as a pause followed by a lurch.
   */
  const laidOut = (value: number) => smoothstep(0.7, 1, value);
  /** A piece's extent and box centre, part way through turning face up. */
  function posture(p: Piece, grid: number) {
    if (!p.lie || !p.lieExtent || !p.lieCenter)
      return { extent: p.extent, centre: p.center };
    return {
      extent: turning.extent.copy(p.extent).lerp(p.lieExtent, grid),
      centre: turning.centre.copy(p.center).lerp(p.lieCenter, grid),
    };
  }
  function destination(p: Piece, value: number) {
    const stage =
      byId[p.concept].category === 'Cooling'
        ? smoothstep(0, 0.48, value)
        : smoothstep(0.22, 0.68, value);
    layoutPosition
      .copy(p.base)
      .addScaledVector(
        p.delta,
        (isPhysical(state.level) ? stage : smoothstep(0, 0.75, value)) *
          (levels[state.level].spread ?? 1),
      );
    const grid = laidOut(value);
    inventoryTarget
      .copy(p.inventory)
      .addScaledVector(
        p.lieCenter ?? p.center,
        -(p.inventoryScale ?? 1),
      );
    layoutPosition.lerp(inventoryTarget, grid);
    return {
      position: layoutPosition,
      scale: T.MathUtils.lerp(1, p.inventoryScale ?? 1, grid),
    };
  }
  function fit() {
    bounds.makeEmpty();
    let focus = state.focusRevision > 0 && !!state.selection;
    const candidates = model.pieces.filter(
      (p) => p.visible && (!focus || matches(p, state.selection)),
    );
    if (!candidates.length) {
      focus = false;
      candidates.push(...model.pieces.filter((p) => p.visible));
    }
    const grid = laidOut(state.explode / 100);
    for (const p of candidates) {
      const dst = destination(p, state.explode / 100);
      const { extent, centre } = posture(p, grid);
      const half = extent.clone().multiplyScalar(dst.scale * 0.52);
      bounds.expandByPoint(
        v.copy(dst.position).addScaledVector(centre, dst.scale).add(half),
      );
      bounds.expandByPoint(
        v.copy(dst.position).addScaledVector(centre, dst.scale).sub(half),
      );
    }
    if (bounds.isEmpty()) {
      bounds.set(new T.Vector3(-4, -1, -2), new T.Vector3(4, 1, 2));
    }
    bounds.getCenter(targetLook);
    const size = bounds.getSize(v);
    const direction =
      // Diagrams read from directly above once they are fully separated.
      // Hardware does not: it is laid out in depth, so stay on the orbit.
      state.explode > 85 && !isPhysical(state.level)
        ? new T.Vector3(0, 1, 0.001)
        : state.view === 'top'
          ? new T.Vector3(0, 1, 0.001)
          : state.view === 'front'
            ? new T.Vector3(0, 0.05, 1)
            : state.view === 'back'
              ? new T.Vector3(0, 0.05, -1)
              : // Look down on something flat like a card; stand nearer eye
                // level for something tall like a tower, or the lid is all
                // you see.
                new T.Vector3(
                  0.7,
                  T.MathUtils.lerp(
                    1,
                    0.44,
                    Math.min(1, size.y / Math.max(size.x, size.z, 0.001)),
                  ),
                  1.2,
                );
    direction.normalize();
    // Fit the bounding sphere rather than guessing from width and height: a
    // flat card and a tall tower then frame the same way, at any aspect ratio.
    const radius = Math.max(size.length() / 2, 0.35);
    const vertical = T.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    // A selected part needs breathing room inside the smaller stage left by
    // the detail panel. The old 0.8 multiplier cropped focused parts at every
    // edge, even though the ordinary whole-model fit looked intentional.
    const padding = focus ? 1.16 : 0.8;
    const d =
      (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * padding;
    targetPosition
      .copy(targetLook)
      .addScaledVector(direction, Math.max(focus ? 3.2 : 6, d));
  }
  function boxFor(p: Piece, target: T.Box3) {
    if (p.batch) {
      const s = p.object.scale.x;
      target.setFromCenterAndSize(
        p.object.position,
        p.extent.clone().multiplyScalar(s).addScalar(0.018),
      );
    } else target.setFromObject(p.object);
  }
  let lastTime = performance.now();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render() {
    if (disposed) return;
    const now = performance.now(),
      dt = Math.min(1, (now - lastTime) / 1000);
    lastTime = now;
    amount = reducedMotion
      ? state.explode / 100
      : T.MathUtils.damp(amount, state.explode / 100, 10, dt);
    let changed = Math.abs(amount - state.explode / 100) > 0.0001;
    if (dive) {
      dive.t = reducedMotion
        ? 1
        : Math.min(
            1,
            dive.t + dt / (dive.phase === 'out' ? OUT_SECONDS : IN_SECONDS),
          );
      changed = true;
      if (dive.t >= 1) {
        const finished = dive;
        dive = dive.phase === 'in' ? null : dive;
        if (finished.phase === 'out') {
          // Hold the stage cleared while React swaps in the deeper scale.
          dive = { ...finished, t: 1 };
          callbacks.dived();
        }
      }
    }
    // Shadows fade out as the parts lay themselves out. They used to switch
    // off the moment the slider passed 80, and `castShadow` is a shader define:
    // flipping it makes three.js recompile every material in the scene, which
    // on a first pass froze the viewer for about a second right at the point
    // the reader was dragging through. Intensity is a uniform and costs
    // nothing to animate, and once it reaches zero the shadow pass is skipped
    // as well, which is the performance the switch was there for.
    const shadowFade = isPhysical(state.level)
      ? 1 - smoothstep(0.62, 0.9, amount)
      : 0;
    key.shadow.intensity = shadowFade;
    renderer.shadowMap.autoUpdate = shadowFade > 0.002;

    const batches = new Set<T.InstancedMesh>();
    let selected = false;
    selectedBox.box.makeEmpty();
    for (const p of model.pieces) {
      const dst = destination(p, amount);
      const reveal = p.reveal
        ? smoothstep(p.reveal, p.reveal + 0.07, amount)
        : 1;
      // Everything but the part being opened clears away, then the new scale
      // grows back in. Multiplying the scale keeps explode and reveal intact.
      let ramp = 1;
      if (dive)
        ramp =
          dive.phase === 'out'
            ? p.concept === dive.concept
              ? 1
              : 1 - ease(dive.t)
            : ease(dive.t);
      const s = p.visible ? dst.scale * reveal * ramp : 0;
      p.object.position.copy(dst.position);
      p.object.scale.setScalar(s);
      if (p.lie && p.restQuat)
        p.object.quaternion
          .copy(p.restQuat)
          .slerp(p.lie, laidOut(amount));
      if (p.batch) {
        matrix.compose(p.object.position, quat, scale.setScalar(s));
        p.batch.setMatrixAt(p.index!, matrix);
        color.set(
          matches(p, state.selection)
            ? '#ffd790'
            : hovered === p
              ? '#d3e9ff'
              : '#ffffff',
        );
        p.batch.setColorAt(p.index!, color);
        batches.add(p.batch);
      } else p.object.visible = p.visible;
      if (matches(p, state.selection) && p.visible) {
        boxFor(p, selectionBounds);
        selectedBox.box.union(selectionBounds);
        selected = true;
      }
    }
    refreshBatches(batches);
    selectedBox.visible = selected;
    hoverBox.visible = !!hovered && hovered.visible;
    if (hovered) boxFor(hovered, hoverBox.box);
    if (autoCamera) {
      fit();
      if (dive?.phase === 'in' && dive.t === 0)
        camera.position.copy(targetLook).lerp(targetPosition, 0.5);
      const blend = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
      camera.position.lerp(targetPosition, blend);
      controls.target.lerp(targetLook, blend);
      changed ||= camera.position.distanceToSquared(targetPosition) > 0.00001;
    }
    controls.update();
    model.root.updateMatrixWorld(true);
    // Keep names attached to the part under the cursor as the assembly moves.
    if (pointerPosition && activePointer === null && changed)
      updateHover(pointerPosition);
    renderer.render(scene, camera);
    host.dataset.drawCalls = String(renderer.info.render.calls);
    host.dataset.triangles = String(renderer.info.render.triangles);
    host.dataset.explode = String(Math.round(amount * 100));
    if (changed || settle-- > 0) frameId = requestAnimationFrame(render);
    else frameId = 0;
  }
  function wake() {
    settle = 35;
    if (!frameId) frameId = requestAnimationFrame(render);
  }
  controls.addEventListener('start', () => {
    autoCamera = false;
    wake();
  });
  controls.addEventListener('change', wake);
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    refresh();
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function hit(e: { clientX: number; clientY: number }, radius = 0) {
    const rect = renderer.domElement.getBoundingClientRect();
    const cast = (dx: number, dy: number) => {
      pointer.set(
        ((e.clientX + dx - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY + dy - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(model.root, true);
    };
    return resolvePickNear(cast, radius);
  }
  function down(e: PointerEvent) {
    if (e.pointerType === 'touch') activeTouches.add(e.pointerId);
    if (activeTouches.size > 1) {
      gestureMoved = true;
      return;
    }
    dragStart = [e.clientX, e.clientY];
    gestureMoved = false;
    activePointer = e.pointerId;
    hovered = null;
    callbacks.hover(null, 0, 0, false);
  }
  function up(e: PointerEvent) {
    activeTouches.delete(e.pointerId);
    if (e.pointerId !== activePointer) return;
    activePointer = null;
    if (
      gestureMoved ||
      activeTouches.size > 0 ||
      e.button !== 0 ||
      Math.hypot(e.clientX - dragStart[0], e.clientY - dragStart[1]) > 5
    )
      return;
    const p = hit(e, e.pointerType === 'touch' ? TOUCH_AIM : MOUSE_AIM);
    callbacks.select(p ? { concept: p.concept, instance: p.instance } : null);
    wake();
  }
  function move(e: PointerEvent) {
    if (
      activePointer === e.pointerId &&
      Math.hypot(e.clientX - dragStart[0], e.clientY - dragStart[1]) > 5
    )
      gestureMoved = true;
    pointerPosition = { clientX: e.clientX, clientY: e.clientY };
    if (e.buttons || e.pointerType === 'touch') return;
    updateHover(e);
    wake();
  }
  function updateHover(e: { clientX: number; clientY: number }) {
    const p = hit(e, MOUSE_AIM);
    hovered = p;
    renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
    callbacks.hover(
      p
        ? byId[p.concept].shortName +
            (model.pieces.filter((x) => x.concept === p.concept).length > 1
              ? ' ' + String(p.instance + 1).padStart(2, '0')
              : '')
        : null,
      e.clientX,
      e.clientY,
      !!p && !!openLevel(p.concept),
    );
  }
  function leave() {
    hovered = null;
    pointerPosition = null;
    activePointer = null;
    activeTouches.clear();
    callbacks.hover(null, 0, 0, false);
    wake();
  }
  function lost(e: Event) {
    e.preventDefault();
    callbacks.error(
      'The 3D context was interrupted. Reload the viewer to continue.',
    );
  }
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointercancel', leave);
  canvas.addEventListener('webglcontextlost', lost);
  refresh();
  resize();
  return {
    update(next: ExplorerState) {
      hovered = null;
      callbacks.hover(null, 0, 0, false);
      const arriving = dive?.phase === 'out' && next.level !== state.level;
      if (next.diveRevision !== state.diveRevision && next.diveInto)
        dive = { concept: next.diveInto, t: 0, phase: 'out' };
      if (next.level !== state.level) {
        disposeModel();
        model = buildModel(next.level);
        // New pieces, so the cached packing belongs to objects that no longer
        // exist. Returning to a scale would otherwise leave every part of it
        // with an inventory position of zero, in a heap at the origin.
        layoutSignature = '';
        scene.add(model.root);
        amount = next.explode / 100;
        hovered = null;
        // Arrive close in, so the deeper scale opens out of the part you
        // clicked rather than appearing from nowhere at a new distance.
        dive = arriving ? { concept: next.diveInto ?? '', t: 0, phase: 'in' } : null;
      }
      const cameraChange =
        next.explode !== state.explode ||
        next.level !== state.level ||
        next.cameraRevision !== state.cameraRevision ||
        next.focusRevision !== state.focusRevision ||
        next.isolated !== state.isolated;
      state = next;
      const priorAuto = autoCamera;
      refresh();
      autoCamera = cameraChange || priorAuto;
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', leave);
      canvas.removeEventListener('webglcontextlost', lost);
      disposeModel();
      selectedBox.geometry.dispose();
      (selectedBox.material as T.Material).dispose();
      hoverBox.geometry.dispose();
      (hoverBox.material as T.Material).dispose();
      env.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
