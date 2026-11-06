// prophecy-check.js — assertions for v0.34.0 "The Seeded Prophecy".
// Usage: node tests/prophecy-check.js   (run from repo root; reads game.js)
// Covers: the portent is drawn PURE of the seed (+ dynasty ordinal) — no RNG, so it is stable across
// boots and across a replay; it is spoken into the chronicle at reign start; it resolves to EXACTLY one
// of the three framings (fulfilled / subverted / forgotten) with the right precedence; each framing is
// reachable and the monk's edited gloss follows it; an heir draws its own portent; and — the sacred
// bit — minting and resolving the portent consumes NO stream, so a baseline plan replays byte-identical.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
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
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,annals:window.annals,'
    + 'PORTENTS:PORTENTS,prophecyIdx:prophecyIdx,currentPortent:currentPortent,'
    + 'prophecyResolve:prophecyResolve,prophecyLeaf:prophecyLeaf,continueAsHeir:continueAsHeir,seatHeir:seatHeir};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}
// find a dynasty-ordinal for this boot whose seed-drawn portent has the given sign (any index is
// reachable by varying the ordinal, since the index is hashName(SEED+'|portent|'+n)%len).
function ordinalFor(G, sign){ for(let n=1;n<400;n++){ G.S._dynastyN=n; if(G.currentPortent().sign===sign) return n; } return -1; }

/* ===================== §1 the portent is pure of the seed (no RNG, stable) ===================== */
console.log('§1 the portent is drawn pure of the seed + dynasty ordinal — deterministic, no RNG stream');
{
  const a=bootstrap(3030830,['Queen','Seed']).G;
  const b=bootstrap(3030830,['Queen','Seed']).G;
  ok(a.prophecyIdx()===b.prophecyIdx(), 'two boots of the same seed draw the same portent (idx '+a.prophecyIdx()+')');
  ok(a.currentPortent().sign===b.currentPortent().sign, 'and the same sign ("'+a.currentPortent().sign+'")');
  ok(a.prophecyIdx()===a.prophecyIdx(), 'the draw is stable across calls (no stream consumed)');
  // a different seed can draw a different portent (the pool is genuinely seed-selected, not a constant)
  let differs=false; for(const s of [7777,111,42,999,2024,55555]){ if(bootstrap(s,['Queen','X']).G.currentPortent().sign!==a.currentPortent().sign){ differs=true; break; } }
  ok(differs, 'other seeds can draw other portents (the pool is exercised across seeds)');
  ok(a.PORTENTS.length>=10 && a.PORTENTS.length<=14, 'the portent pool is ~10-14 deep (got '+a.PORTENTS.length+')');
}

/* ===================== §2 the reign opens on its portent, in the chronicle ===================== */
console.log('§2 the reign opens on the portent — a real chronicle entry at reign start');
{
  const { G }=bootstrap(3030830,['Queen','Open']);
  const chron=G.annals.chronicle(6);
  const line=chron.find(l=>/opened the new page with a portent/.test(l));
  ok(!!line, 'the opening portent is spoken into the chronicle at reign start');
  ok(!!line && /he wrote /.test(line), 'the entry records what the monk wrote');
}

/* ===================== §3 exactly one of three framings, with the right precedence ===================== */
console.log('§3 the portent resolves to exactly one framing (fulfilled > subverted > forgotten)');
{
  const { G }=bootstrap(3030830,['Queen','Frame']);
  // steer to a portent that has BOTH an f and an s predicate — "a crown of ash"
  const n=ordinalFor(G, 'a crown of ash');
  ok(n>0, 'reached the ash-crown portent by dynasty ordinal (n='+n+')');
  // forgotten: a quiet reign satisfies neither predicate
  G.S.flags.burned=false; G.W.towns.forEach(t=>{ t.wasSacked=false; t.pros=40; });
  ok(G.prophecyResolve()==='forgotten', 'neither predicate → forgotten, got '+G.prophecyResolve());
  ok(G.prophecyLeaf().framing==='forgotten' && /scraped to the nap/.test(G.prophecyLeaf().gloss), 'the forgotten gloss scrapes the page clean');
  // fulfilled: a town burned
  G.S.flags.burned=true;
  ok(G.prophecyResolve()==='fulfilled', 'the fulfilling predicate → fulfilled, got '+G.prophecyResolve());
  ok(G.prophecyLeaf().gloss===G.currentPortent().gf, 'the fulfilled gloss is the portent’s "as was written" line');
  // fulfilled OUTRANKS subverted: even with the subvert-state also true, f wins
  G.W.towns.forEach(t=>{ t.pros=90; });   // high prosperity (part of the subvert state) — but burned is still set
  ok(G.prophecyResolve()==='fulfilled', 'fulfilled takes precedence over subverted');
  // subverted: clear the fulfilling state, leave the pointed-opposite state
  G.S.flags.burned=false; G.W.towns.forEach(t=>{ t.wasSacked=false; t.pros=90; });
  ok(G.prophecyResolve()==='subverted', 'the pointed-opposite predicate → subverted, got '+G.prophecyResolve());
  ok(G.prophecyLeaf().gloss===G.currentPortent().gs, 'the subverted gloss is the monk’s spin, not the fulfilment line');
  // every framing is one of exactly three legal values
  ok(['fulfilled','subverted','forgotten'].includes(G.prophecyLeaf().framing), 'framing is one of the three legal values');
}

/* ===================== §4 an s:null portent resolves only fulfilled or forgotten ===================== */
console.log('§4 a portent with no "opposite" predicate resolves only fulfilled or forgotten (never subverted)');
{
  const { G }=bootstrap(3030830,['Queen','Law']);
  const n=ordinalFor(G, 'a law that cannot be unwritten');
  ok(n>0, 'reached the doctrine portent (s:null)');
  ok(G.currentPortent().s===null, 'the doctrine portent has no subvert predicate');
  G.S.doctrine={justice:null,endowment:null,muster:null};
  ok(G.prophecyResolve()==='forgotten', 'uncommitted → forgotten (cannot be subverted), got '+G.prophecyResolve());
  G.S.doctrine={justice:'assize',endowment:null,muster:null};
  ok(G.prophecyResolve()==='fulfilled', 'a committed doctrine → fulfilled');
}

/* ===================== §5 the leaf carries the prophecy, and an heir draws its own ===================== */
console.log('§5 the Last Leaf carries the prophecy; each heir draws a fresh one by its ordinal');
{
  const { G }=bootstrap(3030830,['Queen','Leaf']); G.S.over='endured';
  const d=G.annals.leafData();
  ok(d.prophecy && typeof d.prophecy.sign==='string' && typeof d.prophecy.omen==='string' && typeof d.prophecy.gloss==='string',
     'leafData().prophecy carries {sign, framing, omen, gloss}');
  ok(['fulfilled','subverted','forgotten'].includes(d.prophecy.framing), 'the leaf framing is legal ('+d.prophecy.framing+')');
  // the heir's portent is indexed by the (incremented) dynasty ordinal — it may differ from the first
  const idx1=G.prophecyIdx();
  G.seatHeir('endured','Heir');
  ok(G.S._dynastyN===2, 'the heir is the second of the line');
  ok(G.prophecyIdx()===bootstrapIdxFor(3030830,2), 'the heir’s portent is the seed-drawn one for ordinal 2 (deterministic)');
  // a fresh portent line is spoken for the heir too
  ok(G.annals.chronicle(8).some(l=>/opened the new page with a portent/.test(l)), 'the heir’s reign also opens on a portent');
  void idx1;
}
function bootstrapIdxFor(seed, dyn){ const g=bootstrap(seed,['Queen','P']).G; g.S._dynastyN=dyn; return g.prophecyIdx(); }

/* ===================== §6 determinism: a baseline plan replays byte-identical ===================== */
console.log('§6 the prophecy takes no stream — a baseline reign replays byte-identical (double-run diff)');
{
  const plan=path.join(ROOT,'tests','plans','smart-builder.json');
  const run=()=>execFileSync('node',[path.join(ROOT,'harness.js'),'3030830',plan,'1040','--auto=0'],{encoding:'utf8'});
  const a=run(), b=run();
  ok(a===b, 'same seed + plan → identical harness output on a re-run (determinism preserved)');
  const out=JSON.parse(a);
  ok((out.anomalies||[]).length===0, 'the baseline plan runs with zero anomalies ('+(out.anomalies||[]).length+')');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

