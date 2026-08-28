/* =====================================================================
   Opstart: topbjælken bygges af det aktive modul, og de knapper der er
   fælles for alle moduler, kobles til det der gør arbejdet.

   Markup'en holder ingen logik — den holder kun de tomme grupper, og
   koblingen står her, så det er ét sted man kigger efter "hvad sker der
   når man trykker".
   ===================================================================== */

import { state } from './state.js';
import { mod, intro } from './modules/index.js';
import { resetGame, rerenderAll, clampIntoView, setStatus } from './board.js';
import { buildHeader } from './ui.js';
import { undoLast } from './reactions.js';
import { closeViewer } from './viewer3d.js';
import { closeFacts } from './facts.js';
import { syncWelcome } from './welcome.js';
import { closeTerm } from './glossary.js';
import { closeLog } from './log.js';
import { laesAdresse, skrivAdresse, bindProjektor } from './deling.js';

/* ---------- Det modulafhængige ---------- */

/* Adressen kan bede om et andet modul og et andet niveau, end appen
   ellers åbner i — den skal derfor læses, før bjælken bygges */
laesAdresse();

state.repr    = mod().reprs[0].id;
state.variant = mod().variant ? mod().variant.options[0].id : null;
buildHeader();
syncWelcome();
setStatus(intro(), '');
skrivAdresse();

/* ---------- Det fælles ---------- */

document.getElementById('btn-reset').addEventListener('click', resetGame);

/* Projektortilstanden gør bordet højere — molekylerne skal med */
bindProjektor(() => {
    state.molecules.forEach(clampIntoView);
    state.enzymes.forEach(clampIntoView);
});

document.getElementById('btn-numbers').addEventListener('click', e => {
    state.showNumbers = !state.showNumbers;
    e.currentTarget.classList.toggle('active', state.showNumbers);
    rerenderAll();
});

window.addEventListener('resize', () => {
    state.molecules.forEach(clampIntoView);
    state.enzymes.forEach(clampIntoView);
});

/* Escape lukker de ruder der måtte være åbne, og Ctrl+Z fortryder den
   binding man senest har dannet.

   Ordforklaringen tages først og alene: den står oven på faktakortet, og
   den der lukker en lille rude, vil ikke have det store kort med. */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (!closeTerm()) { closeViewer(); closeFacts(); closeLog(); }
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLast();
    }
});
