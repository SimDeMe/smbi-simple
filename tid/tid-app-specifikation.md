# Specifikation: Tidsregistreringsapp til gymnasielærer (Fase 1)

## Formål
En privat webapp til at registrere arbejdstid på de aktiviteter, der står i ens opgavefordeling som gymnasielærer. Skal kunne sammenligne forbrugt tid med budget. Fungerer på iPhone (PWA via Safari hjemmeskærm) og desktop. Data synkroniseres mellem enheder via Firebase. Kun én bruger (udvikleren selv).

## Teknologivalg
- Vanilla JavaScript, HTML, CSS — ingen frameworks
- Firebase Firestore som database
- Firebase Authentication med Google sign-in
- Hostes som statiske filer på GitHub Pages
- Progressive Web App (PWA) til iPhone-hjemmeskærm
- Mobile-first design, responsivt

## Filstruktur
```
/tid/
  index.html
  app.js
  styles.css
  firebase-config.js   (Firebase credentials)
  manifest.json
  service-worker.js
  icons/
```

## Firebase
Brugeren leverer `firebaseConfig` i `firebase-config.js`. Brug Firebase v10+ modulær SDK via CDN. Aktivér Firestore offline-persistens.

## Centrale begreber

**Aktivitet** = en linje i opgavefordelingen. Enten et hold (med faste arbejdstyper undervisning/forberedelse/retning) eller en opgave (registreres direkte). Hver aktivitet har et timebudget for skoleåret. Opgave-aktiviteter kan have under-aktiviteter (fx SRP under "Eksamen og årsprøver").

**Arbejdstype** = kun relevant for hold. Tre faste: undervisning, forberedelse, retning.

**Tidsregistrering** = en post med start og slut. Knyttes til en aktivitet og — hvis aktiviteten er et hold — også til en arbejdstype.

## Datamodel i Firestore

Alt under `users/{userId}/`:

**`activities/{activityId}`** — Aktiviteter:
```
{
  name: "3g Ng",
  type: "hold" | "opgave",
  parentId: null | "activityId",   // kun for opgave-aktiviteter
  budgetHours: 288,
  color: "#3b82f6",
  schoolYear: "2026/27",
  order: 1,
  isArchived: false,
  note: ""                          // valgfri kommentar fra opgavefordelingen, fx "5 stk"
}
```

Regler:
- Hold må ikke have parentId (ingen hierarki for hold)
- En under-aktivitets `schoolYear` skal matche forælderens

**`entries/{entryId}`** — Tidsregistreringer:
```
{
  activityId: "activityId" | null,  // null hvis "udefineret"
  workType: "undervisning" | "forberedelse" | "retning" | null,  // kun ved hold
  startTime: Timestamp,
  endTime: Timestamp | null,        // null = aktiv
  durationMinutes: 90,              // beregnet ved afslutning
  note: "",
  isModule: false,
  autoStopped: false
}
```

**`settings/config`** — Indstillinger:
```
{
  schoolYearStartMonth: 8,
  schoolYearStartDay: 1,
  moduleLengthMinutes: 90,
  autoStopAfterMinutes: 240,
  weekStartsOn: 1,
  currentSchoolYear: "2026/27"     // den aktive der vises som standard
}
```

## Forudefinerede aktiviteter
Ingen aktiviteter oprettes automatisk. Ved første login vises en "kom-i-gang"-side hvor brugeren bliver bedt om at oprette sine første aktiviteter (eller indstillinger), inden hovedskærmen vises. Vis evt. en eksempel-liste baseret på en typisk opgavefordeling.

## Arbejdstyper for hold
Faste tre, kan ikke ændres:
- Undervisning
- Forberedelse
- Retning

## Funktionalitet — Fase 1

### 1. Login + first-run
- Ved første besøg: "Log ind med Google"-knap
- Efter login, hvis brugeren ikke har nogen aktiviteter endnu: vis onboarding hvor de opretter første aktiviteter og indstillinger
- Log ud-knap i indstillinger

### 2. Hovedskærm

**Øverst — Aktiv timer (hvis nogen kører):**
- Aktivitet, evt. arbejdstype, forløbet tid (opdateres hvert sekund)
- "Stop"-knap

**Hurtig-start:**
- Knapper for de mest brugte aktiviteter (mest brugte øverst, baseret på de seneste 30 dage; fald tilbage til `order`-felt)
- Tryk på en hold-aktivitet → spørg hvilken arbejdstype (undervisning/forberedelse/retning) → start timer
- Tryk på en opgave-aktivitet → start timer direkte
- Tryk på en parent-aktivitet → vælg child eller "generelt" (registreret på parent)
- Hvis en timer kører: stoppes automatisk, ny starter (intet popup)

**Specialknapper:**
- **"Start arbejde"** — starter udefineret registrering (activityId: null). Brugeren kan senere redigere posten og knytte den til en aktivitet.
- **"1 modul"** — kun for hold-aktiviteter. Spørg hvilket hold + "Hvornår startede modulet?" (Nu / For 90 min siden / Andet tidspunkt). Hvis "Nu": opret aktiv timer med automatisk slut 90 min senere. Hvis bagudrettet: opret færdig post.

### 3. Skift mellem aktiviteter
Tryk på en anden aktivitet mens en timer kører:
- Aktive post afsluttes med nuværende tidspunkt
- Ny post starter umiddelbart efter
- Subtil toast som bekræftelse

### 4. Auto-pause
- Timer der kører over 240 min (konfigurerbar): stop automatisk, marker `autoStopped: true`
- Vis advarsel næste gang appen åbnes

### 5. Historik
Egen side. Liste over alle registreringer, nyeste først. Filter på dato-interval og aktivitet. Hver post kan redigeres (start, slut, aktivitet, arbejdstype, note) eller slettes. Manuel oprettelse af bagudrettet post.

### 6. Rapporter
Egen side. Vælg interval:
- Dag
- Uge
- Måned
- Skoleår

Vis for valgte interval:
- **Samlet:** Total tid forbrugt, og hvis skoleår er valgt: forbrugt / norm (1650t for fuldtid — konfigurerbart i indstillinger). Procent og resterende.
- **Pr. aktivitet:** Liste sorteret efter forbrug. For hver aktivitet: navn, forbrugt tid, budget, procent (fx "142t / 288t — 49%"), visuel progress bar i aktivitetens farve. Under-aktiviteter vises indrykket under deres parent. Parent viser eget forbrug + summen af children.
- **For hold-aktiviteter:** Vis fordeling på undervisning / forberedelse / retning som en lille bar eller tal-række.
- **Forventet vs faktisk:** Hvis vi er X% gennem skoleåret, vis om man er foran/bagud på samlet niveau (lille indikator).
- Simpel cirkel- eller søjlediagram af aktivitets-fordeling (lav i SVG, intet bibliotek).

### 7. Administration af aktiviteter
Egen side "Aktiviteter":
- Listet grupperet efter type (Hold / Opgaver) og skoleår
- Skift mellem skoleår (dropdown)
- Knap "Ny aktivitet": navn, type, parent (hvis opgave), budget, farve, skoleår, note
- Tryk på en aktivitet: redigér eller slet
- Under-aktiviteter vises indrykket under deres parent
- **"Kopiér til næste skoleår"** — opretter samme struktur i et nyt skoleår (uden tidsdata, kun selve aktiviteterne) — gør det nemt når et nyt skoleår begynder
- **"Importer fra tekst"** — simpel tekstindtaster: en linje pr. aktivitet i format `navn; type; budget; parent?` der parses og oprettes. Sparer tid ved opsætning.

### 8. CSV-eksport
Knap "Eksportér" i rapporter:
- Eksportér aktuelt interval
- Format: `dato;starttid;sluttid;varighed_minutter;aktivitet;arbejdstype;note`
- Semikolon (dansk Excel)
- Filnavn: `tidsregistrering-{interval}.csv`

Knap "Eksportér alle data" i indstillinger — komplet JSON backup.

### 9. Indstillinger
Egen side:
- Skoleår: aktivt skoleår, startmåned, startdag, samlet norm-timetal (default 1650)
- Modul-længde
- Auto-stop-grænse
- Ugestart
- Log ud
- Eksport af alle data (JSON)

## UI-design

**Navigation:** Bundnavigation med 5 ikoner:
1. Hjem (timer + hurtig-start)
2. Historik
3. Rapporter
4. Aktiviteter
5. Indstillinger

**Visuelt:**
- Mobile-first, store touch-targets (min 44x44 pt)
- Behageligt lyst tema, CSS-variabler så dark mode kan tilføjes senere
- Dansk overalt
- Tydelig markør når timer kører (pulsende prik / farvet header)
- Hver aktivitet har en farve; brug den konsekvent i lister, knapper, diagrammer

## PWA
- `manifest.json` med navn "Tid", short_name "Tid", display: standalone
- Service worker cacher app-shell for offline brug
- Apple touch icons
- `apple-mobile-web-app-capable` meta-tags

## Tekniske detaljer
- Tidszone: Europe/Copenhagen
- Datoformat: DD-MM-YYYY hvor relevant; ellers dansk format
- Tidsformat: 24-timers
- Varighed: "1t 23m" / "23m" / "2t"
- Skoleår: hvis startmåned er 8 (august), så er "2026/27" = 1. aug 2026 til 31. juli 2027
- Når et hold-aktivitet ikke har specificeret en farve: auto-tildel fra en defineret palet

## Hierarki-håndtering — vigtige regler
- Når man registrerer tid på en under-aktivitet (fx SRP), bidrager tiden også til forælderens samlede forbrug
- Forælderens budget er det totale (inkluderer børnenes "underbudgetter"). Børnenes budgetter må gerne summere til mindre end forælderens — restbudgettet er "general parent time"
- Ved sletning af en parent: spørg om børnene skal slettes eller forfremmes til top-niveau

## Hvad vi IKKE laver i fase 1
- Klasse/hold-specifikke under-aktiviteter (kun opgaver kan have børn)
- Push-notifikationer
- Helligdage / skoleferier
- Skoleuge-nummerering
- Detaljerede prognoser ("med dit nuværende tempo når du X timer")
- Tags ud over selve aktiviteten

## Testkriterier
Appen virker når:
1. Bruger logger ind med Google
2. Bruger opretter første aktiviteter via onboarding
3. Bruger trykker hold "3g Ng" → vælger arbejdstype "Undervisning" → timer starter
4. Bruger trykker "Miljøudvalg" → forrige timer stopper, ny starter
5. Bruger trykker "1 modul" → vælger hold → 90 min registreres
6. Bruger stopper timer
7. Bruger ser dagens og ugens fordeling
8. Bruger ser skoleårets fordeling med forbrugt vs budget pr. aktivitet
9. Bruger ser at SRP-tid også tæller med på parent "Eksamen og årsprøver"
10. Bruger eksporterer CSV
11. Bruger redigerer en post og knytter den til en aktivitet
12. Bruger opretter ny aktivitet med budget
13. Bruger kopierer aktiviteter til næste skoleår
14. Appen installeres som PWA på iPhone
15. Data synkroniseres mellem to enheder

## Implementeringsrækkefølge
1. Projektstruktur, `firebase-config.js` med placeholder
2. Login-flow + first-run onboarding
3. Datamodel + CRUD for aktiviteter (Aktiviteter-skærm)
4. Hovedskærm med timer-funktionalitet (start, stop, skift)
5. "1 modul" og "Start arbejde" specialknapper
6. Historik med redigering og manuel oprettelse
7. Rapporter med budget-sammenligning og hierarki-aggregering
8. CSV-eksport
9. Indstillinger
10. PWA-opsætning + iOS-optimeringer
11. Auto-pause og advarsler

Spørg, hvis noget er uklart, før du begynder at kode.

---

## Sådan bruger du specifikationen i Claude Code

Når du åbner Claude Code i `/tid/`-mappen, kan du starte med noget i stil med:

> *"Læs hele specifikationen nedenfor. Stil opklarende spørgsmål før du begynder at kode. Lad os tage det i den implementeringsrækkefølge der står til sidst — vi tager ét trin ad gangen, og du må gerne vise mig hvad du har bygget løbende. Begynd med trin 1."*
