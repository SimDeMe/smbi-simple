/* =====================================================================
   De faste elementer i siden. Moduler er deferred, så DOM'en står klar
   når denne fil køres, og opslagene kan laves med det samme.
   ===================================================================== */

export const svgSpace  = document.getElementById('svg-space');
export const molLayer  = document.getElementById('layer-molecules');
export const enzLayer  = document.getElementById('layer-enzymes');
export const pvLayer   = document.getElementById('layer-preview');
export const fxLayer   = document.getElementById('layer-fx');
export const statusBar = document.getElementById('status');
export const waterOut  = document.getElementById('water-count');
