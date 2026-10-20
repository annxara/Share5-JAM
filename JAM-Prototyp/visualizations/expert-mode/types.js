// Alle Datensätze aus der CSV-Datei. Nach dem Laden enthält dieses Array
// die Werte für sämtliche Jahre.
let data_typen = [];

// Die Datensätze des aktuell gewählten Jahres. Nur diese Werte werden in
// draw() als Segmente, Prozentangaben und Typbezeichnungen gezeichnet.
let current_data = [];

// p5-DOM-Elemente für den Slider und seine drei Beschriftungen.
let slider;
let sliderMinLabel;
let sliderMaxLabel;
let sliderValueLabel;

// Jahr, das beim ersten Laden angezeigt werden soll.
let current_year = 2025;

// Index des aktuell ausgewählten Datensatzes in current_data.
// -1 bedeutet, dass kein Typ ausgewählt ist.
let selected_type_index = -1;


// Beschreibungstexte für die Detailansicht. Die Schlüssel müssen exakt
// den Werten in der CSV-Spalte "type" entsprechen.
const type_descriptions = {
    Enteritidis:
        "Einer der weltweit häufigsten Salmonellen-Serovare und "
        + "Hauptverursacher von lebensmittelbedingten Infektionen, "
        + "insbesondere assoziiert mit Eiern und Geflügelprodukten.",
    Napoli:
        "Ein seltenerSalmonellenstamm, der in den letzten Jahren "
        + "jedoch vermehrt auftritt. Der Stamm ist potentiell invasiv, "
        + "was häufig zu schweren Krankheitsverläufen Hospitalisierung führt.",
    MST:
        "Eine Variante des Typhimurium-Stamms mit der Antigenformel, "
        + "die nur ein Flagellum-Antigen exprimiert und in Europa zu den "
        + "drei häufigsten Ursachen menschlicher Salmonellose zählt, "
        + "stark verknüpft mit der Schweinehaltung.",
    Species:
        "Bezeichnet die Arten-Ebene der Salmonellen-Taxonomie – es gibt "
        + "zwei Hauptarten (Salmonella enterica und Salmonella bongori), "
        + "wobei S. enterica mit über 2.500 Serotypen in sechs Unterarten "
        + "die medizinisch relevante Spezies darstellt.",
    Typhimurium:
        "Einer der weltweit führenden Salmonellen-Serovare nach "
        + "Enteritidis, verursacht typische Gastroenteritis und hat ein "
        + "breites Wirtsspektrum einschließlich Schweine, Geflügel, "
        + "Rinder und Menschen.",
    other:
        "Alle übrigen Salmonellen-Krankheitsbilder abseits der klassischen "
        + "Gastroenteritis – also typhoidales/paratyphoidales Fieber, "
        + "invasive und extra-intestinale Verlaufsformen sowie chronisches "
        + "Keimträgertum."
};

async function setup() {
    // Erstellt das p5-Canvas in Fenstergröße und fügt es in den Container
    // aus index.html ein.
    let canvas_typen = createCanvas(windowWidth, windowHeight);
    canvas_typen.parent("canvas-container-typen");

    fontStyleRegular = "sans-serif";

    // Liest die CSV-Datei mit D3 ein. d3.autoType wandelt zum Beispiel
    // "2025" und "36.1" automatisch in Zahlen um.
    data_typen = await d3.dsv(
        ",",
        "../../data/data_salmonellosis_types.csv",
        d3.autoType
    );

    // Zeigt beim Start nur die Daten des Startjahres an.
    current_data = data_typen.filter(d => d.temporal === current_year);

    // Sortiert die Typen nach ihrem Prozentwert. Diese Reihenfolge bestimmt
    // gleichzeitig die Reihenfolge der Segmente im Balken.
    current_data = d3.sort(current_data, d => d.prct);

    // Erstellt den Slider für den verfügbaren Zeitraum.
    slider = createSlider(2013, 2025, current_year);
    slider.addClass("slider");
    slider.size(width / 4);
    slider.position(width / 2 - slider.width / 2, height - 100);

    // Beschriftung am linken Ende des Sliders.
    sliderMinLabel = createDiv("2013");
    sliderMinLabel.addClass("slider-label");
    sliderMinLabel.position(slider.x - 50, slider.y - 7);

    // Beschriftung am rechten Ende des Sliders.
    sliderMaxLabel = createDiv("2025");
    sliderMaxLabel.addClass("slider-label");
    sliderMaxLabel.position(slider.x + slider.width + 20, slider.y - 7);

    // Zeigt das aktuell ausgewählte Jahr oberhalb des Sliders an.
    sliderValueLabel = createDiv("Jahr: " + current_year);
    sliderValueLabel.addClass("slider-value-label");
    sliderValueLabel.position(width / 2, height - 130);
    // Bei jeder Slideränderung werden Jahr und aktuelle Daten aktualisiert.
    slider.input(updateCurrentYear);

    updateLayout();

    // Positioniert alle DOM-Elemente und synchronisiert den Anfangszustand.
    updateSliderLayout();
    updateCurrentYear();
    console.log(current_data);
}

// Liest das Jahr aus dem Slider und ersetzt current_data durch die Daten
// dieses Jahres.
function updateCurrentYear() {
    // Der Slider liefert einen String. Number() macht daraus eine Zahl,
    // damit der Vergleich mit d.temporal zuverlässig funktioniert.
    current_year = Number(slider.value());

    // Filtert alle anderen Jahre aus der Darstellung heraus.
    current_data = data_typen.filter(d => d.temporal === current_year);

    // Die alte Auswahl darf beim Jahreswechsel nicht auf einen neuen,
    // möglicherweise anderen Datensatz übertragen werden.
    current_data = d3.sort(current_data, d => d.prct);
    selected_type_index = -1;

    // Aktualisiert die sichtbare Jahreszahl und die Sliderposition.
    sliderValueLabel.html("Jahr: " + current_year);
    updateSliderLayout();
}

// Passt Größe und Position des Sliders sowie seiner Labels an die aktuelle
// Canvasgröße an. Wird beim Start und nach windowResized() aufgerufen.
function updateSliderLayout() {
    if (!slider || !sliderMinLabel || !sliderMaxLabel || !sliderValueLabel) {
        return;
    }
    
    slider.size(width / 4);
    slider.position(width / 2 - slider.width / 2, height - 100);
    sliderMinLabel.position(slider.x - 50, slider.y - 7);
    sliderMaxLabel.position(slider.x + slider.width + 20, slider.y - 7);
    sliderValueLabel.position(width / 2, height - 130);
}


function windowResized() {
    // p5 passt die Zeichenfläche an die neue Browsergröße an.
    resizeCanvas(windowWidth, windowHeight);

    // Die HTML-Elemente müssen separat neu positioniert werden.
    updateSliderLayout();
}
// Prüft, ob ein Klick auf einem Segment, einem Prozentlabel oder einem
// Typ-Label liegt. Bei einem Treffer wird der Array-Index in
// selected_type_index gespeichert.
function mousePressed() {
    // Diese Geometriewerte müssen mit draw() übereinstimmen, damit die
    // sichtbaren Bereiche und ihre Klickflächen deckungsgleich bleiben.
    const rectangleWidth = min(width - 40, 900);
    const rectangleTop = height / 2 - 60;
    const rectangleBottom = height / 2 + 60;
    const rectangleLeft = width / 2 - rectangleWidth / 2;
    // Umrechnung von Prozentpunkten in Pixel.
    const onePercent = rectangleWidth / 100;

    // Kumulierte Prozentgrenze. Dieser Wert beschreibt, wie weit der Balken
    // nach den bereits verarbeiteten Segmenten gefüllt ist.
    let cumulativePercentage = 0;

    // Mittelpunkte der Segmente für die Klickflächen der Prozentlabels.
    const segmentCenters = [];

    // Zuerst werden die eigentlichen Balkensegmente geprüft.
    for (let i = 0; i < current_data.length; i++) {
        // Startwert des aktuellen Segments, bevor dessen Anteil addiert wird.
        const areaStartPercentage = cumulativePercentage;

        // Endwert des aktuellen Segments.
        cumulativePercentage += current_data[i].prct;

        // Übersetzt die Prozentgrenzen in Canvas-x-Koordinaten.
        const areaStart = rectangleLeft + areaStartPercentage * onePercent;
        const areaEnd = rectangleLeft + cumulativePercentage * onePercent;
        segmentCenters.push((areaStart + areaEnd) / 2);

        // Ein Klick innerhalb dieses Rechtecks wählt den Datensatz aus.
        if (
            mouseY >= rectangleTop
            && mouseY <= rectangleBottom
            && mouseX >= areaStart
            && mouseX <= areaEnd
        ) {
            // Ein erneuter Klick auf denselben Typ schließt die Beschreibung.
            // Ein Klick auf einen anderen Typ verschiebt die Auswahl.
            selected_type_index = selected_type_index === i ? -1 : i;
            return;
        }
    }

    // Wenn kein Segment getroffen wurde, werden die Labelpositionen
    // berechnet und anschließend als Klickflächen verwendet.
    const typeLabelLayout = getTypeLabelLayout(
        current_data,
        rectangleLeft,
        rectangleWidth
    );
    textSize(typeLabelLayout.labelSize);

    // Prüft Typ- und Prozentlabel für jeden Datensatz.
    for (let i = 0; i < current_data.length; i++) {
        const typeLabelY = rectangleBottom
            // +5 ist der abstand zwischen dem rechteck und dem typ label
            + 5
            + typeLabelLayout.rowIndexes[i] * typeLabelLayout.rowGap;
        // Die Textbreite muss mit derselben Schriftgröße gemessen werden,
        // mit der das Label später gezeichnet wird.
        const typeLabelWidth = textWidth(current_data[i].type);
        // Horizontale und vertikale Grenzen des Typ-Labels.
        const clickedTypeLabel =
            mouseX >= typeLabelLayout.positions[i] - typeLabelWidth / 2
            //prüft, ob der mauszeiger auf einem prozent label ist
            && mouseX <= typeLabelLayout.positions[i] + typeLabelWidth / 2
            // prüft, ob der mauszeiger auf einem typ label ist
            && mouseY >= typeLabelY
            // prüft, ob der mauszeiger auf einem typ label ist
            && mouseY <= typeLabelY + typeLabelLayout.labelSize * 1.2;

        // Prozentlabels liegen knapp oberhalb des Hauptrechtecks.
        const percentageLabelY = rectangleTop - 5;
        // Die Klickbreite entspricht der sichtbaren Textbreite.
        const clickedPercentageLabel =
            mouseX >= segmentCenters[i] - textWidth(
                `${current_data[i].prct.toFixed(0)} %`
            ) / 2
            && mouseX <= segmentCenters[i] + textWidth(
                `${current_data[i].prct.toFixed(0)} %`
            ) / 2
            && mouseY <= percentageLabelY
            && mouseY >= percentageLabelY - typeLabelLayout.labelSize;
        // Beide Labelarten wählen denselben Datensatz aus.
        if (clickedTypeLabel || clickedPercentageLabel) {
            // Auch bei Labels schaltet ein zweiter Klick die Auswahl aus.
            selected_type_index = selected_type_index === i ? -1 : i;
            return;
        }
    }
}
// Berechnet Schriftgröße, x-Position und Zeile jedes Typ-Labels.
// Die Funktion wird auch bei der Klickprüfung verwendet, damit sichtbare
// Positionen und Klickflächen dieselbe Geometrie verwenden.
function getTypeLabelLayout(data, rectangleLeft, rectangleWidth) {
    // Ausgangsgröße, kleinste erlaubte Schriftgröße und Abstände.
    let labelSize = 16;
    const minimumLabelSize = 10;
    const labelGap = 10;
    const rowGap = 22;

    // Für korrekte Breitenmessungen muss die verwendete Schrift aktiv sein.
    textFont(fontStyleRegular);
    while (labelSize > minimumLabelSize) {
        textSize(labelSize);
        // Verkleinert die Schrift, falls ein Typname nicht in das Rechteck passt.
        if (data.every(item => textWidth(item.type) <= rectangleWidth)) {
            break;
        }
        labelSize -= 1;
    }
    // Ab hier wird mit der endgültigen Schriftgröße gerechnet.
    textSize(labelSize);
    const labelWidths = data.map(item => textWidth(item.type));

    // rows enthält pro Zeile die rechte Kante des letzten Labels.
    // positions und rowIndexes werden parallel zu data aufgebaut.
    const rows = [];
    const positions = [];
    const rowIndexes = [];
    let cumulativePercentage = 0;
    // Berechnet für jedes Segment die gewünschte Labelposition und Zeile.
    for (let i = 0; i < data.length; i++) {
        const areaPercentage = data[i].prct;

        const desiredX =
            rectangleLeft
            + (cumulativePercentage + areaPercentage)
            * rectangleWidth / 100
            - labelWidths[i] / 2;
        cumulativePercentage += areaPercentage;
        // Die Position wird vom Segmentende aus berechnet, sodass die rechte
        // Textkante auf der Prozentlinie liegen kann.
        let rowIndex = 0;
        let labelX = desiredX;
        while (true) {
            if (!rows[rowIndex]) {
                rows[rowIndex] = [];
            }

            // In einer leeren Zeile ist jedes Label zulässig. In einer
            // belegten Zeile wird der Abstand zum Vorgänger geprüft.
            const previousLabel = rows[rowIndex][rows[rowIndex].length - 1];
            const labelLeft = desiredX - labelWidths[i] / 2;
            const minimumLeft = previousLabel
                ? previousLabel.right + labelGap
                : rectangleLeft;
            if (!previousLabel || labelLeft >= minimumLeft) {
                rows[rowIndex].push({
                    right: desiredX + labelWidths[i] / 2
                });
                break;
            }
            rowIndex += 1;
        }
        // Speichert Position und Zeile unter demselben Index wie data[i].
        positions.push(labelX);
        rowIndexes.push(rowIndex);
    }

    return { labelSize, positions, rowIndexes, rowGap };
}

function draw() {
    // p5 ruft draw() fortlaufend auf. Jeder Frame wird vollständig neu
    // aufgebaut, damit alte Auswahlen nicht im Canvas zurückbleiben.
    background("white");

    if (!current_data) return;

    // Zeichnet zuerst das weiße Grundrechteck mit schwarzem Rahmen.
    rectMode(CENTER);
    fill("white");
    stroke("black");
    // Die Grafik ist höchstens 900 Pixel breit und lässt seitlich 20 Pixel
    // Abstand zum Fensterrand.
    const rectangleWidth = min(width - 40, 900);
    const rectangleHeight = 120;
    // Mittelpunkt des Rechtecks im Browserfenster.
    const rectangleX = width / 2;
    const rectangleY = height / 2;
    // Der letzte Parameter ist der Radius der abgerundeten Ecken.
    rect(rectangleX, rectangleY, rectangleWidth, rectangleHeight, 60);

    // Ein Prozentpunkt entspricht diesem Pixelwert. Jede Trennlinie wird
    // später über die kumulierte Prozentzahl positioniert.
    const onePercent = rectangleWidth / 100;
    // Wird beim Zeichnen der Segmente fortlaufend erhöht.
    let cumulativePercentage = 0;
    const rectangleLeft = rectangleX - rectangleWidth / 2;
    const typeLabelLayout = getTypeLabelLayout(
        current_data,
        rectangleLeft,
        rectangleWidth
    );

    // Zeichnet bei einer Auswahl eine orange Fläche hinter dem Segment.
    if (selected_type_index >= 0 && selected_type_index < current_data.length) {
        let selectedStart = 0;
        for (let i = 0; i < selected_type_index; i++) {
            selectedStart += current_data[i].prct;
        }
        const selectedEnd = selectedStart + current_data[selected_type_index].prct;
        const selectedLeft = rectangleLeft + selectedStart * onePercent;
        const selectedWidth = (selectedEnd - selectedStart) * onePercent;

        push(); // statt drawingContext.save()
        drawingContext.beginPath();
        drawingContext.roundRect(
            rectangleLeft,
            rectangleY - rectangleHeight / 2,
            rectangleWidth,
            rectangleHeight,
            60
        );
        drawingContext.clip();
        noStroke();
        fill("#F77F1B");
        rect(
            selectedLeft + selectedWidth / 2,
            rectangleY,
            selectedWidth,
            rectangleHeight
        );
        pop(); // statt drawingContext.restore()

        noFill();
        stroke("black");
        strokeWeight(1);
        rect(rectangleX, rectangleY, rectangleWidth, rectangleHeight, 60);
    }

    // Ab hier werden Segmentgrenzen, Prozentlabels und Typnamen gezeichnet.
    stroke("black");
    strokeWeight(1);
    // Prozentlabels stehen oberhalb des Balkens. Sie werden rechtsbündig
    // gezeichnet, damit ihre rechte Textkante auf der Prozentlinie liegt.
    textAlign(RIGHT, BOTTOM);
    textFont(fontStyleRegular);
    textSize(10);
    // Durchläuft alle Typen in der Reihenfolge von current_data.
    for (let i = 0; i < current_data.length; i++) {
        const areaPercentage = current_data[i].prct;
        cumulativePercentage += areaPercentage;
        const lineX = rectangleLeft + cumulativePercentage * onePercent;
        const isSelected = i === selected_type_index;

        // Die Linie markiert das Ende des aktuellen kumulierten Segments.
        line(
            lineX,
            rectangleY - rectangleHeight / 2,
            lineX,
            rectangleY + rectangleHeight / 2
        );

        // Prozentwert und Typname werden mit unterschiedlichen Text-
        // ausrichtungen gezeichnet.
        noStroke();
        fill(isSelected ? "#F77F1B" : "black");
        textSize(16);
        // Der Textausrichtungszustand wird beim Zeichnen des Typnamens
        // verändert. Deshalb wird RIGHT hier für jedes Prozentlabel erneut
        // ausdrücklich gesetzt.
        textAlign(RIGHT, BOTTOM);
        const percentageLabel = `${areaPercentage.toFixed(0)} %`;
        const percentageLabelX = max(lineX, textWidth(percentageLabel));
        text(
            // toFixed(0) zeigt den Prozentwert ohne Nachkommastellen.
            percentageLabel,
            percentageLabelX,
            rectangleY - rectangleHeight / 2 - 5
        );

        // Zeichnet den Typnamen unterhalb des Balkens.
        textAlign(LEFT, TOP);
        textSize(typeLabelLayout.labelSize);
        fill(isSelected ? "#F77F1B" : "black");
        textStyle(isSelected ? BOLD : NORMAL);
        const titleWidth = textWidth(current_data[i].type);

        const sharedLabelX =
            max(
                rectangleLeft,
                typeLabelLayout.positions[i] - titleWidth / 2
            );

        const typeLabelY = rectangleY + rectangleHeight / 2 + 5
            + typeLabelLayout.rowIndexes[i] * typeLabelLayout.rowGap;
        text(
            // titleBounds liefert die tatsächlichen Textgrenzen. Damit wird
            // der Text so verschoben, dass sein Mittelpunkt positions[i]
            // entspricht.
            current_data[i].type,
            sharedLabelX,
            typeLabelY
        );

        let selectedBox = null;

        if (isSelected) {
            selectedBox = {
                description: type_descriptions[current_data[i].type],
                x: sharedLabelX
            };
        }

        if (selectedBox) {
            const boxWidth = 300;
            const padding = 8;

            // unterste belegte Labelzeile finden
            const lastRow = max(typeLabelLayout.rowIndexes);
            const boxY = rectangleY + rectangleHeight / 2 + 5
                + (lastRow + 1) * typeLabelLayout.rowGap; // Abstand zu den Labels

            // Box darf nicht über den Canvasrand hinausragen
            const boxX = constrain(
                selectedBox.x,
                padding,
                width - boxWidth - padding
            );

            push();
            textSize(12);
            textStyle(NORMAL);
            textAlign(LEFT, TOP);

            // Zeilenanzahl bei Textumbruch ermitteln
            const words = selectedBox.description.split(" ");
            let lines = 1;
            let currentLine = "";
            for (const word of words) {
                const testLine = currentLine ? currentLine + " " + word : word;
                if (textWidth(testLine) > boxWidth && currentLine) {
                    lines++;
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            const boxHeight = lines * textLeading();

            rectMode(CORNER);
            fill(255);
            noStroke();
            strokeWeight(1);
            rect(
                boxX - padding,
                boxY - padding,
                boxWidth + padding * 2,
                boxHeight + padding * 2,
                8
            );

            noStroke();
            fill("#F77F1B");
            text(selectedBox.description, boxX, boxY, boxWidth);
            pop();
        }

        textAlign(CENTER, BOTTOM);
        stroke("black");
        strokeWeight(1);

    }

    // Die feste 50-%-Linie
    // line(
    //     rectangleX,
    //     rectangleY - rectangleHeight / 2,
    //     rectangleX,
    //     rectangleY + rectangleHeight / 2
    // );
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

