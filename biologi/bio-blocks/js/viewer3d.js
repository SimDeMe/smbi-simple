/* =====================================================================
   3D-ruden (3Dmol.js, rigtige PubChem-koordinater)
   ===================================================================== */

const modal           = document.getElementById('viewer-modal');
const viewerContainer = document.getElementById('viewer-container');
const viewerTitle     = document.getElementById('viewer-title');
const viewerSub       = document.getElementById('viewer-sub');
const btnSpin         = document.getElementById('btn-spin');

const sdfCache = new Map();
let viewer3d = null;
let spinning = true;

document.getElementById('viewer-close').addEventListener('click', closeViewer);
modal.addEventListener('click', e => { if (e.target === modal) closeViewer(); });

btnSpin.addEventListener('click', () => {
    spinning = !spinning;
    btnSpin.classList.toggle('active', spinning);
    if (viewer3d) { viewer3d.spin(spinning ? 'y' : false); viewer3d.render(); }
});

window.addEventListener('resize', () => { if (viewer3d) viewer3d.resize(); });

export function closeViewer() {
    if (viewer3d) { try { viewer3d.spin(false); } catch (_) {} }
    viewer3d = null;
    modal.classList.add('hidden');
    viewerContainer.textContent = '';
}

function showViewerMessage(html, isError) {
    viewerContainer.innerHTML = `<div class="viewer-msg${isError ? ' err' : ''}">${html}</div>`;
}

export async function openViewer(info) {
    if (!info.sdf) return;

    modal.classList.remove('hidden');
    viewerTitle.textContent = info.name;
    viewerSub.textContent = info.formula + (info.sdfNote ? ' · ' + info.sdfNote : '');
    viewerContainer.textContent = '';
    viewer3d = null;

    if (typeof $3Dmol === 'undefined') {
        showViewerMessage('3Dmol.js kunne ikke indlæses.<br>Tjek internetforbindelsen og prøv igen.', true);
        return;
    }

    showViewerMessage('Henter 3D-struktur …', false);

    let sdfText;
    try {
        if (sdfCache.has(info.sdf)) {
            sdfText = sdfCache.get(info.sdf);
        } else {
            const res = await fetch(info.sdf);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            sdfText = await res.text();
            sdfCache.set(info.sdf, sdfText);
        }
    } catch (err) {
        const localHint = location.protocol === 'file:'
            ? '<br><br>Siden er åbnet direkte fra disken (<code>file://</code>), og browseren blokerer derfor indlæsning af SDF-filen. Kør siden gennem en lille webserver, fx <code>python3 -m http.server</code>.'
            : '';
        showViewerMessage(`Kunne ikke hente <code>${info.sdf}</code>.${localHint}`, true);
        return;
    }

    // Modal is visible now, so the container has its final size
    viewerContainer.textContent = '';
    try {
        viewer3d = $3Dmol.createViewer(viewerContainer, { backgroundColor: 'white' });
        viewer3d.addModel(sdfText, 'sdf');
        viewer3d.setStyle({}, { stick: { radius: 0.14 }, sphere: { scale: 0.26 } });
        viewer3d.zoomTo();
        viewer3d.render();
        viewer3d.resize();
        if (spinning) viewer3d.spin('y');
    } catch (err) {
        showViewerMessage('Kunne ikke tegne molekylet: ' + err.message, true);
    }
}
