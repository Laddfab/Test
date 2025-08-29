// Verifica que este archivo cargó
console.log("✅ script3.js cargado");

// Manejo de errores en tiempo real (si algo falla, lo verás en consola)
window.addEventListener("error", (e) => {
  console.error("🛑 Error global:", e.message);
});

// Escena, cámara, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2.5, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

// Controles (global: THREE.OrbitControls)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Ayudas visuales
scene.add(new THREE.AxesHelper(2));
const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
grid.position.y = -1;
scene.add(grid);

// Cubo visible sin luces (MeshBasicMaterial NO requiere luz)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x62b6de })
);
scene.add(cube);

// Animación
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.015;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Fullscreen con doble clic
window.addEventListener("dblclick", () => {
  const el = renderer.domElement;
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
});
