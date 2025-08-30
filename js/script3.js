// Importar Three.js desde el importmap definido en index.html
import * as THREE from "three";
// Importar OrbitControls desde la carpeta jsm local
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";

// Crear escena
const scene = new THREE.Scene();

// Cámara
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(2.5, 2, 4);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x202124, 1); // fondo gris oscuro
document.body.appendChild(renderer.domElement);

// Controles de cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Un cubo con colores por normales (no necesita luces)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshNormalMaterial()
);
scene.add(cube);

// Ayuda visual
scene.add(new THREE.AxesHelper(2));

// Animación
function animate() {
  requestAnimationFrame(animate);

  // rotación automática
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.02;

  // actualizar controles
  controls.update();

  // renderizar
  renderer.render(scene, camera);
}
animate();

// Ajustar al cambiar tamaño de ventana
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


