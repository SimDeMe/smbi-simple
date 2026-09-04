/* =====================================================================
   Modulregistret — og kontrakten et modul skal opfylde.

   Motoren (model, render, reactions, enzymes, facts, tasks) ved ikke at
   glukose findes. Den kender kun det aktive modul, og alt hvad den skal
   bruge, står i modulets fil. Et nyt stofområde er derfor én ny fil her
   plus en linje i MODULES.

   ---------------------------------------------------------------------
   Et modul er ét objekt:

   id, da, sub          identitet og knaptekst i modulvælgeren
   intro                statuslinjen når man skifter til modulet
   introC               valgfri: den samme tekst på C-niveau, hvor α/β og
                        enzymerne ikke er fremme og derfor ikke må nævnes
   start                startkortet på det tomme bord — { title, steps[],
                        demo[] }, hvor demo er de monomernavne "Læg dem ud
                        for mig" lægger side om side
   step, rowH           valgfri: vandret og lodret afstand mellem enheder

   shapes {}            formerne enhederne tegnes i:
       path             SVG-path i kassen UNIT_W × UNIT_H
       sites {}         kind → [x, y]: hvor en binding rammer formen
       sitesByRepr {}   repr → kind → [x, y] for de visninger der flytter et sted
       atoms []         [label, x, y, klasse?] — tændes af "C-numre"

   mon {}               monomerkataloget, name → :
       da, abbr, shape, colour [lys, mørk], note
       atoms {C,H,O,…}  sumformlen for den frie monomer
       donor            kan enheden donere (har den en fri "hale")
       accepts []       hvilke link-typer den kan modtage
       mirror           tegnes spejlvendt (fruktose)
       variant          hvilken af modulets former enheden lægges ud i;
                        uden feltet er det den første option
       sdf, sdfNote     3D-struktur, hvis der findes en fil
       side, sat, …     modulets egne felter — motoren rører dem ikke

   donorKind            navnet på donorpladsen ('anomeric', 'carboxyl' …)
   links {}             kind → { field, site, dRow, label, stub }
       field            hvilket felt på residuet der holder donoren
       site             tallet/navnet der identificerer bindingen udadtil
       dRow             0 = samme række (kæden), ±1 = gren op/ned

   variant              valgfri: modulets formvalg (α/β) — { field,
                        options[{id,label,title,flip}], flipTip }. Formen
                        vælges pr. byggesten, ikke for modulet: hver
                        monomer har sin egen kontakt fra B-niveau, og sit
                        eget udgangspunkt i `mon[].variant`.
   flips(donor, field)  skal enheden efter denne binding vendes 180°?

   names []             navneregler, første match vinder. Felter:
                        size | upTo | from | residues | branched | bonds
   monomerName(node)    navnet på en enkelt monomer
   bondLabel(bond)      teksten over bindingen
   bondAtom(bond)       bogstavet i bindingens cirkel ('O', 'N')
   nouns                { unit: [ental, flertal], bond: [ental, flertal] }
   verdict(d, a, site)  må de to pladser reagere? { ok, msg, short }

   enzymes {}           key → { da, colour, sub, where, tag, level,
                        test(bond, model) }. `level` ('B'/'A') gemmer
                        enzymet under det niveau; uden feltet er det med
                        hele vejen — som visningerne og opgaverne.
   toggle               valgfri kontakt (laktoseintolerans, galde …), med
                        det samme `level`-felt

   reprs []             { id, da, title, msg, level } — den første er
                        default og skal kunne vises på C-niveau. `level`
                        ('B' eller 'A') skjuler visningen under det
                        niveau; uden feltet er den med hele vejen. Se
                        levels.js.
   struct()             tegner repræsentationen med id 'struct'
   decorate()           valgfri ekstra tegning oven på en blok
   blockLabels(node)    teksterne inde i blokken

   builds []            hurtigbyg: { id, da, make(res) → rod, note }
   enzymes {}           enzymkataloget (se enzymes.js)
   toggle               valgfri kontakt (laktoseintolerans, galde …)
   facts {}             faktakortenes indhold, key → data
   factRows(model, f)   rækkerne i faktakortet
   factColour(info, n)  farven på faktakortets top
   terms {}             valgfri: stofgruppens fagord, key → { da, alt[],
                        txt }. `alt` er de skrivemåder der skal fanges i
                        teksterne (stammen er nok — de danske endelser
                        tages med), og `txt` er de to linjers forklaring.
                        De ord der gælder alle tre stofgrupper, står i
                        glossary.js og skal ikke gentages her
   tasks []             opgaverne: { title, goal, why, check(board) } plus
                        valgfrit `predict: { q, options[], correct }` —
                        forudsigelsen eleven skal gøre *før* handlingen.
                        Panelet viser ikke `goal`, før der er gættet, og
                        facit kommer sammen med `why`.
                        `level` ('B'/'A') skjuler opgaven under det niveau
                        og skal sættes på alt, der kræver knapper C-niveau
                        ikke har: α/β-valget, enzymerne, formelvisningen
   summary(state)       opsamlingen når alle opgaver er løst
   ===================================================================== */

import { state } from '../state.js';
import { atLeast } from '../levels.js';
import { carbs } from './carbs.js';
import { protein } from './protein.js';
import { lipid } from './lipid.js';

export const MODULES = [carbs, protein, lipid];

export function mod() {
    return MODULES.find(m => m.id === state.modId) || MODULES[0];
}

/* Introteksten hører til niveauet lige så meget som til modulet: der skal
   ikke stå "vælg α eller β" på et C-niveau, hvor knappen ikke er der. */
export function intro() {
    const m = mod();
    return (!atLeast('B') && m.introC) || m.intro;
}
