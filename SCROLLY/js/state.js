/**
 * Gemeinsamer Zustand – die Verbindung zwischen GSAP und p5.
 *
 *   GSAP (scroll.js)  ──schreibt──▶  state  ◀──liest──  p5 (sketch.js)
 */
const state = {
  // Namen kommen aus den data-layout-Attributen der HTML-Sections.
  layoutNames: [],       // Layout-Namen in Section-Reihenfolge, z. B. ['total', 'month', 'sex']
  // Indizes des vorherigen und aktuellen Layouts.
  lastIndex: 0,      // Layout, von dem wir kommen
  currentIndex: 0,   // Layout, zu dem wir wollen
  // Scrollfortschritt des aktuellen Übergangs: 0 = Anfang, 1 = Ende.
  progress: 1,       // 0 = lastTarget, 1 = currentTarget
};