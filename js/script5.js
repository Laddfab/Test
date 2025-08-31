// js/script5.js
import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";
import { RGBELoader } from "../lib/three.js-r161/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "../lib/three.js-r161/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../lib/three.js-r161/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../lib/three.js-r161/jsm/postprocessing/UnrealBloomPass.js";

// ==== CONFIG ====
// NOTA: FOG_TYPE puede ser "linear" | "exp" | "none"
var FOG_TYPE = "linear";
var ENABLE_SHADOWS = true;
var FOG_ON = true;
var FOG_LINEAR = { near: 8, far: 55 };
var FOG_EXP = { density: 0.03 };
var AUTO_ROTATION = true;
var ROTATION_SPEED = 0.005;

// ===== VALORES INICIALES (EDITAR AQUÍ) =====
// NOTA: EXPOSURE INICIAL
var INITIAL_EXPOSURE = 0.6;
// NOTA: BLOOM INICIAL
var INITIAL_BLOOM_STRENGTH = 0.12;
// NOTA: COLOR DE FONDO INICIAL
var INITIAL_BACKGROUND = "#ffffff";
// NOTA: INTENSIDAD DE LUZ DIRECCIONAL INICIAL
var INITIAL_DIR_LIGHT_INTENSITY = 0.1;
// ===========================================

var pane = document.getElementById("three-pane");
var q = new URLSearchParams(location.search);
var MODEL = q.get("model") || "assets/rhino.obj";

var scene = new THREE.Scene();
scene.background = new THREE.Color(INITIAL_BACKGROUND);

// Fog
function applyFog() {
  if (!FOG_ON || FOG_TYPE === "none") {
    scene.fog = null;
    return;
  }
  var bgHex = scene.background instanceof THREE.Color ? scene.background.getHex() : 0x000000;
  if (FOG_TYPE === "exp") {
    scene.fog = new THREE.FogExp2(bgHex, FOG_EXP.density);
  } else {
    scene.fog = new THREE.Fog(bgHex, FOG_LINEAR.near, FOG_LINEAR.far);
  }
}
applyFog();

// Camera
var camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
camera.position.set(2.5, 2, 1);

// Renderer
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// APLICA EXPOSURE INICIAL (EDITAR ARRIBA)
renderer.toneMappingExposure = INITIAL_EXPOSURE;

renderer.shadowMap.enabled = ENABLE_SHADOWS;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
pane.appendChild(renderer.domElement);

// Postprocessing (Bloom)
var composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
var bloomPass = new UnrealBloomPass(
  new THREE.Vector2(1, 1),
  // APLICA BLOOM INICIAL (EDITAR ARRIBA)
  INITIAL_BLOOM_STRENGTH, // strength
  0.2, // radius
  0.9  // threshold
);
composer.addPass(bloomPass);

// Controls
var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = AUTO_ROTATION;
controls.autoRotateSpeed = ROTATION_SPEED * 60;
controls.minDistance = 0.05;
controls.maxDistance = 500;

// Lights
var hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.8);
hemi.position.set(0, 20, 0);
scene.add(hemi);

var dir = new THREE.DirectionalLight(0xffffff, INITIAL_DIR_LIGHT_INTENSITY); // APLICA DIR LIGHT INICIAL (EDITAR ARRIBA)
dir.position.set(6, 10, 6);
dir.castShadow = ENABLE_SHADOWS;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.left = -20;
dir.shadow.camera.right = 20;
dir.shadow.camera.top = 20;
dir.shadow.camera.bottom = -20;
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 80;
scene.add(dir);

// Ground (shadow catcher)
var ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = ENABLE_SHADOWS;
scene.add(ground);

// HDRI
var rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "assets/venice_sunset_4k.hdr",
  function (hdr) {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr;
  },
  undefined,
  function (err) {
    console.warn("HDRI no cargado:", err);
  }
);

// Loaders
var gltfLoader = new GLTFLoader();
var objLoader = new OBJLoader();

loadModel(MODEL).catch(function (err) {
  console.warn("Modelo no cargado:", err);
  var box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.05 })
  );
  box.castShadow = ENABLE_SHADOWS;
  scene.add(box);
  addOutline(box);
  frameObject(box, 1.15);
  repositionGroundToModel(box);
});

function loadModel(path) {
  return new Promise(function (resolve, reject) {
    var ext = path.split(".").pop().toLowerCase();
    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(
        path,
        function (gltf) {
          var model = gltf.scene;
          scene.add(model);
          enableModelShadows(model);
          addOutline(model);
          frameObject(model, 1.15);
          repositionGroundToModel(model);
          resolve();
        },
        undefined,
        function (e) {
          reject(e);
        }
      );
      return;
    }
    if (ext === "obj") {
      var base = path.substring(0, path.lastIndexOf("/") + 1);
      var file = path.split("/").pop();
      objLoader.setPath(base).load(
        file,
        function (obj) {
          obj.traverse(function (o) {
            if (o && o.isMesh) {
              o.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.05 });
              o.castShadow = ENABLE_SHADOWS;
              o.receiveShadow = ENABLE_SHADOWS;
            }
          });
          scene.add(obj);
          addOutline(obj);
          frameObject(obj, 1.12);
          repositionGroundToModel(obj);
          resolve();
        },
        undefined,
        function (e) {
          reject(e);
        }
      );
      return;
    }
    reject(new Error("Formato no soportado: " + ext));
  });
}

function enableModelShadows(root) {
  root.traverse(function (o) {
    if (o && o.isMesh) {
      o.castShadow = ENABLE_SHADOWS;
      o.receiveShadow = ENABLE_SHADOWS;
      if (o.material && o.material.map) {
        o.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });
}

function addOutline(target) {
  var color = new THREE.Color(0xdddddd);
  target.traverse(function (o) {
    if (o && o.isMesh && o.geometry) {
      var edges = new THREE.EdgesGeometry(o.geometry, 60);
      var lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));
      lines.renderOrder = 2;
      o.add(lines);
    }
  });
}

function frameObject(obj, offset) {
  if (offset == null) offset = 1.15;
  var box = new THREE.Box3().setFromObject(obj);
  var size = box.getSize(new THREE.Vector3());
  var center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);

  var fov = THREE.MathUtils.degToRad(camera.fov);
  var distY = (size.y / 2) / Math.tan(fov / 2);
  var distX = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect);
  var distance = offset * Math.max(distY, distX);

  var dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, distance / 100);
  camera.far = Math.max(150, distance * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

function repositionGroundToModel(obj) {
  var minY = new THREE.Box3().setFromObject(obj).min.y;
  ground.position.y = minY - 0.001;
}

// ===== Resize =====
function resizeToPane() {
  var rect = pane.getBoundingClientRect();
  var w = Math.max(1, Math.floor(rect.width));
  var h = Math.max(1, Math.floor(rect.height));
  renderer.setSize(w, h, true);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeToPane();

var ro = new ResizeObserver(function () {
  resizeToPane();
});
ro.observe(pane);

// ===== Loop =====
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

// ===== GUI =====
try {
  var gui = new lil.GUI();
  var bgStyle = scene.background instanceof THREE.Color ? scene.background.getStyle() : INITIAL_BACKGROUND;

  var params = {
    // Estos valores iniciales coinciden con los que aplicamos arriba
    exposure: INITIAL_EXPOSURE,
    bloomStrength: INITIAL_BLOOM_STRENGTH,
    directionalLight: INITIAL_DIR_LIGHT_INTENSITY,
    background: bgStyle,
    fogType: FOG_TYPE
  };

  gui.add(params, "exposure", 0.1, 2).name("Exposure").onChange(function (v) {
    renderer.toneMappingExposure = v;
  });
  gui.add(params, "bloomStrength", 0, 2).name("Bloom").onChange(function (v) {
    bloomPass.strength = v;
  });
  gui.add(params, "directionalLight", 0, 2).name("Dir Light").onChange(function (v) {
    dir.intensity = v;
  });
  gui.addColor(params, "background").name("Fondo").onChange(function (v) {
    scene.background = new THREE.Color(v);
    applyFog();
  });
  gui.add(params, "fogType", ["none", "linear", "exp"]).name("Fog").onChange(function (v) {
    FOG_TYPE = v;
    applyFog();
  });
} catch (e) {
  console.warn("lil-gui no disponible:", e);
}
