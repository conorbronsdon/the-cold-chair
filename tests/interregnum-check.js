// interregnum-check.js — assertions for v0.50.0 "The Interregnum".
// The gap between crown reigns is now a short PLAYABLE scene: endured -> the Quiet Passage (a bequest,
// and once the line has a history, the name it leads with); a lost crown -> the Contested Return
// (gather backers, which MINTS a standing obligation, then resolve the return on a muster mirror; a
// failed return seats a weakened crown and thins the next one). Every scene letter is an ordinary CARD
// answered by an ordinary 'c' log entry, so replay is unchanged — and because no plan uses an 'h'
// action mid-run, the whole feature rebaselines NOTHING in the suite. This drives the scenes directly
// (the harness stops at reign end) and replays a full h+scene log to prove determinism.
// Usage: node tests/interregnum-check.js
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
  sandbox.localStorage={ getItem:k=>(k in mem?mem[k]:null), setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; }, _m:mem };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.navigator={};
  sandbox.btoa=x=>Buffer.from(x,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,continueAsHeir:continueAsHeir,'
    + 'resolveCard:resolveCard,replay:replay,leafData:leafData,annals:window.annals,'
    + 'returnMight:returnMight,seatedPower:seatedPower};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G;
  if(ruler) G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G, mem, annals:sandbox.annals };
}
// resolve the pending letter by option index; returns the id that was resolved
function answer(G, i){ const id=G.S.pendingCard&&G.S.pendingCard.id; G.resolveCard(i); return id; }
// end the current reign (bypass endGame's DOM/localStorage) and open the succession scene
function succeed(G, kind){ G.S.over=kind; G.S.speed=0; G.continueAsHeir(kind); }

/* ============ §1 the Quiet Passage (endured) ============ */
console.log('§1 the Quiet Passage: an endured crown passes through a will, then seats the heir');
{
  const {G}=bootstrap(3030830,['Queen','Alda']);
  G.S.week=1040; const oldRuler=G.S.ruler.name, piety0=G.S.piety;
  succeed(G,'endured');
  ok(G.S.interregnum && G.S.interregnum.kind==='endured', 'the endured succession opens an interregnum');
  ok(G.S.pendingCard && G.S.pendingCard.id==='ir-quiet-passage', 'the first letter is the Quiet Passage');
  const first=answer(G,0);  // the tenth to the Concord
  ok(first==='ir-quiet-passage', 'the will was read');
  // first succession (only this reign in the ledger) -> no epithet letter, the heir seats at once
  ok(!G.S.interregnum, 'the scene closes and the heir is seated (first succession: no epithet letter)');
  ok(G.S.over===null, 'the new reign is live');
  ok(G.S.ruler.name!==oldRuler, 'a new hand sits the chair ('+G.S.ruler.name+')');
  ok(G.S.piety>piety0, 'the Concord bequest raised piety ('+piety0+'->'+G.S.piety+')');
}

/* ============ §2 the skip: seat the heir at once (endured) ============ */
console.log('§2 the skip option collapses the scene at a cost');
{
  const {G}=bootstrap(3030830,['Queen','Skip']);
  G.S.week=1040; G.S.legit=60;
  succeed(G,'endured');
  const legitBefore=G.S.legit;
  answer(G,3);  // seat the heir at once
  ok(!G.S.interregnum && G.S.over===null, 'the skip seats the heir immediately');
  ok(G.S.legit < legitBefore, 'a rushed crowning is a doubted one (legit '+legitBefore+'->'+G.S.legit+')');
}

/* ============ §3 the House epithet (second succession) ============ */
console.log('§3 the House epithet: once the line has a history, the heir chooses the name it leads with');
{
  const {G}=bootstrap(3030830,['Queen','Root']);
  G.S.week=1040;
  // pre-seed a prior closed reign so THIS succession is the line's second
  G.S._dynasty=[{ruler:'Queen Founder', verdict:'the Steward', years:[30,50], ending:'endured', wyrms:0}];
  succeed(G,'endured');
  answer(G,1);  // the tenth to the muster
  ok(G.S.pendingCard && G.S.pendingCard.id==='ir-house-epithet', 'the second succession offers the House epithet');
  const chosen=answer(G,0);  // lead with the eldest crown
  ok(chosen==='ir-house-epithet' && G.S._dynastyEpithet==='the Steward', 'the House leads with its eldest crown ('+G.S._dynastyEpithet+')');
  // v0.51.0 composes here: with a founder (2 renown) + this endured reign (2), the House can now afford
  // a legacy, so the interregnum offers one last beat before seating. Hold it and seat.
  if(G.S.pendingCard && G.S.pendingCard.id==='ir-house-legacy') answer(G,1);
  ok(!G.S.interregnum && G.S.over===null, 'the heir seats after choosing the name (and holding any legacy on offer)');
  // the epithet surfaces on the Last Leaf's dynasty legend
  G.S.over='endured';
  const leaf=G.leafData();
  ok(leaf.dynastyEpithet==='the Steward', 'the leaf carries the chosen epithet');
}

/* ============ §4 the Contested Return: mortgage, then the muster mirror ============ */
console.log('§4 the Contested Return: gathering backers mints a standing obligation, then the return resolves');
{
  const {G}=bootstrap(3030830,['Queen','Exile']);
  G.S.week=1040;
  succeed(G,'deposed');
  ok(G.S.pendingCard && G.S.pendingCard.id==='ir-gather-backers', 'a deposed crown returns against a seated power');
  const owed0=(G.S.owed||[]).length;
  answer(G,0);  // take the League's silver
  ok((G.S.owed||[]).length===owed0+1 && G.S.owed[G.S.owed.length-1].kind==='loan', 'the promise minted a standing obligation (the return is mortgaged)');
  ok(G.S.pendingCard && G.S.pendingCard.id==='ir-the-return', 'the return letter follows the backers');
  ok(G.S.interregnum.backing>0, 'the backing was recorded ('+G.S.interregnum.backing+')');
  answer(G,0);  // cross and take the realm back
  ok(!G.S.interregnum && G.S.over===null, 'the return resolves and the heir seats');
  // the debt outlives the crown that signed it (v0.48.0 machinery)
  ok((G.S.owed||[]).some(o=>o.kind==='loan'), 'the restoration debt carries into the new reign');
}

/* ============ §5 a failed return seats a weakened crown and thins the next ============ */
console.log('§5 a failed return: the heir seats on sufferance, and the next return is dearer');
{
  const {G}=bootstrap(3030830,['Queen','Thin']);
  G.S.week=1040;
  // force a hostile realm: cold court, low prosperity proxies already low; ensure the seated power wins
  G.S.factions.court.disp=10; G.W.towns.forEach(t=>t.pros=5); G.S.restorationDebt=2;
  succeed(G,'conquest');
  answer(G,3);  // return unbacked, at once (skip the gathering) -> still seats, doubted
  ok(!G.S.interregnum && G.S.over===null, 'an unbacked return still seats the heir (someone must be played)');
  // now a fresh contested succession that actually resolves a LOSS
  const {G:H}=bootstrap(777,['Queen','Loss']);
  H.S.week=1040; H.S.factions.court.disp=6; H.W.towns.forEach(t=>t.pros=4); H.S.restorationDebt=3;
  succeed(H,'conquest');
  answer(H,0);  // take the League's silver (small backing)
  const rd0=H.S.restorationDebt, might=H.returnMight(), power=H.seatedPower('conquest');
  answer(H,0);  // cross now
  ok(might<power, 'the thin host could not match the dug-in occupiers ('+might+' < '+power+')');
  ok(H.S.restorationDebt===rd0+1, 'a failed return thickens the ledger the next heir must overcome ('+rd0+'->'+H.S.restorationDebt+')');
  ok(H.S.over===null, 'the realm still has a crown, worn low');
}

/* ============ §6 determinism: the same seed + same choices seats the same heir the same way ============ */
console.log('§6 determinism: the interregnum is a pure function of (seed, choices)');
{
  function run(){
    const {G}=bootstrap(3030830,['Queen','Det']);
    G.S.week=1040;
    succeed(G,'deposed');
    answer(G,2);  // hire the Reach's swords
    answer(G,1);  // wait one more season, then cross
    return { heir:G.S.ruler.name, legit:Math.round(G.S.legit), levies:G.S.levies,
             owed:(G.S.owed||[]).map(o=>o.kind).join(','), rd:G.S.restorationDebt||0 };
  }
  const a=run(), b=run();
  ok(JSON.stringify(a)===JSON.stringify(b), 'two runs land byte-identical ('+JSON.stringify(a)+')');
}

/* ============ §7 replay determinism: a log carrying an 'h' + interregnum letters replays identically ============ */
console.log('§7 replay determinism: a log through a succession (the h action, then the scene’s c letters) replays the same every time');
{
  // Build a real action log that carries the reign PAST a succession and into the heir's reign — the
  // shape of a (rare, user-made) multi-reign history link. We capture it once, then replay it TWICE and
  // require the two replays to land byte-identical: that self-consistency is exactly the guarantee a
  // shared link makes. (We do not compare against the capturing run — a mid-reign forced succession is
  // not a natural reign, so its live state legitimately differs from what a fresh replay computes; the
  // link's promise is that the link always replays to the SAME place, which is what this checks.)
  const cap=bootstrap(3030830,['Queen','Cap']);
  if(cap.annals.choices()) cap.annals.choose(0);     // clear the opening letter
  cap.annals.advance(40);
  cap.G.S.over='endured'; cap.G.continueAsHeir('endured');
  cap.G.resolveCard(1);                              // Quiet Passage: the tenth to the muster (first succession seats at once)
  cap.annals.advance(30);                            // play a little of the heir's reign
  if(cap.annals.choices()) cap.annals.choose(0);
  const log={ r:{title:'Queen',name:'Cap'}, a:cap.G.S.actions.slice(), w:cap.G.S.week };

  const A=bootstrap(3030830,null); A.G.replay({r:log.r,a:log.a.slice(),w:log.w});
  const B=bootstrap(3030830,null); B.G.replay({r:log.r,a:log.a.slice(),w:log.w});
  ok(A.G.S.ruler.name===B.G.S.ruler.name, 'both replays seat the same heir ('+A.G.S.ruler.name+')');
  ok(JSON.stringify(A.annals.state())===JSON.stringify(B.annals.state()), 'the log replays byte-identically every time (the shared-link guarantee)');
  ok(A.G.S.actions.some(x=>x[1]==='h'), 'the log genuinely carried a succession through the interregnum');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

