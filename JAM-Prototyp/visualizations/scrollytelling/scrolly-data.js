//CSV-Daten lesen und Daten vorbereiten


let ausgewählte_Krankheit = "Salmonellose";

function createFakeCases(count) {
  return Array.from({ length: count }, (_, id) => ({ id }));
}

let CASES = [];

function getTopicRows(data, topic) {
  return data.filter(
    d => d.Oberthema === topic &&
      d.Krankheit === ausgewählte_Krankheit
  );
}

function getTopicRow(data, topic) {
  const row = getTopicRows(data, topic)[0];

  if (!row) {
    throw new Error(
      `Kein ${topic}-Datensatz für ${ausgewählte_Krankheit} gefunden.`
    );
  }

  return row;
}

function getTopicInfo(data, topic) {
  return getTopicRow(data, topic).Info;
}

function getParticleCount(data) {
  return getTopicRow(data, 'Aktualitaet').Anzahl_Particles;
}

function getChangeCase(data) {
  return getTopicRow(data, 'Veraenderung');
}

function getChangeText(data) {
  return getChangeCase(data).Text;
}

function getChangeParticleCount(data) {
  return getChangeCase(data).Anzahl_Particles;
}

function getSeasonalityColumns(data) {
  const seasonalityCases = getTopicRows(data, 'Saisonalitaet');

  if (seasonalityCases.length === 0) {
    throw new Error(
      `Keine Saisonalitaet-Datensaetze für ${ausgewählte_Krankheit} gefunden.`
    );
  }

  return seasonalityCases.map(d => ({
    label: d.Monat,
    count: d.Anzahl_Particles,
  }));
}

function getSeasonalityParticleCount(data) {
  return getSeasonalityColumns(data)
    .reduce((total, column) => total + column.count, 0);
}

function getTrendDirection(data) {
  const trendCase = getTopicRow(data, 'Trend');

  if (!['steigend', 'stagnierend', 'sinkend'].includes(trendCase.Trend)) {
    throw new Error(
      `Ungültige Trend-Richtung für ${ausgewählte_Krankheit} gefunden.`
    );
  }

  return trendCase.Trend;
}