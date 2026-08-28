/* ═══════════════════════════════════════════════════════════
   model.js — lærredet, kameraet og render-løkken.

   Rammen om figuren, og intet andet: den ved ikke, at der findes
   en membran. Den giver et koordinatsystem i lærredets egne
   enheder, et kamera der kan zoome ind på et udsnit, og en løkke
   der kalder de tegnere, siden har meldt ind.

   Kameraet er hele pointen i, at der kan stå syv transportveje i
   den samme membran: hele membranen er oversigten, og et klik
   zoomer ind, så ionerne bliver store nok til at kunne følges.
   ═══════════════════════════════════════════════════════════ */

const blødt = typeof matchMedia === 'undefined'
  || !matchMedia('(prefers-reduced-motion: reduce)').matches;

export function byggLaerred({lærred, boks, bredde, højde}){
  const g = lærred.getContext('2d');

  /* Kameraet: (cx, cy) er midten i lærredets enheder, `skala` er
     hvor mange gange figuren er forstørret i forhold til, at hele
     bredden lige akkurat er synlig. */
  const kam  = {cx:bredde / 2, cy:højde / 2, skala:1};
  const mål  = {...kam};
  let hjem   = {...kam};

  let cssB = 0, cssH = 0, dpr = 1;
  const tegnere  = [];
  const skridt   = [];
  let kører = false, pause = false, sidst = 0;

  /* ── Størrelse ───────────────────────────────────────── *
   * Bredden læses af lærredet selv, ikke af kassen omkring det.
   * På en telefon er figuren bredere end skærmen og har sin egen
   * vandrette rulning (`min-width` i CSS'en), og så er de to tal
   * ikke de samme. Højden sættes ikke i CSS: den følger af
   * width/height-attributterne, som holder forholdet fast.        */
  function tilpasStoerrelse(){
    const stil = getComputedStyle(boks);
    const kasse = boks.clientWidth
      - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight);
    const b = Math.max(240, Math.round(lærred.clientWidth || kasse));
    const h = Math.round(b * højde / bredde);
    dpr = Math.min(devicePixelRatio || 1, 2);
    if(b === cssB && h === cssH) return;
    cssB = b; cssH = h;
    lærred.width  = Math.round(b * dpr);
    lærred.height = Math.round(h * dpr);
    tegn();
  }
  new ResizeObserver(tilpasStoerrelse).observe(boks);
  new ResizeObserver(tilpasStoerrelse).observe(lærred);

  /* ── Kameraets grænser ───────────────────────────────── *
   * Kun højden holdes inde i figuren. På tværs må kameraet gerne
   * gå ud over lærredets kant: ellers kan den yderste transportvej
   * aldrig komme i midten af billedet, når der zoomes ind på den.
   * Til gengæld skal det, der tegnes, række ud over kanten — se
   * UDENFOR i struktur.js og vand.js.                            */
  function hold(k){
    const halvH = højde / (2 * k.skala);
    k.cy = halvH * 2 >= højde ? højde / 2
         : Math.min(højde - halvH, Math.max(halvH, k.cy));
    return k;
  }

  /** Zoom ind, så kassen {x0,y0,x1,y1} fylder billedet. */
  function zoomTil(kasse){
    const b = Math.max(1, kasse.x1 - kasse.x0);
    const h = Math.max(1, kasse.y1 - kasse.y0);
    mål.skala = Math.max(1, Math.min(bredde / b, højde / h));
    mål.cx = (kasse.x0 + kasse.x1) / 2;
    mål.cy = (kasse.y0 + kasse.y1) / 2;
    hold(mål);
  }

  function visAlt(){ Object.assign(mål, hjem); }
  function saetHjem(k){ hjem = hold({...kam, ...k}); }

  function følgKamera(dt){
    const f = blødt ? 1 - Math.exp(-dt * 6.5) : 1;
    kam.cx    += (mål.cx    - kam.cx)    * f;
    kam.cy    += (mål.cy    - kam.cy)    * f;
    kam.skala += (mål.skala - kam.skala) * f;
  }

  /* ── Koordinater ─────────────────────────────────────── */
  const enhed = () => (cssB / bredde) * kam.skala;

  function sætTransform(){
    const s = enhed() * dpr;
    g.setTransform(s, 0, 0, s,
      cssB * dpr / 2 - kam.cx * s,
      cssH * dpr / 2 - kam.cy * s);
  }

  /** Et punkt på skærmen om til lærredets enheder. */
  function tilLogisk(ev){
    const r = lærred.getBoundingClientRect();
    const s = enhed();
    return {
      x: (ev.clientX - r.left - cssB / 2) / s + kam.cx,
      y: (ev.clientY - r.top  - cssH / 2) / s + kam.cy,
    };
  }

  /** Det udsnit, kameraet ser lige nu — bruges til at lade være
      med at tegne det, der alligevel er uden for billedet. */
  function udsnit(){
    const halvB = bredde / (2 * kam.skala), halvH = højde / (2 * kam.skala);
    return {x0:kam.cx - halvB, x1:kam.cx + halvB, y0:kam.cy - halvH, y1:kam.cy + halvH};
  }

  /* ── Løkken ──────────────────────────────────────────── */
  function tegn(){
    if(!cssB) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, lærred.width, lærred.height);
    sætTransform();
    const u = udsnit();
    for(const t of tegnere) t(g, u, kam);
  }

  function billede(nu){
    if(!kører) return;
    requestAnimationFrame(billede);
    const dt = Math.min(0.05, (nu - sidst) / 1000 || 0);
    sidst = nu;
    følgKamera(dt);
    if(!pause) for(const s of skridt) s(nu / 1000, dt);
    tegn();
  }

  return {
    bredde, højde, kamera:kam,
    naarSkridt: cb => skridt.push(cb),
    naarTegn:   cb => tegnere.push(cb),
    zoomTil, visAlt, saetHjem, tilLogisk, udsnit, tilpasStoerrelse, tegn,
    enhed,
    sætPause(v){ pause = v; },
    erZoomet: () => kam.skala > 1.04,
    start(){
      if(kører) return;
      kører = true; sidst = performance.now();
      tilpasStoerrelse();
      requestAnimationFrame(billede);
    },
  };
}
