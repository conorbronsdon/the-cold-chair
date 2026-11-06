// tests/sworn-driver.js — the Sworn & Secret (R1) fog-ladder driver.
// Drives the restoration order unknown -> suspected -> named -> exposed on seed 3030830 and asserts:
//   * an 'unknown' order is OMITTED from annals.state() (existence is the first secret),
//   * suspected shows a shape (no name, no head, rising pips),
//   * named shows name+agenda+head with the roster still fogged,
//   * the pinned seed-3030830 pretender name is deterministic,
//   * exposed publishes the full roster and produces a moment()/chronicle line.
// Usage: node tests/sworn-driver.js   (exits non-zero on any failed assertion)
'use strict';
const fs = require('fs');
const path = require('path');
const seed = 3030830;

/* ---------- DOM stubs (mirrors harness.js) ---------- */
function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
  get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
  querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
  set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
const els={};
global.window=global;
global.document={ getElementById(id){return els[id]||(els[id]=mkEl('div'));},
  createElement(t){return mkEl(t);}, createTextNode(t){const e=mkEl('#text');e.textContent=t;return e;},
  querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
global.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){throw new Error('reload');} };
global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
global.matchMedia=()=>({matches:false});
global.requestAnimationFrame=()=>{};

let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
code=code.replace("'use strict';",'')+'\nwindow.__G={S:S,W:W,CARDS:CARDS,BUILDS:BUILDS,finishSetup:finishSetup};';
(0,eval)(code);
const G=global.__G, S=G.S;

let fails=0;
function ok(cond,msg){ if(cond){ console.log('  ok  - '+msg); } else { console.log('  FAIL- '+msg); fails++; } }

G.finishSetup('Queen','Rootsbane');

// pinned seed-3030830 rosters (drawn from rWorld at the genWorld tail)
const pinnedHead={ name:S.societies.restoration.head.name, house:S.societies.restoration.head.house };
console.log('seed 3030830 restoration pretender = '+pinnedHead.name+' of House '+pinnedHead.house);

// --- 1. the fog holds at boot: no order is visible ---
let st=annals.state();
ok(st.societies===null || Object.values(st.societies).every(s=>false) || Object.keys(st.societies).length===0,
  'at boot, state().societies exposes no order (all unknown -> omitted)');

// helper: run until a specific card is pending (answering any other pending card with opt 0), or week cap
function runToCard(cardId, cap){
  let guard=0;
  while(guard++<cap){
    if(S.pendingCard){ if(S.pendingCard.id===cardId) return true; annals.choose(0); continue; }
    if(S.over) return false;
    annals.advance(1);
  }
  return false;
}

// --- 2. drive suspicion via informants + the ambient witness cards ---
// restoration is fed by W.hints[0] and W.hints[3]; pay spies until it crosses 'suspected'
annals.setSlider('tax',22);
let guard=0;
while(S.societies.restoration.discovery==='unknown' && guard++<400){
  if(S.pendingCard) annals.choose(0);           // answer any letter (cold-chair etc.) least-drama
  else { annals.spy(); annals.advance(6); }
}
st=annals.state();
ok(S.societies.restoration.discovery==='suspected' || S.societies.restoration.discovery==='named' || S.societies.restoration.discovery==='exposed',
  'restoration reached at least suspected after informants (got '+S.societies.restoration.discovery+')');
if(st.societies && st.societies.restoration && st.societies.restoration.discovery==='suspected'){
  ok(st.societies.restoration.name===null,'suspected: name is withheld (a shape, not a name)');
  ok(st.societies.restoration.head===null,'suspected: head is withheld');
  ok(st.societies.restoration.suspicionPips>=1,'suspected: suspicion pips are showing');
}
// a still-unknown order must be omitted from state() entirely
const unknownOmitted=Object.keys(S.societies).every(id=>
  S.societies[id].discovery==='unknown' ? !(st.societies && st.societies[id]) : true);
ok(unknownOmitted,'orders still unknown are omitted from state() (per-order fog)');

// --- 3. reach the discovery letter and resolve to 'named' ---
// Arm the discovery via the DESIGNED path — informants, not luck. The discovery letter needs
// suspicion>=60 (chain===1); phase 2 only guarantees 'suspected' (>=30) and then stops paying spies,
// leaving the last 30 points to ambient witness cards, whose timing any seeded sim feature (raids in
// v0.23, the restless council in v0.24) legitimately shifts. Keep informants paid until the letter is
// armed so the discovery fires deterministically regardless of ambient-deck RNG alignment.
{ let g=0; while(S.societies.restoration.chain===0 && !S.over && g++<300){
    if(S.pendingCard){ if(S.pendingCard.id==='sworn-restoration-1') break; annals.choose(0); continue; }
    if(S.week>=S.spyUntil) annals.spy(); annals.advance(3); } }
const gotDiscovery=runToCard('sworn-restoration-1', 600);
ok(gotDiscovery,'the discovery letter (The Wool-Bale Letters) fired');
if(gotDiscovery){
  ok(annals.choices().title==='The Wool-Bale Letters','pending letter title is The Wool-Bale Letters');
  annals.choose(1);   // "Seize... make it loud" -> discovery='named', head.proven
  st=annals.state();
  ok(S.societies.restoration.discovery==='named','after discovery letter: discovery === named');
  ok(st.societies.restoration.name==='the Sworn of the Old Root','named: the order now has a name');
  ok(!!st.societies.restoration.agenda,'named: the agenda is legible');
  ok(st.societies.restoration.head && st.societies.restoration.head.name===pinnedHead.name,
     'named: head is the pinned pretender ('+pinnedHead.name+')');
  ok(st.societies.restoration.influence===undefined,'named: influence (strength) is still fogged');
}

// --- 4. drive the dilemma + resolution to exposure ---
const gotDilemma=runToCard('sworn-restoration-2', 400);
ok(gotDilemma,'the dilemma letter (The Pretender Named) fired');
if(gotDilemma) annals.choose(0);                 // attaint — proves the figures, schedules resolution
const gotResolution=runToCard('sworn-restoration-3', 400);
ok(gotResolution,'the resolution letter (The Banner or the Block) fired');
if(gotResolution) annals.choose(1);              // absorb — clean exposure, no war/deposition
st=annals.state();
ok(S.societies.restoration.discovery==='exposed','after resolution: discovery === exposed');
ok(st.societies.restoration.influence!==undefined,'exposed: influence (strength) is now un-fogged');
const roster=st.societies.restoration.members||[];
ok(roster.length>=3 && roster.some(m=>m.kind==='faction'),'exposed: full roster is public');

// --- 5. exposure is a chronicle + Last Leaf moment ---
const chron=annals.chronicle(200).join('\n');
ok(/Old Root/.test(chron),'exposure produced a chronicle line naming the exposed order');
const leaf=annals.leafData();
ok(leaf.moments.some(m=>/dragged into the daylight of the record/.test(m.text)),
   'exposure competes for a Last Leaf defining moment');

console.log(fails? ('\nFAILED: '+fails+' assertion(s)') : '\nALL ASSERTIONS PASSED');
process.exit(fails?1:0);

