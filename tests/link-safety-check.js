// tests/link-safety-check.js — a shared link is a stranger's JSON (issue #9).
//
// Every history link, saved slot and browser save reaches the game as decoded JSON that someone else
// may have written by hand. `sanitizeHistory` is the single door all of them come through, and this
// test owns its contract. What a crafted link could do before it existed:
//
//   [A] pin the tab. `replay()`'s only bound was `while(guard++<300000)`. A ~14KB link of
//       `[999999999,"h","endured"]` × 400 drove the reign to week 266,434 and minted ~300k chronicle
//       elements: the 'h' lookup ignored the week, so a far-future 'h' resurrected the reign past
//       S.over indefinitely. A NaN week is the same loop by another road — it never satisfies
//       `w <= S.week`, so it sits at the head of the queue while the loop ticks to its guard.
//   [B] write arbitrary state. 's' (the sliders) applied as a bare `S[key]=value`, so a link could set
//       any property on S to anything — `S.gold=1e9`, or a string where the sim expects an array.
//
// Asserts:
//   [1] a log longer than LINK_MAX_ACTIONS is clipped to the cap
//   [2] non-finite / negative / absurd weeks are dropped (NaN, Infinity, -1, 1e9)
//   [3] the 'h' lookup is week-aware in all three drive loops (replay / filmDrive / readingSkip)
//   [4] 's' is an allowlist: only tax/toll/tithe/pay, only within the inputs' own ranges
//   [5] unknown action types are dropped
//   [6] an honest log is passed through byte-identically — the caps never touch real play
//   [7] end to end: the reported payload replays to a bounded week instead of spinning
'use strict';
const fs=require('fs'), path=require('path');

function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){
  const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
    classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
    appendChild(c){ el.children.push(c); return c; },
    removeChild(c){ const i=el.children.indexOf(c); if(i>=0)el.children.splice(i,1); },
    get firstChild(){ return el.children[0]; },
    addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){ return mkEl('q'); }, querySelectorAll(){ return []; },
    set innerHTML(v){ el.children=[]; }, get innerHTML(){ return ''; } };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; }
  return el; }

function boot(seed){
  const els={}; global.window=global;
  global.document={ getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement(t){return mkEl(t);},
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  global.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){ throw new Error('reload'); } };
  // a REAL backing store, so a test can assert what was actually written — the point of [9] is that a
  // clipped restore must not overwrite the player's save, and a no-op setItem() cannot show that
  const mem={};
  global.localStorage={ getItem:k=>(k in mem?mem[k]:null), setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; } };
  global.matchMedia=()=>({matches:false}); global.requestAnimationFrame=()=>{};
  global.setTimeout=()=>0;                      // the clipped-restore toast is deferred; don't let it fire
  let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
  code=code.replace("'use strict';",'') +
    '\nwindow.__G={S:S,W:W,replay:replay,finishSetup:finishSetup,sanitizeHistory:sanitizeHistory,' +
    'openCodex:openCodex,LINK_MAX_WEEK:LINK_MAX_WEEK,LINK_MAX_ACTIONS:LINK_MAX_ACTIONS};';
  (0,eval)(code);
  global.__G._mem=mem; global.__G._els=els;
  return global.__G; }

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  PASS '+m);} else {fail++;console.log('  FAIL: '+m);} }

const G=boot(3030830);
const san=G.sanitizeHistory;

console.log('\n[1] log length is capped');
{ const a=[]; for(let i=0;i<G.LINK_MAX_ACTIONS+500;i++) a.push([i%1000,'y']);
  const out=san({a});
  ok(out.a.length===G.LINK_MAX_ACTIONS, 'a '+a.length+'-action log clips to '+G.LINK_MAX_ACTIONS+' (got '+out.a.length+')'); }

console.log('\n[2] impossible weeks are dropped');
{ const out=san({a:[[NaN,'y'],[Infinity,'y'],[-1,'y'],[1e9,'y'],[G.LINK_MAX_WEEK+1,'y'],['5','y'],[10,'y']]});
  ok(out.a.length===1 && out.a[0][0]===10, 'only the finite in-range week survives (kept '+out.a.length+')');
  ok(san({w:NaN}).w===0 && san({w:-5}).w===0, 'a non-finite / negative target week falls back to 0');
  ok(san({w:1e9}).w===G.LINK_MAX_WEEK, 'an absurd target week clamps to LINK_MAX_WEEK'); }

console.log('\n[3] the heir lookup is week-aware in every drive loop');
{ const src=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
  const bare=src.match(/findIndex\(x=>x\[1\]==='h'\)/g)||[];
  const aware=src.match(/findIndex\(x=>x\[1\]==='h' && x\[0\]<=S\.week\)/g)||[];
  ok(bare.length===0, 'no week-blind h lookup remains (found '+bare.length+')');
  ok(aware.length===3, 'all three loops search week-aware (found '+aware.length+' of 3)'); }

console.log('\n[4] the slider door is an allowlist, not a state write');
{ const out=san({a:[[1,'s','gold',1e9],[1,'s','council','x'],[1,'s','tax',25],
                   [1,'s','tax',999],[1,'s','tax',-1],[1,'s','pay',2],[1,'s','tithe',NaN]]});
  const keys=out.a.map(x=>x[2]+'='+x[3]).join(',');
  ok(out.a.length===2 && keys==='tax=25,pay=2', "only in-range sliders survive (kept '"+keys+"')"); }

console.log('\n[5] unknown action types are dropped');
{ const out=san({a:[[1,'z'],[1,'__proto__'],[1,'b','mill'],[1]]});
  ok(out.a.length===1 && out.a[0][1]==='b', 'only known types survive (kept '+out.a.length+')');
  ok(san(null).a.length===0 && san('x').a.length===0, 'a non-object payload yields an empty log'); }

console.log('\n[6] an honest log is untouched');
{ const honest={ r:{title:'Queen',name:'Alienor'}, w:1040, v:'0.65',
    a:[[0,'m','crown'],[0,'d','iron'],[3,'s','tax',22],[9,'b','mill'],[14,'c','cold-chair',1],[52,'y'],[1039,'h','endured']] };
  const out=san(JSON.parse(JSON.stringify(honest)));
  ok(JSON.stringify(out.a)===JSON.stringify(honest.a), 'every action of a real reign passes through unchanged');
  ok(out.w===1040 && out.r.title==='Queen' && out.r.name==='Alienor', 'the target week and ruler survive');
  ok(san({r:{title:'Q',name:'x'.repeat(500)}}).r.name.length===64, 'a novel-length ruler name is clipped to 64'); }

console.log('\n[7] end to end: the reported payload no longer spins');
{ const G2=boot(3030830);
  const a=[]; for(let i=0;i<400;i++) a.push([999999999,'h','endured']);
  const t0=Date.now();
  G2.finishSetup('Queen','Testrun','crown','cold');
  G2.replay({r:{title:'Queen',name:'Testrun'}, a, w:999999999, v:'0.65'});
  const ms=Date.now()-t0;
  ok(G2.S.week<=G2.LINK_MAX_WEEK, 'the reign ends at or before LINK_MAX_WEEK (week '+G2.S.week+')');
  ok(ms<5000, 'it returns promptly ('+ms+'ms, was ~3.1s of pure spin)'); }

/* ===== [8] the holes an adversarial review found in the FIRST version of this =====
   Every payload below shipped green under the original sanitizeHistory, which validated only 's' — because
   's' was the reported gadget. Validating one verb and trusting nine is not an allowlist. */
console.log('\n[8] every verb’s payload, not just the sliders’');
{
  const bad=[
    [[400,'d','iron']],            // a chair applied MID-REIGN, running applyChairSetup over a live realm
    [[400,'m',{evil:1}]],          // an arbitrary object written straight to S.mode
    [[400,'L',{dynasties:1e9}]],   // a legacy world invented mid-reign
    [[1,'b',{}]],                  // crashed: BUILDS[{}] is undefined, so .cost threw
    [[3,'p',{}]],                  // crashed: pt.deny is not a function
    [[0,'d','ruby']],              // a chair the game has no word for
    [[0,'m','emperor']],           // a mode the game has no word for
  ];
  for(const a of bad){
    const out=san({a});
    ok(out.a.length===0 && out.clipped===true, 'dropped and reported: '+JSON.stringify(a[0]).slice(0,46));
  }
  const good=san({a:[[0,'m','noble'],[0,'d','iron'],
    [0,'L',{dynasties:3,wyrms:1,scorched:['Oskwick']}],[9,'b','mill'],[9,'y']]});
  ok(good.a.length===5 && good.clipped===false,
     'a legitimate setup + play log still passes wholly through (kept '+good.a.length+')');
  ok(typeof good.a[2][2].dynasties==='number' && Array.isArray(good.a[2][2].scorched),
     'a legacy payload is coerced to the three fields the game itself writes');
  ok(san({a:[[1.5,'y']]}).a.length===0, 'a non-integer week is dropped — the game only logs integers');
  // a malformed legacy payload is COERCED rather than dropped: the world's memory is the point of the
  // link, so keep the action and fix its shape. What must not survive is the crash
  // ((ld.scorched||[]).forEach is not a function) or the string reaching the Codex.
  { const s=san({a:[[0,'L',{scorched:'abc',dynasties:'7',wyrms:-4}]]});
    ok(s.a.length===1 && Array.isArray(s.a[0][2].scorched) && s.a[0][2].scorched.length===0,
       'a string where scorched should be a list becomes an empty list, not a crash');
    ok(s.a[0][2].dynasties===7 && s.a[0][2].wyrms===0, 'and the counts are coerced to sane integers'); }
}

/* ===== [9] the cap must not eat a real save =====
   The first caps (20800 weeks / 12000 actions) were set from a guess about the longest plausible dynasty.
   A forward-played game that continues at every succession reaches week 201,172 and 25,309 actions after
   200 successions — an order of magnitude past them. And replay() ended with an unconditional saveGame(),
   so merely OPENING such a save rewrote it with the truncated log: silent, permanent, self-inflicted data
   loss, strictly worse than the tab-freeze the caps were added to prevent. */
console.log('\n[9] a clipped restore is never written back over the player’s save');
{
  const G3=boot(3030830);
  ok(G3.LINK_MAX_WEEK>=201172 && G3.LINK_MAX_ACTIONS>=25309,
     'the caps clear a REAL 200-succession dynasty — week '+G3.LINK_MAX_WEEK+' / '+G3.LINK_MAX_ACTIONS
     +' actions vs the measured 201172 / 25309');
  ok(san({a:[[1,'y'],[1,'ZZZ']]}).clipped===true, 'anything dropped raises the clipped flag');
  ok(san({a:[[1,'y']]}).clipped===false, 'an untouched payload does not');

  // and the flag has to actually protect the save
  const G4=boot(3030830);
  G4._mem['annals-3030830']=JSON.stringify({r:{title:'Queen',name:'Keep'},a:[[1,'y'],[2,'y']],w:5,v:'0.65'});
  const before=G4._mem['annals-3030830'];
  G4.replay({r:{title:'Queen',name:'Keep'},a:[[1,'y'],[1,'ZZZ'],[2,'y']],w:5});
  ok(G4.S._clipped===true, 'the restore knows it was clipped');
  ok(G4._mem['annals-3030830']===before, 'and the player’s save is byte-for-byte untouched');
}

/* ===== [10] the Codex is an innerHTML sink, and a legacy payload reaches it ===== */
console.log('\n[10] no legacy payload reaches innerHTML unescaped');
{
  const G5=boot(3030830);
  G5.replay({r:{title:'Queen',name:'X'},
    a:[[0,'L',{dynasties:'<img src=x onerror=alert(1)>',scorched:[],wyrms:0}]], w:10});
  let html='';
  try{ G5.openCodex(); html=(G5._els&&G5._els['codexbody']&&G5._els['codexbody'].innerHTML)||''; }catch(e){}
  ok(!/<img/i.test(html), 'the Codex renders no raw tag from a crafted legacy payload');
  ok(typeof G5.S.flags.legacy.dynasties==='number',
     'and the payload never became a string in the first place (got '+JSON.stringify(G5.S.flags.legacy.dynasties)+')');
}

console.log('\n==== link-safety: '+pass+' pass, '+fail+' fail ====');
process.exit(fail?1:0);

