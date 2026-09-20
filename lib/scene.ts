import * as T from 'three';
import { buildModel, refreshBatches, type Piece } from './models';
import { resolvePickNear } from './picking.ts';
import { airflowShown, airflowStrength } from './airflow.ts';
import { byId, openLevel } from './manifest';
import type { ExplorerState, Selection } from './explorer-state.ts';
import { isPhysical } from './levels.ts';
import { smoothstep } from './layout';
import {
  applyPiecePose,
  disposeModelResources,
  laidOutAmount,
  pieceDestination,
  piecePosture,
  prepareModelInventory,
} from './model-stage';
import {
  animateObjects,
  collectAnimatedObjects,
  configureStageLighting,
  createStageRuntime,
  fitCameraToBounds,
} from './stage-runtime.ts';
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
  select: (selection: Selection | null, intent: 'open' | 'inspect') => void;
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
  const runtime = createStageRuntime(host);
  const { scene, renderer, key, camera, controls } = runtime;
  let state = initial,
    model = buildModel(state.level),
    amount = state.explode / 100,
    frameId = 0,
    settle = 80,
    autoCamera = true,
    disposed = false,
    dragStart: [number, number] = [0, 0],
    rightDragStart: [number, number] = [0, 0],
    rightGestureMoved = false,
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
    cameraDirection = new T.Vector3(),
    color = new T.Color();
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  const poseScratch = {
    position: layoutPosition,
    inventoryTarget,
    matrix,
    quaternion: quat,
    scale,
  };
  const turning = {
    extent: new T.Vector3(),
    centre: new T.Vector3(),
  };
  const activeTouches = new Set<number>(),
    selectionBounds = new T.Box3();
  const boxCenter = new T.Vector3(),
    boxSize = new T.Vector3();
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
    disposeModelResources(model);
    scene.remove(model.root);
  }
  /** Which set of pieces the shelves were last packed for. */
  let layoutSignature = '';
  function refresh() {
    configureStageLighting(runtime, state.level);
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
      prepareModelInventory(model, state.level, aspect, visible);
    }
    for (const p of model.pieces) p.visible = shown(p);
    for (const child of model.root.children)
      // Airflow is scenery too, but it fades on its own curve in `render`,
      // which is finer grained than this and would fight with it.
      if (child.userData.contextFrame && !child.userData.airflowTick)
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
  const destination = (piece: Piece, value: number) =>
    pieceDestination(
      piece,
      state.level,
      value,
      layoutPosition,
      inventoryTarget,
    );
  const posture = (piece: Piece, grid: number) =>
    piecePosture(piece, grid, turning.extent, turning.centre);
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
    const grid = laidOutAmount(state.explode / 100);
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
    const size = bounds.getSize(v);
    const direction =
      // Diagrams read from directly above once they are fully separated.
      // Hardware does not: it is laid out in depth, so stay on the orbit.
      state.explode > 85 && !isPhysical(state.level)
        ? cameraDirection.set(0, 1, 0.001)
        : state.view === 'top'
          ? cameraDirection.set(0, 1, 0.001)
          : state.view === 'front'
            ? cameraDirection.set(0, 0.05, 1)
            : state.view === 'back'
              ? cameraDirection.set(0, 0.05, -1)
              : state.level === 'motherboard' && state.explode < 15 && !focus
                ? cameraDirection.set(0.18, 1.9, 0.55)
                : // Look down on something flat like a card; stand nearer eye
                  // level for something tall like a tower, or the lid is all
                  // you see.
                  cameraDirection.set(
                    0.7,
                    T.MathUtils.lerp(
                      1,
                      0.44,
                      Math.min(1, size.y / Math.max(size.x, size.z, 0.001)),
                    ),
                    1.2,
                  );
    // A selected part needs breathing room inside the smaller stage left by
    // the detail panel. The old 0.8 multiplier cropped focused parts at every
    // edge, even though the ordinary whole-model fit looked intentional.
    const padding = focus
      ? 1.16
      : ['card', 'rx9070', 'arcb580', 'nvme'].includes(state.level) &&
          camera.aspect < 1
        ? 1.05
        : 0.8;
    fitCameraToBounds(
      bounds,
      camera,
      targetPosition,
      targetLook,
      direction,
      v,
      padding,
      focus ? 3.2 : 6,
    );
  }
  function boxFor(p: Piece, target: T.Box3) {
    // Use the part's authored bounds instead of measuring its descendants on
    // every frame. A rotating impeller changes its live axis-aligned bounds as
    // each blade turns, which made the hover outline breathe in and out even
    // though the fan itself never changed size.
    const s = p.object.scale.x;
    const { extent, centre } = posture(p, laidOutAmount(amount));
    target.setFromCenterAndSize(
      boxCenter.copy(p.object.position).addScaledVector(centre, s),
      boxSize.copy(extent).multiplyScalar(s).addScalar(0.018),
    );
  }
  let lastTime = performance.now();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animated: T.Object3D[] = [];
  /**
   * The airflow groups' own tick functions. Gathered with the rotors because
   * they are the same kind of thing: something the model knows how to animate
   * that the scene only has to supply a clock to.
   */
  let flows: ((seconds: number, strength: number) => void)[] = [];
  const collectAnimations = () => {
    animated = collectAnimatedObjects(model.root);
    flows = [];
    model.root.traverse((object) => {
      if (object.userData.airflowTick)
        flows.push(
          object.userData.airflowTick as (
            seconds: number,
            strength: number,
          ) => void,
        );
    });
  };
  collectAnimations();
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
      applyPiecePose(p, state.level, amount, poseScratch, ramp);
      if (p.batch) {
        color.set(
          matches(p, state.selection)
            ? '#ffd790'
            : hovered === p
              ? '#d3e9ff'
              : '#ffffff',
        );
        p.batch.setColorAt(p.index!, color);
        batches.add(p.batch);
      }
      if (matches(p, state.selection) && p.visible) {
        boxFor(p, selectionBounds);
        selectedBox.box.union(selectionBounds);
        selected = true;
      }
    }
    refreshBatches(batches);
    if (!reducedMotion && animated.length) {
      animateObjects(animated, now / 1000);
      // Operating parts keep the scene alive. requestAnimationFrame pauses in
      // background tabs, and reduced-motion users receive the static model.
      changed = true;
    }
    // Airflow describes a machine that is closed, so it goes as soon as this
    // one starts to open, and it follows the fans: switch Cooling off and the
    // arrows leave with the parts that were making them.
    if (flows.length) {
      const strength =
        airflowShown(state.airflow, state.level) &&
        !state.isolated &&
        state.visible.includes('Cooling')
          ? airflowStrength(amount)
          : 0;
      // Reduced motion gets the chevrons, standing still.
      for (const tick of flows) tick(reducedMotion ? 0 : now / 1000, strength);
      if (strength > 0.002 && !reducedMotion) changed = true;
    }
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
    if (e.pointerType === 'mouse' && e.button === 2) {
      rightDragStart = [e.clientX, e.clientY];
      rightGestureMoved = false;
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
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
    callbacks.select(
      p ? { concept: p.concept, instance: p.instance } : null,
      'open',
    );
    wake();
  }
  function move(e: PointerEvent) {
    if (
      e.pointerType === 'mouse' &&
      (e.buttons & 2) !== 0 &&
      Math.hypot(e.clientX - rightDragStart[0], e.clientY - rightDragStart[1]) >
        5
    )
      rightGestureMoved = true;
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
  function inspect(e: MouseEvent) {
    e.preventDefault();
    if (rightGestureMoved) {
      rightGestureMoved = false;
      return;
    }
    const p = hit(e, MOUSE_AIM);
    callbacks.select(
      p ? { concept: p.concept, instance: p.instance } : null,
      'inspect',
    );
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
  canvas.addEventListener('contextmenu', inspect);
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
        collectAnimations();
        // New pieces, so the cached packing belongs to objects that no longer
        // exist. Returning to a scale would otherwise leave every part of it
        // with an inventory position of zero, in a heap at the origin.
        layoutSignature = '';
        scene.add(model.root);
        amount = next.explode / 100;
        hovered = null;
        // Arrive close in, so the deeper scale opens out of the part you
        // clicked rather than appearing from nowhere at a new distance.
        dive = arriving
          ? { concept: next.diveInto ?? '', t: 0, phase: 'in' }
          : null;
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
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', leave);
      canvas.removeEventListener('contextmenu', inspect);
      canvas.removeEventListener('webglcontextlost', lost);
      disposeModel();
      selectedBox.geometry.dispose();
      (selectedBox.material as T.Material).dispose();
      hoverBox.geometry.dispose();
      (hoverBox.material as T.Material).dispose();
      runtime.dispose();
    },
  };
}
