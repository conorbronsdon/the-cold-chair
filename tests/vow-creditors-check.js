// vow-creditors-check.js — assertions for the v0.48.0 rebaseline batch: the Vow at the Crowning,
// the Crown's Creditors, and the feud-neglect teeth. Shipped under the one approved repin.
// Usage: node tests/vow-creditors-check.js
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
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,tickVow:tickVow,tickCreditors:tickCreditors,'
    + 'mintOwed:mintOwed,calledDebt:calledDebt,continueAsHeir:continueAsHeir,seatHeir:seatHeir,reignVerdict:reignVerdict,'
    + 'feudStage:feudStage,factionSeason:factionSeason,cardQ:cardQ,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G, annals:sandbox.annals };
}
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; G.CARDS[id].o[opt].f(); G.S.pendingCard=null; G.S.seenCards[id]=G.S.week; }

/* ============ §1 the vow offers at reign-week 16, per reign ============ */
console.log('§1 the vow: offered at reign-week 16 of every crown coronation, and the heir vows anew');
{
  const {G}=bootstrap(3030830,['Queen','Vow']);
  G.S.week=16; G.tickVow();
  ok(G.cardQ.indexOf('crown-vow')>=0, 'the vow letter arrives at reign-week 16');
  fire(G,'crown-vow',0);
  ok(G.S.vow && G.S.vow.k==='toll' && G.S.vow.limit===G.S.toll, 'the toll vow binds at the sworn line');
  G.S.week=1040; G.S.over='endured'; G.seatHeir('endured','Heir');
  ok(G.S.vow===null && G.S.seenCards['crown-vow']===undefined, 'the vow dies with the crown; the heir may vow anew');
  const n=bootstrap(3030830,['Queen','Kn'],'noble').G; n.S.week=n.S._reignStart+16; n.tickVow();
  ok(n.cardQ.indexOf('crown-vow')<0, 'no coronation vow for an uncrowned knight');
}

/* ============ §2 kept and broken vows ============ */
console.log('§2 the vow watched weekly: broken in public the week it breaks; kept ten years names the reign');
{
  const g=bootstrap(3030830,['Queen','Break']).G;
  g.S.week=16; fire(g,'crown-vow',0);          // toll vow at current toll
  const l0=g.S.legit;
  g.S.week=100; g.S.toll=g.S.vow.limit+4; g.tickVow();
  ok(g.S.vow.broken===100 && g.S.legit<l0, 'raising the toll past the sworn line breaks the vow, publicly and at once');
  const lAfter=g.S.legit; g.tickVow();
  ok(g.S.legit===lAfter, 'a broken vow breaks once (no repeat penalty on later weeks)');
  const k=bootstrap(3030830,['Queen','Keep']).G;
  k.S.week=16; fire(k,'crown-vow',1);          // the granary vow
  k.S.week=600; k.S.grain=4000; k.tickVow();
  ok(!k.S.vow.broken, 'full granaries keep the vow');
  k.S.week=1040; k.S.over='endured';
  ok(k.reignVerdict()==='the Oathkeeper', 'a vow held ten years and to the end names the reign: the Oathkeeper');
  k.S.grain=0; k.tickVow();
  ok(k.S.vow.broken, 'empty granaries break the granary vow');
}

/* ============ §3 the creditors mint, wait a year, and call at the worst moment ============ */
console.log('§3 the ledger walks: a year of grace, then the vulnerability test, then the call');
{
  const g=bootstrap(3030830,['Queen','Debt']).G;
  g.S.week=100; g.mintOwed('commons','loan');
  g.S.week=120; g.S.war={weeks:1}; g.tickCreditors();
  ok(g.cardQ.indexOf('debt-called')<0, 'inside the year of grace even a war does not move the ledger');
  g.S.week=160; g.S.war=null; g.S.legit=60; g.tickCreditors();
  ok(g.cardQ.indexOf('debt-called')<0, 'past the grace, a secure unpinned crown is not called');
  g.S.legit=35; g.tickCreditors();
  ok(g.cardQ.indexOf('debt-called')>=0 && g.calledDebt().kind==='loan', 'a weakened crown is called — the League squeezes when you are pinned');
  // pay in full clears it
  g.S.gold=1000; fire(g,'debt-called',0);
  ok(g.calledDebt()===null && g.S.gold===250, 'paying in full (750 with interest) settles the note');
  // the danegeld: the Reach re-arms
  const d=bootstrap(3030830,['Queen','Dane']).G;
  d.S.week=100; d.mintOwed('world','danegeld');
  d.S.week=200; d.S.threats.muster.clock=3; d.tickCreditors();
  ok(d.calledDebt() && d.calledDebt().kind==='danegeld', 'the Reach calls its bought peace as its muster gathers');
  // repudiation: cheap today, repriced forever
  const w0=d.S.factions.world.disp; fire(d,'debt-called',2);
  ok(d.S.factions.world.disp<w0 && d.calledDebt()===null, 'repudiation settles the paper and poisons the well');
}

/* ============ §4 debts outlive the crown; the vow does not ============ */
console.log('§4 succession: the realm keeps its debts and sheds its vow');
{
  const {G}=bootstrap(3030830,['Queen','Estate']);
  G.S.week=16; fire(G,'crown-vow',2);
  G.mintOwed('commons','loan');
  G.S.week=1040; G.S.over='endured'; G.seatHeir('endured','Heir');
  ok(G.S.vow===null, 'the heir swears (or declines) its own vow');
  ok(G.S.owed.length===1 && !G.S.owed[0].settled, 'the League’s note survives the succession — a mortgage on the realm, not the ruler');
}

/* ============ §5 the feud-neglect teeth (under the repin) ============ */
console.log('§5 a feud tolerated to blood bleeds the realm that tolerates it');
{
  const g=bootstrap(3030830,['Queen','Neglect']).G;
  g.S.week=620;                                 // blood on this seed, unjudged
  ok(g.feudStage()>=4, 'the unjudged feud stands at blood by week 620');
  const c0=g.S.factions.court.disp, m0=g.S.factions.commons.disp;
  g.factionSeason();
  ok(g.S.factions.court.disp<c0 && g.S.factions.commons.disp<m0, 'each season of tolerated blood costs the court and the commons');
  const j=bootstrap(3030830,['Queen','Judged']).G;
  j.S.week=620; j.S.flags.feudJudged=610;       // judged just before
  const jc0=j.S.factions.court.disp;
  j.factionSeason();
  ok(j.S.factions.court.disp>=jc0-0, 'a judged feud costs nothing (the teeth are for neglect, not existence)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

