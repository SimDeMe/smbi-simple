/* =====================================================================
   Faktakort — konteksten omkring molekylet

   Alt undtagen én ting er opslag i tabellen nedenfor. Den ene ting er
   "reducerende sukker", og den beregnes: et molekyle er reducerende
   præcis når det har et frit anomert C-atom, og det ved modellen allerede
   (det er den frie plads freeSites kalder 'anomeric'). Sakkarose er det
   eneste her hvor begge anomere C-atomer sidder i bindingen.
   ===================================================================== */

const FACT_COLOUR = {
    glucose: '#1e8449', fructose: '#b03a2e', galactose: '#b7950b',
    disacc: '#2471a3', poly: '#34495e'
};

const FACTS = {
    glucose: {
        where: 'Druer, honning og frugt — og i blodet: blodsukkeret er glukose (normalt 4–6 mmol/L).',
        sweet: 0.75,
        digest: 'Optages direkte i tyndtarmen. Den er allerede en monomer, så der skal ingen enzymer til.',
        energy: '≈ 17 kJ/g (4 kcal/g). Cellernes vigtigste brændstof: glykolyse → citronsyrecyklus → ATP.'
    },
    fructose: {
        where: 'Frugt og honning — og halvdelen af alt almindeligt sukker, som er sakkarose.',
        sweet: 1.7,
        digest: 'Optages direkte, men med en anden transportør (GLUT5) end glukose.',
        energy: '≈ 17 kJ/g. Omsættes næsten udelukkende i leveren, og indgår derfor ikke i blodsukkeret på samme måde.'
    },
    galactose: {
        where: 'Findes næsten kun som den ene halvdel af laktose i mælk.',
        sweet: 0.32,
        digest: 'Optages direkte og omdannes i leveren til glukose.',
        energy: '≈ 17 kJ/g. Indgår også i glykolipider og glykoproteiner på cellernes overflade.'
    },
    maltose: {
        where: 'Malt, øl og spirende korn — og i tarmen hver gang stivelse bliver nedbrudt.',
        sweet: 0.35,
        digest: 'Spaltes af maltase i tyndtarmens børstesøm til to glukoser.',
        energy: '≈ 17 kJ/g. Mellemtrin i stivelsesfordøjelsen, ikke et lager i sig selv.'
    },
    lactose: {
        where: 'Mælk og mejeriprodukter. Komælk ≈ 4,7 %, modermælk ≈ 7 %.',
        sweet: 0.16,
        digest: 'Kræver laktase. De fleste voksne i verden mister enzymet efter barndommen — nordeuropæere er undtagelsen.',
        energy: '≈ 17 kJ/g. Uspaltet laktose når tyktarmen, hvor bakterier laver gas, og trækker vand ud i tarmen.'
    },
    sucrose: {
        where: 'Sukkerrør og sukkerroer — det vi kalder sukker, rørsukker eller bordsukker.',
        sweet: 1.0,
        digest: 'Spaltes af sakkarase til glukose + fruktose. Blandingen kaldes invertsukker.',
        energy: '≈ 17 kJ/g. Plantens transportform: sukker flyttes rundt i sivævet som sakkarose, netop fordi den er ikke-reducerende og dermed kemisk rolig.'
    },
    cellobiose: {
        where: 'Frigives når cellulose nedbrydes af bakterier og svampe. Findes ikke frit i kosten.',
        sweet: 0.05,
        digest: 'Mennesker kan ikke spalte den: β-1,4 kræver cellulase eller β-glukosidase, som vi ikke har.',
        energy: '0 kJ/g for os. Køer og termitter får energi ud af den via mikroorganismer.'
    },
    isomaltose: {
        where: 'Selve grenpunktet i amylopektin og glykogen. Findes i sirup, honning og øl.',
        sweet: 0.35,
        digest: 'Spaltes af isomaltase (grænsedextrinase) — et andet enzym end maltase, fordi bindingen er α-1,6.',
        energy: '≈ 17 kJ/g.'
    },
    gentiobiose: {
        where: 'Plantestoffer, bl.a. i safranens farvestof crocin.',
        sweet: null,
        sweetNote: 'Smager bittert, ikke sødt — sødme afhænger af formen, ikke af at det er et sukker.',
        digest: 'β-1,6 spaltes ikke af menneskets enzymer.',
        energy: 'Ingen betydning som næringsstof.'
    },
    melibiose: {
        where: 'Bælgfrugter, som del af raffinose i ærter, bønner og linser.',
        sweet: 0.3,
        digest: 'Kræver α-galaktosidase, som mennesker ikke har. Den fortsætter til tyktarmen.',
        energy: 'Ingen energi for os — men bakterierne i tyktarmen laver gas af den. Det er derfor bønner giver luft i maven.'
    },
    maltotriose: {
        where: 'Mellemprodukt når amylase klipper stivelse i stykker. Findes i øl og sirup.',
        sweet: 0.2,
        digest: 'Klippes videre af amylase og maltase til glukose.',
        energy: '≈ 17 kJ/g.'
    },
    amylose: {
        where: 'Kartofler, ris, brød, pasta, majs — plantens energilager i knolde og frø.',
        sweet: 0,
        digest: 'Amylase i spyt og bugspyt klipper α-1,4 inde i kæden, maltase tager sidste trin til glukose.',
        energy: '≈ 17 kJ/g. Det vigtigste kulhydrat i den menneskelige kost.'
    },
    cellulose: {
        where: 'Træ, bomuld, papir og alle plantecellevægge — Jordens mest udbredte organiske stof.',
        sweet: 0,
        digest: 'Kan ikke fordøjes: β-1,4 kræver cellulase, og den har mennesker ikke. Virker som kostfiber.',
        energy: '0 kJ/g for mennesker. Køer, termitter og snegle klarer det med hjælp fra mikroorganismer.'
    },
    glycogen: {
        where: 'Lever (≈ 100 g) og muskler (≈ 400 g) hos mennesker — dyrenes energilager. Amylopektin er plantens tilsvarende forgrenede form.',
        sweet: 0,
        digest: 'α-1,4 af amylase, α-1,6-grenpunkterne af isomaltase. I egne celler klippes glykogen af glykogenfosforylase.',
        energy: '≈ 17 kJ/g. Grenene giver mange frie ender, så mange enzymer kan arbejde samtidig — derfor kan blodsukkeret rettes op i løbet af minutter.'
    },
    disacc: {
        where: 'Ikke et af de almindelige disakkarider — men kemisk muligt.',
        sweet: null,
        sweetNote: 'Ukendt sødme.',
        digest: 'Om det kan fordøjes afhænger helt af bindingen: prøv at trække et enzym hen på den.',
        energy: 'Kun bindinger vi har enzymer til, giver energi.'
    },
    poly: {
        where: 'En blandet kæde, ikke en af naturens standardpolymerer.',
        sweet: 0,
        digest: 'Enzymer er specifikke: hver enkelt binding skal passe til et enzym, ellers bliver den siddende.',
        energy: 'Kun de bindinger vi har enzymer til, giver energi.'
    }
};

const factModal = document.getElementById('fact-modal');

export function openFacts(model) {
    const { info, nodes, sites } = model;
    const n = nodes.length;
    const f = FACTS[info.key] || FACTS[n === 2 ? 'disacc' : 'poly'];
    const reducing = sites.some(s => s.kind === 'anomeric');

    const colour = FACT_COLOUR[info.key] ||
                   (n === 1 ? FACT_COLOUR.glucose : n === 2 ? FACT_COLOUR.disacc : FACT_COLOUR.poly);
    document.getElementById('fact-top').style.background = colour;
    document.getElementById('fact-name').textContent = info.name;
    document.getElementById('fact-formula').textContent =
        `${info.formula} · ${n} ${n === 1 ? 'monomer' : 'monomerer'}`;

    // Sødme som søjle, målt mod sakkarose = 1
    let sweetVal;
    if (f.sweet === null || f.sweet === undefined) {
        sweetVal = f.sweetNote || 'Ukendt.';
    } else if (f.sweet === 0) {
        sweetVal = 'Smager ikke sødt. Polysakkarider er for store til at nå smagsreceptorerne — ' +
                   'men tygger man længe på et stykke brød, begynder det at smage sødt, fordi amylasen i spyttet frigiver maltose.';
    } else {
        const pct = Math.round(Math.min(1, f.sweet / 1.8) * 100);
        sweetVal = `<div class="f-bar"><span style="width:${pct}%"></span></div>` +
                   (f.sweet === 1
                     ? 'Sakkarose <b>er</b> målestokken: al sødme angives i forhold til bordsukker.'
                     : `≈ ${String(f.sweet).replace('.', ',')} × sakkarose (bordsukker = 1)`);
    }

    const redTag = reducing
        ? `<span class="f-tag yes">Reducerende</span><br>Der er et frit anomert C-atom, så molekylet kan
           oxideres — det er derfor Fehlings og Benedicts prøve slår ud.` +
          (n >= 6 ? ' En lang kæde har kun én fri ende pr. molekyle, så udslaget bliver meget svagt.' : '')
        : `<span class="f-tag no">Ikke-reducerende</span><br>Begge anomere C-atomer sidder i den
           glykosidiske binding, så der er ingen fri aldehyd- eller ketogruppe. Fehlings prøve er negativ.`;

    const rows = [
        ['📍', 'Hvor findes det', f.where],
        ['🍬', 'Sødme', sweetVal],
        ['🧪', 'Reducerende sukker?', redTag],
        ['🍽', 'Fordøjelighed for mennesker', f.digest],
        ['⚡', 'Energi og rolle', f.energy]
    ];

    document.getElementById('fact-rows').innerHTML = rows.map(([ico, lab, val]) =>
        `<div class="f-row"><div class="f-ico">${ico}</div>
         <div><div class="f-lab">${lab}</div><div class="f-val">${val}</div></div></div>`).join('');

    factModal.classList.remove('hidden');
}

export function closeFacts() { factModal.classList.add('hidden'); }

document.getElementById('fact-close').addEventListener('click', closeFacts);
factModal.addEventListener('click', e => { if (e.target === factModal) closeFacts(); });
