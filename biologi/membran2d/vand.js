/* ═══════════════════════════════════════════════════════════
   vand.js — vandrummene på hver side af membranen.

   Ét sted holder styr på de molekyler, der driver frit rundt i
   vandet uden for og inde i cellen, og på koncentrationerne. Alle
   transportmekanismer henter fra den samme pulje og afleverer i
   den samme pulje — og det er ikke en teknisk bekvemmelighed, men
   det faglige omdrejningspunkt: pumpen og symporten trækker på
   *de samme* natriumioner, så når pumpen holder gradienten oppe,
   er det den, symporten kører på.

   Regnskabet: hver gang ét molekyle kommer over på den anden side,
   flyttes `perKryds` mmol/L fra den ene side til den anden. Er
   `fast` slået til, holder cellen forskellen ved lige — den
   forbruger og tilfører — og koncentrationerne står stille.

   Figuren viser et **udsnit** af molekylerne, ikke dem alle: 140
   mmol/L kalium er ikke 140 kugler. Derfor regner mekanismerne
   deres strømme ud fra koncentrationen og ikke fra, hvor mange
   kugler der er tegnet — instrumenterne og figuren siger det
   samme, men kuglerne er en illustration, og tallene er modellen.
   ═══════════════════════════════════════════════════════════ */
import {PULJEDE, find, tegnStof} from './molekyler.js';
import {MÅL, Y, UDENFOR}         from './struktur.js';

/* Molekylerne holder sig inden for det, der er tegnet — også det
   stykke membran, der rækker ud over lærredets kant. */
const VENSTRE = -UDENFOR + 16;
const HØJRE   = MÅL.bredde + UDENFOR - 16;
const FART  = 74;                       // enheder pr. sekund i den tilfældige vandring
const VEND  = 1.5;                      // sekunder mellem retningsskift i snit

const mellem = (a, b) => a + Math.random() * (b - a);

/** Vandrummets grænser i y for den ene side. */
export function rum(side, r = 10){
  return side === 'ude'
    ? {y0:Y.vandUd + r, y1:Y.ud - r}
    : {y0:Y.ind + r,    y1:Y.vandInd - r};
}

export function opretVand(tilstand){
  /* Koncentrationerne — sidens model, som mekanismerne skriver i. */
  tilstand.konc = {};
  for(const m of PULJEDE) tilstand.konc[m.id] = {...m.start};

  const puljer = {};                    // stof-id → [partikel]
  for(const m of PULJEDE) puljer[m.id] = [];

  function ny(stof, side){
    const r = rum(side, stof.r + 4);
    const a = Math.random() * Math.PI * 2;
    return {
      stof, side, fri:true,
      x: mellem(VENSTRE, HØJRE),
      y: mellem(r.y0, r.y1),
      vx: Math.cos(a) * FART, vy: Math.sin(a) * FART,
      vinkel: Math.random() * 6.3, spin: mellem(-1.6, 1.6),
      ur: Math.random() * VEND,
    };
  }

  /** Hvor mange kugler koncentrationen svarer til på den side.
      Ikke lige ud ad landevejen: 140 mmol/L kalium mod 4 er 35
      gange så meget, og tegnede man det, ville den ene side være
      tom og den anden en tapet. Kurven trykker forskellen sammen,
      så begge sider kan ses — retningen står, størrelsesordenen
      står, men forholdet mellem antallet af kugler er ikke
      forholdet mellem koncentrationerne. Det er også derfor,
      mekanismerne regner deres strømme ud fra `konc` og ikke fra,
      hvor mange kugler der lige er tegnet. */
  function ønsket(stof, side){
    const c = tilstand.konc[stof.id][side];
    const f = Math.max(0, Math.min(1, c / stof.maksKonc));
    return Math.round(stof.maks * Math.pow(f, 0.6));
  }

  function tæl(stof, side){
    let n = 0;
    for(const p of puljer[stof.id]) if(p.side === side) n++;
    return n;
  }

  /** Sluk ét frit molekyle på siden — cellen har forbrugt det. */
  function slukEt(stof, side){
    const pu = puljer[stof.id];
    for(let i = pu.length - 1; i >= 0; i--){
      if(pu[i].side === side && pu[i].fri){ pu.splice(i, 1); return true; }
    }
    return false;
  }

  function følgKoncentration(stof){
    for(const side of ['ude', 'inde']){
      let n = tæl(stof, side);
      const ø = ønsket(stof, side);
      let trin = 3;                     // højst tre om året, så det ikke ses poppe
      while(n < ø && trin-- > 0){ puljer[stof.id].push(ny(stof, side)); n++; }
      while(n > ø && trin-- > 0 && slukEt(stof, side)) n--;
    }
  }

  /* ── Løkken ──────────────────────────────────────────── */
  function opdater(dt){
    for(const stof of PULJEDE){
      følgKoncentration(stof);
      const r = {ude:rum('ude', stof.r + 3), inde:rum('inde', stof.r + 3)};
      for(const p of puljer[stof.id]){
        p.vinkel += p.spin * dt;
        if(!p.fri) continue;            // en mekanisme fører den nu
        p.ur -= dt;
        if(p.ur <= 0){                  // nyt tilfældigt skub
          const a = Math.random() * Math.PI * 2;
          p.vx = Math.cos(a) * FART; p.vy = Math.sin(a) * FART;
          p.ur = mellem(VEND * 0.4, VEND * 1.6);
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        const g = r[p.side];
        if(p.x < VENSTRE){ p.x = VENSTRE; p.vx = Math.abs(p.vx); }
        if(p.x > HØJRE){ p.x = HØJRE; p.vx = -Math.abs(p.vx); }
        if(p.y < g.y0){ p.y = g.y0; p.vy = Math.abs(p.vy); }
        if(p.y > g.y1){ p.y = g.y1; p.vy = -Math.abs(p.vy); }
      }
    }
  }

  function tegn(g, u, dæmp = 1){
    for(const stof of PULJEDE){
      for(const p of puljer[stof.id]){
        if(!p.fri) continue;            // mekanismen tegner selv dem, den fører
        if(p.x < u.x0 - 40 || p.x > u.x1 + 40) continue;
        if(p.y < u.y0 - 40 || p.y > u.y1 + 40) continue;
        tegnStof(g, stof, p.x, p.y, {vinkel:p.vinkel, dæmp});
      }
    }
  }

  /* ── Det, mekanismerne bruger ────────────────────────── */

  /** Det nærmeste frie molekyle af `stofId` på siden, inden for
      `radius` af (x, y). Null, hvis der ikke er noget i nærheden —
      og så sker der ingenting, hvilket er hele meningen: er der
      ikke flere molekyler, standser transporten af sig selv. */
  function naermeste(stofId, side, x, y, radius){
    let bedst = null, bedstAfstand = radius * radius;
    for(const p of puljer[stofId]){
      if(!p.fri || p.side !== side) continue;
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if(d < bedstAfstand){ bedstAfstand = d; bedst = p; }
    }
    return bedst;
  }

  function grib(p){ if(p){ p.fri = false; } return p; }

  /** Hent et molekyle til en mekanisme, der skal bruge ét nu.
      Er der ingen tegnet i nærheden, laves der en — for figuren
      viser kun et udsnit, og en pumpe, der står og venter på, at
      der tilfældigt driver en kugle forbi, ville vise noget, der
      ikke er rigtigt. Koncentrationsregnskabet røres ikke: det
      følger krydsningerne i `frigiv`, ikke antallet af kugler. */
  function hent(stofId, side, x, y, radius){
    const p = naermeste(stofId, side, x, y, radius);
    if(p) return grib(p);
    const r = rum(side, 30);
    const ny = tilfoej(stofId, side,
      x + (Math.random() < 0.5 ? -1 : 1) * (100 + Math.random() * (radius - 100)),
      side === 'ude' ? r.y1 - Math.random() * 90 : r.y0 + Math.random() * 90);
    return grib(ny);
  }

  /** Flyt koncentration svarende til ét molekyle. */
  function bogfør(stofId, fra, til){
    if(tilstand.fast) return;
    const d = find(stofId).perKryds;
    if(!d) return;
    const k = tilstand.konc[stofId];
    k[fra] = Math.max(0, k[fra] - d);
    k[til] = k[til] + d;
  }

  /** Sæt et grebet molekyle fri igen. Er det på den anden side end
      det kom fra, er der sket en krydsning, og regnskabet følger. */
  function frigiv(p, side, x, y){
    if(!p) return;
    if(p.side !== side) bogfør(p.stof.id, p.side, side);
    p.side = side;
    if(x != null){ p.x = x; p.y = y; }
    const a = Math.random() * Math.PI * 2;
    p.vx = Math.cos(a) * FART; p.vy = Math.sin(a) * FART;
    p.ur = mellem(0.2, VEND);
    p.fri = true;
  }

  function fjern(p){
    const pu = puljer[p.stof.id];
    const i = pu.indexOf(p);
    if(i >= 0) pu.splice(i, 1);
  }

  /** Lav et molekyle på stedet — fx fragt, der bliver hældt ud af
      en vesikel, og som ikke kom fra puljen. */
  function tilfoej(stofId, side, x, y){
    const stof = find(stofId);
    const pu = puljer[stofId];
    if(!pu) return null;
    const p = ny(stof, side);
    p.x = x; p.y = y;
    pu.push(p);
    return p;
  }

  return {opdater, tegn, naermeste, grib, hent, frigiv, fjern, tilfoej, bogfør,
          antal: stofId => puljer[stofId]?.length ?? 0};
}
