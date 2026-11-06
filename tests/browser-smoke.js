// browser-smoke.js — boots the REAL page in real Chromium and clicks through a reign's opening.
// Everything else in tests/ runs against DOM stubs; this is the only check that proves the actual
// game boots, renders, takes clicks, and stays console-clean. Not part of the default *-check glob
// (needs Playwright: `npm i playwright --no-save`). Usage: node tests/browser-smoke.js
'use strict';
const path = require('path');

(async () => {
  const { chromium } = require('playwright');
  // pinned-version mismatch tolerance: prefer a system/preinstalled chromium if the pack's own is absent
  const fs = require('fs');
  const candidates = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'];
  const executablePath = candidates.find(p => fs.existsSync(p));
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  let passes = 0, fails = 0;
  const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('  FAIL: ' + msg); } };

  const analyticsResponses=[];
  if(process.env.ANNALS_URL)page.on('response',r=>{if(new URL(r.url()).pathname==='/api/events')analyticsResponses.push({status:r.status(),body:r.request().postData()});});
  await page.goto((process.env.ANNALS_URL || 'file://' + path.join(__dirname, '..', 'index.html')) + '#s=3030830');
  await page.waitForSelector('#card.open', { timeout: 10000 });


  // The raised model is a display choice: raw clicks switch views without rewriting a reign.
  const tableBefore=await page.evaluate(()=>({state:JSON.stringify(annals.state()),history:annals.history(),
    ink:document.getElementById('map').toDataURL(),
    painted:[...document.getElementById('tablemap').getContext('2d').getImageData(0,0,1200,800).data].filter((v,i)=>i%4===3&&v>0).length}));
  ok(tableBefore.painted>900000,'the default table canvas contains a complete rendered scene');
  for(const id of ['view-ink','view-table']){
    const target=await page.evaluate(id=>{const b=document.getElementById(id),r=b.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2,owns:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};},id);
    ok(target.owns,id+' owns its centre pixel while the opening letter is present');
    await page.mouse.click(target.x,target.y);
    const view=await page.evaluate(id=>({pressed:document.getElementById(id).getAttribute('aria-pressed'),
      hidden:document.getElementById('tablemap').hidden,state:JSON.stringify(annals.state()),history:annals.history(),
      ink:document.getElementById('map').toDataURL()}),id);
    ok(view.pressed==='true'&&view.hidden===(id==='view-ink'),id+' switches the visible renderer');
    ok(view.state===tableBefore.state&&view.history===tableBefore.history,id+' preserves simulation and replay link');
    ok(view.ink===tableBefore.ink,id+' preserves the canonical manuscript export pixels');
  }

  // The diorama loads its renderer lazily and must draw a real scene: thousands of triangles, the
  // realm's houses, more than one frame. Opening it, leaving it, and coming back rewrites nothing.
  {
    const target=await page.evaluate(()=>{const b=document.getElementById('view-dio'),r=b.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2,owns:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
    ok(target.owns,'view-dio owns its centre pixel while the opening letter is present');
    await page.mouse.click(target.x,target.y);
    let dio=null;
    for(let i=0;i<120;i++){
      dio=await page.evaluate(()=>({stats:AnnalsDiorama.stats(),pressed:document.getElementById('view-dio').getAttribute('aria-pressed'),
        shown:!!document.getElementById('diorama')&&!document.getElementById('diorama').hidden}));
      if(dio.stats.frames>=3)break;
      await page.waitForTimeout(250);
    }
    ok(dio.pressed==='true'&&dio.shown,'view-dio raises the diorama ('+JSON.stringify(dio.stats)+')');
    ok(dio.stats.frames>=3&&dio.stats.triangles>50000&&dio.stats.calls>8,'the diorama renders a substantive scene ('+dio.stats.triangles+' triangles, '+dio.stats.calls+' draw calls)');
    ok(dio.stats.houses>=200,'the diorama builds the realm’s settlements ('+dio.stats.houses+' houses)');
    const box=await page.locator('#diorama canvas').boundingBox();
    // Cooperative wheel: over an unclicked realm the wheel scrolls the page; after a click it leans in.
    await page.evaluate(()=>document.activeElement&&document.activeElement.blur&&document.activeElement.blur());
    const d0=(await page.evaluate(()=>AnnalsDiorama.stats())).dist;
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.wheel(0,-600); await page.waitForTimeout(200);
    const d1=(await page.evaluate(()=>({dist:AnnalsDiorama.stats().dist,nudge:!document.querySelector('#diorama .dio-nudge').hidden})));
    ok(d1.dist===d0&&d1.nudge,'an unclicked realm lets the wheel pass and says how to lean in ('+d0+' -> '+d1.dist+')');
    await page.mouse.down(); await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+30,{steps:4}); await page.mouse.up();
    for(let i=0;i<3;i++){ await page.mouse.wheel(0,-120); await page.waitForTimeout(60); }
    await page.waitForTimeout(200);
    const d2=(await page.evaluate(()=>AnnalsDiorama.stats())).dist;
    ok(d2<d0*.9,'after a click the wheel leans in ('+d0+' -> '+d2+')');
    const after=await page.evaluate(()=>({state:JSON.stringify(annals.state()),history:annals.history(),ink:document.getElementById('map').toDataURL()}));
    ok(after.state===tableBefore.state&&after.history===tableBefore.history,'leaning in and panning the diorama preserves simulation and replay link');
    ok(after.ink===tableBefore.ink,'the diorama preserves the canonical manuscript export pixels');
    // The rendering path keeps the contract too: an unwalled capital's 1,200-man garrison stands as 100 figures.
    const garrison=await page.evaluate(async()=>{
      const was=S.war; S.war={columns:[],armies:[{x:W.capital.x,y:W.capital.y,str:1200,home:true}],sacks:0,won:0,weeks:1};
      const before=AnnalsDiorama.stats().frames; while(AnnalsDiorama.stats().frames<before+3) await new Promise(r=>requestAnimationFrame(r));
      const figures=AnnalsDiorama.stats().figures; S.war=was; return {figures,walls:buildCount('walls')+buildCount('bulwark')};
    });
    ok(garrison.walls===0&&garrison.figures===100,'a garrison of 1,200 shows 100 figures ('+JSON.stringify(garrison)+')');
    // Full screen pins the realm over the page; the letter, the pace and Build must stay on top of it and take clicks.
    await page.click('#diorama [data-dio="full"]');
    const full=await page.evaluate(()=>{
      const owns=(id)=>{const el=document.getElementById(id); if(!el) return false; const r=el.getBoundingClientRect(); if(!r.width||!r.height) return false;
        const hit=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(r.height/2,40)); return !!hit&&(el===hit||el.contains(hit));};
      const st=document.getElementById('mapstage').getBoundingClientRect();
      return {cls:document.body.classList.contains('dio-full'),stageH:st.height,winH:innerHeight,letter:owns('letter'),
        pace:owns('speedbox'),label:document.querySelector('#diorama [data-dio="full"]').textContent};
    });
    ok(full.cls&&full.stageH>full.winH*.75,'full screen fills the window with the diorama ('+Math.round(full.stageH)+'/'+full.winH+'px)');
    ok(full.letter,'in full screen the open letter sits over the diorama and takes clicks');
    ok(full.pace,'in full screen the pace controls sit over the diorama and take clicks');
    ok(full.label==='Leave full screen','the full-screen button offers the way back');
    await page.click('#diorama [data-dio="full"]');
    ok(!(await page.evaluate(()=>document.body.classList.contains('dio-full'))),'leaving full screen restores the page');
    await page.click('#diorama [data-dio="full"]');
    await page.click('#view-table');
    ok(!(await page.evaluate(()=>document.body.classList.contains('dio-full'))),'switching to another view leaves full screen');
    // A slow browser can grant full screen after the player has already left the diorama; that late entry is undone.
    await page.click('#view-dio');
    await page.waitForFunction(()=>AnnalsDiorama.isOpen());
    await page.evaluate(()=>{ window.__fs={el:null,exits:0};
      Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>window.__fs.el});
      document.documentElement.requestFullscreen=()=>new Promise(r=>setTimeout(()=>{window.__fs.el=document.documentElement;document.dispatchEvent(new Event('fullscreenchange'));r();},120));
      document.exitFullscreen=()=>{window.__fs.exits++;window.__fs.el=null;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();}; });
    // Both clicks in one synchronous turn, so the view switch provably lands before the grant does.
    const raced=await page.evaluate(()=>{ document.querySelector('#diorama [data-dio="full"]').click(); document.getElementById('view-table').click();
      return {el:!!window.__fs.el,cls:document.body.classList.contains('dio-full')}; });
    ok(!raced.el&&!raced.cls,'the view switch lands while the full-screen request is still pending ('+JSON.stringify(raced)+')');
    await page.waitForTimeout(400);
    const late=await page.evaluate(()=>{ const r={el:!!window.__fs.el,exits:window.__fs.exits,cls:document.body.classList.contains('dio-full')};
      delete document.fullscreenElement; delete document.documentElement.requestFullscreen; delete document.exitFullscreen; return r; });
    ok(!late.el&&late.exits===1&&!late.cls,'a full-screen grant that lands after leaving the diorama is undone ('+JSON.stringify(late)+')');
    // Without the Fullscreen API the class alone fills the window: Escape leaves it, unless that Escape is closing a dialog.
    await page.click('#view-dio');
    await page.waitForFunction(()=>AnnalsDiorama.isOpen());
    await page.evaluate(()=>{ document.documentElement.requestFullscreen=undefined; document.querySelector('#diorama [data-dio="full"]').click();
      const d=document.createElement('dialog'); d.id='esc-probe'; d.textContent='probe'; document.body.appendChild(d); d.showModal(); });
    await page.keyboard.press('Escape');
    const esc1=await page.evaluate(()=>({cls:document.body.classList.contains('dio-full'),dialog:document.getElementById('esc-probe').open}));
    ok(esc1.cls&&!esc1.dialog,'with no Fullscreen API, an Escape that closes a dialog keeps full screen ('+JSON.stringify(esc1)+')');
    await page.keyboard.press('Escape');
    const esc2=await page.evaluate(()=>{ const r=document.body.classList.contains('dio-full'); document.getElementById('esc-probe').remove(); delete document.documentElement.requestFullscreen; return r; });
    ok(!esc2,'with no Fullscreen API and no dialog open, Escape leaves full screen');
    await page.click('#view-table');
    const back=await page.evaluate(()=>({open:AnnalsDiorama.isOpen(),hidden:document.getElementById('diorama').hidden,table:!document.getElementById('tablemap').hidden,
      pressed:document.getElementById('view-table').getAttribute('aria-pressed'),dioPressed:document.getElementById('view-dio').getAttribute('aria-pressed')}));
    ok(!back.open&&back.hidden&&back.table&&back.pressed==='true'&&back.dioPressed==='false','returning to the table hides the diorama and restores the model');
  }

  // --- setup click-through: The Crown -> name kept -> Queen -> the Cold Chair ---
  ok(await page.locator('h1#realmname').count() === 1, 'masthead renders');
  ok((await page.title()).startsWith('The Cold Chair'), 'browser title is The Cold Chair (realm appended at boot)');
  const buildVersion = await page.evaluate(() => ({
    footer: document.getElementById('buildver').textContent,
    meta: document.querySelector('meta[name="application-version"]').content,
    api: annals.version()
  }));
  ok(buildVersion.footer === 'v0.78.1' && buildVersion.meta === '0.78.1',
     'the running release is visible in the footer and machine-readable metadata');
  ok(buildVersion.api.app === '0.78.1' && buildVersion.api.history === '0.65',
     'the API distinguishes release version from replay-schema version');
  const arms = await page.evaluate(() => {
    const c = document.getElementById('arms'), data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let painted = 0; for (let i = 3; i < data.length; i += 4) if (data[i]) painted++;
    return { painted, label: c.getAttribute('aria-label'), design: heraldDesign(SEED+'|'+W.house) };
  });
  ok(arms.painted > 1000 && /arms of House/.test(arms.label), 'the seeded House arms paint in the masthead and carry an accessible description');
  ok(arms.design && Number.isInteger(arms.design.charge), 'the heraldic design is deterministic data, not a simulation RNG draw');
  const setupVisual = await page.evaluate(() => {
    const cols = document.getElementById('cols');
    const ledger = document.getElementById('ledger');
    const works = document.getElementById('panel-works');
    return {
      standards: document.compatMode === 'CSS1Compat',
      presetup: cols.classList.contains('presetup'),
      ledgerHidden: ledger.offsetParent === null,
      worksHidden: works.offsetParent === null,
      noSideScroll: document.documentElement.scrollWidth <= innerWidth + 1
    };
  });
  ok(setupVisual.standards, 'the document renders in standards mode');
  ok(setupVisual.presetup && setupVisual.ledgerHidden && setupVisual.worksHidden,
     'setup is a focused decision surface: inactive ledger and works stay out of sight');
  ok(setupVisual.noSideScroll, 'desktop setup has no horizontal overflow');
  const pigmentVisual = await page.evaluate(() => {
    const root=getComputedStyle(document.documentElement), body=getComputedStyle(document.body), panel=getComputedStyle(document.querySelector('.panel'));
    return { ground:body.backgroundColor, panel:panel.backgroundColor,
      sable:root.getPropertyValue('--sable').trim(), verdigris:root.getPropertyValue('--verdigris').trim(),
      rubric:root.getPropertyValue('--rubric').trim(), gilt:root.getPropertyValue('--gilt').trim(), map:getComputedStyle(document.getElementById('map')).filter };
  });
  ok(pigmentVisual.ground !== pigmentVisual.panel && new Set([pigmentVisual.sable,pigmentVisual.verdigris,pigmentVisual.rubric,pigmentVisual.gilt]).size === 4,
     'the pigment system keeps the mineral ground, vellum, water, woodland, rubric and gilt visually distinct');
  ok(/saturate\(1\.(?:1[0-9]|[2-9])/.test(pigmentVisual.map), 'the map retains the illuminated saturation pass');
  await page.getByRole('button', { name: /The Crown/ }).first().click();
  await page.getByRole('button', { name: /Take the throne as Queen/ }).click();
  await page.getByRole('button', { name: /The Cold Chair/ }).click();
  ok((await page.title()).startsWith('The Cold Chair — '), 'in-reign title carries the realm');
  await page.waitForFunction(()=>document.getElementById('letter').dataset.voice && document.getElementById('card').classList.contains('open'));
  const playVisual = await page.evaluate(() => {
    const choiceHeights = [...document.querySelectorAll('.choice')].filter(e => e.offsetParent !== null).map(e => e.getBoundingClientRect().height);
    const buildHeights = [...document.querySelectorAll('.bld')].filter(e => e.offsetParent !== null).map(e => e.getBoundingClientRect().height);
    const letter = document.getElementById('letter'), portrait = letter.querySelector('.from-portrait');
    return {
      presetupCleared: !document.getElementById('cols').classList.contains('presetup'),
      ledgerVisible: document.getElementById('ledger').offsetParent !== null,
      worksVisible: document.getElementById('panel-works').offsetParent !== null,
      choicesTall: choiceHeights.every(h => h >= 44),
      buildsTall: buildHeights.every(h => h >= 44),
      voice: letter.dataset.voice,
      hasSeal: !!letter.querySelector('.letter-seal'),
      hasSource: !!letter.querySelector('.letter-source'),
      portraitLarge: !portrait || portrait.getBoundingClientRect().width >= 58
    };
  });
  ok(playVisual.presetupCleared && playVisual.ledgerVisible && playVisual.worksVisible,
     'beginning the reign reveals the instruments and works');
  ok(playVisual.choicesTall && playVisual.buildsTall, 'visible decision and build targets are at least 44px tall');
  ok(playVisual.voice && playVisual.hasSeal && playVisual.hasSource,
     'the open event carries a sender-derived seal family and visible provenance');
  ok(playVisual.portraitLarge, 'named event senders receive a larger framed woodcut portrait');

  const headingContrast=await page.evaluate(()=>{
    const root=document.documentElement, previous=root.getAttribute('data-theme');
    const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(n=>{const x=+n/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
    const ratios=[];
    for(const theme of ['light','dark']){root.setAttribute('data-theme',theme);
      for(const el of document.querySelectorAll('#ledger .panel h3,#panel-works h3')){
        const a=lum(getComputedStyle(el).color),b=lum(getComputedStyle(el.closest('.panel')).backgroundColor);
        ratios.push({theme,text:el.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
      }
    }
    if(previous===null)root.removeAttribute('data-theme');else root.setAttribute('data-theme',previous);
    return ratios;
  });
  ok(headingContrast.length>=10&&headingContrast.every(r=>r.ratio>=4.5),'all ledger and works headings clear 4.5:1 in light and dark ('+Math.min(...headingContrast.map(r=>r.ratio)).toFixed(2)+':1 minimum)');

  // A pending letter comes before new works: the launcher is unavailable and refuses, so no build can be logged
  // behind an unanswered letter (a reload would then answer it with the default; see issue #48).
  const letterGate=await page.evaluate(()=>{const b=document.getElementById('build-open'),open=document.getElementById('card').classList.contains('open');
    b.click(); return {pending:!!S.pendingCard,open,shown:getComputedStyle(b).display!=='none',dialog:document.getElementById('build-dialog').open};});
  ok(letterGate.pending&&letterGate.open&&!letterGate.shown&&!letterGate.dialog,'a pending letter hides and refuses the Build launcher ('+JSON.stringify(letterGate)+')');
  const panelGate=await page.evaluate(()=>{const before={log:S.actions.length,gold:S.gold,projects:S.projects.length};
    const btn=document.querySelector('#panel-works .bld:not([disabled])'); if(btn) btn.click();
    return {pending:!!S.pendingCard,button:!!btn,same:S.actions.length===before.log&&S.gold===before.gold&&S.projects.length===before.projects};});
  ok(panelGate.pending&&panelGate.button&&panelGate.same,'a works-panel build clicked behind a pending letter logs nothing ('+JSON.stringify(panelGate)+')');
  // Raw coordinates ensure construction is reachable without Playwright scrolling for us (letter set aside).
  for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await page.evaluate(()=>{window.letterHold=S.pendingCard;S.pendingCard=null;document.getElementById('card').classList.remove('open');scrollTo(0,0);});
    const before=await page.evaluate(()=>({y:scrollY,history:annals.history()}));
    const launch=await page.evaluate(()=>{const b=document.getElementById('build-open'),r=b.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2,owns:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
    ok(launch.owns,'Build launcher owns its centre without scrolling at '+viewport.width);
    await page.mouse.click(launch.x,launch.y);
    const opened=await page.evaluate(()=>{const d=document.getElementById('build-dialog'),b=d.querySelector('.bld'),r=b.getBoundingClientRect();
      return {open:d.open,owns:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),y:scrollY,history:annals.history()};});
    ok(opened.open&&opened.owns&&opened.y===before.y,'construction opens above the game with first build visible at '+viewport.width);
    ok(opened.history===before.history,'opening construction does not change the replay');
    const pausedWeek=await page.evaluate(()=>{window.buildTestRestore={pending:S.pendingCard,speed:S.speed};S.pendingCard=null;S.speed=3;return S.week;});
    await page.waitForTimeout(700);
    ok(await page.evaluate(w=>S.week===w,pausedWeek),'construction holds time even at the fastest pace');
    ok(await page.locator('#build-dialog .bld .d').first().textContent().then(t=>/harvest/.test(t)&&/26 weeks/.test(t)),'build benefits and duration are visible before purchase');
    await page.evaluate(()=>{S.pendingCard=window.buildTestRestore.pending;S.speed=window.buildTestRestore.speed;delete window.buildTestRestore;});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.getElementById('panel-works').parentElement.id==='mapcol');
    ok(await page.evaluate(()=>!document.getElementById('build-dialog').open&&document.activeElement.id==='build-open'),'Escape restores catalogue and launcher focus');
    await page.evaluate(()=>{S.pendingCard=window.letterHold;delete window.letterHold;if(S.pendingCard)document.getElementById('card').classList.add('open');});
  }
  await page.setViewportSize({width:1280,height:860});
  const shared = await page.evaluate(async () => {
    let payload=null;
    Object.defineProperty(navigator,'share',{configurable:true,value:async p=>{ payload=p; }});
    const usedNative=await shareReign();
    return { usedNative, payload, history:annals.history() };
  });
  ok(shared.usedNative && shared.payload && shared.payload.url === shared.history && /Cold Chair/.test(shared.payload.title),
     'Share this reign uses the native share sheet with the canonical replay link');

  // --- v0.60.0 diegetic onboarding: a first-time crown meets the monk's aside, once, then dismisses it ---
  const welc = await page.evaluate(() => {
    const w = document.getElementById('welcome');
    return { shown: w && !w.hidden, margins: /load-bearing/.test(w ? w.textContent : ''),
             monk: /^Brother /.test((document.getElementById('welcome-monk') || {}).textContent || '') };
  });
  ok(welc.shown && welc.margins, 'the Chronicler’s Welcome shows on a first-ever reign and teaches that the margins are load-bearing');
  ok(welc.monk, 'the welcome is signed by the reign’s own chronicler');
  await page.locator('#welcomeclose').click();
  const dismissed = await page.evaluate(() => ({ hidden: document.getElementById('welcome').hidden, flag: localStorage.getItem('cold-chair-taught') }));
  ok(dismissed.hidden && dismissed.flag === '1', 'dismissing it hides it and records the teaching, so it never returns');

  // --- drive the sim deterministically via the agent API (no wall-clock waiting) ---
  const wk = await page.evaluate(() => { annals.advance(30); return annals.state().week; });
  ok(wk >= 2, 'the sim advances (reached week ' + wk + ')');

  // --- v0.52.0 ruler traits: the crown wears its character sheet in the masthead datebox ---
  const dateboxText = await page.evaluate(() => document.getElementById('datebox').textContent);
  ok(/Queen .+ the .+·/.test(dateboxText), 'the masthead shows the ruler and a born temperament (' + dateboxText.split('·')[0].trim() + ')');

  // --- v0.54.0 the Codex: the button opens a browsable realm-history modal ---
  await page.getByRole('button', { name: /^The Codex$/ }).click();
  await page.waitForSelector('#codex.open', { timeout: 5000 });
  const codexOk = await page.evaluate(() => {
    const html = document.getElementById('codexbody').innerHTML;
    return { house: /The House/.test(html), realm: /The Realm/.test(html), rulerline: /reigning/.test(html) };
  });
  ok(codexOk.house && codexOk.realm && codexOk.rulerline, 'the Codex opens and lists the House (with the reigning crown) and the Realm');
  await page.locator('#codexclose').click();
  ok(await page.locator('#codex.open').count() === 0, 'the Codex closes again');

  // --- v0.58.0 the craft pass: the Colophon, the PWA manifest, the letter-scratch sound ---
  const pwa = await page.evaluate(async () => {
    const ml = document.querySelector('link[rel="manifest"]');
    const iconLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').length;
    let mani = null;
    try { if (ml) mani = await (await fetch(ml.href)).json(); } catch (e) {}
    return {
      hasManifest: !!ml, iconLinks,
      name: mani && mani.name, display: mani && mani.display, icons: mani && mani.icons && mani.icons.length,
      themeColor: !!document.querySelector('meta[name="theme-color"]'),
      viewport: !!document.querySelector('meta[name="viewport"]'),
      appleCap: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
      letterFn: typeof Sound.letter === 'function'
    };
  });
  ok(pwa.hasManifest && pwa.name === 'The Cold Chair' && pwa.display === 'standalone', 'a valid PWA manifest is linked (named, standalone), so the page is installable');
  ok(pwa.icons >= 1 && pwa.iconLinks >= 2, 'the manifest carries an icon and the head links a favicon + apple-touch-icon');
  ok(pwa.viewport && pwa.themeColor && pwa.appleCap, 'the mobile/standalone head tags are present (viewport + theme-color + apple-web-app)');
  ok(pwa.letterFn, 'the vellum-scratch letter sound is wired into the Sound module');
  // the Colophon opens, shows the running version and the sound toggle, and closes
  await page.getByRole('button', { name: /^Colophon$/ }).click();
  await page.waitForSelector('#colophon.open', { timeout: 5000 });
  const co = await page.evaluate(() => ({
    ver: document.getElementById('co-ver').textContent,
    sound: document.getElementById('co-sound').textContent,
    bound: /one html file/i.test(document.getElementById('colophon').textContent)
  }));
  ok(/^v0\.\d+/.test(co.ver), 'the Colophon shows the running version (' + co.ver + ')');
  ok(/^Sound of the realm|^Sound:/.test(co.sound), 'the Colophon carries the sound-of-the-realm toggle');
  ok(co.bound, 'the Colophon explains the one-file binding (the making-of)');
  // v0.59.0 save slots: shelve the live reign, confirm a slot renders, and prove the slot's hash restores
  // the identical state on a fresh page (a slot IS a history-link payload → the tested shared-link path).
  // Answer a pending letter first so the shelved log is non-empty (a stronger round-trip than a bare seed).
  await page.evaluate(() => { for (let i = 0; i < 200; i++) { if (annals.choices()) { annals.choose(0); break; } annals.advance(1); } });
  const slot = await page.evaluate(() => {
    localStorage.removeItem('cold-chair-slots');
    saveCurrentReign();
    const list = JSON.parse(localStorage.getItem('cold-chair-slots') || '[]');
    renderSlots();
    const rows = document.querySelectorAll('#co-slots .co-slot').length;
    const s = list[0];
    return { count: list.length, rows, hash: s && ('#' + (function(x){return 's='+x.seed+'&h='+btoa(unescape(encodeURIComponent(JSON.stringify({r:x.r,a:x.a,w:x.w,v:x.v}))))})(s)) };
  });
  ok(slot.count === 1 && slot.rows === 1, 'saving shelves the reign and the Colophon renders the slot');
  const sBefore = await page.evaluate(() => JSON.stringify(annals.state()));
  const rpg = await browser.newPage();
  rpg.on('pageerror', e => errors.push('slot-restore pageerror: ' + e.message));
  await rpg.goto('file://' + path.join(__dirname, '..', 'index.html') + slot.hash);
  await rpg.waitForTimeout(500);
  const sAfter = await rpg.evaluate(() => JSON.stringify(annals.state()));
  ok(sBefore === sAfter, 'restoring a saved slot replays it to the identical state on a fresh page');
  await page.locator('#colophonclose').click();
  ok(await page.locator('#colophon.open').count() === 0, 'the Colophon closes again');

  // --- v0.55.0 The Legacy Realm: a world that keeps its scars is founded from the route ---
  const lpg = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  lpg.on('pageerror', e => errors.push('legacy pageerror: ' + e.message));
  await lpg.goto('file://' + path.join(__dirname, '..', 'index.html') + '#s=3030830');
  await lpg.waitForSelector('#card.open', { timeout: 10000 });
  // seed a world-file with two remembered scorches + a dynasty history, then found a legacy realm
  const burned = await lpg.evaluate(() => {
    const towns = W.towns.filter(t => t !== W.capital).slice(0, 2).map(t => t.name);
    localStorage.setItem('cold-chair-legacy-3030830', JSON.stringify({ v: 1, dynasties: 4, scorched: towns, wyrms: 3 }));
    return towns;
  });
  await lpg.getByRole('button', { name: /Found a Legacy Realm/ }).click();
  await lpg.getByRole('button', { name: /Take the throne as Queen/ }).click();
  await lpg.getByRole('button', { name: /The Cold Chair/ }).click();
  const legacyState = await lpg.evaluate(() => {
    const s = annals.state();
    const scarred = W.towns.filter(t => t.wasSacked && t !== W.capital).map(t => t.name);
    return { dynasties: s.legacy && s.legacy.dynasties, seals: (s.legacy && s.legacy.seals) || [], scarred, logHasL: S.actions.some(a => a[1] === 'L') };
  });
  ok(legacyState.dynasties === 5, 'founding advances the world to its 5th dynasty');
  ok(burned.every(n => legacyState.scarred.includes(n)), 'the remembered towns start scorched on the map');
  ok(legacyState.logHasL, 'the reign logs a week-0 L action, so the scarred world is shareable/replayable');
  ok(legacyState.seals.some(s => /Wyrmmoot/.test(s)) && legacyState.seals.some(s => /Chronicle of Ages/.test(s)), 'the world has sealed its envelopes (Wyrmmoot @3 wyrms, Chronicle of Ages @5 dynasties)');

  // answer the first letter the reign raises
  const answered = await page.evaluate(() => {
    for (let i = 0; i < 200; i++) {
      if (annals.choices()) { const id = annals.choices().id; annals.choose(0); return id; }
      annals.advance(1);
    }
    return null;
  });
  ok(!!answered, 'a letter arrived and was answered (' + answered + ')');
  ok(await page.locator('#chron p').count() > 3, 'the chronicle is being written');

  // the letter card actually renders with clickable options when opened by the UI path
  const stateOk = await page.evaluate(() => {
    const s = annals.state();
    return typeof s.legitimacy === 'number' && typeof s.gold === 'number' && s.seed === 3030830;
  });
  ok(stateOk, 'state() is sane from the live page');

  // --- the Last Leaf composes on the real canvas ---
  const leafOk = await page.evaluate(() => {
    const d = annals.leafData();
    const png = composeLeaf().toDataURL('image/png');
    return d && typeof d.title === 'string' && d.title.indexOf('The Annals of') === 0 && Array.isArray(d.moments)
      && d.stats && d.stats.tiers && png.indexOf('data:image/png;base64,') === 0 && png.length > 10000;
  });
  ok(leafOk, 'the heraldic Last Leaf composes as a rasterized share image with its summary data intact');

  // --- the reign-card PNG rasterizes on a real canvas (stub tests can only check geometry) ---
  const png = await page.evaluate(() => composeReignCardPNG().toDataURL('image/png'));
  ok(png.indexOf('data:image/png;base64,') === 0 && png.length > 2000, 'the reign card paints to a real PNG (' + png.length + ' chars)');

  // --- a history link replays: same seed+log => same state on a fresh page ---
  const link = await page.evaluate(() => annals.history());
  const s1 = await page.evaluate(() => JSON.stringify(annals.state()));
  const page2 = await browser.newPage();
  page2.on('pageerror', e => errors.push('replay pageerror: ' + e.message));
  await page2.goto('file://' + path.join(__dirname, '..', 'index.html') + link.slice(link.indexOf('#')));
  await page2.waitForTimeout(500);
  const s2 = await page2.evaluate(() => JSON.stringify(annals.state()));
  ok(s1 === s2, 'a shared history link replays to the identical state on a fresh page');

  // --- mobile viewport pass (390x844): boots, setup works, the works panel exists, no sideways scroll ---
  // (guards the real playtest bug where the works-of-stone-and-water panel vanished on phones)
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mob.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mob.goto('file://' + path.join(__dirname, '..', 'index.html') + '#s=3030830');
  await mob.waitForSelector('#card.open', { timeout: 10000 });
  // Before touching anything: is EVERY door on the setup card open to a thumb? This pass used to click
  // /The Crown/ — option 0, the one option that was never affected — and then assert only that the works
  // panel rendered. Options 1–4 were never touched, and .click() could not have seen the problem anyway:
  // it auto-scrolls and force-dispatches, so it reaches elements a finger cannot. Four of the five ways to
  // start a reign were dead at exactly this viewport and this pass was green (issue #6, issue #7).
  // tests/mobile-reach-check.js owns the full sweep across eight widths; this is the tripwire in the smoke.
  const reach = await mob.evaluate(() => [...document.querySelectorAll('#letter button.choice')]
    .filter(b => b.getBoundingClientRect().height > 0)
    .map(b => { const r = b.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { label: (b.querySelector('b') || b).textContent.trim().slice(0, 30),
               reachable: !!(el && b.contains(el)),
               owner: el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') : 'outside the viewport' }; }));
  const dead = reach.filter(o => !o.reachable);
  ok(reach.length >= 5, 'mobile (390px): the setup card offers all ' + reach.length + ' ways to begin');
  ok(dead.length === 0, 'mobile (390px): every setup option owns its own centre pixel'
     + (dead.length ? ' — UNREACHABLE: ' + dead.map(o => o.label + ' (covered by ' + o.owner + ')').join('; ') : ''));
  await mob.getByRole('button', { name: /The Crown/ }).first().click();
  await mob.getByRole('button', { name: /Take the throne as Queen/ }).click();
  await mob.getByRole('button', { name: /The Cold Chair/ }).click();
  await mob.evaluate(() => annals.advance(4));
  const mobOk = await mob.evaluate(() => {
    const works = document.getElementById('panel-works');
    const folio = document.getElementById('folio-nav');
    const folioButtons = [...folio.querySelectorAll('button')];
    const visible = works && works.offsetParent !== null && works.getBoundingClientRect().height > 0;
    const noSideScroll = document.documentElement.scrollWidth <= window.innerWidth + 1;
    return { visible, noSideScroll, folioVisible:getComputedStyle(folio).display!=='none' && folio.getBoundingClientRect().height>0,
      folioTargets:folioButtons.map(b=>b.dataset.folio), folioTall:folioButtons.every(b=>b.getBoundingClientRect().height>=44) };
  });
  ok(mobOk.visible, 'mobile (390px): the works panel renders');
  ok(mobOk.noSideScroll, 'mobile (390px): no horizontal overflow');
  ok(mobOk.folioVisible && mobOk.folioTargets.join(',') === 'mapwrap,chron,ledger,panel-works',
     'mobile (390px): the persistent folio rail exposes Map, Chronicle, Ledger, and Works');
  ok(mobOk.folioTall, 'mobile (390px): every folio destination has a 44px touch target');
  await mob.evaluate(() => { if(annals.choices()) annals.choose(0); });
  await mob.locator('#folio-nav [data-folio="ledger"]').click();
  await mob.waitForTimeout(450);
  ok(await mob.locator('#folio-nav [data-folio="ledger"]').getAttribute('aria-current') === 'true',
     'mobile folio navigation marks the selected realm surface');

  // --- the Week's Chair in a real browser: a plain week offers the full chair menu (the daily "iron
  //     Monday" twist retired with the daily cadence, v0.68.0), and the week marker survives the boot rewrite ---
  // (2026-07-13 is forever a Monday, so it is its own ISO-week key; the &d= marker must also survive the
  //  hash-canonicalizing rewrite, folded to that week's Monday)
  const dpg = await browser.newPage();
  dpg.on('pageerror', e => errors.push('week pageerror: ' + e.message));
  await dpg.goto('file://' + path.join(__dirname, '..', 'index.html') + '#s=4242424&d=2026-07-13');
  await dpg.waitForSelector('#card.open', { timeout: 10000 });
  ok((await dpg.evaluate(() => location.hash)).indexOf('d=2026-07-13') > 0, 'the week’s marker survives the boot rewrite');
  await dpg.getByRole('button', { name: /The Crown/ }).first().click();
  await dpg.getByRole('button', { name: /Take the throne as Queen/ }).click();
  const chairs = await dpg.locator('#letter .choice b').allTextContents();
  ok(chairs.filter(t => /Chair/.test(t)).join('|') === 'The Kind Chair|The Cold Chair|The Iron Chair',
     'a plain week offers the full chair menu, no forced iron (' + chairs.join(', ') + ')');
  await dpg.getByRole('button', { name: /The Kind Chair/ }).click();
  ok(await dpg.evaluate(() => annals.state().chair) === 'kind', 'the week’s reign sits the chosen chair (kind, not a forced iron)');

  // --- the Interregnum in a real browser: an endured succession opens the Quiet Passage, a real click seats the heir ---
  const ipg = await browser.newPage();
  ipg.on('pageerror', e => errors.push('interregnum pageerror: ' + e.message));
  await ipg.goto('file://' + path.join(__dirname, '..', 'index.html') + '#s=3030830');
  await ipg.waitForSelector('#card.open', { timeout: 10000 });
  await ipg.getByRole('button', { name: /The Crown/ }).first().click();
  await ipg.getByRole('button', { name: /Take the throne as Queen/ }).click();
  await ipg.getByRole('button', { name: /The Cold Chair/ }).click();
  await ipg.evaluate(() => annals.advance(20));
  const oldRuler = await ipg.evaluate(() => annals.state().ruler || 'x');
  // force the reign to its end and open the succession the way the end-of-reign button does
  await ipg.evaluate(() => { S.over = 'endured'; continueAsHeir('endured'); });
  const passageTitle = await ipg.evaluate(() => document.querySelector('#letter h2') && document.querySelector('#letter h2').textContent);
  ok(/Quiet Passage/.test(passageTitle || ''), 'the endured succession opens the Quiet Passage in the DOM (' + passageTitle + ')');
  await ipg.getByRole('button', { name: /The tenth to the muster/ }).click();
  const seated = await ipg.evaluate(() => ({ over: annals.state().over, inter: !!S.interregnum, week: annals.state().week }));
  ok(seated.over === null && !seated.inter, 'answering the will seats the heir and the reign is live again');

  // --- House Legacies in a real browser: a renown-rich line is offered a legacy in the interregnum ---
  await ipg.evaluate(() => {
    // seed two prior endured crowns (4 renown) so this succession can afford the Old Blood (cost 4)
    S._dynasty = [
      { ruler: 'Queen A', verdict: 'the Steward', years: [30, 50], ending: 'endured', wyrms: 0 },
      { ruler: 'Queen B', verdict: 'the Builder', years: [50, 70], ending: 'endured', wyrms: 0 }
    ];
    S.week = 1040; S.over = 'endured'; continueAsHeir('endured');
  });
  // the scene: will -> epithet (line has a history) -> the House's inheritance
  await ipg.getByRole('button', { name: /The tenth to the muster/ }).click();
  await ipg.getByRole('button', { name: /Lead with the eldest crown/ }).click();
  const legacyTitle = await ipg.evaluate(() => document.querySelector('#letter h2') && document.querySelector('#letter h2').textContent);
  ok(/House.s Inheritance/.test(legacyTitle || ''), 'a renown-rich House is offered a legacy in the interregnum (' + legacyTitle + ')');
  await ipg.getByRole('button', { name: /Fix it in the blood/ }).click();
  const legacyOk = await ipg.evaluate(() => ({ has: (S._legacies || []).length > 0, over: annals.state().over, exposed: !!annals.state().legacies }));
  ok(legacyOk.has && legacyOk.over === null && legacyOk.exposed, 'taking it fixes the legacy in the blood, seats the heir, and surfaces in state()');

  // --- v0.61.0 offline PWA: a service worker needs a secure/localhost origin (not file://), so serve the
  // repo over http, let the worker register + cache the shell, then cut the network and reload — the game
  // must still boot from cache. Proves genuine offline, not just a linked manifest.
  const http = require('http');
  const root = path.resolve(process.env.ANNALS_OFFLINE_ROOT || path.join(__dirname, '..'));
  const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const fp = path.join(root, p);
    if (fp !== root && !fp.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }   // separator-anchored, so a sibling dir (the-annals-secret) can't pass a bare prefix check
    fs.readFile(fp, (err, buf) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'text/plain' }); res.end(buf);
    });
  });
  await new Promise(r => srv.listen(0, r));
  const origin = 'http://localhost:' + srv.address().port;
  const offlineErrors = [];
  const opg = await browser.newPage();
  opg.on('pageerror', e => offlineErrors.push('offline pageerror: ' + e.message));
  await opg.goto(origin + '/index.html#s=3030830');
  await opg.waitForSelector('#card.open', { timeout: 10000 });
  const swReady = await opg.evaluate(async () => {
    if (!navigator.serviceWorker) return false;
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg || !reg.active) return false;
    // wait until this client is actually CONTROLLED (clients.claim), so the reload below is guaranteed
    // to route through the worker — removes a controller-timing race before we cut the network
    if (!navigator.serviceWorker.controller) {
      await new Promise(r => { navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }); setTimeout(r, 3000); });
    }
    return !!navigator.serviceWorker.controller;
  });
  ok(swReady, 'the service worker registers, activates, and controls the page over http');
  await opg.context().setOffline(true);
  const booted = await opg.reload().then(() => opg.waitForSelector('#card.open', { timeout: 10000 }).then(() => true)).catch(() => false);
  ok(booted, 'v0.61.0 offline: with the network cut, the cached shell still boots the game');
  if(process.env.ANNALS_OFFLINE_ROOT){
    ok(await opg.evaluate(()=>!!window.annalsMetrics),'packaged analytics client loads offline without an HTML fallback');
    const privacy=await opg.evaluate(()=>fetch('./privacy.html').then(r=>r.text()));
    ok(/Play analytics/.test(privacy)&&!privacy.includes('id="tablemap"'),'privacy disclosure is available offline');
  }
  await opg.context().setOffline(false);
  srv.close();
  ok(offlineErrors.length === 0, 'no page errors on the offline path: ' + JSON.stringify(offlineErrors.slice(0, 3)));

  ok(errors.length === 0, 'zero console/page errors across boot, play, replay, mobile, the week’s chair, the interregnum, and legacies: ' + JSON.stringify(errors.slice(0, 3)));

  if(process.env.ANNALS_URL){
    ok(analyticsResponses.some(r=>r.status===204&&JSON.parse(r.body).event==='visit'),'hosted visit reaches analytics');
    ok(analyticsResponses.some(r=>r.status===204&&JSON.parse(r.body).event==='reign_start'),'hosted reign start reaches analytics');
    ok(analyticsResponses.some(r=>r.status===204&&JSON.parse(r.body).event==='build_open'),'hosted construction reaches analytics');
    console.log('Hosted event responses: '+JSON.stringify(analyticsResponses));
  }
  await browser.close();
  console.log((fails === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passes + ' passed, ' + fails + ' failed');
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('SMOKE CRASH:', e.stack); process.exit(1); });
