// js/script5.js
import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }   from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }    from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

const pane = document.getElementById("three-pane");
const q = new URLSearchParams(location.search);
const MODEL = q.get("model") || "assets/rhino.obj"; // ?model=assets/Test1.glb

// ======= CONFIG RÁPIDA =======
const BACKGROUND_COLOR = '#d60000'; // cambia el color del fondo
const FOG_ON    = true;             // activar/desactivar fog
const FOG_TYPE  = 'linear';         // 'linear' | 'exp'
const FOG_LINEAR = { near: 8,  far: 55 };
const FOG_EXP    = { density: 0.03 };
const ENABLE_SHADOWS = true;
// =============================

// Escena y cámara
const scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND_COLOR);
applyFog();

const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
camera.position.set(2.5, 2, 1);  // posición inicial

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias:true });
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

const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(6, 10, 6);
dir.castShadow = ENABLE_SHADOWS;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 80;
dir.shadow.camera.left = -20;
dir.shadow.camera.right = 20;
dir.shadow.camera.top = 20;
dir.shadow.camera.bottom = -20;
scene.add(dir);

// Suelo receptor de sombras (shadow catcher)
const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0; // se re-ubica bajo el modelo al cargar
ground.receiveShadow = ENABLE_SHADOWS;
scene.add(ground);

// Loaders
const gltfLoader = new GLTFLoader();
const objLoader  = new OBJLoader();

// Carga del modelo
loadModel(MODEL).catch(err => {
  console.warn("Fallo al cargar modelo:", err);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color:0xcccccc, roughness:0.6, metalness:0.05 })
  );
  box.castShadow = ENABLE_SHADOWS;
  box.receiveShadow = false;
  scene.add(box); addOutline(box); frameObject(box, 1.15);
  repositionGroundToModel(box);
});

function loadModel(pathStr){
  return new Promise((resolve, reject) => {
    const ext = pathStr.split(".").pop().toLowerCase();

    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(pathStr, (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        enableModelShadows(model);
        addOutline(model);
        frameObject(model, 1.15); // más cerca = 1.1–1.2
        repositionGroundToModel(model);
        resolve();
      }, undefined, reject);

    } else if (ext === "obj") {
      const parts = pathStr.split("/");
      const file = parts.pop();
      const dir  = parts.length ? parts.join("/") + "/" : "";
      objLoader.setPath(dir).load(file, (obj) => {
        // Para OBJ usamos un material PBR para que exista sombra/luz realista
        obj.traverse(o => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({
              color: 0xffffff, roughness: 0.6, metalness: 0.05
            });
          }
        });
        scene.add(obj);
        enableModelShadows(obj);
        addOutline(obj);
        frameObject(obj, 1.12);
        repositionGroundToModel(obj);
        resolve();
      }, undefined, reject);

    } else {
      reject(new Error("Extensión no soportada: " + ext));
    }
  });
}

// Sombras en todo el árbol
function enableModelShadows(root){
  root.traverse?.((o) => {
    if (o.isMesh) {
      o.castShadow = ENABLE_SHADOWS;
      o.receiveShadow = ENABLE_SHADOWS;
      if (o.material && o.material.map) {
        o.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });
}

// Contorno (wire suave)
function addOutline(target){
  const edgesColor = new THREE.Color(0xdddddd);
  target.traverse(o => {
    if (o.isMesh && o.geometry) {
      const geo = new THREE.EdgesGeometry(o.geometry, 60);
      const mat = new THREE.LineBasicMaterial({ color: edgesColor });
      const lines = new THREE.LineSegments(geo, ma

