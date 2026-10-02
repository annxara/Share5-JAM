const tileColor = [255, 255, 255];
const tileCount = 6;

const sketch = (p) => { // p = p5 instance, const sketch ist für die p5 instanz, damit man die p5 funktionen benutzen kann
  const cols = 3;
  const rows = 2;
  const gap = 20;
  const padding = 26;
  let tileData = [];
  let popCircles = [];

  function createPopCircles(tile) {
    const circleCount = 10;
    const circles = [];
    const baseSize = 20;
    const minDistance = baseSize * 2 + 6;

    for (let i = 0; i < circleCount; i++) { // mit copilot: damit sich die kreise nicht überlappen -> nochmals anschauen
      let x = 0;
      let y = 0;
      let validPosition = false;

      for (let tryCount = 0; tryCount < 20 && !validPosition; tryCount++) { //20&& = 20 Versuche, um eine gültige Position zu finden -> anscheinend sicherheitszahlen die man benutzt
        x = tile.x + 20 + Math.random() * (tile.w - 40);
        y = tile.y + 20 + Math.random() * (tile.h - 40);

        const overlaps = circles.some((other) => {
          const dx = x - other.x;
          const dy = y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < minDistance;
        });

        if (!overlaps) {
          validPosition = true;
        }
      }

      circles.push({
        x,
        y,
        size: baseSize,
        start: i * 220,
        duration: 700,
        maxSize: baseSize
      });
    }

    return circles;
  }

  function updateTileData() {
    const w = p.width;
    const h = p.height;
    const tileW = (w - padding * 2 - gap * (cols - 1)) / cols;
    const tileH = (h - padding * 2 - gap * (rows - 1)) / rows;

    tileData = Array.from({ length: tileCount }, (_, index) => { // _ = unbenutzte variable 
      const col = index % cols; // % für modulo, also Restwert der Division -> damit man die Spalten bekommt
      const row = Math.floor(index / cols);

      return {
        x: padding + col * (tileW + gap),
        y: padding + row * (tileH + gap),
        w: tileW,
        h: tileH,
        scale: 0.9,
        opacity: 0,
        yPos: padding + row * (tileH + gap)
      };
    });

    if (tileData[0]) {
      popCircles = createPopCircles(tileData[0]);
    }
  }

  function drawTiles() {
    p.background(239, 244, 247);

    tileData.forEach((tile, tileIndex) => {
      p.push();
      p.translate(tile.x + tile.w / 2, tile.y + tile.h / 2);
      p.scale(tile.scale);
      p.translate(-tile.w / 2, -tile.h / 2);

      p.drawingContext.shadowColor = "rgba(0, 0, 0, 0.18)";
      p.drawingContext.shadowBlur = 18;
      p.drawingContext.shadowOffsetY = 8;

      p.noStroke();
      p.fill(tileColor);
      p.rect(0, 0, tile.w, tile.h, 18);
      p.pop();

      if (tileIndex === 0) {
        popCircles.forEach((circle) => {
          const elapsed = p.millis() - circle.start;
          const t = p.constrain(elapsed / circle.duration, 0, 1);
          const r = p.lerp(0, circle.maxSize, t);

          p.noStroke();
          p.fill(90, 103, 255, 220);
          p.circle(circle.x, circle.y, r * 2);
        });
      }
    });
  }

  p.setup = () => {
    const container = document.getElementById("gallery");
    const canvas = p.createCanvas(container.clientWidth, 620);
    canvas.parent("gallery");
    updateTileData();
    p.frameRate(60);
    tileData.forEach((tile, index) => {
      gsap.fromTo(
        tile,
        { scale: 0.88, opacity: 0, y: tile.yPos + 28 },
        {
          scale: 1,
          opacity: 1,
          y: tile.yPos,
          duration: 0.9,
          delay: index * 0.5,
          ease: "power3.out"
        }
      );
    });

    p.loop();
  };

  p.draw = () => {
    drawTiles();
  };

  p.windowResized = () => {
    const container = document.getElementById("gallery");
    p.resizeCanvas(container.clientWidth, 620);
    updateTileData();
    p.redraw();
  };
};

new p5(sketch); // ausführung der sketch funktion, damit p5 die funktion erkennt und ausführt
