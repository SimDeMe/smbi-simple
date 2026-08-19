# Cellemembranen i 3D — plan

Side: `biologi/membran.html`. Moduler: denne mappe.
Designskabelon: `design_rules.md` (opdelingen i flere filer er beskrevet i
afsnit 0, som blev skrevet sammen med denne side).

Modellen er væskemosaikmodellen: fosfolipid-dobbeltlaget som bærende struktur,
med kolesterol, proteiner og kulhydratkæder — og transporten gennem membranen
som det pædagogiske omdrejningspunkt.

---

## Kontrakten mellem modulerne

```
membran.html      CSS, markup, importmap
  └─ side.js      indgangen: DOM, knapper, tilstand, adresse
       ├─ model.js       scene, kamera, orbit, størrelse, render-løkke, tværsnit
       ├─ struktur.js    dobbeltlag, kolesterol, proteiner, sukkerkæder
       ├─ forklaring.js  udpegning i figuren og forklaringsruden
       ├─ molekyler.js   fagdata om de stoffer, der skal transporteres
       └─ transport.js   registret
            ├─ transport-diffusion.js
            ├─ transport-kanal.js
            ├─ transport-baerer.js
            └─ transport-pumpe.js
```

`model.js` og `struktur.js` kender ikke hinandens indhold. `struktur.js` ved
ikke, at der findes transport. En ny transportmekanisme er **én ny fil plus én
importlinje i `side.js`** — den registrerer sig selv efter kontrakten øverst i
`transport.js`.

Mål i modellen er i **nanometer**, så 1 enhed = 1 nm: membranen er 4,6 nm fra
hoved til hoved, membranstykket er 20 × 20 nm. Det gør det let at holde nye
dele i rigtig størrelse — en glukose er ca. 0,8 nm, en natriumion med sin
vandkappe ca. 0,7 nm.

---

## Færdigt

* **Trin 0 — filstruktur.** Mappen oprettet, `design_rules.md` afsnit 0
  skrevet, three.js-undtagelsen skrevet ind i afsnit 5.
* **Trin 1 — siden.** `membran.html` med tokens, topbjælke, sidehoved, `.rig`
  med `.rig-head` og `.facts`, bund, projektortilstand, print, reduceret
  bevægelse, iframe-krom. Tilstanden ligger i `location.hash` og kan gives som
  query (`?snit=1`, `?projektor=1`).
* **Trin 2 — `model.js`.** Scene, lys, perspektivkamera med egen orbit-styring
  (træk, hjul, knib, piletaster, `0` nulstiller), `ResizeObserver`,
  render-løkke og tværsnit via en klipflade.
* **Trin 3 — `struktur.js`.** Dobbeltlaget som `InstancedMesh` (ca. 800
  fosfolipider, hoved + to haler), kolesterol, fem proteiner bygget af
  alfahelixer i ring, kulhydratkæder på glykoprotein og glykolipider. Alt
  bevæger sig langsomt: lipiderne vandrer, proteinerne driver og drejer — det
  er pointen i navnet.
* **Trin 4 — udpegning og forklaringsrude.** `forklaring.js`. Klik på en del i
  figuren, eller på en af knapperne i signaturforklaringen, og ruden til højre
  forklarer den. Den valgte del lyser op indefra (hele hovedlaget lyser fx op
  på én gang). Ruden har `aria-live`, og signaturknapperne giver fuld
  betjening med tastatur alene. Teksterne ligger i `struktur.js` — `DELE` for
  lipiddelene, `PROTEINER[].beskrivelse` for proteinerne.
* **Trin 5 — rammen om transporten.** Vælgerrækken `.veje` med de fire
  transportveje, `.gauges` med transporttype, energiforbrug, protein og
  stoffer, og en blød kameraflyvning hen til den valgte vej. De fire
  `transport-*.js` er oprettet med deres fagbeskrivelse og deres kamera­­
  indstilling; `byg`/`opdater`/`aflaes` er stadig tomme.
  Tværsnittet blev samtidig lavet om: det følger nu kameraet og lægger sig
  lige foran det, man har fokus på, så man kan se ind i membranen præcis ved
  det valgte protein — uden at save proteinet over.

---

## Besvaret undervejs

* **Én mekanisme ad gangen.** Vælgerrækken flytter kameraet hen til ét
  protein. Trin 10 lægger koncentrationsskydere oveni, men grundformen er
  én vej ad gangen.
* **Alle fire veje er med.** Diffusion, kanal, bærer og pumpe har hver sin
  fil og sin plads i vælgeren.

---

## Resten af planen

### Trin 6 — `transport-diffusion.js`
O₂, CO₂ og steroidhormon glider tværs gennem lipidlaget uden protein. Vis, at
det går begge veje, men at nettostrømmen følger gradienten.
Aflæsning: netto molekyler pr. sekund, begge koncentrationer.

### Trin 7 — `transport-kanal.js`
Ionkanal, der åbner og lukker. Ioner falder igennem med gradienten, aldrig
imod. Pointe: passiv, hurtig, selektiv — en kaliumkanal lukker ikke natrium
igennem, selv om natrium er mindre.

### Trin 8 — `transport-baerer.js`
Glukosetransportør. Proteinet skifter form: bind → luk → åbn på den anden side
→ slip. Bygges som en tilstandsmaskine, så trinnene kan sættes i stå og
gennemgås ét ad gangen. Kontrasten til kanalen er hele pointen: mætning ved
høj koncentration, fordi der kun er så mange transportører.

### Trin 9 — `transport-pumpe.js`
Na⁺/K⁺-pumpen: 3 Na⁺ ud, 2 K⁺ ind, 1 ATP. ATP-molekylet skal ses forbruges i
pumpens cytosoldomæne (det er allerede bygget i `struktur.js`), og retningen
skal tydeligt være **mod** gradienten. Tæller for forbrugt ATP i `.gauges`.

### Trin 10 — koncentration på de to sider
Skydere i `.knobs` for koncentrationen uden for og inde i cellen. Antallet af
tegnede partikler følger koncentrationen, og nettostrømmen søger mod
ligevægt — undtagen ved pumpen, som holder forskellen ved lige.

### Trin 11 — aquaporiner
Vandkanal, og et link over til `biologi/osmose.html`, hvor konsekvensen for
hele cellen kan ses. Osmosesiden er 2D og har ikke aquaporiner — overvej et
link den anden vej også.

### Trin 12 — gæt transporttypen
Eleven får et molekyle fra `molekyler.js` og skal vælge vej. Svaret begrundes
med `hvorfor`-feltet. Kun hvis trin 6-9 står stabilt — det er en ekstra, ikke
en forudsætning.

### Trin 13 — endo- og exocytose
Vesikel, der knopskyder ind eller ud. Kræver, at dobbeltlaget kan bules ud, og
er derfor den teknisk tungeste del. Tages til sidst, og kun hvis den skal med.

### Trin 14 — færdiggørelse
Gennemgang af tilgængelighed (tastatur alene, skærmlæserstatus, farve aldrig
eneste signal), brydepunkter ved 960/700/620 px, `@media print`, ydelsestjek
på en ældre bærbar, og link ind fra `biologi.html`.

---

## Sådan hænger en mekanisme på

Trin 6-9 udfylder de fire kroge i hver `transport-*.js`:

* `byg(ctx)` — lav partiklerne én gang. Læg dem i **én `InstancedMesh` pr.
  molekyletype**, ikke ét `Mesh` pr. partikel.
* `opdater(t, dt, ctx)` — flyt dem ét billede frem.
* `aflaes(ctx)` — returnér `{mærkat: værdi}`. `side.js` viser i dag fire faste
  instrumenter fra mekanismens metadata; når `aflaes` giver noget andet end
  `null`, skal `visInstrumenter` udvide rækken med de tal (fx netto pr.
  sekund, forbrugt ATP).
* `ryd(ctx)` — fjern det hele igen, når vejen fravælges.

Kameraet står allerede rigtigt: `kamera:{el, dist, y}` i hver fil bestemmer
udsnittet, og der er med vilje luft over og under membranen, fordi det er
dér, molekylerne skal bevæge sig.

---

## Ting at holde øje med

* **Ydelse.** Dobbeltlaget opdaterer ca. 2400 instansmatricer pr. billede.
  Kommer der mange partikler til i trin 6-10, så saml dem i én `InstancedMesh`
  pr. molekyletype frem for ét `Mesh` pr. partikel.
* **Browserfaner i baggrunden får ikke `requestAnimationFrame`.** Figuren står
  bomstille, indtil fanen er fremme. Det er normalt — men det gør automatisk
  afprøvning af animationer upålidelig, hvis fanen ikke er i forgrunden.
* **`python3 -m http.server` cacher moduler.** Retter man en `.js`-fil og
  genindlæser, kan browseren stadig køre den gamle. Hård genindlæsning
  (⇧⌘R) løser det.
* **Hash alene genindlæser ikke siden.** Skal en delt adresse som
  `#vej=pumpe` afprøves, så åbn den i en ny fane eller genindlæs — at ændre
  hash'en på en side, der allerede er åben, kører ikke `læsTilstand` igen.
* **Enheder.** `mmol/L`, `nm`, `pH` skal skrives, som de staves, også inde i
  mono-mærkater med `text-transform:uppercase` — pak dem i `<span class="enhed">`.
* **Hold siden let.** Ingen forklarende tekstblokke under panelet, og ingen
  statuspille der gentager, hvad `.gauges` allerede viser
  (`design_rules.md` afsnit 4).
* **Rammen skal stå stille.** Får siden trin eller tilstande med forskellig
  tekstmængde, skal panelet låses til den højeste tilstand, så figuren ikke
  hopper ved klik.
