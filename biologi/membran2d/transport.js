/* ═══════════════════════════════════════════════════════════
   transport.js — registret over sidens transportmekanismer.

   Hver mekanisme ligger i sin egen fil, `transport-<id>.js`, og
   registrerer sig selv, når filen indlæses. side.js importerer
   filerne og læser MEKANISMER — så er en ny transportvej **én ny
   fil plus én importlinje**.

   Alle mekanismer står i den samme membran og kører samtidig.
   Rækkefølgen i MEKANISMER er også rækkefølgen i bredden, fra
   venstre mod højre, og hver får tildelt sit stykke af lærredet.

   ── Kontrakten ────────────────────────────────────────────
   registrer({
     id, navn,
     slags,            // 'passiv' | 'aktiv'
     energi,           // fx 'Ingen' eller '1 ATP pr. omgang'
     protein,          // proteinets navn, eller null når der ikke er et
     molekyler,        // id'er fra molekyler.js
     beskrivelse,      // teksten i forklaringsruden
     bredde,           // pladsbehov i lærredets enheder
     proteinBredde,    // hullet i dobbeltlaget; 0 = intet protein
     zoomHøjde,        // hvor meget af vandrummet der skal med, når der zoomes

     byg(ctx),                 // laver mekanismens dele én gang
     opdater(t, dt, ctx),      // ét billede frem
     tegn(g, ctx, dæmp),       // protein og de molekyler, den fører
     aflaes(ctx),              // præcis fire tal til .gauges
     skydere(ctx),             // op til fire skydere til .knobs
   })

   ctx = {vand, tilstand, omr, t}

   `omr` er {x0, x1, midte} — det stykke af lærredet, mekanismen
   har fået, og `t` er modellens eget ur i sekunder. Brug det, og
   ikke `performance.now()`: så kan mekanikken køres uden for
   browseren og efterprøves, hvilket er den eneste farbare vej —
   en fane i baggrunden får ikke `requestAnimationFrame`, så alt
   målt udefra ser frosset ud. `tilstand.konc` er koncentrationerne i mmol/L på hver
   side, og `tilstand.fast` fortæller, om cellen holder forskellen
   ved lige. Molekylerne hentes og afleveres gennem `vand`, som
   fører koncentrationsregnskabet — en mekanisme skal ikke skrive
   i `konc` selv.

   ── Instrumenterne ────────────────────────────────────────
   `aflaes` skal returnere **fire** tal, hverken flere eller færre.
   Rækken i .gauges har fire faste pladser, så panelet ikke hopper
   i højden, når man vælger en anden transportvej.

   ── Skyderne ──────────────────────────────────────────────
   Højst fire, med værdier i den enhed, mærkaten siger:
     {id, mærkat, enhed, min, max, trin, farve, hent(), sæt(v)}
   ═══════════════════════════════════════════════════════════ */

export const MEKANISMER = [];

export function registrer(mekanisme){
  if(MEKANISMER.some(m => m.id === mekanisme.id)){
    throw new Error(`Transportvejen "${mekanisme.id}" er registreret to gange.`);
  }
  MEKANISMER.push(mekanisme);
  return mekanisme;
}

export const find = id => MEKANISMER.find(m => m.id === id);

/* ── Fælles små ting, mekanismerne må regne med ─────────── */

/** Blødt trin fra 0 til 1 — bruges til at bevæge et protein fra
    én form til en anden, uden at det ser ud som et ryk. */
export const glid = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

/** Tilfældig ventetid omkring `snit` sekunder. */
export const vent = snit => snit * (0.55 + Math.random() * 0.9);

/** Poisson-agtigt: sker begivenheden i dette billede?
    `rate` er gange pr. sekund. */
export const sker = (rate, dt) => Math.random() < rate * dt;

/** Strømmåler: tæller krydsninger og regner dem om til pr. sekund
    over et glidende vindue. Instrumenterne viser altså det, der
    faktisk skete — ikke den formel, mekanismen styrer efter. */
export function strømmåler(vindue = 4){
  let tider = [];
  let ialt = 0;
  return {
    tæl(t){ tider.push(t); ialt++; },
    rate(t){
      while(tider.length && t - tider[0] > vindue) tider.shift();
      return tider.length / vindue;
    },
    /* Skal kaldes fra `byg`. Uret starter forfra dér, og gamle
       tidspunkter fra en tidligere kørsel bliver aldrig kastet
       væk igen — de er jo "i fremtiden". */
    nulstil(){ tider = []; ialt = 0; },
    get ialt(){ return ialt; },
  };
}

/** En rejse for ét molekyle langs en knækket linje. Mekanismerne
    bruger den til at føre et grebet molekyle hen til proteinet,
    igennem det og ud på den anden side. */
export function rejse(p, punkter, tid){
  return {p, punkter, tid, gået:0};
}

/** Flyt rejsen ét billede frem. Returnerer true, når den er slut. */
export function frem(r, dt){
  r.gået = Math.min(r.tid, r.gået + dt);
  const u = (r.gået / r.tid) * (r.punkter.length - 1);
  const i = Math.min(r.punkter.length - 2, Math.floor(u));
  const f = u - i;
  const a = r.punkter[i], b = r.punkter[i + 1];
  r.p.x = a[0] + (b[0] - a[0]) * f;
  r.p.y = a[1] + (b[1] - a[1]) * f;
  return r.gået >= r.tid;
}
