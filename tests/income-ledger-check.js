// income-ledger-check.js — the visible "week's reckoning" ledger must never lie.
// Usage: node tests/income-ledger-check.js   (run from repo root; reads game.js)
// Guards that S._inc (the effective, post-multiplier breakdown the ledger renders) sums to the actual
// weekly net, and that the doctrine/river-strike levers are reflected in the numbers and the notes.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }
const near=(a,b)=>Math.abs(a-b)<0.01;

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
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,weeklyEconomy:weeklyEconomy,renderGrainWarn:renderGrainWarn,'
    + 'grainWarnText:()=>{const b=document.getElementById("grainwarn");return (b.children||[]).map(c=>c.textContent).join("");}};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1]);
  return { G };
}

// give the realm a real trade economy so the numbers are non-trivial
function develop(G){ G.S.built={mill:4,market:3,roads:2,guildhall:1,bridge:1}; G.W.towns.forEach(t=>{t.pros=68;});
  G.S.tax=22; G.S.toll=16; G.S._tollWeek=9; }
function sumRows(I){ return I.tax + I.tolls + I.works - I.upkeep - I.tithe; }

console.log('§1 the ledger rows sum to the actual net, in every doctrine/strike state');
{
  // (a) plain reign — no modifiers, no notes
  { const { G }=bootstrap(3030830,['Queen','Plain']); develop(G); G.weeklyEconomy();
    const I=G.S._inc;
    ok(near(sumRows(I), I.net), 'plain: tax+tolls+works−upkeep−tithe equals net ('+sumRows(I).toFixed(2)+' vs '+I.net.toFixed(2)+')');
    ok(near(I.net, G.S.lastIncome), 'plain: the shown net equals the gold actually applied this week');
    ok(I.notes.length===0, 'plain: no modifier notes when no lever is in play'); }
  // (b) the Mint's Charter lifts works ×1.12 and names itself
  { const { G }=bootstrap(3030830,['Queen','Mint']); develop(G); G.S.doctrine.endowment='mint'; G.weeklyEconomy();
    const mint=G.S._inc;
    const { G:G2 }=bootstrap(3030830,['Queen','Base']); develop(G2); G2.weeklyEconomy();
    ok(mint.works > G2.S._inc.works, 'mint: works income exceeds the un-charter baseline');
    ok(near(sumRows(mint), mint.net), 'mint: rows still sum to net');
    ok(mint.notes.some(n=>/Mint/.test(n)), 'mint: the note names the Mint’s Charter'); }
  // (c) the river shut halves trade and tolls and says so
  { const { G }=bootstrap(3030830,['Queen','Strike']); develop(G); G.S.week=400; G.S.flags.riverStrike=G.S.week; G.weeklyEconomy();
    const shut=G.S._inc;
    const { G:G2 }=bootstrap(3030830,['Queen','Open']); develop(G2); G2.weeklyEconomy();
    ok(shut.tolls < G2.S._inc.tolls, 'strike: tolls run below the open-river baseline');
    ok(shut.works < G2.S._inc.works, 'strike: works/trade run below baseline');
    ok(near(sumRows(shut), shut.net), 'strike: rows still sum to net');
    ok(shut.notes.some(n=>/river/.test(n)), 'strike: the note names the shut river'); }
  // (d) a standing muster shows the heavier upkeep
  { const { G }=bootstrap(3030830,['Queen','Iron']); develop(G); G.S.doctrine.muster='standing'; G.weeklyEconomy();
    const iron=G.S._inc;
    const { G:G2 }=bootstrap(3030830,['Queen','Levy']); develop(G2); G2.weeklyEconomy();
    ok(iron.upkeep > G2.S._inc.upkeep, 'standing: upkeep exceeds the levy-of-need baseline');
    ok(near(sumRows(iron), iron.net), 'standing: rows still sum to net');
    ok(iron.notes.some(n=>/Iron Levy/.test(n)), 'standing: the note names the Iron Levy'); }
}

console.log('§2 the grain warning speaks only when the granaries are near the hunger line and falling');
{
  function warn(grain, d, week){ const { G }=bootstrap(3030830,['Queen','Grain']);
    G.S.grain=grain; G.S.lastGrainD=d; G.S.week=week; G.renderGrainWarn(); return G.grainWarnText(); }
  ok(warn(3000, -20, 200)==='', 'a well-stocked realm gets no grain warning');
  ok(warn(460, 0, 200)==='', 'a low but NOT-falling granary (no burn) gets no warning');
  ok(/weeks of food/.test(warn(460, -22, 200)), 'a low, falling granary warns of the weeks it has left');
  const hungry=warn(300, -22, 200);
  ok(/hunger line/.test(hungry), 'below the hunger line the warning names the legitimacy cost');
  ok(!/buy grain/i.test(hungry), 'the warning never promises a grain market that does not exist');
  ok(/mills/.test(hungry) && /granaries/.test(hungry) && /taxes and tolls/.test(hungry),
    'the warning points to the three real grain levers');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

