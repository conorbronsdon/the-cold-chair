// tests/moment-variety-check.js — the Last Leaf must not repeat itself (issue #13).
//
// THE DEFECT, as reported from `docs/last-leaf.png` — the README's hero image, the first thing anyone sees
// of this game. Two of the five defining moments were the same sentence:
//
//   "The Wood-Congregation was dragged into the daylight of the record at last, and the realm learned
//    who at its own table had been sworn elsewhere all along."
//   "The Cleaner Ledger was dragged into the daylight of the record at last, and the realm learned
//    who at its own table had been sworn elsewhere all along."
//
// One hardcoded string at weight 9, fired once per society. The variety pack (v0.23.1) had given the
// chronicle stream its state-hashed pools and left `moment()` alone — and `moment()` is what composes the
// Leaf, i.e. the one artifact people actually post. Weight 9 all but guaranteed both copies made the five.
//
// Asserts:
//   [1] each society exposed draws a DIFFERENT sentence (the pools, keyed per instance)
//   [2] the pool choice is stable across reigns — same society, same variant, every time (replay-safe)
//   [3] the Leaf's five hold at most ONE moment per template, however the pools worded them
//   [4] the freed slot is not wasted: the fifth line is the next-best real moment
//   [5] the Concordance still lists BOTH — fourteen lines have room where five do not
//   [6] every tagged template's pool is distinct, non-empty, and free of duplicate variants
//   [7] no two of a reign's five defining moments share a template — swept over many seeds
'use strict';
const fs=require('fs'), path=require('path');

function stubCtx(){ return new Proxy({}, { get:(t,p)=>(p in t?t[p]:()=>{}), set:(t,p,v)=>{t[p]=v;return true;} }); }
function mkEl(tag){
  const el={ tag, children:[], style:{cssText:''}, dataset:{}, textContent:'', value:'', className:'', hidden:true,
    classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
    appendChild(c){ el.children.push(c); return c; },
    removeChild(c){ const i=el.children.indexOf(c); if(i>=0)el.children.splice(i,1); },
    get firstChild(){ return el.children[0]; }, get lastChild(){ return el.children[el.children.length-1]; },
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
  global.localStorage={ getItem:()=>null, setItem(){}, removeItem(){} };
  global.matchMedia=()=>({matches:false}); global.requestAnimationFrame=()=>{};
  let code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
  code=code.replace("'use strict';",'') + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup,annals:annals,' +
    'exposeSociety:exposeSociety,leafMoments:leafMoments,codexMoments:codexMoments,moment:moment,' +
    'MOM_SOC_EXPOSED:MOM_SOC_EXPOSED,MOM_COUNCIL_MURDER:MOM_COUNCIL_MURDER,MOM_WYRM_SLAIN:MOM_WYRM_SLAIN,' +
    'MOM_TOWN_SACKED:MOM_TOWN_SACKED,MOM_TOWN_RAIDED:MOM_TOWN_RAIDED,MOM_TOWN_DEEP:MOM_TOWN_DEEP,' +
    'MOM_TOWN_CHARTER:MOM_TOWN_CHARTER,MOM_TOWN_CITY:MOM_TOWN_CITY,momentEpithet:momentEpithet};';
  (0,eval)(code);
  return global.__G; }

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  PASS '+m);} else {fail++;console.log('  FAIL: '+m);} }

/* ============ the reported scenario: expose every society in one reign ============ */
console.log('\n[1-5] the reported reign — every society dragged into the daylight');
{
  const G=boot(3030830);
  G.finishSetup('Queen','Hero','crown','cold');
  for(let i=0;i<40;i++) G.annals.advance(1);            // let the reign have some years to place moments in
  const ids=Object.keys(G.S.societies);
  ok(ids.length>=2, 'the world has '+ids.length+' societies to expose');
  ids.forEach((id,n)=>{ for(let i=0;i<20;i++) G.annals.advance(1); G.exposeSociety(id); });

  const soc=G.S._moments.filter(m=>m.tmpl==='soc-exposed');
  ok(soc.length===ids.length, 'each exposure recorded a moment ('+soc.length+' of '+ids.length+')');

  const texts=new Set(soc.map(m=>m.text));
  ok(texts.size===soc.length, 'every exposure drew a DIFFERENT sentence ('+texts.size+' distinct of '+soc.length+')');
  // stronger, and the assertion that actually matters: distinct SENTENCE SHAPES, not merely distinct
  // names inside one shape. Three names in one template is the reported defect, and it passes a
  // distinct-text check. Compare each line against the pool with a neutral subject.
  const shapes=new Set(soc.map(m=>{
    const i=G.MOM_SOC_EXPOSED.findIndex(f=>{ const tail=f('§').slice(1); return m.text.endsWith(tail); });
    return i; }));
  ok(!shapes.has(-1), 'every exposure line comes from the pool');
  ok(shapes.size===soc.length, 'every exposure drew a different VARIANT of the pool, not one shape with the '
     +'name swapped (variants '+[...shapes].join(', ')+')');
  soc.forEach(m=>console.log('        · '+m.text.slice(0,96)+'…'));

  // [3] the Leaf's five
  const five=G.leafMoments();
  const socInFive=five.filter(m=>/dragged into the daylight|broken open in open court|named aloud at last|taken apart on the record|held to be a rumour/.test(m.text));
  ok(five.length<=5, 'the Leaf composes at most five moments (got '+five.length+')');
  ok(socInFive.length<=1, 'at most ONE society exposure reaches the five (got '+socInFive.length+')');

  // [4] the freed slot went to a real moment, not to nothing
  ok(five.length===Math.min(5, new Set(G.S._moments.map(m=>m.tmpl||m.text)).size),
     'the freed slot is filled by the next-best moment, not left blank ('+five.length+' lines)');

  // [5] the Concordance has room for all of them
  const cx=G.codexMoments();
  const socInCx=cx.filter(m=>texts.has(m.text));
  ok(socInCx.length===soc.length, 'the Concordance still lists every exposure ('+socInCx.length+' of '+soc.length+')');
}

/* ============ [2] the pool choice is stable — a replayed reign reads the same ============ */
console.log('\n[2] the same society always draws the same variant (replay-safe)');
{
  const pick=seed=>{ const G=boot(seed); G.finishSetup('Queen','Hero','crown','cold');
    for(let i=0;i<40;i++) G.annals.advance(1);
    const out={}; Object.keys(G.S.societies).forEach(id=>{ G.exposeSociety(id);
      out[id]=G.S._moments.filter(m=>m.tmpl==='soc-exposed').slice(-1)[0].text; });
    return out; };
  const a=pick(3030830), b=pick(3030830);
  ok(JSON.stringify(a)===JSON.stringify(b), 'two runs of the same seed choose identical variants — which is '
     +'what makes a shared history link re-ink the same page (no RNG stream is consumed)');
  // and every world's three orders are mutually distinct, whatever offset its realm name lands on
  const c=pick(7777);
  const distinct=o=>new Set(Object.values(o)).size===Object.keys(o).length;
  ok(distinct(a)&&distinct(c), 'both worlds give their three orders three different lines');
}

/* ============ [6] the pools themselves ============ */
console.log('\n[6] every pool is a real pool');
{
  const G=boot(3030830);
  const POOLS={ MOM_SOC_EXPOSED:G.MOM_SOC_EXPOSED, MOM_COUNCIL_MURDER:G.MOM_COUNCIL_MURDER,
    MOM_WYRM_SLAIN:G.MOM_WYRM_SLAIN, MOM_TOWN_SACKED:G.MOM_TOWN_SACKED, MOM_TOWN_RAIDED:G.MOM_TOWN_RAIDED,
    MOM_TOWN_DEEP:G.MOM_TOWN_DEEP, MOM_TOWN_CHARTER:G.MOM_TOWN_CHARTER, MOM_TOWN_CITY:G.MOM_TOWN_CITY };
  for(const [name,pool] of Object.entries(POOLS)){
    const lines=pool.map(f=>f('X'));
    ok(pool.length>=4 && new Set(lines).size===pool.length,
       name+': '+pool.length+' distinct variants, none repeated');
    ok(lines.every(l=>typeof l==='string' && l.includes('X')),
       name+': every variant places its subject');
  }
}

/* ============ [7] the invariant, swept ============ */
console.log('\n[7] across many reigns, no two of the five share a template');
{
  const SEEDS=[3030830,7777,4655760,1043,90210,555,31337,2026];
  let worst=null, checked=0;
  for(const seed of SEEDS){
    for(const pick of [0,1]){
      const G=boot(seed);
      G.finishSetup('Queen','Sweep','crown','cold');
      let guard=0;
      while(G.S.week<1040 && !G.S.over && guard++<20000){
        if(G.S.pendingCard){ const c=G.S.pendingCard.c, o=(G.S.mode==='noble'&&c.oN)?c.oN:c.o;
          G.annals.choose(pick%o.length); continue; }
        G.annals.advance(1);
      }
      const five=G.leafMoments(), tags=five.map(m=>m.tmpl).filter(Boolean);
      checked++;
      if(new Set(tags).size!==tags.length) worst=seed+'/pick'+pick+': '+tags.join(', ');
      // and no two of the five may be the same sentence, tagged or not
      const t=five.map(m=>m.text);
      if(new Set(t).size!==t.length) worst=seed+'/pick'+pick+': a repeated SENTENCE in the five';
    }
  }
  ok(worst===null, 'swept '+checked+' full reigns; no template or sentence repeats in any Leaf'
     +(worst?' — '+worst:''));
}

/* ===== [8] rewording a moment must not rename its YEAR =====
   The Last Leaf's illuminated year headers are named by momentEpithet(), which matched on SUBSTRINGS of
   the moment's prose — 'was sacked', 'murdered', 'hoard' — and these pools deliberately reword exactly
   those. Measured before the fix, FIVE of the eight tagged templates produced a DIFFERENT year epithet
   depending on which variant the hash happened to pick, and a raided town could be named "the Year of the
   New Roofs" — the growth epithet — because its wording still contained the word "town". Byte-identity
   cannot see any of this: no state(), no _chron. The tag is the stable meaning; the prose is not. */
console.log('\n[8] every variant of a template names the same year');
{
  const G=boot(3030830);
  const POOLS={ 'soc-exposed':G.MOM_SOC_EXPOSED, 'council-murder':G.MOM_COUNCIL_MURDER,
    'wyrm-slain':G.MOM_WYRM_SLAIN, 'town-sacked':G.MOM_TOWN_SACKED, 'town-raided':G.MOM_TOWN_RAIDED,
    'town-deep':G.MOM_TOWN_DEEP, 'town-charter':G.MOM_TOWN_CHARTER, 'town-city':G.MOM_TOWN_CITY };
  for(const [tag,pool] of Object.entries(POOLS)){
    const names=[...new Set(pool.map(f=>G.momentEpithet(f('Oskwick'), tag)))];
    ok(names.length===1 && !!names[0],
       tag.padEnd(15)+' → all '+pool.length+' variants name the year "'+names[0]+'"'
       +(names.length>1?' — DISAGREE: '+names.join(' | '):''));
  }
  // and an UNTAGGED moment still classifies from its prose, as it always did
  ok(G.momentEpithet('They burned '+G.W.wood+' from three sides in one night.')==='the Year the Wood Woke',
     'an untagged moment still takes its epithet from the text');
  ok(G.momentEpithet('a quiet year of no particular deed', 'no-such-template')==='the Year of the Heavy Hand',
     'an unknown tag falls through to the text classifier rather than returning nothing');
}

console.log('\n==== moment variety: '+pass+' pass, '+fail+' fail ====');
process.exit(fail?1:0);

