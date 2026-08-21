/* ═══════════════════════════════════════════════════════════
   scene.js — figurens opbygning.

   Bygger hele SVG'en: himlen med solen, jorden, planten der
   vokser, og den forstørrede bladcelle med kloroplast,
   glukoselager og mitokondrie. Modulet regner ikke på biologi —
   det tegner kun det, model.js og side.js beder om, og kender
   koordinaterne til de steder, molekylerne skal flyve hen.
   ═══════════════════════════════════════════════════════════ */
import {tegnMolekyle} from './molekyler.js';

const NS = 'http://www.w3.org/2000/svg';

/* Scenens faste mål. Alt andet regnes ud fra dem. */
export const MAAL = {
  bredde:920, hoejde:470,
  horisont:362,
  plante:{x:235, fod:362},
  celle:{x:470, y:28, b:435, h:316},
  kloroplast:{x:690, y:150, rx:125, ry:88},
  mitokondrie:{x:838, y:298, rx:52, ry:34},
  lager:{x:512, y:305, spring:30, maks:8},
  slots:{spring:38, yCo2:132, yH2o:182, r:14},
};

/* Molekylerne i luften og i jorden ligger på faste pladser, så
   billedet står roligt, og eleven kan tælle dem: seks af hver. */
export const PLADSER = {
  co2:[[64,84],[142,170],[66,258],[318,48],[402,66],[356,300]],
  h2o:[[62,402],[132,442],[210,406],[292,444],[366,404],[440,440]],
};

const el = (navn, attrs = {}) => {
  const n = document.createElementNS(NS, navn);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};
const tekst = (s, attrs) => { const t = el('text', attrs); t.textContent = s; return t; };
const flyt = (n, x, y, skala) =>
  n.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')' + (skala ? ' scale('+skala+')' : ''));

export function byggScene(svg){
  svg.setAttribute('viewBox','0 0 '+MAAL.bredde+' '+MAAL.hoejde);

  const lag = {};
  for (const navn of ['himmel','stjerner','sol','jord','plante','celle','zoner','molekyler']){
    lag[navn] = el('g',{'class':'lag-'+navn});
    svg.appendChild(lag[navn]);
  }

  /* ── Himmel og døgn ─────────────────────────────────── */
  lag.himmel.appendChild(el('rect',{x:0,y:0,width:MAAL.bredde,height:MAAL.horisont,fill:'#12203A'}));
  const dagFlade = el('rect',{x:0,y:0,width:MAAL.bredde,height:MAAL.horisont,fill:'#C7E6F6'});

  /* Sol op og sol ned: en varm stribe nede ved horisonten, ikke en
     orange dug ud over hele himlen. */
  const defs = el('defs');
  const grad = el('linearGradient',{id:'skumring',x1:0,y1:0,x2:0,y2:1});
  grad.append(
    el('stop',{offset:'0%','stop-color':'#FF9E4D','stop-opacity':0}),
    el('stop',{offset:'60%','stop-color':'#FF9E4D','stop-opacity':0.55}),
    el('stop',{offset:'100%','stop-color':'#FFC98A','stop-opacity':0.9}),
  );
  defs.appendChild(grad);
  svg.appendChild(defs);
  const skumFlade = el('rect',{x:0,y:0,width:MAAL.bredde,height:MAAL.horisont,
                               fill:'url(#skumring)',opacity:0});
  lag.himmel.append(dagFlade, skumFlade);
  /* skydækket lægger sig som grå dug over det hele — også over solen,
     så en overskyet dag også ser overskyet ud */
  const skyFlade = el('rect',{x:0,y:0,width:MAAL.bredde,height:MAAL.horisont,
                              fill:'#6E7B84',opacity:0});

  const stjerner = [];
  const froe = [[90,54],[210,38],[318,72],[470,44],[556,36],[640,58],[760,40],[860,66],
               [140,120],[286,140],[398,110],[820,132],[64,170],[900,180]];
  for (const [x,y] of froe){
    const s = el('circle',{cx:x,cy:y,r:(x%3)*0.6+1.4,fill:'#FFF6E0'});
    stjerner.push(s); lag.stjerner.appendChild(s);
  }

  const solStraaler = el('g',{});
  for (let i=0;i<12;i++){
    const v = i*Math.PI/6;
    solStraaler.appendChild(el('line',{
      x1:(Math.cos(v)*30).toFixed(1), y1:(Math.sin(v)*30).toFixed(1),
      x2:(Math.cos(v)*41).toFixed(1), y2:(Math.sin(v)*41).toFixed(1),
      stroke:'#17211F','stroke-width':2.4,'stroke-linecap':'round',
    }));
  }
  const sol = el('g',{});
  sol.append(el('circle',{r:26,fill:'#FFD43B',stroke:'#17211F','stroke-width':2.5}), solStraaler);
  const maane = el('g',{});
  maane.append(
    el('circle',{r:20,fill:'#FFF6E0',stroke:'#17211F','stroke-width':2.5}),
    el('circle',{cx:-7,cy:-4,r:4,fill:'#D8D2C0'}),
    el('circle',{cx:6,cy:5,r:5.5,fill:'#D8D2C0'}),
  );
  lag.sol.append(sol, maane, skyFlade);

  /* ── Jorden ─────────────────────────────────────────── */
  lag.jord.appendChild(el('rect',{
    x:0,y:MAAL.horisont,width:MAAL.bredde,height:MAAL.hoejde-MAAL.horisont,fill:'#D9BE92',
  }));
  lag.jord.appendChild(el('line',{
    x1:0,y1:MAAL.horisont,x2:MAAL.bredde,y2:MAAL.horisont,stroke:'#17211F','stroke-width':2.5,
  }));
  for (let i=0;i<26;i++){
    const x = 18 + (i*37) % (MAAL.bredde-30);
    const y = MAAL.horisont + 16 + ((i*53) % 84);
    lag.jord.appendChild(el('circle',{cx:x,cy:y,r:2.2,fill:'#B99A69'}));
  }

  /* ── Planten ────────────────────────────────────────── */
  const plante = el('g',{});
  lag.plante.appendChild(plante);

  function tegnPlante(biomasse, sulten){
    plante.textContent = '';
    const {x, fod} = MAAL.plante;

    for (const [dx,dy] of [[-34,44],[0,52],[34,44]]){
      plante.appendChild(el('path',{
        d:'M'+x+' '+fod+' Q'+(x+dx*0.4)+' '+(fod+dy*0.6)+' '+(x+dx)+' '+(fod+dy),
        fill:'none',stroke:'#9C7B4E','stroke-width':3,'stroke-linecap':'round',
      }));
    }

    if (sulten){
      plante.appendChild(el('path',{
        d:'M'+x+' '+fod+' q4 -26 -8 -36',
        fill:'none',stroke:'#8A7A5A','stroke-width':6,'stroke-linecap':'round',
      }));
      plante.appendChild(el('path',{
        d:'M'+(x-8)+' '+(fod-36)+' q-20 2 -24 16 q18 6 24 -16 z',
        fill:'#B6A88B',stroke:'#17211F','stroke-width':2,
      }));
      return;
    }

    const hoejde = 60 + 168*(1 - Math.exp(-biomasse/9));
    const top = fod - hoejde;
    plante.appendChild(el('path',{
      d:'M'+x+' '+fod+' C'+(x-7)+' '+(fod-hoejde*0.45)+' '+(x+7)+' '+(fod-hoejde*0.7)+' '+x+' '+top,
      fill:'none',stroke:'#4C8C2A','stroke-width':7,'stroke-linecap':'round',
    }));

    const antal = Math.max(1, Math.min(9, 2 + Math.floor(biomasse/3)));
    for (let i=0;i<antal;i++){
      const f = antal === 1 ? 0.62 : 0.30 + 0.62*(i/(antal-1));
      const y0 = fod - hoejde*f;
      const side = i % 2 ? 1 : -1;
      const L = 54, B = 23;
      plante.appendChild(el('path',{
        d:'M'+x+' '+y0+
          ' Q'+(x+side*L*0.5)+' '+(y0-B)+' '+(x+side*L)+' '+(y0-L*0.30)+
          ' Q'+(x+side*L*0.55)+' '+(y0+B*0.5)+' '+x+' '+y0+' z',
        fill:'#6FBF3A',stroke:'#17211F','stroke-width':2.2,'stroke-linejoin':'round',
      }));
      plante.appendChild(el('path',{
        d:'M'+x+' '+y0+' Q'+(x+side*L*0.55)+' '+(y0-B*0.25)+' '+(x+side*L*0.94)+' '+(y0-L*0.29),
        fill:'none',stroke:'#3E7A1F','stroke-width':1.6,
      }));
    }

    /* knop i toppen, så man kan se højden vokse */
    plante.appendChild(el('circle',{cx:x,cy:top,r:6,fill:'#8FE07A',stroke:'#17211F','stroke-width':2.2}));
  }

  /* ── Forstørrelseslinjerne ud til cellen ────────────── */
  const c = MAAL.celle;
  for (const [y1,y2] of [[188,c.y],[214,c.y+c.h]]){
    lag.celle.appendChild(el('line',{
      x1:312,y1,x2:c.x,y2,stroke:'#17211F','stroke-width':2,
      'stroke-dasharray':'6 7',opacity:.55,
    }));
  }

  /* ── Bladcellen ─────────────────────────────────────── */
  lag.celle.appendChild(el('rect',{
    x:c.x,y:c.y,width:c.b,height:c.h,rx:26,
    fill:'#FFF9EE',stroke:'#17211F','stroke-width':2.5,
  }));
  lag.celle.appendChild(el('rect',{
    x:c.x+7,y:c.y+7,width:c.b-14,height:c.h-14,rx:20,
    fill:'none',stroke:'#17211F','stroke-width':1.4,opacity:.45,
  }));
  lag.celle.appendChild(tekst('Bladcelle',{'class':'svg-mono',x:c.x+20,y:c.y+26,fill:'#566B68'}));

  const kl = MAAL.kloroplast;
  const kloroplast = el('ellipse',{
    cx:kl.x,cy:kl.y,rx:kl.rx,ry:kl.ry,
    fill:'#D6EFC4',stroke:'#17211F','stroke-width':2.5,
  });
  lag.celle.appendChild(kloroplast);
  for (let i=0;i<3;i++){
    const gx = kl.x - 70 + i*70, gy = kl.y + 66;
    for (let j=0;j<3;j++){
      lag.celle.appendChild(el('rect',{
        x:gx-13,y:gy-8+j*6,width:26,height:4,rx:2,fill:'#4C8C2A',opacity:.55,
      }));
    }
  }
  lag.celle.appendChild(tekst('Kloroplast',{'class':'svg-mono',x:kl.x,y:kl.y-62,fill:'#2F5B1C','text-anchor':'middle'}));

  /* pladserne til de 6 + 6 råvarer */
  const slots = {co2:[], h2o:[]};
  const slotTal = {};
  for (const type of ['co2','h2o']){
    const y = type === 'co2' ? MAAL.slots.yCo2 : MAAL.slots.yH2o;
    for (let i=0;i<6;i++){
      const x = slotX(i);
      const ring = el('circle',{
        cx:x,cy:y,r:MAAL.slots.r,fill:'#FFF9EE',stroke:'#17211F',
        'stroke-width':1.8,'stroke-dasharray':'4 4',opacity:.75,
      });
      lag.celle.appendChild(ring);
      slots[type].push(ring);
    }
    slotTal[type] = tekst('',{
      'class':'svg-mono',x:kl.x-kl.rx-8,y:y+4,fill:'#2F5B1C','text-anchor':'end',
    });
    lag.celle.appendChild(slotTal[type]);
  }

  const slotIndhold = el('g',{});
  lag.celle.appendChild(slotIndhold);

  /* glukoselageret */
  lag.celle.appendChild(tekst('Glukoselager',{'class':'svg-mono',x:c.x+20,y:MAAL.lager.y-26,fill:'#566B68'}));
  const lagerHylde = el('g',{});
  lag.celle.appendChild(lagerHylde);

  /* mitokondriet */
  const mi = MAAL.mitokondrie;
  const mito = el('g',{});
  mito.appendChild(el('ellipse',{
    cx:mi.x,cy:mi.y,rx:mi.rx,ry:mi.ry,fill:'#FFD9C9',stroke:'#17211F','stroke-width':2.5,
  }));
  mito.appendChild(el('path',{
    d:'M'+(mi.x-32)+' '+(mi.y-12)+' q12 12 0 24 q12 12 24 0 q12 -12 24 0',
    fill:'none',stroke:'#C4552B','stroke-width':2.4,'stroke-linecap':'round',
  }));
  lag.celle.appendChild(mito);
  lag.celle.appendChild(tekst('Mitokondrie',{'class':'svg-mono',x:mi.x,y:mi.y-mi.ry-10,fill:'#A8431F','text-anchor':'middle'}));

  /* ── Slipzoner ──────────────────────────────────────── */
  const zoner = {
    plante:el('rect',{x:140,y:112,width:196,height:250,rx:18,'class':'zone'}),
    celle: el('rect',{x:c.x,y:c.y,width:c.b,height:c.h,rx:26,'class':'zone'}),
  };
  lag.zoner.append(zoner.plante, zoner.celle);

  /* ── Opdateringer udefra ────────────────────────────── */
  function saetHimmel(hoejde, skydaekke, klokken){
    const dag = Math.min(1, hoejde*2.6);
    dagFlade.setAttribute('opacity', dag.toFixed(3));
    /* den varme stribe hører til solopgang og solnedgang, ikke til lyset */
    const naer = Math.max(1 - Math.abs(klokken-6)/1.8, 1 - Math.abs(klokken-18)/1.8);
    skumFlade.setAttribute('opacity', Math.max(0, Math.min(1, naer)).toFixed(3));
    skyFlade.setAttribute('opacity', ((1 - skydaekke/100) * 0.72 * dag).toFixed(3));
    for (const s of stjerner) s.setAttribute('opacity', (1-dag).toFixed(3));

    const lyst = klokken > 6 && klokken < 18;
    sol.setAttribute('opacity', lyst ? 1 : 0);
    maane.setAttribute('opacity', lyst ? 0 : 1);
    if (lyst){
      const f = (klokken-6)/12;
      flyt(sol, 46 + 424*f, MAAL.horisont - 292*Math.sin(Math.PI*f));
    } else {
      const t = klokken >= 18 ? klokken-18 : klokken+6;
      const f = t/12;
      flyt(maane, 46 + 424*f, MAAL.horisont - 214*Math.sin(Math.PI*f));
    }
  }

  function saetSlots(co2, h2o){
    slotIndhold.textContent = '';
    for (const [type, antal] of [['co2',co2],['h2o',h2o]]){
      slots[type].forEach((ring,i) => {
        const fyldt = i < antal;
        ring.setAttribute('fill', fyldt ? '#FFFFFF' : '#FFF9EE');
        ring.setAttribute('stroke-dasharray', fyldt ? 'none' : '4 4');
        ring.setAttribute('opacity', fyldt ? 1 : .75);
        if (!fyldt) return;
        const m = tegnMolekyle(type, {navn:false});
        const p = slotPos(type, i);
        flyt(m, p.x, p.y, 0.6);
        slotIndhold.appendChild(m);
      });
      slotTal[type].textContent = antal + '/6';
    }
  }

  function saetLager(antal){
    lagerHylde.textContent = '';
    const vist = Math.min(antal, MAAL.lager.maks);
    for (let i=0;i<vist;i++){
      const g = tegnMolekyle('glukose',{navn:false});
      flyt(g, MAAL.lager.x + i*MAAL.lager.spring, MAAL.lager.y, 0.82);
      lagerHylde.appendChild(g);
    }
    if (antal > MAAL.lager.maks){
      lagerHylde.appendChild(tekst('+'+(antal-MAAL.lager.maks),{
        'class':'svg-navn',x:MAAL.lager.x + MAAL.lager.maks*MAAL.lager.spring,
        y:MAAL.lager.y+5,fill:'#17211F','text-anchor':'middle',
      }));
    }
  }

  /* Et kort puls i kanten, når en af de to processer kører. Kanten
     tykner — farven bliver ikke lysere, for så ville kloroplasten
     blege ud hver gang. */
  function blink(hvad){
    const n = hvad === 'foto' ? kloroplast : mito.firstChild;
    n.animate?.(
      [{strokeWidth:'2.5px'},{strokeWidth:'6px'},{strokeWidth:'2.5px'}],
      {duration:620, easing:'ease-out'},
    );
  }

  return {svg, lag, zoner, tegnPlante, saetHimmel, saetSlots, saetLager, blink};
}

export function slotX(i){
  return MAAL.kloroplast.x + (i - 2.5) * MAAL.slots.spring;
}
export function slotPos(type, i){
  return {x:slotX(i), y:type === 'co2' ? MAAL.slots.yCo2 : MAAL.slots.yH2o};
}
export function lagerPos(i){
  return {x:MAAL.lager.x + Math.min(i, MAAL.lager.maks-1)*MAAL.lager.spring, y:MAAL.lager.y};
}
/* Et tilfældigt sted i luften eller i jorden — dér kommer og går
   molekylerne, når modellen selv leverer dem. */
export function luftPos(){
  return {x:60 + Math.random()*380, y:50 + Math.random()*200};
}
export function jordPos(){
  return {x:60 + Math.random()*380, y:MAAL.horisont + 26 + Math.random()*70};
}
export const kloroplastPos = () => ({x:MAAL.kloroplast.x, y:MAAL.kloroplast.y});
export const mitokondriePos = () => ({x:MAAL.mitokondrie.x, y:MAAL.mitokondrie.y});
export const plantePos = () => ({x:MAAL.plante.x, y:MAAL.plante.fod - 120});
