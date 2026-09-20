import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { isPhysical, type LevelId } from './levels.ts';

/** Shared WebGL, lighting, camera, and controls owned by every model stage. */
export function createStageRuntime(
  host: HTMLDivElement,
  onError: (message: string) => void,
) {
  const scene = new T.Scene();
  const compact = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.domElement.tabIndex = -1;
  host.appendChild(renderer.domElement);

  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  const fill = new T.HemisphereLight(0xccd9e2, 0x23211f, 0.3);
  scene.add(fill);
  const key = new T.DirectionalLight(0xfff2e2, 2.05);
  key.position.set(-5, 7.5, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048);
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

  const rim = new T.DirectionalLight(0xb6d0e0, 1.75);
  rim.position.set(-6, 3.5, -5);
  scene.add(rim);
  const kick = new T.DirectionalLight(0xa2bdcf, 0.5);
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

  const contextLost = (event: Event) => {
    event.preventDefault();
    onError('The 3D context was interrupted. Reload the viewer to continue.');
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);

  return {
    scene,
    renderer,
    environment,
    key,
    rim,
    kick,
    camera,
    controls,
    canvas: renderer.domElement,
    dispose() {
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      controls.dispose();
      environment.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export type StageRuntime = ReturnType<typeof createStageRuntime>;

/** Shared demand-driven frame scheduler and OrbitControls wake-up policy. */
export function createStageLoop(
  controls: OrbitControls,
  onControlStart: () => void,
  draw: (seconds: number, delta: number, reducedMotion: boolean) => boolean,
) {
  let frameId = 0,
    remaining = 0,
    lastTime = performance.now();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(now: number) {
    const delta = Math.min(1, (now - lastTime) / 1000);
    lastTime = now;
    if (draw(now / 1000, delta, reducedMotion) || remaining) {
      remaining = Math.max(0, remaining - 1);
      frameId = requestAnimationFrame(render);
    } else frameId = 0;
  }

  function wake(frames = 35) {
    remaining = Math.max(remaining, frames);
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  const start = () => {
    onControlStart();
    wake();
  };
  const change = () => wake();
  controls.addEventListener('start', start);
  controls.addEventListener('change', change);

  return {
    wake,
    dispose() {
      cancelAnimationFrame(frameId);
      controls.removeEventListener('start', start);
      controls.removeEventListener('change', change);
    },
  };
}

export function configureStageLighting(runtime: StageRuntime, level: LevelId) {
  const hardware = isPhysical(level);
  runtime.scene.environmentIntensity =
    level === 'pc' ? 0.82 : hardware ? 1.05 : 0.48;
  runtime.key.intensity = level === 'pc' ? 1.85 : hardware ? 2.2 : 0.85;
  runtime.rim.intensity = hardware ? 1.6 : 0.7;
  runtime.kick.intensity = hardware ? 0.55 : 0.28;
}

export function collectAnimatedObjects(...roots: T.Object3D[]) {
  const animated: T.Object3D[] = [];
  for (const root of roots)
    root.traverse((object) => {
      if (!object.userData.spinRate && !object.userData.seekAmplitude) return;
      object.userData.restRotationY ??= object.rotation.y;
      animated.push(object);
    });
  return animated;
}

export function animateObjects(objects: T.Object3D[], seconds: number) {
  for (const object of objects) {
    const rest = object.userData.restRotationY as number;
    object.rotation.y = object.userData.spinRate
      ? rest + seconds * (object.userData.spinRate as number)
      : rest +
        Math.sin(seconds * 1.35) * (object.userData.seekAmplitude as number);
  }
}

export function defaultCameraDirection(size: T.Vector3, target: T.Vector3) {
  return target.set(
    0.7,
    T.MathUtils.lerp(
      1,
      0.44,
      Math.min(1, size.y / Math.max(size.x, size.z, 0.001)),
    ),
    1.2,
  );
}

export function fitCameraToBounds(
  bounds: T.Box3,
  camera: T.PerspectiveCamera,
  targetPosition: T.Vector3,
  targetLook: T.Vector3,
  direction: T.Vector3,
  size: T.Vector3,
  padding = 1,
  minimumDistance = 6,
) {
  bounds.getCenter(targetLook);
  bounds.getSize(size);
  direction.normalize();
  const radius = Math.max(size.length() / 2, 0.35);
  const vertical = T.MathUtils.degToRad(camera.fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
  const distance =
    (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * padding;
  targetPosition
    .copy(targetLook)
    .addScaledVector(direction, Math.max(minimumDistance, distance));
  return size;
}
