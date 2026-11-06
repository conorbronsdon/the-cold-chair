// diorama-check.js — headless regression harness for the Diorama view.
//
// Run from the repository root:
//   node tests/diorama-check.js
//
// The WebGL renderer cannot run here, so this checks the part that decides WHAT the diorama shows:
// AnnalsDiorama.model() reads the realm and returns the settlements, walls, ruins, hosts and battles
// it would build. The checks hold it to the same contract as the raised table: it never changes the
// simulation, never draws from the four seeded streams, answers identically for the same realm, and
// its numbers follow the state (figures = men / MEN_PER_FIGURE, walls only when built, and so on).
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SEEDS = [3030830, 7777, 4655762, 1043]; // valley, coastal, island, pass
let passes = 0, failures = 0;
function ok(condition, message) {
  if (condition) passes++;
  else { failures++; console.log('  FAIL: ' + message); }
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function inlineGame() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const match = html.match(/<script>\s*([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('index.html has no inline game script');
  return match[1].replace("'use strict';", '');
}
function stubCtx() {
  return new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => {}), set: (t, p, v) => { t[p] = v; return true; } });
}
function makeElement(tag) {
  const el = { tag, children: [], style: {}, dataset: {}, textContent: '', value: '', className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { this.children.push(child); return child; }, removeChild() {}, addEventListener() {},
    setAttribute() {}, getAttribute() { return null; }, focus() {}, querySelector() { return makeElement('q'); }, querySelectorAll() { return []; },
    get firstChild() { return this.children[0]; }, set innerHTML(v) { this.children = []; }, get innerHTML() { return ''; },
    getContext() { return stubCtx(); } };
  if (tag === 'canvas') { el.width = 1200; el.height = 800; }
  return el;
}
function boot(seed) {
  const els = Object.create(null), sandbox = {};
  sandbox.window = sandbox; sandbox.global = sandbox; sandbox.console = console;
  sandbox.Math = Math; sandbox.JSON = JSON; sandbox.Date = Date; sandbox.Number = Number;
  sandbox.Array = Array; sandbox.Object = Object; sandbox.String = String; sandbox.Boolean = Boolean;
  sandbox.isFinite = isFinite; sandbox.parseInt = parseInt; sandbox.parseFloat = parseFloat;
  sandbox.btoa = s => Buffer.from(s, 'binary').toString('base64');
  sandbox.atob = s => Buffer.from(s, 'base64').toString('binary');
  sandbox.encodeURIComponent = encodeURIComponent; sandbox.decodeURIComponent = decodeURIComponent;
  sandbox.escape = escape; sandbox.unescape = unescape;
  sandbox.document = {
    getElementById(id) { return els[id] || (els[id] = makeElement('div')); },
    createElement(tag) { return makeElement(tag); }, createTextNode(text) { const e = makeElement('#text'); e.textContent = text; return e; },
    querySelector() { return null; }, querySelectorAll() { return []; }, head: makeElement('head'), title: ''
  };
  els.map = makeElement('canvas'); els.map.width = 940; els.map.height = 620;
  sandbox.location = { hash: '#s=' + seed, origin: '', pathname: '', reload() { throw new Error('unexpected reload'); } };
  sandbox.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  sandbox.matchMedia = () => ({ matches: false }); sandbox.requestAnimationFrame = () => 0; sandbox.cancelAnimationFrame = () => {};
  sandbox.setTimeout = () => 0; sandbox.clearTimeout = () => {}; sandbox.setInterval = () => 0; sandbox.clearInterval = () => {};
  sandbox.performance = { now: () => 0 }; sandbox.navigator = {};
  vm.createContext(sandbox);
  let code = inlineGame();
  if (!/var\s+AnnalsDiorama\s*=/.test(code)) throw new Error('AnnalsDiorama is not present in the inline game script');
  code += '\nwindow.__D={S:S,W:W,finishSetup:finishSetup,dio:AnnalsDiorama,'
    + 'next:()=>[rWorld(),rDetail(),rHist(),rAmb()],consumeHist:()=>rHist()};';
  vm.runInContext(code, sandbox, { filename: 'index-inline-script.js' });
  sandbox.__D.finishSetup('Queen', 'Diorama Check', 'crown', 'cold');
  return sandbox.__D;
}
function snapshot(d) { return { state: JSON.stringify(d.S), world: JSON.stringify(d.W), actions: JSON.stringify(d.S.actions) }; }
// Two twins: one is modelled, the other is not; afterwards both draw from all four streams.
function evaluate(seed, change, reader) {
  const A = boot(seed), B = boot(seed);
  change(A); change(B);
  const before = snapshot(A); let thrown = null, out = null;
  try { out = (reader || (d => d.dio.model()))(A); } catch (error) { thrown = error; }
  const after = snapshot(A);
  const nextA = A.next(), nextB = B.next();
  return { out, threw: thrown, sameState: same(before, after), sameRng: same(nextA, nextB), d: A };
}
const finite = m => JSON.stringify(m).match(/null|NaN|Infinity/) === null && m.probe.every(Number.isFinite);

// ---- every realm shape: pure, deterministic, substantive
const baseModels = new Map();
for (const seed of SEEDS) {
  const a = evaluate(seed, () => {}), b = evaluate(seed, () => {});
  const shape = a.d.W.shape;
  ok(!a.threw, 'seed ' + seed + ' (' + shape + ') models without throwing' + (a.threw ? ': ' + a.threw.stack : ''));
  if (a.threw) continue;
  ok(a.sameState, 'seed ' + seed + ' leaves simulation state and action log byte-identical');
  ok(a.sameRng, 'seed ' + seed + ' consumes none of the four seeded streams');
  ok(finite(a.out), 'seed ' + seed + ' produces only finite numbers');
  ok(same(a.out, b.out), 'seed ' + seed + ' models identically on two boots');
  const houses = a.out.towns.reduce((s, t) => s + t.houses, 0);
  ok(a.out.towns.length === a.d.W.towns.length && houses >= 200, 'seed ' + seed + ' builds every settlement (' + houses + ' houses)');
  const cap = a.out.towns.find(t => t.name === a.d.W.capital.name);
  ok(cap && a.out.towns.every(t => t === cap || t.houses <= cap.houses), 'seed ' + seed + ' makes the capital the largest settlement');
  ok(a.out.hosts.length === 0 && a.out.engaged === 0, 'seed ' + seed + ' shows no armies in peacetime');
  baseModels.set(seed, a.out);
}
ok(new Set([...baseModels.values()].map(m => JSON.stringify(m.probe))).size === baseModels.size, 'different realms raise different ground');

// ---- the model follows the state
const S0 = 3030830, base = baseModels.get(S0);
function grow(d) { const t = d.W.towns.find(x => x !== d.W.capital); t.pop = 4400; }
const grown = evaluate(S0, grow);
const gi = grown.d.W.towns.findIndex(x => x !== grown.d.W.capital);
ok(grown.sameState && grown.out.towns[gi].houses > base.towns[gi].houses * 1.8,
  'a town that grows gains houses (' + base.towns[gi].houses + ' -> ' + grown.out.towns[gi].houses + ')');

const capIndex = d => d.W.towns.indexOf(d.W.capital);
const walled = evaluate(S0, d => { d.S.built.walls = 1; });
ok(base.towns[capIndex(walled.d)].walls === 0, 'an unwalled capital has no walls');
ok(walled.out.towns[capIndex(walled.d)].walls >= 12, 'built walls ring the capital (' + walled.out.towns[capIndex(walled.d)].walls + ' segments)');
ok(walled.out.towns.every((t, i) => i === capIndex(walled.d) || t.walls === 0), 'walls belong to the capital only');

const cath = evaluate(S0, d => { d.S.built.cathedral = 1; d.S.flags.mint = true; });
const civic = cath.out.towns[capIndex(cath.d)].civic;
ok(civic.includes('cathedral') && civic.includes('mint') && !base.towns[capIndex(cath.d)].civic.includes('cathedral'),
  'the cathedral and mint stand in the capital only once built (' + civic.join(',') + ')');

const sacked = evaluate(S0, d => { d.W.towns[1].wasSacked = true; d.W.towns[1].sacked = 20; });
ok(base.towns[1].ruins === 0 && sacked.out.towns[1].ruins >= sacked.out.towns[1].houses * .3,
  'a burning town shows its ruins (' + sacked.out.towns[1].ruins + ' of ' + sacked.out.towns[1].houses + ')');
const scarred = evaluate(S0, d => { d.W.towns[1].wasSacked = true; d.W.towns[1].sacked = 0; });
ok(scarred.out.towns[1].ruins > 0 && scarred.out.towns[1].ruins < sacked.out.towns[1].ruins,
  'a sacked town keeps fewer ruins once the fire is out (' + scarred.out.towns[1].ruins + ')');

// ---- the war: hosts and battles come from S.war, at one figure per MEN_PER_FIGURE men
function war(d, gap) {
  const cap = d.W.capital, pass = d.W.pass;
  d.S.war = { columns: [{ x: pass.x, y: pass.y, str: 1900, cd: 0 }, { x: cap.x + gap, y: cap.y, str: 1450, cd: 0 }],
    armies: [{ x: cap.x, y: cap.y, str: 1300, home: false }, { x: cap.x, y: cap.y, str: 700, home: true }],
    sacks: 0, won: 0, weeks: 3, offensive: false };
}
const marching = evaluate(S0, d => war(d, 40)), clash = evaluate(S0, d => war(d, 8));
const per = marching.d.dio.MEN_PER_FIGURE;
ok(per === 12, 'the contract is one figure per twelve men (' + per + ')');
ok(marching.sameState && marching.sameRng, 'modelling a war leaves state and streams untouched');
ok(marching.out.hosts.length === 4, 'every column and army in the field is shown (' + marching.out.hosts.length + ')');
ok(marching.out.hosts.every(h => h.figures === Math.round(h.str / per)),
  'each host fields one figure per ' + per + ' men (' + marching.out.hosts.map(h => h.str + ':' + h.figures).join(' ') + ')');
ok(marching.out.engaged === 0, 'a column 40 leagues off is not yet a battle');
ok(clash.out.engaged === 1, 'a column within reach of the field army is a battle (' + clash.out.engaged + ')');
const siege = evaluate(S0, d => { war(d, 3); d.S.war.siege = true; d.S.war.armies = d.S.war.armies.filter(a => a.home); });
ok(siege.out.siege === 1 && siege.out.engaged === 0, 'a column at the walls with no field army is a siege, not a battle');

// ---- the figure contract at its edges: no floor above one, a ceiling far past any real host
const edges = evaluate(S0, () => {}, d => [0, 5, 12, 18, 6000, 12000, 99999].map(n => d.dio.figuresFor(n)));
ok(same(edges.out, [0, 1, 1, 2, 500, 1000, 1000]), 'figures at the edges: 0, 5, 12, 18, 6000, 12000 and 99999 men give ' + JSON.stringify(edges.out));

// ---- the fallen are the week's real losses, including a unit broken and removed that week
const ledger = evaluate(S0, d => war(d, 8), d => {
  const out = [], W0 = d.S.week;
  out.push(d.dio.observe());                                    // first look: positions only
  const col = d.S.war.columns[1], field = d.S.war.armies[0];
  col.str -= 240; field.str -= 120; d.S.week = W0 + 1;           // a week of fighting: 20 + 10 figures
  out.push(d.dio.observe());
  col.str = 150; d.S.war.columns = d.S.war.columns.filter(c => c !== col); d.S.week = W0 + 2;   // broken: 1210 -> 150
  out.push(d.dio.observe());
  d.S.war = null; d.S.week = W0 + 3;                             // a treaty: no rout, no new dead
  out.push(d.dio.observe());
  return out;
});
ok(!ledger.threw && same(ledger.out, [0, 30, 30 + 88, 118]),
  'the field holds each week’s real losses: 0, +30, +88 for the broken column, +0 at a treaty (' + JSON.stringify(ledger.out) + (ledger.threw ? ' ' + ledger.threw.stack : '') + ')');
ok(ledger.sameRng, 'reading the war consumes none of the seeded streams');

// ---- the field outlasts a look away; only another reign or a replay clears it
const gap = evaluate(S0, d => war(d, 8), d => {
  const out = [], W0 = d.S.week;
  out.push(d.dio.observe());
  d.S.war.columns[1].str -= 240; d.S.week = W0 + 1; out.push(d.dio.observe());   // 20 fall
  d.S.week = W0 + 9; out.push(d.dio.observe());                                    // eight weeks unwatched: kept, none added
  d.S.war.columns[1].str -= 120; d.S.week = W0 + 10; out.push(d.dio.observe());  // watching again: +10
  d.S.week = W0 - 40; out.push(d.dio.observe());                                   // a replay rewinds: another field
  return out;
});
ok(!gap.threw && same(gap.out, [0, 20, 20, 30, 0]), 'the fallen survive an eight-week gap and clear on a rewind (' + JSON.stringify(gap.out) + ')');

// ---- display pace: the diorama never slows the realm unless it is open (it cannot open headless)
const pace = evaluate(S0, d => war(d, 8), d => d.dio.minStep());
ok(pace.out === 0 && pace.sameState && pace.sameRng, 'a closed diorama asks for no slower weeks');

// ---- must-fire controls: the guards above can fail
const stateLeak = evaluate(S0, () => {}, d => { const m = d.dio.model(); d.S.gold += 1; return m; });
const rngLeak = evaluate(S0, () => {}, d => { const m = d.dio.model(); d.consumeHist(); return m; });
const wrongFigures = evaluate(S0, d => war(d, 40), d => { const m = d.dio.model(); m.hosts[0].figures += 1; return m; });
ok(!stateLeak.sameState, 'control: a state mutation trips the state-preservation guard');
ok(!rngLeak.sameRng, 'control: a stream draw trips the seeded-stream guard');
ok(!wrongFigures.out.hosts.every(h => h.figures === Math.round(h.str / per)), 'control: a miscounted host trips the figure check');
ok(!finite(Object.assign({}, base, { probe: [NaN] })), 'control: a NaN height trips the finite check');

console.log('==== diorama: ' + passes + ' pass, ' + failures + ' fail ====');
process.exitCode = failures ? 1 : 0;
