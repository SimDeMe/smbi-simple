# Bio-Blocks — idéliste til videre udvikling

App: [bio-blocks.html](bio-blocks.html)

Bygget indtil videre: monosakkarider → disakkarider → polysakkarider (kæder og
forgreninger), α/β-anomerer, nummererede C-atomer, 3D-visning via PubChem-SDF.

Nedenstående punkter er ikke bygget endnu. Rækkefølgen er den oprindelige
nummerering fra idélisten, ikke en prioritering.

---

## 3. Enzymer som blokke man trækker på

Erstat/supplér ✂-knappen med enzymblokke der trækkes hen på molekylet:
**maltase, sakkarase, laktase, amylase, cellulase**.

- Forkert enzym → ingen reaktion. Substratspecificitet demonstreres i stedet for
  at blive forklaret.
- Amylase klipper kun α-1,4 — ikke α-1,6 (derfor grænsedextriner) og ikke β-1,4.
- Cellulase findes i appen, men skal markeres tydeligt som "mennesker har den ikke".
- **Laktoseintolerans-scenarie:** uden laktase passerer laktosen til tyktarmen →
  tarmbakterier → gas og osmotisk diarré. Knytter modulet til noget eleverne kender.

Krav: en palet med enzymblokke, drop-zone-logik på de enkelte bindinger,
og en regeltabel enzym → hvilke bindingstyper det kan hydrolysere.

## 6. Repræsentationsskift

Toggle mellem fire repræsentationer af **samme** molekyle:

1. Blokke (nuværende visning)
2. Haworth-formel
3. Molekyleformel / sumformel
4. 3D (findes allerede)

Formålet er repræsentationskompetence — at eleverne kan se at det er det samme
molekyle. Haworth-delen er den dyre: kræver tegnede ringe med OH-grupper i
korrekt α/β-orientering.

## 7. Opgavemode

Opgaver med automatisk tjek og en kort forklaring bagefter:

- "Byg laktose"
- "Byg en kæde der ikke kan fordøjes af mennesker" (cellulose)
- "Lav 4 vandmolekyler ved kondensation"
- "Byg et forgrenet polysakkarid"
- "Byg to disakkarider med samme sumformel, men forskellig binding"

Gør appen brugbar til selvstændigt elevarbejde, ikke kun tavledemo.
Overvej progression/låste niveauer og en kort opsamling til sidst.

## 8. Faktakort på molekylerne

Klik på et molekyle → kort med:

- Hvor findes det (mælk, rørsukker, malt, kartofler, træ, lever/muskler)
- Relativ sødme
- Reducerende eller ikke-reducerende sukker
- Fordøjelighed for mennesker
- Energiindhold / rolle i organismen

Lav kontekst pr. molekyle, lille arbejdsindsats.

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
