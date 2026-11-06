// council-test.js — assertions for P7 Small Council (appointment + disloyalty chain).
// Usage: node tests/council-test.js   (run from repo root; reads game.js)
// Covers spec §8a (council-appoint) and §8b (council-disloyal). Seed 3030830 pinned:
// its ONLY compromised council candidate is treasurer candidate[0] (thrifty/church);
// every other candidate is loyal — so the disloyal plan appoints treasurer index 0.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler){
  // DOM/canvas stubs (mirrors harness.js)
  const els = {};
  function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
    el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){ throw new Error('reload'); } };
  sandbox.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,BUILDS:BUILDS,finishSetup:finishSetup,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1]);
  return { G, annals:sandbox.annals };
}

// Drive a plan: planned card actions matched by id, all other letters auto-answered opt 0.
function drive({G, annals}, actions, until){
  const acts = actions.slice().sort((a,b)=>a[0]-b[0]);
  let guard=0;
  while(G.S.week<until && !G.S.over && guard++<40000){
    while(acts.length && acts[0][0]<=G.S.week && acts[0][1]!=='c'){
      const a=acts.shift();
      if(a[1]==='s') annals.setSlider(a[2],a[3]);
      else if(a[1]==='b') annals.build(a[2]);
      else if(a[1]==='y') annals.spy();
    }
    if(G.S.pendingCard){
      const id=G.S.pendingCard.id;
      const ci=acts.findIndex(x=>x[1]==='c'&&x[2]===id);
      if(ci>=0){ const a=acts.splice(ci,1)[0]; annals.choose(a[3]); }
      else { const n=G.S.pendingCard.c.o.length; annals.choose(0%n); }
      continue;
    }
    annals.advance(1);
  }
}

/* ============================ §8a council-appoint ============================ */
console.log('§8a council-appoint.json — appointment + always-on hooks');
{
  const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/plans/council-appoint.json'),'utf8'));
  const inst=bootstrap(3030830, plan.ruler);
  drive(inst, plan.actions, 60);
  const st=inst.annals.state();
  const c=st.council;
  ok(c.marshal.filled===true, 'marshal seated');
  ok(c.marshal.holder.name==='Iselaine', 'marshal holder is seed-3030830 candidate[0] (Iselaine), got '+c.marshal.holder.name);
  ok(['aggressive','cautious','methodical'].includes(c.marshal.holder.trait), 'marshal trait in pool');
  ok(c.marshal.holder.since===6, 'marshal since===6, got '+c.marshal.holder.since);
  ok(c.treasurer.filled===true && c.treasurer.holder.since===10, 'treasurer since===10, got '+c.treasurer.holder.since);
  ok(c.spymaster.filled===true && c.spymaster.holder.since===14, 'spymaster since===14, got '+c.spymaster.holder.since);
  ['marshal','treasurer','spymaster'].forEach(seat=>{
    if(c[seat].chain<2) ok(c[seat].holder.loyalty==='unknown', seat+' loyalty fogged (unknown) while chain<2, got '+c[seat].holder.loyalty);
  });
  ok(c.marshal.candidates===undefined, 'filled seat hides candidates array');
  // Spymaster informant discount: seated spymaster → spy() costs 40, not 80
  const goldBefore=inst.G.S.gold;
  inst.G.S.gold=500; // ensure affordable and a clean delta
  const g0=inst.G.S.gold; inst.annals.spy(); const g1=inst.G.S.gold;
  ok(g0-g1===40, 'spy cost delta with seated spymaster === 40, got '+(g0-g1));
  // auto-reveal marginalia
  const chron=inst.annals.chronicle(400).join(' || ');
  ok(/earns his salt at once/.test(chron), 'onSeat auto-reveal "earns his salt at once" present');

  // Determinism: double-run → identical state JSON at week 60
  const a=bootstrap(3030830, plan.ruler); drive(a, plan.actions, 60);
  const b=bootstrap(3030830, plan.ruler); drive(b, plan.actions, 60);
  ok(JSON.stringify(a.annals.state())===JSON.stringify(b.annals.state()), 'double-run state identical at week 60');
}

/* ============================ §8b council-disloyal ============================ */
console.log('§8b council-disloyal.json — a disloyalty chain end-to-end');
{
  const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/plans/council-disloyal.json'),'utf8'));
  const inst=bootstrap(3030830, plan.ruler);
  const { G, annals }=inst;
  const acts=plan.actions.slice().sort((a,b)=>a[0]-b[0]);
  const obs={};   // observations recorded as the chain surfaces/resolves
  let goldBeforeVerdict=null, reappointSeen=false;
  let guard=0;
  while(G.S.week<120 && !G.S.over && guard++<60000){
    while(acts.length && acts[0][0]<=G.S.week && acts[0][1]!=='c'){
      const a=acts.shift();
      if(a[1]==='s') annals.setSlider(a[2],a[3]); else if(a[1]==='b') annals.build(a[2]); else if(a[1]==='y') annals.spy();
    }
    if(G.S.pendingCard){
      const id=G.S.pendingCard.id, title=annals.choices().title;
      // record the moment each chain letter surfaces
      if(id==='treasurer-third-1' && obs.trigChain===undefined){ obs.trigChain=G.S.council.treasurer.chain; obs.t1=title; }
      if(id==='treasurer-third-2' && obs.t2===undefined) obs.t2=title;
      if(id==='treasurer-third-3' && obs.t3===undefined){ obs.t3=title; goldBeforeVerdict=annals.state().gold; }
      if(id==='appoint-treasurer' && obs.trigChain!==undefined && G.S.council.treasurer.filled===false) reappointSeen=true;
      const ci=acts.findIndex(x=>x[1]==='c'&&x[2]===id);
      const choice = ci>=0 ? (acts.splice(ci,1)[0][3]) : 0;
      annals.choose(choice);
      // record the effect of resolving third-2 (fog lifts) and third-3 (seat vacated)
      if(id==='treasurer-third-2'){ const t=annals.state().council.treasurer;
        obs.loyaltyAfter2=t.holder?t.holder.loyalty:'(no holder)'; obs.revealedAfter2=G.S.council.treasurer.holder.revealed; }
      if(id==='treasurer-third-3'){ const t=annals.state().council.treasurer;
        obs.filledAfter3=t.filled; obs.holderAfter3=t.holder; obs.goldAfter3=annals.state().gold;
        obs.candsAfter3=(t.candidates&&t.candidates.length); }
      continue;
    }
    annals.advance(1);
  }
  ok(obs.trigChain===1, 'trigger set treasurer.chain===1 when "The Rounded Ledger" surfaced, got '+obs.trigChain);
  ok(obs.t1==='The Rounded Ledger', 'chain-1 letter is "The Rounded Ledger", got '+obs.t1);
  ok(obs.t2==='Where the Third Went', 'chain-2 letter is "Where the Third Went", got '+obs.t2);
  ok(obs.loyaltyAfter2 && obs.loyaltyAfter2!=='unknown', 'fog LIFTED after third-2 opt0 — loyalty readable, got '+obs.loyaltyAfter2);
  ok(obs.loyaltyAfter2==='church', 'revealed loyalty === church (seed 3030830), got '+obs.loyaltyAfter2);
  ok(obs.revealedAfter2===true, 'underlying holder.revealed === true after third-2');
  ok(obs.t3==='The Treasurer’s Account', 'chain-3 verdict letter is "The Treasurer’s Account", got '+obs.t3);
  ok(obs.filledAfter3===false, 'treasurer seat vacated (filled===false) after strip');
  ok(obs.holderAfter3===null, 'treasurer holder===null after strip');
  ok(obs.goldAfter3>=goldBeforeVerdict, 'gold rose (or held) by clawback, pre='+goldBeforeVerdict+' post='+obs.goldAfter3);
  ok(obs.candsAfter3===2, 'fresh candidate pair present after vacate, got '+obs.candsAfter3);
  ok(reappointSeen===true, 're-appointment letter (The Counting-House’s Chair) re-queued after vacate');
}

/* ==================== §8b non-perturbation: geography pinned ==================== */
console.log('non-perturbation — seed 3030830 geography unchanged by genCouncil');
{
  const inst=bootstrap(3030830, ['Queen','Geo']);
  const W=inst.G.W;
  ok(W.realm==='Vael Ashunn', 'realm name pinned Vael Ashunn, got '+W.realm);
  ok(W.rival==='the Thornhelm Reach', 'rival pinned, got '+W.rival);
  ok(W.capital.name.startsWith('Cael '), 'capital name pinned, got '+W.capital.name);
  ok(W.towns.length===7, 'town count pinned (6 river + ore), got '+W.towns.length);
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

