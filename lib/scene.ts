import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModel, type Piece } from './models';
import { byId, type ExplorerState, type Selection } from './manifest';
import { inventoryLayout, smoothstep } from './layout';
export type SceneCallbacks = {
  select: (selection: Selection | null) => void;
  hover: (name: string | null, x: number, y: number) => void;
  stats: (visible: number) => void;
  error: (message: string) => void;
};
export function createViewer(
  host: HTMLDivElement,
  initial: ExplorerState,
  callbacks: SceneCallbacks,
) {
  const scene = new T.Scene();
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  host.appendChild(renderer.domElement);
  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.9;
  room.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight(0xe0edff, 0x34352b, 1.2));
  const key = new T.DirectionalLight(0xf6f7ee, 2);
  key.position.set(2, 8, 4);
  scene.add(key);
  const rim = new T.DirectionalLight(0xbed6e3, 2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
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
    hovered: Piece | null = null;
  scene.add(model.root);
  const selectedBox = new T.Box3Helper(new T.Box3(), 0xd9ebce),
    hoverBox = new T.Box3Helper(new T.Box3(), 0xa9c5b4);
  selectedBox.visible = false;
  hoverBox.visible = false;
  scene.add(selectedBox, hoverBox);
  const targetPosition = new T.Vector3(),
    targetLook = new T.Vector3(),
    layoutPosition = new T.Vector3(),
    matrix = new T.Matrix4(),
    scale = new T.Vector3(),
    quat = new T.Quaternion(),
    bounds = new T.Box3(),
    v = new T.Vector3(),
    color = new T.Color();
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
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
        m.map?.dispose();
      m.dispose();
    });
    scene.remove(model.root);
  }
  function refresh() {
    scene.environmentIntensity = state.level === 'card' ? 0.9 : 0.45;
    key.intensity = state.level === 'card' ? 2 : 0.85;
    rim.intensity = state.level === 'card' ? 2 : 0.7;
    const visible = model.pieces.filter(shown);
    const positions = inventoryLayout(
      visible.length,
      Math.max(0.6, host.clientWidth / host.clientHeight),
    );
    visible.forEach((p, i) => p.inventory.set(...positions[i]));
    for (const p of model.pieces) p.visible = shown(p);
    for (const child of model.root.children)
      if (child.userData.contextFrame)
        child.visible =
          visible.length > 0 && !state.isolated && state.explode < 20;
    callbacks.stats(visible.length);
    host.dataset.visible = String(visible.length);
    host.dataset.level = state.level;
    settle = 90;
    autoCamera = true;
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
        state.level === 'card' ? stage : smoothstep(0, 0.75, value),
      );
    const grid = smoothstep(0.8, 1, value);
    layoutPosition.lerp(p.inventory, grid);
    return {
      position: layoutPosition,
      scale: T.MathUtils.lerp(1, 1.12 / p.size, grid),
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
    for (const p of candidates) {
      const dst = destination(p, state.explode / 100);
      const half = p.extent.clone().multiplyScalar(dst.scale * 0.52);
      bounds.expandByPoint(v.copy(dst.position).add(half));
      bounds.expandByPoint(v.copy(dst.position).sub(half));
    }
    if (bounds.isEmpty()) {
      bounds.set(new T.Vector3(-4, -1, -2), new T.Vector3(4, 1, 2));
    }
    bounds.getCenter(targetLook);
    const size = bounds.getSize(v);
    const direction =
      state.explode > 85
        ? new T.Vector3(0, 1, 0.001)
        : state.view === 'top'
          ? new T.Vector3(0, 1, 0.001)
          : state.view === 'front'
            ? new T.Vector3(0, 0.05, 1)
            : state.view === 'back'
              ? new T.Vector3(0, 0.05, -1)
              : new T.Vector3(0.7, 1, 1.2);
    direction.normalize();
    const isTop = state.explode > 85 || state.view === 'top';
    const w = isTop ? size.x : Math.hypot(size.x, size.z) * 0.82;
    const h = isTop
      ? size.z
      : Math.max(size.y * 0.8 + size.z * 0.75, size.x * 0.3);
    const d =
      (Math.max(h, w / camera.aspect) /
        (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
        1.43 +
      size.y * 0.25;
    targetPosition
      .copy(targetLook)
      .addScaledVector(direction, Math.max(focus ? 2.8 : 6, d));
  }
  function boxFor(p: Piece, target: T.Box3) {
    if (p.batch) {
      const s = p.object.scale.x;
      target.setFromCenterAndSize(
        p.object.position,
        new T.Vector3(p.size * s, p.size * s, p.size * s),
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
    const batches = new Set<T.InstancedMesh>();
    let selected = false;
    for (const p of model.pieces) {
      const dst = destination(p, amount);
      const reveal = p.reveal
        ? smoothstep(p.reveal, p.reveal + 0.07, amount)
        : 1;
      const s = p.visible ? dst.scale * reveal : 0;
      p.object.position.copy(dst.position);
      p.object.scale.setScalar(s);
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
      if (
        matches(p, state.selection) &&
        p.visible &&
        state.selection?.instance !== undefined
      ) {
        boxFor(p, selectedBox.box);
        selected = true;
      }
    }
    for (const b of batches) {
      b.instanceMatrix.needsUpdate = true;
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
    selectedBox.visible = selected;
    hoverBox.visible = !!hovered && hovered.visible;
    if (hovered) boxFor(hovered, hoverBox.box);
    if (autoCamera) {
      fit();
      const blend = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
      camera.position.lerp(targetPosition, blend);
      controls.target.lerp(targetLook, blend);
      changed ||= camera.position.distanceToSquared(targetPosition) > 0.00001;
    }
    controls.update();
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
  function hit(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(model.root, true);
    for (const h of hits) {
      let obj: T.Object3D | null = h.object;
      let p: Piece | undefined;
      if (h.object instanceof T.InstancedMesh && h.object.userData.pieces)
        p = h.object.userData.pieces[h.instanceId!];
      else
        while (obj && !p) {
          p = obj.userData.piece;
          obj = obj.parent;
        }
      if (p?.visible && p.object.scale.x > 0.02) return p;
    }
    return null;
  }
  function down(e: PointerEvent) {
    dragStart = [e.clientX, e.clientY];
  }
  function up(e: PointerEvent) {
    if (
      e.button !== 0 ||
      Math.hypot(e.clientX - dragStart[0], e.clientY - dragStart[1]) > 5
    )
      return;
    const p = hit(e);
    callbacks.select(p ? { concept: p.concept, instance: p.instance } : null);
    wake();
  }
  function move(e: PointerEvent) {
    if (e.buttons) return;
    const p = hit(e);
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
    );
    wake();
  }
  function leave() {
    hovered = null;
    callbacks.hover(null, 0, 0);
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
  canvas.addEventListener('webglcontextlost', lost);
  refresh();
  resize();
  return {
    update(next: ExplorerState) {
      if (next.level !== state.level) {
        disposeModel();
        model = buildModel(next.level);
        scene.add(model.root);
        amount = next.explode / 100;
        hovered = null;
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
      canvas.removeEventListener('webglcontextlost', lost);
      disposeModel();
      selectedBox.geometry.dispose();
      (selectedBox.material as T.Material).dispose();
      hoverBox.geometry.dispose();
      (hoverBox.material as T.Material).dispose();
      env.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
