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
import { closeViewer } from './viewer3d.js';
import { closeFacts } from './facts.js';
import { syncWelcome } from './welcome.js';

/* ---------- Det modulafhængige ---------- */

state.repr    = mod().reprs[0].id;
state.variant = mod().variant ? mod().variant.options[0].id : null;
buildHeader();
syncWelcome();
setStatus(intro(), '');

/* ---------- Det fælles ---------- */

document.getElementById('btn-reset').addEventListener('click', resetGame);

document.getElementById('btn-numbers').addEventListener('click', e => {
    state.showNumbers = !state.showNumbers;
    e.currentTarget.classList.toggle('active', state.showNumbers);
    rerenderAll();
});

window.addEventListener('resize', () => {
    state.molecules.forEach(clampIntoView);
    state.enzymes.forEach(clampIntoView);
});

/* Escape lukker de ruder der måtte være åbne */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeViewer();
    closeFacts();
});
