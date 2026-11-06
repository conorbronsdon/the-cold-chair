// tests/replay-parity-check.js — the same (seed, log) must tell the same story (issue #10).
//
// THE GAP THIS CLOSES. `harness.js` calls `finishSetup` directly, and so does every other check in this
// suite. **No test drove `replay()`** — the boot path every shared history link takes was the one path
// with no coverage. It had drifted: `replay()` skipped `finishSetup` and applied the week-0 setup actions
// itself, so a silently-restored founding reign never ran the accession line, the legacy lines, the noble
// opening, or `prophecyOpen()`. A friend opening your link got a book missing its opening page —
// including the portent that frames the whole reign.
//
// THE INVARIANT. A reign played live and the same reign restored from its own action log must produce an
// identical `_chron` stream. That is the promise the history link makes ("it replays this exact reign"),
// and it is the assertion that would also have caught the v0.38.0 `_cutLog` replay crash.
//
// Asserts, for a crown reign, a chair reign and a noble reign:
//   [1] live and replayed `_chron` are identical, line for line
//   [2] the founding lines are actually present in the replay (not identical-because-both-empty)
//   [3] the sim agrees too — same week, same serialized state
//   [4] replay() does not re-log: the restored action log equals the log it was handed
'use strict';
const fs=require('fs'), path=require('path');

function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){
  const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'', hidden:true,
    classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
    appendChild(c){ el.children.push(c); return c; },
    removeChild(c){ const i=el.children.indexOf(c); if(i>=0)el.children.splice(i,1); },
    get firstChild(){ return el.children[0]; },
    addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){ return mkEl('q'); }, querySelectorAll(){ return []; },
    set innerHTML(v){ el.children=[]; }, get innerHTML(){ return ''; } };
  el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; }
  return el; }

// A fresh game per boot: the sim is module-level state, so each run gets its own eval of game.js.
function boot(seed){
  const els={}; global.window=global;
  global.document={ getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement(t){return mkEl(t);},
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll(){return [];}, head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  global.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){ throw new Error('reload'); } };
  global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
  global.matchMedia=()=>({matches:false}); global.requestAnimationFrame=()=>{};
  let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
  code=code.replace("'use strict';",'') +
    '\nwindow.__G={S:S,W:W,API:API,annals:annals,replay:replay,finishSetup:finishSetup};';
  (0,eval)(code);
  return global.__G; }

// Play a reign forward the way a human does: advance, answer each letter with option `pick`.
function playLive(seed, {mode='crown', chair='cold', weeks=260, pick=0}={}){
  const G=boot(seed);
  G.finishSetup(mode==='noble'?'Ser':'Queen', 'Parity', mode, chair);
  let guard=0;
  while(G.S.week<weeks && !G.S.over && guard++<20000){
    if(G.S.pendingCard){
      const c=G.S.pendingCard.c, opts=(G.S.mode==='noble'&&c.oN)?c.oN:c.o;
      G.annals.choose(((pick%opts.length)+opts.length)%opts.length);
      continue;
    }
    G.annals.advance(1);
  }
  return { chron:G.API._chron.slice(), log:JSON.parse(JSON.stringify(G.S.actions)),
           week:G.S.week, state:JSON.stringify(G.annals.state()) }; }

// Restore that same reign the way a shared link does: replay(), nothing else.
function playReplay(seed, live){
  const G=boot(seed);
  G.replay({ r:{title:live.log.some(a=>a[1]==='m')?'Ser':'Queen', name:'Parity'},
             a:JSON.parse(JSON.stringify(live.log)), w:live.week, v:undefined });
  return { chron:G.API._chron.slice(), log:JSON.parse(JSON.stringify(G.S.actions)),
           week:G.S.week, state:JSON.stringify(G.annals.state()) }; }

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  PASS '+m);} else {fail++;console.log('  FAIL: '+m);} }

const CASES=[
  { label:'crown, cold chair, seed 3030830', seed:3030830, opts:{mode:'crown',chair:'cold',weeks:260,pick:0} },
  { label:'crown, IRON chair, seed 7777',    seed:7777,    opts:{mode:'crown',chair:'iron',weeks:210,pick:1} },
  { label:'noble regency, seed 4655760',     seed:4655760, opts:{mode:'noble',chair:'cold',weeks:210,pick:0} },
];

for(const c of CASES){
  console.log('\n['+c.label+']');
  const live=playLive(c.seed, c.opts);
  const rep =playReplay(c.seed, live);

  // [2] first, so an all-empty pair can never read as parity
  ok(live.chron.length>=3, 'the live reign wrote a chronicle ('+live.chron.length+' lines)');
  ok(rep.chron.length===live.chron.length,
     'replay wrote the same number of lines (live '+live.chron.length+' / replay '+rep.chron.length+')');
  const opener=live.chron[0]||'';
  ok(rep.chron[0]===opener, "replay opens on the same line — '"+opener.slice(0,58).replace(/^\[[^\]]*\]\s*/,'')+"…'");
  // prophecyOpen() is the beat replay used to drop outright; assert it lands in both, at the same place
  const pLive=live.chron.findIndex(l=>/portent/.test(l)), pRep=rep.chron.findIndex(l=>/portent/.test(l));
  ok(pLive>=0, 'the live reign wrote its opening portent (line '+pLive+')');
  ok(pRep===pLive, 'the replay wrote the portent on the same line ('+(pRep<0?'MISSING — the #10 defect':pRep)+')');

  // [1] the invariant itself
  const firstDiff=live.chron.findIndex((l,i)=>l!==rep.chron[i]);
  ok(firstDiff===-1, firstDiff===-1 ? 'live and replayed _chron are identical, line for line'
     : 'chronicles diverge at line '+firstDiff+'\n      live:   '+live.chron[firstDiff]
       +'\n      replay: '+(rep.chron[firstDiff]===undefined?'(missing)':rep.chron[firstDiff]));

  // [3] the sim agrees
  ok(rep.week===live.week, 'the reign ends on the same week ('+live.week+')');
  ok(rep.state===live.state, 'serialized state is identical');

  // [4] a replay reads the log, it never writes to it
  ok(JSON.stringify(rep.log)===JSON.stringify(live.log), 'the restored action log is the log it was handed');
}

/* ============ the saved reign carries its version stamp ============
   SAVED (the browser save) is handed straight to replay(), which toasts "written under an older telling
   (v pre-0.48)" whenever data.v !== GAME_VER. saveGame() used to write {r,a,w} with no `v`, so "Resume the
   saved reign" always warned about a reign saved thirty seconds earlier. */
console.log('\n[saved reign] the browser save is stamped with the telling that wrote it');
{
  const G=boot(3030830);
  let written=null;
  global.localStorage={ getItem:()=>null, removeItem(){},
    setItem(k,v){ if(k.indexOf('annals-')===0) written=JSON.parse(v); } };
  G.finishSetup('Queen','Stamp','crown','cold');
  G.annals.advance(3);
  ok(!!written, 'the reign saved to localStorage');
  if(written){
    ok(typeof written.v==='string' && written.v.length>0,
       'the save carries a version stamp (v='+written.v+'), so resuming it does not warn about an older telling');
    ok(written.r && Array.isArray(written.a) && typeof written.w==='number',
       'and the rest of the payload shape is unchanged {r,a,w}');
  }
}

console.log('\n==== replay parity: '+pass+' pass, '+fail+' fail ====');
process.exit(fail?1:0);

