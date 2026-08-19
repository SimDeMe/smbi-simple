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
            └─ transport-*.js   én mekanisme pr. fil
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
  forklarer den. Den valgte del lyser op indefra. Teksterne ligger i
  `struktur.js` — `DELE` for lipiddelene, `PROTEINER[].beskrivelse` for
  proteinerne — og i `molekyler.js` for de stoffer, der er på vej igennem:
  et delId på formen `stof:o2` slår op dér og viser `hvorfor`-sætningen.
  Ruden har `aria-live`, og signaturknapperne giver fuld betjening med
  tastatur alene.
* **Trin 5 — den levende membran.** Ingen vælger: alle registrerede
  mekanismer kører samtidig, og eleven skruer i stedet på gradienten.
  `.knobs` fik to skydere for iltkoncentrationen uden for og inde i cellen
  (mmol/L, 0-0,30 — vand mættet med atmosfærisk luft har ca. 0,26).
  `.gauges` bygges nu af det, mekanismerne selv aflæser, så en ny
  transportvej tager sine egne tal med ind på siden. Knappen **Fast
  koncentration** afgør, om cellen holder forskellen ved lige, eller om
  systemet er lukket og diffusionen får lov at udligne den.
  `location.hash` fik `ude`, `inde` og `fast`.
* **Trin 6 — `transport-diffusion.js`.** Ilt tværs gennem lipidlaget, uden
  protein. Hvert molekyle vandrer tilfældigt rundt og har samme lille chance
  for at krydse, når det er tæt på membranen — så følger nettostrømmen
  gradienten helt af sig selv, uden at der er regnet på den ét sted.
  Krydsninger uden om proteinerne, så det bliver ved at være *simpel*
  diffusion. Aflæsning: ind, ud og netto i molekyler pr. sekund.

  Efterprøvet uden for browseren (jf. afsnittet om modellen i
  `design_rules.md`): med fast koncentration står gradienten helt stille over
  60 s; i lukket system udlignes 0,30/0,00 til ligevægt på ca. 20 s og bliver
  dér. Den virkelige krydsningsrate er målt til 0,109 pr. molekyle pr. sekund
  over 600 s mod de 0,110, instrumenterne regner med — altså viser tallene
  det, molekylerne faktisk gør.

---

## Resten af planen

Faciliteret diffusion er det næste: kanal (trin 7) og bærer (trin 8) bruger
samme gradient og samme `.knobs` som den simple diffusion, men hver sit stof.
Aktiv transport (trin 9) kommer efter. Filerne `transport-kanal.js`,
`transport-baerer.js` og `transport-pumpe.js` findes med deres fagbeskrivelse,
men er endnu ikke importeret i `side.js`.

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

### Trin 10 — én gradient pr. stof
Skyderne i `.knobs` gælder i dag ilt alene. Når kanalen og bæreren kommer til,
skal hvert stof have sin egen gradient — glukose og ioner udligner sig ikke i
takt med ilten. Overvej, om `tilstand` skal være `{o2:{ude,inde}, glukose:…}`
frem for ét par tal, og hvordan `.knobs` så holder sig kort nok til at kunne
overskues. Pumpen er den, der bryder mønsteret: den holder forskellen ved
lige i stedet for at udligne den.

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

## Ting at holde øje med

* **Ydelse.** Dobbeltlaget opdaterer ca. 2400 instansmatricer pr. billede, og
  ilten ca. 220 mere. Kommer der flere stoffer til i trin 7-10, så hold fast
  i én `InstancedMesh` pr. molekyletype frem for ét `Mesh` pr. partikel.
* **Modellen kan afprøves uden browser.** `transport-*.js` rører kun three.js
  til at tegne med, så mekanikken kan køres i node med en håndfuld stumper
  (`Matrix4`, `InstancedMesh`, `Group`, …) og en `ctx` med en attrap-membran.
  Sådan blev trin 6 efterprøvet. Det er også den eneste farbare vej: en
  **browserfane i baggrunden får ikke `requestAnimationFrame`**, så figuren
  står bomstille, og alt hvad der måles udefra, ser frosset ud.
* **`python3 -m http.server` cacher moduler.** Retter man en `.js`-fil og
  genindlæser, kan browseren stadig køre den gamle. Hård genindlæsning
  (⇧⌘R) løser det — en almindelig `location.reload()` gør det ikke.
* **Enheder.** `mmol/L`, `nm`, `pH` skal skrives, som de staves, også inde i
  mono-mærkater med `text-transform:uppercase` — pak dem i `<span class="enhed">`.
* **Hold siden let.** Ingen forklarende tekstblokke under panelet, og ingen
  statuspille der gentager, hvad `.gauges` allerede viser
  (`design_rules.md` afsnit 4).
* **Rammen skal stå stille.** Får siden trin eller tilstande med forskellig
  tekstmængde, skal panelet låses til den højeste tilstand, så figuren ikke
  hopper ved klik.
