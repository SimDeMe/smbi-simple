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
- [x] **Gæt → gør → forklar i opgavemode.** — gjort, se nedenfor.
- [x] **Marker de frie bindingspladser på blokkene.** — gjort, se nedenfor.

### Bindingspladserne er synlige — gjort

Før skulle eleven vide udenad at C1 er højre hjørne og C4 venstre; kun
grenpladsen (C6) havde en synlig knop. Nu har hver fri plads sin egen
markør, og de betyder det samme i alle tre moduler:

- **Orange knop med en lille tap** = fri donorplads. Det er den ende der
  skal trækkes.
- **Blå ring** = fri modtagerplads. Det er dér en anden byggesten kan binde
  sig.

Markørerne står dæmpet, indtil man tager fat i et molekyle. Så lyser alle
pladser op, og det par der ville reagere, bliver grønt eller rødt sammen med
forhåndsvisningen — man kan altså se hvad der er ved at ske, før man slipper.

- `drawSites()` i `render.js` tegner dem ud fra `freeSites()`, som motoren
  havde i forvejen: en optaget plads er ikke i listen og får derfor ingen
  markør. Retningen "udad" regnes ud fra kassens midte, så tappen vender
  rigtigt, også når enheden er spejlet (fruktose) eller vendt (β-kæden).
- Grenpladsens knop fra `drawArms()` bliver selv markøren, når pladsen er
  fri — ellers ville der stå en ring oven i en knop.
- Fremhævningen er to ting: `drag.js` sætter `.linking` på `#svg-space`
  mens der trækkes i et *molekyle* (ikke et enzym — de binder til bindinger,
  ikke til pladser), og `showPreview()` i `reactions.js` sætter `.hot ok|no`
  på netop de to markører der peger på hinanden. `clearPreview()` rydder
  begge dele igen, også når man slipper uden at der sker noget.
- Kun i blokvisningen. Strukturformlen tegner allerede OH og COOH præcis dér
  hvor pladserne er, og en markør oven i den ville skjule det den skal vise.
- Startkortet har fået to linjers forklaring på farverne. Den står i
  `welcome.js` og ikke i modulerne: en knop er en knop, uanset om det er en
  glukose eller en fedtsyre.

### Gæt → gør → forklar — gjort

Før testede opgaverne handling, ikke forståelse: `goal` fortalte præcis hvad
man skulle gøre ("træk den enes C1 hen til den andens C4"), og `check()`
godkendte resultatet. Det kunne følges bogstaveligt uden at forstå noget.

Nu spørger opgaven først. Alle 19 opgaver i de tre moduler har fået et
`predict: { q, options[], correct }` med 2–3 svarmuligheder, og rækkefølgen
er værnet i motoren:

1. **Gæt.** Panelet viser spørgsmålet alene. `goal` står der ikke — kan man
   se hvad man skal gøre, er det ikke længere et gæt.
2. **Gør.** Efter svaret kommer målet frem med "Dit gæt: …" under. Gættet
   bliver ikke bedømt her; det er handlingen der retter, ikke panelet.
3. **Forklar.** Når bordet siger god for opgaven, kommer facit ("✘ Du gættede
   X — det rigtige er Y") lige over `why`. Fejlgættet står altså side om side
   med forklaringen på hvorfor det var forkert.

- `js/tasks.js` holder gættene i `progress[modId].guess` sammen med resten af
  fremgangen — pr. modul, ligesom `done`. `guessPanel()` er trin 1,
  `guessVerdict()` er trin 3.
- `taskTick()` tjekker ikke bordet, før der er gættet (`guessed()`). Uden den
  spærre kunne en opgave blive løst — og forklaringen givet — mens
  spørgsmålet stadig stod og ventede, fx hvis man havde bygget molekylet
  inden. Til gengæld kaldes `taskTick()` i samme øjeblik svaret er givet, så
  et bord der allerede ser rigtigt ud, godkendes med det samme.
- Opsamlingen tæller nu gættene: "Du gættede rigtigt i 3 ud af 8 af de
  spørgsmål du svarede på". Kun de spørgsmål der blev svaret på, tælles med —
  ellers ville tallet straffe den, der løste en opgave uden at have set
  spørgsmålet.
- Feltet er valgfrit og dokumenteret i `modules/index.js`: en opgave uden
  `predict` opfører sig præcis som før.

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

### Feedback — gjort

- [x] **Statuslinjen ligger forkert.** Afvisningen bliver nu hængende ved
      molekylet i knap tre sekunder — `rejectFx()` i `reactions.js` tegner
      den korte grund ("✘ Kræver α-glukose") midt mellem de to pladser, hvor
      forsøget blev gjort. Den lange forklaring står som før i statuslinjen,
      så beskeden findes i to længder: den man læser i farten, og den man
      læser bagefter.
- [x] **Ingen fortryd.** Ctrl+Z (og ⌘Z) hydrolyserer den binding man senest
      har dannet, og den samme binding har fået et synligt ✕ ved siden af sit
      O. Krydset ligger inde i bindingens egen klikflade, så det virker
      gennem den kode der allerede var der.
- [x] **Forklaringerne bliver ikke læst.** Panelet viser nu pointen — første
      sætning — og resten på et klik på "Læs mere ▾".

**Fortryd i detaljer.** `state.bondLog` er de bindinger man selv har dannet,
ældst først, og en binding kendes på sine to enheder og ikke på sit
bond-objekt: det bygges forfra hver gang molekylet tegnes om. `condense()`
lægger til, `hydrolyse()` fjerner, `fullHydrolysis()` rydder molekylets egne,
og `clearTable()` rydder det hele — loggen hørte til det bord der forsvandt.
`undoLast()` går baglæns gennem loggen og springer det over, et enzym har
klippet i mellemtiden.

Hurtigbyg og enzymklip står ikke i loggen: det er ikke bindinger man har
lavet med hånden, og et enzymklip er en pointe i sig selv og ikke en
fortrydelse. Derfor siger den tomme besked heller ikke "ingenting", men
"Ctrl+Z tager de bindinger du selv har dannet".

**Læs mere i detaljer.** `splitWhy()` i `tasks.js` deler ved første
sætningsskel. Teksterne er skrevet med pointen forrest i forvejen, så et
`short`-felt i modulet ville være den samme sætning skrevet to gange — og
dermed to steder at glemme at rette. Er den første sætning under 60 tegn,
kommer den næste med: "Det er cellulose." siger ingenting alene.

### Opgavemode — gjort

- [x] **Opgave 1 kan være løst før man åbner panelet.** `toggleTasks()` rydder
      nu bordet på vej ind i opgavemode, ligesom "Næste opgave" gør det. Lå
      maltosen der fra fri leg, blev opgave 1 ellers kvitteret med et ✔ og en
      forklaring på noget eleven ikke bevidst havde gjort.
- [x] **Lineær låsning uden vej udenom.** Begge dele, for de løser hver sin
      halvdel: en **Spring over →**-knap på enhver uløst opgave (også før man
      har gættet — den der er gået i stå, skal ikke først tvinges til at
      svare), og et `level`-felt på opgaverne, så C-niveau kun viser dem der
      kan løses med C-niveauets knapper.
- [x] **Pointen om den fælles motor** står nu i hver eneste
      kondensationsbesked: "… der fraspaltes ét molekyle vand. Samme reaktion
      i kulhydrater, proteiner og fedt." Beskeden bygges i `reactions.js`, så
      ordlyden er den samme i alle tre moduler af sig selv.

**Niveau og fremgang.** `visible()` i `tasks.js` er opgaverne på det aktuelle
niveau, hver med sin plads i modulets fulde liste. Nummeret eleven ser, er
pladsen i den synlige række, men alt der huskes — løst, gættet, sprunget over
— gemmes på den fulde. Derfor kan man skifte niveau midt i det hele uden at
fremgangen flytter sig: går man fra C til A efter tre løste opgaver, står de
tre stadig med ✔, og de fem nye er nu med.

Hvad der kræver hvad: opgaver med α/β (laktose, cellulose), med enzymer
(fordøjelsen, pepsin, lipasen) eller med en kontakt (laktoseintolerans, pH,
galde) er `level: 'B'`, og isomer-opgaven, der både kræver β og
formelvisningen, er `'A'`. Tilbage på C står tre pr. modul: dan bindingen,
tæl vandet, byg videre på kæden. Det er præcis det, C-niveau skal kunne.

**Spring over.** `pickNext()` roterer videre fra den aktuelle opgave, hele
vejen rundt, og tager usprungne først. Rotationen er det, der gør knappen til
en vej udenom: uden den ville en liste, hvor alt tilbage var sprunget over,
altid pege på den første — altså den man lige stod på. Den man lander på, er
ikke længere sprunget over, så listen er ærlig om hvad der venter.

To ting kom med undervejs, fordi de først blev synlige nu:

- Opsamlingen overhalede den sidste forklaring. Nu holder `justSolved` den
  tilbage, og knappen hedder "Se opsamlingen →" på den sidste opgave — før
  var `why` på den sidste opgave den eneste, der aldrig blev vist.
- Opsamlingen sagde "Alle 8 opgaver er løst" også når niveauet kun viste tre.
  Tallet er væk; det sagde alligevel ikke noget.

### Sprog og aflevering — gjort

- [x] **Fagordene er uforklarede.** Ordene er nu klikbare dér hvor de står,
      med to linjers forklaring i en lille rude ved ordet.
- [x] **Intet at aflevere.** 📋 Min log samler hvad der er sket og hvad
      eleven har svaret, og kan kopieres som ren tekst.

**Ordbogen.** `js/glossary.js` er ordlisten og ruden. Teksterne skrives som
hidtil, og `markTerms()` mærker de ord op, ordbogen kender — statuslinjen
(`setStatus`), faktakortenes rækker og opgavepanelets spørgsmål, mål og
forklaringer. At skrive `<span>` i hånden i halvtreds tekster ville være
halvtreds steder at glemme det.

- Ét ord forklares ét sted. Retter man forklaringen, er den rettet i
  statuslinjen, i faktakortet og i opgaven på én gang.
- Kun første forekomst i hver tekst mærkes op. Fire prikkede "hydrolyse"
  i den samme forklaring ville ligne en fejl.
- Bøjningen tages med: ordbogen holder stammen, og `SUFFIX` er de danske
  endelser, så "glykosidbindingen", "anomere" og "enzymerne" også fanges.
  Uregelmæssige former står i ordets `alt`.
- De fælles ord — kondensation, hydrolyse, monomer, enzym, substrat,
  aktivt sted, specificitet, isomer, sumformel — står i motoren, for de er
  de samme i alle tre moduler. De stofspecifikke står i modulets `terms`
  (α-1,4 og reducerende sukker hos kulhydraterne, essentiel aminosyre og
  primærstruktur hos proteinerne, mættet/umættet og emulgering hos fedtet).
- Svarmulighederne i opgavemode mærkes ikke op: en knap inde i en knap er
  ikke en knap, og et gæt skal besvares, ikke slås op.

**Min log.** `js/log.js` skriver med undervejs, og 📋-knappen åbner ruden.
Det der kommer i loggen, er det der *skete*: molekyler dannet ved
kondensation, bindinger spaltet, enzymer der klippede — og enzymer der
sagde nej og hvorfor. Et nej er lige så meget værd i en rapport som et ja;
det er dér substratspecificiteten viser sig. At lægge en byggesten på
bordet er derimod ikke en hændelse, men en forberedelse.

- **Forklaringen kommer ikke med.** Opgavelinjen har titlen og elevens eget
  gæt, men ikke `why`. En rapport klippet sammen af appens egne ord har
  eleven ikke lært noget af — derfor står der tre spørgsmål nederst, som
  kun eleven kan svare på, og de kommer med i kopien.
- **Det samme skrives kun én gang.** Bygger man maltose fem gange, står der
  én linje. Loggen er hvad der er sket, ikke hvor mange gange man klikkede.
- **"Ryd bordet" rører den ikke.** Bordet er det man arbejder på, loggen er
  det man har lavet. Kun "Ryd loggen" tømmer, og den knap spørger en gang
  til i stedet for at åbne en dialogboks.
- Kopien er ren tekst, så den kan sættes ind i Word, i Docs eller i et
  afleveringsfelt uden at slæbe et layout med sig. Ruden siger selv at
  loggen forsvinder med fanen — der er ingen `localStorage` her heller.
- Fortryd (Ctrl+Z) står i loggen som en hydrolyse, for det er dét den er i
  modellen — det er også det statuslinjen har sagt hele tiden.
- Knappen ligger i den faste gruppe ved 🎯 Opgaver og koster ingen
  bjælkehøjde: 98 px med og uden ved 1024 px, og målt på samme måde 139 px
  ved 768 px. Den er med på alle tre niveauer — en elev på C-niveau
  afleverer også.

### Fejl

- [x] **Hjem-knappen dækker "MODUL"-labelen.** Rettet. Pladsen reserveres som
      et flex-element (`header::before`) og ikke som padding, for padding
      koster på hver eneste række, og bjælken wrapper på en tablet. Under
      900 px bliver hjem-knappen sit ikon alene, og så er 56 px nok — ellers
      ville de 92 px koste en ekstra række netop der hvor pladsen er dyrest.
