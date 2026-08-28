# SEO — hvad der er sat op, og hvad en ny side skal have

Sitet er statisk på GitHub Pages, så al SEO ligger i sidernes `<head>` plus to
filer i roden: `robots.txt` og `sitemap.xml`.

## Det faste hoved

Hver offentlig side har — ud over `<title>` og `<meta name="description">` —
denne blok lige under beskrivelsen. Kopiér den fra en side, der ligner, og ret
adresse, titel, beskrivelse og delebillede:

```html
<!-- Deling, ikoner og kanonisk adresse -->
<link rel="canonical" href="https://smbi.dk/biologi/osmose.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="smbi.dk">
<meta property="og:locale" content="da_DK">
<meta property="og:url" content="https://smbi.dk/biologi/osmose.html">
<meta property="og:title" content="Osmose i cellen">
<meta property="og:description" content="…samme sætning som beskrivelsen…">
<meta property="og:image" content="https://smbi.dk/img/og-biologi.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="smbi.dk — biologi: simuleringer, forløb og spil">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFF9EE">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Delebilleder: `img/og-smbi.png` (forside og børn), `img/og-geografi.png`,
`img/og-biologi.png`. Alle er 1200 × 630 px og bygget i sidens eget formsprog.

Nederst i `<head>` står strukturdata som JSON-LD. Simuleringer, opgaver og
vejledninger er `LearningResource` + `BreadcrumbList`, forsiden er `WebSite` +
`Person`, og fagforsiderne er `CollectionPage`. Kopiér fra en tilsvarende side
og ret `name`, `description`, `url`, `about` og `learningResourceType`
(`interaktiv simulering`, `arbejdsark`, `forsøgsvejledning`, `test`,
`undervisningsforløb`).

## Tjekliste, når du laver en ny side

1. `<title>` slutter på `— smbi.dk` og siger, hvad siden er — ikke bare emnet.
2. `<meta name="description">` på én sætning, der beskriver, hvad man **gør**.
3. `<meta name="viewport">` — ellers regnes siden ikke for mobilvenlig.
4. Blokken ovenfor, med sidens egen adresse.
5. Strukturdata i bunden af `<head>`.
6. Adressen ind i `sitemap.xml` med dagens dato i `<lastmod>`.
7. Link til siden fra fagforsiden — en side, der ikke er linket til, bliver
   sjældent fundet.
8. `<script src="/analytics.js"></script>` som sidste linje i `<head>` —
   også på interne sider.

## Besøgstælling

Sitet bruger **Cloudflare Web Analytics** — cookiefri. Der gemmes intet på den
besøgendes udstyr, og der er ingen genkendelse på tværs af besøg, så siden
kræver **ingen samtykkedialog**.

Tælleren ligger i `analytics.js` i roden, og hver side henter den med én linje
sidst i `<head>`:

```html
<!-- Google Analytics -->
<script src="/analytics.js"></script>
```

Token'en står **kun** i `analytics.js`, så tælleren kan skiftes ét sted i
stedet for i 52 filer. Filen springer over sig selv på `localhost`,
`127.0.0.1` og `file://`, så egne besøg under `python3 -m http.server` ikke
havner i statistikken.

Med på alle sider, også de interne — kun `backup-gammelt-design/` og
`smbi-design/` er udenfor, da de ikke er sider, nogen bruger.

**Det Cloudflare ikke kan:** egne hændelser, UTM-parametre og query-strenge
logges ikke. Man kan altså ikke se, hvor langt eleverne når i en trinvis figur
(`?trin=3`), eller hvor tit projektortilstanden bruges. Data er uden stikprøve
i 7 dage, derefter cirka 10 %; historikken går et halvt år tilbage.

## Indlejret indhold udefra

Alt, der hentes fra en anden server, sender den besøgendes IP-adresse derhen.
Derfor:

* **YouTube indlejres ikke direkte.** Videoerne på `geografi.html` er
  klik-for-at-afspille: der vises en knap i sidens eget formsprog, og først
  ved klik indsættes en iframe fra `youtube-nocookie.com`. Koden står i
  `fag.js`, stilen i `forside.css` under `.video-start`. Gør det samme, hvis
  der kommer video på flere sider.
* **Skrifterne ligger lokalt** i `/fonts/`, ikke hos Google. Sider indsætter
  `<link rel="stylesheet" href="/fonts/skrifter.css">`.
* **three.js fra jsDelivr** på de ægte 3D-sider er den aftalte undtagelse.
* Nye sider tilføjer ikke andre eksterne scripts.

### Skriftpakken

`fonts/skrifter.css` er bygget ud fra Google Fonts' egen css2-fil, men peger på
woff2-filer i `/fonts/`. Alle skrifterne er under SIL Open Font License 1.1,
som tillader det. Kun `latin` og `latin-ext` er med.

Skal en skrift skiftes eller en vægt tilføjes:

1. Hent `https://fonts.googleapis.com/css2?family=…` med en moderne browser-UA
   (ellers får du gamle formater i stedet for woff2).
2. Læg de woff2-filer, den peger på, i `/fonts/`.
3. Kopiér `@font-face`-blokkene for `latin` og `latin-ext` ind i
   `fonts/skrifter.css`, og ret `url(…)` til den lokale sti.

### Privatlivspolitik

`privatliv.html` beskriver, hvad sitet registrerer. **Den skal rettes**, hvis
der kommer en ny tjeneste ind på siden — tæller, formular, indlejring — og
datoen nederst opdateres. Alle sider med sidefod linker til den.

## Sider, der ikke skal i søgeresultaterne

Interne sider (`admin.html`, `censorUr.html`, arbejdstidskalenderen, `tid/`,
`navneApp/`, `studiekort/`, `smbi-design/`, `backup-gammelt-design/` og
lærerløsningerne) har `<meta name="robots" content="noindex, follow">` i stedet
for delingsblokken. De er med vilje **ikke** spærret i `robots.txt` — en
spærret side kan robotten ikke hente, og så læser den heller ikke `noindex`.
