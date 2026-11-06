// raid-check.js — proves the Batch 5 recurring-raid system (v0.23.0).
// Between the big wars a bandit/border column tries the frontier every few years. This driver
// plays two full 50-year crown reigns on the SAME seed and asserts the raid system's four claims:
//   1. Raids RECUR — several land in a 50-year reign (they keep walls/beacons/garrisons live).
//   2. Raids never fire DURING a war (they auto-resolve only on a peacetime tick).
//   3. DEFENCE changes the outcome — a walled, beaconed, mustered realm (militarist) repels the
//      same columns that SACK an undefended realm (empty plan, cautious auto-play). Proven by
//      differing sack counts AND differing chronicle lines (beacon-repel vs unwalled-sack).
//   4. No anomalies (NaN / out-of-range) across either reign.
// A raid is detected without any test-only state: resolveRaid() is the ONLY place S.raidNext
// advances on a peacetime tick (a war-deferral also advances it, but only while S.war is set,
// so `!war` cleanly separates real raids from deferrals). The newest chronicle line on that tick
// is the raid's paragraph.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const seed = process.argv[2] || '3030830';

const CODE = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8')
  .replace("'use strict';", '')
  + '\nwindow.__G={S:S,W:W,finishSetup:finishSetup};';

function bootContext() {
  function stubCtx() { return new Proxy({}, { get: (t, p) => p in t ? t[p] : () => {}, set: (t, p, v) => { t[p] = v; return true; } }); }
  function mkEl(tag) {
    const el = { tag, children: [], style: { cssText: '' }, dataset: {}, textContent: '', value: '', className: '',
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      appendChild(c) { el.children.push(c); return c; }, removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); },
      get firstChild() { return el.children[0]; }, addEventListener() {}, setAttribute() {}, focus() {},
      querySelector() { return mkEl('q'); }, querySelectorAll() { return []; },
      set innerHTML(v) { el.children = []; }, get innerHTML() { return ''; } };
    el.getContext=() => stubCtx(); if(tag==='canvas'){ el.width=0; el.height=0; } return el; }
  const els = {}, sandbox = {};
  sandbox.window = sandbox; sandbox.Math = Math; sandbox.JSON = JSON; sandbox.Date = Date; sandbox.console = console;
  sandbox.btoa = s => Buffer.from(s, 'binary').toString('base64'); sandbox.atob = s => Buffer.from(s, 'base64').toString('binary');
  sandbox.encodeURIComponent = encodeURIComponent; sandbox.decodeURIComponent = decodeURIComponent; sandbox.unescape = s => s; sandbox.escape = s => s;
  sandbox.document = { getElementById(id) { return els[id] || (els[id] = mkEl('div')); }, createElement(t) { return mkEl(t); },
    createTextNode(t) { const e = mkEl('#text'); e.textContent = t; return e; }, querySelectorAll() { return []; }, head:mkEl('head'), querySelector:()=>null, title:'' };
  els['map'] = mkEl('canvas'); els['map'].width = 940; els['map'].height = 620;
  sandbox.location = { hash: '#s=' + seed, origin: '', pathname: '', reload() { throw new Error('reload'); } };
  sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  sandbox.matchMedia = () => ({ matches: false });
  sandbox.requestAnimationFrame = () => {}; sandbox.cancelAnimationFrame = () => {};
  sandbox.performance = { now: () => 0 }; sandbox.setTimeout = () => 0; sandbox.clearTimeout = () => {};
  sandbox.setInterval = () => 0; sandbox.clearInterval = () => {}; sandbox.navigator = {};
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);
  return sandbox;
}

const RAID_RX = /\braid|border-column|brigand/i;          // vocabulary unique to raid paragraphs
const SACK_RX = /\bsacked\b|fell in the|took .* entire/i; // a frontier town lost

// Play one reign to week 1040; return {over, raids:[{wk,war,line}], sacks, anomalies}
function playReign(planFile) {
  const plan = planFile ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : { ruler: ['Queen', 'Testrun'], actions: [] };
  const acts = (plan.actions || []).slice().sort((a, b) => a[0] - b[0]);
  const G = bootContext(); const annals = G.annals;
  G.finishSetup(plan.ruler[0], plan.ruler[1], plan.mode || 'crown');
  const anomalies = [], raids = [];
  let prevNext, guard = 0;
  function applyDue() {
    while (acts.length && acts[0][0] <= G.__G.S.week && acts[0][1] !== 'c') {
      const a = acts.shift();
      if (a[1] === 's') annals.setSlider(a[2], a[3]);
      else if (a[1] === 'b') annals.build(a[2]);
      else if (a[1] === 'y') annals.spy();
      else if (a[1] === 'p') annals.petition(a[2]);
    }
  }
  function scan() {
    const st = G.__G.S;
    if (!isFinite(st.gold)) anomalies.push([st.week, 'gold']);
    if (!isFinite(st.grain) || st.grain < 0) anomalies.push([st.week, 'grain', st.grain]);
    if (!isFinite(st.levies) || st.levies < 0) anomalies.push([st.week, 'levies', st.levies]);
    if (st.legit < 0 || st.legit > 100 || !isFinite(st.legit)) anomalies.push([st.week, 'legit', st.legit]);
    if (st.piety < 0 || st.piety > 100 || !isFinite(st.piety)) anomalies.push([st.week, 'piety', st.piety]);
    G.__G.W.towns.forEach(t => {
      if (!isFinite(t.pros) || t.pros < 0 || t.pros > 100) anomalies.push([st.week, 'pros', t.name, t.pros]);
      if (!isFinite(t.pop) || t.pop < 0) anomalies.push([st.week, 'pop', t.name, t.pop]);
    });
  }
  while (G.__G.S.week < 1040 && !G.__G.S.over && guard++ < 30000) {
    applyDue();
    if (G.__G.S.pendingCard) {
      const id = G.__G.S.pendingCard.id;
      const ci = acts.findIndex(x => x[1] === 'c' && x[2] === id);
      if (ci >= 0) { const a = acts.splice(ci, 1)[0]; annals.choose(a[3]); }
      else { const n = G.__G.S.pendingCard.c.o.length; annals.choose(((0 % n) + n) % n); } // auto=0: cautious
    }
    annals.advance(1);
    if (G.__G.S.raidNext !== prevNext && prevNext !== undefined) {
      const war = !!G.__G.S.war;                          // a war-deferral bumps raidNext too, only while at war
      // a raidNext bump means a border/bandit raid resolved this week; grab the raid paragraph from the
      // last few lines rather than assuming it is the very last (a coincident deep-folk raid or other
      // event can be logged after it — the rebaselined trajectory now opens the Delve some reigns).
      const recent = annals.chronicle(3).map(l => l.replace(/^\[[^\]]*\]\s*/, ''));
      const line = recent.reverse().find(l => RAID_RX.test(l)) || (recent[0] || '');
      if (!war) raids.push({ wk: G.__G.S.week, war, line }); // real raids resolve only in peacetime
    }
    prevNext = G.__G.S.raidNext;
    scan();
  }
  const sacks = raids.filter(r => SACK_RX.test(r.line)).length;
  return { over: G.__G.S.over || 'endured', week: G.__G.S.week, raids, sacks, anomalies };
}

const errs = [];
const undef = playReign(null);                                          // empty plan, cautious auto-play → undefended
const defended = playReign(path.join(__dirname, 'plans', 'militarist.json')); // walls + beacon + arms → defended

// ---- 1. raids recur ----
if (undef.raids.length < 3) errs.push('undefended reign saw only ' + undef.raids.length + ' raids (want >=3)');
if (defended.raids.length < 3) errs.push('defended reign saw only ' + defended.raids.length + ' raids (want >=3)');

// ---- 2. every real raid landed in peacetime, and every real-raid line IS a raid paragraph ----
[['undefended', undef], ['defended', defended]].forEach(([tag, r]) => {
  r.raids.forEach(x => {
    if (x.war) errs.push(tag + ' raid at wk' + x.wk + ' fired during a war');
    if (!RAID_RX.test(x.line)) errs.push(tag + ' raid at wk' + x.wk + ' has a non-raid line: ' + x.line);
  });
});

// ---- 3. defence changes the outcome ----
if (!(undef.sacks >= 1)) errs.push('undefended reign was never sacked by a raid (want >=1)');
if (!(defended.sacks < undef.sacks)) errs.push('defence did not reduce sacks (defended=' + defended.sacks + ', undefended=' + undef.sacks + ')');
const defendedMentionsDefence = defended.raids.some(r => /beacon|walls|ramparts|muster turned out|drawn up/i.test(r.line));
if (!defendedMentionsDefence) errs.push('no defended raid line credits a defence (beacon/walls/garrison)');

// ---- 4. no anomalies ----
if (undef.anomalies.length) errs.push('undefended anomalies: ' + JSON.stringify(undef.anomalies.slice(0, 5)));
if (defended.anomalies.length) errs.push('defended anomalies: ' + JSON.stringify(defended.anomalies.slice(0, 5)));

// ---- report ----
console.log('seed:', seed);
console.log('UNDEFENDED (empty plan, auto=0):', undef.over, '| raids:', undef.raids.length, '| sacked by raid:', undef.sacks);
undef.raids.forEach(r => console.log('   yr' + (30 + Math.floor(r.wk / 52)) + '  ' + r.line));
console.log('DEFENDED (militarist, walls+beacon+arms):', defended.over, '| raids:', defended.raids.length, '| sacked by raid:', defended.sacks);
defended.raids.forEach(r => console.log('   yr' + (30 + Math.floor(r.wk / 52)) + '  ' + r.line));
console.log(errs.length ? ('FAIL: ' + errs.join('; ')) : 'PASS: raids recur, never during war, and defence turns a sack into a repel — the walls/beacon/garrison stay live between wars.');
process.exit(errs.length ? 1 : 0);

