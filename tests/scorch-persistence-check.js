// scorch-persistence-check.js — proves the P6(a) scorch overlay survives a reload.
// The overlay serializes NOTHING: it is a pure function of W.towns[].wasSacked, which the
// action-replay reconstructs. This test drives a reign until an enemy sacks a town, records
// the scorch set + the exact history-link payload, then loads a SECOND, independent game
// (a fresh VM context = a page reload) from that payload and asserts the scorch set returns
// identical — same towns, same coords, same deterministic stain signature.
// Two isolated vm.createContext sandboxes stand in for two browser page-loads.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
// v0.48.x repin: the default seed is one whose careless auto=1 reign actually loses a town by wk1040.
// (3030830's auto=1 path stopped sacking as seeded content accreted across v0.33-v0.48 — the scorch
// MECHANISM is seed-independent; this test's job is only to prove the overlay survives a reload, so any
// sacking seed serves. 777, 1234 and 31337 all sack; 777 is pinned.)
const seed = process.argv[2] || '777';

const CODE = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8')
  .replace("'use strict';", '')
  + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,replay:replay,scorchSignature:scorchSignature,scorchSet:scorchSet};';

function bootContext(){
  function stubCtx(){ return new Proxy({}, { get:(t,p)=> p in t ? t[p] : ()=>{}, set:(t,p,v)=>{t[p]=v;return true;} }); }
  function mkEl(tag){ const el={ tag,children:[],style:{cssText:''},dataset:{},textContent:'',value:'',className:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
    el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const els={};
  const sandbox={};
  sandbox.window=sandbox;
  sandbox.Math=Math; sandbox.JSON=JSON; sandbox.Date=Date; sandbox.console=console;
  sandbox.btoa=s=>Buffer.from(s,'binary').toString('base64');
  sandbox.atob=s=>Buffer.from(s,'base64').toString('binary');
  sandbox.encodeURIComponent=encodeURIComponent; sandbox.decodeURIComponent=decodeURIComponent;
  sandbox.unescape=(typeof unescape!=='undefined')?unescape:(s=>s); sandbox.escape=(typeof escape!=='undefined')?escape:(s=>s);
  sandbox.document={ getElementById(id){return els[id]||(els[id]=mkEl('div'));}, createElement(t){return mkEl(t);},
    createTextNode(t){const e=mkEl('#text');e.textContent=t;return e;}, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){throw new Error('reload');} };
  sandbox.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
  sandbox.matchMedia=()=>({matches:false});
  sandbox.requestAnimationFrame=()=>{};
  sandbox.cancelAnimationFrame=()=>{};
  sandbox.performance={ now:()=>0 };
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.setInterval=()=>0; sandbox.clearInterval=()=>{};
  sandbox.navigator={};
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);
  return sandbox;
}

const errs=[];

// ---- Phase 1: play until a town is sacked; record scorch + the save payload ----
const A=bootContext();
A.finishSetup('Queen','Testrun');
let guard=0;
while(A.__G.S.week<1040 && !A.__G.S.over && guard++<30000){
  if(A.__G.S.pendingCard){ const n=A.__G.S.pendingCard.c.o.length; A.annals.choose(((1%n)+n)%n); } // auto=1: careless, provokes a war
  A.annals.advance(1);
  if(A.annals.scorchData().length>=1) break;   // stop the moment a scorch appears (game still live)
}
const setA=A.annals.scorchData().slice().sort((a,b)=>a.id-b.id);
const sigA=A.__G.scorchSignature(A.__G.scorchSet());
const payload={ r:A.__G.S.ruler, a:A.__G.S.actions.slice(), w:A.__G.S.week };  // exactly what historyLink() encodes
const linkWeek=A.__G.S.week;

if(setA.length<1) errs.push('phase 1 never produced a scorch (no town sacked) — cannot prove persistence');

// ---- Phase 2: a fresh game (a reload) restored purely from the history payload ----
const B=bootContext();
B.__G.replay(payload);
const setB=B.annals.scorchData().slice().sort((a,b)=>a.id-b.id);
const sigB=B.__G.scorchSignature(B.__G.scorchSet());

// ---- Assertions: the scorch set is identical across the reload ----
if(JSON.stringify(setA)!==JSON.stringify(setB))
  errs.push('scorch set differs after reload:\n  before='+JSON.stringify(setA)+'\n  after ='+JSON.stringify(setB));
if(sigA!==sigB) errs.push('scorch signature changed across reload ('+sigA+' vs '+sigB+')');
if(setB.length<1) errs.push('reloaded game shows no scorch');

console.log('seed:', seed, '| sacked by week', linkWeek, '| scorched towns:', setA.map(t=>t.name).join(', '));
console.log('  before reload:', JSON.stringify(setA.map(t=>({name:t.name,x:t.x,y:t.y}))), 'sig='+sigA);
console.log('  after  reload:', JSON.stringify(setB.map(t=>({name:t.name,x:t.x,y:t.y}))), 'sig='+sigB);
console.log(errs.length ? ('FAIL: '+errs.join('; ')) : 'PASS: the scorch overlay is reconstructed identically from the history link (serializes nothing).');
process.exit(errs.length?1:0);

