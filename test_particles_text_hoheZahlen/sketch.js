// Array erstellen für Particles
let particles = [];
let targets = [];
// Grösse der Particles
let size = 10;
// Grid-Size für Target-Berechnung
let gridsize = 5;
// Text Grösse
let tSize = 250;
let maxSpeed = 5;
// Anzahl Fälle
let cases_count = 261;

async function setup() {
  createCanvas(800, 800);
  textAlign(CENTER, CENTER);

  // Hereinladen der Schrift
  fontStyle = await loadFont("/assets/NotoSans-Regular.ttf");

  // Setzt die Unterteilung in Pixel
  pixelDensity(1);

  

  // Generieren der Targets pro Particle
  targets = generateTargets(tSize, gridsize);

  // Erstellen der Particles
  for (let i = 0; i < cases_count; i++) {
    // random Platzierung der Particles
    let p = new Particle(random(40, width - 40), random(40, height - 40), 0, 0);
    // Hochladen der Particles in das Array
    particles.push(p);
  }
}

function draw() {
  background(255);
  noStroke();
  
  fill(10, 10, 60, 20);
  textSize(tSize);
  text(cases_count, width / 2, height / 2);
  

  // Zeichnen der Particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].display();
  }

  // Azeigen der Framerate
  // push();
  // translate(100, 100);
  // textSize(12);
  // fill(255, 0, 0);
  // text(int(frameRate()), 0, 0);
  // pop();
}

// Generieren der Targets für die einzelnen Particles
function generateTargets(tSize, spacing) {

  // Laden der Schrift um Target zu erstellen
  background(255);
  fill(0);
  textSize(tSize);
  text(cases_count, width / 2, height / 2);
  loadPixels();
  // Array für einzelne Pixel des Targets
  let pts = [];

  for (let y = spacing / 2; y < height; y += spacing) {
    for (let x = spacing / 2; x < width; x += spacing) {
      let index = (Math.floor(y) * width + Math.floor(x)) * 4;
      // Dunkler Pixel = gehört zur Zahl
      if (pixels[index] < 128) {
        pts.push(createVector(x, y));
      }
    }
  }
  return pts;
}

// Wenn key gepresst werden Particles angezogen
function keyPressed() {
  if (key == "t") {
    for (particle of particles) {
      let t = random(targets);
      particle.setTarget(t);
    }
  }
  // Wenn r --> nur so viel wie in Target platz haben
  if (key == "r") {
    for (let i = 0; i < particles.length; i++) {
      if (i < targets.length) {
        particles[i].setTarget(targets[i]);
      } else {
        // übrige Particles zufällig verteilen
        particles[i].setTarget(createVector(random(width), random(height)));
      }
    }
  }
}

// Funktion für Particles
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.target = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(0.1);
    this.acc = createVector(0, 0.1);
    this.color = color(10, 10, 60, 150);
    this.r = size / 2 - 1;
    // Für random Bewegung
    this.phase = random(TWO_PI);
  }

  setTarget(t) {
    this.target = t.copy();
  }

  update() {
    let desired = p5.Vector.sub(this.target, this.pos);
    let distance = desired.mag();

    let slowRadius = 100; // ab dieser Distanz wird abgebremst
    let speed = maxSpeed;

    if (distance < slowRadius) {
      // je näher, desto langsamer: von maxSpeed bis 0
      speed = map(distance, 0, slowRadius, 0, maxSpeed);
    }
    desired.setMag(speed);

    // Kleine Bewegung beibehalten, sobald das Partikel am Ziel angekommen ist
    if (distance < 8) {
      let drift = createVector(
        sin(frameCount * 0.04 + this.phase),
        cos(frameCount * 0.05 + this.phase)
      );
      desired.add(drift.mult(0.8));
    }

    // Lenkkraft = gewünschte Geschwindigkeit minus aktuelle
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(0.5); // maximale Lenkkraft

    this.vel.add(steer);
    this.vel.limit(maxSpeed);
    this.pos.add(this.vel);
  }

  // Funktion um particles zu zeichnen
  display() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, size, size);
  }
}
