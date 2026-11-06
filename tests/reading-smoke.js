// reading-smoke.js — boots the REAL page in Chromium and watches a reign told back as a film.
// The Reading Aloud (v0.53.0) re-runs a history link FORWARD at reading pace with rendering on — map
// re-inks, chronicle fills, letters auto-answer from the log, and the reign closes on the Last Leaf.
// It is timer/render-driven, so (like browser-smoke) it can only be tested in a real browser.
// Needs Playwright. Usage: node tests/reading-smoke.js
'use strict';
const path = require('path');

(async () => {
  const { chromium } = require('playwright');
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
  const file = 'file://' + path.join(__dirname, '..', 'index.html');

  // --- 1) build a real reign: setup, then advance answering every letter for a good stretch ---
  await page.goto(file + '#s=3030830');
  await page.waitForSelector('#card.open', { timeout: 10000 });
  await page.getByRole('button', { name: /The Crown/ }).first().click();
  await page.getByRole('button', { name: /Take the throne as Queen/ }).click();
  await page.getByRole('button', { name: /The Cold Chair/ }).click();
  const built = await page.evaluate(() => {
    let answered = 0;
    for (let i = 0; i < 4000 && annals.state().week < 260; i++) {
      if (annals.choices()) { annals.choose(0); answered++; } else annals.advance(1);
    }
    return { answered, week: annals.state().week, link: annals.history() };
  });
  ok(built.answered >= 4, 'a real reign was played with several letters answered (' + built.answered + ')');
  const filmHash = built.link.slice(built.link.indexOf('#')) + '&read=1';

  // --- 2) open the film link on a fresh page: the film bar shows and the reign begins to play ---
  const film = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  film.on('pageerror', e => errors.push('film pageerror: ' + e.message));
  film.on('console', m => { if (m.type() === 'error') errors.push('film console.error: ' + m.text()); });
  await film.goto(file + filmHash);
  await film.waitForSelector('#filmbar.on', { timeout: 10000 });
  ok(await film.locator('#filmttl').textContent().then(t => /Reading the reign of Queen/.test(t)), 'the film bar announces the reign');

  // the film advances on its own (weeks tick, the chronicle fills) without any input
  const w0 = await film.evaluate(() => annals.state().week);
  await film.waitForTimeout(1600);
  const prog = await film.evaluate(() => ({ week: annals.state().week, chron: document.querySelectorAll('#chron p').length }));
  ok(prog.week > w0, 'the film plays forward on its own (week ' + w0 + ' -> ' + prog.week + ')');
  ok(prog.chron > 1, 'the chronicle fills as it plays (' + prog.chron + ' lines)');

  // --- 3) pause holds the film; resume continues ---
  await film.locator('#filmpause').click();
  const wp = await film.evaluate(() => annals.state().week);
  await film.waitForTimeout(900);
  ok(await film.evaluate(() => annals.state().week) === wp, 'pause holds the reign where it stands');
  await film.locator('#filmpause').click();  // resume
  // a letter may be on screen at the pause point; resuming spends its read-beat before the next tick,
  // so allow past a full beat and accept EITHER a week advance OR a fresh chronicle line as progress.
  const beforeResume = await film.evaluate(() => ({ w: annals.state().week, c: document.querySelectorAll('#chron p').length }));
  await film.waitForTimeout(3600);
  const afterResume = await film.evaluate(() => ({ w: annals.state().week, c: document.querySelectorAll('#chron p').length }));
  ok(afterResume.w > beforeResume.w || afterResume.c > beforeResume.c, 'resume plays it on again (week ' + beforeResume.w + '->' + afterResume.w + ', chron ' + beforeResume.c + '->' + afterResume.c + ')');

  // --- 4) skip to the Leaf: the reign fast-forwards and the book opens ---
  await film.locator('#filmskip').click();
  await film.waitForSelector('#leaf.open', { timeout: 10000 });
  const leafOk = await film.evaluate(() => {
    const d = annals.leafData();
    return d && typeof d.title === 'string' && d.title.indexOf('The Annals of') === 0;
  });
  ok(leafOk, 'skipping to the Leaf fast-forwards the reign and opens the book');

  // the film reached the same reign the log encodes (the played reign's end week is reproduced)
  const filmWeek = await film.evaluate(() => annals.state().week);
  ok(filmWeek >= built.week - 25, 'the film reaches the reign it was told from (week ' + filmWeek + ' vs ' + built.week + ')');

  ok(errors.length === 0, 'zero console/page errors across the reign and its film: ' + JSON.stringify(errors.slice(0, 3)));

  await browser.close();
  console.log((fails === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passes + ' passed, ' + fails + ' failed');
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('READING SMOKE CRASH:', e.message); process.exit(1); });
