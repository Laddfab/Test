import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }   from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }    from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

const pane = document.getElementById("three-pane");
const q = new URLSearchParams(location.search);
const MODEL = q.get("model") || "assets/rhino.obj"; // cambia aquí o usa ?model=assets/Test1.glb

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(2.5, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace; // r161
pane.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3,5,2);
scene.add(dir);

const gltfLoader = new GLTFLoader();
const objLoader  = new OBJLoader();

loadModel(MODEL).catch(err => {
  console.warn("Fallo al cargar modelo:", err);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshNormalMaterial());
  scene.add(box); addOutline(box); frameObject(box);
});

function loadModel(pathStr){
  return new Promise((resolve, reject) => {
    const ext = pathStr.split(".").pop().toLowerCase();
    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(pathStr, (gltf) => {
        const model = gltf.scene; scene.add(model);
        model.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.6, metalness:0 }); });
        addOutline(model); frameObject(model); resolve();
      }, undefined, reject);
    } else if (ext === "obj") {
      const parts = pathStr.split("/"); const file = parts.pop(); const dir  = parts.length ? parts.join("/") + "/" : "";
      objLoader.setPath(dir).load(file, (obj) => {
        obj.traverse(o => { if (o.isMesh) o.material = new THREE.MeshNormalMaterial(); });
        scene.add(obj); addOutline(obj); frameObject(obj); resolve();
      }, undefined, reject);
    } else reject(new Error("Extensión no soportada: " + ext));
  });
}

// Fix: no copiar transforms al añadir el contorno (el hijo hereda las del padre)
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

function frameObject(obj){
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim * 1.6;
  const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));
  camera.near = Math.max(0.01, maxDim/100);
  camera.far  = Math.max(100,  maxDim*10);
  camera.updateProjectionMatrix();
  controls.update();
}

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

function animate(){ requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();
