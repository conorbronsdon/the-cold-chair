// tests/noble-driver.js — headless assertions for P8 Minor-Noble Origin (Regency path, v1).
// Boots game.js under the same DOM stub the harness uses, exposes the noble internals, and asserts:
//   1. noble start-state (applyNobleSetup)
//   2. crownAnswers yes/no branches + a granted petition
//   3. ascend('regency') flips mode to crown and starts a fresh 20-year reign
//   4. the attainted loss chapter + continueAsHeir('attainted') keeps the line climbing (mode stays noble)
// Full-plan ascension + determinism are covered by running tests/plans/noble-regency.json through harness.js.
'use strict';
const fs = require('fs'), path = require('path');

/* ---------- DOM stubs (mirror harness.js) ---------- */
function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
  get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){}, remove(){},
  querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
  set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
const els={};
global.window=global;
global.document={ getElementById(id){return els[id]||(els[id]=mkEl('div'));}, createElement(t){return mkEl(t);},
  createTextNode(t){const e=mkEl('#text');e.textContent=t;return e;}, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
global.location={ hash:'#s=3030830', origin:'', pathname:'', reload(){throw new Error('reload');} };
global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
global.matchMedia=()=>({matches:false});
global.requestAnimationFrame=()=>{};

let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
code=code.replace("'use strict';",'') +
  '\nwindow.__N={S,W,CARDS,finishSetup,applyNobleSetup,ascend,endGame,continueAsHeir,crownAnswers,petition,fac,clamp};';
(0,eval)(code);
const N=global.__N, S=N.S, W=N.W;

let pass=0, fail=0;
function ok(cond,msg){ if(cond){pass++;console.log('  PASS '+msg);} else {fail++;console.log('  FAIL '+msg);} }

console.log('\n[1] noble start-state (applyNobleSetup)');
N.finishSetup('Queen','Aldreda','noble');
ok(S.mode==='noble','mode === noble');
ok(S.noble && S.noble.seat===3,'seat index 3 (a mid-river town): '+(S.noble&&W.towns[S.noble.seat].name));
ok(S.legit===8,'claim (S.legit) starts 8');
ok(S.levies===650,'household guard 650');
ok(S.noble.crownLegit===58,'crownLegit starts 58');
ok(S.factions.court.disp===28 && S.factions.world.disp===18,'faction disps reframed to noble baseline');
ok(S.actions.length===1 && S.actions[0][1]==='m' && S.actions[0][2]==='noble' && S.actions[0][0]===0,'[0,"m","noble"] is FIRST in the action log');

console.log('\n[2] crownAnswers yes/no + a granted petition');
// cold court, confident crown -> no
S.factions.court.disp=20; S.factions.commons.disp=30; S.noble.crownLegit=80; S.legit=8;
ok(N.crownAnswers('commons',8)===false,'cold court + confident crown -> petition refused');
// warm court, weak crown, real claim -> yes
S.factions.court.disp=78; S.factions.commons.disp=72; S.noble.crownLegit=22; S.legit=48;
ok(N.crownAnswers('commons',8)===true,'warm court + weak crown -> petition granted');
W.towns[S.noble.seat].hasMarket=false;
const before=S.actions.length;
N.petition('charter');
ok(W.towns[S.noble.seat].hasMarket===true,'granted charter set hasMarket on the seat town');
ok(S.actions.some(a=>a[1]==='p'&&a[2]==='charter'),'petition logged a ["p","charter"] action for replay');

console.log('\n[3] ascend("regency") -> crown reign');
S.week=400; S.noble.path='regency';
N.ascend('regency');
ok(S.mode==='crown','mode flipped to crown');
ok(S.noble.ascended===true,'noble.ascended flag set');
ok(S.legit===48,'regency ascension start legitimacy 48 (court swing applies to factions, not claim)');
ok(S.endWeek===400+52*20,'a fresh 20-year reign clock (continueAsHeir machinery)');
ok(S.over===null,'reign is live, not over');

console.log('\n[4] attainted loss chapter + continueAsHeir keeps the line climbing');
// re-enter noble mode for the loss test
S.mode='noble'; N.applyNobleSetup(); S.week=500; S.over=null; S.noble.path='regency';
const claimBefore=S.noble.crownLegit;
N.endGame('attainted');
ok(S.over==='attainted','endGame("attainted") set the loss chapter');
N.continueAsHeir('attainted');
ok(S.over===null,'continueAsHeir cleared the ending');
ok(S.mode==='noble','mode STAYS noble — the kinsman continues the climb');
ok(S.legit===8,'claim reset low for the heir');
ok(S.noble.crownLegit>=claimBefore,'crown recovered its nerve after the attainder');
ok(S.actions.some(a=>a[1]==='h'&&a[2]==='attainted'),'["h","attainted"] logged so the chapter replays');

console.log('\n==== '+pass+' passed, '+fail+' failed ====');
process.exit(fail?1:0);

