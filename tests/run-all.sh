#!/usr/bin/env bash
# run-all.sh — the whole suite in one command. Regenerates game.js first (the iron law's build step),
# runs every *-check.js / *-test.js, then the real-browser smoke if Playwright is available.
set -uo pipefail
cd "$(dirname "$0")/.."
sed -n '/^<script>$/,/^<\/script>$/p' index.html | sed '1d;$d' > game.js
node --check game.js || exit 1
fail=0; n=0
for t in tests/*-check.js tests/*-test.js; do
  n=$((n+1))
  if ! node "$t" >/dev/null 2>&1; then echo "FAIL $t"; node "$t" 2>&1 | grep -m3 "FAIL:"; fail=$((fail+1)); fi
done
if node -e "require('playwright')" 2>/dev/null; then
  for b in tests/browser-smoke.js tests/reading-smoke.js; do
    n=$((n+1)); node "$b" >/dev/null 2>&1 && echo "$(basename "$b" .js): PASS" || { echo "FAIL $b"; node "$b" 2>&1 | grep -m3 "FAIL:"; fail=$((fail+1)); }
  done
else echo "browser smokes: skipped (npm i playwright --no-save to enable)"; fi
echo "==== $((n-fail))/$n suites green ===="
exit $fail
