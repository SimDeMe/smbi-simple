/* ═══════════════════════════════════════════════════════════
   model.js — regnskabet.

   Alt fagligt indhold, der er tal: døgnets lys, hvor hurtigt
   fotosyntesen og respirationen kører, og bogholderiet over
   BPP, R og NPP. Modellen ved intet om SVG, knapper eller
   adressefelt — den siger kun, hvad der sker, og side.js sørger
   for, at man kan se det.

   Alt regnes i hele glukosemolekyler. Det er den enhed, eleven
   kan tælle på skærmen, og det gør regnskabet til at holde:

       NPP = BPP − R = lager + (biomasse − startbiomasse)

   Ét glukosemolekyle koster 6 CO₂ og 6 H₂O og giver 6 O₂.
   ═══════════════════════════════════════════════════════════ */

export const K = {
  daggry:6, skumring:18,      /* solen står op kl. 6 og ned kl. 18       */
  timerPrSekund:0.22,         /* et døgn tager ca. 110 sekunder          */

  fotoMaks:1.05,              /* glukose pr. time ved fuldt lys, 25 °C   */
  optimumTemp:25,             /* fotosyntesens optimum                   */
  tempBredde:13,              /* hvor bredt optimum er (°C)              */

  respBasis:0.22,             /* glukose pr. time ved 20 °C              */
  respQ10:2,                  /* respirationen fordobles pr. 10 °C       */
  respTemp0:20,

  perGlukose:6,               /* 6 CO₂ + 6 H₂O pr. glukose               */
  lagerTilVaekst:3,           /* over dette går glukosen til ny plante   */
  vaekstFart:0.22,            /* hvor hurtigt overskuddet bliver plante  */
  startBiomasse:6,
  maksLager:8,                /* kun til søjlens skala                   */
};

export const tilstand = {
  klokken:12,                 /* 0–24 timer                              */
  doegn:1,
  lysstyrke:100,              /* skydækket: lysets styrke midt på dagen  */
  temperatur:20,
  modus:'traek',              /* 'traek' = eleven leverer, 'auto' = modellen */
  urKoerer:false,

  co2:0, h2o:0,               /* molekyler samlet i kloroplasten         */
  lager:0,                    /* glukose i cellen                        */
  biomasse:K.startBiomasse,   /* glukose bundet i selve planten          */
  bpp:0, r:0,                 /* døgnets regnskab, i hele glukose        */

  _foto:0,                    /* pulje: brøkdele af et molekyle på vej ind */
  _resp:0,                    /* pulje: brøkdele af en forbrænding        */
  _vaekst:0,                  /* pulje: brøkdele af et vækstskridt        */
};

/* ── Døgnet ────────────────────────────────────────────── */

/* Solens højde over horisonten: en halv sinus hen over de tolv lyse
   timer. 0 om natten, 1 midt på dagen — uafhængig af skydækket. */
export function solHoejde(t = tilstand.klokken){
  if (t <= K.daggry || t >= K.skumring) return 0;
  return Math.sin(Math.PI * (t - K.daggry) / (K.skumring - K.daggry));
}

/* Lyset, der når bladet: solens højde dæmpet af skydækket. */
export function lysNu(t = tilstand.klokken){
  return solHoejde(t) * (tilstand.lysstyrke / 100);
}

export const erLyst = () => lysNu() > 0.02;

/* ── Hastigheder ───────────────────────────────────────── */

/* Fotosyntesen har et optimum: for koldt går det langsomt, for varmt
   holder enzymerne op med at arbejde ordentligt. */
export function tempFaktorFoto(temp = tilstand.temperatur){
  const d = (temp - K.optimumTemp) / K.tempBredde;
  return Math.exp(-0.5 * d * d);
}

/* Respirationen bliver bare hurtigere og hurtigere med varmen (Q₁₀). */
export function respRate(temp = tilstand.temperatur){
  return K.respBasis * Math.pow(K.respQ10, (temp - K.respTemp0) / 10);
}

/* Glukose pr. time, når modellen selv leverer molekylerne. */
export function fotoRate(){
  return K.fotoMaks * lysNu() * tempFaktorFoto();
}

export const npp = () => tilstand.bpp - tilstand.r;

/* ── Ét skridt frem ────────────────────────────────────── *
 * `dt` er simulerede timer. Returnerer de hændelser, side.js skal
 * vise: molekyler på vej ind, forbrændinger, vækst og sult.       */
export function opdater(dt){
  const haendelser = [];
  if (dt <= 0) return haendelser;

  tilstand.klokken += dt;
  while (tilstand.klokken >= 24){ tilstand.klokken -= 24; tilstand.doegn++; }

  /* Respiration — kører hele døgnet, også mens solen skinner.
     Er lageret tomt, tærer planten på sig selv. */
  tilstand._resp += respRate() * dt;
  while (tilstand._resp >= 1){
    if (tilstand.lager > 0){
      tilstand.lager--; tilstand.r++; tilstand._resp -= 1;
      haendelser.push({type:'respiration', fra:'lager'});
    } else if (tilstand.biomasse > 0){
      tilstand.biomasse--; tilstand.r++; tilstand._resp -= 1;
      haendelser.push({type:'respiration', fra:'biomasse'});
    } else {
      tilstand._resp = 0;
      haendelser.push({type:'sult'});
      break;
    }
  }

  /* Vækst — det, der er tilbage, når respirationen har taget sit,
     bliver til ny plante. Det er NPP, man ser vokse i jorden. */
  const overskud = tilstand.lager - K.lagerTilVaekst;
  if (overskud > 0){
    tilstand._vaekst += K.vaekstFart * overskud * dt;
    while (tilstand._vaekst >= 1 && tilstand.lager > K.lagerTilVaekst){
      tilstand._vaekst -= 1;
      tilstand.lager--; tilstand.biomasse++;
      haendelser.push({type:'vaekst'});
    }
    if (tilstand.lager <= K.lagerTilVaekst) tilstand._vaekst = 0;
  } else {
    tilstand._vaekst = 0;
  }

  /* I automatisk tilstand leverer modellen selv råvarerne. Ét
     molekyle ad gangen, så eleven kan følge de 6 + 6. */
  if (tilstand.modus === 'auto'){
    tilstand._foto += fotoRate() * dt;
    const perMolekyle = 1 / (2 * K.perGlukose);
    let vagt = 24;
    while (tilstand._foto >= perMolekyle && vagt-- > 0){
      const type = naesteRaavare();
      if (!type) break;                 /* alle 12 pladser er optaget — vent */
      tilstand._foto -= perMolekyle;
      haendelser.push({type:'behov', molekyle:type});
    }
    /* ophobningen holdes i ave, så en pause ikke udløser et skybrud */
    tilstand._foto = Math.min(tilstand._foto, perMolekyle*3);
  } else {
    tilstand._foto = 0;
  }

  return haendelser;
}

/* Hvilken råvare skal der hentes nu? Den, der er færrest af, når
   dem undervejs regnes med — så de to rækker fyldes side om side.
   Molekylerne er længe om turen, så der må godt være flere på vej,
   end der lige er plads til: de tæller med i næste runde. */
export function naesteRaavare(){
  const co2 = tilstand.co2 + paaVej.co2;
  const h2o = tilstand.h2o + paaVej.h2o;
  if (co2 >= 2*K.perGlukose && h2o >= 2*K.perGlukose) return null;
  return co2 <= h2o ? 'co2' : 'h2o';
}

/* Molekyler, der er lettet, men endnu ikke landet i kloroplasten.
   De tæller med, når der skal findes plads — ellers ville to
   molekyler på vej ind sigte efter den samme plads. */
export const paaVej = {co2:0, h2o:0};

export const erPlads = type => tilstand[type] + paaVej[type] < K.perGlukose;
export const reserver = type => { paaVej[type]++; };
export const frigiv   = type => { paaVej[type] = Math.max(0, paaVej[type]-1); };

/* ── Molekylet er nået frem ────────────────────────────── *
 * Kaldes af side.js, når et molekyle rent faktisk lander i
 * kloroplasten — så følger tallene det, man kan se.            */
export function modtag(type){
  tilstand[type]++;
  return {ok:true, reaktion:tjekReaktion()};
}

/* Seks af hver og lys nok? Så bliver de til glukose og ilt. */
export function tjekReaktion(){
  if (tilstand.co2 < K.perGlukose || tilstand.h2o < K.perGlukose) return false;
  if (!erLyst()) return false;
  tilstand.co2 -= K.perGlukose;
  tilstand.h2o -= K.perGlukose;
  tilstand.lager++;
  tilstand.bpp++;
  return true;
}

/* ── Nulstil ───────────────────────────────────────────── */
export function nulstil(){
  Object.assign(tilstand, {
    doegn:1, co2:0, h2o:0, lager:0, biomasse:K.startBiomasse,
    bpp:0, r:0, _foto:0, _resp:0, _vaekst:0,
  });
  paaVej.co2 = 0; paaVej.h2o = 0;
}
