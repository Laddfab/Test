import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }   from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }    from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

const pane = document.getElementById("three-pane");
const q = new URLSearchParams(location.search);
const MODEL = q.get("model") || "assets/rhino.obj"; // cambia aquí o usa ?model=assets/Test1.glb

// Escena y cámara
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(2.5, 2, 4);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace; // r161
pane.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// Límites de zoom (ajusta a gusto)
controls.minDistance = 0.05;
controls.maxDistance = 500;
controls.zoomSpeed   = 1.0;

// Luces
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3,5,2);
scene.add(dir);

// Loaders
const gltfLoader = new GLTFLoader();
const objLoader  = new OBJLoader();

// Carga del modelo
loadModel(MODEL).catch(err => {
  console.warn("Fallo al cargar modelo:", err);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshNormalMaterial());
  scene.add(box); addOutline(box); frameObject(box, 1.1);
});

function loadModel(pathStr){
  return new Promise((resolve, reject) => {
    const ext = pathStr.split(".").pop().toLowerCase();
    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(pathStr, (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        model.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.6, metalness:0 }); });
        addOutline(model);
        frameObject(model, 1.12); // fitOffset más cerca (1.1–1.2)
        resolve();
      }, undefined, reject);
    } else if (ext === "obj") {
      const parts = pathStr.split("/"); const file = parts.pop(); const dir  = parts.length ? parts.join("/") + "/" : "";
      objLoader.setPath(dir).load(file, (obj) => {
        obj.traverse(o => { if (o.isMesh) o.material = new THREE.MeshNormalMaterial(); });
        scene.add(obj);
        addOutline(obj);
        frameObject(obj, 1.5);
        resolve();
      }, undefined, reject);
    } else {
      reject(new Error("Extensión no soportada: " + ext));
    }
  });
}

// Contorno (wire suave) – no copiar transforms al hijo
function addOutline(target){
  const edgesColor = new THREE.Color(0xdddddd);
  target.traverse(o => {
    if (o.isMesh && o.geometry) {
      const geo = new THREE.EdgesGeometry(o.geometry, 60);
      const mat = new THREE.LineBasicMaterial({ color: edgesColor });
      const lines = new THREE.LineSegments(geo, mat);
      o.add(lines);
    }
  });
}

// Enmarca el objeto usando FOV + aspect (más preciso) y margen fitOffset
function frameObject(obj, fitOffset = 1.15){
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fitHeightDistance = (size.y / 2) / Math.tan(fov / 2);
  const fitWidthDistance  = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect);
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

  const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, distance / 100);
  camera.far  = Math.max(100,  distance * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

// Resize al tamaño de su columna (sticky 100vh en desktop)
const ro = new ResizeObserver(entries => {
  for (const entry of entries) {
    const w = Math.max(1, entry.contentRect.width);
    const h = Math.max(1, entry.contentRect.height);
    renderer.setSize(w, h, true);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
});
ro.observe(pane);

// Bucle
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
