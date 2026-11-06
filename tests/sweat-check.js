// sweat-check.js — assertions for v0.35.0 "The Sweat" (plague).
// Usage: node tests/sweat-check.js   (run from repo root; reads game.js)
// Covers: the openness gate (a lean, closed realm takes no rHist and is byte-identical); an open realm
// is foreshadowed and then arms; each of the four arrival answers; the pure-integer course + burnout;
// the muster-penalty guard (1 when no Sweat → the war sites are byte-identical); the Gravedigger /
// Physician verdicts and their standing below a wyrm-slaying; and the succession reset (with the pop
// losses persisting, the way a scorch does). Determinism: neither the closed gate nor the course draws.
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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,'
    + 'tickSweat:tickSweat,courseSweat:courseSweat,raiseSweat:raiseSweat,endSweat:endSweat,'
    + 'sweatExposure:sweatExposure,sweatMuster:sweatMuster,sweatTollHeavy:sweatTollHeavy,'
    + 'reignVerdict:reignVerdict,continueAsHeir:continueAsHeir,seatHeir:seatHeir,crownMight:crownMight,'
    + 'buildCount:buildCount,tierCounts:tierCounts,rHist:rHist,SWEAT_DOOR:SWEAT_DOOR,SWEAT_GATE:SWEAT_GATE,'
    + 'hasSweat:()=>cardQ.includes("sweat"),hasCrest:()=>cardQ.includes("sweat-crest"),'
    + 'clearQ:()=>{cardQ.length=0;}};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G };
}
// throw the realm's doors wide: harbor + pact + roads + a market → sweatExposure well over SWEAT_DOOR
function makeOpen(G){ G.S.built={harbor:1,roads:2,market:1}; G.S.flags.harborBuilt=true;
  G.S.thirdRealm={name:'Testpact',stage:2,pact:2,favor:2,allied:false,ruptured:false}; G.S.week=520; }
// fire a sweat / sweat-crest card option in isolation
function fire(G, opt){ G.S.pendingCard={id:'sweat',c:G.CARDS['sweat']}; G.CARDS['sweat'].o[opt].f(); G.S.pendingCard=null; }
function fireCrest(G, opt){ G.S.pendingCard={id:'sweat-crest',c:G.CARDS['sweat-crest']}; G.CARDS['sweat-crest'].o[opt].f(); G.S.pendingCard=null; }

/* ===================== §1 the openness gate — a closed realm never arms (no draw) ===================== */
console.log('§1 a lean, closed realm never draws the sweat (no rHist → byte-identical)');
{
  // fresh crowns score below the door (pins the constant — not a guess)
  const a=bootstrap(3030830,['Queen','Lean']).G;
  ok(a.sweatExposure() < a.SWEAT_DOOR, 'fresh crown on 3030830 scores below SWEAT_DOOR ('+a.sweatExposure()+'<'+a.SWEAT_DOOR+')');
  const b=bootstrap(90210,['Queen','Lean']).G;
  ok(b.sweatExposure() < b.SWEAT_DOOR, 'fresh crown on 90210 scores below SWEAT_DOOR ('+b.sweatExposure()+'<'+b.SWEAT_DOOR+')');
  // a closed realm well past the gate never arms
  const c=bootstrap(3030830,['Queen','Closed']).G; c.S.week=700;
  c.tickSweat(); ok(c.S.sweatNext===undefined && !c.S.sweat && !c.hasSweat(), 'a closed realm past the gate takes no draw and never arms');
  // before SWEAT_GATE, even wide open
  const d=bootstrap(3030830,['Queen','Early']).G; makeOpen(d); d.S.week=200;
  d.tickSweat(); ok(d.S.sweatNext===undefined && !d.S.sweat, 'no sweat in the establishing years even for an open realm');
  // noble mode: never
  const e=bootstrap(3030830,['Queen','Knight'],'noble').G; makeOpen(e);
  e.tickSweat(); ok(e.S.sweatNext===undefined && !e.S.sweat, 'a climbing knight’s realm draws no crown-sweat');
  // sweatDone suppresses hard
  const f=bootstrap(3030830,['Queen','Once']).G; makeOpen(f); f.S.flags.sweatDone=f.S.week;
  f.tickSweat(); ok(f.S.sweatNext===undefined && !f.S.sweat, 'sweatDone is a hard no-op (one great Sweat per reign)');
  // the no-draw proof: a closed tickSweat leaves the rHist stream exactly where an untouched one is
  const g1=bootstrap(3030830,['Queen','StreamA']).G; g1.S.week=700;
  const g2=bootstrap(3030830,['Queen','StreamB']).G; g2.S.week=700;
  for(let i=0;i<50;i++) g1.tickSweat();                 // 50 closed ticks on g1, none on g2
  ok(g1.rHist()===g2.rHist(), 'the closed gate consumes no rHist — the stream is unmoved (byte-identical)');
}

/* ===================== §2 the openness draw — an open realm is foreshadowed, then arms ===================== */
console.log('§2 an open realm is foreshadowed a season out, then arms on the strike');
{
  const a=bootstrap(3030830,['Queen','Open']).G; makeOpen(a);
  ok(a.sweatExposure() >= a.SWEAT_DOOR, 'a harbor+pact+roads+market realm crosses SWEAT_DOOR ('+a.sweatExposure()+')');
  a.tickSweat(); ok(a.S.sweatNext>a.S.week && !a.S.sweat, 'the first approach files the tell (sweatNext set), no strike yet');
  // step to each scheduled approach until it arms
  let armed=false, armWeek=0;
  for(let k=0;k<40 && !armed;k++){ a.S.week=a.S.sweatNext; a.tickSweat(); if(a.S.sweat){armed=true;armWeek=a.S.week;} }
  ok(armed && a.hasSweat(), 'an open realm arms the sweat within a few approaches (arrival card queued)');
  // seed-stable: a second identical bootstrap arms on the same week (pure of the seed, no wall-clock)
  const b=bootstrap(3030830,['Queen','Open2']).G; makeOpen(b); b.tickSweat();
  let bWeek=0; for(let k=0;k<40 && !b.S.sweat;k++){ b.S.week=b.S.sweatNext; b.tickSweat(); if(b.S.sweat)bWeek=b.S.week; }
  ok(bWeek===armWeek, 'the arrival week is seed-stable ('+bWeek+'==='+armWeek+')');
}

/* ===================== §3 each of the four answers resolves ===================== */
console.log('§3 quarantine / shut-gates / faith / endure each set the clock and the cost');
{
  const mk=()=>{ const G=bootstrap(3030830,['Queen','Ans']).G; makeOpen(G); G.raiseSweat(); return G; };
  // opt 0 quarantine
  const a=mk(); a.S.factions.commons.grievance=0; fire(a,0);
  ok(a.S.flags.quarantine>a.S.week && a.S.sweat.burn===2 && a.S.factions.commons.grievance>=5,
     'quarantine chains the river (flag set), burn=2, commons grievance climbs');
  // opt 1 shut gates
  const b=mk(); const bc=b.S.factions.commons.disp; fire(b,1);
  ok(b.S.sweat.burn===3 && b.S.factions.commons.disp<bc && b.S.factions.commons.grievance>=3,
     'shutting the gates sets burn=3 and cools/aggrieves the commons');
  // opt 2 faith
  const c=mk(); c.S.gold=5000; const cch=c.S.factions.church.disp, cp=c.S.piety;
  fire(c,2);
  ok(c.S.gold<5000 && c.S.factions.church.disp>cch && c.S.piety>cp && c.S.flags.sweatTended,
     'the faith answer spends gold, warms the Flame and piety, sets sweatTended');
  // opt 3 endure
  const d=mk(); const dc=d.S.factions.commons.disp; fire(d,3);
  ok(d.S.sweat.burn===4 && d.S.factions.commons.disp>dc, 'enduring sets burn=4 and warms the commons who watched you stay');
}

/* ===================== §4 the course runs and burns out (pure integer) ===================== */
console.log('§4 the course takes its tithe on a seasonal cadence and burns out — no rHist');
{
  const G=bootstrap(3030830,['Queen','Course']).G; makeOpen(G); G.raiseSweat(); fire(G,1); // shut gates → burn=3
  const pop0=G.W.towns.reduce((a,t)=>a+t.pop,0), burn0=G.S.sweat.burn;
  // step the course to burnout (branch A of tickSweat runs courseSweat each season)
  let seasons=0;
  while(G.S.sweat && seasons<12){ G.S.week=G.S.sweat.next; G.tickSweat(); seasons++; }
  const pop1=G.W.towns.reduce((a,t)=>a+t.pop,0);
  ok(pop1<pop0, 'the course strictly reduces the realm’s people ('+pop0+'→'+pop1+')');
  ok(!G.S.sweat && G.S.flags.sweatDone && G.S.sweatDead>0, 'burnout clears the Sweat, sets sweatDone, records the dead ('+G.S.sweatDead+')');
  ok(G.W.towns.every(t=>t.plagued===undefined), 'endSweat clears the transient plague marks');
  ok(seasons<=burn0+1, 'the course lasts about its burn clock ('+seasons+' seasons for burn '+burn0+')');
  // the course takes NO rHist: two instances identical up to a manual arm, one runs a full course, the
  // other does not — the stream stays in lockstep, proving courseSweat is pure of the history draw.
  const x=bootstrap(3030830,['Queen','NoDrawA']).G; const y=bootstrap(3030830,['Queen','NoDrawB']).G;
  [x,y].forEach(g=>{ g.S.built={roads:2}; g.S.week=600; g.S.sweat={spread:2,burn:3,mortality:2,since:600,next:600,dead:0,worst:null}; });
  for(let i=0;i<8;i++){ x.S.week=x.S.sweat?x.S.sweat.next:x.S.week; x.tickSweat(); }   // run x's course to burnout
  ok(x.rHist()===y.rHist(), 'courseSweat consumes no rHist — the stream is unmoved across a full course');
  // grain shock softened by granaries: same course, one with granaries loses less grain
  const p=bootstrap(3030830,['Queen','NoGranary']).G, q=bootstrap(3030830,['Queen','Granary']).G;
  p.S.built={}; q.S.built={granary:3};
  [p,q].forEach(g=>{ g.S.grain=4000; g.S.week=600; g.S.sweat={spread:3,burn:1,mortality:3,since:600,next:600,dead:0,worst:null}; });
  p.courseSweat(); q.courseSweat();
  ok((4000-p.S.grain) > (4000-q.S.grain), 'granaries blunt the harvest shock (lost '+(4000-p.S.grain)+' vs '+(4000-q.S.grain)+' with granaries)');
}

/* ===================== §5 the muster is sick mid-plague (byte-identical when none) ===================== */
console.log('§5 sweatMuster weakens the crown’s host only while a Sweat rages');
{
  const G=bootstrap(3030830,['Queen','Muster']).G; G.S.levies=3000;
  ok(G.sweatMuster()===1, 'no Sweat loose → sweatMuster is 1 (the war sites are byte-identical)');
  const might0=G.crownMight();
  G.S.sweat={spread:2,burn:2,mortality:2,since:G.S.week,next:G.S.week,dead:0,worst:null};
  ok(G.sweatMuster()===0.8, 'a Sweat loose → sweatMuster is 0.8');
  ok(G.crownMight()<might0, 'the crown fields a weaker host mid-plague ('+Math.round(G.crownMight())+'<'+Math.round(might0)+')');
  G.S.sweat=null;
  ok(G.crownMight()===might0, 'clearing the Sweat restores the muster exactly (no residue)');
}

/* ===================== §6 the verdicts, and a fresh reign for the heir ===================== */
console.log('§6 the Gravedigger / the Physician epithets, and the succession reset');
{
  // the Gravedigger: a heavy toll, however answered
  const a=bootstrap(3030830,['Queen','Digger']).G; a.S.week=700; a.S.over='endured'; a.S.legit=50; a.S.piety=50; a.S.gold=1000;
  a.S.monk.gilded=0; a.S.built={mill:1}; a.S.flags.sweatDone=a.S.week;
  a.S.sweatDead=a.sweatTollHeavy()+1;
  ok(a.reignVerdict()==='the Gravedigger', 'a Sweat endured into a slaughter → "the Gravedigger", got '+a.reignVerdict());
  // the Physician: a light toll, tended, mandate still believed
  const b=bootstrap(3030830,['Queen','Doctor']).G; b.S.week=700; b.S.over='endured'; b.S.legit=62; b.S.piety=55; b.S.gold=1000;
  b.S.monk.gilded=0; b.S.built={mill:1}; b.S.flags.sweatDone=b.S.week; b.S.flags.sweatTended=1;
  b.S.sweatDead=10; b.W.towns.forEach(t=>{ t.pros=50; t.pop=800; t.wasSacked=false; });
  ok(b.reignVerdict()==='the Physician', 'shepherded through with a light toll → "the Physician", got '+b.reignVerdict());
  // a wyrm-slaying still outranks surviving a plague
  b.S.dragonsSlain=1;
  ok(b.reignVerdict()==='the Wyrmsbane', 'a dragon-slaying outranks the Physician, got '+b.reignVerdict());
  // succession: the arc state resets, but the pop losses persist (a realm fact, like a scorch)
  const c=bootstrap(3030830,['Queen','Heir']).G; makeOpen(c); c.raiseSweat(); fire(c,3);
  while(c.S.sweat){ c.S.week=c.S.sweat.next; c.tickSweat(); }   // run to burnout
  const smallTown=c.W.towns[5], popBefore=smallTown.pop;
  c.S.over='endured'; c.seatHeir('endured','Heir');
  ok(!c.S.sweat && c.S.sweatNext===undefined && !c.S.flags.sweatDone && c.S.sweatDead===undefined,
     'the heir starts its own sweat-arc (all arc state cleared)');
  ok(smallTown.pop===popBefore, 'the pop losses persist across succession — the heir inherits the smaller town');
}

/* ===================== §7 determinism double-run ===================== */
console.log('§7 an open realm’s arc is deterministic across a double-run');
{
  const run=()=>{ const G=bootstrap(3030830,['Queen','Det']).G; makeOpen(G); G.tickSweat();
    for(let k=0;k<40 && !G.S.sweat;k++){ G.S.week=G.S.sweatNext; G.tickSweat(); }
    if(G.S.sweat){ G.S.pendingCard={id:'sweat',c:G.CARDS['sweat']}; G.CARDS['sweat'].o[2].f(); G.S.pendingCard=null; }
    while(G.S.sweat){ G.S.week=G.S.sweat.next; G.tickSweat(); }
    return [G.S.sweatDead, G.S.flags.sweatDone, Math.round(G.S.legit), Math.round(G.S.piety),
            G.W.towns.map(t=>t.pop).join(',')].join('|'); };
  ok(run()===run(), 'two full open-realm arcs on the same seed are identical (pure of the seed, no wall-clock)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

