// wyrm-consort-check.js — assertions for v0.36.0 "The Wyrm-Consort" (secret path).
// Usage: node tests/wyrm-consort-check.js   (run from repo root; reads game.js)
// Covers: the five-portent door predicate is exact and seed-stable; every single portent flip closes it;
// the door branch takes the SAME one rHist draw an ordinary Feed's Reach-roll takes (off-path byte-safe);
// every consequence term is inert without the flag; the full troth arc resolves (faith craters, terror
// muster, household keep, the Wyrmmother verdict, weight-13 two-layer moment); the line carries to the
// heir with a rider's tilt; and the hidden achievement stays unlisted until earned.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
  get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
  querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
  set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }

// A real Map-backed localStorage — the achievement store needs one (the default stub is inert).
function realStore(){ const m=new Map();
  return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>{m.set(k,String(v));}, removeItem:k=>{m.delete(k);} }; }

function bootstrap(seed, ruler, mode, store){
  const els = {};
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){ throw new Error('reload'); } };
  sandbox.localStorage = store || { getItem:()=>null, setItem(){}, removeItem(){} };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape; sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,annals:window.annals,'
    + 'wyrmTrothDoor:wyrmTrothDoor,dragonKind:dragonKind,dragonRavage:dragonRavage,'
    + 'crownMight:crownMight,resolveRaid:resolveRaid,weeklyEconomy:weeklyEconomy,continueAsHeir:continueAsHeir,seatHeir:seatHeir,'
    + 'reignVerdict:reignVerdict,leafJudgment:leafJudgment,leafData:leafData,maybeReachWyrm:maybeReachWyrm,'
    + 'achHas:achHas,achEarn:achEarn,rHist:rHist,buildCount:buildCount,'
    + 'wtQueued:()=>cardQ.includes("wyrm-troth")};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}

// put a bootstrapped reign into the post-tribute door state (as it would be at the Feed answer's check)
function doorState(G){
  G.S.week=400; G.S.gold=8000; G.S.opulence=4; G.S.legit=60;
  G.S.dragon={ord:1,kind:'ember',name:'Testwyrm the Ember-Wing'};
  G.S.flags.wed=false; G.S.flags.wyrmConsort=undefined;
}
// fire a card option in isolation (the dragon-check idiom)
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; G.CARDS[id].o[opt].f(); G.S.pendingCard=null; }

/* ===================== §1 the door predicate is exact and seed-stable ===================== */
console.log('§1 the five-portent door is true only for a believed, unmarried queen feeding a standing, grown ember-hoard');
{
  const { G }=bootstrap(3030830,['Queen','Ashryn']); doorState(G);
  ok(G.dragonKind(1)==='ember', 'seed 3030830 ord-1 wyrm is an ember-wing (the seed hook)');
  ok(G.wyrmTrothDoor()===true, 'all five portents aligned → the door is open');
  // seed-stable across a fresh bootstrap of the same seed
  const g2=bootstrap(3030830,['Queen','Ashryn']).G; doorState(g2);
  ok(g2.wyrmTrothDoor()===true, 'the door is stable across a double-run (same seed → same result)');
  // firing the Feed answer on a rich board opens the door: keeps the wyrm, schedules the troth letter
  const g3=bootstrap(3030830,['Queen','Feed']).G;
  g3.S.week=400; g3.S.gold=20000; g3.S.opulence=6; g3.S.legit=60;
  g3.W.towns.forEach(t=>{ t.pros=60; t.wasSacked=false; });
  g3.S.dragon={ord:1,kind:'ember',name:'Emberwyrm'};
  const sched0=g3.S.schedule.length;
  fire(g3,'dragon',1);
  ok(g3.S.dragon!==null, 'opening the door KEEPS the wyrm (it is not flying for a bigger hoard)');
  ok(g3.S.flags.wyrmTrothOffered===g3.S.week, 'the door-open tell is stamped (wyrmTrothOffered)');
  ok(g3.S.schedule.length===sched0+1, 'the troth letter is scheduled (one queued follow-up)');
  ok(!g3.S.flags.reachWyrmDone, 'the door branch does NOT roll the Reach (the wyrm stays to court the Crown)');
}

/* ===================== §2 any single portent failing closes the door ===================== */
console.log('§2 flip exactly one portent and the door shuts (and it is crown-only)');
{
  const flip=(mut,msg)=>{ const g=bootstrap(3030830,['Queen','X']).G; doorState(g); mut(g);
    ok(g.wyrmTrothDoor()===false, msg); };
  flip(g=>{ g.S.ruler.title='King'; }, 'a king reign never sees the door (gender gate)');
  flip(g=>{ g.S.flags.wed=true; }, 'a married crown cannot wed the wyrm (already a policy-spouse)');
  flip(g=>{ g.S.flags.wyrmConsort=g.S.week; }, 'an already-wed queen does not re-open the door');
  flip(g=>{ g.S.dragon.kind='rime'; }, 'a rime-drake takes no bride (only the ember-wing)');
  flip(g=>{ g.S.dragon.kind='brine'; }, 'a brine-serpent takes no bride either');
  flip(g=>{ g.S.gold=5999; }, 'a hoard that did not survive the tribute (below the line) shuts the door');
  flip(g=>{ g.S.opulence=2; }, 'a hoard not shown to grow year over year (opulence<3) shuts the door');
  flip(g=>{ g.S.legit=54; }, 'a broken throne (legit<55) cannot feed from strength');
  // crown-gated: a climbing knight's board never opens it (and wyrm-troth is in NOBLE_EXCLUDE)
  const gn=bootstrap(3030830,['Queen','Knight'],'noble').G;
  gn.S.week=400; gn.S.gold=8000; gn.S.opulence=4; gn.S.legit=60; gn.S.dragon={ord:1,kind:'ember',name:'x'};
  ok(gn.wyrmTrothDoor()===false, 'a noble (climbing-knight) reign is crown-gated out of the door');
}

/* ===================== §3 off-path: same draw, inert consequences ===================== */
console.log('§3 an ordinary Feed and the door branch take the SAME one rHist draw; every term is flag-inert');
{
  // draw-count parity: a King feeding an ember-wing (no door) rolls the Reach = 1 rHist; a Queen opening
  // the door schedules ri(rHist,6,14) = 1 rHist. Same seed, identical pre-state → the streams advance in
  // lockstep, so the very next rHist() reads equal. (dragonRavage + tribute consume no RNG.)
  const gK=bootstrap(3030830,['King','Off']).G;
  gK.S.week=400; gK.S.gold=20000; gK.S.opulence=6; gK.S.legit=60; gK.W.towns.forEach(t=>{t.pros=60;t.wasSacked=false;});
  gK.S.dragon={ord:1,kind:'ember',name:'Emberwyrm'};
  fire(gK,'dragon',1);
  ok(!gK.S.flags.wyrmTrothOffered && gK.S.dragon===null, 'a King feeds normally — no door, the wyrm is nulled');
  const gQ=bootstrap(3030830,['Queen','On']).G;
  gQ.S.week=400; gQ.S.gold=20000; gQ.S.opulence=6; gQ.S.legit=60; gQ.W.towns.forEach(t=>{t.pros=60;t.wasSacked=false;});
  gQ.S.dragon={ord:1,kind:'ember',name:'Emberwyrm'};
  fire(gQ,'dragon',1);
  ok(gQ.S.flags.wyrmTrothOffered && gQ.S.dragon!==null, 'a Queen on the five-portent board opens the door');
  ok(gK.rHist()===gQ.rHist(), 'both branches consumed exactly one rHist — the next draw reads equal (off-path byte-safe)');
  // consequence terms are inert without the flag (the flag is a WEEK — must be truthy, as it always is
  // in the real game where the troth is taken at week>260)
  const g=bootstrap(3030830,['Queen','Inert']).G;
  g.S.week=300; g.S.levies=2000; g.S.built={walls:1}; g.S.legit=60; g.S.pay=1;
  const might0=g.crownMight(); g.S.flags.wyrmConsort=g.S.week; const might1=g.crownMight();
  ok(Math.abs((might1-might0)-1000)<1e-6, 'crownMight rises by exactly 1000 with the consort flag (0 without → byte-identical), got '+(might1-might0));
  const g2=bootstrap(3030830,['Queen','Up']).G; g2.S.week=300;
  const up0=g2.weeklyEconomy(); const inc0=g2.S._inc.upkeep;
  g2.S.flags.wyrmConsort=g2.S.week; g2.weeklyEconomy(); const inc1=g2.S._inc.upkeep;
  ok(inc1>inc0, 'weeklyEconomy upkeep rises with the household keep (0 without → byte-identical)');
  ok(g2.S._inc.notes.some(n=>/Wyrm-Consort/.test(n)), 'the income ledger names the Wyrm-Consort’s keep');
}

/* ===================== §4 the full troth arc resolves ===================== */
console.log('§4 going up the tower founds the line: faith craters, terror musters, the Wyrmmother is named');
{
  const { G }=bootstrap(3030830,['Queen','Wyrmmother']);
  G.S.week=300;   // the troth is a late-reign act — the flag is a WEEK and must be truthy
  G.S.dragon={ord:1,kind:'ember',name:'Emberwyrm the Ember-Wing'};
  G.S.piety=60; G.S.legit=70; const church0=G.S.factions.church.disp, court0=G.S.factions.court.disp, com0=G.S.factions.commons.disp;
  G.S.threats.muster.clock=2;
  fire(G,'wyrm-troth',2);
  ok(G.S.flags.wyrmConsort===G.S.week, 'the troth is taken — S.flags.wyrmConsort set to the week wed');
  ok(G.S.flags.dragonLine===true, 'the dragon-riding line is founded (dragonLine)');
  ok(G.S.dragon===null, 'the wyrm is no longer a threat on the board — it is consort now');
  ok(G.S.factions.church.disp<church0 && G.S.factions.church.grievance>=7, 'the Concord craters and its grievance arms the interdict (>=7)');
  ok(G.S.factions.court.disp<court0, 'the old blood recoils');
  ok(G.S.factions.commons.disp>com0, 'the commons stand in awe');
  ok(G.S.threats.muster.clock===G.S.threats.muster.max, 'the Reach will not muster against a dragon-wed queen (clock maxed)');
  ok(G.S.flags.dragonDread===G.S.week, 'dragonDread is stamped (a persistent fact the war model reads)');
  // terror muster: a raid that would sack now repels
  const gR=bootstrap(3030830,['Queen','Repel']).G;
  gR.S.week=500; gR.S.levies=500; gR.S.built={}; gR.W.towns.forEach(t=>{t.pros=40;t.wasSacked=false;});
  gR.S.raidNext=gR.S.week; gR.resolveRaid(); const sackedNoFlag=gR.W.towns.filter(t=>t.wasSacked).length;
  const gR2=bootstrap(3030830,['Queen','Repel2']).G;
  gR2.S.week=500; gR2.S.levies=500; gR2.S.built={}; gR2.W.towns.forEach(t=>{t.pros=40;t.wasSacked=false;});
  gR2.S.flags.wyrmConsort=gR2.S.week; gR2.S.raidNext=gR2.S.week; gR2.resolveRaid();
  ok(gR2.W.towns.filter(t=>t.wasSacked).length<=sackedNoFlag, 'a dragon-wed realm shrugs off a raid a thin muster would have lost');
  // the verdict outranks the Dragonlord
  ok(G.reignVerdict()==='the Wyrmmother', 'the reign is named the Wyrmmother, got '+G.reignVerdict());
  G.S.dragonsSlain=2; ok(G.reignVerdict()==='the Wyrmmother', 'the Wyrmmother outranks even a forced two-kill Dragonlord');
  // the weight-13 defining moment and the leaf clause
  const bigM=(G.S._moments||[]).find(m=>m.weight===13 && /wed the wyrm/.test(m.text));
  ok(!!bigM, 'a weight-13 defining moment records the troth (above the dragon-hunt’s 12)');
  ok(/older word/.test(G.leafJudgment()), 'the leaf judgment names the older word the record dodges');
  // the two-layer fold only lands when the scriptorium is endowed (gilding active) — exactly the burned-
  // wood treatment; on an ungilded reign the troth records as plain truth (byte-safe for baselines).
  const gG=bootstrap(3030830,['Queen','Gilded']).G;
  gG.S.week=300; gG.S.flags.gildUntil=99999;   // endow the scriptorium so chronCrown gilds
  gG.S.dragon={ord:1,kind:'ember',name:'Emberwyrm the Ember-Wing'};
  fire(gG,'wyrm-troth',2);
  const folded=gG.leafData().moments.find(m=>/wed the wyrm/.test(m.text));
  ok(folded && folded.gild && /did not take the spear/.test(folded.gild.truth), 'with an endowed scriptorium the leaf folds the troth into the gilded-vs-truth two-layer line');
}

/* ===================== §5 the line carries to the heir with a rider's tilt ===================== */
console.log('§5 the heir inherits the line, the cost, and a colder court');
{
  const { G }=bootstrap(3030830,['Queen','Founder']);
  G.S.flags.wyrmConsort=G.S.week; G.S.flags.dragonLine=true; G.S.over='endured';
  const court0=G.S.factions.court.disp;
  G.seatHeir('endured','Heir');
  ok(G.S.flags.dragonLine===true, 'the heir inherits the dragon-riding line (dragonLine persists)');
  ok(!!G.S.flags.wyrmConsort, 'the line still keeps a wyrm — the reward and the cost both carry');
  ok(G.S.factions.court.disp<court0, 'the old houses open colder at home (the rider’s tilt)');
  ok(G.S.threats.muster.clock===G.S.threats.muster.max, 'the Reach still fears the blood — the muster opens quiet');
  const up=G.weeklyEconomy(); ok(G.S._inc.notes.some(n=>/Wyrm-Consort/.test(n)), 'the household keep still bites in the heir’s ledger');
  // a NON-consort reign's heir is unchanged (no dragonLine)
  const g2=bootstrap(3030830,['Queen','Plain']).G; g2.S.over='endured'; g2.seatHeir('endured','Heir');
  ok(!g2.S.flags.dragonLine && !g2.S.flags.wyrmConsort, 'a non-consort reign’s heir carries no line (byte-identical succession)');
}

/* ===================== §6 the hidden achievement stays unlisted until earned ===================== */
console.log('§6 the Wyrm-Consort achievement is hidden until the tower is walked');
{
  const store=realStore();
  const { G }=bootstrap(3030830,['Queen','Hidden'],'crown',store);
  ok(G.achHas('wyrm-consort')===false, 'before the path: the achievement is not earned');
  ok(!G.annals.achievements().some(a=>a.id==='wyrm-consort'), 'and a hidden-unearned achievement is NEVER listed (no locked slot)');
  G.S.dragon={ord:1,kind:'ember',name:'Emberwyrm'};
  fire(G,'wyrm-troth',2);
  ok(G.achHas('wyrm-consort')===true, 'after the troth: the achievement is earned');
  const listed=G.annals.achievements().find(a=>a.id==='wyrm-consort');
  ok(!!listed && listed.earned && /did not take the spear/.test(listed.reveal||''), 'and it now lists with its reveal text');
  // the earn survives a re-read (persisted to the store)
  const g2=bootstrap(3030830,['Queen','Reread'],'crown',store).G;
  ok(g2.achHas('wyrm-consort')===true, 'the earn survives a re-read of the store');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

