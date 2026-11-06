// goblin-check.js — assertions for v0.32.0 "The Delve and the Deep Folk".
// Usage: node tests/goblin-check.js   (run from repo root; reads game.js)
// Covers: the three answers to the deep seam; the western silver income; the goblin raids (gated on
// having opened the deep vein — opt-in, so a realm that never mined takes no rHist and is byte-identical);
// the second-chance card (deepen / seal / treat); and mining+goblins surviving succession.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler, mode){
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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,tickGoblins:tickGoblins,'
    + 'resolveGoblinRaid:resolveGoblinRaid,weeklyEconomy:weeklyEconomy,continueAsHeir:continueAsHeir};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; G.CARDS[id].o[opt].f(); G.S.pendingCard=null; }

/* ===================== §1 the three answers to the deep seam ===================== */
console.log('§1 opening the deep vein takes the silver and wakes the deep folk; the cautious paths do not');
{
  const a=bootstrap(3030830,['Queen','Deep']).G; a.S.week=132; const g0=a.S.gold; fire(a,'the-delve',0);
  ok(a.S.gold>g0 && a.S.flags.mining && a.S.flags.goblins, 'open the deep vein: silver now, mining on, goblins WOKEN');
  const b=bootstrap(3030830,['Queen','Shallow']).G; fire(b,'the-delve',1);
  ok(b.S.flags.mining && !b.S.flags.goblins, 'work the shallow galleries: silver, but no goblins');
  const c=bootstrap(3030830,['Queen','Wall']).G; const p0=c.S.piety; fire(c,'the-delve',2);
  ok(!c.S.flags.mining && !c.S.flags.goblins, 'wall it up: no mine, no goblins');
  ok(c.S.piety>=p0, 'heeding the old warning pleases the Concord');
}

/* ===================== §2 the western silver ===================== */
console.log('§2 the deep vein pays a steady silver — more when deep, nothing when the Delve is sacked');
{
  const base=bootstrap(3030830,['Queen','Econ']).G; base.weeklyEconomy(); const w0=base.S._inc.works;
  const m=bootstrap(3030830,['Queen','Ore']).G; m.S.flags.mining=true; m.weeklyEconomy();
  ok(m.S._inc.works>w0, 'a worked mine adds ore income to the works line');
  const d=bootstrap(3030830,['Queen','Deep2']).G; d.S.flags.mining=true; d.S.flags.miningDeep=true; d.weeklyEconomy();
  const shallowWorks=(()=>{ const g=bootstrap(3030830,['Queen','Sh']).G; g.S.flags.mining=true; g.weeklyEconomy(); return g.S._inc.works; })();
  ok(d.S._inc.works>shallowWorks, 'the lower vein pays more than the shallow one');
  const s=bootstrap(3030830,['Queen','Sacked']).G; s.S.flags.mining=true; s.W.oreTown.wasSacked=true; s.weeklyEconomy();
  ok(s.S._inc.works<=w0+0.01, 'a sacked Delve pays no ore until it is rebuilt');
}

/* ===================== §3 the goblin raids ===================== */
console.log('§3 goblins raid the Delve only once woken (opt-in), and defence decides the toll');
{
  // gating: no goblins flag → tickGoblins is a pure no-op (no rHist, byte-identical)
  const q=bootstrap(3030830,['Queen','Quiet']).G; q.S.week=400; q.tickGoblins();
  ok(q.S.goblinNext===undefined, 'a realm that never opened the deep vein sees no goblins');
  // noble mode never
  const n=bootstrap(3030830,['Queen','Knight'],'noble').G; n.S.flags.goblins=true; n.S.week=400; n.tickGoblins();
  ok(n.S.goblinNext===undefined, 'a climbing knight’s Delve raises no crown-goblins');
  // a thin muster loses the Delve; a strong one repels
  const weak=bootstrap(3030830,['Queen','Weak']).G; weak.S.flags.goblins=true; weak.S.week=500; weak.S.levies=450; weak.S.built={};
  weak.W.oreTown.wasSacked=false; weak.W.oreTown.pros=60; weak.resolveGoblinRaid();
  ok(weak.W.oreTown.wasSacked || weak.W.oreTown.pros<60, 'a thin muster: the Delve is overrun or harried');
  const strong=bootstrap(3030830,['Queen','Strong']).G; strong.S.flags.goblins=true; strong.S.week=500;
  strong.S.levies=3000; strong.S.built={bulwark:1,beaconchain:1}; strong.W.oreTown.wasSacked=false; strong.W.oreTown.pros=60;
  strong.resolveGoblinRaid();
  ok(!strong.W.oreTown.wasSacked, 'a strong muster drives the deep folk back into the dark');
}

/* ===================== §4 the second chance ===================== */
console.log('§4 deepen for more silver and worse raids, seal for peace, or treat for a fragile quiet');
{
  const deep=bootstrap(3030830,['Queen','Deeper']).G; deep.S.flags.goblins=true; deep.S.flags.mining=true; deep.S.week=400; deep.S.goblinNext=800;
  const g0=deep.S.gold; fire(deep,'the-delve-again',0);
  ok(deep.S.flags.miningDeep && deep.S.gold>g0, 'deepen: the lower vein’s silver, and mining goes deep');
  ok(deep.S.goblinNext<=deep.S.week+52, 'and the raids come sooner and angrier');
  const seal=bootstrap(3030830,['Queen','Seal']).G; seal.S.flags.goblins=true; seal.S.flags.mining=true; seal.S.flags.miningDeep=true; seal.S.week=400;
  fire(seal,'the-delve-again',1);
  ok(!seal.S.flags.goblins && !seal.S.flags.mining && !seal.S.flags.miningDeep, 'seal: the raids and the silver end together');
  const treat=bootstrap(3030830,['Queen','Treat']).G; treat.S.flags.goblins=true; treat.S.flags.mining=true; treat.S.week=400; treat.S.goblinNext=treat.S.week+10; treat.S.gold=2000;
  const gn0=treat.S.goblinNext, gd0=treat.S.gold; fire(treat,'the-delve-again',2);
  ok(treat.S.goblinNext>gn0 && treat.S.gold<gd0, 'treat: a tribute of silver buys a stretch of quiet');
  ok(treat.S.flags.goblins && treat.S.flags.mining, 'treating keeps the arc open (goblins appeased, not gone)');
}

/* ===================== §5b the shallow galleries creep deeper over the years ===================== */
console.log('§5b even shallow mining can wake the deep folk — low, and growing year over year');
{
  // gated on mining && !goblins: a walled-up (unmined) realm never runs the creep check
  const walled=bootstrap(3030830,['Queen','Walled']).G; walled.S.week=400; walled.tickGoblins();
  ok(walled.S.shallowNext===undefined, 'a realm that never mined runs no shallow-creep check');
  // shallow mining: the check arms (a grace), then ticks a yearly counter — not an instant wake
  const sh=bootstrap(3030830,['Queen','Shallow']).G; sh.S.flags.mining=true; sh.S.week=300; sh.tickGoblins();
  ok(sh.S.shallowNext!==undefined && !sh.S.flags.goblins, 'shallow mining arms the creep but does not wake goblins off the bat');
  // once armed and past the grace, the yearly check runs and the risk climbs with shallowYears
  sh.S.week=sh.S.shallowNext; sh.tickGoblins();
  ok((sh.S.shallowYears||0)>=1, 'past the grace, the shallow-creep check runs yearly and its counter climbs');
  // deep mining skips the shallow creep entirely (the goblins are already up)
  const deep=bootstrap(3030830,['Queen','Deep3']).G; deep.S.flags.mining=true; deep.S.flags.goblins=true; deep.S.week=400; deep.tickGoblins();
  ok(deep.S.shallowNext===undefined, 'a deep-vein realm skips the shallow creep (its goblins are already woken)');
}

/* ===================== §5 an open Delve outlives the crown ===================== */
console.log('§5 the heir inherits the silver and the raids');
{
  const { G }=bootstrap(3030830,['Queen','Heir']); G.S.flags.mining=true; G.S.flags.goblins=true; G.S.flags.miningDeep=true;
  G.S.over='endured'; G.continueAsHeir('endured');
  ok(G.S.flags.mining && G.S.flags.goblins && G.S.flags.miningDeep, 'an open, roused Delve is a realm fact — it passes to the heir');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

