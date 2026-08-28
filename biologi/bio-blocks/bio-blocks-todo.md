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

Siden kører sitets fælles design (`design_rules.md`): papirbaggrund, sorte
blækrammer, hårde skygger, regnbuestribe og de tre skrifter. Alt betjeningen
sidder i ét `.rig`-panel — bordet i midten, vælgerne over det, statuslinjen,
vandinstrumentet og signaturforklaringen under. Modul, niveau og
projektortilstand står i adressen, så en time kan deles med ét link
(`#modul=protein&niveau=B`, `?modul=fedt&projektor=1`), se `js/deling.js`.

## Mangler

Rækkefølgen er ikke en prioritering.

- [ ] **3D kun for kulhydraterne.** De er de eneste med SDF-filer i
      `Molecules/`; 3D-knappen skjuler sig selv i de to andre moduler.
- [ ] **Gem som billede** (PNG/SVG-eksport) til elevrapporter. 📋 Min log
      dækker den skriftlige aflevering, men ikke molekylet på bordet.
- [ ] **Klik-vælg-klik** som alternativ til træk-og-slip på touch/tablet —
      og dermed også den vej, der gør bordet betjeneligt med tastatur alene,
      som `design_rules.md` kræver. Træk-og-slip er i dag den eneste måde at
      danne en binding på.
- [ ] **Tavletilstand for selve figuren.** Projektorknappen skjuler sidens
      krom og gør bjælker, skydere og statuslinje større, men molekylerne
      tegnes stadig i deres egen faste størrelse: `#svg-space` har ingen
      `viewBox`, så 1 enhed = 1 px, og `drag.js` regner i de koordinater.
      Skal blokkene også vokse på en projektor, skal skalaen med i modellen.
- [ ] **Skjul-navne-tilstand** til overhøring.
- [ ] **Disulfidbro mellem to cysteiner** — en binding der ikke er en
      kondensation, og som derfor kræver en ny slags kant i modellen.
