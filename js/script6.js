// js/script6.js
import * as THREE from "three";
import { OrbitControls } from "../lib/three.js-r161/jsm/controls/OrbitControls.js";
import { GLTFLoader }  from "../lib/three.js-r161/jsm/loaders/GLTFLoader.js";
import { OBJLoader }   from "../lib/three.js-r161/jsm/loaders/OBJLoader.js";
import { RGBELoader }  from "../lib/three.js-r161/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "../lib/three.js-r161/jsm/postprocessing/EffectComposer.js";
import { RenderPass }     from "../lib/three.js-r161/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass }from "../lib/three.js-r161/jsm/postprocessing/UnrealBloomPass.js";

/* ===== CONFIG ===== */
/* NOTA: FOG POR DEFECTO EN "none" */
var FOG_TYPE = "none";        // "none" | "linear" | "exp"
var FOG_ON = true;
var FOG_LINEAR = { near: 8, far: 55 };
var FOG_EXP = { density: 0.03 };

var ENABLE_SHADOWS = true;
var AUTO_ROTATION = true;
var ROTATION_SPEED = 0.005;

/* ===== VALORES INICIALES (EDITAR AQUÍ) ===== */
/* NOTA: EXPOSURE INICIAL */
var INITIAL_EXPOSURE = 0.6;
/* NOTA: BLOOM INICIAL */
var INITIAL_BLOOM_STRENGTH = 0.12;
/* NOTA: COLOR DE FONDO INICIAL */
var INITIAL_BACKGROUND = "#ffffff";
/* NOTA: INTENSIDAD DE LUZ DIRECCIONAL INICIAL */
var INITIAL_DIR_LIGHT_INTENSITY = 0.1;

/* NOTA: DESPLAZAMIENTOS EN EL ENCUADRE (proporción respecto al tamaño del modelo) */
var FRAME_OFFSET = { x: 0.90, y: 0.0, z: 0.0 }; // 0 = centrado; 0.25 desplaza hacia la DERECHA
/* =========================================== */

/* ===== DOM ===== */
var host    = document.getElementById("three-bg");
var overlay = document.getElementById("loading-overlay");
var bar     = document.getElementById("loading-bar");
var pct     = document.getElementById("loading-pct");
var panelEl = document.getElementById("panel-left");

/* Model por URL */
var q = new URLSearchParams(location.search);
var MODEL = q.get("model") || "assets/rhino.obj";

/* LoadingManager con progreso real */
var manager = new THREE.LoadingManager(
  function onLoadAll() {
    if (overlay) {
      overlay.style.transition = "opacity .35s ease";
      overlay.style.opacity = "0";
      setTimeout(function(){ overlay.style.display = "none"; }, 400);
    }
  },
  function onProgress(url, loaded, total) {
    var p = total ? Math.round((loaded / total) * 100) : 0;
    if (bar) bar.style.width = p + "%";
    if (pct) pct.textContent = p + "%";
  },
  function onError(url) { console.warn("Error cargando:", url); }
);

/* ===== Escena y Fog ===== */
var scene = new THREE.Scene();
scene.background = new THREE.Color(INITIAL_BACKGROUND);

function applyFog() {
  if (!FOG_ON || FOG_TYPE === "none") { scene.fog = null; return; }
  var bgHex = scene.background instanceof THREE.Color ? scene.background.getHex() : 0x000000;
  if (FOG_TYPE === "exp") scene.fog = new THREE.FogExp2(bgHex, FOG_EXP.density);
  else scene.fog = new THREE.Fog(bgHex, FOG_LINEAR.near, FOG_LINEAR.far);
}
applyFog();

/* ===== Cámara ===== */
var camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
/* Anclado “hacia la derecha” (iso suave) */
camera.position.set(2.8, 2.0, 2.4);

/* ===== Renderer ===== */
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = INITIAL_EXPOSURE;
renderer.shadowMap.enabled = ENABLE_SHADOWS;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

/* ===== Post-proceso ===== */
var composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
var bloomPass = new UnrealBloomPass(new THREE.Vector2(1,1), INITIAL_BLOOM_STRENGTH, 0.2, 0.9);
composer.addPass(bloomPass);

/* ===== Controles ===== */
var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = AUTO_ROTATION;
controls.autoRotateSpeed = ROTATION_SPEED * 60;
controls.minDistance = 0.05;
controls.maxDistance = 500;

/* ===== Luces ===== */
var hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.8);
hemi.position.set(0, 20, 0);
scene.add(hemi);

var dir = new THREE.DirectionalLight(0xffffff, INITIAL_DIR_LIGHT_INTENSITY);
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

/* ===== Suelo receptor de sombras ===== */
var ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = ENABLE_SHADOWS;
scene.add(ground);

/* ===== HDRI Environment ===== */
var rgbeLoader = new RGBELoader(manager);
rgbeLoader.load("assets/venice_sunset_4k.hdr", function(hdr){
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr;
}, undefined, function(err){ console.warn("HDRI no cargado:", err); });

/* ===== Loaders ===== */
var gltfLoader = new GLTFLoader(manager);
var objLoader  = new OBJLoader(manager);

/* ===== Referencia al último modelo cargado ===== */
var lastModel = null;

/* ===== Carga modelo ===== */
loadModel(MODEL).catch(function(err){
  console.warn("Modelo no cargado:", err);
  var box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color:0xcccccc, roughness:0.6, metalness:0.05 })
  );
  box.castShadow = ENABLE_SHADOWS;
  scene.add(box);
  addOutline(box);
  lastModel = box;
  frameObject(lastModel, 1.15);
  repositionGroundToModel(lastModel);
});

function loadModel(path){
  return new Promise(function(resolve, reject){
    var ext = path.split(".").pop().toLowerCase();
    if (ext === "glb" || ext === "gltf") {
      gltfLoader.load(path, function(gltf){
        var model = gltf.scene;
        scene.add(model);
        enableModelShadows(model);
        addOutline(model);
        lastModel = model;
        frameObject(lastModel, 1.15);
        repositionGroundToModel(lastModel);
        resolve();
      }, undefined, reject);
      return;
    }
    if (ext === "obj") {
      var base = path.substring(0, path.lastIndexOf("/") + 1);
      var file = path.split("/").pop();
      objLoader.setPath(base).load(file, function(obj){
        obj.traverse(function(o){
          if (o && o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.6, metalness:0.05 });
            o.castShadow = ENABLE_SHADOWS;
            o.receiveShadow = ENABLE_SHADOWS;
          }
        });
        scene.add(obj);
        addOutline(obj);
        lastModel = obj;
        frameObject(lastModel, 1.12);
        repositionGroundToModel(lastModel);
        resolve();
      }, undefined, reject);
      return;
    }
    reject(new Error("Formato no soportado: " + ext));
  });
}

function enableModelShadows(root){
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

function addOutline(target){
  var color = new THREE.Color(0xdddddd);
  target.traverse(function(o){
    if (o && o.isMesh && o.geometry) {
      var edges = new THREE.EdgesGeometry(o.geometry, 60);
      var lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));
      lines.renderOrder = 2;
      o.add(lines);
    }
  });
}

/* === Encuadre con offsets X/Y/Z relativos al tamaño del modelo === */
function frameObject(obj, offset){
  if (offset == null) offset = 1.15;
  var box = new THREE.Box3().setFromObject(obj);
  var size = box.getSize(new THREE.Vector3());
  var center = box.getCenter(new THREE.Vector3());

  var fov = THREE.MathUtils.degToRad(camera.fov);
  var distY = (size.y / 2) / Math.tan(fov / 2);
  var distX = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect);
  var distance = offset * Math.max(distY, distX);

  var dirVec = new THREE.Vector3(1.4, 0.8, 1.0).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(distance)));

  // Offsets relativos
  var offX = size.x * FRAME_OFFSET.x;
  var offY = size.y * FRAME_OFFSET.y;
  var offZ = size.z * FRAME_OFFSET.z;

  // Mover target: -X para empujar visualmente el modelo hacia la DERECHA
  controls.target.set(center.x - offX, center.y + offY, center.z + offZ);

  camera.near = Math.max(0.01, distance / 100);
  camera.far  = Math.max(150, distance * 10);
  camera.updateProjectionMatrix();
  controls.update();
}

function repositionGroundToModel(obj){
  var minY = new THREE.Box3().setFromObject(obj).min.y;
  ground.position.y = minY - 0.001;
}

/* ===== Resize ===== */
function resizeToHost(){
  var rect = host.getBoundingClientRect();
  var w = Math.max(1, Math.floor(rect.width));
  var h = Math.max(1, Math.floor(rect.height));
  renderer.setSize(w, h, true);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeToHost();

var ro = new ResizeObserver(function(){ resizeToHost(); });
ro.observe(host);

/* ===== Loop ===== */
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

/* ===== GUI ===== */
try {
  var gui = new lil.GUI();
  var bgStyle = scene.background instanceof THREE.Color ? scene.background.getStyle() : INITIAL_BACKGROUND;

  var params = {
    exposure: INITIAL_EXPOSURE,
    bloomStrength: INITIAL_BLOOM_STRENGTH,
    directionalLight: INITIAL_DIR_LIGHT_INTENSITY,
    background: bgStyle,
    fogType: FOG_TYPE,

    // Panel
    panelColor: "#ffffff",
    panelOpacity: 0.15,

    // Interacción del 3D
    interact3D: true,

    // Offsets del encuadre (proporciones)
    frameOffsetX: FRAME_OFFSET.x,
    frameOffsetY: FRAME_OFFSET.y,
    frameOffsetZ: FRAME_OFFSET.z
  };

  // === Render / Post ===
  gui.add(params, "exposure", 0.1, 2).name("Exposure").onChange(function(v){
    renderer.toneMappingExposure = v;
  });
  gui.add(params, "bloomStrength", 0, 2).name("Bloom").onChange(function(v){
    bloomPass.strength = v;
  });

  // === Luz / Fondo / Fog ===
  gui.add(params, "directionalLight", 0, 2).name("Dir Light").onChange(function(v){
    dir.intensity = v;
  });
  gui.addColor(params, "background").name("Fondo").onChange(function(v){
    scene.background = new THREE.Color(v);
    applyFog();
  });
  gui.add(params, "fogType", ["none", "linear", "exp"]).name("Fog").onChange(function(v){
    FOG_TYPE = v; applyFog();
  });

  // === Panel vidrio (color + opacidad) ===
  function setPanelColor(hex){
    var c = new THREE.Color(hex);
    var r = Math.round(c.r * 255);
    var g = Math.round(c.g * 255);
    var b = Math.round(c.b * 255);
    document.documentElement.style.setProperty("--panel-bg-r", String(r));
    document.documentElement.style.setProperty("--panel-bg-g", String(g));
    document.documentElement.style.setProperty("--panel-bg-b", String(b));
  }
  function setPanelOpacity(a){
    var v = Math.max(0, Math.min(1, a));
    document.documentElement.style.setProperty("--panel-bg-a", String(v));
    if (panelEl) {
      if (v === 0) panelEl.classList.add("panel-transparent");
      else panelEl.classList.remove("panel-transparent");
    }
  }
  setPanelColor(params.panelColor);
  setPanelOpacity(params.panelOpacity);

  gui.addColor(params, "panelColor").name("Panel · Color").onChange(setPanelColor);
  gui.add(params, "panelOpacity", 0, 1, 0.01).name("Panel · Opacidad").onChange(setPanelOpacity);

  // === Interacción 3D (pointer-events) ===
  function setInteract3D(flag){
    host.style.pointerEvents = flag ? "auto" : "none";
  }
  setInteract3D(params.interact3D);
  gui.add(params, "interact3D").name("3D interactivo").onChange(setInteract3D);

  // === Offsets del encuadre (X/Y/Z) ===
  gui.add(params, "frameOffsetX", -1, 1, 0.01).name("Frame · OffX").onChange(function(v){
    FRAME_OFFSET.x = v;
    if (lastModel) frameObject(lastModel, 1.15);
  });
  gui.add(params, "frameOffsetY", -1, 1, 0.01).name("Frame · OffY").onChange(function(v){
    FRAME_OFFSET.y = v;
    if (lastModel) frameObject(lastModel, 1.15);
  });
  gui.add(params, "frameOffsetZ", -1, 1, 0.01).name("Frame · OffZ").onChange(function(v){
    FRAME_OFFSET.z = v;
    if (lastModel) frameObject(lastModel, 1.15);
  });

} catch(e) {
  console.warn("lil-gui no disponible:", e);
}
