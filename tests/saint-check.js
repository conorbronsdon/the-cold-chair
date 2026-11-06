// saint-check.js — v0.70.0 "The Saint's Life".
// The monk's REGISTER bends with the realm's piety: a defining moment (weight>=9) under a devout crown
// (piety>=60, or a fresh act of devotion still warm) earns a hagiographic marginal; under an impious one
// (piety<20) a hostile aside; a middling reign keeps the plain register (nothing fires). Display-only, the
// ghost idiom: the gloss is a <p> appended STRAIGHT to chronBody, never through chron()/marg(), so the
// _chron stream and state() are untouched and the harness is byte-identical (proven by the cross-build
// harness diff, not here). At most one gloss a year. This file checks the register fires as specified.
// Usage: node tests/saint-check.js
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
  '\nwindow.__G={S:S,W:W,annals:API,finishSetup:finishSetup,chronBody:chronBody,moment:moment,'
  +'monkName:monkName,yearNum:yearNum,SAINT_GLOSS:SAINT_GLOSS,HOSTILE_GLOSS:HOSTILE_GLOSS};';
(0,eval)(code);
const G=global.__G;
G.finishSetup('Queen','Saint');
const S=G.S, cb=G.chronBody;

const errs=[];
const A=(cond,msg)=>{ if(!cond) errs.push(msg); };
const hasCls=(p,c)=> p && (''+p.className).split(/\s+/).indexOf(c)>=0;
const glossCount=(cls)=> cb.children.filter(p=>hasCls(p,cls)).length;
const lastCls=(cls)=>{ for(let i=cb.children.length-1;i>=0;i--) if(hasCls(cb.children[i],cls)) return cb.children[i]; return null; };
// drive one moment in a controlled year with a controlled piety, and report the saint/sour deltas
function fire(year, piety, weight, devoutUntil){
  S.week=52*(year-30); S.piety=piety; S.devoutUntil=devoutUntil||0;
  const s0=glossCount('saint'), r0=glossCount('sour');
  G.moment('The '+G.W.wood+' burned from three sides in one night', weight);
  return { saint:glossCount('saint')-s0, sour:glossCount('sour')-r0 };
}

/* ============ §1 a devout crown earns a hagiographic marginal ============ */
console.log('§1 a devout reign (piety high) reframes a defining moment as a trial');
{
  const d=fire(35, 72, 10);
  A(d.saint===1 && d.sour===0, 'a devout defining moment adds one saint gloss (got saint '+d.saint+', sour '+d.sour+')');
  const p=lastCls('saint');
  A(p && (''+p.textContent).charAt(0)==='[', 'the gloss is a bracketed marginal');
  const norm = p ? p.textContent.slice(1,-1).replace(G.monkName(),'{m}') : '';
  A(G.SAINT_GLOSS.indexOf(norm)>=0, 'the gloss is drawn verbatim from the hagiographic pool');
  A(!/\{m\}/.test(''+p.textContent), 'the {m} placeholder was filled with the monk’s name');
}

/* ============ §2 an impious crown earns a hostile aside ============ */
console.log('§2 an impious reign (piety low) earns the inverse register');
{
  const d=fire(36, 10, 10);
  A(d.sour===1 && d.saint===0, 'an impious defining moment adds one sour gloss (got saint '+d.saint+', sour '+d.sour+')');
  const p=lastCls('sour');
  const norm = p ? p.textContent.slice(1,-1).replace(G.monkName(),'{m}') : '';
  A(G.HOSTILE_GLOSS.indexOf(norm)>=0, 'the gloss is drawn verbatim from the hostile pool');
}

/* ============ §3 a middling reign keeps the plain register ============ */
console.log('§3 a middling reign is unchanged — no gloss fires');
{
  const d=fire(37, 40, 10);
  A(d.saint===0 && d.sour===0, 'a middling-piety moment adds no gloss (the game as told is unchanged)');
}

/* ============ §4 only a DEFINING moment earns a gloss ============ */
console.log('§4 the weight gate — an ordinary moment earns nothing, however devout');
{
  const d=fire(38, 80, 5);
  A(d.saint===0 && d.sour===0, 'a low-weight moment earns no gloss even at high piety');
}

/* ============ §5 at most one gloss a year ============ */
console.log('§5 the register speaks once a year, not once a moment');
{
  const d1=fire(39, 75, 11);
  A(d1.saint===1, 'the first defining moment of a devout year glosses');
  // a second defining moment the SAME year (no week change to a new year) must not gloss again
  S.piety=75; const s0=glossCount('saint');
  G.moment('The Great Weir was raised across the vale', 12);
  A(glossCount('saint')-s0===0, 'a second defining moment the same year does not gloss again');
}

/* ============ §6 a fresh act of devotion counts as devout even at low piety ============ */
console.log('§6 devoutUntil (a recent pilgrimage/relic/chantry) reads as devout, and takes precedence');
{
  const d=fire(40, 12, 10, /*devoutUntil*/52*(40-30)+20);
  A(d.saint===1 && d.sour===0, 'a low-piety moment while devotion is still warm glosses SAINT, not sour (got saint '+d.saint+', sour '+d.sour+')');
}

/* ============ §7 display-only — nothing reaches _chron or state() ============ */
console.log('§7 the register is display-only — no gloss text in _chron or state()');
{
  const chron=G.annals.chronicle(400).join(' | ');
  A(chron.indexOf('winnowed and not abandoned')<0 && chron.indexOf('score the vellum')<0,
    'no gloss line appears in the _chron stream');
  const st=JSON.stringify(G.annals.state());
  A(st.indexOf('winnowed and not abandoned')<0 && st.indexOf('score the vellum')<0, 'no gloss line appears in state()');
}

console.log('saint gloss totals — saint:', glossCount('saint'), 'sour:', glossCount('sour'));
console.log('saint errors:', errs.length ? errs : 'NONE');
process.exit(errs.length ? 1 : 0);

