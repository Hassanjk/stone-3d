import './styles.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   LENIS — ultra-smooth scroll physics
   ============================================================ */
const lenis = new Lenis({
  duration: 1.12,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 0.72,
  touchMultiplier: 1.25,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ============================================================
   THREE.JS — Scene
   ============================================================ */
const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070707, 0.03);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.18, 0.46, 7.55);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.setClearColor(0x000000, 0);

/* ============================================================
   Stage & Lighting
   ============================================================ */
const stage = new THREE.Group();
stage.position.set(0, -0.02, 0);
scene.add(stage);

const warmCopper = new THREE.Color(0xff8a42);
const softAmber  = new THREE.Color(0xffb27a);

const ringHaloTex    = createRadialGlowTexture('rgba(214, 118, 75, 0.34)');
const baseGlowTex   = createRadialGlowTexture('rgba(180, 94, 54, 0.28)');
const floorShadowTex = createRadialGlowTexture('rgba(0, 0, 0, 0.58)');
const STONE_WIDTH_BOOST = 1.26;
const STONE_FRONT_YAW = -0.42;
const STONE_SPIN_SPEED = 0.28;

scene.add(new THREE.HemisphereLight(0xcac5bc, 0x070504, 1.08));

const keyLight = new THREE.DirectionalLight(0xf4eee4, 3.45);
keyLight.position.set(-3.0, 4.4, 4.0);
scene.add(keyLight);

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

/* ============================================================
   Floor shadow
   ============================================================ */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(4.25, 1.2),
  new THREE.MeshBasicMaterial({ map: floorShadowTex, transparent: true, opacity: 0.5, depthWrite: false }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.66;
floor.renderOrder = -1;
stage.add(floor);

/* ============================================================
   Ring system (primary)
   ============================================================ */
const ring = new THREE.Group();
ring.position.set(0, 0.16, -0.42);
stage.add(ring);

const ringHalo = new THREE.Mesh(
  new THREE.PlaneGeometry(4.3, 4.3),
  new THREE.MeshBasicMaterial({ map: ringHaloTex, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false }),
);
ringHalo.position.z = -0.08;
ringHalo.renderOrder = -3;
ring.add(ringHalo);

const ringCore = new THREE.Mesh(
  new THREE.TorusGeometry(1.48, 0.005, 14, 256),
  new THREE.MeshBasicMaterial({ color: 0xffc7a8, transparent: true, opacity: 0.88, depthWrite: false }),
);
ring.add(ringCore);

const ringGlowDefs = [
  { radius: 1.48, tube: 0.018, opacity: 0.13 },
  { radius: 1.48, tube: 0.045, opacity: 0.045 },
  { radius: 1.48, tube: 0.085, opacity: 0.018 },
];
const ringGlows = ringGlowDefs.map(({ radius, tube, opacity }) => {
  const g = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 18, 256),
    new THREE.MeshBasicMaterial({ color: 0xd27d55, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  ring.add(g);
  return g;
});

/* ============================================================
   Base rim
   ============================================================ */
const baseRim = new THREE.Group();
baseRim.position.set(0, -1.58, 0.02);
stage.add(baseRim);

const baseTopGlow = new THREE.Mesh(
  new THREE.CircleGeometry(1.38, 96),
  new THREE.MeshBasicMaterial({ map: baseGlowTex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
);
baseTopGlow.rotation.x = -Math.PI / 2;
baseTopGlow.position.set(0, -1.53, 0);
baseTopGlow.scale.z = 0.58;
baseTopGlow.renderOrder = 3;
stage.add(baseTopGlow);

const baseRimCore = new THREE.Mesh(
  new THREE.TorusGeometry(1.46, 0.006, 12, 256),
  new THREE.MeshBasicMaterial({ color: 0xff6c28, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false }),
);
baseRimCore.rotation.x = Math.PI / 2;
baseRim.add(baseRimCore);

const baseRimGlow = new THREE.Mesh(
  new THREE.TorusGeometry(1.46, 0.032, 12, 256),
  new THREE.MeshBasicMaterial({ color: 0xd94e18, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }),
);
baseRimGlow.rotation.x = Math.PI / 2;
baseRim.add(baseRimGlow);

const outerTrace = new THREE.Mesh(
  new THREE.TorusGeometry(1.93, 0.003, 12, 256),
  new THREE.MeshBasicMaterial({ color: 0x5f5852, transparent: true, opacity: 0.16, depthWrite: false }),
);
outerTrace.position.z = -0.05;
stage.add(outerTrace);

/* ============================================================
   Second ring (tilted orbital — appears in final section)
   ============================================================ */
const ring2 = new THREE.Group();
ring2.position.set(0, 0.16, -0.42);
ring2.rotation.set(0.6, 0.4, 0);
stage.add(ring2);

const ring2Core = new THREE.Mesh(
  new THREE.TorusGeometry(1.55, 0.004, 14, 256),
  new THREE.MeshBasicMaterial({ color: 0xffc7a8, transparent: true, opacity: 0, depthWrite: false }),
);
ring2.add(ring2Core);

const ring2Glow = new THREE.Mesh(
  new THREE.TorusGeometry(1.55, 0.025, 18, 256),
  new THREE.MeshBasicMaterial({ color: 0xd27d55, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
);
ring2.add(ring2Glow);

/* ============================================================
   Particle lights (orbit the rings in final section)
   ============================================================ */
const particleGroup = new THREE.Group();
particleGroup.position.copy(ring.position);
stage.add(particleGroup);

const particles = [];
for (let i = 0; i < 8; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }),
  );
  particleGroup.add(m);
  particles.push({ mesh: m, ringIdx: i < 4 ? 0 : 1, speed: 0.25 + Math.random() * 0.35, offset: (i / 8) * Math.PI * 2 });
}

/* ============================================================
   Loaders
   ============================================================ */
const manager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(manager);

function createRadialGlowTexture(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  const g = ctx.createRadialGradient(256, 256, 48, 256, 256, 256);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color.replace(/0\.\d+\)/, '0.16)'));
  g.addColorStop(0.72, color.replace(/0\.\d+\)/, '0.045)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function normalizeModel(obj, { targetHeight, targetWidth }) {
  const wrap = new THREE.Group();
  wrap.add(obj);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
  const basis = targetHeight ? size.y : Math.max(size.x, size.z);
  wrap.scale.setScalar((targetHeight ?? targetWidth) / basis);
  return wrap;
}

function normalizeModelCentered(obj, { targetHeight, targetWidth }) {
  const wrap = new THREE.Group();
  wrap.add(obj);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const basis = targetHeight ? size.y : Math.max(size.x, size.z);
  wrap.scale.setScalar((targetHeight ?? targetWidth) / basis);
  return wrap;
}

function createNeutralStoneTexture(sourceTexture) {
  const sourceImage = sourceTexture?.image;
  if (!sourceImage) return sourceTexture ?? null;

  const width = sourceImage.width;
  const height = sourceImage.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const redDominance = r - Math.max(g, b);
    const isHotLine = redDominance > 24 && r > 58;
    const neutral = 3 + luminance * (isHotLine ? 0.025 : 0.2);
    data[i] = Math.min(235, neutral * 1.03);
    data[i + 1] = Math.min(235, neutral);
    data[i + 2] = Math.min(235, neutral * 0.96);
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = sourceTexture.wrapS;
  texture.wrapT = sourceTexture.wrapT;
  texture.flipY = sourceTexture.flipY;
  texture.anisotropy = 8;
  return texture;
}

function tuneMaterials(root) {
  root.traverse((n) => {
    if (!n.isMesh) return;
    n.frustumCulled = false;
    n.castShadow = n.receiveShadow = false;
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    mats.forEach((mat) => {
      if (!mat) return;
      const rep = new THREE.MeshPhysicalMaterial({
        color: 0x080808, roughness: 0.48, metalness: 0.02,
        clearcoat: 0.32, clearcoatRoughness: 0.46,
        normalMap: mat.normalMap ?? null,
      });
      if (mat.normalScale && rep.normalScale) rep.normalScale.copy(mat.normalScale).multiplyScalar(0.5);
      n.material = rep;
    });
  });
}

function tuneStoneMaterials(root) {
  root.traverse((n) => {
    if (!n.isMesh) return;
    n.frustumCulled = false;
    n.castShadow = n.receiveShadow = false;
    const originalIsArray = Array.isArray(n.material);
    const mats = originalIsArray ? n.material : [n.material];
    const tunedMats = mats.map((mat) => {
      const stoneMap = createNeutralStoneTexture(mat.map);
      const tuned = new THREE.MeshPhysicalMaterial({
        map: stoneMap,
        normalMap: mat.normalMap ?? null,
        metalnessMap: mat.metalnessMap ?? null,
        roughnessMap: mat.roughnessMap ?? null,
        emissiveMap: null,
        color: 0x45423e,
        roughness: 0.46,
        metalness: 0.02,
        clearcoat: 0.34,
        clearcoatRoughness: 0.42,
        emissive: 0x000000,
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });
      if (tuned.map) tuned.map.colorSpace = THREE.SRGBColorSpace;
      if (tuned.normalMap && tuned.normalScale) tuned.normalScale.set(0.45, 0.45);
      return tuned;
    });
    n.material = originalIsArray ? tunedMats : tunedMats[0];
  });
}

function setModelOpacity(root, opacity) {
  root.traverse((n) => {
    if (!n.isMesh) return;
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    mats.forEach((mat) => {
      mat.transparent = true;
      mat.opacity = opacity;
    });
  });
}

function loadModel(url, tune = tuneMaterials) {
  return new Promise((res, rej) => gltfLoader.load(url, (g) => { tune(g.scene); res(g.scene); }, undefined, rej));
}

/* ============================================================
   Create models
   ============================================================ */
let baseModel = null;
let stoneModel = null;

const baseLoad = loadModel('/assets/base.glb')
  .then((base) => {
    baseModel = normalizeModel(base, { targetWidth: 2.95 });
    baseModel.scale.y *= 0.58;
    baseModel.position.set(0, -1.62, 0);
    stage.add(baseModel);
  })
  .catch(console.error);

const stoneLoad = loadModel('/assets/stone-web.glb', tuneStoneMaterials)
  .then((stone) => {
    stoneModel = normalizeModelCentered(stone, { targetHeight: 2.78 });
    stoneModel.position.set(0.02, 0.24, 0.34);
    stoneModel.rotation.z = -0.01;
    stage.add(stoneModel);
  })
  .catch(console.error);

Promise.allSettled([baseLoad, stoneLoad])
  .finally(() => {
    setupScrollAnimations();
  });

/* ============================================================
   SCROLL STATE — all values driven by GSAP scrub
   ============================================================ */
const S = {
  // camera
  camX: 0.18, camY: 0.46, camZ: 7.55, fov: 35,
  lookY: -0.2,
  // stage
  stgX: 1.15, stgY: -0.08, stgScale: 0.98,
  // stone
  stnX: 0.02, stnY: 0.24, stnZ: 0.34,
  stnRX: 0, stnRY: 0, stnRZ: -0.01,
  stnScale: 1,
  stnScaleX: 1,
  stnScaleY: 1,
  stoneOp: 1,
  // base / pedestal
  baseY: -1.62, baseOp: 1,
  // rings
  ringOp: 1, ringScale: 1,
  ring2Op: 0,
  // particles
  partOp: 0,
  // lighting
  exposure: 0.9,
  keyInt: 3.45, copperInt: 2.35,
};

/* ============================================================
   GSAP SCROLL ANIMATIONS
   ============================================================ */
function setupScrollAnimations() {

  /* ---------- 1. HERO TEXT — fade + slide up ---------- */
  const heroText = document.querySelector('[data-animate="hero-text"]');
  if (heroText) {
    gsap.to(heroText, {
      y: -140, opacity: 0,
      ease: 'power2.in',
      scrollTrigger: { trigger: '.section--hero', start: 'top top', end: '55% top', scrub: 1.2 },
    });
  }

  gsap.to('.nav', {
    opacity: 0, y: -30,
    ease: 'power2.in',
    scrollTrigger: { trigger: '.section--hero', start: 'top top', end: '35% top', scrub: 1 },
  });

  /* ---------- 2. ZOOM INTO STONE ---------- */
  // Camera rushes forward
  gsap.to(S, {
    camZ: 4.85, camY: 0.34, fov: 39, exposure: 0.82,
    stgX: 0.68, stgScale: 1.04,
    keyInt: 4.4, copperInt: 3.35,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '.section--zoom', start: 'top bottom', end: 'bottom bottom', scrub: 1.1 },
  });

  // Stone comes forward without becoming an abstract close-up.
  gsap.to(S, {
    stnScale: 1.72, stnZ: 0.92,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '.section--zoom', start: 'top bottom', end: 'bottom bottom', scrub: 1.1 },
  });

  // Base drops away gently but never vanishes into an empty black beat.
  gsap.to(S, {
    baseOp: 0.42, baseY: -2.05,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '.section--zoom', start: 'top bottom', end: '65% bottom', scrub: 1 },
  });

  /* ---------- 3. PROJECT 1 — stone moves to background upper-right ---------- */
  gsap.to(S, {
    camZ: 8.2, camY: 0.46, camX: 0.18, fov: 35,
    stgX: 0.12, stgScale: 1.0,
    stnScale: 0.82, stnY: 0.76, stnX: 1.58, stnZ: -0.45,
    ringScale: 0.72, ringOp: 0.62,
    baseOp: 0.22, baseY: -2.0,
    exposure: 0.82, keyInt: 3.45, copperInt: 2.35,
    ease: 'power3.inOut',
    scrollTrigger: { trigger: '.section--project', start: 'top bottom', end: 'top 18%', scrub: 1.15 },
  });

  // Project 1 text — staggered entrance
  const p1Text = document.querySelector('[data-animate="project1-text"]');
  if (p1Text) {
    gsap.fromTo([...p1Text.children], { y: 55, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.section--project', start: 'top 65%', end: 'top 18%', scrub: 1 },
    });
  }

  // Project 1 card — slide up
  const p1Card = document.querySelector('[data-animate="project1-card"]');
  if (p1Card) {
    gsap.fromTo(p1Card, { y: 180, opacity: 0, scale: 0.92 }, {
      y: 0, opacity: 1, scale: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.section--project', start: 'top 72%', end: 'top 18%', scrub: 1 },
    });
  }

  // Project 1 exit
  if (p1Text) {
    gsap.to(p1Text, {
      y: -90, opacity: 0,
      ease: 'power2.in',
      scrollTrigger: { trigger: '.section--project', start: 'bottom 90%', end: 'bottom 30%', scrub: 1 },
    });
  }
  if (p1Card) {
    gsap.to(p1Card, {
      y: -70, opacity: 0,
      ease: 'power2.in',
      scrollTrigger: { trigger: '.section--project', start: 'bottom 90%', end: 'bottom 30%', scrub: 1 },
    });
  }

  /* ---------- 4. HORIZONTAL SCROLL ---------- */
  const hSection = document.querySelector('.section--hscroll');
  const hTrack   = document.querySelector('.hscroll-track');
  if (hSection && hTrack) {
    const panels = gsap.utils.toArray('.hscroll-panel');
    const totalW = panels.length * window.innerWidth;

    gsap.set(hSection, { height: totalW });

    const hTween = gsap.to(hTrack, {
      x: () => -(totalW - window.innerWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: hSection,
        start: 'top top',
        end: () => `+=${totalW - window.innerWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Stone Y parallax during horizontal: dips then rises
    gsap.to(S, {
      keyframes: [
        { stnY: -0.18, duration: 0.45, ease: 'power2.inOut' },
        { stnY: 0.48, duration: 0.55, ease: 'power2.out' },
      ],
      scrollTrigger: {
        trigger: hSection,
        start: 'top top',
        end: () => `+=${totalW - window.innerWidth}`,
        scrub: 1.2,
      },
    });

    // Stone X drift — keep stone to the right
    gsap.to(S, {
      stnX: 1.34,
      stnScale: 0.8,
      stnZ: -0.22,
      stgX: 0.1,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: hSection,
        start: 'top top',
        end: () => `+=${totalW - window.innerWidth}`,
        scrub: 1.4,
      },
    });

    // Per-panel content animations
    panels.forEach((panel, i) => {
      if (i === 0) return; // first panel already visible
      const info = panel.querySelector('.hscroll-panel-info');
      const card = panel.querySelector('.hscroll-panel-card');

      if (info) {
        gsap.fromTo([...info.children], { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 75%', end: 'left 25%', scrub: 1 },
        });
      }
      if (card) {
        gsap.fromTo(card, { x: 120, opacity: 0 }, {
          x: 0, opacity: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 70%', end: 'left 20%', scrub: 1 },
        });
      }
    });
  }

  /* ---------- 5. FINAL SECTION — stone reorients, pedestal returns ---------- */
  const finalText = document.querySelector('[data-animate="final-text"]');
  if (finalText) {
    gsap.set([...finalText.children], { y: 70, opacity: 0 });
  }

  const aboutTimeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.section--final',
      start: 'center center',
      end: '+=150%',
      pin: true,
      scrub: 1,
    },
  });

  aboutTimeline
    .to(S, {
      camZ: 8.25,
      camY: 0.42,
      camX: 0.18,
      fov: 35,
      stgX: 2.08,
      stgScale: 0.94,
      stnScale: 0.8,
      stnScaleX: 0.48,
      stnScaleY: 1.05,
      stnY: 0.14,
      stnX: 0.38,
      stnZ: 0.04,
      stnRX: -0.24,
      stnRY: 0.32,
      stnRZ: -0.18,
      baseOp: 0.52,
      baseY: -1.78,
      ringScale: 0.9,
      ringOp: 0.58,
      ring2Op: 0.34,
      partOp: 0.28,
      exposure: 0.68,
      keyInt: 2.7,
      copperInt: 1.65,
      duration: 0.42,
      ease: 'sine.inOut',
    }, 0)
    .to(S, {
      stnScaleX: 1,
      stnScaleY: 1,
      stnScale: 0.9,
      stgX: 2.08,
      stnX: 0.28,
      stnRX: 0.06,
      stnRY: 0.16,
      stnRZ: -0.12,
      baseOp: 0.82,
      baseY: -1.62,
      ringOp: 0.82,
      ring2Op: 0.5,
      partOp: 0.48,
      exposure: 0.86,
      keyInt: 3.25,
      copperInt: 2.1,
      duration: 0.34,
      ease: 'sine.in',
    }, 0.42);

  if (finalText) {
    aboutTimeline.to([...finalText.children], {
      y: 0,
      opacity: 1,
      stagger: 0.08,
      duration: 0.2,
      ease: 'sine.out',
    }, 0.62);
  }

  aboutTimeline.to(S, {
    stoneOp: 0.56,
    stnScale: 0.88,
    stgX: 2.08,
    stnScaleX: 1,
    stnRX: 0.2,
    stnRY: -0.04,
    stnRZ: -0.04,
    stnX: 0.34,
    ringOp: 0.36,
    baseOp: 0.48,
    exposure: 0.78,
    duration: 0.24,
    ease: 'sine.inOut',
  }, 0.76);

  ScrollTrigger.refresh();
}

/* ============================================================
   POINTER
   ============================================================ */
const pointer = new THREE.Vector2(0, 0);
const smoothPointer = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth  - 0.5) * 2;
  pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ============================================================
   RESIZE
   ============================================================ */
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

/* ============================================================
   RENDER LOOP
   ============================================================ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  smoothPointer.lerp(pointer, 0.045);

  /* --- Camera --- */
  camera.position.set(S.camX, S.camY, S.camZ);
  camera.fov = S.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(S.camX * 0.3, S.lookY, 0);

  renderer.toneMappingExposure = S.exposure;

  /* --- Lights --- */
  keyLight.intensity   = S.keyInt;
  copperKick.intensity = S.copperInt;
  rimBackLight.intensity = 3.4 + Math.sin(t * 1.4) * 0.45;

  /* --- Stage --- */
  const mobile = window.innerWidth < 560;
  stage.scale.setScalar(mobile ? 1 : S.stgScale);
  stage.position.set(S.stgX, S.stgY, 0);
  stage.rotation.y = smoothPointer.x * 0.055;
  stage.rotation.x = -smoothPointer.y * 0.025;

  /* --- Primary ring --- */
  ring.rotation.z = t * 0.012;
  ring.scale.setScalar(S.ringScale);
  ringCore.material.color.lerpColors(softAmber, warmCopper, (Math.sin(t * 1.2) + 1) * 0.18);
  ringCore.material.opacity  = 0.88 * S.ringOp;
  ringHalo.material.opacity  = 0.42 * S.ringOp;
  ringGlows.forEach((g, i) => {
    g.material.opacity = ringGlowDefs[i].opacity * S.ringOp * (0.82 + (Math.sin(t * 1.2) + 1) * 0.12);
  });

  /* --- Second ring (tilted) --- */
  ring2.rotation.z = -t * 0.018;
  ring2Core.material.opacity = S.ring2Op * 0.7;
  ring2Glow.material.opacity = S.ring2Op * 0.15;

  /* --- Particles --- */
  particles.forEach((p) => {
    const a = t * p.speed + p.offset;
    const r = p.ringIdx === 0 ? 1.48 : 1.55;
    if (p.ringIdx === 0) {
      p.mesh.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    } else {
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      p.mesh.position.set(x * Math.cos(0.4) + y * Math.sin(0.6) * 0.3, y * Math.cos(0.6), -x * Math.sin(0.4));
    }
    p.mesh.material.opacity = S.partOp * (0.4 + Math.sin(t * 2 + p.offset) * 0.6);
  });

  /* --- Base rim --- */
  baseRimCore.material.opacity = (0.68 + (Math.sin(t * 1.1) + 1) * 0.05) * S.baseOp;
  baseRimGlow.material.opacity = (0.055 + (Math.sin(t * 1.1) + 1) * 0.012) * S.baseOp;
  baseTopGlow.material.opacity = 0.22 * S.baseOp;
  outerTrace.rotation.z = -t * 0.025;

  /* --- Stone --- */
  if (stoneModel) {
    stoneModel.position.set(S.stnX, S.stnY + Math.sin(t * 1.15) * 0.016, S.stnZ);
    stoneModel.rotation.set(
      S.stnRX + smoothPointer.y * 0.012,
      S.stnRY + STONE_FRONT_YAW + t * STONE_SPIN_SPEED + smoothPointer.x * 0.018 + Math.sin(t * 0.55) * 0.16,
      S.stnRZ,
    );
    stoneModel.scale.set(S.stnScale * S.stnScaleX * STONE_WIDTH_BOOST, S.stnScale * S.stnScaleY, S.stnScale);
    setModelOpacity(stoneModel, S.stoneOp);
  }

  /* --- Base model --- */
  if (baseModel) {
    baseModel.rotation.y = Math.sin(t * 0.35) * 0.015;
    baseModel.position.y = S.baseY;
    baseModel.traverse((n) => {
      if (n.isMesh) { n.material.transparent = true; n.material.opacity = S.baseOp; }
    });
  }

  floor.material.opacity = 0.5 * S.baseOp;

  renderer.render(scene, camera);
}

animate();
