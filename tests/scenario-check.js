// scenario-check.js — assertions for v0.43.0 "Ill-Made Crowns" (the scenario shelf).
// A scenario is a seed + a canned action-log prefix in the exact history-link format; beginning one IS
// following a history link, so each predicament must replay deterministically to its stated brink.
// Usage: node tests/scenario-check.js   (run from repo root; reads game.js)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootReplay(seed, data){
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
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,SCENARIOS:SCENARIOS,replay:replay,hoardLine:hoardLine,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G;
  if(data) G.replay(data);
  return { G, annals:sandbox.annals };
}
function scData(sc){ return { r:{title:sc.ruler[0], name:sc.ruler[1]}, a:sc.a, w:sc.week }; }

/* ============ §1 the shelf itself ============ */
console.log('§1 the shelf: four ill-made crowns, each a legal history-link payload');
{
  const {G}=bootReplay(3030830, null);
  ok(G.SCENARIOS.length===4, 'four scenarios on the shelf');
  G.SCENARIOS.forEach(sc=>{
    ok(typeof sc.name==='string' && typeof sc.hook==='string' && typeof sc.goal==='string',
       sc.id+': named, hooked, and given a goal');
    ok(Array.isArray(sc.a) && sc.seed===3030830, sc.id+': carries a seed and an action log');
  });
}

/* ============ §2 the Debtor's Crown arrives seething ============ */
console.log('§2 the Debtor’s Crown: year ~8, the League ice-cold, the uprising road already paved');
{
  const base=bootReplay(3030830, null).G;
  const sc=base.SCENARIOS.find(s=>s.id==='debtor');
  const {G}=bootReplay(3030830, scData(sc));
  ok(G.S.week===420 && !G.S.over, 'arrives alive at week 420');
  ok(G.S.legit<=50, 'the mandate sags ('+Math.round(G.S.legit)+')');
  ok(G.S.factions.commons.disp<45, 'the League has cooled below its base and is counting barges ('+Math.round(G.S.factions.commons.disp)+') [rebaselined v0.57.0: the middle-book deck reshuffle settled the debtor at ~40, still cooling under wolf-taxes toward the year-50 revolt]');
}

/* ============ §3 the Wyrm in the Counting-House arrives fat ============ */
console.log('§3 the Wyrm in the Counting-House: a hoard past the line, and the sky already interested');
{
  const base=bootReplay(3030830, null).G;
  const sc=base.SCENARIOS.find(s=>s.id==='wyrmbait');
  const {G}=bootReplay(3030830, scData(sc));
  ok(G.S.week===560 && !G.S.over, 'arrives alive at week 560');
  ok(G.S.gold>G.hoardLine(), 'the treasury stands above the hoard-line ('+Math.round(G.S.gold)+')');
  ok((G.S.opulence||0)>=2 || G.S.dragonNext!==undefined, 'the wyrm’s interest is already drawn (opulence or an armed eye)');
}

/* ============ §4 the Delve Runs Deep arrives raided and rich ============ */
console.log('§4 the Delve Runs Deep: the deep vein open, the deep folk awake, the silver flowing');
{
  const base=bootReplay(3030830, null).G;
  const sc=base.SCENARIOS.find(s=>s.id==='delvedeep');
  const {G}=bootReplay(3030830, scData(sc));
  ok(G.S.week===450 && !G.S.over, 'arrives alive at week 450');
  ok(G.S.flags.mining===true && G.S.flags.goblins===true, 'the vein is open and the deep folk are awake');
  ok(G.S.flags.miningDeep===true, 'and the Crown dug deeper still (the lower vein worked)');
}

/* ============ §5 the Iron Chair, Cold ============ */
console.log('§5 the Iron Chair, Cold: a fresh reign at the hardest weight');
{
  const base=bootReplay(3030830, null).G;
  const sc=base.SCENARIOS.find(s=>s.id==='ironstart');
  const {G}=bootReplay(3030830, scData(sc));
  ok(G.S.chair==='iron', 'the chair is iron');
  ok(G.S.legit===21, 'the crown opens doubted (21)');
}

/* ============ §6 a scenario replays byte-identically ============ */
console.log('§6 determinism: the same predicament twice is the same predicament');
{
  const base=bootReplay(3030830, null).G;
  const sc=base.SCENARIOS.find(s=>s.id==='debtor');
  const a=bootReplay(3030830, scData(sc)).annals.state();
  const b=bootReplay(3030830, scData(sc)).annals.state();
  ok(JSON.stringify(a)===JSON.stringify(b), 'double-replay of a scenario is byte-identical');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

