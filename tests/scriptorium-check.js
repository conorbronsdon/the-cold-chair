// scriptorium-check.js — prove "The Monk You Can Bribe" (P2) end to end, headless.
// Funds the scriptorium to open the gilding window, keeps it endowed across the reign,
// lets negative Crown events fire, then asserts via annals.chronicle()/leafData() that
// BOTH the flattering (gilded) line AND a later hand's correction reach the record.
// Mirrors harness.js DOM/canvas stubs. Deterministic: seed + fixed choices only.
'use strict';
const fs = require('fs');
const path = require('path');
const seed = process.argv[2] || '3030830';

function stubCtx(){ return new Proxy({}, { get:(t,p)=> p in t ? t[p] : ()=>{}, set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){ const el={ tag,children:[],style:{cssText:''},dataset:{},textContent:'',value:'',className:'',
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
  get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
  querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
  set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
const els={}; global.window=global;
global.document={ getElementById(id){return els[id]||(els[id]=mkEl('div'));}, createElement(t){return mkEl(t);},
  createTextNode(t){const e=mkEl('#text');e.textContent=t;return e;}, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
global.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){throw new Error('reload');} };
global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
global.matchMedia=()=>({matches:false}); global.requestAnimationFrame=()=>{};

let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
code=code.replace("'use strict';",'') + '\nwindow.__G={S:S};';
(0,eval)(code);
const G=global.__G;
finishSetup('Queen','Scriptorium');

// Drive the reign: fund the scriptorium, keep it endowed, answer letters with option 0.
let guard=0;
while(G.S.week<1040 && !G.S.over && guard++<40000){
  // Keep the gilding window open: re-endow when it is about to lapse and no endowment is pending.
  const pending=G.S.projects.some(p=>p.k==='scriptorium');
  const open=G.S.flags.gildUntil && G.S.week < G.S.flags.gildUntil;
  if(!pending && G.S.gold>=100 && (!open || G.S.week > G.S.flags.gildUntil-8)) annals.build('scriptorium');
  if(G.S.pendingCard) annals.choose(0);   // least-drama default; also burns the wood on the wakening
  annals.advance(1);
}

const leaf=annals.leafData();
const chron=annals.chronicle(400);
const errs=[];

// --- structural assertions on the two-layer history ---
if(!leaf.monk || typeof leaf.monk.name!=='string') errs.push('leafData.monk missing');
if(!leaf.monk || leaf.monk.gilded<1) errs.push('monk never gilded (gilded='+(leaf.monk&&leaf.monk.gilded)+')');
if(!Array.isArray(leaf.gilds) || leaf.gilds.length<1) errs.push('leafData.gilds empty');
const corrected = (leaf.gilds||[]).filter(g=>g.correction);
if(corrected.length<1) errs.push('no gilded entry ever got a later-hand correction');
(leaf.gilds||[]).forEach((g,i)=>{
  if(typeof g.gilded!=='string'||!g.gilded.length) errs.push('gild '+i+' missing flattering text');
  if(typeof g.truth!=='string'||!g.truth.length) errs.push('gild '+i+' missing true text');
  if(g.correction && g.correction.indexOf(g.truth)<0) errs.push('gild '+i+' correction does not restore the truth');
});

// --- the same payoff, seen through the plain chronicle tail (what the harness reads) ---
const sig=leaf.monk?leaf.monk.name[0]:'';
const gildedInChron = chron.some(l=> (leaf.gilds||[]).some(g=> l.indexOf(g.gilded)>=0));
const correctionInChron = chron.some(l=> l.indexOf('A later hand:')>=0 && l.indexOf('— '+sig+'.')>=0);
if(!gildedInChron) errs.push('no gilded line found in annals.chronicle()');
if(!correctionInChron) errs.push('no later-hand correction found in annals.chronicle()');

console.log('seed:', seed, '| over:', G.S.over, '| week:', G.S.week);
console.log('monk:', JSON.stringify(leaf.monk));
console.log('gilds:', leaf.gilds.length, '| corrected:', corrected.length, '| final legitimacy:', leaf.stats.legitimacy);
if(leaf.gilds[0]){
  console.log('  gilded : ', leaf.gilds[0].gilded);
  console.log('  truth  : ', leaf.gilds[0].truth);
  console.log('  later  : ', leaf.gilds[0].correction);
}
console.log(errs.length ? ('FAIL: '+errs.join('; ')) : 'PASS: both the gilded line and a later-hand correction reach the record.');
process.exit(errs.length?1:0);

