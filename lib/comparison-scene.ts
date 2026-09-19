import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  comparisonPanePoint,
  type ComparisonSide,
  type ComparisonState,
  type GpuComparisonLevel,
} from './comparison-state.ts';
import { byId } from './manifest.ts';
import {
  commonModelBounds,
  disposeModelResources,
  laidOutAmount,
  pieceDestination,
  posedModelBounds,
  prepareModelInventory,
  type BuiltModel,
} from './model-stage.ts';
import { buildModel, refreshBatches } from './models.ts';
import { resolvePickNear } from './picking.ts';

const BREAKPOINT = 700,
  MOUSE_AIM = 8;

export type ComparisonSceneCallbacks = {
  hover: (name: string | null, x: number, y: number) => void;
  stats: (visible: number) => void;
  error: (message: string) => void;
};

type PaneModel = {
  level: GpuComparisonLevel;
  model: BuiltModel;
  layoutSignature: string;
};

export function createComparisonViewer(
  host: HTMLDivElement,
  initial: ComparisonState,
  callbacks: ComparisonSceneCallbacks,
) {
  const scene = new T.Scene();
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
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.autoClear = false;
  renderer.info.autoReset = false;
  renderer.domElement.tabIndex = -1;
  host.appendChild(renderer.domElement);

  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.05;
  room.dispose();
  pmrem.dispose();

  scene.add(new T.HemisphereLight(0xccd9e2, 0x23211f, 0.3));
  const key = new T.DirectionalLight(0xfff2e2, 2.2);
  key.position.set(-5, 7.5, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, {
    left: -19,
    right: 19,
    top: 19,
    bottom: -19,
    near: 0.1,
    far: 60,
  });
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = compact ? 0.03 : 0.017;
  scene.add(key);
  const rim = new T.DirectionalLight(0xb6d0e0, 1.6);
  rim.position.set(-6, 3.5, -5);
  scene.add(rim);
  const kick = new T.DirectionalLight(0xa2bdcf, 0.55);
  kick.position.set(7, -4, 8);
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

  const makePane = (level: GpuComparisonLevel): PaneModel => {
    const model = buildModel(level);
    model.root.traverse((object) => {
      if (object.userData.contextFrame) object.visible = false;
    });
    scene.add(model.root);
    return { level, model, layoutSignature: '' };
  };
  let state = initial,
    panes: Record<ComparisonSide, PaneModel> = {
      left: makePane(initial.left),
      right: makePane(initial.right),
    },
    amount = initial.explode / 100,
    split = host.clientWidth >= BREAKPOINT,
    frameId = 0,
    settle = 80,
    autoCamera = true,
    disposed = false,
    pointerPosition: { clientX: number; clientY: number } | null = null,
    activePointer: number | null = null,
    dragStart: [number, number] = [0, 0],
    gestureMoved = false;

  const targetPosition = new T.Vector3(),
    targetLook = new T.Vector3(),
    size = new T.Vector3(),
    position = new T.Vector3(),
    inventoryTarget = new T.Vector3(),
    matrix = new T.Matrix4(),
    scale = new T.Vector3(),
    quaternion = new T.Quaternion(),
    leftBounds = new T.Box3(),
    rightBounds = new T.Box3(),
    commonBounds = new T.Box3(),
    raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  const activeTouches = new Set<number>();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animated: T.Object3D[] = [];

  function collectAnimations() {
    animated = [];
    for (const { model } of Object.values(panes))
      model.root.traverse((object) => {
        if (object.userData.spinRate || object.userData.seekAmplitude) {
          object.userData.restRotationY ??= object.rotation.y;
          animated.push(object);
        }
      });
  }
  collectAnimations();

  function paneAspect() {
    const width = split ? host.clientWidth / 2 : host.clientWidth;
    return width / Math.max(1, host.clientHeight);
  }

  function refreshPane(pane: PaneModel) {
    const visible = pane.model.pieces.filter(
      (piece) => piece.reveal === 0 || state.explode / 100 > piece.reveal,
    );
    pane.model.pieces.forEach((piece) => {
      piece.visible = visible.includes(piece);
    });
    const signature =
      pane.level +
      '|' +
      paneAspect().toFixed(3) +
      '|' +
      visible.map((piece) => piece.key).join(',');
    if (signature !== pane.layoutSignature) {
      pane.layoutSignature = signature;
      prepareModelInventory(pane.model, pane.level, paneAspect(), visible);
    }
  }

  function refresh() {
    refreshPane(panes.left);
    refreshPane(panes.right);
    const visible = panes.left.model.pieces.filter(
      (piece) => piece.visible,
    ).length;
    const visibleRight = panes.right.model.pieces.filter(
      (piece) => piece.visible,
    ).length;
    callbacks.stats(visible + visibleRight);
    host.dataset.pair = `${state.left}:${state.right}`;
    host.dataset.visible = String(visible + visibleRight);
    settle = 90;
  }

  function posePane(pane: PaneModel) {
    const batches = new Set<T.InstancedMesh>();
    for (const piece of pane.model.pieces) {
      const destination = pieceDestination(
        piece,
        pane.level,
        amount,
        position,
        inventoryTarget,
      );
      const reveal = piece.reveal
        ? T.MathUtils.smoothstep(amount, piece.reveal, piece.reveal + 0.07)
        : 1;
      const pieceScale = piece.visible ? destination.scale * reveal : 0;
      piece.object.position.copy(destination.position);
      piece.object.scale.setScalar(pieceScale);
      if (piece.lie && piece.restQuat)
        piece.object.quaternion
          .copy(piece.restQuat)
          .slerp(piece.lie, laidOutAmount(amount));
      if (piece.batch) {
        matrix.compose(
          piece.object.position,
          quaternion.identity(),
          scale.setScalar(pieceScale),
        );
        piece.batch.setMatrixAt(piece.index!, matrix);
        batches.add(piece.batch);
      } else piece.object.visible = piece.visible;
    }
    refreshBatches(batches);
    pane.model.root.updateMatrixWorld(true);
  }

  function fit() {
    posedModelBounds(panes.left.model, panes.left.level, amount, leftBounds);
    posedModelBounds(panes.right.model, panes.right.level, amount, rightBounds);
    commonModelBounds(leftBounds, rightBounds, commonBounds);
    commonBounds.getCenter(targetLook);
    commonBounds.getSize(size);
    const direction = new T.Vector3(
      0.7,
      T.MathUtils.lerp(
        1,
        0.44,
        Math.min(1, size.y / Math.max(size.x, size.z, 0.001)),
      ),
      1.2,
    ).normalize();
    const radius = Math.max(size.length() / 2, 0.35);
    const vertical = T.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    const distance =
      (radius / Math.sin(Math.min(vertical, horizontal) / 2)) *
      (camera.aspect < 1 ? 1.08 : 1);
    targetPosition
      .copy(targetLook)
      .addScaledVector(direction, Math.max(6, distance));
  }

  function renderPane(side: ComparisonSide, x: number, width: number) {
    const height = host.clientHeight;
    panes.left.model.root.visible = side === 'left';
    panes.right.model.root.visible = side === 'right';
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    renderer.setViewport(x, 0, width, height);
    renderer.setScissor(x, 0, width, height);
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
  }

  let lastTime = performance.now();
  function render() {
    if (disposed) return;
    const now = performance.now(),
      dt = Math.min(1, (now - lastTime) / 1000);
    lastTime = now;
    amount = reducedMotion
      ? state.explode / 100
      : T.MathUtils.damp(amount, state.explode / 100, 10, dt);
    let changed = Math.abs(amount - state.explode / 100) > 0.0001;
    key.shadow.intensity = 1 - T.MathUtils.smoothstep(amount, 0.62, 0.9);
    renderer.shadowMap.autoUpdate = key.shadow.intensity > 0.002;
    posePane(panes.left);
    posePane(panes.right);

    if (!reducedMotion && animated.length) {
      const seconds = now / 1000;
      for (const object of animated) {
        const rest = object.userData.restRotationY as number;
        object.rotation.y = object.userData.spinRate
          ? rest + seconds * (object.userData.spinRate as number)
          : rest +
            Math.sin(seconds * 1.35) *
              (object.userData.seekAmplitude as number);
      }
      changed = true;
    }

    camera.aspect = paneAspect();
    camera.updateProjectionMatrix();
    if (autoCamera) {
      fit();
      const blend = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
      camera.position.lerp(targetPosition, blend);
      controls.target.lerp(targetLook, blend);
      changed ||= camera.position.distanceToSquared(targetPosition) > 0.00001;
    }
    controls.update();

    renderer.info.reset();
    renderer.setScissorTest(true);
    if (split) {
      const width = host.clientWidth / 2;
      renderPane('left', 0, width);
      renderPane('right', width, width);
    } else renderPane(state.activeSide, 0, host.clientWidth);
    panes.left.model.root.visible = true;
    panes.right.model.root.visible = true;
    host.dataset.drawCalls = String(renderer.info.render.calls);
    host.dataset.triangles = String(renderer.info.render.triangles);
    host.dataset.explode = String(Math.round(amount * 100));
    host.dataset.mode = split ? 'split' : state.activeSide;

    if (pointerPosition && activePointer === null && changed)
      updateHover(pointerPosition);
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

  function resize() {
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    const wasSplit = split;
    split = width >= BREAKPOINT;
    renderer.setSize(width, height);
    camera.aspect = paneAspect();
    camera.updateProjectionMatrix();
    panes.left.layoutSignature = '';
    panes.right.layoutSignature = '';
    if (wasSplit !== split) {
      pointerPosition = null;
      callbacks.hover(null, 0, 0);
    }
    refresh();
    autoCamera = true;
    wake();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  function hit(event: { clientX: number; clientY: number }, radius = 0) {
    const rect = renderer.domElement.getBoundingClientRect();
    const origin = comparisonPanePoint(
      event.clientX,
      event.clientY,
      rect,
      split,
      state.activeSide,
    );
    const cast = (dx: number, dy: number) => {
      const point = comparisonPanePoint(
        event.clientX + dx,
        event.clientY + dy,
        rect,
        split,
        state.activeSide,
      );
      if (point.side !== origin.side) return [];
      pointer.set(point.x, point.y);
      camera.aspect = paneAspect();
      camera.updateProjectionMatrix();
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(panes[origin.side].model.root, true);
    };
    return resolvePickNear(cast, radius);
  }

  function updateHover(event: { clientX: number; clientY: number }) {
    const piece = hit(event, MOUSE_AIM);
    renderer.domElement.style.cursor = piece ? 'help' : 'grab';
    callbacks.hover(
      piece ? byId[piece.concept].shortName : null,
      event.clientX,
      event.clientY,
    );
  }

  function down(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType === 'touch') activeTouches.add(event.pointerId);
    if (activeTouches.size > 1) {
      gestureMoved = true;
      return;
    }
    dragStart = [event.clientX, event.clientY];
    gestureMoved = false;
    activePointer = event.pointerId;
    callbacks.hover(null, 0, 0);
  }

  function up(event: PointerEvent) {
    activeTouches.delete(event.pointerId);
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    if (
      !gestureMoved &&
      activeTouches.size === 0 &&
      Math.hypot(event.clientX - dragStart[0], event.clientY - dragStart[1]) <=
        5
    )
      updateHover(event);
  }

  function move(event: PointerEvent) {
    if (
      activePointer === event.pointerId &&
      Math.hypot(event.clientX - dragStart[0], event.clientY - dragStart[1]) > 5
    )
      gestureMoved = true;
    pointerPosition = { clientX: event.clientX, clientY: event.clientY };
    if (event.buttons || event.pointerType === 'touch') return;
    updateHover(event);
    wake();
  }

  function leave() {
    pointerPosition = null;
    activePointer = null;
    activeTouches.clear();
    callbacks.hover(null, 0, 0);
    wake();
  }

  function lost(event: Event) {
    event.preventDefault();
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

  function replacePane(side: ComparisonSide, level: GpuComparisonLevel) {
    const previous = panes[side];
    scene.remove(previous.model.root);
    disposeModelResources(previous.model);
    panes[side] = makePane(level);
  }

  return {
    update(next: ComparisonState) {
      callbacks.hover(null, 0, 0);
      pointerPosition = null;
      const swapped = next.left === state.right && next.right === state.left;
      if (swapped) panes = { left: panes.right, right: panes.left };
      else {
        if (next.left !== state.left) replacePane('left', next.left);
        if (next.right !== state.right) replacePane('right', next.right);
      }
      const cameraChange =
        next.explode !== state.explode ||
        next.left !== state.left ||
        next.right !== state.right;
      state = next;
      if (swapped || next.left !== panes.left.level)
        panes.left.level = next.left;
      if (swapped || next.right !== panes.right.level)
        panes.right.level = next.right;
      collectAnimations();
      refresh();
      autoCamera = cameraChange || autoCamera;
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
      for (const pane of Object.values(panes)) {
        scene.remove(pane.model.root);
        disposeModelResources(pane.model);
      }
      environment.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
