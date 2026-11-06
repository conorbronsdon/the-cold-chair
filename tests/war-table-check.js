// war-table-check.js — headless regression harness for the raised war table.
//
// Run from the repository root:
//   node tests/war-table-check.js
//
// It deliberately runs the game's *inline* script in isolated VMs.  A recording
// CanvasRenderingContext2D turns a paint into a deterministic operation digest,
// without needing Playwright or a browser binary.
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

function makeCanvasRecorder() {
  let hash = 2166136261 >>> 0;
  let operations = 0, primitives = 0;
  const counts = Object.create(null), badNumbers = [];
  const mix = text => {
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619) >>> 0; }
  };
  const value = v => {
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) badNumbers.push(String(v));
      return Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : String(v);
    }
    if (typeof v === 'string' || typeof v === 'boolean' || v == null) return String(v);
    if (Array.isArray(v)) return '[' + v.map(value).join(',') + ']';
    return Object.prototype.toString.call(v);
  };
  const gradient = { addColorStop(...args) { record('addColorStop', args); } };
  const record = (name, args) => {
    operations++; counts[name] = (counts[name] || 0) + 1;
    if (/^(beginPath|moveTo|lineTo|arc|arcTo|ellipse|rect|quadraticCurveTo|bezierCurveTo|fill|stroke|fillRect|strokeRect|drawImage)$/.test(name)) primitives++;
    mix(name + '(' + Array.prototype.map.call(args, value).join(',') + ')');
  };
  const methods = new Set([
    'save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'ellipse', 'rect',
    'quadraticCurveTo', 'bezierCurveTo', 'fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'clip',
    'translate', 'rotate', 'scale', 'transform', 'setTransform', 'drawImage', 'fillText', 'strokeText',
    'setLineDash', 'createLinearGradient', 'createRadialGradient', 'createPattern'
  ]);
  const state = Object.create(null);
  const context = new Proxy(state, {
    get(target, prop) {
      if (prop === 'canvas') return { width: 1200, height: 800 };
      if (prop === 'measureText') return text => ({ width: String(text).length * 7 });
      if (prop === 'getLineDash') return () => [];
      if (methods.has(prop)) return (...args) => { record(prop, args); return /^create/.test(prop) ? gradient : undefined; };
      if (prop in target) return target[prop];
      return (...args) => record(String(prop), args);
    },
    set(target, prop, val) { record('set:' + String(prop), [val]); target[prop] = val; return true; }
  });
  return { context, result: () => ({ digest: hash >>> 0, operations, primitives, counts, badNumbers: badNumbers.slice() }) };
}

function makeElement(tag, recorder) {
  const el = { tag, children: [], style: {}, dataset: {}, textContent: '', value: '', className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { this.children.push(child); return child; }, removeChild() {}, addEventListener() {},
    setAttribute() {}, getAttribute() { return null; }, focus() {}, querySelector() { return makeElement('q', recorder); }, querySelectorAll() { return []; },
    get firstChild() { return this.children[0]; }, set innerHTML(v) { this.children = []; }, get innerHTML() { return ''; },
    getContext() { return recorder.context; } };
  if (tag === 'canvas') { el.width = 1200; el.height = 800; }
  return el;
}

function boot(seed) {
  const recorder = makeCanvasRecorder();
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
    getElementById(id) { return els[id] || (els[id] = makeElement('div', recorder)); },
    createElement(tag) { return makeElement(tag, recorder); }, createTextNode(text) { const e = makeElement('#text', recorder); e.textContent = text; return e; },
    querySelector() { return null; }, querySelectorAll() { return []; }, head: makeElement('head', recorder), title: ''
  };
  els.map = makeElement('canvas', recorder); els.map.width = 940; els.map.height = 620;
  sandbox.location = { hash: '#s=' + seed, origin: '', pathname: '', reload() { throw new Error('unexpected reload'); } };
  sandbox.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  sandbox.matchMedia = () => ({ matches: false }); sandbox.requestAnimationFrame = () => 0; sandbox.cancelAnimationFrame = () => {};
  sandbox.setTimeout = () => 0; sandbox.clearTimeout = () => {}; sandbox.setInterval = () => 0; sandbox.clearInterval = () => {};
  sandbox.performance = { now: () => 0 }; sandbox.navigator = {};
  vm.createContext(sandbox);
  let code = inlineGame();
  if (!/function\s+drawWarTable\s*\(/.test(code))
    throw new Error('drawWarTable is not present in the inline game script');
  code += '\nwindow.__TABLE={S:S,W:W,finishSetup:finishSetup,draw:drawWarTable,'
    + 'next:()=>[rWorld(),rDetail(),rHist(),rAmb()],consumeHist:()=>rHist()};';
  vm.runInContext(code, sandbox, { filename: 'index-inline-script.js' });
  sandbox.__TABLE.finishSetup('Queen', 'Renderer Check', 'crown', 'cold');
  return { sandbox, table: sandbox.__TABLE, recorder };
}

function snapshot(table) {
  // S.actions is called out explicitly because it is the replay contract; whole S/W snapshots also catch
  // quieter state changes such as town prosperity or a state flag.
  return { state: JSON.stringify(table.S), world: JSON.stringify(table.W), actions: JSON.stringify(table.S.actions) };
}
function paint(run, painter) {
  // Boot paints the ink map.  A renderer test must count only the raised table's own calls.
  run.recorder = makeCanvasRecorder();
  const before = snapshot(run.table);
  let thrown = null;
  try { painter(run.table.draw, run.recorder.context, run.table); } catch (error) { thrown = error; }
  const after = snapshot(run.table);
  return { before, after, threw: thrown, canvas: run.recorder.result() };
}
function evaluatePure(seed, change, painter) {
  const A = boot(seed), B = boot(seed);
  change(A.table); change(B.table);
  const result = paint(A, painter || ((draw, g) => draw(g)));
  // Calling the four streams AFTER painting (and comparing a clean twin) detects even one hidden render draw.
  const nextA = A.table.next(), nextB = B.table.next();
  return Object.assign(result, { nextA, nextB, sameState: same(result.before, result.after), sameRng: same(nextA, nextB) });
}
function baselineChange() {}
function seasonal(table) { table.S.week = 40; }
function scorched(table) { table.W.towns[1].wasSacked = true; table.W.towns[1].pros = Math.max(4, table.W.towns[1].pros - 30); }
function grownTown(table) {
  // Grow a settlement across the renderer's visible village/town/city boundary.  The chosen seed
  // normally has several smaller settlements; the fallback still crosses a boundary if future worldgen does not.
  const t = table.W.towns.find(x => x !== table.W.capital && x.pop < 3000) || table.W.towns.find(x => x !== table.W.capital);
  t.pop = t.pop < 3000 ? 4200 : 650; t.pros = 93;
}
function activeWar(table) {
  table.S.war = { columns: [{ x: table.W.pass.x, y: table.W.pass.y, str: 1900, born: 0 }],
    armies: [{ x: table.W.capital.x, y: table.W.capital.y, str: 1400, home: false }], sacks: 0, won: 0, weeks: 2, offensive: false };
}

const shapes = [];
const firstDigests = new Map();
for (const seed of SEEDS) {
  const a = evaluatePure(seed, baselineChange), b = evaluatePure(seed, baselineChange);
  const shape = boot(seed).table.W.shape;
  shapes.push(shape);
  ok(!a.threw, 'seed ' + seed + ' (' + shape + ') paints without throwing');
  ok(a.sameState, 'seed ' + seed + ' leaves simulation state and action log byte-identical');
  ok(a.sameRng, 'seed ' + seed + ' consumes none of the four seeded streams');
  ok(a.canvas.badNumbers.length === 0, 'seed ' + seed + ' sends only finite geometry to canvas');
  ok(a.canvas.operations >= 80 && a.canvas.primitives >= 30,
    'seed ' + seed + ' emits a substantive table (' + a.canvas.operations + ' ops, ' + a.canvas.primitives + ' primitives)');
  ok(a.canvas.digest === b.canvas.digest, 'seed ' + seed + ' has a deterministic canvas-operation digest (' + a.canvas.digest + ')');
  firstDigests.set(seed, a.canvas.digest);
}
ok(same(shapes.slice().sort(), ['coastal', 'island', 'pass', 'valley'].sort()), 'the four pinned seeds cover valley, coastal, island, and pass worlds (' + shapes.join(', ') + ')');
ok(new Set(firstDigests.values()).size >= 3, 'different worlds produce distinct table operation digests');

// These are behaviour checks, not implementation-shaped checks: a table whose output does not respond to
// season, devastation, settlement scale, and forces in the field has lost useful realm information.
const base = firstDigests.get(3030830);
[['season', seasonal], ['scorch', scorched], ['town growth', grownTown], ['war', activeWar]].forEach(([name, change]) => {
  const r = evaluatePure(3030830, change);
  ok(!r.threw && r.sameState && r.sameRng && r.canvas.badNumbers.length === 0, name + ' variation remains a pure, finite paint');
  ok(r.canvas.digest !== base, name + ' changes the rendered table digest');
});

// Must-fire controls: prove the guard itself rejects the three failure classes it claims to cover.
const stateLeak = evaluatePure(3030830, baselineChange, (_draw, _g, table) => { table.S.gold += 1; });
const rngLeak = evaluatePure(3030830, baselineChange, (_draw, _g, table) => { table.consumeHist(); });
const nanLeak = evaluatePure(3030830, baselineChange, (_draw, g) => { g.arc(NaN, 0, 1, 0, 1); });
const noPaint = evaluatePure(3030830, baselineChange, () => {});
ok(!stateLeak.sameState, 'control: state mutation trips the state-preservation guard');
ok(!rngLeak.sameRng, 'control: RNG consumption trips the seeded-stream guard');
ok(nanLeak.canvas.badNumbers.length > 0, 'control: NaN geometry trips the finite-canvas guard');
ok(noPaint.canvas.operations < 80 || noPaint.canvas.primitives < 30,
  'control: an empty renderer trips the substantive-paint threshold');

console.log('==== raised war table: ' + passes + ' pass, ' + failures + ' fail ====');
process.exitCode = failures ? 1 : 0;
