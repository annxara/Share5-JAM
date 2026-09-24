let size = 20;

// Array für eine Mehrzahl von Arrays
let particles = [];



function setup() {
  createCanvas(800, 800);

  angleMode(DEGREES);
  
  // Array für Particles
  for(let i = 0; i < 30; i++){
    let p = new Particle(random(40,width-40), random(40,height-40), 0, 0);
    particles.push(p);
  }
}

function draw() {
  background(255);

  // Zeichnet Particles neu, so dass sie sich bewegen
  for(let i = 0; i < particles.length; i++){
    particles[i].update();
    particles[i].display();
  }

  // Doppelte for-Schleife zum überprüfen des jetzigen Partikels mit allen vorherigen --> Um Collisions-Effekt zu erstellen
  for(let k = 0; k < 10; k++){
    for(let i = 0; i < particles.length; i++){
      for(let j = i + 1; j < particles.length; j++){
        particles[i].collision(particles[j]);
      }
    }
  }
}


// Wie ist der Aufbau einer Instantz , Was ist darin enthalten 
class Particle{

  // constructor --> Fixe Funktion einer Klasse (wird automatisch ausgeführt)
  constructor(x, y, vx, vy){
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    // Radius für Collision
    this.r = (size/2) - 5;
    // Beschleunigung
    this.acc = createVector(0,0.01);
    this.color = color(10,10,60, 200);
  }

  collision(other){
    // Berechnung der Richtung anhand der Position des Partikels und des Anziehungspunkts
    let direction = p5.Vector.sub(this.pos, other.pos);

    // berechnet die Länge des Vektors 
    let d = direction.mag();

    // kleinste Distanz für Collision
    let minDist = this.r + other.r;
    
    // Wenn übereinander werden sie abgestossen
    if(d < minDist){
      if(d === 0){
        direction = p5.Vector.random2D();
      } else {
        direction.normalize();
      }

      // Grösse der Überlappung
      let overlap = (minDist - d)/2;

      // Richtung in die die Partikel weggestossen werden sollen
      // Berechung Richtung zwischen den beiden Mittelpunkten / Umkehrung
      // Wird halbiert
      direction.setMag(overlap);

      // Gibt beiden Partikeln einen Impuls voneinander weg.
      let repulsion = direction.copy().setMag(0.10);
      this.vel.add(repulsion);
      other.vel.sub(repulsion);

      // Wird weggeschoben
      this.pos.add(direction);

      // Wird in die gegenteilige Richtung weggeschoben
      other.pos.sub(direction);
    }
  }

  // Position der Particles wird geupdates
  update(){

    // Position des Anziehungspunktes
    let anziehungs_punkt = createVector(width/2,height/2);

    // Berechnung eines neuen Vektors und nicht Veränderung des ursprünglichen
    let dir = p5.Vector.sub(anziehungs_punkt,this.pos);

    // Messen der Länge des Vektors
    let d = dir.mag();

    // Anziehung zu Maus nur unter Bedingung
    if(d > 40){

      // Normalize --> Vektorlänge = 1
      dir.normalize();

      // Erneute Verkürzung des Vaktors
      dir.mult(0.1);

      this.acc = dir;
    } else{
      this.acc.set(0,0);
    }

    // If-Statement zum Umdrehen des Ellipsen am Rand
    if (this.pos.x > width | this.pos.x < 0){
      this.vel.x = this.vel.x * (-1);
    } else if (this.pos.y > height | this.pos.y < 0){
      this.vel.y = this.vel.y * (-1);
    }

    // Beschleunigung wird zu Geschwindigkeit dazugezählt
    this.vel.add(this.acc);

    // Limit der Geschwindigkeit setzten
    this.vel.limit(3);

    // Geschiwindigkeit wird zu Position dazugezählt
    this.pos.add(this.vel);
  }


  // Particles werden gezeichnet
  display(){
    push();
    noStroke();
    fill(this.color);
    translate(this.pos.x, this.pos.y);

    ellipse(0,0,size,size);
    pop();
  }
}