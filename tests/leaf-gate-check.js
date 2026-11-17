// leaf-gate-check.js — leaf-check.js must exit non-zero when the Last Leaf's shape is broken,
// or run-all.sh counts a broken leafData() green. Runs a copy of leaf-check.js against a game.js
// whose annals.leafData() drops 'judgment' (must fire), and against the real game.js (must not fire).
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
let passes = 0, fails = 0;
function ok(c, msg){ if(c){ passes++; console.log('  ok  '+msg); } else { fails++; console.log('FAIL: '+msg); } }
const run = file => spawnSync('node', [file], { encoding: 'utf8' });

// must-not-fire: the real reign composes a whole leaf and exits 0
const good = run(path.join(__dirname, 'leaf-check.js'));
ok(good.status === 0, 'leaf-check exits 0 on the real game.js (got '+good.status+')');
ok(/leafData shape errors: NONE/.test(good.stdout), 'leaf-check reports NONE shape errors on the real game.js');
ok(!/FAIL:/.test(good.stdout), 'leaf-check prints no FAIL: line on the real game.js');

// must-fire: a leafData() missing its judgment exits 1 and names the error
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'leaf-gate-'));
try {
  fs.mkdirSync(path.join(tmp, 'tests'));
  fs.copyFileSync(path.join(__dirname, 'leaf-check.js'), path.join(tmp, 'tests', 'leaf-check.js'));
  fs.cpSync(path.join(__dirname, 'plans'), path.join(tmp, 'tests', 'plans'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'game.js'), fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8') +
    '\n;(function(){const f=annals.leafData;annals.leafData=function(){const d=f.call(annals);delete d.judgment;return d;};})();\n');
  const bad = run(path.join(tmp, 'tests', 'leaf-check.js'));
  ok(bad.status === 1, 'leaf-check exits 1 when leafData() lacks judgment (got '+bad.status+')');
  ok(/FAIL: leafData shape errors: missing judgment; judgment empty/.test(bad.stdout), 'leaf-check prints a FAIL: line naming the missing judgment');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

console.log('\n'+(fails===0?'ALL PASS':'FAILURES')+': '+passes+' passed, '+fails+' failed');
process.exit(fails===0?0:1);
