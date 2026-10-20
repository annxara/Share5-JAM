// Array für Daten
let data_historisch = [];

// Kreisgrössen für Saisonalität
let saisonalitaet_size = [5, 10, 20, 40];

// Momentan angezeigtes Jahr
let current_year = 2025;

// Variablen für aufteilung der Daten
let current_data;
let max_data;
let max_100;
let median_data;
let current_data_max;
let current_data_max_data;

// Array für Beschriftung der Monate
let months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// Aufteilung des Fensters
let month_step;
// Positionsvaiable
let pos_y_historisch;

// Variablen für Slider
let slider;
let current;
let sliderMinLabel;
let sliderMaxLabel;
let sliderValueLabel;

// Variable für Farbe
let fill_color;
let background_color;
let fill_color_highlight;
let fontStyleRegular = "sans-serif";

// Variablen für Buttons --> Sichtbarkeit der einzelnen Variablen
let mean_isvisible = false;
let aktuell_isvisible = false;
let historisch_isvisible = true;
let sais_isvisible = true;

// Text für Legende
let legende_text_sais_1 = "Umso grösser der Kreis, desto mehr"
let legende_text_sais_2 = "Fälle im Vergleich zum restlichem Jahr"


async function setup() {
    // Einbetten der Canvas im index.html
    let canvas_sais = createCanvas(windowWidth, windowHeight);
    canvas_sais.parent("canvas-container-sais");

    // Umstellen der Modi
    rectMode(CENTER);
    textAlign(CENTER, CENTER);

    // Definieren der Farbe
    fill_color_highlight = color("#F77F1B");
    fill_color = color("#181717");
    background_color = color(255);


    // Berechnen der Abschnitte des Canvas für Monate
    month_step = width / 15;

    // ---------------------------- Daten --------------------------------
    // Daten laden
    data_historisch = await d3.dsv(',', '../../data/data_salmonellosis_historisch.csv', d3.autoType);

    // Herauslesen des Höchsten Wertes, um Grafik zu skalieren
    max_data = d3.max(data_historisch, d => d.value);

    // Herauslesen der restlichen Daten des höchsten Wertes
    max_data_data = data_historisch.filter(
        d => d.value == max_data
    );

    // Berechnung der Anzahl 100er Abschnitte --> für 100er Abschnitte
    max_100 = ceil(max_data / 100);

    // Auslesen der Daten des aktuell angezeigten Jahres
    current_data = data_historisch.filter(
        d => d.year == current_year
    );

    // Auslesen des Aktuell höchsten Wertes
    current_data_max = d3.max(current_data, d => d.value);
    current_data_max_data = current_data.filter(
        d => d.value == current_data_max
    );

    // Auslesen der Daten für das Aktuelle Jahr
    data_2026 = data_historisch.filter(
        d => d.year == "2026"
    );

    // Herauslesen der Medianwerte
    median_data = data_historisch.filter(
        d => d.valueCategory == "median"
    );

    // ---------------------------- Slider --------------------------------
    // Erstellen des Sliders in P5
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

    updateLayout();

    // ---------------------------- Buttons --------------------------------
    // Durchschnitt
    document.getElementById("btn-sais-mean").addEventListener("click", () => {
        if (mean_isvisible) {
            // Wenn Durchschnitt schon eingeblendet wird er ausgeblendet
            mean_isvisible = false;
            document.getElementById("btn-sais-mean").classList.remove("active");
        } else {
            // Wenn Durchschnitt ausgeblendet wird er eingeblendet
            mean_isvisible = true;
            document.getElementById("btn-sais-mean").classList.add("active");
        }
    })

    // Saisonalität
    document.getElementById("btn-sais-sais").addEventListener("click", () => {
        if (sais_isvisible) {
            // Wenn Saisonalität schon eingeblendet wird ausgeblendet
            sais_isvisible = false;
            document.getElementById("btn-sais-sais").classList.remove("active");
        } else if (!sais_isvisible) {
            // Wenn Saisonalität noch nich eingeblendet wird eingeblendet
            sais_isvisible = true;
             document.getElementById("btn-sais-sais").classList.add("active");
        } 
    })

    // Aktuelles Jahr
    document.getElementById("btn-sais-2026").addEventListener("click", () => {
        if (aktuell_isvisible) {
            // Wenn eingeblendet wird ausgeblendet
            aktuell_isvisible = false;
            document.getElementById("btn-sais-2026").classList.remove("active");
        } else {
            // Wenn ausgeblendet wird ausgeblendet
            aktuell_isvisible = true;
            document.getElementById("btn-sais-2026").classList.add("active");
        }
    })

    // Historische Entwicklung
    document.getElementById("btn-sais-historisch").addEventListener("click", () => {
        if (historisch_isvisible){
            // Wenn eingeblendet wird ausgeblendet
            historisch_isvisible = false;
            document.getElementById("btn-sais-historisch").classList.remove("active");
        } else if (!historisch_isvisible){
            // Wenn ausgeblendet wird eingeblendet
            historisch_isvisible = true;
            document.getElementById("btn-sais-historisch").classList.add("active");
        }
    })
}

function draw() {
    // Basiseinstellungen
    background(background_color);

    if (!current_data || !median_data) return;

    noStroke();
    fill(fill_color);
    textFont(fontStyleRegular);
    textAlign(RIGHT, CENTER);

    let linien_dicke_raster = 0.5;

    // Linienhöhe der Monatsunterteilung
    let line_height = height / 2;

    // Unterteilung der Linie in 100er Schritten (waagrecht)
    let step_100 = line_height / max_100;

    // Berechnung des Startpunktes der Waagrechten Linien für korrektes Darstellen der Daten
    let start_100 = height / 2 + line_height / 2;

    // Berechnen des Wertes wie viele Pixel = 1 Fall ist
    let historisch_height_1 = step_100 * max_100 / (max_100 * 100);


    // ---------------------------- Monatsbeschriftung / Abtrennung --------------------------------
    // Linien für Monats-Abtrennung
    // Deckkraft herunterstellen
    fill_color.setAlpha(100);
    fill(fill_color);
    // Zeichnen der Linien
    for (i = 0; i < 13; i++) {
        let x = month_step * (i + 1) + month_step / 2;
        rect(x, height / 2, linien_dicke_raster, line_height);
    }

    fill_color.setAlpha(255);
    fill(fill_color);
    // Monatsbeschriftung
    for (i = 0; i < 12; i++) {
        push();
        textAlign(CENTER);
        let x = month_step * (i + 1) + month_step;
        let y = line_height/2 - 10;
        text(months[i], x, y);
        pop();
    }

    // ---------------------------- 100er Linien / y-Achsenbeschriftung / Median --------------------------------
    // Achsenbeschriftung & Einbelnden Durchschnitt
    if (historisch_isvisible) {
        // Linien für 100er-Einteilung waagrecht
        // Herunterstellen der Deckkraft
        fill_color.setAlpha(100);
        fill(fill_color);
        // Zeichnen der Linien
        for (i = 0; i < (max_100 + 1); i++) {
            let y = start_100 - step_100 * i;
            rect(width / 2, y, month_step * 12, 1);
        }

        fill_color.setAlpha(255);
        fill(fill_color);
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
                stroke(fill_color_highlight);
                strokeWeight(2);
                let x = month_step * (i + 1) + month_step;
                let pos_y_historisch = start_100 - (median_data[i].value) * historisch_height_1;

                // Beschriftung des Graphs
                if(i == 0){
                    text("ø", x - 10, pos_y_historisch);
                }
                // Erstellen der Linie
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
            drawingContext.setLineDash([5, 5]);

            // Zeichnen des Medians der Saisonalität
            beginShape();
            for (i = 0; i < median_data.length; i++) {
                // Kreise
                stroke(fill_color_highlight);
                strokeWeight(2);
                let size = saisonalitaet_size[median_data[i].value_cat - 1];
                let x = month_step * (i + 1) + month_step;

                // Positionierung
                if(aktuell_isvisible){
                    pos_y_historisch = height / 2 + line_height/4;
                } else {
                    pos_y_historisch = height / 2 + line_height/4;
                }
                if(i == 0){
                    text("ø", x - 10, pos_y_historisch);
                }

                // Zeichnen Ellipse
                fill("white");
                ellipse(x, pos_y_historisch, size, size);

                noFill();
                // Verbindung zwischen den Kreisen
                vertex(x, pos_y_historisch);
            }
            endShape();
            pop();
        }
    }



    // ---------------------------- Zeichnen der Kreise & Verbindungen --------------------------------
    // Kreise für Saisonalität & Verbindungen dazwischen
    beginShape();
    for (i = 0; i < current_data.length; i++) {
        noStroke();
        fill(fill_color);
        // Grösse anhand der Kategorie
        let size = saisonalitaet_size[current_data[i].value_cat - 1];
        let x = month_step * (i + 1) + month_step;

        // Positionierung
        if (historisch_isvisible) {
            pos_y_historisch = start_100 - (current_data[i].value) * historisch_height_1;
        } else {
            pos_y_historisch = height / 2;
            
        }
        // Wenn Saisonalität sichtbar werden Kreise gezeichnet
        if(sais_isvisible){
            // ---------------------------- Saisonalität --------------------------------
            ellipse(x, pos_y_historisch, size, size);

            // ---------------------------- Legende --------------------------------
            // Legende für Saisonalität --> immer bei oberstem Punkt
            if(i == 1){
                push();
                let rect_width = textWidth(legende_text_sais_1);
                let legende_x_sais = month_step * (current_data_max_data[0].month + 1);
                let legende_y_sais = start_100 - current_data_max_data[0].value * historisch_height_1;
                
                textAlign(LEFT);
                text(legende_text_sais_1, legende_x_sais + 54, legende_y_sais - 82);
                text(legende_text_sais_2, legende_x_sais + 54, legende_y_sais - 67);
                rect(legende_x_sais + 155, legende_y_sais - 57, rect_width + 30, 1);

                push();
                translate(legende_x_sais + 125 - rect_width/2, legende_y_sais - 40);
                rotate(40);
                rect( 0, 0, rect_width / 5 + 4, 1);
                pop();
                pop();
            }
        }
        
        // Beschriftung des Jahres
        if(i == 0){
            text(current_data[i].year, x - 10, pos_y_historisch);
        }

        // Beschriftung der Anzahl Fälle
        push();
        textAlign(CENTER);
        let x_cases = month_step * (i + 1) + month_step;
        let y_cases = line_height / 2 + 15;
        text(current_data[i].value, x_cases, y_cases);
        pop();

        // Verbindung zwischen den Kreisen
        noFill();
        stroke(fill_color);
        vertex(x, pos_y_historisch);
    }
    endShape();

    // ---------------------------- 2026 --------------------------------
    // Zeichnen der Werte des Aktuellen Jahres
    if (aktuell_isvisible) {
        beginShape();
        for (i = 0; i < data_2026.length; i++) {
            noStroke();
            fill(fill_color_highlight);

            // Grösse anhand der Kategorie
            let size = saisonalitaet_size[data_2026[i].value_cat - 1];
            let x = month_step * (i + 1) + month_step;

            // Positionierung
            if (historisch_isvisible) {
                pos_y_historisch = start_100 - (data_2026[i].value) * historisch_height_1;
            } else {   
                pos_y_historisch = height/2 - line_height/4
            }

            // Text für Jahr
            if(i == 0){
                text(data_2026[i].year, x - 10, pos_y_historisch);
            }

            if(sais_isvisible){
                // Zeichnen des Kreises
                ellipse(x, pos_y_historisch, size, size);
            }

            // Verbindung zwischen den Kreisen
            noFill();
            stroke(fill_color_highlight);
            vertex(x, pos_y_historisch);
        }
        endShape();
    }

}

// ---------------------------- Funktion für Slider --------------------------------
//current_year an Slider anpassen
function updateCurrentYear() {
    current_year = slider.value();

    // Updaten des Slider Labels
    sliderValueLabel.html("Jahr: " + current_year);

    // Neufiltern der Daten nach angezeigtem Jahr
    current_data = data_historisch.filter(
        d => d.year == current_year
    );

    // Herauslesen des Maximalwertes für Legende
    current_data_max = d3.max(current_data, d => d.value);

    current_data_max_data = current_data.filter(
        d => d.value == current_data_max
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
    updateLayout();
}
