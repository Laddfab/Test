import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }  from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

const pane = document.getElementById("three-pane");

/* =========================
   CONFIG RÁPIDA
   - Cambia aquí tu archivo por defecto
   - O pásalo en la URL: ?model=assets/LoQueSea.glb
   Ej: https://.../index.html?model=assets/Test1.glb
========================= */
const params = new URLSearchParams(location.search);
const MODEL_PATH = params.get("model") || "../assets/rhino1.glb";

/* =========================
   Escena / cámara / renderer
========================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(2.5, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setClearColor(0xffffff, 1); // fondo BLANCO
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
pane.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

/* =========================
   Luces y referencia
========================= */
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3, 5, 2);
scene.add(dir);

// suelo sutil para referencia
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.001;
scene.add(floor);

/* =========================
   Carga de modelo (GLB u OBJ)
========================= */
const gltfLoader = new GLTFLoader();
const objLoader  = new OBJLoader();

// despacha según extensión
const ext = MODEL_PATH.split(".").pop().toLowerCase();

if (ext === "glb" || ext === "gltf") {
  loadGLB(MODEL_PATH).catch(showPlaceholder);
} else if (ext === "obj") {
  loadOBJ(MODEL_PATH).catch(showPlaceholder);
} else {
  console.warn("Extensión no reconocida:", ext, "— usando placeholder.");
  showPlaceholder();
}

function loadGLB(path) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Fuerza material BLANCO para todo el modelo
        model.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.6,
              metalness: 0
            });
            o.castShadow = false;
            o.receiveShadow = false;
          }
        });

        addOutline(model);
        frameObject(model);
        resolve();
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function loadOBJ(path) {
  return new Promise((resolve, reject) => {
    objLoader.load(
      path,
      (obj) => {
        // Material blanco sencillo para todo el OBJ
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.6,
              metalness: 0
            });
          }
        });
        scene.add(obj);
        addOutline(obj);
        frameObject(obj);
        resolve();
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/* =========================
   Utilidades: contorno + encuadre
========================= */
function addOutline(target) {
  const edgesColor = new THREE.Color(0xdddddd);
  target.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const geo = new THREE.EdgesGeometry(o.geometry, 60);
      const mat = new THREE.LineBasicMaterial({ color: edgesColor });
      const lines = new THREE.LineSegments(geo, mat);
      lines.position.copy(o.position);
      lines.rotation.copy(o.rotation);
      lines.scale.copy(o.scale);
      o.add(lines);
    }
  });
}

function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const sizeVec = box.getSize(new THREE.Vector3());
  const size = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  const distance = size * 1.6; // un poco más de aire
  const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, size / 100);
  camera.far  = Math.max(100, size * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

/* =========================
   Resize robusto (evita “recortes”)
========================= */
const ro = new ResizeObserver(entries => {
  for (const entry of entries) {
    const cr = entry.contentRect;
    const w = Math.max(1, cr.width);
    const h = Math.max(1, cr.height);
    renderer.setSize(w, h, true);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
});
ro.observe(pane);

/* =========================
   Loop
========================= */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
