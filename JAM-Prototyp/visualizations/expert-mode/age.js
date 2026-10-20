let people = []; // Personen, gruppiert nach Altersgruppe

let age_data;
let current_data_age;

let current_year = 2025;
let corner_radius = 100;

// Runtersetzen der Visualisierung
let visualization_offset_y = 50;

let dot_size = 20;
let fill_color;
let fill_color_highlight;

let dots = [];

// Text für Legende
let legende_text_age_1 = "Altersgruppe"
let legende_text_age_2 = "Anzahl Fälle pro"
let legende_text_age_3 = "100'000 EinwohnerInnen"
let legende_text_age_4 = "Eine Person"

async function setup() {
    let canvas_age = createCanvas(windowWidth, windowHeight);
    canvas_age.parent("canvas-container-age");

    fill_color = color("#181717");
    fill_colo_highlight = color("#F77F1B")

    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    angleMode(DEGREES);

    fontStyleRegular = "sans-serif";
    fontStyleBold = "sans-serif";

    textFont(fontStyleRegular);

    // ---------------------------- Daten --------------------------------
    data_age = await d3.dsv(
        ",",
        "../../data/data_salmonellosis_age.csv",
        d3.autoType
    );

    current_data_age = data_age.filter(
        d => d.temporal == current_year
    );

    generateDots();

    // ---------------------------- Buttons --------------------------------
    let ageSortButtonIds = ["btn-age-anzahl-auf", "btn-age-anzahl-ab", "btn-age-alter-ab", "btn-age-alter-auf"];

    // Klick-Detecter
    document.getElementById("btn-age-anzahl-auf").addEventListener("click", () => {
        current_data_age.sort((a, b) => a.incValue_rounded - b.incValue_rounded);
        generateDots();
        setActiveAgeSortButton("btn-age-anzahl-auf");
    })

    document.getElementById("btn-age-anzahl-ab").addEventListener("click", () => {
        current_data_age.sort((a, b) => b.incValue_rounded - a.incValue_rounded);
        generateDots();
        setActiveAgeSortButton("btn-age-anzahl-ab");
    })

    document.getElementById("btn-age-alter-ab").addEventListener("click", () => {
        current_data_age.sort((a, b) => b.index - a.index);
        generateDots();
        setActiveAgeSortButton("btn-age-alter-ab");
    })

    document.getElementById("btn-age-alter-auf").addEventListener("click", () => {
        current_data_age.sort((a, b) => a.index - b.index);
        generateDots();
        setActiveAgeSortButton("btn-age-alter-auf");
    })

    // Alle anderen Buttons verlieren den Aktiv status
    function setActiveAgeSortButton(activeButtonId) {
        ageSortButtonIds.forEach(buttonId => {
            document.getElementById(buttonId).classList.toggle(
                "active",
                buttonId === activeButtonId
            );
        });
    }


}



function draw() {
    background(245);

    if (!current_data_age) return;

    let startX = width / 7;
    let step = width / 7;
    let gap = min(20, width / 14);

    let width_age = max(1, width / 7 - gap);
    let height_age = max(1, height / 2);

    let x_age_rect = startX + width_age / 2;
    let y_age_rect = height / 2 + visualization_offset_y;

    // ---------------------------- Zeichnen der Viz --------------------------------
    // Dots und Formen
    for (let i = 0; i < current_data_age.length; i++) {
        stroke(fill_color);
        strokeWeight(1);
        noFill();
        let personen = current_data_age[i].incValue_rounded;
        let altersgruppe = current_data_age[i].agegroup;

        // Formen
        rect(x_age_rect, y_age_rect, width_age, height_age, getCornerRadius(width_age, height_age));

        // Beschriftung
        fill(fill_color);
        noStroke();
        textFont(fontStyleBold);
        textSize(12);
        text(altersgruppe, x_age_rect, y_age_rect - (height_age / 2) - 20);
        textSize(20);
        text(personen, x_age_rect, y_age_rect + (height_age / 2) + 20);

        // Dots
        for (let dot of dots[i]) {
            noFill();
            stroke(fill_color);
            ellipse(dot.x, dot.y, dot_size, dot_size);
        }

        // Legende
        if (i == 0) {
            push();
            fill(fill_color);
            noStroke();

            let rect_width = textWidth(legende_text_age_1);
            let rect_width_2 = textWidth(legende_text_age_3);
            
            textFont(fontStyleRegular)
            textAlign(LEFT);
            textSize(12);

            // Legende zu Altersgruppen
            text(legende_text_age_1, startX - 82, y_age_rect - height_age/2 - 68);
            rect(startX - 20, y_age_rect - height_age/2 - 54, rect_width + 20, 1);

            push();
            translate(startX + 54, y_age_rect - height_age/2 - 45)
            rotate(45);
            rect( 0, 0, rect_width / 5, 1);
            pop();

            // Legende zu Anzahl
            text(legende_text_age_2, startX - 122, y_age_rect + height_age/2 + 47);
            text(legende_text_age_3, startX - 122, y_age_rect + height_age/2 + 62);
            rect(startX - 42, y_age_rect + height_age/2 + 72, rect_width_2 - 54, 1);

            push();
            translate(startX + 54, y_age_rect + height_age/2 + 57)
            rotate(-45);
            rect( 0, 0, rect_width / 3 + 5, 1);
            pop();
            pop();
        }

        x_age_rect += step;
    }
}

// ---------------------------- Dots Koordinaten --------------------------------
function generateDots() {

    dots = [];

    let startX = width / 7;
    let step = width / 7;
    let gap = min(20, width / 14);

    let width_age = max(1, width / 7 - gap);
    let height_age = max(1, height / 2);

    let x_age_rect = startX + width_age / 2;
    let y_age_rect = height / 2 + visualization_offset_y;

    // Tatsächlich gezeichneter Radius, identisch zu draw()
    const r = getCornerRadius(width_age, height_age);

    const maxAttempts = 500;

    for (let i = 0; i < current_data_age.length; i++) {

        let people = current_data_age[i].incValue_rounded;

        let groupDots = [];

        for (let j = 0; j < people; j++) {

            let x_people, y_people;
            let attempts = 0;
            let placed = false;

            while (attempts < maxAttempts && !placed) {
                attempts++;

                x_people = random(
                    x_age_rect - width_age / 2,
                    x_age_rect + width_age / 2
                );

                y_people = random(
                    y_age_rect - height_age / 2,
                    y_age_rect + height_age / 2
                );

                // Muss innerhalb des abgerundeten Rechtecks liegen
                if (!pointInRoundedRect(
                    x_people,
                    y_people,
                    x_age_rect,
                    y_age_rect,
                    width_age,
                    height_age,
                    r
                )) continue;

                // Darf keinen anderen Punkt der Gruppe überlappen
                const overlaps = groupDots.some(dot =>
                    dist(x_people, y_people, dot.x, dot.y) < dot_size * 1.2
                );

                if (!overlaps) placed = true;
            }

            if (!placed) {
                console.warn(
                    "Gruppe " + i + " ist voll, nur " + j
                    + " von " + people + " Punkten platziert."
                );
                break;
            }

            groupDots.push({
                x: x_people,
                y: y_people
            });
        }

        dots.push(groupDots);

        x_age_rect += step;
    }
}

// ---------------------------- Platzierung Dots --------------------------------
function pointInRoundedRect(px, py, cx, cy, w, h, r) {
    const margin = dot_size / 2 + 5;       // halber Punkt + etwas Luft zur Linie
    const hw = w / 2 - margin - 5;             // halbe Breite des erlaubten Bereichs
    const hh = h / 2 - margin;
    const rr = max(0, r - margin);         // Radius des erlaubten Bereichs

    const dx = abs(px - cx);
    const dy = abs(py - cy);

    if (dx > hw || dy > hh) return false;

    // Mittelpunkt des Eckkreises (relativ zur Mitte)
    const ix = hw - rr;
    const iy = hh - rr;

    // Nicht im Eckbereich: sicher innen
    if (dx <= ix || dy <= iy) return true;

    // Im Eckbereich: Abstand zum Eckkreis-Mittelpunkt prüfen
    return dist(dx, dy, ix, iy) <= rr;
}

function getCornerRadius(w, h) {
    return max(0, min(corner_radius, w / 2, h / 2));
}



// p5 ruft das auf, sobald der iframe seine Grösse ändert (also auch beim Einblenden)
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (current_data_age && width > 0 && height > 0) {
        generateDots();
    }
}