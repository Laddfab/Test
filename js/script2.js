/* ========= Parámetros editables ========= */
const N_FRAMES = 220;                       // duración del loop
let INPUT_TEXT = "Laboratorio de Diseño y Fabricación Digital · "; // tu texto
let BG = "black";                           // fondo inicial: "black" o "white"

/* ========= Paletas (elige con 1/2/3) ========= */
const PALETTES = [
  ["#f589a3","#ef562f","#fc8405","#f9d531","#abcd5e","#62b6de"],     // cálida
  ["#00d2ff","#3a7bd5","#7f53ac","#647dee","#43cea2","#185a9d"],     // fría
  ["#ff9a9e","#fad0c4","#fbc2eb","#a18cd1","#96e6a1","#d4fc79"]      // pastel
];
let palette = PALETTES[0];

/* ========= Estado ========= */
let repeatedText = "";
let stepX = 20, stepY = 24;  // densidad de grilla (↑ más fino = más pesado)

/* ========= Util ========= */
function generateRepeatedText(text, minLength = 12000) {
  let s = text;
  while (s.length < minLength) s += text;
  return s;
}
function rainbow(t) {
  const n = palette.length;
  const x = n * t;
  const i = Math.floor(x) % n;
  const j = (i + 1) % n;
  const amt = x - Math.floor(x);
  return lerpColor(color(palette[i]), color(palette[j]), amt);
}
function center() { return { cx: width/2, cy: height/2 }; }

/* ========= Setup / Draw ========= */
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // rendimiento estable
  noStroke();
  textFont("monospace");
  textAlign(LEFT, BASELINE);

  // escala densa en pantallas grandes
  const base = Math.min(windowWidth, windowHeight);
  stepX = Math.max(14, Math.round(base * 0.018));
  stepY = Math.max(16, Math.round(base * 0.022));

  repeatedText = generateRepeatedText(INPUT_TEXT, 20000);
}

function draw() {
  background(BG);
  const { cx, cy } = center();
  const loopT = TWO_PI * ((frameCount % N_FRAMES) / N_FRAMES);

  // tamaño de letra relativo a la rejilla (coherente vertical)
  textSize(stepY * 0.85);

  let idx = 0;
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      // carácter cíclico
      const letter = repeatedText.charAt(idx % repeatedText.length);

      // distancia al centro
      const d = dist(x, y, cx, cy);

      // Onda radial + remolino suave
      const wave = Math.sin(d / 18 - loopT * 5) * 10;
      const swirl = d / 48 - loopT;

      const xOffset = wave * Math.cos(swirl);
      const yOffset = wave * Math.sin(swirl);

      // Color interpolado por fase
      const cphase = Math.abs(Math.sin(d / 55 - loopT));
      fill(rainbow(cphase));

      text(letter, x + xOffset, y + yOffset);
      idx++;
    }
  }

  // Sutil viñeteado para profundidad (opcional)
  push();
  noStroke();
  const vignette = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy));
  const edge = (BG === "black") ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.15)";
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, edge);
  drawingContext.fillStyle = vignette;
  rect(0, 0, width, height);
  pop();
}

/* ========= Interacción ========= */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  BG = (BG === "black") ? "white" : "black";
}

function keyPressed() {
  if (key === "1") palette = PALETTES[0];
  if (key === "2") palette = PALETTES[1];
  if (key === "3") palette = PALETTES[2];

  if (keyCode === UP_ARROW) { stepX = Math.max(10, stepX - 2); stepY = Math.max(12, stepY - 2); }
  if (keyCode === DOWN_ARROW) { stepX += 2; stepY += 2; }
}

/* ========= Personalización rápida =========
- Cambia INPUT_TEXT para otro mensaje (añade un espacio al final para respiración tipográfica).
- Usa 1/2/3 para cambiar paletas en vivo.
- Click para alternar fondo negro/blanco.
- ↑/↓ para ajustar densidad (más letras ⇄ más pesado).
- Ajusta N_FRAMES para velocidad del loop (más alto = más lento).
*/
