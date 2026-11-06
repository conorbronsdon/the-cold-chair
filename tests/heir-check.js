// heir-check.js — assertions for v0.42.0 "The Heir Grows Up" (the dynasty spine).
// School the heir this reign — warlike / pious / learned / cunning — and the NEXT reign opens with the
// tilt you paid for. Opt-in on the build verb; a dynasty that never invests is byte-identical.
// Usage: node tests/heir-check.js   (run from repo root; reads game.js)
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
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};   // doBuild's toast uses them
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,BUILDS:BUILDS,finishSetup:finishSetup,canBuild:canBuild,'
    + 'doBuild:doBuild,continueAsHeir:continueAsHeir,seatHeir:seatHeir,leafJudgment:leafJudgment,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G, annals:sandbox.annals };
}
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; G.CARDS[id].o[opt].f(); G.S.pendingCard=null; G.S.seenCards[id]=G.S.week; }
function school(G, opt){ G.S.gold=500; G.doBuild('heirhall');
  G.S.projects=G.S.projects.filter(p=>p.k!=='heirhall'); G.BUILDS.heirhall.do();   // complete the works (do() runs at completion in live play)
  fire(G,'the-tutors',opt); }

/* ============ §1 the household gates ============ */
console.log('§1 the heir’s household: crown-only, once a reign, and closed while a schooling stands');
{
  const c=bootstrap(3030830,['Queen','Gate']).G; c.S.gold=500;
  ok(c.canBuild('heirhall'), 'a crown reign with the coin can raise the household');
  const n=bootstrap(3030830,['Queen','Knight'],'noble').G; n.S.gold=500;
  ok(!n.canBuild('heirhall'), 'a climbing knight cannot (crown-only)');
  c.doBuild('heirhall');
  ok(!c.canBuild('heirhall'), 'no second household while the first is a-building (pending gate)');
  c.S.projects=c.S.projects.filter(p=>p.k!=='heirhall'); c.BUILDS.heirhall.do();
  ok(c.S.flags.heirTutors===true, 'the completed build marks the reign as schooling its heir');
  ok(!c.canBuild('heirhall'), 'the household stands once a reign (flag blocks a second)');
}

/* ============ §2 the tutors set the trait ============ */
console.log('§2 the four tutors: each choice records how the heir is being raised');
{
  const T=['warlike','pious','learned','cunning'];
  T.forEach((tr,i)=>{
    const g=bootstrap(3030830,['Queen','T'+i]).G;
    school(g,i);
    ok(g.S.heirTrait===tr, 'tutor '+i+' raises a '+tr+' heir, got '+g.S.heirTrait);
    ok(!g.canBuild('heirhall'), 'no second household while a schooling stands');
  });
  // state() surfaces the schooling once chosen — and not before
  const a=bootstrap(3030830,['Queen','SA']);
  ok(!('heirTrait' in a.annals.state()), 'an uninvested reign has no heirTrait key in state()');
  school(a.G,1);
  ok(a.annals.state().heirTrait==='pious', 'a schooled reign surfaces the trait in state()');
}

/* ============ §3 the succession applies the tilt — and consumes it ============ */
console.log('§3 the next reign opens with the upbringing the last one paid for');
{
  // warlike: the muster loves the drill-yard crown
  const w=bootstrap(3030830,['Queen','War']).G; school(w,0);
  w.S.week=1040; w.S.levies=2000; w.S.over='endured'; w.seatHeir('endured','Heir');
  ok(w.S.levies===Math.min(7000,Math.round(2000*1.15)+250), 'a warlike heir keeps and swells the muster, got '+w.S.levies);
  ok(w.S.heirTrait===null && w.S.flags.raised==='warlike', 'the trait is consumed; the upbringing is recorded');
  // pious: the Concord anoints a reign it raised
  const p=bootstrap(3030830,['Queen','Pi']).G; school(p,1);
  p.S.week=1040; p.S.piety=50; p.S.factions.church.disp=50; p.S.over='endured'; p.seatHeir('endured','Heir');
  ok(p.S.piety===64 && p.S.factions.church.disp===60, 'a pious heir opens with the Flame warm (piety +14, church +10)');
  // learned: better believed, better counted
  const l=bootstrap(3030830,['Queen','Le']).G; school(l,2);
  l.S.week=1040; l.S.over='endured'; const g0=l.S.gold; l.seatHeir('endured','Heir');
  ok(l.S.legit===53 && l.S.gold===g0+150, 'a learned heir opens at legit 45+8 with a corrected treasury');
  // cunning: two years of free whispers
  const c=bootstrap(3030830,['Queen','Cu']).G; school(c,3);
  c.S.week=1040; c.S.over='endured'; c.seatHeir('endured','Heir');
  ok(c.S.spyUntil===1040+104, 'a cunning heir opens with the informants already paid (spyUntil +104)');
  ok(!('heirTrait' in c.annals.state()), 'after succession the consumed trait leaves state() again');
  // and the new reign may school ITS heir
  c.S.gold=500;
  ok(c.canBuild('heirhall'), 'the new reign can raise a household of its own');
  // the leaf remembers the upbringing
  ok(/schooled to the whisper/.test(c.leafJudgment()), 'the Last Leaf notes the crown was schooled to the whisper');
}

/* ============ §4 no investment, no change ============ */
console.log('§4 a dynasty that never schools an heir is untouched');
{
  const g=bootstrap(3030830,['Queen','Plain']).G;
  g.S.week=1040; g.S.levies=2000; g.S.piety=50; g.S.over='endured'; g.seatHeir('endured','Heir');
  ok(g.S.levies===2000 && g.S.piety===50 && !g.S.flags.raised, 'an unschooled succession changes nothing new');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

