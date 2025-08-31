import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";
import { RGBELoader } from "../lib/three.js-r161/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "../lib/three.js-r161/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../lib/three.js-r161/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../lib/three.js-r161/jsm/postprocessing/UnrealBloomPass.js";

// ==== CONFIG ====
let FOG_TYPE = "linear";          // 'linear' | 'exp' | 'none' (se cambia desde GUI)
const BACKGROUND_COLOR = "#d60000";
const ENABLE_SHADOWS = true;
const FOG_ON = true;
const FOG_LINEAR = { near: 8, far: 55 };
const FOG_EXP = { density: 0.03 };
const AUTO_ROTATION = true;
const ROTATION_SPEED = 0.005;

// ==== INIT ====
const pane = document.getElementById("three-pane");
const q = new URLSearchParams(location.search);
const MODEL = q.get("model") || "assets/rhino.obj";

const scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND_COLOR);

// Fog
function applyFog() {
  const bgHex = scene.background?.getHex?.() ?? 0x000000;
  if (!FOG_ON || FOG_TYPE === "none") { scene.fog = null; return; }
  scene.fog = (FOG_TYPE === "exp")
    ? new THREE.FogExp2(bgHex, FOG_EXP.density)
    : new THREE.Fog(bgHex, FOG_LINEAR.near, FOG_LINEAR.far);
}
applyFog();

// Camera
const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
camera.position.set(2.5, 2, 1);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6; // <- bajado para menos brillo inicial
renderer.shadowMap.enabled = ENABLE_SHADOWS;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
pane.appendChild(renderer.domElement);

// Postprocessing (Bloom)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3, // strength más bajo
  0.2, // radius
  0.9  // threshold
);
composer.addPass(bloomPass);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = AUTO_ROTATION;
controls.autoRotateSpeed = ROTATION_SPEED * 60;
controls.minDistance = 0.05;
controls.maxDistance = 500;

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.8);
hemi.position.set(0, 20, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(6, 10, 6);
dir.castShadow = ENABLE_SHADOWS;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.left = -20;
dir.shadow.camera.right = 20;
dir.shadow.camera.top = 20;
dir.shadow.camera.bottom = -20;
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 80;
scene.add(dir);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = ENABLE_SHADOWS;
scene.add(ground);

// HDRI
new RGBELoader().load("assets/venice_sunset_4k.hdr", (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr;
});

// Loaders
const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

loadModel(MODEL).catch((err) => {
  console.warn("Modelo no cargado:", err);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.05 })
  );
  box.castShadow = ENABLE_SHADOWS;
  scene.add(box);
  addOutline(box);
  frameObject(box, 1.15);
  repositionGroundToModel(box);
});

function loadModel(path) {
  return new Promise((resolve, reject) => {
    const ext = path.split('.').pop().toLowerCase();
    if (["glb", "gltf"].includes(ext)) {
      gltfLoader.load(path, (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        enableModelShadows(model);
        addOutline(model);
        frameObject(model, 1.15);
        repositionGroundToModel(model);
        resolve();
      }, undefined, reject);
    } else if (ext === "obj") {
      const base = path.substring(0, path.lastIndexOf("/") + 1);
      const file = path.split("/").pop();
      objLoader.setPath(base).load(file, (obj) => {
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.05 });
            o.castShadow = o.receiveShadow = ENABLE_SHADOWS;
          }
        });
        scene.add(obj);
        addOutline(obj);
        frameObject(obj, 1.12);
        repositionGroundToModel(obj);
        resolve();
      }, undefined, reject);
    } else {
      reject(new Error("Formato no soportado: " + ext));
    }
  });
}

function enableModelShadows(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = ENABLE_SHADOWS;
      if (o.material?.map) {
        o.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });
}

function addOutline(target) {
  const color = new THREE.Color(0xdddddd);
  target.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const edges = new THREE.EdgesGeometry(o.geometry, 60);
      const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
      lines.renderOrder = 2;
      o.add(lines);
    }
  });
}

function frameObject(obj, offset = 1.15) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distY = (size.y / 2) / Math.tan(fov / 2);
  const distX = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect);
  const distance = offset * Math.max(distY, distX);

  const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, distance / 100);
  camera.far  = Math.max(150, distance * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

function repositionGroundToModel(obj) {
  const minY = new THREE.Box3().setFromObject(obj).min.y;
  ground.position.y = minY - 0.001;
}

// Resize al contenedor sticky
const ro = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  renderer.setSize(width, height);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
ro.observe(pane);

// Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

// ==== GUI ====
const gui = new lil.GUI();
const params = {
  exposure: renderer.toneMappingExposure,
  bloomStrength: bloomPass.strength,
  directionalLight: dir.intensity,
  background: scene.background.getStyle?.() ?? BACKGROUND_COLOR,
  fogType: FOG_TYPE
};

gui.add(params, 'exposure', 0.1, 2).name('Exposure').onChange(v => renderer.toneMappingExposure = v);
gui.add(params, 'bloomStrength', 0, 2).name('Bloom').onChange(v => bloomPass.strength = v);
gui.add(params, 'directionalLight', 0, 2).name('Dir Light').onChange(v => dir.intensity = v);
gui.addColor(params, 'background').name('Fondo').onChange(v => { scene.background = new THREE.Color(v); applyFog(); });
gui.add(params, 'fogType', ['none', 'linear', 'exp']).name('Fog').onChange(v => { FOG_TYPE = v; applyFog(); });
