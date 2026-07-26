# Bio-Blocks — idéliste til videre udvikling

App: [index.html](index.html)

Bygget indtil videre: tre moduler — kulhydrater, proteiner og fedt — der kører
på den samme motor. Kondensation og hydrolyse, α/β-anomerer, nummererede
atomer, tre repræsentationer, 3D-visning via PubChem-SDF, enzymblokke med
substratspecificitet, faktakort og opgavemode i alle tre.

Dertil (punkt 6–8, bygget):

- **Repræsentationsskift** — Visning: Blokke / Struktur / Formel, plus
  3D-knappen der hvor der findes PubChem-koordinater. Alle visninger bruger
  samme layout og samme bindingspunkter, så det er tydeligt at det er det
  samme molekyle. Kulhydraternes strukturvisning er Haworth-formlen med
  OH-grupperne i korrekt α/β-orientering (og C4 op på galaktose).
- **Opgavemode** — 🎯 Opgaver: opgaver med automatisk tjek, forklaring
  bagefter, låste niveauer og en opsamling til sidst. Hvert modul har sine
  egne opgaver og sin egen fremgang.
- **Faktakort** — ℹ-knappen under hvert molekyle: hvor det findes, og de
  spørgsmål der giver mening for stofgruppen — sødme og reducerende sukker,
  sidekædetype og essentielle aminosyrer, mættet/umættet fedt.

Nedenstående punkter er ikke bygget endnu. Rækkefølgen er den oprindelige
nummerering fra idélisten, ikke en prioritering.

---
## Refaktorering — gjort

De 2646 linjer html er delt op i `bio-blocks/` med ES-moduler og uden
byggetrin, ligesom `navneApp/` og `tid/`. `bio-blocks.html` blev til en
redirect, så gamle links stadig virker.

- `js/state.js` samler det der ændrer sig undervejs, fordi et modul ikke kan
  skrive til en anden fils variabler.
- Markup'en holder ingen logik: `index.html` har kun tomme grupper i
  topbjælken, og `js/ui.js` fylder dem ud fra det valgte modul. Også
  farvegradienterne bygges af koden, for de hører til kataloget.

## Opgavemode — gjort

"Næste opgave →" rydder nu bordet, så hver opgave starter forfra. Ellers kunne
resterne fra den forrige opgave løse den næste af sig selv, og så var det ikke
til at se hvad der blev tjekket. Det samme gør "Start opgaverne forfra".

Rydningen ligger i `resetGame()` i `board.js`, som også nulstiller vandtælleren
og `taskEvents` — de klip et enzym har lavet, hørte til det bord der lige er
ryddet. "Ryd bordet"-knappen gør derfor det samme i opgavemode som udenfor.

## 9. Samme motor til proteiner og fedt — gjort

Modulvælgeren øverst skifter mellem **kulhydrater**, **proteiner** og **fedt**.
Det er den samme motor hele vejen: en fri donorplads møder en fri
modtagerplads, der fraspaltes vand, og de to molekyler bliver til ét. Kun
kataloget skifter.

- **Proteiner** — 6 aminosyrer farvet efter sidekædens type (upolær, polær,
  sur, basisk), peptidbinding, navne fra dipeptid til protein, pepsin
  (aromatiske sidekæder), trypsin (efter lysin) og peptidase (fra enden), og
  en syrehæmmer-kontakt der viser hvad pH gør ved et enzym.
- **Fedt** — glycerol med tre OH-grupper, fire fedtsyrer med knæk hvor der er
  cis-dobbeltbindinger, esterbinding, mono-/di-/triglycerid (mættet og
  umættet), bugspytlipase (kun C1 og C3 — derfor 2-monoglycerid) og
  hormonfølsom lipase, og en galde-kontakt.

Motoren i `js/` ved ikke at glukose findes. Den kender kun det aktive modul:

- `js/modules/index.js` er registret og dokumenterer kontrakten. Et nyt
  stofområde er én ny fil plus en linje i `MODULES`.
- `js/modules/carbs.js`, `protein.js` og `lipid.js` holder hver især katalog,
  former, bindingsregler, navngivning, strukturtegning, enzymer, faktakort og
  opgaver. Det er dem, der er data.
- `js/units.js` er den kasse alle enheder tegnes i — fælles, så layout,
  træk-og-slip og bindingsafstande kan deles. Et modul kan sætte sin egen
  `step` og `rowH`; fedtets tre estere sidder tættere sammen end en sukkerkæde.
- Sumformlen slås ikke længere op: hver byggesten har sin atomoptælling, og
  hver binding koster ét H₂O. Derfor kan formelvisningen vise regnestykket,
  også når byggestenene ikke er ens (`C₃₈H₆₇N₉O₁₉S − 7 H₂O = C₃₈H₅₃N₉O₁₂S`).
- Navngivningen er én regelliste pr. modul, og den første regel der passer,
  vinder. Reglerne matcher på antal (`size`, `upTo`, `from`), på byggesten
  (`residues`) og på bindinger (`bonds`, `branched`).

Til rest: 3D-ruden virker kun for kulhydraterne, fordi det er de eneste der har
SDF-filer i `Molecules/`. 3D-knappen skjuler sig selv i de andre moduler.

## 10. Småting
- [x] Fedtstof-opgavernes forklaring sagde at stofgrupperne "hører til i den samme
      app". Teksten handler nu om biologien i stedet: cellen bygger alle tre
      stofgrupper efter samme princip.
- [ ] Hjem-knap (står også på projektets generelle `ToDo.md`)
- [ ] Gem som billede (PNG/SVG-eksport) til elevrapporter
- [ ] Klik-vælg-klik som alternativ til træk-og-slip på touch/tablet
- [ ] Tavletilstand: større skrift, kraftigere kontrast til projektor
- [ ] Skjul-navne-tilstand til overhøring
- [ ] Disulfidbro mellem to cysteiner — en binding der ikke er en
      kondensation, og som derfor kræver en ny slags kant i modellen


## 11. Gør det muligt at vælge C, B eller A-niveau. 
Hvor C-niveau kun viser enkle sammenhænge, B-niveau bliver mere nuanceret og A-niveau er den fulde oplevelse
