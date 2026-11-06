// succession-wars-check.js — assertions for v0.40.0 "The Divided Realm" (the co-ruler as a live rival)
// and v0.41.0 "Marriage & Usurpation" (the two deferred P8 noble paths, now walked).
// Usage: node tests/succession-wars-check.js   (run from repo root; reads game.js)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passes = 0, fails = 0;
function ok(cond, msg){ if(cond){ passes++; } else { fails++; console.log('  FAIL: '+msg); } }

function bootstrap(seed, ruler, mode){
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
  sandbox.location={ hash:'#s='+seed, origin:'', pathname:'', reload(){ throw new Error('reload'); } };
  sandbox.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
  sandbox.matchMedia=()=>({matches:false}); sandbox.requestAnimationFrame=()=>{};
  sandbox.performance=require('perf_hooks').performance; sandbox.console=console;
  const vm=require('vm');
  let code=fs.readFileSync(path.join(ROOT,'game.js'),'utf8').replace("'use strict';",'')
    + '\nwindow.__G={S:S,W:W,CARDS:CARDS,finishSetup:finishSetup,factionSeason:factionSeason,'
    + 'coRulerStrength:coRulerStrength,resolveCoRulerWar:resolveCoRulerWar,crownMight:crownMight,'
    + 'acclaimWatch:acclaimWatch,usurpMight:usurpMight,crownHostMight:crownHostMight,'
    + 'reignVerdict:reignVerdict,cardQ:cardQ,annals:window.annals};';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename:'game.js'});
  const G=sandbox.__G; G.finishSetup(ruler[0], ruler[1], mode||'crown');
  return { G, annals:sandbox.annals };
}
function fire(G, id, opt){ G.S.pendingCard={id,c:G.CARDS[id]}; const o=G.CARDS[id].o[opt]; o.f(); G.S.pendingCard=null; G.S.seenCards[id]=G.S.week; }
// divide the realm the way the treat answer does (fire the real option so the flags are the real flags)
function divide(G){
  G.S.week=520; G.S.pretender={name:'Aymer',house:'Vorn',base:800,reachBacking:1000,defectStr:0,defector:null};
  fire(G,'pretender-war',2);
}

/* ============ §1 the treaty installs a PERSON: name, house, march, and a date ============ */
console.log('§1 the divided realm records its co-ruler — who he is, what he holds, and since when');
{
  const {G}=bootstrap(3030830,['Queen','Divide']);
  divide(G);
  ok(G.S.flags.dividedRealm===true, 'the treat answer still divides the realm');
  ok(G.S.flags.coRuler && G.S.flags.coRuler.name==='Aymer' && G.S.flags.coRuler.house==='Vorn', 'the co-ruler is a named person now');
  ok(typeof G.S.flags.coRuler.march==='string' && G.S.flags.coRuler.march.length>0, 'his ceded march is recorded by name');
  ok(G.S.flags.dividedAt===520, 'the week of the division is recorded (the arc’s clock)');
  ok(!JSON.stringify(G.annals.state()).includes('coRuler'), 'the co-ruler bookkeeping is named nowhere in state()');
}

/* ============ §2 the second court presses, and the muster answers ============ */
console.log('§2 curbing the co-ruler: a strong muster reunifies the realm; a weak one loses a second march');
{
  // the win: a strong crown takes the realm back whole
  const w=bootstrap(3030830,['Queen','Curb']).G;
  divide(w); w.S.week=660; w.S.levies=6000; w.S.built={bulwark:1,warden:1}; w.S.legit=60; w.S.factions.court.disp=60;
  const marchName=w.S.flags.coRuler.march;
  fire(w,'co-ruler-court',0);
  ok(w.S.flags.dividedRealm===false && w.S.flags.reunified===660, 'a strong muster ends the division (reunified)');
  ok(w.S.legit>60-1, 'reunification proves the mandate up, not down');
  w.S.over='endured';
  ok(w.reignVerdict()==='the Reunifier', 'the verdict crowns the deed: the Reunifier');
  // the loss: a thin muster and the co-ruler ascends
  const l=bootstrap(3030830,['Queen','Lose']).G;
  divide(l); l.S.week=900; l.S.levies=600; l.S.built={}; l.S.legit=25; l.S.factions.court.disp=25;
  fire(l,'co-ruler-court',0);
  ok(l.S.flags.dividedRealm===true && l.S.flags.coRulerAscendant===true, 'a lost curb leaves the realm divided, the co-ruler ascendant');
  ok(!l.S.flags.reunified, 'no reunification on a lost field');
}

/* ============ §3 concede, or wed the lines ============ */
console.log('§3 the softer answers: a conceded succession, or a wedding that mends the realm');
{
  const c=bootstrap(3030830,['Queen','Concede']).G;
  divide(c); c.S.week=660; c.S.legit=50;
  fire(c,'co-ruler-court',1);
  ok(c.S.flags.dividedRealm===true && c.S.legit<50, 'conceding keeps the division and mortgages the mandate');
  const m=bootstrap(3030830,['Queen','Wed']).G;
  divide(m); m.S.week=660; m.S.legit=50;
  fire(m,'co-ruler-court',2);
  ok(m.S.flags.dividedRealm===false && m.S.flags.dividedHealed===660, 'the wedding ends the division (healed, not conquered)');
  ok(!m.S.flags.reunified, 'a healed realm is not a REUNIFIED one — the Reunifier is earned in the field only');
}

/* ============ §4 the ascendant co-ruler drains double ============ */
console.log('§4 a co-ruler who has beaten the Crown drains the mandate at twice the rate');
{
  const a=bootstrap(3030830,['Queen','DrainA']).G; a.S.flags.dividedRealm=true; a.S.week=780; a.S.legit=50;
  a.factionSeason(); const plain=50-a.S.legit;
  const b=bootstrap(3030830,['Queen','DrainB']).G; b.S.flags.dividedRealm=true; b.S.flags.coRulerAscendant=true; b.S.week=780; b.S.legit=50;
  b.factionSeason(); const asc=50-b.S.legit;
  ok(asc>plain, 'the ascendant drain ('+asc+') outpaces the plain division drain ('+plain+')');
}

/* ============ §5 the marriage path: suit → betrothal → the consort's hour ============ */
console.log('§5 P8 path 1: a knight can now marry into the line and be raised on the succession');
{
  const {G}=bootstrap(3030830,['Queen','Wedder'],'noble');
  fire(G,'nb-first-suit',3);
  ok(G.S.flags.suitMarriage===true, 'the appended fourth suit declares for a match into the line');
  G.S.week=110; G.S.gold=400;
  fire(G,'nb-betrothal',0);
  ok(G.S.noble.path==='marriage' && G.S.gold===220, 'sealing the match sets the path and pays the bride-price (180)');
  // the consort's hour, with the court convinced: the knight ascends
  G.S.week=260; G.S.factions.court.disp=66; G.S.legit=58;
  fire(G,'nb-consort-crown',0);
  ok(G.S.mode==='crown' && G.S.noble.ascended===true, 'the consort is raised: the climb ends on the Cold Chair');
  ok(G.S.legit===56, 'a marriage crown starts at the spec’s legitimacy (56)');
}
{
  // the court unconvinced: passed over, and the question returns
  const {G}=bootstrap(3030830,['Queen','Passed'],'noble');
  fire(G,'nb-first-suit',3); G.S.week=110; G.S.gold=400; fire(G,'nb-betrothal',0);
  G.S.week=260; G.S.factions.court.disp=40; G.S.legit=40;
  fire(G,'nb-consort-crown',0);
  ok(G.S.mode==='noble' && !G.S.noble.ascended, 'an unconvincing consort is passed over, still a knight');
  ok(G.S.schedule.some(s=>s.week>260), 'the succession question is scheduled to return');
}

/* ============ §6 the usurpation path: seed → grievance → acclaim → the gates ============ */
console.log('§6 P8 path 3: the League’s knight can march on a hollow crown — and win, or hang');
{
  const {G}=bootstrap(3030830,['Queen','Banner'],'noble');
  fire(G,'nb-muster-quietly',0);
  ok(G.S.flags.usurpSeed===true && G.S.noble.guardCap>650, 'raising men anyway seeds the path and lifts the cap');
  G.S.week=200;
  fire(G,'nb-grievance',0);
  ok(G.S.flags.acclaimWatch===true, 'taking up the League’s cause arms the acclaim watch');
  ok(G.S.levies===1050, 'the champion’s gate draws volunteers (650 start +150 raised +250 League = 1050), got '+G.S.levies);
  // gates NOT met: the watch waits
  G.S.factions.commons.disp=50; G.S.noble.crownLegit=60;
  G.acclaimWatch();
  ok(G.cardQ.indexOf('nb-the-acclaim')<0, 'no acclaim while the crown stands tall and the square is lukewarm');
  // gates met: commons 70+, guard near cap, crown hollow
  G.S.factions.commons.disp=74; G.S.levies=G.S.noble.guardCap; G.S.noble.crownLegit=28;
  G.acclaimWatch();
  ok(G.cardQ.indexOf('nb-the-acclaim')>=0, 'love, strength, and a hollow crown together raise the banner letter');
  // the march, and the gates: a strong claimant takes the chair
  G.S.week=300; G.S.legit=40;
  fire(G,'nb-the-acclaim',0);
  ok(G.S.noble.path==='usurp' && G.S.flags.usurpMarch===true && G.S.levies>G.S.noble.guardCap, 'the banner is raised: the League’s levies join the guard');
  G.S.week=306;
  fire(G,'nb-the-cold-chair-taken',0);
  ok(G.S.mode==='crown' && G.S.noble.ascended===true, 'the gates open: usurpation by acclaim ends on the Cold Chair');
  ok(G.S.legit===30, 'a usurped crown starts doubted (the spec’s 30)');
}
{
  // the failed march: attainder — and the line continues
  const {G}=bootstrap(3030830,['Queen','Block'],'noble');
  fire(G,'nb-muster-quietly',0); G.S.week=200; fire(G,'nb-grievance',0);
  G.S.week=300; G.S.legit=10; G.S.factions.commons.disp=40; G.S.factions.court.disp=60; G.S.noble.crownLegit=70;
  fire(G,'nb-the-acclaim',0);
  G.S.week=306; G.S.levies=500;
  fire(G,'nb-the-cold-chair-taken',0);
  ok(G.S.over==='attainted', 'a march the arithmetic never favored ends on the block (attainted)');
}

/* ============ §7 the untouched reign is untouched ============ */
console.log('§7 gating: no division → no co-ruler arc; no seed → no usurpation; state() clean');
{
  const {G,annals}=bootstrap(3030830,['Queen','Clean']);
  G.S.week=800;
  ok(G.cardQ.indexOf('co-ruler-court')<0 && !G.S.flags.coRuler, 'an undivided reign never meets the second court');
  const js=JSON.stringify(annals.state());
  ok(!js.includes('usurp') && !js.includes('acclaim') && !js.includes('coRuler'), 'none of the new bookkeeping is named in state()');
}

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);

