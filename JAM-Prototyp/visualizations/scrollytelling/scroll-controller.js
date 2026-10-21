/**
 * GSAP-Seite: beobachtet das Scrollen und schreibt in state.
 * state.progress von 0 bis 1
 * state.lastIndex (das Layout vorher)
 * state.currentIndex (das Layout, das akutell aufgebaut wird)
*/
gsap.registerPlugin(ScrollTrigger);

// HTML-Sections in der Reihenfolge sammeln, in der sie gescrollt werden.
const sections = gsap.utils.toArray('.section');

// Layout-Namen in Section-Reihenfolge, z. B. ['total', 'month', 'sex']
// Browser sammelt alle data-*-Attribute eines Elements automatisch in diesem Objekt 'section.dataset'
// state.layoutNames wird von sketch.js gelesen, um die Layouts zu bauen
state.layoutNames = sections.map((section) => section.dataset.layout);

// Für jede Section den Scrollbereich vom Eintritt bis zum oberen Viewport-Rand erzeugen.
sections.forEach((section, i) => {
  if (i === 0) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top 110%', // Der Übergang beginnt etwas bevor die Section den Viewport erreicht.
    end: 'top top', //Bedeutung: Die Animation oder der Bereich endet, wenn die Oberkante (top) des Trigger-Elements die Oberkante (top) des Viewports berührt.
    // Beim Betreten wird das Ziel-Layout gewechselt; onEnterBack unterstützt Rückwärts-Scrollen.
    onEnter:     () => setTransition(i),
    onEnterBack: () => setTransition(i),
    onUpdate: (self) => {
      // ScrollTrigger liefert den normierten Fortschritt des Übergangs.
      state.progress = self.progress;
    },
  });
});

function setTransition(index) {
  // GSAP liefert den Zielindex; state merkt sich zusätzlich das vorherige Layout.
  state.lastIndex = index - 1;
  state.currentIndex = index;
}