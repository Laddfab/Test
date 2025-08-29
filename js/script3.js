// Escena, cámara, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(2.5, 2, 4); // alejamos un poco

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

// Controles (usa THREE global)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Ejes de referencia (debug visual)
const axes = new THREE.AxesHelper(2);
scene.add(axes);

// Geometría y material que NO requiere luces
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x62b6de, wireframe: false });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// (Opcional) agrega luces si luego usas MeshStandard/Phong
// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(3, 5, 2);
// scene.add(light);

// Animación
function animate() {
  requestAnimationFrame(animate);

  // rotación suave para verificar que “vive”
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
