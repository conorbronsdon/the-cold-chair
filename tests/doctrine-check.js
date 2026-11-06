// doctrine-check.js — assertions for Wave 5 Part 2: Doctrine Choices.
// Usage: node tests/doctrine-check.js   (run from repo root; reads game.js)
// Covers: committing each axis sets its permanent flag; the seasonal drift direction; the
// income/upkeep multipliers; the assize deposition floor; every doctrine verdict epithet;
// doctrineForeclosed records the road not taken; and the leaf judgment renders the identity clause.
// No RNG is consumed by any doctrine path (pure state predicates + deterministic integers).
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
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape; sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,annals:window.annals,'
    + 'hasDoctrine:hasDoctrine,doctrineIncomeMul:doctrineIncomeMul,doctrineUpkeepMul:doctrineUpkeepMul,'
    + 'doctrineSeason:doctrineSeason,doctrineForeclosed:doctrineForeclosed,reignVerdict:reignVerdict,'
    + 'leafJudgment:leafJudgment,weeklyEconomy:weeklyEconomy,buildCount:buildCount,'
    + 'continueAsHeir:continueAsHeir,leafData:leafData};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1]);
  return { G };
}
// commit a doctrine axis by running its card option's f() directly (no RNG, isolates the effect)
function commit(G, cardId, opt){ G.S.pendingCard={id:cardId,c:G.CARDS[cardId]}; G.CARDS[cardId].o[opt].f(); G.S.pendingCard=null; }

/* ===================== §1 committing sets the permanent flag + records the road ===================== */
console.log('§1 each option commits its axis and foreclosure records the road not taken');
{
  const { G }=bootstrap(3030830,['Queen','Commit']);
  ok(!G.hasDoctrine('justice') && !G.hasDoctrine('endowment') && !G.hasDoctrine('muster'), 'no doctrine at reign start');
  commit(G,'doctrine-justice',0);
  ok(G.S.doctrine.justice==='assize' && G.hasDoctrine('justice'), 'justice opt0 commits the Assize');
  const road=(G.S.flags.doctrineRoad||[]);
  ok(road.length===1 && road[0].axis==='justice' && road[0].chosen==='assize' && /Charter/.test(road[0].road),
     'doctrineForeclosed pushed the justice road-not-taken, got '+JSON.stringify(road[0]));
  commit(G,'doctrine-endowment',1);
  ok(G.S.doctrine.endowment==='mint', 'endowment opt1 commits the Mint’s Charter');
  commit(G,'doctrine-muster',0);
  ok(G.S.doctrine.muster==='standing', 'muster opt0 commits the Iron Levy');
  ok((G.S.flags.doctrineRoad||[]).length===3, 'three roads recorded across the three axes');
}

/* ===================== §2 permanent income / upkeep multipliers ===================== */
console.log('§2 the endowment income multiplier and the muster upkeep multiplier');
{
  let { G }=bootstrap(3030830,['Queen','Econ']);
  ok(G.doctrineIncomeMul()===1 && G.doctrineUpkeepMul()===1, 'no doctrine → both multipliers are 1 (byte-identical economy)');
  commit(G,'doctrine-endowment',1); ok(G.doctrineIncomeMul()===1.12, 'the Mint’s Charter → income ×1.12, got '+G.doctrineIncomeMul());
  ({ G }=bootstrap(3030830,['Queen','Econ2'])); commit(G,'doctrine-endowment',0);
  ok(G.doctrineIncomeMul()===0.90, 'the Concord’s Rule → income ×0.90, got '+G.doctrineIncomeMul());
  ({ G }=bootstrap(3030830,['Queen','Econ3'])); commit(G,'doctrine-muster',0);
  ok(G.doctrineUpkeepMul()===1.25, 'the Iron Levy → upkeep ×1.25, got '+G.doctrineUpkeepMul());
}

/* ===================== §3 seasonal drift direction ===================== */
console.log('§3 doctrineSeason tilts the four powers in the committed direction (bounded, no RNG)');
{
  // assize: legit +1/13 (court<55) and commons −1/13
  const { G }=bootstrap(3030830,['Queen','Drift']);
  commit(G,'doctrine-justice',0);          // assize
  G.S.factions.court.disp=40; G.S.factions.commons.disp=60; G.S.legit=50;
  const c0=G.S.factions.commons.disp, l0=G.S.legit;
  G.S.week=13; G.doctrineSeason(); G.S.week=26; G.doctrineSeason();
  ok(G.S.factions.commons.disp < c0, 'assize cools the commons over two seasons ('+c0+'→'+G.S.factions.commons.disp+')');
  ok(G.S.legit > l0, 'assize lifts legitimacy while the court is cool ('+l0+'→'+G.S.legit+')');
  // mint: piety drifts down
  const g2=bootstrap(3030830,['Queen','Drift2']).G;
  commit(g2,'doctrine-endowment',1); g2.S.piety=60;
  const p0=g2.S.piety; g2.S.week=13; g2.doctrineSeason();
  ok(g2.S.piety < p0, 'the Mint’s Charter drifts piety down ('+p0+'→'+g2.S.piety+')');
  // concord: piety floored at 55
  const g3=bootstrap(3030830,['Queen','Drift3']).G;
  commit(g3,'doctrine-endowment',0); g3.S.piety=20; g3.S.week=26; g3.doctrineSeason();
  ok(g3.S.piety>=55, 'the Concord’s Rule floors piety at 55, got '+g3.S.piety);
}

/* ===================== §4 the assize deposition floor ===================== */
console.log('§4 an assize crown will not fall below legitimacy 20 (a per-tick floor)');
{
  const { G }=bootstrap(3030830,['Queen','Floor']);
  commit(G,'doctrine-justice',0);          // assize
  // drive many weeks with a punishing purse; a non-assize crown at legit 0 would be deposed
  G.S.tax=40; G.S.toll=30; G.S.tithe=0; G.S.legit=15;
  let guard=0; while(G.S.week<600 && !G.S.over && guard++<2000){ G.annals.advance(1); }
  ok(!G.S.over || G.S.over==='endured', 'an assize reign is not deposed by legitimacy loss (over='+G.S.over+')');
  ok(G.S.legit>=20, 'legitimacy held at or above the assize floor of 20, got '+Math.round(G.S.legit));
}

/* ===================== §5 verdict epithets ===================== */
console.log('§5 each doctrine names the reign in the record');
{
  // neutral baseline that returns no earlier epithet, then set the axis + its trigger
  function verdict(setup){ const { G }=bootstrap(3030830,['Queen','Epi']);
    G.S.over=null; G.S.legit=60; G.S.piety=50; G.S.gold=1000;
    G.S.monk.gilded=0; G.S.built={mill:1}; G.S.flags.wonder=null; G.S.flags.burned=false;
    G.W.towns.forEach(t=>{ t.pros=50; t.pop=800; t.wasSacked=false; });
    G.S.factions.court.disp=50; G.S.factions.commons.disp=50;
    setup(G); return G.reignVerdict(); }
  ok(verdict(g=>{ g.S.doctrine.justice='assize'; g.S.legit=75; })==='the Lawgiver', 'assize + high legit → the Lawgiver');
  ok(verdict(g=>{ g.S.doctrine.justice='charter'; g.S.factions.commons.disp=70; })==='the Beloved', 'charter + warm commons → the Beloved');
  ok(verdict(g=>{ g.S.doctrine.justice='compact'; g.S.factions.court.disp=75; g.S.legit=50; })==='the Figurehead', 'compact + warm court + modest legit → the Figurehead');
  ok(verdict(g=>{ g.S.doctrine.endowment='mint'; g.S.gold=7000; })==='the Coiner', 'mint + full purse → the Coiner');
  ok(verdict(g=>{ g.S.doctrine.muster='standing'; })==='the Iron', 'standing muster → the Iron');
  ok(verdict(g=>{ g.S.doctrine.muster='free'; })==="the Sellsword’s Crown", 'free muster → the Sellsword’s Crown');
}

/* ===================== §6 the leaf carries the identity clause ===================== */
console.log('§6 leafJudgment splices the "chose its law and never..." clause');
{
  const { G }=bootstrap(3030830,['Queen','Leaf']);
  const before=G.leafJudgment();
  ok(!/chose its law/.test(before), 'no doctrine → no identity clause on the leaf');
  commit(G,'doctrine-justice',1);          // charter, records a road
  const after=G.leafJudgment();
  ok(/chose its law and kept it/.test(after), 'a committed reign’s leaf names the kept law');
  ok(/never the Assize|never .*Assize|Compact/.test(after), 'the leaf names a foreclosed road, got: "'+after.slice(-160)+'"');
}

/* ===================== §7 fixes from the v0.28-v0.30 review ===================== */
console.log('§7 the Iron verdict is reachable at reign end, and a doctrine record survives succession');
{
  // (fix 1) 'the Iron' must return once the reign has ENDED (the leaf composes after endGame sets S.over)
  const { G }=bootstrap(3030830,['Queen','Iron']);
  G.S.over='endured'; G.S.legit=60; G.S.piety=50; G.S.gold=1000; G.S.monk.gilded=0; G.S.built={mill:1};
  G.W.towns.forEach(t=>{ t.pros=50; t.pop=800; t.wasSacked=false; });
  G.S.doctrine.muster='standing';
  ok(G.reignVerdict()==='the Iron', 'an Iron Levy reign is still "the Iron" on its final leaf (S.over set), got '+G.reignVerdict());

  // (fix 2) a committed doctrine and its foreclosed-road record both survive succession
  const h=bootstrap(3030830,['Queen','Heir']).G;
  commit(h,'doctrine-justice',0);   // assize, records a road
  ok(h.hasDoctrine('justice') && (h.S.flags.doctrineRoad||[]).length===1, 'pre-succession: doctrine committed, road recorded');
  h.S.over='endured'; h.continueAsHeir('endured');
  ok(h.hasDoctrine('justice'), 'the doctrine (realm-law) persists into the heir’s reign');
  ok((h.S.flags.doctrineRoad||[]).length>=1, 'the foreclosed-road RECORD survives the S.flags wipe, got '+(h.S.flags.doctrineRoad||[]).length);
  ok(h.leafData().doctrines.length>=1, 'leafData().doctrines is non-empty for the heir (not [] with live effects)');
  ok(/never /.test(h.leafJudgment()), 'the heir’s leaf still names the foreclosed road, not a bare "chose its law"');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

