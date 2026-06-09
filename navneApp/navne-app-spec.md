# Navne-huske app — Komplet programmeringsspecifikation

## Oversigt

En Progressive Web App (PWA) til lærere, der hjælper med at lære elevnavne via spaced repetition, kønsopdelte quizzes og forskningsbaserede mnemonik-teknikker. Appen er single-user, hostes på GitHub Pages og bruger Firebase til data og billeder.

---

## Tech stack

| Lag | Teknologi |
|---|---|
| Frontend | Vanilla JavaScript (ES modules), HTML5, CSS3 |
| Hosting | GitHub Pages (statisk) |
| Database | Firebase Firestore |
| Billedlager | Firebase Storage |
| Auth | Firebase Authentication (Google Sign-In) |
| PWA | Web App Manifest + Service Worker |

Ingen frameworks. Ingen build-step. Rent og simpelt, kan redigeres direkte i VS Code og deployes med git push.

---

## Firebase opsætning

### Projekt

Opret et **nyt, separat** Firebase-projekt (adskilt fra andre projekter). Aktivér:
- Authentication → Google Sign-In provider
- Firestore Database
- Storage (kræver Blaze/pay-as-you-go plan, men gratis inden for kvoterne)

### Firebase config

Placer Firebase-konfigurationen i `js/firebase-config.js`:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-storage.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teachers/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /teachers/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## Datamodel (Firestore)

### Struktur

```
/teachers/{uid}/
  /classes/{classId}/
    name: string              // fx "2.b Naturgeografi"
    createdAt: timestamp

  /students/{studentId}/
    name: string              // Fulde navn, fx "Rasmus Kjær"
    gender: string            // "male" | "female" | "other"
    classId: string           // reference til klasse
    hints: string             // fri tekst, fx "rødhåret, stor, sidder altid forrest"
    nameAnchor: string        // mnemonisk anker for NAVNET, fx "Rasmus → raslebæger"
    photoUrls: array<string>  // Firebase Storage download-URLs, én eller flere
    level: number             // 1 = valgliste, 2 = fri tekst
    nextReview: timestamp     // hvornår skal kortet næste gang dukke op
    easeFactor: number        // spaced repetition ease factor, start 2.5
    interval: number          // antal dage til næste review, start 1
    repetitions: number       // antal korrekte svar i træk
    confusedWith: array<string> // studentId'er som brugeren forveksler denne elev med
    createdAt: timestamp
    lastSeen: timestamp

  /sessions/{sessionId}/
    classId: string
    startedAt: timestamp
    completedAt: timestamp
    results: array<{
      studentId: string,
      stimulus: string,       // "photo" | "hint"
      correct: boolean,
      usedHint: boolean,      // forbogstav-hjælp brugt
      responseTime: number,   // millisekunder
      answeredWith: string    // hvad brugeren svarede (til forvirringstracking)
    }>
```

---

## Filstruktur

```
/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── app.js               // router og overordnet state
│   ├── auth.js              // login/logout
│   ├── import.js            // billedimport og oprettelse af elever
│   ├── quiz.js              // quiz-logik og session-håndtering
│   ├── srs.js               // spaced repetition algoritme (SM-2)
│   ├── confusion.js         // forvirringstracking
│   ├── students.js          // CRUD på elever
│   ├── classes.js           // CRUD på klasser
│   └── ui.js                // genbrugelige UI-komponenter
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## PWA-konfiguration

### manifest.json

```json
{
  "name": "Navne-app",
  "short_name": "Navne",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2c3e50",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (service-worker.js)

Cacher app-skallen (HTML, CSS, JS) så appen indlæses hurtigt. Billeder fra Firebase Storage caches **ikke** — de hentes altid fra nettet.

```javascript
const CACHE_NAME = 'navne-app-v1';
const ASSETS = ['/', '/index.html', '/css/style.css', '/js/app.js' /* osv. */];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  // Kun cache egne app-filer, ikke Firebase-kald
  if (e.request.url.includes('firebasestorage') || 
      e.request.url.includes('firestore')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
```

---

## Authentication

Kun Google Sign-In. Appen er single-user — der er ingen brugeroprettelse, ingen profiler.

- Ved app-load: tjek om bruger er logget ind
- Hvis ikke: vis login-skærm med "Log ind med Google"-knap
- Ved login: gem `user.uid` i state — bruges som rod i al Firestore-adgang
- Ved logout: ryd state og vis login-skærm igen

```javascript
// auth.js
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

export function initAuth(onLogin, onLogout) {
  onAuthStateChanged(auth, user => {
    if (user) onLogin(user);
    else onLogout();
  });
}

export function login() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
```

---

## Import-flow

### Brugerflow

1. Bruger vælger eller opretter en klasse
2. Bruger trækker et eller flere billeder ind i et drop-zone (eller bruger file picker)
3. For hvert billede: filnavnet (uden extension) bruges som elevnavn
4. Appen komprimerer billedet til max 400×400 pixels via Canvas API
5. Det komprimerede billede uploades til Firebase Storage under stien:
   `teachers/{uid}/students/{studentId}/{timestamp}.jpg`
6. Der oprettes et nyt elevdokument i Firestore med `level: 1`, default `easeFactor: 2.5`
7. Brugeren gennemgår herefter de nyoprettede elever ét for ét og tagger køn

### Billedkomprimering (i browseren)

```javascript
// import.js
function compressImage(file, maxSize = 400) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
```

### Filnavn-parsing

Filnavne forventes i formatet `Fornavn Efternavn.jpg` eller `Fornavn_Efternavn.jpg`. Underscores erstattes med mellemrum. Extension fjernes.

### Ekstra billeder

En elev kan have flere billeder. På elevkortet (redigeringsvisning) er der en knap "Tilføj billede" der åbner file picker og uploader yderligere billeder til samme elevs `photoUrls`-array.

### Kønstagging efter import

Efter import vises alle nye elever uden kønsmærkning i en hurtig tagging-flow:
- Elevens navn og billede vises
- Tre knapper: ♂ Dreng / ♀ Pige / ⚧ Andet
- Tryk → gem → næste elev automatisk
- Kan springes over og gøres senere

---

## Quiz-system

### Session-opstart

Brugeren vælger en klasse og starter en session. Appen henter alle elever fra den valgte klasse og beregner hvilke der skal med i sessionen:

1. Elever med `nextReview <= nu` (forfaldne) — prioriteres
2. Nye elever (aldrig set, `repetitions === 0`) — max 5 nye per session
3. Elever brugeren tidligere har forvekslet — inkluderes altid parvis (se Forvirringstracking)

### Stimulus-valg

For hvert kort vælges stimulus tilfældigt (50/50) hvis eleven har **både** fotos og hints. Har eleven kun ét, bruges det. Stimulus-typer:

- `"photo"` — et tilfældigt billede fra elevens `photoUrls`-array vises
- `"hint"` — elevens hint-tekst vises som stiliseret tekst-kort

### Niveau 1 — Valgliste

- Stimulus vises (foto eller hint)
- Fire navne præsenteres som valgmuligheder
- **Alle fire navne skal være samme køn som den korrekte elev**
- De tre forkerte ("distractors") trækkes fra samme klasse først; hvis der ikke er nok af samme køn, trækkes fra andre klasser i samme lærers data
- Brugeren trykker på et navn
- Korrekt: kort animation, vis korrekt svar, gå videre
- Forkert: vis korrekt svar, vis hvad brugeren trykkede — vent 2 sekunder inden man kan gå videre (dwelleffekt)

### Niveau 2 — Fri tekst

- Stimulus vises (foto eller hint)
- Tekstfelt til fri input
- Sammenligning er case-insensitiv og trimmer whitespace
- Korrekt: positiv feedback, gå videre
- Forkert: vis korrekt svar og hvad brugeren skrev, vent 2 sekunder
- Der er **ingen auto-complete** — det er meningen at det er svært

### Forbogstav-hjælp

- En diskret "Hjælp"-knap er synlig under quizzen på begge niveauer
- Tryk → det første bogstav i fornavnet vises, fx "R..."
- Brugen af hjælp registreres på kortet (`usedHint: true` i session-resultatet)
- Elever hvor hjælp er brugt rykker **ikke** op i niveau, selv ved korrekt svar
- Elever hvor hjælp er brugt får kortere `interval` i spaced repetition

### Progression mellem niveauer

| Hændelse | Handling |
|---|---|
| Niveau 1, korrekt, ingen hjælp | Rykker op til niveau 2 |
| Niveau 1, korrekt, hjælp brugt | Forbliver niveau 1 |
| Niveau 1, forkert | Forbliver niveau 1 |
| Niveau 2, korrekt, ingen hjælp | Spaced repetition opdateres positivt |
| Niveau 2, korrekt, hjælp brugt | Spaced repetition opdateres minimalt |
| Niveau 2, forkert | Ryger tilbage til niveau 1 |

---

## Spaced Repetition (SM-2 algoritme)

Implementér SM-2 algoritmen, som er veldokumenteret og bruges i Anki.

### Variabler per elev

```javascript
{
  easeFactor: 2.5,   // start-værdi, justeres op/ned
  interval: 1,       // antal dage til næste genvisning
  repetitions: 0     // antal korrekte svar i træk
}
```

### Algoritme ved korrekt svar (niveau 2, ingen hjælp)

```javascript
function updateSRS(student, quality) {
  // quality: 0-5 skala
  // 5 = perfekt og hurtigt, 4 = korrekt, 3 = korrekt med hjælp
  // 0-2 = forkert (bruges til niveau-nedrykning)

  if (quality >= 3) {
    if (student.repetitions === 0) student.interval = 1;
    else if (student.repetitions === 1) student.interval = 6;
    else student.interval = Math.round(student.interval * student.easeFactor);

    student.repetitions += 1;
  } else {
    student.repetitions = 0;
    student.interval = 1;
  }

  student.easeFactor = Math.max(1.3,
    student.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  student.nextReview = daysFromNow(student.interval);
  return student;
}
```

### Quality-mapping

| Situation | Quality |
|---|---|
| Korrekt, under 3 sekunder, ingen hjælp | 5 |
| Korrekt, ingen hjælp | 4 |
| Korrekt, hjælp brugt | 3 |
| Forkert | 1 |

### Ved forkert svar på niveau 2

- `quality = 1` → SM-2 beregning
- Eleven rykkes ned til niveau 1
- `interval` nulstilles til 1 dag

---

## Forvirringstracking

Når brugeren svarer forkert, gemmes **hvad de svarede**:

```javascript
// I session-resultatet:
{ studentId: "abc", correct: false, answeredWith: "studentId-xyz" }
```

Efter sessionen analyseres resultaterne:

- Hvis bruger har forvekslet A med B (eller B med A) mere end én gang, tilføjes de til hinandens `confusedWith`-arrays
- Ved næste sessions planlægning: hvis A er i sessionen og A har B i `confusedWith`, inkluderes B **altid** i samme session — og de to præsenteres tæt på hinanden

### Forvirringspar i quiz-UI

Når to elever er "forvirrede", vises de efter hinanden i sekvensen. En subtil indikator (fx en lille ikon) kan vise "disse to blander du tit" — men dette er valgfrit og må ikke forstyrre quizzen.

---

## Elevkort — redigeringsvisning

Uden for quiz-mode kan brugeren se og redigere alle elever i en klasse. For hver elev:

- Vis alle fotos (carousel/thumbnail-række)
- Knap: "Tilføj foto" → file picker → upload og komprimer
- Knap: "Slet foto" på hvert foto
- Redigerbart felt: Navn
- Dropdown: Køn (Dreng / Pige / Andet)
- Tekstfelt: Hints om eleven (fx "rødhåret, høj, bærer altid hættetrøje")
- Tekstfelt: Navne-anker (fx "Rasmus → raslebæger → hans urolige energi")
- Vis nuværende niveau og `nextReview`-dato
- Knap: "Nulstil progression" → sætter level til 1, easeFactor til 2.5

---

## UI og navigation

### Sider / views (single-page app med hash-routing)

```
#/login          — login-skærm
#/classes        — oversigt over klasser (startside efter login)
#/classes/new    — opret ny klasse
#/classes/{id}   — klasseoversigt med elever og quiz-knap
#/import/{id}    — import-flow for en klasse
#/quiz/{id}      — quiz-session
#/students/{id}  — redigér enkelt elev
```

### Design-principper

- Mobilfirst — store touch-targets (min 48×48px)
- Høj kontrast — læsbart i alle lysforhold
- Minimal chrome under quiz — alt der distraherer skal væk
- Fejlsvar dvæler i 2 sekunder — ikke til at skynde sig forbi
- Progressionsbar øverst i quiz-session ("12 af 28 elever gennemgået")
- Statistik-visning på klassesiden: "Du kender X/Y sikkert (niveau 2)"

### Farveskema (forslag)

```css
:root {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-primary: #2c3e50;
  --color-accent: #3498db;
  --color-correct: #27ae60;
  --color-wrong: #e74c3c;
  --color-hint: #f39c12;
  --color-text: #2c3e50;
  --color-text-muted: #7f8c8d;
  --border-radius: 12px;
}
```

---

## Statistik-side (per klasse)

Vis:
- Antal elever i klassen
- Antal på niveau 1 / niveau 2 / mestret (interval > 21 dage)
- Antal forfaldne til review i dag
- De 5 elever med lavest easeFactor (dem du har sværest ved)
- De par du oftest forveksler

---

## Konkrete implementeringsopgaver (rækkefølge)

1. **Firebase projekt** — opret, konfigurér auth/firestore/storage, sæt security rules
2. **Auth-flow** — login/logout med Google, onAuthStateChanged
3. **Klasse-CRUD** — opret, vis, slet klasser
4. **Import-flow** — drag-and-drop, filnavn-parsing, billedkomprimering, Storage-upload, Firestore-oprettelse
5. **Kønstagging-flow** — hurtig gennemgang efter import
6. **Elevkort-redigering** — vis/rediger alle felter, tilføj/slet fotos
7. **Quiz niveau 1** — valgliste med kønsfiltrede distractors
8. **Quiz niveau 2** — fri tekst med dwelleffekt ved fejl
9. **Forbogstav-hjælp** — reveal og registrering
10. **SM-2 algoritme** — beregning og Firestore-opdatering efter hvert svar
11. **Forvirringstracking** — registrér fejlsvar, byg forvirringspar, inkludér i session-planlægning
12. **PWA** — manifest.json, service worker, iOS-meta-tags
13. **Statistik-side** — klasseoversigt med tal og forvirringspar
14. **Polish** — animationer, fejlhåndtering, offline-feedback

---

## Vigtige edge cases

- **Klasse med få elever af ét køn**: Hvis der er under 4 elever af samme køn i klassen, supplér distractors fra andre klasser. Har ingen andre klasser elever af det køn, reducér til 2-3 valgmuligheder i stedet for 4.
- **Elev uden foto og uden hint**: Sådanne elever kan ikke quizzes og skal markeres tydeligt i redigeringsvisningen med en advarsel.
- **Samme filnavn ved import**: Hvis to filer har samme navn (og altså samme elev-navn), spørg brugeren om det er ekstra fotos til en eksisterende elev eller en ny elev.
- **Netværksfejl under upload**: Vis progress-indikator ved billedupload. Ved fejl: bevar lokalt komprimeret billede og tilbyd at prøve igen.
- **Fornavn vs. fuldt navn ved fri tekst**: Acceptér både fornavn alene og fuldt navn som korrekt svar. Sammenlign case-insensitivt og trim whitespace.

---

## Hvad der IKKE er i scope (bevidste fravalg)

- Siddepladsvisning / klasseværelseskort
- Deling med kolleger / multi-user
- Offline quiz (billeder kræver netværk)
- Notifikationer / push reminders
- Eksport af data
- Mørkt tema
