// Sketch mínimo para comprobar carga de p5 + animación suave
let msg = "Laboratorio de Diseño y Fabricación Digital";

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");
  textAlign(CENTER, CENTER);
}

function draw() {
  background(0);
  // círculo que respira
  const r = 50 + 30 * sin(frameCount * 0.05);
  noStroke();
  fill(255, 255, 255, 40);
  circle(width/2, height/2, 200 + r);

  // texto
  fill(255);
  textSize(min(width, height) * 0.04);
  text(msg, width/2, height/2);

  // pie de página
  textSize(12);
  fill(180);
  text("p5.js corriendo en GitHub Pages ✅", width/2, height - 24);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
