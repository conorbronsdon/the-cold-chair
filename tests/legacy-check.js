// legacy-check.js — assertions for v0.55.0 "The Legacy Realm".
// A world that keeps its scars across dynasties: a per-seed world-file (localStorage) remembers the
// towns burned and tallies dynasties + wyrms; a legacy founding APPLIES that memory (scorched towns
// start burned) and writes it into the log as a week-0 [0,'L',data] setup action — the exact idiom of
// the chair 'd'/mode 'm'. So a legacy reign is a pure function of (seed, log): replay reproduces the
// scars from the log, a shared link carries them, and — because no plan carries an 'L' — every ordinary
// fresh-seed game is byte-identical (the plan sweep proves 0/28). This checks the loop directly.
// Usage: node tests/legacy-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, storage){
  const els = {};
  function mkEl(tag){ const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'', _html:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    appendChild(c){el.children.push(c);return c;}, removeChild(c){const i=el.children.indexOf(c);if(i>=0)el.children.splice(i,1);},
    get firstChild(){return el.children[0];}, addEventListener(){}, setAttribute(){}, focus(){},
    querySelector(){return mkEl('q');}, querySelectorAll(){return [];},
    set innerHTML(v){el._html=v; el.children=[];}, get innerHTML(){return el._html;} };
    el.getContext=()=>new Proxy({},{get:(t,p)=>(p in t?t[p]:()=>{}),set:(t,p,v)=>{t[p]=v;return true;}}); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById(id){ return els[id]||(els[id]=mkEl('div')); }, createElement:mkEl,
    createTextNode(t){ const e=mkEl('#text'); e.textContent=t; return e; }, querySelectorAll:()=>[], head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map']=mkEl('canvas'); els['map'].width=940; els['map'].height=620;
  sandbox.location={ hash:'#s='+seed, origin:'https://coldchair.example', pathname:'/', reload(){} };
  const mem={...(storage||{})};
  sandbox.localStorage={ getItem:k=>(k in mem?mem[k]:null), setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; }, _m:mem };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.navigator={};
  sandbox.btoa=x=>Buffer.from(x,'binary').toString('base64'); sandbox.unescape=unescape;
  sandbox.encodeURIComponent=encodeURIComponent;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,replay:replay,endGame:endGame,'
    + 'legacyLoad:legacyLoad,legacyFoundData:legacyFoundData,applyLegacySetup:applyLegacySetup,'
    + 'legacyAccumulate:legacyAccumulate,legacySeals:legacySeals,legacyKey:legacyKey,'
    + 'composeCodex:composeCodex,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  return { G:sandbox.__G, mem };
}
function twoTowns(G){ return G.W.towns.filter(t=>t!==G.W.capital).slice(0,2).map(t=>t.name); }

/* ============ §1 the world-file: a fresh world remembers nothing, a founding advances the dynasty ============ */
console.log('§1 the world-file: a fresh world is blank; founding a legacy advances its dynasty count');
{
  const {G,mem}=bootstrap(3030830);
  const l0=G.legacyLoad();
  ok(l0.v===1 && l0.dynasties===0 && l0.scorched.length===0, 'a never-founded world remembers nothing');
  const d1=G.legacyFoundData();
  ok(d1.dynasties===1, 'founding once makes this the first dynasty');
  ok(JSON.parse(mem[G.legacyKey()]).dynasties===1, 'the increment persists to the world-file');
  const d2=G.legacyFoundData();
  ok(d2.dynasties===2, 'founding again advances to the second dynasty (the world remembers across foundings)');
}

/* ============ §2 founding applies the scars; a fresh-seed reign carries none ============ */
console.log('§2 a legacy founding scorches the remembered towns; an ordinary founding does not');
{
  const {G}=bootstrap(3030830);
  const burned=twoTowns(G);
  const seed={ v:1, dynasties:2, scorched:burned, wyrms:1 };
  const {G:H}=bootstrap(3030830, { ['cold-chair-legacy-3030830']:JSON.stringify(seed) });
  // found a legacy realm: finishSetup with the loaded memory
  H.finishSetup('Queen','Scarred','crown','cold', H.legacyFoundData());
  const scarred=H.W.towns.filter(t=>t.wasSacked && t!==H.W.capital).map(t=>t.name);
  ok(burned.every(n=>scarred.includes(n)), 'the remembered towns start scorched ('+scarred.join(', ')+')');
  ok(!!H.S.flags.legacy && H.S.flags.legacy.dynasties===3, 'the reign knows it is a legacy world (3rd dynasty now)');
  // control: an ordinary founding of the same seed carries no scars and no legacy flag
  const {G:P}=bootstrap(3030830, { ['cold-chair-legacy-3030830']:JSON.stringify(seed) });
  P.finishSetup('Queen','Plain','crown','cold');   // no legacy arg
  ok(!P.S.flags.legacy && P.W.towns.every(t=>!t.wasSacked), 'a fresh-seed (non-legacy) founding ignores the world-file entirely');
  ok(P.S.actions.every(a=>a[1]!=='L'), 'and logs no L action — so it stays byte-identical to every reign before it');
}

/* ============ §3 the 'L' action makes a legacy reign replay-deterministic ============ */
console.log('§3 replay: the week-0 L action reproduces the scars from the log alone (no world-file needed)');
{
  // build a legacy founding, capture its log
  const burned=twoTowns(bootstrap(3030830).G);
  const {G}=bootstrap(3030830, { ['cold-chair-legacy-3030830']:JSON.stringify({v:1,dynasties:1,scorched:burned,wyrms:0}) });
  G.finishSetup('Queen','Log','crown','iron', G.legacyFoundData());
  const log={ r:G.S.ruler, a:G.S.actions.slice(), w:G.S.week };
  ok(log.a.some(a=>a[0]===0 && a[1]==='L'), 'the founding logged a week-0 L action carrying the scars');
  // replay it on a fresh page with an EMPTY world-file — the scars must come from the log
  const {G:R}=bootstrap(3030830);   // no world-file at all
  R.replay(log);
  const scarred=R.W.towns.filter(t=>t.wasSacked && t!==R.W.capital).map(t=>t.name);
  ok(burned.every(n=>scarred.includes(n)), 'replay reproduced the scars from the log, with no world-file present');
  ok(R.S.chair==='iron', 'and the chair too — the ordinary setup replayed alongside the L action');
}

/* ============ §4 accumulation: a reign's scars fold back into the world's memory ============ */
console.log('§4 at a reign’s end, the world remembers what befell it this time');
{
  const {G,mem}=bootstrap(3030830);
  G.finishSetup('Queen','Burner','crown','cold', G.legacyFoundData());   // dynasty 1, no prior scars
  // this reign burns a town and slays a wyrm
  const victim=G.W.towns.find(t=>t!==G.W.capital); victim.wasSacked=true;
  G.S.dragonsSlain=2; G.S.week=1040;
  G.endGame('endured');   // folds the scars into the world-file
  const saved=JSON.parse(mem[G.legacyKey()]);
  ok(saved.scorched.includes(victim.name), 'the town burned this reign is now in the world’s memory');
  ok(saved.wyrms>=2, 'the wyrms slain this reign are counted for the world ('+saved.wyrms+')');
  ok(saved.dynasties===1, 'the dynasty count is preserved');
  // multi-reign dynasty: S.dragonsSlain resets each succession, so the world must SUM the line's kills
  // (the closed reigns in S._dynasty + the current reign), not keep only the biggest single reign.
  const {G:M,mem:mm}=bootstrap(777);
  M.finishSetup('Queen','Line','crown','cold', M.legacyFoundData());
  M.S._dynasty=[{ruler:'Queen A',verdict:'x',years:[30,44],ending:'endured',wyrms:1},
                {ruler:'Queen B',verdict:'x',years:[44,58],ending:'endured',wyrms:1}];   // two heirs, one wyrm each
  M.S.dragonsSlain=1;   // and the reigning crown slays a third
  M.S.week=1500; M.endGame('endured');
  ok(JSON.parse(mm[M.legacyKey()]).wyrms===3, 'a dynasty that slew a wyrm under each of three reigns records three, not one ('+JSON.parse(mm[M.legacyKey()]).wyrms+')');
}

/* ============ §5 sealed envelopes: the thresholds a world crosses ============ */
console.log('§5 sealed envelopes: the Wyrmmoot, the Chronicle of Ages, the Burned Marches');
{
  const {G}=bootstrap(3030830);
  ok(G.legacySeals({dynasties:1,scorched:[],wyrms:0}).length===0, 'a young world has sealed nothing');
  ok(/Wyrmmoot/.test(G.legacySeals({dynasties:1,scorched:[],wyrms:3}).join('|')), 'three wyrms seal the Wyrmmoot');
  ok(/Chronicle of Ages/.test(G.legacySeals({dynasties:5,scorched:[],wyrms:0}).join('|')), 'five dynasties seal the Chronicle of Ages');
  ok(/Burned Marches/.test(G.legacySeals({dynasties:1,scorched:['a','b','c'],wyrms:0}).join('|')), 'three scorched towns seal the Burned Marches');
}

/* ============ §6 exposure gated + the Codex ============ */
console.log('§6 the legacy surfaces in state()/Codex only in a legacy world');
{
  const {G}=bootstrap(3030830); G.finishSetup('Queen','Plain','crown','cold');   // ordinary
  ok(!('legacy' in G.annals.state()), 'an ordinary reign exposes no legacy key (byte-identical state)');
  ok(G.composeCodex().world===null, 'and the Codex shows no World section');
  const {G:H}=bootstrap(3030830, { ['cold-chair-legacy-3030830']:JSON.stringify({v:1,dynasties:4,scorched:twoTowns(bootstrap(3030830).G),wyrms:3}) });
  H.finishSetup('Queen','Kept','crown','cold', H.legacyFoundData());
  const st=H.annals.state();
  ok(st.legacy && st.legacy.dynasties===5 && Array.isArray(st.legacy.seals), 'a legacy world surfaces its memory + seals in state()');
  ok(H.composeCodex().world && H.composeCodex().world.dynasties===5, 'and the Codex carries a World section');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

