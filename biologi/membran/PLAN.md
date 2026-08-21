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

  *Lavet om i trin 10:* `konc` er flyttet op i `tilstand`, natriumionerne
  følger nu også en koncentration i stedet for et fast antal, og ionerne er
  samlet i en cirkel (`REVIR`) omkring kanalen, så pumpen kan tegne sine egne.
  Instrumentet er skåret ned til nettostrømmen alene — koncentrationerne står
  nu på skyderne.

* **Trin 10 — én gradient pr. stof.** Fire stoffer har hver sin gradient i
  `tilstand`: `o2`, `k`, `na` og `glukose`, hver med `{ude, inde}` i mmol/L.
  Tallene, skydernes spænd og trin bor i `molekyler.js` under `gradient`, hvor
  resten af fagdataene er — ikke i koden. Otte skydere kunne ikke overskues,
  så **de to skydere gælder det stof, der er valgt i forklaringsruden**: klik
  på Glukose eller på transportproteinet, og skyderne bliver til glukose. Det
  koster ingen ny knapperække — signaturforklaringen, der allerede var der,
  gør arbejdet. Adressen skriver kun det, der er lavet om, så et delt link
  ikke fylder en hel linje med tal, ingen har rørt.

* **Trin 8 — `transport-baerer.js`.** Glukosetransportør som tilstandsmaskine:
  `VENTER → BIND → VEND → SLIP`. Proteinet står aldrig åbent til begge sider
  på én gang — stavene i bundtet vippes om ringens tangent, så toppen spiler
  sig ud, netop mens bunden knibes sammen. Glukose tegnes som sin ring af seks
  kugler, så den kan skelnes fra iltens håndvægt og ionernes kugle med kappe
  uden at bruge farve på det.

  **Mætningen er regnet, ikke påstået.** Mens proteinet er tomt, venter det på
  et molekyle; ventetiden trækkes som en ægte eksponentialfordeling med en
  rate, der følger koncentrationen, og hver tur tager den samme faste tid
  (`T_TUR` = 1,5 s). Det giver Michaelis-Menten helt af sig selv, med
  K_M = 5 mmol/L som for GLUT1 og et loft på 1/1,5 molekyler pr. sekund.
  Blodsukkeret på ca. 5 mmol/L rammer derfor lige dér, hvor kurven bøjer af.

  Efterprøvet: over 400 s pr. måling passer instrumentet med de ture, der
  faktisk køres, på under 0,05 molekyler/s — ved 2/0, 5,5/1, 10/1, 20/1 og
  8/8. Strømmen stiger med koncentrationen, men mindre og mindre (29 → 57 →
  69 → 81 % optaget). Lige meget på begge sider giver ligevægt, og vendt
  gradient vender strømmen: bæreren er passiv.

* **Trin 9 — `transport-pumpe.js`.** 3 Na⁺ ud, 2 K⁺ ind, 1 ATP, i ni trin
  (`TRIN`-tabellen, 4,70 s pr. omgang). ATP toner frem i kløften ved
  N-domænet, N lukker sig om det, og ved spaltningen **flyver γ-fosfatgruppen
  over på P-domænet** og bliver siddende, indtil pumpen har vendt og skal
  hjem igen. A-domænet drejer med formskiftet, som det gør i virkeligheden.
  `struktur.js` mærker delene med `pumpeStav` og `pumpeDomæne` og lægger
  `atpSted`/`pSted` i `userData` — den ved stadig ikke, at der findes
  transport. ATP-molekylet hænger i pumpens egen gruppe, så det følger med,
  når proteinet driver rundt, og det kan udpeges som `stof:atp`.

  **Natriumlækagen** (`LÆK`) er regnet med: natrium siver hele tiden tilbage
  ind i cellen. Uden den ville pumpen tømme cellen på et kvart minut og gå i
  stå. Med den bliver den hvilende celle det, den er i virkeligheden — en
  **ligevægt, der koster energi**: kanalen lader kalium løbe ud, pumpen henter
  det ind, og tallene bliver stående, mens ATP-tælleren løber.

  Efterprøvet: med fast koncentration står alle fire gradienter helt stille
  over 60 s. I lukket system holder 4/140 og 145/12 i ti minutter (de svinger
  om ca. 6/138 og 144/13). Sat ud af drift ved 70/70 bygger pumpen begge
  gradienter op igen inden for to minutter. Tømmes cellen for natrium, går
  pumpen i stå — og bruger ingen ATP. Ingen koncentration kom under 0 eller
  over skyderens loft, heller ikke fra yderstillingerne over 180 s.

* **Prøven kan køres igen.** Modellen blev prøvet af i node med en attrap-
  three.js (jf. afsnittet nederst) *og* i en rigtig browser med Playwright:
  ingen fejl i konsollen, ingen vandret rulning ved 700, 620 og 380 px, og et
  delt link genskaber alle fire gradienter, det valgte stof, den udpegede del
  og alle fire knapper.

---

## Resten af planen

Trin 8, 9 og 10 er lavet. Tilbage står aquaporinerne (11), de to ekstraer
(12 og 13) og den sidste gennemgang (14).

### Trin 11 — aquaporiner
Linkene mellem de to sider er lavet: `membran.html` og `osmose.html` peger nu
på hinanden i topbjælken. **Selve vandkanalen mangler**, og den er ikke bare
en kanal mere — vand løber ikke efter sin egen koncentration, men efter den
*samlede* mængde opløst stof på hver side. Den regning kan nu laves, for alle
fire stoffer ligger i `tilstand`: læg dem sammen på hver side, og vandet går
mod den side, hvor der er mest. Ved startværdierne er de to sider næsten lige
(155 mod 153 mmol/L) — altså en celle i ligevægt med sine omgivelser, præcis
som den skal være, og skruer man natrium udenfor op, går vandet ud.

Det, der holdt den tilbage: `.gauges` har seks felter i to rækker af tre, og
en syvende ville brække gitteret. Skal aquaporinen med, så find ud af, hvilket
tal der kan undværes — eller giv rækken fire spalter på brede skærme.

### Trin 12 — gæt transporttypen
Eleven får et molekyle fra `molekyler.js` og skal vælge vej. Svaret begrundes
med `hvorfor`-feltet. Bevidst fravalgt indtil videre: siden kører alle
mekanismer samtidig uden vælger (trin 5), og en quiz oven på det ville trække
i den modsatte retning og fylde panelet. Hører nok bedre hjemme i
undervisningsmaterialet ved siden af (`design_rules.md` afsnit 4).

### Trin 13 — endo- og exocytose
Vesikel, der knopskyder ind eller ud. Kræver, at dobbeltlaget kan bules ud, og
er derfor den teknisk tungeste del. Tages til sidst, og kun hvis den skal med.

### Trin 14 — færdiggørelse
Lavet: link ind fra `biologi.html` og over til `osmose.html`, `aria-label` på
lærredet skrevet om, så alle fire transportveje er beskrevet, betjening med
tastatur alene prøvet af, brydepunkterne 960/700/620 px efterset (ingen
vandret rulning ved 700, 620 eller 380 px), og instrumentrækkens blækstreger
rettet til, så de følger gitteret, når der er to rækker.

Mangler: **ydelsestjek på en ældre bærbar.** Figuren opdaterer nu ca. 2400
instansmatricer for dobbeltlaget, ca. 220 for ilten, ca. 140 for kanalens
ioner, ca. 100 for pumpens og 6 × 28 for glukoseringene. Det kører fint på en
ny maskine, men er ikke prøvet på en gammel.

---

## Ting at holde øje med

* **Ydelse.** Dobbeltlaget opdaterer ca. 2400 instansmatricer pr. billede,
  ilten ca. 220, kanalens ioner ca. 140, pumpens ca. 100 og glukoseringene
  6 × 28. Kommer der flere stoffer til, så hold fast i én `InstancedMesh` pr.
  molekyletype frem for ét `Mesh` pr. partikel.
* **Modellen kan afprøves uden browser.** `transport-*.js` rører kun three.js
  til at tegne med, så hele mekanikken kan køres i node med en attrap-three.js
  på ca. 60 linjer (`Vector3`, `Quaternion`, `Matrix4`, `Group`, `Mesh`,
  `InstancedMesh`, `MeshStandardMaterial` og tomme geometrier) plus en
  `window.matchMedia`-stump, fordi `struktur.js` henter `ROLIG` fra
  `model.js`. Så kan `byggMembran` køres, som den er, og `ctx` bliver ægte.
  Sådan blev trin 6, 7, 8, 9 og 10 efterprøvet. Det er også den eneste
  farbare vej: en **browserfane i baggrunden får ikke
  `requestAnimationFrame`**, så figuren står bomstille, og alt hvad der måles
  udefra, ser frosset ud.
* **Sådan måles en strøm ved en fast koncentration.** Kør ét billede i lukket
  system, læs hvad modulerne nåede at flytte, og sæt så *alle* koncentrationer
  tilbage igen. Så kan strømmen måles, uden at gradienten når at ændre sig —
  og uden at fx natriumlækagen når at starte pumpen op midt i en måling af,
  hvad kanalen alene gør. Det er sådan, instrumenternes tal er holdt op mod
  det, der faktisk sker.
* **Ilten sitrer.** Nettostrømmen for ilt regnes ud fra få dusin tegnede
  kugler, så forskellen mellem de to sider svinger omkring nul i stedet for at
  stå på nul. Ved ligevægt kan instrumentet derfor vise 0,4 molekyler/s den
  ene vej et øjeblik. Skal det efterprøves, så mål gennemsnittet over et
  stykke tid, ikke ét øjebliksbillede.
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
