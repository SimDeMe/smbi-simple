# Transport gennem cellemembranen — i 2D

Side: `biologi/membran2d.html`. Moduler: denne mappe.
Designskabelon: `design_rules.md` (opdelingen i flere filer, afsnit 0).

Siden er søstersiden til `biologi/membran.html`. Den viser det samme
faglige stof — membranen og transporten igennem den — men fladt i stedet
for i 3D, og med **alle de almindelige transportmekanismer** i den samme
membran i stedet for to. Fordelen ved at give slip på den tredje dimension
er, at der bliver plads til syv veje ved siden af hinanden, og at hver af
dem kan tegnes så tydeligt, at man kan følge ét molekyle hele vejen.

---

## Kontrakten mellem modulerne

```
membran2d.html      CSS, markup — siden selv
  └─ side.js        indgangen: DOM, pladsfordeling, tilstand, adresse
       ├─ model.js       lærred, kamera, render-løkke
       ├─ struktur.js    dobbeltlaget, kolesterolet, tegneprimitiver
       ├─ vand.js        vandrummene, den frie pulje, koncentrationsregnskabet
       ├─ forklaring.js  ruden ved siden af figuren
       ├─ molekyler.js   fagdata om stofferne
       ├─ eksempler.js   ægte transportveje i kroppen
       └─ transport.js   registret
            └─ transport-*.js   én transportvej pr. fil
```

En ny transportvej er **én ny fil plus én importlinje i `side.js`**.
Kontrakten står øverst i `transport.js`.

Ingen build, ingen npm, ingen CDN — heller ikke three.js. Siden er ren
canvas 2D, så den kører også på en gammel bærbar og på skolens projektor.

### Målene

Lærredet er 1660 × 760 enheder, og membranen er 116 enheder tyk. En rigtig
cellemembran er ca. 7,5 nm, så **1 enhed ≈ 0,065 nm**. En kaliumion med
vandkappe fylder derfor ca. 28 enheder — netop den kappe, `molekyler.js`
tegner.

Figuren rækker `UDENFOR` = 300 enheder ud over lærredets kant til hver
side. Det er ikke pynt: kameraet skal kunne zoome ind på den yderste
transportvej og få den i midten af billedet, og så skal der stadig være
membran at se på.

---

## De syv veje

| id | Transportvej | Protein | Slags |
| --- | --- | --- | --- |
| `diffusion` | Simpel diffusion | intet | passiv |
| `osmose` | Osmose gennem aquaporin | AQP | passiv |
| `kanal` | Ionkanal | kaliumkanal | passiv |
| `baerer` | Bærerprotein | GLUT1 | passiv |
| `pumpe` | Na⁺/K⁺-pumpen | Na⁺/K⁺-ATPase | aktiv |
| `symport` | Symport | SGLT1 | sekundær aktiv |
| `vesikel` | Exo- og endocytose | intet | aktiv |

Rækkefølgen i `MEKANISMER` er også rækkefølgen fra venstre mod højre i
membranen, og den går fra det, der ikke koster noget, til det, der koster
mest. Det er med vilje: eleven læser figuren som en trappe.

**Koblingen mellem pumpen og symporten er sidens vigtigste pointe.** De to
moduler deler den samme pulje natrium i `vand.js`, så symporten kører
bogstaveligt talt på den gradient, pumpen holder oppe. Skruer man pumpens
ATP ned, falder gradienten, og symportens drivkraft falder med — det er
sekundær aktiv transport vist som det, den er.

---

## Modellen

To ting holder modellen ærlig:

1. **Strømmene regnes ud fra koncentrationen**, ikke fra hvor mange kugler
   der lige er tegnet. Figuren viser et udsnit — 140 mmol/L kalium er ikke
   140 kugler — og `vand.js` trykker forskellen sammen med en kurve, så
   begge sider kan ses. Havde mekanismerne talt kugler, ville den kurve
   have været en fejl i fysikken.
2. **Instrumenterne tæller det, der faktisk sker.** `strømmåler` i
   `transport.js` tæller krydsninger over et glidende vindue. Tallene i
   `.gauges` er altså målt på figuren, ikke regnet ud ved siden af den.

`fast` er slået til som udgangspunkt: cellen forbruger og tilfører, så
koncentrationerne står stille — det er den levende celle. Slås den fra, er
systemet lukket, og transporten ændrer selv koncentrationerne, indtil
mekanismerne går i stå af sig selv.

### Efterprøvet uden for browseren

En fane i baggrunden får ikke `requestAnimationFrame`, så alt målt udefra
ser frosset ud. Mekanikken rører kun canvas i `tegn`, så den kan køres i
node med `opdater` alene — det er den eneste farbare vej, og derfor tager
mekanismerne modellens ur med i `ctx.t` i stedet for at hente
`performance.now()` selv.

Målt over 400-900 s pr. forsøg:

* **Fast koncentration.** Alle syv veje kører i 60 s: 0 afvigelse på alle
  seks koncentrationer.
* **Simpel diffusion.** Målte krydsninger mod Ficks lov (rate × konc.):
  ilt ind 3,95 mod 4,00 · ilt ud 0,81 mod 0,77 · CO₂ ind 2,53 mod 2,52 ·
  CO₂ ud 5,04 mod 5,04. Nettostrømmen er altså ikke regnet ét sted; den
  falder ud af, at hvert molekyle har samme lille chance.
* **Ionkanal.** K⁺ ud 5,09 mod ventet 4,90 (porten er åben 70 % af tiden),
  K⁺ ind 0,17 mod 0,14. **Ingen natriumion kom nogensinde igennem.**
* **Bærerprotein.** Mætningskurven målt ved 0,5 · 1 · 1,5 · 3 · 6 · 12
  mmol/L: 0,29 · 0,52 · 0,60 · 0,85 · 1,04 · 1,13 mod Michaelis-Menten med
  K_m = 1,5 og V_maks = 1,28: 0,32 · 0,51 · 0,64 · 0,85 · 1,02 · 1,14.
  Kurven er ikke skrevet ind i koden — den følger af, at bindingschancen
  er koncentrationen gange en konstant, og at omgangen tager sin faste tid.
  Med lige meget glukose på begge sider: netto 0,02 molekyler/s.
* **Na⁺/K⁺-pumpen.** Forholdet Na:K er 1,50 i alle forsøg (3 mod 2).
  Uden ATP: 0. Halv ATP: halv fart. Uden natrium inde i cellen: 0. Uden
  kalium udenfor: 0. Farten stiger med natrium inde i cellen efter en
  mætningskurve (0,41 · 0,52 · 0,70 · 0,74 ioner/s ved 4 · 12 · 30 · 60
  mmol/L).
* **Symporten.** Forholdet Na:glukose er 2,00 i alle forsøg. Uden
  natriumgradient: 0. Halv gradient: halv fart. Uden glukose udenfor: 0.
  Med 1 mmol/L ude og 8 inde flytter den stadig glukose **ind** — mod
  gradienten, som den skal.
* **Osmose.** Lukket system, 200-300 s: isotonisk 300/300 → 301/298 og
  rumfang 101 %. Hypertonisk 500/300 → 471/399, rumfang 75 %. Hypotonisk
  150/300 → 178/183, rumfang 164 %. Rent vand udenfor → cellen svulmer til
  loftet på 220 %.
* **Lukket system, alle syv veje, 300 s.** Ingen negative eller ugyldige
  koncentrationer. Ilt og kuldioxid udligner sig. Glukose ender **inde i**
  cellen (0,3 ude mod 6,2 inde), fordi symporten trækker den derind mod
  gradienten — netop pointen med SGLT1.

Testene ligger ikke i repoet; de er kørt som små node-scripts, der bygger
`vand.js` og mekanismerne op uden DOM. Skal en model ændres, skal de køres
igen (`design_rules.md` afsnit 6).

---

## Ting at holde øje med

* **Kameraet klemmes kun lodret.** Vandret må det gerne gå ud over
  lærredets kant — ellers kan den yderste transportvej aldrig komme i
  midten. Til gengæld skal alt, der tegnes, række `UDENFOR` ud over
  kanten. Glemmer man det, bliver der bart papir i kanten.
* **Vesiklen skal have hvert lag sit antal fosfolipider.** Det ydre lag
  ligger på en cirkel, der er meget længere end det indres; tegner man
  lige mange, mødes de indre hoveder i midten, og vesiklen bliver en
  stjerne i stedet for en blære.
* **Ruden må ikke bestemme scenens højde.** Teksten skifter længde ved
  hvert klik, så indholdet ligger `position:absolute` oven på ruden og
  ruller for sig selv. Under 960 px står tingene under hinanden, og der
  slås det fra.
* **Fire instrumenter, fire skydere.** `aflaes` skal returnere præcis fire
  tal, og `.knobs` har fire faste pladser. Ellers hopper panelet i højden,
  når man vælger en anden vej.
* **`strømmåler` skal nulstilles i `byg`.** Uret starter forfra dér, og
  gamle tidspunkter bliver aldrig kastet væk igen — de ligger jo "i
  fremtiden". Det kostede en fejlfinding første gang.
* **`python3 -m http.server` cacher moduler.** Retter man en `.js`-fil og
  genindlæser, kan browseren stadig køre den gamle. Hård genindlæsning
  (⇧⌘R) løser det.
* **Enheder skrives, som de staves** — `mmol/L`, `nm`, `pH` — også inde i
  mono-mærkater med `text-transform:uppercase`. Pak dem i
  `<span class="enhed">`.

---

## Hvad der kunne komme

* **Gæt transportvejen.** Eleven får et molekyle fra `molekyler.js` og
  skal vælge vej; `hvorfor`-feltet er svaret. Feltet er skrevet, men
  bruges ikke af siden endnu.
* **Antiport.** Na⁺/H⁺ eller Na⁺/Ca²⁺ — samme kontrakt som symporten, bare
  modsat vej. Én ny fil.
* **Link begge veje mellem denne side, `biologi/membran.html` (3D) og
  `biologi/osmose.html`,** som viser konsekvensen af aquaporinen for hele
  cellen.
