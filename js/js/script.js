const N_FRAMES = 200;
let inputText = "Laboratorio de Diseño y Fabricacion digital"; // El texto de entrada que deseas repetir
const TOTAL_CHARACTERS = 5000; // El número total de caracteres que deseas mostrar
let backgroundColor = 'black'; // Cambia este valor para modificar el color del fondo

let repeatedText;

// Función para repetir la cadena de texto hasta llenar el total de caracteres
function generateRepeatedText(text, totalLength) {
  let repeated = '';
  while (repeated.length < totalLength) {
    repeated += text; // Añadir la cadena de texto repetidamente
  }
  return repeated.slice(0, totalLength); // Asegúrate de que la longitud no exceda el total
}

function setup() {
  createCanvas(500, 500);
  noStroke();

  // Generar la cadena de texto repetida
  repeatedText = generateRepeatedText(inputText, TOTAL_CHARACTERS);

  // Configurar la fuente estándar proporcionada por p5.js
  textFont("monospace");
}

function draw() {
  background(backgroundColor); // Usar el parámetro para establecer el color de fondo

  let t = TAU * (frameCount % N_FRAMES) / N_FRAMES;

  let nLetters = 96;
  let s = (2 * width) / (nLetters * 5);
  textSize(2000 / nLetters); // Ajusta el tamaño del texto
  textAlign(LEFT, BASELINE);
  let idx = 0;
  for (let y = 0; y < height; y += 8 * s) {
    for (let x = 0; x < width; x += 5 * s) {
      let letter = repeatedText.charAt(idx);
      let x1 = x + 2.5 * s;
      let y1 = y + 4 * s;
      let d = dist(x1, y1, width / 2, height / 2);
      let wave = sin(d / 20 - t * 5) * 10; // Ondas radiales

      // Cambia la posición y el color basándose en ondas radiales
      let xOffset = wave * cos(d / 50 - t);
      let yOffset = wave * sin(d / 50 - t);

      fill(rainbow(abs(sin(d / 50 - t)))); // Ondulación de color

      text(letter, x + xOffset, y + yOffset + 8 * s);
      idx++;
    }
    idx--;
  }
}

function rainbow(t) {
  let palette = ["#f589a3", "#ef562f", "#fc8405", "#f9d531", "#abcd5e", "#62b6de"];
  let i = floor(palette.length * t);
  let amt = fract(palette.length * t);
  return lerpColor(color(palette[i % palette.length]), color(palette[(i + 1) % palette.length]), amt);
}
