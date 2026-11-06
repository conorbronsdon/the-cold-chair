// leaf-check.js — drive a reign to its ending and dump annals.leafData().
// Mirrors harness.js DOM/canvas stubs; proves the Last Leaf composition headless.
'use strict';
const fs = require('fs');
const path = require('path');
const seed = process.argv[2] || '3030830';
const planFile = process.argv[3] || path.join(__dirname, 'plans', 'tier-climber.json');
const auto = process.argv[4] !== undefined ? parseInt(process.argv[4], 10) : 0;
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const acts = (plan.actions || []).slice().sort((a, b) => a[0] - b[0]);

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
code=code.replace("'use strict';",'') + '\nwindow.__G={S:S,finishSetup:finishSetup};';
(0,eval)(code);
const G=global.__G;
G.finishSetup(plan.ruler?plan.ruler[0]:'Queen', plan.ruler?plan.ruler[1]:'Testrun');

let guard=0;
while(G.S.week<1040 && !G.S.over && guard++<30000){
  while(acts.length && acts[0][0]<=G.S.week && acts[0][1]!=='c'){ const a=acts.shift();
    if(a[1]==='s') annals.setSlider(a[2],a[3]);
    else if(a[1]==='b') annals.build(a[2]);
    else if(a[1]==='y') annals.spy(); }
  if(G.S.pendingCard){ const id=G.S.pendingCard.id; const ci=acts.findIndex(x=>x[1]==='c'&&x[2]===id);
    if(ci>=0){ const a=acts.splice(ci,1)[0]; annals.choose(a[3]); }
    else { const n=G.S.pendingCard.c.o.length; annals.choose(((auto%n)+n)%n); } }
  annals.advance(1);
}
const leaf=annals.leafData();
// shape assertions
const errs=[];
const need=['title','realm','seed','ruler','house','years','ending','moments','judgment','dynasty','stats','link'];
need.forEach(k=>{ if(!(k in leaf)) errs.push('missing '+k); });
if(!Array.isArray(leaf.moments)) errs.push('moments not array');
if(leaf.moments.length>5) errs.push('more than 5 moments');
leaf.moments.forEach((m,i)=>{ if(typeof m.text!=='string'||typeof m.weight!=='number') errs.push('bad moment '+i); });
if(typeof leaf.judgment!=='string'||!leaf.judgment.length) errs.push('judgment empty');
if(typeof leaf.link!=='string'||leaf.link.indexOf('#s=')<0) errs.push('bad link');
console.log('over:', G.S.over, '| week:', G.S.week);
console.log('leafData shape errors:', errs.length? errs : 'NONE');
console.log(JSON.stringify(leaf, null, 1));

