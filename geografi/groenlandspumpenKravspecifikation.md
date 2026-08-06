# Kravspecifikation: Grafisk simulator af den termohaline cirkulation

**Til:** udviklingsagent
**Fra:** Simon Messell, naturgeografi, NV-forløbet *Fremtidens Klima*
**Modul:** Modul 5 — Arktis og klimaforandringer
**Deliverable:** én selvstændig `.html`-fil
**Sprog i brugerfladen:** dansk

---

## 0. Den vigtigste regel

**Der må ikke stå tal nogen steder i brugerfladen.**

Ingen grader, ingen PSU, ingen Sv, ingen kg/m³, ingen procenter, ingen årstal, ingen grafer med akser. Eleven skal ikke aflæse — eleven skal **se**.

Alt hvad eleven får at vide, formidles gennem bevægelse, farve, tykkelse, hastighed og størrelse. Hvis du kommer i tvivl om, hvordan en information skal vises, er svaret aldrig "et tal" — det er "en visuel forskel eleven kan pege på".

Der ligger en simpel logik under motorhjelmen (afsnit 6), men den er usynlig. Den er ikke pensum, den er ikke i brugerfladen, og den skal ikke kunne aflæses.

---

## 1. Formål

Eleverne (1.g, NV) har lige lavet forsøget **Grønlandspumpen**: et plexiglas-kar med knust is i den ene ende og en flaske varmt vand i den anden. Blåfarvet koldt vand synker ved isen, løber langs bunden mod varmen og stiger op. Cirkulationen kører for øjnene af dem.

Forsøget kan ikke vise, hvad der sker, hvis man **hælder nok ferskvand i** til at slukke pumpen. Det er dét, årets problemstilling handler om.

Simulatoren er **karret, som eleven kan skrue på**. Samme billede, samme farver, samme bevægelse — men nu kan man smelte indlandsisen og se pumpen gå i stå.

### Didaktisk grundprincip

Simulatoren **forklarer ingenting**. Den viser. Eleven laver selv abduktionen: ser et mønster (strømmen stopper), og slutter sig til den bedste forklaring (ferskvandet gjorde vandet for let til at synke).

Der må derfor ikke stå "fordi" nogen steder i brugerfladen. Ingen popup, der siger *"Det skyldes, at saliniteten falder…"*. Al fortolkning hører til i klassesamtalen og i opgavearket.

---

## 2. Læringsmål

Eleven skal efter arbejdet kunne **pege på skærmen** og fortælle:

1. hvor vandet synker, og hvorfor netop dér
2. at koldt vand er tungt, og at ferskvand er let
3. at strømmen bliver svagere, når indlandsisen smelter
4. at der findes et punkt, hvor pumpen **stopper helt** — ikke bare bliver langsommere
5. at den ikke uden videre starter igen, når man skruer tilbage
6. at Danmark får varme med strømmen — og mister den, hvis strømmen stopper

---

## 3. Teknisk ramme

| Krav | Værdi |
|---|---|
| Format | **Én** `.html`-fil, selvstændig |
| Afhængigheder | **Ingen.** Ingen CDN, ingen build. Al CSS og JS inline. Skal virke uden internet |
| Grafik | `<canvas>` 2D, eller inline SVG + CSS-animation. Ingen WebGL, ingen biblioteker |
| Persistens | Ingen `localStorage`. Skal køre fra `file://` |
| Skærm | Bygges til **projektor i et lyst klasselokale** som primær visning: store flader, kraftig kontrast, ingen fine detaljer. Skal også fungere på en elev-bærbar i 1366×768 |
| Ydelse | Skal køre flydende i 60 fps på en gennemsnitlig skole-bærbar |

Filen lægges i `Modul 5 - Arktis og klimaforandringer/` og skal kunne åbnes ved dobbeltklik.

---

## 4. Skærmbilledet

Én scene fylder næsten hele skærmen. Ingen faneblade, ingen paneler med tal, ingen sidebar med aflæsninger.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Grønlandspumpen                                        [?]   [Forfra]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ☀                                              ❄  ⛰ Grønland          │
│   troperne                    Danmark             indlandsis             │
│                                  ▼                   ╱╲╲                 │
│  ┌────────────────────────────────────────────────────────────┐          │
│  │  ~~~~~~~~~~~ overfladestrøm mod nord ~~~~~~~~~~~▶          │          │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▓▓▓▓▓▓│         │          │
│  │                                            synke-│         │          │
│  │                                            zonen ▼         │          │
│  │  ◀━━━━━━━━━━━ dybstrøm mod syd ━━━━━━━━━━━━━━━━━━┘         │          │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│         ❄ ─────────●───────── ☀           ⛰ ────●──────────── 💧         │
│         Hvor koldt er der i nord?          Hvor meget smelter isen?      │
│                                                                          │
│              [ ⏸ Pause ]     [ Prøv et scenarie ▾ ]                      │
└──────────────────────────────────────────────────────────────────────────┘
```

Layoutet skal **genkendes som forsøgskarret**: et rektangulært snit, varmt til venstre, is til højre, en synlig sløjfe af vand rundt.

---

## 5. Det eleven ser

Dette afsnit er specifikationens kerne. Hver enkelt af disse visninger erstatter et tal.

### 5.1 Vandpartiklerne — cirkulationens hastighed

En strøm af små, farvede partikler løber i en lukket sløjfe: mod nord langs overfladen, **ned** i synkezonen ved Grønland, mod syd langs bunden, **op** igen i troperne.

- **Hastigheden er den vigtigste enkeltvisning.** Kraftig cirkulation = partiklerne fyger af sted. Svag = de sjosker. Stoppet = de står stille og vugger let på stedet
- **Antallet af partikler** følger også styrken: mange ved kraftig strøm, få ved svag
- Overgangen skal være **glidende og langsom** — når eleven trækker i en skyder, må billedet ikke skifte med det samme. Det tager tid, før strømmen reagerer. Det er en pointe i sig selv
- Partiklerne må gerne have en svag hale/stribe, så bevægelsen kan ses selv på et frosset skærmbillede (læreren tager screenshot til tavlen)

### 5.2 Vandets farve — tungt eller let

Partiklerne og vandmasserne farves efter, **hvor tungt vandet er** — ikke efter temperatur.

- **Mørk dybblå = tungt.** **Bleg, mælkeagtig lyseblå = let.**
- Når eleven smelter indlandsisen, skal man se den **blege farve brede sig ned gennem Nordatlanten** fra toppen. Det er dét, der stopper pumpen — og det skal være det tydeligste, der sker på skærmen
- Ferskvandet fra isen tegnes som en synlig, lys strøm, der løber ned i havet og **lægger sig som et låg** oven på det tunge vand. Låget skal have en synlig kant

### 5.3 Synkezonen — hvor pumpen sidder

Ved Grønland, hvor det tunge vand synker. Dette er den mest ladede plet på skærmen og skal have særlig omhu:

- **Kraftig pumpe:** en bred, mørk, hvirvlende nedadgående søjle. Partikler suges tydeligt ned
- **Svækket:** søjlen bliver smallere og bleg. Nogle partikler bliver "hængende" i overfladen i stedet for at synke
- **Stoppet:** søjlen forsvinder helt. Partiklerne løber ind i det lyse låg, **studser af det** og bliver liggende. Der skal være en lille visuel "prop"-effekt: man ser vandet komme og ikke kunne komme ned
- Der må gerne ligge et diskret ikon oven over synkezonen — en pumpe eller en nedadpil — som visner, når pumpen svækkes

### 5.4 Pumpens tilstand — uden tal

Et enkelt, stort statusfelt. **Kun ord og farve, aldrig procent.**

| Tilstand | Tekst | Farve |
|---|---|---|
| Fuld styrke | **Pumpen kører** | teal `1C7293` |
| Svækket | **Pumpen bliver træg** | orange `E8734A` |
| Kraftigt svækket | **Pumpen er ved at gå i stå** | orange, langsomt pulserende ramme |
| Stoppet | **Pumpen står stille** | navy `21295C` |

Ved skift af tilstand: en rolig overgang, ingen alarm, ingen lyd, intet blink. Teksten skifter, farven skifter, og der lægges en **lille markør på tidsbåndet** (5.6).

### 5.5 Danmark — hvorfor det angår os

Over havet, omtrent hvor Danmark ligger, sidder et lille område med en simpel illustration: et landskab med et træ og et hus.

- **Kraftig strøm:** grønt landskab, blød varm himmel, træet har blade
- **Svag strøm:** farverne trækkes langsomt mod gråt og køligt
- **Stoppet:** råkoldt, gråblåt landskab, rim på jorden, træet er bart

Ingen temperatur, ingen tekst. Kun billedet. Overgangen skal være **meget langsom** — den halter bagefter cirkulationen, så eleven ser, at konsekvensen kommer efter årsagen.

En blød varmestrøm — en varm, gylden gradient — skal kunne ses løbe med overfladestrømmen nordpå og ind over Danmark, og den skal tynde ud og forsvinde, når pumpen svækkes. Det er den visuelle forklaring på "global energitransport via havstrømme".

### 5.6 Tidsbåndet — hukommelse i stedet for graf

I stedet for en graf med akser: et **vandret bånd** nederst i scenen, der ruller langsomt mod venstre. Båndet farves løbende efter pumpens tilstand — teal, orange, navy — så eleven kan se **forløbet** af det, der er sket, som et farvet spor.

Ingen akser, ingen mærker, ingen enheder. Kun et farvespor med de fire tilstandsord skrevet ind, hvor skiftene skete.

Båndet er elevernes datamateriale, når de skal beskrive et forsøg: *"først var den teal, så blev den orange, og efter et stykke tid blev den navy."*

---

## 6. Logikken under motorhjelmen

Usynlig for eleven. Holdes bevidst så enkel som muligt — dette er ikke en klimamodel, det er en animationsmotor med troværdig opførsel.

Fire skjulte værdier, alle mellem 0 og 1. **Ingen af dem må nogensinde vises.**

| Værdi | Betyder | Kommer fra |
|---|---|---|
| `kulde` | hvor koldt der er i nord | skyder 1 |
| `ferskvand` | hvor meget isen smelter | skyder 2 |
| `salt` | hvor salt Nordatlanten er | langsom, intern (se nedenfor) |
| `pumpe` | cirkulationens styrke | beregnes |

**Regel 1 — hvor tungt er vandet i nord**

```
tyngde  =  kulde  +  salt  −  ferskvand
```

**Regel 2 — pumpen følger tyngden, men trægt**

`pumpe` bevæger sig langsomt mod `tyngde` (typisk over 10–20 sekunders skærmtid). Aldrig øjeblikkeligt. Trægheden er didaktisk vigtig: konsekvenser kommer forsinket.

**Regel 3 — den positive tilbagekobling**

`salt` bevæger sig langsomt mod `pumpe`. Kører pumpen, kommer der salt vand nordpå, og nord bliver saltere. Står pumpen, kommer der intet salt, og nord bliver ferskere — hvilket gør pumpen endnu svagere.

Det er **salt-advektions-tilbagekoblingen**, og den er parallel til is-albedo-tilbagekoblingen i modul 7. Den skal fungere, for det er den, der gør, at pumpen ikke bare kommer tilbage.

**Regel 4 — låsen (det er her hysteresen kommer fra)**

- Falder `pumpe` under en **lav** grænse, låses den i tilstanden *stoppet*
- Den låses først op igen, når `tyngde` kommer over en **mærkbart højere** grænse

Konsekvensen — som eleven skal opdage helt selv — er, at man ikke kan starte pumpen igen bare ved at skrue skyderen tilbage til der, hvor den stoppede. Man skal **længere tilbage**. Sammen med regel 3 gør låsen tilstanden *stoppet* til noget, der bider sig fast.

**Kalibreringskrav.** Justér grænser og tidskonstanter, indtil dette holder på skærmen:

1. Skru ferskvandet gradvist op fra bunden: pumpen skal svækkes **synligt gradvist**, ikke i spring, og først stoppe et godt stykke oppe — cirka to tredjedele oppe ad skyderen
2. Når den er stoppet: skru ferskvandet helt i bund igen. Pumpen skal **blive stående i mindst 20–30 sekunder** derefter, før den eventuelt starter — og det skal føles som en ægte modstand, ikke som en fejl
3. Hele forløbet fra "kører" til "står stille" skal kunne nås inden for **cirka et halvt minut** ved kraftig påvirkning. Det skal kunne demonstreres på en projektor uden dødtid
4. Ingen brat opførsel: der må ikke findes et sted på skyderen, hvor 1 px flytning slår pumpen fra

---

## 7. Kontrollerne

To skydere. **Ingen talværdier, ingen enheder, ingen mærker på skalaen.** Endepunkterne markeres med ikoner og en spørgende tekst.

**Skyder 1 — `❄ ────●──── ☀` "Hvor koldt er der i nord?"**
Venstre = iskoldt. Højre = mildt. Start: et stykke inde fra venstre.
Trækkes den mod højre, skal isen på Grønland i baggrunden **synligt skrumpe**, og himlen blive lysere.

**Skyder 2 — `⛰ ────●──── 💧` "Hvor meget smelter indlandsisen?"**
Venstre = isen ligger stille. Højre = kraftig afsmeltning. Start: helt i venstre.
Trækkes den mod højre, skal der løbe **synligt smeltevand** ned fra indlandsisen i en strøm, hvis bredde følger skyderen.

Begge skydere skal:

- være **store** — mindst 40 px høje greb, betjenbare på projektor og med tastatur
- reagere **øjeblikkeligt visuelt** (smeltevandet begynder at løbe med det samme), men **trægt i systemet** (pumpen reagerer langsomt). Denne forskel er bevidst
- have et lille ikon i hver ende og teksten som spørgsmål under sig

**Øvrige knapper:** `⏸ Pause`, `Forfra` (nulstil alt), `[?]` (åbner "Sådan læser du billedet", afsnit 9), og `Prøv et scenarie ▾`.

---

## 8. Scenarier

Dropdown med fem forudsatte situationer. Hver sætter skyderne, nulstiller tidsbåndet og viser **én enkelt sætning** øverst i scenen — altid et spørgsmål, aldrig en forklaring.

| Scenarie | Hvad der sker | Spørgsmålet på skærmen |
|---|---|---|
| **Som i dag** | Alt kører roligt, pumpen i fuld styrke | *"Hvor synker vandet ned? Og hvorfor lige dér?"* |
| **Sådan startede pumpen** | Starter med varmt, let vand overalt og stillestående hav; kulden skrues gradvist på af sig selv, og pumpen **starter** for øjnene af eleven | *"Hvad skal der til, før vandet begynder at synke?"* |
| **Isen smelter** | Ferskvandsskyderen kører langsomt op af sig selv, indtil pumpen stopper | *"Hvornår går pumpen i stå — og hvad skete der lige før?"* |
| **Kan den komme tilbage?** | Starter i stoppet tilstand. Begge skydere står allerede tilbage i udgangspunktet | *"Skru tilbage. Starter pumpen igen?"* |
| **Fri leg** | Eleven bestemmer alt | *"Prøv at få pumpen til at stoppe. Prøv så at få den i gang igen."* |

De to scenarier, der kører af sig selv (**Sådan startede pumpen**, **Isen smelter**), er de vigtigste til klassevisning på projektor: læreren kan sætte dem i gang og tale over dem.

---

## 9. "Sådan læser du billedet"

Bag `[?]`-knappen. En **ren billedforklaring** — en legende, ikke en lærebog. Maks. seks linjer, hver med et lille grafisk eksempel ved siden af:

- mørk blå prik → *tungt vand*
- bleg blå prik → *let vand*
- hurtige partikler → *kraftig strøm*
- nedadgående søjle → *her synker vandet ned*
- lys strøm fra isen → *smeltevand*
- grønt/gråt landskab → *klimaet i Danmark*

**Ingen årsagsforklaringer.** Ikke "fordi ferskvand er lettere". Kun hvad symbolerne betyder.

---

## 10. Elevopgaver

En foldbar sektion nederst med fem opgaver. Hver har en knap **"Sæt op"**, der vælger det rette scenarie. Ingen svarfelter, ingen facit — eleverne skriver i deres eget dokument.

1. **Se efter.** Kør "Som i dag". Beskriv med dine egne ord, hvad vandet gør. Hvor synker det ned? Hvor stiger det op? Tegn det.
2. **Hvad driver pumpen?** Kør "Sådan startede pumpen". Hvad var det, der skulle ændre sig, før vandet begyndte at synke?
3. **Én ting ad gangen.** Rør kun ved kuldeskyderen. Hvad sker der? Stil den tilbage. Rør nu kun ved smeltevandsskyderen. Hvad sker der? Hvilken af de to gjorde størst forskel?
4. **Vejen tilbage.** Kør "Kan den komme tilbage?". Skru begge skydere tilbage til udgangspunktet og vent. Hvad sker der — og hvad sagde du på forhånd, der ville ske?
5. **Fra kar til skærm.** Hvad på skærmen svarer til isen i jeres plexiglas-kar? Til den varme flaske? Til frugtfarven? Nævn to ting, skærmen kan, som karret ikke kan — og to ting, karret gør bedre.

Opgave 3 er variabelkontrol, opgave 4 er hypotese og efterprøvning, opgave 5 er modelbegrænsning. Alle tre metodebegreber går igen i forløbet.

---

## 11. Design

Følg forløbets **"Ocean Gradient"**-palette, som bruges i alle modulers præsentationer:

| Rolle | Hex |
|---|---|
| Mørkeblå — tungt vand, dybhav | `065A82` |
| Teal — accent, pumpen kører | `1C7293` |
| Navy — tekst, stoppet tilstand | `21295C` |
| Lyseblå — let vand, smeltevand | `CADCFC` |
| Næsten hvid — baggrund, is | `F7FAFC` |
| Orange — svækkelse, varme, sol | `E8734A` |

Typografi: overskrifter i **Cambria** (fallback `Georgia, serif`), øvrig tekst i **Calibri** (fallback `system-ui, sans-serif`). Statustekst mindst 28 px, etiketter mindst 17 px.

Udtryk:

- **Roligt og fladt.** Ingen skygger, ingen glans, ingen 3D. Det skal ligne en god lærebogsfigur, der er begyndt at bevæge sig
- **Store flader, få detaljer.** Alt skal kunne ses bagerst i lokalet
- **Ingen emoji i selve grafikken** — ikonerne tegnes som simple former. (De emoji, der står i denne spec, er kun beskrivelser af, hvad ikonet forestiller.)
- Ingen røde alarmfarver, ingen udråbstegn, ingen "advarsel". Det er en model, ikke et katastrofevarsel
- Ingen lyd

---

## 12. Tilgængelighed og robusthed

- Begge skydere kan betjenes med tastatur og har `<label>`
- Tilstandsskift annonceres i et `aria-live="polite"`-felt med de samme fire tekster
- Farve er aldrig eneste bærer af information: tilstanden har både farve, ord og partikelhastighed
- Ingen konsolfejl, ingen `NaN`, uanset hvordan eleven trækker i skyderne — herunder hurtig frem-og-tilbage-trækning
- Ingen tilstand hvor animationen fryser eller partikler forsvinder helt fra skærmen

---

## 13. Acceptkriterier

Løsningen er færdig, når alt dette er set på en projektor:

1. Filen åbner ved dobbeltklik uden internet og viser "Som i dag" med kørende cirkulation
2. **Der findes intet tal i brugerfladen.** Gennemgå hver skærm og hver foldeud-sektion
3. Man kan pege på skærmen og vise, hvor vandet synker — uden at læse noget
4. Skru smeltevandet gradvist op: farven i nord bleger **synligt**, partiklerne bliver langsommere, og pumpen stopper til sidst. Hele forløbet tager under et halvt minut og ser ud som ét sammenhængende forløb, ikke som spring
5. Når pumpen er stoppet: partiklerne studser synligt af det lyse låg i stedet for at synke
6. Skru derefter alt tilbage: pumpen bliver stående i mindst 20–30 sekunder. Det skal se ud som modstand, ikke som en fejl
7. Danmark-landskabet skifter fra grønt mod gråt **efter** cirkulationen er svækket, ikke samtidig
8. Tidsbåndet viser bagefter et aflæseligt farvespor over forløbet
9. Scenarierne "Sådan startede pumpen" og "Isen smelter" kører hele vejen igennem af sig selv uden indgriben
10. Flydende animation på en almindelig skole-bærbar
11. Brugbart layout ved 1366×768 uden vandret scroll

Læg til sidst en kort HTML-kommentar øverst i filen med de skjulte grænser og tidskonstanter, du endte med, og hvad du justerede undervejs — så det kan finpudses senere.

---

## 14. Afgrænsning — hvad simulatoren *ikke* skal

- Ingen grafer, akser, målere med skala, procentbjælker eller talfelter
- Ingen dataeksport
- Ingen geografisk korrekt kort. Det er et skematisk tværsnit, tegnet som forsøgskarret
- Ingen havniveaustigning og intet dansk vejrlig ud over landskabsbilledet — det hører til modul 6
- Ingen albedo eller isdække-dynamik — det er modul 7
- Ingen quiz, score, facit eller "godt gået"-feedback
- Ingen brugerkonti, ingen lagring

---

## 15. Baggrundsmateriale i modulmappen

- `res/groenlandspumpen-forsoegsopstilling.png` samt `groenlandspumpen-normal-tilstand.jpg` og `-svaekket-tilstand.jpg` — **brug disse som direkte forlæg for scenens layout.** Det digitale og det fysiske forsøg skal kunne genkendes som det samme
- `res/amoc-havstroemme.jpg`, `res/det-store-transportbaand.jpg`, `res/havcirkulation-verdenskort.jpg` — figurer eleverne allerede har set; pile- og farvesproget må gerne ligne
- `res/5 Arktis og klimaforandringer.pdf` — OneNote-eksporten, modulets primære kilde
- `Opgaver og vejledninger/5 Grønlandspumpen.docx` — forsøgsvejledningen, som simulatoren er forlængelsen af
- `Opgaver og vejledninger/Begrebsliste 5.docx` — de seks begreber. Simulatorens få ord skal ligge tæt op ad dem
