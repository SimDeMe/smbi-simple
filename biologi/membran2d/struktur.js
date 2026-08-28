/* ═══════════════════════════════════════════════════════════
   struktur.js — selve membranen: fosfolipid-dobbeltlaget og
   kolesterolet imellem det.

   Den ved ikke, at der findes transport. Den kender kun de steder
   i bredden, hvor der står et protein, og lader være med at lægge
   fosfolipider dér.

   Målene: lærredet er 1660 × 760 enheder, og membranen er 116
   enheder tyk. En rigtig cellemembran er ca. 7,5 nm fra ydersiden
   af det ene hovedlag til ydersiden af det andet, så 1 enhed er
   ca. 0,065 nm. En kaliumion med vandkappe fylder derfor ca. 28
   enheder — hvilket er præcis den kappe, molekyler.js tegner.
   ═══════════════════════════════════════════════════════════ */

export const MÅL = {
  bredde:1660, højde:760,
  membranTop:322, membranBund:438, midte:380,
  hoved:12, afstand:26,
  /* vandrummene */
  udTop:14, indBund:746,
};

/* Så langt uden for lærredets kant membranen og vandet rækker.
   Kameraet må gå ud over kanten, når det zoomer ind på den
   yderste transportvej, og så skal der stadig være membran at se
   på — ikke bart papir. */
export const UDENFOR = 300;

/* De y-værdier, alle moduler regner ud fra. */
export const Y = {
  ud:        MÅL.membranTop,                 // membranens overflade udadtil
  ind:       MÅL.membranBund,                // ... og indadtil
  hovedUd:   MÅL.membranTop + MÅL.hoved,     // midten af et ydre hoved
  hovedInd:  MÅL.membranBund - MÅL.hoved,
  midte:     MÅL.midte,
  vandUd:    MÅL.udTop,
  vandInd:   MÅL.indBund,
};

const BLÆK   = '#17211F';
const HOVED  = '#8FD3F0';
const HALE   = '#F0C265';
const KOL    = '#B9E08A';

/* ── Små tegnehjælpere, som mekanismerne også bruger ────── */

/** Fyld en form og sæt blækkant om den — sidens grundfigur. */
export function flade(g, tegnSti, farve, streg = 2.4){
  g.beginPath(); tegnSti(g);
  g.fillStyle = farve; g.fill();
  g.lineWidth = streg; g.strokeStyle = BLÆK; g.stroke();
}

/** Mono-mærkat på figuren — proteinnavne og sidernes navne.
    Enheder skrives, som de staves: her sættes der ingen versaler
    på, teksten skrives som den skal se ud. */
export function tegnMærkat(g, tekst, x, y, {størrelse = 15, farve = '#FFF6E0', plade = 'rgba(23,33,31,0.82)'} = {}){
  g.save();
  g.font = `600 ${størrelse}px 'IBM Plex Mono', ui-monospace, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const b = g.measureText(tekst).width + størrelse * 1.1;
  const h = størrelse * 1.75;
  if(plade){
    g.beginPath();
    g.roundRect(x - b / 2, y - h / 2, b, h, h / 2);
    g.fillStyle = plade; g.fill();
  }
  g.fillStyle = farve;
  g.fillText(tekst, x, y);
  g.restore();
}

/** Pil, der viser retningen for en strøm. Stregtype er signalet —
    farve må aldrig stå alene. */
export function tegnPil(g, x, y0, y1, farve, {bred = 7, stiplet = false} = {}){
  const ned = y1 > y0;
  g.save();
  g.lineWidth = bred * 0.62; g.strokeStyle = farve; g.lineCap = 'round';
  if(stiplet) g.setLineDash([bred * 1.5, bred * 1.3]);
  g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1 - (ned ? bred * 1.7 : -bred * 1.7)); g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(x, y1);
  g.lineTo(x - bred, y1 - (ned ? bred * 1.8 : -bred * 1.8));
  g.lineTo(x + bred, y1 - (ned ? bred * 1.8 : -bred * 1.8));
  g.closePath();
  g.fillStyle = farve; g.fill();
  g.restore();
}

/* ── Ét fosfolipidpar ──────────────────────────────────── *
 * Tegnet ét sted, så det ser ens ud, hvor det end sidder: i det
 * flade dobbeltlag, i en membran der bugter sig indad om en
 * LDL-partikel, og hele vejen rundt om en vesikel. (cx, cy) er
 * midt mellem de to lag, og `vinkel` er den retning, "udad" peger
 * i — 0 er lige op.                                              */
export const HALVTYK = 46;          // fra midten ud til et hoved

export function tegnLipidPar(g, cx, cy, vinkel = 0, {bøj = 0, kunUdad = false, kunIndad = false} = {}){
  g.save();
  g.translate(cx, cy);
  g.rotate(vinkel);
  g.lineJoin = 'round'; g.lineCap = 'round';

  for(const s of [-1, 1]){          // -1 = det ydre lag, +1 = det indre
    if(s < 0 && kunIndad) continue;
    if(s > 0 && kunUdad)  continue;
    const hy = s * HALVTYK;
    const ht = s * (HALVTYK - 12);
    const he = s * 3;
    g.beginPath();
    for(const d of [-4.6, 4.6]){
      g.moveTo(d, ht);
      g.quadraticCurveTo(d + bøj, (ht + he) / 2, d * 1.15 + bøj * 0.5, he);
    }
    g.lineWidth = 6.6; g.strokeStyle = 'rgba(23,33,31,0.18)'; g.stroke();
    g.lineWidth = 4.2; g.strokeStyle = HALE; g.stroke();

    g.beginPath(); g.arc(0, hy, MÅL.hoved, 0, Math.PI * 2);
    g.fillStyle = HOVED; g.fill();
    g.lineWidth = 2.2; g.strokeStyle = BLÆK; g.stroke();
  }
  g.restore();
}

/** Kolesterolet, der sætter sig ind mellem halerne. */
export function tegnKolesterol(g, cx, cy, vinkel = 0, side = -1){
  g.save(); g.translate(cx, cy); g.rotate(vinkel);
  flade(g, c => { c.roundRect(-5, side * 40 - 17, 10, 34, 5); }, KOL, 2);
  g.restore();
}

/* ── Dobbeltlaget ──────────────────────────────────────── */

/**
 * @param spans  [{x0,x1}] — de steder i bredden, hvor der står et
 *               protein, og hvor der derfor ikke er fosfolipider.
 */
export function byggDobbeltlag(spans){
  const fri = x => !spans.some(s => x > s.x0 - 9 && x < s.x1 + 9);

  const lipider = [];
  for(let x = -UDENFOR; x < MÅL.bredde + UDENFOR; x += MÅL.afstand){
    if(!fri(x)) continue;
    lipider.push({
      x0:x,
      fase: Math.random() * Math.PI * 2,
      fart: 0.16 + Math.random() * 0.22,
      svaj: 3.5 + Math.random() * 3.5,
    });
  }

  /* Hvert femte hul får kolesterol, så det kan ses uden at fylde. */
  const kolesterol = [];
  for(let i = 0; i < lipider.length; i += 3){
    kolesterol.push({
      x0:lipider[i].x0 + MÅL.afstand / 2,
      side:i % 6 === 0 ? -1 : 1,
      fase:Math.random() * 6.3,
    });
  }

  let visKolesterol = true;
  let t = 0;

  return {
    get antal(){ return lipider.length; },
    sætKolesterol(v){ visKolesterol = v; },
    opdater(tid){ t = tid; },
    tegn(g, u, dæmp = 1){
      g.save();
      g.globalAlpha = dæmp;
      for(const l of lipider){
        if(l.x0 < u.x0 - 30 || l.x0 > u.x1 + 30) continue;
        tegnLipidPar(g, l.x0 + Math.sin(t * l.fart + l.fase) * l.svaj, Y.midte, 0,
                     {bøj: Math.sin(t * l.fart * 1.7 + l.fase) * 4});
      }
      if(visKolesterol){
        for(const k of kolesterol){
          if(k.x0 < u.x0 - 30 || k.x0 > u.x1 + 30) continue;
          tegnKolesterol(g, k.x0 + Math.sin(t * 0.2 + k.fase) * 3, Y.midte, 0, k.side);
        }
      }
      g.restore();
    },
  };
}

/* ── Membranproteinet som form ──────────────────────────── *
 * De fleste transportproteiner på siden er den samme grundform:
 * to halvdele, der spænder tværs gennem membranen med en pore
 * eller et hulrum imellem. Kanalen holder åbningen ens hele vejen
 * igennem, bæreren og pumpen lukker den i den ene ende ad gangen —
 * og det er netop dét, der skiller en kanal fra en bærer.        */
export function tegnMembranprotein(g, x, o = {}){
  const {
    b = 66, farve = '#C9A9F0', streg = 2.8,
    åbenUd = 20, åbenInd = 20, talje = 14,
    top = Y.ud - 16, bund = Y.ind + 16,
  } = o;
  const midY = (top + bund) / 2;
  for(const s of [-1, 1]){
    flade(g, c => {
      const ydre = x + s * b / 2;
      c.moveTo(x + s * åbenUd / 2, top);
      c.bezierCurveTo(x + s * åbenUd / 2, top + 26,
                      x + s * talje / 2,  midY - 30,
                      x + s * talje / 2,  midY);
      c.bezierCurveTo(x + s * talje / 2,  midY + 30,
                      x + s * åbenInd / 2, bund - 26,
                      x + s * åbenInd / 2, bund);
      c.lineTo(ydre - s * 9, bund);
      c.quadraticCurveTo(ydre, bund, ydre, bund - 9);
      c.lineTo(ydre, top + 9);
      c.quadraticCurveTo(ydre, top, ydre - s * 9, top);
      c.closePath();
    }, farve, streg);
  }
}

/** Et lille bindingssted i et protein — den fordybning, en ion
    eller et sukkermolekyle sætter sig i. */
export function tegnSæde(g, x, y, r, {optaget = false} = {}){
  g.save();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = optaget ? 'rgba(23,33,31,0.10)' : 'rgba(23,33,31,0.16)';
  g.fill();
  g.setLineDash([3.5, 3.5]); g.lineWidth = 1.6;
  g.strokeStyle = 'rgba(23,33,31,0.5)'; g.stroke();
  g.restore();
}
