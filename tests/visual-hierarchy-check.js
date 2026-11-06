// tests/visual-hierarchy-check.js — the first screen must show the realm, not a catalogue (issue #11).
//
// WHAT WAS WRONG. Measured on the pre-fix build at 1440x900, immediately after starting a reign:
// `maybeWelcome()` called `scrollIntoView({block:'center'})` on a note that sat BELOW `#cols` — i.e. below
// thirty-odd build buttons — so the page jumped to **scrollY 1002** and the map went to **y=-903, 0%
// visible**. The first full screen a new player got was a wall of greyed works with requirement text
// ("needs a city & guildhall", "a pass wonder — needs a city, walls & a bulwark"), the chronicle at
// y=1526, and the Chronicler's Welcome buried underneath the grid — which is very likely why the
// onboarding didn't land. 37 works on the board, 21 of them buildable. And before the reign began the
// ledger showed six em-dash placeholders in the most prominent panel on the page, which reads as broken.
//
// THE ORDER THIS ASSERTS: map -> the monk's word -> chronicle -> works. The map is the hero and the
// chronicle is the soul; the purse and the works are instruments, and instruments go on the workbench.
//
// Asserts:
//   [1] DOM order inside the map column is map, welcome, chronicle, works
//   [2] the Welcome appears WITHOUT scrolling the page (scrollY stays 0) and the map stays fully visible
//   [3] on the steady first screen the map is 100% visible and the works panel is below the fold
//   [4] the chronicle has real lines on screen, unscrolled
//   [5] the works fold: only earned works on the board, the rest behind a summary that names the count,
//       nothing lost — expanding restores the full catalogue
//   [6] no em-dash placeholder is ever visible to a player, at setup or in play
'use strict';
const path=require('path');
let chromium; try{ ({chromium}=require('playwright')); }
catch(e){ console.log('visual-hierarchy: SKIPPED (npm i playwright --no-save to enable)'); process.exit(0); }
const FILE='file:///'+path.join(__dirname,'..','index.html').replace(/\\/g,'/');

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++;console.log('  FAIL: '+m);} }

(async()=>{
  let browser;
  try{ browser=await chromium.launch(); }
  catch(e){ console.log('visual-hierarchy: SKIPPED (no browser binary — npx playwright install chromium)'); process.exit(0); }

  for(const vp of [{label:'1440x900',width:1440,height:900},{label:'390x844',width:390,height:844}]){
    const page=await browser.newPage({ viewport:{width:vp.width, height:vp.height} });
    await page.goto(FILE+'#s=3030830');
    await page.waitForSelector('#card.open',{timeout:9000});
    const w=vp.label;

    /* ---- [1] DOM order ---- */
    const order=await page.evaluate(()=>{
      const col=document.getElementById('mapcol');
      const want=['mapwrap','welcome','chron','panel-works'];
      const got=[...col.children].map(e=>e.id).filter(id=>want.includes(id));
      return { got, chronInCols: !!document.getElementById('cols').contains(document.getElementById('chron')) };
    });
    ok(order.got.join(' > ')==='mapwrap > welcome > chron > panel-works',
       w+': the map column reads map > welcome > chronicle > works (got '+order.got.join(' > ')+')');
    ok(order.chronInCols, w+': the chronicle lives inside the layout column, not stranded below it');

    /* ---- [6a] no dead dashes before a reign exists ---- */
    const setup=await page.evaluate(()=>{
      const dashes=[...document.querySelectorAll('#respanel b, #panel-purse span[id^=v-]')]
        .filter(e=>/^[–-]$/.test((e.textContent||'').trim()));
      return { total:dashes.length, visible:dashes.filter(e=>e.offsetParent!==null).length,
               ledger:document.getElementById('ledger').offsetParent!==null }; });
    ok(setup.visible===0, w+': no em-dash placeholder is visible at setup ('+setup.visible+' of '
       +setup.total+' rendered are on screen)');
    ok(!setup.ledger, w+': the ledger waits until there is a realm to account for');

    /* ---- start a reign by raw taps, as a player does ---- */
    const tap=async(re)=>{ const t=await page.evaluate(src=>{ const r=new RegExp(src,'i');
        const b=[...document.querySelectorAll('#letter button')]
          .filter(e=>e.getBoundingClientRect().height>0).find(e=>r.test(e.textContent||''));
        if(!b) return null; const q=b.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; }, re.source);
      if(!t) return false; await page.mouse.click(t.x,t.y); await page.waitForTimeout(380); return true; };
    await tap(/The Crown/); await tap(/Take the throne/); await tap(/The Cold Chair/);
    await page.waitForTimeout(800);   // let maybeWelcome settle

    /* ---- [2] the Welcome is seen without dragging the realm off screen ---- */
    const welc=await page.evaluate(()=>{ const vis=el=>{ const q=el.getBoundingClientRect();
        return Math.round(Math.max(0,Math.min(innerHeight,q.bottom)-Math.max(0,q.top))/q.height*100); };
      const wl=document.getElementById('welcome');
      return { scrollY:Math.round(scrollY), shown:!wl.hidden, welcome:vis(wl),
               map:vis(document.getElementById('mapwrap')) }; });
    ok(welc.shown, w+': the Chronicler\'s Welcome is shown on a first reign');
    ok(welc.scrollY===0, w+': showing it does not scroll the page (scrollY '+welc.scrollY+', was 1002)');
    ok(welc.welcome>=90, w+': the note is on screen ('+welc.welcome+'% visible)');
    ok(welc.map>=99, w+': and the MAP is still on screen with it ('+welc.map+'% visible, was 0%)');

    /* ---- [6b] the ledger comes back, with numbers ---- */
    const play=await page.evaluate(()=>({
      ledger:document.getElementById('ledger').offsetParent!==null,
      dashes:[...document.querySelectorAll('#respanel b')]
        .filter(e=>e.offsetParent!==null && /^[–-]$/.test((e.textContent||'').trim())).length,
      gold:(document.getElementById('r-gold')||{}).textContent }));
    ok(play.ledger, w+': the ledger appears once the reign begins');
    ok(play.dashes===0 && /\d/.test(play.gold||''), w+': and it carries real numbers (treasury "'+play.gold+'")');

    /* ---- [3][4] the steady first screen ---- */
    await page.evaluate(()=>{ document.getElementById('welcomeclose').click();
      for(let i=0;i<40;i++){ if(annals.choices()) break; annals.advance(1); } });
    await page.waitForTimeout(400);
    const first=await page.evaluate(()=>{ const vis=el=>{ const q=el.getBoundingClientRect();
        return Math.round(Math.max(0,Math.min(innerHeight,q.bottom)-Math.max(0,q.top))/q.height*100); };
      const cb=document.getElementById('chronbody');
      const onScreen=[...cb.children].filter(e=>{ const q=e.getBoundingClientRect();
        return q.top>=0 && q.bottom<=innerHeight; }).length;
      return { scrollY:Math.round(scrollY), map:vis(document.getElementById('mapwrap')),
               chron:vis(document.getElementById('chron')),
               works:vis(document.getElementById('panel-works')),
               chronLines:onScreen, chronTotal:cb.children.length }; });
    ok(first.map>=99, w+': first screen — the map is fully on it ('+first.map+'%)');
    ok(first.works<=25, w+': first screen — the works are below the fold ('+first.works+'% visible, was 60%)');
    ok(first.chronLines>=2, w+': first screen — the monk\'s voice is readable ('+first.chronLines
       +' of '+first.chronTotal+' chronicle lines fully on screen)');

    /* ---- [5] the fold keeps everything ---- */
    const fold=await page.evaluate(()=>{
      const board=document.querySelectorAll('#builds .bld').length;
      const hidden=document.querySelectorAll('#builds-locked .bld').length;
      // guarded: on a build with no fold at all these are absent, and a missing feature should read as a
      // clean failure, not an unhandled exception
      const d=document.getElementById('lockedworks') || {open:false, hidden:true};
      const sum=(document.getElementById('lockedsum')||{}).textContent || '(no fold in this build)';
      // every work on the board must be one the player has actually earned
      const unearned=[...document.querySelectorAll('#builds .bld')]
        .filter(b=>/needs |wonder —/.test(b.querySelector('.cost').textContent||'')).length;
      return { board, hidden, sum, unearned, open:d.open, hiddenAttr:d.hidden }; });
    ok(fold.hidden>0, w+': works whose requirement is unmet are folded away ('+fold.hidden+' of '
       +(fold.board+fold.hidden)+')');
    ok(fold.unearned===0, w+': nothing on the board carries requirement text ('+fold.unearned+' found)');
    ok(!fold.hiddenAttr && /^…and \d+ works? you have not yet earned$/.test(fold.sum),
       w+': the fold names its own count — "'+fold.sum+'"');
    ok(fold.board+fold.hidden>=30, w+': nothing was lost — '+(fold.board+fold.hidden)+' works still exist');

    // and opening it actually shows them
    const opened=await page.evaluate(()=>{ const d=document.getElementById('lockedworks');
      const box=document.getElementById('builds-locked');
      if(!d || !box) return { open:false, visible:-1 };
      d.open=true;
      return { open:d.open, visible:[...box.querySelectorAll('.bld')].filter(b=>b.offsetParent!==null).length }; });
    ok(opened.open && opened.visible===fold.hidden,
       w+': expanding the fold reveals all '+fold.hidden+' of them (saw '+opened.visible+')');

    await page.close();
  }

  await browser.close();
  console.log('==== visual hierarchy: '+pass+' pass, '+fail+' fail ====');
  process.exit(fail?1:0);
})();
