/* ═══════════════════════════════════════════════════════════
   molekyler.js — fagdataene.

   De fire molekyler, siden handler om, og den kuglemodel hver
   af dem tegnes som. Ét sted at rette, hvis en farve, en formel
   eller en formulering skal skærpes. Ingen kode her, kun indhold
   og en enkelt tegnefunktion, der oversætter dataene til SVG.

   Farverne følger kuglemodellernes: kulstof mørkt, ilt rødt,
   brint lyst. Men farven står aldrig alene — hvert molekyle har
   sin egen form (CO₂ er lige, H₂O er bøjet, O₂ er to kugler,
   glukose er en sekskant) og sin formel skrevet under sig.
   ═══════════════════════════════════════════════════════════ */

export const ATOMFARVER = {
  C:'#3A4744',   /* kulstof — mørk grafit  */
  O:'#FF6A3D',   /* ilt — koralrød         */
  H:'#FFF9EE',   /* brint — papirhvid      */
};

export const MOLEKYLER = {
  co2:{
    id:'co2', navn:'Kuldioxid', formel:'CO₂',
    hvor:'i luften',
    aria:'Kuldioxid, C O 2 — tre kugler på række',
    atomer:[{x:-12,y:0,r:5.6,g:'O'},{x:0,y:0,r:6.6,g:'C'},{x:12,y:0,r:5.6,g:'O'}],
    bindinger:[[0,1],[1,2]],
  },
  h2o:{
    id:'h2o', navn:'Vand', formel:'H₂O',
    hvor:'i jorden',
    aria:'Vand, H 2 O — en stor kugle med to små, bøjet',
    atomer:[{x:0,y:-3,r:6.6,g:'O'},{x:-9.5,y:6,r:4.4,g:'H'},{x:9.5,y:6,r:4.4,g:'H'}],
    bindinger:[[0,1],[0,2]],
  },
  o2:{
    id:'o2', navn:'Ilt', formel:'O₂',
    hvor:'i luften',
    aria:'Ilt, O 2 — to kugler',
    atomer:[{x:-6,y:0,r:6.2,g:'O'},{x:6,y:0,r:6.2,g:'O'}],
    bindinger:[[0,1]],
  },
  /* Glukose tegnes ikke som kuglemodel — 24 atomer bliver til grød i
     den størrelse. Den får sekskanten, som eleverne møder den i, og
     formlen ved siden af. */
  glukose:{
    id:'glukose', navn:'Glukose', formel:'C₆H₁₂O₆',
    hvor:'i cellen',
    aria:'Glukose, C 6 H 12 O 6 — en grøn sekskant',
    sekskant:{r:9, fyld:'#8FE07A'},
  },
};

/* Rækkefølgen molekylerne leveres i, når kloroplasten fyldes
   automatisk: seks af hver, skiftevis. */
export const RAAVARER = ['co2','h2o'];

/* ── Tegning ───────────────────────────────────────────────
   Bygger ét molekyle som en <g>, der kan flyttes rundt med et
   transform. `navn` sætter formlen under kuglerne.            */
const NS = 'http://www.w3.org/2000/svg';

export function tegnMolekyle(id, {navn=true, skala=1} = {}){
  const data = MOLEKYLER[id];
  const g = document.createElementNS(NS,'g');
  g.setAttribute('class','mol');
  g.dataset.molekyle = id;

  const indre = document.createElementNS(NS,'g');
  if (skala !== 1) indre.setAttribute('transform','scale('+skala+')');
  g.appendChild(indre);

  if (data.sekskant){
    const r = data.sekskant.r;
    const punkter = [];
    for (let i=0;i<6;i++){
      const v = Math.PI/180 * (60*i - 90);
      punkter.push((r*Math.cos(v)).toFixed(1)+','+(r*Math.sin(v)).toFixed(1));
    }
    const p = document.createElementNS(NS,'polygon');
    p.setAttribute('points', punkter.join(' '));
    p.setAttribute('fill', data.sekskant.fyld);
    p.setAttribute('class','atom');
    indre.appendChild(p);
  } else {
    for (const [a,b] of data.bindinger){
      const l = document.createElementNS(NS,'line');
      l.setAttribute('x1',data.atomer[a].x); l.setAttribute('y1',data.atomer[a].y);
      l.setAttribute('x2',data.atomer[b].x); l.setAttribute('y2',data.atomer[b].y);
      l.setAttribute('class','binding');
      indre.appendChild(l);
    }
    for (const a of data.atomer){
      const c = document.createElementNS(NS,'circle');
      c.setAttribute('cx',a.x); c.setAttribute('cy',a.y); c.setAttribute('r',a.r);
      c.setAttribute('fill',ATOMFARVER[a.g]);
      c.setAttribute('class','atom');
      indre.appendChild(c);
    }
  }

  if (navn){
    const t = document.createElementNS(NS,'text');
    t.setAttribute('class','mol-navn');
    t.setAttribute('x','0');
    t.setAttribute('y', (data.sekskant ? 21 : 20) * skala);
    t.textContent = data.formel;
    g.appendChild(t);
  }
  return g;
}
