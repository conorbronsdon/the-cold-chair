// playtest-feedback-check.js — issue #41 UX promises remain wired into the one-file game.
'use strict';
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
let passes=0, fails=0;
function ok(cond,msg){ if(cond)passes++; else{fails++;console.log('  FAIL: '+msg);} }

console.log('§1 the turning year and harvest are visible');
ok(/id="seasonbar"/.test(html) && /role="progressbar"/.test(html), 'the map has a season progress bar');
ok(/function renderSeasonBar\(\)/.test(html) && /week '\+\(within\+1\)\+' of 13'/.test(html), 'the season bar advances across thirteen weeks');
ok(/id="harvestline"/.test(html) && /Next autumn reaping in/.test(html), 'the ledger names the next harvest');
ok(/id="mapfold"/.test(html) && /map-folded/.test(html), 'the large map can be folded without hiding the rest of the realm');

console.log('§2 the Crown’s Ledger explains itself');
for(const term of ['Treasury','Granaries','Levies','Legitimacy','Piety','Prosperity'])
  ok(new RegExp('<dt>'+term+'<\\/dt>').test(html), term+' has a definition');
ok(/grain is not bought directly/.test(html), 'the ledger explicitly says there is no direct grain purchase');

console.log('§3 monuments visibly alter the map');
ok(/function drawMonument\(g,kind\)/.test(html), 'a dedicated monument renderer exists');
for(const label of ['THE GREAT WEIR','THE TWIN PHAROS','THE HOUSE OF TWO CROWNS','THE IRON GATES'])
  ok(html.includes("label='"+label+"'"), label+' has its own labelled drawing');
ok(/drawMonument\(g,S\.flags\.wonder\)/.test(html), 'the completed wonder flag drives the map landmark');
ok(/if\(\/\^w_\/\.test\(k\) && k!==shapeWonderKey\(\)\) continue/.test(html), 'only the monument possible in this geography is shown');

console.log('§4 the opening choices and build blockers are explicit');
for(const cue of ['STANDARD REIGN','ADVANCED CLIMB','CHALLENGE SCENARIOS','PERSISTENT DYNASTY'])
  ok(html.includes(cue), cue+' is explained at setup');
ok(/need '\+Math\.ceil\(b\.cost-S\.gold\)\+' more'/.test(html), 'an unaffordable work states the missing gold');

console.log('\n'+(fails?'FAILURES':'ALL PASS')+': '+passes+' passed, '+fails+' failed');
process.exit(fails?1:0);
