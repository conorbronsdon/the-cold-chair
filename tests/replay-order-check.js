// tests/replay-order-check.js — a build logged while a letter is pending must replay before the answer (issue #48).
//
// THE GAP. Live play can log a build while a letter is pending: `annals.build()` stays open then (agents,
// `pilgrim-check`, `stone-and-road-check` rely on it). The log records [w,'b',k] BEFORE [w,'c',id,i].
// Every replay path (replay(), the paced film's filmDrive/readingAnswer, and the film's readingSkip)
// applied non-card actions only while `!S.pendingCard`, so on replay the letter was answered first and the
// build applied after. Harmless when the letter leaves the treasury alone; a fork when it spends gold the
// build needed: live the build succeeds, replayed it fails, and the reign diverges.
//
// THE CASE. Seed 3030830, crown, cold chair, answering every letter with option 0 until the `writ` letter
// (week 30), whose option 2 costs 120 gold. While it is pending: spend the treasury down with ordinary
// builds, then begin one build that is affordable now but not after paying the 120. Then answer option 2.
//
// Asserts:
//   [0] the case is real: the final build is affordable before the answer and unaffordable after it
//   [1] replay() tells the same chronicle and the same serialized state as the live reign
//   [2] the film's "To the Leaf" fast path (startReading + readingSkip) reaches the same state
//   [3] the paced film (filmDrive + readingAnswer, ticked as frame() would) reaches the same state
//   [4] must-not-fire complement: a reign with no build during a letter replays identically too
'use strict';
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.join(__dirname,'..');

function boot(seed){
  const els={};
  function mkEl(tag){ const el={tag,children:[],style:{cssText:''},dataset:{},textContent:'',value:'',className:'',hidden:true,
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
    el.getContext=()=>new Proxy({},{get:(t,p)=>(p in t?t[p]:()=>{}),set:(t,p,v)=>{t[p]=v;return true;}}); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const sb={}; sb.window=sb;
  sb.document={ getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sb.location={ hash:'#s='+seed, origin:'', pathname:'/', reload(){} };
  const saved={}; sb.localStorage={ getItem:k=>saved[k]||null, setItem(k,v){saved[k]=v;}, removeItem(k){delete saved[k];} };
  sb.matchMedia=()=>({matches:false}); sb.requestAnimationFrame=()=>{};
  sb.performance=require('perf_hooks').performance; sb.console=console;
  sb.setTimeout=()=>0; sb.clearTimeout=()=>{}; sb.navigator={};
  sb.btoa=x=>Buffer.from(x,'binary').toString('base64'); sb.unescape=unescape; sb.encodeURIComponent=encodeURIComponent;
  const code=fs.readFileSync(process.env.ANNALS_GAME_SOURCE||path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,API:API,annals:window.annals,finishSetup:finishSetup,replay:replay,startReading:startReading,'
    + 'readingSkip:readingSkip,filmDrive:filmDrive,tick:tick,BUILDS:BUILDS,canBuild:canBuild,saveGame:saveGame};';
  vm.createContext(sb); vm.runInContext(code, sb, {filename:'game.js'});
  sb.__G.saved=()=>JSON.parse(saved['annals-'+seed]||'null'); return sb.__G; }

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  PASS '+m);} else {fail++;console.log('  FAIL: '+m);} }

const SEED=3030830, LETTER='writ', OPTION=2, WEEKS=120;
const snap=G=>({ chron:G.API._chron.slice(), log:JSON.parse(JSON.stringify(G.S.actions)), week:G.S.week,
                 state:JSON.stringify(G.annals.state()) });

// Play live. With `racing`, build during the `writ` letter so the last build depends on the order.
function playLive(racing){
  const G=boot(SEED); G.finishSetup('Queen','Order','crown','cold');
  const info={};
  let guard=0;
  while(G.S.week<WEEKS && !G.S.over && guard++<20000){
    const pc=G.S.pendingCard;
    if(pc && pc.id===LETTER && !info.seen){
      info.seen=true; info.week=G.S.week;
      if(racing){
        const cost=OPTION_COST;
        // spend down: the dearest work that still leaves the treasury above every "just affordable" band
        for(let n=0;n<40;n++){
          const ks=Object.keys(G.BUILDS).filter(k=>G.canBuild(k) && G.BUILDS[k].cost>0);
          const just=ks.find(k=>G.BUILDS[k].cost>G.S.gold-cost);
          if(just){ info.goldBefore=G.S.gold; info.build=just; info.cost=G.BUILDS[just].cost;
            info.built=G.annals.build(just); break; }
          const cheaper=ks.filter(k=>G.BUILDS[k].cost<=G.S.gold-cost).sort((a,b)=>G.BUILDS[b].cost-G.BUILDS[a].cost)[0];
          if(!cheaper) break;
          G.annals.build(cheaper);
        }
      }
      G.annals.choose(OPTION); continue;
    }
    if(pc){ G.annals.choose(0); continue; }
    G.annals.advance(1);
  }
  return Object.assign(snap(G), {info}); }

// Measure option 2's price at the letter, so the case does not hard-code a balance figure.
let OPTION_COST=0;
{
  const G=boot(SEED); G.finishSetup('Queen','Order','crown','cold'); let guard=0;
  while(G.S.week<WEEKS && guard++<20000){
    if(G.S.pendingCard){ if(G.S.pendingCard.id===LETTER){ const g=G.S.gold; G.annals.choose(OPTION); OPTION_COST=g-G.S.gold; break; }
      G.annals.choose(0); continue; }
    G.annals.advance(1); }
}

function replayed(live){
  const G=boot(SEED);
  G.replay({ r:{title:'Queen',name:'Order'}, a:JSON.parse(JSON.stringify(live.log)), w:live.week });
  return snap(G); }
function skipped(live){
  const G=boot(SEED);
  G.startReading({ r:{title:'Queen',name:'Order'}, a:JSON.parse(JSON.stringify(live.log)), w:live.week });
  G.readingSkip();
  return snap(G); }
function filmed(live, targetW=live.week){
  const G=boot(SEED);
  G.startReading({ r:{title:'Queen',name:'Order'}, a:JSON.parse(JSON.stringify(live.log)), w:targetW });
  let now=0, guard=0;
  while(guard++<200000){
    now+=5000; G.filmDrive(now);                       // hold each letter past its beat, as frame() would
    const R=G.S.reading; if(!R || R.ended) break;
    if(!G.S.pendingCard && !G.S.over) G.tick(); }
  const s=snap(G); s.ended=!!(G.S.reading && G.S.reading.ended); s.targetW=G.S.reading && G.S.reading.targetW; return s; }

function same(label, live, got){
  const d=live.chron.findIndex((l,i)=>l!==got.chron[i]);
  ok(d===-1 && got.chron.length===live.chron.length, label+': the chronicle matches line for line'
     +(d===-1?'':' — first divergence at line '+d+'\n      live:   '+live.chron[d]+'\n      replay: '+got.chron[d]));
  ok(got.week===live.week, label+': same final week ('+live.week+' / '+got.week+')');
  ok(got.state===live.state, label+': serialized state is identical'); }

console.log('[0] the race is real');
const live=playLive(true);
const I=live.info;
ok(OPTION_COST>0, 'the `'+LETTER+'` letter’s option '+OPTION+' costs gold ('+OPTION_COST+')');
ok(I.seen && I.week<=WEEKS, 'the `'+LETTER+'` letter came up live (week '+I.week+')');
ok(I.built==='built '+I.build,
   'live built '+I.build+' ('+I.cost+' gold) while the letter was pending → '+JSON.stringify(I.built));
ok(I.goldBefore>=I.cost && I.goldBefore-OPTION_COST<I.cost,
   'that build was affordable before the answer ('+I.goldBefore.toFixed(1)+') and not after it ('+(I.goldBefore-OPTION_COST).toFixed(1)+')');
const bi=live.log.findIndex(a=>a[1]==='b' && a[2]===I.build && a[0]===I.week);
const ci=live.log.findIndex(a=>a[1]==='c' && a[2]===LETTER);
ok(bi>=0 && ci>bi && live.log[ci][0]===live.log[bi][0], 'the log holds the build before the answer, in the same week');

console.log('\n[1] replay()');                    same('replay', live, replayed(live));
console.log('\n[2] the film, "To the Leaf"');     same('readingSkip', live, skipped(live));
console.log('\n[3] the film, watched');           same('filmDrive', live, filmed(live));

console.log('\n[4] must-not-fire: no build during the letter');
{ const calm=playLive(false);
  ok(!calm.log.some(a=>a[1]==='b'), 'the calm reign logged no builds at all');
  same('calm replay', calm, replayed(calm)); same('calm readingSkip', calm, skipped(calm)); }

// #52 predates #50: a due build without a recorded answer must leave the letter unanswered.
// Use the actual localStorage payload, including a second restore, to catch save corruption too.
console.log('\n[5] an unanswered letter stays unanswered (#52)');
for(const build of [false,true]){
  const G=boot(SEED); G.finishSetup('Queen','Order','crown','cold');
  while(!G.S.pendingCard && G.S.week<10) G.annals.advance(1);
  ok(G.S.pendingCard && G.S.pendingCard.id==='cold-chair', 'the opening letter is pending');
  if(build) ok(G.annals.build('mill')==='built mill', 'an affordable mill was built without answering');
  G.saveGame(); const data=G.saved(), live=snap(G);
  ok(!data.a.some(a=>a[1]==='c'||a[1]==='k'), 'the saved log contains no answer');
  const restored=boot(SEED); restored.replay(data);
  same('unanswered '+(build?'build':'empty')+' save',live,snap(restored));
  ok(restored.S.pendingCard && restored.S.pendingCard.id==='cold-chair', 'restore preserves the pending letter');
  ok(JSON.stringify(restored.S.actions)===JSON.stringify(data.a), 'restore preserves the action log');
  const again=boot(SEED); again.replay(restored.saved());
  same('second restore',live,snap(again));
  same('unanswered skip',live,skipped(live));
  same('unanswered film',live,filmed(live));
  // A recorded option 0 remains distinct from the absence of an answer.
  G.annals.choose(0); const answered=snap(G);
  ok(!G.S.pendingCard && answered.log.some(a=>a[1]==='c'), 'the positive control explicitly records option 0');
  same('answered save',answered,replayed(answered));
  same('answered skip',answered,skipped(answered));
  same('answered film',answered,filmed(answered));
}

// Older/desynchronised histories can have a target week after an unrecorded letter.
// All three readers stop at the recoverable pending state; the watched film must also finish.
console.log('\n[6] exhausted film below its advertised target (Opus review)');
for(const build of [false,true]){
  const G=boot(SEED); G.finishSetup('Queen','Order','crown','cold');
  while(!G.S.pendingCard && G.S.week<10) G.annals.advance(1);
  if(build) G.annals.build('mill');
  const pending=snap(G), targetW=pending.week+18;
  const advertised=Object.assign({},pending,{week:targetW});
  same('older-history replay',pending,replayed(advertised));
  same('older-history skip',pending,skipped(advertised));
  const film=filmed(pending,targetW);
  ok(film.ended, 'exhausted unanswered film finishes below target week '+targetW);
  ok(film.targetW===targetW, 'the original target metadata is retained');
  same('older-history film',pending,film);
  ok(JSON.stringify(film.log)===JSON.stringify(pending.log), 'the film invents no answer or log entry');
  // Complement: with the final answer recorded, an empty log must still play the remaining quiet week.
  G.annals.choose(0); G.annals.advance(1); const answered=snap(G);
  const complete=filmed(answered);
  ok(complete.ended && !G.S.pendingCard, 'recorded-answer film finishes normally after its quiet tail');
  same('recorded-answer tail',answered,complete);
}

console.log('\n==== replay order: '+pass+' pass, '+fail+' fail ====');
process.exit(fail?1:0);
