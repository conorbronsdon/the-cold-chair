// cipher-check.js — v0.69.0 "The Cipher in the Margin".
// The darkest orders (the Wood-Congregation, the Sworn of the Old Root) write their creeping marginalia in
// a cipher you cannot read until you have an informant inside (discovery 'named'/'exposed'); the cabal's
// venal ledger stays plain. Display-only: the cipher masks only the RENDERED <p>; the _chron stream keeps
// the plain line verbatim, so it is recoverable by replay and byte-identical for the harness (that byte-
// identity is proven OUTSIDE this file, by the cross-build harness diff). This file checks the feature fires.
// Usage: node tests/cipher-check.js
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
  '\nwindow.__G={S:S,W:W,annals:API,finishSetup:finishSetup,chronBody:chronBody,tickSocieties:tickSocieties,'
  +'socCipher:socCipher,socCreepLine:socCreepLine,decodeCipher:decodeCipher,socInformed:socInformed};';
(0,eval)(code);
const G=global.__G;
G.finishSetup('Queen','Cipher');
const S=G.S, cb=G.chronBody;

const errs=[];
const A=(cond,msg)=>{ if(!cond) errs.push(msg); };
const hasCls=(p,c)=> p && (''+p.className).split(/\s+/).indexOf(c)>=0;
// the last rendered <p> tagged to a given order (dark orders carry data-soc)
const lastSoc=(soc)=>{ for(let i=cb.children.length-1;i>=0;i--){ const p=cb.children[i];
  if(p && p.dataset && p.dataset.soc===soc) return p; } return null; };
// the last plain marginal whose text contains a needle (for the cabal, which sets no data-soc)
const lastMargText=(needle)=>{ for(let i=cb.children.length-1;i>=0;i--){ const p=cb.children[i];
  if(p && (''+p.className).indexOf('marg')>=0 && (''+p.textContent).indexOf(needle)>=0) return p; } return null; };

/* ============ §1 the cipher itself — atbash: self-inverse, letters only ============ */
console.log('§1 the cipher — atbash, self-inverse, non-letters untouched');
{
  const plain='The wood sings, softly — and the calendar does not have the day.';
  const enc=G.socCipher(plain);
  A(enc!==plain, 'the cipher changes the letters');
  A(G.socCipher(enc)===plain, 'the cipher is its own inverse (atbash)');
  A(/[—,]/.test(enc) && enc.indexOf(' ')>=0, 'punctuation, the em-dash and spaces pass through untouched');
  A(/^[^a-zA-Z]*[A-Za-z]/.test(enc), 'letters are transformed, not stripped');
}

/* ============ §2 a dark order's creep marginal renders enciphered while undiscovered ============ */
console.log('§2 a dark order (the Sworn of the Old Root) writes in cipher until you have an informant');
{
  const R=S.societies.restoration; R.discovery='unknown'; R.seen=[]; R.influence=24;
  const creep=G.socCreepLine('restoration',25);   // the stage-0 creep line
  const plain='['+creep+']';
  G.tickSocieties();                                // influence -> >=25, emits creep25
  const rp=lastSoc('restoration');
  A(!!rp, 'the dark-order creep marginal was rendered');
  A(hasCls(rp,'cipher'), 'the restoration creep <p> carries class cipher');
  A(rp && rp.dataset.plain===plain, 'the plaintext is kept off-ledger in data-plain');
  A(rp && rp.textContent===G.socCipher(plain) && rp.textContent!==plain, 'the rendered text is enciphered, not the plain line');
  // INVARIANT: the plain line reaches _chron verbatim (recoverable by replay; byte-identical for the harness)
  const chron=G.annals.chronicle(400);
  A(chron.some(l=>l.indexOf(creep)>=0), 'INVARIANT: the plaintext creep line is present verbatim in _chron');
  A(!chron.some(l=>l.indexOf(rp.textContent)>=0), 'the ciphered form never enters _chron');
}

/* ============ §3 the cabal is venal, not occult — it stays in plaintext ============ */
console.log('§3 the cabal (mundane corruption) is never enciphered');
{
  const C=S.societies.cabal; C.discovery='unknown'; C.seen=[]; C.influence=24;
  const creep=G.socCreepLine('cabal',25);
  G.tickSocieties();
  const cp=lastMargText(creep);
  A(!!cp, 'the cabal creep marginal was rendered');
  A(cp && !hasCls(cp,'cipher'), 'the cabal creep <p> is NOT enciphered');
  A(cp && (''+cp.textContent).indexOf(creep)>=0, 'the cabal marginal reads in plaintext');
  A(cp && !(cp.dataset && cp.dataset.soc), 'a plain order sets no data-soc');
}

/* ============ §4 an informant decodes the order's past hand, once ============ */
console.log('§4 an informant reads the order’s past hand back to you — decoded, with a reveal, idempotently');
{
  const rp=lastSoc('restoration');                  // the still-ciphered creep from §2
  const plain=rp.dataset.plain;
  S.societies.restoration.discovery='named';         // you place an informant inside
  G.tickSocieties();                                 // decodeCipher('restoration') runs
  A(!hasCls(rp,'cipher'), 'after the informant, the restoration <p> drops the cipher class');
  A(hasCls(rp,'decoded'), 'the decoded <p> is marked decoded');
  A(rp.textContent===plain, 'the decoded <p> now shows the plaintext');
  const reveals1=cb.children.filter(p=>hasCls(p,'reveal')).length;
  A(reveals1>=1, 'a reveal marginal was appended');
  A(cb.children.some(p=>hasCls(p,'reveal') && (''+p.textContent).indexOf('years it had been writing')>=0),
    'the reveal counts the years the hand had been writing');
  // idempotent: another tick decodes nothing new and appends no second reveal
  G.tickSocieties();
  const reveals2=cb.children.filter(p=>hasCls(p,'reveal')).length;
  A(reveals2===reveals1, 'the decode is idempotent — no second reveal on a later tick');
}

/* ============ §5 nothing leaks into state() ============ */
console.log('§5 the cipher is display-only — no marginalia text or bookkeeping key in state()');
{
  const stStr=JSON.stringify(G.annals.state());
  A(stStr.indexOf(G.socCipher('['+G.socCreepLine('congregation',25)+']'))<0, 'no ciphered text in state()');
  A(stStr.indexOf('"plain"')<0 && stStr.indexOf('"data-plain"')<0, 'no cipher bookkeeping key in state()');
  // the congregation was never given an informant, so its creep (if any) stays ciphered on the panel
  const gp=lastSoc('congregation');
  if(gp) A(hasCls(gp,'cipher')||hasCls(gp,'decoded'), 'the congregation marginal is a dark-order <p> (ciphered unless decoded)');
}

console.log('cipher errors:', errs.length ? errs : 'NONE');
process.exit(errs.length ? 1 : 0);

