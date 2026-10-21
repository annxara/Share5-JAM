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
 
// Gibt den Index des Bereichs unter dem Mauszeiger zurück (-1, wenn keiner).
// Wird sowohl für den Klick als auch für den Hover (Hand-Cursor) verwendet,
// damit beide exakt dieselben klickbaren Flächen haben:
// - die Segmente des Balkens
// - die Prozent-Labels oben
// - die Typ-Labels unten
// Die Geometrie muss mit draw() übereinstimmen, damit die sichtbaren
// Bereiche und ihre Klickflächen deckungsgleich bleiben.
function getHoveredTypeIndex() {
    if (!current_data || current_data.length === 0) {
        return -1;
    }
 
    // Muss der Breitenbegrenzung in draw() entsprechen, damit Klickfläche
    // und sichtbare Segmente deckungsgleich bleiben.
    const rectangleWidth = min(width - 40, 900);
    const rectangleTop = height / 2 - 60;
    const rectangleBottom = height / 2 + 60;
    const rectangleLeft = width / 2 - rectangleWidth / 2;
    // Umrechnung von Prozentpunkten in Pixel.
    const onePercent = rectangleWidth / 100;
 
    // Kumulierte Prozentgrenze. Dieser Wert beschreibt, wie weit der Balken
    // nach den bereits verarbeiteten Segmenten gefüllt ist.
    let cumulativePercentage = 0;
 
    // x-Positionen der Trennlinien (Segmentenden) für die Prozentlabels.
    const segmentLinePositions = [];
 
    // 1) Zuerst werden die eigentlichen Balkensegmente geprüft.
    for (let i = 0; i < current_data.length; i++) {
        const areaStartPercentage = cumulativePercentage;
        cumulativePercentage += current_data[i].prct;
 
        // Übersetzt die Prozentgrenzen in Canvas-x-Koordinaten.
        const areaStart = rectangleLeft + areaStartPercentage * onePercent;
        const areaEnd = rectangleLeft + cumulativePercentage * onePercent;
        segmentLinePositions.push(areaEnd);
 
        if (
            mouseY >= rectangleTop
            && mouseY <= rectangleBottom
            && mouseX >= areaStart
            && mouseX <= areaEnd
        ) {
            return i;
        }
    }
 
    // 2) Danach Prozent- und Typ-Labels. push/pop, damit die Änderungen
    // an textSize/textStyle den Rest des Sketches nicht beeinflussen.
    push();
    textFont(fontStyleRegular);
    const typeLabelLayout = getTypeLabelLayout(
        current_data,
        rectangleLeft,
        rectangleWidth
    );
    const percentageLabelLayout = getPercentageLabelLayout(
        current_data,
        segmentLinePositions
    );
 
    for (let i = 0; i < current_data.length; i++) {
        const isSelected = i === selected_type_index;
 
        // --- Prozentlabel (oben, rechtsbündig an der Trennlinie) ---
        textSize(16);
        textStyle(NORMAL);
        const percentageLabel = `${current_data[i].prct.toFixed(0)} %`;
        const percentageWidth = textWidth(percentageLabel);
        // Gleiche Berechnung wie in draw()
        const percentageRight = percentageLabelLayout.rights[i];
        const percentageBottom = rectangleTop - 5
            + percentageLabelLayout.bottoms[i];
 
        const onPercentageLabel =
            mouseX >= percentageRight - percentageWidth
            && mouseX <= percentageRight
            && mouseY <= percentageBottom
            && mouseY >= percentageBottom - 16;
 
        // --- Typ-Label (unten, linksbündig gezeichnet) ---
        textSize(typeLabelLayout.labelSize);
        //textStyle(isSelected ? BOLD : NORMAL);
        const typeWidth = textWidth(current_data[i].type);
        // Gleiche Berechnung wie in draw()
        const typeLeft = typeLabelLayout.positions[i];
        const typeTop = rectangleBottom
            // +5 ist der abstand zwischen dem rechteck und dem typ label
            + 5
            + typeLabelLayout.rowIndexes[i] * typeLabelLayout.rowGap;
 
        const onTypeLabel =
            mouseX >= typeLeft
            && mouseX <= typeLeft + typeWidth
            && mouseY >= typeTop
            && mouseY <= typeTop + typeLabelLayout.labelSize * 1.2;
 
        if (onPercentageLabel || onTypeLabel) {
            pop();
            return i;
        }
    }
    pop();
 
    return -1;
}
 
// Klick: wählt den Bereich unter der Maus aus bzw. wieder ab.
function mousePressed() {
    const i = getHoveredTypeIndex();
    if (i >= 0) {
        // Ein erneuter Klick auf denselben Typ schließt die Beschreibung.
        // Ein Klick auf einen anderen Typ verschiebt die Auswahl.
        selected_type_index = selected_type_index === i ? -1 : i;
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
    const rowGap = 20;
 
    // Für korrekte Breitenmessungen muss die verwendete Schrift aktiv sein.
    textFont(fontStyleRegular);
    textStyle(NORMAL);
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
 
        const labelLeft =
            rectangleLeft
            + (cumulativePercentage + areaPercentage)
            * rectangleWidth / 100
            - labelWidths[i];
        cumulativePercentage += areaPercentage;
        // Die Position wird vom Segmentende aus berechnet, sodass die rechte
        // Textkante auf der Prozentlinie liegen kann.
        let rowIndex = 0;
        const labelX = labelLeft;
        while (true) {
            if (!rows[rowIndex]) {
                rows[rowIndex] = [];
            }
 
            // In einer leeren Zeile ist jedes Label zulässig. In einer
            // belegten Zeile wird der Abstand zum Vorgänger geprüft.
            const previousLabel = rows[rowIndex][rows[rowIndex].length - 1];
            const minimumLeft = previousLabel
                ? previousLabel.right + labelGap
                : rectangleLeft;
            if (!previousLabel || labelLeft >= minimumLeft) {
                rows[rowIndex].push({
                    right: labelLeft + labelWidths[i]
                });
                break;
            }
            rowIndex += 1;
        }
        // Speichert die linke Labelkante unter demselben Index wie data[i].
        positions.push(labelX);
        rowIndexes.push(rowIndex);
    }
 
    return { labelSize, labelWidths, positions, rowIndexes, rowGap };
}

function getPercentageLabelLayout(data, segmentLinePositions) {
    const labelGap = 10;
    const rowGap = -20;
    const rights = [];
    const bottoms = [];
    const rows = [];

    textFont(fontStyleRegular);
    textStyle(NORMAL);
    textSize(16);

    for (let i = 0; i < data.length; i++) {
        const label = `${data[i].prct.toFixed(0)} %`;
        const labelWidth = textWidth(label);
        const right = max(segmentLinePositions[i], labelWidth);
        let rowIndex = 0;

        while (true) {
            if (!rows[rowIndex]) {
                rows[rowIndex] = [];
            }

            const previousLabel = rows[rowIndex][rows[rowIndex].length - 1];
            const labelLeft = right - labelWidth;
            const minimumLeft = previousLabel
                ? previousLabel.right + labelGap
                : 0;

            if (!previousLabel || labelLeft >= minimumLeft) {
                rows[rowIndex].push({
                    right,
                    left: labelLeft,
                });
                break;
            }

            rowIndex += 1;
        }

        rights.push(right);
        bottoms.push(rowIndex * rowGap);
    }

    return { rights, bottoms };
}

function draw() {
    // p5 ruft draw() fortlaufend auf. Jeder Frame wird vollständig neu
    // aufgebaut, damit alte Auswahlen nicht im Canvas zurückbleiben.
    background("white");
 
    if (!current_data) return;
 
    // Hover: Hand-Cursor, wenn die Maus über einem klickbaren Bereich ist
    const hovered_index = getHoveredTypeIndex();
    cursor(hovered_index >= 0 ? HAND : ARROW);
 
    // Zeichnet zuerst das weiße Grundrechteck mit schwarzem Rahmen.
    rectMode(CENTER);
    fill("white");
    stroke("#181717");
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
    const percentageLabelLayout = getPercentageLabelLayout(
        current_data,
        current_data.map((_, index) => {
            let percentage = 0;
            for (let j = 0; j <= index; j++) {
                percentage += current_data[j].prct;
            }
            return rectangleLeft + percentage * onePercent;
        })
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
    stroke("#181717");
    strokeWeight(1);
    // Prozentlabels werden rechtsbündig gezeichnet. Bei Überschneidungen
    // werden sie zeilenweise nach unten verschoben.
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
        fill(isSelected ? "#F77F1B" : "#181717");
        textSize(16);
        // Der Textausrichtungszustand wird beim Zeichnen des Typnamens
        // verändert. Deshalb wird RIGHT hier für jedes Prozentlabel erneut
        // ausdrücklich gesetzt.
        textAlign(RIGHT, BOTTOM);
        textStyle(NORMAL);
        const percentageLabel = `${areaPercentage.toFixed(0)} %`;
        const percentageLabelX = percentageLabelLayout.rights[i];
        text(
            // toFixed(0) zeigt den Prozentwert ohne Nachkommastellen.
            percentageLabel,
            percentageLabelX,
            rectangleY - rectangleHeight / 2 - 5
                + percentageLabelLayout.bottoms[i]
        );
 
        // Zeichnet den Typnamen unterhalb des Balkens.
        textAlign(LEFT, TOP);
        textSize(typeLabelLayout.labelSize);
        fill(isSelected ? "#F77F1B" : "#181717");
        textStyle(NORMAL);
        const sharedLabelX = typeLabelLayout.positions[i];
 
        const typeLabelY = rectangleY + rectangleHeight / 2 + 5
            + typeLabelLayout.rowIndexes[i] * typeLabelLayout.rowGap;
        text(
            // Die rechte Textkante liegt auf der Prozentlinie.
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
            const padding = 0;
 
            // Die Beschreibung folgt bei einer Überschneidung der tieferen
            // Zeile des betroffenen Label-Paares.
            const selectedLabelLeft =
                typeLabelLayout.positions[selected_type_index];
            const selectedLabelRight = selectedLabelLeft
                + typeLabelLayout.labelWidths[selected_type_index];
            let descriptionRow =
                typeLabelLayout.rowIndexes[selected_type_index];

            for (let i = 0; i < current_data.length; i++) {
                if (i === selected_type_index) {
                    continue;
                }

                const labelLeft = typeLabelLayout.positions[i];
                const labelRight = labelLeft + typeLabelLayout.labelWidths[i];
                const overlaps = selectedLabelLeft < labelRight
                    && selectedLabelRight > labelLeft;

                if (overlaps) {
                    descriptionRow = max(
                        descriptionRow,
                        typeLabelLayout.rowIndexes[i]
                    );
                }
            }

            const boxY = rectangleY + rectangleHeight / 2 + 5
                + (descriptionRow + 1) * typeLabelLayout.rowGap;
 
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

            // Die Boxhöhe passt sich aktuell automatisch an die Textzeilen an.
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
 


