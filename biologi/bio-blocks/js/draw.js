/* =====================================================================
   Tegnehjælp der deles mellem motoren og modulerne.

   Et modul tegner selv sin strukturformel (Haworth, aminosyre, ester),
   og skal derfor kunne placere ting i den samme kasse — med de samme
   spejlinger og vendinger — som blokkene bruger. Filen kender ikke til
   molekyler; den kender kun kassen.
   ===================================================================== */

import { SVG_NS, text } from './svg.js';
import { UNIT_W, UNIT_H } from './units.js';

/* Gruppen en enhed tegnes i — spejlet for fruktose, vendt 180° når en
   binding vender ringen om. */
export function unitGroup(parent, p) {
    const unit = document.createElementNS(SVG_NS, 'g');
    let t = `translate(${p.x}, ${p.y})`;
    if (p.mirrorX) t += ` translate(${UNIT_W},0) scale(-1,1)`;
    if (p.flip)    t += ` translate(0,${UNIT_H}) scale(1,-1)`;
    unit.setAttribute('transform', t);
    parent.appendChild(unit);
    return unit;
}

/* Tekst inde i en spejlet eller vendt enhed: spejlingen ophæves på selve
   glyfferne, så tekst altid læses fra venstre mod højre. */
export function placedText(unit, p, str, x, y, cls) {
    const tg = document.createElementNS(SVG_NS, 'g');
    let t = `translate(${x}, ${y})`;
    if (p.mirrorX) t += ' scale(-1,1)';
    if (p.flip)    t += ' scale(1,-1)';
    tg.setAttribute('transform', t);
    tg.appendChild(text(str, 0, 0, cls));
    unit.appendChild(tg);
    return tg;
}
