/* kyst.js — kystens tværprofil: havbund, revle, strand og klit.
   Profilen er samtidig sidens hukommelse. Det sand, bølgerne river af
   stranden, lægger sig på revlen, og omvendt — det er den vandring mellem
   strand og revle, grundbogen kalder sommer- og vinterprofilet. Både
   geometrien og den langsomme udvikling hører derfor til her. */

export const G = 9.81;

// ── Kanvas og målestok ─────────────────────────────────
export const W = 900, HC = 430;
export const X_MAX  = 520;        // m fra venstre kant til bag klitten
export const KLIT_X = 500;        // m — klitfoden
export const KLIT_Z = 4.0;        // m over havoverfladen
export const DYBDE0 = 14;         // m — vanddybden ved venstre kant

const Y0 = 120;                   // px — havoverfladen på kanvas
const PX = W / X_MAX;             // 1,73 px pr. m vandret
const PY = 15.0;                  // 15 px pr. m lodret

export const OVERHOEJDE = PY / PX;   // ca. 8,7× — står i panelets hoved
export const HAV_Y = Y0;
export const px = x => x * PX;
export const py = z => Y0 - z * PY;

// ── Revlens form ───────────────────────────────────────
const REVLE_SIGMA = 26;           // m — revlens bredde
const REVLE_AFST  = 70;           // m — revlens afstand fra kystlinjen
const RENDE_AFST  = 40;           // m — renden mellem revle og strand
const KONKAV      = 0.80;         // havbunden er konkav: stejlest tæt ved land

// ── Kystens tilstand ───────────────────────────────────
export const START = { haeldning: 0.05, revle: 1.8 };
export const HAELD_MIN = 0.025, HAELD_MAX = 0.18;
export const REVLE_MAX = 2.8;

export const kyst = {
  haeldning: START.haeldning,   // strandens hældning, tan β
  revle:     START.revle,       // revlens højde over den glatte havbund (m)
  dag:       0,                 // simuleret tid (døgn)
  flyttet:   0                  // samlet sandflux siden nulstilling (m³ pr. m kyst)
};

export function nulstil(){
  kyst.haeldning = START.haeldning;
  kyst.revle     = START.revle;
  kyst.dag       = 0;
  kyst.flyttet   = 0;
}

// ── Profilens geometri ─────────────────────────────────
// Klitfoden ligger fast. Bliver stranden stejlere, rykker kystlinjen
// derfor ind mod land, og stranden bliver smallere — helt som når en
// storm skærer en skrænt i strandkanten.
export function kystlinje(){ return KLIT_X - KLIT_Z / kyst.haeldning; }
export function strandbredde(){ return KLIT_X - kystlinje(); }
export function revleX(){ return Math.max(30, kystlinje() - REVLE_AFST); }

export function bundZ(x){
  if (x > KLIT_X) return KLIT_Z + (x - KLIT_X) * 0.16;  // klitten
  const xs = kystlinje();
  if (x >= xs) return (x - xs) * kyst.haeldning;         // strandplanet
  const glat = -DYBDE0 * Math.pow((xs - x) / xs, KONKAV);// den glatte havbund
  const xr = revleX();
  const r = kyst.revle * Math.exp(-Math.pow((x - xr) / REVLE_SIGMA, 2))
          - 0.40 * kyst.revle * Math.exp(-Math.pow((x - xr - RENDE_AFST) / (0.8 * REVLE_SIGMA), 2));
  return glat + r;
}
export function dybde(x){ return Math.max(0, -bundZ(x)); }

// ── Den langsomme udvikling ────────────────────────────
// netto > 0 er aflejring: stranden vokser og flader ud, revlen tæres.
// netto < 0 er erosion: stranden bliver stejlere og smallere, revlen vokser.
// Sandet flyttes altså mellem de to — det forsvinder ikke ud af systemet.
export function udvikl(netto, ddoegn){
  if (!(ddoegn > 0)) return;
  kyst.dag     += ddoegn;
  kyst.flyttet += netto * ddoegn;

  const dHael  = Math.max(-0.06, Math.min(0.06, -0.0018 * netto));
  kyst.haeldning = Math.min(HAELD_MAX, Math.max(HAELD_MIN,
                    kyst.haeldning + dHael * ddoegn));

  const dRevle = Math.max(-0.3, Math.min(0.3, -0.008 * netto));
  kyst.revle = Math.min(REVLE_MAX, Math.max(0, kyst.revle + dRevle * ddoegn));
}

// ── Tegning ────────────────────────────────────────────
const SAND      = '#EFD9A6';
const SAND_MOERK= '#D9BE7F';
const BUND      = '#C9A96A';
const KLIT      = '#E7CE9A';

export function tegnHimmel(c){
  const g = c.createLinearGradient(0, 0, 0, Y0);
  g.addColorStop(0, '#DFF1FB');
  g.addColorStop(1, '#F4FAFD');
  c.fillStyle = g;
  c.fillRect(0, 0, W, Y0);
}

export function tegnBund(c){
  const xs = kystlinje();

  // havbunden og strandplanet i ét træk
  c.beginPath();
  c.moveTo(px(X_MAX), py(bundZ(X_MAX)));
  for (let x = X_MAX; x >= 0; x -= 2) c.lineTo(px(x), py(bundZ(x)));
  c.lineTo(0, HC); c.lineTo(W, HC); c.closePath();

  const g = c.createLinearGradient(0, Y0 - 70, 0, HC);
  g.addColorStop(0, SAND);
  g.addColorStop(0.55, SAND_MOERK);
  g.addColorStop(1, BUND);
  c.fillStyle = g; c.fill();
  c.lineWidth = 2.2; c.strokeStyle = '#17211F';
  c.beginPath();
  c.moveTo(0, py(bundZ(0)));
  for (let x = 0; x <= X_MAX; x += 2) c.lineTo(px(x), py(bundZ(x)));
  c.stroke();

  // klitten med marehalm
  c.save();
  c.beginPath();
  c.moveTo(px(KLIT_X), py(bundZ(KLIT_X)));
  for (let x = KLIT_X; x <= X_MAX; x += 2) c.lineTo(px(x), py(bundZ(x)));
  c.lineTo(W, HC); c.lineTo(px(KLIT_X), HC); c.closePath();
  c.fillStyle = KLIT; c.fill();
  c.clip();
  c.strokeStyle = '#6E8F3A'; c.lineWidth = 1.4;
  for (let x = KLIT_X + 2; x < X_MAX; x += 4){
    const y = py(bundZ(x));
    c.beginPath(); c.moveTo(px(x), y); c.lineTo(px(x) - 3, y - 13); c.stroke();
    c.beginPath(); c.moveTo(px(x), y); c.lineTo(px(x) + 4, y - 10); c.stroke();
  }
  c.restore();

  // stiplet linje på den glatte havbund, så revlen kan ses som en aflejring
  if (kyst.revle > 0.15){
    c.save();
    c.setLineDash([5, 5]); c.lineWidth = 1.4; c.strokeStyle = 'rgba(23,33,31,.45)';
    c.beginPath();
    const a = Math.max(0, revleX() - 3 * REVLE_SIGMA), b = Math.min(xs, revleX() + 3 * REVLE_SIGMA);
    for (let x = a; x <= b; x += 3) c.lineTo(px(x), py(-DYBDE0 * Math.pow((xs - x) / xs, KONKAV)));
    c.stroke(); c.restore();
  }
}

export function tegnMaerkater(c, maerk){
  c.save();
  c.font = "600 11px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'center';
  const brugt = [];
  for (const m of maerk){
    const w = c.measureText(m.tekst).width + 14;
    while (brugt.some(b => Math.abs(b.y - m.y) < 20 && Math.abs(b.x - m.x) < (b.w + w) / 2))
      m.y += 22;
    brugt.push({ x:m.x, y:m.y, w });
    c.fillStyle = 'rgba(255,249,238,.92)';
    c.strokeStyle = '#17211F'; c.lineWidth = 1.5;
    const x = Math.max(w / 2 + 3, Math.min(W - w / 2 - 3, m.x));
    const y = Math.max(19, Math.min(HC - 5, m.y));
    c.beginPath(); c.roundRect(x - w / 2, y - 15, w, 19, 9);
    c.fill(); c.stroke();
    c.fillStyle = '#17211F';
    c.fillText(m.tekst, x, y - 1.5);
    if (m.tik){                                   // lille streg ned til det, mærkatet peger på
      c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x, y + 4 + m.tik); c.stroke();
    }
  }
  c.restore();
}
