// forge-check.js — v0.71.0 "The Forged Charter".
// The scriptorium can MANUFACTURE history: an opt-in work (the heirhall idiom — a logged 'b', a card answer
// logged 'c'; NO new action letter, so replay/sanitize/filmDrive need no new registration and a reign that
// never forges is byte-identical, proven OUTSIDE this file by the cross-build harness diff). A fabrication
// arms a concrete benefit now and schedules its own exposure; exposed, it collapses what it propped up.
// This file checks the mechanics, state()/leaf surfacing, and that an unused forge leaves state() clean.
// Usage: node tests/forge-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const seed = process.argv[2] || '3030830';

function stubCtx(){ return new Proxy({}, { get:(t,p)=> p in t ? t[p] : ()=>{}, set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){ const el={ tag, get tagName(){return (''+tag).toUpperCase();},
  children:[],style:{cssText:''},dataset:{},textContent:'',value:'',className:'',
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
  get firstChild(){return el.children[0];}, get lastChild(){return el.children[el.children.length-1];},
  addEventListener(){}, setAttribute(){}, focus(){},
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
  '\nwindow.__G={S:S,W:W,annals:API,finishSetup:finishSetup,BUILDS:BUILDS,CARDS:CARDS,'
  +'armForge:armForge,collapseForge:collapseForge,cardQ:cardQ};';
(0,eval)(code);
const G=global.__G;
G.finishSetup('Queen','Forge');
const S=G.S;

const errs=[];
const A=(cond,msg)=>{ if(!cond) errs.push(msg); };
const clearForge=()=>{ delete S.flags.forge; };
// run any schedule entries added since `n`, returning how many fired
const fireNewSchedule=(n)=>{ const add=S.schedule.slice(n); add.forEach(s=>s.fn()); return add.length; };

/* ============ §1 the work: crown-only, once a reign ============ */
console.log('§1 the work — crown only, once a reign');
{
  A(G.BUILDS.forge && G.BUILDS.forge.n==='Forge a Charter', 'the Forge a Charter work exists');
  clearForge(); S.mode='crown';
  A(G.BUILDS.forge.can()===true, 'a crown with no standing forge may forge');
  S.flags.forge={armed:false};
  A(G.BUILDS.forge.can()===false, 'once a charter is in hand, the work is spent for the reign');
  clearForge(); S.mode='noble';
  A(G.BUILDS.forge.can()===false, 'a climbing knight has no scriptorium to forge from');
  S.mode='crown';
}

/* ============ §2 completion wiring — do() sets up the choice card ============ */
console.log('§2 on completion the work offers the fabrication choice');
{
  clearForge(); const n=S.schedule.length; G.cardQ.length=0;
  G.BUILDS.forge.do();
  A(S.flags.forge && S.flags.forge.armed===false, 'do() marks a forge in progress, not yet armed');
  A(S.schedule.length===n+1, 'do() schedules the choice card');
  fireNewSchedule(n);
  A(G.cardQ.indexOf('forge-charter')>=0, 'the forge-charter choice card is queued');
}

/* ============ §3 arm — a claimed descent props up legitimacy ============ */
console.log('§3 arming a descent — legitimacy now, exposure scheduled');
{
  clearForge(); S.legit=50; const court0=S.factions.court.disp; const n=S.schedule.length;
  G.armForge('descent');
  A(S.legit===59, 'a forged descent arms +9 legitimacy (got '+S.legit+')');
  A(S.factions.court.disp===court0+3, 'the court warms to a settled succession');
  A(S.flags.forge.kind==='descent' && S.flags.forge.armed===true && S.flags.forge.exposed!==true, 'the forge is armed as a descent');
  A(S.schedule.length===n+1, 'an exposure is scheduled');
  const d=S.schedule[S.schedule.length-1].week - S.week;
  A(d>=130 && d<=260, 'exposure lands 2.5–5 years on (got '+d+' weeks)');
}

/* ============ §4 arm — a claimed victory sways court and the wider world ============ */
console.log('§4 arming a victory — court, world, and a little legitimacy');
{
  clearForge(); S.legit=50; const c0=S.factions.court.disp, w0=S.factions.world.disp;
  G.armForge('victory');
  A(S.factions.court.disp===c0+6 && S.factions.world.disp===w0+6, 'a forged victory warms the court and the wider world (+6 each)');
  A(S.legit===54, 'a forged victory arms +4 legitimacy');
  A(S.flags.forge.kind==='victory' && S.flags.forge.armed, 'the forge is armed as a victory');
}

/* ============ §5 state() and the Last Leaf surface a standing forgery; a clean reign shows nothing ============ */
console.log('§5 state()/leaf surface a forgery only when one stands');
{
  clearForge(); G.armForge('descent');
  const st=G.annals.state();
  A(st.forge && st.forge.kind==='descent' && st.forge.armed===true && st.forge.exposed===false, 'state() surfaces an armed forge');
  const leaf=G.annals.leafData();
  A(leaf.forge && leaf.forge.kind==='descent' && leaf.forge.exposed===false && typeof leaf.forge.year==='number', 'the Last Leaf records the forgery');
  clearForge();
  const st2=G.annals.state();
  A(typeof st2.forge==='undefined', 'a reign that forged nothing emits no forge key in state()');
  A(G.annals.leafData().forge===null, 'and no forge entry on the Leaf');
}

/* ============ §6 exposure and collapse — what it propped up comes down ============ */
console.log('§6 a later hand exposes it, and the claim collapses');
{
  clearForge(); S.legit=60; const n=S.schedule.length; G.cardQ.length=0;
  G.armForge('descent');                    // legit -> 69, schedules exposure
  A(S.legit===69, 'descent armed to 69');
  fireNewSchedule(n);                        // fire the exposure schedule
  A(G.cardQ.indexOf('forgery-exposed')>=0, 'the exposure queues the forgery-exposed card while armed and un-exposed');
  const ch0=S.factions.church.disp;
  G.collapseForge('deny');
  A(S.flags.forge.exposed===true && S.flags.forge.armed===false, 'the forge is marked exposed, no longer armed');
  A(S.legit===69-14, 'denying the exposure collapses the propped legitimacy and pays for the lie (69 → '+S.legit+')');
  A(S.factions.church.disp===ch0-6, 'the church cools on a crown caught lying');
}

/* ============ §7 the guards — a reign that ended, or a forgery already down, exposes nothing ============ */
console.log('§7 the exposure no-ops when the reign is over or the forge is gone (got-away-with-it)');
{
  clearForge(); const n=S.schedule.length; G.cardQ.length=0;
  G.armForge('victory');
  S.over='endured';                          // the reign ended before the later hand came
  fireNewSchedule(n);
  A(G.cardQ.indexOf('forgery-exposed')<0, 'a reign that ended before exposure got away with the forgery');
  S.over=null;
  // and a succession clearing S.flags leaves the scheduled closure a harmless no-op
  const n2=S.schedule.length; G.armForge('descent'); G.cardQ.length=0;
  clearForge();                              // succession does S.flags={}
  fireNewSchedule(n2);
  A(G.cardQ.indexOf('forgery-exposed')<0, 'a forgery whose flags were cleared at succession is not re-exposed');
}

/* ============ §8 the card f()s are wired to the arm/collapse verbs ============ */
console.log('§8 the choice and exposure cards call the right verbs');
{
  const fc=G.CARDS['forge-charter'];
  A(fc && fc.o.length===3, 'the forge-charter card offers descent, victory, and burn');
  clearForge(); S.legit=40; fc.o[0].f();
  A(S.flags.forge && S.flags.forge.kind==='descent' && S.legit===49, 'option 0 forges a descent');
  clearForge(); S.legit=40; fc.o[2].f();
  A(S.flags.forge && S.flags.forge.burned && !S.flags.forge.armed && S.legit===40, 'the burn option enters nothing and arms nothing');
  const fe=G.CARDS['forgery-exposed'];
  A(fe && fe.o.length===2 && typeof fe.o[0].f==='function' && typeof fe.o[1].f==='function', 'the exposure card offers deny and retire');
}

console.log('forge errors:', errs.length ? errs : 'NONE');
process.exit(errs.length ? 1 : 0);

