# Specifikation — interaktiv figur: Drivhuseffekten trin for trin

**Til:** udvikler (smbi.dk) · **Fra:** Simon Messell · **Version:** 1.0 (2026-07-27)
**Erstatter:** YouTube-videoen "Sådan virker drivhuseffekten" i NV-modul 4 (droppet 2026-07-27)

---

## 1. Formål og brugssituationer

Én figur, tre måder at bruge den på:

| Situation | Hvem | Hvordan |
|---|---|---|
| **Gennemgang i klassen** | Læreren, på projektor/tavle | Trin-for-trin-forløb med stor skrift og én pointe pr. trin. Læreren styrer med næste/forrige og kan stoppe op og spørge. |
| **Repetition hjemme** | Eleven, på telefon eller bærbar | Samme trin, men eleven klikker selv igennem og kan lege med skyderne. |
| **Opgavetilstand** | Eleven, alene eller i par | Opgaver med facit og feedback, koblet til de samme grafikker. Bruges også som eksamensrepetition før NV-eksamen. |

**Niveau:** naturvidenskabeligt grundforløb (NV) / naturgeografi **C**. Eleverne er 1.g'ere i deres første måneder. De kan aflæse en graf og regne med procenter, men skal **ikke** møde integraler, logaritmer eller Stefan-Boltzmanns lov som formel de selv bruger. Tal må gerne vises; formler skal ligge "under motorhjelmen".

**Sprog:** dansk. Alle tekster i figuren skal kunne læses højt af en 16-årig uden forklaring.

---

## 2. Læringsmål

Efter at have arbejdet med figuren kan eleven:

1. forklare, at Jorden modtager **kortbølget** stråling fra Solen og selv udsender **langbølget** varmestråling.
2. forklare, at drivhusgasser er næsten gennemsigtige for kortbølget stråling, men **absorberer og genudsender** langbølget stråling — også nedad mod jordoverfladen.
3. redegøre for, at Jordens temperatur indstiller sig, hvor **indstråling = udstråling** (strålingsbalance), og at drivhuseffekten hæver overfladetemperaturen fra ca. −18 °C til ca. +15 °C.
4. skelne mellem den **naturlige** drivhuseffekt og den **menneskeskabte forstærkning** af den.
5. forudsige, hvad der sker med temperaturen, når mængden af drivhusgasser eller Jordens albedo ændres — og begrunde det.
6. koble drivhuseffekten til forløbets øvrige moduler: albedo og polar forstærkning (modul 4 og 7), afsmeltning og Golfstrømmen (modul 5), konsekvenser i Danmark (modul 6).

Begreberne skal matche **Begrebsliste 4** i modulet: drivhuseffekt, klimazone, Vahls klimaklassifikation, hydrotermfigur, polar forstærkning, albedo. Figuren dækker drivhuseffekt, albedo og polar forstærkning.

---

## 3. Skærmlayout

Ét skærmbillede, ingen scroll på desktop. Tre zoner: **scene** (grafikken), **forklaring** (tekst til det aktuelle trin), **kontrolpanel** (skydere og navigation).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Drivhuseffekten trin for trin        [Gennemgang] [Udforsk] [Opgaver]    │  ← tilstandsvælger
├───────────────────────────────────────────────┬──────────────────────────┤
│                                               │  TRIN 4 af 8             │
│   ☀                          rummet           │  Drivhusgasserne sender  │
│    ↓ 340        ↑ 100 reflekteret   ↑ 240 ud  │  varme tilbage           │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │                          │
│   ATMOSFÆRE  (CO₂ · H₂O · CH₄)                │  Når en CO₂-molekyle har │
│    ↓ 160         ↑ 390 ↓ 330                  │  optaget varmestråling,  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓ JORDOVERFLADEN ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  sender den den ud igen  │
│                                               │  i alle retninger — også │
│   Temperatur: ●───────────  +15 °C            │  nedad. …                │
│   Balance i toppen:  ind 340 = ud 340  ✓      │                          │
├───────────────────────────────────────────────┤  ? Stop op: Hvorfor …    │
│  CO₂:  [280 ────●──── 1120 ppm]  430 ppm      │                          │
│  Albedo: [0,10 ──●── 0,50]        0,30        │  [◀ Forrige] [Næste ▶]   │
│  Lag i modellen: [0] [1] [2]                  │                          │
└───────────────────────────────────────────────┴──────────────────────────┘
```

**Responsivt:** under 900 px bredde lægges forklaringspanelet under scenen; scenen beholder sit format (SVG med `viewBox`, `preserveAspectRatio`). Skal fungere på iPad og på en telefon i portræt.

**Projektortilstand:** knap (eller `?mode=teach`) der forstørrer al tekst ~140 %, skjuler forklaringspanelets brødtekst til fordel for én kort sætning, og aktiverer piletaster + mellemrum som næste/forrige. Skal kunne læses bagerst i et klasselokale.

---

## 4. De tre tilstande

### 4.1 Gennemgang (standard)

Otte trin, ét ad gangen. Hvert trin: **overskrift**, **2–5 linjers forklaring**, **ét "stop op"-spørgsmål** til læreren (vises som et lille felt, kan foldes ud), og en **grafisk ændring** i scenen. Elementer, der ikke er relevante for trinnet, tones ned (opacity 0,25) i stedet for at forsvinde — så eleverne kan se, at figuren er den samme hele vejen.

Skyderne er **låst** i gennemgangstilstand indtil trin 7, hvor de aktiveres. Ellers går eleverne på opdagelse, før de har begreberne.

### 4.2 Udforsk

Alle otte trins elementer vises på én gang. Skyderne er frie. Der er ingen tekst ud over korte labels og en lille "Hvad ser jeg på?"-knap, der folder trinteksterne ud igen.

### 4.3 Opgaver

Se afsnit 8.

---

## 5. Trin-for-trin-forløbet (indholdet)

Teksterne nedenfor er **færdige** — de skal ind i figuren, som de står. Tal i parentes er W/m², som vises på pilene.

---

**Trin 1 — Sollyset rammer Jorden**

> Solen sender kortbølget stråling mod Jorden — det, vi kan se som lys. Fordelt over hele kloden og hele døgnet er det ca. 340 W pr. kvadratmeter. Ca. 30 % kastes direkte tilbage af skyer, is, sne og lyse overflader. Det tal kalder vi Jordens **albedo**. Resten — ca. 240 W pr. kvadratmeter — bliver optaget og varmer Jorden op.

*Scene:* Jorden uden atmosfærelag. Gul pil ind (340), lys pil tilbage ud i rummet (100), gul pil ned til overfladen (240).
*Stop op:* Hvad tror I, der sker med albedoen, hvis der bliver mindre is på Jorden?

---

**Trin 2 — Jorden sender varme ud igen**

> Alt, der er varmt, udsender stråling. Jordoverfladen er meget koldere end Solen, så den udsender **langbølget** stråling — varmestråling, som vores øjne ikke kan se. Hvis Jorden ikke skal blive varmere og varmere, skal der komme lige så meget energi ud, som der kommer ind: 240 ud mod 240 ind. Det kaldes **strålingsbalance**.

*Scene:* Rød pil op fra overfladen (240), ud i rummet. Balanceindikator vises første gang: "ind 340 = ud 100 + 240 ✓".
*Stop op:* Hvad ville der ske, hvis der kom mere ind, end der gik ud?

---

**Trin 3 — Gåden: −18 °C**

> Regner man på det, giver den balance en overfladetemperatur på ca. **−18 °C**. Så koldt er der heldigvis ikke. Den målte middeltemperatur på Jorden er ca. **+15 °C**. Der mangler altså 33 grader i regnestykket. Forklaringen er atmosfæren.

*Scene:* Termometer/temperaturbjælke vises. Markør ved −18 °C, spøgelsesmarkør ved +15 °C med teksten "målt". Gabet på 33 °C markeres.
*Stop op:* Hvor på Jorden tror I, den målte middeltemperatur på 15 °C passer bedst — og hvor passer den slet ikke? (bro til hydrotermfigurerne)

---

**Trin 4 — Drivhusgasserne slipper lyset ind, men bremser varmen**

> Atmosfæren er næsten gennemsigtig for sollys — det kortbølgede slipper igennem. Men de langbølgede varmestråler bliver **optaget** af nogle bestemte gasser: vanddamp (H₂O), kuldioxid (CO₂), metan (CH₄), lattergas (N₂O) og ozon (O₃). Det er dem, vi kalder **drivhusgasser**. Kvælstof og ilt, som fylder 99 % af atmosfæren, gør det ikke.

*Scene:* Atmosfærelag tegnes ind med molekylesymboler. Den røde pil op fra overfladen rammer laget og standses.
*Stop op:* Hvorfor er det ikke nok at kende luftens temperatur for at vide, hvor kraftig drivhuseffekten er?

---

**Trin 5 — Varmen sendes tilbage**

> Når en drivhusgas har optaget varmestråling, sender den den ud igen — i **alle retninger**, også nedad. Overfladen modtager altså varme to steder fra: fra Solen (160) og fra atmosfæren (330). Det er den **tilbagestråling**, der er selve drivhuseffekten.

*Scene:* Ny pil nedad fra atmosfærelaget (330). Overfladens udstråling vokser til 390. Fordampning/konvektion vises som en tredje, tyndere pil (100).
*Stop op:* Der kommer 330 ned fra atmosfæren og kun 160 fra Solen. Hvordan kan atmosfæren sende mere ned, end Solen gør?

---

**Trin 6 — Ny balance: +15 °C**

> Nu passer regnestykket. Ved overfladen: ind 160 + 330 = 490. Ud 390 som stråling + 100 som fordampning og opstigende varm luft = 490. Og øverst i atmosfæren går der stadig 240 ud, ligesom der kommer 240 ind. Resultatet er en overflade på ca. **+15 °C**. Drivhuseffekten er altså helt naturlig — uden den var Jorden en frossen planet.

*Scene:* Alle pile vises med tal. Temperaturmarkøren glider fra −18 til +15 °C. Balanceindikator: grøn.
*Stop op:* Hvorfor er det forkert at sige, at drivhuseffekten er "farlig"?

---

**Trin 7 — Vi skruer op**

> Siden industrialiseringen er CO₂ i atmosfæren steget fra ca. 280 ppm til ca. 430 ppm (2026). Flere drivhusgasser betyder, at mere af varmestrålingen bliver bremset. Så går der et stykke tid mindre ud, end der kommer ind — balancen brydes — og temperaturen stiger, indtil der igen er balance. **Prøv selv:** træk i CO₂-skyderen.

*Scene:* Skyderne aktiveres. Balanceindikatoren bliver rød og viser ubalancen i W/m², mens temperaturen bevæger sig mod den nye ligevægt (animeret over 1,5 s).
*Stop op:* Hvad sker der med temperaturen, hvis vi holder CO₂ konstant på 560 ppm? Stiger den for evigt?

---

**Trin 8 — Og så begynder det at forstærke sig selv**

> Bliver det varmere, smelter is og sne. Mørkt hav og mørk jord kommer frem, albedoen falder, og Jorden optager endnu mere sollys. Det gør det endnu varmere. Sådan en sløjfe kalder vi en **selvforstærkende tilbagekobling** — og den er grunden til, at Arktis opvarmes ca. 3–4 gange hurtigere end resten af kloden (**polar forstærkning**). Det arbejder vi videre med i modul 5, 6 og 7.

*Scene:* Albedoskyderen fremhæves. Lille sløjfediagram vises ved siden af: varmere → mindre is → lavere albedo → mere optaget sollys → varmere.
*Stop op:* Hvordan hænger det her sammen med Golfstrømmen? (bro til modul 5)

---

## 6. Fysik og talgrundlag

### 6.1 Faste værdier vist i figuren

| Størrelse | Værdi | Vises som |
|---|---|---|
| Indstråling fra Solen (globalt gennemsnit) | 340 W/m² | Gul pil ind |
| Reflekteret (albedo 0,30) | 100 W/m² | Lys pil ud |
| Absorberet i alt | 240 W/m² | — |
| — heraf optaget i atmosfæren | 80 W/m² | Gul pil, stopper i laget |
| — heraf optaget ved overfladen | 160 W/m² | Gul pil til overfladen |
| Overfladens udstråling ved 15 °C | 390 W/m² | Rød pil op |
| Tilbagestråling fra atmosfæren | 330 W/m² | Rød pil ned |
| Fordampning + opstigende varm luft | 100 W/m² | Tynd blå pil op |
| Udstråling til rummet | 240 W/m² | Rød pil ud af toppen |
| Temperatur uden atmosfære | −18 °C | Termometer, trin 3 |
| Målt middeltemperatur | +15 °C | Termometer, trin 6 |
| Drivhuseffektens størrelse | 33 °C | Gab-markering |
| CO₂ førindustrielt / i dag | 280 / ca. 430 ppm | Skyderens nulpunkt og startværdi |

Tallene er afrundede, men **indbyrdes konsistente** (160 + 330 = 390 + 100, og 340 = 100 + 240). Det er vigtigt: eleverne får lov at tjekke regnestykket, og en afrunding, der ikke går op, koster troværdighed i klassen. CO₂-værdien for 2026 bør kunne rettes ét sted i koden (se datamodellen, `constants.co2Now`).

### 6.2 Motoren bag skyderne

Bruges til at beregne temperaturen — vises **ikke** for eleverne.

```
σ = 5,67e-8 W/(m²·K⁴)          Stefan-Boltzmanns konstant
S = 1361 W/m²                  solarkonstanten
Te = ((1 - a) * S / 4 / σ)^0,25        effektiv temperatur, K
ΔF = 5,35 * ln(C / 280)                strålingspåvirkning fra CO₂, W/m²
ΔT = λ * ΔF,  λ = 0,8 K/(W/m²)         temperaturændring fra CO₂
Ts = Te + 33,5 + ΔT                    overfladetemperatur, K
```

De 33,5 K er den naturlige drivhuseffekt indsat som konstant, så modellen rammer de målte 15 °C ved 280 ppm. Over for eleverne afrundes den til "ca. 33 grader".

Kontrolværdier, som skal ramme (±0,1 °C):

| Input | Forventet output |
|---|---|
| a = 0,30 · C = 280 ppm | Te = 254,6 K (−18,6 °C) · Ts = 15,0 °C · ΔT = 0,0 |
| a = 0,30 · C = 430 ppm | Ts ≈ 16,8 °C (ΔT ≈ 1,8) |
| a = 0,30 · C = 560 ppm (fordobling) | Ts ≈ 18,0 °C — dvs. +3,0 °C ved fordoblet CO₂ |
| a = 0,25 · C = 280 ppm | Ts ≈ 19,4 °C |
| a = 0,40 · C = 280 ppm | Ts ≈ 5,3 °C |

Den lineære klimafølsomhed (3 °C pr. fordobling) er den gængse midterste værdi og gør sammenhængen "dobbelt så meget CO₂ = 3 grader" til noget, eleverne kan huske. **Det skal stå i figurens "Om modellen"-tekst**, at der er tale om en stærkt forenklet model, og at den ikke medregner tidsforsinkelse fra havene.

### 6.3 Lagmodellen — koblingen til forsøget

Modulets forsøg ("Drivhuseffekt i miniature") bruger **lag af viskestykker** som ekstra CO₂. Figuren skal kunne det samme, så eleverne ser, at de to ting handler om det samme:

```
Ts = Te * (N + 1)^0,25       N = antal absorberende lag
```

| Lag | Temperatur | Stigning fra forrige lag |
|---|---|---|
| 0 | −18 °C | — |
| 1 | +30 °C | +48 °C |
| 2 | +62 °C | +32 °C |
| 3 | +87 °C | +25 °C |

Pointen, eleverne skal se, er **ikke** de præcise tal, men at **hvert nyt lag varmer mindre end det forrige** — præcis som i forsøget, hvor viskestykke nr. 3 gør mindre end nr. 1. Figuren skal skrive netop det i en note under lagvælgeren, sammen med: *"Modellen med ét lag giver 30 °C, altså varmere end de 15 °C, vi måler. Det er, fordi atmosfæren i virkeligheden ikke opfanger al varmestråling, og fordi luft og vand flytter en del af varmen opad."*

### 6.4 Fejlopfattelser, figuren skal modvirke

Skal adresseres eksplicit i teksterne eller i små "Pas på"-felter:

1. **Ozonhullet er ikke drivhuseffekten.** Ozonlaget beskytter mod UV; drivhuseffekten handler om varmestråling. To forskellige ting.
2. **Drivhuseffekten er ikke i sig selv et problem** — uden den var der −18 °C. Problemet er, at vi forstærker den.
3. **Drivhusgasserne "holder ikke på varmen som et låg"** — de optager stråling og sender den ud igen i alle retninger. Figuren skal vise genudsendelsen i flere retninger, ikke kun nedad.
4. **CO₂ fylder meget lidt** (0,04 %) og er alligevel afgørende. Vis gerne det tal ved siden af skyderen, så eleverne selv støder på det.
5. **Et rigtigt drivhus virker anderledes** (det stopper luftens bevægelse). Nævnes i én sætning i "Om modellen".

---

## 7. Kontroller

| Kontrol | Område | Trin | Bemærkning |
|---|---|---|---|
| CO₂-skyder | 280–1120 ppm, trin 10 ppm | Låst til trin 7 | Mærker ved 280 (førindustrielt), 430 (i dag), 560 (fordobling). Viser ppm og ΔT. |
| Albedo-skyder | 0,10–0,50, trin 0,01 | Låst til trin 8 | Mærker ved 0,30 (i dag). Ved lav albedo skal isen i grafikken visuelt skrumpe. |
| Lagvælger | 0 / 1 / 2 / 3 lag | Egen visning, trin 6 | Skifter til lagmodellen (6.3). Skal kunne slås fra af læreren. |
| Nulstil | — | Altid | Tilbage til 280 ppm / a = 0,30 / 1 lag. |
| Næste / Forrige | — | Gennemgang | Piletaster og mellemrum. Trinnummer i URL (`#trin=4`), så et link kan pege på ét trin. |
| Tilstandsvælger | Gennemgang / Udforsk / Opgaver | Altid | Også via URL: `?mode=teach|explore|quiz`. |

Når en skyder flyttes: temperaturen animeres mod den nye ligevægt over ca. 1,5 sekund, mens balanceindikatoren viser ubalancen (rød, "der går 2,3 W/m² mindre ud, end der kommer ind"), og lander på grøn ved den nye ligevægt. **Den animation er hele pointen i trin 7** — den må ikke springes over ved at hoppe direkte til slutværdien.

---

## 8. Opgavetilstand

### 8.1 Opbygning

- **Tre sæt** svarende til stigende sværhedsgrad: **A. Genkend** (5 opgaver) · **B. Anvend** (5) · **C. Forklar** (5). Eleven kan vælge sæt eller tage alle 15 i rækkefølge.
- **Én opgave ad gangen.** Figuren er stadig synlig ved siden af — flere opgaver kræver, at man aflæser den.
- **Feedback med det samme:** rigtigt/forkert + én linjes forklaring på, *hvorfor*. Ved forkert svar tilbydes "Vis mig det i figuren", som hopper til det relevante trin.
- **Ingen point, ingen tidtagning, ingen highscore.** Til gengæld en simpel statuslinje ("7 af 15") og en opsamling til sidst, der viser hvilke begreber eleven bør genlæse.
- **Fremskridt gemmes i `localStorage`** på enheden. Ingen login, ingen elevdata på serveren.
- **Print/PDF:** knap, der udskriver alle opgaver uden facit (til kompendiet) og en version med facit (til læreren).

### 8.2 Opgavetyper

| Type | Beskrivelse |
|---|---|
| `mc` | Multiple choice, 4 svarmuligheder, ét rigtigt. |
| `mc-multi` | Flere rigtige svar, eleven markerer dem alle. |
| `drag` | Træk pile/labels til rigtig plads i figuren (fx: hvilke pile er kortbølgede, hvilke er langbølgede). |
| `numeric` | Udfyld et tal i energibalancen, tolerance ±5 W/m² eller ±0,5 °C. |
| `predict` | Forudsig-og-tjek: eleven vælger "stiger / falder / uændret", får derefter lov at flytte skyderen og se svaret. |
| `open` | Kort skriftligt svar. Rettes ikke maskinelt — eleven skriver, klikker "Vis facit" og sammenligner med et modelsvar. Bruges til eksamenstræning. |

### 8.3 Opgavebank (færdigt indhold)

**Sæt A — Genkend**

1. `mc` Hvilken slags stråling kommer fra Solen? → *Kortbølget.* (Distraktorer: langbølget · radiobølger · kun UV.) Feedback: "Solen er meget varm, og varme ting udsender kortbølget stråling. Jorden er kold og udsender langbølget."
2. `mc` Hvilken slags stråling udsender jordoverfladen? → *Langbølget varmestråling.*
3. `mc-multi` Hvilke af disse er drivhusgasser? → *CO₂ · vanddamp · metan.* (Ikke: ilt, kvælstof.)
4. `drag` Placér de fem pile korrekt i figuren: indstråling (340) · reflekteret (100) · overfladens udstråling (390) · tilbagestråling (330) · udstråling til rummet (240).
5. `mc` Hvad betyder albedo? → *Hvor stor en del af sollyset, en overflade kaster tilbage.*

**Sæt B — Anvend**

6. `numeric` Der kommer 340 W/m² ind, og 100 W/m² kastes tilbage. Hvor meget optager Jorden? → *240.*
7. `numeric` Overfladen modtager 160 fra Solen og 330 fra atmosfæren. Den sender 390 ud som stråling. Hvor meget må så forsvinde som fordampning og varm luft, for at det går op? → *100.*
8. `predict` Du skruer CO₂ op fra 430 til 560 ppm. Hvad sker der med temperaturen? → *Stiger* (ca. +1,2 °C fra 430).
9. `predict` Du sætter albedoen ned fra 0,30 til 0,25. Hvad sker der med temperaturen? → *Stiger.* Feedback: "Lavere albedo = mindre lys kastes tilbage = mere optages = varmere."
10. `mc` Hvorfor bliver Jorden ved med at være ca. 15 °C i stedet for at blive varmere og varmere? → *Fordi der indstiller sig en balance, hvor der går lige så meget energi ud, som der kommer ind.*

**Sæt C — Forklar** (eksamensniveau, `open` med modelsvar)

11. `open` Forklar med figuren, hvorfor Jorden ville være ca. 33 °C koldere uden atmosfære.
    *Modelsvar:* Uden atmosfære slipper al langbølget stråling direkte ud i rummet. Balancen mellem 240 W/m² ind og 240 W/m² ud giver en overflade på −18 °C. Med atmosfære optager drivhusgasserne en del af den langbølgede stråling og sender den ud igen i alle retninger, også nedad. Overfladen får derfor både solindstråling og tilbagestråling, og temperaturen indstiller sig først i balance ved ca. +15 °C.
12. `open` En klassekammerat siger: "Drivhuseffekten er noget skidt, vi skal af med den." Hvad vil du svare?
    *Modelsvar:* Den naturlige drivhuseffekt gør Jorden beboelig — uden den var middeltemperaturen −18 °C. Problemet er ikke drivhuseffekten i sig selv, men at vi forstærker den ved at udlede CO₂ og andre drivhusgasser, så temperaturen stiger hurtigere, end natur og samfund kan nå at tilpasse sig.
13. `open` Forklar, hvorfor Arktis opvarmes hurtigere end resten af kloden. Brug ordene albedo og tilbagekobling.
    *Modelsvar:* Når det bliver varmere, smelter havis og sne. Under isen er hav og jord mørkere, så albedoen falder, og der optages mere sollys. Det giver yderligere opvarmning og endnu mindre is. Sløjfen forstærker sig selv (positiv tilbagekobling) og virker kraftigst der, hvor der er is at miste — altså i Arktis. Det kaldes polar forstærkning.
14. `open` I forsøget lagde I flere lag viskestykker på modellen. Hvorfor varmede det tredje lag mindre end det første? Sammenlign med figurens lagmodel.
    *Modelsvar:* Hvert lag opfanger og sender varmestråling tilbage, men jo flere lag der allerede er, jo mindre af den udgående stråling er der tilbage at opfange. Effekten pr. lag bliver derfor mindre og mindre — i modellen fra +48 °C for det første lag til +25 °C for det tredje. Det er den samme aftagende virkning, vi ser i forsøget.
15. `open` (eksamensopgave) Brug figuren til at forklare kæden fra CO₂-udledning til en mulig svækkelse af Golfstrømmen.
    *Modelsvar:* Mere CO₂ → mere langbølget stråling bremses → ubalance i strålingsregnskabet → temperaturen stiger, indtil der igen er balance → is og sne smelter, albedoen falder, og Arktis opvarmes ekstra (polar forstærkning) → afsmeltning fra Grønland tilfører ferskvand til Nordatlanten → overfladevandet bliver mindre salt og dermed mindre tungt → dybvandsdannelsen svækkes, og dermed kan Golfstrømmen bremse op.

---

## 9. Datamodel

Indhold skal ligge i data, ikke i koden, så Simon kan rette tekster uden at røre logikken.

```jsonc
{
  "meta": { "titel": "Drivhuseffekten trin for trin", "version": "1.0", "sprog": "da" },

  "constants": {
    "solarkonstant": 1361,      // W/m²
    "sigma": 5.67e-8,
    "albedoNu": 0.30,
    "co2Foerindustrielt": 280,  // ppm
    "co2Nu": 430,               // ppm — opdateres årligt
    "lambda": 0.8,                // K/(W/m²)
    "naturligDrivhuseffekt": 33.5 // K — vises som "ca. 33 °C"
  },

  "trin": [
    {
      "id": 1,
      "overskrift": "Sollyset rammer Jorden",
      "tekst": "Solen sender kortbølget stråling …",
      "stopOp": "Hvad tror I, der sker med albedoen, hvis der bliver mindre is på Jorden?",
      "synlige": ["sol", "pilInd", "pilReflekteret", "pilAbsorberet", "overflade"],
      "fremhaev": ["pilInd"],
      "kontroller": { "co2": "laast", "albedo": "laast", "lag": "skjult" }
    }
    // … trin 2–8
  ],

  "opgaver": [
    {
      "id": "A1",
      "saet": "A",
      "type": "mc",
      "spoergsmaal": "Hvilken slags stråling kommer fra Solen?",
      "svar": [
        { "tekst": "Kortbølget stråling", "rigtigt": true },
        { "tekst": "Langbølget varmestråling", "rigtigt": false },
        { "tekst": "Radiobølger", "rigtigt": false },
        { "tekst": "Kun UV-stråling", "rigtigt": false }
      ],
      "feedback": "Solen er meget varm …",
      "visTrin": 1
    },
    {
      "id": "B8",
      "saet": "B",
      "type": "predict",
      "spoergsmaal": "Du skruer CO₂ op fra 430 til 560 ppm. Hvad sker der med temperaturen?",
      "valg": ["Stiger", "Falder", "Uændret"],
      "rigtigt": "Stiger",
      "proev": { "co2Fra": 430, "co2Til": 560 },
      "feedback": "Mere CO₂ bremser mere af varmestrålingen …"
    }
  ]
}
```

Alle elementer i scenen skal have stabile id'er (`sol`, `pilInd`, `pilReflekteret`, `atmosfaere`, `pilTilbagestraaling`, `overflade`, `is`, `termometer`, `balanceIndikator` …), så `synlige` og `fremhaev` kan styre visningen deklarativt.

---

## 10. Grafisk udtryk

Figuren skal ligne resten af NV-materialet. Paletten er "Ocean Gradient", som modulernes præsentationer bruger:

| Rolle | Farve |
|---|---|
| Mørkeblå (overskrifter, ramme) | `#21295C` |
| Blå (flader, atmosfære) | `#065A82` |
| Teal (fremhævning, labels) | `#1C7293` |
| Lyseblå (baggrundsflader) | `#CADCFC` |
| Næsten hvid (baggrund) | `#F7FAFC` |
| Orange (accent, aktive elementer) | `#E8734A` |

Ud over paletten:

- **Kortbølget stråling:** gul-orange (`#F2B134`), fuldt optrukne pile.
- **Langbølget stråling:** rød-orange (`#C64B3A`), pile med bølget/stiplet streg — forskellen på de to slags stråling skal kunne ses, også i sort-hvid print og for farveblinde. Brug derfor **både** farve og stregtype.
- **Pilenes tykkelse skalerer med energimængden** (340 er tykkere end 100). Det er et selvstændigt læringspunkt.
- **Skrifttyper:** Cambria (eller anden serif) til overskrifter, Calibri/system-sans til brødtekst — som i præsentationerne.
- Ingen fotorealisme. Ren, flad vektorgrafik med tydelige konturer, så den kan projiceres.

---

## 11. Teknik

| Krav | Specifikation |
|---|---|
| Leverance | **Én selvstændig HTML-fil** med indlejret CSS og JS, plus evt. `data.json`. Ingen build-step. |
| Grafik | **Inline SVG** (ikke canvas) — så elementer kan have id'er, animeres med CSS og læses af skærmlæsere. |
| Afhængigheder | **Ingen eksterne biblioteker og ingen CDN-kald.** Skal virke uden internet, når siden først er hentet. |
| Størrelse | Under 300 kB i alt. |
| Indlejring | Skal kunne lægges på smbi.dk direkte eller i `<iframe>`. Ingen antagelser om forældresidens CSS (brug scoped/prefixede klassenavne). |
| Browsere | Nyeste Chrome, Safari, Edge, Firefox — desktop, iPad og telefon. Skal virke på skolens elev-iPads. |
| Data | Ingen cookies, ingen tracking, ingen serverkald. Fremskridt kun i `localStorage` under nøglen `smbi.drivhus.v1`. |
| URL-tilstand | `?mode=teach&trin=4` og `?mode=quiz&saet=B` skal kunne deles direkte — læreren linker fra OneNote. |
| Ydelse | Animationer via CSS/`requestAnimationFrame`, 60 fps på en 5 år gammel bærbar. |

---

## 12. Tilgængelighed

- Kan betjenes **udelukkende med tastatur** (tab-rækkefølge, piletaster på skydere, `Enter`/mellemrum til næste trin).
- Kontrast mindst **4,5:1** for tekst (WCAG AA). Tjek særligt teal på lyseblå.
- **Ingen information kun i farve** — pilene skelnes også på stregtype og på deres label.
- SVG-elementer har `<title>`/`aria-label`, så en skærmlæser kan læse "pil: indstråling fra Solen, 340 watt pr. kvadratmeter".
- Tekst kan forstørres til 200 % uden at layoutet bryder.
- Animationer respekterer `prefers-reduced-motion`: ved reduceret bevægelse springes overgangen over, men slutresultatet vises.

---

## 13. Afgrænsning (ikke i version 1)

Skrevet ned, så det ikke bliver dyrere end nødvendigt:

- Ingen rigtig klimamodel — kun den forenklede balance i afsnit 6.2.
- Ingen tidsakse eller fremskrivning til år 2100 (det ligger i modul 6 med DMI Klimaatlas).
- Ingen andre tilbagekoblinger end is-albedo (vanddamp, skyer, permafrost nævnes ikke).
- Ingen elevkonti, ingen aflevering til læreren, ingen karakterer.
- Ingen engelsk version.

Mulige udvidelser senere: kobling til hydrotermfigurerne (modul 4), en Golfstrøms-visning (modul 5), og et samlet årsagskæde-diagram (modul 7).

---

## 14. Acceptkriterier

Version 1 er færdig, når:

1. Alle otte trin kan gennemløbes frem og tilbage med mus, tastatur og touch — og teksterne står ordret som i afsnit 5.
2. Kontrolværdierne i afsnit 6.2 rammes (±0,1 °C), og energitallene i figuren går op (160 + 330 = 390 + 100; 340 = 100 + 240).
3. Skyderne er låst i trin 1–6 og aktive fra trin 7.
4. Lagmodellen giver −18 / +30 / +62 / +87 °C for 0–3 lag, og noten om aftagende virkning vises.
5. Alle 15 opgaver virker, giver feedback, og "Vis mig det i figuren" springer til det rigtige trin.
6. Fremskridt overlever en genindlæsning af siden (localStorage).
7. Print-knappen giver to brugbare A4-udskrifter: opgaver uden facit og med facit.
8. Figuren kan læses fra bagerste række i et klasselokale i projektortilstand (test: 24 pt effektiv skriftstørrelse ved 3 m).
9. Den virker i `<iframe>` på smbi.dk uden konsolfejl, og uden netværksforbindelse efter første indlæsning.
10. Tastaturnavigation og kontrastkrav i afsnit 12 er opfyldt.

---

## 15. Bilag: koblinger til resten af NV-forløbet

| Modul | Kobling |
|---|---|
| Modul 3 | Vanddamp er den kraftigste drivhusgas — bro fra vandets kredsløb. |
| **Modul 4** | Figurens hjemmemodul. Bruges i stedet for videoen, før forsøget "Drivhuseffekt i miniature". Lagmodellen i 6.3 er selve forsøget. |
| Modul 5 | Trin 8's kæde ender i ferskvandstilførsel og svækket dybvandsdannelse (Grønlandspumpen). |
| Modul 6 | Konsekvenserne af den temperaturstigning, figuren viser — Middelfart som case. |
| Modul 7 | Is-albedo-tilbagekoblingen er modulets kerne; figurens trin 8 er optakten. |
| Modul 8 | Opgavesæt C er skrevet som eksamensrepetition. |

**Kilder til talgrundlaget:** NASA/NOAA's globale energibudget (afrundede Trenberth-værdier), NOAA Global Monitoring Laboratory for CO₂-koncentrationen (ca. 430 ppm i 2026), IPCC AR6 for klimafølsomheden (bedste skøn 3 °C pr. fordobling af CO₂).
