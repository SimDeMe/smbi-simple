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

* **Trin 8 — `transport-baerer.js`.** Glukosetransportøren. Der er kun ét
  transportprotein i figuren, og det holder kun på ét molekyle ad gangen —
  det giver mætningen helt af sig selv, uden at noget tal hedder "mætning"
  nogen steder. Modellen er Michaelis-Menten: mens proteinet er ledigt,
  vokser chancen for at binde næste molekyle med `K_ON·(Cude+Cinde)`; lagt
  sammen med den faste omløbstid `T_CYKLUS` giver det en gennemløbsrate, der
  flader ud mod `Vmax = 1/T_CYKLUS`, og strømmen den ene vej bliver
  `Vmax·C/(Km+Cude+Cinde)` med `Km = 1/(K_ON·T_CYKLUS)`. Selve turen er en
  tilstandsmaskine på fire faser (bind → luk → åbn på den anden side → slip),
  visualiseret som proteinets ring, der trækker sig sammen midt i turen —
  samme greb som kanalens låg, genbrugt til noget andet.

  Efterprøvet uden for browseren: strømmen stiger næsten proportionalt med
  koncentrationen ved lave værdier og flader tydeligt ud ved høje — testet
  fra 1 til 100 mmol/L glukose udenfor, hvor nettostrømmen vokser langt
  langsommere fra 30 til 100 end fra 1 til 10. Et lukket system med 145/12
  (satte til at bruge glukosens skala) udligner sig uden at gå i stå eller
  eksplodere.

* **Trin 9 — `transport-pumpe.js`.** Na⁺/K⁺-pumpen. Fire faser — Na⁺ ud,
  formskift, K⁺ ind, formskift tilbage — hvor selve *farten* gennem faserne
  er sat ned af en mætningsfaktor, `(na_inde/(Km_na+na_inde))·(k_ude/(Km_k+k_ude))`,
  så animationen og `aflaes()` altid regner på nøjagtig samme tal. Et lille
  gult ATP vokser frem ved N-domænet (`atpSted`, som planlagt) og forsvinder
  i det øjeblik, det spaltes. Pumpen kører **uafhængigt af "Fast
  koncentration"** — den knap gælder nu kun ilt, glukose og vand (se trin
  10); kalium- og natriumgradienten holdes udelukkende oppe af balancen
  mellem pumpen og kanalens lækage.

  To ting, der ikke stod i planen, men som viste sig nødvendige undervejs:
  1. **Massebevarelse.** Både her og i kanalen stod der `Math.max(0, x - Δ)`
     på afsenderposten, men det fulde `Δ` blev lagt til modtagerposten
     uanset — så snart en side var tættere på 0 end `Δ`, opstod stof ud af
     ingenting. Rettet til kun at flytte det, der rent faktisk er der.
  2. **Natrium har ingen anden vej ind.** Kanalen er kaliumselektiv og viser
     natrium bort, med vilje — men det betyder, at pumpen er den eneste ting,
     der rører `stof.na`, og uden modstand ville den simpelthen tømme cellen
     for natrium på under et minut og selv gå i stå (mættet transport, der
     stopper, fordi der intet er tilbage at pumpe). Løsningen er en lille,
     usynlig lækage tilbage (`NA_SIVNING`, proportional med forskellen) —
     den repræsenterer de andre natriumveje, en rigtig celle har (bl.a.
     transportproteinerne, der bærer aminosyrer og glukose ind sammen med
     natrium), uden at de er bygget som egne mekanismer her.

  Efterprøvet uden for browseren over 600 s med alle fem mekanismer kørende
  samtidig: K⁺+Na⁺-summen er bevaret på hver side af membranen til mindste
  decimal gennem hele forløbet (ingen stof opstår eller forsvinder), og
  begge gradienter finder et stabilt, ikke-degenereret leje inden for det
  første minut og bliver der — kalium omkring 54/90 (mod start 4/140),
  natrium omkring 134/23 (mod start 145/12). Tallene er ikke identiske med
  udgangspunktet — pumpen og kanalens rater er ikke tunet til at ramme
  præcis de fysiologiske værdier — men retningen er rigtig, ingen side går i
  0, og pumpen bliver ved med at dreje.

* **Trin 10 — én gradient pr. stof.** `tilstand.stof` er nu
  `{o2, k, na, glukose, h2o}`, hver med `{ude, inde, min, maks, trin,
  decimaler, enhed, navn}` — de sidste seks felter styrer kun `.knobs` og
  røres ikke af transportmodulerne. `.knobs` viser de to skydere for **det
  stof, der sidst er valgt** i figuren eller i signaturforklaringen (falder
  tilbage til ilt ved indlæsning); de samme to `<input>`-elementer
  genbruges og omprogrammeres (label, enhed, skala, værdi), så DOM'en ikke
  skal bygges om for hvert skift. `location.hash` gemmer alle fem stoffers
  `ude`/`inde` (`o2-ude=26&k-ude=400&…`), så et delt link stadig rammer
  præcis den tilstand, tavlen stod i. **Fast koncentration** gælder nu kun
  ilt, glukose og vand — kalium og natrium styres som beskrevet i trin 9
  udelukkende af balancen mellem kanal og pumpe, præcis som planlagt.

* **Trin 11 — `transport-aquaporin.js`.** En sjette protein-plads
  (`struktur.js`, `slags:'aquaporin'`, egen farve) og en vandkanal, bygget
  efter samme opskrift som kaliumkanalen: en akkumulator gør, at chancen for
  at krydse pr. sekund er antallet på siden gange en fast rate, og det
  molekyle, der er nærmest poren, er det, der krydser — ikke et tilfældigt
  et, der skal vandre ind i en lille fangzone på egen hånd (det ville i
  praksis næsten aldrig ske). Ingen låge: en aquaporin står altid åben.
  Vandets "koncentration" er bevidst en forenkling — se kommentaren øverst i
  filen — en relativ vandandel i %, ikke mmol/L, fordi den rigtige
  drivkraft bag osmose er opløst stof, ikke vandkoncentrationen selv.
  `stof:h2o`-fanen linker ikke selv til `osmose.html`, men beskrivelsen gør
  opmærksom på den; et egentligt link kan tilføjes, når/hvis der bliver tid
  til trin 14's finpudsning.

  Efterprøvet uden for browseren: samme akkumulator-mønster som kanalen, så
  `aflaes()` og den faktiske krydsningsrate er identiske ved konstruktion —
  ikke noget, der kan glide fra hinanden, sådan som den første udgave (en
  tilfældig chance for at krydse inden for en lille radius om poren) kunne
  have gjort. Rettet, før tallene nogensinde blev sammenlignet.

---

## Resten af planen

Trin 8-11 er bygget og efterprøvet; alle fem transportmekanismer kører
samtidig, og eleven skruer på hvert stofs egen gradient. Resten er
udtrykkeligt ekstra i den oprindelige plan — ingen af dem er en
forudsætning for, at siden er færdig.

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
på en ældre bærbar.

**Gjort som en del af trin 8-11:** siden er linket ind fra `biologi.html`
(nyt kort i "Celle & enzymer"), `aria-label` på figuren og signaturforklaringens
farver er udvidet med de tre nye mekanismer, og `.knobs`/`.gauges` er
efterprøvet i en rigtig browser (Chromium, med en midlertidigt lokalt
serveret three.js — CDN'et er blokeret i dette miljø, men koden selv rører
ikke ved det, og importmappet peger stadig på jsdelivr) uden konsolfejl,
med panelets højde uændret gennem alle klik. Tastatur- og skærmlæser-stien
(signaturknapperne har fuld `aria-pressed`/fokus-styring) er ikke ændret af
trin 8-11 og er derfor ikke gentestet her.

**Mangler stadig:** et decideret tastatur-only gennemløb med skærmlæser,
et ydelsestjek på en ældre bærbar med alle fem mekanismer kørende samtidig
(instansantallet er vokset, se "Ting at holde øje med" herunder), og et
kig på brydepunkterne 960/700/620 px nu hvor `.gauges` kan blive op til 15
felter og `.facts` 15 knapper.

---

## Ting at holde øje med

* **Ydelse.** Dobbeltlaget opdaterer ca. 2400 instansmatricer pr. billede.
  Med alle fem transportmekanismer lagt til (trin 6-11) kommer der ca. 750
  mere: ilten ca. 220, kalium- og natriumionerne (kanal + pumpe tilsammen)
  ca. 270, glukose ca. 104, vand ca. 170. Alle bruger stadig én
  `InstancedMesh` pr. molekyletype, ikke ét `Mesh` pr. partikel — hold fast i
  det, kommer der flere stoffer til.
* **Massebevarelse er ikke gratis.** `Math.max(0, x - Δ)` på afsenderposten
  uden en tilsvarende grænse på modtagerposten fabrikerer stof ud af
  ingenting, så snart afsenderen er tættere på 0 end `Δ` — ramt både i
  kanalen og i pumpen under trin 9's efterprøvning (se dér). Flyt altid
  `Math.min(Δ, tilgængeligt)`, aldrig `Δ` og en uafhængig clamp hver for sig.
* **En pumpe uden modspil tømmer sig selv.** Aktiv transport, der flytter et
  stof i kun én retning uden nogen passiv vej tilbage, kører ikke i
  ligevægt — den kører, til kilden er tom, og går så i stå. Kalium har
  kanalens lækage som modspil; natrium fik en lille, usynlig lækage i
  `transport-pumpe.js` af samme grund (se trin 9). Kommer der flere
  aktive mekanismer til, skal de have samme slags modspil, eller også skal
  det tydeligt fremgå, at de *forventes* at løbe tør.
* **`tilfoejDel` lægger til, overskriver ikke.** To mekanismer kan sende
  samme slags molekyle igennem — kanalen og pumpen deler både `stof:na` og
  `stof:k`. `struktur.js` samler derfor materialelisten pr. delId i stedet
  for at erstatte den; ellers ville kun den sidst indlæste mekanismes
  molekyler lyse op, når man klikker på fx "Natrium" i signaturforklaringen.
* **Modellen kan afprøves uden browser.** `transport-*.js` rører kun three.js
  til at tegne med, så mekanikken kan køres i node med en håndfuld stumper
  (`Matrix4`, `InstancedMesh`, `Group`, …) og en `ctx` med en rigtig
  `byggMembran(scene)` — three.js's egne klasser kræver ikke WebGL, kun
  `globalThis.window = {matchMedia: () => ({matches:false})}`, fordi
  `struktur.js` importerer `ROLIG` fra `model.js`. Sådan blev trin 6-11
  efterprøvet, sidst ved at køre alle fem mekanismer sammen i 900 simulerede
  sekunder og sammenligne den stokastiske simulering med de analytiske
  formler i hver `aflaes()`. Det er også den eneste farbare vej: en
  **browserfane i baggrunden får ikke `requestAnimationFrame`**, så figuren
  står bomstille, og alt hvad der måles udefra, ser frosset ud.
* **CDN'et til three.js kan være blokeret i det miljø, du sidder i.**
  `cdn.jsdelivr.net` svarer med det samme på smbi.dk, men nogle udviklings-
  eller CI-miljøer tillader kun en fast liste af værter. Skal figuren ses i
  sådan et miljø, kan importmappet midlertidigt pege på en lokal kopi af
  `three.module.js` (fra npm-pakken `three@0.169.0`, som svarer til CDN-
  filen) — men det skal altid rettes tilbage til CDN'et før arbejdet
  afsluttes; det er den aftalte undtagelse i `design_rules.md`, ikke en
  lokal fil.
* **`python3 -m http.server` cacher moduler.** Retter man en `.js`-fil og
  genindlæser, kan browseren stadig køre den gamle. Hård genindlæsning
  (⇧⌘R) løser det — en almindelig `location.reload()` gør det ikke.
* **Enheder.** `mmol/L`, `nm`, `pH` skal skrives, som de staves, også inde i
  mono-mærkater med `text-transform:uppercase` — pak dem i `<span class="enhed">`.
  Vandets gradient er en undtagelse med vilje: den er i % (relativ
  vandandel), ikke mmol/L — se kommentaren øverst i `transport-aquaporin.js`.
* **Hold siden let.** Ingen forklarende tekstblokke under panelet, og ingen
  statuspille der gentager, hvad `.gauges` allerede viser
  (`design_rules.md` afsnit 4).
* **Rammen skal stå stille.** Får siden trin eller tilstande med forskellig
  tekstmængde, skal panelet låses til den højeste tilstand, så figuren ikke
  hopper ved klik. `.knobs` genbruger de samme to `<input>`-elementer til
  alle fem stoffer (trin 10) netop af den grund — programmerer dem om i
  stedet for at bygge nye, så DOM'ens facon aldrig ændrer sig.
