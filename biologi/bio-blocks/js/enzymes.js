/* =====================================================================
   Enzymer — blokke der trækkes hen på en binding

   Hvert enzym er en regel: givet en glykosidbinding (og molekylet den
   sidder i) svarer enzymet enten "den kan jeg klippe" eller "den kan jeg
   ikke — og her er hvorfor". Substratspecificiteten bliver dermed noget
   eleverne støder ind i, ikke noget de får fortalt.
   ===================================================================== */

import { state } from './state.js';
import { svgSpace, enzLayer, pvLayer } from './dom.js';
import { SVG_NS, text, rect, badge } from './svg.js';
import { MOL } from './data.js';
import { getPos, setPos, clampIntoView, setStatus, waterFx } from './board.js';
import { hydrolyse } from './reactions.js';
import { startDrag } from './drag.js';
import { taskTick, taskEvents } from './tasks.js';

const ENZ_W = 152, ENZ_H = 62, ENZ_NOTCH = 15, ENZ_SNAP = 90;

const canCut  = (short, msg) => ({ ok: true,  short, msg });
const cantCut = (short, msg, extra) => Object.assign({ ok: false, short, msg }, extra);

const isGlcGlc = b => b.donor.name === 'glucose' && b.acceptor.name === 'glucose';
const isLactoseBond = b => b.site === 4 && b.anomer === 'b' &&
                           b.donor.name === 'galactose' && b.acceptor.name === 'glucose';

/* Regeltabellen: enzym → hvilke bindinger det kan hydrolysere */
const ENZYMES = {
    amylase: {
        da: 'Amylase', colour: '#8e44ad', sub: 'α-1,4 inde i kæden',
        where: 'spyt og bugspyt',
        test(b, m) {
            if (b.site === 2) return cantCut('ikke sakkarose',
                'Amylase virker på stivelse og glykogen — ikke på sakkarose.');
            if (b.site === 6) return cantCut('ikke α-1,6',
                'Amylase kan ikke klippe α-1,6. Grenpunkterne bliver siddende tilbage som grænsedextriner, som andre enzymer må tage sig af.');
            if (b.anomer !== 'a') return cantCut('ikke β-1,4',
                'Amylase klipper kun α-1,4 — aldrig β-1,4. Netop derfor kan vi ikke fordøje cellulose.');
            if (!isGlcGlc(b)) return cantCut('kun glukose',
                'Amylase arbejder kun mellem glukoseenheder.');
            if (m.nodes.length < 3) return cantCut('kæden er for kort',
                'Amylase har brug for flere glukoser i sit aktive sted. Maltose er for kort — den klippes af maltase.');
            if (b.acceptor.at6 || b.donor.at6) return cantCut('for tæt på grenpunkt',
                'Bindingen ligger lige op ad et α-1,6-grenpunkt, og amylase kan ikke komme til. Det er sådan grænsedextriner opstår.');
            return canCut('α-1,4 klippes',
                'Amylase klipper α-1,4 inde i kæden — derfor bliver lange stivelseskæder hurtigt til korte stumper.');
        }
    },
    maltase: {
        da: 'Maltase', colour: '#16a085', sub: 'α-1,4 fra enden',
        where: 'tyndtarmens børstesøm',
        test(b) {
            if (b.site === 2) return cantCut('ikke sakkarose',
                'Sakkarose er ikke maltases substrat — den spaltes af sakkarase.');
            if (b.site === 6) return cantCut('ikke α-1,6',
                'α-1,6-grenpunktet kræver isomaltase (grænsedextrinase). Maltase kan kun α-1,4.');
            if (b.anomer !== 'a') return cantCut('ikke β-1,4',
                'Maltase spalter kun α-1,4. β-1,4 er en helt anden binding.');
            if (!isGlcGlc(b)) return cantCut('kun glukose',
                'Maltase spalter kun bindinger mellem to glukoser.');
            if (b.donor.at4 || b.donor.at6 || b.donor.at2) return cantCut('ikke inde i kæden',
                'Maltase klipper den yderste glukose af — den arbejder fra enden, ikke midt inde i kæden. Prøv den yderste binding.');
            return canCut('α-1,4 klippes',
                'Maltase klipper en enkelt glukose af enden. Det er sidste trin i stivelsesfordøjelsen.');
        }
    },
    sucrase: {
        da: 'Sakkarase', colour: '#d35400', sub: 'α-1,β-2 (sakkarose)',
        where: 'tyndtarmens børstesøm',
        test(b) {
            if (b.site !== 2) return cantCut('kun sakkarose',
                'Sakkarase spalter kun bindingen mellem glukosens C1 og fruktosens C2 — altså sakkarose.');
            return canCut('α-1,β-2 klippes',
                'Sakkarase spalter sakkarose til glukose + fruktose. Blandingen kaldes invertsukker.');
        }
    },
    lactase: {
        da: 'Laktase', colour: '#2980b9', sub: 'β-1,4 (laktose)',
        where: 'tyndtarmens børstesøm',
        test(b) {
            if (b.site !== 4 || b.anomer !== 'b') return cantCut('kun β-1,4',
                'Laktase spalter kun β-1,4-bindinger.');
            if (b.donor.name !== 'galactose') return cantCut('kræver galaktose',
                `Laktase er en β-galaktosidase: der skal sidde en galaktose på donorsiden. Her er det ${MOL[b.donor.name].da}.`);
            if (b.acceptor.name !== 'glucose') return cantCut('kræver glukose',
                'Laktase klipper galaktosen af en glukose — det er den kombination der hedder laktose.');
            return canCut('β-1,4 klippes',
                'Laktase spalter laktose til galaktose + glukose, og begge kan optages i tyndtarmen.');
        }
    },
    cellulase: {
        da: 'Cellulase', colour: '#7f8c8d', sub: 'β-1,4 (cellulose)',
        where: 'bakterier, svampe og termitter',
        tag: '✖ mennesker producerer den ikke',
        test(b) {
            if (b.site !== 4 || b.anomer !== 'b') return cantCut('kun β-1,4',
                'Cellulase spalter kun β-1,4.');
            if (!isGlcGlc(b)) return cantCut('kun glukose',
                'Cellulase spalter β-1,4 mellem to glukoser. Laktosens β-1,4 sidder mellem galaktose og glukose.');
            return canCut('β-1,4 klippes',
                'Cellulase spalter β-1,4 — men mennesker producerer ikke cellulase. Derfor er cellulose kostfiber for os, mens en ko klarer det med hjælp fra sine bakterier.');
        }
    }
};

/* Findes enzymet i den krop vi lige nu simulerer? */
function enzymeAvailable(key) {
    if (key === 'lactase') return !state.lactoseIntolerant;
    return true;
}

function enzymeVerdict(key, mol, bond) {
    if (key === 'lactase' && state.lactoseIntolerant) {
        return isLactoseBond(bond)
            ? cantCut('ingen laktase',
                'Du producerer ikke laktase. Laktosen bliver ikke spaltet, den kan ikke optages i tyndtarmen — og fortsætter uspaltet ned i tyktarmen.',
                { gas: true })
            : cantCut('ingen laktase', 'Du producerer ikke laktase — blokken kan ikke klippe noget som helst.');
    }
    return ENZYMES[key].test(bond, mol._model);
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
    const cfg  = ENZYMES[key];
    const off  = !enzymeAvailable(key);
    const tag  = off ? '✖ mangler — laktoseintolerans' : cfg.tag;

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

    const cfg = ENZYMES[key];
    setStatus(enzymeAvailable(key)
        ? `${cfg.da} lagt på bordet — findes i ${cfg.where}. Træk hakket hen på den binding du vil have klippet; enzymet reagerer kun på sit eget substrat.`
        : `${cfg.da} lagt på bordet, men du producerer den ikke. Prøv alligevel at trække den hen på laktosen.`,
        'info');
}

export function removeEnzyme(enz) {
    state.enzymes = state.enzymes.filter(e => e !== enz);
    enz.remove();
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

    const t = text(`${ENZYMES[key].da}: ${best.verdict.short}`, best.p.x, best.p.y - 30, 'pv-text');
    g.appendChild(t);
    const w = t.getComputedTextLength() + 14;
    const bg = rect(best.p.x - w / 2, best.p.y - 43, w, 18, null);
    bg.setAttribute('class', 'pv-bg');
    bg.setAttribute('rx', 5);
    g.insertBefore(bg, t);
}

export function dropEnzyme(enz, target) {
    if (!target) return;
    const cfg = ENZYMES[enz._enzyme];
    const v   = target.verdict;

    if (!v.ok) {
        enz.classList.add('shake');
        if (v.gas) {
            waterFx(target.p.x, target.p.y - 20, 'out', '💨 gas');
            setStatus(`${v.msg} I tyktarmen lever bakterierne af den: der dannes gas, og laktosen trækker vand ud i tarmen — luft i maven og osmotisk diarré. Det er laktoseintolerans.`, 'error');
            taskEvents.add('gas');
            taskTick();
        } else {
            setStatus(`Ingen reaktion. ${v.msg}`, 'error');
        }
        return;
    }

    taskEvents.add('cut:' + enz._enzyme);
    const names = hydrolyse(target.mol, target.bond, true);

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
    Object.keys(ENZYMES).forEach(key => {
        document.getElementById('enz-btn-' + key)
            .classList.toggle('missing', !enzymeAvailable(key));
    });
}
