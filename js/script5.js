// js/script5.js (versión depurada)
import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }   from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }    from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

const pane = document.getElementById("three-pane");
const q = new URLSearchParams(location.search);
const MODEL = q.get("model") || "assets/rhino.obj"; // ?model=assets/Test1.glb

// ======= CONFIG =======
const BACKGROUND_COLOR = "#d60000";
const FOG_ON    = true;
const FOG_TYPE  = "linear";       // "linear" | "exp"
const FOG_LINEAR = { near: 8,  far: 55 };
const FOG_EXP    = { density: 0.03 };
const ENABLE_SHADOWS = true;
// ======================

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND_COLOR);

// Fog (usar número en vez de Color para máxima compatibilidad)
function applyFog() {
  if (!FOG_ON) { scene.fog = null; return; }
  const bgHex = scene.background instanceof THREE.Color ? scene.background.getHex() : 0x000000;
  if (FOG_TYPE === "exp") {
    scene.fog = new THREE.FogExp2(bgHex, FOG_EXP.density);
  } else {
    scene.fog = new THREE.Fog(bgHex, FOG_LINEAR.near, FOG_LINEAR.far);
  }
}
applyFog();

// Cámara
const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
camera.position.set(2.5, 2, 1);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; // r161
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = ENABLE_SHADOWS;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
pane.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.05;
controls.maxDistance = 500;
controls.zoomSpeed   = 1.0;

// Luces
const hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.8);
hemi.position.set(0, 20, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xf
