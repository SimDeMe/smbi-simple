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
       sdf, sdfNote     3D-struktur, hvis der findes en fil
       side, sat, …     modulets egne felter — motoren rører dem ikke

   donorKind            navnet på donorpladsen ('anomeric', 'carboxyl' …)
   links {}             kind → { field, site, dRow, label, stub }
       field            hvilket felt på residuet der holder donoren
       site             tallet/navnet der identificerer bindingen udadtil
       dRow             0 = samme række (kæden), ±1 = gren op/ned

   variant              valgfri: modulets formvalg (α/β) — { field, da,
                        options[{id,label,title,msg}], flipTip }
   flips(donor, field)  skal enheden efter denne binding vendes 180°?

   names []             navneregler, første match vinder. Felter:
                        size | upTo | from | residues | branched | bonds
   monomerName(node)    navnet på en enkelt monomer
   bondLabel(bond)      teksten over bindingen
   bondAtom(bond)       bogstavet i bindingens cirkel ('O', 'N')
   nouns                { unit: [ental, flertal], bond: [ental, flertal] }
   verdict(d, a, site)  må de to pladser reagere? { ok, msg, short }

   reprs []             { id, da, title, msg } — den første er default
   struct()             tegner repræsentationen med id 'struct'
   decorate()           valgfri ekstra tegning oven på en blok
   blockLabels(node)    teksterne inde i blokken

   builds []            hurtigbyg: { id, da, make(res) → rod, note }
   enzymes {}           enzymkataloget (se enzymes.js)
   toggle               valgfri kontakt (laktoseintolerans, galde …)
   facts {}             faktakortenes indhold, key → data
   factRows(model, f)   rækkerne i faktakortet
   factColour(info, n)  farven på faktakortets top
   tasks []             opgaverne
   summary(state)       opsamlingen når alle opgaver er løst
   ===================================================================== */

import { state } from '../state.js';
import { carbs } from './carbs.js';
import { protein } from './protein.js';
import { lipid } from './lipid.js';

export const MODULES = [carbs, protein, lipid];

export function mod() {
    return MODULES.find(m => m.id === state.modId) || MODULES[0];
}
