/* opskyl.js — opskyl, tilbageskyl og sandets vandring.
   Her afgøres, om bølgerne er konstruktive eller destruktive. Tre ting
   trækker i hver sin retning, og de svarer én til én til grundbogens
   forklaringer:

     bremse  — kommer bølgerne så tæt, at tilbageskyllet fra den forrige
               bølge stadig løber, når den næste skyller op? (frekvens)
     samling — en stejl strand afsætter energien på et lille område, så
               tilbageskyllet får høj strømhastighed. (strandhældning)
     svaev   — hvor stor en del af sandet holdes svævende i vandsøjlen
               længe nok til at blive ført ud igen? (bølgestørrelse mod
               periode — suspensionen fra kapitlet om sedimenttransport)

   Netto sandflux er opskyllets opbygning minus tilbageskyllets bortførsel.
   Positiv = aflejring, negativ = erosion. */

import { G, px, py, bundZ, kystlinje, KLIT_X, strandbredde } from './kyst.js';

const MU      = 0.05;   // nedsivning og friktion på strandplanet
const C_SKYL  = 14;     // sætter, hvor længe ét opskyl + tilbageskyl varer
const W_SYNK  = 0.035;  // sandkornets synkehastighed, m/s (fint sand)
const OMEGA_0 = 6;      // hvor kraftig en bølge der skal til, før sandet svæver
const K_FLUX  = 0.15;   // m³ pr. m kystlinje pr. døgn

export function beregn(Hb, T, haeldning){
  const u0    = Math.sqrt(G * Hb);                       // strømhastighed i opskyllet
  const tSkyl = C_SKYL * Math.sqrt(Hb / G);              // opskyl + tilbageskyl, sekunder
  const bremse= Math.max(0, Math.min(0.9, (tSkyl - T) / tSkyl));
  const samling = Math.sqrt(haeldning / (haeldning + MU));
  const omega = Hb / (W_SYNK * T);                       // hvor let sandet holdes svævende
  const svaev = omega / (omega + OMEGA_0);

  const vOp  = u0 * (1 - bremse);
  const vTil = u0 * samling;
  const op   = Math.pow(vOp, 3)  * (1 - svaev);          // sand, der bliver liggende
  const til  = Math.pow(vTil, 3) * svaev;                // sand, der føres med ud
  const netto = K_FLUX * (op - til);

  const raek = Math.min(strandbredde() + 12, 0.7 * Hb / haeldning);

  return { u0, tSkyl, bremse, samling, svaev, omega, vOp, vTil, netto, raek,
           frekvens: 60 / T };
}

export function type(netto){
  if (netto >  0.12) return { navn:'Konstruktiv', ord:'aflejring', farve:'#0FA593' };
  if (netto < -0.12) return { navn:'Destruktiv',  ord:'erosion',   farve:'#FF6A3D' };
  return { navn:'I balance', ord:'hverken eller', farve:'#566B68' };
}

// ── Opskyllets tunger ──────────────────────────────────
// Én tunge pr. bølge. Varer et opskyl længere, end der er mellem to
// bølger, overlapper tungerne — og så er det netop den forrige bølges
// tilbageskyl, den nye bølge løber ind i.
const tunger = [];
let sidsteTunge = -99;

function frontAndel(tau){
  if (tau < 0.36) return Math.sin(tau / 0.36 * Math.PI / 2);
  return Math.cos((tau - 0.36) / 0.64 * Math.PI / 2);
}

export function opdaterTunger(t, m, T){
  if (t - sidsteTunge >= T){ tunger.push({ t0: t }); sidsteTunge = t; }
  for (let i = tunger.length - 1; i >= 0; i--){
    if (t - tunger[i].t0 > m.tSkyl) tunger.splice(i, 1);
  }
  if (tunger.length > 6) tunger.splice(0, tunger.length - 6);

  let front = 0, moede = null;
  const stat = tunger.map(tu => {
    const tau = (t - tu.t0) / m.tSkyl;
    return { f: m.raek * frontAndel(tau), op: tau < 0.36 };
  });
  for (const s of stat) front = Math.max(front, s.f);
  for (const a of stat) for (const b of stat){
    if (a.op && !b.op && b.f > a.f * 0.25 && Math.abs(a.f - b.f) < m.raek * 0.22)
      moede = (a.f + b.f) / 2;
  }
  return { front, moede };
}

export function nulstilTunger(){ tunger.length = 0; sidsteTunge = -99; }

// ── Sandkornene ────────────────────────────────────────
const korn = [];
export function saaKorn(){
  korn.length = 0;
  const xs = kystlinje();
  for (let i = 0; i < 130; i++){
    const x = 0.55 * xs + Math.random() * (KLIT_X - 0.55 * xs);
    korn.push({ x, d: (Math.random() - 0.5) * 5, r: 1.6 + Math.random() * 1.4 });
  }
}

export function flytKorn(dt, m, sk, pr){
  const xs = kystlinje();
  for (const k of korn){
    if (k.x > xs){
      // på stranden: op med opskyllet, ud med tilbageskyllet
      if (k.x < xs + sk.front){
        k.x += (sk.moede !== null && k.x < xs + sk.moede)
             ? -m.vTil * dt * 0.5
             : (dt * (Math.random() < 0.5 ? m.vOp * 0.55 : -m.vTil * m.svaev * 1.5));
      }
    } else {
      // i brændingen: turbulensen hvirvler sandet op og fører det ud mod revlen
      const p = pr.punkter[Math.min(pr.punkter.length - 1,
                 Math.round(k.x / pr.xs * (pr.punkter.length - 1)))];
      const uro = p && p.bryder ? 1 : 0.15;
      k.x -= dt * uro * m.svaev * 6;
      k.d += (Math.random() - 0.5) * uro * 2;
    }
    k.d = Math.max(-6, Math.min(6, k.d));
    if (k.x < 0.45 * xs) k.x = KLIT_X - Math.random() * 6;
    if (k.x > KLIT_X)    k.x = 0.45 * xs + Math.random() * 8;
  }
}

export function tegnKorn(c){
  c.save(); c.fillStyle = '#6B4F1E';
  for (const k of korn){
    c.fillRect(px(k.x) - k.r / 2, py(bundZ(k.x)) - 1 + k.d * 0.35, k.r, k.r);
  }
  c.restore();
}

// ── Tegning af strandens vandkant ──────────────────────
export function tegnOpskyl(c, m, sk){
  const xs = kystlinje();
  const slut = xs + Math.max(1.5, sk.front);
  const tyk = 0.10 + 0.06 * m.u0;          // vandlagets tykkelse i meter
  c.save();
  c.beginPath();
  c.moveTo(px(xs), py(bundZ(xs)));
  for (let x = xs; x <= slut; x += 1) c.lineTo(px(x), py(bundZ(x)));
  for (let x = slut; x >= xs; x -= 1){
    const t = (x - xs) / (slut - xs);
    c.lineTo(px(x), py(bundZ(x) + tyk * Math.pow(1 - t, 0.55)));
  }
  c.closePath();
  c.fillStyle = 'rgba(112,196,233,.92)'; c.fill();
  c.lineWidth = 1.6; c.strokeStyle = '#17211F'; c.stroke();

  // skumkanten forrest i opskyllet
  const yf = py(bundZ(slut)) - 2;
  c.fillStyle = '#fff'; c.strokeStyle = 'rgba(23,33,31,.55)'; c.lineWidth = 1;
  for (let i = 0; i < 3; i++){
    c.beginPath();
    c.arc(px(slut) - i * 3.4, yf - i * 1.6, 2.4 - i * 0.5, 0, 6.284);
    c.fill(); c.stroke();
  }

  // dér hvor det nye opskyl løber ind i det forrige tilbageskyl
  if (sk.moede !== null){
    const x = xs + sk.moede, y = py(bundZ(x)) - 4;
    for (let i = 0; i < 5; i++){
      const r = 2 + Math.random() * 3.5;
      c.beginPath();
      c.arc(px(x) + (Math.random() - 0.5) * 14, y - Math.random() * 7, r, 0, 6.284);
      c.fill(); c.stroke();
    }
  }
  c.restore();
}

// To pile over stranden: opskyllets og tilbageskyllets strømhastighed
// side om side. Længden er hastigheden, så de kan sammenlignes direkte.
export function tegnPile(c, m){
  const xs = kystlinje();
  const xm = xs + Math.min(strandbredde() * 0.55, 34);
  const x0 = Math.max(105, Math.min(795, px(xm)));
  const y  = Math.max(46, py(bundZ(xm)) - 30);
  const sk = 12, maks = 92;
  pil(c, x0, y - 24, Math.max(10, Math.min(maks, m.vOp  * sk)),  1, '#5FB030', 'OPSKYL');
  pil(c, x0, y,      Math.max(10, Math.min(maks, m.vTil * sk)), -1, '#FF6A3D', 'TILBAGESKYL');
}

function pil(c, x, y, laengde, retning, farve, maerkat){
  c.save();
  c.lineWidth = 4.5; c.lineCap = 'round';
  c.strokeStyle = '#17211F';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + retning * laengde, y); c.stroke();
  c.lineWidth = 2.6; c.strokeStyle = farve;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + retning * laengde, y); c.stroke();
  const sp = x + retning * laengde;
  c.fillStyle = farve; c.strokeStyle = '#17211F'; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(sp + retning * 7, y);
  c.lineTo(sp, y - 5); c.lineTo(sp, y + 5); c.closePath();
  c.fill(); c.stroke();
  c.font = "600 9.5px 'IBM Plex Mono', ui-monospace, monospace";
  c.fillStyle = '#17211F';
  c.textAlign = retning > 0 ? 'left' : 'right';
  c.fillText(maerkat, x, y - 9);
  c.restore();
}
