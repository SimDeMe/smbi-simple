/* =====================================================================
   Ordbogen — fagordene forklaret dér hvor de står

   "Anomer", "glykosidbinding", "reducerende sukker", "α-1,4", "essentiel
   aminosyre": ordene står i statuslinjen, på faktakortene og i opgaverne,
   og en elev der ikke kender dem, har ingen vej til en forklaring. At
   skrive forklaringen ind i selve teksten ville gøre den dobbelt så lang
   for dem der godt ved det.

   Derfor mærkes ordene op af sig selv. Teksterne skrives som hidtil, og
   `markTerms()` finder de ord ordbogen kender og gør dem klikbare. Et
   klik giver to linjers forklaring i en lille rude ved ordet.

   Tre ting følger af at opmærkningen sker automatisk:

   - Et ord skal kun forklares ét sted. Retter man forklaringen her, er
     den rettet i statuslinjen, i faktakortet og i opgaven på én gang.
   - Kun det første forekomst i hver tekst mærkes op. Ellers ville en
     forklaring med fire "hydrolyse" i se ud som en prikket streg.
   - Bøjningen tages med: "glykosidbindingen", "anomere", "enzymerne".
     Ordbogen holder stammen, og SUFFIX er de danske endelser.

   De fælles ord står her, for de gælder alle tre stofgrupper —
   kondensation er kondensation, uanset om det er et sukker eller en
   fedtsyre. De stofspecifikke står i modulets `terms`, ligesom alt
   andet der handler om netop den stofgruppe.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';

/* Motorens egne ord: dem der er de samme i alle tre moduler */
const SHARED = {
    kondensation: {
        da: 'Kondensation',
        alt: ['kondensation', 'kondensationsreaktion'],
        txt: 'To byggesten bindes sammen, og der fraspaltes ét molekyle vand. ' +
             'Sådan bygges alle tre stofgrupper — kun byggestenene er forskellige.'
    },
    hydrolyse: {
        da: 'Hydrolyse',
        alt: ['hydrolyse', 'hydrolysere', 'hydrolyseret'],
        txt: 'Det modsatte af kondensation: bindingen klippes, og der bruges ét molekyle vand. ' +
             'Al fordøjelse er hydrolyse — ordet betyder "spaltning med vand".'
    },
    monomer: {
        da: 'Monomer',
        alt: ['monomer', 'byggesten'],
        txt: 'Den enkelte byggesten: en glukose, en aminosyre, en fedtsyre. ' +
             'Mange monomerer bundet sammen bliver til en polymer.'
    },
    polymer: {
        da: 'Polymer (makromolekyle)',
        alt: ['polymer', 'makromolekyle'],
        txt: 'Mange byggesten bundet sammen til ét stort molekyle. ' +
             'Stivelse, cellulose og proteiner er alle polymerer af hver sin slags monomer.'
    },
    enzym: {
        da: 'Enzym',
        alt: ['enzym'],
        txt: 'Et protein der får en bestemt reaktion til at ske hurtigt nok. ' +
             'Enzymet bruges ikke op undervejs — det kan klippe igen med det samme.'
    },
    substrat: {
        da: 'Substrat',
        alt: ['substrat'],
        txt: 'Det stof et enzym arbejder på. ' +
             'Passer stoffet ikke i enzymets aktive sted, sker der ingenting.'
    },
    aktivtsted: {
        da: 'Aktivt sted',
        alt: ['aktivt sted', 'aktive sted'],
        txt: 'Den lomme i enzymet hvor substratet skal passe ned. ' +
             'Formen på lommen afgør hvad enzymet kan klippe — og pH og temperatur ændrer formen.'
    },
    specifik: {
        da: 'Substratspecificitet',
        alt: ['substratspecificitet', 'specificitet', 'specifik'],
        txt: 'Et enzym passer kun til én slags binding. ' +
             'Derfor kan vi fordøje stivelse men ikke cellulose, selvom begge er kæder af glukose.'
    },
    isomer: {
        da: 'Isomer',
        alt: ['isomer'],
        txt: 'To molekyler med samme sumformel, men forskellig struktur. ' +
             'Maltose og cellobiose er isomerer — og vi kan kun fordøje den ene.'
    },
    sumformel: {
        da: 'Sumformel',
        alt: ['sumformel', 'molekylformel'],
        txt: 'Optællingen af atomer, fx C₆H₁₂O₆. ' +
             'Den siger hvor mange atomer der er, men ikke hvordan de sidder — og det er dét der afgør hvad stoffet kan.'
    }
};

/* De danske endelser, så stammen i ordbogen også fanger den bøjede form.
   Længste først, men regexen prøver sig frem alligevel: "monomererne" er
   stammen + "erne", ikke stammen + "er" med et "ne" til overs. */
const SUFFIX = 'erne|ene|ere|ers|rne|er|en|et|ne|re|es|e|n|s|r';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Regexen bygges én gang pr. modul: ordlisten skifter kun når modulet
   gør det. Formerne sorteres efter længde, så "esterbinding" vinder over
   "ester" — den første alternativ der passer, er den der bruges. */
let cache = null;

function table() {
    if (cache && cache.id === state.modId) return cache;

    const all   = Object.assign({}, SHARED, mod().terms || {});
    const map   = new Map();
    const forms = [];

    Object.entries(all).forEach(([key, t]) => {
        (t.alt || [t.da.toLowerCase()]).forEach(f => {
            map.set(f.toLowerCase(), key);
            forms.push(f);
        });
    });
    forms.sort((a, b) => b.length - a.length);

    // Ordet skal stå alene: hverken bogstav eller ciffer må klæbe til det.
    // Bindestreg må derimod gerne — "α-1,4-bundne" er stadig en α-1,4.
    const re = new RegExp(
        `(?<![\\p{L}\\d])(${forms.map(esc).join('|')})(${SUFFIX})?(?![\\p{L}\\d])`, 'giu');

    cache = { id: state.modId, all, map, re };
    return cache;
}

/* Gør de fagord ordbogen kender, klikbare i en færdig tekst.

   Teksten kan indeholde markup (faktakortene har deres mærkater, og
   startkortets trin har <b>), så den deles op ved tags, og kun det der
   står imellem, bliver rørt. Ellers ville et klassenavn kunne rammes. */
export function markTerms(html) {
    const { re, map } = table();
    const used = new Set();

    return String(html).split(/(<[^>]*>)/).map(part => {
        if (part.startsWith('<')) return part;
        return part.replace(re, (hit, stem) => {
            const key = map.get(stem.toLowerCase());
            if (!key || used.has(key)) return hit;      // kun første forekomst
            used.add(key);
            return `<button type="button" class="term" data-t="${key}">${hit}</button>`;
        });
    }).join('');
}

/* ---------- Ruden med forklaringen ---------- */

let pop = null;

function popover() {
    if (!pop) {
        pop = document.createElement('div');
        pop.id = 'term-pop';
        pop.className = 'hidden';
        document.body.appendChild(pop);
    }
    return pop;
}

function openTerm(btn) {
    const t = table().all[btn.dataset.t];
    if (!t) return;

    const p = popover();
    p.innerHTML = `<b>${t.da}</b>${t.txt}`;
    p.classList.remove('hidden');

    // Under ordet, hvis der er plads — ellers over det. Ruden er
    // position:fixed, for termerne står både i statuslinjen, i
    // opgavepanelet og inde i faktakortets modal.
    const r = btn.getBoundingClientRect();
    const w = p.offsetWidth, h = p.offsetHeight;
    const x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8));
    const under = r.bottom + 8;
    const y = under + h > innerHeight - 8 ? Math.max(8, r.top - h - 8) : under;

    p.style.left = `${Math.round(x)}px`;
    p.style.top  = `${Math.round(y)}px`;
}

/* Returnerer om der var noget at lukke, så Escape kan tage ruden først
   og lade faktakortet bagved stå */
export function closeTerm() {
    if (!pop || pop.classList.contains('hidden')) return false;
    pop.classList.add('hidden');
    return true;
}

/* Ét klik-lytte for hele siden: termerne tegnes om hele tiden, så en
   lytter pr. knap ville skulle sættes på igen ved hver eneste optegning */
document.addEventListener('click', e => {
    if (!e.target.closest) return;
    const btn = e.target.closest('.term');
    if (btn) { openTerm(btn); return; }
    if (e.target.closest('#term-pop')) return;      // man må gerne markere teksten
    closeTerm();
});

window.addEventListener('resize', closeTerm);
