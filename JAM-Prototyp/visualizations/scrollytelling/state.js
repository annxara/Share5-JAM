/**
 * Gemeinsamer Zustand – die Verbindung zwischen GSAP und p5.
 *
 * GSAP (scroll-controller.js) schreibt in state.
 * p5 (scroll-sketch.js) liest aus state.
 */
const state = {
  layoutNames: [],
  lastIndex: 0,
  currentIndex: 0,
  progress: 1,
};