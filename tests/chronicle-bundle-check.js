// chronicle-bundle-check.js — v0.38.0 Chronicle Bundle feature test.
// Usage: node tests/chronicle-bundle-check.js   (run from repo root; reads game.js)
// Proves the four display features (Year's Rubric, Cut Leaf, Palimpsest, Concordance) are present and
// correct, AND that none of them leaked bookkeeping into state(). Byte-identity itself is proven OUTSIDE
// this file, by the cross-build harness diff — this file checks the features fire.
'use strict';
const fs = require('fs');
const path = require('path');
const seed = process.argv[2] || '3030830';
const planFile = process.argv[3] || path.join(__dirname, 'plans', 'smart-builder.json');
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const acts = (plan.actions || []).slice().sort((a, b) => a[0] - b[0]);

// DOM/canvas stubs — mirror leaf-check.js, but add tagName + lastChild so the render-layer DOM
// decoration (cut/palimpsest tagging) actually fires and can be asserted on.
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
  '\nwindow.__G={S:S,W:W,annals:API,finishSetup:finishSetup,chronBody:chronBody,chronCrown:chronCrown,composeConcordance:composeConcordance,yearEpithet:yearEpithet,momentEpithet:momentEpithet,yearsTOC:yearsTOC,endGame:endGame,yearHdrEls:yearHdrEls,yearNum:yearNum};';
(0,eval)(code);
const G=global.__G;
G.finishSetup(plan.ruler?plan.ruler[0]:'Queen', plan.ruler?plan.ruler[1]:'Testrun');

// drive a normal reign to accumulate moments / years / council holders / societies
let guard=0;
while(G.S.week<1040 && !G.S.over && guard++<30000){
  while(acts.length && acts[0][0]<=G.S.week && acts[0][1]!=='c'){ const a=acts.shift();
    if(a[1]==='s') G.annals.setSlider(a[2],a[3]);
    else if(a[1]==='b') G.annals.build(a[2]);
    else if(a[1]==='y') G.annals.spy(); }
  if(G.S.pendingCard){ const id=G.S.pendingCard.id; const ci=acts.findIndex(x=>x[1]==='c'&&x[2]===id);
    if(ci>=0){ const a=acts.splice(ci,1)[0]; G.annals.choose(a[3]); }
    else { const n=G.S.pendingCard.c.o.length; G.annals.choose(0); } }
  G.annals.advance(1);
}

const errs=[];
const A=(cond,msg)=>{ if(!cond) errs.push(msg); };
const S=G.S, W=G.W, cb=G.chronBody;

// ---------- R: The Year's Rubric ----------
// classifier returns an authored monk-voice phrase for a known-heavy moment
A(G.momentEpithet('They burned '+W.wood+' from three sides in one night')==='the Year the Wood Woke','R: wood-woke classifier');
A(/^the Year/.test(G.momentEpithet('The Great Weir was raised across the vale')||''),'R: wonder classifier gives a Year-name');
// inject a synthetic heavy + quiet year into an unused-year slot and probe yearEpithet
const probeY=9000;
S._moments.push({text:'They burned '+W.wood+' from three sides in one night', weight:10, week:probeY*52, year:probeY});
S._moments.push({text:'A canal was cut', weight:3, week:(probeY+1)*52, year:probeY+1});
A(typeof G.yearEpithet(probeY)==='string' && G.yearEpithet(probeY).length>0,'R: heavy year earns an epithet');
A(G.yearEpithet(probeY+1)===null,'R: quiet year (below floor) earns no epithet');
S._moments.pop(); S._moments.pop();
// a real closed year's header <p class="yr"> should carry the epithet dash after it closed
const yrHdrs=cb.children.filter(p=>p && p.className==='yr');
A(yrHdrs.length>=2,'R: multiple year headers rendered');
const named=yrHdrs.filter(h=>(''+h.textContent).indexOf(' — ')>=0 || h.children.some(c=>c.className==='epithet'));
A(named.length>=1,'R: at least one closed year got its epithet on the panel');
// leaf TOC
const leaf=G.annals.leafData();
A(Array.isArray(leaf.rubrics) && leaf.rubrics.length===(leaf.years[1]-leaf.years[0]+1),'R: rubrics TOC covers every year');
A(leaf.rubrics.every(r=>typeof r.year==='number' && (r.epithet===null||typeof r.epithet==='string')),'R: rubrics shape {year,epithet}');

// ---------- C: The Cut Leaf ----------
// non-gild branch: _chron still gets the truth verbatim; the <p> is masked; S._cutLog logs off-ledger
S.flags.gildUntil=0;   // ensure the non-gild path so we can assert the TRUTH reaches _chron
const cutBefore=(S._cutLog||[]).length, chronBefore=G.annals.chronicle(400).length;
G.chronCrown('THE-CUT-TRUTH the Crown did a shameful thing','A gilded lie',{cut:'blood'});
const chronNow=G.annals.chronicle(400);
A(chronNow.some(l=>l.indexOf('THE-CUT-TRUTH the Crown did a shameful thing')>=0),'C: cut deed truth is PRESENT verbatim in _chron (INVARIANT C)');
A(chronNow.length===chronBefore+1,'C: exactly one _chron push for a cut deed');
const cutP=cb.lastChild;
A(cutP && (''+cutP.className).indexOf('cut')>=0,'C: cut <p> carries class cut');
A(cutP && typeof cutP.dataset.stub==='string' && cutP.dataset.stub.length>0,'C: cut <p> carries a stub');
A((S._cutLog||[]).length===cutBefore+1,'C: S._cutLog got an entry');
const lc=S._cutLog[S._cutLog.length-1];
A(lc && typeof lc.year==='number' && typeof lc.week==='number' && lc.cls==='blood','C: cutLog entry shape {year,week,cls}');

// gild+cut branch: force gilding on, cut a gilded deed, run its scheduled correction, assert it too is masked
S.monk=S.monk||{name:'Aldric',disp:50,gilded:0}; S.flags.gildUntil=S.week+200; S.flags.gildYear=0;
const schedBefore=S.schedule.length;
G.chronCrown('THE-GILT-TRUTH another shameful thing','The record, made flattering',{cut:'blood'});
const cutGildP=cb.lastChild;
A(cutGildP && (''+cutGildP.className).indexOf('cut')>=0,'C: gilded+cut deed <p> is cut on the panel');
A(G.annals.chronicle(400).some(l=>l.indexOf('The record, made flattering')>=0),'C: gilded line still in _chron for a cut deed');
// fire the just-scheduled correction manually
const sched=S.schedule.slice(schedBefore).pop();
if(sched && typeof sched.fn==='function') sched.fn();
const corrP=cb.lastChild;
A(corrP && (''+corrP.className).indexOf('cut')>=0,'C: the later-hand correction of a cut deed is ALSO masked');
A(G.annals.chronicle(400).some(l=>l.indexOf('THE-GILT-TRUTH another shameful thing')>=0),'C: correction truth still in _chron (recoverable by replay)');

// ---------- P: The Palimpsest ----------
S.flags.gildYear=0;
const schedB2=S.schedule.length;
G.chronCrown('A plain truth here','A gilded version here');   // gild, NOT cut
const s2=S.schedule.slice(schedB2).pop();
if(s2 && typeof s2.fn==='function') s2.fn();
const palP=cb.lastChild;
A(palP && (''+palP.className).indexOf('palimpsest')>=0,'P: a corrected gild carries class palimpsest');
A(palP && palP.dataset.gild && palP.dataset.gild.indexOf('A gilded version here')>=0,'P: palimpsest <p> carries data-gild = the gilded text');
// gilds still expose the three layers (regression)
const gl=G.annals.leafData().gilds.find(x=>x.gilded && x.gilded.indexOf('A gilded version here')>=0);
A(gl && 'gilded' in gl && 'truth' in gl && 'correction' in gl,'P: leafData().gilds still exposes {gilded,truth,correction}');

// ---------- X: The Concordance ----------
const conc=G.composeConcordance();
A(Array.isArray(conc) && conc.length>0,'X: concordance is a non-empty array');
A(conc.some(e=>e.key.indexOf('SENNA')>=0),'X: concordance contains SENNA');
A(conc.every(e=>e.key && e.key.length>0),'X: no empty concordance key');
A(conc.every(e=>Array.isArray(e.years) && e.years.every(y=>typeof y==='number')),'X: every entry.years is a number[]');
A(conc.every(e=>e.years.every((y,i)=> i===0 || y>=e.years[i-1])),'X: every entry.years is sorted');
const sY=leaf.years[0], eY=leaf.years[1];
A(conc.every(e=>e.years.every(y=> y>=sY && y<=eY)),'X: every concordance year is within [startY,endY]');
A('concordance' in leaf && Array.isArray(leaf.concordance),'X: leafData().concordance present');

// ---------- STATE INVARIANT (load-bearing in-file assertion) ----------
const stStr=JSON.stringify(G.annals.state());
// none of the new bookkeeping keys may appear AS KEYS (quoted) — realm prose legitimately contains
// words like "Concord", so we match the field names, not bare substrings.
['"cuts"','"concordance"','"rubrics"','"_cutLog"','"_moments"','"_gildLog"','"yearHdrEls"'].forEach(k=>{
  A(stStr.indexOf(k)<0,'STATE: '+k+' leaked into state() JSON');
});
const st=JSON.parse(stStr);
A(typeof st._cutLog==='undefined','STATE: state()._cutLog is undefined');
A(typeof st.concordance==='undefined','STATE: state().concordance is undefined');
A(typeof st.rubrics==='undefined','STATE: state().rubrics is undefined');

// ---------- R (v0.68.1): the FINAL year is titled at reign end too ----------
// relabelYear fires only when the NEXT year opens (chron), so before this fix a reign's last year never
// earned its name on the panel — only in the leaf TOC. endGame now calls relabelYear(lastYearHdr). Force a
// clean end with a guaranteed-heavy final year, and assert the last header carries its epithet.
{
  const finalY=G.yearNum();
  S._moments.push({text:'They burned '+W.wood+' from three sides in one night', weight:12, week:S.week, year:finalY});
  S.over=null;                       // allow endGame to run once (the driven reign may already be over)
  G.endGame('endured');
  const finalHdr=G.yearHdrEls[finalY];
  A(!!finalHdr,'R: the final year has a rendered header at reign end');
  A(finalHdr && ((''+finalHdr.textContent).indexOf(' — ')>=0 || finalHdr.children.some(c=>c && c.className==='epithet')),
    'R: the final year is titled on the panel at reign end (v0.68.1 gap fix)');
}

console.log('plan:', path.basename(planFile), '| over:', S.over, '| week:', S.week);
console.log('year headers:', yrHdrs.length, '| named years:', named.length, '| cutLog:', (S._cutLog||[]).length, '| concordance entries:', conc.length);
console.log('chronicle-bundle errors:', errs.length ? errs : 'NONE');
process.exit(errs.length ? 1 : 0);

