/* =====================================================================
   Enzymer — blokke der trækkes hen på en binding

   Hvert enzym er en regel: givet en binding (og molekylet den sidder i)
   svarer enzymet enten "den kan jeg klippe" eller "den kan jeg ikke — og
   her er hvorfor". Substratspecificiteten bliver dermed noget eleverne
   støder ind i, ikke noget de får fortalt. Reglerne står i modulet;
   her står kun blokken, drop-zonen og beskederne.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { atLeast } from './levels.js';
import { svgSpace, enzLayer, pvLayer } from './dom.js';
import { SVG_NS, text, rect, badge } from './svg.js';
import { getPos, setPos, clampIntoView, setStatus, waterFx } from './board.js';
import { hydrolyse } from './reactions.js';
import { startDrag } from './drag.js';
import { taskTick, taskEvents } from './tasks.js';
import { logEvent } from './log.js';

const ENZ_W = 152, ENZ_H = 62, ENZ_NOTCH = 15, ENZ_SNAP = 90;

/* Virker enzymet i den krop vi lige nu simulerer? Modulets kontakt kan
   slå netop ét enzym fra: laktasen der mangler, pepsinet ved forkert pH,
   lipasen der ikke kommer til uden galde. */
function enzymeAvailable(key) {
    const t = mod().toggle;
    return !(state.toggleOn && t && t.blocks(key));
}

function enzymeVerdict(key, mol, bond) {
    if (!enzymeAvailable(key)) return mod().toggle.verdict(key, bond);
    return mod().enzymes[key].test(bond, mol._model);
}

/* ---------- Enzymblokken som SVG ---------- */

function enzymeShape() {
    const W = ENZ_W, H = ENZ_H, r = 12, n = ENZ_NOTCH, cx = W / 2;
    // Rundet kasse med et halvcirkelformet hak i bunden — det aktive sted
    return `M${r},0 H${W - r} Q${W},0 ${W},${r} V${H - r} Q${W},${H} ${W - r},${H} ` +
           `H${cx + n} A${n},${n} 0 0 0 ${cx - n},${H} ` +
           `H${r} Q0,${H} 0,${H - r} V${r} Q0,0 ${r},0 Z`;
}

function makeEnzyme(key, x, y) {
    const cfg  = mod().enzymes[key];
    const off  = !enzymeAvailable(key);
    const tag  = off ? mod().toggle.missing : cfg.tag;

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'enzyme appear');
    g.setAttribute('filter', 'url(#soft-shadow)');
    enzLayer.appendChild(g);

    const inner = document.createElementNS(SVG_NS, 'g');
    inner.setAttribute('class', 'mol-inner');
    g.appendChild(inner);

    const body = document.createElementNS(SVG_NS, 'path');
    body.setAttribute('d', enzymeShape());
    body.setAttribute('fill', cfg.colour);
    body.setAttribute('class', 'enz-body' + (off ? ' off' : ''));
    inner.appendChild(body);

    inner.appendChild(text(cfg.da, ENZ_W / 2, 25, 'enz-name'));
    inner.appendChild(text(cfg.sub, ENZ_W / 2, 40, 'enz-sub'));
    if (tag) inner.appendChild(text(tag, ENZ_W / 2, ENZ_H + 15, 'enz-tag'));

    inner.appendChild(badge(ENZ_W - 12, 6, '✕', 'badge-del', 'remove', 'Fjern enzymet fra bordet'));

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${cfg.da} — findes i ${cfg.where}. Træk hakket hen på en binding.`;
    inner.appendChild(title);

    g._enzyme = key;
    g._scale  = 1;
    g._box    = { w: ENZ_W, up: 12, down: ENZ_H + (tag ? 22 : 6), pad: 0 };
    setPos(g, x, y);

    g.addEventListener('pointerdown', startDrag);
    g.addEventListener('animationend', () => g.classList.remove('appear', 'shake'));

    state.enzymes.push(g);
    return g;
}

export function spawnEnzyme(key) {
    const area = svgSpace.getBoundingClientRect();
    const x = 30 + Math.random() * Math.max(40, area.width - ENZ_W - 60);
    const y = 20 + Math.random() * 60;
    const enz = makeEnzyme(key, Math.round(x), Math.round(y));
    clampIntoView(enz);

    const cfg = mod().enzymes[key];
    setStatus(enzymeAvailable(key)
        ? `${cfg.da} lagt på bordet — findes i ${cfg.where}. Træk hakket hen på den binding du vil have klippet; enzymet reagerer kun på sit eget substrat.`
        : `${cfg.da} lagt på bordet, men den virker ikke lige nu. Prøv alligevel at trække den hen på en binding.`,
        'info');
}

export function removeEnzyme(enz) {
    state.enzymes = state.enzymes.filter(e => e !== enz);
    enz.remove();
}

/* Hvert enzym har sit eget niveau. Falder niveauet, forsvinder knappen
   til dem der ligger over — og så skal blokkene på bordet også væk, ellers
   ligger der noget man hverken kan bruge eller lægge ud igen. De enzymer
   niveauet stadig har, bliver liggende, og molekylerne rører vi ikke. */
export function dropEnzymesAboveLevel() {
    state.enzymes = state.enzymes.filter(e => {
        if (atLeast(mod().enzymes[e._enzyme].level)) return true;
        e.remove();
        return false;
    });
    pvLayer.textContent = '';
}

/* Enzymets aktive sted i bordets koordinater */
function enzymeSite(enz) {
    const p = getPos(enz);
    return { x: p.x + ENZ_W / 2, y: p.y + ENZ_H - 6 };
}

/* En bindings midtpunkt i bordets koordinater */
function absBond(mol, bond) {
    const p = getPos(mol), s = mol._model.scale;
    return { x: p.x + bond.mid.x * s, y: p.y + bond.mid.y * s };
}

/* Den binding enzymet ville ramme, hvis brugeren slap nu */
export function bestBond(enz) {
    const site = enzymeSite(enz);
    let best = null, bestDist = ENZ_SNAP;

    state.molecules.forEach(mol => {
        mol._model.bonds.forEach(bond => {
            const p = absBond(mol, bond);
            const d = Math.hypot(site.x - p.x, site.y - p.y);
            if (d >= bestDist) return;
            bestDist = d;
            best = { mol, bond, p, verdict: enzymeVerdict(enz._enzyme, mol, bond) };
        });
    });
    return best;
}

/* Alle bindinger enzymet kan klippe lyser op — det er hele pointen med
   fx amylase på glykogen: grenpunkterne lyser ikke. */
export function showEnzymePreview(enz, best) {
    pvLayer.textContent = '';
    const key = enz._enzyme;

    const ring = (p, r, cls) => {
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', r);
        c.setAttribute('class', cls);
        pvLayer.appendChild(c);
    };

    state.molecules.forEach(mol => {
        mol._model.bonds.forEach(bond => {
            if (!enzymeVerdict(key, mol, bond).ok) return;
            ring(absBond(mol, bond), 17, 'enz-cand');
        });
    });

    if (!best) return;
    ring(best.p, 21, 'enz-target ' + (best.verdict.ok ? 'ok' : 'no'));

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', best.verdict.ok ? 'pv-ok' : 'pv-no');
    pvLayer.appendChild(g);

    const t = text(`${mod().enzymes[key].da}: ${best.verdict.short}`, best.p.x, best.p.y - 30, 'pv-text');
    g.appendChild(t);
    const w = t.getComputedTextLength() + 14;
    const bg = rect(best.p.x - w / 2, best.p.y - 43, w, 18, null);
    bg.setAttribute('class', 'pv-bg');
    bg.setAttribute('rx', 5);
    g.insertBefore(bg, t);
}

export function dropEnzyme(enz, target) {
    if (!target) return;
    const cfg = mod().enzymes[enz._enzyme];
    const v   = target.verdict;

    if (!v.ok) {
        enz.classList.add('shake');
        // Et afslag kan have en konsekvens i sig selv — gassen i tyktarmen,
        // fedtdråben der ikke bliver mindre. Den vises som en effekt og
        // huskes, så en opgave kan spørge til den.
        if (v.event) {
            waterFx(target.p.x, target.p.y - 20, 'out', v.fx);
            setStatus(`${v.msg} ${v.tail || ''}`.trim(), 'error');
            taskEvents.add(v.event);
            // Kontaktens afslag er ikke enzymkemi, men noget der sker i en
            // krop: laktasen der mangler, pH'en der er forkert, galden der
            // er væk. Derfor står de for sig selv i loggen.
            logEvent('body', `${mod().toggle.da}: ${v.msg}`);
            taskTick();
        } else {
            setStatus(`Ingen reaktion. ${v.msg}`, 'error');
            // Et nej er lige så meget værd i en rapport som et ja: det er
            // dér substratspecificiteten viser sig
            logEvent('enzyme', `${cfg.da} ville ikke klippe (${v.short}). ${v.msg}`);
        }
        return;
    }

    taskEvents.add('cut:' + enz._enzyme);
    const names = hydrolyse(target.mol, target.bond, true);
    logEvent('enzyme', `${cfg.da} klippede ${names.from} → ${names.a} + ${names.b}. ${v.msg}`);

    // Enzymet slipper substratet igen og bliver liggende — det er en katalysator
    const p = getPos(enz);
    setPos(enz, p.x, p.y - 46);
    clampIntoView(enz);

    let msg = `${cfg.da}: ${names.from} → ${names.a} + ${names.b}. ${v.msg}`;
    if (!state.catalystHintShown) {
        msg += ' Enzymet bruges ikke op — det kan klippe igen med det samme.';
        state.catalystHintShown = true;
    }
    setStatus(msg, 'ok');
}

/* Enzymblokkene tegnes om, når fx laktoseintolerans slås til eller fra */
export function rerenderEnzymes() {
    const snapshot = state.enzymes.map(e => ({ key: e._enzyme, ...getPos(e) }));
    state.enzymes.forEach(e => e.remove());
    state.enzymes = [];
    snapshot.forEach(s => {
        const e = makeEnzyme(s.key, s.x, s.y);
        e.classList.remove('appear');
        clampIntoView(e);
    });
}

export function syncEnzymeButtons() {
    Object.keys(mod().enzymes).forEach(key => {
        const btn = document.getElementById('enz-btn-' + key);
        if (btn) btn.classList.toggle('missing', !enzymeAvailable(key));
    });
}
