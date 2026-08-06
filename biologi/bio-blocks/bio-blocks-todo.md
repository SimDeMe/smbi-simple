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


## 11. C-, B- eller A-niveau — gjort

Niveauknappen sidst i topbjælken. Den fjerner knapper i stedet for at tilføje
indhold, så C-niveau kun viser de enkle sammenhænge (byggesten, blokke,
kondensation og hydrolyse), B lægger form, enzymer og strukturformel oveni,
og A er den fulde oplevelse med molekylformel og 3D. Se
"Topbjælken viser alt på én gang" under punkt 12 for hvad der ligger hvor,
og hvad det gør ved bjælkens højde.

Til rest: opgaverne er endnu ikke mærket op med niveau.


## 12. Brugervenlighed og læringsudbytte for gennemsnitseleven

Noteret efter en gennemgang af koden og en tur gennem appen i browseren
(byggede maltose, åbnede opgavepanelet, målte topbjælken). Punkterne er
sorteret efter effekt pr. arbejdstime, ikke efter hvor de hører til i koden.

### De tre der betyder mest

- [x] **Giv appen en start.** — gjort, se nedenfor.
- [ ] **Gæt → gør → forklar i opgavemode.** Opgaverne tester i dag handling,
      ikke forståelse: `goal` fortæller præcis hvad man skal gøre ("træk den
      enes C1 hen til den andens C4"), og `check()` godkender resultatet. Det
      kan følges bogstaveligt uden at forstå noget. Tilføj et
      forudsigelsesspørgsmål med 2–3 svarmuligheder *før* handlingen ("hvor
      mange vandmolekyler bliver der dannet?"). Motoren er der allerede — det
      er ét nyt felt i opgaveobjektet (`predict: { q, options, correct }`) og
      lidt i `tasks.js`.
- [ ] **Marker de frie bindingspladser på blokkene.** Eleven skal i dag vide
      at C1 er højre hjørne og C4 venstre. Kun C6 har en synlig knop
      (`drawArms` i `render.js`). Giv donorplads og modtagerplads hver sin
      markør, og lad dem lyse op mens man trækker.

### Startkortet — gjort

Før mødte eleven et tomt gitter og fireogtyve knapper, og den eneste
vejledning var `mod().intro` i statuslinjen nederst på skærmen — langt fra
der hvor øjet lander. Nu står der et kort midt på bordet med de tre trin, der
skal til for at danne den første binding, og to knapper: **Læg dem ud for
mig** og **🎯 Gå til opgaverne**.

Reglen for hvornår det vises, er den samme hele vejen: *er der ingen
molekyler på bordet, og er opgavepanelet lukket, så er der ikke noget at se
på — og så står kortet der.* Det forsvinder i samme øjeblik der ligger en
byggesten, og kommer igen efter "Ryd bordet". Derfor er der ingen "vis ikke
igen" at holde styr på, og ingen `localStorage`: kortet er en egenskab ved
det tomme bord, ikke ved det første besøg.

- `js/welcome.js` er ruden og reglen. `syncWelcome()` kaldes fra `board.js`
  (`spawn`, `quickBuild`, `clearTable`), fra `toggleTasks()` og fra
  `switchModule()`.
- Teksten er modulets, ikke motorens: `start: { title, steps[], demo[] }` i
  hvert modul, dokumenteret i `modules/index.js`. Kulhydraterne siger C1 og
  C4, proteinerne COOH og NH₂, fedtet COOH og OH — og trin 3 siger hver gang
  at der fraspaltes ét vandmolekyle, så pointen om den fælles motor kommer
  allerede her og ikke først i opsamlingen.
- `spawn(name, at)` har fået en valgfri placering, så "Læg dem ud for mig"
  kan lægge byggestenene i en trappe med `DEMO_GAP` imellem. Mellemrummet er
  større end `SNAP`, så de ikke binder af sig selv — eleven skal stadig lave
  bindingen, ellers er der ikke noget at forstå — og trappen nedad er der,
  for at hver byggesten kan have sin navnetekst og sin note uden at de
  skriver oven i hinanden.

### Topbjælken viser alt på én gang — gjort

Før stod der 24 knapper i tre grupperækker: 140 px høj ved 1358 px bredde,
225 px ved 768 px. På en tablet i portræt åd bjælken 30 % af skærmen, og en
elev der lige var begyndt, mødte fem enzymer og en laktoseintolerans-kontakt
før den første glukose var lagt ud.

Niveauvalget (punkt 11) er svaret, og det **fjerner knapper** i stedet for at
tilføje indhold:

| | C | B | A |
|---|---|---|---|
| modul, byggesten, blokke, opgaver, C-numre, vand, ryd | ✔ | ✔ | ✔ |
| form (α/β), hurtigbyg, enzymer + kontakt, strukturformel | | ✔ | ✔ |
| molekylformel med vandregnskabet, 3D | | | ✔ |

Målt bagefter, samme browser og samme bredder: **225 → 98 px ved 768 px**
(bordet vokser fra 464 til 591 px i højden), og 141 → 97 px ved 1358 px.
C er standard, for det er begynderen der har problemet.

- `js/levels.js` er niveauerne og `atLeast(level)`. Kun `state.level` skiftes
  — motoren er den samme hele vejen, så det der er skjult, er ikke slået fra.
- `js/ui.js` spørger `atLeast()` før hver gruppe bygges, og `setLevel()`
  rydder op i det der forsvinder: visningen falder tilbage til blokke,
  α/β-valget og kontakten nulstilles, og enzymblokkene fjernes fra bordet —
  ellers ville der ligge noget man hverken kunne bruge eller fjerne igen.
  Molekylerne bliver stående: en maltose skal ikke gå tabt, fordi man vil se
  Haworth-formlen.
- Knapperne under molekylet følger med, ellers ville α/β komme ind ad
  bagdøren: `render.js` udelader 👁 (3D) under A og α⇄β under B. ℹ-kortet og
  ✂ (fuld hydrolyse) er med hele vejen — hydrolysen *er* C-stoffet.
- Visningerne mærkes op i modulet, ikke i motoren: `level: 'B'` på
  strukturformlen og `level: 'A'` på molekylformlen, dokumenteret i
  `modules/index.js`. Ét valg er ikke et valg, så hele "Visning"-gruppen er
  væk på C.
- Statuslinjen må ikke pege på knapper der ikke er der. `intro()` i
  `modules/index.js` vælger modulets `introC` på C-niveau — kun
  kulhydraterne har brug for det, fordi deres introtekst nævner α/β og
  enzymblokkene.
- Niveauet huskes ikke mellem to besøg (ingen `localStorage`, som ellers
  heller ikke bruges nogen steder i appen): en lærer der åbner appen på en
  fremmed maskine, skal ikke først finde ud af hvorfor knapperne mangler.

Til rest: opgavelisten er stadig den samme på alle tre niveauer. Punktet om
at skjule opgave 4–6 på C står under Opgavemode og kan nu bygges med
`atLeast()` og et `level`-felt på opgaven.

### Feedback

- [ ] **Statuslinjen ligger forkert.** Handlingen sker midt på bordet,
      beskeden kommer nederst. Fejlbeskeden fra `drag.js`, når `verdict.ok` er
      falsk, forsvinder i praksis: eleven ser `shake` og `nudgeApart` og
      tænker "det virkede ikke" i stedet for "α kan ikke binde dér".
      Preview-teksten i `reactions.js` siger allerede det rigtige, men kun
      mens man trækker — lad afvisningen blive stående ved molekylet et par
      sekunder.
- [ ] **Ingen fortryd.** Man kan klikke bindingens O for at hydrolysere, men
      det er ikke selvopdagende; tooltip'et i `drawBond` er eneste kilde.
      Ctrl+Z, eller en synlig ✕ på den seneste binding.
- [ ] **Forklaringerne bliver ikke læst.** `why`-teksterne er 4–6 linjer.
      Kort dem ned til én sætning med "læs mere" til resten.

### Opgavemode

- [ ] **Opgave 1 kan være løst før man åbner panelet.** Ligger maltosen på
      bordet fra fri leg, giver `taskTick()` et ✔ og en forklaring på noget
      eleven ikke bevidst har gjort. `toggleTasks()` bør rydde bordet på vej
      ind i opgavemode, ligesom `nextTask()` allerede gør.
- [ ] **Lineær låsning uden vej udenom.** Opgave 4–6 (isomerer, β-1,4-kæde,
      forgrening) er mærkbart sværere end 1–2. Den der går i stå på 4, når
      aldrig til 7–8, som er de mest konkrete og biologisk vedkommende
      (fordøjelse, laktoseintolerans). Enten en "spring over"-knap eller
      niveauvalget, der skjuler 4–6 på C-niveau — niveauerne findes nu
      (`js/levels.js`), så det er et `level`-felt på opgaven og et filter i
      `tasks.js`.
- [ ] **Pointen om at de tre moduler kører på samme motor** får eleven kun i
      opsamlingen efter alle otte opgaver, og de færreste når dertil. Den
      kunne stå i kondensationsbeskeden hver gang, med samme ordlyd i alle tre
      moduler.

### Sprog og aflevering

- [ ] **Fagordene er uforklarede.** "Anomer", "glykosidbinding", "reducerende
      sukker", "α-1,4", "essentiel aminosyre" står i statuslinjen og på
      faktakortene uden nogen vej til en forklaring. Gør termen klikbar med to
      linjers forklaring.
- [ ] **Intet at aflevere.** PNG-eksport står under punkt 10; en "min log",
      der samler hvad eleven har bygget og svaret, og som kan kopieres ind i
      en rapport, er mere værd — den tvinger eleven til at genkalde sig noget.

### Fejl

- [x] **Hjem-knappen dækker "MODUL"-labelen.** Rettet. Pladsen reserveres som
      et flex-element (`header::before`) og ikke som padding, for padding
      koster på hver eneste række, og bjælken wrapper på en tablet. Under
      900 px bliver hjem-knappen sit ikon alene, og så er 56 px nok — ellers
      ville de 92 px koste en ekstra række netop der hvor pladsen er dyrest.
