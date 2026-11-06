// weekly-check.js — assertions for v0.68.0 "The Week's Chair + the Reign Card".
// One world for everyone per ISO WEEK (keyed by the week's Monday, UTC — a pure hash, a week's seed is
// just a seed), a localStorage streak counted in weeks, and the Reign Card: the pasteable five-line
// share block. All display/meta; the sim is untouched and the harness (stubbed localStorage, no d= in
// the hash) never enters any of it. This was the Daily Chair through v0.65 — re-cadenced to weekly
// because a 20-40 minute reign is a Sunday-crossword obligation, not a three-minute one (issue #15).
// Usage: node tests/weekly-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

// a local copy of the game's mondayUTC, to build week keys the test can reason about independently
function mondayOf(dateStr){ const t=Date.parse(dateStr+'T00:00:00Z'), dow=new Date(t).getUTCDay();
  return new Date(t-((dow===0?6:dow-1))*86400000).toISOString().slice(0,10); }

function bootstrap(seed, ruler, opts){
  opts=opts||{};
  const els = {};
  function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el.children=[];}, get innerHTML(){return '';} };
    el.getContext=()=>stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed+(opts.week?('&d='+opts.week):''), origin:'https://coldchair.example', pathname:'/', reload(){ throw new Error('reload'); } };
  const mem={...(opts.storage||{})};
  sandbox.localStorage={ getItem:k=>(k in mem?mem[k]:null), setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; }, _m:mem };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.navigator={};
  sandbox.btoa=x=>Buffer.from(x,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,weeklySeed:weeklySeed,todayUTC:todayUTC,'
    + 'mondayUTC:mondayUTC,thisWeekUTC:thisWeekUTC,'
    + 'weekStreak:weekStreak,weekLedger:weekLedger,recordWeek:recordWeek,reignCard:reignCard,WEEK:WEEK,'
    + 'weekTwist:weekTwist,scenarioHash:scenarioHash,composeReignCardPNG:composeReignCardPNG,'
    + 'beginWeek:beginWeek,SCENARIOS:SCENARIOS,FEASTS:FEASTS,'
    + 'endGame:endGame,moment:moment,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], 'crown');
  return { G, mem, annals:sandbox.annals, loc:sandbox.location };
}

/* ============ §1 one world for everyone, per ISO week ============ */
console.log('§1 the week’s seed: a pure, stable function of the week — the same chair on every table');
{
  const {G}=bootstrap(3030830,['Queen','Week']);
  const a=G.weeklySeed('2026-07-13'), b=G.weeklySeed('2026-07-13'), c=G.weeklySeed('2026-07-20');
  ok(a===b, 'the same week always seats the same world ('+a+')');
  ok(a!==c, 'next week is a different world ('+c+')');
  ok(a>=1000000 && a<=9999999, 'week seeds are 7-digit and link-friendly');
  // Mon–Sun of one ISO week all collapse to that week's Monday; the next Monday is a new week
  ok(G.mondayUTC('2026-07-13')==='2026-07-13' && G.mondayUTC('2026-07-15')==='2026-07-13'
     && G.mondayUTC('2026-07-19')==='2026-07-13', 'Monday through Sunday resolve to one week key');
  ok(G.mondayUTC('2026-07-20')==='2026-07-20', 'the following Monday opens a new week');
  ok(/^\d{4}-\d{2}-\d{2}$/.test(G.thisWeekUTC()) && G.thisWeekUTC()===G.mondayUTC(G.todayUTC()),
     'thisWeekUTC is the current week’s Monday, a clean date key');
}

/* ============ §2 the streak ============ */
console.log('§2 the streak: consecutive WEEKS in the ledger, counted back from this week');
{
  const w0=mondayOf(new Date().toISOString().slice(0,10)); const t0=Date.parse(w0+'T00:00:00Z'); const wk=7*86400000;
  const w1=new Date(t0-wk).toISOString().slice(0,10);
  const w2=new Date(t0-2*wk).toISOString().slice(0,10);
  const w4=new Date(t0-4*wk).toISOString().slice(0,10);
  const led={}; led[w0]={over:'endured'}; led[w1]={over:'deposed'}; led[w2]={over:'endured'}; led[w4]={over:'endured'};
  const {G}=bootstrap(3030830,['Queen','Streak'],{storage:{'cold-chair-weekly':JSON.stringify(led)}});
  ok(G.weekStreak()===3, 'three consecutive weeks count; the gap ends the streak (got '+G.weekStreak()+')');
  const empty=bootstrap(3030830,['Queen','None']).G;
  ok(empty.weekStreak()===0, 'no ledger, no streak');
}

/* ============ §3 a Week's Chair enters the ledger at its end ============ */
console.log('§3 the week’s reign records itself: once, at the end, with its verdict');
{
  const w0=mondayOf(new Date().toISOString().slice(0,10));
  const {G,mem}=bootstrap(3030830,['Queen','Ledger'],{week:w0});
  G.S.week=1040; G.moment('A deed for the card.', 9);
  G.recordWeek('endured');
  const led=JSON.parse(mem['cold-chair-weekly']);
  ok(led[w0] && led[w0].over==='endured' && typeof led[w0].verdict==='string',
     'the week’s result is in the ledger with its verdict ('+(led[w0]&&led[w0].verdict)+')');
  led[w0].over='TAMPER'; mem['cold-chair-weekly']=JSON.stringify(led);
  G.recordWeek('deposed');
  ok(JSON.parse(mem['cold-chair-weekly'])[w0].over==='TAMPER', 'a week records once — replays do not overwrite the first telling');
  // a non-week reign records nothing
  const plain=bootstrap(3030830,['Queen','Plain']);
  plain.G.recordWeek('endured');
  ok(!plain.mem['cold-chair-weekly'], 'an ordinary seed never touches the week’s ledger');
}

/* ============ §4 the Reign Card ============ */
console.log('§4 the reign card: five monk-set lines, the verdict, the weight, and the world’s link');
{
  const {G}=bootstrap(3030830,['Queen','Card']);
  G.S.week=1040; G.S.over='endured';
  G.moment('The wyrm was fed the gold it came for, and left', 9);
  G.moment('The realm was made whole again by iron', 11);
  const card=G.reignCard();
  const lines=card.split('\n');
  ok(lines[0].indexOf('THE COLD CHAIR — seed 3030830')===0, 'an ordinary card is headed by its seed');
  ok(/Queen Card, the .+ — endured the full twenty years \(20 yrs\)/.test(lines[1]), 'the verdict line reads like the monk ('+lines[1]+')');
  ok(card.indexOf('· The realm was made whole again by iron')>=0, 'the heaviest deeds make the card');
  ok(lines[lines.length-1].indexOf('sit this world yourself: https://coldchair.example/#s=3030830')===0,
     'the card ends with the seed link (the world, not the full log)');
  // week's-chair branding + iron weight
  const w0=mondayOf(new Date().toISOString().slice(0,10));
  const d=bootstrap(3030830,['Queen','WCard'],{week:w0});
  d.G.S.week=520; d.G.S.over='deposed'; d.G.S.chair='iron';
  const dc=d.G.reignCard();
  ok(dc.indexOf('the Week’s Chair, '+w0)>=0, 'a week’s card is headed by the week, not the seed');
  ok(dc.indexOf('upon the IRON chair')>=0, 'the iron weight is worn on the card');
}

/* ============ §5 the twist calendar (v0.68.0) ============ */
console.log('§5 the twist calendar: a pure rite of the week — a feast week wears its feast');
{
  const {G}=bootstrap(3030830,['Queen','Rite']);
  // a plain week (2026-07-13 Monday, no feast falls within it) carries no twist
  ok(G.weekTwist('2026-07-13')===null, 'a plain week carries no twist');
  { const far=G.weekTwist(mondayOf('2031-07-14'));
    ok(far===null || (far&&far.feast), 'the twist reads the WEEK, not the wall clock (far years resolve cleanly)'); }
  const feasts={'2026-03-25':['debtor','Lady Day'],'2026-06-21':['wyrmbait','Midsummer'],
                '2026-09-29':['delvedeep','Michaelmas'],'2026-12-21':['ironstart','Midwinter']};
  let allFeasts=true;
  for(const d in feasts){ const t=G.weekTwist(mondayOf(d));   // the twist is keyed by the week's Monday
    if(!(t && t.feast===feasts[d][1] && t.scenario && t.scenario.id===feasts[d][0])) { allFeasts=false; console.log('    bad feast week '+d+': '+JSON.stringify(t&&t.feast)); } }
  ok(allFeasts, 'the week of each feast sets its Ill-Made predicament (Lady Day→debtor, Midsummer→wyrmbait, Michaelmas→delvedeep, Midwinter→ironstart)');
  // the feast is worn all week: whichever weekday the feast lands on, every day of its week resolves to it
  let allWeekLong=true;
  for(const d in feasts){ const mon=mondayOf(d);
    for(let i=0;i<7;i++){ const day=new Date(Date.parse(mon+'T00:00:00Z')+i*86400000).toISOString().slice(0,10);
      const t=G.weekTwist(mondayOf(day));   // any day in the week resolves to the same Monday, same feast
      if(!(t && t.feast===feasts[d][1])) allWeekLong=false; } }
  ok(allWeekLong, 'a feast is worn every day of its week — Monday through Sunday all read the same rite');
}

/* ============ §6 the twist routes the week, and the feast card links its brink ============ */
console.log('§6 beginWeek routes by the rite; a feast card wears its feast and links the predicament');
{
  const m=bootstrap(3030830,['Queen','Route']);
  const plainMon=mondayOf('2026-07-13');
  try{ m.G.beginWeek(plainMon); }catch(e){}   // stub reload throws — the hash is already set
  ok(m.loc.hash==='s='+m.G.weeklySeed(plainMon)+'&d='+plainMon, 'a plain week is the week’s seed plus its Monday marker');
  const f=bootstrap(3030830,['Queen','Feast']);
  const ladyMon=mondayOf('2026-03-25');
  try{ f.G.beginWeek(ladyMon); }catch(e){}
  const debtor=f.G.SCENARIOS.find(sc=>sc.id==='debtor');
  ok(f.loc.hash===f.G.scenarioHash(debtor)+'&d='+ladyMon,
     'a feast week is the predicament itself — the scenario hash plus the week’s marker');
  // the feast card: header wears the feast, the closing link is the brink (seed+log), not the bare seed
  const fc=bootstrap(3030830,['Queen','Lady'],{week:'2026-03-25'});
  fc.G.S.week=520; fc.G.S.over='deposed';
  const card=fc.G.reignCard();
  ok(card.indexOf('the Week’s Chair, '+ladyMon+' · Lady Day')>=0, 'the feast card is headed by its feast, dated to the week’s Monday');
  const last=card.split('\n').pop();
  ok(last.indexOf('sit this world yourself: ')===0 && last.indexOf('&h=')>0 && last.indexOf('#s=')>0,
     'the feast card links the PREDICAMENT (seed + the canned brink), not the calm seed');
  // an ordinary week card keeps the seed-only link and no feast suffix
  const mc=bootstrap(3030830,['Queen','Plain'],{week:plainMon});
  mc.G.S.week=520; mc.G.S.over='deposed';
  const mcard=mc.G.reignCard();
  ok(mcard.indexOf(' · ')<0 && mcard.split('\n').pop().indexOf('&h=')<0, 'a plain week card carries no feast mark and keeps the seed-only link');
}

/* ============ §7 the small PNG composes (headless: geometry only; pixels are the smoke test's) ============ */
console.log('§7 the vellum PNG: an offscreen canvas at 2x, sized to the card’s lines');
{
  const {G}=bootstrap(3030830,['Queen','Vellum']);
  G.S.week=1040; G.S.over='endured';
  G.moment('The wyrm was fed the gold it came for, and left', 9);
  G.moment('The realm was made whole again by iron', 11);
  const lines=G.reignCard().split('\n').length;
  const c=G.composeReignCardPNG();
  ok(c && c.tag==='canvas', 'the card composes on an offscreen canvas (never the page)');
  ok(c.width===680*2 && c.height===(104+lines*30+42)*2, 'the canvas is 2x and its height follows the card’s '+lines+' lines');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

