// traits-check.js — assertions for v0.52.0 "Ruler Traits".
// A light character sheet: two epithets per crown ruler — a BORN temperament (fixed at accession, from
// the heir's schooling or a seed+ordinal draw) and an EARNED style (read from the reign's own choices +
// marks). Both are PURE derivations (seed, S._dynastyN, the action log, end-state), never stored in S,
// never in state(), never in the _chron stream — so every reign is byte-identical (verified by the plan
// sweep). This checks the derivations directly and confirms they surface on the leaf / ledger, not state().
// Usage: node tests/traits-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler){
  const els = {};
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
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
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,continueAsHeir:continueAsHeir,seatHeir:seatHeir,'
    + 'bornTrait:bornTrait,earnedTrait:earnedTrait,rulerTraits:rulerTraits,rulerStyle:rulerStyle,reignBoldness:reignBoldness,'
    + 'TEMPERAMENTS:TEMPERAMENTS,leafData:leafData,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G;
  if(ruler) G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G, annals:sandbox.annals };
}
// stamp a run of answered letters into the log at weeks starting `base+1`: `boldFrac` answered past option 0
function stampChoices(G, total, boldFrac, base){
  base = base || 0; G.S.actions = G.S.actions || [];
  for(let i=0;i<total;i++) G.S.actions.push([base+i+1,'c','card'+i, (i < Math.round(total*boldFrac)) ? 2 : 0]);
}

/* ============ §1 the born temperament: fixed by the seed, or worn from schooling ============ */
console.log('§1 the born temperament: a seed-fixed trait, or the heir’s schooling when it had one');
{
  const {G}=bootstrap(3030830,['Queen','Born']);
  const a=G.bornTrait(), b=G.bornTrait();
  ok(a===b && G.TEMPERAMENTS.indexOf(a)>=0, 'an unschooled crown has a stable, seed-fixed temperament ('+a+')');
  // a schooled heir wears the schooling instead
  G.S.flags.raised='warlike'; ok(G.bornTrait()==='the Martial', 'a warlike-raised heir is born the Martial');
  G.S.flags.raised='pious';   ok(G.bornTrait()==='the Pious',   'a pious-raised heir is born the Pious');
  G.S.flags.raised='cunning'; ok(G.bornTrait()==='the Subtle',  'a cunning-raised heir is born the Subtle');
  G.S.flags.raised=null;
  // the temperament advances with the dynasty ordinal (so heirs differ from the founder)
  const first=G.bornTrait(); G.S._dynastyN=2; const second=G.bornTrait();
  ok(typeof second==='string' && G.TEMPERAMENTS.indexOf(second)>=0, 'a later crown draws its own temperament ('+first+' -> '+second+')');
}

/* ============ §2 the earned style: read from the reign’s own choices and marks ============ */
console.log('§2 the earned style: null until there is a reign to read, then from the choices and the marks');
{
  const {G}=bootstrap(3030830,['Queen','Earn']);
  G.S.actions=[]; ok(G.earnedTrait()===null, 'a reign with no letters answered has not earned a style yet');
  // boldness: reaching past the prudent first option again and again
  stampChoices(G, 10, 0.8);
  ok(G.earnedTrait()==='the Bold', 'a reign that keeps reaching past the safe option grows the Bold ('+G.earnedTrait()+')');
  G.S.actions=[]; stampChoices(G, 10, 0.0);
  ok(G.earnedTrait()==='the Cautious', 'a reign that keeps to the prudent first option grows the Cautious');
  G.S.actions=[]; stampChoices(G, 10, 0.4);
  ok(G.earnedTrait()==='the Measured', 'a reign that mixes its hands grows the Measured');
  // strong marks speak over boldness
  G.S.actions=[]; stampChoices(G, 10, 0.8);
  G.W.towns[0].wasSacked=true; G.W.towns[1].wasSacked=true;
  ok(G.earnedTrait()==='the Iron-Handed', 'two towns sacked names the reign the Iron-Handed, over any boldness');
  G.W.towns.forEach(t=>t.wasSacked=false);
  G.S.piety=90; ok(G.earnedTrait()==='the Devout', 'a reign kept in high piety is the Devout');
  G.S.piety=50; G.S.dragonsSlain=1; ok(G.earnedTrait()==='the Wyrm-Tried', 'a wyrm-slayer is the Wyrm-Tried');
}

/* ============ §3 rulerStyle: the two epithets in one breath ============ */
console.log('§3 the ruler’s style: born temperament, and the style grown into');
{
  const {G}=bootstrap(3030830,['Queen','Style']);
  G.S.flags.raised='warlike'; G.S.actions=[];
  ok(G.rulerStyle()==='the Martial', 'early on, only the born temperament shows');
  stampChoices(G, 10, 0.8);
  ok(G.rulerStyle()==='the Martial, grown Bold', 'once a style is earned, both read in one breath ('+G.rulerStyle()+')');
}

/* ============ §4 pure & unstored: never in state(), always re-derived ============ */
console.log('§4 the character sheet is a pure derivation — never stored, never in state()');
{
  const {G}=bootstrap(3030830,['Queen','Pure']);
  stampChoices(G, 10, 0.8);
  const st=G.annals.state();
  ok(!('traits' in st) && !('bornTrait' in st) && !('earned' in st), 'traits never appear in state() (byte-identical harness surface)');
  // re-derivation: the same log yields the same style every call
  ok(G.rulerStyle()===G.rulerStyle(), 'the style is a stable pure read');
  // and it rides on the leaf, where display belongs
  G.S.week=1040; G.S.over='endured';
  const leaf=G.leafData();
  ok(leaf.traits && typeof leaf.traits.born==='string', 'the Last Leaf carries the ruler’s traits');
}

/* ============ §4b the earned style is per-reign, not dynasty-cumulative ============ */
console.log('§4b the earned style reads the ruler’s OWN reign, never an ancestor’s (S.actions is the whole dynasty’s log)');
{
  const {G}=bootstrap(3030830,['Queen','Scope']);
  // reign 1 (weeks 1-8): a bold ancestor
  G.S._reignStart=0; stampChoices(G, 8, 1.0, 0);
  ok(G.earnedTrait()==='the Bold', 'the founder reads the Bold from its own weeks');
  // succession: the heir's reign starts later; the ancestor's letters must not count
  G.S._reignStart=1000;
  ok(G.earnedTrait()===null, 'a fresh heir has earned NOTHING yet — the ancestor’s boldness does not leak');
  // the heir rules cautiously in its own weeks
  stampChoices(G, 6, 0.0, 1000);
  ok(G.earnedTrait()==='the Cautious', 'once the heir has ruled, it reads its OWN character (Cautious), not the ancestor’s (Bold)');
}

/* ============ §5 the dynasty remembers each ruler’s character ============ */
console.log('§5 the ledger records each crown’s born + earned character at its succession');
{
  const {G}=bootstrap(3030830,['Queen','Line']);
  G.S.week=1040; G.S.flags.raised='pious'; stampChoices(G, 10, 0.8);
  G.S.over='endured'; G.continueAsHeir('endured');   // the launcher pushes the ledger entry
  const e=(G.S._dynasty||[])[0];
  ok(e && e.born==='the Pious' && e.earned==='the Bold', 'the closed reign enters the ledger with its born + earned character ('+(e&&e.born)+' / '+(e&&e.earned)+')');
  ok(G.leafData().dynastyLedger[0].earned==='the Bold', 'and the leaf ledger carries it for the House’s legend');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

