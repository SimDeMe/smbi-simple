/* =====================================================================
   Modul: kulhydrater — monosakkarider, disakkarider, polysakkarider.

   Alt det kulhydratspecifikke står her: kataloget, bindingsreglerne,
   navngivningen, Haworth-tegningen, enzymerne, faktakortene og
   opgaverne. Motoren udenfor kender ingen af delene.
   ===================================================================== */

import { SVG_NS, line, rect } from '../svg.js';
import { unitGroup, placedText } from '../draw.js';
import { UNIT_W, UNIT_H, UNIT_CY } from '../units.js';

/* --- Former ---------------------------------------------------------- */

const HW_C6_X = 40;      // hvor C6-stubben forlader ringen i Haworth-visningen

const SHAPES = {
    hex: {
        path: "M27.5 0 L82.5 0 L110 48 L82.5 96 L27.5 96 L0 48 Z",
        sites: { anomeric: [UNIT_W, UNIT_CY], c4: [0, UNIT_CY], c6: [27.5, -26] },
        sitesByRepr: { struct: { c6: [HW_C6_X, -26] } },
        // C-atomerne står på den plads de faktisk har i en Haworth-projektion
        // (ring-O øverst til højre, C1 til højre, derefter mod uret)
        atoms: [['5', 33, 12], ['O', 77, 12, 'ring-o'], ['1', 95, 48],
                ['2', 79, 81], ['3', 31, 81], ['4', 15, 48]]
    },
    pent: {
        path: "M55 0 L104.5 36 L85 96 L25 96 L5.5 36 Z",
        sites: { anomeric: [104.5, 36] },
        atoms: [['O', 55, 13, 'ring-o'], ['1', 84, 26], ['2', 92, 46],
                ['3', 76, 80], ['4', 34, 80], ['5', 18, 46], ['6', 26, 26]]
    }
};

/* --- Katalog --------------------------------------------------------- */

const HEXOSE = { C: 6, H: 12, O: 6 };    // alle tre monosakkarider har samme sumformel

const mon = {
    glucose: {
        da: 'Glukose', abbr: 'GLU', glyph: '⬢', shape: 'hex', colour: ['#2ecc71', '#1e8449'],
        atoms: HEXOSE, donor: true, accepts: ['c4', 'c6'],
        sdf: '../../Molecules/glucose.sdf',
        note: 'Druesukker — cellernes vigtigste brændstof.'
    },
    fructose: {
        da: 'Fruktose', abbr: 'FRU', glyph: '⬟', shape: 'pent', colour: ['#ec7063', '#b03a2e'],
        atoms: HEXOSE, donor: true, accepts: ['anomeric'], mirror: true,
        sdf: '../../Molecules/fructose.sdf',
        note: 'Frugtsukker — femring (furanose) og den sødeste af de tre.'
    },
    galactose: {
        da: 'Galaktose', abbr: 'GAL', glyph: '⬢', shape: 'hex', colour: ['#f4d03f', '#b7950b'],
        atoms: HEXOSE, donor: true, accepts: ['c4', 'c6'],
        sdf: '../../Molecules/galactose.sdf',
        note: 'Adskiller sig fra glukose ved OH-gruppen på C4.'
    }
};

/* Bindingstyperne: hvilket felt donoren hænger i, og hvor på bordet den
   havner. dRow 0 er kæden selv; ±1 er en gren i rækken over eller under. */
const links = {
    c4:       { field: 'at4', site: 4, dRow: 0 },
    c6:       { field: 'at6', site: 6, dRow: -1, stub: { label: '6' } },
    anomeric: { field: 'at2', site: 2, dRow: 0 }     // kun fruktose modtager her
};

/* --- Navngivning ----------------------------------------------------- */

const greek = a => a === 'a' ? 'α' : 'β';

const names = [
    /* Disakkarider — én binding, og navnet ligger fast af hvem der
       donerer, i hvilken form og på hvilket C-atom. */
    { size: 2, bonds: { donor: 'glucose', anomer: 'a', site: 4, acceptor: 'glucose' },
      da: 'Maltose', key: 'maltose', sdf: '../../Molecules/maltose.sdf',
      note: 'Maltsukker fra nedbrudt stivelse — spaltes af maltase.' },

    { size: 2, bonds: { donor: 'glucose', anomer: 'b', site: 4, acceptor: 'glucose' },
      da: 'Cellobiose', key: 'cellobiose', sdf: '../../Molecules/cellobiose.sdf',
      note: 'Byggestenen i cellulose. Kun β-1,4 adskiller den fra maltose.' },

    { size: 2, bonds: { donor: 'glucose', anomer: 'a', site: 6, acceptor: 'glucose' },
      da: 'Isomaltose', key: 'isomaltose', sdf: '../../Molecules/isomaltose.sdf',
      note: 'Grenpunktet i amylopektin og glykogen.' },

    { size: 2, bonds: { donor: 'glucose', anomer: 'b', site: 6, acceptor: 'glucose' },
      da: 'Gentiobiose', key: 'gentiobiose',
      note: 'Sjælden β-1,6-binding — findes bl.a. i plantefarvestoffer.' },

    { size: 2, bonds: { donor: 'galactose', anomer: 'b', site: 4, acceptor: 'glucose' },
      da: 'Laktose', key: 'lactose', sdf: '../../Molecules/lactose.sdf',
      note: 'Mælkesukker — kræver enzymet laktase for at kunne optages.' },

    { size: 2, bonds: { donor: 'galactose', anomer: 'a', site: 6, acceptor: 'glucose' },
      da: 'Melibiose', key: 'melibiose',
      note: 'Findes i bælgfrugter — mennesker mangler enzymet til den.' },

    { size: 2, bonds: { donor: 'glucose', anomer: 'a', site: 2, acceptor: 'fructose' },
      da: 'Sakkarose', key: 'sucrose', sdf: '../../Molecules/sucrose.sdf',
      note: 'Rør- og roesukker. Begge anomere C-atomer er bundet → ikke-reducerende.' },

    { size: 2, da: 'Disakkarid', key: 'disacc',
      note: 'Kemisk muligt, men ikke et af de almindelige disakkarider.' },

    /* Polysakkarider — reglen beskriver kæden i stedet for at teste den */
    { residues: 'glucose', bonds: { site: 4, anomer: 'a' }, branched: false, upTo: 3,
      da: 'Maltotriose', key: 'maltotriose',
      sdf: '../../Molecules/maltose.sdf', sdfNote: 'viser maltose — gentagelsesenheden',
      note: 'Tre α-1,4-bundne glukoser — begyndelsen på en stivelseskæde.' },

    { residues: 'glucose', bonds: { site: 4, anomer: 'a' }, branched: false,
      da: 'Amylose (stivelse)', key: 'amylose',
      sdf: '../../Molecules/maltose.sdf', sdfNote: 'viser maltose — gentagelsesenheden',
      note: 'α-1,4 giver en spiralformet kæde. Nedbrydes let af amylase.' },

    { residues: 'glucose', bonds: { site: 4, anomer: 'b' }, branched: false, upTo: 3,
      da: 'Cellotriose', key: 'cellulose',
      sdf: '../../Molecules/cellobiose.sdf', sdfNote: 'viser cellobiose — gentagelsesenheden',
      note: 'β-1,4 giver en lige, stiv kæde. Mennesker mangler cellulase.' },

    { residues: 'glucose', bonds: { site: 4, anomer: 'b' }, branched: false,
      da: 'Cellulose', key: 'cellulose',
      sdf: '../../Molecules/cellobiose.sdf', sdfNote: 'viser cellobiose — gentagelsesenheden',
      note: 'β-1,4 giver en lige, stiv kæde. Mennesker mangler cellulase.' },

    { residues: 'glucose', bonds: { site: [4, 6], anomer: 'a' }, branched: true,
      da: 'Amylopektin / glykogen', key: 'glycogen',
      sdf: '../../Molecules/isomaltose.sdf', sdfNote: 'viser isomaltose — selve grenpunktet',
      note: 'α-1,6-grene giver mange frie ender → kan nedbrydes hurtigt.' },

    { upTo: 9, da: 'Oligosakkarid', key: 'poly',
      note: 'Blandet kæde — prøv at bygge en ren α-1,4- eller β-1,4-kæde.' },

    { da: 'Polysakkarid', key: 'poly',
      note: 'Blandet kæde — prøv at bygge en ren α-1,4- eller β-1,4-kæde.' }
];

/* --- Haworth --------------------------------------------------------- */

/* Ringens hjørner ligger i den samme kasse som blokkene, og det anomere
   C-atom og C4 sidder præcis hvor blokkens bindingssteder sidder. Kun
   tegningen skifter: layout, bindinger og kemi er de samme.

   Substituenterne tegnes i to baner — én over og én under ringen — og
   det er dét der gør α/β synligt: for et D-sukker peger den anomere
   OH-gruppe op i β-formen og ned i α-formen. */
const HW = {
    hex: {
        at:   { C1: [110, 48], C2: [82.5, 60], C3: [26, 60],
                C4: [0, 48],   C5: [40, 36],   O:  [85, 36] },
        // [fra, til, forreste binding] — de forreste tegnes fede
        ring: [['C1','C2',1], ['C2','C3',1], ['C3','C4',1],
               ['C4','C5',0], ['C5','O',0],  ['O','C1',0]],
        num:  { C1: [97, 45], C2: [74, 54], C3: [35, 54], C4: [13, 45], C5: [45, 47] },
        up:   { line: 20, text: 13 },
        down: { line: 74, text: 88 },
        centre: [55, 53]
    },
    pent: {
        at:   { C2: [104.5, 36], C3: [85, 66], C4: [25, 66],
                C5: [5.5, 40],   O:  [55, 30] },
        ring: [['C2','C3',1], ['C3','C4',1], ['C4','C5',0],
               ['C5','O',0],   ['O','C2',0]],
        num:  { C2: [93, 46], C3: [76, 57], C4: [34, 57], C5: [17, 48] },
        up:   { line: 18, text: 11 },
        down: { line: 76, text: 90 },
        centre: [55, 52]
    }
};

const SUPER = { 1: '¹', 6: '⁶' };

/* Grupper uden for ringen får deres C-nummer foran: ⁶CH₂OH. Ringens egne
   C-atomer nummereres inde i ringen i stedet. */
const hwLabel = (label, num, numbers) => numbers && num ? SUPER[num] + label : label;

/* Hvilken vej en OH-gruppe peger, er ikke pynt — det ER konfigurationen.
   For et D-sukker i denne orientering: en gruppe der står til højre i
   Fischer-projektionen, peger nedad, og en til venstre peger opad. Det
   giver glukose OH ned-op-ned på C2-C3-C4, galaktose OH op på C4, og den
   anomere OH ned for α og op for β. */
function haworthSubs(node, isDonor) {
    const ano  = node.anomer === 'b' ? 'up' : 'down';
    const anti = ano === 'up' ? 'down' : 'up';
    const S = [];

    if (node.name === 'fructose') {
        // C2 er det anomere C-atom, og det bærer C1 som sidegruppe
        if (!isDonor && !node.at2) S.push({ at: 'C2', dir: ano, label: 'OH' });
        S.push({ at: 'C2', dir: anti, label: 'CH₂OH', num: '1' });
        S.push({ at: 'C3', dir: 'up',   label: 'OH', dx: -12 });
        S.push({ at: 'C4', dir: 'down', label: 'OH' });
        S.push({ at: 'C5', dir: 'up',   label: 'CH₂OH', num: '6', dx: 12 });
        return S;
    }

    if (!isDonor) S.push({ at: 'C1', dir: ano, label: 'OH' });
    S.push({ at: 'C2', dir: 'down', label: 'OH' });
    S.push({ at: 'C3', dir: 'up',   label: 'OH', dx: 6 });
    // Galaktose adskiller sig fra glukose i præcis én OH-gruppe — denne her
    if (!node.at4) S.push({ at: 'C4', dir: node.name === 'galactose' ? 'up' : 'down',
                            label: 'OH' });
    return S;
}

function haworth(parent, node, p, ctx) {
    const cfg  = mon[node.name];
    const G    = HW[cfg.shape];
    const unit = unitGroup(parent, p);
    const A    = a => G.at[a];

    // Et hvidt kort holder stregtegningen læsbar over det prikkede bord.
    // Det ligger i sit eget lag under bindingerne, og når lidt længere ud
    // på en furanose, hvor C1 hænger ud fra det anomere C-atom.
    const wide = cfg.shape === 'pent' ? 10 : 0;
    const card = rect(-6, -20, UNIT_W + 12 + wide, UNIT_H + 24, null);
    card.setAttribute('class', 'hw-card');
    card.setAttribute('rx', 10);
    unitGroup(ctx.cards, p).appendChild(card);

    // Ringens indre i monomerens egen farve, så identiteten overlever skiftet
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', G.ring.map(([a]) => A(a).join(',')).join(' '));
    poly.setAttribute('fill', `url(#grad-${node.name})`);
    poly.setAttribute('fill-opacity', 0.18);
    unit.appendChild(poly);

    G.ring.forEach(([a, b, front]) => {
        const [x1, y1] = A(a), [x2, y2] = A(b);
        unit.appendChild(line(x1, y1, x2, y2, 'hw-bond' + (front ? ' front' : '')));
    });

    // Ring-iltet sidder på sit hjørne og dækker bindingerne bagved
    const og = document.createElementNS(SVG_NS, 'g');
    og.setAttribute('class', 'hw-o');
    const oc = document.createElementNS(SVG_NS, 'circle');
    oc.setAttribute('cx', A('O')[0]); oc.setAttribute('cy', A('O')[1]);
    oc.setAttribute('r', 8.5);
    og.appendChild(oc);
    unit.appendChild(og);
    placedText(og, p, 'O', A('O')[0], A('O')[1] + 4, null);

    // Substituenter: en pind ud i banen, så etiketten. C-nummeret rider med
    // som hævet skrift — det er alligevel sådan en kemiker skriver det.
    haworthSubs(node, ctx.isDonor).forEach(s => {
        const [ax, ay] = A(s.at);
        const lane = G[s.dir];
        const dx   = s.dx || 0;
        unit.appendChild(line(ax, ay, ax + dx, lane.line, 'hw-stick'));
        placedText(unit, p, hwLabel(s.label, s.num, ctx.numbers), ax + dx, lane.text, 'hw-sub');
    });

    // C6 på en pyranose: grenpunktet, tegnet ud fra C5 som i en lærebog
    if (cfg.shape === 'hex') {
        const [cx, cy] = A('C5');
        const branched = !!node.at6;
        unit.appendChild(line(cx, cy, HW_C6_X, branched ? -26 : 6, 'hw-stick'));
        placedText(unit, p, hwLabel(branched ? 'CH₂' : 'CH₂OH', '6', ctx.numbers),
                   branched ? HW_C6_X - 7 : HW_C6_X, -3,
                   'hw-sub' + (branched ? ' end' : ''));
    }

    // Numre inde i ringen, eller forkortelsen når nummereringen er slået fra
    if (ctx.numbers) {
        Object.keys(G.num).forEach(a => {
            const [nx, ny] = G.num[a];
            placedText(unit, p, a.slice(1), nx, ny, 'hw-num');
        });
    } else {
        placedText(unit, p, cfg.abbr, G.centre[0], G.centre[1], 'hw-abbr');
    }
}

/* --- Enzymer --------------------------------------------------------- */

const canCut  = (short, msg) => ({ ok: true,  short, msg });
const cantCut = (short, msg, extra) => Object.assign({ ok: false, short, msg }, extra);

const isGlcGlc = b => b.donor.name === 'glucose' && b.acceptor.name === 'glucose';

const enzymes = {
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
                `Laktase er en β-galaktosidase: der skal sidde en galaktose på donorsiden. Her er det ${mon[b.donor.name].da}.`);
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

const isLactoseBond = b => b.site === 4 && b.anomer === 'b' &&
                           b.donor.name === 'galactose' && b.acceptor.name === 'glucose';

/* Kontakten: den krop vi simulerer, holder op med at lave laktase */
const toggle = {
    da: '🥛 Laktoseintolerans',
    title: 'Slå laktaseproduktionen fra og se hvad der sker med mælkesukkeret',
    on:  'Laktoseintolerans slået til: kroppen producerer ikke længere laktase. Byg en laktose (galaktose + glukose, β-1,4) og prøv at fordøje den.',
    off: 'Laktaseproduktionen er tilbage: laktosen kan igen spaltes til galaktose + glukose og optages i tyndtarmen.',
    blocks: key => key === 'lactase',
    missing: '✖ mangler — laktoseintolerans',
    verdict: (key, bond) => isLactoseBond(bond)
        ? cantCut('ingen laktase',
            'Du producerer ikke laktase. Laktosen bliver ikke spaltet, den kan ikke optages i tyndtarmen — og fortsætter uspaltet ned i tyktarmen.',
            { event: 'gas', fx: '💨 gas',
              tail: 'I tyktarmen lever bakterierne af den: der dannes gas, og laktosen trækker vand ud i tarmen — luft i maven og osmotisk diarré. Det er laktoseintolerans.' })
        : cantCut('ingen laktase', 'Du producerer ikke laktase — blokken kan ikke klippe noget som helst.')
};

/* --- Faktakort ------------------------------------------------------- */

const FACT_COLOUR = {
    glucose: '#1e8449', fructose: '#b03a2e', galactose: '#b7950b',
    disacc: '#2471a3', poly: '#34495e'
};

const facts = {
    glucose: {
        where: 'Druer, honning og frugt — og i blodet: blodsukkeret er glukose (normalt 4–6 mmol/L).',
        sweet: 0.75,
        digest: 'Optages direkte i tyndtarmen. Den er allerede en monomer, så der skal ingen enzymer til.',
        energy: '≈ 17 kJ/g (4 kcal/g). Cellernes vigtigste brændstof: glykolyse → citronsyrecyklus → ATP.'
    },
    fructose: {
        where: 'Frugt og honning — og halvdelen af alt almindeligt sukker, som er sakkarose.',
        sweet: 1.7,
        digest: 'Optages direkte, men med en anden transportør (GLUT5) end glukose.',
        energy: '≈ 17 kJ/g. Omsættes næsten udelukkende i leveren, og indgår derfor ikke i blodsukkeret på samme måde.'
    },
    galactose: {
        where: 'Findes næsten kun som den ene halvdel af laktose i mælk.',
        sweet: 0.32,
        digest: 'Optages direkte og omdannes i leveren til glukose.',
        energy: '≈ 17 kJ/g. Indgår også i glykolipider og glykoproteiner på cellernes overflade.'
    },
    maltose: {
        where: 'Malt, øl og spirende korn — og i tarmen hver gang stivelse bliver nedbrudt.',
        sweet: 0.35,
        digest: 'Spaltes af maltase i tyndtarmens børstesøm til to glukoser.',
        energy: '≈ 17 kJ/g. Mellemtrin i stivelsesfordøjelsen, ikke et lager i sig selv.'
    },
    lactose: {
        where: 'Mælk og mejeriprodukter. Komælk ≈ 4,7 %, modermælk ≈ 7 %.',
        sweet: 0.16,
        digest: 'Kræver laktase. De fleste voksne i verden mister enzymet efter barndommen — nordeuropæere er undtagelsen.',
        energy: '≈ 17 kJ/g. Uspaltet laktose når tyktarmen, hvor bakterier laver gas, og trækker vand ud i tarmen.'
    },
    sucrose: {
        where: 'Sukkerrør og sukkerroer — det vi kalder sukker, rørsukker eller bordsukker.',
        sweet: 1.0,
        digest: 'Spaltes af sakkarase til glukose + fruktose. Blandingen kaldes invertsukker.',
        energy: '≈ 17 kJ/g. Plantens transportform: sukker flyttes rundt i sivævet som sakkarose, netop fordi den er ikke-reducerende og dermed kemisk rolig.'
    },
    cellobiose: {
        where: 'Frigives når cellulose nedbrydes af bakterier og svampe. Findes ikke frit i kosten.',
        sweet: 0.05,
        digest: 'Mennesker kan ikke spalte den: β-1,4 kræver cellulase eller β-glukosidase, som vi ikke har.',
        energy: '0 kJ/g for os. Køer og termitter får energi ud af den via mikroorganismer.'
    },
    isomaltose: {
        where: 'Selve grenpunktet i amylopektin og glykogen. Findes i sirup, honning og øl.',
        sweet: 0.35,
        digest: 'Spaltes af isomaltase (grænsedextrinase) — et andet enzym end maltase, fordi bindingen er α-1,6.',
        energy: '≈ 17 kJ/g.'
    },
    gentiobiose: {
        where: 'Plantestoffer, bl.a. i safranens farvestof crocin.',
        sweet: null,
        sweetNote: 'Smager bittert, ikke sødt — sødme afhænger af formen, ikke af at det er et sukker.',
        digest: 'β-1,6 spaltes ikke af menneskets enzymer.',
        energy: 'Ingen betydning som næringsstof.'
    },
    melibiose: {
        where: 'Bælgfrugter, som del af raffinose i ærter, bønner og linser.',
        sweet: 0.3,
        digest: 'Kræver α-galaktosidase, som mennesker ikke har. Den fortsætter til tyktarmen.',
        energy: 'Ingen energi for os — men bakterierne i tyktarmen laver gas af den. Det er derfor bønner giver luft i maven.'
    },
    maltotriose: {
        where: 'Mellemprodukt når amylase klipper stivelse i stykker. Findes i øl og sirup.',
        sweet: 0.2,
        digest: 'Klippes videre af amylase og maltase til glukose.',
        energy: '≈ 17 kJ/g.'
    },
    amylose: {
        where: 'Kartofler, ris, brød, pasta, majs — plantens energilager i knolde og frø.',
        sweet: 0,
        digest: 'Amylase i spyt og bugspyt klipper α-1,4 inde i kæden, maltase tager sidste trin til glukose.',
        energy: '≈ 17 kJ/g. Det vigtigste kulhydrat i den menneskelige kost.'
    },
    cellulose: {
        where: 'Træ, bomuld, papir og alle plantecellevægge — Jordens mest udbredte organiske stof.',
        sweet: 0,
        digest: 'Kan ikke fordøjes: β-1,4 kræver cellulase, og den har mennesker ikke. Virker som kostfiber.',
        energy: '0 kJ/g for mennesker. Køer, termitter og snegle klarer det med hjælp fra mikroorganismer.'
    },
    glycogen: {
        where: 'Lever (≈ 100 g) og muskler (≈ 400 g) hos mennesker — dyrenes energilager. Amylopektin er plantens tilsvarende forgrenede form.',
        sweet: 0,
        digest: 'α-1,4 af amylase, α-1,6-grenpunkterne af isomaltase. I egne celler klippes glykogen af glykogenfosforylase.',
        energy: '≈ 17 kJ/g. Grenene giver mange frie ender, så mange enzymer kan arbejde samtidig — derfor kan blodsukkeret rettes op i løbet af minutter.'
    },
    disacc: {
        where: 'Ikke et af de almindelige disakkarider — men kemisk muligt.',
        sweet: null,
        sweetNote: 'Ukendt sødme.',
        digest: 'Om det kan fordøjes afhænger helt af bindingen: prøv at trække et enzym hen på den.',
        energy: 'Kun bindinger vi har enzymer til, giver energi.'
    },
    poly: {
        where: 'En blandet kæde, ikke en af naturens standardpolymerer.',
        sweet: 0,
        digest: 'Enzymer er specifikke: hver enkelt binding skal passe til et enzym, ellers bliver den siddende.',
        energy: 'Kun de bindinger vi har enzymer til, giver energi.'
    }
};

/* "Reducerende sukker" er det eneste der ikke er et opslag: et molekyle
   er reducerende præcis når det har et frit anomert C-atom, og det ved
   modellen allerede — det er den frie plads freeSites kalder 'anomeric'.
   Sakkarose er det eneste her hvor begge sidder i bindingen. */
function factRows(model, f) {
    const n = model.nodes.length;
    const reducing = model.sites.some(s => s.kind === 'anomeric');

    let sweet;
    if (f.sweet === null || f.sweet === undefined) {
        sweet = f.sweetNote || 'Ukendt.';
    } else if (f.sweet === 0) {
        sweet = 'Smager ikke sødt. Polysakkarider er for store til at nå smagsreceptorerne — ' +
                'men tygger man længe på et stykke brød, begynder det at smage sødt, fordi amylasen i spyttet frigiver maltose.';
    } else {
        const pct = Math.round(Math.min(1, f.sweet / 1.8) * 100);
        sweet = `<div class="f-bar"><span style="width:${pct}%"></span></div>` +
                (f.sweet === 1
                  ? 'Sakkarose <b>er</b> målestokken: al sødme angives i forhold til bordsukker.'
                  : `≈ ${String(f.sweet).replace('.', ',')} × sakkarose (bordsukker = 1)`);
    }

    const redTag = reducing
        ? `<span class="f-tag yes">Reducerende</span><br>Der er et frit anomert C-atom, så molekylet kan
           oxideres — det er derfor Fehlings og Benedicts prøve slår ud.` +
          (n >= 6 ? ' En lang kæde har kun én fri ende pr. molekyle, så udslaget bliver meget svagt.' : '')
        : `<span class="f-tag no">Ikke-reducerende</span><br>Begge anomere C-atomer sidder i den
           glykosidiske binding, så der er ingen fri aldehyd- eller ketogruppe. Fehlings prøve er negativ.`;

    return [
        ['📍', 'Hvor findes det', f.where],
        ['🍬', 'Sødme', sweet],
        ['🧪', 'Reducerende sukker?', redTag],
        ['🍽', 'Fordøjelighed for mennesker', f.digest],
        ['⚡', 'Energi og rolle', f.energy]
    ];
}

/* --- Opgaver --------------------------------------------------------- */

/* Bindingens type, uden hensyn til hvilke sukkerarter der sidder i den */
const bondSig = m => `${m.bonds[0].anomer}-1,${m.bonds[0].site}`;

const tasks = [
    {
        title: 'Byg maltose',
        goal: 'Læg to α-glukoser på bordet og træk den enes C1 (højre hjørne) hen til den andens C4 (venstre hjørne).',
        why: 'Kondensation: to monomerer bindes sammen, og der fraspaltes ét molekyle vand. ' +
             'Maltose har α-1,4-bindingen — den samme som i stivelse. Læg mærke til vandtælleren.',
        check: b => b.mols.some(m => m.info.key === 'maltose')
    },
    {
        title: 'Byg laktose',
        goal: 'Laktose = galaktose + glukose med en β-1,4-binding. Vælg β øverst, læg en galaktose og en glukose ud, ' +
              'og træk galaktosens C1 hen til glukosens C4.',
        why: 'Rækkefølgen betyder noget: det er galaktosen der binder med sit C1, og glukosen der modtager på sit C4. ' +
             'Bytter man om, får man et andet molekyle. Netop derfor er enzymet laktase en β-galaktosidase.',
        check: b => b.mols.some(m => m.info.key === 'lactose')
    },
    {
        title: 'Lav 4 vandmolekyler ved kondensation',
        goal: 'Få vandtælleren op på 4. Hver ny binding fraspalter ét vandmolekyle, så du skal danne 4 bindinger — ' +
              'fx en kæde på 5 monomerer.',
        why: 'En kæde på n monomerer holdes sammen af n − 1 bindinger og har afgivet n − 1 vandmolekyler. ' +
             'Omvendt kræver det lige så mange vandmolekyler at hydrolysere kæden igen — derfor er fordøjelse hydrolyse.',
        check: b => b.water >= 4
    },
    {
        title: 'To disakkarider med samme sumformel',
        goal: 'Byg to forskellige disakkarider der ligger på bordet samtidig — fx maltose (α-1,4) og cellobiose (β-1,4). ' +
              'Skift til visningen "Formel" undervejs.',
        why: 'Begge er C₁₂H₂₂O₁₁: samme sumformel, forskellig struktur — de er isomerer. ' +
             'Sumformlen siger altså ikke hvad et molekyle kan. Forskellen mellem maltose og cellobiose er alene bindingens ' +
             'geometri, og den er nok til at vi kan fordøje den ene og ikke den anden.',
        check: b => {
            const di = b.mols.filter(m => m.nodes.length === 2);
            return di.some((x, i) => di.slice(i + 1).some(y =>
                x.info.formula === y.info.formula && bondSig(x) !== bondSig(y)));
        }
    },
    {
        title: 'Byg en kæde vi ikke kan fordøje',
        goal: 'Byg en kæde på mindst 4 glukoser hvor alle bindinger er β-1,4. Vælg β før du bygger — ' +
              'eller brug Hurtigbyg → Cellulose. Prøv derefter amylase på den.',
        why: 'Det er cellulose. Vi har amylase, som kun klipper α-1,4, men ingen cellulase til β-1,4. ' +
             'Kæden er kemisk fuld af energi; vi kan bare ikke komme til den, og den passerer som kostfiber. ' +
             'Læg mærke til at hver anden ring er vendt om — det er β-bindingen der tvinger den lige, stive kæde.',
        check: b => b.mols.some(m => m.nodes.length >= 4 &&
                                     m.nodes.every(x => x.name === 'glucose') &&
                                     m.bonds.every(x => x.site === 4 && x.anomer === 'b'))
    },
    {
        title: 'Byg et forgrenet polysakkarid',
        goal: 'Byg en kæde på mindst 6 α-glukoser, og sæt en sidekæde på en af ringenes C6 (den lille 6-knop over ringen). ' +
              'Hurtigbyg → Glykogen gør det for dig.',
        why: 'Glykogen og amylopektin: α-1,4 i kæden, α-1,6 i grenpunkterne. ' +
             'Grenene giver mange frie ender, så mange enzymmolekyler kan arbejde samtidig — derfor kan leveren frigive ' +
             'glukose til blodet i løbet af minutter. En ugrenet kæde ville kun kunne klippes fra én ende.',
        check: b => b.mols.some(m => m.nodes.length >= 6 &&
                                     m.bonds.some(x => x.site === 6) &&
                                     m.bonds.some(x => x.site === 4))
    },
    {
        title: 'Fordøj stivelsen hele vejen',
        goal: 'Byg (eller hurtigbyg) en amylosekæde. Træk amylase hen på en binding inde i kæden, og træk derefter ' +
              'maltase hen på en maltose.',
        why: 'To enzymer, to opgaver: amylase i spyt og bugspyt klipper inde i den lange kæde, mens maltase i ' +
             'tyndtarmens børstesøm tager det sidste trin fra maltose til glukose. Først som fri glukose kan sukkeret ' +
             'optages i blodet.',
        check: b => b.ev.has('cut:amylase') && b.ev.has('cut:maltase')
    },
    {
        title: 'Vis hvad laktoseintolerans er',
        goal: 'Slå 🥛 Laktoseintolerans til, byg en laktose, og prøv at klippe den med laktase.',
        why: 'Laktoseintolerans er ikke en allergi, men et manglende enzym. Uden laktase bliver laktosen ikke spaltet, ' +
             'kan ikke optages i tyndtarmen, og fortsætter til tyktarmen: bakterierne laver gas, og sukkeret trækker ' +
             'osmotisk vand ud i tarmen. Enzymet er hele forskellen.',
        check: b => b.ev.has('gas')
    }
];

/* --- Modulet --------------------------------------------------------- */

export const carbs = {
    id: 'carbs',
    da: 'Kulhydrater',
    sub: 'sukker og stivelse',
    intro: 'Kulhydrater: vælg α eller β, læg sukkerarter på bordet og træk dem sammen. ' +
           'Klik på et O i en binding for at hydrolysere netop den, eller træk en enzymblok hen på bindingen.',

    // På C-niveau er hverken α/β-valget eller enzymerne fremme, og så må
    // teksten ikke pege på knapper der ikke er der
    introC: 'Kulhydrater: læg sukkerarter på bordet og træk dem sammen. ' +
            'Klik på et O i en binding for at spalte netop den igen.',

    start: {
        title: 'Byg dit første kulhydrat',
        steps: [
            'Klik på <b>Glukose</b> to gange. Så ligger der to sukkerringe på bordet.',
            'Træk den ene hen mod den anden, indtil <b>C1</b> (højre hjørne) er tæt på ' +
            '<b>C4</b> (venstre hjørne) — linjen mellem dem bliver grøn.',
            'Slip. De bliver til ét molekyle, og der fraspaltes ét vandmolekyle.'
        ],
        demo: ['glucose', 'glucose']
    },

    shapes: SHAPES,
    mon,
    links,
    donorKind: 'anomeric',

    variant: {
        field: 'anomer',
        da: 'Form',
        flipTip: 'Skift mellem α- og β-form',
        options: [
            { id: 'a', label: 'α', title: 'α-form: OH-gruppen på C1 peger nedad',
              msg: 'α-form valgt: OH-gruppen på C1 peger nedad. Giver α-1,4 — stivelse og glykogen.',
              flip: 'α-formen giver α-1,4-bindinger — stivelse og glykogen.' },
            { id: 'b', label: 'β', title: 'β-form: OH-gruppen på C1 peger opad',
              msg: 'β-form valgt: OH-gruppen på C1 peger opad. Giver β-1,4 — cellulose, hvor hver anden ring er vendt om.',
              flip: 'β-formen giver β-1,4-bindinger — cellulose.' }
        ]
    },

    /* En β-1,4-binding vender donorringen 180°; det skiftevise mønster er
       cellulosens visuelle signatur. */
    flips: (donor, field) => field === 'at4' && donor.anomer === 'b',

    names,
    monomerName: node => `${greek(node.anomer)}-${mon[node.name].da}`,
    bondLabel: b => b.site === 2 ? 'α-1,β-2' : `${greek(b.anomer)}-1,${b.site}`,
    bondAtom: () => 'O',
    nouns: { unit: ['monomer', 'monomerer'], bond: ['glykosidbinding', 'glykosidbindinger'] },

    verdict(donorNode, accNode, site) {
        if (donorNode.name === 'fructose')
            return { ok: false, msg: 'Fruktose kan ikke være donor her — den binder kun med sit C2 til α-glukosens C1 i sakkarose.',
                     short: 'Fruktose kan ikke donere' };
        if (site === 2) {
            if (donorNode.name !== 'glucose')
                return { ok: false, msg: 'Kun glukose kan binde til fruktose. Sammen danner de sakkarose.',
                         short: 'Kræver glukose' };
            if (donorNode.anomer !== 'a')
                return { ok: false, msg: 'Sakkarose kræver α-glukose. Klik α⇄β på glukosen og prøv igen.',
                         short: 'Kræver α-glukose' };
        }
        return { ok: true };
    },

    reprs: [
        { id: 'blocks', da: 'Blokke', title: 'Blokke: form og farve viser hvilken sukkerart det er',
          msg: 'Blokke: formen viser ringstørrelsen (seksring eller femring) og farven viser sukkerarten.' },
        { id: 'struct', da: 'Haworth', level: 'B', title: 'Haworth-formel: ringen med OH-grupperne tegnet i korrekt α/β-orientering',
          msg: 'Haworth-formel: samme molekyle, nu med OH-grupperne. Om den anomere OH peger op eller ned ER forskellen ' +
               'mellem β og α. H-atomerne er udeladt, og den glykosidiske binding tegnes vandret, så kæden kan læses.' },
        { id: 'formula', da: 'Formel', level: 'A', title: 'Molekylformel: hver monomer som sumformel',
          msg: 'Molekylformel: hver monomer er C₆H₁₂O₆ — glukose, fruktose og galaktose har alle samme sumformel. ' +
               'Regnestykket under molekylet viser hvor meget vand der er fraspaltet.' }
    ],
    struct: haworth,
    blockLabels: node => [
        { text: mon[node.name].abbr, cls: 'label-abbr', y: mon[node.name].shape === 'pent' ? 56 : 50 },
        { text: `${greek(node.anomer)}-${mon[node.name].da}`, cls: 'label-name',
          y: (mon[node.name].shape === 'pent' ? 56 : 50) + 16 }
    ],

    builds: [
        { id: 'amylose',   da: 'Amylose' },
        { id: 'cellulose', da: 'Cellulose' },
        { id: 'glycogen',  da: 'Glykogen' }
    ].map(b => Object.assign(b, {
        make(res) {
            const form = b.id === 'cellulose' ? 'b' : 'a';
            const len  = b.id === 'glycogen' ? 8 : 6;
            const glc  = () => res('glucose', form);

            // Bygges fra den reducerende ende og udefter
            const root = glc();
            const all  = [root];
            let t = root;
            for (let i = 1; i < len; i++) { t.at4 = glc(); t = t.at4; all.push(t); }

            if (b.id === 'glycogen') {
                // Rigtige grenpunkter sidder flere residuer fra hinanden, og det
                // holder samtidig de to sidekæder fra at mase hinanden i rækken over
                [2, 6].forEach(i => {
                    const h = res('glucose', 'a');
                    h.at4 = res('glucose', 'a');
                    h.at4.at4 = res('glucose', 'a');
                    all[i].at6 = h;
                });
            }
            return root;
        },
        say: (name, n) => `${name} bygget af ${n} glukoseenheder — det har krævet ${n - 1} kondensationer og fraspaltet ${n - 1} vandmolekyler.`
    })),

    enzymes,
    toggle,
    facts,
    factRows,
    factColour: (info, n) => FACT_COLOUR[info.key] ||
        (n === 1 ? FACT_COLOUR.glucose : n === 2 ? FACT_COLOUR.disacc : FACT_COLOUR.poly),

    tasks,
    summary: water =>
        `<p class="tp-goal">Alle ${tasks.length} opgaver er løst. Det er de samme fire ting hele vejen igennem:</p>
         <ul class="tp-sum">
           <li><b>Kondensation</b> binder monomerer sammen og fraspalter vand; <b>hydrolyse</b> gør det modsatte.
               Vandtælleren står nu på ${water}.</li>
           <li><b>Bindingen</b> — α eller β, 1,4 eller 1,6 — bestemmer molekylets form: spiral, lige kæde eller forgrenet net.</li>
           <li><b>Samme sumformel</b> kan betyde vidt forskellige molekyler. Stivelse og cellulose er begge (C₆H₁₀O₅)ₙ.</li>
           <li><b>Enzymer er specifikke</b>, og det er derfor cellulose er kostfiber, bønner giver luft i maven,
               og nogle mennesker ikke kan tåle mælk.</li>
         </ul>
         <p class="tp-goal">Prøv nu proteinerne eller fedtet i modulvælgeren: det er den samme kondensation,
            bare med andre byggesten.</p>`
};
