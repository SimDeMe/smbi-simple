/* =====================================================================
   Modul: proteiner — aminosyrer, peptidbinding, polypeptid.

   Samme motor som kulhydraterne: en aminosyre donerer sin carboxylgruppe
   ind i den næstes aminogruppe, og der fraspaltes vand. Forskellen er
   kataloget, bindingen og navnene — altså denne fil.
   ===================================================================== */

import { line, rect } from '../svg.js';
import { unitGroup, placedText } from '../draw.js';
import { UNIT_W, UNIT_H, UNIT_CX, UNIT_CY } from '../units.js';

/* --- Former ---------------------------------------------------------- */

/* Alle aminosyrer har samme rygrad og dermed samme form. Det er netop
   pointen: forskellen sidder i sidekæden, og den vises med farven. */
const SHAPES = {
    aa: {
        path: "M14 6 H96 Q110 6 110 22 V74 Q110 90 96 90 H14 Q0 90 0 74 V22 Q0 6 14 6 Z",
        sites: { carboxyl: [UNIT_W, UNIT_CY], amino: [0, UNIT_CY] },
        atoms: [['N', 14, 18], ['Cα', 55, 18], ['C', 97, 18]]
    }
};

/* --- Katalog --------------------------------------------------------- */

/* Farven er sidekædens type — det er den inddeling proteinets foldning
   afhænger af, ikke aminosyrens navn. */
const CLASS = {
    nonpolar: { da: 'upolær', colour: ['#aab7b8', '#5d6d7e'] },
    polar:    { da: 'polær',  colour: ['#48c9b0', '#148f77'] },
    acid:     { da: 'sur',    colour: ['#ec7063', '#a93226'] },
    base:     { da: 'basisk', colour: ['#5dade2', '#21618c'] }
};

const aa = (da, abbr, cls, side, atoms, extra) => Object.assign({
    da, abbr, shape: 'aa', cls, side,
    colour: CLASS[cls].colour, atoms,
    donor: true, accepts: ['amino']
}, extra);

const mon = {
    glycine: aa('Glycin', 'GLY', 'nonpolar', 'H', { C: 2, H: 5, N: 1, O: 2 },
        { note: 'Den mindste aminosyre — sidekæden er ét brintatom.' }),
    serine: aa('Serin', 'SER', 'polar', 'CH₂OH', { C: 3, H: 7, N: 1, O: 3 },
        { note: 'Polær sidekæde med en OH-gruppe, der kan danne hydrogenbindinger.' }),
    cysteine: aa('Cystein', 'CYS', 'polar', 'CH₂SH', { C: 3, H: 7, N: 1, O: 2, S: 1 },
        { note: 'Svovlet kan danne en disulfidbro til en anden cystein — proteinets "svejsning".' }),
    aspartate: aa('Asparaginsyre', 'ASP', 'acid', 'CH₂COOH', { C: 4, H: 7, N: 1, O: 4 },
        { note: 'Sur sidekæde: afgiver en H⁺ og bliver negativt ladet ved pH 7.' }),
    lysine: aa('Lysin', 'LYS', 'base', '(CH₂)₄NH₂', { C: 6, H: 14, N: 2, O: 2 },
        { note: 'Basisk sidekæde: optager en H⁺ og bliver positivt ladet. Essentiel.' }),
    phenylalanine: aa('Phenylalanin', 'PHE', 'nonpolar', 'CH₂C₆H₅', { C: 9, H: 11, N: 1, O: 2 },
        { note: 'Stor, upolær ringsidekæde — den slags gemmer sig inde i proteinet. Essentiel.' })
};

/* Peptidbindingen: donoren hænger i acceptorens aminogruppe, og kæden
   løber derfor fra N-enden til venstre mod C-enden til højre — præcis
   som en peptidsekvens skrives. */
const links = {
    amino: { field: 'atN', site: 'N', dRow: 0 }
};

/* --- Navngivning ----------------------------------------------------- */

const names = [
    { size: 2, da: 'Dipeptid', key: 'di',
      note: 'To aminosyrer og én peptidbinding — der er fraspaltet ét vandmolekyle.' },
    { size: 3, da: 'Tripeptid', key: 'tri',
      note: 'Tre aminosyrer. Rækkefølgen er allerede information: det er proteinets primærstruktur.' },
    { upTo: 9, da: 'Oligopeptid', key: 'oligo',
      note: 'Under ti aminosyrer. Mange hormoner og signalstoffer er så små.' },
    { upTo: 49, da: 'Polypeptid', key: 'poly',
      note: 'Kæden folder sig: hydrogenbindinger i rygraden giver α-helix og β-plade.' },
    { da: 'Protein', key: 'protein',
      note: 'Over 50 aminosyrer. Formen — og dermed funktionen — bestemmes af sidekædernes rækkefølge.' }
];

/* --- Strukturformel -------------------------------------------------- */

/* H₂N–CαH(R)–COOH. Når carboxylgruppen er bundet, står der C=O, og når
   aminogruppen er bundet, står der NH — tilsammen –CO–NH–, altså
   peptidbindingen selv. */
function struct(parent, node, p, ctx) {
    const cfg  = mon[node.name];
    const unit = unitGroup(parent, p);

    const card = rect(-6, -8, UNIT_W + 12, UNIT_H + 4, null);
    card.setAttribute('class', 'hw-card');
    card.setAttribute('rx', 10);
    unitGroup(ctx.cards, p).appendChild(card);

    // Rygraden: N — Cα — C
    unit.appendChild(line(30, UNIT_CY, 44, UNIT_CY, 'st-bond'));
    unit.appendChild(line(66, UNIT_CY, 74, UNIT_CY, 'st-bond'));

    const nTerm = node.atN ? 'HN' : 'H₂N';
    const cTerm = ctx.isDonor ? 'C=O' : 'COOH';
    placedText(unit, p, nTerm, 15, UNIT_CY + 4, 'st-term n');
    placedText(unit, p, 'C',   UNIT_CX, UNIT_CY + 4, 'st-atom');
    placedText(unit, p, cTerm, 93, UNIT_CY + 4, 'st-term c');
    if (ctx.numbers) placedText(unit, p, 'α', UNIT_CX + 8, UNIT_CY + 8, 'st-sub');

    // H opad, sidekæden nedad — det er kun R der skiller aminosyrerne ad
    unit.appendChild(line(UNIT_CX, UNIT_CY - 8, UNIT_CX, 34, 'st-bond'));
    placedText(unit, p, 'H', UNIT_CX, 28, 'st-sub');

    unit.appendChild(line(UNIT_CX, UNIT_CY + 8, UNIT_CX, 64, 'st-bond'));
    const pill = rect(UNIT_CX - 40, 68, 80, 18, null);
    pill.setAttribute('class', 'st-pill');
    pill.setAttribute('fill', `url(#grad-${node.name})`);
    pill.setAttribute('rx', 9);
    unit.appendChild(pill);
    placedText(unit, p, cfg.side, UNIT_CX, 81, 'st-r');
}

/* Sidekæden hænger under blokken, så den er synlig også i blokvisningen */
function decorate(unit, node, p) {
    const cfg = mon[node.name];
    const pill = rect(UNIT_CX - 42, 66, 84, 17, 'rgba(255,255,255,0.9)');
    pill.setAttribute('rx', 8.5);
    unit.appendChild(pill);
    placedText(unit, p, 'R = ' + cfg.side, UNIT_CX, 78.5, 'st-r dark');
}

/* --- Enzymer --------------------------------------------------------- */

const canCut  = (short, msg) => ({ ok: true,  short, msg });
const cantCut = (short, msg, extra) => Object.assign({ ok: false, short, msg }, extra);

const AROMATIC = ['phenylalanine'];

const enzymes = {
    pepsin: {
        da: 'Pepsin', colour: '#c0392b', sub: 'ved store, upolære sidekæder',
        where: 'mavesækken, pH 1–2',
        test(b, m) {
            if (m.nodes.length < 3) return cantCut('kæden er for kort',
                'Pepsin er en endopeptidase: den arbejder inde i en kæde. Et dipeptid er for kort — det tages af peptidaserne i tarmen.');
            if (!AROMATIC.includes(b.donor.name) && !AROMATIC.includes(b.acceptor.name))
                return cantCut('forkert sidekæde',
                    'Pepsin klipper kun ved store, upolære sidekæder som phenylalanins. Enzymets aktive sted passer til ringen — ikke til rygraden.');
            return canCut('peptidbinding klippes',
                'Pepsin klipper inde i kæden ved en aromatisk sidekæde. Den lange kæde bliver til mange korte peptider, som tarmens enzymer kan komme til.');
        }
    },
    trypsin: {
        da: 'Trypsin', colour: '#8e44ad', sub: 'efter lysin (og arginin)',
        where: 'bugspytkirtlen, tyndtarmen',
        test(b, m) {
            if (m.nodes.length < 3) return cantCut('kæden er for kort',
                'Trypsin er også en endopeptidase — den skal have en kæde at arbejde inde i.');
            if (b.donor.name !== 'lysine') return cantCut('kræver lysin',
                'Trypsin klipper kun lige efter en basisk aminosyre: lysin eller arginin. Her sidder der noget andet på donorsiden.');
            return canCut('peptidbinding klippes',
                'Trypsin klipper efter lysin. To enzymer med hver sin specificitet klipper den samme kæde i vidt forskellige stumper — derfor bliver fordøjelsen fuldstændig.');
        }
    },
    peptidase: {
        da: 'Peptidase', colour: '#16a085', sub: 'én aminosyre fra enden',
        where: 'tyndtarmens børstesøm',
        test(b) {
            if (b.donor.atN) return cantCut('ikke inde i kæden',
                'Peptidasen arbejder fra enden af kæden, ikke midt inde i den. Prøv den yderste binding — den ude i N-enden.');
            return canCut('yderste binding klippes',
                'Exopeptidasen klipper én fri aminosyre af enden. Først som frie aminosyrer kan de optages i tyndtarmen og sendes videre i blodet.');
        }
    }
};

/* Kontakten: syrehæmmer — enzymet er der stadig, men pH er forkert */
const toggle = {
    da: '🧪 Syrehæmmer',
    title: 'Hæv mavens pH og se hvad der sker med pepsin',
    on:  'Syrehæmmer taget: mavens pH er nu omkring 5. Pepsin er der stadig, men prøv at klippe med den.',
    off: 'Mavesyren er tilbage ved pH 1–2 — pepsin har igen sit optimale pH og virker.',
    blocks: key => key === 'pepsin',
    missing: '✖ virker ikke — for højt pH',
    verdict: () => cantCut('forkert pH',
        'Pepsin er foldet til at virke ved pH 1–2. Ved pH 5 har enzymets aktive sted en anden form, og substratet passer ikke længere i det.',
        { event: 'ph', fx: '🚫 pH 5',
          tail: 'Et enzym er ikke bare til stede eller fraværende — det skal også have de rigtige forhold. Temperatur og pH ændrer formen på det aktive sted.' })
};

/* --- Faktakort ------------------------------------------------------- */

const facts = {
    glycine: {
        where: 'Kollagen og gelatine — hver tredje aminosyre i kollagen er glycin.',
        side: 'H. Den eneste aminosyre uden et asymmetrisk C-atom, og den mindste der findes.',
        essential: 'Nej — kroppen kan selv danne den.',
        digest: 'Optages som fri aminosyre i tyndtarmen.',
        role: 'Den er så lille at kæden kan dreje skarpt om den. Derfor sidder den i kollagens tætte tripelhelix, hvor der ikke er plads til andet.'
    },
    serine: {
        where: 'Æg, mælk, sojabønner og kød.',
        side: 'CH₂OH — polær og uladet. OH-gruppen kan danne hydrogenbindinger.',
        essential: 'Nej.',
        digest: 'Optages som fri aminosyre.',
        role: 'Sidder i mange enzymers aktive sted, bl.a. i trypsin selv. OH-gruppen er også det sted en fosfatgruppe sættes på, når en celle tænder og slukker for et protein.'
    },
    cysteine: {
        where: 'Æg, hvidløg, løg og keratinet i hår og negle.',
        side: 'CH₂SH — svovlet er det afgørende.',
        essential: 'Nej, men den dannes ud fra den essentielle methionin.',
        digest: 'Optages som fri aminosyre.',
        role: 'To cysteiner kan bindes sammen af en disulfidbro, som låser proteinets form. Permanentkrøller virker ved at bryde og gendanne netop de broer i håret.'
    },
    aspartate: {
        where: 'Kød, asparges og sødestoffet aspartam, som er et dipeptid.',
        side: 'CH₂COOH — sur. Ved pH 7 har den afgivet sin H⁺ og er negativt ladet.',
        essential: 'Nej.',
        digest: 'Optages som fri aminosyre.',
        role: 'De ladede sidekæder trækker i hinanden: en sur og en basisk sidekæde danner en saltbro, der holder proteinet i form. De vender også oftest udad mod vandet.'
    },
    lysine: {
        where: 'Kød, fisk, æg og bælgfrugter. Korn indeholder kun lidt lysin.',
        side: '(CH₂)₄NH₂ — basisk. Ved pH 7 har den optaget en H⁺ og er positivt ladet.',
        essential: 'Ja — den skal komme fra kosten.',
        digest: 'Optages som fri aminosyre. Trypsin klipper netop efter lysin.',
        role: 'Positivt ladet og derfor vendt udad mod vandet. Lysin er den aminosyre der oftest mangler i en kost baseret på korn — derfor kombinerer man traditionelt korn med bønner.'
    },
    phenylalanine: {
        where: 'Kød, mælk, æg — og i sødestoffet aspartam.',
        side: 'CH₂C₆H₅ — stor, upolær benzenring.',
        essential: 'Ja.',
        digest: 'Optages som fri aminosyre. Pepsin klipper ved netop denne slags sidekæde.',
        role: 'Vandskyende, så den gemmer sig inde i proteinets kerne. Ved sygdommen PKU (føllings sygdom) mangler enzymet der omsætter den, og den ophobes — derfor står der advarsler om phenylalanin på light-sodavand.'
    },
    di: {
        where: 'Dipeptider optages faktisk direkte i tarmen og spaltes først inde i cellen.',
        digest: 'Klippes af peptidaser i tyndtarmens børstesøm.',
        role: 'Peptidbindingen er plan og stiv: der kan ikke drejes om C–N-bindingen. Det er den begrænsning der gør, at en kæde kun kan folde sig på bestemte måder.'
    },
    tri: {
        where: 'Glutathion, cellens vigtigste antioxidant, er et tripeptid.',
        digest: 'Klippes af peptidaser til frie aminosyrer.',
        role: 'Med tre aminosyrer er der allerede 20³ = 8000 mulige sekvenser. Rækkefølgen er primærstrukturen, og den bestemmer alt det andet.'
    },
    oligo: {
        where: 'Hormoner som oxytocin (9) og vasopressin (9), og mange antibiotika.',
        digest: 'Nedbrydes hurtigt af peptidaser — derfor kan de fleste peptidhormoner ikke tages som piller.',
        role: 'Selv få aminosyrer kan give en helt bestemt form, og formen er det receptoren genkender.'
    },
    poly: {
        where: 'Insulin (51 aminosyrer i to kæder) og de fleste hormoner og enzymer.',
        digest: 'Pepsin i maven, trypsin i tyndtarmen, peptidaser til sidst — tre trin, fordi ingen af dem kan det hele.',
        role: 'Kæden folder sig af sig selv: hydrogenbindinger i rygraden giver α-helix og β-plade (sekundærstruktur), og sidekæderne trækker den på plads i den endelige form (tertiærstruktur).'
    },
    protein: {
        where: 'Kød, æg, mælk, bælgfrugter, korn — og i kroppen: muskler, enzymer, antistoffer, hæmoglobin.',
        digest: 'Fordøjes til frie aminosyrer, som samles igen til kroppens egne proteiner. Vi genbruger byggestenene, ikke proteinerne.',
        role: 'Formen bestemmer funktionen. Varme og syre bryder foldningen — det er dét der sker med et æg i en pande: proteinerne denatureres, og det er ikke til at gøre om.'
    }
};

function factRows(model, f) {
    const rows = [['📍', 'Hvor findes det', f.where]];
    if (f.side) rows.push(['🔬', 'Sidekæde (R)', f.side]);
    if (f.essential) rows.push(['⭐', 'Essentiel aminosyre?',
        `<span class="f-tag ${f.essential.startsWith('Ja') ? 'no' : 'yes'}">${f.essential.startsWith('Ja') ? 'Essentiel' : 'Ikke essentiel'}</span><br>${f.essential}`]);
    rows.push(['🍽', 'Fordøjelse', f.digest]);
    rows.push(['⚡', 'Rolle i kroppen', f.role]);
    return rows;
}

/* --- Opgaver --------------------------------------------------------- */

const classesIn = m => new Set(m.nodes.map(n => mon[n.name].cls)).size;

const tasks = [
    {
        title: 'Byg et dipeptid',
        predict: {
            q: 'Gæt først: en carboxylgruppe møder en aminogruppe. Hvad bliver fraspaltet?',
            options: ['Ét vandmolekyle', 'Ét CO₂', 'Ingenting — de klæber bare sammen'],
            correct: 0
        },
        goal: 'Læg to aminosyrer på bordet og træk den enes carboxylgruppe (højre side) hen til den andens aminogruppe (venstre side).',
        why: 'Peptidbindingen dannes ved kondensation, præcis som den glykosidiske binding: en OH-gruppe og et H bliver til vand. ' +
             'Samme reaktion, andre byggesten.',
        check: b => b.mols.some(m => m.nodes.length === 2)
    },
    {
        title: 'Lav 4 vandmolekyler ved kondensation',
        predict: {
            q: 'Gæt først: hvor mange aminosyrer skal der til i én kæde for at danne 4 peptidbindinger?',
            options: ['4', '5', '8'],
            correct: 1
        },
        goal: 'Få vandtælleren op på 4 — altså dan 4 peptidbindinger, fx en kæde på 5 aminosyrer.',
        why: 'n aminosyrer holdes sammen af n − 1 peptidbindinger og har afgivet n − 1 vandmolekyler. ' +
             'Det er nøjagtigt den samme regnskabsføring som for stivelse — makromolekyler dannes ens.',
        check: b => b.water >= 4
    },
    {
        title: 'Byg en kæde med mindst tre slags sidekæder',
        predict: {
            q: 'Gæt først: hvad afgør hvordan proteinet folder sig, og dermed hvad det kan?',
            options: ['Hvor lang kæden er',
                      'Rækkefølgen af sidekæderne',
                      'Hvor mange vandmolekyler der blev afgivet'],
            correct: 1
        },
        goal: 'Byg et polypeptid på mindst 6 aminosyrer, hvor der indgår mindst tre af farverne: upolær, polær, sur og basisk.',
        why: 'Rækkefølgen af sidekæder er primærstrukturen, og den bestemmer resten. De upolære gemmer sig inde i midten, ' +
             'de ladede vender ud mod vandet, og sur + basisk kan holde fast i hinanden. Det er derfor ét ombyttet ' +
             'bogstav kan ødelægge et helt protein — som ved seglcelleanæmi.',
        check: b => b.mols.some(m => m.nodes.length >= 6 && classesIn(m) >= 3)
    },
    {
        title: 'Klip inde i kæden med pepsin',
        predict: {
            q: 'Gæt først: du trækker pepsin hen på en binding uden en aromatisk sidekæde ved siden af. Hvad sker der?',
            options: ['Den klipper — et enzym klipper det den kommer til',
                      'Den klipper ikke — sidekæden skal passe i det aktive sted'],
            correct: 1
        },
        goal: 'Byg en kæde med mindst én phenylalanin i (eller brug Hurtigbyg → Polypeptid), og træk pepsin hen på en binding ved den.',
        why: 'Pepsin er en endopeptidase: den klipper inde i kæden, og kun hvor sidekæden passer i dens aktive sted. ' +
             'Mange snit inde i kæden giver mange nye ender, som tarmens enzymer kan arbejde videre på.',
        check: b => b.ev.has('cut:pepsin')
    },
    {
        title: 'Frigør en enkelt aminosyre',
        predict: {
            q: 'Gæt først: hvor meget frigør en exopeptidase pr. klip?',
            options: ['Én aminosyre', 'To aminosyrer', 'Hele kæden på én gang'],
            correct: 0
        },
        goal: 'Træk peptidase hen på den yderste binding i kæden — den ude i N-enden til venstre.',
        why: 'Exopeptidaser klipper kun fra enden, én aminosyre ad gangen. Først som frie aminosyrer kan de optages ' +
             'gennem tarmvæggen. Endopeptidaser og exopeptidaser arbejder sammen — hver for sig kan ingen af dem gøre det færdigt.',
        check: b => b.ev.has('cut:peptidase')
    },
    {
        title: 'Vis hvad pH gør ved et enzym',
        predict: {
            q: 'Gæt først: mavesyren mangler. Hvad sker der med pepsin?',
            options: ['Enzymet er væk',
                      'Enzymet er der, men formen passer ikke længere',
                      'Ingenting — enzymer er ligeglade med pH'],
            correct: 1
        },
        goal: 'Slå 🧪 Syrehæmmer til, og prøv derefter at klippe med pepsin.',
        why: 'Enzymet er der stadig — men et enzym er en foldet form, og formen afhænger af pH. Uden mavesyre passer ' +
             'substratet ikke i det aktive sted. Derfor har hvert enzym sit optimum: pepsin ved pH 2, trypsin ved pH 8.',
        check: b => b.ev.has('ph')
    }
];

/* --- Modulet --------------------------------------------------------- */

export const protein = {
    id: 'protein',
    da: 'Proteiner',
    sub: 'aminosyrer og peptider',
    intro: 'Proteiner: læg aminosyrer på bordet og træk carboxylgruppen (højre) hen til den næstes aminogruppe (venstre). ' +
           'Farven viser sidekædens type — det er den der bestemmer alt.',

    start: {
        title: 'Byg dit første peptid',
        steps: [
            'Klik på to aminosyrer, fx <b>Glycin</b> og <b>Serin</b>.',
            'Træk den enes <b>COOH</b> (højre side) hen til den andens <b>NH₂</b> (venstre side) — ' +
            'linjen mellem dem bliver grøn.',
            'Slip. Der dannes en peptidbinding, og der fraspaltes ét vandmolekyle — ' +
            'præcis som hos kulhydraterne.'
        ],
        demo: ['glycine', 'serine']
    },

    shapes: SHAPES,
    mon,
    links,
    donorKind: 'carboxyl',

    variant: null,
    flips: () => false,

    names,
    monomerName: node => mon[node.name].da,
    bondLabel: () => 'CO–NH',
    bondAtom: () => 'N',
    nouns: { unit: ['aminosyre', 'aminosyrer'], bond: ['peptidbinding', 'peptidbindinger'] },

    verdict: () => ({ ok: true }),

    reprs: [
        { id: 'blocks', da: 'Blokke', title: 'Blokke: farven viser sidekædens type',
          msg: 'Blokke: alle aminosyrer har den samme rygrad og dermed den samme form. Farven er sidekædens type — upolær, polær, sur eller basisk.' },
        { id: 'struct', da: 'Struktur', level: 'B', title: 'Strukturformel: rygraden H₂N–CαH(R)–COOH',
          msg: 'Strukturformel: H₂N–CαH(R)–COOH. Når carboxylgruppen er bundet, står der C=O, og når aminogruppen er bundet, står der N–H. ' +
               'Tilsammen er det –CO–NH–, altså selve peptidbindingen.' },
        { id: 'formula', da: 'Formel', level: 'A', title: 'Molekylformel: hver aminosyre som sumformel',
          msg: 'Molekylformel: her har aminosyrerne ikke samme sumformel — sidekæden tæller med. Regnestykket under molekylet viser hvor meget vand der er fraspaltet.' }
    ],
    struct,
    decorate,
    blockLabels: node => [
        { text: mon[node.name].abbr, cls: 'label-abbr', y: 44 },
        { text: mon[node.name].da,   cls: 'label-name', y: 59 }
    ],

    builds: [
        {
            id: 'dipeptide', da: 'Dipeptid',
            make(res) {
                const root = res('serine');
                root.atN = res('glycine');
                return root;
            },
            say: (name, n) => `${name} bygget af ${n} aminosyrer — glycin har doneret sin carboxylgruppe, og der er fraspaltet ét vandmolekyle.`
        },
        {
            id: 'chain', da: 'Polypeptid',
            make(res) {
                // Blandet sekvens, så både pepsin (phenylalanin) og trypsin
                // (lysin) har et sted at klippe
                const seq = ['glycine', 'phenylalanine', 'serine', 'lysine',
                             'aspartate', 'cysteine', 'phenylalanine', 'glycine'];
                const root = res(seq[seq.length - 1]);
                let t = root;
                for (let i = seq.length - 2; i >= 0; i--) { t.atN = res(seq[i]); t = t.atN; }
                return root;
            },
            say: (name, n) => `${name} bygget af ${n} aminosyrer i en bestemt rækkefølge — det er primærstrukturen. Der er fraspaltet ${n - 1} vandmolekyler.`
        }
    ],

    enzymes,
    toggle,
    facts,
    factRows,
    factColour: (info, n) => n === 1
        ? CLASS[mon[info.key].cls].colour[1]
        : { di: '#2471a3', tri: '#2471a3', oligo: '#1f618d', poly: '#1a5276', protein: '#34495e' }[info.key],

    tasks,
    summary: water =>
        `<p class="tp-goal">Alle ${tasks.length} opgaver er løst. Læg mærke til hvor lidt der egentlig var nyt:</p>
         <ul class="tp-sum">
           <li><b>Samme reaktion</b> som ved kulhydraterne: kondensation binder sammen og fraspalter vand,
               hydrolyse gør det modsatte. Vandtælleren står på ${water}.</li>
           <li><b>Rygraden er ens</b> i alle aminosyrer. Det er sidekæden R der skiller dem ad — og
               rækkefølgen af sidekæder er hele informationen i et protein.</li>
           <li><b>Formen er funktionen.</b> Kæden folder sig efter sidekæderne, og ændrer man pH eller
               temperatur, ændrer man formen — og så virker proteinet ikke.</li>
           <li><b>Enzymer er specifikke</b>, også her: pepsin, trypsin og peptidase klipper hver sit sted,
               og der skal alle tre til for at nå frem til frie aminosyrer.</li>
         </ul>`
};
