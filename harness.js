// harness.js — run The Annals headless for playtesting.
// Usage: node harness.js <seed> <planFile|-> <untilWeek> [--auto=N]
//   planFile JSON: {"ruler":["Queen","Name"],"actions":[[week,"s","tax",25],[week,"b","mill"],[week,"c","cold-chair",0],[week,"y"]]}
//   "-" = empty plan. --auto=N answers any un-planned letter with option N (mod option count).
//   Without --auto, the run STOPS at the first un-planned letter and prints it, so you can decide and re-run.
'use strict';
const fs = require('fs');
const path = require('path');

const seed = process.argv[2] || '3030830';
const planFile = process.argv[3] || '-';
const until = parseInt(process.argv[4] || '1040', 10);
const autoFlag = process.argv.find(a => a.startsWith('--auto'));
const autoChoice = autoFlag ? parseInt(autoFlag.split('=')[1] || '0', 10) : null;

const plan = planFile !== '-' ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : { ruler: ['Queen', 'Testrun'], actions: [] };
const acts = (plan.actions || []).slice().sort((a, b) => a[0] - b[0]);

/* ---------- DOM stubs ---------- */
function stubCtx() {
  return new Proxy({}, {
    get: (t, p) => (p in t ? t[p] : () => {}),
    set: (t, p, v) => { t[p] = v; return true; }
  });
}
function mkEl(tag) {
  const el = {
    tag, children: [], style: { cssText: '' }, dataset: {}, textContent: '', value: '', className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild(c) { el.children.push(c); return c; },
    removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); },
    get firstChild() { return el.children[0]; },
    addEventListener() {}, setAttribute() {}, focus() {},
    querySelector() { return mkEl('q'); }, querySelectorAll() { return []; },
    set innerHTML(v) { el.children = []; }, get innerHTML() { return ''; }
  };
  el.getContext=() => stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; }
  return el;
}
const els = {};
global.window = global;
global.document = {
  getElementById(id) { return els[id] || (els[id] = mkEl('div')); },
  createElement(t) { return mkEl(t); },
  createTextNode(t) { const e = mkEl('#text'); e.textContent = t; return e; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  head: mkEl('head'),
  title: ''
};
els['map'] = mkEl('canvas'); els['map'].width = 940; els['map'].height = 620;
global.location = { hash: '#s=' + seed, origin: '', pathname: '', reload() { throw new Error('location.reload called'); } };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.matchMedia = () => ({ matches: false });
global.requestAnimationFrame = () => {};
// node 22 ships a read-only global.navigator; the game only feature-detects clipboard, which is fine

/* ---------- load the game ---------- */
let code = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
code = code.replace("'use strict';", '') +
  '\nwindow.__G={S:S,W:W,CARDS:CARDS,BUILDS:BUILDS,finishSetup:finishSetup};';
(0, eval)(code);
const G = global.__G;

// P8: a plan may open in noble mode ("mode":"noble"). finishSetup(title,name,mode,chair) logs [0,'m','noble']
// and applies the noble start-state; the crown-mode call (mode omitted) is byte-identical to before.
// v0.39.0: a plan may also open on a chair ("chair":"iron"|"kind"); omitted/"cold" is byte-identical.
G.finishSetup(plan.ruler ? plan.ruler[0] : 'Queen', plan.ruler ? plan.ruler[1] : 'Testrun', plan.mode || 'crown', plan.chair || 'cold');

/* ---------- drive ---------- */
const decisions = [], anomalies = [], goldSeries = [], grainSeries = [];
function applyDue() {
  // 'c' (card choice) and 'k' (Wave 5 hook spend) both resolve a PENDING letter — never applied here.
  while (acts.length && acts[0][0] <= G.S.week && acts[0][1] !== 'c' && acts[0][1] !== 'k') {
    const a = acts.shift();
    if (a[1] === 's') annals.setSlider(a[2], a[3]);
    else if (a[1] === 'b') decisions.push([G.S.week, 'build', a[2], annals.build(a[2])]);
    else if (a[1] === 'y') decisions.push([G.S.week, 'spy', annals.spy()]);
    else if (a[1] === 'p') decisions.push([G.S.week, 'petition', a[2], annals.petition(a[2])]);  // P8: a petition to the crown
    else if (a[1] === 'm') { /* mode is applied by finishSetup at week 0; skip the log-entry echo */ }
    else if (a[1] === 'd') { /* chair is applied by finishSetup at week 0; skip the log-entry echo */ }
  }
}
function checkAnomalies() {
  const st = G.S;
  if (!isFinite(st.gold)) anomalies.push([st.week, 'gold not finite', String(st.gold)]);
  if (!isFinite(st.grain) || st.grain < 0) anomalies.push([st.week, 'grain bad', st.grain]);
  if (!isFinite(st.levies) || st.levies < 0) anomalies.push([st.week, 'levies bad', st.levies]);
  if (st.legit < 0 || st.legit > 100 || !isFinite(st.legit)) anomalies.push([st.week, 'legitimacy out of range', st.legit]);
  if (st.piety < 0 || st.piety > 100 || !isFinite(st.piety)) anomalies.push([st.week, 'piety out of range', st.piety]);
  G.W.towns.forEach(t => {
    if (!isFinite(t.pros) || t.pros < 0 || t.pros > 100) anomalies.push([st.week, 'town prosperity bad', t.name, t.pros]);
    if (!isFinite(t.pop) || t.pop < 0) anomalies.push([st.week, 'town population bad', t.name, t.pop]);
  });
}
let guard = 0;
while (G.S.week < until && !G.S.over && guard++ < 30000) {
  applyDue();
  if (G.S.pendingCard) {
    const id = G.S.pendingCard.id;
    // a pending letter is answered by EITHER a 'c' (base option) or a 'k' (Wave 5 hook spend) —
    // take whichever targets this letter, earliest in the plan.
    const di = acts.findIndex(x => (x[1] === 'c' || x[1] === 'k') && x[2] === id);
    if (di >= 0) { const a = acts.splice(di, 1)[0];
      if (a[1] === 'k') {
        // a 'k' resolves ONLY if the leverage actually exists; annals.hook returns 'spent' on success
        // and a reason string otherwise. Log the decision only when it fired, and flag an anomaly
        // when it did not, so a plan that spends a hook that never minted is caught, not silently
        // falsified into the auto path.
        const r = annals.hook(id, a[3]);
        if (r === 'spent') decisions.push([G.S.week, 'hook', id, a[3]]);
        else anomalies.push([G.S.week, 'hook did not resolve', id, a[3], r]);
      }
      else { decisions.push([G.S.week, 'card', id, a[3]]); annals.choose(a[3]); } }
    else if (autoChoice !== null) {
      const c = G.S.pendingCard.c;                                   // noble re-reads (oN) can differ in length from o
      const opts = (G.S.mode === 'noble' && c.oN) ? c.oN : c.o;
      const n = opts.length; const i = ((autoChoice % n) + n) % n;
      decisions.push([G.S.week, 'card-auto', id, i]); annals.choose(i);
    } else break;
  }
  annals.advance(1);
  goldSeries.push(Math.round(G.S.gold)); grainSeries.push(G.S.grain);
  checkAnomalies();
}

const out = {
  seed: +seed, week: G.S.week, year: 30 + Math.floor(G.S.week / 52), over: G.S.over,
  state: annals.state(),
  pendingLetter: annals.choices(),
  decisions,
  anomalies: anomalies.slice(0, 40),
  goldMin: goldSeries.length ? Math.min.apply(null, goldSeries) : null,
  goldMax: goldSeries.length ? Math.max.apply(null, goldSeries) : null,
  grainMin: grainSeries.length ? Math.min.apply(null, grainSeries) : null,
  chronicleTail: annals.chronicle(30)
};
console.log(JSON.stringify(out, null, 1));

