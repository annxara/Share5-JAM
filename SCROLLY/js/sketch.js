/**
 * p5-Seite: lädt Daten, baut Layouts und zeichnet die Partikel.
 * Die Scrolllogik liegt in scroll.js; beide Dateien kommunizieren nur über state.
 */

// Größe eines einzelnen Partikels und Easing für alle Positionsübergänge.
const DOT_SIZE = 10;
const ease = gsap.parseEase('power2.inOut');
const INFO_TOPICS = {
    total: 'Aktualitaet',
    change: 'Veraenderung',
    seasonality: 'Saisonalitaet',
    trend: 'Trend',
};

// CSV-Daten sowie berechnete Layouts und aktuelle Partikelpositionen.
let data = [];
let computedLayouts = [];     // computedLayouts[layoutIndex] = { positions, labels }
let intermediateLayouts = {}; // zusätzliche Ziele für den Übergang change -> seasonality
let particles = [];   // particles[i] gehört zu CASES[i]

async function setup() {
    // Daten laden und die Gesamtzahl der Partikel bestimmen.
    data = await d3.dsv(';', 'data/Daten_Scrolly.csv', d3.autoType);
    CASES = createFakeCases(
        getParticleCount(data) + getSeasonalityParticleCount(data)
    );

    // Canvas einrichten; p5-Funktionen in den Layouts sind erst ab hier verfügbar.
    rectMode(CENTER, CENTER);
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    randomSeed(1);      // stabile Zuordnung, wenn random verwendet wird

    buildLayouts();

    // Startpositionen zufällig verteilen; die Layouts übernehmen danach die Zielpositionen.
    particles = CASES.map((c) => ({
        x: random(width),
        y: random(height)
    }));
}

// Zeichenfläche für die Diagramme, 
// könnte auch fullsize canvas sein, 
// hier nur Bereich der Canvas
function chartArea() {
    // Der Diagrammbereich lässt an allen Seiten einen kleinen Rand frei.
    const w = windowWidth - windowWidth / 10;
    const h = windowHeight - windowHeight / 10;

    return {
        x: (width - w) / 2,
        y: (height - h) / 2,
        w,
        h
    };
}

function buildLayouts() {
    // Für jede HTML-Section wird die passende Layout-Funktion aufgerufen.
    const area = chartArea();
    //Hier werden der Name des Layouts zusammengesetzt auf Zeile 11 im scroll.js benutzt um die Layoutfunktionen aufzurufen. 
    // D.h. pro Name im HTML, Bsp. data-layout="total" muss es eine Funktion Layouts.total() geben, die die Positionen berechnet.
    // idealerweise noch testen, ob die Funktion existiert, sonst Fehler.
    computedLayouts = state.layoutNames.map((name) => {
        const layoutFunction = Layouts[name];
        const actualCount = getParticleCount(data);
        const layoutData = name === 'total'
            ? actualCount
            : name === 'change'
                ? getChangeText(data)
                : name === 'seasonality'
                    ? getSeasonalityColumns(data)
                    : name === 'trend'
                        ? getTrendDirection(data)
                    : undefined;
        const visibleCount = name === 'total'
            ? actualCount
            : name === 'change'
                ? getChangeParticleCount(data)
                : undefined;
        const secondaryCount = name === 'change' || name === 'seasonality'
            ? actualCount
            : undefined;
        // Layouts liefern Positionen, Labels und bei Bedarf eine Sichtbarkeitsliste.
        return layoutFunction(CASES, area, layoutData, visibleCount, secondaryCount);
    });






    // Beim Wechsel von change zu seasonality bleiben Saisonalitäts-Partikel unten,
    // während die überschüssigen Aktualitäts-Partikel nach oben wegfliegen.
    intermediateLayouts = {
        offscreen: Layouts.changeDeparture(
            CASES,
            area,
            getParticleCount(data)
        ),
    };

    //console.log('layouts built', computedLayouts);
}

function draw() {
    // Hintergrund und aktive Layouts für den aktuellen Scrollzustand zeichnen.
    gradientbg();

    const last = computedLayouts[state.lastIndex];
    const current = computedLayouts[state.currentIndex];
    const lastLayoutName = state.layoutNames[state.lastIndex];
    const currentLayoutName = state.layoutNames[state.currentIndex];
    // Diese beiden Übergänge brauchen eine eigene Sichtbarkeits-/Zielzuordnung.
    const isTotalToChange =
        lastLayoutName === 'total' && currentLayoutName === 'change';
    const isChangeToSeasonality =
        lastLayoutName === 'change' && currentLayoutName === 'seasonality';
    const actualCount = getParticleCount(data);
    const particleProgress = ease(state.progress);
    //state.progress 0 bis 1
    //ease() sorgt für sanfte Beschleunigung/Abbremsung, sonst linear
    //ease() ist eine Funktion, die auf GSAP 'power2.inOut' zurückgreift, siehe Zeile 7

    // Jedes Partikel wird zwischen seinem alten und neuen Ziel interpoliert.
    noStroke();
    for (let i = 0; i < particles.length; i++) {
        const from = last.positions[i];
        const to = isChangeToSeasonality && i < actualCount
            ? intermediateLayouts.offscreen.positions[i]
            : current.positions[i];

        const p = particles[i];

        // Sollposition aus dem geglätteten Scrollfortschritt berechnen.
        p.x = lerp(from.x, to.x, particleProgress);
        p.y = lerp(from.y, to.y, particleProgress);

        // Während eines Übergangs gelten je nach Phase unterschiedliche Sichtbarkeiten.
        const isVisible = isTotalToChange
            ? last.visible[i]
            : isChangeToSeasonality
            ? i < actualCount
                ? last.visible[i]
                : current.visible[i]
            : !current.visible || current.visible[i];
        if (!isVisible) continue;

        fill(255);
        circle(p.x, p.y, DOT_SIZE);
    }

    // Beschriftungen des alten und neuen Layouts überblenden.
    drawLabels(last.labels, 1 - particleProgress);
    drawLabels(current.labels, particleProgress);
    drawInfo(lastLayoutName, 1 - particleProgress);
    drawInfo(currentLayoutName, particleProgress);
}

function drawLabels(labels, alpha) {
    // Labels mit dem übergebenen Alpha-Wert zeichnen.
    if (alpha <= 0) return;
    fill(255, alpha * 255);
    textAlign(CENTER, CENTER);
    textSize(12);
    labels.forEach((l) => text(l.text, l.x, l.y));
}

function drawInfo(layoutName, alpha) {
    // Info-Text fest an der Canvas statt an der HTML-Section positionieren.
    if (alpha <= 0) return;

    const topic = INFO_TOPICS[layoutName];
    if (!topic) return;

    fill(255, alpha * 255);
    textAlign(CENTER, TOP);
    textSize(18);
    textLeading(24);
    text(
        getTopicInfo(data, topic),
        width / 2,
        height * 0.08,
        width * 0.8
    );
}

function windowResized() {
    // Bei einer Größenänderung werden Canvas und Zielpositionen neu berechnet.
    resizeCanvas(windowWidth, windowHeight);
    buildLayouts();
}

function gradientbg() {
    // Hintergrundfarbe abhängig vom globalen Scrollfortschritt interpolieren.
    // Startfarbe
    const color1 = color('#F77F1B');

    // Endfarbe
    const color2 = color('#873100');

    // Aktuelle Position innerhalb aller Sections bestimmen.
    const sectionCount = state.layoutNames.length;


    // Fortschritt auf den Bereich 0 bis 1 begrenzen.
    const pageProgress = sectionCount <= 1
        ? 0
        : constrain(Math.max(0, state.currentIndex - 1 + state.progress) / (sectionCount - 1), 0, 1);


    const currentColor = lerpColor(color1, color2, pageProgress);

    drawingContext.fillStyle = String(currentColor);

    // Vollflächiges Rechteck als Hintergrund zeichnen.
    noStroke();
    rect(width / 2, height / 2, width, height);
}