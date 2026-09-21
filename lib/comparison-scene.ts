import * as T from 'three';
import {
  comparisonPanePoint,
  type ComparisonLevel,
  type ComparisonSide,
  type ComparisonViewState,
} from './comparison-state.ts';
import { byId } from './manifest.ts';
import { isPhysical } from './levels.ts';
import {
  applyPiecePose,
  commonModelBounds,
  disposeModelResources,
  posedModelBounds,
  prepareModelInventory,
  type BuiltModel,
  ModelStageScratch,
} from './model-stage.ts';
import { buildModel, refreshBatches, type Piece } from './models.ts';
import { resolvePickNear } from './picking.ts';
import {
  animateObjects,
  collectAnimatedObjects,
  configureStageLighting,
  createStageLoop,
  createStageRuntime,
  defaultCameraDirection,
  fitCameraToBounds,
  pointerMoved,
} from './stage-runtime.ts';

const BREAKPOINT = 700,
  MOUSE_AIM = 8;

export type ComparisonSceneCallbacks = {
  hover: (name: string | null, x: number, y: number) => void;
  stats: (visible: number) => void;
  error: (message: string) => void;
};

type PaneModel = {
  level: ComparisonLevel;
  model: BuiltModel;
  layoutSignature: string;
};

export function createComparisonViewer(
  host: HTMLDivElement,
  initial: ComparisonViewState,
  callbacks: ComparisonSceneCallbacks,
) {
  const runtime = createStageRuntime(host, callbacks.error);
  const { scene, renderer, key, camera, controls } = runtime;
  renderer.autoClear = false;
  renderer.info.autoReset = false;

  const makePane = (level: ComparisonLevel): PaneModel => {
    const model = buildModel(level);
    model.root.traverse((object) => {
      if (object.userData.airflowTick) object.visible = false;
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
    autoCamera = true,
    pointerPosition: { clientX: number; clientY: number } | null = null,
    activePointer: number | null = null,
    dragStart: [number, number] = [0, 0],
    gestureMoved = false;
  configureStageLighting(runtime, initial.left);

  const targetPosition = new T.Vector3(),
    targetLook = new T.Vector3(),
    size = new T.Vector3(),
    leftBounds = new T.Box3(),
    rightBounds = new T.Box3(),
    commonBounds = new T.Box3(),
    cameraDirection = new T.Vector3(),
    raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  const activeTouches = new Set<number>(),
    batches = new Set<T.InstancedMesh>(),
    stageScratch = new ModelStageScratch();
  let animated: T.Object3D[] = [];

  function collectAnimations() {
    animated = collectAnimatedObjects(
      panes.left.model.root,
      panes.right.model.root,
    );
  }
  collectAnimations();

  function paneAspect() {
    const width = split ? host.clientWidth / 2 : host.clientWidth;
    return width / Math.max(1, host.clientHeight);
  }

  function refreshPane(pane: PaneModel) {
    const visible: Piece[] = [];
    for (const piece of pane.model.pieces) {
      piece.visible = piece.reveal === 0 || state.explode / 100 > piece.reveal;
      if (piece.visible) visible.push(piece);
    }
    const aspect = paneAspect();
    const signature =
      pane.level +
      '|' +
      aspect.toFixed(3) +
      '|' +
      visible.map((piece) => piece.key).join(',');
    if (signature !== pane.layoutSignature) {
      pane.layoutSignature = signature;
      prepareModelInventory(pane.model, pane.level, aspect, visible);
    }
    return visible.length;
  }

  function refresh() {
    const visible = refreshPane(panes.left) + refreshPane(panes.right);
    callbacks.stats(visible);
    host.dataset.pair = `${state.left}:${state.right}`;
    host.dataset.group = state.group;
    host.dataset.visible = String(visible);
    loop.wake(90);
  }

  function posePane(pane: PaneModel) {
    batches.clear();
    for (const piece of pane.model.pieces) {
      applyPiecePose(piece, pane.level, amount, stageScratch);
      if (piece.batch) batches.add(piece.batch);
    }
    refreshBatches(batches);
    pane.model.root.updateMatrixWorld(true);
  }

  function fit() {
    posedModelBounds(
      panes.left.model,
      panes.left.level,
      amount,
      leftBounds,
      stageScratch,
    );
    posedModelBounds(
      panes.right.model,
      panes.right.level,
      amount,
      rightBounds,
      stageScratch,
    );
    commonModelBounds(leftBounds, rightBounds, commonBounds);
    commonBounds.getSize(size);
    const direction =
      !isPhysical(state.left) && amount > 0.85
        ? cameraDirection.set(0, 1, 0.001)
        : defaultCameraDirection(size, cameraDirection);
    fitCameraToBounds(
      commonBounds,
      camera,
      targetPosition,
      targetLook,
      direction,
      size,
      camera.aspect < 1 ? 1.08 : 1,
    );
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

  function render(seconds: number, dt: number, reducedMotion: boolean) {
    amount = reducedMotion
      ? state.explode / 100
      : T.MathUtils.damp(amount, state.explode / 100, 10, dt);
    let changed = Math.abs(amount - state.explode / 100) > 0.0001;
    key.shadow.intensity = isPhysical(state.left)
      ? 1 - T.MathUtils.smoothstep(amount, 0.62, 0.9)
      : 0;
    renderer.shadowMap.autoUpdate = key.shadow.intensity > 0.002;
    posePane(panes.left);
    posePane(panes.right);

    if (!reducedMotion && animated.length) {
      animateObjects(animated, seconds);
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
    return changed;
  }
  const loop = createStageLoop(
    controls,
    () => {
      autoCamera = false;
    },
    render,
  );
  const wake = loop.wake;

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
      !pointerMoved(event, dragStart)
    )
      updateHover(event);
  }

  function move(event: PointerEvent) {
    if (activePointer === event.pointerId && pointerMoved(event, dragStart))
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

  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointercancel', leave);
  refresh();
  resize();

  function replacePane(side: ComparisonSide, level: ComparisonLevel) {
    const previous = panes[side];
    scene.remove(previous.model.root);
    disposeModelResources(previous.model);
    panes[side] = makePane(level);
  }

  return {
    update(next: ComparisonViewState) {
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
      configureStageLighting(runtime, next.left);
      collectAnimations();
      refresh();
      autoCamera = cameraChange || autoCamera;
      wake();
    },
    dispose() {
      loop.dispose();
      observer.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', leave);
      for (const pane of Object.values(panes)) {
        scene.remove(pane.model.root);
        disposeModelResources(pane.model);
      }
      runtime.dispose();
    },
  };
}
