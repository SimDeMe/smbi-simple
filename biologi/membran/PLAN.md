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
  fosfolipider, hoved + to haler), kolesterol, fem proteiner og kulhydratkæder
  på glykoprotein og glykolipider. Alt bevæger sig langsomt: lipiderne vandrer,
  proteinerne driver og drejer — det er pointen i navnet.
  Fire af proteinerne er alfahelixer stillet op i en ring (`helixbundt`).
  **Na⁺/K⁺-pumpen** er bygget for sig efter ATPasens egen form: et skævt
  pakket bundt af 10 transmembranhelixer, de tre cytosoldomæner N, P og A som
  bløde klumper (`klump`), og en β-underenhed med helix, kugle og sukkerkæde
  på ydersiden. `objekt.userData.atpSted` peger på N-domænet, så trin 9 kan
  hænge et ATP op dér.
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

* **Trin 7 — `transport-kanal.js`.** Kaliumkanal, der åbner og lukker af sig
  selv (ca. 70 % af tiden åben) ved at trække kanalproteinets stave ind mod
  midten som en blænder — `userData.grundvinkel` fra `struktur.js` er hagen,
  det hænger på. Ionen, der er tættest på mundingen, er den, der finder vejen
  ind; strømmen den ene vej er koncentrationen dér gange en fast rate, så
  nettostrømmen følger gradienten og standser af sig selv. Både K⁺ og Na⁺
  tegnes med vandkappe: natrium har den mindste kerne og den *største* kappe,
  og bliver derfor vist bort ved filteret — selektiviteten kan ses, ikke bare
  læses. Aflæsning: K⁺ ude, K⁺ inde og netto.

  **Kalium fik sin egen gradient** i stedet for at dele iltskyderne, som
  ellers skitseret herunder. 4 og 140 mmol/L kan ikke presses ned i skydernes
  0-0,30, og delt gradient ville sende kalium *ind* i cellen, så snart der er
  mest ilt udenfor — stik imod virkeligheden og imod pumpen i trin 9.
  `konc` ligger derfor i modulet selv, og trin 10 løfter den op i `tilstand`.
  Knappen **Fast koncentration** gælder også kaliummet.

  Efterprøvet uden for browseren: med fast koncentration står 4/140 helt
  stille over 60 s; i lukket system udlignes de til 71/73 på 60 s med summen
  bevaret, og nettostrømmen falder til 0,1. Den virkelige strøm er målt til
  5,93 ud og 0,17 ind pr. sekund over 600 s mod de 5,92 og 0,17,
  instrumenterne viser. Ingen ion kom nogensinde ind i lipidlaget uden om
  poren, og ingen natriumion kom ind i poren.

---

## Resten af planen

Bæreren (trin 8) er det næste, og så aktiv transport (trin 9). Filerne
`transport-baerer.js` og `transport-pumpe.js` findes med deres fagbeskrivelse,
men er endnu ikke importeret i `side.js`.

### Trin 8 — `transport-baerer.js`
Glukosetransportør. Proteinet skifter form: bind → luk → åbn på den anden side
→ slip. Bygges som en tilstandsmaskine, så trinnene kan sættes i stå og
gennemgås ét ad gangen. Kontrasten til kanalen er hele pointen: mætning ved
høj koncentration, fordi der kun er så mange transportører.

### Trin 9 — `transport-pumpe.js`
Na⁺/K⁺-pumpen: 3 Na⁺ ud, 2 K⁺ ind, 1 ATP. ATP-molekylet skal ses forbruges i
N-domænet (formen er allerede bygget i `struktur.js`, og
`findProtein('pumpe').objekt.userData.atpSted` er stedet), og retningen skal
tydeligt være **mod** gradienten. Tæller for forbrugt ATP i `.gauges`.
Natriumionerne tegnes i dag af kanalen, som noget der bliver vist bort — når
pumpen skal flytte dem, skal de to moduler enten dele puljen eller vente på
trin 10.

### Trin 10 — én gradient pr. stof
Skyderne i `.knobs` gælder ilt alene, og kanalen har sin egen `konc` inde i
`transport-kanal.js`. Hvert stof skal have sin egen gradient ét fælles sted —
glukose og ioner udligner sig ikke i takt med ilten. Overvej, om `tilstand`
skal være `{o2:{ude,inde}, k:…, glukose:…}` frem for ét par tal, og hvordan
`.knobs` så holder sig kort nok til at kunne overskues (måske kun skydere for
det stof, der er valgt i forklaringsruden). Pumpen er den, der bryder
mønsteret: den holder forskellen ved lige i stedet for at udligne den — og
det er præcis det, kanalens **Fast koncentration** i dag gør i hånden.

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

* **Ydelse.** Dobbeltlaget opdaterer ca. 2400 instansmatricer pr. billede,
  ilten ca. 220 mere og ionerne ca. 130. Kommer der flere stoffer til i trin
  8-10, så hold fast i én `InstancedMesh` pr. molekyletype frem for ét `Mesh`
  pr. partikel.
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
