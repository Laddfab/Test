function setup() {
  createCanvas(windowWidth, windowHeight);
  background(2); // negro
}

function draw() {
  background(0); // repinta negro
  fill(222); // blanco sólido
  noStroke();
  circle(width/2, height/2, 150); // círculo fijo
}
