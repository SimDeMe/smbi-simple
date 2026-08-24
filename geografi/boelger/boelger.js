/* boelger.js — fra vind til bølge, og fra bølge til brydning.
   Vinden og det frie stræk sætter bølgehøjde og bølgeperiode. Ind mod
   land mærker bølgen bunden: den bliver kortere og højere, og når den
   er blevet for stejl, bryder den — først over revlen, så igen inde
   ved kystlinjen. */

import { G, W, HC, X_MAX, px, py, HAV_Y, dybde, kystlinje, DYBDE0 } from './kyst.js';

// ── Bølgedannelse ──────────────────────────────────────
// De klassiske vækstformler for en sø, der er begrænset af det frie
// stræk, med loft ved den fuldt udviklede sø. De rammer grundbogens to
// ankerpunkter: ca. 0,5 m i Kattegat og ca. 1,5 m i Nordsøen ved samme
// vind — hele forskellen er det frie stræk.
const FULD_H = 0.2433, FULD_T = 8.134;

export function fraVind(U, F){
  if (U < 0.6) return { H: 0.03, T: 1.4 };
  const X  = G * F / (U * U);
  const hS = Math.min(1.6e-3 * Math.sqrt(X), FULD_H);
  const tS = Math.min(2.857e-1 * Math.cbrt(X), FULD_T);
  // 0,80 gør spidsperioden om til den periode, man tæller mellem to
  // bølgetoppe fra molen — det er den, eleven aflæser.
  return { H: hS * U * U / G, T: 0.80 * tS * U / G };
}

export const dybvandsLaengde = T => G * T * T / (2 * Math.PI);

// Airys spredningsrelation, løst ved gentagelse
export function boelgelaengde(T, d){
  const L0 = dybvandsLaengde(T);
  if (d >= 0.5 * L0) return L0;
  let L = L0 * Math.sqrt(Math.tanh(2 * Math.PI * d / L0));
  for (let i = 0; i < 14; i++) L = L0 * Math.tanh(2 * Math.PI * d / L);
  return L;
}

// ── Bølgen ind over profilen ───────────────────────────
// Brydningskriteriet H/d = 0,78: bliver bølgen højere end 78 % af
// vanddybden, kollapser den. Bag revlen bliver vandet dybere igen, så
// bølgen kan bygge sig op og bryde en gang til inde ved stranden.
export const BRYD = 0.78;
const N = 480;

export function profil(H0, T, ud = { punkter: [] }){
  const xs = Math.max(20, kystlinje());
  const L0 = dybvandsLaengde(T);
  const dx = xs / N;
  const p = ud.punkter; p.length = 0;

  let brudt = false, Hb = 0, KsB = 1, fase = 0, HbMax = 0, dBryd = 0;

  for (let i = 0; i <= N; i++){
    const x = i * dx;
    const d = Math.max(0.06, dybde(x));
    const L = boelgelaengde(T, d);
    const kd = 2 * Math.PI * d / L;
    const n  = 0.5 * (1 + 2 * kd / Math.sinh(Math.min(2 * kd, 30)));
    const Ks = Math.sqrt(0.5 * L0 / (n * L));      // shoaling: cg0/cg

    let H;
    if (!brudt){ H = H0 * Ks; }
    else       { H = Hb * Ks / KsB; }

    const graense = BRYD * d;
    const bryder = H > graense;
    if (bryder){
      if (!brudt){ HbMax = graense; dBryd = d; }
      H = graense; brudt = true;
    }
    if (brudt){ Hb = H; KsB = Ks; }

    if (i > 0) fase += 2 * Math.PI * dx / L;
    p.push({ x, d, L, H, fase, bryder });
  }
  ud.xs = xs; ud.L0 = L0; ud.Hb = HbMax || H0; ud.dBryd = dBryd;
  ud.T = T; ud.H0 = H0;
  ud.boelgebasis = L0 / 2;
  return ud;
}

// Overfladen. Andenharmoniske led gør toppene spidse og bølgedalene
// flade, sådan som en bølge på lavt vand faktisk ser ud.
function eta(p, t, omega){
  const th = p.fase - omega * t;
  const a  = p.H / 2;
  const s  = Math.min(0.20, 0.35 * p.H / Math.max(p.d, 0.2));
  return a * Math.cos(th) + a * s * Math.cos(2 * th);
}

export function tegnVand(c, pr, t, vandlinjeX){
  const omega = 2 * Math.PI / pr.T;
  const p = pr.punkter;
  c.beginPath();
  c.moveTo(0, py(eta(p[0], t, omega)));
  for (let i = 1; i < p.length; i++) c.lineTo(px(p[i].x), py(eta(p[i], t, omega)));
  c.lineTo(px(vandlinjeX), HAV_Y);
  c.lineTo(px(vandlinjeX), HC); c.lineTo(0, HC); c.closePath();

  const g = c.createLinearGradient(0, HAV_Y - 30, 0, HC);
  g.addColorStop(0, '#7FCBEC');
  g.addColorStop(0.35, '#3EA5DA');
  g.addColorStop(1, '#12628F');
  c.fillStyle = g; c.fill();

  c.lineWidth = 2.2; c.strokeStyle = '#17211F';
  c.beginPath();
  c.moveTo(0, py(eta(p[0], t, omega)));
  for (let i = 1; i < p.length; i++) c.lineTo(px(p[i].x), py(eta(p[i], t, omega)));
  c.stroke();
}

// Brydningen: hvidt skum ned ad bølgetoppens forside, dér hvor bølgen
// er kollapset. Det er den turbulens, der hvirvler sandet op fra bunden.
export function tegnBrydning(c, pr, t){
  const omega = 2 * Math.PI / pr.T;
  const p = pr.punkter;
  const stier = [];
  let sti = null;
  for (let i = 0; i < p.length; i++){
    const th = ((p[i].fase - omega * t) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const forside = p[i].bryder && (th < 1.15 || th > 2 * Math.PI - 0.45);
    if (forside){
      if (!sti){ sti = []; stier.push(sti); }
      sti.push([px(p[i].x), py(eta(p[i], t, omega)) - 1]);
    } else sti = null;
  }
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const s of stier){
    if (s.length < 2) continue;
    c.beginPath();
    c.moveTo(s[0][0], s[0][1]);
    for (const q of s) c.lineTo(q[0], q[1]);
    c.lineWidth = 10; c.strokeStyle = 'rgba(23,33,31,.32)'; c.stroke();
    c.lineWidth = 7; c.strokeStyle = '#FFFFFF'; c.stroke();
    // et par bobler dér, hvor skummet slår ned
    const e = s[s.length - 1];
    c.fillStyle = '#fff'; c.strokeStyle = 'rgba(23,33,31,.5)'; c.lineWidth = 1;
    for (let i = 0; i < 3; i++){
      c.beginPath();
      c.arc(e[0] - 4 - i * 5, e[1] + 3 + i * 2.5, 3 - i * 0.6, 0, 6.284);
      c.fill(); c.stroke();
    }
  }
  c.restore();
}

// Vinden, der laver bølgerne. Pilen er så lang, som vinden er stærk —
// tallet står på skyderen, så det skal ikke gentages her.
export function tegnVind(c, U){
  if (U < 0.5) return;
  const y = 30, x0 = 34, L = 22 + U * 4.0;
  c.save();
  c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = 'rgba(23,33,31,.72)';
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + L, y); c.stroke();
  c.fillStyle = 'rgba(23,33,31,.72)';
  c.beginPath();
  c.moveTo(x0 + L + 9, y); c.lineTo(x0 + L - 2, y - 7); c.lineTo(x0 + L - 2, y + 7);
  c.closePath(); c.fill();
  for (let i = 1; i <= Math.min(3, Math.floor(U / 8) + 1); i++){
    const x = x0 + L * (1 - i * 0.22);
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.stroke();
  }
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'left'; c.fillText('VIND', x0 - 2, y - 13);
  c.restore();
}

// Bølgebasis: den dybde, hvor bølgen holder op med at mærke bunden.
export function tegnBoelgebasis(c, pr){
  const db = pr.boelgebasis;
  if (db > DYBDE0 * 0.98) return null;
  const y = py(-db);
  c.save();
  c.setLineDash([9, 6]); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,.85)';
  let slut = X_MAX;
  for (let x = 0; x <= pr.xs; x += 2){ if (dybde(x) < db){ slut = x; break; } }
  c.beginPath(); c.moveTo(0, y); c.lineTo(px(slut), y); c.stroke();
  c.restore();
  return { x: px(slut) - 62, y: y - 5, dybde: db };
}
