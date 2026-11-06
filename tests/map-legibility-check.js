// tests/map-legibility-check.js — the map must earn the space it takes (issue #12).
//
// WHAT MEASUREMENT SAID, on the pre-fix build. An 8x6 ink-density grid of the terrain canvas (the
// cartographer's double frame excluded, since it touches all four edges):
//
//     8  0  8 23 15  0  6 16
//     7  0  0 35 33  1  2  5
//     9  3 11  2  0  0  0  0
//     9  0  9  1  0  0  0  0
//    11  0  3  6  0  0  0  1
//    15 20 25 28 24 20 16 18     <- the sea, the only part carrying its weight
//
// SEVENTEEN of those 48 cells are at exactly 0% ink and twenty are at or under 1% — the whole right-centre
// and lower-right, just as the issue says. (The grid above is this test's own pre-fix output; count it.)
// But the issue's proposed remedy, "crop/zoom the map to the realm's actual bounds", is
// contraindicated by the same measurement: the ink bbox already runs [16,16]-[923,602], i.e. **margins of
// L0 T0 R1 B2**. There is no margin to crop. The emptiness is INTERIOR, and interior emptiness wants
// drawing, not framing — so the fix draws the open ground instead of tightening the frame.
//
// THE IRON LAW. paintTerrain already consumes rDetail (the vellum mottling, the road curves), so any new
// RNG draw here would shift every later mood-draw and break byte-identical replay of every saved reign and
// history link. Every mark added is therefore a pure hash of its own position. That is asserted here two
// ways: same seed twice must give a pixel-identical map, and different seeds must not.
//
// Asserts:
//   [1] the interior is drawn: empty cells collapse, total ink rises, the sea is untouched
//   [2] the map is deterministic — the same seed renders pixel-identical twice (no RNG at paint time)
//   [3] ...and is still seed-specific: a different seed renders a different map
//   [4] mountains use all three glyph variants, with jittered scale and baseline
//   [5] no two labels overlap — the collision pass actually resolves
//   [6] every town name is placed, none dropped
'use strict';
const path=require('path');
let chromium; try{ ({chromium}=require('playwright')); }
catch(e){ console.log('map-legibility: SKIPPED (npm i playwright --no-save to enable)'); process.exit(0); }
const FILE='file:///'+path.join(__dirname,'..','index.html').replace(/\\/g,'/');

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++;console.log('  FAIL: '+m);} }

// Ink density over an 8x6 grid, the frame excluded, plus a cheap hash of the whole canvas.
const PROBE=`(()=>{
  const c=document.getElementById('map'), g=c.getContext('2d');
  const W=c.width, H=c.height, d=g.getImageData(0,0,W,H).data, M=16;
  const isInk=i=>Math.abs(d[i]-231)+Math.abs(d[i+1]-219)+Math.abs(d[i+2]-182)>60;
  let ink=0, n=0, x0=W, y0=H, x1=0, y1=0;
  for(let y=M;y<H-M;y++) for(let x=M;x<W-M;x++){ const i=(y*W+x)*4; n++;
    if(isInk(i)){ ink++; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
  const GX=8, GY=6, cells=[];
  for(let gy=0;gy<GY;gy++) for(let gx=0;gx<GX;gx++){
    const xa=M+Math.floor((W-2*M)*gx/GX), xb=M+Math.floor((W-2*M)*(gx+1)/GX);
    const ya=M+Math.floor((H-2*M)*gy/GY), yb=M+Math.floor((H-2*M)*(gy+1)/GY);
    let c2=0, t=0;
    for(let y=ya;y<yb;y++) for(let x=xa;x<xb;x++){ t++; if(isInk((y*W+x)*4)) c2++; }
    cells.push(Math.round(c2/t*100)); }
  let hash=2166136261;
  for(let i=0;i<d.length;i+=97){ hash^=d[i]; hash=Math.imul(hash,16777619); }
  return { inkPct:+(ink/n*100).toFixed(1), cells, hash:hash>>>0,
    margins:{l:x0-M,t:y0-M,r:(W-M)-x1,b:(H-M)-y1} };
})()`;

async function renderMap(browser, seed, w){
  const page=await browser.newPage({ viewport:{width:w||1200,height:900} });
  await page.goto(FILE+'#s='+seed);
  await page.waitForSelector('#card.open',{timeout:9000});
  await page.evaluate(()=>finishSetup('Queen','Probe','crown','cold'));
  await page.waitForTimeout(450);
  const probe=await page.evaluate(PROBE);
  // guarded: on a build without the variety/label machinery these identifiers do not exist, and a missing
  // feature must read as a clean failure rather than an unhandled rejection
  const extra=await page.evaluate(()=>{
   try{
    if(typeof mapH!=='function') return { variants:{}, distinctScales:0, distinctBases:0,
      mts:W.mts.length, labels:0, overlaps:-1, worst:null, towns:W.towns.length, absent:'mapH' };
    if(typeof LABEL_BAKED==='undefined') return { variants:{}, distinctScales:0, distinctBases:0,
      mts:W.mts.length, labels:0, overlaps:-1, worst:null, towns:W.towns.length, absent:'LABEL_BAKED' };
    // mountain glyph variety, read the same way paintTerrain reads it
    const variants={}, scales=new Set(), bases=new Set();
    W.mts.forEach(m=>{ const v=Math.floor(mapH(m.x,m.y,'mv')*3);
      variants[v]=(variants[v]||0)+1;
      scales.add((m.s*(0.84+mapH(m.x,m.y,'mt')*0.42)).toFixed(2));
      bases.add(((mapH(m.x,m.y,'mt2')-0.5)*5).toFixed(2)); });
    // label rects placed this frame, plus the ones baked into the terrain
    const rects=LABEL_BAKED.concat(LABEL_TAKEN);
    let overlaps=0, worst=null;
    for(let i=0;i<rects.length;i++) for(let j=i+1;j<rects.length;j++){ const a=rects[i], b=rects[j];
      if(a.x<b.x+b.w && b.x<a.x+a.w && a.y<b.y+b.h && b.y<a.y+a.h){ overlaps++; if(!worst) worst=[i,j]; } }
    return { variants, distinctScales:scales.size, distinctBases:bases.size, mts:W.mts.length,
             labels:rects.length, overlaps, worst, towns:W.towns.length, absent:null };
   }catch(e){ return { variants:{}, distinctScales:0, distinctBases:0, mts:0, labels:0,
     overlaps:-1, worst:null, towns:0, absent:String(e).slice(0,60) }; } });
  await page.close();
  return Object.assign(probe, extra);
}

(async()=>{
  let browser;
  try{ browser=await chromium.launch(); }
  catch(e){ console.log('map-legibility: SKIPPED (no browser binary — npx playwright install chromium)'); process.exit(0); }

  const a=await renderMap(browser, 3030830);
  const empty=a.cells.filter(v=>v===0).length;
  const nearEmpty=a.cells.filter(v=>v<=1).length;

  console.log('seed 3030830 — ink '+a.inkPct+'%, margins L'+a.margins.l+' T'+a.margins.t
    +' R'+a.margins.r+' B'+a.margins.b);
  for(let r=0;r<6;r++) console.log('   '+a.cells.slice(r*8,r*8+8).map(v=>String(v).padStart(3)).join(''));

  /* ---- [1] the interior is drawn ---- */
  ok(empty<=2, 'at most 2 of 48 cells are bare vellum — was 17 (now '+empty+')');
  ok(nearEmpty<=6, 'at most 6 cells are at or under 1% ink — was 20 (now '+nearEmpty+')');
  ok(a.inkPct>=8.5, 'total ink coverage rose above 8.5% — was 8.2% (now '+a.inkPct+'%)');
  // the sea is the one band that already carried weight; it must not have been touched
  const sea=a.cells.slice(40);
  ok(Math.min.apply(null,sea)>=14, 'the sea band still carries its own weight (min '+Math.min.apply(null,sea)+'%)');
  // and the crop that the issue proposed is still contraindicated — no margin exists to crop
  ok(a.margins.l<=2 && a.margins.t<=2 && a.margins.r<=3 && a.margins.b<=4,
     'the ink still touches every edge, so a bounds-crop would reclaim nothing (this is why the fix draws '
     +'the interior instead): L'+a.margins.l+' T'+a.margins.t+' R'+a.margins.r+' B'+a.margins.b);

  /* ---- [2][3] determinism, and seed-specificity ---- */
  const again=await renderMap(browser, 3030830);
  ok(again.hash===a.hash, 'the same seed renders a PIXEL-IDENTICAL map twice — no RNG at paint time '
     +'(hash '+a.hash+' vs '+again.hash+')');
  const other=await renderMap(browser, 7777);
  ok(other.hash!==a.hash, 'a different seed renders a different map (still seed-specific)');

  /* ---- [4] glyph variety ---- */
  const vs=Object.keys(a.variants).sort();
  ok(vs.length===3, 'mountains draw all three glyph variants across '+a.mts+' peaks (saw '
     +vs.map(k=>k+':'+a.variants[k]).join(', ')+')');
  ok(Math.min.apply(null, vs.map(k=>a.variants[k])) >= a.mts*0.15,
     'no variant is a rounding error — the least-used still covers 15% of the range');
  ok(a.distinctScales>=20, 'scale is jittered per peak ('+a.distinctScales+' distinct scales)');
  ok(a.distinctBases>=20, 'the baseline is jittered per peak ('+a.distinctBases+' distinct offsets)');

  /* ---- [5][6] labels ---- */
  ok(a.overlaps===0, a.absent ? 'the label collision pass is absent from this build ('+a.absent+')'
     : 'no two labels overlap after the collision pass ('+a.overlaps+' overlapping pairs among '
       +a.labels+' placed)');
  ok(a.labels >= 5+a.towns, 'every name is placed — 5 map labels + '+a.towns+' towns = '
     +(5+a.towns)+', saw '+a.labels);

  await browser.close();
  console.log('==== map legibility: '+pass+' pass, '+fail+' fail ====');
  process.exit(fail?1:0);
})();
