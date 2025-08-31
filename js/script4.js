import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { OBJLoader }  from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

// === Escena básica pantalla completa ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(2.5, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0xffffff, 1); // fondo blanco
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luces suaves
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3, 5, 2);
scene.add(dir);

// === Cargar tu OBJ ===
const OBJ_PATH = "../assets/rhino.obj"; // ajusta si tu ruta/nombre cambia
const loader = new OBJLoader();

loader.load(
  OBJ_PATH,
  (obj) => {
    // Material visible siempre (normales) — si prefieres blanco mate, cambia abajo
    obj.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshNormalMaterial();
      }
    });
    scene.add(obj);
    addOutline(obj);
    frameObject(obj);
  },
  undefined,
  (err) => {
    console.error("Error cargando OBJ:", err);
    const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshNormalMaterial());
    scene.add(box);
    frameObject(box);
  }
);

// — Utilidades —
function addOutline(target){
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

function frameObject(obj){
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim * 1.6;
  const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, maxDim / 100);
  camera.far  = Math.max(100,   maxDim * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

// Resize
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Loop
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* Si prefieres el modelo BLANCO mate:
   - Reemplaza MeshNormalMaterial por:
     o.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 });
*/
