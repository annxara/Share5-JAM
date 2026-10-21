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
    const canvas = createCanvas(scrollyWidth(), scrollyHeight());
    canvas.parent('canvas-container');
    randomSeed(1);      // stabile Zuordnung, wenn random/shuffle verwendet wird

    // Zielpositionen aller Layouts berechnen.
    buildLayouts();

    // Startpositionen zufällig verteilen; die Layouts übernehmen danach die Zielpositionen.
    particles = CASES.map(() => ({
        x: random(width),
        y: random(height)
    }));
}


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
        let layoutData;
        if (name === 'total') {
            layoutData = actualCount;
        } else if (name === 'change') {
            layoutData = getChangeText(data);
        } else if (name === 'seasonality') {
            layoutData = getSeasonalityColumns(data);
        } else if (name === 'trend') {
            layoutData = getTrendDirection(data);
        }

        let visibleCount;
        if (name === 'total') {
            visibleCount = actualCount;
        } else if (name === 'change') {
            visibleCount = getChangeParticleCount(data);
        }

        let secondaryCount;
        if (name === 'change' || name === 'seasonality') {
            secondaryCount = actualCount;
        }
        // Layouts liefern Positionen, Labels und bei Bedarf eine Sichtbarkeitsliste.
        return layoutFunction(CASES, area, layoutData, visibleCount, secondaryCount);
    });

    // Beim Wechsel von change zu seasonality bleiben Saisonalitäts-Partikel unten,
    // während die überschüssigen Aktualitäts-Partikel nach oben wegfliegen.
    intermediateLayouts = {
        offscreen: Layouts.changeDeparture(CASES, area,getParticleCount(data)),
    };

}

function draw() {
    // Hintergrund und aktive Layouts für den aktuellen Scrollzustand zeichnen.
    gradientbg();
    if (!computedLayouts.length || !particles.length) return;

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

    // Die Hintergrundzahl liegt unter den Partikeln und wird mit dem Layout überblendet.
    drawBackgroundNumber(lastLayoutName, 1 - particleProgress);
    drawBackgroundNumber(currentLayoutName, particleProgress);

    // Jedes Partikel wird zwischen seinem alten und neuen Ziel interpoliert.
    noStroke();
    for (let i = 0; i < particles.length; i++) {
        const from = last.positions[i];
        let to = current.positions[i];
        if (isChangeToSeasonality && i < actualCount) {
            to = intermediateLayouts.offscreen.positions[i];
        }

        const p = particles[i];

        // Sollposition aus dem geglätteten Scrollfortschritt berechnen.
        p.x = lerp(from.x, to.x, particleProgress);
        p.y = lerp(from.y, to.y, particleProgress);

        // Während eines Übergangs gelten je nach Phase unterschiedliche Sichtbarkeiten.
        let isVisible;
        if (isTotalToChange) {
            isVisible = last.visible[i];
        } else if (isChangeToSeasonality) {
            if (i < actualCount) {
                isVisible = last.visible[i];
            } else {
                isVisible = current.visible[i];
            }
        } else {
            isVisible = !current.visible || current.visible[i];
        }
        if (!isVisible) continue;

        drawingContext.fillStyle = '#ffffff';
        drawingContext.beginPath();
        drawingContext.arc(p.x, p.y, DOT_SIZE / 2, 0, Math.PI * 2);
        drawingContext.fill();
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
    textSize(15);
    labels.forEach((l) => text(l.text, l.x, l.y));
}

function drawBackgroundNumber(layoutName, alpha) {
    if (alpha <= 0 || !['total', 'change'].includes(layoutName)) return;

    let number;
    if (layoutName === 'total') {
        number = String(getParticleCount(data));
    } else {
        number = getChangeText(data);
    }
    const area = chartArea();
    const maxWidth = area.w * 0.9;

    noStroke();
    fill(255, alpha * 50)
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(area.h * 0.6);
    if (textWidth(number) > maxWidth) {
        textSize(textSize() * (maxWidth / textWidth(number)));
    }
    text(number, width / 2, height / 2);
}

function drawInfo(layoutName, alpha) {
    if (alpha <= 0) return;

    const topic = INFO_TOPICS[layoutName];
    if (!topic) return;

    let infoY;
    if (layoutName === 'seasonality') {
        infoY = height * 0.5;
    } else {
        infoY = height * 0.77;
    }
    const boxW = width * 0.8;
    const boxH = 120;

    push();
    rectMode(CORNER);                 // Box beginnt links oben, Text wird darin zentriert
    fill(255, alpha * 255);
    noStroke();
    textStyle(NORMAL);
    textAlign(CENTER, CENTER);
    textSize(18);
    textLeading(24);
    text(
        getTopicInfo(data, topic),
        (width - boxW) / 2,           // linker Rand der Box, so dass sie mittig sitzt
        infoY - boxH / 2,
        boxW,
        boxH
    );
    pop();
}

// Responsiveness
function windowResized() {
    // Bei einer Größenänderung werden Canvas und Zielpositionen neu berechnet.
    resizeCanvas(scrollyWidth(), scrollyHeight());
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
    let pageProgress = 0;
    if (sectionCount > 1) {
        pageProgress = constrain(
            Math.max(0, state.currentIndex - 1 + state.progress)
                / (sectionCount - 1),
            0,
            1
        );
    }


    const currentColor = lerpColor(color1, color2, pageProgress);

    // über p5 zeichnen, damit p5s Fill-Cache nicht mit dem Canvas auseinanderläuft
    background(currentColor);
}

function scrollyWidth() {
    const w = document.querySelector('.scrolly-content').clientWidth;
    if (w > 0) {
        return w;
    }

    return window.innerWidth;
}

function scrollyHeight() {
    const introHeight = parseFloat(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--intro-h')
    ) || 0;

    return Math.max(1, windowHeight - introHeight);
}

function chartArea() {
    const w = width - width / 10;
    const h = height - height / 10;
    return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}