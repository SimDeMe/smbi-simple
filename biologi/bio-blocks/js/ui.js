/* =====================================================================
   Topbjælken bygges af det aktive modul.

   Knapperne kan ikke stå i markup'en længere: hvilke byggesten, hvilke
   enzymer og hvilke visninger der findes, afhænger af om vi arbejder med
   kulhydrater, proteiner eller fedt. Markup'en holder derfor kun de
   tomme grupper, og indholdet kommer herfra.
   ===================================================================== */

import { state } from './state.js';
import { mod, MODULES } from './modules/index.js';
import { spawn, quickBuild, clearTable, setStatus, rerenderAll } from './board.js';
import { spawnEnzyme, syncEnzymeButtons, rerenderEnzymes } from './enzymes.js';
import { syncGradients } from './render.js';
import { openFromTable } from './viewer3d.js';
import { renderTasks } from './tasks.js';
import { syncWelcome } from './welcome.js';

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
    if (!v) return group('grp-form', null, []);

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

function buildBuildGroup() {
    group('grp-build', 'Hurtigbyg', mod().builds.map(b =>
        button('chip', b.da, 'Byg den færdig med det samme', () => quickBuild(b.id))));
}

function buildEnzymeGroup() {
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
        });
        items.push(t);
    }
    group('grp-enzymes', 'Enzymer', items);
}

function buildReprGroup() {
    const m = mod();
    const items = [
        segment('repr-seg',
            m.reprs.map(r => ({ id: r.id, label: r.da, title: r.title, msg: r.msg })),
            state.repr,
            o => { state.repr = o.id; rerenderAll(); setStatus(o.msg, 'info'); })
    ];

    // 3D-knappen giver kun mening hvis modulet har rigtige koordinater at vise
    const has3d = Object.values(m.mon).some(c => c.sdf) || m.names.some(r => r.sdf);
    if (has3d) items.push(button('chip', '3D',
        'Se molekylet i 3D med rigtige koordinater', openFromTable));

    group('grp-repr', 'Visning', items);
}

/* ---------- Modulskift ---------- */

export function buildHeader() {
    buildModuleGroup();
    buildFormGroup();
    buildSpawnGroup();
    buildBuildGroup();
    buildEnzymeGroup();
    buildReprGroup();
    syncEnzymeButtons();
    syncGradients();
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
    setStatus(mod().intro, 'info');
}
