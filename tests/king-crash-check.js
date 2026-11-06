// king-crash-check.js — regression for the P6 showCard bugfix.
// The `rebuild` card is the only card with a function-form `from(){…}`. Before the fix,
// showCard passed the function object straight to fixR(), which runs `.replace` on it —
// harmless for a Queen (fixR returns early) but a TypeError that CRASHES THE LETTER in a
// King reign. This test drives a King reign, marks a town sacked so `rebuild` queues on a
// real town, then renders `rebuild` and asserts showCard does not throw.
// Mirrors harness.js DOM/canvas stubs.
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
code=code.replace("'use strict';",'') + '\nwindow.__G={S:S,W:W,CARDS:CARDS,showCard:showCard};';
(0,eval)(code);
const G=global.__G;

finishSetup('King','Testking');
const errs=[];
if(G.S.ruler.title!=='King') errs.push('ruler title is not King ('+G.S.ruler.title+')');

// Mark a town sacked so ruinedTown() returns a real burned town (exercises rebuild's from()/p()).
const victim=G.W.towns[3];
victim.wasSacked=true; victim.sacked=0;

// The crash surface: rendering the rebuild letter in a King reign.
let threw=null;
try{ G.showCard('rebuild'); }catch(e){ threw=e; }
if(threw) errs.push('showCard("rebuild") threw in a King reign: '+threw);

// The from-text a King must see: the function form must have been invoked (a string, not "function").
const c=G.CARDS['rebuild'];
const fromText=(typeof c.from==='function')?c.from():c.from;
if(typeof fromText!=='string') errs.push('rebuild.from() did not resolve to a string');

// Also confirm a Queen never regressed.
let threwQ=null; try{ finishSetup('Queen','Testqueen'); G.W.towns[3].wasSacked=true; G.showCard('rebuild'); }catch(e){ threwQ=e; }
if(threwQ) errs.push('showCard("rebuild") threw in a Queen reign: '+threwQ);

console.log('seed:', seed, '| King from-text:', JSON.stringify(fromText.slice(0,60)+'…'));
console.log(errs.length ? ('FAIL: '+errs.join('; ')) : 'PASS: rebuild renders in both King and Queen reigns without throwing.');
process.exit(errs.length?1:0);

