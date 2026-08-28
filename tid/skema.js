// skema.js — skolens faste modul- og pausetider, brugt som hurtigvalg
// når man registrerer tid. Tiderne står kun her; skal de rettes, rettes de
// ét sted, og både "1 modul"-arket og registreringsformularen følger med.

export const SKEMA = [
  { id: 'modul1',  navn: '1. modul', kort: '1. modul', nr: '1', start: '08:10', slut: '09:45' },
  { id: 'modul2',  navn: '2. modul', kort: '2. modul', nr: '2', start: '10:00', slut: '11:35' },
  { id: 'frokost', navn: 'Frokostpause', kort: 'Frokost', nr: '·', start: '11:35', slut: '12:00', erPause: true },
  { id: 'modul3',  navn: '3. modul', kort: '3. modul', nr: '3', start: '12:00', slut: '13:35' },
  { id: 'modul4',  navn: '4. modul', kort: '4. modul', nr: '4', start: '13:45', slut: '15:20' }
];

// Faste varigheder til hurtigvalg i registreringsformularen (minutter).
// Sætter kun sluttiden — starten bliver, hvor den er.
export const VARIGHEDER = [10, 20, 40, 60];

// Kun undervisningsmodulerne — frokosten er ikke et modul, man kan holde
export const MODULER = SKEMA.filter(s => !s.erPause);

export const getSkema  = id => SKEMA.find(s => s.id === id) || null;

// "08:10" → 490 (minutter siden midnat)
export function minutterFraTid(tid) {
  const [hh, mm] = String(tid).split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

// Slottets længde i minutter
export const skemaLaengde = s => minutterFraTid(s.slut) - minutterFraTid(s.start);

// Slottets start og slut som Date-objekter på en given dag (default i dag)
export function skemaDatoer(s, dag = new Date()) {
  const start = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(),
    ...String(s.start).split(':').map(Number), 0, 0);
  const slut  = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(),
    ...String(s.slut).split(':').map(Number), 0, 0);
  return { start, slut };
}

// Det slot, klokkeslættet ligger i (bruges til at fremhæve "lige nu")
export function skemaNu(nu = new Date()) {
  const m = nu.getHours() * 60 + nu.getMinutes();
  return SKEMA.find(s => m >= minutterFraTid(s.start) && m < minutterFraTid(s.slut)) || null;
}

// Findes der et slot med præcis disse klokkeslæt? ("08:10", "09:45")
export function skemaFraTider(startTid, slutTid) {
  if (!startTid || !slutTid) return null;
  return SKEMA.find(s => s.start === startTid && s.slut === slutTid) || null;
}

export const skemaInterval = s => `${s.start}–${s.slut}`;
