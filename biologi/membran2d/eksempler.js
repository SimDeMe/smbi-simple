/* ═══════════════════════════════════════════════════════════
   eksempler.js — ægte transportveje.

   Hver transportmekanisme på siden er en model. Det her er de
   steder i kroppen, hvor den rent faktisk sidder og arbejder, så
   eleven kan sætte figuren i forbindelse med noget, der findes:
   et proteinnavn, et organ, en sygdom eller et lægemiddel.

   Ingen kode — kun indhold. `vej` peger på id'et for en mekanisme
   i transport.js, og forklaringsruden henter alle eksempler for
   den valgte vej.
   ═══════════════════════════════════════════════════════════ */

export const EKSEMPLER = [
  /* ── Simpel diffusion ──────────────────────────────────── */
  {
    vej:'diffusion', navn:'Ilt og kuldioxid i lungeblæren',
    sted:'Alveole ↔ kapillær',
    tekst:'Ilten diffunderer fra luften i alveolen ind i blodet, og kuldioxiden den modsatte vej — tværs gennem to cellelag på under et sekund. Ingen proteiner, ingen ATP: det hele står og falder med gradienten og med, at afstanden kun er ca. 0,5 µm.',
  },
  {
    vej:'diffusion', navn:'Steroidhormoner',
    sted:'Testosteron, østrogen, kortisol',
    tekst:'Fedtopløselige hormoner går lige igennem lipidlaget. Netop derfor sidder deres receptorer inde i cellen og ikke på overfladen — modsat insulin, der må nøjes med at banke på udefra.',
  },
  {
    vej:'diffusion', navn:'Narkosemidler og alkohol',
    sted:'Blod–hjerne-barrieren',
    tekst:'Små upolære stoffer passerer barrieren uhindret. Det er både grunden til, at inhalationsnarkose virker på sekunder, og til at alkohol når hjernen så hurtigt.',
  },

  /* ── Osmose gennem aquaporin ───────────────────────────── */
  {
    vej:'osmose', navn:'AQP2 i nyrens samlerør',
    sted:'Nyre · vandbalance',
    tekst:'Hormonet ADH (vasopressin) får cellerne til at sætte aquaporin AQP2 ind i membranen. Med kanalerne i brug trækkes vandet tilbage til blodet, og urinen bliver koncentreret; uden dem løber vandet ud — det er dét, der sker ved diabetes insipidus.',
  },
  {
    vej:'osmose', navn:'AQP1 i røde blodlegemer',
    sted:'Blod',
    tekst:'Et rødt blodlegeme har ca. 200.000 aquaporiner og kan udveksle sit eget rumfang vand på under et sekund. Lægges det i rent vand, svulmer det og sprænger — det er hæmolyse.',
  },
  {
    vej:'osmose', navn:'Drop og skyllevæske',
    sted:'Isotonisk saltvand, 0,9 %',
    tekst:'Væske til drop blandes, så den har samme partikelkoncentration som blodet, ca. 300 mmol/L. Ellers ville vandet enten strømme ind i blodcellerne eller ud af dem.',
  },

  /* ── Ionkanal ──────────────────────────────────────────── */
  {
    vej:'kanal', navn:'Kalium-lækkanaler',
    sted:'Nervecellens hvilemembranpotentiale',
    tekst:'Kanalerne står åbne hele tiden, og kaliumionerne siver ud, fordi der er 35 gange mere kalium indeni. Tilbage bliver de negative ladninger — det er hele forklaringen på, at indersiden hviler omkring −70 mV.',
  },
  {
    vej:'kanal', navn:'Spændingsstyrede natriumkanaler',
    sted:'Aktionspotentialet',
    tekst:'De åbner, når membranpotentialet når tærsklen, og natrium styrter ind på et millisekund. Lokalbedøvelse virker ved at blokere netop dem, så smertesignalet aldrig når frem.',
  },
  {
    vej:'kanal', navn:'CFTR — chloridkanalen',
    sted:'Cystisk fibrose',
    tekst:'CFTR sender chlorid ud på slimhindernes overflade, og vandet følger efter ved osmose. Er kanalen defekt, bliver slimet sejt i lunger og bugspytkirtel — det er sygdommen cystisk fibrose.',
  },

  /* ── Bærerprotein, faciliteret diffusion ───────────────── */
  {
    vej:'baerer', navn:'GLUT1 i røde blodlegemer',
    sted:'Blod og blod–hjerne-barrieren',
    tekst:'GLUT1 er den transportør, tallene på siden er hentet fra: den er halvt mættet ved ca. 1,5 mmol/L, og blodsukkeret ligger omkring 5 mmol/L. Derfor kører den næsten for fuld kraft hele tiden, og hjernen får glukose, uanset om man lige har spist.',
  },
  {
    vej:'baerer', navn:'GLUT4 i muskel- og fedtceller',
    sted:'Insulinets angrebspunkt',
    tekst:'GLUT4 ligger gemt i vesikler inde i cellen. Insulin er signalet om at sætte dem ind i membranen, så glukosen kan komme ind. Ved type 2-diabetes svarer cellerne dårligt på det signal, og blodsukkeret bliver stående.',
  },
  {
    vej:'baerer', navn:'Urinstoftransportøren UT-A1',
    sted:'Nyre',
    tekst:'Urinstof siver godt nok selv gennem lipidlaget, men alt for langsomt til nyrens behov. UT-A1 gør vejen hurtig nok til, at nyren kan opbygge det saltkammer, der trækker vandet tilbage.',
  },

  /* ── Na⁺/K⁺-pumpen, primær aktiv transport ────────────── */
  {
    vej:'pumpe', navn:'Hvilepotentialet i nervecellen',
    sted:'Alle dyreceller',
    tekst:'Pumpen holder natrium ude og kalium inde — 3 ud mod 2 ind, så den flytter også en positiv ladning ud hver omgang. Det er den forskel, hele nervesystemets signalering bygger på, og den er væk få minutter efter, at ATP holder op med at komme.',
  },
  {
    vej:'pumpe', navn:'En tredjedel af hvilestofskiftet',
    sted:'Energiregnskabet',
    tekst:'Op mod 30 % af den ATP, kroppen bruger i hvile, går til Na⁺/K⁺-pumperne — i nyrens tubuli endnu mere. Aktiv transport er ikke en detalje i energibudgettet; det er en hovedpost.',
  },
  {
    vej:'pumpe', navn:'Digoxin og hjertemedicin',
    sted:'Hjertesvigt',
    tekst:'Digoxin hæmmer pumpen i hjertemuskelcellerne. Natriumgradienten falder, calcium bliver derfor dårligere sendt ud, og hjertet trækker sig kraftigere sammen. Vinduet mellem virkning og forgiftning er smalt — netop fordi pumpen er så central.',
  },

  /* ── Symport, sekundær aktiv transport ─────────────────── */
  {
    vej:'symport', navn:'SGLT1 i tyndtarmen',
    sted:'Optagelse af glukose fra maden',
    tekst:'To natriumioner og én glukose kommer ind sammen. Natrium falder ned ad sin gradient, og turen betaler for, at glukosen kan komme ind, selv om der allerede er mere glukose i cellen end i tarmen. Energien kommer fra pumpen på nabosiden af cellen — derfor: sekundær aktiv transport.',
  },
  {
    vej:'symport', navn:'Væske­terapi ved kolera',
    sted:'ORS — oral rehydrering',
    tekst:'Sukker-salt-vand virker, fordi SGLT1 kun tager glukosen med, når natrium er der. Salt og sukker sammen trækker begge dele ind i cellerne, og vandet følger efter ved osmose. Den simple opskrift har reddet millioner af liv.',
  },
  {
    vej:'symport', navn:'SGLT2-hæmmere',
    sted:'Type 2-diabetes',
    tekst:'SGLT2 henter glukosen tilbage fra den primære urin i nyren. Blokerer man den med medicin, ryger sukkeret ud med urinen i stedet, og blodsukkeret falder.',
  },
  {
    vej:'symport', navn:'NKCC2 og loop-diuretika',
    sted:'Henles slynge',
    tekst:'NKCC2 tager Na⁺, K⁺ og 2 Cl⁻ ind på én gang, drevet af den samme natriumgradient. Vanddrivende medicin som furosemid blokerer transportøren, og saltet — og dermed vandet — bliver i urinen.',
  },

  /* ── Vesikeltransport ──────────────────────────────────── */
  {
    vej:'vesikel', navn:'Insulin fra β-cellerne',
    sted:'Bugspytkirtlen · exocytose',
    tekst:'Insulin ligger færdigpakket i vesikler. Når blodsukkeret stiger, smelter vesiklerne sammen med membranen og tømmer indholdet ud i blodet. Et helt protein kan ikke komme igennem på anden måde.',
  },
  {
    vej:'vesikel', navn:'Signalstoffet i synapsen',
    sted:'Nerve → nerve',
    tekst:'Calcium strømmer ind i nerveenden, og på under et millisekund tømmer vesiklerne deres signalstof ud i synapsekløften. Bagefter hentes membranen ind igen ved endocytose og pakkes til næste gang.',
  },
  {
    vej:'vesikel', navn:'LDL-kolesterol ind i cellen',
    sted:'Receptorstyret endocytose',
    tekst:'LDL-partiklen binder sig til sin receptor, membranen bugter sig indad, og vesiklen snøres af. Er receptoren defekt, bliver kolesterolet i blodet — det er familiær hyperkolesterolæmi, med hjertekarsygdom i helt unge år.',
  },
  {
    vej:'vesikel', navn:'Makrofagen, der æder bakterien',
    sted:'Immunforsvaret · fagocytose',
    tekst:'Den hvide blodcelle lægger membranen om bakterien og lukker den inde i en vesikel, som derefter smeltes sammen med et lysosom. Vesikeltransport er den eneste vej for noget så stort.',
  },
];

export const forVej = vej => EKSEMPLER.filter(e => e.vej === vej);
