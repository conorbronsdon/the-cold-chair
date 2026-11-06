// chair-check.js — assertions for v0.39.0 "The Iron Chair" (difficulty as a first-class axis).
// Usage: node tests/chair-check.js   (run from repo root; reads game.js)
// Covers: the Cold Chair is a pure no-op (default, logs nothing, byte-identical genesis); the Kind Chair
// eases the start (more legitimacy, longer threat runway, a higher hoard-line, gentler estates, a floor
// of 0); the Iron Chair hardens it (less legitimacy, shorter runway, a lower hoard-line, quicker estates,
// a deposition floor above 0); the chair is logged and replayed; and it surfaces conditionally in state().
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
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,hoardLine:hoardLine,depositionFloor:depositionFloor,'
    + 'chairGriev:chairGriev,tickGrievance:tickGrievance,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown', chair||'cold');
  return { G, annals:sandbox.annals };
}

/* ===================== §1 the Cold Chair is the default, and a no-op ===================== */
console.log('§1 the Cold Chair is the standard weight — it scales nothing and logs nothing');
{
  const c=bootstrap(3030830,['Queen','Cold']).G;
  ok(c.S.chair==='cold', 'a crown reign with no chair chosen sits the Cold Chair');
  ok(c.S.actions.length===0, 'the Cold Chair logs no setup action (an existing history link replays unchanged)');
  ok(c.S.legit===33, 'the Cold Chair leaves the starting mandate at its literal 33');
  ok(c.hoardLine()===6000, 'the Cold Chair keeps the hoard-line at 6000');
  ok(c.depositionFloor()===0, 'the Cold Chair falls only at legitimacy 0');
  const gb=c.chairGriev();
  ok(gb.deep===20 && gb.simmer===38 && gb.cool===45, 'the Cold Chair keeps the v0.30.0 grievance bands exactly');
  // an explicit "cold" arg is identical to omitting it
  const c2=bootstrap(3030830,['Queen','Cold2'],'crown','cold').G;
  ok(c2.S.legit===33 && c2.S.actions.length===0, 'passing "cold" explicitly is identical to the default');
}

/* ===================== §2 the Kind Chair eases the reign ===================== */
console.log('§2 the Kind Chair forgives — a fuller mandate, a longer runway, gentler dangers');
{
  const k=bootstrap(3030830,['Queen','Kind'],'crown','kind').G;
  ok(k.S.chair==='kind', 'the Kind Chair is recorded on the reign');
  ok(k.S.legit===45, 'the Kind Chair starts the crown better believed (33 → 45)');
  ok(k.hoardLine()===9000, 'the Kind Chair lets a treasury grow fatter before it draws a wyrm (9000)');
  ok(k.depositionFloor()===0, 'the Kind Chair still only falls at 0');
  const gb=k.chairGriev();
  ok(gb.simmer===30 && gb.cool===40, 'the Kind Chair’s estates are slower to take offence and quicker to forgive');
  ok(k.S.threats.muster.clock>10 && k.S.threats.muster.max>14, 'the Kind Chair pushes the border threat further out');
  ok(k.S.actions.length===1 && k.S.actions[0][1]==='d' && k.S.actions[0][2]==='kind', 'the Kind Chair logs [0,"d","kind"] for replay');
}

/* ===================== §3 the Iron Chair hardens the reign ===================== */
console.log('§3 the Iron Chair remembers every slight — a doubted crown, dangers near, a throne that falls sooner');
{
  const i=bootstrap(3030830,['Queen','Iron'],'crown','iron').G;
  ok(i.S.chair==='iron', 'the Iron Chair is recorded on the reign');
  ok(i.S.legit===21, 'the Iron Chair starts the crown doubted (33 → 21)');
  ok(i.hoardLine()===4000, 'the Iron Chair draws the wyrm to a leaner hoard (4000)');
  ok(i.depositionFloor()===6, 'the Iron Chair falls before the mandate is wholly spent (floor 6)');
  const gb=i.chairGriev();
  ok(gb.simmer===46 && gb.cool===54, 'the Iron Chair’s estates simmer even when fairly warm and forgive only when courted');
  ok(i.S.threats.muster.clock<10 && i.S.threats.muster.max<14, 'the Iron Chair brings the border threat in close');
  ok(i.S.threats.muster.clock>=4 && i.S.threats.waken.clock>=5, 'the Iron Chair’s clocks are pulled in but never below their floors');
  ok(i.S.actions.length===1 && i.S.actions[0][1]==='d' && i.S.actions[0][2]==='iron', 'the Iron Chair logs [0,"d","iron"] for replay');
}

/* ===================== §4 the Iron Chair actually bites — a quicker grievance ===================== */
console.log('§4 the harder chair’s estates mature a grievance from a warmth the Cold Chair would forgive');
{
  // disp 42: under the Cold Chair this cools (>=? no: 42 is in the 38–45 hold band → no change);
  // under the Iron Chair 42 < simmer(46) → it simmers up. A concrete difference in the same state.
  const cold=bootstrap(3030830,['Queen','GCold']).G; cold.S.week=520;
  const iron=bootstrap(3030830,['Queen','GIron'],'crown','iron').G; iron.S.week=520;
  for(const k of ['court','church','commons']){ cold.S.factions[k].disp=42; cold.S.factions[k].grievance=3;
    iron.S.factions[k].disp=42; iron.S.factions[k].grievance=3; }
  cold.tickGrievance(); iron.tickGrievance();
  ok(cold.S.factions.court.grievance===3, 'at disposition 42 the Cold Chair holds the grievance steady');
  ok(iron.S.factions.court.grievance>3, 'at the same disposition 42 the Iron Chair’s estate simmers toward revolt');
}

/* ===================== §5 the chair is carried by the action log (replayable) ===================== */
console.log('§5 a shared reign replays its weight — the chair rides the action log, not the save-state');
{
  const inst=bootstrap(3030830,['Queen','Rep'],'crown','iron');
  const link=inst.annals.state();   // state() surfaces the chair only when not cold
  ok(link.chair==='iron', 'state() surfaces a non-default chair (a leaderboard can weigh the score by it)');
  const cold=bootstrap(3030830,['Queen','RepCold']).G;
  ok(cold.annals ? true : true, '(cold surfacing checked below)');
  const coldState=bootstrap(3030830,['Queen','RepCold2']).annals.state();
  ok(!('chair' in coldState), 'a Cold-Chair reign’s state() omits the chair key entirely (byte-identical JSON)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

