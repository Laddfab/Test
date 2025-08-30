import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";

const pane = document.getElementById("three-pane");

// --- Escena / cámara / renderer ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(2.5, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setClearColor(0xffffff, 1); // fondo BLANCO
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
pane.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luces suaves
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3, 5, 2);
scene.add(dir);

// Suelo muy tenue para referencia (blanco sobre blanco)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.001;
scene.add(floor);

// --- Carga del modelo (tu archivo) ---
const loader = new GLTFLoader();
const MODEL_PATH = "../assets/test5.glb"; // <-- tu ruta y nombre

loadModel(MODEL_PATH).catch(() => {
  // Placeholder si no se encuentra el modelo
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 })
  );
  box.position.y = 0.5;
  scene.add(box);
  addOutline(box);
  frameObject(box);
});

function loadModel(path) {
  return new Promise((resolve, reject) => {
    loader.load(
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

        addOutline(model);  // contorno tenue para distinguir sobre blanco
        frameObject(model); // centra y encuadra
        resolve();
      },
      undefined,
      (err) => reject(err)
    );
  });
}

// Contorno gris claro
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

// Encuadra la cámara al objeto
function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const sizeVec = box.getSize(new THREE.Vector3());
  const size = sizeVec.length();
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  const distance = size * 1.5;
  const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, size / 100);
  camera.far = Math.max(100, size * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

// Ajuste al tamaño del panel izquierdo
function resizeToPane() {
  const w = pane.clientWidth || 1;
  const h = pane.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeToPane();
window.addEventListener("resize", resizeToPane);

// Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

