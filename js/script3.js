// Escena, cámara, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x202124, 1); // gris medio (visible)
document.body.appendChild(renderer.domElement);

// Controles
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Ayudas (más brillantes)
scene.add(new THREE.AxesHelper(3));
const grid = new THREE.GridHelper(20, 20, 0x88bfd7, 0x334455);
grid.position.y = -1.5;
scene.add(grid);

// Geometría principal
const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);

// MATERIAL 1: visible sin luces (por defecto)
let materialNormal = new THREE.MeshNormalMaterial({ wireframe:false });

// MATERIAL 2: con luces (actívalo con tecla L)
let materialLit = new THREE.MeshStandardMaterial({ color:0x62b6de, metalness:0.2, roughness:0.4 });

// Malla
const cube = new THREE.Mesh(geometry, materialNormal);
scene.add(cube);

// Luces (apagadas inicialmente, solo para materialLit)
const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 1.1);
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(3, 5, 2);
let lightsOn = false;

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
addEventListener("resize", () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Atajos de teclado
addEventListener("keydown", (e) => {
  if (e.key === "w" || e.key === "W") {
    materialNormal.wireframe = !materialNormal.wireframe;
    materialLit.wireframe = materialNormal.wireframe;
  }
  if (e.key === "b" || e.key === "B") {
    const bg = renderer.getClearColor(new THREE.Color());
    const isDark = bg.getHex() === 0x202124;
    renderer.setClearColor(isDark ? 0xffffff : 0x202124, 1); // blanco <-> gris oscuro
  }
  if (e.key === "l" || e.key === "L") {
    // Alterna entre material sin luces y con luces
    const usingNormal = cube.material === materialNormal;
    cube.material = usingNormal ? materialLit : materialNormal;

    // Enciende/apaga luces según material
    if (usingNormal && !lightsOn) {
      scene.add(hemi, dir);
      lightsOn = true;
    } else if (!usingNormal && lightsOn) {
      scene.remove(hemi, dir);
      lightsOn = false;
    }
  }
  if (e.key === "r" || e.key === "R") {
    camera.position.set(3, 2, 5);
    controls.target.set(0, 0, 0);
    controls.update();
  }
});

// Doble clic: fullscreen
addEventListener("dblclick", () => {
  const el = renderer.domElement;
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Log mínimo para confirmar carga
console.log("Three.js:", THREE.REVISION, "Canvas size:", renderer.domElement.width, "x", renderer.domElement.height);
