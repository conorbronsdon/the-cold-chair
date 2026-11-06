// legacies-check.js — assertions for v0.51.0 "House Legacies".
// The dynasty ledger starts PAYING OUT: closed reigns earn the House Renown (pure arithmetic on
// S._dynasty — no stored balance), which buys permanent, capped (2 of N) tilts, chosen in the
// interregnum. Every legacy EFFECT is gated on hasLegacy(id); since no plan reaches an interregnum,
// S._legacies is always empty in the suite and every gate is false — so the whole feature is
// byte-identical to before (verified separately by the plan sweep). This drives the interregnum's
// legacy beat directly and checks each tilt in isolation.
// Usage: node tests/legacies-check.js
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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,LEGACIES:LEGACIES,finishSetup:finishSetup,continueAsHeir:continueAsHeir,'
    + 'seatHeir:seatHeir,resolveCard:resolveCard,houseRenown:houseRenown,availRenown:availRenown,hasLegacy:hasLegacy,'
    + 'nextLegacyOffer:nextLegacyOffer,takeLegacy:takeLegacy,creditorGrace:creditorGrace,tickCouncil:tickCouncil,'
    + 'leafData:leafData,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G;
  if(ruler) G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G, annals:sandbox.annals };
}
const ENDURED={ ruler:'Queen X', verdict:'the Steward', years:[30,50], ending:'endured', wyrms:0 };
function ledgerOf(n, extra){ const a=[]; for(let i=0;i<n;i++) a.push({...ENDURED, years:[30+i*20,50+i*20]}); if(extra) a.push(extra); return a; }

/* ============ §1 renown is pure arithmetic on the ledger ============ */
console.log('§1 renown: earned from the closed-reign ledger, never a stored balance');
{
  const {G}=bootstrap(3030830,['Queen','Ren']);
  G.S._dynasty=[];
  ok(G.houseRenown()===0, 'an empty House has no renown');
  G.S._dynasty=[{...ENDURED}];
  ok(G.houseRenown()===2, 'an endured reign is worth 2 ('+G.houseRenown()+')');
  G.S._dynasty=[{...ENDURED, ending:'deposed'}];
  ok(G.houseRenown()===1, 'a lost crown is worth 1');
  G.S._dynasty=[{...ENDURED, wyrms:2}];
  ok(G.houseRenown()===4, 'wyrms slain add on top (2 + 2 wyrms)');
  G.S._dynasty=[{...ENDURED, verdict:'the Dragonlord'}];
  ok(G.houseRenown()===4, 'a legendary verdict adds 2 (endured 2 + legend 2)');
  // available = earned minus committed; taking a legacy spends, never mutating the ledger
  G.S._dynasty=ledgerOf(3);   // 6 renown
  ok(G.availRenown()===6, 'available renown = earned when nothing is committed');
  G.takeLegacy('oldblood');   // cost 4
  ok(G.availRenown()===2 && G.houseRenown()===6, 'taking a legacy spends renown without touching the earned total');
}

/* ============ §2 the offer: the best affordable, unheld legacy, capped at two ============ */
console.log('§2 the offer: one at a time, highest-priority affordable, and never more than two active');
{
  const {G}=bootstrap(3030830,['Queen','Off']);
  G.S._dynasty=ledgerOf(2); G.S._legacies=[];   // 4 renown -> can afford oldblood (4), not longledger (5)
  ok(G.nextLegacyOffer()==='oldblood', 'the cheapest affordable legacy is offered first');
  G.S._dynasty=ledgerOf(5); G.S._legacies=[];   // 10 renown
  ok(G.nextLegacyOffer()==='oldblood', 'priority order holds even when several are affordable');
  G.S._legacies=['oldblood'];
  ok(G.nextLegacyOffer()==='longledger', 'once one is held, the next affordable one is offered');
  G.S._legacies=['oldblood','longledger'];
  ok(G.nextLegacyOffer()===null, 'the cap is two: no third offer, ever');
  G.S._dynasty=ledgerOf(1); G.S._legacies=[];   // 2 renown -> nothing affordable
  ok(G.nextLegacyOffer()===null, 'a poor House is offered nothing');
}

/* ============ §3 the interregnum beat: the offer appears and taking it fixes the legacy ============ */
console.log('§3 the interregnum offers the legacy after the will, and taking it enters it in the blood');
{
  const {G}=bootstrap(3030830,['Queen','Beat']);
  G.S.week=1040;
  // a line with a history and renown to spend: two prior endured reigns (4) + this one (2) = 6
  G.S._dynasty=ledgerOf(2);
  G.S.over='endured'; G.continueAsHeir('endured');
  ok(G.S.pendingCard.id==='ir-quiet-passage', 'the scene opens on the will');
  G.resolveCard(0);   // the tenth to the Concord
  ok(G.S.pendingCard.id==='ir-house-epithet', 'then the House epithet (line has a history)');
  G.resolveCard(0);   // lead with the eldest crown
  ok(G.S.pendingCard && G.S.pendingCard.id==='ir-house-legacy', 'then the House inheritance — a legacy is on offer');
  const before=(G.S._legacies||[]).slice();
  G.resolveCard(0);   // fix it in the blood
  ok(G.S._legacies.length===before.length+1, 'taking it enters a legacy in the blood ('+G.S._legacies.join(',')+')');
  ok(!G.S.interregnum && G.S.over===null, 'and the heir seats after choosing');
  // holding instead leaves the blood unchanged
  const {G:H}=bootstrap(3030830,['Queen','Hold']);
  H.S.week=1040; H.S._dynasty=ledgerOf(2);
  H.S.over='endured'; H.continueAsHeir('endured'); H.resolveCard(0); H.resolveCard(0);
  ok(H.S.pendingCard.id==='ir-house-legacy', 'the offer appears for the holder too');
  H.resolveCard(1);   // hold the renown
  ok((H.S._legacies||[]).length===0 && !H.S.interregnum, 'holding banks the renown and seats unchanged');
}

/* ============ §4 the Old Blood: heirs seat a little more believed ============ */
console.log('§4 the Old Blood: +8 legitimacy at every crowning');
{
  // control: seat with no legacy
  const c=bootstrap(3030830,['Queen','Ctl']).G; c.S.week=1040; c.S.legit=30; c.seatHeir('endured','Heir');
  const base=c.S.legit;
  // with oldblood: same seat, +8
  const w=bootstrap(3030830,['Queen','Old']).G; w.S.week=1040; w.S.legit=30; w.S._legacies=['oldblood']; w.seatHeir('endured','Heir');
  ok(w.S.legit===Math.min(100,base+8), 'the Old Blood seats the heir at +8 legitimacy ('+base+' -> '+w.S.legit+')');
}

/* ============ §5 the Long Ledger: creditors grant twice the grace ============ */
console.log('§5 the Long Ledger: the grace before a debt is called is doubled');
{
  const {G}=bootstrap(3030830,['Queen','Led']);
  ok(G.creditorGrace()===52, 'an ordinary House gets 52 weeks of grace');
  G.S._legacies=['longledger'];
  ok(G.creditorGrace()===104, 'the Long Ledger doubles the grace to 104 weeks');
}

/* ============ §6 the Iron Table: a seat's grudge cools a year ============ */
console.log('§6 the Iron Table: council grudges cool a point each year');
{
  const {G}=bootstrap(3030830,['Queen','Iron']);
  // seat a marshal with a grudge
  G.S.council.marshal.filled=true; G.S.council.marshal.holder={name:'M',house:'X',loyalty:'loyal',since:1,grudge:3,revealed:false};
  G.S.councilCheck=G.S.week+520;   // suppress the flip draw during this check
  G.S._legacies=[];  G.S.week=52; G.tickCouncil();
  ok(G.S.council.marshal.holder.grudge===3, 'without the legacy, a grudge does not cool on its own');
  G.S._legacies=['irontable']; G.S.week=104; G.tickCouncil();
  ok(G.S.council.marshal.holder.grudge===2, 'with the Iron Table, the grudge cools a point at the year’s turn ('+G.S.council.marshal.holder.grudge+')');
}

/* ============ §7 exposure gated + persists across succession ============ */
console.log('§7 legacies surface in state() only once bought, and outlive the crown that bought them');
{
  const {G}=bootstrap(3030830,['Queen','Exp']);
  ok(!('legacies' in G.annals.state()), 'an unadorned House exposes no legacies key (byte-identical state)');
  G.S._legacies=['oldblood'];
  const st=G.annals.state();
  ok(Array.isArray(st.legacies) && st.legacies[0]==='oldblood' && typeof st.renown==='number', 'once bought, the legacy and renown surface');
  // a legacy is a House fact: it survives the reset a succession performs
  G.S.week=1040; G.seatHeir('endured','Heir');
  ok(G.hasLegacy('oldblood'), 'the legacy outlives the crown that bought it (survives seatHeir’s resets)');
  ok(G.leafData().legacies.some(L=>L.id==='oldblood'), 'the leaf carries the House’s legacies for the dynasty legend');
}

/* ============ §8 determinism ============ */
console.log('§8 determinism: the same ledger + same choices fix the same legacy');
{
  function run(){
    const {G}=bootstrap(3030830,['Queen','Det']);
    G.S.week=1040; G.S._dynasty=ledgerOf(2);
    G.S.over='endured'; G.continueAsHeir('endured'); G.resolveCard(0); G.resolveCard(0); G.resolveCard(0);
    return { legacies:(G.S._legacies||[]).join(','), legit:Math.round(G.S.legit), heir:G.S.ruler.name };
  }
  const a=run(), b=run();
  ok(JSON.stringify(a)===JSON.stringify(b), 'two runs land byte-identical ('+JSON.stringify(a)+')');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

