// reading-check.js — headless assertions for v0.53.0 "The Reading Aloud" (the parts that aren't
// timer/render-driven; the film playback itself is covered by tests/reading-smoke.js in a real browser).
// The film re-runs a history link forward for the eye only: it neither re-logs nor saves, keeps the true
// log intact so the closing Leaf can still share, and is entered ONLY by a boot-time link — so the sim
// and the harness are wholly untouched (the plan sweep proves 0/28).
// Usage: node tests/reading-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed){
  const els = {};
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
    el.getContext=()=>new Proxy({},{get:(t,p)=>(p in t?t[p]:()=>{}),set:(t,p,v)=>{t[p]=v;return true;}}); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed, origin:'https://coldchair.example', pathname:'/', reload(){} };
  const mem={};
  sandbox.localStorage={ getItem:k=>(k in mem?mem[k]:null), setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; } };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.navigator={};
  sandbox.btoa=x=>Buffer.from(x,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,startReading:startReading,readingLink:readingLink,'
    + 'logAction:logAction,historyLink:historyLink,filmDrive:filmDrive,continueAsHeir:continueAsHeir,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  sandbox.__G._mem=mem;   // the localStorage backing store, so a test can assert what was actually WRITTEN
  return sandbox.__G;
}

/* ============ §1 the film link ============ */
console.log('§1 the film link: an ordinary history link, marked to open as a film');
{
  const G=bootstrap(3030830); G.finishSetup('Queen','Reel','crown');
  const l=G.readingLink();
  ok(l.indexOf('&read=1')===l.length-7, 'the reading link is the history link plus &read=1');
  ok(l.indexOf('#s=3030830')>=0 && l.indexOf('h=')>=0, 'it still carries the seed and the log');
}

/* ============ §2 startReading sets up the film without disturbing the log ============ */
console.log('§2 startReading: applies the setup, keeps the true log, enters film mode');
{
  const G=bootstrap(3030830);
  const data={ r:{title:'Queen',name:'Cine'},
    a:[[0,'d','iron'],[3,'s','tax',20],[5,'c','cold-chair',0],[9,'c','writ',1]], w:520 };
  G.startReading(data);
  ok(G.S.reading && G.S.reading.targetW===520, 'the film is live, aimed at the reign’s end week');
  ok(G.S.chair==='iron', 'the chair (a week-0 setup action) was applied by finishSetup');
  ok(G.S.reading.log.every(a=>!(a[0]===0 && a[1]==='d')), 'the week-0 setup action is not in the film’s forward log (finishSetup already ran it)');
  ok(G.S.reading.log.some(a=>a[1]==='c' && a[2]==='cold-chair'), 'the letters remain in the forward log, to be answered as they arrive');
  ok(G.S.actions.length===4, 'the TRUE, whole log is kept on S.actions so the closing Leaf can still share it');
  ok(G.S.ruler.name==='Cine', 'the ruler is seated for the telling');
}

/* ============ §3 a film neither re-logs nor saves ============ */
console.log('§3 the film is for the eye only: no re-logging, no saving over the player’s reign');
{
  const G=bootstrap(3030830);
  G.startReading({ r:{title:'Queen',name:'Quiet'}, a:[[0,'d','cold'],[5,'c','cold-chair',0]], w:200 });
  const before=G.S.actions.length;
  G.logAction([99,'c','some-card',1]);   // the sim would call this while re-running; the film must swallow it
  ok(G.S.actions.length===before, 'logAction is a no-op during a film — the log is never doubled');
  // This assertion used to read `!('cold-chair-daily' in (G.S._m||{}))`. `S._m` exists NOWHERE in the game
  // — zero occurrences in game.js — so `G.S._m||{}` was always `{}`, `'x' in {}` was always false, and the
  // assertion was always true. It was also aimed at the wrong place: the week's-chair ledger is not state at
  // all, it is localStorage under `cold-chair-weekly` (see weekLedger()). A test written so it cannot fail is
  // worse than no test, because it reports the guarantee as checked (issue #7). Now it asserts against the
  // sandbox's real localStorage backing store, and it can fail.
  ok(G._mem && !('cold-chair-weekly' in G._mem),
     'no week-ledger write leaks from the film (localStorage keys written: '
     +(Object.keys(G._mem||{}).join(', ')||'none')+')');
}

/* ============ §4 the film traverses a succession (a watched multi-reign film must not stop at the first death) ============ */
console.log('§4 the film advances past a ruler’s death: filmDrive consumes the log’s ’h’ like replay/skip do');
{
  const G=bootstrap(3030830); G.finishSetup('Queen','Span','crown');
  // a reign that ended and continued as heir: the log carries an 'h' at the death week
  G.S.week=1040; G.S.over='endured';
  G.S.reading={ log:[[1040,'h','endured']], targetW:2080, cardAt:0, cardId:null, paused:false, ended:false, first:false };
  G.filmDrive(1000);
  ok(G.S.over===null, 'on the death week the film consumed the ’h’ and cleared S.over (it did NOT just finish)');
  ok(!G.S.reading.ended, 'the film did not call readingFinish at the first death');
  ok(G.S.reading.log.every(a=>a[1]!=='h'), 'the ’h’ was taken from the forward log (the heir reign now plays on)');
  // and a genuine end (no more 'h') DOES finish
  const H=bootstrap(3030830); H.finishSetup('Queen','End','crown');
  H.S.week=1040; H.S.over='endured';
  H.S.reading={ log:[], targetW:1040, cardAt:0, cardId:null, paused:false, ended:false, first:false };
  H.filmDrive(1000);
  ok(H.S.reading.ended, 'with no succession left in the log, the film closes on the Leaf');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

