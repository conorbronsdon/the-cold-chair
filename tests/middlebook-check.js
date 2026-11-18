// middlebook-check.js — assertions for the Middle-Book wave (v0.57.0 batch 1 + v0.79.0 batch 2).
// The settled-middle ambient letters: they join the SHARED roll only in the mid-reign window
// (wk 364–832), add no draw (the pick just has more to choose from), are crown-only via
// NOBLE_EXCLUDE, and every card is static-t/static-s with no RNG in any effect. This checks the
// card shapes, the window wiring, each option's resolution (no NaN, clamps hold), and the one
// delayed follow-up (the grammar school's scheduled margin note).
// Usage: node tests/middlebook-check.js  (regenerate game.js from index.html first)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

const BATCH1 = ['the-long-servant','the-charter-fair','the-two-villages','the-good-year','the-kings-road'];
const BATCH2 = ['the-ferry-right','the-front-pew','the-grammar-school','the-idle-mill','the-renamed-village'];
const ALL = BATCH1.concat(BATCH2);

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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,NOBLE_EXCLUDE:NOBLE_EXCLUDE,finishSetup:finishSetup,'
    + 'showCard:showCard,resolveCard:resolveCard,chronicle:()=>API._chron.slice(),annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], 'crown');
  return G;
}
const finite=v=>typeof v==='number' && Number.isFinite(v);

/* ============ §1 card shapes: static t, static option labels/hints, a re: cooldown ============ */
console.log('§1 all ten middle-book cards exist with static titles, static options, and a re: cooldown');
{
  const G=bootstrap(3030830,['Queen','Shape']);
  for(const id of ALL){
    const c=G.CARDS[id];
    ok(!!c, id+' exists in CARDS');
    if(!c) continue;
    ok(typeof c.t==='string' && c.t.length>0, id+' has a static title');
    ok(typeof c.re==='number' && c.re>=208 && c.re<=286, id+' has a re: cooldown in the batch band (208–286)');
    ok(Array.isArray(c.o) && c.o.length===3, id+' offers exactly three options');
    ok(c.o.every(o=>typeof o.l==='string' && typeof o.s==='string' && typeof o.f==='function'),
       id+' options are static l/s strings with an effect');
    ok(typeof c.p==='function' && typeof c.p()==='string' && c.p()===c.p(),
       id+' prompt is a deterministic string (two reads identical)');
    ok(!c.oN, id+' has no noble re-read (which is why it must sit in NOBLE_EXCLUDE)');
  }
}

/* ============ §2 crown-only: every id sits in NOBLE_EXCLUDE ============ */
console.log('§2 every middle-book id is in NOBLE_EXCLUDE (a climbing knight never sees them)');
{
  const G=bootstrap(3030830,['Queen','Gate']);
  for(const id of ALL) ok(G.NOBLE_EXCLUDE.has(id), id+' is noble-excluded');
}

/* ============ §3 the window wiring: batch 2 rides the same wk364–832 concat as batch 1 ============ */
console.log('§3 the ambient-roll window concat carries all ten ids (source check on game.js)');
{
  const src=fs.readFileSync(path.join(ROOT,'game.js'),'utf8');
  const m=src.match(/S\.week>=364 && S\.week<=832\) ids=ids\.concat\(\[([^\]]+)\]/);
  ok(!!m, 'the wk364–832 window concat exists');
  if(m) for(const id of ALL) ok(m[1].includes("'"+id+"'"), id+' is in the window concat');
}

/* ============ §4 every option of every batch-2 card resolves cleanly ============ */
console.log('§4 each batch-2 option resolves: state stays finite, clamps hold, the record gets a line');
for(const id of BATCH2){
  for(let i=0;i<3;i++){
    const G=bootstrap(3030830,['Queen','Opt'+i]);
    G.S.week=520;                                  // mid-window
    const chronBefore=G.chronicle().length;
    G.showCard(id); G.resolveCard(i);
    ok(finite(G.S.gold) && G.S.gold>=0, id+' o'+i+': gold finite and non-negative');
    ok(finite(G.S.legit) && G.S.legit>=0 && G.S.legit<=100, id+' o'+i+': legit clamped 0–100');
    ok(finite(G.S.piety) && G.S.piety>=0 && G.S.piety<=100, id+' o'+i+': piety clamped 0–100');
    ok(G.W.towns.every(t=>finite(t.pros) && t.pros>=4 && t.pros<=95), id+' o'+i+': every town pros clamped 4–95');
    ok(G.chronicle().length>chronBefore, id+' o'+i+': the monk wrote something down');
    ok(G.S.seenCards[id]===520, id+' o'+i+': seenCards stamped for the re: dedupe');
  }
}

/* ============ §5 the one delayed follow-up: the grammar school's scheduled margin ============ */
console.log('§5 endowing the grammar school schedules a margin note three years on, and nothing else does');
{
  const G=bootstrap(3030830,['Queen','School']);
  G.S.week=520;
  const schedBefore=G.S.schedule.length;
  G.showCard('the-grammar-school'); G.resolveCard(0);
  const added=G.S.schedule.slice(schedBefore);
  ok(added.length===1 && added[0].week===520+156, 'endowment schedules exactly one entry at +156 weeks');
  const chronBefore=G.chronicle().length;
  const goldBefore=G.S.gold, legitBefore=G.S.legit;
  added[0].fn();
  ok(G.chronicle().length===chronBefore+1, 'the scheduled note writes one margin line');
  ok(G.S.gold===goldBefore && G.S.legit===legitBefore, 'the scheduled note mutates no state (a pure marg)');
  // the other batch-2 cards stay self-contained: no option schedules or arms anything
  for(const id of BATCH2.filter(x=>x!=='the-grammar-school')){
    for(let i=0;i<3;i++){
      const H=bootstrap(3030830,['Queen','Self'+i]);
      H.S.week=520;
      const sb=H.S.schedule.length, flagsBefore=JSON.stringify(H.S.flags);
      H.showCard(id); H.resolveCard(i);
      ok(H.S.schedule.length===sb, id+' o'+i+' schedules nothing');
      ok(JSON.stringify(H.S.flags)===flagsBefore, id+' o'+i+' arms no flag');
    }
  }
}

/* ============ §6 resolution is repeatable: same option twice, identical state ============ */
// (Catches wall-clock/unseeded nondeterminism. It canNOT catch a seeded-stream draw — both reigns
// hold identical stream state — which is why §7 scans the effect source directly.)
console.log('§6 resolving the same option in two fresh reigns leaves bit-identical state (no unseeded nondeterminism)');
for(const id of BATCH2){
  const snap=G=>JSON.stringify({g:G.S.gold,l:G.S.legit,p:G.S.piety,t:G.W.towns.map(t=>t.pros),c:G.chronicle().length});
  const A=bootstrap(3030830,['Queen','Det']); A.S.week=520; A.showCard(id); A.resolveCard(0);
  const B=bootstrap(3030830,['Queen','Det']); B.S.week=520; B.showCard(id); B.resolveCard(0);
  ok(snap(A)===snap(B), id+': two identical reigns resolve o0 to identical state');
}

/* ============ §7 the iron law, statically: no card function touches any RNG source ============ */
// The four seeded streams are const (can't be wrapped with a call counter), so the no-RNG guarantee
// is enforced at the source: every p()/from()/f() and the grammar school's scheduled closure must be
// free of stream draws (rWorld/rDetail/rHist/rAmb, and the ri/pick helpers that consume them) and of
// wall-clock nondeterminism (Math.random / Date.now / new Date). This is falsifiable: paste a single
// rHist() into any effect and this section fails.
console.log('§7 static scan: no middle-book card function draws from any RNG stream or the clock');
{
  const FORBID=/\b(rWorld|rDetail|rHist|rAmb|ri|pick)\s*\(|Math\.random|Date\.now|new\s+Date\b/;
  const G=bootstrap(3030830,['Queen','Scan']);
  for(const id of ALL){
    const c=G.CARDS[id];
    const fns=[['p',c.p]]; if(typeof c.from==='function') fns.push(['from',c.from]);
    c.o.forEach((o,i)=>fns.push(['o'+i+'.f',o.f]));
    for(const [name,fn] of fns) ok(!FORBID.test(fn.toString()), id+' '+name+' is RNG- and clock-free');
  }
  // the scheduled closure too: capture it by resolving the endowment and scanning what was scheduled
  const H=bootstrap(3030830,['Queen','Sched']); H.S.week=520;
  const sb=H.S.schedule.length; H.showCard('the-grammar-school'); H.resolveCard(0);
  const fn=H.S.schedule[sb] && H.S.schedule[sb].fn;
  ok(typeof fn==='function' && !FORBID.test(fn.toString()), 'the grammar school’s scheduled closure is RNG- and clock-free');
}

console.log(fails===0 ? 'ALL PASS: '+passes+' passed' : 'FAILURES: '+fails+' failed, '+passes+' passed');
process.exit(fails?1:0);
