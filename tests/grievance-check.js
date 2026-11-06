// grievance-check.js — assertions for v0.29.0 Faction Grievances (the estates keep score).
// Usage: node tests/grievance-check.js   (run from repo root; reads game.js)
// Covers: the grievance clock accrues on contempt and decays on regard; the two margin tells fire in
// order; a matured grievance past the gate raises the estate's uprising letter; each uprising card's
// teeth and its lingering flag; the river-strike economy cut; and the succession reset. Crown-only,
// no RNG — a reign that keeps its estates above contempt accrues nothing.
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
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,annals:window.annals,'
    + 'tickGrievance:tickGrievance,weeklyEconomy:weeklyEconomy,factionSeason:factionSeason,'
    + 'continueAsHeir:continueAsHeir,seatHeir:seatHeir,GRIEV_STRIKE:GRIEV_STRIKE,GRIEV_GATE:GRIEV_GATE,peekQueue:()=>cardQ.slice()};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}

/* ===================== §1 accrual on contempt, decay on regard ===================== */
console.log('§1 the grievance clock builds on contempt and cools on regard (pure, no RNG)');
{
  const { G }=bootstrap(3030830,['Queen','Score']);
  G.S.week=52;
  G.S.factions.commons.disp=15; G.S.factions.commons.grievance=0;
  G.tickGrievance(); ok(G.S.factions.commons.grievance===2, 'deep contempt (<20) adds +2, got '+G.S.factions.commons.grievance);
  G.S.factions.commons.disp=26; G.tickGrievance(); ok(G.S.factions.commons.grievance===3, 'a slight (<30) adds +1, got '+G.S.factions.commons.grievance);
  G.S.factions.commons.disp=50; G.tickGrievance(); ok(G.S.factions.commons.grievance===1, 'real regard (>=45) subtracts 2, got '+G.S.factions.commons.grievance);
  G.tickGrievance(); ok(G.S.factions.commons.grievance===0 && G.S.factions.commons.grievSeen===0, 'the clock floors at 0 and clears the tell-marks for a fresh episode');
  // a well-treated realm never accrues
  const g2=bootstrap(3030830,['Queen','Warm']).G; g2.S.week=520;
  g2.S.factions.court.disp=55; g2.S.factions.church.disp=60; g2.S.factions.commons.disp=55;
  for(let i=0;i<20;i++) g2.tickGrievance();
  ok(g2.S.factions.court.grievance===0 && g2.S.factions.church.grievance===0 && g2.S.factions.commons.grievance===0,
     'a realm that keeps its estates warm accrues no grievance at all (byte-identical baseline)');
}

/* ===================== §2 foreshadow then strike ===================== */
console.log('§2 two tells precede the strike, and a matured grievance past the gate raises the uprising');
{
  const { G }=bootstrap(3030830,['Queen','Rise']);
  G.S.week=200;                     // before the gate
  G.S.factions.court.disp=10; G.S.factions.court.grievance=9;
  G.tickGrievance();               // clock -> 11, but week<gate: no strike yet
  ok(G.peekQueue().indexOf('court-rising')<0, 'no uprising before the maturity gate even at high grievance');
  ok((G.S.factions.court.grievSeen&1) && (G.S.factions.court.grievSeen&2), 'both tells have fired by grievance 7+');
  G.S.week=G.GRIEV_GATE+13;         // past the gate
  G.tickGrievance();
  ok(G.peekQueue().indexOf('court-rising')>=0, 'a matured grievance past the gate queues the court uprising');
  // v0.30.1 fix: firing the uprising RE-ARMS the tell-marks — since every option resets grievance to
  // 2–6 (never 0), a second uprising must foreshadow again. Both bits are cleared the moment it strikes.
  ok(G.S.factions.court.grievSeen===0, 'the strike re-arms grievSeen, so the next climb re-foreshadows, got '+G.S.factions.court.grievSeen);
  // prove the re-fire: reset grievance to a post-appeasement value and climb — the tells land again
  G.S.factions.court.grievance=3; G.S.factions.court.disp=15;
  G.tickGrievance();  // 3 -> 5 (>=4): first tell re-fires
  ok((G.S.factions.court.grievSeen&1)===1, 'after appeasement the first tell re-arms and re-fires on the climb');
}

/* ===================== §3 each uprising card's teeth + lingering flag ===================== */
console.log('§3 the three uprisings and the overreach card deliver their consequences');
{
  function fire(cardId, opt, prep){ const { G }=bootstrap(3030830,['Queen','Teeth']);
    G.S.week=520; if(prep) prep(G); G.S.pendingCard={id:cardId,c:G.CARDS[cardId]};
    const before={gold:G.S.gold,legit:G.S.legit,piety:G.S.piety}; G.CARDS[cardId].o[opt].f(); G.S.pendingCard=null; return {G,before}; }
  // court-rising: ransom drains gold + warms court; grant sets baronsCharter
  { const { G, before }=fire('court-rising',0,g=>{g.S.gold=2000;g.S.factions.court.disp=15;});
    ok(G.S.gold<before.gold && G.S.factions.court.disp>15, 'court ransom drains gold and warms the Table'); }
  { const { G }=fire('court-rising',2,g=>{g.S.factions.court.disp=15;});
    ok(G.S.flags.baronsCharter===true, 'court "grant the demand" seals the barons’ charter (lingering)'); }
  // church-interdict: defy sets the interdict flag + craters piety
  { const { G, before }=fire('church-interdict',1,g=>{g.S.piety=60;g.S.factions.church.disp=15;});
    ok(G.S.flags.interdict===true, 'church "defy" lays the lingering interdict'); ok(G.S.piety<before.piety, 'defy craters piety'); }
  // commons-strike: wait sets riverStrike; break craters prosperity
  { const { G }=fire('commons-strike',2,g=>{g.S.factions.commons.disp=15;});
    ok(G.S.flags.riverStrike===G.S.week, 'commons "wait it out" shuts the river (riverStrike set)'); }
  { const { G }=fire('commons-strike',1,g=>{g.S.factions.commons.disp=40;g.W.towns.forEach(t=>t.pros=70);});
    ok(G.W.towns.every(t=>t.pros<=64), 'commons "break the strike" craters town prosperity'); ok(G.S.factions.commons.disp<40,'and cools the League further'); }
  // overreach: draft the labour cools the commons
  { const { G }=fire('overreach',2,g=>{g.S.factions.commons.disp=50;});
    ok(G.S.factions.commons.disp<50, 'overreach "draft the labour" cools the commons'); }
}

/* ===================== §4 the river-strike economy cut ===================== */
console.log('§4 while the river is shut, trade and tolls run at half, then the strike lapses');
{
  const { G }=bootstrap(3030830,['Queen','River']);
  G.S.week=520;
  // a real trade economy: several works and warm towns, so the strike's half has something to bite
  G.S.built={mill:4,market:3,roads:2,guildhall:1}; G.W.towns.forEach(t=>{ t.pros=72; }); G.S.tax=22;
  function weekGain(flag){ G.S.flags.riverStrike=flag; const g0=G.S.gold; G.weeklyEconomy(); return G.S.gold-g0; }
  const normal=weekGain(0);
  const strike=weekGain(G.S.week);            // river shut this week
  ok(strike < normal, 'a week under the strike earns less than a normal week ('+strike.toFixed(1)+' < '+normal.toFixed(1)+')');
  const lapsed=weekGain(G.S.week-40);         // strike older than the 39-week window → no cut
  ok(lapsed > strike + 0.01, 'once the strike lapses (>39 wks) income recovers ('+lapsed.toFixed(1)+' > '+strike.toFixed(1)+')');
}

/* ===================== §5 the interdict lifts when the Concord thaws ===================== */
console.log('§5 the lingering interdict bleeds until the Concord warms, then lifts itself');
{
  const { G }=bootstrap(3030830,['Queen','Lift']);
  G.S.week=520; G.S.flags.interdict=true; G.S.factions.church.disp=20; G.S.legit=60;
  const l0=G.S.legit; G.S.week=520; G.factionSeason();     // church cold → bleeds, flag holds
  ok(G.S.flags.interdict===true && G.S.legit<l0, 'a cold-Concord interdict bleeds legitimacy and holds');
  G.S.factions.church.disp=50; G.factionSeason();           // church warm → lifts
  ok(G.S.flags.interdict===false, 'the interdict lifts once the Concord warms past 42');
}

/* ===================== §6 succession wipes the slate; noble mode never accrues ===================== */
console.log('§6 a new crown inherits no estate’s contempt, and a climbing knight accrues none');
{
  const { G }=bootstrap(3030830,['Queen','Heir']);
  G.S.factions.court.grievance=8; G.S.factions.commons.grievance=6; G.S.over='endured';
  G.seatHeir('endured','Heir');
  ok(G.S.factions.court.grievance===0 && G.S.factions.commons.grievance===0, 'succession resets every estate grievance');
  // noble mode: tickGrievance is a no-op
  const n=bootstrap(3030830,['Queen','Knight'],'noble').G; n.S.week=520;
  n.S.factions.commons.disp=10; n.S.factions.commons.grievance=0;
  for(let i=0;i<10;i++) n.tickGrievance();
  ok((n.S.factions.commons.grievance||0)===0, 'a climbing knight’s reign accrues no estate grievance (crown-only system)');
}

/* ===================== §7 the legit-withholding drain (v0.30.0 balance) ===================== */
console.log('§7 a seething estate withholds recognition — a gated legitimacy drain gold cannot pay off');
{
  // disp parked in the 38–45 hold band so accrual/decay leaves the manually-set grievance alone
  function drainOnce(griev, week){ const { G }=bootstrap(3030830,['Queen','Drain']);
    G.S.week=week; G.S.factions.court.disp=40; G.S.factions.court.grievance=griev; G.S.legit=60;
    const l0=G.S.legit; G.tickGrievance(); return l0-G.S.legit; }
  ok(drainOnce(7, 300)===1, 'a seething estate (>=7) past the drain gate bleeds 1 legit/season, got '+drainOnce(7,300));
  ok(drainOnce(10, 300)===3, 'an on-the-brink estate (>=STRIKE) bleeds 3 legit/season, got '+drainOnce(10,300));
  ok(drainOnce(4, 300)===0, 'a merely-restless estate (<7) bleeds nothing');
  ok(drainOnce(10, 100)===0, 'no drain before the drain gate — an establishing crown is spared');
  // the drain stacks across estates but stays bounded and clamped
  const { G }=bootstrap(3030830,['Queen','Stack']); G.S.week=300; G.S.legit=5;
  ['court','church','commons'].forEach(k=>{ G.S.factions[k].disp=40; G.S.factions[k].grievance=10; });
  G.tickGrievance();
  ok(G.S.legit>=0, 'the drain never pushes legitimacy below 0 (clamped), got '+G.S.legit);
}

/* ===================== §8 crisis appeasements scale with wealth (v0.30.1) ===================== */
console.log('§8 a rich realm cannot buy off the estates for pocket change');
{
  function cost(cardId, opt, gold){ const { G }=bootstrap(3030830,['Queen','Rich']);
    G.S.gold=gold; G.S.pendingCard={id:cardId,c:G.CARDS[cardId]}; const b=G.S.gold; G.CARDS[cardId].o[opt].f(); return b-G.S.gold; }
  const chPoor=cost('church-interdict',0,500), chRich=cost('church-interdict',0,10000);
  ok(chRich > chPoor*2, 'the Concord’s amends scale with the treasury (rich '+chRich+' >> poor '+chPoor+')');
  ok(chPoor>=200, 'even a poor realm pays a real floor for the interdict, got '+chPoor);
  const ovPoor=cost('overreach',0,500), ovRich=cost('overreach',0,10000);
  ok(ovRich > ovPoor, 'the overreach staffing bill scales with how much realm was raised (rich '+ovRich+' > poor '+ovPoor+')');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

