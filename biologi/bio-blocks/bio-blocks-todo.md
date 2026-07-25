# Bio-Blocks — idéliste til videre udvikling

App: [index.html](index.html)

Bygget indtil videre: monosakkarider → disakkarider → polysakkarider (kæder og
forgreninger), α/β-anomerer, nummererede C-atomer, 3D-visning via PubChem-SDF,
enzymblokke (amylase, maltase, sakkarase, laktase, cellulase) med
substratspecificitet og laktoseintolerans-scenarie.

Dertil (punkt 6–8, bygget):

- **Repræsentationsskift** — Visning: Blokke / Haworth / Formel, plus 3D-knappen.
  Alle visninger bruger samme layout og samme bindingspunkter, så det er
  tydeligt at det er det samme molekyle. Haworth tegner ringen med
  OH-grupperne i korrekt α/β-orientering (og C4 op på galaktose).
- **Opgavemode** — 🎯 Opgaver: 8 opgaver med automatisk tjek, forklaring
  bagefter, låste niveauer og en opsamling til sidst.
- **Faktakort** — ℹ-knappen under hvert molekyle: hvor det findes, relativ
  sødme, reducerende/ikke-reducerende (beregnet ud fra frie anomere C-atomer),
  fordøjelighed og energi/rolle.

Nedenstående punkter er ikke bygget endnu. Rækkefølgen er den oprindelige
nummerering fra idélisten, ikke en prioritering.

---
## Refaktorering — gjort

De 2646 linjer html er delt op i `bio-blocks/` med ES-moduler og uden
byggetrin, ligesom `navneApp/` og `tid/`. Koden er den samme; kun opdelingen
er ny. `bio-blocks.html` blev til en redirect, så gamle links stadig virker.

- `js/data.js` og `js/model.js` rører ikke DOM'en. Det er dem punkt 9 skal
  have en udgave af pr. modul — resten af appen læser derfra.
- `js/state.js` samler det der ændrer sig undervejs, fordi et modul ikke kan
  skrive til en anden fils variabler.
- Markup'en holder ingen logik længere: knapperne bærer `data-spawn`,
  `data-build`, `data-enzyme`, og koblingen står i `js/main.js`.

Hele kataloget står nu i `data.js`: `MOL` (monomerer), `DISACC`
(disakkarider) og `POLY` (alt længere). `POLY` er en liste af regler, der
*beskriver* kæden i stedet for at teste den — `residues`, `bonds`,
`branched`, `upTo` — og `classify()` tager den første regel der passer.
Rækkefølgen afgør det: de snævre regler først, og de to sidste passer på
hvad som helst, så der altid er et hit. Der står ikke længere et molekylenavn
eller en SDF-sti i `model.js`, så et protein- eller fedtmodul skal have en ny
`data.js` og ikke andet.

## opgavemode
Bordet skal ryddes, hver gang man går videre til en ny opgave.

## 9. Samme motor til proteiner og fedt

Navnet "Bio-Blocks" lover mere end kulhydrater. Samme kondensations-/hydrolyse-
logik kan bruges til:

- **Aminosyrer → peptidbinding → polypeptid** (og evt. sidekædetyper: polær,
  upolær, sur, basisk)
- **Glycerol + 3 fedtsyrer → esterbinding → triglycerid** (mættet/umættet)

Pointen: *alle* makromolekyler dannes ved samme princip. Én app der viser det er
stærkere end tre separate apps. Kræver at monomer-katalog, bindingsregler og
navngivning gøres datadrevne pr. "modul", så motoren kan genbruges.

## 10. Småting

- [ ] Hjem-knap (står også på projektets generelle `ToDo.md`)
- [ ] Gem som billede (PNG/SVG-eksport) til elevrapporter
- [ ] Klik-vælg-klik som alternativ til træk-og-slip på touch/tablet
- [ ] Tavletilstand: større skrift, kraftigere kontrast til projektor
- [ ] Skjul-navne-tilstand til overhøring
