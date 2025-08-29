function draw() {
  background(0); // negro
  fill(255); 
  noStroke();

  let r = 150 + 50 * sin(frameCount * 0.05); // radio animado
  circle(width/2, height/2, r);

  fill(200);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("p5.js corriendo ✅", width/2, height - 40);
}

