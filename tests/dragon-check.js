// dragon-check.js — assertions for v0.31.0 "The Wyrm of the Hoard".
// Usage: node tests/dragon-check.js   (run from repo root; reads game.js)
// Covers: the wyrm is drawn ONLY by a real hoard (a lean/noble/mid-war reign takes no rHist and is
// byte-identical); the ravage's toll; hunting it (slay with a strong host, fail with a thin one);
// each card option's answer; the Wyrmsbane verdict and its survival across succession.
'use strict';
const fs = require('fs');
const path = require('path');
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
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape; sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,annals:window.annals,tickDragon:tickDragon,'
    + 'dragonRavage:dragonRavage,dragonHunt:dragonHunt,reignVerdict:reignVerdict,continueAsHeir:continueAsHeir,seatHeir:seatHeir,'
    + 'dragonKind:dragonKind,dragonName:dragonName,summonWyrm:summonWyrm,maybeReachWyrm:maybeReachWyrm,'
    + 'buildCount:buildCount,hasQ:()=>cardQ.includes("dragon"),clearQ:()=>{const i=cardQ.indexOf("dragon");if(i>=0)cardQ.splice(i,1);}};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}
// fire a dragon card option in isolation
function fire(G, opt){ G.S.pendingCard={id:'dragon',c:G.CARDS['dragon']}; G.CARDS['dragon'].o[opt].f(); G.S.pendingCard=null; }

/* ===================== §1 the wyrm is drawn only by a real hoard ===================== */
console.log('§1 a lean, noble, or mid-war reign never draws the wyrm (no rHist, no strike)');
{
  // lean: below the hoard line → dragonNext stays undefined, nothing queued
  const { G }=bootstrap(3030830,['Queen','Lean']); G.S.week=400; G.S.gold=3000; G.S.opulence=5;
  G.tickDragon(); ok(G.S.dragonNext===undefined && !G.hasQ(), 'gold below the hoard line draws no wyrm');
  // a hoard but no sustained opulence → nothing
  const g2=bootstrap(3030830,['Queen','New']).G; g2.S.week=400; g2.S.gold=12000; g2.S.opulence=1;
  g2.tickDragon(); ok(g2.S.dragonNext===undefined, 'a fat but not-yet-sustained hoard (opulence<2) draws no wyrm');
  // establishing years: gated before wk260
  const g3=bootstrap(3030830,['Queen','Young']).G; g3.S.week=200; g3.S.gold=12000; g3.S.opulence=5;
  g3.tickDragon(); ok(g3.S.dragonNext===undefined, 'no wyrm in the establishing years (before ~yr5)');
  // noble mode: never
  const g4=bootstrap(3030830,['Queen','Knight'],'noble').G; g4.S.week=400; g4.S.gold=12000; g4.S.opulence=5;
  g4.tickDragon(); ok(g4.S.dragonNext===undefined, 'a climbing knight’s hoard draws no crown-wyrm');
  // a qualifying hoard DOES draw the eye (sets dragonNext, foreshadows)
  const g5=bootstrap(3030830,['Queen','Fat']).G; g5.S.week=400; g5.S.gold=12000; g5.S.opulence=5;
  g5.tickDragon(); ok(g5.S.dragonNext!==undefined, 'a sustained fat hoard draws the wyrm’s eye (dragonNext set)');
}

/* ===================== §2 the ravage's toll ===================== */
console.log('§2 the ravage burns the fattest town and carries off a bite of the hoard');
{
  const { G }=bootstrap(3030830,['Queen','Ash']); G.S.gold=8000; G.S.opulence=5; G.S.grain=3000; G.S.legit=60;
  G.W.towns.forEach((t,i)=>{ t.pros=40+i; t.wasSacked=false; });
  const fattest=G.W.towns.reduce((a,b)=>b.pros>a.pros?b:a); const fname=fattest.name;
  const r=G.dragonRavage();
  ok(r.t.name===fname, 'the wyrm falls on the fattest unburned town, got '+r.t.name);
  ok(r.t.wasSacked===true, 'the struck town is scorched (wasSacked → shows on map + leaf)');
  ok(Math.abs(r.took-2000)<=1, 'it carries off a quarter of the hoard (~2000 of 8000), got '+r.took);
  ok(G.S.gold===6000, 'the treasury is lighter by the wyrm’s bite');
  ok(G.S.opulence===3, 'the hoard (opulence) drops, so the eye may wander, got '+G.S.opulence);
  ok(G.S.legit<60, 'a realm that could not shield its people loses legitimacy');
}

/* ===================== §3 hunting the wyrm ===================== */
console.log('§3 a strong host slays the wyrm; a thin one only feeds it');
{
  // strong: high muster + a bulwark → slain, hoard recovered, a defining moment
  const { G }=bootstrap(3030830,['Queen','Bane']); G.S.levies=3200; G.S.built={bulwark:1}; G.S.gold=2000; G.S.legit=60;
  G.S.dragon={ord:1,kind:'ember',name:'Testwyrm the Ember-Wing'};
  const g0=G.S.gold; G.dragonHunt();
  ok((G.S.dragonsSlain||0)===1, 'a strong host slays the wyrm (kill counted)');
  ok(G.S.dragon===null, 'the slain wyrm is cleared, so the hoard may draw the next');
  ok(G.S.gold>g0, 'the wyrm’s lair-gold comes home ('+g0+'→'+G.S.gold+')');
  ok(G.S.legit>60, 'the slaying lifts legitimacy — the reign’s legend');
  // thin: few levies, no walls → not slain, men lost, it circles back
  const g2=bootstrap(3030830,['Queen','Fed']).G; g2.S.levies=700; g2.S.built={}; g2.S.legit=60; g2.S.week=500;
  g2.S.dragon={ord:1,kind:'ember',name:'Testwyrm'};
  const lev0=g2.S.levies; g2.dragonHunt();
  ok((g2.S.dragonsSlain||0)===0, 'a thin host does not slay the wyrm');
  ok(g2.S.levies<lev0, 'the failed hunt costs men, got '+g2.S.levies+' from '+lev0);
  ok(g2.S.dragonNext===g2.S.week+104, 'the wyrm withdraws and will circle back');
}

/* ===================== §4 the card's other answers ===================== */
console.log('§4 feed / bind-the-hoard / endure each shape the aftermath');
{
  // bind the hoard: empties gold to ~500, opulence to 0 → the wyrm loses its reason
  const { G }=bootstrap(3030830,['Queen','Bind']); G.S.gold=12000; G.S.opulence=6; G.S.legit=50;
  G.W.towns.forEach(t=>{ t.pros=60; t.wasSacked=false; });
  fire(G,2);
  ok(G.S.gold<=500, 'binding the hoard empties the vaults (gold '+G.S.gold+' <= 500)');
  ok(G.S.opulence===0, 'and drops opulence to 0 — no hoard left to call a wyrm');
  ok(G.S.factions.commons.disp>50, 'the counties love a Crown that spends its hoard on them');
  // feed it: pays a tribute and buys grace
  const g2=bootstrap(3030830,['Queen','Feed']).G; g2.S.gold=10000; g2.S.opulence=5; g2.S.week=400;
  g2.W.towns.forEach(t=>{ t.pros=60; t.wasSacked=false; });
  fire(g2,1);
  ok(g2.S.gold<10000, 'feeding the wyrm costs a tribute of gold');
  ok(g2.S.dragonNext===g2.S.week+156, 'the tribute buys a stretch of grace');
  // endure: shelters the people (commons up, no extra gold spent beyond the ravage)
  const g3=bootstrap(3030830,['Queen','Endure']).G; g3.S.gold=8000; g3.S.opulence=4; g3.S.legit=50;
  g3.W.towns.forEach(t=>{ t.pros=60; t.wasSacked=false; });
  const before=g3.S.factions.commons.disp; fire(g3,3);
  ok(g3.S.factions.commons.disp>before, 'enduring beside the people warms the commons');
}

/* ===================== §5 the escalating verdict, and a fresh saga each reign ===================== */
console.log('§5 one kill names the Wyrmsbane, two the Dragonlord — and the heir earns its own');
{
  const { G }=bootstrap(3030830,['Queen','Legend']); G.S.over='endured'; G.S.legit=60; G.S.piety=50; G.S.gold=1000;
  G.S.monk.gilded=0; G.S.built={mill:1}; G.W.towns.forEach(t=>{ t.pros=50; t.pop=800; t.wasSacked=false; });
  G.S.dragonsSlain=1;
  ok(G.reignVerdict()==='the Wyrmsbane', 'one slain wyrm → "the Wyrmsbane", got '+G.reignVerdict());
  G.S.dragonsSlain=2;
  ok(G.reignVerdict()==='the Dragonlord', 'two or more → "the Dragonlord", got '+G.reignVerdict());
  G.seatHeir('endured','Heir');
  ok((G.S.dragonsSlain||0)===0, 'the heir starts its own dragon-saga (kill count resets)');
  ok(G.S.dragon===null && G.S.dragonNext===undefined, 'no wyrm carries over; the heir’s hoard draws fresh ones');
}

/* ===================== §6 the seeded bestiary ===================== */
console.log('§6 a realm carries a fixed, seed-determined roster of named wyrms of distinct kinds');
{
  const { G }=bootstrap(3030830,['Queen','Bestiary']);
  const k1=G.dragonKind(1), n1=G.dragonName(1,k1);
  ok(typeof n1==='string' && n1.length>3, 'a wyrm is named, got '+n1);
  ok(G.dragonName(1,k1)===n1 && G.dragonKind(1)===k1, 'the roster is deterministic (pure of the seed — no RNG)');
  ok(['ember','rime'].includes(k1) || k1==='brine', 'each wyrm has a valid kind, got '+k1);
  // brine (a sea-serpent) only stalks a coastal realm
  ok(G.W.shape!=='coastal' ? [1,2,3,4,5].every(o=>G.dragonKind(o)!=='brine') : true,
     'no brine-serpent on a landlocked realm ('+G.W.shape+')');
  // the rime frost blights grain and prosperity where the ember burns gold
  const g2=bootstrap(3030830,['Queen','Rime']).G; g2.S.gold=8000; g2.S.grain=3000; g2.S.opulence=5;
  g2.W.towns.forEach(t=>{ t.pros=60; t.wasSacked=false; });
  g2.S.dragon={ord:1,kind:'rime',name:'Frostwyrm'}; const grain0=g2.S.grain, piety0=g2.S.piety=60;
  g2.dragonRavage();
  ok(grain0-g2.S.grain >= 1000, 'a rime-drake’s frost is a grain catastrophe, lost '+(grain0-g2.S.grain));
  ok(g2.S.piety<piety0, 'the frost reads as an ill omen — piety falls');
  // a brine-serpent coils the harbour shut (river-strike) — force a coastal realm
  const g3=bootstrap(7777,['Queen','Brine']).G; g3.S.gold=8000; g3.S.opulence=5;
  g3.W.towns.forEach(t=>{ t.wasSacked=false; });
  g3.S.dragon={ord:1,kind:'brine',name:'Leviathan'};
  g3.dragonRavage();
  ok(g3.S.flags.riverStrike===g3.S.week, 'a brine-serpent coils the harbour shut (trade halved via riverStrike)');
}

/* ===================== §7 the other two paths: the expedition wyrm, and the Reach ===================== */
console.log('§7 an expedition can wake a wyrm (no hoard needed), and an unkilled wyrm may take the Reach');
{
  // ex-wyrmisle "keep the wreck-gold" — summons a wyrm even for a hoardless realm, and fattens the target
  const { G }=bootstrap(3030830,['Queen','Isle']); G.S.week=400; G.S.gold=1000; G.S.opulence=0;
  const g0=G.S.gold, op0=G.S.opulence||0;
  G.S.pendingCard={id:'ex-wyrmisle',c:G.CARDS['ex-wyrmisle']}; G.CARDS['ex-wyrmisle'].o[1].f(); G.S.pendingCard=null;
  ok(!!G.S.dragon, 'the expedition wakes a wyrm even without a hoard (a second path to dragons)');
  ok(G.S.gold>g0 && (G.S.opulence||0)>op0, 'taking the wreck-gold fattens the realm into a bigger target');
  // "sound the alarm" also summons, but takes no gold
  const g2=bootstrap(3030830,['Queen','Alarm']).G; g2.S.week=400;
  g2.S.pendingCard={id:'ex-wyrmisle',c:g2.CARDS['ex-wyrmisle']}; g2.CARDS['ex-wyrmisle'].o[0].f();
  ok(!!g2.S.dragon, 'sounding the alarm still summons the woken wyrm');

  // maybeReachWyrm: once per reign, resets the muster (the Reach is broken), queues the reach-wyrm letter
  const g3=bootstrap(3030830,['Queen','Reach']).G; g3.S.week=600; g3.S.threats.muster.clock=1;
  let fired=false; for(let i=0;i<40 && !fired;i++){ g3.S.flags.reachWyrmDone=undefined; g3.S.dragon={ord:1,kind:'ember',name:'x'}; fired=g3.maybeReachWyrm(); }
  ok(fired, 'an unkilled wyrm sometimes leaves for the Reach');
  ok(g3.S.threats.muster.clock===g3.S.threats.muster.max, 'the Reach’s muster is scattered — the border goes quiet');
  ok(g3.S.dragon===null, 'the wyrm is gone (the Reach’s problem now)');
  // once per reign
  const before=g3.S.flags.reachWyrmDone; g3.S.dragon={ord:2,kind:'ember',name:'y'};
  const again=g3.maybeReachWyrm();
  ok(!again && g3.S.flags.reachWyrmDone===before, 'the Reach falls to a wyrm at most once a reign');

  // reach-wyrm answers: feeding the refugees warms the old enemy; seizing the forts cools it
  const g4=bootstrap(3030830,['Queen','Feed']).G; g4.S.grain=3000; const w0=g4.S.factions.world.disp;
  g4.S.pendingCard={id:'reach-wyrm',c:g4.CARDS['reach-wyrm']}; g4.CARDS['reach-wyrm'].o[0].f();
  ok(g4.S.factions.world.disp>w0, 'feeding the Reach’s refugees warms the old enemy');
  const g5=bootstrap(3030830,['Queen','Seize']).G; const w5=g5.S.factions.world.disp;
  g5.S.pendingCard={id:'reach-wyrm',c:g5.CARDS['reach-wyrm']}; g5.CARDS['reach-wyrm'].o[1].f();
  ok(g5.S.factions.world.disp<w5, 'seizing the border forts while it burns cools the Reach further');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

