/* ═══════════════════════════════════════════════════════════
   forklaring.js — ruden ved siden af figuren.

   Den ene halvdel er, hvad mekanismen *er*: hvilket protein, om
   den koster energi, hvilke stoffer den flytter. Den anden halvdel
   er, hvor den sidder i virkeligheden — og det er den halvdel, der
   gør forskellen på en tegning og et stykke biologi. Eksemplerne
   ligger i eksempler.js.

   Ruden har `aria-live`, så en skærmlæser får teksten med, når
   eleven skifter transportvej med tastaturet.
   ═══════════════════════════════════════════════════════════ */
import {forVej}       from './eksempler.js';
import {find as stof} from './molekyler.js';

const undslip = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const OVERSIGT = {
  stempel:'Væskemosaikmodellen',
  navn:'Hele membranen',
  krop:`<p>Fosfolipiderne vender de hydrofile hoveder ud mod vandet på begge
        sider og gemmer de hydrofobe haler indeni. Det lag er lukket land for
        alt, der er ladet eller stort — og derfor sidder der proteiner hele
        vejen igennem, ét til hver slags fragt.</p>
        <p>Syv transportveje står i den samme membran. Klik på en af dem, eller
        vælg den nederst, så zoomer figuren ind, og ruden her forklarer
        hvorfor lige den vej.</p>`,
};

export function opretForklaring({felter, signaturer, mekanismer, naarValgt}){
  let valgt = null;

  function stofChips(m){
    if(!m.molekyler?.length) return '';
    const chips = m.molekyler.map(id => {
      const s = stof(id);
      if(!s) return '';
      return `<span class="stofchip" style="--sc:${s.farve}">${undslip(s.formel || s.navn)}</span>`;
    }).join('');
    return `<div class="stofrække"><span class="mono">Stoffer</span>${chips}</div>`;
  }

  function eksempelListe(m){
    const eks = forVej(m.id);
    if(!eks.length) return '';
    return `<h3 class="mono ekshoved">Ægte eksempler</h3>
      <ul class="eks">${eks.map(e => `
        <li><b>${undslip(e.navn)}</b>
            <span class="mono">${undslip(e.sted)}</span>
            <p>${undslip(e.tekst)}</p></li>`).join('')}</ul>`;
  }

  function tegnRude(m){
    if(!m){
      felter.stempel.textContent = OVERSIGT.stempel;
      felter.navn.textContent    = OVERSIGT.navn;
      felter.tekst.innerHTML     = OVERSIGT.krop;
      return;
    }
    felter.stempel.textContent = m.slags === 'aktiv' ? 'Aktiv transport' : 'Passiv transport';
    felter.navn.textContent    = m.navn;
    felter.tekst.innerHTML = `
      <p>${undslip(m.beskrivelse)}</p>
      <div class="side-fakta">
        <span class="pille"><span class="mono">Protein</span>${undslip(m.protein ?? 'intet — gennem lipidlaget')}</span>
        <span class="pille"><span class="mono">Energi</span>${undslip(m.energi)}</span>
      </div>
      ${stofChips(m)}
      ${eksempelListe(m)}`;
  }

  function vis(m){
    valgt = m ?? null;
    tegnRude(valgt);
    for(const b of signaturer){
      b.setAttribute('aria-pressed', b.dataset.vej === valgt?.id ? 'true' : 'false');
    }
    felter.tekst.scrollTop = 0;
    naarValgt?.(valgt);
  }

  const efterId = id => mekanismer.find(m => m.id === id) ?? null;

  for(const b of signaturer){
    b.addEventListener('click', () => {
      /* Et klik på den, der allerede er valgt, folder tilbage til
         hele membranen — samme knap ud og ind. */
      vis(b.dataset.vej === valgt?.id ? null : efterId(b.dataset.vej));
    });
  }

  return {
    vis,
    visId(id){ vis(efterId(id)); },
    get valgt(){ return valgt; },
  };
}
