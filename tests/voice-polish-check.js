// voice-polish-check.js — regression for the v0.18.1 voice-polish pass (qa-pass-1 L1–L3).
// Asserts, in one headless boot: (L1) the sea-gate port name is clean — no leading/double
// space; (L3) a 4-week work pluralizes as "1 month", not "1 months"; (L2) a King reign renders
// the opening ruler lines with male/neutral wording (no "her ward" / "her own right"), while a
// female NPC's pronoun (Mother Senna in `writ`) is left untouched.
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
code=code.replace("'use strict';",'') +
  '\nwindow.__G={S:S,W:W,CARDS:CARDS,annals:window.annals,resolveCard:resolveCard,fixR:fixR};';
(0,eval)(code);
const G=global.__G;
const errs=[];

// ---- L1: port name is clean ----
finishSetup('Queen','Testqueen');
const port=G.W.towns[5].name;
if(port[0]===' ') errs.push('L1: town[5] name has a leading space ('+JSON.stringify(port)+')');
if(/  /.test(port)) errs.push('L1: town[5] name has a double space ('+JSON.stringify(port)+')');
if(!/\S\sSeagate$/.test(port)) errs.push('L1: town[5] name is not a clean "<Word> Seagate" ('+JSON.stringify(port)+')');

// ---- L3: 4-week work pluralizes as "1 month" ----
let before=G.annals._chron.length;
G.annals.build('feast');   // feast is weeks:4 -> ceil(4/4.3)=1
const monthLine=G.annals._chron.slice(before).find(l=>/masons swear/.test(l))||'';
if(/\b1 months\b/.test(monthLine)) errs.push('L3: still emits "1 months": '+monthLine);
if(!/\b1 month\b/.test(monthLine)) errs.push('L3: did not emit "1 month": '+JSON.stringify(monthLine));

// ---- L2: King reign ruler lines are male/neutral; female NPC untouched ----
finishSetup('King','Testking');
const rulerCards=['cold-chair','bride','the-ward','cradle-crown','general-ford','two-heirs','the-widow'];
for(const id of rulerCards){
  const c=G.CARDS[id];
  for(let i=0;i<c.o.length;i++){
    delete G.S.seenCards[id];
    G.S.pendingCard={id,c};
    before=G.annals._chron.length;
    let threw=null; try{ G.resolveCard(i); }catch(e){ threw=e; }
    if(threw){ errs.push('L2: resolve '+id+'.'+i+' threw in King reign: '+threw); continue; }
    for(const line of G.annals._chron.slice(before)){
      // "The King ... her/she ..." would be a ruler-misgender leak.
      if(/\bThe King\b.*\b(her|she)\b/i.test(line)) errs.push('L2: ruler "her/she" leak in King reign ['+id+'.'+i+']: '+line);
    }
  }
}
// female NPC preserved: Mother Senna's "She buys lamp-oil" must survive a King reign untouched.
const writP=G.fixR(G.CARDS['writ'].p());
if(!/\bShe\b/.test(writP)) errs.push('L2: Mother Senna\'s "She" was wrongly rewritten in King reign: '+writP);

console.log('port:', JSON.stringify(port), '| monthLine:', JSON.stringify((monthLine.match(/masons swear[^,]*/)||[''])[0]));
console.log(errs.length ? ('FAIL:\n  '+errs.join('\n  ')) : 'PASS: L1 port name clean, L3 "1 month" pluralized, L2 King ruler lines de-gendered + female NPC preserved.');
process.exit(errs.length?1:0);

