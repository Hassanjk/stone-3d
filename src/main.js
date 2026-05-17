import './styles.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#scene');
const loaderLabel = document.querySelector('#loader');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070707, 0.03);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0.18, 0.46, 7.55);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.setClearColor(0x000000, 0);

const stage = new THREE.Group();
stage.position.set(0, -0.02, 0);
scene.add(stage);

const warmCopper = new THREE.Color(0xff8a42);
const softAmber = new THREE.Color(0xffb27a);
const ringHaloTexture = createRadialGlowTexture('rgba(214, 118, 75, 0.34)');
const baseGlowTexture = createRadialGlowTexture('rgba(180, 94, 54, 0.28)');
const floorShadowTexture = createRadialGlowTexture('rgba(0, 0, 0, 0.58)');

scene.add(new THREE.HemisphereLight(0xcac5bc, 0x070504, 1.08));

const key = new THREE.DirectionalLight(0xf4eee4, 3.45);
key.position.set(-3.0, 4.4, 4.0);
scene.add(key);

const facetFill = new THREE.DirectionalLight(0xa49d92, 1.35);
facetFill.position.set(2.2, 1.6, 3.6);
scene.add(facetFill);

const stoneFaceLight = new THREE.PointLight(0xe6e0d4, 1.55, 5.4, 1.55);
stoneFaceLight.position.set(-1.1, 1.45, 2.9);
stage.add(stoneFaceLight);

const copperKick = new THREE.PointLight(0xc9794e, 2.35, 7.0, 1.9);
copperKick.position.set(1.75, -0.08, 1.75);
scene.add(copperKick);

const rimBackLight = new THREE.PointLight(0xd9875b, 3.6, 5.8, 2.0);
rimBackLight.position.set(0, 0.05, -0.55);
stage.add(rimBackLight);

const pedestalFill = new THREE.PointLight(0xb97752, 1.7, 4.5, 1.7);
pedestalFill.position.set(-0.6, -1.14, 2.15);
stage.add(pedestalFill);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(4.25, 1.2),
  new THREE.MeshBasicMaterial({
    map: floorShadowTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.66;
floor.renderOrder = -1;
stage.add(floor);

const ring = new THREE.Group();
ring.position.set(0, 0.16, -0.42);
stage.add(ring);

const ringHalo = new THREE.Mesh(
  new THREE.PlaneGeometry(4.3, 4.3),
  new THREE.MeshBasicMaterial({
    map: ringHaloTexture,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
ringHalo.position.z = -0.08;
ringHalo.renderOrder = -3;
ring.add(ringHalo);

const ringCore = new THREE.Mesh(
  new THREE.TorusGeometry(1.48, 0.005, 14, 256),
  new THREE.MeshBasicMaterial({
    color: 0xffc7a8,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  }),
);
ring.add(ringCore);

const ringGlowMaterials = [
  { radius: 1.48, tube: 0.018, opacity: 0.13 },
  { radius: 1.48, tube: 0.045, opacity: 0.045 },
  { radius: 1.48, tube: 0.085, opacity: 0.018 },
];
const ringGlows = ringGlowMaterials.map(({ radius, tube, opacity }) => {
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 18, 256),
    new THREE.MeshBasicMaterial({
      color: 0xd27d55,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.add(glow);
  return glow;
});

const baseRim = new THREE.Group();
baseRim.position.set(0, -1.58, 0.02);
stage.add(baseRim);

const baseTopGlow = new THREE.Mesh(
  new THREE.CircleGeometry(1.38, 96),
  new THREE.MeshBasicMaterial({
    map: baseGlowTexture,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
baseTopGlow.rotation.x = -Math.PI / 2;
baseTopGlow.position.set(0, -1.53, 0.0);
baseTopGlow.scale.z = 0.58;
baseTopGlow.renderOrder = 3;
stage.add(baseTopGlow);

const baseRimCore = new THREE.Mesh(
  new THREE.TorusGeometry(1.46, 0.006, 12, 256),
  new THREE.MeshBasicMaterial({
    color: 0xff6c28,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
baseRimCore.rotation.x = Math.PI / 2;
baseRim.add(baseRimCore);

const baseRimGlow = new THREE.Mesh(
  new THREE.TorusGeometry(1.46, 0.032, 12, 256),
  new THREE.MeshBasicMaterial({
    color: 0xd94e18,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
baseRimGlow.rotation.x = Math.PI / 2;
baseRim.add(baseRimGlow);

const outerTrace = new THREE.Mesh(
  new THREE.TorusGeometry(1.93, 0.003, 12, 256),
  new THREE.MeshBasicMaterial({
    color: 0x5f5852,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  }),
);
outerTrace.position.z = -0.05;
stage.add(outerTrace);

const manager = new THREE.LoadingManager();
manager.onLoad = () => loaderLabel?.classList.add('is-hidden');
manager.onError = (url) => {
  if (loaderLabel) loaderLabel.textContent = `Could not load ${url}`;
};
window.setTimeout(() => loaderLabel?.classList.add('is-hidden'), 1800);

const gltfLoader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);

function createReferenceStoneLayer() {
  const texture = textureLoader.load('/assets/stone-reference-cutout.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const stone = new THREE.Mesh(
    new THREE.PlaneGeometry(2.22, 2.88),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  stone.renderOrder = 5;
  return stone;
}

function createRadialGlowTexture(color) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  const gradient = ctx.createRadialGradient(256, 256, 48, 256, 256, 256);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.35, color.replace(/0\.\d+\)/, '0.16)'));
  gradient.addColorStop(0.72, color.replace(/0\.\d+\)/, '0.045)'));
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function normalizeModel(object, { targetHeight, targetWidth }) {
  const wrapper = new THREE.Group();
  wrapper.add(object);

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;

  const scaleBasis = targetHeight ? size.y : Math.max(size.x, size.z);
  const target = targetHeight ?? targetWidth;
  wrapper.scale.setScalar(target / scaleBasis);
  return wrapper;
}

function tuneMaterials(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.frustumCulled = false;
    node.castShadow = false;
    node.receiveShadow = false;
    const materials = Array.isArray(node.material) ? node.material : [node.material];

    materials.forEach((material) => {
      if (!material) return;
      material.envMapIntensity = 0.18;

      const replacement = new THREE.MeshPhysicalMaterial({
        color: 0x080808,
        roughness: 0.48,
        metalness: 0.02,
        clearcoat: 0.32,
        clearcoatRoughness: 0.46,
        normalMap: material.normalMap ?? null,
      });
      if (material.normalScale && replacement.normalScale) {
        replacement.normalScale.copy(material.normalScale).multiplyScalar(0.5);
      }
      node.material = Array.isArray(node.material) ? materials.map(() => replacement.clone()) : replacement;
    });
  });
}

function loadModel(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        tuneMaterials(gltf.scene);
        resolve(gltf.scene);
      },
      undefined,
      reject,
    );
  });
}

let baseModel;
let stoneModel;

stoneModel = createReferenceStoneLayer();
stoneModel.position.set(0.02, 0.24, 0.34);
stoneModel.rotation.z = -0.01;
stage.add(stoneModel);

loadModel('/assets/base.glb')
  .then((base) => {
    baseModel = normalizeModel(base, { targetWidth: 2.95 });
    baseModel.scale.y *= 0.58;
    baseModel.position.set(0, -1.62, 0);
    stage.add(baseModel);
  })
  .catch((error) => {
    console.error(error);
    if (loaderLabel) loaderLabel.textContent = 'Scene asset failed to load';
  });

const pointer = new THREE.Vector2(0, 0);
const smoothPointer = new THREE.Vector2(0, 0);

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
});

function resize() {
  const { clientWidth, clientHeight } = canvas;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.position.z = clientWidth < 560 ? 8.3 : 7.45;
  camera.position.y = clientWidth < 560 ? 0.3 : 0.44;
  stage.scale.setScalar(clientWidth < 560 ? 1 : 1.14);
  stage.position.set(0.03, clientWidth < 560 ? -0.02 : -0.08, 0);
  camera.lookAt(0, -0.2, 0);
  camera.updateProjectionMatrix();
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  resize();

  const elapsed = clock.getElapsedTime();
  smoothPointer.lerp(pointer, 0.045);

  stage.rotation.y = smoothPointer.x * 0.055;
  stage.rotation.x = -smoothPointer.y * 0.025;

  ring.rotation.z = elapsed * 0.012;
  ringCore.material.color.lerpColors(softAmber, warmCopper, (Math.sin(elapsed * 1.2) + 1) * 0.18);
  ringGlows.forEach((glow, index) => {
    glow.material.opacity = ringGlowMaterials[index].opacity * (0.82 + (Math.sin(elapsed * 1.2) + 1) * 0.12);
  });
  baseRimCore.material.opacity = 0.68 + (Math.sin(elapsed * 1.1) + 1) * 0.05;
  baseRimGlow.material.opacity = 0.055 + (Math.sin(elapsed * 1.1) + 1) * 0.012;
  rimBackLight.intensity = 3.4 + Math.sin(elapsed * 1.4) * 0.45;

  outerTrace.rotation.z = -elapsed * 0.025;

  if (stoneModel) {
    stoneModel.position.y = 0.24 + Math.sin(elapsed * 1.15) * 0.016;
    stoneModel.rotation.y = smoothPointer.x * 0.018;
    stoneModel.rotation.x = smoothPointer.y * 0.012;
  }

  if (baseModel) {
    baseModel.rotation.y = Math.sin(elapsed * 0.35) * 0.015;
  }

  renderer.render(scene, camera);
}

resize();
animate();
