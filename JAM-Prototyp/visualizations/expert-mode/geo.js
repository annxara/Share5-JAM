// Variable für Farbe
let fill_color;
let fill_color_highlight;
let background_color;

// Variablen für Daten
let data_geo = [];
let current_data = [];

// Variablen für Kantonsgrenzen
let kantonsgrenzen;
let cantonPolygons = [];

// Momentan angezeigtes Jahr --> beim Laden
let current_year = 2025;


let projection;

// Array um Kreise darin zu speichern
let circles_geo = [];


// Annordnen der Kreise (Abstand)
let step = 13;

// Array für Kreisgrössen
let geo_size = [5.00, 5.75, 6.60, 7.59, 8.72, 10.02, 11.52, 13.24, 15.22, 17.49, 20.10, 23.10, 26.53, 30.48, 35.02, 40.00];

// Variablen für Slider
let slider;
let current;
let sliderMinLabel;
let sliderMaxLabel;
let sliderValueLabel;

// Für Buttons-Interaktion
let kantonsgrenzen_isvisible = false;
let selected_canton = false;

// Text für Legende
let legende_text_geo_1 = "Umso grösser der Kreis, desto mehr"
let legende_text_geo_2 = "Fälle pro 100'000 EinwohnerInnen"






async function setup() {
    // Um Canvas im html zu platzieren
    let canvas_geo = createCanvas(windowWidth, windowHeight);
    canvas_geo.parent("canvas-container-geo");

    // Einstellen der Modi
    textAlign(CENTER);
    rectMode(CENTER);
    angleMode(DEGREES);

    // Farben
    fill_color = color("#181717");
    fill_color_highlight = color("#F77F1B");
    background_color = color(255);

    // Hereinladen der Schriftarten
    fontStyleBold = "sans-serif";
    fontStyleRegular = "sans-serif";

    textFont(fontStyleRegular);

    // ---------------------------- Daten --------------------------------
    // Hereinladen der Daten
    data_geo = await d3.dsv(
        ",",
        "../../data/data_salmonellosis_georegion.csv",
        d3.autoType
    );

    current_data = data_geo.filter(
        d => d.temporal == current_year
    );

    // Hereinladen des Geojson für Kantonsgrenzen
    kantonsgrenzen = await loadJSON("../../data/Kantonsgrenzen.geojson");

    projection = d3
        .geoMercator()
        .center([8.23, 46.8])
        .translate([width / 2, height / 2])
        .scale(width * 8);

    // ---------------------------- Visualisierung--------------------------------    
    buildCantonPolygons();
    // Sortieren der Kantone nach Grösse (von klein nach gross --> kleinere Kantone werden zuerst erkannt)
    cantonPolygons.sort(
        (a, b) =>
            polygonArea(a.polygon) -
            polygonArea(b.polygon)
    );
    createCircleGrid();

    // ---------------------------- Slider --------------------------------
    // Erstellen des Sliders
    slider = createSlider(2013, 2025, current_year); //(min, max Wert)
    slider.addClass("slider");
    slider.size(width / 4);
    slider.position(width / 2 - slider.width / 2, height - 100);

    // Beschriftung des Sliders
    sliderMinLabel = createDiv("2013");
    sliderMinLabel.addClass("slider-label");
    sliderMinLabel.position(slider.x - 50, slider.y - 7);

    sliderMaxLabel = createDiv("2025");
    sliderMaxLabel.addClass("slider-label");
    sliderMaxLabel.position(slider.x + slider.width + 20, slider.y - 7);

    sliderValueLabel = createDiv("Jahr: " + current_year);
    sliderValueLabel.addClass("slider-value-label");
    sliderValueLabel.position(width / 2, height - 130);
    slider.input(updateCurrentYear);

    updateLayout();

    // ---------------------------- Buttons --------------------------------
    // Einblenden der Kantonsgrenzen
    // !!! Id ohne . vorne
    document.getElementById("btn-kantonsgrenze").addEventListener("click", () => {
        if (kantonsgrenzen_isvisible) {
            kantonsgrenzen_isvisible = false;
            document.getElementById("btn-kantonsgrenze").classList.remove("active");
        } else {
            kantonsgrenzen_isvisible = true;
            document.getElementById("btn-kantonsgrenze").classList.add("active");
        }
    })

    document.querySelectorAll(".btn-kantone").forEach(btn => {

        btn.addEventListener("click", () => {

            if (selected_canton === btn.getAttribute("canton")) {
                selected_canton = false;
                btn.classList.remove("active");
            } else {

                document.querySelectorAll(".btn-kantone").forEach(b =>
                    b.classList.remove("active")
                );

                selected_canton = btn.getAttribute("canton");
                btn.classList.add("active");
            }
        });
    });

}

function draw() {
    background(background_color);

    if (!current_data || !kantonsgrenzen) return;

    // Wenn Daten nicht geladen abbrechen
    if (!kantonsgrenzen) return;

    noStroke();

    // ---------------------------- Fälle pro 100'000 EinwohnerInnen --------------------------------
    // Zeichnen der Kreise
    for (let i = 0; i < circles_geo.length; i++) {
        let circle = circles_geo[i];
        // Daten des momentan Kreises auslesen
        let current_canton_circle = current_data.find(
            d => d.georegion == circle.canton
        );
        if (!current_canton_circle) continue;
        // für Button --> Wenn ausgewählter Kanton übereinstimmt wird eingefärbt
        if (selected_canton) {
            if (selected_canton == current_canton_circle.georegion) {
                noStroke();
                fill(fill_color_highlight);
                // Text für Anzahl Fälle des ausgewählten Kantons
                push();
                textSize(14);
                textFont(fontStyleBold);
                textAlign(LEFT, CENTER);
                text(current_canton_circle.georegion + ": " + round(current_canton_circle.incValue) + " Fälle", 20, height / 4*3);
                pop();
            } else {
                noStroke();
                fill(fill_color);
            }
        } else {
            fill(fill_color);
        }

        // Herauslesen der Kreisgrösse anhand der Kategorie
        circle_size = geo_size[current_canton_circle.incValue_cat];

        // Zeichnen Kreis
        ellipse(circle.x, circle.y, circle_size, circle_size);

        // ---------------------------- Legende --------------------------------
        if (i == 0) {
            push();
            fill(fill_color);
            let this_circle_size = 17.5;
            let rect_width = textWidth(legende_text_geo_1);
            translate(circle.x, circle.y - 15);

            textAlign(LEFT);
            textSize(14);
            text(legende_text_geo_1, 90, -this_circle_size * 3);
            text(legende_text_geo_2, 90, -this_circle_size * 2);
            rect(rect_width - 10, -this_circle_size * 1.5, rect_width + 70, 1);
            push();
            rotate(-45);
            rect( this_circle_size * 2, this_circle_size, rect_width / 5, 1);
            pop();

            pop();
        } else {
            noStroke();
        }
    }

    // ---------------------------- Button --> Kantonsgrenze --------------------------------
    if (kantonsgrenzen_isvisible) {
        fill(255, 150);
        //noFill();
        stroke(fill_color);
        strokeWeight(2);
        drawCantons();
    }
}

// ---------------------------- Kantonsgrenzen --------------------------------
function buildCantonPolygons() {
    cantonPolygons = [];
    for (let feature of kantonsgrenzen.features) {
        // Herauslesen des Kantons
        let canton = feature.properties.KTKZ;

        // Je nach geometry.type
        if (feature.geometry.type === "Polygon") {
            for (let ring of feature.geometry.coordinates) {
                let projectedRing = ring.map(coord =>
                    projection(coord)
                );
                // Kanton wird mit Polygon gespeichert
                cantonPolygons.push({
                    canton: canton,
                    polygon: projectedRing
                });
            }
        }

        if (feature.geometry.type === "MultiPolygon") {
            for (let poly of feature.geometry.coordinates) {
                for (let ring of poly) {
                    let projectedRing = ring.map(coord =>
                        projection(coord)
                    );
                    cantonPolygons.push({
                        canton: canton,
                        polygon: projectedRing
                    });
                }
            }
        }
    }
}

// ---------------------------- Kreise --------------------------------
function createCircleGrid() {
    circles_geo = [];
    let x = 120;
    let y = 0;

    // Anzahl gezeichneter Kreise
    let circle_count = ((width - 120) / step) * (height / step);

    for (let i = 0; i < circle_count; i++) {
        // Kanton des Ursprungpunktes wird herausgelesen
        let canton = getCantonAt(x, y);

        // Wenn es einen Kanton gibt, wird dieser zusammen mit Position gepushed
        if (canton) {
            circles_geo.push({ x: x, y: y, canton: canton });
        }

        x += step;

        if (x > width - 120) {
            y += step;
            x = 120;
        }
    }
}

// ---------------------------- Kanton an Punkt auslesen --------------------------------
// Gibt den Kanton des Punktes zurück
function getCantonAt(x, y) {

    for (let polyData of cantonPolygons) {

        if (pointInPolygon(x, y, polyData.polygon)) {
            return polyData.canton;
        }
    }
    return null;
}

// ---------------------------- Überprüfung der Punkte --------------------------------
// Überprüft, ob Punkt sich in Polygon befindet oder nicht
function pointInPolygon(px, py, polygon) {

    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {

        let xi = polygon[i][0];
        let yi = polygon[i][1];

        let xj = polygon[j][0];
        let yj = polygon[j][1];

        let intersect = ((yi > py) != (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}

// Berechnen der Flächengrösse --> um AI & AR zu bevorzugen (vor St. Gallen)
function polygonArea(poly) {
    let area = 0;

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        area +=
            (poly[j][0] + poly[i][0]) *
            (poly[j][1] - poly[i][1]);
    }

    return Math.abs(area);
}

// ---------------------------- Zeichnen der Kantongrenzen --------------------------------
function drawCantons() {
    for (let i = 0; i < kantonsgrenzen.features.length; i++) {
        let feature = kantonsgrenzen.features[i];


        if (feature.geometry.type === "Polygon") {
            drawPolygon(feature);
        }

        if (feature.geometry.type === "MultiPolygon") {
            drawMultiPolygon(feature);
        }
    }
}

// ---------------------------- Falls Polygon --------------------------------
function drawPolygon(feature) {
    let rings = feature.geometry.coordinates;
    for (let r = 0; r < rings.length; r++) {
        let ring = rings[r];
        beginShape();
        for (let i = 0; i < ring.length; i++) {
            let coord = ring[i]; let coords = projection(coord);
            vertex(coords[0], coords[1]);
        }
        endShape(CLOSE);
    }
}

// ---------------------------- Falls multiPolygon --------------------------------
function drawMultiPolygon(feature) {
    for (let i = 0; i < feature.geometry.coordinates.length; i++) {

        let polygon = feature.geometry.coordinates[i];

        for (let j = 0; j < polygon.length; j++) {

            let ring = polygon[j];

            beginShape();

            for (let k = 0; k < ring.length; k++) {

                let coord = ring[k];
                let coords = projection(coord);

                vertex(coords[0], coords[1]);
            }
            endShape(CLOSE);
        }
    }
}


// ---------------------------- Slider Funktion --------------------------------
//current_year an Slider anpassen
function updateCurrentYear() {
    current_year = slider.value();
    sliderValueLabel.html("Jahr: " + current_year);

    current_data = data_geo.filter(
        d => d.temporal == current_year
    );
}

// Positionen, die von der Breite/Höhe abhängen (Monatsraster, Slider)
function updateLayout() {
    month_step = width / 15;
    if (!slider) return;

    slider.size(month_step * 4);
    slider.position(width / 2 - slider.width / 2, height - 100);
    sliderMinLabel.position(slider.x - 50, slider.y - 7);
    sliderMaxLabel.position(slider.x + slider.width + 20, slider.y - 7);
    sliderValueLabel.position(width / 2, height - 130);
}

// p5 ruft das auf, sobald der iframe seine Grösse ändert (also auch beim Einblenden)
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    projection
        .translate([width / 2, height / 2])
        .scale(width * 8);
    buildCantonPolygons();
    cantonPolygons.sort(
        (a, b) =>
            polygonArea(a.polygon) -
            polygonArea(b.polygon)
    );
    createCircleGrid();
    updateLayout();
}
