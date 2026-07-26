/* =====================================================================
   Modul: fedt — glycerol, fedtsyrer, esterbinding, triglycerid.

   Igen den samme motor: en fedtsyre donerer sin carboxylgruppe ind i en
   af glycerolens tre OH-grupper, og der fraspaltes vand. Forskellen er,
   at acceptoren har tre pladser og donoren ingen — derfor bliver det et
   triglycerid og ikke en kæde.
   ===================================================================== */

import { SVG_NS, line, rect } from '../svg.js';
import { unitGroup, placedText } from '../draw.js';
import { UNIT_W, UNIT_H, UNIT_CX, UNIT_CY } from '../units.js';

/* --- Former ---------------------------------------------------------- */

const SHAPES = {
    gly: {
        path: "M16 0 H94 Q110 0 110 16 V80 Q110 96 94 96 H16 Q0 96 0 80 V16 Q0 0 16 0 Z",
        sites: { c1: [0, 14], c2: [0, UNIT_CY], c3: [0, 82] },
        atoms: [['1', 15, 20], ['2', 15, 54], ['3', 15, 88]]
    },
    fa: {
        path: "M24 18 H86 Q110 18 110 48 Q110 78 86 78 H24 Q0 78 0 48 Q0 18 24 18 Z",
        sites: { carboxyl: [UNIT_W, UNIT_CY] },
        atoms: [['1', 96, 62], ['ω', 10, 62]]
    }
};

/* --- Katalog --------------------------------------------------------- */

const fat = (da, abbr, atoms, extra) => Object.assign({
    da, abbr, shape: 'fa', atoms,
    donor: true, accepts: []
}, extra);

const mon = {
    glycerol: {
        da: 'Glycerol', abbr: 'GLY', shape: 'gly', colour: ['#bb8fce', '#7d3c98'],
        atoms: { C: 3, H: 8, O: 3 },
        donor: false, accepts: ['c1', 'c2', 'c3'],
        note: 'En trevædig alkohol: tre C-atomer med hver sin OH-gruppe. Rygraden i alt fedt.'
    },
    palmitic: fat('Palmitinsyre', '16:0', { C: 16, H: 32, O: 2 },
        { colour: ['#f0b27a', '#af601a'], sat: true, kink: 0,
          note: 'Mættet: ingen dobbeltbindinger, så kæden er lige. Fast ved stuetemperatur.' }),
    stearic: fat('Stearinsyre', '18:0', { C: 18, H: 36, O: 2 },
        { colour: ['#e59866', '#935116'], sat: true, kink: 0,
          note: 'Mættet og lang — den hårdeste af de almindelige fedtsyrer.' }),
    oleic: fat('Oliesyre', '18:1', { C: 18, H: 34, O: 2 },
        { colour: ['#7dcea0', '#1e8449'], sat: false, kink: 1,
          note: 'Én cis-dobbeltbinding giver ét knæk. Enkeltumættet — olivenolie.' }),
    linolenic: fat('Linolensyre', '18:3', { C: 18, H: 30, O: 2 },
        { colour: ['#76d7c4', '#117a65' ], sat: false, kink: 2,
          note: 'Tre dobbeltbindinger, flere knæk. Flerumættet omega-3 — og essentiel.' })
};

/* Glycerolens tre OH-grupper. C2 ligger i kædens egen række, C1 og C3 i
   rækkerne over og under — det er dét der giver triglyceridets E-form. */
const links = {
    c1: { field: 'a1', site: 1, dRow: -1 },
    c2: { field: 'a2', site: 2, dRow: 0 },
    c3: { field: 'a3', site: 3, dRow: 1 }
};

/* --- Navngivning ----------------------------------------------------- */

const SAT = ['palmitic', 'stearic'];

const names = [
    { size: 2, bonds: { site: 2 }, da: '2-monoglycerid', key: 'mono2',
      note: 'Fedtsyren sidder på den midterste OH-gruppe. Det er præcis det stof tarmen optager.' },
    { size: 2, da: 'Monoglycerid', key: 'mono',
      note: 'Én fedtsyre på glycerolen — én esterbinding, ét vandmolekyle fraspaltet.' },
    { size: 3, da: 'Diglycerid', key: 'di',
      note: 'To fedtsyrer af tre mulige. Mellemtrin både når fedt dannes og når det nedbrydes.' },
    { size: 4, bonds: { donor: SAT }, da: 'Triglycerid — mættet fedt', key: 'trisat',
      note: 'Lige kæder kan pakkes tæt sammen → fast ved stuetemperatur. Smør, talg, kokosfedt.' },
    { size: 4, da: 'Triglycerid — umættet fedt', key: 'triunsat',
      note: 'Knækkene holder kæderne fra hinanden → flydende ved stuetemperatur. Olie.' }
];

/* --- Tegning --------------------------------------------------------- */

/* Kulstofkæden som zigzag. Et cis-knæk er ikke pynt: det er grunden til
   at olie er flydende og smør er fast. */
function tail(unit, p, cfg, cls) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
        const base = cfg.kink && i >= 5 - cfg.kink ? 40 : 30;
        pts.push(`${8 + i * 11},${base + (i % 2 ? 5 : -5)}`);
    }
    const pl = document.createElementNS(SVG_NS, 'polyline');
    pl.setAttribute('points', pts.join(' '));
    pl.setAttribute('class', cls);
    unit.appendChild(pl);

    if (cfg.kink) {
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', 8 + 4 * 11); c.setAttribute('cy', 30 + 5);
        c.setAttribute('r', 5);
        c.setAttribute('class', 'fa-double');
        unit.appendChild(c);
    }
}

function decorate(unit, node, p) {
    const cfg = mon[node.name];
    if (cfg.shape !== 'fa') return;
    tail(unit, p, cfg, 'fa-tail');
    if (cfg.kink) placedText(unit, p, 'C=C', 8 + 4 * 11, 22, 'fa-tag');
}

/* Strukturformlen: glycerolens tre OH-grupper under hinanden, og
   fedtsyren som CH₃–(CH₂)ₙ–COOH. Når esterbindingen er dannet, står der
   –O– på glycerolen og C=O på fedtsyren: tilsammen esterbindingen. */
function struct(parent, node, p, ctx) {
    const cfg  = mon[node.name];
    const unit = unitGroup(parent, p);

    const card = rect(-6, -6, UNIT_W + 12, UNIT_H + 12, null);
    card.setAttribute('class', 'hw-card');
    card.setAttribute('rx', 10);
    unitGroup(ctx.cards, p).appendChild(card);

    if (cfg.shape === 'gly') {
        // OH-grupperne vender til venstre, ud mod de fedtsyrer der kan binde
        // sig; C-atomerne står til højre og bindes sammen af rygraden.
        [['c1', 14, 'CH₂'], ['c2', UNIT_CY, 'CH'], ['c3', 82, 'CH₂']].forEach(([kind, y, c], i) => {
            const bound = !!node[links[kind].field];
            unit.appendChild(line(34, y, 6, y, 'st-bond'));
            placedText(unit, p, `${bound ? 'O' : 'HO'}–${c}`, 66, y + 4, 'st-term');
            if (ctx.numbers) placedText(unit, p, String(i + 1), 20, y - 9, 'st-sub');
        });
        unit.appendChild(line(104, 14, 104, 82, 'st-bond'));
        return;
    }

    tail(unit, p, cfg, 'st-tail');
    unit.appendChild(line(96, 25, 96, 46, 'st-bond'));
    placedText(unit, p, 'CH₃', 12, 60, 'st-sub');
    placedText(unit, p, ctx.isDonor ? 'COO—' : 'COOH', 86, 60, 'st-term c');
    if (cfg.kink) placedText(unit, p, cfg.kink === 1 ? 'cis-dobbeltbinding' : 'flere dobbeltbindinger',
                             UNIT_CX, 84, 'st-sub');
}

/* --- Enzymer --------------------------------------------------------- */

const canCut  = (short, msg) => ({ ok: true,  short, msg });
const cantCut = (short, msg, extra) => Object.assign({ ok: false, short, msg }, extra);

const enzymes = {
    lipase: {
        da: 'Bugspytlipase', colour: '#e67e22', sub: 'ester på C1 og C3',
        where: 'bugspytkirtlen, tyndtarmen',
        test(b) {
            if (b.site === 2) return cantCut('kan ikke nå C2',
                'Bugspytlipasen klipper kun fedtsyrerne af C1 og C3. Den midterste bliver siddende, og tilbage er et 2-monoglycerid — og det er netop dét tarmen optager.');
            return canCut('esterbinding klippes',
                'Lipasen hydrolyserer esterbindingen: fedtsyren frigives, og der bruges ét molekyle vand. Det er den samme reaktion som al anden fordøjelse.');
        }
    },
    hsl: {
        da: 'Hormonfølsom lipase', colour: '#c0392b', sub: 'alle tre estere',
        where: 'fedtvævet — tændes af adrenalin',
        test() {
            return canCut('esterbinding klippes',
                'Inde i fedtcellen klipper den hormonfølsomme lipase alle tre fedtsyrer af. De sendes ud i blodet som brændstof — det er dét adrenalin sætter i gang.');
        }
    }
};

/* Kontakten: galde er ikke et enzym, men uden den kommer lipasen ikke til */
const toggle = {
    da: '🚫 Ingen galde',
    title: 'Fjern galden fra tyndtarmen og se hvad der sker med fedtfordøjelsen',
    on:  'Galden er væk: fedtet samler sig i store dråber i tarmen. Prøv at klippe med bugspytlipasen.',
    off: 'Galden er tilbage: fedtet emulgeres til små dråber med kæmpe samlet overflade, og lipasen kan arbejde.',
    blocks: key => key === 'lipase',
    missing: '✖ kommer ikke til — ingen galde',
    verdict: () => cantCut('fedtet er i store dråber',
        'Fedt og vand blander sig ikke. Uden galdesalte klumper fedtet sammen i store dråber, og lipasen kan kun arbejde på overfladen — den er der næsten ikke.',
        { event: 'nobile', fx: '🟡 store fedtdråber',
          tail: 'Galde er ikke et enzym og spalter ingenting. Den emulgerer: deler dråben i tusindvis af små, så overfladen — og dermed lipasens arbejdsplads — bliver mange gange større.' })
};

/* --- Faktakort ------------------------------------------------------- */

const facts = {
    glycerol: {
        where: 'Rygraden i alt fedt og i cellemembranens fosfolipider. Bruges også som fugtighedsbevarende stof (E422).',
        sat: null,
        digest: 'Optages direkte og kan omdannes til glukose i leveren — den eneste del af fedtet der kan det.',
        energy: '≈ 18 kJ/g. Tre OH-grupper betyder plads til tre fedtsyrer.'
    },
    palmitic: {
        where: 'Palmeolie, smør, kød og ost — og den fedtsyre kroppen selv danner ud fra overskydende kulhydrat.',
        sat: 'sat',
        digest: 'Klippes af lipase i tyndtarmen, optages og pakkes sammen igen i tarmcellen.',
        energy: '≈ 38 kJ/g. Fedt indeholder mere end dobbelt så meget energi pr. gram som kulhydrat, fordi kulstofkæden er så reduceret.'
    },
    stearic: {
        where: 'Oksetalg, kakaosmør og smør.',
        sat: 'sat',
        digest: 'Som de andre: hydrolyse af esterbindingen.',
        energy: '≈ 38 kJ/g. Lang og lige — derfor er kakaosmør fast indtil præcis kropstemperatur.'
    },
    oleic: {
        where: 'Olivenolie (≈ 70 %), rapsolie, mandler og avocado.',
        sat: 'mono',
        digest: 'Samme hydrolyse — knækket gør ingen forskel for enzymet, kun for fedtets fysiske egenskaber.',
        energy: '≈ 38 kJ/g. Enkeltumættet fedt sænker LDL-kolesterol i forhold til mættet fedt.'
    },
    linolenic: {
        where: 'Hørfrø, rapsolie, valnødder og fed fisk.',
        sat: 'poly',
        digest: 'Optages som de øvrige fedtsyrer.',
        energy: '≈ 38 kJ/g. Essentiel omega-3: kroppen kan ikke selv sætte en dobbeltbinding så langt ude i kæden, så den skal komme fra kosten.'
    },
    mono: {
        where: 'Mellemtrin i fordøjelsen, og et almindeligt emulgeringsmiddel i fødevarer (E471).',
        sat: null,
        digest: 'Den frie OH-gruppe gør molekylet delvist vandvenligt — derfor kan det virke som emulgator.',
        energy: 'Ét fedtsyrehale er bundet; der er plads til to mere.'
    },
    mono2: {
        where: 'Det stof der faktisk optages gennem tarmvæggen, sammen med de to frie fedtsyrer.',
        sat: null,
        digest: 'Bugspytlipasen kan kun klippe C1 og C3, så fedtsyren på C2 bliver siddende. Inde i tarmcellen bygges triglyceridet op igen.',
        energy: 'Fedtet bygges altså ned og op igen inden for få mikrometer — kroppen sender det videre i blodet som chylomikroner.'
    },
    di: {
        where: 'Mellemtrin både når fedt dannes i cellen og når det nedbrydes i tarmen.',
        sat: null,
        digest: 'Endnu en esterbinding kan hydrolyseres.',
        energy: 'To af tre pladser er brugt.'
    },
    trisat: {
        where: 'Smør, talg, kokosfedt, palmefedt — og kroppens eget depotfedt.',
        sat: 'sat',
        digest: 'Galde emulgerer, bugspytlipase hydrolyserer C1 og C3, og tilbage er 2-monoglycerid + 2 fedtsyrer.',
        energy: '≈ 38 kJ/g — kroppens tætteste energilager. 1 kg fedtvæv svarer til ca. 29 000 kJ. Lige kæder pakkes tæt, så det er fast ved stuetemperatur.'
    },
    triunsat: {
        where: 'Olivenolie, rapsolie, fiskeolie — og alle andre olier.',
        sat: 'poly',
        digest: 'Præcis samme fordøjelse som mættet fedt: enzymerne skelner ikke.',
        energy: '≈ 38 kJ/g. Knækkene fra cis-dobbeltbindingerne gør, at kæderne ikke kan pakkes tæt — derfor er det flydende. Hærdning fjerner knækkene og laver olie om til fast fedt.'
    }
};

const SAT_TAG = {
    sat:  ['no',  'Mættet', 'Ingen dobbeltbindinger. Kæden er lige, molekylerne pakkes tæt, og fedtet er fast ved stuetemperatur.'],
    mono: ['yes', 'Enkeltumættet', 'Én cis-dobbeltbinding giver ét knæk på kæden. Knækket holder molekylerne fra hinanden — derfor flydende.'],
    poly: ['yes', 'Flerumættet', 'Flere cis-dobbeltbindinger, flere knæk. Endnu sværere at pakke sammen, og derfor flydende selv i køleskabet.']
};

function factRows(model, f) {
    const rows = [['📍', 'Hvor findes det', f.where]];
    if (f.sat) {
        const [cls, tag, txt] = SAT_TAG[f.sat];
        rows.push(['🧈', 'Mættet eller umættet',
                   `<span class="f-tag ${cls}">${tag}</span><br>${txt}`]);
    }
    rows.push(['🍽', 'Fordøjelse', f.digest]);
    rows.push(['⚡', 'Energi og rolle', f.energy]);
    return rows;
}

/* --- Opgaver --------------------------------------------------------- */

const tasks = [
    {
        title: 'Sæt én fedtsyre på glycerolen',
        goal: 'Læg en glycerol og en fedtsyre på bordet, og træk fedtsyrens carboxylgruppe (højre side) hen på en af glycerolens tre OH-grupper.',
        why: 'Esterbindingen dannes ved kondensation — fedtsyrens OH og glycerolens H bliver til vand. ' +
             'Nøjagtig samme reaktion som den glykosidiske binding og peptidbindingen: cellen bygger alle tre stofgrupper efter samme princip.',
        check: b => b.mols.some(m => m.nodes.length === 2)
    },
    {
        title: 'Byg et triglycerid',
        goal: 'Sæt fedtsyrer på alle tre af glycerolens OH-grupper.',
        why: 'Tre esterbindinger, tre vandmolekyler. Læg mærke til at fedtet ikke er en kæde: glycerolen har tre pladser, ' +
             'og fedtsyrerne har ingen — derfor kan et triglycerid ikke vokse videre, sådan som en stivelseskæde kan.',
        check: b => b.mols.some(m => m.nodes.length === 4)
    },
    {
        title: 'Byg et fedt der er flydende',
        goal: 'Byg et triglycerid hvor mindst én af fedtsyrerne er umættet (oliesyre eller linolensyre) — se knækket på kæden.',
        why: 'Cis-dobbeltbindingen sætter et knæk på kæden, og knækket gør at molekylerne ikke kan pakkes tæt sammen. ' +
             'Det er hele forskellen mellem olie og smør: samme slags molekyle, samme energiindhold, forskellig form.',
        check: b => b.mols.some(m => m.nodes.length === 4 && m.info.key === 'triunsat')
    },
    {
        title: 'Fordøj fedtet med bugspytlipase',
        goal: 'Byg et triglycerid og træk bugspytlipasen hen på esterbindingerne. Prøv også den midterste.',
        why: 'Bugspytlipasen kan kun komme til C1 og C3. Tilbage bliver et 2-monoglycerid og to frie fedtsyrer, ' +
             'og det er præcis dét der optages gennem tarmvæggen — hvorefter tarmcellen bygger triglyceridet op igen.',
        check: b => b.ev.has('cut:lipase')
    },
    {
        title: 'Vis hvad galde gør',
        goal: 'Slå 🚫 Ingen galde til, og prøv at klippe et triglycerid med bugspytlipasen.',
        why: 'Galde er ikke et enzym og spalter ingenting — den emulgerer. Fedt og vand blander sig ikke, ' +
             'så uden galde ligger fedtet i store dråber, og det vandopløselige enzym kan kun nå overfladen. ' +
             'Med galde deles dråben i tusindvis af små, og overfladen bliver mange gange større.',
        check: b => b.ev.has('nobile')
    }
];

/* --- Modulet --------------------------------------------------------- */

export const lipid = {
    id: 'lipid',
    da: 'Fedt',
    sub: 'glycerol og fedtsyrer',
    intro: 'Fedt: læg en glycerol ud og træk fedtsyrer hen på dens tre OH-grupper. ' +
           'Fedtsyrerne kan ikke binde til hinanden — derfor bliver det et triglycerid og ikke en kæde.',

    // De tre fedtsyrer sidder tæt om glycerolen — men esterbindingerne skal
    // have plads nok til at etiketten kan stå i mellemrummet
    step: UNIT_W + 86,
    rowH: UNIT_H + 12,
    shapes: SHAPES,
    mon,
    links,
    donorKind: 'carboxyl',

    variant: null,
    flips: () => false,

    names,
    monomerName: node => mon[node.name].da,
    bondLabel: b => `ester C${b.site}`,
    bondAtom: () => 'O',
    // De tre estere sidder tæt om glycerolen, så etiketten skal op over
    // bindingen og ikke ud til siden som en grenbinding ellers gør
    bondNote: () => ({ x: 0, y: -17 }),
    nouns: { unit: ['byggesten', 'byggesten'], bond: ['esterbinding', 'esterbindinger'] },

    verdict: () => ({ ok: true }),

    reprs: [
        { id: 'blocks', da: 'Blokke', title: 'Blokke: kæden som zigzag, med knæk hvor der er en dobbeltbinding',
          msg: 'Blokke: zigzaggen er kulstofkæden. Et knæk betyder en cis-dobbeltbinding — og det er knækket der gør fedtet flydende.' },
        { id: 'struct', da: 'Struktur', title: 'Strukturformel: glycerolens OH-grupper og fedtsyrens COOH',
          msg: 'Strukturformel: glycerolen har tre OH-grupper, fedtsyren en COOH. Når de reagerer, står der —O— på glycerolen og C(=O)O— på fedtsyren: det er esterbindingen.' },
        { id: 'formula', da: 'Formel', title: 'Molekylformel: hver byggesten som sumformel',
          msg: 'Molekylformel: glycerol er C₃H₈O₃, og fedtsyrerne er lange og brintrige — derfor giver fedt mere end dobbelt så meget energi pr. gram som sukker.' }
    ],
    struct,
    decorate,
    blockLabels: node => mon[node.name].shape === 'gly'
        ? [{ text: 'GLY', cls: 'label-abbr', y: 44 },
           { text: 'Glycerol', cls: 'label-name', y: 60 }]
        : [{ text: mon[node.name].abbr, cls: 'label-abbr', y: 60 },
           { text: mon[node.name].da,   cls: 'label-name', y: 73 }],

    builds: [
        {
            id: 'butter', da: 'Mættet fedt',
            make(res) {
                const g = res('glycerol');
                g.a1 = res('palmitic'); g.a2 = res('stearic'); g.a3 = res('palmitic');
                return g;
            },
            say: (name, n) => `${name} bygget af glycerol + 3 mættede fedtsyrer — 3 esterbindinger og 3 vandmolekyler fraspaltet. Lige kæder, der kan pakkes tæt: fast ved stuetemperatur.`
        },
        {
            id: 'oil', da: 'Umættet fedt',
            make(res) {
                const g = res('glycerol');
                g.a1 = res('oleic'); g.a2 = res('linolenic'); g.a3 = res('oleic');
                return g;
            },
            say: (name, n) => `${name} bygget af glycerol + 3 umættede fedtsyrer. Knækkene holder kæderne fra hinanden — flydende ved stuetemperatur.`
        }
    ],

    enzymes,
    toggle,
    facts,
    factRows,
    factColour: (info, n) => n === 1
        ? mon[info.key].colour[1]
        : { mono: '#7d3c98', mono2: '#6c3483', di: '#5b2c6f', trisat: '#af601a', triunsat: '#1e8449' }[info.key],

    tasks,
    summary: water =>
        `<p class="tp-goal">Alle ${tasks.length} opgaver er løst. Fedt er bygget efter samme princip som resten:</p>
         <ul class="tp-sum">
           <li><b>Kondensation</b> danner esterbindingen og fraspalter vand — nøjagtig som ved sukker og protein.
               Vandtælleren står på ${water}.</li>
           <li><b>Antallet af pladser</b> afgør formen: glycerol har tre OH-grupper, fedtsyren har ingen.
               Derfor bliver fedt et lille, lukket molekyle og ikke en lang kæde.</li>
           <li><b>Knækket</b> fra en cis-dobbeltbinding er hele forskellen mellem olie og smør.</li>
           <li><b>Fordøjelsen</b> kræver først galde (emulgering, ikke spaltning) og så lipase (hydrolyse).</li>
         </ul>`
};
