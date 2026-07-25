# Bio-Blocks — idéliste til videre udvikling

App: [bio-blocks.html](bio-blocks.html)

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
## Refaktorering?
Giver det mening at refaktorere bio-blocks så det ligger i flere filer i en mappe i stedet for som en gigastor html?



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
