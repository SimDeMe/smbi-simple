/* ═══════════════════════════════════════════════════════════
   reaktion.js — selve reaktionen, set udefra.

   Når kloroplasten har seks CO₂ og seks H₂O, og eleven trykker
   på knappen, slipper de tolv molekyler deres pladser og lægger
   sig i en ring. Ringen drejer, trækker sig sammen, og ud af den
   kommer ét molekyle: glukose. Det er billedet på, at tolv små
   molekyler er blevet bundet sammen til ét stort.

   Modulet regner ikke på biologi og kender ikke scenen — det
   får at vide, hvor molekylerne står, og hvor midten er, og
   tegner så de halvandet sekund, det tager. Ilten sender
   side.js ud bagefter.
   ═══════════════════════════════════════════════════════════ */
import {tegnMolekyle} from './molekyler.js';

const NS = 'http://www.w3.org/2000/svg';

const RING_UD = 64;    /* ringens radius, når molekylerne har fundet plads */
const RING_IND = 12;   /* … og når den er trukket helt sammen              */

/* Faserne i sekunder: saml ringen, drej den sammen, og lad
   glukosen komme til syne. */
const TID = {saml:0.60, drej:0.95, blitz:0.34};
/* Ved reduceret bevægelse skal skiftet stadig kunne ses — men det
   skal være overstået med det samme og uden at snurre rundt. */
const TID_ROLIG = {saml:0.14, drej:0.12, blitz:0.14};

const roligt = () => !!window.matchMedia?.('(prefers-reduced-motion:reduce)')?.matches;

const blend = (a, b, u) => a + (b - a) * u;
const bloed = u => u < 0.5 ? 2*u*u : 1 - Math.pow(-2*u+2, 2)/2;
const flyt = (n, x, y, skala) =>
  n.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+') scale('+skala.toFixed(3)+')');

/* `start` er de tolv molekyler i den rækkefølge, de skal stå i
   ringen: [{type, fra:{x,y}}, …]. `naarFaerdig` kaldes, når
   glukosen står færdig i midten — så kan side.js sende den videre
   til lageret og ilten ud i luften. */
export function nyRing(lag, midte, start, naarFaerdig){
  const tid = roligt() ? TID_ROLIG : TID;
  const drejninger = roligt() ? 0 : 1.75;
  const slut = tid.saml + tid.drej + tid.blitz;

  const paaRing = (v, r) => ({x:midte.x + r*Math.cos(v), y:midte.y + r*Math.sin(v)});

  const dele = start.map((s, i) => {
    const node = tegnMolekyle(s.type, {navn:false});
    node.classList.add('flyver');
    flyt(node, s.fra.x, s.fra.y, 0.6);
    lag.appendChild(node);
    return {node, fra:s.fra, vinkel:-Math.PI/2 + i*Math.PI/6};
  });

  /* Blitzen og glukosen ligger klar fra begyndelsen, men ses først
     til sidst — så slipper vi for at bygge noget midt i en løkke. */
  const blitz = document.createElementNS(NS,'circle');
  blitz.setAttribute('class','ring-blitz');
  blitz.setAttribute('cx', midte.x);
  blitz.setAttribute('cy', midte.y);
  blitz.setAttribute('r', RING_IND);
  blitz.setAttribute('opacity', 0);
  lag.appendChild(blitz);

  const glukose = tegnMolekyle('glukose', {navn:false});
  glukose.classList.add('flyver');
  glukose.setAttribute('opacity', 0);
  flyt(glukose, midte.x, midte.y, 0.3);
  lag.appendChild(glukose);

  let ur = 0, ryddet = false;

  function ryd(){
    if (ryddet) return;
    ryddet = true;
    for (const d of dele) d.node.remove();
    blitz.remove();
    glukose.remove();
  }

  function opdater(dt){
    if (ryddet) return;
    ur += dt;

    if (ur < tid.saml){
      /* Molekylerne forlader pladserne og stiller sig i ring. */
      const u = bloed(ur / tid.saml);
      for (const d of dele){
        const maal = paaRing(d.vinkel, RING_UD);
        flyt(d.node, blend(d.fra.x, maal.x, u), blend(d.fra.y, maal.y, u), 0.6);
      }
    } else if (ur < tid.saml + tid.drej){
      /* Ringen tager fart og trækker sig sammen om midten. */
      const u = (ur - tid.saml) / tid.drej;
      const drej = 2*Math.PI * drejninger * u*u;
      const r = blend(RING_UD, RING_IND, u*u);
      const s = blend(0.6, 0.26, u);
      const svind = 1 - Math.max(0, (u - 0.78)/0.22);
      for (const d of dele){
        const p = paaRing(d.vinkel + drej, r);
        flyt(d.node, p.x, p.y, s);
        d.node.setAttribute('opacity', svind.toFixed(2));
      }
    } else {
      /* De tolv er væk, og ét glukosemolekyle står tilbage. */
      const u = Math.min(1, (ur - tid.saml - tid.drej) / tid.blitz);
      for (const d of dele) d.node.setAttribute('opacity', 0);
      blitz.setAttribute('opacity', (0.95*(1-u*u)).toFixed(2));
      blitz.setAttribute('r', (RING_IND + 64*u).toFixed(1));
      glukose.setAttribute('opacity', 1);
      /* et lille overskud, så den «popper» frem og falder på plads */
      const s = u < 0.55 ? blend(0.3, 1.35, u/0.55) : blend(1.35, 1, (u-0.55)/0.45);
      flyt(glukose, midte.x, midte.y, s);
    }

    if (ur >= slut){
      ryd();
      naarFaerdig?.();
    }
  }

  return {opdater, ryd};
}
