let data_typen = [];
let current_data = [];

let current_year = 2025;
let selected_type_index = -1;
let is_initialized = false;

async function setup() {

    let canvas_sex = createCanvas(windowWidth, windowHeight);
    canvas_sex.parent("canvas-container-sex");

    data_typen = await d3.dsv(",", "../../data/data_salmonellosis_sex.csv", d3.autoType);

    fontStyleRegular = "sans-serif";

    // Legt die geladene Schrift als Standardschrift für p5 fest.
    textFont(fontStyleRegular);


    current_data = data_typen.filter(d => d.temporal === current_year);
    current_data = d3.sort(current_data, d => d.prct);

    is_initialized = true;
    console.log(current_data);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Gibt den Index des Bereichs unter dem Mauszeiger zurück (-1, wenn keiner).
// Wird sowohl für den Klick als auch für den Hover (Hand-Cursor) verwendet,
// damit beide exakt dieselben klickbaren Flächen haben:
// - die Segmente des Rechtecks
// - die Prozent-Labels oben
// - die Typ-Labels unten
function getHoveredTypeIndex() {
    if (!is_initialized) {
        return -1;
    }

    const rectangleWidth = min(width - 40, 900);
    const rectangleTop = height / 2 - 60;
    const rectangleBottom = height / 2 + 60;
    const rectangleLeft = width / 2 - rectangleWidth / 2;
    const onePercent = rectangleWidth / 100;

    // cumulativePercentage ist die summe der prozente der aktuellen daten
    // muss zusammen mit onePercent multipliziert werden, um die x-position der linien zu berechnen
    let cumulativePercentage = 0;
    const segmentLinePositions = [];

    // 1) prüft, ob der mauszeiger auf einem segment des rechtecks ist
    for (let i = 0; i < current_data.length; i++) {
        const areaStartPercentage = cumulativePercentage;
        // berechnet die kumulierte prozentzahl der aktuellen daten
        cumulativePercentage += current_data[i].prct;
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

    // 2) prüft, ob der mauszeiger auf einem typ label oder prozent label ist
    // push/pop, damit die textSize-Änderung den Rest nicht beeinflusst
    push();
    const typeLabelLayout = getTypeLabelLayout(
        current_data,
        rectangleLeft,
        rectangleWidth
    );
    textSize(typeLabelLayout.labelSize);

    for (let i = 0; i < current_data.length; i++) {
        const typeLabelY = rectangleBottom
            // +5 ist der abstand zwischen dem rechteck und dem typ label
            + 5
            + typeLabelLayout.rowIndexes[i] * typeLabelLayout.rowGap;
        // berechnet die breite des typ labels
        const typeLabelWidth = textWidth(current_data[i].sex);

        // prüft, ob der mauszeiger auf einem typ label ist
        const onTypeLabel =
            mouseX >= typeLabelLayout.positions[i] - typeLabelWidth
            && mouseX <= typeLabelLayout.positions[i]
            && mouseY >= typeLabelY
            && mouseY <= typeLabelY + typeLabelLayout.labelSize * 1.2;

        // prüft, ob der mauszeiger auf einem prozent label ist
        const percentageLabelY = rectangleTop - 5;
        const onPercentageLabel =
            mouseX >= segmentLinePositions[i] - textWidth(
                `${current_data[i].prct.toFixed(1)} %`
            )
            && mouseX <= segmentLinePositions[i]
            && mouseY <= percentageLabelY
            && mouseY >= percentageLabelY - typeLabelLayout.labelSize;

        if (onTypeLabel || onPercentageLabel) {
            pop();
            return i;
        }
    }
    pop();

    return -1;
}

// Klick: wählt den bereich unter der maus aus bzw. wieder ab
function mousePressed() {
    const i = getHoveredTypeIndex();
    if (i >= 0) {
        selected_type_index = selected_type_index === i ? -1 : i;
    }
}

// berechnet die positionen der typen labels und die größe der labels
function getTypeLabelLayout(data, rectangleLeft, rectangleWidth) {
    const labelSize = 16;
    const rowGap = 22;

    textFont(fontStyleRegular);
    textSize(labelSize);
    const labelWidths = data.map(item => textWidth(item.sex));
    const positions = [];
    const rowIndexes = [];
    let cumulativePercentage = 0;

    for (let i = 0; i < data.length; i++) {
        const areaPercentage = Number(data[i].prct);
        cumulativePercentage += areaPercentage;
        positions.push(
            rectangleLeft + cumulativePercentage * rectangleWidth / 100
        );
        rowIndexes.push(0);
    }

    return { labelSize, positions, rowIndexes, rowGap };
}

function draw() {
    if (!is_initialized) {
        return;
    }

    background("white");

    // Hover: Hand-Cursor, wenn die Maus über einem klickbaren Bereich ist
    const hovered_index = getHoveredTypeIndex();
    cursor(hovered_index >= 0 ? HAND : ARROW);

    //rechteck
    rectMode(CENTER);
    fill("white");
    stroke("black");
    //breite des rechtecks ist die breite des fensters minus 40
    const rectangleWidth = min(width - 40, 900);
    const rectangleHeight = 120;
    //in der mitte des fensters
    const rectangleX = width / 2;
    const rectangleY = height / 2;
    //60 ist der radius der ecken
    rect(rectangleX, rectangleY, rectangleWidth, rectangleHeight, 60);

    //jede linie markiert die kumulierte prozentgrenze des aktuellen jahres.
    const onePercent = rectangleWidth / 100;
    //cumulative, alle perc zusammengerechnet 
    let cumulativePercentage = 0;
    const rectangleLeft = rectangleX - rectangleWidth / 2;
    const typeLabelLayout = getTypeLabelLayout(
        current_data,
        rectangleLeft,
        rectangleWidth
    );

    //markiert den ausgewählten typ mit orange hintergrund
    if (selected_type_index >= 0 && selected_type_index < current_data.length) {
        let selectedStart = 0;
        for (let i = 0; i < selected_type_index; i++) {
            selectedStart += current_data[i].prct;
        }
        const selectedEnd = selectedStart
            + current_data[selected_type_index].prct;
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

    //linien und text für prozentzahlenangabe
    stroke("black");
    strokeWeight(1);
    //text für prozentzahlenangabe
    textAlign(LEFT, BOTTOM);
    textSize(16);
    //berechnet die start und end position des ausgewählten typs
    //zeichnet die linien und die prozentzahlen für jeden typ
    for (let i = 0; i < current_data.length; i++) {
        const areaPercentage = current_data[i].prct;
        const areaStart = cumulativePercentage;
        cumulativePercentage += areaPercentage;
        const lineX = rectangleLeft + cumulativePercentage * onePercent;

        const isSelected = i === selected_type_index;

        //zeichnet die linie für die zusammengerechnete prozentzahl
        line(
            lineX,
            rectangleY - rectangleHeight / 2,
            lineX,
            rectangleY + rectangleHeight / 2
        );

        //zeichnet die prozentzahl und den type
        noStroke();
        fill(isSelected ? "#F77F1B" : "#181717");
        textAlign(LEFT, BOTTOM);
        textSize(16);
        const percentageLabel = `${areaPercentage.toFixed(1)} %`;
        text(
            //zeigt die prozentzahl an
            percentageLabel,
            lineX - textWidth(percentageLabel),
            rectangleY - rectangleHeight / 2 - 5
        );

        //zeigt den type an
        textAlign(RIGHT, TOP);
        textSize(typeLabelLayout.labelSize);
    
        fill(isSelected ? "#F77F1B" : "#181717");
        textStyle(isSelected ? BOLD : NORMAL);
        const sharedLabelX = typeLabelLayout.positions[i];
        const typeLabelY = rectangleY + rectangleHeight / 2 + 5
            + typeLabelLayout.rowIndexes[i] * typeLabelLayout.rowGap;
        text(
            //labelX x-position text
            current_data[i].sex,
            sharedLabelX,
            typeLabelY
        );

        if (isSelected) {
            textStyle(NORMAL);
            textSize(12);
            text(
                `${Number(current_data[i].value).toFixed(0)} Fälle`,
                sharedLabelX,
                typeLabelY + typeLabelLayout.labelSize + 5
            );
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