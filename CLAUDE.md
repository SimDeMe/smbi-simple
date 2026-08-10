# smbi.dk

Undervisningssite med interaktive simuleringer til naturgeografi og biologi på
gymnasieniveau. Statiske HTML-sider, ingen build, ingen framework — hostet på
GitHub Pages (`CNAME` → smbi.dk). Alt indhold er på **dansk**, også kommentarer,
commit-beskeder og variabelnavne i nyere filer.

## Sådan ser man en side

```bash
python3 -m http.server 8777       # og åbn http://localhost:8777/...
```

Sider linker til `/geografi.html`, `/contact.html` osv. med rod-relative stier,
så de kun virker rigtigt over en server — ikke via `file://`.

---

# Designskabelon — gælder alle nye sider

Sitet er ved at blive lagt om til ét fælles formsprog: **papirfarvet baggrund,
sorte blækrammer, hårde skygger, regnbuestribe og tre skrifter.** Nye sider
skal følge skabelonen herunder. Kopiér fra en side, der allerede er lagt om.

**Referencer, i prioriteret rækkefølge:**

| Fil | Bruges som forlæg til |
| --- | --- |
| `index.html` + `forside.css` | forside, kort, sektioner, knapper |
| `geografi/Stigningsregn.html` | simulering med canvas + skydere + instrumenter |
| `geografi/drivhuseffektenSimpel.html` | trinvis SVG-figur med forklaringsspalte |

Lagt om indtil videre: forsiden, fagforsiderne, `Stigningsregn.html`,
`drivhuseffektenSimpel.html`, `drivhuseffekten.html`,
`poroesitetPermeabilitet.html`, `TermiskTryk3.html`,
`biologi/transkription.html` (eneste biologi-side — brug den som forlæg, når
`--accent:var(--bio)` skal bruges). Resten af `geografi/`, `biologi/` og
`style.css`-siderne kører stadig det gamle design — rør dem kun, når opgaven
handler om dem.

## 1. Tokens — kopiér uændret ind i `:root`

```css
:root{
  --paper:#FFF9EE;  --paper-2:#FFF3DC;  --panel:#FFFFFF;
  --ink:#17211F;    --slate:#566B68;

  --pink:#E8336D; --blue:#0E86C8; --lime:#5FB030; --amber:#FFB300;
  --grape:#7A4FD6; --coral:#FF6A3D; --teal:#0FA593;

  --bio:var(--pink);   /* biologi-sider */
  --geo:var(--blue);   /* geografi-sider */
  --accent:var(--geo); /* sidens egen farve — sæt én gang, brug overalt */

  --display:'Archivo',system-ui,sans-serif;
  --body:'Source Serif 4',Georgia,serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;

  --wide:'wdth' 118;
  --max:1180px;        /* 980px, hvis siden er én smal spalte */

  --hard:4px 4px 0 var(--ink);
  --hard-lg:7px 7px 0 var(--ink);
}
```

Skrifterne hentes fra Google Fonts i `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,300..600&display=swap" rel="stylesheet">
```

**Sådan bruges de tre skrifter:**

* `--display` (Archivo) — overskrifter, knapper, tal i instrumenter, mærkater i
  SVG. Altid `font-weight:700–800`; overskrifter får
  `font-variation-settings:var(--wide)` og negativ `letter-spacing`.
* `--body` (Source Serif 4) — al brødtekst. Sidens `font-size` er `17px`.
* `--mono` (IBM Plex Mono) — etiketter, enheder, øjenbryn, fodnoter. Altid
  `text-transform:uppercase; letter-spacing:0.12–0.14em` og lille (≈0.6rem).
  Klassen `.mono` findes færdig.

**Farvebrug:** højst én accentfarve pr. side (`--accent`). Regnbuen bruges kun
i topstriben og i brandmærket. Lyse toner til flader: `#C7E6F6` blå,
`#FBD3E1` pink, `#D6EFC4` grøn, `#E2D6F8` lilla, `#FFD9C9` koral,
`#FFE9DC` "pas på"-bokse.

## 2. Sidens skelet

Rækkefølgen er altid den samme:

```html
<header class="top" id="site-top">
  <div class="rainbow"></div>              <!-- 7 px regnbuestribe -->
  <div class="top-bar"> brand + .top-nav </div>
</header>

<main>
  <div class="wrap head">                  <!-- sidehoved -->
    <span class="eyebrow mono"><span class="blink"></span>Fag · emne</span>
    <h1>Titel med <span class="hi" style="--hc:#C7E6F6">fremhævning</span></h1>
    <p class="lead">Én sætning om hvad man gør her.</p>
  </div>

  <div class="wrap">
    <section class="rig"> ... selve simuleringen ... </section>
  </div>
</main>

<footer class="foot"> brand + .foot-links </footer>
```

Fast krom, der skal med på hver side:

* **Topbjælken** er `position:sticky` med `border-bottom:2px solid var(--ink)`
  og halvgennemsigtig papirbaggrund + `backdrop-filter:blur(10px)`.
  Brandet er `smbi.dk` med `.brand-mark` (conic-gradient-firkant med blækkant).
  Undersider har to links: faget og forsiden.
* **`.hi`** lægger en skæv farveklat bag et ord i `h1` (`--hc` styrer farven).
* **Bunden** er `--ink`-flade med `#FFF6E0` tekst og pilleformede links.
* **Ingen `.smbi-home`-knap mere.** Den flydende hjem-knap i gammelt design
  erstattes af topbjælkens navigation.
* **Iframe-krom:** sidste script på siden skjuler `#site-top`, `.foot` og
  `.head`, når `window.top !== window.self`, så figuren kan lægges i en iframe.

## 3. `.rig` — signaturpanelet

Alt interaktivt bor i ét panel:

```
.rig        hvid flade, border:2.5px solid ink, radius 18px, box-shadow var(--hard-lg)
 ├ .rig-bar   9 px stribe i --accent
 ├ .rig-head  lys stribe (#E7F4FB) med pulserende .dot + .mono-status,
 │            værktøjsknapper (.btn-mini) til højre
 ├ .stage     selve figuren: prikket baggrund
 │            radial-gradient(circle at 1px 1px,#E6EDEB 1px,transparent 0) 0 0/16px 16px
 │            canvas/svg har selv border:2px solid ink + radius 12px
 ├ .gauges    instrumenter i et grid, adskilt af 2 px blækstreger,
 │            hver med sin lyse baggrund (#FFF1EC, #F1ECFC, #EDF8E4, #E7F4FB)
 ├ .knobs     skydere på --paper-2
 └ .facts     pilleformede nøgletal/signaturforklaring nederst
```

Kun de dele, siden har brug for. Alle indre rækker adskilles med
`border-top:2px solid var(--ink)` — panelet skal se ud som ét apparat.

**Knapper:** blækkant, hård skygge, og de flytter sig ved klik.

```css
.btn:hover  {transform:translate(-2px,-2px); box-shadow:6px 6px 0 var(--ink)}
.btn:active {transform:translate(2px,2px);   box-shadow:1px 1px 0 var(--ink)}
```

`.btn-mini` er den lille udgave (2 px skygge) til `.rig-head`.

**Skydere** styles i alle tre browsere (`::-webkit-slider-runnable-track`,
`::-webkit-slider-thumb`, `::-moz-range-track`, `::-moz-range-thumb`): 10 px
bane med blækkant, 22 px rund gribeknap med blækkant og hård skygge. Hver
slider får sin egen `--track`-gradient og `--kc`-knapfarve.

## 4. Faste krav til hver side

* **`<html lang="da">`**, sigende `<title>` der ender på `— smbi.dk`, og en
  `<meta name="description">` på én sætning.
* **Tilgængelighed:** `:focus-visible{outline:3px solid var(--grape)}`,
  `aria-label` på figurer, `aria-live="polite"` på det felt der ændrer sig,
  `<title>`/`<desc>` i SVG'er, og et skjult statusfelt (`.sr`) til skærmlæsere.
  Betjening skal kunne klares med tastatur alene.
* **Farve er aldrig eneste signal** — kombinér med stregtype, mærkat eller form
  (fx kortbølget = fuldt optrukket, langbølget = stiplet).
* **Responsivt:** brydepunkter ved 960 px (to spalter → én), 700 px (brede
  SVG'er får deres egen vandrette rulning med `min-width`, resten af siden
  ruller kun lodret) og 620 px (mindre skrift, `--hard` i stedet for
  `--hard-lg`, padding 16 px).
* **`@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`**
* **`@media print`** — skjul `.top`, `.foot` og navigationsknapper, så det
  aktuelle billede kan komme på ét A4.
* **Rammen skal stå stille.** Har siden trin eller tilstande med forskellig
  mængde tekst, må panelet ikke hoppe i højden, når man klikker videre — så
  flytter figuren, knapperne og trinprikkerne sig for hvert klik. Mål alle
  tilstande én gang ved indlæsning og lås panelet til den højeste
  (`min-height` i px); mål igen ved `resize`, ved skift af projektortilstand
  og på `document.fonts.ready`. Den plads, der bliver til overs på de korte
  trin, samles ét sted (fx ved at hænge navigationen i bunden med
  `margin-top:auto`), og indhold der kun vises i ét trin, får sin plads
  reserveret med `visibility:hidden` frem for `hidden`/`display:none`.
  Låsen gælder kun to-spaltelayoutet — under 960 px står tingene under
  hinanden, og der ville den kun give dødt luftrum.
* **Deling og tavle:** hvis siden har trin eller tilstande, så afspejl dem i
  `location.hash` (`#trin=3`) og accepter dem også som query (`?trin=3`).
  Projektortilstand (`?projektor=1` / `?mode=teach`) skjuler sidens krom og
  skalerer teksten op.
* **Ingen eksterne afhængigheder** ud over Google Fonts. Ingen build, ingen
  npm-pakker, ingen ikonbibliotek-CDN i nye sider.

## 5. Når fysikken/modellen ændres

Simuleringernes beregninger er undervisningsindhold. Ved omlægning af designet
skal modellen være **uændret** — omskriv kun rammen, og kontrollér resultatet
mod den gamle udgave over et gitter af inputkombinationer, før du kalder det
færdigt (sådan blev `Stigningsregn.html` lagt om: 0 afvigelse over 250
kombinationer).

## 6. Commits

Danske, i bydeform, med en kort forklarende krop når ændringen er stor. Fx:
`Stigningsregn i sidens nye design: samme model, pænere ramme`.
