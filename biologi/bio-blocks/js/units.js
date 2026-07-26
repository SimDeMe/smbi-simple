/* =====================================================================
   Fælles geometri — den kasse ét byggeblok tegnes i, og afstandene
   mellem dem. Den er den samme for alle moduler: et sukkerring, en
   aminosyre og en fedtsyre fylder lige meget på bordet, så layout,
   træk-og-slip og bindingsafstande kan deles.
   ===================================================================== */

export const UNIT_W = 110, UNIT_H = 96;
export const UNIT_CX = 55, UNIT_CY = 48;

const GAP = 44;
export const STEP  = UNIT_W + GAP;     // vandret afstand mellem to bundne enheder
export const ROW_H = UNIT_H + 62;      // lodret afstand til en grenrække (moduler kan sætte deres egen)
export const ARM   = 32;               // plads reserveret til en stub over og under kassen
export const SNAP  = 115;              // hvor tæt to bindingssteder skal være for at reagere

export const SUB = '₀₁₂₃₄₅₆₇₈₉';
