// second-reading-check.js — assertions for v0.44.0 "The Second Reading".
// The previous reign of a seed is set down at endGame (localStorage) and a fresh reign of the same seed
// reads itself against it: faded ghost-lines in the book as the living weeks pass the old telling's
// moments. Display-only — never in the _chron stream, never in state(), suppressed during replay, and
// absent wherever localStorage is stubbed (every harness run byte-identical by construction).
// Usage: node tests/second-reading-check.js   (run from repo root; reads game.js)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler, storage){
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
  sandbox.localStorage=storage||{ getItem:()=>null, setItem(){}, removeItem(){} };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,endGame:endGame,chron:chron,chronBody:chronBody,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G, annals:sandbox.annals };
}
// a tiny real-ish localStorage
function memStorage(seedData){
  const m={...(seedData||{})};
  return { getItem:k=>(k in m? m[k] : null), setItem(k,v){ m[k]=String(v); }, removeItem(k){ delete m[k]; }, _m:m };
}
function ghosts(G){ return G.chronBody.children.filter(c=>c.className==='ghost'); }

/* ============ §1 no last telling, no ghosts ============ */
console.log('§1 a seed never told before reads clean — no ghosts, nothing loaded');
{
  const {G}=bootstrap(3030830,['Queen','First']);
  ok(G.S._lastTelling===null, 'no stored telling → nothing loaded');
  G.S.week=200; G.chron('An ordinary entry.');
  ok(ghosts(G).length===0, 'no ghost lines in the book');
}

/* ============ §2 the telling is set down at the reign's end ============ */
console.log('§2 endGame sets the telling down — heaviest moments, week order, capped');
{
  const st=memStorage();
  const {G}=bootstrap(3030830,['Queen','Teller'],st);
  G.S.week=500;
  for(let i=0;i<30;i++) G.S._moments.push({text:'Deed '+i, weight:(i%9)+1, week:10+i*12, year:30+Math.floor((10+i*12)/52)});
  G.endGame('endured');
  const saved=JSON.parse(st._m['annals-telling-3030830']);
  ok(saved && saved.v===1 && saved.over==='endured', 'the telling is stored, versioned, with its ending');
  ok(saved.moments.length<=24, 'capped at two dozen moments, got '+saved.moments.length);
  ok(saved.moments.every((m,i,a)=>i===0||a[i-1].w<=m.w), 'moments stored in week order');
  ok(typeof saved.verdict==='string' && saved.verdict.length>0, 'the verdict rides along ('+saved.verdict+')');
}

/* ============ §3 the next reign reads itself against the last ============ */
console.log('§3 ghosts: the old telling keeps pace with the new, in the book but not the record');
{
  const digest=JSON.stringify({ v:1, over:'endured', ruler:'Queen Old', verdict:'the Steward',
    moments:[ {w:100, t:'the wood woke in this very autumn'}, {w:300, t:'the wyrm came to the high pastures'} ] });
  const st=memStorage({'annals-telling-3030830':digest});
  const {G,annals}=bootstrap(3030830,['Queen','Second'],st);
  ok(G.S._lastTelling && G.S._lastTelling.moments.length===2, 'the last telling loads with the fresh reign');
  // before the first old moment: silent
  G.S.week=50; G.chron('Early days.');
  ok(ghosts(G).length===0, 'no ghost before the old telling’s first moment');
  // past the first: one ghost
  G.S.week=120; G.chron('Mid days.');
  ok(ghosts(G).length===1 && /wood woke in this very autumn/.test(ghosts(G)[0].textContent),
     'passing an old moment inks its ghost');
  // past both: two, and never re-inked
  G.S.week=400; G.chron('Late days.'); G.chron('Later still.');
  ok(ghosts(G).length===2, 'each old moment ghosts exactly once');
  // the canonical record never saw them
  ok(!annals.chronicle(200).some(l=>/wood woke in this very autumn|last telling/.test(l)),
     'ghosts are display-only — the _chron stream is untouched');
  ok(!('_lastTelling' in annals.state()) && !JSON.stringify(annals.state()).includes('lastTelling'),
     'nothing of the second reading is named in state()');
}

/* ============ §4 replay is a re-telling, not a reading ============ */
console.log('§4 during replay the ghosts stay silent (a replayed link re-inks the record, nothing else)');
{
  const digest=JSON.stringify({ v:1, over:'endured', ruler:'Queen Old', verdict:'the Steward',
    moments:[ {w:10, t:'a moment that must not ghost during replay'} ] });
  const st=memStorage({'annals-telling-3030830':digest});
  const {G}=bootstrap(3030830,['Queen','Rep'],st);
  G.S.replaying=true; G.S.week=50; G.chron('Replay entry.');
  ok(ghosts(G).length===0, 'no ghosts while replaying');
  G.S.replaying=false; G.chron('Live again.');
  ok(ghosts(G).length===1, 'the reading resumes when the reign goes live');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

