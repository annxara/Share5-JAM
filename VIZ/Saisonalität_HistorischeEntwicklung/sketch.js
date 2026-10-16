// Array für Daten
let data_historisch = [];

// Kreisgrössen für Saisonalität
let saisonalitaet_size = [5, 10, 20, 40];

// Momentan ausgewähltes Jahr
let current_year = 2025;

// Variablen für aufteilung der Daten
let current_data;
let max_data;
let max_100;
let median_data;

// Array für Beschriftung der Monate
let months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// Aufteilung des Fensters
let month_step;

// Variablen für Slider
let slider;
let current;
let sliderMinLabel;
let sliderMaxLabel;
let sliderValueLabel;

// Variable für Farbe
let fill_color;
let background_color;

let mean_isvisible = false;
let aktuell_isvisible = false;
let historisch_isvisible = true;
let sais_isvisible = true;
let pos_y_historisch;


async function setup() {
    // Einbetten der Canvas im index.html
    let canvas_sais = createCanvas(windowWidth, windowHeight);
    canvas_sais.parent("canvas-container-sais");

    // Umstellen der Modi
    rectMode(CENTER);
    textAlign(CENTER);

    // Definieren der Farbe
    fill_color = color("red");
    background_color = color(220);

    // Berechnen der Abschnitte des Canvas für Monate
    month_step = width / 15;

    // Hereinladen der Schriftarten
    fontStyleBold = await loadFont("/assets/NotoSans-Bold.ttf");
    fontStyleRegular = await loadFont("/assets/NotoSans-Regular.ttf");

    // Daten laden und die Gesamtzahl der Partikel bestimmen.
    data_historisch = await d3.dsv(',', '/data/data_salmonellosis_historisch.csv', d3.autoType);


    // Herauslesen des Höchsten Wertes, um Grafik zu skalieren
    max_data = d3.max(data_historisch, d => d.value);

    // Berechnung der Anzahl 100er Abschnitte
    max_100 = ceil(max_data / 100);

    // Auslesen des aktuell angezeigten Jahres
    current_data = data_historisch.filter(
        d => d.year == current_year
    );

    data_2026 = data_historisch.filter(
        d => d.year == "2026"
    );

    console.log(data_2026);

    // Herauslesen der Medianwerte
    median_data = data_historisch.filter(
        d => d.valueCategory == "median"
    );

    // Erstellen des Sliders
    slider = createSlider(2013, 2026, current_year); //(min, max Wert)
    slider.addClass("slider");
    slider.size(month_step * 4);
    slider.position(width / 2 - slider.width / 2, height - 100);

    // Beschriftung des Sliders
    sliderMinLabel = createDiv("2013");
    sliderMinLabel.addClass("slider-label");
    sliderMinLabel.position(slider.x - 50, slider.y - 7);

    sliderMaxLabel = createDiv("2026");
    sliderMaxLabel.addClass("slider-label");
    sliderMaxLabel.position(slider.x + slider.width + 20, slider.y - 7);

    sliderValueLabel = createDiv("Jahr: " + current_year);
    sliderValueLabel.addClass("slider-value-label");
    sliderValueLabel.position(width / 2, height - 130);
    slider.input(updateCurrentYear);

    document.getElementById("btn-sais-mean").addEventListener("click", () => {
        if (mean_isvisible) {
            mean_isvisible = false;
            document.getElementById("btn-sais-mean").classList.remove("active");
        } else {
            mean_isvisible = true;
            document.getElementById("btn-sais-mean").classList.add("active");
        }

        
    })

    document.getElementById("btn-sais-sais").addEventListener("click", () => {
        if (historisch_isvisible) {
            historisch_isvisible = false;
            sais_isvisible = true;
            document.getElementById("btn-sais-sais").classList.add("active");
            document.getElementById("btn-sais-historisch").classList.remove("active");
        } else {
            historisch_isvisible = true;
             document.getElementById("btn-sais-sais").classList.add("active");
        }
    })

    document.getElementById("btn-sais-2026").addEventListener("click", () => {
        if (aktuell_isvisible) {
            aktuell_isvisible = false;
            document.getElementById("btn-sais-2026").classList.remove("active");
        } else {
            aktuell_isvisible = true;
            document.getElementById("btn-sais-2026").classList.add("active");
        }
    })

    document.getElementById("btn-sais-historisch").addEventListener("click", () => {
        if (sais_isvisible && !historisch_isvisible) {
            sais_isvisible = true;
            document.getElementById("btn-sais-historisch").classList.remove("active");
            
        } else if(sais_isvisible){
            sais_isvisible = false;
            document.getElementById("btn-sais-historisch").classList.add("active");
            document.getElementById("btn-sais-sais").classList.remove("active");
        } else {
            sais_isvisible = true;
            document.getElementById("btn-sais-historisch").classList.remove("active");
            document.getElementById("btn-sais-sais").classList.add("active");
        }
    })
}

function draw() {
    // Basiseinstellungen
    background(background_color);
    noStroke();
    fill(fill_color);
    textFont(fontStyleRegular);
    textAlign(RIGHT, CENTER);



    // Linienhöhe der Monatsunterteilung
    let line_height = height / 2;

    // Unterteilung der Linie in 100er Schritten (waagrecht)
    let step_100 = line_height / max_100;

    // Berechnung des Startpunktes der Waagrechten Linien für korrektes Darstellen der Daten
    let start_100 = height / 2 + line_height / 2;

    // Berechnen des Wertes wie viele Pixel = 1 Fall ist
    let historisch_height_1 = step_100 * max_100 / (max_100 * 100);


    // Linien für Monats-Abtrennung
    for (i = 0; i < 13; i++) {
        let x = month_step * (i + 1) + month_step / 2;
        rect(x, height / 2, 1, line_height);
    }

    // Monatsbeschriftung
    for (i = 0; i < 12; i++) {
        push();
        textAlign(CENTER);
        let x = month_step * (i + 1) + month_step;
        let y = line_height/2 - 10;
        text(months[i], x, y);
        pop();
    }

    // Achsenbeschriftung & Einbelnden Durchschnitt
    if (historisch_isvisible) {
        // Linien für 100er-Einteilung waagrecht
        for (i = 0; i < (max_100 + 1); i++) {
            let y = start_100 - step_100 * i;
            rect(width / 2, y, month_step * 12, 1);
        }

        // Achsenbeschriftung y-Achse
        rect(month_step, height / 2, 1, line_height);
        text("0", month_step - 10, height / 2 + line_height / 2);
        text(max_100 * 100, month_step - 10, height / 2 - line_height / 2 + 10);

        // Anzeigen des Medians
        if (mean_isvisible) {

            push();
            // Linie stricheln --> [Linienlänge, Abstandslänge]
            drawingContext.setLineDash([5, 5]);

            beginShape();
            for (i = 0; i < median_data.length; i++) {

                noFill();
                stroke(fill_color);

                let x = month_step * (i + 1) + month_step;
                let pos_y_historisch = start_100 - (median_data[i].value) * historisch_height_1;

                if(i == 0){
                    text("ø", x - 10, pos_y_historisch);
                }

                vertex(x, pos_y_historisch);
            }
            endShape();

            pop();
        }
    } else {
        // Anzeigen des Medians
        if (mean_isvisible) {
            // Linie stricheln --> [Linienlänge, Abstandslänge]
            
            push();
            // Kreise für Saisonalität & Verbindungen dazwischen
            drawingContext.setLineDash([5, 2]);
            beginShape();
            for (i = 0; i < median_data.length; i++) {
                // Kreise
                stroke(fill_color);
                fill(background_color);
                let size = saisonalitaet_size[median_data[i].value_cat - 1];
                let x = month_step * (i + 1) + month_step;

                if(aktuell_isvisible){
                    pos_y_historisch = height / 2 + line_height/4;
                } else {
                    pos_y_historisch = height / 2 + line_height/4;
                }

                if(i == 0){
                    text("ø", x - 10, pos_y_historisch);
                }
                
                

                ellipse(x, pos_y_historisch, size, size);

                // Verbindung zwischen den Kreisen
                // Add vertices.

                vertex(x, pos_y_historisch);
            }
            endShape();

            pop();
            
        }
    }




    // Kreise für Saisonalität & Verbindungen dazwischen
    beginShape();
    for (i = 0; i < current_data.length; i++) {
        // Kreise
        noStroke();
        fill(fill_color);
        let size = saisonalitaet_size[current_data[i].value_cat - 1];
        let x = month_step * (i + 1) + month_step;

        if (historisch_isvisible) {
            pos_y_historisch = start_100 - (current_data[i].value) * historisch_height_1;
        } else {
            pos_y_historisch = height / 2;
            
        }
        if(sais_isvisible){
            ellipse(x, pos_y_historisch, size, size);
        }
        
        if(i == 0){
            text(current_data[i].year, x - 10, pos_y_historisch);
        }

        push();
        textAlign(CENTER);
        let x_cases = month_step * (i + 1) + month_step;
        let y_cases = line_height / 2 + 15;
        text(current_data[i].value, x_cases, y_cases);
        pop();

        // Verbindung zwischen den Kreisen
        noFill();
        stroke(fill_color);
        // Add vertices.

        vertex(x, pos_y_historisch);
    }
    endShape();

    if (aktuell_isvisible) {
        beginShape();
        for (i = 0; i < data_2026.length; i++) {
            // Kreise
            noStroke();
            fill(fill_color);
            let size = saisonalitaet_size[data_2026[i].value_cat - 1];
            let x = month_step * (i + 1) + month_step;

            if (historisch_isvisible) {
                pos_y_historisch = start_100 - (data_2026[i].value) * historisch_height_1;
            } else {
                
                pos_y_historisch = height/2 - line_height/4
                
            }

            if(i == 0){
                text(data_2026[i].year, x - 10, pos_y_historisch);
            }

            ellipse(x, pos_y_historisch, size, size);

            // Verbindung zwischen den Kreisen
            noFill();
            stroke(fill_color);
            // Add vertices.

            vertex(x, pos_y_historisch);
        }
        endShape();
    }

}

//current_year an Slider anpassen
function updateCurrentYear() {
    current_year = slider.value();
    sliderValueLabel.html("Jahr: " + current_year);

    current_data = data_historisch.filter(
        d => d.year == current_year
    );
}


