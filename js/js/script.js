// ---- Parámetros
const N_FRAMES = 200;
let inputText = "Laboratorio de Diseño y Fabricación Digital "; // añade un espacio
let backgroundColor = "black"; // "white" también queda bien

// Paleta
const PALETTE = ["#f589a3", "#ef562f", "#fc8405", "#f9d531", "#abcd5e", "#62b6de"];

// Estado
let repeatedText = "";

// Util
function generateRepeatedText(text, minLength = 5000) {
  let s = text;
  while (s.length < minLength) s += text;
  return s;
}

function rainbow(t) {
  const n = PALETTE.length;
  const x = n * t;
  const i = Math.floor(x) % n;
  const j = (i + 1) % n;
  const amt = x - Math.floor(x);
  return lerpColor(color(PALETTE[i]), color(PALETTE[j]), amt);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);          // mejora rendimiento en móviles
  noStroke();
  textFont("monospace");
  textAlign(LEFT, BASELINE);
  repeatedText = generateRepeatedText(inputText, 8000);
}

function draw() {
  background(backgroundColor);

  const t = TWO_PI * ((frameCount % N_FRAMES) / N_FRAMES);

  // Densidad de la grilla (ajusta estos dos para más/menos letras)
  const stepX = 20;               // horizontal spacing
  const stepY = 24;               // vertical spacing
  textSize(stepY * 0.8);

  let idx = 0;
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const letter = repeatedText.charAt(idx % repeatedText.length);

      const cx = width / 2;
      const cy = height / 2;
      const d = dist(x, y, cx, cy);

      // Onda radial
      const wave = Math.sin(d / 20 - t * 5) * 10;
      const xOffset = wave * Math.cos(d / 50 - t);
      const yOffset = wave * Math.sin(d / 50 - t);

      fill(rainbow(Math.abs(Math.sin(d / 50 - t))));
      text(letter, x + xOffset, y + yOffset);
      idx++;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Sencillo toggle de fondo con clic
function mousePressed() {
  backgroundColor = (backgroundColor === "black") ? "white" : "black";
}
