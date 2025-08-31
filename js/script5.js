// js/script5.js (versión compat: sin optional chaining y sintaxis conservadora)
import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }   from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }    from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";

console.log("[script5] start");

var pane = document.getElementById("three-pane");
var q = new URLSearchParams(location.search);
var MODEL = q.get("model") || "assets/rhino.obj";

// ======= CONFIG =======
var BACKGROUND_COLOR = "#d60000";
var FOG_ON = true;
var FOG_TYPE = "linear"; // "linear" | "exp"
var FOG_LINEAR = { near: 8, far: 55 };
var FOG_EXP = { density: 0.03 };
var ENABLE_SHADOWS = true;
// ======================

// Escena
var scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND_COLOR);

// Fog
function applyFog() {
  if (!FOG_ON) { scene.fog = null; return; }
  var bgHex = (scene.background && scene.background.isColor) ? scene.background.getHex() : 0x000000;
  if (FOG_TYPE === "exp") {
    scene.fog = new THREE.FogExp2(bgHex, FOG_EXP.density);
  } else {
    scene.fog = new THREE.Fog(bgHex, FOG_LINEAR.near, FOG_LINEAR.far);
  }
}
applyFog();

// Cámara
var camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
camera.position.set(2.5, 2, 1);

// Renderer
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; // r161
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = ENABLE_SHADOWS;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
pane.appendChild(renderer.domElement);

// Controles
var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.05;
controls.maxDistance = 500;
controls.zoomSpeed   = 1.0;

// Luces
var hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.8);
hemi.position.set(0, 20, 0);
scene.add(hemi);

var dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(6, 10, 6);
dir.castShadow = ENABLE_SHADOWS;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 80;
dir.shadow.camera.left = -20;
dir.shadow.camera.right = 20;
dir.shadow.camera.top = 20;
dir.shadow.camera.bottom = -20;
scene.add(dir);

// Suelo receptor de sombras
var groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
var ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = ENABLE_SHADOWS;
scene.add(ground);

// Loaders
var gltfLoader = new GLTFLoader();
var objLoader  = new OBJLoader();

console.log("[script5] loaders OK");

// Carga del modelo
loadModel(MODEL).catch(function(err){
  console.warn("Fallo al cargar modelo:", err);
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

function loadModel(pathStr) {
  return new Promise(function(resolve, reject){
    var parts = pathStr.split(".");
    var ext = parts[parts.length - 1].toLowerCase();

    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(
        pathStr,
        function(gltf){
          var model = gltf.scene;
          scene.add(model);
          enableModelShadows(model);
          addOutline(model);
          frameObject(model, 1.15);
          repositionGroundToModel(model);
          resolve();
        },
        undefined,
        function(e){ reject(e); }
      );
      return;
    }

    if (ext === "obj") {
      var p = pathStr.split("/");
      var file = p.pop();
      var dirp = p.length ? p.join("/") + "/" : "";
      objLoader.setPath(dirp).load(
        file,
        function(obj){
          obj.traverse(function(o){
            if (o && o.isMesh) {
              o.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.6,
                metalness: 0.05
              });
            }
          });
          scene.add(obj);
          enableModelShadows(obj);
          addOutline(obj);
          frameObject(obj, 1.12);
          repositionGroundToModel(obj);
          resolve();
        },
        undefined,
        function(e){ reject(e); }
      );
      return;
    }

    reject(new Error("Extensión no soportada: " + ext));
  });
}

// Sombras en el modelo
function enableModelShadows(root) {
  root.traverse(function(o){
    if (o && o.isMesh) {
      o.castShadow = ENABLE_SHADOWS;
      o.receiveShadow = ENABLE_SHADOWS;
      if (o.material && o.material.map) {
        o.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });
}

// Contorno (edges)
function addOutline(target) {
  var edgesColor = new THREE.Color(0xdddddd);
  target.traverse(function(o){
    if (o && o.isMesh && o.geometry) {
      var geo = new THREE.EdgesGeometry(o.geometry, 60);
      var mat = new THREE.LineBasicMaterial({ color: edgesColor });
      var lines = new THREE.LineSegments(geo, mat);
      lines.renderOrder = 2;
      o.add(lines);
    }
  });
}

// Enmarcar objeto
function frameObject(obj, fitOffset) {
  if (fitOffset == null) fitOffset = 1.15;

  var box = new THREE.Box3().setFromObject(obj);
  var size = box.getSize(new THREE.Vector3());
  var center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  var fov = THREE.MathUtils.degToRad(camera.fov);
  var fitHeightDistance = (size.y / 2) / Math.tan(fov / 2);
  var fitWidthDistance  = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect);
  var distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

  var dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  camera.near = Math.max(0.01, distance / 100);
  camera.far  = Math.max(150, distance * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

// Reposicionar suelo
function repositionGroundToModel(obj) {
  var box = new THREE.Box3().setFromObject(obj);
  var minY = box.min.y;
  ground.position.y = minY - 0.001;
}

// Resize a su contenedor
var ro = new ResizeObserver(function(entries){
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var w = Math.max(1, entry.contentRect.width);
    var h = Math.max(1, entry.contentRect.height);
    renderer.setSize(w, h, true);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
});
ro.observe(pane);

// Bucle
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

console.log("[script5] running");

// === APIs desde consola ===
window.setBackground = function(c) {
  scene.background = new THREE.Color(c);
  applyFog();
};
window.setFogLinear = function(near, far) {
  var bgHex = (scene.background && scene.background.isColor) ? scene.background.getHex() : 0x000000;
  scene.fog = new THREE.Fog(bgHex, near, far);
};
window.setFogExp = function(d) {
  var bgHex = (scene.background && scene.background.isColor) ? scene.background.getHex() : 0x000000;
  scene.fog = new THREE.FogExp2(bgHex, (d != null ? d : 0.03));
};
window.disableFog = function() {
  scene.fog = null;
};
window.setCamera = function(x, y, z, tx, ty, tz) {
  var t = controls.target;
  camera.position.set(x, y, z);
  controls.target.set(
    (tx != null ? tx : t.x),
    (ty != null ? ty : t.y),
    (tz != null ? tz : t.z)
  );
  controls.update();
};
