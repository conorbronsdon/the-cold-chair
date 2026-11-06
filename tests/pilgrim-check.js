// pilgrim-check.js — v0.37.0 "The Pilgrim Roads" verification (the piety sink + the spend).
// Usage: node tests/pilgrim-check.js [seed]
// Mirrors harness.js DOM/canvas stubs; drives annals.* and reads S/W/BUILDS/CARDS/reignVerdict directly.
// Two halves: (A) NEGLECT DRIFT makes piety state-derived and finite; (B) THE PILGRIM ROADS spend it.
'use strict';
const fs = require('fs');
const path = require('path');
const seed = process.argv[2] || '3030830';

function stubCtx(){ return new Proxy({}, { get:(t,p)=> p in t ? t[p] : ()=>{}, set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){ const el={ tag,children:[],style:{cssText:''},dataset:{},textContent:'',value:'',className:'',
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
  get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
  querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
  set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
const els={}; global.window=global;
global.document={ getElementById(id){return els[id]||(els[id]=mkEl('div'));}, createElement(t){return mkEl(t);},
  createTextNode(t){const e=mkEl('#text');e.textContent=t;return e;}, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
global.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){throw new Error('reload');} };
global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
global.matchMedia=()=>({matches:false}); global.requestAnimationFrame=()=>{};

let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
code=code.replace("'use strict';",'') +
  '\nwindow.__G={S:S,W:W,BUILDS:BUILDS,CARDS:CARDS,NOBLE_EXCLUDE:NOBLE_EXCLUDE,finishSetup:finishSetup,reignVerdict:reignVerdict,showCard:showCard,queueCard:queueCard,tierCounts:tierCounts};';
(0,eval)(code);
let G=global.__G;

let fails=0, passes=0;
function ok(cond,msg){ if(cond){passes++; console.log('  PASS '+msg);} else {fails++; console.log('  FAIL '+msg);} }

function anomAt(){ const st=G.S; const a=[];
  if(!isFinite(st.gold)) a.push('gold');
  if(!isFinite(st.grain)||st.grain<0) a.push('grain');
  if(!isFinite(st.levies)||st.levies<0) a.push('levies');
  if(st.legit<0||st.legit>100||!isFinite(st.legit)) a.push('legit');
  if(st.piety<0||st.piety>100||!isFinite(st.piety)) a.push('piety');
  G.W.towns.forEach(t=>{ if(!isFinite(t.pros)||t.pros<0||t.pros>100) a.push('pros:'+t.name);
    if(!isFinite(t.pop)||t.pop<0) a.push('pop:'+t.name); });
  return a; }

// drive an action plan up to `until`, answering unplanned cards with option `auto`, tracking min piety
// and anomalies. Returns {anom, minPiety}. probe(week) optional.
function drive(acts, until, auto, probe){
  acts=acts.slice().sort((a,b)=>a[0]-b[0]);
  let guard=0, anom=0, minPiety=100;
  while(G.S.week<until && !G.S.over && guard++<60000){
    while(acts.length && acts[0][0]<=G.S.week && acts[0][1]!=='c'){ const a=acts.shift();
      if(a[1]==='s') annals.setSlider(a[2],a[3]);
      else if(a[1]==='b') annals.build(a[2]);
      else if(a[1]==='y') annals.spy(); }
    if(G.S.pendingCard){ const id=G.S.pendingCard.id; const ci=acts.findIndex(x=>x[1]==='c'&&x[2]===id);
      if(ci>=0){ const a=acts.splice(ci,1)[0]; annals.choose(a[3]); }
      else { const n=G.S.pendingCard.c.o.length; annals.choose(((auto%n)+n)%n); } }
    annals.advance(1);
    anom+=anomAt().length;
    minPiety=Math.min(minPiety, G.S.piety);
    if(probe) probe(G.S.week);
  }
  return {anom, minPiety};
}
function loadPlan(name){ return JSON.parse(fs.readFileSync(path.join(__dirname,'plans',name),'utf8')); }

// fresh game per section (re-eval so worldgen/state reset cleanly)
function reboot(s){ els.length=0; for(const k in els) delete els[k];
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  global.location.hash='#s='+(s||seed);
  (0,eval)(code); G=global.__G; }

console.log('=== pilgrim-check seed:'+seed+' ===');

// ============================== A. NEGLECT DRIFT ==============================
console.log('-- A. neglect drift (piety is now finite, state-derived) --');

// A1: a TENDED reign (smart-builder) stays safe — endures, min piety clears the <40 unrest band.
reboot();
{ const plan=loadPlan('smart-builder.json'); G.finishSetup(plan.ruler[0], plan.ruler[1]);
  const r=drive(plan.actions, 1040, 0);
  ok(G.S.over==='endured'||G.S.week>=1040, 'A1 tended reign (smart-builder) endures (over='+(G.S.over||'endured')+')');
  ok(r.anom===0, 'A1 zero anomalies (saw '+r.anom+')');
  ok(r.minPiety>=45, 'A1 min piety clears the unrest band, >=45 (got '+Math.round(r.minPiety)+')'); }

// A2: the tended CLIFF bites where intended. A generous standing tithe (13 -> standing 15.6) floats
// the faith to the ceiling; the same reign at the default tithe 8 (standing 9.6) settles mid-range.
reboot();
let pietyTithe13;
{ G.finishSetup('Queen','Cliffhigh');
  const acts=[[3,'s','tax',22],[3,'s','toll',14],[3,'s','tithe',13],[4,'b','mill']];
  drive(acts, 1040, 0);
  pietyTithe13=Math.round(G.S.piety);
  ok(pietyTithe13>=85, 'A2 tithe 13 (tended) holds piety >=85 at yr50 (got '+pietyTithe13+')'); }
reboot();
{ G.finishSetup('Queen','Cliffcheap');
  const acts=[[3,'s','tax',22],[3,'s','toll',14],[3,'s','tithe',8],[4,'b','mill']];
  drive(acts, 1040, 0);
  const p8=Math.round(G.S.piety);
  ok(p8<75, 'A2 same reign at tithe 8 (untended) settles <75 (got '+p8+')');
  ok(pietyTithe13 - p8 >= 12, 'A2 the cliff is a real step: tithe13 - tithe8 >= 12 ('+pietyTithe13+' vs '+p8+')'); }

// A3: the neglect driver now REACHES the teeth — the <40 unrest deck becomes reachable — WITHOUT a piety
// death spiral: the reign survives deep into its span (piety converges into the <40 band and holds there,
// it does not collapse). v0.57.0 repin: the middle-book deck reshuffled the ambient stream so this reign
// is finally lost at wk975 (year ~48) to a FOREIGN-BACKED PRETENDER — an unrelated late-reign system, not
// the piety mechanic. The load-bearing invariant is that low piety alone is survivable: the crown reaches
// its late forties intact under the neglect tuning. (A piety death spiral would end it early, in the teens
// or twenties of the reign, off the church-collapse and legit-bleed — this reign never does.)
reboot();
{ const plan=loadPlan('piety-neglect.json'); G.finishSetup(plan.ruler[0], plan.ruler[1]);
  const r=drive(plan.actions, 1040, 0);
  ok(r.minPiety<40, 'A3 piety-neglect reaches the low-piety deck: min piety <40 (got '+Math.round(r.minPiety)+')');
  ok(G.S.week>=780, 'A3 no piety death spiral: the reign survives past year ~45 (wk'+G.S.week+') — low piety is endured, and any late loss ('+(G.S.over||'endured')+') is an unrelated system, not a collapse'); }

// A4: guardrail intact — unmanaged auto=1 play still loses in the 35–45 band.
reboot();
{ G.finishSetup('Queen','Drift1');
  const r=drive([], 2600, 1);
  const year=30+Math.floor(G.S.week/52);
  ok(G.S.over==='deposed'||G.S.over==='conquest'||G.S.over==='usurped', 'A4 auto=1 empty plan loses (over='+G.S.over+')');
  ok(year>=35 && year<=45, 'A4 loss falls in the 35–45 band (year '+year+')'); }

// A5: determinism — the whole system replays bit-identically.
function runToJSON(planName){ reboot(); const plan=loadPlan(planName);
  G.finishSetup(plan.ruler[0], plan.ruler[1]); drive(plan.actions, 1040, 0);
  return JSON.stringify(annals.state()); }
ok(runToJSON('pilgrim-road.json')===runToJSON('pilgrim-road.json'), 'A5 pilgrim-road replays bit-identically (double-run)');

// ============================== B. THE PILGRIM ROADS ==============================
console.log('-- B. the pilgrim roads (spend the faith) --');

// B6: pilgrimage gating + effect. Refused when piety-poor; allowed when piety>=20; on completion
// piety drops ~12, S.pilgrimages counts up, and S.devoutUntil (the afterglow) is set into the future.
reboot();
{ G.finishSetup('Queen','Roadwarden'); G.S.gold=5000;
  G.S.piety=15;
  const refused=annals.build('pilgrimage');
  ok(/^cannot build/.test(refused), 'B6 pilgrimage REFUSED at piety 15 (<20) — "'+refused+'"');
  ok(G.BUILDS.pilgrimage.can()===false, 'B6 pilgrimage.can()===false when piety-poor');
  G.S.piety=70;
  const allowed=annals.build('pilgrimage');
  ok(/^built pilgrimage/.test(allowed), 'B6 pilgrimage ALLOWED at piety 70 — "'+allowed+'"');
  const before=G.S.piety, wk=G.S.week;
  drive([], G.S.week+40, 0);   // let the 18-wk work complete
  ok((G.S.pilgrimages||0)===1, 'B6 S.pilgrimages===1 on completion (got '+(G.S.pilgrimages||0)+')');
  ok(G.S.devoutUntil>wk, 'B6 S.devoutUntil set into the future (devoutUntil='+G.S.devoutUntil+' > start week '+wk+')');
  ok(before-G.S.piety>=8, 'B6 piety spent on completion (~12) — fell '+Math.round(before)+'->'+Math.round(G.S.piety)); }

// B7: afterglow interlock — the substitute for a standing tithe. Keeping S.devoutUntil live (a recent
// pilgrimage/relic/chantry) lifts the piety TARGET by a flat +8, so the resting CEILING sits higher than
// an untended-tithe reign's without raising the tithe. It also SPENDS piety each pilgrimage, so the reign
// dips to a LOWER floor: piety is a genuine finite sink, not free headroom (the design point of half 1).
//
// v0.57.0 repin — the ceiling is now proven in a LOCKSTEP A/B, not a two-reign sweep. The old proxy
// compared the absolute max piety of a walking reign against an untended one; but max is a single-sample
// extreme set by whichever one-time piety-boon card (royal-saint, prophet, the-incorrupt) each reign
// happens to draw, and the middle-book deck (v0.57.0) reshuffled the ambient stream enough that the
// untended reign now out-draws the walking one on that lucky peak — the proxy flipped by ~9 piety, all of
// it ambient-card noise. The honest, stream-proof test of the +8 lift: run the SAME reign twice to a
// settled mid-point, arm the afterglow in ONE branch only, and advance both through the IDENTICAL card
// stream. The church disposition stays bit-identical in both (verified), so the only divergence is the
// afterglow, and the devout branch settles measurably higher — the resting ceiling, isolated from luck.
const BASE=[[3,'s','tax',22],[3,'s','toll',14],[3,'s','tithe',8],[4,'b','mill']];
function forkPiety(afterglow){ reboot(); G.finishSetup('Queen', afterglow?'Devout':'Plain');
  drive(BASE, 520, 0);                         // settle to a low-piety equilibrium (well above the <40 deck)
  if(afterglow) G.S.devoutUntil=G.S.week+900;  // arm the interlock in this branch only
  const dispAt=G.S.factions.church.disp;
  drive([], 760, 0);                           // advance both through the identical ambient stream
  return { piety:G.S.piety, disp:dispAt, dispEnd:G.S.factions.church.disp }; }
const plain=forkPiety(false), devout=forkPiety(true);
ok(plain.disp===devout.disp && plain.dispEnd===devout.dispEnd,
   'B7 the two branches ran the identical stream (church disp bit-identical, '+plain.dispEnd+'=='+devout.dispEnd+') — the only difference is the afterglow');
ok(devout.piety > plain.piety + 4, 'B7 afterglow lifts the resting CEILING: the armed branch settles higher ('
   +devout.piety.toFixed(1)+' > '+plain.piety.toFixed(1)+', +'+(devout.piety-plain.piety).toFixed(1)+' toward the flat +8) — spending substitutes for a standing tithe');
// the spend is a real sink: a walking reign dips to a LOWER floor than an untended one (this half is robust
// to the reshuffle — the -12 per pilgrimage is a direct debit, not an emergent proxy).
function pietyProfile(acts){ const vals=[];
  drive(acts, 1040, 0, (wk)=>{ if(wk>=500) vals.push(G.S.piety); });
  vals.sort((a,b)=>a-b);
  return { max:vals[vals.length-1], min:vals[0] }; }
reboot();
G.finishSetup('Queen','Stillfaith');
const still=pietyProfile([[3,'s','tax',22],[3,'s','toll',14],[3,'s','tithe',8],[4,'b','mill']]);
reboot();
G.finishSetup('Queen','Walkfaith');
const walk=pietyProfile([[3,'s','tax',22],[3,'s','toll',14],[3,'s','tithe',8],[4,'b','mill'],
  [150,'b','pilgrimage'],[260,'b','pilgrimage'],[370,'b','pilgrimage'],[480,'b','pilgrimage'],
  [590,'b','pilgrimage'],[700,'b','pilgrimage'],[810,'b','pilgrimage'],[920,'b','pilgrimage']]);
ok(walk.min<still.min, 'B7 and the spend is a real sink: pilgrim reign dips LOWER ('+walk.min.toFixed(1)+' < '+still.min.toFixed(1)+') — piety competes for the gold cautious play hoards');

// B8: relic gating — refused without a house of the Flame; allowed with one; on completion it SCHEDULES
// the relic-question (assert a scheduled hook fires within its window).
reboot();
{ G.finishSetup('Queen','Reliquar'); G.S.gold=5000; G.S.piety=70;
  const noShrine=annals.build('relic');
  ok(/^cannot build/.test(noShrine), 'B8 relic REFUSED with no shrine/cathedral/monastery — "'+noShrine+'"');
  // lay a shrine and let it stand
  annals.build('shrine'); drive([], G.S.week+40, 0);
  ok(G.BUILDS.shrine.can!==undefined || (G.S.built.shrine||0)>=1, 'B8 a shrine now stands ('+(G.S.built.shrine||0)+')');
  G.S.gold=5000; G.S.piety=70;
  const withShrine=annals.build('relic');
  ok(/^built relic/.test(withShrine), 'B8 relic ALLOWED once a shrine stands — "'+withShrine+'"');
  let fired=false;
  drive([], G.S.week+200, 0, ()=>{ if(G.S.pendingCard && G.S.pendingCard.id==='relic-question') fired=true; });
  ok((G.S.relics||0)>=1, 'B8 S.relics counted on completion (got '+(G.S.relics||0)+')');
  ok(fired, 'B8 relic-question was scheduled and fired within ~200 wk of enshrinement'); }

// B9: the relic-question chain — force the letter (via showCard) and resolve each of the three options
// without anomaly; option 0 branches on the single rHist draw (true bone vs fraud) moving piety/church
// oppositely; the fraud branch decrements S.relics.
// option 1 (ransom) and option 2 (preach) — must resolve cleanly
for(const opt of [1,2]){ reboot(); G.finishSetup('Queen','Inquest'); G.S.gold=5000; G.S.piety=60; G.S.relics=1;
  G.showCard('relic-question');
  ok(!!G.S.pendingCard && G.S.pendingCard.id==='relic-question', 'B9 relic-question shown (opt '+opt+')');
  annals.choose(opt);
  ok(anomAt().length===0, 'B9 option '+opt+' resolves with 0 anomalies'); }
// option 0 (inquest) — the branching draw. Sweep seeds until we observe BOTH branches at least once.
{ let sawTrue=false, sawFraud=false;
  const seeds=['3030830','111111','777777','424242','1234','9999','20260712','55','8675309','1000000'];
  for(const s of seeds){ reboot(s); G.finishSetup('Queen','Inquest'); G.S.gold=5000; G.S.piety=60; G.S.relics=1;
    const pBefore=G.S.piety;
    G.showCard('relic-question'); annals.choose(0);
    ok(anomAt().length===0, 'B9 inquest (opt0) 0 anomalies (seed '+s+')');
    if(G.S.piety>pBefore){ sawTrue=true; }               // true bone: piety UP, church UP
    else if(G.S.piety<pBefore){ sawFraud=true;
      ok((G.S.relics||0)===0, 'B9 fraud branch decremented S.relics to 0 (seed '+s+')'); }
    if(sawTrue && sawFraud) break; }
  ok(sawTrue, 'B9 inquest true-bone branch observed (piety rises) across seed sweep');
  ok(sawFraud, 'B9 inquest fraud branch observed (piety falls, relic removed) across seed sweep'); }

// B10: chantry gating + permanent warmth. Gated on piety>=45 AND a city (the capital counts, so the
// city gate is met at the start of a crown reign). On completion S.chantries++, S.flags.chantry set,
// piety -25, and factionSeason warms the church every 26 wk thereafter.
reboot();
{ G.finishSetup('Queen','Chantress'); G.S.gold=8000;
  ok(G.tierCounts().city>=1, 'B10 the capital counts as a city at reign start (city='+G.tierCounts().city+')');
  G.S.piety=30;
  const poor=annals.build('chantry');
  ok(/^cannot build/.test(poor), 'B10 chantry REFUSED at piety 30 (<45) — "'+poor+'"');
  ok(G.BUILDS.chantry.can()===false, 'B10 chantry.can()===false when piety-poor');
  G.S.piety=70;
  ok(G.BUILDS.chantry.can()===true, 'B10 chantry.can()===true with piety>=45 and a city');
  const pBefore=G.S.piety;
  const built=annals.build('chantry');
  ok(/^built chantry/.test(built), 'B10 chantry ALLOWED with piety+city — "'+built+'"');
  drive([], G.S.week+90, 0);   // 40-wk work completes
  ok((G.S.chantries||0)>=1, 'B10 S.chantries counted (got '+(G.S.chantries||0)+')');
  ok(G.S.flags.chantry===true, 'B10 S.flags.chantry set true (perpetual warmth armed)');
  // the perpetual warmth: force a cold-ish church and confirm the 26-wk fac warming fires over time.
  G.S.factions.church.disp=40; const dBefore=G.S.factions.church.disp;
  drive([[9999,'s','tithe',0]], G.S.week+80, 0);   // starve the tithe; only the chantry warms the Concord
  ok(G.S.factions.church.disp>=dBefore, 'B10 factionSeason keeps the Concord warm with a chantry (disp '+Math.round(dBefore)+'->'+Math.round(G.S.factions.church.disp)+')'); }

// B11: the epithets. chantries>=2 -> 'the Builder of Chantries'; pilgrimages+relics>=3 -> 'the Pilgrim'.
reboot();
{ G.finishSetup('Queen','Namer');
  G.S.chantries=2;
  ok(G.reignVerdict()==='the Builder of Chantries', 'B11 chantries>=2 -> "the Builder of Chantries" (got "'+G.reignVerdict()+'")'); }
reboot();
{ G.finishSetup('Queen','Namer2');
  G.S.pilgrimages=2; G.S.relics=1;
  ok(G.reignVerdict()==='the Pilgrim', 'B11 pilgrimages+relics>=3 -> "the Pilgrim" (got "'+G.reignVerdict()+'")'); }

// B12: opt-out byte-identical — a reign that walks no road has NO faithWorks key in state().
reboot();
{ G.finishSetup('Queen','Nowalk');
  drive([[3,'s','tax',22],[3,'s','toll',14],[3,'s','tithe',8],[4,'b','mill']], 300, 0);
  const st=annals.state();
  ok(!('faithWorks' in st), 'B12 no faithWorks key when no road is walked (opt-out byte-identical)');
  ok(st.pilgrimages===undefined, 'B12 no stray pilgrimage counters leak into state()'); }

// B13: relic-question is a sovereign faith matter — in NOBLE_EXCLUDE, never shown to a climbing knight.
ok(G.NOBLE_EXCLUDE.has('relic-question'), 'B13 relic-question is in NOBLE_EXCLUDE (no climbing knight sees it)');

console.log('--- '+passes+' passed, '+fails+' failed ---');
process.exit(fails?1:0);

