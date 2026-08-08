# Bio-Blocks — idéliste til videre udvikling

App: [index.html](index.html)

Det der er bygget, er skrevet ud af listen igen. Beskrivelserne af hvorfor
tingene blev som de blev, står i git-historikken og i kommentarerne dér hvor
koden er. Herunder står kun det, der mangler.

## Sådan ser appen ud nu

Tre moduler — kulhydrater, proteiner og fedt — på den samme motor: en fri
donorplads møder en fri modtagerplads, der fraspaltes vand, og de to
molekyler bliver til ét. Kun kataloget i `js/modules/` skifter.

Dertil: α/β-anomerer, nummererede atomer, tre repræsentationer (blokke,
struktur, formel) plus 3D, synlige bindingspladser, enzymblokke med
substratspecificitet og kontakter, faktakort, ordbog over fagordene, 📋 Min
log til afleveringen, startkort på det tomme bord, og opgavemode med gæt →
gør → forklar, spring over og opsamling. C-, B- og A-niveau fjerner knapper
og opgaver i stedet for at tilføje indhold.

## Mangler

Rækkefølgen er ikke en prioritering.

- [ ] **3D kun for kulhydraterne.** De er de eneste med SDF-filer i
      `Molecules/`; 3D-knappen skjuler sig selv i de to andre moduler.
- [ ] **Gem som billede** (PNG/SVG-eksport) til elevrapporter. 📋 Min log
      dækker den skriftlige aflevering, men ikke molekylet på bordet.
- [ ] **Klik-vælg-klik** som alternativ til træk-og-slip på touch/tablet.
- [ ] **Tavletilstand:** større skrift, kraftigere kontrast til projektor.
- [ ] **Skjul-navne-tilstand** til overhøring.
- [ ] **Disulfidbro mellem to cysteiner** — en binding der ikke er en
      kondensation, og som derfor kræver en ny slags kant i modellen.
