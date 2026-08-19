/* ═══════════════════════════════════════════════════════════
   forklaring.js — udpegning og forklaringsrude.

   Ruden ved siden af figuren viser altid det, man sidst har
   peget på: enten en del af membranen (klik i figuren eller på
   en signaturknap) eller en transportvej (vælgerknapperne).
   Teksterne kommer fra struktur.js og fra transport-*.js —
   dette modul ejer ingen fagtekst selv.
   ═══════════════════════════════════════════════════════════ */
import {beskriv} from './struktur.js';

export function opretForklaring({model, membran, lærred, felter, signaturer,
                                 naarValgt = () => {}}){
  const {stempel, navn, tekst} = felter;

  /** Nærmeste forfader — eller elementet selv — der bærer et delId. */
  function delAf(objekt){
    for(let n = objekt; n; n = n.parent){
      if(n.userData && n.userData.delId) return n.userData.delId;
    }
    return null;
  }

  function skriv(mærkat, overskrift, brødtekst){
    stempel.textContent = mærkat;
    navn.textContent    = overskrift;
    tekst.textContent   = brødtekst;
  }

  /** Vis en del af membranen — lipidhoved, hale, kolesterol, protein … */
  function visDel(delId){
    const d = beskriv(delId);
    if(!d) return false;
    skriv(d.type ?? 'Del af membranen', d.navn, d.beskrivelse);
    membran.fremhæv(delId);
    markerSignatur(delId);
    naarValgt();
    return true;
  }

  /** Vis en transportvej. Fremhæver det protein, vejen bruger. */
  function visVej(mekanisme){
    skriv('Transportvej', mekanisme.navn, mekanisme.beskrivelse);
    membran.fremhæv(mekanisme.protein);
    markerSignatur(mekanisme.protein);
    return true;
  }

  /* ── Signaturknapperne nederst ─────────────────────────── *
   * De er både forklaring på farverne og den vej, man kan nå
   * hver enkelt del med tastaturet alene.                     */
  function markerSignatur(delId){
    for(const b of signaturer){
      b.setAttribute('aria-pressed', b.dataset.del === delId ? 'true' : 'false');
    }
  }
  for(const b of signaturer){
    b.addEventListener('click', () => visDel(b.dataset.del));
  }

  /* ── Klik i figuren ────────────────────────────────────── *
   * Et klik efter et træk skal ikke tælle som en udpegning —
   * ellers vælger man tilfældige dele, hver gang man drejer.   */
  let ned = null;
  lærred.addEventListener('pointerdown', e => { ned = {x:e.clientX, y:e.clientY}; });
  lærred.addEventListener('click', e => {
    if(ned && Math.hypot(e.clientX - ned.x, e.clientY - ned.y) > 5) return;
    for(const træf of model.peg(e, membran.maalObjekter)){
      const id = delAf(træf.object);
      if(id && visDel(id)) return;
    }
  });

  return {visDel, visVej};
}
