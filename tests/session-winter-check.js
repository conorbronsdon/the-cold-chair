// session-winter-check.js — assertions for v0.46.0 "The Council in Session" and v0.47.0 "The Hard Winter".
// Session: on a letter in a seat's domain the holder counsels a course (pure trait bias, no RNG); heeding
// a bold counsel soothes, overruling counsel for other than prudence books a grudge every third time —
// and choice 0 (prudence) NEVER books, so every auto-0 plan is byte-identical. Winter: an Iron-Chair-only
// seed-fixed severity track drains grain through the cold months; Cold/Kind reigns are untouched.
// Usage: node tests/session-winter-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler, mode, chair){
  const els = {};
  function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
    classList:{add(c){el.className+=' '+c;},remove(){},toggle(){},contains:()=>false},
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
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,councilCounsel:councilCounsel,'
    + 'counselBook:counselBook,seated:seated,resolveCard:resolveCard,weeklyEconomy:weeklyEconomy,'
    + 'queueCard:queueCard,showCard:showCard,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown', chair||'cold');
  return { G, annals:sandbox.annals };
}
function seat(G, seatName, trait){ G.S.council[seatName].holder={name:'T', house:'Vorn', trait, loyalty:'loyal', revealed:false, since:6, grudge:0, marked:false}; G.S.council[seatName].filled=true; }

/* ============ §1 the counsel is pure, trait-biased, and domain-scoped ============ */
console.log('§1 the counsel: a bold seat counsels the second course, a careful one the first — no RNG');
{
  const {G}=bootstrap(3030830,['Queen','Session']);
  seat(G,'marshal','aggressive');
  const cc=G.councilCounsel('ultimatum');   // squarely the Marshal's domain
  ok(cc && cc.seat==='marshal' && cc.opt===1, 'an aggressive Marshal counsels the bolder course (option 1)');
  seat(G,'marshal','cautious');
  ok(G.councilCounsel('ultimatum').opt===0, 'a cautious Marshal counsels prudence (option 0)');
  ok(G.councilCounsel('comet')===null, 'no seat counsels outside its domain (a comet is nobody’s desk)');
  const n=bootstrap(3030830,['Queen','Kn'],'noble').G; seat(n,'marshal','aggressive');
  ok(n.councilCounsel('ultimatum')===null, 'the offstage council counsels the AI crown, not the knight');
}

/* ============ §2 the booking: prudence offends no one ============ */
console.log('§2 the grudge arithmetic: heeded bold counsel soothes; overruling for another course books; choice 0 never');
{
  const {G}=bootstrap(3030830,['Queen','Book']);
  seat(G,'marshal','aggressive');           // counsels option 1 on war letters
  const h=G.seated('marshal');
  // choice 0 (prudence): NEVER books — the auto-0 sweep's whole path
  for(let k=0;k<9;k++) G.counselBook('ultimatum',0);
  ok((h.overruled||0)===0 && h.grudge===0, 'nine prudent answers book nothing (every existing plan is safe)');
  // choice 2 (another course): the insult — every third books a grudge
  G.counselBook('ultimatum',2); G.counselBook('ultimatum',2);
  ok(h.overruled===2 && h.grudge===0, 'two overrules noted, no grudge yet');
  G.counselBook('ultimatum',2);
  ok(h.overruled===3 && h.grudge===1, 'the third overrule earns the seat a grudge (the assassination machinery’s fuel)');
  // heeding the bold counsel soothes
  G.counselBook('ultimatum',1);
  ok(h.grudge===0, 'heeding a bold counsel soothes the seat (grudge eased)');
}

/* ============ §3 choices() rides the counsel only when a seat speaks ============ */
console.log('§3 agents see the counsel — and uncounseled letters are byte-identical');
{
  const {G,annals}=bootstrap(3030830,['Queen','Agent']);
  seat(G,'marshal','aggressive');
  G.queueCard && G.showCard('ultimatum');
  const ch=annals.choices();
  ok(ch && ch.counsel && ch.counsel.seat==='marshal' && ch.counsel.option===1, 'choices() names the counselling seat and course');
  G.S.pendingCard=null; G.showCard('comet');
  ok(!('counsel' in annals.choices()), 'an uncounseled letter carries no counsel key at all');
  G.S.pendingCard=null;
}

/* ============ §4 the Hard Winter: Iron only, seed-fixed, grain pays ============ */
console.log('§4 the Hard Winter: the Iron Chair’s winters bite by a seed-fixed track; the Cold Chair’s do not');
{
  const cold=bootstrap(3030830,['Queen','Mild']).G;
  cold.S.week=52*8;   // a winter week (week%52===0), reign-year 8
  const g0=cold.S.grain; cold.weeklyEconomy();
  const coldDelta=g0-cold.S.grain;
  const iron=bootstrap(3030830,['Queen','Bitter'],'crown','iron').G;
  iron.S.week=52*8; iron.S.grain=g0;
  iron.weeklyEconomy();
  const ironDelta=g0-iron.S.grain;
  // find a year whose winter is severe on this seed, to guarantee a differential somewhere
  let sevYear=null;
  for(let y=31;y<=49;y++){ const c2=bootstrap(3030830,['Q','P'+y],'crown','iron').G;
    c2.S.week=52*(y-30); const gg=c2.S.grain; c2.weeklyEconomy();
    if(gg-c2.S.grain > coldDelta+5){ sevYear=y; break; } }
  ok(sevYear!==null, 'some winter in the reign is keen-or-worse on this seed (found year '+sevYear+')');
  // and the same year twice gives the same bite (seed-fixed, no RNG)
  const a=bootstrap(3030830,['Q','R1'],'crown','iron').G, b=bootstrap(3030830,['Q','R2'],'crown','iron').G;
  a.S.week=52*(sevYear-30); b.S.week=52*(sevYear-30);
  const ga=a.S.grain, gb=b.S.grain; a.weeklyEconomy(); b.weeklyEconomy();
  ok((ga-a.S.grain)===(gb-b.S.grain), 'the winter’s severity is fixed by the seed, not rolled');
  // summer never bites, even on iron
  const s=bootstrap(3030830,['Q','Sum'],'crown','iron').G; s.S.week=52*8+26;
  const gs=s.S.grain; s.weeklyEconomy();
  const su=bootstrap(3030830,['Q','Sum2']).G; su.S.week=52*8+26; su.S.grain=gs;
  su.weeklyEconomy();
  ok((gs-s.S.grain)===(gs-su.S.grain), 'an Iron summer week drains exactly what a Cold one does');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

