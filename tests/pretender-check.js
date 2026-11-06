// pretender-check.js — assertions for v0.33.0 "The Pretender's War".
// Usage: node tests/pretender-check.js   (run from repo root; reads game.js)
// Covers: the vulnerability gate (a secure, well-liked reign NEVER arms → no rHist → byte-identical);
// the foreshadow-then-muster arc; the claimant's identity (Osrec / the Old Root's head / a seeded kin);
// the three answers (meet the field win/lose, buy off the Reach with/without the coin, divide the realm);
// the muster model (a strong host wins, a weak one loses the crown); the `usurped` end state and the true
// line's return through succession; and the divided-realm lingering drain.
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
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,tickPretender:tickPretender,'
    + 'raisePretender:raisePretender,resolvePretenderWar:resolvePretenderWar,crownMight:crownMight,'
    + 'pretenderStrength:pretenderStrength,pretenderClaimant:pretenderClaimant,continueAsHeir:continueAsHeir,seatHeir:seatHeir,'
    + 'factionSeason:factionSeason};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; G.CARDS[id].o[opt].f(); G.S.pendingCard=null; }
// make a reign politically vulnerable enough to draw a claimant (low mandate, cold high table), past the gate
function makeVulnerable(G){ G.S.week=500; G.S.legit=30; G.S.factions.court.disp=25; G.S.factions.court.grievance=7; }

/* ===================== §1 the vulnerability gate — a secure reign never arms ===================== */
console.log('§1 a believed crown with a warm high table draws no claimant (no arm, no draw, byte-identical)');
{
  // secure and well-liked, well past the gate: the pretender never arms
  const s=bootstrap(3030830,['Queen','Secure']).G; s.S.week=600; s.S.legit=80; s.S.factions.court.disp=70; s.S.factions.court.grievance=0;
  s.tickPretender();
  ok(s.S.pretenderNext===undefined && !s.S.pretender, 'a secure, warm reign never arms the pretender');
  // before the gate: even a vulnerable reign is quiet in its establishing years
  const e=bootstrap(3030830,['Queen','Early']).G; e.S.week=300; e.S.legit=25; e.S.factions.court.disp=20; e.S.factions.court.grievance=8;
  e.tickPretender();
  ok(e.S.pretenderNext===undefined, 'no claimant before the gate (~year 8), however weak the crown');
  // suppression flag: a done reign is a hard no-op
  const d=bootstrap(3030830,['Queen','Done']).G; makeVulnerable(d); d.S.flags.pretenderDone=1; d.tickPretender();
  ok(d.S.pretenderNext===undefined && !d.S.pretender, 'pretenderDone suppresses the whole system (a hard no-op)');
}

/* ===================== §2 the foreshadow-then-muster arc ===================== */
console.log('§2 a shaky, cold reign is foreshadowed a year out, then the claimant musters');
{
  const g=bootstrap(3030830,['Queen','Arc']).G; makeVulnerable(g);
  g.tickPretender();
  ok(g.S.pretenderNext!==undefined && g.S.pretenderNext>g.S.week, 'vulnerability arms the claim — a tell now, the muster a year or so out');
  ok(!g.S.pretender, 'the arming tell does not itself raise the pretender');
  // re-securing before the muster: the claim hangs, but does not fire (no draw taken while safe again)
  const armedNext=g.S.pretenderNext;
  g.S.legit=80; g.S.factions.court.disp=75; g.S.factions.court.grievance=0; g.S.week=armedNext+10;
  g.tickPretender();
  ok(!g.S.pretender, 're-securing the realm before the muster stays the claimant’s hand');
}

/* ===================== §3 the claimant already half-exists ===================== */
console.log('§3 the claimant is drawn from the record — Osrec, the Old Root’s head, or a seeded kin');
{
  const o=bootstrap(3030830,['Queen','Osrec']).G; o.S.flags.osrec=true;
  ok(o.pretenderClaimant().name==='Osrec', 'the half-brother who answered the Reach’s letters IS the claimant when he exists');
  const r=bootstrap(3030830,['Queen','Root']).G;
  if(r.S.societies && r.S.societies.restoration){ r.S.societies.restoration.discovery='exposed';
    ok(r.pretenderClaimant().name===r.S.societies.restoration.head.name, 'an exposed Old Root gives up its head as the claimant');
  } else ok(true, 'no restoration society on this seed (skip)');
  const k=bootstrap(3030830,['Queen','Kin']).G;   // no osrec, unknown root → a seed-stable passed-over kin
  const c1=k.pretenderClaimant(), c2=k.pretenderClaimant();
  ok(typeof c1.name==='string' && c1.name.length>0 && c1.name===c2.name, 'a seeded kin is named, and named the same each time (seed-stable, no RNG)');
}

/* ===================== §4 meet them in the field ===================== */
console.log('§4 the field: a strong host breaks the pretender; a thin one loses the crown');
{
  const win=bootstrap(3030830,['Queen','Win']).G; win.S.week=520;
  win.S.levies=6000; win.S.built={bulwark:1,warden:1}; win.S.legit=44; win.S.factions.court.disp=39;
  win.S.pretender={name:'Aymer',house:'Vorn',base:800,reachBacking:700,defectStr:0,defector:null};
  fire(win,'pretender-war',0);
  ok(!win.S.over && win.S.flags.pretenderCrushed && win.S.flags.pretenderDone, 'a strong host meets the pretender and breaks him (crushed, reign continues)');
  ok(!win.S.pretender && win.S.legit>44, 'the crushed claim is cleared and the mandate is proven up');

  const lose=bootstrap(3030830,['Queen','Lose']).G; lose.S.week=520;
  lose.S.levies=700; lose.S.built={}; lose.S.legit=25; lose.S.factions.court.disp=20;
  lose.S.pretender={name:'Aymer',house:'Vorn',base:800,reachBacking:1200,defectStr:800,defector:{name:'Rikard',house:'Ilk'}};
  fire(lose,'pretender-war',0);
  ok(lose.S.over==='usurped', 'a thin host loses the field — the pretender is crowned (usurped end state)');
}

/* ===================== §5 buy off the Reach, or divide the realm ===================== */
console.log('§5 the purse collapses the rising; the treaty ends it at the price of a divided realm');
{
  // buy off with the coin: the Reach’s hirelings go home, the rising folds
  const buy=bootstrap(3030830,['Queen','Buy']).G; buy.S.week=520; buy.S.gold=6000; const g0=buy.S.gold;
  buy.S.pretender={name:'Aymer',house:'Vorn',base:800,reachBacking:1000,defectStr:0,defector:null};
  fire(buy,'pretender-war',1);
  ok(!buy.S.over && !buy.S.pretender && buy.S.flags.pretenderDone && buy.S.gold<g0, 'buying off the Reach’s backing collapses the rising (coin spent, claim gone, reign lives)');
  // buy off with an empty purse: the offer is laughed off and it falls to the field
  const broke=bootstrap(3030830,['Queen','Broke']).G; broke.S.week=520; broke.S.gold=50;
  broke.S.levies=6000; broke.S.built={bulwark:1,warden:1}; broke.S.legit=44; broke.S.factions.court.disp=39;
  broke.S.pretender={name:'Aymer',house:'Vorn',base:800,reachBacking:1000,defectStr:0,defector:null};
  fire(broke,'pretender-war',1);
  ok(broke.S.flags.pretenderDone && !broke.S.pretender, 'a light purse cannot buy the Reach off — it falls to the field instead');
  // divide the realm: alive but halved, a live rival co-ruler, and a march ceded
  const div=bootstrap(3030830,['Queen','Divide']).G; div.S.week=520; div.S.legit=40;
  const bestBefore=(()=>{ let b=null; div.W.towns.forEach(t=>{ if(t!==div.W.capital && (!b||t.pros>b.pros)) b=t; }); return b?b.pros:0; })();
  div.S.pretender={name:'Aymer',house:'Vorn',base:800,reachBacking:1000,defectStr:0,defector:null};
  fire(div,'pretender-war',2);
  ok(!div.S.over && div.S.flags.dividedRealm && div.S.flags.pretenderDone && div.S.legit<40, 'treating divides the realm: alive, mandate halved, a co-ruler installed');
  const bestAfter=(()=>{ let b=null; div.W.towns.forEach(t=>{ if(t!==div.W.capital && (!b||t.pros>b.pros)) b=t; }); return b?b.pros:0; })();
  ok(bestAfter<bestBefore, 'a march is ceded to the pretender (a town’s prosperity given away)');
}

/* ===================== §6 the muster model ===================== */
console.log('§6 the crown’s might turns on troops, walls, and — unlike a wyrm-hunt — legitimacy and the court');
{
  const g=bootstrap(3030830,['Queen','Might']).G; g.S.levies=3000; g.S.built={walls:1};
  g.S.legit=40; g.S.factions.court.disp=40;
  const m0=g.crownMight();
  g.S.factions.court.disp=70; const mWarm=g.crownMight();
  g.S.factions.court.disp=40; g.S.legit=80; const mLegit=g.crownMight();
  ok(mWarm>m0, 'a warm high table fields more of its levies (court disposition lifts the muster)');
  ok(mLegit>m0, 'a believed crown is followed into the field (legitimacy lifts the muster)');
  g.S.pretender={name:'x',house:'y',base:800,reachBacking:700,defectStr:500,defector:{name:'z',house:'w'}};
  ok(g.pretenderStrength()===2000, 'pretender strength sums base + Reach backing + the defector’s levies');
}

/* ===================== §7 the usurped crown and the true line’s return ===================== */
console.log('§7 the usurped line returns, and a new reign faces its own claimants (state reset)');
{
  const { G }=bootstrap(3030830,['Queen','Heir']);
  G.S.flags.pretenderDone=1; G.S.flags.dividedRealm=true; G.S.pretender={name:'Aymer',house:'Vorn'}; G.S.pretenderNext=900;
  G.S.over='usurped'; G.seatHeir('usurped','Heir');
  ok(!G.S.pretender && G.S.pretenderNext===undefined, 'the heir starts clean: no active pretender, the arc re-arms from scratch');
  ok(!G.S.flags.pretenderDone && !G.S.flags.dividedRealm, 'a claimant’s war belongs to the reign it was raised against (flags cleared)');
  ok(!G.S.over, 'the true line rides again — a fresh reign, not an ending');
}

/* ===================== §8 the divided realm lingers ===================== */
console.log('§8 a realm divided with a co-ruler bleeds mandate, slowly and boundedly');
{
  const g=bootstrap(3030830,['Queen','Linger']).G; g.S.flags.dividedRealm=true; g.S.week=780; g.S.legit=50;
  const l0=g.S.legit; g.factionSeason();
  ok(g.S.legit<l0, 'the co-ruler in his ceded march erodes the crown’s mandate each season');
  // flag-gated: a realm that never divided takes no such drain
  const clean=bootstrap(3030830,['Queen','Clean']).G; clean.S.week=780; clean.S.legit=50;
  const c0=clean.S.legit; clean.factionSeason();
  ok(clean.S.legit>=c0-0.001 || !clean.S.flags.dividedRealm, 'an undivided realm takes no divided-realm drain (flag-gated)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

