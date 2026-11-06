// ledger-marginalia-check.js — assertions for v0.39.1, the two cheap charm items:
// the LIVING-MAP MARGINALIA (the map accretes history-keyed notes beyond the pressure-notes) and the
// DYNASTY LEDGER (the House's legend — closed reigns accumulate on the Last Leaf).
// Both are display-only: pure reads at render/compose time, no RNG, nothing new in state().
// Usage: node tests/ledger-marginalia-check.js   (run from repo root; reads game.js)
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
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,marginNotes:marginNotes,dragonRavage:dragonRavage,'
    + 'continueAsHeir:continueAsHeir,seatHeir:seatHeir,leafData:leafData,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G, annals:sandbox.annals };
}
// a recording canvas-context stub: collects every fillText string marginNotes inks
function recorder(){ const texts=[];
  const g=new Proxy({}, { get:(t,p)=> p==='fillText' ? (s)=>texts.push(String(s)) : (p in t?t[p]:()=>{}),
    set:(t,p,v)=>{t[p]=v;return true;} });
  return {g, texts};
}

/* ===================== §1 the map accretes history — and only history that happened ===================== */
console.log('§1 living-map marginalia: deeds leave notes; a clean realm leaves a clean margin');
{
  const {G}=bootstrap(3030830,['Queen','Margin']);
  // a fresh realm: none of the history notes (pressure notes are threat-gated and clocks start full)
  let r=recorder(); G.marginNotes(r.g);
  const HIST=['here the wood burned','here the wyrm came','here they digged too deep','here the Reach burned','here came the sweat','here the pretender fell'];
  ok(HIST.every(t=>!r.texts.includes(t)), 'a fresh realm has no accreted notes, got: '+JSON.stringify(r.texts));
  // the deeds happen; the notes appear
  G.S.flags.burned=true; G.S.flags.goblins=true; G.S.flags.reachWyrmDone=100;
  G.S.flags.sweatDone=200; G.S.flags.pretenderCrushed=1; G.S.flags.wyrmScar={x:300,y:200};
  r=recorder(); G.marginNotes(r.g);
  ok(HIST.every(t=>r.texts.includes(t)), 'every deed inks its note, got: '+JSON.stringify(r.texts));
  // the shallow-vein variant: deep mining without woken goblins reads differently
  G.S.flags.goblins=false; G.S.flags.miningDeep=true;
  r=recorder(); G.marginNotes(r.g);
  ok(r.texts.includes('the lower galleries') && !r.texts.includes('here they digged too deep'),
     'a deepened-but-quiet Delve notes the lower galleries, not the digging-too-deep');
}

/* ===================== §2 the wyrm's scar is written where it struck, and the land keeps it ===================== */
console.log('§2 the wyrm scar: set at the ravage, kept across succession (a scar on the land, not the reign)');
{
  const {G}=bootstrap(3030830,['Queen','Scar']);
  G.S.dragon={ord:1, kind:'ember', name:'Testwyrm'}; G.S.gold=8000;
  G.dragonRavage();
  ok(G.S.flags.wyrmScar && typeof G.S.flags.wyrmScar.x==='number', 'the ravage records where the wyrm came');
  const scar={...G.S.flags.wyrmScar};
  G.S.over='endured'; G.seatHeir('endured','Heir');   // the reset carries the scar; the interregnum preamble is exercised separately
  ok(G.S.flags.wyrmScar && G.S.flags.wyrmScar.x===scar.x && G.S.flags.wyrmScar.y===scar.y,
     'the heir inherits the scar on the land (display-only, carried like burned)');
  // and it never reaches the harness surface
  ok(!JSON.stringify(G.annals.state()).includes('wyrmScar'), 'the scar is named nowhere in state()');
}

/* ===================== §3 the dynasty ledger: closed reigns accumulate ===================== */
console.log('§3 the House’s legend: each closed reign enters the ledger with its verdict and years');
{
  const {G}=bootstrap(3030830,['Queen','Line']);
  ok((G.S._dynasty||[]).length===0, 'a first reign opens with an empty ledger');
  // The dead half of this assertion was `!('dynastyLedger' in {})` — `'x' in {}` is always false, so that
  // conjunct was always true and contributed nothing (issue #7). What it presumably MEANT to check is that
  // the ledger stays off the harness's state() surface, which is the byte-identity contract; so it now
  // checks that, against a real object, alongside the leaf being empty on a first reign.
  ok(!('dynastyLedger' in G.annals.state()) && G.leafData().dynastyLedger.length===0,
     'the first leaf shows no ledger entries, and the ledger stays out of state()');
  const firstRuler=G.S.ruler.title+' '+G.S.ruler.name;
  G.S.week=1040; G.S.over='endured'; G.S.dragonsSlain=1;
  G.continueAsHeir('endured'); G.seatHeir('endured', G.S.interregnum ? G.S.interregnum.heir : G.S.ruler.name);   // launcher closes the ledger; then seat the heir
  ok(G.S._dynasty.length===1, 'the first succession writes the first ledger line');
  const e=G.S._dynasty[0];
  ok(e.ruler===firstRuler, 'the ledger names the crown that closed, got '+e.ruler);
  ok(e.verdict==='the Wyrmsbane', 'the closing verdict is read as the Last Leaf would read it (a wyrm slain → the Wyrmsbane), got '+e.verdict);
  ok(e.years[0]===30 && e.years[1]===50, 'the reign’s span is recorded (30–50), got '+e.years.join('–'));
  ok(e.ending==='endured' && e.wyrms===1, 'the ending and the wyrm-count ride along');
  // a second reign closes; the ledger grows, oldest first
  G.S.week=2080; G.S.over='endured'; G.continueAsHeir('endured'); G.seatHeir('endured', G.S.interregnum ? G.S.interregnum.heir : G.S.ruler.name);
  ok(G.S._dynasty.length===2 && G.S._dynasty[0].ruler===firstRuler, 'the second succession appends; the ledger stays oldest-first');
  const led=G.leafData().dynastyLedger;
  ok(led.length===2 && led[1].years[0]===50, 'leafData carries the full ledger for the leaf and the community layer');
  ok(!JSON.stringify(G.annals.state()).includes('dynasty'), 'the ledger is named nowhere in state() (harness-invisible)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

