import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }   from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }    from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

const pane = document.getElementById("three-pane");

/* =========================
   Modelo configurable:
   - Default: assets/rhino.obj
   - URL: ?model=assets/Test1.glb  o  ?model=assets/otro.obj
========================= */
const q = new URLSearchParams(location.search);
const MODEL = q.get("model") || "assets/rhino.obj";

/* =========================
   Escena / cámara / renderer
========================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(2.5, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);
pane.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* =========================
   Luces suaves
========================= */
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3,5,2);
scene.add(dir);

/* =========================
   Carga (OBJ / GLB)
========================= */
const gltfLoader = new GLTFLoader();
const objLoader  = new OBJLoader();

loadModel(MODEL).catch(err => {
  console.warn("Fallo al cargar modelo:", err);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshNormalMaterial());
  scene.add(box);
  addOutline(box);
  frameObject(box);
});

function loadModel(pathStr){
  return new Promise((resolve, reject) => {
    const ext = pathStr.split(".").pop().toLowerCase();

    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(
        pathStr,
        (gltf) => {
          const model = gltf.scene;
          scene.add(model);
          // Blanco mate (cambia a MeshNormalMaterial si prefieres)
          model.traverse(o => {
            if (o.isMesh) {
              o.material = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.6, metalness:0 });
            }
          });
          addOutline(model);
          frameObject(model);
          resolve();
        },
        undefined,
        (e) => reject(e)
      );
    } else if (ext === "obj") {
      const parts = pathStr.split("/");
      const file = parts.pop();
      const dir  = parts.length ? parts.join("/") + "/" : "";
      objLoader.setPath(dir);
      objLoader.load(
        file,
        (obj) => {
          // Por defecto, visible siempre:
          obj.traverse(o => { if (o.isMesh) o.material = new THREE.MeshNormalMaterial(); });
          scene.add(obj);
          addOutline(obj);
          frameObject(obj);
          resolve();
        },
        undefined,
        (e) => reject(e)
      );
    } else {
      reject(new Error("Extensión no soportada: " + ext));
    }
  });
}

/* =========================
   Utilidades: contorno + encuadre
========================= */
function addOutline(target){
  const edgesColor = new THREE.Color(0xdddddd);
  target.traverse(o => {
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

  const maxDim   = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim * 1.6;
  const dirVec   = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, maxDim/100);
  camera.far  = Math.max(100,   maxDim*10);
  camera.updateProjectionMatrix();
  controls.update();
}

/* =========================
   Resize robusto al panel derecho
========================= */
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

/* =========================
   Loop
========================= */
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

