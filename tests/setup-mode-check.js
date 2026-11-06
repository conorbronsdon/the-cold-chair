// tests/setup-mode-check.js — regression for the v0.27.1 setup-mode-wiring bugfix.
//
// THE BUG (browser-only): the old one-screen setup showed BOTH route toggles AND both
// throne buttons at once, with crown as the silent default. A player could click a throne
// ("Take the throne as King") without ever committing to a route, and begin a CROWN reign —
// cold-chair opener, crown option text — even when they meant to climb. (The sim/gating was
// correct; the defect was the setup screen letting a reign start in an unchosen mode.)
//
// THE FIX: a two-step setup — pick the ROUTE first (The Crown vs Minor-Noble Regency), then
// name+title WITHIN that route. No throne button exists until the mode is locked.
//
// This test drives the REAL setup DOM (a functional stub with event handlers + attribute
// querying, unlike the harness which calls finishSetup directly) and the tick/showCard render
// path, and asserts:
//   [1] route→mode wiring: the noble route locks S.mode='noble' before the opening card
//   [2] noble browser-start draws the noble opener (nb-first-suit), NOT crown cold-chair
//   [3] showCard resolves oN in the browser render path (an oN card shows noble option text)
//   [4] crown route is unaffected (cold-chair opener, crown option text)
//   [5] there is no way to reach a throne button before a route is chosen (structural guarantee)
'use strict';
const fs=require('fs'), path=require('path');

/* ---------- functional DOM stub: real listeners, [data-*]/tag querying, className ---------- */
function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){
  const el={ tag, children:[], parent:null, dataset:{}, textContent:'', value:'', className:'', _html:'',
    style:{cssText:''}, _cls:new Set(), _listeners:{},
    classList:{ add(c){el._cls.add(c);}, remove(c){el._cls.delete(c);},
      toggle(c,on){ if(on===undefined)on=!el._cls.has(c); on?el._cls.add(c):el._cls.delete(c); return on;}, contains(c){return el._cls.has(c);} },
    appendChild(c){ c.parent=el; el.children.push(c); return c; },
    removeChild(c){ const i=el.children.indexOf(c); if(i>=0)el.children.splice(i,1); c.parent=null; },
    remove(){ if(el.parent) el.parent.removeChild(el); },
    get firstChild(){ return el.children[0]; },
    addEventListener(ev,fn){ (el._listeners[ev]=el._listeners[ev]||[]).push(fn); },
    click(){ (el._listeners['click']||[]).forEach(fn=>fn({})); },
    setAttribute(){}, focus(){},
    querySelector(sel){ return el.querySelectorAll(sel)[0] || mkEl('q'); },
    querySelectorAll(sel){ const out=[]; const m=/^\[data-([a-z]+)\]$/.exec(sel);
      const walk=(n)=>{ for(const c of n.children){ if(m){ if(c.dataset[m[1]]!==undefined) out.push(c);} else if(c.tag===sel) out.push(c); walk(c);} };
      walk(el); return out; },
    set innerHTML(v){ el._html=v; el.children=[]; if(v==='<b></b><small></small>'){ el.appendChild(mkEl('b')); el.appendChild(mkEl('small')); } },
    get innerHTML(){ return el._html; } };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }

function boot(seed){
  const els={}; global.window=global;
  global.document={ getElementById(id){return els[id]||(els[id]=mkEl('div'));}, createElement(t){return mkEl(t);},
    createTextNode(t){const e=mkEl('#text');e.textContent=t;return e;}, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  global.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){throw new Error('reload');} };
  global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
  global.matchMedia=()=>({matches:false}); global.requestAnimationFrame=()=>{};
  let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
  code=code.replace("'use strict';",'') + '\nwindow.__G={S:S,W:W,CARDS:CARDS,tick:tick};';
  (0,eval)(code);
  return { G:global.__G, letter:els['map']&&els['letter'], els };
}

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  PASS '+m);} else {fail++;console.log('  FAIL '+m);} }
const seed='3030830';

// helpers over the setup panel
const choiceLabels=(letter)=>letter.children.filter(c=>c.className==='choice').map(c=>c.querySelector('b').textContent);
const clickChoice=(letter,txt)=>{ const b=letter.children.find(c=>c.className==='choice' && c.querySelector('b').textContent.indexOf(txt)>=0);
  if(!b) throw new Error('no choice button matching: '+txt); b.click(); };
function advanceToCard(G){ let g=0; while(G.S.week<3 && !G.S.pendingCard && g++<20) G.tick(); return G.S.pendingCard; }

/* ===== [5] structural: after showSetup(), only routes are offered — no throne button exists ===== */
{ console.log('\n[5] route screen offers no title/throne button before a route is chosen');
  const { els }=boot(seed); const letter=els['letter'];
  const labels=choiceLabels(letter);
  ok(labels.some(l=>l==='The Crown'), 'route screen shows "The Crown"');
  ok(labels.some(l=>l==='Minor-Noble (Regency)'), 'route screen shows "Minor-Noble (Regency)"');
  ok(!labels.some(l=>/throne as|Begin as/.test(l)), 'NO throne/title button present before a route is picked: '+JSON.stringify(labels));
}

/* ===== [1]+[2]+[3] noble route: mode locks, noble opener, oN render ===== */
{ console.log('\n[1..3] noble route → mode, opener, oN render');
  const { G, els }=boot(seed); const letter=els['letter'];
  clickChoice(letter,'Minor-Noble (Regency)');           // step 1: pick the noble route
  const step2=choiceLabels(letter);
  ok(step2.some(l=>/^Begin as Dame of /.test(l)), 'noble title step shows "Begin as Dame of <town>": '+JSON.stringify(step2));
  clickChoice(letter,'Begin as Dame of');                // step 2: take the seat
  ok(G.S.mode==='noble','[1] S.mode locked to noble by the route pick');
  ok(G.S.actions[0] && G.S.actions[0][1]==='m' && G.S.actions[0][2]==='noble','[1] [0,"m","noble"] logged first (replay intact)');
  const card=advanceToCard(G);
  ok(card && card.id==='nb-first-suit','[2] noble start draws nb-first-suit, not cold-chair (got '+(card&&card.id)+')');
  // [3] render path resolves oN: play to an oN card and confirm the DOM shows noble option text.
  let g=0, checkedON=false;
  while(G.S.week<400 && !G.S.over && g++<20000){
    G.tick();
    if(G.S.pendingCard){
      const c=G.S.pendingCard.c;
      const rendered=letter.children.filter(x=>x.className==='choice').map(x=>x.querySelector('b').textContent);
      if(c.oN && G.S.mode==='noble'){
        const nobleFirst=fixLike(c.oN[0].l);
        ok(rendered.length===c.oN.length && rendered[0]===nobleFirst,
          '[3] oN card "'+G.S.pendingCard.id+'" renders noble option text ("'+rendered[0]+'")');
        checkedON=true;
      }
      const first=letter.children.find(x=>x.className==='choice'); if(first) first.click(); else break;
      if(checkedON) break;
    }
  }
  ok(checkedON,'[3] reached an oN card in noble mode to verify the render path');
}

/* ===== [4] crown route unaffected: cold-chair opener + crown option text ===== */
{ console.log('\n[4] crown route → cold-chair opener + crown option text');
  const { G, els }=boot(seed); const letter=els['letter'];
  clickChoice(letter,'The Crown');
  const step2=choiceLabels(letter);
  ok(step2.some(l=>l==='Take the throne as Queen'),'crown title step shows "Take the throne as Queen": '+JSON.stringify(step2));
  clickChoice(letter,'Take the throne as Queen');
  ok(G.S.mode==='crown','[4] S.mode is crown');
  ok(!(G.S.actions[0] && G.S.actions[0][1]==='m'),'[4] no ["m"] action logged for a crown reign (byte-identical log)');
  const card=advanceToCard(G);
  ok(card && card.id==='cold-chair','[4] crown start draws cold-chair (got '+(card&&card.id)+')');
  const rendered=letter.children.filter(x=>x.className==='choice').map(x=>x.querySelector('b').textContent);
  ok(rendered[0]===fixLike(card.c.o[0].l),'[4] crown card renders crown option text ("'+rendered[0]+'")');
}

/* fixR mangles a couple of glyphs; mirror only what matters for these labels (they have none),
   so an identity mapping is correct here — kept as a hook if labels gain fixR glyphs later. */
function fixLike(s){ return s; }

console.log('\n==== '+pass+' passed, '+fail+' failed ====');
process.exit(fail?1:0);

