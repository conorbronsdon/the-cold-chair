// hooks-check.js — assertions for Wave 5 Part 1: Standing Leverage ("[Knife]" hooks).
// Usage: node tests/hooks-check.js   (run from repo root; reads game.js)
// Covers: minting from each of the six sources (council reveal ×3, society named ×3), the appended
// hook option on each of the 8 HOOK_OPTS cards (spend + per-site effect + spent-once), and the three
// void/clear rules (vacate a seat, expose a society, succeed to an heir). No RNG is consumed by any
// hook path — the whole feature is derived-from-state + a 'k'-logged spend.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler){
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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,BUILDS:BUILDS,HOOK_OPTS:HOOK_OPTS,finishSetup:finishSetup,'
    + 'annals:window.annals,syncLeverage:syncLeverage,hasLeverage:hasLeverage,spendLeverage:spendLeverage,'
    + 'exposeSociety:exposeSociety,vacate:vacate,continueAsHeir:continueAsHeir,seatHeir:seatHeir,seated:seated};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1]);
  return { G, annals:sandbox.annals };
}

// Seat all three council seats (council-appoint idiom: marshal wk6, treasurer wk10, spymaster wk14).
function seatCouncil(inst){ const { G, annals }=inst; let guard=0;
  while((!G.S.council.marshal.filled || !G.S.council.treasurer.filled || !G.S.council.spymaster.filled) && guard++<400){
    if(G.S.pendingCard){ const id=G.S.pendingCard.id; if(id.indexOf('appoint-')===0) annals.choose(0); else annals.choose(0); continue; }
    annals.advance(1); }
}

/* ===================== §1 minting from the six sources ===================== */
console.log('§1 syncLeverage mints from a revealed-still-seated holder and a named-not-exposed order');
{
  const inst=bootstrap(3030830, ['Queen','Mint']); const { G }=inst;
  seatCouncil(inst);
  ok(G.S.leverage.length===0, 'no leverage before any reveal/naming, got '+G.S.leverage.length);

  // (a) a REVEALED council holder still in his chair mints one hook, kind by seat
  G.S.council.marshal.holder.revealed=true;
  G.S.council.treasurer.holder.revealed=true;
  G.S.council.spymaster.holder.revealed=true;
  G.syncLeverage();
  const byOn=Object.fromEntries(G.S.leverage.map(h=>[h.on,h]));
  ok(!!byOn.marshal && byOn.marshal.kind==='skim', 'marshal reveal → skim hook, got '+(byOn.marshal&&byOn.marshal.kind));
  ok(!!byOn.treasurer && byOn.treasurer.kind==='skim', 'treasurer reveal → skim hook, got '+(byOn.treasurer&&byOn.treasurer.kind));
  ok(!!byOn.spymaster && byOn.spymaster.kind==='leak', 'spymaster reveal → leak hook, got '+(byOn.spymaster&&byOn.spymaster.kind));
  ok(byOn.marshal.name===G.S.council.marshal.holder.name, 'hook carries the holder name');
  const lenAfterCouncil=G.S.leverage.length;
  G.syncLeverage();
  ok(G.S.leverage.length===lenAfterCouncil, 'syncLeverage is idempotent — no duplicate hooks on a second pass');

  // (b) a society NAMED (or captured) but not exposed mints a faction hook keyed to its patron
  G.S.societies.restoration.discovery='named';     // court / sworn
  G.S.societies.cabal.discovery='named';            // commons / coin
  G.S.societies.congregation.captured=true;         // church / oil (captured also mints)
  G.syncLeverage();
  const on2=Object.fromEntries(G.S.leverage.map(h=>[h.on,h]));
  ok(on2.court && on2.court.kind==='sworn', 'restoration named → court/sworn hook, got '+(on2.court&&on2.court.kind));
  ok(on2.commons && on2.commons.kind==='coin', 'cabal named → commons/coin hook, got '+(on2.commons&&on2.commons.kind));
  ok(on2.church && on2.church.kind==='oil', 'congregation captured → church/oil hook, got '+(on2.church&&on2.church.kind));

  // (c) an EXPOSED order is public knowledge — it must NOT mint a hook
  const before=G.S.leverage.length;
  G.S.societies.cabal.discovery='exposed';
  G.syncLeverage();
  ok(G.S.leverage.filter(h=>h.src==='soc-cabal' && !h.spent).length===0 || G.S.leverage.length===before,
     'an exposed order mints no NEW hook (publicity is not leverage)');
}

/* ===================== §2 spending on each of the 8 HOOK_OPTS cards ===================== */
console.log('§2 each of the 8 hook cards spends its leverage and delivers its per-site effect');
{
  // helper: fresh reign with one hook of `on`, the given card pending, then spend via annals.hook.
  function spendOn(cardId, on, prep){
    const inst=bootstrap(3030830, ['Queen','Spend']); const { G, annals }=inst;
    seatCouncil(inst);
    // mint the needed hook directly
    if(on==='marshal'||on==='treasurer'||on==='spymaster'){ G.S.council[on].holder.revealed=true; }
    else if(on==='court'){ G.S.societies.restoration.discovery='named'; }
    else if(on==='commons'){ G.S.societies.cabal.discovery='named'; }
    else if(on==='church'){ G.S.societies.congregation.discovery='named'; }
    G.syncLeverage();
    ok(!!G.hasLeverage(on), '['+cardId+'] leverage over '+on+' is present before the spend');
    if(prep) prep(G);
    // force the target card to be the pending letter, then spend
    G.S.pendingCard={ id:cardId, c:G.CARDS[cardId] };
    const before={ gold:G.S.gold, grain:G.S.grain };
    annals.hook(cardId, on);
    ok(!G.hasLeverage(on), '['+cardId+'] the hook is spent (hasLeverage now false)');
    ok(G.S.leverage.find(h=>h.on===on).spent===true, '['+cardId+'] spent flag set, hook retained for the leaf');
    return { G, before };
  }
  // 1. ultimatum / marshal — clears marshalSkim + pushes muster clock up
  { const { G }=spendOn('ultimatum','marshal',(g)=>{ g.S.flags.marshalSkim=true; g.S.threats.muster.clock=2; });
    ok(G.S.flags.marshalSkim===false, 'ultimatum: marshalSkim cleared'); ok(G.S.threats.muster.clock>2, 'ultimatum: muster clock relieved'); }
  // 2. famine / treasurer — +700 grain
  { const { G, before }=spendOn('famine','treasurer'); ok(G.S.grain-before.grain===700, 'famine: +700 grain, got '+(G.S.grain-before.grain)); }
  // 3. flood / commons — town prosperity + legit up
  { const inst=bootstrap(3030830,['Queen','Fl']); const { G, annals }=inst; seatCouncil(inst);
    G.S.societies.cabal.discovery='named'; G.syncLeverage();
    const lb=G.S.legit, pb=G.W.towns.reduce((a,t)=>a+t.pros,0);
    G.S.pendingCard={ id:'flood', c:G.CARDS['flood'] }; annals.hook('flood','commons');
    ok(G.S.legit>=lb, 'flood: legit not reduced'); ok(G.W.towns.reduce((a,t)=>a+t.pros,0)>=pb, 'flood: town prosperity lifted'); ok(!G.hasLeverage('commons'),'flood: commons hook spent'); }
  // 4. writ / church — waken clock relieved
  { const { G }=spendOn('writ','church',(g)=>{ g.S.threats.waken.clock=2; }); ok(G.S.threats.waken.clock>2, 'writ: waken clock relieved'); }
  // 5. scroll / court — world cools (−6), legit up (+4)
  { const inst=bootstrap(3030830,['Queen','Sc']); const { G, annals }=inst; seatCouncil(inst);
    G.S.societies.restoration.discovery='named'; G.syncLeverage();
    const wb=G.S.factions.world.disp, lb=G.S.legit;
    G.S.pendingCard={ id:'scroll', c:G.CARDS['scroll'] }; annals.hook('scroll','court');
    ok(G.S.factions.world.disp===Math.max(0,wb-6), 'scroll: world cooled by 6, got '+(wb-G.S.factions.world.disp));
    ok(G.S.legit===Math.min(100,lb+4), 'scroll: legit up 4, got '+(G.S.legit-lb)); }
  // 6. heresy / church — piety up (+4)
  { const inst=bootstrap(3030830,['Queen','He']); const { G, annals }=inst; seatCouncil(inst);
    G.S.societies.congregation.discovery='named'; G.syncLeverage(); G.S.piety=50;
    G.S.pendingCard={ id:'heresy', c:G.CARDS['heresy'] }; annals.hook('heresy','church');
    ok(G.S.piety===54, 'heresy: piety +4 (50→54), got '+G.S.piety); ok(!G.hasLeverage('church'),'heresy: church hook spent'); }
  // 7. toll-farm / commons — +120 gold
  { const { G, before }=spendOn('toll-farm','commons'); ok(Math.round(G.S.gold-before.gold)>=120-1, 'toll-farm: +~120 gold, got '+Math.round(G.S.gold-before.gold)); }
  // 8. peace-cost / marshal — ends the war (endWar false)
  { const inst=bootstrap(3030830,['Queen','War']); const { G, annals }=inst; seatCouncil(inst);
    G.S.council.marshal.holder.revealed=true; G.syncLeverage();
    G.S.war={ weeks:20, done:false };
    G.S.pendingCard={ id:'peace-cost', c:G.CARDS['peace-cost'] };
    annals.hook('peace-cost','marshal');
    ok(G.S.war===null, 'peace-cost: the war is ended (endWar)'); ok(!G.hasLeverage('marshal'), 'peace-cost: marshal hook spent'); }
}

/* ===================== §3 void / clear rules ===================== */
console.log('§3 a hook voids on vacate, voids on expose, and clears on succession');
{
  // (a) vacate a seat → its council hook is gone
  { const inst=bootstrap(3030830,['Queen','Vac']); const { G }=inst; seatCouncil(inst);
    G.S.council.treasurer.holder.revealed=true; G.syncLeverage();
    ok(!!G.hasLeverage('treasurer'), 'treasurer hook present before vacate');
    G.vacate('treasurer');
    ok(!G.hasLeverage('treasurer'), 'the treasurer hook is voided when the seat is vacated'); }
  // (b) expose a society → its quiet-knowledge hook is spent by the trial
  { const inst=bootstrap(3030830,['Queen','Exp']); const { G }=inst; seatCouncil(inst);
    G.S.societies.restoration.discovery='named'; G.syncLeverage();
    ok(!!G.hasLeverage('court'), 'court/sworn hook present before expose');
    G.exposeSociety('restoration', 9);
    ok(G.S.leverage.filter(h=>h.src==='soc-restoration' && !h.spent).length===0, 'the society hook is voided when the order is exposed'); }
  // (c) succession clears every hook (a new crown has caught no one)
  { const inst=bootstrap(3030830,['Queen','Heir']); const { G }=inst; seatCouncil(inst);
    G.S.council.marshal.holder.revealed=true; G.S.societies.cabal.discovery='named'; G.syncLeverage();
    ok(G.S.leverage.length>=2, 'two hooks present before succession, got '+G.S.leverage.length);
    G.S.over='endured'; G.seatHeir('endured','Heir');
    ok(G.S.leverage.length===0, 'succession clears S.leverage, got '+G.S.leverage.length); }
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

