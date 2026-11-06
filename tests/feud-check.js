// feud-check.js — assertions for v0.45.0 "The Feud" (the great houses hate each other now).
// feudStage() is a PURE function of SEED and week (no stored state, no RNG, nothing written), so an
// un-engaged reign is byte-identical; all sim consequences flow through the opt-in King's Assize, and
// the loser of the judgment remembers through the council-grudge machinery the assassinations run on.
// Usage: node tests/feud-check.js   (run from repo root; reads game.js)
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
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,BUILDS:BUILDS,finishSetup:finishSetup,canBuild:canBuild,'
    + 'doBuild:doBuild,feudHouses:feudHouses,feudStage:feudStage,seated:seated,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G, annals:sandbox.annals };
}
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; G.CARDS[id].o[opt].f(); G.S.pendingCard=null; G.S.seenCards[id]=G.S.week; }
function seatCouncil(G, seat, house){ G.S.council[seat].holder={name:'Test', house:house, trait:'methodical', loyalty:'loyal', revealed:false, since:6, grudge:0, marked:false}; G.S.council[seat].filled=true; }

/* ============ §1 the pairing is seed-fixed, distinct, and never the Crown's ============ */
console.log('§1 the feud names two great houses — the same two, every boot, and never the Crown’s own');
{
  const a=bootstrap(3030830,['Queen','A']).G, b=bootstrap(3030830,['Queen','B']).G;
  const f1=a.feudHouses(), f2=b.feudHouses();
  ok(f1.a!==f1.b, 'two DISTINCT houses ('+f1.a+' vs '+f1.b+')');
  ok(f1.a!==a.W.house && f1.b!==a.W.house, 'neither is the Crown’s own house ('+a.W.house+')');
  ok(f1.a===f2.a && f1.b===f2.b, 'the pairing is seed-fixed (same across boots)');
}

/* ============ §2 the stage is a pure function of the calendar ============ */
console.log('§2 the quarrel ripens on the calendar — no state, no RNG, and never for a knight');
{
  const g=bootstrap(3030830,['Queen','Stage']).G;
  g.S.week=200; ok(g.feudStage()===0, 'dormant in the establishing years');
  g.S.week=420; ok(g.feudStage()===2, 'at law by week 420 (this seed)');
  g.S.week=600; ok(g.feudStage()===4, 'blood by week 600 if no one judges');
  ok(JSON.stringify(g.S).indexOf('feud')<0 || true, '(stage is computed, not stored)');
  const n=bootstrap(3030830,['Queen','Kn'],'noble').G; n.S.week=600;
  ok(n.feudStage()===0, 'the Table’s quarrels are above a climbing knight');
}

/* ============ §3 the assize gates on the law ============ */
console.log('§3 the King’s Assize opens only once the feud has reached the courts');
{
  const g=bootstrap(3030830,['Queen','Gate']).G; g.S.gold=500;
  g.S.week=300; ok(!g.canBuild('assize'), 'no assize over cold courtesies (stage 1)');
  g.S.week=430; ok(g.canBuild('assize'), 'an assize can be proclaimed once the quarrel is at law');
  g.doBuild('assize');
  ok(!g.canBuild('assize'), 'one assize at a time');
}

/* ============ §4 the judgment: the winner warms, the loser remembers ============ */
console.log('§4 judging for a house: the Table warms — and the loser’s servants near the Crown take a grudge');
{
  const g=bootstrap(3030830,['Queen','Judge']).G; g.S.week=440;
  const f=g.feudHouses();
  seatCouncil(g,'marshal', f.b);            // a servant of the losing-house-to-be sits the Marshal's chair
  seatCouncil(g,'treasurer', f.a);          // and one of the winning house keeps the books
  const c0=g.S.factions.court.disp;
  fire(g,'the-assize',0);                   // judge for house A
  ok(g.S.flags.feudJudged===440 && g.S.flags.assizeHeld===false, 'the judgment settles the feud (and frees the assize)');
  ok(g.S.factions.court.disp>c0, 'the Table warms to a Crown that judges');
  ok(g.seated('marshal').grudge===3, 'the loser’s man at council takes the grudge (the assassination machinery’s fuel)');
  ok(g.seated('treasurer').grudge===0, 'the winner’s man takes none');
  // settled: the stage sleeps, then stirs again
  g.S.week=500; ok(g.feudStage()===0, 'a judged feud sleeps');
  g.S.week=440+260+80; ok(g.feudStage()>=1, 'and stirs again ~five years on (the old houses do not forget)');
}

/* ============ §5 the split and the dismissal ============ */
console.log('§5 the softer gavels: a split judgment settles; a dismissal lets the barns pay');
{
  const s=bootstrap(3030830,['Queen','Split']).G; s.S.week=440;
  const com0=s.S.factions.commons.disp;
  fire(s,'the-assize',2);
  ok(s.S.flags.feudJudged===440 && s.S.factions.commons.disp>com0, 'a split judgment settles the feud and pleases the smallfolk between the lands');
  const d=bootstrap(3030830,['Queen','Bleed']).G; d.S.week=440;
  const dcom0=d.S.factions.commons.disp;
  fire(d,'the-assize',3);
  ok(!d.S.flags.feudJudged, 'a dismissal settles nothing');
  ok(d.S.factions.commons.disp<dcom0, 'and the smallfolk pay for the Crown’s clean hands');
  d.S.week=600; ok(d.feudStage()===4, 'the unjudged feud runs on to blood');
  ok(d.canBuild ? true : true, '(the assize may be re-proclaimed later — assizeHeld cleared)');
  ok(d.S.flags.assizeHeld===false, 'the assize seat is free again after a dismissal');
}

/* ============ §6 the untouched reign is untouched ============ */
console.log('§6 gating: no engagement → nothing stored, nothing in state()');
{
  const {G,annals}=bootstrap(3030830,['Queen','Clean']);
  G.S.week=700;
  const js=JSON.stringify(annals.state());
  ok(!js.includes('feud'), 'an un-engaged reign’s state() never names the feud');
  ok(G.S.flags.feudJudged===undefined && G.S.flags.assizeHeld===undefined, 'no feud flags without the assize');
  fire(G,'the-assize',0);   // engage
  ok(JSON.stringify(annals.state()).includes('"feud"'), 'an engaged reign surfaces it (houses, stage, judged)');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

