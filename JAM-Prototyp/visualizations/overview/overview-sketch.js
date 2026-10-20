const charts = [
    {
        id: 'canvas-container-salmonellose',
        name: 'Salmonellose',
        count: 555,
        numberPosition: { x: 0.66, y: 0.5 }
    },
    {
        id: 'canvas-container-campylobacteriose',
        name: 'Campylobacteriose',
        count: 1392,
        numberPosition: { x: 0.33, y: 0.5 }
    },
    {
        id: 'canvas-container-shigellose',
        name: 'Shigellose',
        count: 27,
        numberPosition: { x: 0.66, y: 0.5 }
    },
    {
        id: 'canvas-container-ehec',
        name: 'EHEC',
        count: 261,
        numberPosition: { x: 0.33, y: 0.5 }
    },
];

const PUNKT_SIZE = 6;

function createChart(config) {
    // Kreieren einer p5-Canvas für jede Krankheit
    new p5((p) => {
        let cases = [];
        let particles = [];
        let targets = [];
        let visible = [];
        let container;

        // setup-Funktion für Canvas
        p.setup = () => {
            // Definieren des Containers für Krankheiten
            container = document.getElementById(config.id);
            // Setzen der Größe des Canvas und das Layout
            const { width, height } = getCanvasSize();
            // Erstellen der Canvas
            p.createCanvas(width, height).parent(container);
            // Anzahl Fälle definieren
            cases = Array.from({ length: config.count }, (_, id) => ({ id }));
            // Particles mappen
            particles = cases.map(() => ({
                x: p.random(p.width),
                y: p.random(p.height),
            }));
            rebuildLayout();
        };

        p.draw = () => {
            p.background('#F77F1B');

            // Zahlen hinter Particle
            p.noStroke();
            p.noFill()
            p.fill(255, 60);
            p.strokeWeight(1);
            p.textAlign(p.CENTER, p.CENTER);
            p.textStyle(p.BOLD);
            // Verknüpfung der Textgrössen mit Grösse der dargestellten Zahle (responsive)
            p.textSize(getNumberTextSize());
            const numberPosition = getNumberPosition(p, config);
            p.text(String(config.count), numberPosition.x, numberPosition.y);

            p.noStroke();
            p.fill(255);

            // erstellen der Particles
            particles.forEach((particle, index) => {
                const target = targets[index];
                particle.x = p.lerp(particle.x, target.x, 0.08);
                particle.y = p.lerp(particle.y, target.y, 0.08);
                if (visible[index]) p.circle(particle.x, particle.y, PUNKT_SIZE);
            });

            // Name der Krankheit
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textStyle(p.NORMAL);
            // Berechnung der Grösse
            p.textSize(Math.max(14, Math.min(22, p.width * 0.025)));
            p.text(config.name, numberPosition.x, numberPosition.y * 1.5);
        };

        // Funktion um Canvas-Grösse neuzuberechnen
        p.windowResized = () => {
            const { width, height } = getCanvasSize();
            p.resizeCanvas(width, height);
            rebuildLayout();
        };

        function getCanvasSize() {
            return {
                width: Math.max(container?.clientWidth || window.innerWidth / 2, 1),
                height: Math.max(container?.clientHeight || window.innerHeight / 2, 1),
            };
        }

        function getNumberTextSize() {
            return Math.min(p.width, p.height) * 0.48;
        }

        // Erstellen der Darstellung
        function rebuildLayout() {
            const graphics = p.createGraphics(p.width, p.height);
            graphics.pixelDensity(1);
            graphics.clear();
            graphics.noStroke();
            graphics.fill(255);
            graphics.textAlign(p.CENTER, p.CENTER);
            graphics.textStyle(p.BOLD);
            graphics.textSize(getNumberTextSize());
            const numberPosition = getNumberPosition(graphics, config);

            graphics.text(String(config.count), numberPosition.x, numberPosition.y);

            graphics.loadPixels();
            const candidates = [];
            const step = 3;
            for (let y = 0; y < graphics.height; y += step) {
                for (let x = 0; x < graphics.width; x += step) {
                    const alpha = graphics.pixels[(y * graphics.width + x) * 4 + 3];
                    if (alpha > 128) candidates.push({ x, y });
                }
            }
            graphics.remove();

            const shuffled = p.shuffle(candidates, false);
            targets = cases.map((_, index) =>
                shuffled[index % shuffled.length] || { x: p.width / 2, y: p.height / 2 }
            );
            visible = cases.map((_, index) => index < config.count);
        }
    });
}

function getNumberPosition(canvas, config) {
    return {
        x: canvas.width * config.numberPosition.x,
        y: canvas.height * config.numberPosition.y,
    };
}

charts.forEach(createChart);
