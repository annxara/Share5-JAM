// Name der Krankheit, deren CSV-Zeilen für die Visualisierung verwendet werden
// Dieser Wert ist der zentrale Filter für alle folgenden Datenabfragen
let ausgewählte_Krankheit = "Salmonellose"

// Erstellt für jedes benötigte Partikel ein minimales Case-Objekt
// Die eigentlichen Werte kommen aus der CSV; die Cases dienen nur als stabile
// Partikel-IDs, damit jedes Partikel in allen Layouts wiedererkannt wird
function createFakeCases(count) {
  // Array.from erzeugt genau so viele Objekte, wie Partikel benötigt werden
  // Der zweite Parameter liefert für jedes Objekt eine fortlaufende ID
  return Array.from({ length: count }, (_, id) => ({ id }));
}
 
// Globale Liste der erzeugten Partikel-Cases.
// Sie wird in sketch.js nach dem Laden der CSV befüllt.
let CASES = [];

// Gibt alle Zeilen eines Oberthemas für die ausgewählte Krankheit zurück.
// Beispiel: getTopicRows(data, 'Saisonalitaet') liefert die Zeilen für August und Oktober.
function getTopicRows(data, topic) {
  // filter durchläuft alle CSV-Zeilen und behält nur passende Kombinationen
  // aus Oberthema und ausgewählter Krankheit.
  return data.filter(
    d => d.Oberthema === topic &&
      d.Krankheit === ausgewählte_Krankheit
    );
}

// Gibt die erste Zeile eines Oberthemas zurück und bricht bei fehlenden Daten ab.
// Diese Funktion eignet sich für Oberthemen mit genau einer Zeile, z. B. Trend.
function getTopicRow(data, topic) {
  // [0] nimmt die erste passende Zeile aus dem von getTopicRows gelieferten Array.
  const row = getTopicRows(data, topic)[0];

  // Ohne diese Prüfung würden spätere Zugriffe wie row.Info einen unklaren
  // Fehler "Cannot read properties of undefined" auslösen.
  if (!row) {
    throw new Error(
      `Kein ${topic}-Datensatz für ${ausgewählte_Krankheit} gefunden.`
    );
  }

  return row;
}

// Die Info-Texte werden später als Überschriften in die HTML-Sections eingesetzt.
// Der Text stammt aus der Spalte Info und wird nicht im JavaScript fest codiert.
function getTopicInfo(data, topic) {
  return getTopicRow(data, topic).Info;
}

// Partikelanzahl der ersten Ansicht.
// Hier wird Anzahl_Particles aus der Aktualitaet-Zeile gelesen.
function getParticleCount(data) {
  return getTopicRow(data, 'Aktualitaet').Anzahl_Particles;
}

// Daten und Text der Veränderungsansicht.
// Das Oberthema Veraenderung enthält eine einzelne Textzeile wie "+ 265".
function getChangeCase(data) {
  return getTopicRow(data, 'Veraenderung');
}

function getChangeText(data) {
  // Nur die Text-Spalte der gefundenen Veränderungszeile zurückgeben.
  return getChangeCase(data).Text;
}

function getChangeParticleCount(data) {
  // Diese Anzahl bestimmt, wie viele Partikel den Veränderungstext bilden.
  return getChangeCase(data).Anzahl_Particles;
}

// Baut aus den Saisonalitätszeilen die beiden Spalten der Darstellung.
// Anders als bei Aktualitaet und Veraenderung gibt es hier mehrere CSV-Zeilen.
function getSeasonalityColumns(data) {
  const seasonalityCases = getTopicRows(data, 'Saisonalitaet');

  // Ohne mindestens eine Zeile könnte kein Saisonalitätslayout berechnet werden.
  if (seasonalityCases.length === 0) {
    throw new Error(
      `Keine Saisonalitaet-Datensaetze für ${ausgewählte_Krankheit} gefunden.`
    );
  }

  // Nur die für die Darstellung benötigten Eigenschaften weitergeben:
  // Monat wird zum Spaltenlabel, Anzahl_Particles zur Partikelmenge.
  return seasonalityCases.map(d => ({
    label: d.Monat,
    count: d.Anzahl_Particles,
  }));
}

// Zusätzliche Partikel, die am Anfang unterhalb des Fensters warten.
// Die Werte der Saisonalität werden addiert, damit CASES groß genug ist,
// um später alle Saisonalitäts-Partikel darstellen zu können.
function getSeasonalityParticleCount(data) {
  // reduce summiert die count-Werte aller Saisonalitätsspalten.
  return getSeasonalityColumns(data)
    .reduce((total, column) => total + column.count, 0);
}

// Liest die Richtung des Trendpfeils und akzeptiert nur die drei vorgesehenen Werte.
function getTrendDirection(data) {
  // Die Trendzeile enthält den Wert in der eigenen CSV-Spalte Trend,
  // zum Beispiel "steigend", "stagnierend" oder "sinkend".
  const trendCase = getTopicRow(data, 'Trend');

  // Die Visualisierung kennt nur diese drei Richtungen.
  // Ein Tippfehler in der CSV wird dadurch früh und verständlich gemeldet.
  if (!trendCase || !['steigend', 'stagnierend', 'sinkend'].includes(trendCase.Trend)) {
    throw new Error(
      `Ungültige Trend-Richtung für ${ausgewählte_Krankheit} gefunden.`
    );
  }

  return trendCase.Trend;
}