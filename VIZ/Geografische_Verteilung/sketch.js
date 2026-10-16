

let data_geo = [];
let current_data = [];

let kantonsgrenzen;
let cantonPolygons = [];

let current_year = 2025;

let projection

let circles_geo = [];


let geo_size = [5.00, 5.75, 6.60, 7.59, 8.72, 10.02, 11.52, 13.24, 15.22, 17.49, 20.10, 23.10, 26.53, 30.48, 35.02, 40.00];
let circle_size = 10;

// Variablen für Slider
let slider;
let current;
let sliderMinLabel;
let sliderMaxLabel;
let sliderValueLabel;

let kantonsgrenzen_isvisible = false;
let selected_canton = false;




async function setup() {
    let canvas_geo = createCanvas(windowWidth, windowHeight);
    canvas_geo.parent("canvas-container-geo");

    textAlign(CENTER);

    // Hereinladen der Schriftarten
    fontStyleBold = await loadFont("/assets/NotoSans-Bold.ttf");
    fontStyleRegular = await loadFont("/assets/NotoSans-Regular.ttf");

    textFont(fontStyleRegular)

    data_geo = await d3.dsv(",", "/data/data_salmonellosis_georegion.csv", d3.autoType);

    current_data = data_geo.filter(
        d => d.temporal == current_year
    );

    // Hereinladen des Geojson für Kantonsgrenzen
    kantonsgrenzen = await loadJSON("/data/Kantonsgrenzen.geojson");

    console.log(kantonsgrenzen);

    projection = d3
        .geoMercator()
        .center([8.23, 46.8])
        .translate([width / 2, height / 2])
        .scale(width * 9);

    buildCantonPolygons();
    createCircleGrid();


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

    // Einblenden der Kantonsgrenzen
    // !!! Id ohne . vorne
    document.getElementById("btn-kantonsgrenze").addEventListener("click", () => {
        if (kantonsgrenzen_isvisible) {
            kantonsgrenzen_isvisible = false;
        } else {
            kantonsgrenzen_isvisible = true;
        }
    })

    document.querySelectorAll(".btn-kantone").forEach(btn => {

        btn.addEventListener("click", () => {

            if (selected_canton){
                selected_canton = false;
            } else{
                selected_canton = btn.getAttribute("canton");
            }

            console.log(selected_canton); // AG
        });

    });


}

function draw() {

    background(255);


    if (!kantonsgrenzen) return;


    if (kantonsgrenzen_isvisible) {
        drawCantons();
    }



    noStroke();

    for (let circle of circles_geo) {
        let current_canton_circle = current_data.find(
            d => d.georegion == circle.canton
        );

        if(selected_canton){
            if (selected_canton == current_canton_circle.georegion){
                fill("red");
            } else {
                fill(0);
            }
        } else {
            fill(0);
        }

        if (current_canton_circle) {
            circle_size = geo_size[current_canton_circle.incValue_cat];
        }

        ellipse(circle.x, circle.y, circle_size, circle_size);
    }


}

// Erzeugt Kantonsgrenzen
function buildCantonPolygons() {

    cantonPolygons = [];

    for (let feature of kantonsgrenzen.features) {

        let canton = feature.properties.KTKZ;

        if (feature.geometry.type === "Polygon") {

            for (let ring of feature.geometry.coordinates) {

                let projectedRing = ring.map(coord =>
                    projection(coord)
                );

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

// Erzeugt die Punkte
function createCircleGrid() {

    circles_geo = [];

    let step = 15;

    let x = 120;
    let y = 0;

    let circle_count = ((width - 120) / step) * (height / step);

    for (let i = 0; i < circle_count; i++) {

        let canton = getCantonAt(x, y);
        

        if (canton) {
            circles_geo.push({ x: x, y: y, canton: canton });
        }

        x += step;

        if (x > width - 120) {
            y += step;
            x = 120;
        }
    }

    console.log(circles_geo);
}


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


// Gibt den Kanton des Punktes zurück
function getCantonAt(x, y) {

    for (let polyData of cantonPolygons) {

        if (pointInPolygon(x, y, polyData.polygon)) {
            return polyData.canton;
        }
    }
    return null;
}


function drawCantons() {
    stroke(0);
    strokeWeight(1);
    noFill();


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


// Falls Typ des Objekts Mutliple Polygon
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

//current_year an Slider anpassen
function updateCurrentYear() {
    current_year = slider.value();
    sliderValueLabel.html("Jahr: " + current_year);

    current_data = data_geo.filter(
        d => d.temporal == current_year
    );
}
