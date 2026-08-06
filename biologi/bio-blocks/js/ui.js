/* =====================================================================
   Topbjælken bygges af det aktive modul.

   Knapperne kan ikke stå i markup'en længere: hvilke byggesten, hvilke
   enzymer og hvilke visninger der findes, afhænger af om vi arbejder med
   kulhydrater, proteiner eller fedt. Markup'en holder derfor kun de
   tomme grupper, og indholdet kommer herfra.

   Den anden ting der bestemmer hvad der står i bjælken, er niveauet:
   `atLeast()` afgør om en gruppe overhovedet bygges. Se levels.js for
   hvad der hører til C, B og A — og hvorfor bjælken skal være kortere.
   ===================================================================== */

import { state } from './state.js';
import { mod, MODULES, intro } from './modules/index.js';
import { LEVELS, atLeast, levelInfo } from './levels.js';
import { spawn, quickBuild, clearTable, setStatus, rerenderAll } from './board.js';
import { spawnEnzyme, syncEnzymeButtons, rerenderEnzymes, clearEnzymes } from './enzymes.js';
import { syncGradients } from './render.js';
import { openFromTable } from './viewer3d.js';
import { renderTasks } from './tasks.js';
import { syncWelcome } from './welcome.js';
import { logEvent } from './log.js';

const el = id => document.getElementById(id);

function button(cls, label, title, onClick) {
    const b = document.createElement('button');
    b.className = cls;
    b.textContent = label;
    if (title) b.title = title;
    b.addEventListener('click', () => onClick(b));
    return b;
}

/* En gruppe med sin overskrift. Er der intet i den, forsvinder den —
   proteinmodulet har fx ikke noget α/β-valg. */
function group(id, label, items) {
    const box = el(id);
    box.textContent = '';
    box.classList.toggle('hidden', !items.length);
    if (!items.length) return;
    if (label) {
        const s = document.createElement('span');
        s.className = 'group-label';
        s.textContent = label;
        box.appendChild(s);
    }
    items.forEach(i => box.appendChild(i));
}

/* Et segmenteret valg: én knap er aktiv ad gangen */
function segment(id, options, current, onPick, cls = 'seg text') {
    const seg = document.createElement('div');
    seg.className = cls;
    seg.id = id;
    options.forEach(o => {
        const b = button(o.id === current ? 'active' : '', o.label, o.title, () => {
            seg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
            onPick(o);
        });
        seg.appendChild(b);
    });
    return seg;
}

/* ---------- De enkelte grupper ---------- */

function buildLevelGroup() {
    group('grp-level', 'Niveau', [
        segment('level-seg',
            LEVELS.map(l => ({ id: l.id, label: l.label, title: l.title })),
            state.level,
            o => setLevel(o.id),
            'seg level')
    ]);
}

function buildModuleGroup() {
    group('grp-module', 'Modul', [
        segment('module-seg',
            MODULES.map(m => ({ id: m.id, label: m.da, title: m.sub })),
            state.modId,
            o => switchModule(o.id))
    ]);
}

function buildFormGroup() {
    const v = mod().variant;
    if (!v || !atLeast('B')) return group('grp-form', null, []);

    group('grp-form', v.da, [
        segment('variant-seg',
            v.options.map(o => ({ id: o.id, label: o.label, title: o.title, msg: o.msg })),
            state.variant,
            o => { state.variant = o.id; setStatus(o.msg, 'info'); },
            'seg')
    ]);
}

function buildSpawnGroup() {
    const m = mod();
    group('grp-spawn', null, Object.entries(m.mon).map(([name, cfg]) => {
        const b = button('spawner', cfg.glyph ? `${cfg.glyph} ${cfg.da}` : cfg.da,
                         cfg.note, () => spawn(name));
        b.style.backgroundColor = cfg.colour[1];
        return b;
    }));
}

/* Hurtigbyg springer selve bygningen over, og det er først en genvej når
   man har lavet bindingen i hånden — derfor fra B og op. */
function buildBuildGroup() {
    if (!atLeast('B')) return group('grp-build', null, []);

    group('grp-build', 'Hurtigbyg', mod().builds.map(b =>
        button('chip', b.da, 'Byg den færdig med det samme', () => quickBuild(b.id))));
}

function buildEnzymeGroup() {
    if (!atLeast('B')) return group('grp-enzymes', null, []);

    const m = mod();
    const items = Object.entries(m.enzymes).map(([key, cfg]) => {
        const b = button('spawner btn-enz', cfg.da,
                         `${cfg.da} — ${cfg.sub}, findes i ${cfg.where}`, () => spawnEnzyme(key));
        b.id = 'enz-btn-' + key;
        b.style.backgroundColor = cfg.colour;
        return b;
    });

    if (m.toggle) {
        const t = button('chip warn' + (state.toggleOn ? ' active' : ''),
                         m.toggle.da, m.toggle.title, b => {
            state.toggleOn = !state.toggleOn;
            b.classList.toggle('active', state.toggleOn);
            syncEnzymeButtons();
            rerenderEnzymes();
            setStatus(state.toggleOn ? m.toggle.on : m.toggle.off,
                      state.toggleOn ? 'error' : 'info');
            if (state.toggleOn) logEvent('body', `${m.toggle.da} slået til: ${m.toggle.on}`);
        });
        items.push(t);
    }
    group('grp-enzymes', 'Enzymer', items);
}

function buildReprGroup() {
    const m     = mod();
    const reprs = visibleReprs();
    const items = [];

    // Ét valg er ikke et valg: på C-niveau er der kun blokke, og så er
    // hele "Visning"-gruppen støj
    if (reprs.length > 1) items.push(
        segment('repr-seg',
            reprs.map(r => ({ id: r.id, label: r.da, title: r.title, msg: r.msg })),
            state.repr,
            o => { state.repr = o.id; rerenderAll(); setStatus(o.msg, 'info'); }));

    // 3D-knappen giver kun mening hvis modulet har rigtige koordinater at vise
    const has3d = Object.values(m.mon).some(c => c.sdf) || m.names.some(r => r.sdf);
    if (has3d && atLeast('A')) items.push(button('chip', '3D',
        'Se molekylet i 3D med rigtige koordinater', openFromTable));

    group('grp-repr', 'Visning', items);
}

/* Modulet mærker selv sine visninger op: blokke er C, strukturformlen B,
   molekylformlen A. Uden `level` er visningen med hele vejen. */
function visibleReprs() {
    return mod().reprs.filter(r => atLeast(r.level));
}

/* ---------- Niveau- og modulskift ---------- */

export function buildHeader() {
    buildLevelGroup();
    buildModuleGroup();
    buildFormGroup();
    buildSpawnGroup();
    buildBuildGroup();
    buildEnzymeGroup();
    buildReprGroup();
    syncEnzymeButtons();
    syncGradients();
}

/* Bordet bliver stående når niveauet skifter — det er de samme molekyler,
   og en elev der har bygget en maltose, skal ikke miste den for at få
   Haworth-formlen frem. Til gengæld skal de valg der forsvinder, sættes
   tilbage til det C-niveau kan vise: ellers står man med en formelvisning
   uden en knap til at komme ud af den igen. */
export function setLevel(id) {
    if (id === state.level) return;
    state.level = id;

    const m = mod();
    if (!visibleReprs().some(r => r.id === state.repr)) state.repr = visibleReprs()[0].id;
    if (!atLeast('B')) {
        if (m.variant) state.variant = m.variant.options[0].id;
        state.toggleOn = false;      // kontakten hører til enzymerne
        clearEnzymes();              // og enzymer man ikke kan lægge ud, kan man heller ikke fjerne
    }

    buildHeader();
    rerenderAll();               // molekylernes egne knapper følger også niveauet
    renderTasks();               // og opgavelisten er kortere på C
    setStatus(levelInfo(id).msg, 'info');
}

export function switchModule(id) {
    if (id === state.modId) return;
    clearTable();

    state.modId   = id;
    state.repr    = mod().reprs[0].id;
    state.variant = mod().variant ? mod().variant.options[0].id : null;
    state.toggleOn = false;

    buildHeader();
    renderTasks();
    syncWelcome();                 // det nye modul har sin egen vejledning
    setStatus(intro(), 'info');
}
