/* ─────────────────────────────────────────────────────────
   smbi.dk — forside
   Levende diagram i heroen + fagfilter på simuleringerne
   ───────────────────────────────────────────────────────── */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rig = document.getElementById('rig');
  const figE = document.getElementById('fig-enzym');
  const figG = document.getElementById('fig-geo');
  const out = {
    k1:document.getElementById('out1-k'), v1:document.getElementById('out1-v'),
    k2:document.getElementById('out2-k'), v2:document.getElementById('out2-v'),
    k3:document.getElementById('out3-k'), v3:document.getElementById('out3-v')
  };
  const NS='http://www.w3.org/2000/svg';
  const num = n => n.toFixed(1).replace('.',',');

  /* ── Enzym: hastighed(T) ── */
  const ex = T => 62 + (T/60)*462;
  const ey = v => 290 - (v/100)*250;
  const raw = T => (1/(1+Math.exp(-(T-22)/6))) * (1/(1+Math.exp((T-44)/2.2)));
  let peak = 0;
  for(let T=0;T<=60;T+=0.25) peak = Math.max(peak, raw(T));
  const rate = T => 100*raw(T)/peak;

  (function drawEnzym(){
    const grid = document.getElementById('enzym-grid');
    for(let T=0;T<=60;T+=10){
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',ex(T));l.setAttribute('x2',ex(T));
      l.setAttribute('y1',40);l.setAttribute('y2',290);
      grid.appendChild(l);
    }
    for(let v=0;v<=100;v+=25){
      const l=document.createElementNS(NS,'line');
      l.setAttribute('y1',ey(v));l.setAttribute('y2',ey(v));
      l.setAttribute('x1',62);l.setAttribute('x2',524);
      grid.appendChild(l);
    }
    const lab = document.getElementById('enzym-labels');
    [0,20,40,60].forEach(T=>{
      const t=document.createElementNS(NS,'text');
      t.setAttribute('class','ax');t.setAttribute('x',ex(T));t.setAttribute('y',303);
      t.setAttribute('text-anchor','middle');t.textContent=T;
      lab.appendChild(t);
    });
    [0,50,100].forEach(v=>{
      const t=document.createElementNS(NS,'text');
      t.setAttribute('class','ax');t.setAttribute('x',56);t.setAttribute('y',ey(v)+3);
      t.setAttribute('text-anchor','end');t.textContent=v;
      lab.appendChild(t);
    });
    let d='', a='M '+ex(0)+' 290';
    for(let T=0;T<=60;T+=0.5){
      const p = ex(T).toFixed(1)+' '+ey(rate(T)).toFixed(1);
      d += (T===0?'M ':'L ') + p + ' ';
      a += ' L ' + p;
    }
    a += ' L '+ex(60)+' 290 Z';
    document.getElementById('enzym-curve').setAttribute('d',d);
    document.getElementById('enzym-area').setAttribute('d',a);
  })();

  const eScan=document.getElementById('enzym-scan'),
        eDot=document.getElementById('enzym-dot'),
        eHalo=document.getElementById('enzym-halo');

  function setEnzym(T){
    const v = rate(T), x = ex(T), y = ey(v);
    eScan.setAttribute('x1',x); eScan.setAttribute('x2',x);
    eDot.setAttribute('cx',x); eDot.setAttribute('cy',y);
    eHalo.setAttribute('cx',x); eHalo.setAttribute('cy',y);
    out.k1.textContent='Temperatur'; out.v1.textContent=num(T)+' °C';
    out.k2.textContent='Hastighed';  out.v2.textContent=Math.round(v)+' %';
    out.k3.textContent='Enzymet';
    out.v3.textContent = T<16 ? 'Træg' : T<32 ? 'Varmer op' : T<43 ? 'Optimum' : 'Denaturerer';
  }

  /* ── Stigningsregn ── */
  const GY0=290, GSC=210/1800;
  const gy = h => GY0 - h*GSC;
  const PEAK=1650, SIG=66, CX=300, LCL=800;
  const terrain = x => PEAK*Math.exp(-Math.pow(x-CX,2)/(2*SIG*SIG));
  const RAIN_TOP=199;

  (function drawTerrain(){
    let d='M 62 290';
    for(let x=62;x<=524;x+=3) d+=' L '+x+' '+gy(terrain(x)).toFixed(1);
    d+=' L 524 290 Z';
    document.getElementById('geo-terrain').setAttribute('d',d);
    const rain=document.getElementById('geo-rain');
    for(let i=0;i<12;i++){
      const l=document.createElementNS(NS,'line');
      l.dataset.x = 148 + i*6.4;
      l.dataset.p = Math.random();
      rain.appendChild(l);
    }
  })();

  const gParcel=document.getElementById('geo-parcel'),
        gHalo=document.getElementById('geo-parcel-halo'),
        rainLines=[...document.getElementById('geo-rain').children];

  const SUMMIT_T = 12-(PEAK-LCL)/200;
  function airTemp(x){
    const h=terrain(x);
    if(x<=CX) return h<=LCL ? 20-h/100 : 12-(h-LCL)/200;
    return SUMMIT_T + (PEAK-h)/100;
  }
  function setGeo(x, tick){
    const h=terrain(x), y=gy(h);
    gParcel.setAttribute('cx',x); gParcel.setAttribute('cy',y);
    gHalo.setAttribute('cx',x); gHalo.setAttribute('cy',y);
    const T=airTemp(x);
    out.k1.textContent='Højde';      out.v1.textContent=Math.round(h/10)*10+' m';
    out.k2.textContent='Temperatur'; out.v2.textContent=num(T)+' °C';
    out.k3.textContent='Luftpakken';
    out.v3.textContent = x>CX ? (h<250?'Varm og tør':'Synker') : h<LCL ? 'Stiger' : 'Giver nedbør';
    rainLines.forEach(l=>{
      const lx=+l.dataset.x, ground=gy(terrain(lx));
      const span=Math.max(ground-RAIN_TOP,4);
      const p=((tick*0.45 + l.dataset.p*span) % span);
      l.setAttribute('x1',lx); l.setAttribute('x2',lx-1.5);
      l.setAttribute('y1',RAIN_TOP+p);
      l.setAttribute('y2',Math.min(RAIN_TOP+p+7, ground));
    });
  }

  /* ── Tilstand & skift ── */
  const SIM = {
    enzym:{navn:'Enzymhastighed & temperatur', url:'biologi/enzymhastighed.html'},
    geo:  {navn:'Stigningsregn & føhn-effekt', url:'geografi/Stigningsregn.html'}
  };
  const rigName=document.getElementById('rig-name'), rigLink=document.getElementById('rig-link');

  let mode='enzym', phase=0, gx=62, tick=0, userPicked=false;
  const tabs=[...document.querySelectorAll('.rig-tab')];

  function apply(m){
    mode=m;
    rig.style.setProperty('--accent', m==='enzym'?'var(--bio)':'var(--geo)');
    figE.style.transition='opacity .45s'; figG.style.transition='opacity .45s';
    figE.style.opacity = m==='enzym'?1:0;
    figG.style.opacity = m==='geo'?1:0;
    tabs.forEach(t=>t.setAttribute('aria-selected', String(t.dataset.mode===m)));
    rigName.textContent = SIM[m].navn;
    rigLink.setAttribute('href', SIM[m].url);
    if(m==='geo') gx=62; else phase=Math.PI*1.5;
    if(reduce){ m==='enzym' ? setEnzym(37) : setGeo(300,0); }
  }
  tabs.forEach(t=>t.addEventListener('click',()=>{userPicked=true;apply(t.dataset.mode);}));

  if(reduce){
    setEnzym(37);
    setGeo(300,0);
  }else{
    phase=Math.PI*1.5;
    let last=performance.now(), swap=0;
    (function loop(now){
      const dt=Math.min((now-last)/1000,0.05); last=now; tick+=dt*60;
      if(mode==='enzym'){
        phase += dt*0.55;
        setEnzym(30 + 28*Math.sin(phase));
      }else{
        gx += dt*42;
        if(gx>524) gx=62;
        setGeo(gx, tick);
      }
      if(!userPicked){
        swap+=dt;
        if(swap>15){ swap=0; apply(mode==='enzym'?'geo':'enzym'); }
      }
      requestAnimationFrame(loop);
    })(last);
  }

  /* ── Fagfilter på simuleringerne ── */
  const chips=[...document.querySelectorAll('.chip')];
  const blocks=[...document.querySelectorAll('[data-grp]')];
  chips.forEach(c=>c.addEventListener('click',()=>{
    chips.forEach(o=>o.setAttribute('aria-pressed',String(o===c)));
    const f=c.dataset.f;
    blocks.forEach(b=>b.classList.toggle('is-off', f!=='alle' && b.dataset.grp!==f));
  }));

  /* ── Årstal i bunden ── */
  const y=document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();
