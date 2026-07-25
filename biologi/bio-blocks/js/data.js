/* =====================================================================
   Katalog og geometri — ren data, intet DOM og ingen tilstand.

   Det er denne fil et proteinmodul eller et fedtmodul skal have sin egen
   udgave af: monomerer, former og bindingsgeometri. Resten af appen
   læser herfra og kender ikke andet.
   ===================================================================== */

export const UNIT_W = 110, UNIT_H = 96;
export const UNIT_CX = 55, UNIT_CY = 48;
const GAP     = 44;
export const STEP    = UNIT_W + GAP;     // horizontal distance between bonded residues
export const ROW_H   = UNIT_H + 62;      // vertical distance to a branch row
export const ARM     = 32;               // reserved space for the C6 stub, above and below
export const SNAP    = 115;              // how close two binding sites must be to react

export const SHAPES = {
    hex:  "M27.5 0 L82.5 0 L110 48 L82.5 96 L27.5 96 L0 48 Z",
    pent: "M55 0 L104.5 36 L85 96 L25 96 L5.5 36 Z"
};

/* Carbon labels, placed at the ring position they actually occupy in a
   Haworth projection (ring O top right, C1 right, then counter-clockwise). */
export const CARBONS = {
    hex:  [['5', 33, 12], ['O', 77, 12, 'ring-o'], ['1', 95, 48],
           ['2', 79, 81], ['3', 31, 81], ['4', 15, 48]],
    pent: [['O', 55, 13, 'ring-o'], ['1', 84, 26], ['2', 92, 46],
           ['3', 76, 80], ['4', 34, 80], ['5', 18, 46], ['6', 26, 26]]
};

/* --- Molecule catalogue --------------------------------------------- */
export const MOL = {
    glucose:   { da: 'Glukose',   abbr: 'GLU', shape: 'hex',  sdf: '../../Molecules/glucose.sdf',
                 note: 'Druesukker — cellernes vigtigste brændstof.' },
    fructose:  { da: 'Fruktose',  abbr: 'FRU', shape: 'pent', sdf: '../../Molecules/fructose.sdf',
                 note: 'Frugtsukker — femring (furanose) og den sødeste af de tre.' },
    galactose: { da: 'Galaktose', abbr: 'GAL', shape: 'hex',  sdf: '../../Molecules/galactose.sdf',
                 note: 'Adskiller sig fra glukose ved OH-gruppen på C4.' }
};

/* Disaccharides, keyed by donor|anomer|acceptor-carbon|acceptor.
   `key` points into FACTS — the fact card for the molecule. */
export const DISACC = {
    'glucose|a|4|glucose':   { da: 'Maltose', key: 'maltose', sdf: '../../Molecules/maltose.sdf',
        note: 'Maltsukker fra nedbrudt stivelse — spaltes af maltase.' },
    'glucose|b|4|glucose':   { da: 'Cellobiose', key: 'cellobiose', sdf: '../../Molecules/cellobiose.sdf',
        note: 'Byggestenen i cellulose. Kun β-1,4 adskiller den fra maltose.' },
    'glucose|a|6|glucose':   { da: 'Isomaltose', key: 'isomaltose', sdf: '../../Molecules/isomaltose.sdf',
        note: 'Grenpunktet i amylopektin og glykogen.' },
    'glucose|b|6|glucose':   { da: 'Gentiobiose', key: 'gentiobiose', sdf: null,
        note: 'Sjælden β-1,6-binding — findes bl.a. i plantefarvestoffer.' },
    'galactose|b|4|glucose': { da: 'Laktose', key: 'lactose', sdf: '../../Molecules/lactose.sdf',
        note: 'Mælkesukker — kræver enzymet laktase for at kunne optages.' },
    'galactose|a|6|glucose': { da: 'Melibiose', key: 'melibiose', sdf: null,
        note: 'Findes i bælgfrugter — mennesker mangler enzymet til den.' },
    'glucose|a|2|fructose':  { da: 'Sakkarose', key: 'sucrose', sdf: '../../Molecules/sucrose.sdf',
        note: 'Rør- og roesukker. Begge anomere C-atomer er bundet → ikke-reducerende.' }
};

/* Disaccharide that is chemically possible but has no name of its own */
export const DISACC_OTHER = { da: 'Disakkarid', key: 'disacc', sdf: null,
    note: 'Kemisk muligt, men ikke et af de almindelige disakkarider.' };

/* Polysaccharides — three or more residues.
   A rule describes the chain rather than testing it, so this table is the
   whole polymer catalogue, exactly like MOL and DISACC are for the small
   molecules. `classify()` takes the first rule that fits:

     residues — every residue must be this monomer
     bonds    — every bond must match these fields; a list means "one of"
     branched — true/false if branch points are required/forbidden
                (left out: does not matter)
     upTo     — the rule only applies up to this many residues, which is how
                the short chains get their own names

   Order matters: the narrow rules come first, and the last two fit anything,
   so there is always a hit.                                               */
export const POLY = [
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

    { upTo: 9, da: 'Oligosakkarid', key: 'poly', sdf: null,
      note: 'Blandet kæde — prøv at bygge en ren α-1,4- eller β-1,4-kæde.' },

    { da: 'Polysakkarid', key: 'poly', sdf: null,
      note: 'Blandet kæde — prøv at bygge en ren α-1,4- eller β-1,4-kæde.' }
];

export const SUB = '₀₁₂₃₄₅₆₇₈₉';

/* ---------- Haworth geometry ----------------------------------------
   The ring vertices live in the same UNIT_W × UNIT_H box as the blocks,
   and the anomeric carbon and C4 sit exactly where the block's binding
   sites sit. Only the drawing changes: layout, bonds, hit-testing and
   chemistry are shared by every representation.

   Substituents are drawn in two lanes — one above and one below the ring —
   which is what makes α/β visible: for a D-sugar the anomeric OH points
   up in the β-form and down in the α-form.                              */
export const HW = {
    hex: {
        at:   { C1: [110, 48], C2: [82.5, 60], C3: [26, 60],
                C4: [0, 48],   C5: [40, 36],   O:  [85, 36] },
        // [from, to, isFrontBond] — the front bonds are drawn bold
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

/* Where the C6 stub leaves the ring. In Haworth mode it grows out of C5,
   which sits further right than the block's C6 corner. */
export const HW_C6_X = 40;
