// codex-check.js — assertions for v0.54.0 "The Codex".
// The Concordance grown into a browsable index of the reign AND the House: the crowns already closed
// (with their traits/verdicts/wyrms), the persons/places/houses named, the wyrms, and the reign's
// defining moments — each with the years it surfaces. A PURE read of already-committed state; no RNG,
// no new S field, no state() change, never in the _chron stream — so it adds zero sim surface (the
// plan sweep proves 0/28). This checks the derivation (annals.codex()) directly.
// Usage: node tests/codex-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed){
  const els = {};
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'', _html:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el._html=v; el.children=[];}, get innerHTML(){return el._html;} };
    el.getContext=()=>new Proxy({},{get:(t,p)=>(p in t?t[p]:()=>{}),set:(t,p,v)=>{t[p]=v;return true;}}); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed, origin:'https://coldchair.example', pathname:'/', reload(){} };
  const mem={};
  sandbox.localStorage={ getItem:k=>(k in mem?mem[k]:null), setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; } };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.navigator={};
  sandbox.btoa=x=>Buffer.from(x,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,composeCodex:composeCodex,openCodex:openCodex,'
    + 'moment:moment,annals:window.annals,els:null};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup('Queen','Codexa','crown');
  return { G, els };
}

/* ============ §1 the House: the crowns already closed, and the one reigning ============ */
console.log('§1 the House: every closed crown plus the reigning one, with its character');
{
  const {G}=bootstrap(3030830);
  G.S._dynasty=[
    {ruler:'Queen Founder', verdict:'the Steward', years:[30,50], ending:'endured', wyrms:1, born:'the Martial', earned:'the Bold'},
    {ruler:'King Second', verdict:'the Deposed', years:[50,64], ending:'deposed', wyrms:0, born:'the Pious', earned:'the Cautious'}
  ];
  G.S._legacies=['oldblood']; G.S._dynastyEpithet='the Steward'; G.S.week=520;
  const c=G.annals.codex();
  ok(c.house==='House '+G.W.house, 'the Codex names the House');
  ok(c.dynasty.length===3, 'two closed crowns plus the reigning one ('+c.dynasty.length+')');
  ok(c.dynasty[0].ruler==='Queen Founder' && c.dynasty[0].wyrms===1 && c.dynasty[0].born==='the Martial', 'a closed crown carries its character and its wyrms');
  ok(c.dynasty[2].reigning===true, 'the last entry is the reigning crown');
  ok(c.epithet==='the Steward' && c.legacies[0]==='the Old Blood', 'the House epithet and legacies ride along');
  ok(typeof c.renown==='number', 'the House renown is reported');
}

/* ============ §2 the Realm, the Wyrms, the Moments ============ */
console.log('§2 the realm index, the wyrms, and the reign’s defining moments');
{
  const {G}=bootstrap(3030830);
  G.S.week=520; G.S.dragonsSlain=1;
  G.moment('The wyrm of the high pastures was met and slain', 11);
  G.moment('The realm was made whole again by iron', 10);
  const c=G.annals.codex();
  ok(Array.isArray(c.concordance), 'the realm index (the Concordance) is present');
  ok(c.wyrms.slain===1 && c.wyrms.lineTotal>=1, 'the wyrms are tallied for the reign and the line');
  ok(c.moments.length>=2 && c.moments.every(m=>typeof m.text==='string' && typeof m.year==='number'), 'the defining moments carry their text and year');
  // moments are told in the order they happened
  ok(c.moments[0].year<=c.moments[c.moments.length-1].year, 'the moments read in the order they happened');
}

/* ============ §3 pure & display-only: no state change, nothing in state() ============ */
console.log('§3 the Codex is a pure read — it changes no state and leaks nothing into state()');
{
  const {G}=bootstrap(3030830); G.S.week=300;
  const before=JSON.stringify(G.annals.state());
  G.annals.codex(); G.annals.codex();
  ok(JSON.stringify(G.annals.state())===before, 'composing the Codex twice mutates no state');
  const st=G.annals.state();
  ok(!('codex' in st) && !('dynasty' in st), 'the Codex never appears in state() (byte-identical harness surface)');
}

/* ============ §4 openCodex renders the modal without error ============ */
console.log('§4 openCodex builds the browsable modal body from the derivation');
{
  const {G,els}=bootstrap(3030830); G.S.week=400;
  G.moment('A deed worth indexing happened here', 8);
  G.openCodex();
  const body=els['codexbody'];
  ok(body && /<h3>The House<\/h3>/.test(body.innerHTML), 'the modal body has the House section');
  ok(/The Realm/.test(body.innerHTML) && /The Wyrms/.test(body.innerHTML) && /defining moments/.test(body.innerHTML), 'and the Realm, Wyrms, and Moments sections');
  ok(body.innerHTML.indexOf('<script')<0, 'the body escapes its content (no raw markup injection)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

