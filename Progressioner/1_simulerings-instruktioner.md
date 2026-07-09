# Instruktioner: Pædagogiske simuleringer af fysiske koncepter i naturgeografi

## Formål

Du skal kode interaktive simuleringer og visualiseringer af basale fysiske koncepter til gymnasieelever på naturgeografi C-niveau. Målgruppen har **ingen forkundskaber** inden for fysik eller naturvidenskab. Mange har ikke haft fysik siden folkeskolen og kan have negative associationer til faget. Simuleringerne skal bygge intuition — ikke teste viden.

---

## Pædagogiske grundprincipper

### 1. Intuition før terminologi
- Vis fænomenet FØRST, navngiv det BAGEFTER. Eleven skal se varm luft stige op, før ordet "konvektion" introduceres.
- Ingen formler som udgangspunkt. Hvis en formel er relevant (fx densitet = masse/volumen), skal den introduceres som en opsummering af noget, eleven allerede har set ske.
- Brug hverdagssprog i første omgang: "luften fylder mere" før "ekspansion", "tungere" før "højere densitet".

### 2. Ét koncept ad gangen
- Hver simulering isolerer ÉN sammenhæng (fx "opvarmning → udvidelse"). Ingen simulering må kræve forståelse af mere end ét nyt koncept.
- Byg gerne progressioner: Simulering A (varm luft udvider sig) → Simulering B (udvidet luft er lettere) → Simulering C (lettere luft stiger = konvektion).
- Fjern alt, der ikke understøtter kernebudskabet. Ingen dekorative elementer, der kan forveksles med fysisk indhold.

### 3. Eleven skal SELV skabe årsag-virkning
- Simuleringen må aldrig bare afspille en animation. Eleven skal dreje på et håndtag og se konsekvensen.
- Primær interaktion: **én slider eller knap** der styrer årsagen (fx temperatur). Effekten (fx volumen, densitet, bevægelse) opdateres øjeblikkeligt og synligt.
- Respons skal være < 100 ms. Forsinkelse ødelægger følelsen af årsagssammenhæng.

### 4. Forudsig-afprøv-forklar (POE: Predict-Observe-Explain)
- Hvor det er muligt: bed eleven forudsige, hvad der sker, FØR de trykker ("Hvad tror du der sker med ballonen, når vi varmer luften op?").
- Vis derefter resultatet, og giv en kort forklaring på 1-2 sætninger i hverdagssprog.
- Forklaringer må aldrig være mere end 2-3 linjer ad gangen. Lange tekstblokke bliver ikke læst.

### 5. Konkret før abstrakt
- Forankr altid i noget eleven kender: en gryde med vand, en cykelpumpe der bliver varm, en varmluftballon, dug på et koldt glas.
- Geografisk kontekst til sidst: Når konceptet sidder fast, vis hvor det optræder i naturen (skydannelse, vind, havstrømme, kappekonvektion).

### 6. Misforståelser skal adresseres aktivt
Typiske misforståelser, som simuleringerne skal modvirke — ikke forstærke:
- "Varme stiger op" → Nej: **varm luft/vand** stiger op, fordi det er mindre tæt. Varme som energi stråler i alle retninger.
- "Kulde trænger ind" → Kulde er fravær af varmeenergi; varme bevæger sig fra varmt mod koldt.
- "Molekyler bliver større, når de opvarmes" → Nej: de bevæger sig hurtigere og fylder mere som samlet stof.
- "Tunge ting falder hurtigere" → Ikke relevant for de fleste simuleringer, men undgå visualiseringer der antyder det.
- "Corioliskraften skubber" → Det er en afbøjning set fra jordoverfladen, ikke et skub.

---

## Visuelle retningslinjer

### Farvekonventioner (konsekvente på tværs af ALLE simuleringer)
- **Varmt**: rød/orange. **Koldt**: blå. Aldrig omvendt, aldrig andre farver til temperatur.
- **Højt tryk / høj densitet**: mørkere/tættere visuelt. **Lavt tryk / lav densitet**: lysere/mere spredt.
- **Energi/stråling**: gul/orange bølger eller pile (kortbølget), mørkerøde bølger (langbølget).
- **Bevægelsesretning**: pile. Pilens tykkelse eller længde = hastighed/styrke.

### Partikelvisualisering
- Vis stof som partikler (prikker), når tilstandsformer, densitet eller tryk skal forklares. Partikler gør det usynlige synligt.
- Fast stof: partikler i gitter, der vibrerer let. Flydende: partikler tæt, men glider. Gas: partikler spredt, hurtige.
- Temperatur = partikelhastighed. Højere temperatur → synligt hurtigere partikler. Dette er den vigtigste enkeltvisualisering i hele materialet.
- Maks 50-200 partikler. Flere skaber visuel støj uden pædagogisk gevinst.

### Layout
- Simuleringen fylder det meste af skærmen. Kontroller (slider/knapper) nederst eller i siden, altid synlige.
- Aflæsninger (temperatur, densitet osv.) vises som store, tydelige tal MED enhed — men kun de 1-2 værdier, der er relevante for konceptet.
- Mobilvenligt: touch-venlige sliders (min. 44 px), responsivt layout, testes ned til 380 px bredde.
- Dansk sprog i al UI-tekst. Decimalkomma (25,3 °C), ikke decimalpunktum.

---

## Tekniske krav

- **Én selvstændig HTML-fil** pr. simulering: HTML, CSS og JavaScript samlet. Ingen build-steps, ingen eksterne afhængigheder (undtagen evt. font via CDN).
- Vanilla JavaScript. Canvas til partikelsimuleringer, SVG til diagrammer og statiske illustrationer med enkle animationer.
- 60 fps på en gennemsnitlig skole-laptop. Brug `requestAnimationFrame`, undgå layout-thrashing.
- Fysikken skal være **kvalitativt korrekt**, men må gerne være forsimplet kvantitativt. Skalaer og hastigheder må overdrives for tydelighed — men markér det ("ikke i målestok" hvor relevant).
- Ingen localStorage/sessionStorage. Al tilstand i hukommelsen.
- Kommentér koden, så en lærer uden stor kodeerfaring kan justere centrale parametre (starttemperatur, partikelantal, hastigheder) øverst i scriptet i en tydeligt markeret konfigurationsblok.

---

## Struktur for hver simulering

Hver simulering skal indeholde disse elementer i denne rækkefølge:

1. **Titel** i hverdagssprog (fx "Hvorfor stiger varm luft op?" — ikke "Konvektion i atmosfæren")
2. **Hook**: Ét spørgsmål eller hverdagseksempel, der skaber undren (1 sætning)
3. **Interaktivt område**: Selve simuleringen med kontrol(ler)
4. **Live-forklaring**: Kort tekst (maks 2-3 linjer), der opdateres afhængigt af, hvad eleven gør
5. **Fagbegrebet**: Først EFTER interaktion afsløres/fremhæves det faglige ord ("Det du lige har set, kalder man konvektion")
6. **Geografi-koblingen**: Hvor i naturen sker dette? (1-2 eksempler med lille illustration)

---

## Koncepter og konkrete simuleringsidéer

### Energi
| Koncept | Simuleringsidé |
|---|---|
| Energibevarelse | Energi "flytter rundt" mellem sol → jord → luft; en energimængde der aldrig ændres, kun skifter form/sted |
| Kortbølget vs. langbølget stråling | Solstråler (gule) rammer jorden, jorden udsender røde bølger; slider: skru på drivhusgasser og se langbølget stråling blive fanget |
| Albedo | Slider ændrer overflade (is → skov → hav → asfalt) og viser andel reflekteret vs. absorberet stråling |
| Latent varme | Opvarm is → termometer stiger, PAUSER ved 0 °C mens isen smelter (energien "bruges" på faseskiftet), stiger igen |

### Tilstandsformer og faseskift
| Koncept | Simuleringsidé |
|---|---|
| Fast/flydende/gas | Partikler i beholder; temperatur-slider ændrer partikelbevægelse og -organisering gradvist |
| Fordampning/kondensation | Vandpartikler forlader overflade ved opvarmning; rammer koldt "glas" og samler sig til dråber |

### Tryk, temperatur og volumen
| Koncept | Simuleringsidé |
|---|---|
| Opvarmning → udvidelse | Ballon/beholder med partikler; varm op og se partiklerne skubbe væggene ud |
| Ekspansion → afkøling | Luftpakke stiger op i atmosfæren, udvider sig og bliver blå/koldere; ved dugpunkt dannes sky |
| Kompression → opvarmning | Cykelpumpe: tryk stemplet ned, partikler presses sammen og bliver røde/hurtigere |
| Højtryk → lavtryk | To kamre med forskelligt partikeltryk; åbn en ventil og se strømmen — kobl til vind |

### Densitet
| Koncept | Simuleringsidé |
|---|---|
| Densitet = masse/volumen | To lige store kasser med forskelligt antal partikler; hvilken synker i vand? |
| Varmt stiger, koldt synker | Væskebeholder: klik for at opvarme et område i bunden → farvet vandpakke stiger, afkøles, synker (konvektionscelle) |
| Salt + temperatur i havvand | Sliders for temperatur og saltholdighed på en vandpakke; se om den synker eller stiger (→ AMOC-kobling) |

### Varmetransport
| Koncept | Simuleringsidé |
|---|---|
| Konduktion | Metalstang: varm den ene ende, se varmen (farve) brede sig partikel til partikel |
| Konvektion | Se densitet ovenfor — samme simulering, nyt fokus |
| Stråling | Solen varmer jorden gennem tomt rum — ingen partikler imellem, kun bølger |

### Kræfter
| Koncept | Simuleringsidé |
|---|---|
| Corioliskraften | Roterende skive set oppefra: skyd en bold fra centrum og se banen krumme set fra skiven; skift mellem "set fra rummet" og "set fra jorden" |
| Tyngdekraft + friktion | Vanddråbe/sediment på skråning med justerbar hældning og underlag |

### Pladetektonik
| Koncept | Simuleringsidé |
|---|---|
| Kappekonvektion | Tværsnit af Jorden: varme fra kernen driver langsomme konvektionsceller, der trækker plader med sig |
| Densitet: oceanisk vs. kontinental skorpe | To skorpetyper "flyder" i kappen; den tunge oceaniske synker ved kollision (subduktion) |
| Pladegrænser | Vælg grænsetype (divergerende/konvergerende/transform) og se konsekvensen: ny skorpe, bjerge, jordskælv |
| Isostasi | Isklods/skorpeblok flyder i væske; læg vægt på (is, bjerge) og se den synke — fjern vægten og se den hæve sig |

---

## Progression: rækkefølge for koncepterne

Koncepterne skal introduceres i en rækkefølge, hvor hvert trin kun bygger på de foregående. Simuleringer og undervisning skal følge denne progression. Hvert trin angiver: **koncept → simulering → praktisk øvelse**.

### Trin 1: Stof består af partikler i bevægelse (fundamentet)
Alt andet bygger på denne model. Temperatur = partikelbevægelse.
- **Simulering**: Partikler i beholder med temperatur-slider.
- **Praktisk øvelse — Diffusion i vand**: Én dråbe frugtfarve i et glas koldt vand og ét glas varmt vand. Farven spreder sig synligt hurtigere i det varme vand → partiklerne bevæger sig hurtigere. Krav: to glas, frugtfarve, elkedel. Tid: 5 min.

### Trin 2: Tilstandsformer og faseskift
Bygger på trin 1: partiklernes bevægelse og organisering afgør tilstandsformen.
- **Simulering**: Gradvis overgang fast → flydende → gas via temperatur-slider.
- **Praktisk øvelse — Termometer i smeltende is**: Knust is i bægerglas over bunsenbrænder/kogeplade med termometer. Eleverne logger temperatur hvert 30. sekund og plotter kurven: temperaturen står stille ved 0 °C, mens isen smelter → energien går til faseskiftet (latent varme). Tid: 20 min.
- **Hurtig demo — Dug på glas**: Koldt glas fra køleskabet i varmt lokale. Hvor kommer vandet udenpå fra? Kondensation af usynlig vanddamp.

### Trin 3: Opvarmning → udvidelse
Bygger på trin 1: hurtigere partikler skubber mere.
- **Simulering**: Ballon/beholder der udvider sig ved opvarmning.
- **Praktisk øvelse — Ballon på flaske**: Ballon spændt over en tom glasflaske. Flasken sættes i varmt vand → ballonen rejser sig; i isvand → den suges ind. Luften i flasken kan ikke slippe ud, så volumenændringen bliver synlig. Krav: glasflaske, ballon, to baljer. Tid: 10 min.

### Trin 4: Densitet — og at varmt stiger, koldt synker
Bygger på trin 3: samme mængde stof, der fylder mere, er mindre tæt.
- **Simulering**: Konvektionscelle i væske; salt/temperatur-slider på vandpakke.
- **Praktisk øvelse — Varmt og koldt vand i lag**: To små glas: ét med varmt rødt vand, ét med koldt blåt vand. Vend det varme forsigtigt oven på det kolde (med et spillekort imellem, der trækkes væk): skarpe lag. Vend omvendt: total opblanding. Tid: 15 min.
- **Praktisk øvelse — Saltvandslagdeling**: Samme øvelse med saltvand vs. ferskvand ved stuetemperatur → kobling til havets densitetslagdeling og AMOC.
- **Hurtig demo — Æg i saltvand**: Æg synker i ferskvand, flyder i mættet saltvand.

### Trin 5: Konvektion — densitetsforskelle skaber strømme
Bygger direkte på trin 4. Her samles det hele til den vigtigste mekanisme i faget.
- **Simulering**: Konvektionscelle med opvarmning i bunden.
- **Praktisk øvelse — Konvektion i akvarium/gryde**: Stort klart kar med koldt vand. Et fyrfadslys eller kogeplade varmer ét hjørne af bunden; en dråbe frugtfarve ved varmekilden gør strømmen synlig: op, hen, ned. Alternativ: kaliumpermanganat-korn hvis kemilokalet er tilgængeligt. Tid: 20 min.
- **Feltobservation**: Rovfugle/svævefly i termik, flimmer over varm asfalt.

### Trin 6: Tryk — og luft der bevæger sig fra højtryk mod lavtryk
Bygger på trin 1 og 3: flere/hurtigere partikler = højere tryk.
- **Simulering**: To kamre med ventil.
- **Praktisk øvelse — Cykelpumpe**: Hold om pumpecylinderen og pump med lukket ventil/finger for enden: den bliver mærkbart varm → kompression giver opvarmning. Omvendt: spraydåse eller cykelventil, der lukker luft ud, føles kold → ekspansion giver afkøling. Tid: 5 min.
- **Praktisk øvelse — Sammenklemt flaske på bjergtur (eller fryser)**: Lukket plastflaske i fryseren trækker sig sammen; kobling til luftpakker der stiger/synker.

### Trin 7: Adiabatiske processer og skydannelse
Kombinerer trin 2 (faseskift), 3 (udvidelse), 6 (tryk): en stigende luftpakke udvider sig, afkøles, og vanddamp kondenserer.
- **Simulering**: Luftpakke der stiger, afkøles og danner sky; føhneffekt over bjerg.
- **Praktisk øvelse — Sky i flaske**: Klar plastflaske med lidt vand og en tændstik-røgpartikel som kondensationskerner. Klem hårdt og slip: trykfaldet → afkøling → synlig tåge. Klem igen: tågen forsvinder. Dette er hele skydannelsesmekanismen i én flaske. Tid: 10 min.

### Trin 8: Stråling og energibalance
Kan køres delvist parallelt med trin 1-7, men samles her.
- **Simulering**: Albedo-slider, drivhuseffekt, kort-/langbølget stråling.
- **Praktisk øvelse — Albedoforsøg**: To termometre under hhv. sort og hvidt papir (eller i sort/hvid beholder) i sollys eller under kraftig lampe. Log temperatur over 15 min og plot. Krav: termometre/datalogger, lampe. Tid: 30 min.
- **Praktisk øvelse — Drivhus i flaske**: To glas/flasker med termometer, den ene dækket af husholdningsfilm, i sol/lampelys. Diskutér hvad modellen viser — og hvad den IKKE viser (et rigtigt drivhus virker primært ved at stoppe konvektion, ikke stråling — god anledning til modelkritik).

### Trin 9: Corioliskraften
Kræver kun forståelse af, at vind = luft i bevægelse (trin 6).
- **Simulering**: Roterende skive med skift mellem referenceramme "fra rummet" og "fra jorden".
- **Praktisk øvelse — Tegn på roterende plade**: Et stykke rundt karton på en drejeskive (eller lazy susan/kontorstol). Én elev drejer jævnt, en anden trækker en lige streg med tusch fra centrum mod kanten. Stregen bliver buet på pladen, selvom hånden bevægede sig lige. Tid: 10 min.
- **Kobling**: Vejrkort med vindretninger omkring lav- og højtryk.

### Trin 10: Pladetektonik — konvektion i stor skala
Genbruger trin 4-5 (densitet, konvektion) på Jordens indre. Pointen: eleverne kender allerede mekanismen.
- **Simulering**: Kappekonvektion, subduktion, pladegrænser, isostasi.
- **Praktisk øvelse — Konvektion i sirup/honning**: Tyktflydende væske (fx sirup) i varmefast glasskål over svag varme med kakaopulver drysset på overfladen: "pladerne" af kakao bevæger sig med konvektionsstrømmene, samles og skilles. Tid: 20 min.
- **Praktisk øvelse — Isostasi med træklodser**: Træklodser af forskellig tykkelse i vand: tykke klodser stikker dybere ned OG højere op (bjergrødder). Læg mønter på en klods (= iskappe) og se den synke; fjern dem og se den hæve sig (= landhævning efter istiden — direkte kobling til Danmark/Skandinavien).
- **Praktisk øvelse — Chokolade-pladetektonik**: Et lag smeltet, halvstørknet chokolade på varm budding/kakaocreme: skub forsigtigt "pladerne" mod og fra hinanden og se subduktion, "bjergkæder" og spredningszoner.

### Progressionens logik (oversigt)

```
Partikelmodel (1)
   ├── Tilstandsformer & faseskift (2)
   ├── Udvidelse ved opvarmning (3)
   │       └── Densitet (4)
   │               └── Konvektion (5) ──────────┐
   ├── Tryk (6)                                 │
   │       └── Adiabatik & skydannelse (7)      │
   ├── Stråling & energibalance (8)             │
   └── Coriolis (9)                             │
                                                ▼
                          Pladetektonik = konvektion i kappen (10)
```

Simuleringer bør henvise bagud i progressionen ("Kan du huske partiklerne fra...?"), aldrig fremad.

---

## Sprog og tone

- Dansk, du-form, venlig og nysgerrig — aldrig belærende.
- Spørgsmål frem for påstande, hvor det er muligt ("Hvad sker der mon, hvis...?").
- Ingen ironi eller indforståede referencer. Sproget skal fungere for en 16-årig uden faglig selvtillid i naturvidenskab.
- Fagbegreber skrives på dansk med evt. engelsk/international term i parentes første gang: "konvektion", "densitet (massefylde)".

## Kvalitetstjek før aflevering

Inden en simulering er færdig, tjek:
1. Kan en elev uden forkundskaber forstå kernebudskabet på under 2 minutter uden hjælp?
2. Er der præcis ÉT koncept i fokus?
3. Sker der noget synligt inden for 100 ms, hver gang eleven interagerer?
4. Er fysikken kvalitativt korrekt (ingen forstærkning af misforståelser)?
5. Virker den på mobil (380 px) og på en langsom skole-laptop?
6. Er al tekst på dansk, kort og i hverdagssprog?
