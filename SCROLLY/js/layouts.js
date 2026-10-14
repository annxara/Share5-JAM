/**
 * Jedes Layout berechnet ein Ziel für jedes Partikel.
 * Die Arrays bleiben über alle Layouts gleich lang, damit Partikel beim Scrollen
 * von positions[i] des alten Layouts zu positions[i] des neuen Layouts animiert werden können.
 *
 * Rückgabeform:
 *   {
 *     positions: [{ x, y }, ...],
 *     labels: [{ text, x, y }, ...],
 *     visible: [true, false, ...]
 *   }
 *
 * Die p5-Funktionen werden erst nach dem Erstellen der Canvas in setup() aufgerufen.
 */
const Layouts = {
  // Alle Layoutfunktionen erhalten die Cases und den verfügbaren Zeichenbereich.
  // Sie geben für jedes Partikel eine Zielposition zurück.

  // ---------- Aktualität ----------
  // Die ersten Aktualitäts-Partikel bilden die Zahl; weitere Partikel warten darunter.
  total(cases, area, text, visibleCount) {
    return textLayout(cases, area, text, visibleCount, belowScreenTarget);
  },

  // ---------- Veränderung ----------
  // Die Veränderungs-Partikel bilden den Text; überzählige Aktualitäts-Partikel
  // erhalten Ziele oberhalb des Fensters.
  change(cases, area, text, visibleCount, seasonalityStart) {
    return textLayout(cases, area, text, visibleCount, (index, targetArea) => (
      index >= seasonalityStart
        ? belowScreenTarget(index, targetArea)
        : offscreenTarget(index, targetArea)
    ));
  },

  // Zwischenziele für den Übergang von change zu seasonality.
  changeDeparture(cases, area, seasonalityStart) {
    return {
      positions: cases.map((_, index) => (
        index >= seasonalityStart
          ? belowScreenTarget(index, area)
          : offscreenTarget(index, area)
      )),
      labels: [],
    };
  },

  // ---------- Saisonalität ----------
  // Die CSV-Werte werden als zwei Partikelspalten dargestellt.
  seasonality(cases, area, columns, _visibleCount, seasonalityStart) {
    return unitChart(cases, area, {
      categories: columns.map(column => column.label),
      labels: columns.map(column => column.label),
      counts: columns.map(column => column.count),
      startIndex: seasonalityStart,
      perRow: 12,
    });
  },

  // ---------- Trend ----------
  // Alle Partikel werden auf die Form eines Richtungspfeils verteilt.
  trend(cases, area, direction) {
    return arrowLayout(cases, area, direction);
  },
};

function arrowLayout(cases, area, direction) {
  // Der Pfeil wird zunächst als unsichtbare Grafik gezeichnet.
  // Anschließend werden seine hellen Pixel zu Partikelzielen.
  const pg = createGraphics(Math.floor(area.w), Math.floor(area.h));
  pg.pixelDensity(1);
  pg.clear();
  pg.noStroke();
  pg.fill(255);

  const length = Math.min(pg.width * 0.6, pg.height * 0.6);
  const shaftWidth = length * 0.3;
  const arrowHeadLength = length * 0.24;
  const arrowHeadWidth = length * 0.6;
  // p5 zählt y nach unten; deshalb erhält "steigend" einen negativen Winkel.
  const arrowAngle = direction === 'steigend'
    ? -Math.PI / 4
    : direction === 'sinkend'
      ? Math.PI / 4
      : 0;

  // Schaft und Spitze zu einem gefüllten Pfeil zusammensetzen.
  pg.push();
  pg.translate(pg.width / 2, pg.height / 2);
  pg.rotate(arrowAngle);
  pg.rectMode(CORNER);
  pg.rect(-length / 2, -shaftWidth / 2, length - arrowHeadLength, shaftWidth);
  pg.triangle(
    length / 2,
    0,
    length / 2 - arrowHeadLength,
    -arrowHeadWidth / 2,
    length / 2 - arrowHeadLength,
    arrowHeadWidth / 2
  );
  pg.pop();

  // Nur helle Pixel werden als mögliche Positionen übernommen.
  pg.loadPixels();
  const candidates = [];
  const step = 3;
  for (let y = 0; y < pg.height; y += step) {
    for (let x = 0; x < pg.width; x += step) {
      const alpha = pg.pixels[(y * pg.width + x) * 4 + 3];
      if (alpha > 128) candidates.push({ x: area.x + x, y: area.y + y });
    }
  }
  pg.remove();

  const shuffled = shuffle(candidates);
  return {
    positions: cases.map((_, i) => shuffled[i % shuffled.length]),
    labels: [],
    visible: cases.map(() => true),
  };
}

function textLayout(cases, area, text, visibleCount = cases.length, hiddenTarget = offscreenTarget) {
  // Text wird in einer separaten Grafik gerastert, damit Partikel die Buchstaben bilden.
  text = String(text);

  const pg = createGraphics(Math.floor(area.w), Math.floor(area.h));
  pg.pixelDensity(1);
  pg.clear();
  pg.noStroke();
  pg.fill(255);
  pg.textAlign(CENTER, CENTER);
  pg.textStyle(BOLD);
  pg.textSize(area.h * 0.6);

  // Schriftgröße so anpassen, dass der Text nicht über den Diagrammbereich hinausgeht.
  const maxWidth = area.w * 0.9;
  if (pg.textWidth(text) > maxWidth) {
    pg.textSize(pg.textSize() * (maxWidth / pg.textWidth(text)));
  }
  pg.text(text, pg.width / 2, pg.height / 2);

  // Die sichtbaren Textpixel werden zu Kandidaten für Partikelpositionen.
  pg.loadPixels();
  const candidates = [];
  const step = 3;
  for (let y = 0; y < pg.height; y += step) {
    for (let x = 0; x < pg.width; x += step) {
      const alpha = pg.pixels[(y * pg.width + x) * 4 + 3];
      if (alpha > 128) candidates.push({ x: area.x + x, y: area.y + y });
    }
  }
  pg.remove();

  // Durch Mischen verteilen sich die Partikel abwechslungsreicher auf den Text.
  const shuffled = shuffle(candidates);
  const positions = cases.map((_, i) => (
    i < visibleCount
      ? shuffled[i % shuffled.length]
      : hiddenTarget(i, area)
  ));

  return {
    positions,
    labels: [],
    visible: cases.map((_, i) => i < visibleCount),
  };
}

function offscreenTarget(index, area) {
  // Ziele oberhalb des Fensters; die Streuung verhindert parallele Flugbahnen.
  const horizontalSpread = ((index * 37) % 101) / 100;
  const verticalDistance = 0.25 + ((index * 61) % 100) / 100;

  return {
    x: area.x + horizontalSpread * area.w,
    y: area.y - verticalDistance * area.h,
  };
}

function belowScreenTarget(index, area) {
  // Ziele unterhalb des Fensters für die später einfliegenden Partikel.
  const horizontalSpread = ((index * 53) % 101) / 100;
  const verticalDistance = 0.25 + ((index * 71) % 100) / 100;

  return {
    x: area.x + horizontalSpread * area.w,
    y: area.y + area.h + verticalDistance * area.h,
  };
}

function unitChart(cases, area, { categories, labels, counts, startIndex = 0, perRow }) {
  // Für jede Saisonalität werden genau so viele Partikelindizes gesammelt,
  // wie in der jeweiligen Anzahl_Particles-Spalte angegeben sind.
  const groups = new Map(categories.map((cat) => [cat, []]));
  let caseIndex = startIndex;
  categories.forEach((cat, categoryIndex) => {
    const group = groups.get(cat);
    for (let i = 0; i < counts[categoryIndex] && caseIndex < cases.length; i++) {
      group.push(caseIndex);
      caseIndex++;
    }
  });

  // Geometrie der beiden Spalten berechnen.
  const labelSpace = 30;
  const maxCount = Math.max(...[...groups.values()].map((g) => g.length));
  const colWidth = area.w / categories.length;
  const maxRows = Math.ceil(maxCount / perRow);
  const spacing = Math.min(
    (colWidth * 0.8) / perRow,
    (area.h - labelSpace * 2) / maxRows
  );
  const bottom = area.y + area.h - labelSpace;
  const positions = new Array(cases.length);
  const chartLabels = [];

  // Partikel innerhalb jeder Kategorie von unten nach oben stapeln.
  categories.forEach((cat, k) => {
    const centerX = area.x + (k + 0.5) * colWidth;
    const group = groups.get(cat);

    group.forEach((particleIndex, j) => {
      const col = j % perRow;
      const row = Math.floor(j / perRow);
      positions[particleIndex] = {
        x: centerX + (col - (perRow - 1) / 2) * spacing,
        y: bottom - (row + 0.5) * spacing,
      };
    });

    const rows = Math.ceil(group.length / perRow);
    chartLabels.push({
      text: labels[k],
      x: centerX,
      y: bottom + labelSpace * 0.6,
    });
    chartLabels.push({
      text: String(group.length),
      x: centerX,
      y: bottom - rows * spacing - 12,
    });
  });

  // Nicht verwendete Partikel erhalten weiterhin ein Ziel, bleiben aber unsichtbar.
  const visible = positions.map(position => Boolean(position));
  for (let i = 0; i < positions.length; i++) {
    if (!positions[i]) positions[i] = offscreenTarget(i, area);
  }

  return { positions, labels: chartLabels, visible };
}
