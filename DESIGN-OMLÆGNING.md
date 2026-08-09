# Omlægning til det nye design — prioriteret plan

Status pr. 9. august 2026. Skabelonen er beskrevet i `CLAUDE.md`.
Forlæg: `index.html` + `forside.css`, `geografi/Stigningsregn.html`,
`geografi/drivhuseffektenSimpel.html`.

**Lagt om: 3 sider. Tilbage: 45.**

Rækkefølgen nedenfor er valgt efter, hvad eleverne og du selv møder oftest,
ikke efter hvad der er nemmest.

---

## Etape 0 — luk hullerne i det, der allerede er lagt om

Små rettelser på sider, der ellers er færdige. Ordn dem først, så forlæggene
er fuldt korrekte, inden de kopieres videre.

| Fil | Mangler | Linjer |
| --- | --- | --- |
| `geografi/Stigningsregn.html` | `aria-live="polite"` på aflæsningsfeltet, skjult `.sr`-statusfelt, `#trin`/`?projektor=1`-understøttelse | 1087 |
| `index.html` | `@media print` | — |
| `forside.css` | `@media print` (skjul `.top`/`.foot`) | — |

Desuden to indholdsfejl, der bør med i samme omgang:

* `geografi.html` linker **ikke** til `groenlandspumpen.html` og
  `straalingsbalance.html`, selvom forsiden gør.
* `biologi.html` linker **ikke** til `DNA_Simulering.html`,
  `transkription.html` og `bio-tree.html`.

---

## Etape 1 — fagforsiderne (højeste synlighed, lavest indsats)

Forsiden er lagt om, men de to sider, den sender flest brugere videre til,
kører stadig det gamle pergament-design fra `style.css`. Det er det mest
iøjnefaldende brud lige nu, og begge sider er små.

1. **`geografi.html`** (181 linjer) — kortgitter efter forlæg fra `index.html`,
   `--accent:var(--geo)`. Tilføj de to manglende links.
2. **`biologi.html`** (108 linjer) — samme, `--accent:var(--bio)`. Tilføj de tre
   manglende links.

Ingen model, ingen canvas. Kan gøres på én arbejdsgang og giver hele sitet et
sammenhængende indtryk fra forside til fagforside.

---

## Etape 2 — de tunge geografi-simulationer

Alle seks har deres eget ad-hoc-formsprog med filspecifikt præfiks
(`--dh-*`, `--gp-*`, `--pp-*` …) og den gamle flydende `.smbi-home`-knap.

> **Krav ved hver enkelt:** modellen skal være **uændret**. Kontrollér mod den
> gamle udgave over et gitter af inputkombinationer, før den kaldes færdig —
> som ved `Stigningsregn.html` (0 afvigelse over 250 kombinationer).

| # | Fil | Linjer | Indhold | Bemærkning |
| --- | --- | --- | --- | --- |
| 3 | `geografi/poroesitetPermeabilitet.html` | 2165 | 4 canvas, 4 svg, 2 skydere | Nyeste sim, men bygget i gammelt formsprog. Størst fil — læg tid ind til den. |
| 4 | `geografi/drivhuseffekten.html` | 1955 | 3 svg, 9 skydere, iframe | Har allerede `?mode=explore/quiz/teach`; bevar dem og læg `#trin` oveni. Den lille søster er forlæg. |
| 5 | `geografi/TermiskTryk3.html` | 1210 | canvas + svg, 6 skydere | Klassisk `.rig`-opsætning — `Stigningsregn.html` passer næsten 1:1. |
| 6 | `geografi/groenlandspumpen.html` | 1153 | canvas + 15 svg, 2 skydere | Mange SVG-lag; afsæt tid til `<title>`/`<desc>` og stregtype som andet signal end farve. |
| 7 | `geografi/straalingsbalance.html` | 966 | 2 svg, 6 skydere | Ren instrumentside — `.gauges` + `.knobs`. |
| 8 | `geografi/Dugpunkt.html` | 324 | canvas + svg, 2 skydere | Mindst af dem. God at tage som opvarmning, hvis etape 2 skal deles op. |

---

## Etape 3 — biologi-simulationerne

Samme øvelse på biologisiden. Her skal `--accent:var(--bio)` bruges.

| # | Fil | Linjer | Indhold |
| --- | --- | --- | --- |
| 9 | `biologi/KvindensCyklus/FinalSim.html` | 1322 | 3 canvas, 1 skyder |
| 10 | `biologi/transkription.html` | 711 | 2 svg, trinvis |
| 11 | `biologi/DNA_Simulering.html` | 684 | svg, trinvis — `drivhuseffektenSimpel.html` er forlæg |
| 12 | `biologi/enzymhastighed.html` | 635 | 5 canvas, 3 skydere |
| 13 | `biologi/osmose.html` | 389 | canvas + svg, 2 skydere |
| 14 | `bio-tree.html` | 230 | svg-netværk |
| 15 | `bio-glass/index.html` | 152 | canvas; har egen `style.css` — skal fjernes |
| 16 | `biologi/bio-blocks/index.html` | 129 | 2 svg; har egen `style.css` — skal fjernes |

`biologi/bio-blocks.html` er kun en redirect på 12 linjer og skal ikke røres.

---

## Etape 4 — øvrige indgangssider

Små sider, som stadig hænger på `style.css`. Kan tages samlet på én gang, når
etape 1–3 er i hus.

| # | Fil | Linjer |
| --- | --- | --- |
| 17 | `contact.html` | 105 |
| 18 | `born.html` | 68 |
| 19 | `admin.html` | 105 |

---

## Etape 5 — opgaver og vejledninger

Ren tekst og arbejdsark. De skal typisk kunne printes, så `@media print` er
det vigtigste her — ikke `.rig`. Overvej en let variant af skabelonen:
topbjælke + `.wrap head` + brødtekst, uden instrumentpanel.

**GeoOpgaver** (6): `Demografisk_transition_NF.html` (315) ·
`Demografisk_transition_NF_SVAR.html` (308) · `Vandets kredsløb-c-niv.html` (293) ·
`stigningsregn-HF-niv.html` (234) · `stigningsregn-C-niv.html` (232) ·
`oplande-C-niv.html` (95)

**GeoVejledninger** (3): `JordUndersøgelse_HF/` (297) ·
`konvektionskammer/` (271) · `JordUndersøgelse/` (233)

**BiologiC/NatureNurture** (9): `1_DNA/test.html` (383) ·
`2_Proteinsyntese/Opgaver_print.html` (380) · `1_DNA/Modulplan_lærer.html` (226) ·
`Forløbsplan.html` (223) · `1_DNA/RapportVejledning.html` (176) ·
`2_Proteinsyntese/DNAFraKiwi_vejledning.html` (173) ·
`undervisningsbeskrivelse.html` (141) · `2_Proteinsyntese/index.html` (95) ·
`1_DNA/index.html` (94) · `index.html` (94)

---

## Etape 6 — værktøjer

Egne apps med egen logik. Lavest prioritet, fordi de bruges af dig og ikke i
undervisningen. Nogle har bevidst deres eget udtryk — beslut fra sag til sag,
om de overhovedet skal med.

| Fil | Linjer | Bemærkning |
| --- | --- | --- |
| `censorUr.html` | 674 | |
| `ForBørn/Mathsteroids/Mathsteroids.html` | 667 | Spil — måske undtaget |
| `tid/index.html` + `hjaelp.html` + `installer.html` | 604 + 230 + 273 | Egen `styles.css`; er en PWA |
| `studiekort/index.html` | 523 | |
| `Arbejdstidskalender_2026-27.html` | 359 | Eget pergament-design med egen `--paper`; printes på papir |
| `navneApp/index.html` | 32 | Egen `css/style.css` |

---

## Tværgående oprydning

Punkter, der går igen på tværs af alle etaper. Ordn dem *undervejs* på hver
side i stedet for som en separat runde.

* **`.smbi-home` optræder i 41 filer.** Den flydende hjem-knap skal erstattes
  af topbjælkens navigation. Kan ikke søges-og-erstattes maskinelt — hver side
  skal have `<header class="top">` indsat.
* **42 filer mangler `— smbi.dk` i `<title>`.**
* **`<meta name="description">` mangler på alt undtagen 6 filer** (de 3
  omlagte + `drivhuseffekten`, `groenlandspumpen`, `poroesitetPermeabilitet`).
* **`<html lang="da">` er på plads overalt** — intet at gøre.
* **Rammen skal stå stille** på alle sider med trin eller tilstande: mål alle
  tilstande ved indlæsning, lås `min-height`, mål igen ved `resize`,
  projektorskift og `document.fonts.ready`.
* **`style.css` kan først slettes**, når etape 1, 4 og de sider i etape 5–6,
  der bruger den, er omlagt. `backup-gammelt-design/` og `smbi-design/` skal
  ikke røres.

---

## Forslag til første arbejdsgang

Etape 0 + etape 1 i én omgang. Det er under 400 linjer HTML i alt, ingen
model at verificere, og resultatet er en sammenhængende rejse fra forside →
fagforside → de to omlagte simulationer.

Commit-forslag: `Fagforsider i sidens nye design`
