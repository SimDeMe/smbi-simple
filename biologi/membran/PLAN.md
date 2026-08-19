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
* **`molekyler.js`** er skrevet med ti stoffer, men bruges endnu ikke af
  siden. Den tages i brug i trin 4.

---

## Uafklaret — skal besvares før trin 5

1. **Hvilke transportveje skal med i første udgave?** Alle fire (diffusion,
   kanal, bærer, pumpe), eller færre til at begynde med? - Vi starter med kun diffusion - passiv og faciliteret
2. **Én mekanisme ad gangen eller alle på én gang?** Knapper i `.rig-head`,
   der zoomer kameraet hen til det valgte protein og kun animerer det — eller
   én levende membran, hvor alt kører samtidig og eleven skruer på
   koncentrationen. Det afgør, om trin 5 bygger en vælger eller en
   gradientmodel. - Det skal være en levende membran hvor alt kører samtidig. 

Trin 4 er uafhængigt af begge og kan bygges først.

---

## Resten af planen

### Trin 4 — klik på en del, få den forklaret
Raycast mod proteinernes grupper og mod de to `InstancedMesh`-lag (brug
`instanceId` til at skelne hoved fra hale). Valgt del vises i en rude til
højre for figuren (`.stage` bliver to spalter ved ≥ 960 px, én under).
Teksterne ligger allerede i `PROTEINER[].beskrivelse` i `struktur.js`.
Tastaturadgang: Tab mellem delene, ikke kun klik. `aria-live` på ruden.

### Trin 5 — rammen om transporten
Vælgerknapper i `.rig-head`, `.gauges`-rækken tilføjes, kameraet flyttes blødt
hen til det valgte protein, `location.hash` får `vej=…`. `transport.js` bruges
som registret. Ingen mekanik endnu — kun stilladset, så trin 6-9 kan hænges på.

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

## Ting at holde øje med

* **Ydelse.** Dobbeltlaget opdaterer ca. 2400 instansmatricer pr. billede.
  Kommer der mange partikler til i trin 6-10, så saml dem i én `InstancedMesh`
  pr. molekyletype frem for ét `Mesh` pr. partikel.
* **Enheder.** `mmol/L`, `nm`, `pH` skal skrives, som de staves, også inde i
  mono-mærkater med `text-transform:uppercase` — pak dem i `<span class="enhed">`.
* **Hold siden let.** Ingen forklarende tekstblokke under panelet, og ingen
  statuspille der gentager, hvad `.gauges` allerede viser
  (`design_rules.md` afsnit 4).
* **Rammen skal stå stille.** Får siden trin eller tilstande med forskellig
  tekstmængde, skal panelet låses til den højeste tilstand, så figuren ikke
  hopper ved klik.
