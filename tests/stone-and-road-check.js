// stone-and-road-check.js — R3 (Stone & Road) verification.
// Usage: node tests/stone-and-road-check.js <mode> [seed]
//   modes: works | lever | harbor | wonder-valley | gate
// Mirrors harness.js DOM/canvas stubs; drives annals.* and reads S/W/BUILDS directly.
'use strict';
const fs = require('fs');
const path = require('path');
const mode = process.argv[2] || 'works';
const seed = process.argv[3] || '3030830';

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
code=code.replace("'use strict';",'') + '\nwindow.__G={S:S,W:W,BUILDS:BUILDS,CARDS:CARDS,finishSetup:finishSetup};';
(0,eval)(code);
const G=global.__G;

let fails=0, passes=0;
function ok(cond,msg){ if(cond){passes++; console.log('  PASS '+msg);} else {fails++; console.log('  FAIL '+msg);} }

// anomaly checker (same conditions as harness)
function anomAt(){ const st=G.S; const a=[];
  if(!isFinite(st.gold)) a.push('gold');
  if(!isFinite(st.grain)||st.grain<0) a.push('grain');
  if(!isFinite(st.levies)||st.levies<0) a.push('levies');
  if(st.legit<0||st.legit>100||!isFinite(st.legit)) a.push('legit');
  if(st.piety<0||st.piety>100||!isFinite(st.piety)) a.push('piety');
  G.W.towns.forEach(t=>{ if(!isFinite(t.pros)||t.pros<0||t.pros>100) a.push('pros:'+t.name);
    if(!isFinite(t.pop)||t.pop<0) a.push('pop:'+t.name); });
  return a; }

// drive with an action plan up to `until`, answering unplanned cards with option `auto`, running an
// optional per-week probe. Returns total anomaly count seen.
function drive(acts, until, auto, probe){
  acts=acts.slice().sort((a,b)=>a[0]-b[0]);
  let guard=0, anom=0;
  while(G.S.week<until && !G.S.over && guard++<40000){
    while(acts.length && acts[0][0]<=G.S.week && acts[0][1]!=='c'){ const a=acts.shift();
      if(a[1]==='s') annals.setSlider(a[2],a[3]);
      else if(a[1]==='b') annals.build(a[2]);
      else if(a[1]==='y') annals.spy(); }
    if(G.S.pendingCard){ const id=G.S.pendingCard.id; const ci=acts.findIndex(x=>x[1]==='c'&&x[2]===id);
      if(ci>=0){ const a=acts.splice(ci,1)[0]; annals.choose(a[3]); }
      else { const n=G.S.pendingCard.c.o.length; annals.choose(((auto%n)+n)%n); } }
    annals.advance(1);
    anom+=anomAt().length;
    if(probe) probe();
  }
  return anom;
}
function loadPlan(name){ return JSON.parse(fs.readFileSync(path.join(__dirname,'plans',name),'utf8')); }

console.log('=== mode:'+mode+' seed:'+seed+' ===');

if(mode==='works' || mode==='lever'){
  const plan=loadPlan('stone-and-road.json');
  G.finishSetup(plan.ruler[0], plan.ruler[1]);
  // snapshots for the --auto=0 lever proof; debase decays over a reign so track its PEAK
  let beforeStrike=null, afterStrike=null, peakDebase=0;
  const anom=drive(plan.actions, 1040, 0, ()=>{
    peakDebase=Math.max(peakDebase, G.S.flags.debase||0);
    if(G.S.week===639 && !beforeStrike) beforeStrike={legit:Math.round(G.S.legit), piety:Math.round(G.S.piety), gold:Math.round(G.S.gold)};
    if(G.S.week===705 && !afterStrike) afterStrike={legit:Math.round(G.S.legit), piety:Math.round(G.S.piety), gold:Math.round(G.S.gold)};
  });
  const b=G.S.built, f=G.S.flags;
  if(mode==='works'){
    ok(G.S.over==='endured'||G.S.week>=1040, 'reign endures (over='+G.S.over+', week='+G.S.week+')');
    ok(anom===0, 'zero anomalies across the reign (saw '+anom+')');
    const need={mill:5,market:1,roads:3,monastery:1,bridge:1,guildhall:1,dam:1,canal:1,beacon:1,beaconchain:1,university:1,mint:1,walls:1,bulwark:1};
    for(const k in need) ok((b[k]||0)>=need[k], 'built '+k+'>='+need[k]+' (got '+(b[k]||0)+')');
    ok((b.strikecoin||0)>=3, 'strikecoin struck >=3 times (got '+(b.strikecoin||0)+')');
    ok(peakDebase>=3, 'debasement PEAKED >=3 (got '+peakDebase+'; heals to '+(f.debase||0)+' by reign end)');
    ok(b.mill===5, 'canal opened mill-seats 4 & 5 (mill.max now '+G.BUILDS.mill.max+')');
    ok(!!f.mint && !!f.canal && !!f.monastery, 'work flags set (mint/canal/monastery on)');
  } else {
    // lever proof
    console.log('  legit/piety/gold BEFORE first strike (wk639): '+JSON.stringify(beforeStrike));
    console.log('  legit/piety/gold AFTER  strikes    (wk705): '+JSON.stringify(afterStrike));
    console.log('  legit at reign end (yr50): '+Math.round(G.S.legit)+'  debase='+ (f.debase||0));
    ok(beforeStrike && afterStrike, 'captured before/after snapshots');
    ok(afterStrike.legit < beforeStrike.legit, 'legitimacy DROPPED across the strikes ('+beforeStrike.legit+'->'+afterStrike.legit+') — gold now competes with legitimacy');
    ok(afterStrike.gold > beforeStrike.gold, 'gold ROSE across the strikes ('+beforeStrike.gold+'->'+afterStrike.gold+') — the purse swelled at legitimacy'+"'"+'s expense');
    ok(peakDebase>=3, 'debasement PEAKED >=3 (got '+peakDebase+') — false-coin arc armed');
    ok(Math.round(G.S.legit) > afterStrike.legit, 'legitimacy RECOVERED by reign end ('+afterStrike.legit+'->'+Math.round(G.S.legit)+') — scarce-but-recoverable, not a death spiral');
  }
}
else if(mode==='harbor'){
  G.finishSetup('Queen','Gatekeep');
  annals.setSlider('tax',22); annals.setSlider('toll',14);
  // week 10: no roads, one city -> harbor must be gated out
  drive([], 10, 0);
  const early=annals.build('harbor');
  ok(/^cannot build/.test(early), 'harbor build at wk10 REFUSED (no roads, one city) — "'+early+'"');
  ok((G.S.built.harbor||0)===0 && G.S.projects.filter(p=>p.k==='harbor').length===0, 'no harbor project queued');
  ok(!G.BUILDS.harbor.can(), 'harbor.can()==false with one city and no roads');
  // lay a road, wait for it, then harbor is allowed
  annals.build('roads');
  drive([], 60, 0);   // road (26wk) completes
  ok((G.S.built.roads||0)>=1, 'a stone-road network stands ('+(G.S.built.roads||0)+')');
  ok(G.BUILDS.harbor.can(), 'harbor.can()==true once a road network stands');
  const late=annals.build('harbor');
  ok(/^built harbor/.test(late), 'harbor build ALLOWED once a road network stands — "'+late+'"');
}
else if(mode==='wonder-valley'){
  // valley seed: grow the prerequisites (city[capital] + dam + roads), then the Great Weir
  G.finishSetup('Queen','Vael');
  const acts=[[3,'s','tax',24],[3,'s','toll',15],[3,'s','tithe',11],
    [4,'b','mill'],[30,'b','charter'],[60,'b','market'],[90,'b','roads'],
    [200,'b','dam'],[360,'b','w_weir']];
  const anom=drive(acts, 1040, 0);
  const b=G.S.built, f=G.S.flags;
  ok((b.w_weir||0)>=1, 'The Great Weir was built on a valley realm (got '+(b.w_weir||0)+')');
  ok(f.wonder==='weir', "S.flags.wonder==='weir'");
  ok(f.noFlood===true, 'the weir ends floods (noFlood)');
  ok(G.S.over==='endured'||G.S.week>=1040, 'reign endures with the wonder');
  ok(anom===0, 'zero anomalies (got '+anom+')');
  const leaf=annals.leafData();
  const w10=leaf.moments.find(m=>m.weight===10 && /Great Weir/.test(m.text));
  ok(!!w10, 'weight-10 Great Weir moment present in leafData().moments');
  console.log('  leafJudgment (as-run): '+leaf.judgment);
  // The wonder note sits above the prosperity fallback but below burned/allied/sacked (per spec §3e).
  // Prove the branch fires by neutralising any higher-priority note, then re-composing.
  G.S.flags.burned=false; G.W.towns.forEach(t=>t.wasSacked=false); if(G.S.thirdRealm) G.S.thirdRealm.allied=false;
  const j2=annals.leafData().judgment;
  ok(/Great Weir stands across the vale/.test(j2), 'leafJudgment names the Weir when no higher-priority note applies');
  const pg=annals.build('w_pharos');
  ok(/^cannot build/.test(pg), 'a coastal wonder stays GATED on a valley realm — "'+pg+'"');
  ok(!G.BUILDS.w_pharos.can(), 'w_pharos.can()==false on a valley realm');
}
else if(mode==='gate'){
  // wrong-shape wonders must render gated. seed picks shape via SEED%4.
  G.finishSetup('Queen','Shape');
  const shape=G.W.shape;
  console.log('  realm shape for seed '+seed+' = '+shape);
  const wonders={valley:'w_weir',coastal:'w_pharos',island:'w_house',pass:'w_gates'};
  for(const sh in wonders){ if(sh===shape) continue;
    const k=wonders[sh];
    ok(!G.BUILDS[k].can(), k+' ('+sh+' wonder) can()==false on a '+shape+' realm'); }
  ok(G.BUILDS[wonders[shape]] && typeof G.BUILDS[wonders[shape]].can==='function', 'the '+shape+' wonder ('+wonders[shape]+') exists and is shape-matched');
}
else { console.log('unknown mode'); process.exit(2); }

console.log('--- '+passes+' passed, '+fails+' failed ---');
process.exit(fails?1:0);

