// consequences-check.js — assertions for v0.56.0 "The Great Deck, wave 1: the Consequences".
// State-aware re-reads that call back to an earlier choice: the Bastard's Banner (a denied bastard
// returns), the Sealed Door (a sealed Delve is knocked on), the Creditor's Heir (a repudiated debt's
// note has an heir). Each is ARMED only by a specific NON-default option (bastardDenied / delveSealed /
// repudiated); the auto-0 plans pick option 0, so none of these ever fire in the suite — the deck grows
// with zero rebaseline (the plan sweep proves 0/28). This drives each trigger + resolves each card.
// Usage: node tests/consequences-check.js
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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,maybeFire:maybeFire,showCard:showCard,'
    + 'resolveCard:resolveCard,peekQueue:()=>cardQ.slice(),annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G };
}
// arm a flag + jump the clock, then fire the deck and return the id that showed (if any)
function fireWith(G, setup){
  G.S.pendingCard=null; setup(G.S);
  G.maybeFire();
  return G.S.pendingCard && G.S.pendingCard.id;
}

/* ============ §1 the three consequences arm, fire on delay, and resolve ============ */
console.log('§1 each consequence arms on its trigger flag, fires after its delay, and resolves cleanly');
{
  // the Bastard's Banner — armed by denying the bastard, fires ~5 years on in a shaky reign
  const {G}=bootstrap(3030830,['Queen','Deny']);
  ok(fireWith(G, S=>{ S.week=800; S.legit=40; S.flags.bastardDenied=100; })==='the-bastards-banner',
     'a denied bastard returns years later, when the reign is shaky');
  ok(G.CARDS['the-bastards-banner'].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), 'its options are static strings');
  G.resolveCard(1);   // meet him in the field
  ok(G.S.over===null && !G.S.flags.bastardDenied, 'resolving the banner disarms it and does not end the reign');

  // the Sealed Door — armed by sealing the Delve, fires ~4 years on
  const {G:D}=bootstrap(3030830,['Queen','Seal']);
  ok(fireWith(D, S=>{ S.week=600; S.flags.delveSealed=100; })==='the-sealed-door', 'a sealed Delve is knocked on years later');
  D.resolveCard(1);   // open and treat
  ok(D.S.flags.mining===true && !D.S.flags.delveSealed, 'reopening the door restores the mining and disarms the knock');

  // the Creditor's Heir — armed by repudiating a called debt, fires ~4 years on
  const {G:C}=bootstrap(3030830,['Queen','Repud']);
  ok(fireWith(C, S=>{ S.week=600; S.flags.repudiated=100; S.flags.repudiatedKind='loan'; })==='the-creditors-heir',
     'a repudiated note has an heir who returns');
  C.resolveCard(0);   // settle
  ok(!C.S.flags.repudiated, 'settling with the heir disarms the grudge');
}

/* ============ §2 none fire without their trigger, or before their delay, or twice ============ */
console.log('§2 gating: no trigger flag, no letter; too soon, no letter; once seen, never again');
{
  const {G}=bootstrap(3030830,['Queen','Cold']);
  // no flags at all → none of the three fire
  ok(fireWith(G, S=>{ S.week=900; S.legit=30; })===null || !['the-bastards-banner','the-sealed-door','the-creditors-heir'].includes(G.S.pendingCard.id),
     'an untriggered reign never sees a consequence (this is why the plans stay byte-identical)');
  // armed but too soon
  ok(fireWith(G, S=>{ S.pendingCard=null; S.flags.delveSealed=800; S.week=900; })!=='the-sealed-door', 'the knock waits out its delay');
  // a "keep it alive" option re-arms it; it returns after the delay, not the same week
  const {G:H}=bootstrap(3030830,['Queen','Recur']);
  ok(fireWith(H, S=>{ S.week=600; S.flags.delveSealed=100; })==='the-sealed-door', 'it fires');
  H.resolveCard(0);   // reinforce → re-arms delveSealed=600
  H.S.pendingCard=null; H.maybeFire();
  ok(H.S.pendingCard===null || H.S.pendingCard.id!=='the-sealed-door', 'it does NOT re-fire the same week (the delay holds)');
  H.S.pendingCard=null; H.S.week=600+210; H.maybeFire();   // past the re-arm delay + the re: cooldown
  ok(H.S.pendingCard && H.S.pendingCard.id==='the-sealed-door', 'but the reinforced seal is knocked on again once the delay is out (recurrence)');
  // a resolving option ends it for good
  const {G:E}=bootstrap(3030830,['Queen','Ended']);
  fireWith(E, S=>{ S.week=600; S.flags.delveSealed=100; });
  E.resolveCard(2);   // wall off the west → disarms (delveSealed=0)
  E.S.pendingCard=null; E.S.week=600+400; E.maybeFire();
  ok(E.S.pendingCard===null || E.S.pendingCard.id!=='the-sealed-door', 'a world walled off for good is never knocked on again');
}

/* ============ §3 a bastard met with a strong host is broken; a weak host loses ground ============ */
console.log('§3 the Bastard’s Banner resolves on the muster mirror — strength decides');
{
  const {G}=bootstrap(3030830,['Queen','Strong']);
  fireWith(G, S=>{ S.week=800; S.legit=45; S.flags.bastardDenied=100; });
  G.S.levies=6000; G.S.factions.court.disp=80; G.W.towns.forEach(t=>t.pros=80);   // a strong crown
  const legit0=G.S.legit; G.resolveCard(1);
  ok(G.S.legit>legit0, 'a strong crown breaks the returned bastard and gains legitimacy');
  const {G:W2}=bootstrap(3030830,['Queen','Weak']);
  fireWith(W2, S=>{ S.week=800; S.legit=30; S.flags.bastardDenied=100; });
  W2.S.levies=500; W2.S.factions.court.disp=8; W2.W.towns.forEach(t=>t.pros=6);   // a weak crown
  const l0=W2.S.legit; W2.resolveCard(1);
  ok(W2.S.legit<l0, 'a weak crown that gives battle to the bastard loses legitimacy and ground');
}

/* ============ §4 batch 2 (v0.62.0): the ward home, the licensed tooth, the unnamed cup ============ */
console.log('§4 batch 2: each arms on its non-default flag, fires after its delay, and resolves');
{
  // the Ward Come Home — armed by sending a ward north and taking none, fires ~5 years on
  const {G}=bootstrap(3030830,['Queen','Ward']);
  ok(fireWith(G, S=>{ S.week=600; S.flags.wardGiven=100; })==='the-ward-returns', 'a ward given away abroad comes home years later');
  ok(G.CARDS['the-ward-returns'].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), 'the ward’s options are static strings');
  G.resolveCard(0);   // give them a place + watchers
  ok(G.S.over===null && !G.S.flags.wardGiven, 'welcoming the ward disarms it and does not end the reign');

  // the Licensed Tooth — armed by licensing the false relic, fires ~4.5 years on
  const {G:T}=bootstrap(3030830,['Queen','Tooth']);
  ok(fireWith(T, S=>{ S.week=600; S.flags.relicLicensed=100; })==='the-licensed-tooth', 'a licensed fraud comes due years later');
  const piety0=T.S.piety; T.resolveCard(0);   // burn the shrine
  ok(!T.S.flags.relicLicensed && T.S.piety>=piety0, 'burning the shrine disarms it and restores a little faith');

  // the Unnamed Cup — armed by naming no poisoner, fires ~4.5 years on, and RECURS if the silence is kept
  const {G:C}=bootstrap(3030830,['Queen','Cup']);
  ok(fireWith(C, S=>{ S.week=600; S.flags.poisonerUnnamed=100; })==='the-unnamed-cup', 'the poisoner the Crown never named returns');
  C.resolveCard(1);   // keep the silence → re-arms poisonerUnnamed=600
  ok(C.S.flags.poisonerUnnamed===600, 'keeping the silence re-arms the cup for another return');
  C.S.pendingCard=null; C.maybeFire();
  ok(C.S.pendingCard===null || C.S.pendingCard.id!=='the-unnamed-cup', 'it does not re-fire the same week (delay + cooldown hold)');
  C.S.pendingCard=null; C.S.week=600+270; C.maybeFire();
  ok(C.S.pendingCard && C.S.pendingCard.id==='the-unnamed-cup', 'but the kept silence brings the cup back once the delay is out (recurrence)');
  C.resolveCard(0);   // name them at last → settles
  ok(!C.S.flags.poisonerUnnamed, 'finally naming the poisoner ends the cup for good');

  // every option of every batch-2 card must leave its flag settled (=0), EXCEPT the cup's opt1 (re-arm).
  // This is the real guard: the cup has NO seenCards gate, so a non-zeroing option would loop forever.
  ['the-ward-returns','the-licensed-tooth','the-unnamed-cup'].forEach(id=>{
    const c=bootstrap(3030830,['Queen','Opt']).G;
    ok(c.CARDS[id].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), id+': all options are static strings');
  });
  [['the-ward-returns','wardGiven',260],['the-licensed-tooth','relicLicensed',234]].forEach(([id,flag,delay])=>{
    const c=bootstrap(3030830,['Queen','All']).G;
    c.CARDS[id].o.forEach((_,i)=>{
      c.S.pendingCard=null; c.S.seenCards={}; c.S.flags[flag]=100; c.S.week=100+delay+40; c.maybeFire();
      if(c.S.pendingCard && c.S.pendingCard.id===id){ c.resolveCard(i);
        ok(!c.S.flags[flag], id+' opt'+i+' settles the flag (once-per-reign, never loops)'); }
    });
  });
  // the cup: opt0 and opt2 settle; opt1 re-arms (the only option that keeps it alive)
  [[0,false],[1,true],[2,false]].forEach(([i,rearm])=>{
    const c=bootstrap(3030830,['Queen','Cup'+i]).G;
    c.S.pendingCard=null; c.S.flags.poisonerUnnamed=100; c.S.week=500; c.maybeFire();
    if(c.S.pendingCard && c.S.pendingCard.id==='the-unnamed-cup'){ c.resolveCard(i);
      ok(rearm ? c.S.flags.poisonerUnnamed===500 : !c.S.flags.poisonerUnnamed,
         'the cup opt'+i+(rearm?' re-arms (keeps the silence)':' settles the flag')); }
  });
}

/* ============ §5 batch 3 (v0.63.0): the saint unmade, the church at the fords, the town refused ======== */
console.log('§5 batch 3: each arms on its non-default flag, fires after its delay, and resolves');
{
  // the Saint Unmade — armed by seizing the royal saint's shrine, fires ~5 years on
  const {G}=bootstrap(3030830,['Queen','Saint']);
  ok(fireWith(G, S=>{ S.week=600; S.flags.saintSeized=100; })==='the-saint-unmade', 'a saint the Crown seized is un-made by the Concord years later');
  G.resolveCard(1);   // defy them
  ok(G.S.over===null && !G.S.flags.saintSeized, 'defying the Concord disarms it and does not end the reign');

  // the Church at the Fords — armed by leaving the fords alone, fires ~4.5 years on, RECURS if crushed
  const {G:F}=bootstrap(3030830,['Queen','Fords']);
  ok(fireWith(F, S=>{ S.week=600; S.flags.fordsLeft=100; })==='the-fords-church', 'a faith left to the fords becomes a church years later');
  F.resolveCard(1);   // let the Concord crush it → re-arms (martyrs regrow it)
  ok(F.S.flags.fordsLeft===600, 'crushing the poor-church re-arms it (it grows back from its graves)');
  F.S.pendingCard=null; F.S.week=600+270; F.maybeFire();
  ok(F.S.pendingCard && F.S.pendingCard.id==='the-fords-church', 'the crushed church returns once the delay is out (recurrence)');
  F.resolveCard(0);   // recognize it → settles
  ok(!F.S.flags.fordsLeft, 'recognizing the church ends the matter for good');

  // the Town the Crown Refused — armed by turning the caravan away, fires ~5.5 years on
  const {G:T}=bootstrap(3030830,['Queen','Town']);
  ok(fireWith(T, S=>{ S.week=700; S.flags.caravanTurned=100; })==='the-town-refused', 'a refused caravan builds a free town that returns years later');
  T.resolveCard(0);   // treat with it
  ok(!T.S.flags.caravanTurned, 'treating with the free town disarms it');

  // every option of every batch-3 card leaves its flag settled (=0), except the fords opt1 (re-arm).
  ['the-saint-unmade','the-fords-church','the-town-refused'].forEach(id=>{
    const c=bootstrap(3030830,['Queen','B3']).G;
    ok(c.CARDS[id].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), id+': all options are static strings');
  });
  [['the-saint-unmade','saintSeized',260],['the-town-refused','caravanTurned',286]].forEach(([id,flag,delay])=>{
    const c=bootstrap(3030830,['Queen','B3o']).G;
    c.CARDS[id].o.forEach((_,i)=>{
      c.S.pendingCard=null; c.S.seenCards={}; c.S.flags[flag]=100; c.S.week=100+delay+40; c.maybeFire();
      if(c.S.pendingCard && c.S.pendingCard.id===id){ c.resolveCard(i);
        ok(!c.S.flags[flag], id+' opt'+i+' settles the flag (once-per-reign, never loops)'); }
    });
  });
  [[0,false],[1,true],[2,false]].forEach(([i,rearm])=>{   // the fords: opt1 re-arms, opt0/opt2 settle
    const c=bootstrap(3030830,['Queen','Ford'+i]).G;
    c.S.pendingCard=null; c.S.flags.fordsLeft=100; c.S.week=500; c.maybeFire();
    if(c.S.pendingCard && c.S.pendingCard.id==='the-fords-church'){ c.resolveCard(i);
      ok(rearm ? c.S.flags.fordsLeft===500 : !c.S.flags.fordsLeft,
         'the fords opt'+i+(rearm?' re-arms (crushed, regrows)':' settles the flag')); }
  });
}

/* ============ §6 batch 4 (v0.64.0): the staple-league, the river-combination, the marshal's table ===== */
console.log('§6 batch 4: each arms on its non-default flag, fires after its delay, and resolves');
{
  // the League of the Staple — armed by seizing the wool-staple, fires ~5 years on
  const {G}=bootstrap(3030830,['Queen','Staple']);
  ok(fireWith(G, S=>{ S.week=600; S.flags.stapleSeized=100; })==='the-staple-league', 'two towns whose staple the Crown seized federate against it years later');
  G.resolveCard(1);   // charter the league
  ok(G.S.over===null && !G.S.flags.stapleSeized, 'chartering the league disarms it and does not end the reign');

  // the River Remembers — armed by breaking the strike, fires ~4.5 years on, RECURS if broken again
  const {G:R}=bootstrap(3030830,['Queen','River']);
  ok(fireWith(R, S=>{ S.week=600; S.flags.strikeBroken=100; })==='the-river-remembers', 'bargemen broken at pike-point build a combination that returns');
  R.resolveCard(1);   // break them again → re-arms (goes deeper)
  ok(R.S.flags.strikeBroken===600, 'forcing the river a second time re-arms it (it goes underground and returns)');
  R.S.pendingCard=null; R.S.week=600+270; R.maybeFire();
  ok(R.S.pendingCard && R.S.pendingCard.id==='the-river-remembers', 'the twice-broken combination surfaces again once the delay is out (recurrence)');
  R.resolveCard(0);   // grant a charter → settles
  ok(!R.S.flags.strikeBroken, 'a charter of river-rights ends the matter for good');

  // the Old Marshal's Table — armed by promoting over his head, fires ~5 years on
  const {G:M}=bootstrap(3030830,['Queen','Marshal']);
  ok(fireWith(M, S=>{ S.week=600; S.flags.marshalPassed=100; })==='the-old-marshals-table', 'a passed-over marshal’s grievance becomes a court faction years later');
  M.resolveCard(0);   // bring him back to honor
  ok(!M.S.flags.marshalPassed, 'reconciling the old marshal disarms it');

  // every option settles the flag (=0), except the river opt1 (re-arm)
  ['the-staple-league','the-river-remembers','the-old-marshals-table'].forEach(id=>{
    const c=bootstrap(3030830,['Queen','B4']).G;
    ok(c.CARDS[id].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), id+': all options are static strings');
  });
  [['the-staple-league','stapleSeized',260],['the-old-marshals-table','marshalPassed',260]].forEach(([id,flag,delay])=>{
    const c=bootstrap(3030830,['Queen','B4o']).G;
    c.CARDS[id].o.forEach((_,i)=>{
      c.S.pendingCard=null; c.S.seenCards={}; c.S.flags[flag]=100; c.S.week=100+delay+40; c.maybeFire();
      if(c.S.pendingCard && c.S.pendingCard.id===id){ c.resolveCard(i);
        ok(!c.S.flags[flag], id+' opt'+i+' settles the flag (once-per-reign, never loops)'); }
    });
  });
  [[0,false],[1,true],[2,false]].forEach(([i,rearm])=>{   // the river: opt1 re-arms, opt0/opt2 settle
    const c=bootstrap(3030830,['Queen','Rvr'+i]).G;
    c.S.pendingCard=null; c.S.flags.strikeBroken=100; c.S.week=500; c.maybeFire();
    if(c.S.pendingCard && c.S.pendingCard.id==='the-river-remembers'){ c.resolveCard(i);
      ok(rearm ? c.S.flags.strikeBroken===500 : !c.S.flags.strikeBroken,
         'the river opt'+i+(rearm?' re-arms (broken again, goes deeper)':' settles the flag')); }
  });
}

/* ============ §7 batch 5 (v0.65.0): the buried note, the vindicated prophet ============ */
console.log('§7 batch 5: the buried note (recurs) and the vindicated prophet (gated on the realm’s turned luck)');
{
  // the Note That Was Burned — armed by burning the smuggling-note, fires ~4.5 years on, RECURS if buried again
  const {G}=bootstrap(3030830,['Queen','Note']);
  ok(fireWith(G, S=>{ S.week=600; S.flags.noteBuried=100; })==='the-buried-note', 'ignored smuggling grows into a shadow-customs that returns');
  ok(G.CARDS['the-buried-note'].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), 'the buried-note options are static strings');
  G.resolveCard(2);   // burn this copy too → re-arms
  ok(G.S.flags.noteBuried===600, 'burning the second copy re-arms it (a Crown that keeps not-looking)');
  G.S.pendingCard=null; G.S.week=600+270; G.maybeFire();
  ok(G.S.pendingCard && G.S.pendingCard.id==='the-buried-note', 'the buried traffic surfaces again once the delay is out (recurrence)');
  G.resolveCard(0);   // seize the network → settles
  ok(!G.S.flags.noteBuried, 'seizing the network ends it for good');
  // every option settles, except opt2 (re-arm)
  [[0,false],[1,false],[2,true]].forEach(([i,rearm])=>{
    const c=bootstrap(3030830,['Queen','Nt'+i]).G;
    c.S.pendingCard=null; c.S.flags.noteBuried=100; c.S.week=500; c.maybeFire();
    if(c.S.pendingCard && c.S.pendingCard.id==='the-buried-note'){ c.resolveCard(i);
      ok(rearm ? c.S.flags.noteBuried===500 : !c.S.flags.noteBuried, 'the note opt'+i+(rearm?' re-arms':' settles')); }
  });

  // the Prophet Was Right — armed by arresting the prophet, fires ~5 years on ONLY when legit has fallen <45
  const {G:P}=bootstrap(3030830,['Queen','Proph']);
  ok(fireWith(P, S=>{ S.week=600; S.flags.prophetJailed=100; S.legit=30; })==='the-vindicated-prophet',
     'a jailed prophet returns vindicated once the realm’s luck has turned (legit<45)');
  ok(P.CARDS['the-vindicated-prophet'].o.every(o=>typeof o.l==='string' && typeof o.s==='string'), 'the prophet options are static strings');
  // the gate: in a THRIVING reign (legit high) the prophet was simply wrong — no vindication letter
  const {G:P2}=bootstrap(3030830,['Queen','Thrive']);
  const fired=fireWith(P2, S=>{ S.week=600; S.flags.prophetJailed=100; S.legit=70; });
  ok(fired!=='the-vindicated-prophet', 'a thriving reign never sees the prophet vindicated (his warning did not come true)');
  // resolve every option → flag settles
  P.CARDS['the-vindicated-prophet'].o.forEach((_,i)=>{
    const c=bootstrap(3030830,['Queen','Pr'+i]).G;
    c.S.pendingCard=null; c.S.seenCards={}; c.S.flags.prophetJailed=100; c.S.legit=30; c.S.week=100+260+40; c.maybeFire();
    if(c.S.pendingCard && c.S.pendingCard.id==='the-vindicated-prophet'){ c.resolveCard(i);
      ok(!c.S.flags.prophetJailed, 'the prophet opt'+i+' settles the flag (once-per-reign, never loops)'); }
  });
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

