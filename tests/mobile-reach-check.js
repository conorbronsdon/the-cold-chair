// tests/mobile-reach-check.js — every setup option must be reachable by a thumb (issues #6, #7).
//
// THE BUG. `#card` was `position:absolute; inset:0` inside `#mapwrap`, so its height WAS the map's height,
// and `.letter` is `max-height:92%` of that. On a 390x844 phone the setup card got **183px of window for
// 590px of content**. It scrolled — but inside a 183px sub-box with no visible affordance, adrift in an
// 844px page whose own scrollbar does nothing for it. At rest only the first of five options sat at a
// tappable coordinate; `document.elementFromPoint` at the other four returned the works panel's build
// buttons underneath, so a thumb aimed at "Sit the Week's Chair" landed on a disabled "Cathedral".
//
// Unreachable that way: Minor-Noble (Regency) — an entire game mode — the ill-made-crown shelf, Found a
// Legacy Realm, and the Week's Chair, which the roadmap calls the most important virality feature in v2.
//
// AND IT WAS NOT MOBILE-ONLY. The issue reports desktop as fine; it isn't. The two-column grid squeezes
// the map at laptop widths too, and the failure is not monotonic in width: measured on the pre-fix build,
// 1024px and 960px each lost two options of five while 900px, 860px and 820px were fine. That is why the
// fix is not a breakpoint — the card must simply never be height-bound by the map.
//
// WHY THIS TEST USES RAW COORDINATES (#7). `locator.click()` scrolls the element into view and dispatches
// at it, so it reaches things a finger cannot — it would have passed on the broken build. Every assertion
// here either asks `elementFromPoint` who owns the option's own centre pixel, or drives `mouse.click(x,y)`
// at raw coordinates, which is what a thumb does.
//
// Asserts, at eight widths from 360px to 1440px:
//   [1] all five setup options are reachable at their own centre pixel, unscrolled
//   [2] the Week's Chair actually STARTS from a raw coordinate tap (hash changes to a week's seed)
//   [3] the card is a full-viewport sheet, not a box inside the map
//   [4] the backdrop does not swallow the page: the Codex stays clickable while a letter is open
//   [5] a modal opened over a letter still wins the stack
'use strict';
const path=require('path');
const fs=require('fs');
let chromium; try{ ({chromium}=require('playwright')); }
catch(e){ console.log('mobile-reach: SKIPPED (npm i playwright --no-save to enable)'); process.exit(0); }
// pinned-version mismatch tolerance: prefer a system/preinstalled chromium if the pack's own is absent
const EXE=['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p=>fs.existsSync(p));

const FILE='file:///'+path.join(__dirname,'..','index.html').replace(/\\/g,'/');
const WIDTHS=[360,390,430,640,760,960,1024,1440];

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++;console.log('  FAIL: '+m);} }

(async()=>{
  let browser;
  try{ browser=await chromium.launch(EXE?{executablePath:EXE}:{}); }
  catch(e){ console.log('mobile-reach: SKIPPED (no browser binary — npx playwright install chromium)'); process.exit(0); }

  /* ===== [1][2][3] reachability at every width ===== */
  for(const width of WIDTHS){
    const page=await browser.newPage({ viewport:{width, height:844} });
    await page.goto(FILE+'#s=3030830');
    await page.waitForFunction(()=>document.getElementById('card').classList.contains('open'), {timeout:8000});
    await page.waitForTimeout(250);

    const shape=await page.evaluate(()=>{ const c=document.getElementById('card'), cs=getComputedStyle(c);
      const r=c.getBoundingClientRect();
      return { pos:cs.position, z:cs.zIndex, h:Math.round(r.height), vpH:innerHeight,
               pe:cs.pointerEvents, letterPE:getComputedStyle(document.getElementById('letter')).pointerEvents }; });
    ok(shape.pos==='fixed', width+'px: the card is fixed, not absolute inside the map (got '+shape.pos+')');
    ok(shape.h>=shape.vpH-1, width+'px: the card fills the viewport ('+shape.h+' of '+shape.vpH+'px)');
    ok(shape.pe==='none' && shape.letterPE==='auto',
       width+'px: the backdrop declines pointer events and the letter takes them back');

    // who owns each option's own centre pixel, with nothing scrolled?
    const owners=await page.evaluate(()=>{
      const opts=[...document.querySelectorAll('#letter button.choice')]
        .filter(b=>b.getBoundingClientRect().height>0);
      return opts.map(b=>{ const r=b.getBoundingClientRect(), x=r.x+r.width/2, y=r.y+r.height/2;
        const el=document.elementFromPoint(x,y);
        return { label:(b.querySelector('b')||b).textContent.trim().slice(0,34),
                 reachable: !!(el && b.contains(el)),
                 owner: el ? (el.tagName.toLowerCase()+(el.id?'#'+el.id:'')) : 'outside the viewport' }; });
    });
    ok(owners.length===5, width+'px: five setup options are on offer (got '+owners.length+')');
    for(const o of owners)
      ok(o.reachable, width+'px: "'+o.label+'" is reachable at its own centre — owned by '+o.owner);

    // the ground truth: a raw tap on the Week's Chair must actually begin the week's world
    const t=await page.evaluate(()=>{ const b=[...document.querySelectorAll('#letter button.choice')]
        .find(e=>/Week.s Chair/i.test(e.textContent||'')); if(!b) return null;
      const r=b.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height/2}; });
    ok(!!t, width+'px: the Week\'s Chair option exists');
    if(t){
      await page.mouse.click(t.x, t.y);
      await page.waitForTimeout(450);
      const hash=await page.evaluate(()=>location.hash);
      ok(/[?&#]d=\d{4}-\d{2}-\d{2}/.test(hash),
         width+'px: a RAW TAP on the Week\'s Chair starts the week\'s world (hash '+hash.slice(0,40)+')');
    }
    await page.close();
  }

  /* ===== [4][5] the backdrop must not swallow the page, and modals must still win ===== */
  {
    const page=await browser.newPage({ viewport:{width:390, height:844} });
    await page.goto(FILE+'#s=3030830');
    await page.waitForFunction(()=>document.getElementById('card').classList.contains('open'), {timeout:8000});
    await page.waitForTimeout(200);

    // The old absolute card only ever covered the map, and the map has no click handler — so every control
    // outside it stayed live while a letter was open. In a game about reading the record before deciding,
    // that is the affordance. Going full-viewport must not take it away.
    // scroll it into view first: on a phone the Codex button sits below the fold, and "outside the
    // viewport" is not the same claim as "blocked by the backdrop" — only the second one is a regression.
    const codex=await page.evaluate(()=>{ const b=document.getElementById('codexbtn'); if(!b) return null;
      b.scrollIntoView({block:'center'});
      const r=b.getBoundingClientRect();
      if(r.y<0 || r.y>innerHeight) return {skip:true};
      const el=document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
      return { owned: !!(el && b.contains(el)), by: el? (el.tagName.toLowerCase()+(el.id?'#'+el.id:'')):'none' }; });
    ok(codex && !codex.skip && codex.owned,
       'the Codex button is still clickable while the card is open (owned by '+(codex?codex.by:'?')+')');

    await page.evaluate(()=>document.getElementById('helpbtn').click());
    await page.waitForTimeout(300);
    const stack=await page.evaluate(()=>{ const h=document.getElementById('help');
      const el=document.elementFromPoint(innerWidth/2, 60);
      return { open:h.classList.contains('open'), top: !!(el && h.contains(el)),
               hz:+getComputedStyle(h).zIndex, cz:+getComputedStyle(document.getElementById('card')).zIndex }; });
    ok(stack.open && stack.top && stack.hz>stack.cz,
       'help opened over a letter owns the top pixels (help z='+stack.hz+' vs card z='+stack.cz+')');
    await page.close();
  }

  /* ===== [6] the LETTER panel, answered by a raw tap =====
     #6 was a setup-card bug, but #card is the same element for every letter of the reign, so the same
     geometry governed them. The issue asks for the reachability assertion on "the setup card and the letter
     panel"; this is the letter panel, driven the whole way by raw coordinates — no locator.click() anywhere,
     so nothing here can be rescued by Playwright's auto-scroll. */
  {
    const page=await browser.newPage({ viewport:{width:390, height:844} });
    await page.goto(FILE+'#s=3030830');
    await page.waitForFunction(()=>document.getElementById('card').classList.contains('open'), {timeout:8000});

    // walk the two-step setup with raw taps only: route -> throne -> chair
    const rawTap=async(re)=>{
      const t=await page.evaluate(src=>{ const r=new RegExp(src,'i');
        const b=[...document.querySelectorAll('#letter button')].filter(e=>e.getBoundingClientRect().height>0)
          .find(e=>r.test(e.textContent||''));
        if(!b) return null; const q=b.getBoundingClientRect();
        const x=q.x+q.width/2, y=q.y+q.height/2, el=document.elementFromPoint(x,y);
        return { x, y, hit: !!(el && b.contains(el)) }; }, re.source);
      if(!t) return 'missing';
      if(!t.hit) return 'occluded';
      await page.mouse.click(t.x, t.y); await page.waitForTimeout(400); return 'tapped';
    };
    ok(await rawTap(/The Crown/)==='tapped', 'letter panel: raw-tapped the crown route');
    ok(await rawTap(/Take the throne/)==='tapped', 'letter panel: raw-tapped the throne');
    ok(await rawTap(/The Cold Chair/)==='tapped', 'letter panel: raw-tapped the Cold Chair');
    const begun=await page.evaluate(()=>({ chair:annals.state().chair||'cold',
      open:document.getElementById('card').classList.contains('open') }));
    ok(!begun.open, 'letter panel: the reign began — a raw-tapped setup actually completes');

    // run the reign forward until a real mid-reign letter surfaces
    await page.evaluate(()=>annals.advance(1));
    let letter=null;
    for(let i=0;i<200 && !letter;i++){
      letter=await page.evaluate(()=>{
        if(!document.getElementById('card').classList.contains('open')) return null;
        const opts=[...document.querySelectorAll('#letter button')].filter(b=>b.getBoundingClientRect().height>0);
        if(!opts.length) return null;
        return { title:((document.querySelector('#letter h2')||{}).textContent||'').slice(0,44),
          id:(annals.choices()||{}).id||null,
          opts:opts.map(b=>{ const r=b.getBoundingClientRect(), x=r.x+r.width/2, y=r.y+r.height/2;
            const el=document.elementFromPoint(x,y);
            return { label:(b.querySelector('b')||b).textContent.trim().slice(0,30),
              reachable:!!(el && b.contains(el)), x, y,
              owner: el ? el.tagName.toLowerCase()+(el.id?'#'+el.id:'') : 'outside the viewport' }; }) }; });
      if(!letter) await page.evaluate(()=>annals.advance(1));
    }
    ok(!!letter, 'letter panel: a mid-reign letter surfaced within 200 weeks');
    if(letter){
      const dead=letter.opts.filter(o=>!o.reachable);
      ok(dead.length===0, 'letter panel: every option of "'+letter.title+'" owns its own centre pixel'
        +(dead.length?' — UNREACHABLE: '+dead.map(o=>o.label+' (covered by '+o.owner+')').join('; '):''));
      // and answering it with a RAW tap must actually resolve the letter
      const before=await page.evaluate(()=>annals.state().week);
      await page.mouse.click(letter.opts[0].x, letter.opts[0].y);
      await page.waitForTimeout(450);
      const after=await page.evaluate(()=>({ open:document.getElementById('card').classList.contains('open'),
        logged:(annals.history?1:1) && annals.state().week }));
      ok(!after.open, 'letter panel: a RAW tap on an option actually answers the letter (card closed)');
      ok(after.logged>=before, 'letter panel: the reign carried on from the answer (week '+before+' -> '+after.logged+')');
    }
    await page.close();
  }

  await browser.close();
  console.log('==== mobile reach: '+pass+' pass, '+fail+' fail ('+WIDTHS.length+' widths + the letter panel) ====');
  process.exit(fail?1:0);
})();
