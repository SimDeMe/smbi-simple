/* ═══════════════════════════════════════════════════════════
   molekyler.js — fagdataene.

   Ét sted at rette, hvis en formulering skal skærpes, eller der
   skal et molekyle mere med. Ingen kode her, kun indhold.

   `vej` peger på id'et for den transportmekanisme, molekylet
   bruger, og skal passe med et id i transport.js.
   `hvorfor` er den sætning, eleven skal kunne sige selv
   bagefter: størrelse, ladning og gradient afgør vejen.

   `gradient` gør stoffet til et, eleven kan skrue på. Tallene er
   koncentrationen i mmol/L uden for og inde i en hvilende celle,
   `maks` er skyderens øverste værdi, og `kort` er det navn, der
   kan stå i skyderens mærkat: der skal stå "Kalium uden for
   cellen", ikke "Kaliumion uden for cellen". Kun de stoffer, en
   transportmekanisme faktisk flytter, har en gradient — resten
   står i listen for at kunne slås op i forklaringsruden.
   Tallene er dem, eleven møder i lærebogen:

     ilt       0,26 mmol/L i vand mættet med atmosfærisk luft,
               og langt mindre i en celle, der forbrænder
     kalium    4 uden for, 140 inde — den forskel, nervecellen
               bygger sit hvilepotentiale på
     natrium   145 uden for, 12 inde — spejlvendt af kaliums,
               og holdt på plads af pumpen
     glukose   ca. 5 mmol/L i blodet (blodsukkeret), og lavere
               inde i cellen, fordi den bliver forbrugt
   ═══════════════════════════════════════════════════════════ */

export const MOLEKYLER = [
  {
    id:'o2', navn:'Ilt', formel:'O₂',
    størrelse:'meget lille', polaritet:'upolær', ladning:'uladet',
    vej:'diffusion',
    hvorfor:'Lille og upolær, så den glider direkte gennem de hydrofobe haler. Ingen protein, ingen energi. Den skal bare være tæt på membranen og støde det rigtige sted — resten sker af sig selv.',
    gradient:{kort:'Ilt', ude:0.26, inde:0.05, maks:0.30, trin:0.01, decimaler:2},
    /* Rød som i kuglemodellerne. Farven skal desuden kunne skelnes fra
       de blå fosfolipidhoveder, molekylerne driver rundt imellem. */
    farve:0xFF5A36,
  },
  {
    id:'co2', navn:'Kuldioxid', formel:'CO₂',
    størrelse:'meget lille', polaritet:'upolær', ladning:'uladet',
    vej:'diffusion',
    hvorfor:'Samme historie som ilt — den passerer frit, og derfor kan cellen komme af med sit affaldsstof uden at bruge energi på det.',
    farve:0xBFA8E8,
  },
  {
    id:'steroid', navn:'Steroidhormon (testosteron)', formel:'C₁₉H₂₈O₂',
    størrelse:'mellem', polaritet:'upolær', ladning:'uladet',
    vej:'diffusion',
    hvorfor:'Fedtopløselig, så den smutter tværs igennem lipidlaget. Derfor sidder receptorerne for steroidhormoner inde i cellen og ikke på overfladen.',
    farve:0xFFD9C9,
  },
  {
    id:'h2o', navn:'Vand', formel:'H₂O',
    størrelse:'lille', polaritet:'polær', ladning:'uladet',
    vej:'kanal',
    hvorfor:'Lille nok til at snige sig igennem hist og her, men polær. Gennem en aquaporin går det tusind gange hurtigere — det er den vej, osmosen reelt løber.',
    farve:0x7EC8E8,
  },
  {
    id:'na', navn:'Natriumion', formel:'Na⁺',
    størrelse:'lille', polaritet:'ladet', ladning:'+1',
    vej:'kanal',
    hvorfor:'En ladet ion kan ikke komme forbi de hydrofobe haler. Den skal gennem en kanal — og skal den ud mod gradienten, kræver det pumpen.',
    gradient:{kort:'Natrium', ude:145, inde:12, maks:170, trin:1, decimaler:0},
    farve:0xFFB300,
  },
  {
    id:'k', navn:'Kaliumion', formel:'K⁺',
    størrelse:'lille', polaritet:'ladet', ladning:'+1',
    vej:'kanal',
    hvorfor:'Samme problem som natrium. Kanalerne er selektive: en kaliumkanal lukker kalium igennem, men ikke natrium, selv om natrium er mindre.',
    gradient:{kort:'Kalium', ude:4, inde:140, maks:170, trin:1, decimaler:0},
    farve:0xC9A9F0,
  },
  {
    id:'cl', navn:'Chloridion', formel:'Cl⁻',
    størrelse:'lille', polaritet:'ladet', ladning:'−1',
    vej:'kanal',
    hvorfor:'Negativt ladet og omgivet af vandmolekyler. Den skal gennem en kanal, ligesom de positive ioner.',
    farve:0x5FB030,
  },
  {
    id:'glukose', navn:'Glukose', formel:'C₆H₁₂O₆',
    størrelse:'stor', polaritet:'polær', ladning:'uladet',
    vej:'baerer',
    hvorfor:'For stor og for polær til lipidlaget. Et transportprotein (GLUT) binder den og skifter form — stadig med gradienten, så det koster ikke ATP.',
    gradient:{kort:'Glukose', ude:5.5, inde:1, maks:20, trin:0.5, decimaler:1},
    farve:0xFFAE8A,
  },
  {
    id:'aminosyre', navn:'Aminosyre (glycin)', formel:'C₂H₅NO₂',
    størrelse:'mellem', polaritet:'polær', ladning:'skiftende',
    vej:'baerer',
    hvorfor:'Polær og ofte ladet. Optages med et transportprotein, som mange steder trækker natrium med ind samtidig.',
    farve:0xF2C14E,
  },
  {
    id:'urinstof', navn:'Urinstof', formel:'CH₄N₂O',
    størrelse:'lille', polaritet:'polær', ladning:'uladet',
    vej:'diffusion',
    hvorfor:'Lille og uladet, så den siver langsomt igennem lipidlaget. I nyren går det hurtigere gennem særlige urinstoftransportører.',
    farve:0xD6EFC4,
  },
  {
    /* ATP bliver ikke transporteret — det bliver brugt. Det står i
       listen, fordi eleven skal kunne pege på det i figuren og få
       at vide, hvad den lille lysende klump ved pumpen er. */
    id:'atp', navn:'ATP', formel:'C₁₀H₁₆N₅O₁₃P₃',
    størrelse:'stor', polaritet:'polær', ladning:'−4',
    vej:'pumpe',
    hvorfor:'Cellens energivaluta. ATP går ikke gennem membranen — det bliver spaltet på indersiden. Den yderste af de tre fosfatgrupper flytter over på pumpens P-domæne, og den energi, der sad i bindingen, vender pumpen fra at være åben indad til at være åben udad. Derfor kan pumpen flytte ioner mod gradienten, og derfor kaldes det aktiv transport.',
    farve:0xFFD166,
  },
];

export const find = id => MOLEKYLER.find(m => m.id === id);

/** De stoffer, eleven kan skrue på — dem med en gradient. */
export const MED_GRADIENT = MOLEKYLER.filter(m => m.gradient);
