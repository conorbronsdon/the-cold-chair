# Changelog

## v0.78.1 — The Diorama, full screen

- Full screen now plays the reign from inside the Diorama. Letters open over the model, the pace controls sit at the bottom of the screen, and Build, the Codex, toasts and the Last Leaf all stay on top. It used to fullscreen the map stage alone, which hid every letter and the pace while it was up. Leaving the Diorama for another view leaves full screen; where the browser has no full-screen API, the same view fills the window and Escape leaves it.
- In full screen the season's week counter stays clear of the Codex button, and on a phone the letter's last option stays clear of the pace bar.
- A seat's counsel on a letter no longer reads "The the Master of Whispers counsels".
- The hosted build credits its maker under the footer, with site, GitHub and source links. It is added by the hosted packager only, so the source page and the public copy are unchanged.

## v0.78.0 — The Diorama

- Added a third realm view, **Diorama**: a lit three-dimensional model of the realm on the war table that you can lean into, from the whole realm down to a single street. Drag to move, scroll or pinch to lean in, right-drag to turn, double-click to look closer; arrow keys, plus/minus and Q/E work from the keyboard.
- Settlements are built from their real state: house count follows population, the capital raises its keep and, once built, its walls or bulwark, cathedral, university, guildhall and mint; markets set out stalls; a sacked town shows ruins and burns while its fire lasts, and keeps its scars after.
- The war can be watched. Columns march where the war actually moved them, the field army closes on them, and when they meet the front ranks clash under the dust. The dead left on the field are that week's real losses, one figure for every twelve men. Sieges ring the capital; the garrison mans the walls; a broken column scatters.
- **Follow the war** (on by default) flies the eye to a battle or siege when it begins and slows the weeks while one is on screen, so it can be watched. The pace is presentation only: weeks stay whole ticks, and nothing the action log records changes.
- Seasons, the realm's roads, mills, bridge, harbour, lighthouse, monastery, passes, the rival's camp, barges on the river and the wyrm all appear in the model.
- The view is display only: it never writes simulation state, never draws from the four seeded streams, and keeps its camera and memory of the fallen outside saves and history links. Its renderer (three.js r158, MIT, vendored and integrity-pinned) loads only when the view is first opened; if it cannot load, the game says so and stays on the table.
- Building waits for an open letter: the floating Build button hides, and both it and the works panel refuse, while a letter is pending. A work started behind an unanswered letter would have made a reload answer that letter with its default (the agent API is unchanged; see issue #48).
- The service worker never caches hosted `/api/` responses, so an offline check cannot read a stale answer.
- Added a headless model check (purity, determinism, settlements, walls, ruins, one-figure-per-twelve-men hosts, battle and siege detection, with mutation controls) and real-browser checks that the diorama draws a substantive scene and leaves the reign and its replay link untouched.

## v0.77.0 — The Raised Realm

- Added a playable paper-relief Table view: folded mountains, carved woods, parish fields, a capital keep, miniature settlements, and raised works across all four realm shapes.
- Seasons reach the model through land colour and winter ice; devastation leaves floor stains and burned trees, while construction, barges, armies, and the wyrm follow committed realm state.
- Kept Ink map available beside Table. The original canvas still supplies the Last Leaf, and neither view choice nor decorative rendering enters simulation state or consumes its random streams.
- Brought desktop letters beside the model, kept the Codex reachable during decisions, and capped the folio height so the opening chronicle remains visible.
- Added renderer purity, finite-geometry, shape, and mutation-control tests plus real-browser view-switch and export-preservation checks.


## v0.76.1 — The Playtest Clarity Pass

- Added a persistent season marker and next-harvest guidance, including an actionable low-grain warning.
- Added plain-language ledger definitions, foldable map controls, clearer setup labels, and explicit build blockers.
- Made completed monuments visually distinct on the map so a wonder changes the realm rather than only its ledger.
- Extended deterministic and DOM coverage for the new release-facing behavior.

## v0.76.0 — The Open Folio

- Added a persistent mobile folio rail for jumping directly among the Map, Chronicle, Ledger, and Works, eliminating the long-scroll tax of the stacked phone layout.
- Added a native **Share this reign** action to the footer and Last Leaf; supported devices open their share sheet with the exact replay link, while other browsers retain the clipboard fallback.
- Kept setup focused by hiding the folio rail until a reign begins, and placed it below event letters and manuscript modals in the visual stack.
- Extended real-browser coverage for the native share payload, 390px folio visibility, target sizing, navigation state, and horizontal overflow.

## v0.75.0 — Wax and Witness

- Gave every event letter a sender-derived seal family: Crown gilt, court red, Concord gold, commons green, foreign blue, military iron, or delve violet.
- Enlarged named-character woodcuts and mounted them in colored double-rule frames so recurring figures read as people, not tiny utility icons.
- Added a compact provenance line to each letter, making its political source legible before the player reads the body or choices.
- Kept the new identity layer deterministic and display-only, preserving replay state and simulation behavior.

## v0.74.0 — The Pigment Pass

- Replaced the tan-on-tan page with a deep mineral blue-green ground and brighter vellum surfaces, making the manuscript feel like a physical object on a royal table.
- Restored illuminated-manuscript pigments across the map: lapis water, verdigris woods, iron-brown mountains, terracotta roads, richer rubric, and brighter gilt.
- Color-coded the ledger's resources, purse, powers, whispers, and works panels so the interface gains orientation as well as color.
- Reworked masthead, pace controls, footer links, modal scrims, meters, and gallery lighting around the new palette while preserving contrast in explicit dark mode.

## v0.73.0 — The House's Hand

- Added deterministic House heraldry to the masthead and Last Leaf, derived from the realm seed and House name without consuming simulation RNG.
- Added recognizable pass-gate, delve, and sea-gate landmarks to make generated geography easier to read at a glance.
- Reworked the Last Leaf's title cartouche around the House arms and added a compact summary band for legitimacy, piety, prosperity, treasury, and settlement tiers.
- Extended browser smoke coverage to verify the heraldic canvas, accessible arms description, release fingerprint, and rasterized Last Leaf.

## v0.72.0 — The Living Manuscript foundation

- Rebalanced the presentation around the mounted map and chronicle, with clearer paper layers for the ledger, works, letters, and Last Leaf.
- Setup now shows one focused decision surface; inactive instruments stay hidden until a reign begins.
- Increased decision and build targets, improved mobile safe-area behavior, and added reduced-motion handling.
- Added standards-mode document structure and browser checks for visual hierarchy, overflow, and target sizes.
- Split the visible app version (`APP_VER`) from the replay-schema version (`GAME_VER`), exposing the running build in the footer, metadata, Colophon, and `annals.version()` so stale deployments are immediately identifiable.


All notable changes to The Cold Chair (formerly The Annals). Format follows [Keep a Changelog](https://keepachangelog.com/);
versions are semver-ish with 0.x meaning "playable, evolving fast." Each batch from
`docs/roadmap.md` bumps the minor version and MUST add an entry here before merging.

## [Unreleased]
### Added
- **The Forged Charter (v0.71.0).** The scriptorium no longer only *flatters* the record (the gild) — it can
  **manufacture** it. A new opt-in work, **Forge a Charter** (build verb, once a reign, crown only), sets the
  scriptorium to fabricate a proof; on completion the Crown chooses what to enter into the permanent record:
  an **ancient descent** (arms legitimacy) or a **victory that never was** (sways the court and the wider
  world) — or burns the leaf and enters nothing. A forged claim props up its benefit **now**, and schedules
  its own undoing: 2.5–5 years on, a rival's genealogist or a veteran of the battle that never happened may
  **expose** it, and the claim collapses — with an extra toll for the lie if the Crown brazens it out. Forge
  late enough and the reign may end before the reckoning: you got away with it.
  - **Opt-in and byte-identical when unused, with NO new action letter.** It rides the proven
    `heirhall`→card idiom — a logged `'b'` work plus a `'c'` card answer — so replay, `sanitizeHistory`, the
    Reading-Aloud film and the skip-to-Leaf path need **no new registration** and can't desync; a reign that
    never forges is byte-identical (0/6 harness plans differ) and emits no `forge` key in `state()` or on the
    Leaf. The exposure delay is deterministic (`chFNV`, not an RNG-stream draw), so a forging reign replays
    to the week — verified deterministic through the harness. `tests/forge-check.js` (26 assertions) covers
    the once-a-reign gating, both arms, the exposure-and-collapse, the got-away-with-it guards (reign over /
    flags cleared at succession), the `state()`/Leaf surfacing, and the card wiring.
- **The Saint's Life (v0.70.0).** The monk's narrative **register** now bends with the realm's piety. A
  defining moment (a heavy one) under a **devout** crown (piety ≥ 60, or a fresh act of devotion still warm)
  earns a hagiographic marginal — the hard turn reframed as a trial, not a judgement, with a small sign
  noted; under an **impious** crown (piety < 20) it earns the inverse, a hostile aside from a monk who has
  stopped calling the realm's misfortunes coincidence. A **middling** reign keeps the plain register and
  nothing fires, so the chronicle you already know is unchanged unless the crown lives at an extreme of
  faith. At most one gloss a year, so it reads as texture, not commentary.
  - **Display-only, the ghost idiom.** The gloss is a `<p>` appended straight to the chronicle body, never
    routed through `chron()`/`marg()`, so the `_chron` stream and `state()` are untouched and the harness is
    byte-identical (0/6 plans differ). Deterministic (`chVary`; consumes no RNG). `tests/saint-check.js` (13
    assertions) covers both registers drawn from their pools, the middling silence, the weight gate, the
    once-a-year throttle, `devoutUntil` taking precedence at low piety, and that no gloss reaches `_chron` or
    `state()`.
- **The Cipher in the Margin (v0.69.0).** The two darkest sworn orders — the eldritch **Wood-Congregation**
  and the treasonous **Sworn of the Old Root** — write their creeping marginal notes in a hand you cannot
  read until you have an informant inside (the order reaches `discovery` *named* or *exposed*). Until then
  each creep-line renders in the monk's cipher (atbash — a real medieval hand; the obsessive can crack it by
  candlelight). The moment you place an informant, the order's **past** marginalia are read back to you and
  you count the years its hand had been writing in your own book — a one-time reveal. The **Cleaner Ledger**
  stays in plaintext throughout: corruption is venal, not occult.
  - **Display-only, the Cut-Leaf idiom.** The cipher masks only the rendered `<p>` (the plaintext is held
    off-ledger in `data-plain`); the `_chron` stream keeps every line **verbatim**, so the record is
    recoverable by replay and the harness is byte-identical (0/6 plans differ). Consumes no RNG, moves no sim
    number, and nothing enters `state()`. `chron()` gained an optional order-tag argument threaded only from
    the society creep site; every other `marg()`/`chron()` caller is unchanged. `tests/cipher-check.js` (20
    assertions) covers the atbash round-trip, the ciphered-until-informed render, the plaintext-in-`_chron`
    invariant, the cabal staying plain, the decode-and-reveal, and its idempotence.
- **The Great Deck, wave 1 continued — the Consequences, batch 5 (v0.65.0).** A deliberately **small,
  selective batch — two cards, no filler** (the strongest hooks left; padding to a forced third would have
  reached for weaker ones). Still **byte-identical (28/28), zero rebaseline**:
  - **The Note That Was Burned** — *burn the note naming the Guildmistress's smuggling to the Reach*, and
    the years the Crown spent not reading it she spent building a **shadow-customs on the river** that
    answers the Reach faster than the Crown. Seize the network (belated, costly, but the Reach loses its
    quiet door), turn it (hire the smuggler, treason into intelligence), or **burn this copy too** (look
    away again — the recurring option, a Crown that keeps not-looking).
  - **The Prophet Was Right** — *arrest the barefoot prophet who cried the realm's luck was borrowed*, and
    if the reign's fortunes later sour he is proven right on the record, his following armed with a Crown
    that jailed its warner. Free and honor him (eat the crow, buy back the commons), deny he foretold
    anything, or silence him for good (and make him a martyr — the seed every faith grows from). **Gated so
    it only fires once the realm's luck has actually turned (legitimacy < 45)** — in a thriving reign the
    prophet was simply wrong, and the letter never comes.
  - Pure state checks (no RNG), crown-only, delayed, static `t`/option `s`, append-only.
    `tests/consequences-check.js` §7 (+14, incl. the prophet's luck-gate firing at low legitimacy and
    staying silent in a thriving reign). **Fourteen consequence callbacks now across five batches**, every
    one byte-identical. Full suite 41/41 green; history links stamp v0.65.
- **The Great Deck, wave 1 continued — the Consequences, batch 4 (v0.64.0).** Three more read-backs, this
  time *secular* (the last batch ran church-heavy) — guild, river, and court — still **byte-identical
  (28/28), zero rebaseline**, each armed only by a non-default option:
  - **The League of the Staple** — *seize the wool-staple for the Crown*, and years on the two rival towns
    the seizure taught to hate the Crown more than each other have federated their guilds into one standing
    power. Return the staple and dissolve their reason, charter the league as a guild-parliament under the
    Crown (a partner now, a rival in your old age), or break it by setting the towns against each other again.
  - **The River Remembers** — *break the barge-guilds' strike at pike-point*, and years on the forced
    bargemen have built a silent river-wide combination that holds the water's throat. Grant them a charter
    of rights, break them again (**they go underground and return meaner** — the recurring one), or buy the
    guild-masters and behead it.
  - **The Old Marshal's Table** — *promote a captain over the war-hero's head*, and years on the passed-over
    marshal's grievance has become a court in miniature — the officers you overlooked, the lords who like a
    grievance with their wine. Bring him back to honor, let him dine (a grievance keeps no army — until it
    does), or scatter his circle to the border garrisons (where it finds new rooms).
  - Pure state checks (no RNG), crown-only, delayed, static `t`/option `s`, append-only; each reconciliation
    option carries a real cost (no free lunch). `tests/consequences-check.js` §6 (+18). **Twelve consequence
    callbacks now across four batches, every one byte-identical.** Full suite 41/41 green; links stamp v0.64.
- **The Great Deck, wave 1 continued — the Consequences, batch 3 (v0.63.0).** Three more read-backs, the
  same discipline, still **byte-identical (28/28), zero rebaseline** — each armed only by a non-default
  option, and each a choice about the *church and the refused* coming home to roost:
  - **The Saint Unmade** — *keep the royal saint in a royal shrine and cut the Concord out of the silver*,
    and years on the affronted church assembles its testimony and moves to **un-canonize** her, pulling
    the borrowed holiness the Crown's legitimacy rested on. Buy the sainthood back, defy them and keep a
    saint the church now calls false (a crown that mints its own holiness), or let her fall quietly.
  - **The Church at the Fords** — *leave the hedge-preachers to sort themselves*, and years on the poor-
    church of the fords has grown too large to hang and too loved to ignore. Recognize it as a second
    licensed faith under the Crown, let the Concord crush it (**it grows back from its own graves** — the
    recurring one), or co-opt its preachers with court offices.
  - **The Town the Crown Refused** — *turn the caravan back into the snow*, and years on the four hundred
    have built a free town beyond the pass, the standing address of every debtor and heretic the reign
    has since produced. Treat with it, march the muster up a bad road against the poor you wronged once,
    or open the gate and call the refused home a decade late.
  - Pure state checks (no RNG), crown-only, delayed, static `t`/option `s`, append-only.
    `tests/consequences-check.js` §5 (+19 assertions: arm → fire → resolve for each, every option's flag
    settled, the fords' crush-and-regrow recurrence). Full suite 41/41 green; history links stamp v0.63.
- **The Great Deck, wave 1 continued — the Consequences, batch 2 (v0.62.0).** Three more letters that
  read back an earlier choice, on the exact discipline that kept batch 1 clean — each **armed only by a
  specific non-default option**, so the auto-0 plans never fire them and the deck grows **byte-identical
  (28/28), zero rebaseline**:
  - **The Ward Come Home** — *send a ward north as surety and take none in return*, and years on the
    blood you gave away comes back of age, raised in the rival's court and sent home wearing its manners:
    a gift, or a planted knife. Give them a watched place at court, ransom them fully home and cut the
    tie, or bar the gate — and be the crown that abandoned its own blood twice.
  - **The Tooth Comes Due** — *license the false relic and tax its pilgrims*, and years on the fraud
    collapses with the Crown's stamp on it (a child dies trusting the cure beneath the Crown's toll-house).
    Burn the shrine in daylight, pension the wronged quietly, or double down and declare the tooth a true
    saint by decree — a schism bought to save a toll-house.
  - **The Cup Returns** — *name no poisoner and keep the enemy unnamed*, and the knife the Crown would not
    name comes back, patient or bold. Name them at last (and let the long silence be called patience),
    keep the silence once more and set a truer trap (which **re-arms** the letter — the cup returns
    again), or bluff omniscience. The one recurring callback of the batch.
  - Each is a pure state check (no RNG), crown-only, delayed, static `t`/option `s`, append-only.
    `tests/consequences-check.js` extended (§4, +9 assertions: each arms on its non-default flag, fires
    after its delay, resolves, and the cup recurs then settles). Full suite 41/41 green; history links
    stamp v0.62.
- **Offline — the second file the game admits to (v0.61.0).** The one craft-pass item deferred to keep
  the one-file rule, now shipped by explicit decision: a **service worker** (`sw.js`) so a loaded reign
  keeps working with **no network** — genuinely useful on a phone, a plane, a dead tunnel. The game is
  now *one file plus one worker*; still no build step, no framework, no backend.
  - **Network-first, not cache-first** — an online player always gets the freshest `index.html` (a game
    that ships often must never be trapped behind a stale cache); the worker serves the last good copy
    *only* when the network is gone. The shell is pre-cached on install, so even a first-ever offline
    visit boots. A version-named cache retires cleanly on each bump (`activate` deletes old generations,
    `clients.claim()` takes over). The worker never touches saves or slots — those stay in localStorage,
    a layer it doesn't own.
  - **Registration is guarded** to a secure/localhost context, so `file://` opens and the Node test
    harness (no `navigator.serviceWorker`) skip it silently — no console error, and the sim stays
    **byte-identical (28/28)**. Relative paths (`./`, `sw.js`) mean it works whether the game is served
    from a domain root or a project sub-path. `sw.js` is added to the deploy allowlist and the publish
    runbook's ship-list.
  - `tests/browser-smoke.js` extended (+3: over a real local http server the worker registers and
    activates, then with the network cut via `setOffline` the reloaded page still boots from cache — a
    genuine offline proof, not just a linked manifest). Full suite 41/41 green; history links stamp v0.61.
- **The Craft Pass, part 3 — the Chronicler's Welcome (v0.60.0).** Roadmap §2.6's diegetic onboarding,
  and the last craft piece — **byte-identical (28/28)**, pure shell. The first time a player ever seats a
  reign, the monk who keeps the book turns and says the one thing new crowns miss: *"letters will come to
  you, and how you answer them is the reign — I set it all down. But read my **margins**. The record says
  what happened; the margin says what I saw, and what the record was told to leave out. They are not
  decoration. They are **load-bearing**."* Signed by the reign's own chronicler (Brother So-and-so, drawn
  from the seed).
  - **Diegetic, once, and non-blocking.** It appears in the monk's own column (atop the chronicle), not as
    a tutorial popover over the game — it never covers the letter, the setup card, or the footer. Shown
    from the end of `finishSetup` (live only — replay, the reading-film, and the harness reconstruct via
    `replay()` and never trip it), gated by a first-visit `cold-chair-taught` flag, so it teaches once and
    never returns. Touches no sim state and draws no RNG. `tests/browser-smoke.js` extended (+3: it shows
    on a first reign, is signed by the chronicler, and dismissing it records the teaching). Full suite
    41/41 green; history links stamp v0.60. **This completes roadmap §2.6, the craft pass.**
- **The Craft Pass, part 2 — the Saved Reigns (v0.59.0).** Roadmap §2.6's save slots, built on the iron
  law rather than around it — and, again, **byte-identical (28/28)**: pure shell, the sim untouched. A
  **save slot is just a history-link payload with a name.** From the Colophon, *Save this reign to a
  shelf* captures the live reign (seed + action log + week) under an auto-suggested label (the ruler and
  the regnal year); the shelf lists what you've kept, newest first, each with **Resume** and a delete.
  - **Restore rides the tested path.** Resuming a slot rebuilds the exact `#s=…&h=…` history link and
    reloads — so a slot travels the *same* shared-link boot-replay that the browser-smoke already proves
    reproduces state to the byte. Every slot is therefore also a shareable link, and a snapshot survives
    across seeds, across an ended reign, and across a legacy world's week-0 scars.
  - Kept in this browser under `cold-chair-slots`, bounded to a dozen (the oldest falls off), entirely
    separate from — and complementary to — the existing per-seed autosave (the unnamed "Resume the saved
    reign" default). `tests/browser-smoke.js` extended (+2: saving shelves the reign and renders the
    slot; the slot's hash restores to the identical state on a fresh page). Full suite 41/41 green;
    history links stamp v0.59.
- **The Craft Pass, part 1 — the Colophon (v0.58.0).** Roadmap §2.6, the shell around the game rather
  than a new turn of the sim: **installable, mobile-fit, and self-describing** — and, provably, not one
  byte of the deterministic reign changed (**28/28 plans byte-identical** to v0.57.0; this is pure
  chrome). Three pieces, all guarded so the Node harness and every existing reign are untouched:
  - **The Colophon** — a new modal off the footer (beside the Codex): the making-of (one file, one link,
    a reign as a pure function of seed + log), the running version, the sound-of-the-realm toggle given a
    proper home and a plain-language label, an install affordance, and the credits. Mirrors the existing
    `#codex`/`#help` modal pattern exactly (open / close / backdrop-dismiss).
  - **Installable & standalone, still ONE file.** A `viewport` was *missing entirely* — added, so the
    page finally lays out correctly on a phone instead of zoomed-out — plus `theme-color` (light/dark),
    the apple-web-app tags, and a **runtime-built manifest + crown icon** (base64 data-URIs, assembled in
    an inline `pwa()` IIFE, so there is still nothing extra to host). A phone can add The Cold Chair to
    its home screen and open it full-screen; where the browser offers a native install prompt, the
    Colophon surfaces an Install button (the `beforeinstallprompt` capture). *True offline caching needs
    a service worker — a separate file — and is deliberately left out to keep the one-file rule.*
  - **Sound polish — the vellum-scratch.** A new `Sound.letter()`: a short, dry burst of high-passed
    noise, the pen meeting the page as each letter is set before the Crown. Hooked at `showCard` (the
    live/film display path — silent replay never calls it), guarded exactly like the rest of the module
    (no sound until the ambience is woken, a hard no-op headless), so it reads nothing and writes nothing
    the sim can see.
  - `tests/browser-smoke.js` extended (+5 real-Chromium assertions: the manifest is linked/valid/
    standalone, the icon + favicon + apple-touch-icon links exist, the mobile head tags are present, the
    letter sound is wired, and the Colophon opens/shows the version + toggle/closes). Full suite 41/41
    green; history links stamp v0.58.
- **The Great Deck, wave 2 — the Middle-Book (v0.57.0).** The second slice of roadmap §2.2's authored
  mass, and its deliberate counterweight to wave 1: where the Consequences are the sharp callbacks a
  reign earns, the Middle-Book is **texture for the flattest stretch** — the settled middle years (~7–16)
  when the crises of youth are past and the rot of age not yet come, "the letters of a realm being
  **governed** rather than fought for." Five new letters, each modest and thematic, static `t`/option
  `s`, effects on governance rather than survival:
  - **The Old Steward's Leave** — a servant of three reigns asks to retire, and the whole household
    watches what he is given, because they are all one day going to be him. Pension him richly and
    publicly, send him off modestly (and be marked for the modesty), or refuse the leave and keep his
    resentment with his hands.
  - **The Petition for a Fair** — a grown river-town asks a charter for a great fair. Grant it freely
    (trade thickens, and a chartered town learns it can ask), grant it for a standing cut of the tolls,
    or refuse — trade taxed on the road is trade the Crown can count.
  - **The Boundary Stone** — two villages at the edge of blood over a water-meadow, brought to the Cold
    Chair rather than to knives. Send a surveyor to rule by measure, split it down the middle and be
    hated equally, or rule for the village whose tax-tallies please the Crown best.
  - **The Overflowing Loft** — a good year past all reason, granaries full past their doors. Store it
    against the lean years, sell the surplus down the river while the price holds, or keep the feast of
    a lifetime.
  - **The Matter of the Road** — the great road gone to ruin in the settled middle, when no war paid to
    keep it. Mend it at the Crown's cost, levy the towns to mend their own stretches, or leave the mud
    as a toll of its own kind.
  - **The one approved rebaseline of the batch.** Unlike the Consequences (armed only by non-default
    options, so byte-identical), these join the **shared ambient roll** in the mid-reign window
    (wk 364–832) — they take **no new draw** (the existing ambient pick simply has more to choose from),
    but the pick *shifts*, so auto-0 plans' middle years now read differently. This is the first
    content repin since v0.48.0, and it was the approved cost. All 28 plans rebaselined; the diffs are
    verified to be **only the new cards and their downstream ripple** (no NaN/anomaly), and the reshuffle
    was absorbed by re-pinning three tests to the new stream rather than weakening what they prove:
    `assassination-check` §2/§3/§6 re-pinned to seed **1043** (a natural marshal strike at wk724 with a
    full-year tell, found by a fast seed-sweep of the new deck — the foreshadow→strike arc is still
    tested emergently, not driven); `pilgrim-check` **B7** re-proven in a **lockstep A/B** (the same
    reign forked, the afterglow armed in one branch only, advanced through the identical card stream so
    the +8 ceiling lift is isolated from ambient-card luck — the old max-comparison proxy was dominated
    by whichever piety-boon card each divergent reign happened to draw); `pilgrim-check` **A3** re-pinned
    to prove *no piety death spiral* (the neglect reign survives to year ~48 and is finally lost to an
    unrelated pretender, not a collapse). The five ids are in `NOBLE_EXCLUDE` (a climbing knight never
    sees them). Full suite **41/41 green**; history links stamp v0.57.
- **The Great Deck, wave 1 — the Consequences (v0.56.0).** The first slice of roadmap §2.2's authored
  mass, and the KoDP lesson: letters that **read back an earlier choice**, so a reign's past comes for
  it. Three new callbacks, each **armed only by a specific non-default option** — so the auto-0 plans
  (which answer every letter with option 0) never arm them, and the deck grows with **zero rebaseline
  (0/28)**, the discipline held instead of a repin:
  - **The Rainy Reign** — *deny* the old king's bastard and drive him out, and ~five years on, if the
    reign has gone shaky (legitimacy < 50), he lands under the rival's banner and his own. Buy him off
    dearer, meet him in the field (a pure muster mirror — a strong crown breaks him, a weak one loses
    ground), or acknowledge him too late to be grace.
  - **The Door That Was Sealed** — *seal* the Delve's deep folk in, and ~four years on the knocking
    starts from the wrong side of the seal. Pour it deeper, crack the door and treat (the silver
    returns, and so do the raids), or wall off the whole west and let the map lose a colour.
  - **The Torn Note's Heir** — *repudiate* a called debt, and ~four years on the shamed lender's heir
    returns, having quietly cornered every other note the Crown ever signed. Buy back your word, face
    him down (and teach the coast the Crown's word defaults twice — pay-in-advance follows), or hire
    the grudge as the treasury's own cold mind.
  - Each fires as a pure state check (no RNG), so a shared link that armed one replays it; each is a
    once-per-reign, delayed, crown-only callback. `tests/consequences-check.js` (13 assertions: each
    arms/fires/resolves, the gating that keeps the plans byte-identical, the delay + seen-guard, and
    the bastard's muster mirror). Full suite 41/41 green; history links stamp v0.56.
- **The Legacy Realm — a world that keeps its scars (v0.55.0).** Roadmap §2.4, the marquee mechanical
  v2 item and the boardgame lesson made digital. An opt-in **"Found a Legacy Realm"** at the setup
  route: this world *remembers*. A per-seed world-file (localStorage) persists across dynasties — the
  towns it has burned stay burned, and it tallies its dynasties and the wyrms slain in it — so each new
  founding inherits the map's scars, and every reign adds to them.
  - **The iron law held, by design.** The world's memory is applied at founding AND written into the
    action log as a **week-0 `[0,'L',data]` setup action** — the exact idiom of the chair (`'d'`) and
    mode (`'m'`). So a legacy reign stays a pure function of (seed, log): replay reproduces the scars
    **from the log alone** (verified with an empty world-file), a shared link carries them, and — because
    no canonical reign or plan carries an `'L'` — **every ordinary fresh-seed game is byte-identical
    (0/28).** The scars persist across succession (the whole dynasty is a legacy world); the world-file
    accumulates only at a reign's end (live only — replay/film/harness never write).
  - **Sealed envelopes**: thresholds a world crosses, surfaced as its standing — *the Wyrmmoot* (three
    wyrms slain in one world), *the Chronicle of Ages* (five dynasties held it), *the Burned Marches*
    (three towns scorched across the reigns). Shown at the setup route, in the opening chronicle, in
    `state().legacy`, and in a new **"The World"** section of the Codex.
  - `tests/legacy-check.js` (22 assertions: the world-file lifecycle, founding applies the scars while
    an ordinary founding ignores the file, the `'L'` action replaying the scars with no world-file
    present, end-of-reign accumulation, the sealed-envelope thresholds, gated exposure); browser smoke
    grown to 27 (the route founds a scarred 5th-dynasty world with its `'L'` action and sealed
    envelopes). Full suite 40/40 green; history links stamp v0.55.
- **The Codex — the realm's history, made browsable (v0.54.0).** Roadmap §2.5's other half: the
  v0.38.0 Concordance (a static back-of-leaf index) grown into a **live modal** you open any time with
  a "The Codex" button. It gathers, in browsable sections: **The House** (every crown already closed
  plus the reigning one — each with its born/earned character, verdict, years, ending, and wyrms — and
  the House's epithet, legacies, and renown); **The Realm** (the Concordance's persons, places, houses,
  societies, and grievances, each with the years it surfaces); **The Wyrms** (slain this reign, one
  circling, and the whole line's tally); and **The Reign** (its defining moments, told in the order
  they happened). A pure read of already-committed state — no RNG, no new `S` field, no `state()` key,
  never in the chronicle stream — so it adds **zero sim surface** (byte-identity 0/28). `annals.codex()`
  exposes the same structure to agents. `tests/codex-check.js` (15 assertions: the House across a
  multi-crown dynasty, the realm/wyrms/moments, purity + no-state-leak, and the escaped modal render);
  browser smoke grown to 24 (the Codex opens, lists the House and the Realm, and closes). Full suite
  39/39 green; history links stamp v0.54.
- **The Reading Aloud — the reign told back as a film (v0.53.0).** Roadmap §2.5, and "the most
  shareable single link the game can emit." A **`&read=1`** link no longer restores a reign silently
  (that's `replay()`) — it re-runs it **forward at reading pace with the rendering on**: the map
  re-inks, the chronicle fills line by line, each letter is held up long enough to read and then
  answered from the log, and the reign closes on its Last Leaf. It is the same deterministic reign the
  log encodes, simply *watched*. Entirely display-only: a film neither re-logs nor saves (the
  `S.reading` guards on `logAction`/`saveGame`/`toast`), keeps the true log intact so the closing Leaf
  can still share, and is entered ONLY by a boot-time link — so every ordinary reign and the harness
  are wholly untouched (byte-identity 0/28).
  - **How it plays**: `startReading()` applies the world/chair/mode setup (via `finishSetup`, shown
    not re-logged) then hands off to the `frame()` loop, which advances **one week per step** (never
    the multi-tick catch-up, so no action-week is skipped and the film matches the reign) while
    `filmDrive()` applies each due log action at its week and answers each letter from the log after a
    read-beat — the paced twin of `replay()`'s loop. Multi-reign logs play their successions and
    interregnum letters too.
  - **The film bar**: *pause / resume*, *To the Leaf ⇥* (fast-forwards the rest and opens the book),
    and *Play it yourself* (sit the same world from the top). A **"Read the reign aloud"** button on
    the Last Leaf mints the shareable `&read=1` link.
  - `tests/reading-check.js` (10 headless assertions: the link format, `startReading`'s setup parse +
    true-log preservation, the no-re-log/no-save guards) and `tests/reading-smoke.js` (9 real-browser
    assertions: the film bar, the reign playing forward on its own, the chronicle filling,
    pause/resume, skip-to-the-Leaf, and reaching the reign the log was told from). Full suite 38/38
    green; history links stamp v0.53.
- **Ruler Traits — a character sheet for the crown (v0.52.0).** The first slice of roadmap §2.2
  (ruler character), and the piece that makes each ruler in the dynasty *legible*. Every ruler now
  wears two epithets — a **born temperament** (from the heir's schooling, or a seed-fixed draw for the
  founder) and an **earned style** (read from the reign's own choices and marks) — e.g. *the Martial,
  grown Bold*. Entirely display-only: both are pure derivations of (seed, `S._dynastyN`, the action
  log, end-state), never stored in `S`, never in `state()`, never in the chronicle stream — so, like
  the reign card and the dynasty ledger, they add **zero sim surface** (byte-identity 0/28).
  - **Born**: a schooled heir wears its schooling (*the Martial / Pious / Lettered / Subtle*, from
    v0.42.0's tutors); an unschooled crown draws a stable temperament fixed by seed and dynasty
    ordinal (*the Even-Handed, the Hot-Blooded, the Cold-Eyed…*).
  - **Earned**: `reignBoldness()` reads how often the crown reached past the prudent first option;
    strong marks of a reign speak over it — two towns sacked → *the Iron-Handed*, high piety → *the
    Devout*, a wyrm slain → *the Wyrm-Tried*, a beloved commons/court → *the People's Own / the
    Courtly* — otherwise *the Bold / Measured / Cautious*. Null until the reign has answered enough
    letters to have a character at all.
  - Surfaced in the **masthead** (the crown wears its style beside the date), the **Last Leaf** (a
    subtitle under the title), and stored on each **dynasty ledger** entry at succession — so the
    House remembers not just how each crown ended but who each one *was*.
  - `tests/traits-check.js` (19 assertions: born stability + schooling override + ordinal advance,
    the earned classifier across boldness and every mark, the combined style, purity/no-state-leak,
    and the ledger recording each crown's character). Browser smoke grown to 21 (the masthead shows
    the ruler's temperament). Full suite 36/36 green; history links stamp v0.52.
- **House Legacies — the dynasty ledger starts paying out (v0.51.0).** The second half of roadmap
  §2.1, and the CK3 lesson made deterministic. The ledger of closed reigns (`S._dynasty`) stops
  merely remembering and starts *earning*. Zero sim surface — byte-identity verified at 0/28 plans
  differing (every legacy effect is gated on `hasLegacy(id)`, and no plan reaches an interregnum, so
  `S._legacies` is always empty in the suite and every gate is false).
  - **Renown** is pure arithmetic on the ledger — never a stored balance, always re-derived: an
    endured reign is worth 2, any tenure 1, each wyrm slain +1, a legendary verdict (Wyrmsbane,
    Dragonlord, Reunifier, Oathkeeper, Unshaken, Wyrmmother) +2. Available renown = earned − committed.
  - **Legacies** are permanent, capped tilts (**pick 2 of 4**), chosen in the interregnum's new last
    beat (*The House's Inheritance*) — the natural home now that the succession is playable. *the Old
    Blood* (cost 4): every heir seats at +8 legitimacy. *the Long Ledger* (5): the creditors' grace
    before a debt is called is doubled (52→104 weeks). *the Iron Table* (5): a councillor's grudge
    cools a point each year, so betrayals ripen slower. *Wyrm-Wise* (6): the hoard draws the wyrm
    later (the draw is pushed back *after* the RNG roll, so the stream is unperturbed). One legacy is
    offered at a time — the highest-priority affordable one not yet held — so a House grows into its
    identity over several reigns. Legacies **outlive the crowns that bought them** (a House fact,
    never reset at succession) and are told on the Last Leaf's dynasty legend ("*The blood carries
    the Old Blood and the Long Ledger*").
  - `tests/legacies-check.js` (29 assertions: renown arithmetic, the one-at-a-time/priority/2-cap
    offer, the interregnum beat + take/hold, each of the four tilts in isolation, gated exposure +
    persistence across succession, determinism). Full suite 35/35 green; history links stamp v0.51.
  - Also (from an Opus review of v0.50.0): the interregnum's grey-week gap now **slides pending
    scheduled callbacks along with it** (`S.schedule` weeks rebased by the gap), so a reign's queued
    letters aren't bunched onto the heir's first week.
- **The Interregnum — the gap between reigns, made playable (v0.50.0).** The v2 roadmap's dynasty
  centrepiece. "Play again" becomes "continue the House": the
  succession the player never played is now a short 2–3 letter scene, shaped by how the last reign
  ended. Zero sim surface — byte-identity verified at 0/28 plans differing (no plan uses an `'h'`
  succession action, so the whole feature rebaselines nothing).
  - **The split.** `continueAsHeir` is now the *launcher* — it logs the succession, closes the reign
    into the House's ledger, names the heir — then (crown mode) hands off to an interregnum scene;
    the scene's last letter calls the new `seatHeir`, which is the old reset-and-open body verbatim.
    Every scene letter is an ordinary CARD answered by an ordinary `'c'` log entry, so replay is
    unchanged; the scene runs on card-to-card chaining and always seats a heir at its end.
  - **Endured → the Quiet Passage.** The safe, short one: the late will is read (a bequest of the
    treasury's tenth to the Concord, the muster, or the League — each a real, inheritable tilt), and
    once the line has a history, the heir chooses **the name the House leads with** (any past crown's
    epithet, or the House's plain name — display-only, on the Last Leaf's legend).
  - **Deposed / usurped / conquest → the Contested Return.** The heir returns *against* a seated
    power. Gather backers — and the promise **mints a standing obligation** through the v0.48.0
    `S.owed` machinery (the League's loan, the coast's credit, or the Reach's swords): *every
    restoration is mortgaged, and the debt outlives the crowning*. Then the return resolves on a
    muster mirror (the `resolvePretenderWar` idiom, pure state). A **failed return still seats the
    heir** — a crown worn low — and thickens a `restorationDebt` counter that thins the next return;
    a return made good clears it.
  - **Skippable by design.** The first letter of every scene offers "seat the heir at once" — a
    rushed, unbacked crowning is a doubted one (legitimacy −4, more if contested).
  - `tests/interregnum-check.js` (27 assertions: the Quiet Passage + skip, the House epithet on a
    second succession, the Contested Return's obligation mint, a forced failed return that thickens
    the ledger, purity of (seed, choices), and a full `'h'`+scene log that replays byte-identically
    every time — the shared-link guarantee). Browser smoke grown to 18 (a real endured succession
    opens the Quiet Passage in the DOM and a real click seats the heir). Full suite 34/34 green;
    history links now stamp v0.50.
- **The Twist Calendar + the vellum card (v0.49.1).** The Daily Chair's garnish, closing out
  roadmap §2.3. Still zero sim surface — byte-identity re-verified at 0/28 plans differing.
  - **The Twist Calendar.** A pure rite of the date (`dailyTwist(dateStr)` — no wall clock, no RNG),
    so every table reads the same calendar: **Mondays the realm offers only the Iron Chair** (the
    chair step shows one option; the chair is still an ordinary logged setup action, so replay is
    untouched), and **four feast days set an Ill-Made predicament in the daily's place** — Lady Day
    (Mar 25, when debts come due) seats *The Debtor's Crown*, Midsummer (Jun 21) *The Wyrm in the
    Counting-House*, Michaelmas (Sep 29) *The Delve Runs Deep*, Midwinter (Dec 21) *The Iron Chair,
    Cold*. A feast on a Monday is kept as the feast. A feast daily's reign card wears its feast in
    the header and closes with the **predicament link** (seed + the canned brink) instead of the
    bare seed — the reader must sit the same trouble, not a calm week one.
  - **The reign card as a small PNG.** `composeReignCardPNG()` sets the same five lines on vellum —
    an offscreen canvas at 2×, the Last Leaf's palette and rules, height following the card's
    lines — and **"Save the reign card (PNG)"** joins the end-of-reign actions (downloads
    `reign-card-day-<date>.png` / `reign-card-seed-<seed>.png`).
  - `beginScenario` refactored around a shared `scenarioHash(sc)` (used by the shelf, the feast
    router, and the feast card's link). `tests/daily-check.js` grown to 27 assertions (twist
    purity across fixed dates, feast→scenario mapping, feast-beats-Monday, daily routing, feast
    card header/link, PNG geometry); browser smoke grown to 16 (real-canvas PNG rasterizes;
    a real Monday-daily page offers only the Iron Chair and the `&d=` marker survives the boot
    rewrite). Full suite 33/33 green.
- **The Daily Chair + the Reign Card (v0.49.0).** The growth engine from the v2 roadmap (§2.3),
  shipped first as planned. Zero sim surface — byte-identity verified at 0/28 plans differing.
  - **The Daily Chair.** One world for everyone, every UTC day: the daily seed is a pure hash of the
    date (`dailySeed('2026-07-13')` is the same 7-digit seed on every table on earth — a daily is
    just a seed, so history links, replays, and the harness all work on it unchanged). The setup
    route offers **"Sit the Day's Chair"** beside the ordinary crown; the link carries `&d=<date>`
    so the page knows the reign is a daily. A localStorage ledger (`cold-chair-daily`) records each
    day's result **once, at the reign's end** — the first telling stands; replays don't overwrite
    it — and a **streak** (consecutive days counted back from today) shows on the setup card.
  - **The Reign Card.** The pasteable five-line share block, set like the monk wrote it: headed by
    the seed (or *the Day's Chair* and the date, with the streak), the verdict line with the ending,
    the chair's weight (an IRON reign says so), the years; then the reign's three heaviest deeds as
    margin strokes; and it ends with **the seed-only link** — *sit this world yourself* — the world,
    not the full log, so the reader plays it fresh. A **"Copy the reign card"** button joins the
    end-of-reign actions.
  - **A real bug found and fixed on the way:** the hash-canonicalizing rewrite
    (`location.hash='s='+SEED`) silently dropped any extra params — `&d=` never survived boot. The
    `DAILY` const is now hoisted beside `SEED` and the rewrite preserves it.
  - `tests/daily-check.js` (15 assertions: seed stability per date, streak arithmetic across a gap,
    record-once semantics + ordinary-seed no-op, card composition incl. daily branding, iron weight,
    and the seed-only link). Full suite 33/33 green; history links now stamp v0.49.
- **The Rebaseline Batch — the Vow, the Creditors, and the feud's neglect (v0.48.0).** The one
  deliberate, approved repin of the plan artifacts (the first since the Delve): three systems that
  touch every reign, shipped together so the suite repins once.
  - **The Vow at the Crowning.** At reign-week 16 of every crown coronation (each heir anew), Mother
    Senna asks the crown to bind itself: *no toll shall rise* · *the granaries shall not stand empty* ·
    *the Flame shall be fed* — or decline, and be remembered declining. Watched weekly, pure state:
    broken in public the week it breaks (legitimacy −5, a grievance); held ten years and to the end it
    names the reign **the Oathkeeper**.
  - **The Crown's Creditors.** Leverage turned around: take the League's loan, the coast's credit, or
    buy the Reach's peace, and they mint a standing obligation over you (`S.owed`, the mirror of
    `S.leverage`). After a year's grace the ledger walks **at the worst moment** — the League when
    you're pinned, the coast when it smells insolvency, the Reach as its muster gathers — with three
    answers: pay ×1.5 in daylight, concede the standing term, or repudiate before the estates and let
    every lender reprice the Crown's word. **Debts outlive the crown that signed them** (succession
    keeps them; the vow dies with its ruler).
  - **The feud's neglect has teeth now.** A feud tolerated to *blood* unjudged costs the court and the
    commons every season until the assize sits.
  - **The repin, documented:** all 28 plans deterministic with 0 anomalies (hooks-badspend keeps its 1
    intentional anomaly); `pretender-war.json` re-tuned (explicit vow-decline) to keep demonstrating
    the `usurped` end; scenario logs regenerated under the new sim; pilgrim-check B7 repinned from the
    p75 proxy to the literal ceiling (max), which survives the reshuffle cleanly.
    `tests/vow-creditors-check.js` (20 assertions).
- **The Council in Session — the seats counsel, and remember being ignored (v0.46.0).** On a letter in
  a seat's domain the holder no longer merely remarks (the v0.15.0 aside) — he **counsels a course**:
  a bold temperament (an aggressive Marshal, an openhanded Treasurer, a keen Spymaster) counsels the
  second option, every other temperament the prudent first. Pure trait bias, zero RNG. The counselled
  option wears the seat's star on the letter, the aside quotes the counsel, and `annals.choices()`
  carries `{counsel:{seat,option}}` for agent players (absent on uncounseled letters). **Heeding a bold
  counsel soothes the seat** (grudge eased); **overruling counsel for anything OTHER than prudence** is
  the insult — every third such overrule earns the seat a grudge through the machinery the
  assassinations already run on. Choosing the prudent first option offends no one — so every auto-0
  sweep and every existing plan is sim-byte-identical (the only diff anywhere: two ascended-noble
  plans' final `pendingLetter` JSON gains the additive counsel field; state and decisions identical).
- **The Hard Winter — the Iron Chair's winters mean it (v0.47.0).** Exactly as the roadmap prescribed
  once a non-default chair existed: a **seed-fixed winter-severity track** (a pure hash of seed + year;
  no RNG stream, no state) — mild · keen · hard · **wolf-winter** — drains the granaries through the
  cold months on the **Iron Chair only** (10/25/45 grain a week; a wolf-winter thins even the muster),
  with the season named in the chronicle at onset when it's hard or worse. Granaries and tithe-barns
  finally earn their keep against an external, fair rhythm. Cold and Kind reigns are byte-identical to
  the letter; the Iron Chair is its own baseline (`iron-chair.json` re-baselined by design — it still
  endures, now touching empty granaries on the way). `tests/session-winter-check.js` (13 assertions
  across both releases).
- **The Feud — the great houses hate each other now (v0.45.0).** A seed-fixed pair of the Ashen
  Table's houses carries a quarrel that ripens on the calendar: dormant → cold courtesies → **at law**
  → burned barns → **blood**, a stage every ~18 months from a seed-fixed start. `feudStage()` is a
  **pure function of seed and week** — no stored state, no RNG, nothing written — so an un-engaged
  reign is byte-identical to the letter; the quarrel surfaces render-only (map marginalia at burned
  barns; the assize button's own requirement line). The Crown's one door in is **the King's Assize**
  (the build verb, opt-in, available once the feud reaches the law): summon both houses and judge —
  for the elder claim, the younger, a split, or a dismissal that lets the barns pay. **The loser
  remembers**: every councillor of the losing house takes a grudge through the same machinery that
  feeds the assassinations — the feud is the second axis that isn't about you, until you put the
  Crown's seal on one side of it. A judged feud sleeps ~5 years and stirs again; the Last Leaf notes a
  judgment; `state()` names the feud only once engaged. `tests/feud-check.js` (26 assertions),
  `tests/plans/feud-assize.json`. 0/27 plans differ.
- **The Second Reading — self-competition no other engine can copy (v0.44.0).** Every reign's end now
  sets its telling down (the two dozen heaviest defining moments, in week order, with the verdict —
  localStorage, keyed by seed). A **fresh reign of the same seed** then reads itself against the last:
  as the living weeks pass the old telling's moments, faded ghost-lines appear in the book — *"⸿ In the
  last telling of these years (39th yr): the wyrm came to the high pastures."* You watch your own
  previous history run silently underneath the new one, and diverge from it. Display-only by the
  Cut-Leaf idiom: ghosts are page elements only — never pushed to the `_chron` record stream, never
  named in `state()`, suppressed during replay (a replayed link re-inks the record, nothing else), and
  absent wherever localStorage is stubbed, so **every harness run is byte-identical by construction**
  (0/27 plans differ). `tests/second-reading-check.js` (14 assertions).
- **Ill-Made Crowns — the scenario shelf (v0.43.0).** A new door on the setup screen: *take up an
  ill-made crown* — a curated predicament with a stated goal, arriving at the brink with the annals up
  to that week already written. A scenario is a seed + a canned action-log prefix in the **exact
  history-link format**, so beginning one IS following a history link: replay determinism, sharing, the
  Last Leaf, and the chronicle all work unchanged, and the engine is untouched. Every predicament was
  generated by playing the sim itself to the brink (replay-equivalent semantics), so each is reachable,
  legal, and byte-stable. Four on the shelf:
  - **The Debtor's Crown** (year ~8) — eight years of wolf-taxes; the League at disposition 8 and
    counting barges; endure to the fiftieth year.
  - **The Wyrm in the Counting-House** (year ~11) — an 18,000-gold hoard, opulence 4, cattle already
    dying in the high pastures; keep the hoard AND the realm.
  - **The Delve Runs Deep** (year ~9) — the deep vein opened against the warning, then deepened; silver
    by the wain-load and goblins every few seasons; hold it, or learn what the grandfathers walled in.
  - **The Iron Chair, Cold** (week 0) — the hardest weight from the first week.
  `tests/scenario-check.js` (21 assertions: each brink verified, double-replay byte-identical).
### Changed
- **The Daily Chair is now the Week's Chair — one shared world per ISO week, not per day (v0.68.0).** A
  reign is 20–40 minutes; a daily obligation at that length is a three-minute game (Wordle) stretched to a
  Sunday-crossword sitting, and the long-form dailies that actually retain — the Sunday crossword, the
  weekly puzzle — pair the long session with a *weekly* slot, not a daily one (issue #15). So the shared
  seed is now keyed to the ISO **week** (its Monday, UTC): everyone at every table sits the same world all
  week, and the streak counts consecutive **weeks**. The viral mechanism is untouched — "it's one puzzle,
  and everybody is solving it" is orthogonal to cadence — so the Reign Card, the streak, and the shareable
  link all port whole; the shelf now reads *"Sit the Week's Chair — week of …"*.
  - **The week key is canonical.** The `d=` marker is folded to its ISO-week Monday on read, so Monday
    through Sunday collapse to one world, one ledger entry, one streak tick, however the marker was written
    (a Sunday belongs to the week just gone).
  - **The twist calendar re-cadences with it.** A week that *contains* one of the four feast days wears
    that feast — Lady Day, Midsummer, Michaelmas, Midwinter each stand their Ill-Made predicament in the
    Week's-Chair place for the whole of that week. The old "every Monday is the Iron Chair" texture retires
    with the daily cadence; Midwinter (kept on the Iron Chair) carries the iron into the weekly calendar.
  - **Zero sim change.** The week's seed is still just a seed; the ledger and streak still live in
    localStorage (under `cold-chair-weekly`); nothing here touches the simulation, `GAME_VER` is unmoved,
    and the harness (no `d=` marker) never enters any of it. `tests/weekly-check.js` (28 assertions,
    renamed from `daily-check.js`) covers the week-key canonicalization, the weekly streak, the feast-week
    twist worn Monday-through-Sunday, and that a feast week links its predicament rather than the calm seed.
- **Visual Phase 2 — the map earns the space it takes (v0.67.0).** Measured before touching anything: an
  8×6 ink-density grid of the terrain canvas, the cartographer's double frame excluded, found **17 of 48
  cells at exactly 0% ink** and twenty at or under 1% — the whole right-centre and lower-right — against a
  sea band that was the only part of the drawing carrying its weight.
  - **A crop is the wrong tool, and the measurement says so.** The roadmap item asks to "crop/zoom the map
    to the realm's actual bounds", but the ink bbox already runs [16,16]–[923,602]: **margins of L0 T0 R1
    B2.** There is no margin to reclaim. The emptiness is *interior*, and interior emptiness wants drawing,
    not framing.
  - **So the open ground gets drawn.** Low hills with hachures, tufts of scrub, and downland stipple — the
    marks a period cartographer put on open country — at a lighter weight than any real feature, and only
    where nothing else already speaks (clear of the sea and its shore, the river's banks, the wood, the
    ranges, and far enough from a town to leave room for its name). A **coarse region hash gates whole
    tracts** before any individual mark is placed, so some country is hill, some is scrub, and some stays
    genuinely bare: filling every gap evenly would have swapped one criticism for another, since an even
    scatter is exactly how 116 identical carets came to read as clip-art tiling. Result: **1 bare cell, and
    ink coverage 8.2% → 10.6%,** with the sea band untouched.
  - **Every sea, not just the southern one.** `W.coastY` knows only the southern coast, so the first draft
    tufted a **coastal** realm's eastern water and an **island** realm's entire surrounding ocean with
    scrub. The land test is now shape-aware. Verified across all four realm shapes — valley, pass, coastal,
    island — by sampling every water pixel for land-ink colours: **under 0.16% in each, which is the
    pre-existing coastline stroke and sea-monster ink, not downland.**
  - **Glyph variety, hash-derived.** Mountains draw three shapes — a single peak, a saddled twin, a
    shouldered ridge — with per-peak scale, baseline and apex-lean jitter, so a range reads as drawn rather
    than tiled. The wood gets three crown shapes (round, lobed, conifer) instead of one circle repeated,
    which is what made it read as a green smudge.
  - **Ink contrast** up a notch on the land: peaks and map names to `#3A3327`, tree strokes to `#47593E`
    with a stronger fill. `vision.md` reserves rubric red for blood and war and gilt for the crown's things,
    so the map's ordinary state carries its weight in **ink density**, not colour.
  - **A label-collision pass.** Names used to be nailed to fixed offsets — every town at exactly
    `(t.x+9, t.y+3)` — so "Vael Braycrossing" sat on its own glyph and names ran into the baked map labels.
    Each name now tries its conventional spot first and yields, in a fixed order, to left, above and below.
    A coarse occupancy bitmap of the ranges and the wood keeps names off the *drawing* too, at O(1) per
    candidate rather than measuring against 116 mountains every frame. Where a range name has nowhere clear
    to go — "the Thornhelm Reach" **is** the north-east range, and every candidate lands on peaks — it keeps
    its placement and takes a soft vellum halo, because moving a name off the thing it names is worse
    cartography than a halo. **Zero overlapping label pairs, all 12 names placed.**
  - **Zero-rebaseline, which mattered more here than anywhere.** `paintTerrain` already consumes `rDetail`
    for the vellum mottling and the road curves, so a single added RNG draw would shift every later
    mood-draw and break byte-identical replay of every saved reign and history link. **Every new mark is a
    pure hash of its own position** — the trick `stampScorch` and the chronicle's variety pools already use.
    Harness output byte-identical across seeds 3030830 / 7777 / 4655760 / 1043 at both `--auto=0` and
    `--auto=1`; new `tests/map-legibility-check.js` (13 assertions) also proves it from the other side — the
    same seed renders a **pixel-identical** map twice, and a different seed still renders a different one.
    It fails 8 assertions on the pre-fix build. Suite 44/44 green.
- **Visual Phase 1 — the first screen shows the realm, not a catalogue (v0.66.0).** Measured at 1440×900
  immediately after starting a reign: `maybeWelcome()` centred a note that sat *below* `#cols` — below
  thirty-odd build buttons — so the page jumped to **scrollY 1002** and the map went to **y=−903, 0%
  visible**. A new player's first full screen was a wall of greyed works with requirement text ("needs a
  city & guildhall", "a pass wonder — needs a city, walls & a bulwark"), the chronicle at y=1526, and the
  Chronicler's Welcome buried *underneath* the grid — very likely why the onboarding wasn't landing. All four
  parts of this are CSS, DOM order and render-layer; no canvas, no art, no sim surface.
  - **The column reads map → the monk's word → chronicle → works.** The map is the hero and the chronicle
    is the soul; the purse and the works are instruments, and instruments go on the workbench, not the
    altar. `#welcome` and `#chron` moved inside `#mapcol`, above the works.
  - **Progressive disclosure on the works.** A work whose requirement is unmet is a reference document, not
    a decision surface — **16 of the 37** now fold behind a quiet *"…and 16 works you have not yet earned"*,
    and nothing on the board carries requirement text any more (15 did). A work you have earned but cannot
    yet afford *stays* on the board, because choosing what to save for is play.
  - **The Welcome no longer drags the realm off screen.** `scrollIntoView` is `block:'nearest'` rather than
    `'center'`, so it scrolls only if it must — and sitting under the map, it never must. **scrollY 0, map
    100% visible, note 100% visible.** All three used to be impossible at once.
  - **No dead dashes at setup.** The ledger and purse rendered six em-dash placeholders — `– gold`, `–`,
    `–`, `–` — in the most prominent panel on the page, before there was any realm to account for; the
    first thing a new player saw, and it read as broken. Both panels now wait for a reign. The state flag
    rides `#cols`, **not `document.body`**: every headless test stubs `document` with
    `getElementById`/`createElement` only, so `document.body` is undefined there and the first draft
    crashed 39 of 42 suites on the spot.
  - **The result, unscrolled, welcome dismissed:** map **100%** visible at both 1440×900 and 390×844, works
    **0%** and **13%** (from 60% and 90%), chronicle **54%** and **100%** — 3 of 6 and **6 of 6** chronicle
    lines fully readable where the count was 0. Page height 1902px → 1665px.
  - **Zero-rebaseline:** harness output byte-identical across seeds 3030830 / 7777 / 4655760 at both
    `--auto=0` and `--auto=1`. New `tests/visual-hierarchy-check.js` (36 assertions across two viewports)
    asserts the DOM order, that the Welcome costs no scroll, that the works sit below the fold, that the
    fold names its own count and **loses nothing** — expanding it restores all 37 — and that no em-dash is
    ever visible to a player. It fails 23 assertions on the pre-fix build. Suite 43/43 green.
### Fixed
- **The Year's Rubric now titles the final year on the page too (v0.68.1).** A reign's year headings earn
  an illuminated name in hindsight from the year's heaviest moment — but `relabelYear()` fired only when the
  *next* year opened, so a reign's **last** year never got its name in the chronicle panel (only the Last
  Leaf's table of contents carried it). `endGame()` now titles the final year as the reign closes. Purely
  display-only — it repaints one already-registered header element; the `_chron` stream and `state()` are
  untouched (0/6 harness plans differ), and `tests/chronicle-bundle-check.js` gains an assertion that the
  final year is titled at reign end.
- **The release packager is one script again, with three scans and a test (v0.65.1).** There were two
  packagers, and they disagreed about which files were internal — so whichever one an operator reached
  for, the other's answer was the one they didn't get, and only one of them carried the residue scan.
  There is now a single script. It reads **every file** in the assembled package rather than a glob of
  `*.md`, runs all three of its scans **before** any commit exists so a failure can never leave one
  behind, and its in-place edits went through a temp file instead of `sed -i` — which on BSD sed silently
  takes its next argument as a backup suffix, so the substitution runs as a basic regex, matches nothing,
  and still exits 0. Its text rewrites are pattern-general now, so an entry keeps its sentence and loses
  only its internal citation, where the old script deleted the line whole.
  - **The packager has a test.** `tests/publish-check.js` (26 assertions) runs the real script into a
    temp directory on every suite run: the file list must be exactly the allowlist, nothing internal may
    survive in any file, and `game.js` regenerated from the *packaged* `index.html` must still pass
    `node --check` — the package has to be a working game, not merely a clean one. And the assertion that
    makes the others mean something: a **planted-leak negative control**, four throwaway source trees
    with one poisoned file each, every one of which must fail the run and leave no repository behind. A
    scan nobody has watched fail is a scan nobody knows works. Zero player-facing change.
- **Two tests were written so they could not fail, and the UI suite was blind to occlusion (v0.65.2).**
  The suite's mobile pass runs at exactly 390×844 — the viewport where four of five setup options were dead
  — and it was green, for two compounding reasons. It clicked `/The Crown/`, **option 0, the only option
  that worked**, and never touched options 1–4. And `locator.click()` auto-scrolls and force-dispatches, so
  it reaches elements a finger cannot: it would have passed on the broken build even if it had clicked them.
  A suite that only ever uses `.click()` cannot see occlusion, ever.
  - **The smoke now has a tripwire.** Before touching anything, the mobile pass asks
    `document.elementFromPoint` who owns each setup option's own centre pixel, and names any option that is
    covered. On the pre-fix build it reports all four by name — *Minor-Noble (Regency)* covered by an `h3`,
    the ill-made-crown shelf by a `b`, Found a Legacy Realm and Sit the Day's Chair by `button`s belonging
    to the works panel. `tests/mobile-reach-check.js` owns the full sweep; this is the tripwire.
  - **The letter panel too.** `#card` is the same element for every letter of the reign, so the same
    geometry governed them. `mobile-reach-check.js` now also walks the whole two-step setup and answers a
    real mid-reign letter using **raw `mouse.click(x,y)` only** — no `locator.click()` anywhere in that
    section, so nothing in it can be rescued by an auto-scroll. 98 assertions.
  - **Two vacuous assertions, repaired.** `tests/reading-check.js` asserted
    `!('cold-chair-daily' in (G.S._m||{}))` — but **`S._m` exists nowhere in the game** (zero occurrences),
    so the expression was always `'x' in {}`, always false, always negated to true. It was aimed at the
    wrong place besides: the daily ledger is not state, it is localStorage. It now asserts against the
    sandbox's real localStorage backing store, and **it fails when a write is planted**. And
    `tests/ledger-marginalia-check.js` had `!('dynastyLedger' in {})` as a dead conjunct; it now checks the
    ledger stays off `state()`, which is the byte-identity contract it was presumably reaching for.
  - A test that cannot fail is worse than no test, because it reports the guarantee as checked.
- **P0 — four of the five ways to start a reign could not be tapped (v0.65.1).** On a phone, only *The
  Crown* worked. Unreachable: **Minor-Noble (Regency)** — an entire game mode — the ill-made-crown shelf,
  Found a Legacy Realm, and **Sit the Day's Chair**, which the roadmap calls the most important virality
  feature in v2. Every distribution path the game has routes through a door that wouldn't open, on the
  device most likely to open a shared link.
  - **Mechanism.** `#card` was `position:absolute; inset:0` inside `#mapwrap`, so its height *was the map's
    height*, and `.letter` is `max-height:92%` of that. On a 390×844 phone the setup card got **183px of
    window for 590px of content**. It did scroll — but inside a 183px sub-box with no visible affordance,
    adrift in an 844px page whose own scrollbar does nothing for it. Unscrolled, only the first of five
    options sat at a tappable coordinate; `elementFromPoint` at the other four returned the **works panel's
    build buttons** underneath, so a thumb aimed at "Sit the Day's Chair" landed on a disabled "Cathedral".
  - **It was never mobile-only, which is why the fix is not a breakpoint.** The two-column grid squeezes the
    map at laptop widths too, and the failure is not monotonic in width: on the pre-fix build **1024px and
    960px each lost two options of five**, while 900px, 860px and 820px were fine. The card simply must not
    be height-bound by the map. It is now a fixed full-viewport sheet with its own stacking context — the
    same shape `#help`, `#codex`, `#colophon` and `#leaf` already use — at `z-index:8`, above the panels and
    below help (9), the Leaf (11) and toasts (12), so a modal opened over a letter still wins.
  - **The backdrop declines pointer events; the letter takes them back.** An absolute card only ever covered
    the map, and the map has no click handler, so every control outside it stayed live while a letter was
    open — a player could consult the Codex, the ledger or the whispers before answering. In a game about
    reading the record before you decide that is the affordance, not an oversight. The first draft went
    full-viewport and swallowed the whole page; `tests/browser-smoke.js` caught it.
  - **Provably no sim change:** `game.js` regenerated from the new `index.html` is **byte-identical** to
    main's. Suite **41/41** green, both browser smokes included.
  - **`tests/mobile-reach-check.js`** (90 assertions across eight widths, 360px→1440px) closes the test gap
    that hid this. Per the companion issue, `locator.click()` is occlusion-blind — it scrolls into view and
    dispatches at the element, so it reaches what a finger cannot and **would have passed on the broken
    build**. Every assertion here either asks `elementFromPoint` who owns an option's own centre pixel, or
    drives `mouse.click(x,y)` at raw coordinates, and the Daily Chair must actually *start the day's world*.
    It fails **51** assertions on the pre-fix build. Skips cleanly where Playwright isn't installed.
  - Still worth doing by hand: a thumb on a real phone. Every measurement here is headless Chromium.
- **The Last Leaf repeated itself — visibly, in the README's hero image (v0.65.1).** Two of the five
  defining moments on `docs/last-leaf.png` were the same sentence with the society's name swapped. One
  hardcoded string at `weight||9`, fired once per society; three societies, so any reign that exposed two
  minted two identical high-weight moments, and weight 9 all but guaranteed both made the final five.
  The variety pack (v0.23.1) had given the *chronicle* its state-hashed pools and left `moment()` alone —
  and `moment()` is what composes the Leaf, the one artifact people actually post.
  - **Pools, for the sites that fire once per member of a set.** Eight templates were repeatable, not one:
    a society exposed, a council seat murdered at the table, a wyrm slain (weight **12** — two wyrms was a
    guaranteed double), a town sacked in war (9), raided (5), overrun from below (6), chartered (4), and
    named a city (7). Each now draws from a 4–5 line pool keyed on the instance. The three sworn orders
    are assigned by **rotation** rather than by hashing each name: consecutive indices into a pool of five
    can never collide, where three independent hashes collide about half the time — which would put the
    same shape on the page with the name swapped, the exact defect being fixed. (The first draft did hash
    per name; `tests/moment-variety-check.js` caught two of three landing on one variant.)
  - **A fold at compose time.** New `momentSig()` generalizes the existing `burnSig()`: a moment carries an
    optional template tag, and `leafMoments()` folds on the *template*, not the text — so two moments of the
    same shape can never both take a slot in the five, however differently their pools word them. The freed
    slot goes to the next-best line. The full set still reads out on the Concordance, which has room for
    fourteen; its de-dup keyed on `text.slice(0,40)`, the wrong end of a templated sentence (two exposures
    differ in their opening words and agree in every word after), so tagged moments now de-dup on exact text.
  - **The footer's truncated link is gone.** The Leaf printed a base64 payload cut at 116 characters — useless
    inside an image nobody can click, and impossible to type or complete. When the full link won't fit the
    column it now prints the bare site address, which with the seed on the line above is the pair a reader
    can actually act on.
  - **Zero-rebaseline.** Moments are display-only (never in `state()`, never in the `_chron` stream) and the
    pools are FNV of a state key, so no RNG stream moves: harness output byte-identical across seeds
    3030830 / 7777 / 4655760 / 1043 at both `--auto=0` and `--auto=1`. New `tests/moment-variety-check.js`
    (28 assertions) replays the reported reign, asserts distinct *variants* rather than merely distinct
    text, and sweeps 16 full reigns for a repeated shape in any Leaf. `tests/assassination-check.js` now
    keys on the template tag instead of the murder's exact prose, which is the stable contract.
  - **Still open on #13:** `docs/last-leaf.png` itself has not been re-rendered. It needs a deployed URL to
    print a real `https://` address instead of a home directory, so it belongs with the public flip.
- **A replayed founding reign was missing its opening page (v0.65.2).** `replay()` bypassed `finishSetup`
  and applied the week-0 setup actions itself, so a silently-restored founding reign never ran the
  accession line, the legacy lines, the noble opening, or `prophecyOpen()`. **The same `(seed, log)` told a
  different story depending on which door the reader came through** — and the door with the missing lines
  was the one a *shared history link* takes. Measured: 61 chronicle lines live, 59 on replay, the accession
  and the portent among the missing. Heir reigns were fine (`seatHeir` calls `prophecyOpen`) and so was the
  Reading Aloud film (it calls `finishSetup`); it was the silent restore.
  - **The founding page now belongs to one function.** `replay()` boots exactly as the film does —
    `finishSetup` lays the opening page (silently: `S.replaying` already suppresses `logAction`,
    `saveGame` and the chronicler's welcome), and the drive loop takes the reign from week 0 with the
    week-0 setup actions filtered out so nothing is applied twice. The two paths can no longer drift,
    because there is only one path.
  - **The test gap that hid it.** `harness.js` calls `finishSetup` directly, and so did every check in the
    suite — **no test drove `replay()`.** The boot path every shared link takes was the one path with no
    coverage. New `tests/replay-parity-check.js` (27 assertions across a cold-chair crown, an iron-chair
    crown and a noble regency) plays each reign live, restores it from its own action log, and asserts the
    `_chron` streams are identical line for line, plus same end week, same serialized state, and that a
    replay never writes to the log it was handed. It fails 9 assertions on the pre-fix build. This is the
    invariant that would also have caught the v0.38.0 `_cutLog` replay crash below.
  - **Zero-rebaseline:** harness output byte-identical across seeds 3030830 / 7777 / 4655760 at both
    `--auto=0` and `--auto=1`; the harness never enters `replay()`. Suite 41/41 green.
- **A crafted history link could pin the tab, or write any state it liked (v0.65.1).** The log format is
  deliberately loose so a link survives version drift, which also meant nothing about a link was
  guaranteed. `replay()`'s only bound was `while(guard++<300000)`, and its heir lookup
  (`findIndex(x=>x[1]==='h')`) ignored the week — so a ~14KB link of `[999999999,"h","endured"]` × 400
  resurrected the reign past `S.over` over and over, reaching week **266,434** and minting ~300k
  chronicle elements. A `NaN` week was the same loop by another road: it never satisfies `w <= S.week`,
  so it sat at the head of the queue while the loop ticked to its guard. Separately, `'s'` — the four
  tax sliders — applied as a bare `S[key]=value`, so a link could set **any** property on `S` to
  **anything**.
  - **One door.** New `sanitizeHistory()` is the single chokepoint every untrusted payload comes through
    (`replay`, `startReading` — and so the shared link, the `&read=1` film, the saved slots and the
    browser save). It drops what the game could never have written rather than trying to repair it: a
    week that is not finite and within `[0, 20800]` (~1000 game-years), an unknown action type, an `'s'`
    whose key is not one of `bindSlider`'s four or whose value is off that input's declared range, a
    ruler name past 64 characters, and everything past 12,000 actions. All three drive loops — `replay`,
    `filmDrive`, `readingSkip` — now search for a due heir (`x[0]<=S.week`), which is where a real `'h'`
    is logged.
  - The allowlists are a `Set` and a `Map`, not object literals: a plain-object allowlist answers
    `'__proto__'` with `Object.prototype`, which is truthy — the lookup itself would have been the hole.
    (The first draft used object literals; `tests/link-safety-check.js` caught it.)
  - **Zero-rebaseline.** The caps sit an order of magnitude above the longest dynasty anyone could have
    played, so no honest link is touched: harness output is byte-identical to the prior main across
    seeds 3030830 / 7777 / 4655760 at both `--auto=0` and `--auto=1`. New
    `tests/link-safety-check.js` (14 assertions) owns the contract, including an end-to-end replay of
    the reported payload — 3.1s of pure spin becomes 21ms.
- **Replay crash on the Cut Leaf (v0.38.0 regression).** `S._cutLog` was initialized only in
  `finishSetup`, so REPLAYING a reign (saved-game resume, any shared history link, and the new
  scenarios) crashed the moment the log reached a deed the monk cuts. Now initialized in the state
  literal like `_gildLog`. Found by the scenario shelf's replay tests.
### Added (continued)
- **The Heir Grows Up — the dynasty spine (v0.42.0).** Your choices this reign shape the protagonist of
  the next. A new work on the build verb, **the heir's household** (200 gold, ~6 months, once a reign,
  crown-only), raises *The Tutors*: give the heir to the **master-at-arms** (warlike), the **Concord's
  chaplain** (pious), the **university's doctor** (learned), or **the quiet clerk from the Whispers'
  stair** (cunning). At the succession the upbringing arrives with the new crown: a warlike heir keeps
  and swells the muster (+15% and 250 men); a pious one opens with the Flame warm (piety +14, the
  Concord +10); a learned one opens better believed and better counted (legitimacy +8, a corrected
  treasury +150); a cunning one greets each lord with a courtesy calibrated to their secrets (court +4,
  the informants already paid for two years). The trait is **consumed at succession** — each reign
  schools its own heir — the Last Leaf notes the upbringing (*"the crown was schooled to the whisper
  before it was worn"*), and `state()` surfaces `heirTrait` only while a schooling stands. Entirely
  opt-in on the logged build action: a dynasty that never invests draws no letter and is byte-identical
  (**0/26 plans differ**). `tests/heir-check.js` (24 assertions), `tests/plans/heir-grows-up.json`.
- **Marriage & Usurpation — the two deferred noble paths, now walked (v0.41.0).** The p08 spec's
  highest-leverage deferred item: a climbing knight can now reach the Cold Chair by all three roads.
  Both arcs are **armed only by explicit choices** (an append-only fourth option, a schedule inside an
  option no regression plan takes), so **0 of 24 existing plans differ** — and both run in parallel with
  the shipped regency road (whose scheduled letters now die cleanly if the knight has meanwhile ascended
  by another road — a cross-arc leak the parallel paths exposed and this release fixes).
  - **Path 1, Marriage into the line.** A fourth answer on the First Suit declares for a wedding, not an
    office; *The Betrothal* offers the spec's three answers (seal the match and pay the 180 bride-price ·
    set aside the cousin and court the crown itself, gated on court ≥ 60 and claim ≥ 45 · delay — the
    unsealed contract as leverage, and the offer returns); *The Consort's Hour* raises the consort on the
    succession **if the realm believes its arithmetic** (court ≥ 62, claim ≥ 55 — passed over otherwise,
    and the question returns). `ascend('marriage')` → a crown starting at legitimacy 56, the court mildly
    resentful of what it arranged. Verified end-to-end: `tests/plans/noble-marriage.json` is raised on
    the third succession question, ~year 11.
  - **Path 3, Usurpation by acclaim.** The muster petition refused → *raise them anyway* now seeds the
    full arc: *The League's Grievance* (the commons bring their petition to YOUR gate — take up their
    cause and the square's young men take your colors), a deterministic quarterly **acclaim watch** (no
    RNG) that fires *The Banner Raised* when the spec's three gates hold (commons ≥ 70 · guard ≥ 90% of
    cap · crown legitimacy ≤ 30), and *The Gates of the Capital*, resolved on pure muster arithmetic —
    the exact mirror of `resolvePretenderWar`, with the knight as the claimant this time. Win →
    `ascend('usurp')` (legitimacy 30, the old lords' knives already drawn); lose → the block
    (`attainted`, and the kinsman climbs again); balk at the walls → march home smaller but alive.
    Verified end-to-end: `tests/plans/noble-usurp.json` — petition denied wk300, banner wk394, gates
    wk400, crowned by acclaim, rules twenty years.
- **The Divided Realm — the co-ruler is a live rival now, not a line-item (v0.40.0).** The Pretender's
  War's "treat" answer promised *"the pretender becomes a live court rival"*; now he is one. The treaty
  records **who** he is (name, house, his ceded march, the week of the division), and ~2.5 years on he
  presses the question the sealing-wax deferred — the succession — in *The Second Court*: **march into
  his march** (the mirror-resolve again: win and the realm comes home whole — `reunified`, the epithet
  **the Reunifier**, rarer than breaking a pretender; lose and a second march passes under his writ and
  the drain **doubles**, the co-ruler ascendant), **concede the succession** (statesmanship, says the
  court; a mortgage, says the mandate), or **wed the lines** (the division ends in a cradle — healed,
  not conquered; no epithet, no drain). Entirely gated on the divided flag — an undivided reign never
  arms the letter and is byte-identical. `tests/succession-wars-check.js` (31 assertions across both
  releases).
- **Living-map marginalia + the Dynasty Ledger — two cheap charms from the endorsed first wave
  (v0.39.1).** Both display-only: pure reads at render/compose time, no RNG, nothing new in `state()`,
  and **0 of 24 harness plans differ** from the previous build.
  - **The map accretes history.** Beyond the pressure-notes that fade as the danger does (*hic dracones*,
    *here the ladders gather*), the chronicler's hand now records what *happened* — permanently: *here
    the wood burned*, *here the wyrm came* (at the ravaged town — a scar the heir inherits, carried like
    `burned`), *here they digged too deep* (the roused Delve; a deepened-but-quiet one gets *the lower
    galleries*), *here the Reach burned*, *here came the sweat* (at the sea-gate), *here the pretender
    fell* (at the pass). The notes ride into the Last Leaf with the map canvas.
  - **The House's legend.** Each closed reign now enters an off-ledger dynasty record at succession
    (ruler, verdict, years, ending, wyrms slain — read as the Last Leaf would read them), and the leaf
    prints the line's legend in one gilt breath under the dynasty line: *"The House's legend, crown by
    crown: Queen Aldith the Steward, 30–50 · King Ferric the Wyrmsbane, 50–70 (deposed) — and one wyrm
    slain in the line's keeping."* Capped at the last four crowns (older ink folds into a count). An
    ascended knight founds a house — its ledger starts empty. The direct substrate for achievements and
    "share your dynasty" (Community layer). `tests/ledger-marginalia-check.js` (16 assertions).
- **The Iron Chair — difficulty as a first-class axis (v0.39.0).** One setup choice, carried like `mode`:
  after naming the ruler, a crown reign chooses the **weight of the chair** — *the Kind Chair*, *the Cold
  Chair*, or *the Iron Chair* — and it scales five parameters the sim already exposes. **Starting
  legitimacy** (Kind +12 → 45, Cold 33, Iron −12 → 21), the **threat clocks** (how much runway before the
  border musters, the wood wakes, the granaries echo — Kind pushes them out, Iron pulls them in), the
  **hoard-line** a treasury draws a wyrm at (Kind 9000, Cold 6000, Iron 4000), **how readily the estates
  take offence** (the grievance bands — Iron simmers a court still fairly warm, Kind forgives sooner), and
  the **deposition floor** (Cold falls at legitimacy 0; the Iron Chair falls at 6, before the mandate is
  wholly spent). Makes a weekly-seed competition mean something, and gives a returning player a harder
  reign to earn.
  - **The Cold Chair IS today's realm, to the byte.** `S.chair` defaults to `'cold'`; every runtime helper
    (`hoardLine`, `depositionFloor`, `chairGriev`) returns its original literal for cold/undefined,
    `applyChairSetup` is a no-op, and a cold reign **logs nothing** to the action log — so every existing
    history link and every harness plan replays identically. Verified: **0 of 23 plans** differ from
    pristine main under the Cold Chair. A non-default chair logs `[0,'d',chair]` at week 0, before any
    genesis tilt, so a shared link replays its weight exactly; the chair surfaces in `state()` **only**
    when it is not cold (a leaderboard can weigh a score by the difficulty it was earned at), and on the
    Last Leaf ("borne upon the Iron Chair, at the hardest weight the annals reckon"). Difficulty is a
    CROWN axis; noble mode carries its own ascending weight and always sits the Cold Chair.
    `tests/chair-check.js` (27 assertions), `tests/plans/iron-chair.json` (a competent hand endures the
    Iron Chair; a careless one is deposed by year 6–7 where the Cold Chair holds to year 15+).
- **The Chronicle Bundle — the book itself learns to keep, to cut, and to remember (v0.38.0).** Four
  reader-facing features that change the illuminated book a human reads while leaving the record a
  replay re-inks — and the bytes a harness serializes — untouched to the letter. The whole batch lives
  *beside* or *after* the one line that feeds the chronicle stream; not a single string the monk sets
  down is altered, added, or reordered, on any plan. **The Year's Rubric:** a chronicle year, once
  closed, earns an illuminated incipit named in hindsight from the heaviest deed it held — *the Year the
  Wood Woke*, *the Year the Wonder Rose*, *the Year of the Cold Altar* — while a quiet year the monk
  declines to dignify stays plain. The Last Leaf lists the reign's years as a roman-numeral table of
  contents, the lean years folded into unnamed runs. **The Cut Leaf:** for five curated deeds against
  *persons* — a murder blamed on the innocent, a scullion racked into confession, a preacher dead "in
  the Crown's keeping," souls struck off the census by the pen, a testament conveniently "lost" — the
  illuminated book *cuts the leaf* and stains the stub, and the Last Leaf notes only that leaves are
  missing. **The truth is not gone:** the record stream still holds the deed verbatim, the action log
  still replays it — the cut is a render overlay, and re-running the history link re-inks every word.
  **The Palimpsest:** where a later hand corrects a gilded stretch, the scraped gild now ghosts *under*
  the correction — struck-through gilt bleeding through the ink — lie and truth stacked on one page,
  panel and leaf both. **The Concordance:** a back-of-reign index of the persons, places, sworn orders
  and grievances the reign named, each with the years it surfaced and a gloss in the monk's hand,
  overflowing into *"…and others, whom the margin has no more room to name."*
  - **Byte-identical by construction.** Every derivation is a pure read of what the sim already holds —
    `S._moments`, `S._gildLog`, `S.council`, `S.societies`, `S.factions`, `W.*` — or a deterministic
    `chVary` hash of a state key. The new bookkeeping (`S._cutLog`, the year-header registry) lives
    off-ledger, named nowhere in `state()`, so the harness never sees it; the two new leaf fields
    (`rubrics`, `concordance`, plus a `cuts` note) ride `leafData()`, which the harness never calls.
    Zero new RNG stream, zero clock, zero sim-state change. Verified by cross-build harness diff on all
    25 plans, crown and noble: every byte identical to pristine main. No personal names — every name
    printed is a realm-generated token the game itself minted.
- **The Pilgrim Roads — the faith made a thing you spend, not a thing you sit on (v0.37.0).** For a
  dozen versions piety sat at its ceiling for free: a warm Concord — which nearly every reign earns
  merely by answering its letters — floated the Flame to ninety-and-up whether or not the Crown ever
  endowed it. This batch closes that last open balance lever in two interlocking halves. **Half one, the
  neglect drift:** the Flame is now fed on *tending* — a generous standing tithe, a cathedral or
  monastery, a recent devotional act — not on the Concord merely liking the Crown. An untended faith
  converts goodwill to piety at a discount and has no floor at forty, so over the years it mean-reverts
  *down* into the low-piety unrest deck that v0.20.0 built and that, until now, normal play never
  reached. A genuinely abandoned Concord still collapses (v0.20.0 preserved); a genuinely endowed one
  still holds the ceiling. **Half two, the spend:** three repeatable works on the existing build verb —
  **Sponsor a pilgrimage** (roads fill, the Concord warms, the Crown is seen to kneel), **Translate a
  relic** (a saint's bone in state — and a question, 1.5–2.5 years on, of whether it was stolen or a
  sheep's from the start), and **Endow a chantry** (priests to sing for the realm in perpetuity, a
  lasting warmth in stone and stipend). Each spends piety and gold and sets a devotional *afterglow*
  that lifts the drift's target for two years. The interlock: **you can substitute repeated spending for
  a standing tithe — piety competes for exactly the gold cautious play hoards.**
  - **The teeth on a relic — a theft-or-fraud letter** (`relic-question`) arrives a season or two after a
    translation: a canon swears the reliquary was forced and the true bone sold toward the rival, a
    pardoner swears there was never a bone to steal. Pay for a solemn inquest (one seeded draw decides
    true-bone or swineherd's-knuckle), ransom a replacement and close the question with gold, or preach
    it holy and hang the doubters. One `rHist` draw at resolution — a card-resolution draw, logged in
    order, the `plague`/`hedge-preacher` idiom — no new stream. In `NOBLE_EXCLUDE`: a climbing knight is
    never offered a sovereign faith matter.
  - **Two new epithets:** **the Builder of Chantries** (endowed two or more lasting houses of prayer) and
    **the Pilgrim** (sent the realm on the roads / gathered its relics, three works or more), placed below
    the cathedral-Devout and every war/dragon legend, above the miser/builder tail.
  - **Opt-out byte-identical.** The drift is a pure-state replacement inside the existing mean-reversion —
    no new RNG, no clock, no tick. The three works, the relic card, the chantry's perpetual warmth, and
    the epithet counters are all opt-in and all lazy state (`S.pilgrimages`, `S.relics`, `S.chantries`,
    `S.devoutUntil`, `S.flags.chantry`), surfaced in `state()` only once non-zero. A reign that walks no
    road adds no field and draws no new roll. No new action type — the Roads ride the `'b'`/`BUILDS`
    verb, so zero new harness or replay plumbing. No personal names.
  - Tests: `tests/pilgrim-check.js` (52 assertions — the drift's tended-safe/untended-rot cliff, the
    neglect driver reaching the deck, the guardrail band, determinism; and each of the three works' gating
    and effects, the afterglow interlock, the relic-question's three answers and its branching inquest
    draw, the epithets, and the opt-out byte-identical `state()`) and `tests/plans/pilgrim-road.json` (a
    devout builder that saws its piety down the roads, earns *the Builder of Chantries*, and endures).
- **The West Tower — a door in the dragon-arc the annals will not name (v0.36.0).** There is an older,
  colder word the first chronicler used for a certain thing and every one since has declined to gloss;
  this batch teaches the record to write around it. A reign played from a certain strength, offered a
  certain wyrm, may find the beast takes the gold and does not fly for the peaks — it takes the west
  tower for a perch, and does not burn, and watches the Cold Chair as though it had chosen it. What may
  follow has no rite the Concord will bless: a guardian no muster fields, a scandal the faith never
  forgives, and a line that comes after with a look about the eyes and wings in its wars. The route has
  **no button, no panel, no help-line** — it is a pure-state door, queued through the existing card
  machinery only when the board already holds a shape it recognises, and the parley never renders on the
  standard wyrm's letter. How it opens is left where the hidden orders' triggers were left: off the page,
  for a bold hand or a patient one to find.
  - **Byte-identical for every reign that does not walk it.** The door is a pure-state predicate — no
    RNG, no clock. The one new seeded draw rides the existing history stream at a card-resolution site and
    *replaces* the roll an ordinary answer would have taken there, so even that answer's draw-count is
    unchanged; a reign that legitimately opens the door consumes its troth-delay draw where an ordinary
    answer would have consumed its own — both one draw at the same site — so the sim stays fully
    deterministic given (seed, log). Every consequence — the faith's turn (which arms the existing
    interdict), the terror that backs the crown's muster at the three war sites, the permanent household
    line-item, the succession carry, the older verdict, and the two-layer gilded-vs-truth record — is
    gated behind a flag unset in every other reign. Proven by regenerating the prior build and running all
    five regression plans: **byte-for-byte identical**, no rebaselines. No new RNG stream, no clock read,
    no personal names.
  - **A wonder that costs.** Not a pure win: it turns the faith against the Crown, the old blood recoils
    where the commons stand in awe, the mandate spends belief on a thing this strange, and the realm keeps
    ever after a household expense the size of a standing army — the mouth remains when the hoard that drew
    it is gone. The reward is a border the Reach will not cross and raids and pretenders broken before
    they land; the price is the Concord at the Crown's throat and a treasury that no longer fears its gold
    but feeds it. And a **hidden achievement** the future panel never lists until it is earned.
  - Tests: `tests/wyrm-consort-check.js` (47 assertions — the door's exactness and every single-portent
    failure, the off-path one-draw invariant and the flag-inert war/economy terms, the full arc, the
    succession carry with a rider's tilt, and the achievement's silence until earned) and
    `tests/plans/wyrm-troth.json` (a reign that finds the door on seed 3030830 and endures fifty years by
    the older word).
- **The Sweat — a plague that comes up the trade-roads, and the wider you threw the doors the wider the
  door it comes through (v0.35.0).** Prosperity's own predator, the way the hoard-line is the treasury's.
  A realm that flung its gates wide — a deep-water harbor, a standing pact across the Sundered Sea, a
  road-net carrying hulls' cargo inland, a country of dense towns — invites more than pepper up the
  river. The gray sweat arrives **deterministically along that openness**, runs its course over a few
  seasons on two pure-integer clocks, takes its tithe in people and prosperity, weakens the muster while
  it rages, and burns out at the sea-gates, hungry. The mirror of the fat-hoard wyrm and the cold-court
  pretender: openness is the vulnerability.
  - **Vulnerability-gated on openness → a lean, closed realm is byte-identical.** `sweatExposure()` is a
    pure-integer score of the realm's own works (harbor, pact, roads, markets, dense towns). Below
    `SWEAT_DOOR` (6) `tickSweat` returns **before any `rHist` draw** — exactly as a below-`HOARD_LINE`
    treasury never draws a wyrm — so a closed reign's stream cursor never moves and its replay is
    bit-identical. Proven by regenerating the prior build and running all five regression plans with the
    door held shut: **byte-for-byte identical**. An open trading realm crosses easily and legitimately
    drifts the shared history stream once it opens the sea-gate (the standing sim-feature caveat).
  - **It runs its course — not a one-tick raid.** Foreshadowed a season out (a fever-ship turned away at
    the sea-gate — the ex-plagueship the expeditions already meet), then an openness-weighted annual
    strike. Once loose, `courseSweat()` advances on a seasonal cadence on two clocks — a **spread** that
    climbs (faster the more roads carry it inland) and a **burnout** that counts down — taking fewer
    people, poorer towns, and a harvest shock the **granaries and tithe-barns blunt**, until burnout ends
    it. All pure integer and `chVary` line-selection; **no per-tick RNG**.
  - **Four answers, each a real cost.** *Quarantine the river* (chain the wharves — starve the sickness
    and anger the League, reusing the existing `quarantine` flag), *shut the town gates* (cheaper, seals
    the sick in, angers the commons), *pest-houses and processions* (spend gold, warm the Flame, a
    gentler toll), or *shelter the people and endure* (cheapest, deadliest, and the people remember who
    stayed). A **crest card** fires if it reaches the capital: spend against it, flee the court, or be
    seen to stay. The gate-shut / faith / endure answers deliberately rhyme with the light ambient
    `plague` card's own three, so the arc reads as its bigger sibling — and that ambient card is left
    **exactly as is** (removing it would rebaseline every plan that draws it).
  - **The muster is sick while it rages.** `sweatMuster()` multiplies the crown's muster term at the
    three war sites (`crownMight`, `dragonHunt`, `resolveRaid`); it returns `1` whenever no Sweat is
    loose — always, for a realm that never contracts one — so those functions stay **byte-identical**
    outside a plague.
  - **Two epithets and a Last-Leaf clause.** A reign is crowned **the Physician** if it shepherded the
    realm through with the tending answers and a mandate still believed, **the Gravedigger** if it
    endured a slaughter (a toll past ~12% of the realm) — both placed below the war/dragon legends (a
    dragon-slaying still outranks surviving a plague) and above the doctrine epithets. A weight-9 defining
    moment lands at burnout, and the leaf notes the souls the sweat took "up the same roads the silver
    came down."
  - **No new action type, no personal names.** Both cards resolve through the existing `'c'` mechanism;
    every answer is a pure-state setter of clocks and dispositions. The only new seeded draws are the
    foreshadow schedule and the single strike roll, both **inside** the openness gate. Tests:
    `tests/sweat-check.js` (31 assertions: the gate, the draw, the four answers, the pure-integer course
    and burnout, the muster guard, the verdicts, and the succession reset with pop losses persisting) and
    `tests/plans/sweat-open.json` (a wide-open realm that draws the sweat under `--auto=0` and endures to
    year 50).
- **The Seeded Prophecy — a portent every reign opens on, that the reign keeps, breaks, or quietly
  loses (v0.34.0).** The monk opens each reign's page with a promise: a portent drawn from the realm's
  seed — *"a crown of ash," "the river will pay tribute," "a knife at the high table," "a wyrm that
  learns the crown's name"* — and by reign's end the record either honours it, spins it, or is found
  suspiciously blank where it stood. Frames every game as a story with a promise, exactly as the monk
  would tell it.
  - **Pure of the seed — no new RNG, no new action, no rebaseline.** The portent is chosen by
    `hashName(SEED + '|portent|' + dynastyOrdinal) % pool` — the same seed-hash the wyrm roster uses —
    so it consumes **no** RNG stream; the opening line is an ordinary `chron()`; and the resolution is
    a **pure read of end-of-reign state**. A baseline reign is byte-for-byte identical in replay (proven
    against a fresh regen of the prior build across all five regression plans). Each **heir draws its
    own** portent, indexed by its dynasty ordinal.
  - **A pool of 13 portents, each with a deterministic fulfilment predicate** over already-tracked state
    — a town burned or the wood torched (*the ash crown*), the harbour's tolls or a sea-ally (*the river's
    tribute*), a fired assassination arc (*the knife*), any wyrm seen (*the named wyrm*), a raised
    pretender (*the false crown out of the west*), two cities grown (*cities where the fields were*), a
    committed doctrine (*a law that cannot be unwritten*), roused goblins (*the deep folk*), a standing
    wonder (*a stone to outlast its mason*), a hard ending (*a crown that does not pass in peace*), a
    gilded record (*a name gilded and a name true*), a matured uprising (*the estates keeping their
    score*). No new clocks — the predicates read the flags the systems already set.
  - **The monk edits the record to suit — the three framings.** *Fulfilled*: he claims the foresight and
    underlines it twice ("as was written"). *Subverted*: a pointed-opposite predicate fires (the reign
    grew fat instead of burning; the river was *shut* instead of paying) and he insists the omen meant
    something else all along. *Forgotten*: neither predicate holds, and the page where the portent stood
    has been "scraped to the nap," the monk maintaining it was always blank. Surfaces at reign start (the
    opening chronicle entry), and on **the Last Leaf** as a gilt-and-ink marginal beneath the judgment —
    the promise the reign opened on, and how the record was squared with it. `tests/prophecy-check.js`
    (27 assertions: seed-stability, the opening chronicle line, the three framings and their precedence,
    an heir's fresh draw, and a byte-identical double-run replay).
- **The Pretender's War — a rival heir flees to the Reach and comes home with its army.** The
  crown-mode counterpart to the deferred noble usurpation path, and the foreign-backed, *military*
  escalation of the domestic court-rising uprising. **Vulnerability-gated** (like the hoard-drawn wyrm):
  it arms **only** for a reign that is *both* shaky in the mandate (legitimacy < 45) *and* cold or
  grieving at the high table (court disposition < 40, or a matured court grievance), past ~year 8. A
  believed crown with a warm court never meets the bar, takes **no `rHist`**, and is byte-identical.
  - **The claimant already half-exists.** He is drawn from the record: **Osrec** if the half-brother who
    "answers the Reach's letters" was ever named Protector; else the **Old Root's** exiled head if that
    society is known; else a seed-stable passed-over kinsman. Foreshadowed a year out — the claimant
    slips from court, then is seen east at the Reach's own table — in two margin tells, like the
    assassin's mark.
  - **The muster, and a court that can defect.** He returns with a **host of the Reach**; and if the high
    table is genuinely lost, a great house of the Ashen Table declares for him, adding its levies to his
    and subtracting them from yours. Resolved on the muster like the raid and the dragon-hunt — troops ·
    walls · wardens · beacon — plus the two things a succession war turns on that a wyrm does not: **how
    believed the crown is, and how warm its court.**
  - **Three answers.** *Meet them in the field* (a strong host crushes the claim — a legitimacy boost, a
    chastened court, and the epithet **the Unshaken**; a thin one loses the realm — the new **`usurped`**
    end state, epithet **the Supplanted**, and the true line rides for the pass to return as heir);
    *buy off the Reach's backing* (foreign troops fight for foreign silver — outbid it and the rising
    folds, *if* the treasury can meet the price; a light purse is laughed off and it falls to the field);
    or *treat — divide the realm* (concede a march, a title, and a seat — alive but with the mandate
    halved and a live rival co-ruler who bleeds a little legitimacy every season). `tests/pretender-check.js`
    (24 assertions), `tests/plans/pretender-war.json` (Osrec returns; the reign ends *usurped* at wk782).
- **The Delve and the Deep Folk — mine the western mountains, and wake what your grandfathers walled
  in.** The ore-town in the western peaks was only scenery; now it's an arc. ~Reign-year 2.5, *The Deep
  Seam*: the miners strike a rich silver vein running deep under the old mountains, but the oldest of
  them won't dig past the third gallery — "the deep stone is not empty." Three answers: **open the deep
  vein** (a generation's silver now + a steady ore income — and you wake the **goblins** at once),
  **work the shallow galleries** (fair silver, and *mostly* safe — but the workings creep a little
  deeper each season, so there's a **low chance, growing year over year**, the deep folk find even the
  upper galleries — ~1/3 over a full reign of shallow mining, and rarely before year 10), or **wall it
  up** on the old warning (a fortune left in the ground, and the Concord's approval).
  - **Goblins raid from the west.** Once the deep vein is open, the **deep folk** raid the Delve and the
    western frontier every few years — a distinct threat from the eastern Reach and the bandit columns,
    striking the ore-town specifically, its toll decided by your muster, walls, and beacons (like the
    bandit raids). **Entirely opt-in**: a realm that never opened the deep vein sees no goblin and takes
    no `rHist` — byte-identical.
  - **A second chance to mine** — *The Galleries Below*: **drive them deeper** (the lower vein's silver,
    but angrier, sooner raids — you're digging toward their halls now), **collapse and seal the works**
    (the raids and the silver end together — peace bought with a fortune left in the ground), or **treat
    with the deep folk** (a tribute of silver for a fragile quiet, and the Concord's disgust). An open,
    roused Delve is a realm fact — the heir inherits both the silver and the raids. `tests/goblin-check.js`
    (17 assertions).
- **Two more ways to meet a dragon — and a dragon that unmakes the Reach.** The wyrm is no longer only
  a hoard's punishment:
  - **An expedition can wake one.** A new deep-sea outcome, *What Slept on the Black Isle*, puts the
    fleet in at a wyrm's island lair past the last chart — a **hoard-free second path** to a dragon, so
    a player who wants the encounter can go sailing for it. Sound the alarm (ready the realm) or keep
    the salvaged wreck-gold and say nothing (which fattens you into a bigger target — you took dragon
    gold). Either way it follows the fleet home.
  - **A wyrm you can't kill may take the Reach.** When the Crown *feeds*, *endures*, or *fails to slay*
    a dragon, the sated wyrm sometimes leaves for a bigger hoard — and there is none bigger within
    reach than **the Reach itself**. *The Reach Burns*: the old enemy is unmade, its muster scattered,
    the border quiet for years, and its proud refugees at the pass asking for bread. Feed them (a name
    that outlasts the border), seize the undefended forts while it burns, or bar the passes and watch.
    Tied to the dragon lifecycle (a card-resolution draw), so it never touches a dragon-less reign;
    once per reign. `tests/dragon-check.js` §7 covers both (now 44 assertions).
- **More dragons — a named bestiary, and a dynasty that can face several.** The wyrm is no longer a
  single generic threat: a realm now carries a **seed-fixed roster** of named dragons of three kinds,
  and a persistent hoard can draw **more than one** over a reign (a slain wyrm is dead, but the hoard
  in time calls the next). Names + kinds are pure (`hashName` over seed + ordinal), so no new RNG and a
  lean reign is still byte-identical.
  - **Ember-wings** burn the fattest town and take a quarter of the hoard (fire). **Frost-worms** bring
    a killing frost — a grain catastrophe, prosperity across the realm, an ill omen on piety — and less
    gold. **Salt-serpents** (coastal realms only) rise against the sea-gate, coil the harbour shut
    (trade halved via the river-strike), and drown levies. Each has its own herald and assault text,
    and a name like *Morrath the Ember-Wing* or *Sarnoth the White Drake*.
  - **Escalating verdict:** one kill crowns the reign **'the Wyrmsbane'**, two or more **'the
    Dragonlord'**. Each reign runs its own saga — the heir draws fresh wyrms to its own hoard and earns
    its own standing. New assertions in `tests/dragon-check.js` (35 total: bestiary determinism,
    coastal-only brine, kind-specific ravage, escalating verdict, per-reign reset).
- **The Wyrm of the Hoard — a dragon is drawn to gold.** *hic dracones*, made real. A treasury that
  stands above the hoard-line (6,000) and keeps growing for a couple of years (opulence ≥ 2) begins to
  draw a wyrm out of the old margins of the map — the older, sharper answer to a hoard than the court's
  grumbling, and available in the **mid-game** where the decadence teeth (year 38+) never reached. It is
  **rare** and **hoard-scaled** (a foreshadow of scorched cattle, then a hoard-weighted annual draw,
  never in the establishing years, never mid-war), and it **directly punishes the fast-builder who
  banks a fortune and maxes out** by year 6. When it strikes it burns the realm's fattest town and
  carries off a quarter of the hoard; then the Crown answers — **hunt** it (a strong host of troops,
  walls, and wardens slays it for its lair-gold and the epithet **'the Wyrmsbane'**; a thin host only
  feeds it), **feed** it a tribute for a season's grace, **bind the hoard** (empty the vaults into the
  realm so the wyrm loses its reason — the same "spend it down" answer that recedes decadence), or
  **shelter the people and endure**. A slain wyrm stays slain across succession. Determinism-safe: a
  lean or spending reign draws no wyrm and takes **zero rHist**, so it is byte-identical; only a hoard
  pays the draws. New `tests/dragon-check.js` (25 assertions) and `tests/plans/dragon-hoard.json`.

### Accessibility
- **Colourblind-safe war hosts.** On the map the Crown's army and the invading column were told apart
  by colour alone (rubric red vs sable grey) — the same pen-figures under the same pennon. They now
  differ by **banner shape**: the Crown flies a pointed pennon topped with a gilt finial, the invader a
  forked swallowtail with a bitten notch. Colour stays as a redundant second channel. Canvas-only.

### Balance
- **Piety rebaseline (the neglect drift, v0.37.0):** the piety *mechanism* — the seasonal mean-reversion,
  the v0.20.0 low-piety unrest deck (`<40`), the Concord-erosion and legit-bleed teeth (`<35`/`<20`), the
  cathedral floor (`45`) — is **unchanged**; the drift only lowers the *target* an untended faith reverts
  toward, so goodwill alone no longer floats the Flame to the ceiling. Because piety is now
  state-derived, its values shift across every reign — recorded here as measured bands, the way the
  doctrine-era assassination sweep was: **default/cautious resting piety settles 60–74** (was 88–99);
  the **five-plan regression suite's minimum piety over fifty years lands 54–60** — a clean ~15-point
  margin above the `<40` unrest band, so **every crown plan keeps its exact `over`/end-year outcome and
  zero anomalies** (verified against a pristine v0.36.0 regen); the deliberate `piety-neglect` driver now
  **reaches the deck for the first time (min ~37)**, arming the teeth that had sat unused; and the
  guardrail holds — **unmanaged `--auto=1`/`--auto=2` play still loses in the 35–45 band** (deposed
  yr35–36), neither rescued nor accelerated. The behavioural harness stores no expected-piety file, so
  no golden JSON was edited; the invariant is outcome + anomaly-count + bit-identical replay, all
  preserved. Recommended tuning locked at `pfloor 27 / coef 0.27`. Guarded by `tests/pilgrim-check.js`
  §A. `wyrm-troth.json` keeps `wyrmConsort=true` and endures with no plan edit (piety 65, above the
  troth-door conditions). The `stone-and-road` relative-piety assertions still hold (a tended reign
  floats to the ceiling); only its cosmetic console piety numbers moved.
- **A rich realm can no longer buy off a crisis for pocket change.** Two flat estate-appeasement costs
  now scale with the treasury, matching the court-ransom that already did: the Concord's amends for
  lifting an **interdict** (was a flat 220 → 200 + 15% of gold), and the **overreach** staffing bill
  (was 180 → 150 + 10% of gold). A fat, over-built Crown pays a fat bill; a lean one still pays a real
  floor. Guarded by `grievance-check` §8.

### Fixed
- **Four findings from the v0.28–v0.30 nightly review**, all source-verified:
  - **'the Iron' verdict was unreachable on the Last Leaf** — `reignVerdict` gated it on `!S.over`, but
    the leaf composes *after* `endGame` sets `S.over`, so an Iron Levy reign was crowned 'the Steady'
    while its mid-reign preview said 'the Iron'. Dropped the gate (conquest/deposed already return above).
  - **A doctrine outlived the crown but its record didn't** — `continueAsHeir` wiped `S.flags` (and with
    it `doctrineRoad`) while leaving `S.doctrine` live, so an heir inherited the law's effects with an
    empty record (`leafData().doctrines` `[]`, no foreclosed-road clause, a verdict for an ancestor's
    law). Doctrines are realm-law, so the record now persists across succession like `burned` does.
  - **A harness `'k'` (hook-spend) that couldn't resolve was logged as if it fired** — it now checks
    `annals.hook`'s return and records a `hook did not resolve` anomaly instead of falsifying the
    decisions log and silently falling to `--auto` (`tests/plans/hooks-badspend.json` guards it).
  - **A second uprising could strike with no foreshadowing** — every uprising resets grievance to 2–6
    (never 0), so the tell-marks stayed set; the strike now re-arms them, so both margin tells re-fire
    before any repeat uprising ("always foreshadowed" holds).
### Added
- **A granary warning before the winter takes its tithe.** Grain under 400 quietly bleeds legitimacy
  each quarter (and under 0 forces the granaries open) — a slow failure the ledger never surfaced. The
  Crown's Ledger now shows a rubric warning under the Granaries row **only** once the stores are near
  the hunger line and still falling: the weeks of food left and how far off the reaping is, escalating
  to the legitimacy cost once below the line. High-signal (silent on a well-stocked realm); pure read
  of state, guarded in `tests/income-ledger-check.js` §2.
- **The Last Leaf names the knives.** The composed manuscript page now renders *"The knives of this
  reign"* — the standing leverage (`[Knife]`) the Crown held over its own, drawn when it was wanted or
  kept sharp and never used ("Held over the Treasurer, Aldric, these eleven years — and never drawn").
  Completes the Wave 5 payoff: `leafData()` had carried the leverage since v0.28.0, but the canvas never
  drew it. Guarded so it appears only when the reign held knives and only while there's room above the
  seal, so an eventful leaf never overflows. Canvas-only; sim and determinism untouched.
- **The week's reckoning — a visible income ledger.** The Crown's Ledger panel gains a tap-to-expand
  breakdown under the Treasury row: land tax, river tolls, works & trade, upkeep & court, tithe, and
  the net — the **effective** figures *after* every multiplier, and a line naming the levers in play
  ("With the Mint's Charter (+12% trade), the river shut by the League"). Replaces a desktop-only hover
  tooltip that showed pre-multiplier numbers (so it silently disagreed with the real net once a doctrine
  or the river-strike was active) and was invisible on a phone. `S._inc` now carries the effective
  contributions + modifier notes; UI/bookkeeping only — the sim and determinism are untouched, and a
  regression test (`tests/income-ledger-check.js`) pins the invariant that the shown rows always sum to
  the gold actually applied.

## [0.30.0] — 2026-07-11 — "The Weight of the Estates" (grievances get real teeth)
Follow-through on v0.29.0's faction grievances, from the observation that a rapidly-built realm still
coasts the mid-game: the estates now cost you where it matters, and you can see it coming.

### Added
- **Grievances are legible on the board.** The Four Powers panel now reads a festering estate in
  rubric with an escalating warning line — *Restless → Seething → On the brink* — keyed to the same
  grievance thresholds that drive the tells and the strike. A player squeezing the commons or starving
  the faith now sees the uprising coming in the panel they read every turn, not only in a chronicle
  margin. UI-only; the sim and determinism are untouched.

### Balance
- **A festering estate withholds its recognition of the Crown — legitimacy now has a competing drain.**
  The standing QA gap was that legitimacy only ever accumulated: a coasting reign banked it from works
  and cards and, with nothing pulling it down, sat near 100 and could not be deposed (measured: an
  unmanaged reign endured on 28/30 seeds, legitimacy 78–100 regardless of gold). Now a **seething**
  estate bleeds −1 legitimacy/season and an **on-the-brink** one −3, past a ~year-5 maturity gate —
  pressure gold cannot pay off, only warming the estate stops it. Accrual also widened so a *merely
  neglected* estate (disposition < 38, not just an actively-hated one < 30) slowly festers, making
  estate cultivation the scarce attention a fast-builder must actually spend.
- **Effect:** the unmanaged auto=0 seed sweep drops from 28/30 → 27/30 enduring, but — more to the
  point — depositions now land at **reign-years 35–36 (mid-game)** instead of only 41–43, and every
  substantial builder reign now meets **1–7 uprising crises** (court risings, interdicts, river-strikes,
  overreach) it must spend gold and attention to weather. Competent, attentive play still endures — the
  teeth bite neglect, not good governance. The drain is gated (`GRIEV_DRAIN_GATE`) and bounded/clamped;
  a reign that keeps its estates warm pays nothing and is byte-identical to before it festers.

### Tests
- `tests/grievance-check.js` §7 covers the gated legit drain (seething −1, on-the-brink −3, nothing
  before the gate or below seething, clamped at 0). Full suite green: 13 standalone tests pass, all 17
  harness plans endure with 0 anomalies and byte-identical determinism; assassination rarity stays in
  band (47.5%).

### Fixed
- **Mobile: the works build bar no longer towers below the map.** The v0.27.2 change moved the works
  panel into a bar beneath the map (desktop), but on a phone the build grid still collapsed to a single
  column of ~30 buttons — an ~1800px tower that pushed the ledger, Four Powers, and Whispers far below
  the fold, so the "bar under the map" never read as one. Below 900px the build grid now packs into
  dense auto-fill columns (≈3 on a phone) with a capped, scrollable height, so it reads as a compact
  build bar spanning the map's width with the realm panels reachable right beneath it. CSS-only —
  `game.js` byte-identical, sim untouched; verified by rendering the real page at a 390px viewport.

## [0.29.0] — 2026-07-11 — "The Estates Keep Score" (faction grievances + uprisings)
Addresses a real balance gap: a realm built up fast could coast the midgame, because legitimacy was
the only thing an estate could truly cost the Crown — a high-legit, wealthy reign felt secure no
matter how it treated its lords, its faith, or its guilds. Now the three domestic estates track
displeasure and, if left to fester, come after you. Pure integer bookkeeping over the four seeded
streams — no new RNG.

### Added
- **Faction grievance clocks (`S.factions[k].grievance`, crown-mode).** Each season, sustained
  contempt (disposition < 30) builds an estate's grievance; real regard (≥ 45) cools it. It is
  **always foreshadowed** — two escalating margin tells (the lords sending apologies instead of
  seconds; parishes ringing no bells; the League's barges riding at anchor) — and **always avoidable**:
  warm the estate and the clock decays before it can strike. A reign that keeps its estates above
  contempt accrues nothing, so the system is sim-identical to a baseline reign until an uprising fires.
- **Three uprising events with teeth** (raised when a grievance matures past ~year 7):
  - **The Table Draws Its Knives** (court) — the lords back a claimant: ransom the peace (a great sum),
    ride them down (a legitimacy gamble), or grant their charter (a permanent authority tax).
  - **The Interdict** (church) — the Concord shuts the rites: submit and endow, defy it (a lingering
    interdict that bleeds legitimacy and piety each season until the Concord thaws), or go over the
    priests to the wards.
  - **The River Stops** (commons) — the League shuts the river: concede the tolls, break the strike by
    force (a prosperity crater), or wait it out (trade and tolls run at **half for ~9 months**).
- **The Reach Exceeds the Grasp** (`overreach`) — a new mid-game letter that meets exactly the
  fast-builder: a realm with ≥ 6 works and high prosperity is asked to pay for the hands to hold up
  what it raised too fast (staff it, let it settle for a prosperity dip, or draft the labour and anger
  the commons).
- **`state()` surfaces `factions[k].grievance` only once it is non-zero** — a festering estate reads as
  a warning to the player and to agent drivers; an untroubled estate omits the field, so an uncommitted
  reign's `state()` stays byte-identical to its pre-grievance baseline.

### Balance
- The estates are now a live axis of difficulty independent of legitimacy: you cannot bank legitimacy
  and ignore a bloc you have been squeezing. A faith-starving reign meets recurring interdicts; a
  commons-squeezing reign meets the river-strike; an over-built reign meets the maintenance bill. The
  assassination auto=0 rarity sweep stays in band (measured 32.5%; the estate uprisings, auto-answered,
  tend to appease and slightly *lower* the murder rate).

### Tests
- New `tests/grievance-check.js` (accrual/decay, foreshadow-then-strike, each uprising's teeth and
  lingering flag, the river-strike economy cut, the interdict self-lift, succession reset, crown-only)
  and `tests/plans/grievance-commons.json`. Full suite green: `node --check` clean, all 13 standalone
  tests pass, all 19 harness plans endure with **0 anomalies** and byte-identical determinism. Plans
  where no estate festers are sim-identical to the pre-grievance baseline (only the new `grievance`
  field surfaces); plans that trip an uprising change by design.

## [0.28.0] — 2026-07-11 — "The Knife and the Book" (Wave 5: Standing Leverage + Doctrines)
Two mechanics from the Wave-4 comparative-research backlog,
shipped together. Both obey the sim's iron law — a pure function of (seed, action log) over the four
seeded streams — and neither draws a new random number.

### Added
- **Standing Leverage — the `[Knife]`.** A discovered compromise the Crown chooses to *hold* instead
  of spend now becomes a standing fact it can draw on later, on something unrelated (CK3 Secrets, per
  the R4 report — Pillar 3: the world underplays its hand). A council holder unmasked but left in his
  chair, or a hidden society named but not dragged into daylight, mints a hook — derived from existing
  state at the one choke point every decision passes through (`resolveCard → syncLeverage`), so a
  baseline reign that unmasks no one and names no order mints nothing and stays byte-identical. A hook
  surfaces as an *extra* option (`[Knife] …`) appended to any of **8 existing letters** spanning war,
  coin, faith, and diplomacy (`ultimatum`, `famine`, `flood`, `writ`, `scroll`, `heresy`, `toll-farm`,
  `peace-cost`) — leverage delivered instead of treasure, then burned. One-use; voided when the seat is
  vacated or the society is exposed; cleared on succession. Spending logs its **own** action type
  (`'k'`) so appended buttons can never desync a replay, and it lands on the Last Leaf as a defining
  moment. Crown-mode only in v1.
- **Doctrine Choices — once-per-reign, mutually-exclusive identity commitments** (Frostpunk's Book of
  Laws, per R4 — Pillar 1). Each axis grants power through opposite means and shuts the other doors for
  good, and the road not taken stays visible in the record (Pillar 2). Two flagship axes plus a third:
  - **The King's Peace** (justice) — the *Ashen Assize* (crown-as-law: hard legitimacy + a deposition
    floor of 20), the *Common Charter* (commons-as-law: a beloved League, the Crown's own hands tied),
    or the *Table's Compact* (lords-as-law: a warm court, a ceremonial crown).
  - **The Endowment** (altar vs coin) — the *Concord's Rule* (piety floored, income taxed for candles),
    the *Mint's Charter* (trade freed, +12% works income, the Concord going cold), or *keep both at
    arm's length*.
  - **The Muster Law** (standing army vs levy of need) — the *Iron Levy* (upkeep +25%, a watched
    border) or the *Free Companies* (no standing cost, a border that ripens faster).
  - Doctrines arm on **pure state predicates** (a visibly-tilted realm; a rich-or-pious one; a
    war-scarred one), commit permanent bounded seasonal drift (±1 faction/season), and add their own
    reign-verdict epithets (`the Lawgiver`, `the Beloved`, `the Figurehead`, `the Coiner`, `the Iron`,
    `the Sellsword's Crown`) and a Last-Leaf clause naming the law kept and the road foreclosed.
- **`window.annals` surface:** `annals.hook(cardId, on)` spends a `[Knife]`; `annals.leverage()` lists
  held knives; `state()` now carries `doctrine`/`leverage` **only once committed/minted** (an
  uncommitted reign's `state()` JSON stays byte-identical to its pre-Wave-5 baseline). Harness/plan
  vocabulary gains `[week,"k",cardId,on]` for a hook spend; the in-browser `replay()` dispatcher and
  the harness both resolve a pending letter by a `'c'` **or** a `'k'`.

### Changed
- **Reign-verdict rebaseline (assassination sweep):** the assassination *mechanism* — earned grudge,
  tenure gate, foreshadow-then-strike — is unchanged (verified by `tests/assassination-check.js`
  §1–§4). But a committed doctrine is sustained court/economy pressure for the rest of a reign, so the
  aggregate murder rate on the unmanaged auto=0 seed-sweep rose from ~30% to ~35% (representative
  rotating choices) up to ~42% (auto=0 always commits the harshest option). `§5`'s band was widened to
  the doctrine-era `0.25–0.50` with a documenting comment; `§6`'s pinned "firing reign" moved from a
  seed a doctrine reshaped off its strike (1000) to one that still fires (3231).

### Fixed
- The Last Leaf's doctrine clause interpolated the road **object** (`[object Object]`) instead of its
  text — caught by `tests/doctrine-check.js` §6 before it could reach a composed page.

### Tests
- New: `tests/hooks-check.js` (minting from all six sources, spending on each of the 8 letters, the
  three void/clear rules), `tests/doctrine-check.js` (commit each axis, seasonal-drift direction,
  income/upkeep multipliers, the assize deposition floor, every verdict epithet, the leaf clause), and
  plans `tests/plans/hooks-spend.json`, `doctrine-mint.json`, `doctrine-assize.json`.
- Regression gate green on all 16 plans: `smart-builder`/`militarist`/`tier-climber` endure to yr50,
  **0 anomalies**, byte-identical determinism double-run, and a captured reign with a `'k'` spend
  replays byte-identically through `replay()`. Plans that cross a doctrine trigger stop at the new
  letter by design (the enumerated rebaselines in the spec §2.7); plans that don't are byte-identical.

### Changed
- The build bar (Works of Stone & Water) now spans the bottom of the map instead of stacking in the
  right ledger rail. In the old layout a full works list ran the right column long, pushing the Four
  Powers, Whispers, and the Chronicle down the page so a player had to scroll away from the map to
  read them. Works — and its noble-mode twin, Petitions — moved into a new left column beneath the
  map; the build grid widened to auto-fill columns across the map's width; the ledger rail now sits
  fully visible beside the map. HTML/CSS only — no change to `game.js` or the sim (determinism +
  `--check` re-verified; runtime confirmed in-browser).

### Docs
- README refreshed to v0.22 (all systems, both play modes, current regression expectations, the
  `window.annals` + test-driver surface); removed a stray `out.json` scratch file.
- `docs/roadmap.md` now opens with a **Last Leaf showcase render** (`docs/last-leaf.png`) — the actual
  composed manuscript page from a full reign, showing every shipped system on one page.

## [0.27.1] — 2026-07-10 — "In Which Hand" (setup-mode fix)
A bug from the first human browser playtest: a Minor-Noble reign appeared to route its decisions through the
Crown. The harness had proven the sim clean (v0.25.0 gating, sovereign cards 24→0 pre-ascension), so
the fault had to be in the browser-only path — and it was, but not in the sim. It was the **setup
screen**. The old one-screen flow drew both route toggles *and* both throne buttons at once, with
crown as the silent default and no `.choice.on` style to show which toggle was live; a player could
reach a throne button ("Take the throne as King") and begin a *crown* reign — cold-chair opener,
crown option text — without ever committing to a route. The decisions then correctly ran through the
crown deck, because the reign had genuinely started crowned. `finishSetup`, `openingCard`, and
`showCard`'s `oN` resolution were all correct; the defect was letting a reign begin in a mode the
player never chose. Verified with a functional-DOM repro that drives the real setup clicks and the
`tick`/`showCard` render path: a properly-selected noble start draws `nb-first-suit`, renders `oN`
option text, and shows zero pre-ascension crown-text leaks.
### Changed
- **Setup is now two steps, and the route locks the mode before any title exists** (`showSetup`
  restructured; no sim, no card, no state-shape change). Step 1 asks *in what hand this chapter
  begins* — **The Crown** or **Minor-Noble (Regency)**, one house-voice line each. Step 2 rebuilds the
  panel for the chosen route only: the ruler-name entry plus that route's titles (Take the throne as
  Queen/King, or Begin as Dame/Sir of the seat town), with a "← Begin another way" affordance back to
  the route pick (the typed name persists). There is no longer any way to click a throne without a
  committed route, so a reign can only begin in the mode the player chose. Same `.choice`/`.from`/
  `<input>` markup and CSS as before — each step fully rebuilds the letter panel (`innerHTML=''` +
  `appendChild`), so the old panel-level `querySelectorAll`/`remove` juggling (and its dead
  `[data-throne]`/`[data-mode]` hooks) is gone.
### Replay & determinism
- `finishSetup(title,name,mode)`'s signature and the `[0,'m','noble']` action-log entry are unchanged,
  and the sim's draw order is untouched, so **existing history links and saves replay byte-identically**
  (crown and noble). Confirmed: smart-builder + militarist full-output diff vs the pre-change baseline
  is identical; noble-regency identical; seed-3030830 worldgen identical; determinism double-run
  (crown + noble) identical.
### Tests
- New `tests/setup-mode-check.js` (14 assertions) drives the real setup DOM and render path: the route
  screen offers no title/throne button before a route is chosen; the noble route locks `S.mode='noble'`
  and draws `nb-first-suit` (not cold-chair); `showCard` resolves `oN` in the browser render path (an
  `oN` card shows noble option text); and the crown route is unaffected (cold-chair opener, crown
  option text, no `["m"]` log entry). Full regression: 13 plans + raid/assassination/council/noble
  drivers + all standalone checks, 0 anomalies. No plan rebaselines needed.

## [0.27.0] — 2026-07-10 — "The Knife at the Table" (council assassinations)
The session's headline ask: a council seat-holder can be murdered by the people his tenure wronged. The
design rule is **grudges are earned, not rolled** — no die decides that a councillor has enemies;
his record does. A Marshal who loses the realm's wars and lets frontier towns burn, a Treasurer
whose hand is on the debasement lever and the toll-farms, a Spymaster who drags a hidden order into
daylight (an exposed society keeps the sharpest knife) — each accrues a per-holder `grudge` counter
at the exact sites where the anger is made. A freshly-seated councillor has none; a new reign's
council starts clean. Rare by construction: ~30% of unmanaged 50-yr reigns see one murder, hard
cap two.
### Added
- **Per-holder grudge, earned at the real sites** (`grudgeAdd`, pure bookkeeping, zero RNG):
  Marshal ← a lost/bought peace (`endWar(false)` +3) and a frontier town sacked by raiders (+2);
  Treasurer ← every `strikecoin` debasement (+2); Spymaster ← every `exposeSociety()` (+4). A small
  central `GRUDGE_CARD` map (the `socWitness` idiom, one call in `resolveCard`) adds the fiscal/war
  letters — `false-coin`, `toll-farm`, `coast-bankers`, `war-reckoning`, and the v0.26 decadence-era
  levers `la-great-debasement`/`la-fat-tribute`/`la-river-lease` — so no card body needed editing.
- **`tickAssassination()` — one annual site, the `tickCouncil` idiom exactly** (crown-only, wk%52===48,
  after `tickDecadence`). Two-phase: the year a matured seat (tenure ≥ `ASSASSIN_TENURE` 416wk ≈ yr8,
  grudge ≥ `GRUDGE_MARK` 6) first crosses the line, it is *marked* and the monk sets down a quiet
  margin tell ("The Treasurer has taken to tasting his wine twice, and to naming no one when asked
  why." — 3-variant `chVary` pools per seat) — **no draw that year**. Only a seat marked in a PRIOR
  year is ever drawn against, so the tell always precedes the strike by ≥1 year. Below the mark:
  **zero RNG consumed** — a reign that angers no one is byte-identical to the v0.26 stream (proven:
  seed-3030830 shared-state identical to old build at wk410; worldgen `W` byte-identical). Strike
  chance `min(0.22, 0.045+(grudge−6)×0.017)` on the single `rHist` draw; `assassinDone` hard-caps 2.
- **The Empty Chair** (`council-assassinated`) — the death lands as a letter weighted like a defining
  event (`moment()` w9 at the strike; the chair empties through the normal `vacate()` →
  re-appointment flow before the letter is even read: the Crown is deciding what to do about a
  murder, not whether one happened). Three real answers: **hunt the hand** (gold; craters the guilty
  estate −14 and, if a hidden order fronted it, `exposeSociety()` — the truth reaches the Leaf);
  **blame the convenient enemy** (fast +5 legit, the innocent party angered, and the lie is recorded
  through `chronCrown`'s gilded/truth two-layer if the scriptorium is funded); **bury it** (court
  stability now, an emboldened-plotter grudge nudge + a scheduled late legitimacy bleed later).
- **The Spymaster twist**: when the victim IS the Master of Whispers, the hunt option is degraded in
  cost and yield — double the coin, no named hand, no crater, only wardens "tired, and half-sure, and
  unwilling to swear to any of it" (the eyes that would look are closed).
- **`assassinHand()`** — who holds the knife is derived, never drawn: the estate the seat's tenure
  angered most (coldest relevant disposition per seat), with an exposed society preferred as the
  named hand when it fronts that estate, and the spymaster's killer preferentially an order he bared.
- **`tests/assassination-check.js`** — 27 assertions: grudge accrues at the real sites and a fresh
  seat has none; tell precedes strike by ≥1yr and never before wk416; the death is a Leaf moment and
  vacates before the letter; vacate→re-appoint flows and the replacement starts clean; the spymaster
  twist costs more and finds less; the rarity band (12/40 seeds = 30.0%, all three seats represented);
  pre-mark double-runs byte-identical and a firing reign (seed 3231) replays bit-identically.
- `state()` council holders gain `threatened:true` once marked — the tell is public — and
  `S.assassin` carries the unresolved murder (cleared on succession; a new reign starts unangered).
### Verification
- 12 regression plans + hoarder + raid-check: **0 anomalies**; every committed standalone test passes
  (council-test 29/29 untouched). `smart-builder --auto=0` endures yr50 on 3030830 AND 90210.
  `--auto=1/2` loss windows unchanged to the year (conquest yr38/45/39, deposed yr37/35/37 on
  3030830/90210/717717). Determinism double-run full-output identical (smart-builder + hoarder).
  Seed-3030830 worldgen byte-identical; noble-attainder (never ascends) full-run identical —
  `council-assassinated` is in `NOBLE_EXCLUDE` and the tick is crown-gated.
- **Rarity sweep (unmanaged --auto=0 to yr50, 40 seeds):** 12/40 reigns = **30.0%** (target 25-35%),
  per-seat marshal 3 / treasurer 6 / spymaster 3, zero fires before a tenure earned its grudge
  (tenure gate + mark-then-strike enforced structurally). Unmanaged endurance unchanged: 38/40 = 95%
  on the sweep set under BOTH builds — the knife pressures the room, it does not depose the reign.
- Marked-seat reigns legitimately drift the `rHist` stream (that is the draw); unmarked reigns are
  byte-identical. No plan file needed rebaselining.

## [0.26.0] — 2026-07-09 — "What a Hoard Is For" (a late-reign that bites)
E2E play pass 4's lead finding: **the third act sags.** The Opus critic (seed 90210, 50-yr Crown,
8.5/10) named it — the reign peaks in its middle and coasts to a foregone Magnificent. Two failures,
both reproduced headless: (a) the deck recycles into rubber-stamps — the final decade of a settled
reign was `famine×5 / the-charcoal×3 / toll-farm×3 / rebuild×3`, "answered identically by a settled
ruler," with nothing NEW arriving after year 38; and (b) gold is meaningless — `smart-builder --auto=0`
endured with **22,207** in the strongroom, every "300 gold" cost free against the hoard. This release
makes a rich, serene, aging reign dangerous *from the inside*.
### Added
- **The late-reign pool — 14 `la-*` set-pieces**, gated year ~38+ /
  wealth / pinned-stat, each a peril the reign's own success grew: the Overfull Court, the Gilded
  Progress, Who Closes Your Eyes, the Heir's Party and the Court's, the Embassy to the Heir, the Reach
  Reckons Your Rolls, the Coast Buys In, the Saint in the Chair, the Authorized Annals, the Monument,
  the Guilds Convene, the Thin Coin, the Novice at the Desk, the Tithe Barns. **Every cost is a % of
  treasury or paid in legitimacy / heirs / council loyalty** — a rich ruler cannot buy the clean exit.
  Long `re:` cooldowns (≥260wk) make them once-or-twice-a-reign, so they can't themselves repeat. Voice
  measured against `the-ninth-clerk` / `royal-saint` / `regent-ambition`; the `chronCrown` gilding→
  correction two-layer and the Last-Leaf `moment()` candidates both fire. New optional `g()` card field
  read only by the late-pool wiring — existing cards default true, so regression is untouched.
- **`tickDecadence()` + `decadenceTier()` + `S.opulence` — wealth as a compounding liability.** A
  zero-RNG, state-derived annual pressure (crown-only, sampled wk44 after the autumn settle), modeled on
  `tickCouncil` but drawing **no RNG at all** — pure integer bookkeeping, so it is **replay-safe for
  saved history links**. A hoard that only *grows* accrues `opulence` (0→8, tier 0..3); a treasury spent
  down any year recedes it — the growth gate `gold ≥ _goldLastYear` is the discriminator, copying
  `councilNeglect`'s spend-reading philosophy. Teeth engage only at tier≥2 (a −1/−2 court nudge, a tier-3
  legit tick, and the monk saying so in the margins) — a small headwind an attentive reign sails through
  and a coasting one accumulates. **No stat is driven to a floor: the pressure demands answers, it is
  never an undodgeable drain.** Constants: `HOARD_LINE=6000`, `DECADENCE_COURT=1`, opulence cap 8.
- **The Tithe Barns lever** (`la-tithe-barns`, armed by a one-line `S.flags.overspilled` hook in
  `weeklyEconomy`'s spoil block) — the answer the review begged for to the granary-cap-2 non-choice
  narrated every autumn. Gives the overflow to the Concord / the commons / the muster; the autumn-rot
  line becomes *"the realm smelled, that autumn, of bread instead of rot."* Self-suppressing: gates on
  `overspilled`, so it only surfaces where the rot is actually happening.
- **`tests/plans/hoarder.json`** — a high-tax, low-build reign that hoards to **tier 3** and proves §2:
  `--auto=2` reaches `opulence 8`, court decays 34→10 under the teeth, the monk names the rot from yr43,
  and the reign still **endures** — pressure that demands answers, not deposition.
### Changed
- **`maybeFire` ambient roll** concats the open late-pool ids (each filtered by its `g()` gate) into the
  SHARED `pick(rHist,amb)` candidate list at `yearNum()>=38` — the "Piety with Teeth" idiom exactly:
  **no new draw, total letter frequency unchanged**, only *which* card the existing pick selects. A hoard
  weighs the pool heavier (`decadenceTier()>=1` doubles it, `>=3` trebles it), so a fat coasting reign
  meets the perils oftener — the late-reign variety the third act was missing.
- **`NOBLE_EXCLUDE`** extended with all 14 `la-*` ids: the late pool is sovereign-scale, so a *climbing
  knight never sees it* (verified: a never-ascending climb draws **0** `la-*` while `nobleClimbing()`).
  Once a knight **ascends** (`S.mode='crown'`), the pool unlocks — an ascended sovereign correctly gets
  the third act, so `noble-regency` (which ascends at wk413) legitimately shifts post-ascension while
  `noble-attainder` (never ascends, ends yr36) stays **byte-identical**.
### Verification
- Guardrails hold on both rich seeds: `smart-builder --auto=0` **endures yr50, 0 anomalies** on 90210
  (22,207→17,160 gold — now spending on the perils) and 3030830; `--auto=1` still loses in-window
  (conquest yr45/90210, yr39/717717), `--auto=2` still loses in-window (deposed yr35/90210, yr37/717717).
- **Third-act variety, seed 90210 `smart-builder --auto=0` (the critic's mode):** final decade went from
  **0** `la-*` cards to **13 distinct / 18 total, no id >3×** (opulence reached tier 2). All 12 regression
  plans + raid-check report **0 anomalies**; determinism double-run identical on 3030830 (crown) and
  90210, and on the `noble-regency` (noble) plan. Worldgen (seed 3030830) untouched — no `genWorld` edit.

## [0.25.0] — 2026-07-09 — "Outside the Room" (noble-mode ambient gating)
E2E play pass 4 caught the Regency mode contradicting its own thesis: a landed knight was personally
appointing the realm's Marshal/Treasurer/Spymaster every ~50-60 weeks and setting crown diplomacy for
70-80% of climb turns — decreeing, in a mode whose whole premise is *you cannot decree; you can only
ask*. The ambient deck fired ungated. Now a climbing knight is shut out of the sovereign's room, and
the AI crown acts offstage; the dread of the mode is being outside the room, not running it.
### Added
- **`NOBLE_EXCLUDE`** — the full set of sovereign-scale letters (council appointments and their
  disloyalty arcs, realm diplomacy / the Reach / royal weddings / hostages, the mint, realm tolls,
  the Concord's writ, realm justice over wandering figures, the supernatural realm-threat, the
  crown succession, and the chancery/exchequer uncanny) plus `nobleClimbing()`/`nobleGated()`. Every
  check rides behind `S.mode==='noble' && !ascended`, so **crown reigns are byte-identical** (verified:
  smart-builder/militarist/sworn-discovery diff clean vs the pre-change baseline).
- **`crownSeatsCouncilOffstage()`** — the world does not freeze. The AI crown seats its own council
  offstage at weeks 6/10/14, **deterministically** (first candidate, drawn at worldgen — no new RNG
  stream), and the knight learns of it as rumor: *"Word reaches Dame Vael that the Ashen Table has
  named a new Marshal. Nobody asked the knight of Oskwick."* Rare by construction (three seats, once).
- **Rider A — petition opacity.** When a petition fails primarily because the **claim** (`S.legit`),
  not the crown's disposition, is the bottleneck, one margin says so in-fiction: *"The crown's answer
  was courteous. The claim it answered was too slight to feel."* Triggered off the dominant shortfall
  below a neutral 50, using `crownAnswers()`'s own weights. No new RNG.
- **Rider B — agent API.** `window.annals.choices()` (and the harness's `pendingLetter`) now expose the
  pending card's **`id`**, so agent players no longer grep source for ids like `ex-plagueship`.
  Display/API only. Harness auto-choice now sizes its modulo to the mode-resolved option set (`oN`).
### Changed
- **`maybeFire` ambient roll** pre-filters `NOBLE_EXCLUDE` **before** the `pick(rHist,…)`, so a climbing
  knight draws a real local/personal letter instead of a wasted slot; `queueCard()` also drops gated
  ids as a belt-and-suspenders net (catches threat eruptions, variant cards, `rebuild`, `writ`, and the
  sworn-discovery loop, which is now crown-gated). Cards with an `oN` re-read — `ultimatum`, `book`,
  `tourney`, `duel`, `cradle-crown` — are **never** excluded; they are the mode's best moments and
  still fire. The Small-Council block mode-branches: offstage in noble, the existing appointment +
  disloyalty triggers in crown (so their flag side-effects never fire for a knight). Verified: a 50-yr
  noble reign offered **24 → 0** sovereign cards pre-ascension, and everything unlocks again after
  `ascend()` (44/45 post-ascension). Noble stream consumption legitimately shifts; crown is untouched.
- **`tests/plans/noble-attainder.json`** re-tuned (the excluded cards shifted the noble stream, so the
  fixed action log desynced from `endured`→needed re-fixing): the arc now grasps the regency and refuses
  to return the crown on a fast schedule (`nb-the-minority` "hasten", `nb-regent-named` "the boy's health
  a matter of prayer") so `nb-crown-in-trust` finds the powers won't back the claim (church 43 < 45) and
  `endGame('attainted')` fires at yr36. `noble-regency.json` and `tests/noble-driver.js` (22/22) needed
  **no edits** — the nb-* arc is schedule-driven and unaffected by ambient gating.

## [0.24.0] — 2026-07-09 — "The Restless Council" (loyalty as recurring pressure)
Council loyalty was a one-time worldgen gamble: only ~12% of seeds ever saw a seat fall, and an
unmanaged reign coasted (QA pass 2's `--auto=0` softness). Now a **loyal-at-worldgen seat can rot
into a compromised one mid-reign** under years of neglect, and the fall raises the *existing*
disloyalty arc — no new content, just a live pressure where there was a static roll.
### Added
- **`tickCouncil()`** (called from `maybeFire` right after `tickRaids`, crown-mode only). Once a year,
  after a four-cycle warmup, the most-neglected still-loyal seat is tested against **one seeded
  `rHist()` draw** scaled by a state-derived neglect scalar. On a hit the seat's hidden loyalty flips
  to the estate it has quietly gone over to (`compromisedLoyalty()` — the coldest faction, or the
  Reach), and `chain` is left at 0 so the **existing** `maybeFire` trigger raises the **existing**
  skim / missing-third / leak arc. The arc, the flags (`marshalSkim`/`spyLeak`), the verdict cards,
  and the re-appointment on `vacate()` are all reused unchanged.
- **`councilNeglect()`** — a pure state → scalar: thin legitimacy, debt (unpaid stipends), a ripening
  border/wood/rot clock, and a cold estate all push a council to drift; a university/guildhall/
  cathedral/mint/market, informants or a warden keeping it watched, and a full purse all bind it.
  (Legitimacy is a weak signal — cautious auto-play keeps it high — so **institutions and attention**
  do the discriminating between a tended reign and a coasting one.)
- **Quiet early tells** (`COUNCIL_TELL`, chosen by the v0.23.1 `chVary` state-hash, no render-time
  RNG): the margin turns watchful the year a seat rots — "the Treasurer dines where the Crown's money
  is spoken of in a foreign accent" — years before the arc erupts. A high-neglect year that does *not*
  flip still drops a quieter version, so a rotting council is felt in the margins.
### Consumption site (determinism)
- The **only** new seeded draw is the single annual `rHist()` in `tickCouncil`, taken at one site,
  mirroring `tickRaids`'s scheduling draw. Consuming a shared stream shifts later draws (so pre-0.24
  crown action-logs won't replay bit-identically — the standing sim-feature caveat), but the sim stays
  fully deterministic given (seed, log): **double-run bit-identical** on `smart-builder`, `militarist`,
  and a flipping reign (seed 1234). **Seed 3030830 worldgen is byte-identical** (worldgen is `rWorld`;
  the warmup means the two council golden plans — appoint wk60, disloyal wk120 — draw nothing new).
  **Noble mode draws nothing** (crown-only) and stays byte-identical.
### Verification
- All **12 regression plans** endure/resolve with **0 anomalies**; `raid-check` PASS. Standalone
  suite green: `council-test` (29/29, unchanged — the golden plans predate the warmup),
  `noble-driver` (22/22), `sworn-driver`, `leaf-check`, `stone-and-road-check` (20/20),
  `scriptorium-check`, `king-crash-check`, `scorch-persistence-check`, `voice-polish-check`.
- **`--auto=1/--auto=2` still lose in-window:** 3030830 conquest yr38 / deposed yr37; 717717 conquest
  yr39 / deposed yr37 (all inside years 35–45).
- **Mid-reign compromise rate** (empty-plan `--auto=0` unmanaged vs `smart-builder --auto=0`):

  | Cohort | Seeds | Saw a mid-reign compromise | Endured |
  |---|---|---|---|
  | Unmanaged (empty, `--auto=0`) | 25 | **10/25 (40%)** | 21/25 (84%) |
  | Managed (`smart-builder`, `--auto=0`) | 12 | 3/12 (25%) | **12/12 (100%)** |

  A neglected council rots into the target 35–55% band; a built, watched realm shrugs off the
  occasional turn and never falls to it. `--auto=0` endurance (84%) stays well above the 60% floor.
### Notes
- **`tests/sworn-driver.js`** got a minimal robustness fix (not a golden change): its phase 3 relied on
  ambient witness cards alone to push society suspicion from `suspected` (30) to the discovery
  threshold (60) *after* it stopped paying informants — timing that any seeded sim feature (raids in
  v0.23, this council pass in v0.24) legitimately shifts. It now keeps informants paid until the
  discovery is armed — the **designed** path to exposure — so the letter fires regardless of
  ambient-deck alignment. All original assertions unchanged and passing.

## [0.23.1] — 2026-07-09 — "The Variety Pack" (chronicle line-repetition, display-only)
A re-readable chronicle was being undercut by a handful of annual lines that fired ~20× a reign with
only the numbers changing. This pass gives the worst offenders a small pool of hand-written monk-voice
variants chosen by a **pure state hash** — no RNG stream is drawn, so sim state, RNG cursors, and the
bit-identical replay of saved reigns and history links are all untouched. Only the prose gets richer.
### Added
- **`chVary(pool, key)` + `chFNV(str)`** (inserted after `monkAside`) — an FNV-1a state-hash line
  picker using the same `0x811c9dc5`/`0x01000193` constants as `hashName()`. Draws **nothing**; the
  same mechanism the escalating threat-whispers and woodcut portraits already use.
- **12 rewritten chronicle sites, each 5 variants** keyed to a stable state key (year, week, or town
  name): the year-end summary, the autumn reaping, the loft-spoilage line, the barges-by-dark margin,
  the cold-court legitimacy leak, the "Work began upon" build frame, the royal-progress line, the
  famine-relief line, the gray-herald tribute, and the city-promotion line. The build-frame variants
  all preserve the literal `the masons swear <N month(s)>` clause so `voice-polish-check` L3 still holds.
### Changed
- **`socCreepLine(id, t)` → a 3-stage escalation** keyed to the influence threshold crossed (25 / 50 /
  75), so a tightening secret society reads darker each stage — the `whispers[]` stagecraft applied to
  the invisible fourth clock, killing the 3×-same-line repeat.
- **The "private tally of coincidences" margin** now gives each society (congregation / cabal /
  restoration) its own observation instead of one shared line.
### Verification
- Display-only: seed 3030830's final `state` object is **byte-identical** before and after on both
  `smart-builder` and `sworn-discovery` (chronicle text differs, numbers do not). All 12 regression
  plans endure/resolve with **0 anomalies**; determinism double-run **bit-identical**. Standalone
  checks green: `voice-polish-check`, `council-test` (29/29), `noble-driver` (22/22), `sworn-driver`,
  `leaf-check`, `stone-and-road-check` (20/20), `scriptorium-check`, `king-crash-check`,
  `scorch-persistence-check`, `raid-check`.
- **Repetition audit** (Appendix A harness, `3030830 smart-builder --auto=0`): top template
  **20× → 5×**; the annual economy trio (year-end / reaping / loft) each drop from ~17–20× to ≤5×. No
  variety-pack template on the canonical seed exceeds 5× (the untouched `BLIGHT.` line is the lone 7×).
### Notes
- One spec anchor (§5.9 royal progress) was one closing brace short as written — its wrapped `{ … }`
  block added a brace level but the paste kept only the do()+comma close, dropping the build-object
  close. Corrected to `}}}` and verified by `node --check`. All other anchors matched uniquely and
  applied verbatim.
- On the pathological seed 7777 (a chronically cold court fires the legitimacy-leak line 29× vs 5× on
  the canonical seed), the top cold-court variant lands at 9× — above the ~6× aim, exactly the
  "unlucky hash spread, fix with a 6th variant or a different salt" case the spec pre-flags as tunable,
  not a bug. Left as specced.

## [0.23.0] — 2026-07-09 — "The Frontier Remembers" (Batch 5 — recurring raids)
Between the big wars, a bandit/border column now tries the frontier every few years, so the walls,
the beacon-chain, the garrison, and the sack→scorch→rebuild loop all stay live in peacetime instead
of sleeping until the next muster. A raid is a paragraph, not a chapter: it auto-resolves in one tick
and reuses the war model's own defence inputs and the same rebuild card the big war raises.
### Added
- **Recurring raids** (`resolveRaid`/`tickRaids`, driven from `maybeFire`). One column tries the
  border roughly every 2–5 years, **never during a war** (a raid due mid-war is deferred half a year),
  and **never during the noble climb** (the frontier is the Crown's to hold — noble reigns are
  byte-identical). The first raid waits 3–5 years and early-reign columns are gentler (no sack before
  ~year 6), so a young reign is never gutted by one.
- **Defence decides it, and the chronicle says so.** The outcome is a ratio of the *same* inputs the
  war code reads — the standing muster, the walls factor (`walls` ×2 / `bulwark` ×3), and the
  beacon-chain warning (`beacon` ×1.25 / `beaconchain` ×1.5) — against a small, prosperity-scaled
  column. A defended realm shrugs it off ("the beacon on the Graycrown Teeth burned before they
  crossed, and the column turned back"); a neglected one loses a granary, and an undefended one loses
  a frontier town outright — which burns to a persistent scorch and raises the existing **`rebuild`**
  card (the one small event a bad outcome may surface — reused, not forked).
- **Monk-voice variety.** 3–5 outcome-line variants keyed on outcome + defence, chosen by a pure
  state hash (no RNG at any raid, like the whisper stages), with a template-level guard so no two
  raids read the same sentence back to back.
### Verification
- All **12 regression plans** endure/resolve to their horizons with **0 anomalies**; determinism
  double-run **bit-identical** (`militarist`, `stone-and-road`). Unmanaged `--auto=1/2` still lose in
  years 37–39 on seeds 3030830 & 717717 (raids pull a neglected realm's fall slightly earlier — the
  intended pressure — still inside the 35–45 window). `noble-attainder` is byte-identical to baseline
  (attainted wk462); no plan or baseline needed changing.
- New standalone check **`tests/raid-check.js`**: plays a defended (militarist) and an undefended
  (empty, cautious) 50-year reign on one seed and asserts raids recur (≥3), never fire during a war,
  produce a paragraph, and that defence turns a sack into a repel (undefended sacked 4×, militarist 0×
  — all beacon-repels). PASS on seeds 3030830 and 717717.
### Notes
- Scheduling + column ferocity are the raid's only two `rHist` draws, taken together in one place.
  Consuming a shared stream shifts later draws (so pre-0.23 crown action-logs won't replay
  bit-identically — the standing sim-feature caveat); the sim remains fully deterministic given
  (seed, log). Seed 3030830 worldgen is unchanged.

## [0.22.2] — 2026-07-09 — Last Leaf polish (display-only)
Two cosmetic nits caught from the Last Leaf render (`docs/last-leaf.png`). Sim byte-identical to
v0.22.1 (every regression plan's final state unchanged; determinism intact).
### Fixed
- **"The the Wood-Congregation."** The society-exposure line prepended `'The '` to a society name
  that already ships the-prefixed (`the Wood-Congregation`, `the Cleaner Ledger`, `the Sworn of the
  Old Root`), so the record read "The the …". A new `theCap()` helper strips a leading article before
  capitalizing, handling both the-prefixed and bare names. Fixed at both call sites — `exposeSociety()`
  (the defining moment) and `leafJudgment()` (the closing note).
- **Near-duplicate burning moment.** Several cards each push a near-identical "they burned <wood>"
  moment (the Flame's remedy, the congregation's climax, taking the torch in hand); two could land in
  the top five and read as a stutter. `leafMoments()` now folds every wood-burning moment onto one
  signature (`burnSig`), keeping the strongest/earliest instance — the reign's burning is a single
  defining moment, and the freed slot goes to the next-best line. Selection is otherwise unchanged and
  fully deterministic (text signature only, no RNG).
### Added
- **Two-layer burning moment.** When the burning was gilded, its flattering rewrite lived in the gild
  block *and* its truth appeared as a moment — the same event, twice on the page. The folded burning
  moment now carries the gild, rendering as one two-layer line (the record's version over the truth,
  reusing the gilded-vs-truth treatment), and `leafData()` drops that gild from the separate block.

## [0.22.1] — 2026-07-09 — verdict variety fix
- **Fixed:** `reignVerdict()` returned "the Scourge" for nearly every reign — it triggered on
  `S.flags.burned`, but burning the wood (the wakening's near-universal resolution) happens in most
  20-year reigns, so it drowned out every other epithet. Now **the Scourge** means war destruction
  (`sacked>=3`); burning the wood is a low-priority **the Kindler** that only defines a reign nothing
  better describes. Verdicts now vary by playstyle (Steward / Devout / Builder / Miser / Magnificent /
  Faithless / …). Caught in playtest; display-only, sim unchanged.

## [0.22.0] — 2026-07-09 — "The Verdict" (polish)
Two display-only flavor enrichments from the comparative-games research.
### Added
- **The reign's verdict** (Suzerain-style). A pure `reignVerdict()` derives a single character-epithet
  for the ruler from the end-state alone — *the Steward, the Tyrant/Scourge, the Miser, the Devout,
  the Gilded* (bought his own good name), *the Faithless, the Builder, the Magnificent* (a wonder
  stands), *the Deposed/Undone*, or *the Steady*. It appears only at reign's end, woven into the Last
  Leaf's judgment and exposed in `leafData().verdict`. No RNG, no sim change.
- **Council asides** (King of Dragon Pass). A seated Marshal/Treasurer/Spymaster now comments on
  letters in their domain (war/coin/whispers), flavored by the holder's trait — so the council feels
  present between its own appointment and disloyalty cards. One aside per card, deterministic,
  display-only.
### Notes
- Both features touch only rendered text and the end-of-reign leaf; the sim is byte-identical to
  v0.21.0 (all crown regression plans unchanged).

## [0.21.0] — 2026-07-09 — "Minor-Noble Origin — Regency" (new mode)
A second way to begin. Where the crown game asks *what you did with power*, the noble game asks the
prior question — *how you got it* — and answers it entirely with systems that already exist. You
begin **Dame/Sir of one river town** (Oskwick, `towns[3]`): a household guard, a claim to the throne
that starts near zero, and a **sitting AI monarch you can never directly command**. You climb. This
release ships **one complete, winnable ascent — Regency capture** — plus all the shared
infrastructure the other two paths (marriage, usurpation) will reuse. Crown play is **byte-identical**
to v0.20.0: the mode is opt-in, and a reign with no `["m","noble"]` log entry runs untouched.

- **Reputation is the faction system, relabeled — no new state.** The four `S.factions[*].disp`
  values that read "how the powers feel about the Crown" now read "how the powers feel about the
  climbing knight." Same `fac()` calls, same `factionSeason()` drift, mode-aware panel labels
  (*Favor at the Ashen Table*, *The Concord's Blessing*, *Love of the League*, *The Reach's
  Interest*). A display-only `standing()` rolls the four into one headline, exactly as `prosperity()`
  rolls up ten towns. **Claim = `S.legit`, repurposed** (starts 8; each path pushes it to a threshold).
- **The AI crown is one scalar.** `S.noble.crownLegit` (starts 58) is eroded by the *same*
  `factionSeason()` pressures that would sink a player-crown — a cold court, a hated squeeze, a lost
  border, a bought peace. You position against a decline you can see but only indirectly hasten.
- **Petitions replace decrees.** A knight cannot decree; a knight *asks*. `PETITIONS` (market, muster,
  title, council) render where the sliders/builds panel was. **`crownAnswers()` answers yes/no with
  NO LLM** — a pure function of court favor + the served interest + your claim + the crown's own
  confidence, touching `rHist` only for close calls, in logged order. A refusal is content: a denied
  muster seeds the (deferred) usurpation path.
- **The Regency arc (~5 cards) reuses the most and adds the least.** `nb-first-suit` (the opener) →
  `nb-council-seat` → `nb-the-minority` → **`cradle-crown` re-read** (the card that already
  dramatizes *"a crown held in trust is a crown held by whoever holds the boy"*) → **`nb-regent-named`
  (pivotal, full monk voice)** → `nb-crown-in-trust`. Decline to hand the crown back, and if the Table
  and Concord still hold with you, **`ascend('regency')`** flips `S.mode` to crown and starts a fresh
  20-year reign on the same realm — the identical `continueAsHeir()` machinery that carries a dynasty
  across a succession. The ascent *is* the succession, pointed forward.
- **Losing is a chapter, read ascending (Pillar 4).** A claim of 0 is not a deposition — a knight has
  simply not risen yet (the `tick()` loss-check is now mode-gated). Overreach the regency without the
  powers behind you and the realm names you crown-thief: `endGame('attainted')`, then
  `continueAsHeir('attainted')` hands the seat to a kinsman who takes up the same climb. The reign
  clock expiring while still a knight reads as *"died a knight, having reached for a crown and closed
  a hand on a good town and a long grudge."*
- **Four ambient cards re-read from a knight's chair** via an optional `oN` option-array
  (`ultimatum` — your posture toward the Crown's war; `tourney` — you ride the lists; `book` — the
  smuggler's ledger is now *your* leverage; `duel` — the quarrel is *your* honor). Same card id, same
  situation prose, mode-selected options; the action-log index is unchanged, so replays are unaffected.
- **Determinism.** Mode is a logged action: **crown logs nothing** (absence ≡ crown, keeping every
  existing history-link and save byte-identical, seed 3030830 included), **noble emits `[0,'m','noble']`
  first**. `applyNobleSetup()` consumes no RNG; no fifth stream. Replay gains `'m'` and `'p'` branches;
  `openingCard()`, the loss-check, and `API.state()` are mode-gated (noble fields surface only in noble
  mode, so crown `state()` JSON is unchanged). **Verified:** all 10 crown plans byte-identical to
  v0.20.0's extract; noble reign double-run byte-identical.
- **Testable headless.** `harness.js` extended to drive noble mode (plan `"mode":"noble"` + `'p'`
  petition actions); `tests/noble-driver.js` (22 assertions) covers start-state, `crownAnswers` yes/no,
  a granted petition, `ascend('regency')`, and the attainted chapter; `tests/plans/noble-regency.json`
  rides the arc to ascension and `tests/plans/noble-attainder.json` to the scaffold.
- **Deferred to v1.1+ (scope-honest):** the **marriage** and **usurpation** paths (their pivotal
  cards are drafted in the spec), the world/foreign-patron accelerant, a full re-read pass over all
  ambient cards, the seat as a build-able mini-realm, and rival-claimant NPCs.

## [0.20.0] — 2026-07-09 — "Piety with Teeth" (systems + content)
v0.19.0 made piety *responsive* (it falls when the faith is neglected), but falling piety still had
almost no consequence: a totally god-forsaken reign (church disposition pinned at 0 for half its
length) coasted to `endured` with legitimacy climbing to 98. Piety was a number that moved and
changed nothing. This batch gives a neglected faith **teeth** — three layered consequences, all
gated far below normal play so a tended or moderately-cooled church (piety 40-100) is untouched, and
in fact **byte-identical** to v0.19.0. No new RNG stream; every seeded replay is deterministic.

- **Low-piety church-unrest deck (4 new cards, monk voice).** `apostate-wards` (the wards stop
  coming to the Flame — fund a mission, compel attendance, or let them keep their indifference),
  `the-false-relic` (a huckster's relic outdraws the cathedral — expose it, license and tax it, or
  do nothing), `concord-rebuke` (Mother Senna names the Crown impious from the cathedral steps —
  public penance, buy her silence, or let the charge stand; uses `chronCrown` so a gilding
  scriptorium rewrites the impiety), `hedge-preacher` (the commons prefer an unlicensed preacher to
  your bishops — give him a living, silence him and risk a martyr via `rHist`, or leave the parishes
  to rot). They enter the **shared** ambient roll only at `S.piety<40`, weighted heavier at `<28`
  and `<18` — so a faithless realm's letters turn faithless *without* raising total letter frequency
  (no card-spam spiral). Above 40 the pool is unchanged, so regression rolls are byte-identical.
- **Concord erosion (`factionSeason`).** At `S.piety<35`, the church disposition drifts down ~1/season
  — the faithful blame an impious Crown. Bounded (disp clamps at 0), and it never fires in moderate
  cooling (piety ≥35).
- **Abandoned-faith floor (`factionSeason`, church mean-reversion).** v0.19.0's `pietyTarget` floored
  at 40, so under total neglect piety could not sink below ~46. A genuinely abandoned Concord
  (disposition <30) now drags the target below that floor: `pfloor = 40 - max(0,30-disp)*0.9`
  (disp 0 → floor 13). Gated on disp<30, so any reign with a warm-or-cooling church (disp≥30) keeps
  the exact v0.19.0 target — regression byte-identical, moderate cooling self-corrects.
- **Legitimacy bleed at rock bottom (`factionSeason`).** Only at `S.piety<20`, `S.legit` bleeds
  1/season (2 below piety 12). Deliberately far beneath any normal church-cooling (30-70 never
  reaches it) and small enough that a *decade* of neglect erodes the mandate without an instant
  death-spiral. A cathedral's existing piety floor (45) immunises against all of the above.
- **Measured effect (seed 3030830, tithe=0 neglect driver `tests/plans/piety-neglect.json`).**
  *Before (v0.19.0):* piety coasted at 52, legitimacy climbed to 98, zero church-unrest content.
  *After, appeasing every letter:* piety craters to the mid-20s, church disposition to 0, all four
  unrest cards fire — the reign endures but the Crown pays gold and piety forever to hold the faith
  together. *After, neglecting only the church while tending court/commons:* piety sinks to 12-16,
  the `<20` bleed holds legitimacy at ~82-90 (vs 97-100 tended) — visible pressure, still endures.
  *After, neglecting everything (fester):* **deposed** at year 39. Piety is now genuine jeopardy.
- **Regression intact.** All ten `tests/plans/*.json` (incl. the new neglect driver) endure at seed
  3030830 `--auto=0` wk1040 with **0 anomalies**; the nine tended plans are **byte-identical** to
  v0.19.0 output; double-run byte-identical (determinism) re-confirmed. Cathedral plans still hold
  piety 100 by design.

## [0.19.0] — 2026-07-09 — "The Cold Altar" (balance)
The QA-pass-2 #1 finding: under `--auto=0`, piety pinned at exactly 100 on nearly every seed
(14/15 in this pass, 1 at 99) because the church season-tick was a one-way ratchet — a flat
`+1/0/-1` drift with no ceiling short of 100. Piety is now **mean-reverting, not a ratchet**: each
season it moves 10% of the way toward a target set by how the Crown tends the faith. One line
changed in `factionSeason()`; no new RNG stream, no change to card RNG order, so every seeded
replay is byte-identical.

- **Piety mean-reversion (`factionSeason`, church branch).** Replaced the drift
  `S.piety += (tithe>=12?1:tithe>=6?0:-1) + (shrine?1:0)` with
  `pietyTarget = clamp(40 + church.disp*0.4 + tithe*1.2 + (cathedral?15:0) + shrine*2, 0, 100)`
  and `S.piety += (pietyTarget - S.piety)*0.10`. A neglected Concord (cold disposition, thin tithe)
  can no longer sustain a pinned 100; an actively-tended faith (warm church, generous tithe, a
  cathedral) still can. The cathedral floor (45) and its `+15` target term are unchanged, as is the
  captured-congregation branch and the `tithe>=14 / tithe<=3` disposition nudges.
- **Measured effect (`--auto=0` empty plan, 15 seeds `3030830 1 2 3 7 11 42 100 777 1234 2026 5150
  9999 31337 654321`).** Piety-at-100 went **14/15 → 0/15**; piety now spans **91–99** across the set
  (tended-church reigns) and craters to **46–53** when the tithe is forced to 0 (church disposition
  falls to 0–6), i.e. it tracks the reign. Endings are unchanged (14 endured / 1 conquest): under
  `--auto=0` the Concord is genuinely well-tended (disposition 92–100 from option-0 answers), so the
  survival axis here is the court/legitimacy leak, not the altar. The ratchet is gone; the free ride
  on *piety specifically* is gone; the win-rate is deliberately not collapsed.
- **Regression intact.** All nine `tests/plans/*.json` endure at seed 3030830 `--auto=0` wk1040 with
  0 anomalies; cathedral plans (`tier-climber`, `stone-and-road`) still hold piety 100 by design.
  Determinism re-checked byte-identical (double-run) on four plans.

## [0.18.1] — 2026-07-09 — "A Cleaner Hand" (voice polish)
Three chronicle-quality fixes from QA pass 1. No sim/RNG
changes — text and one worldgen name-build only. Seed 3030830 replay is unaffected; the port's
cosmetic NAME changes (`" Seagate"` → e.g. `"Stoneford Seagate"`), an intended fix.

- **The `" Seagate"` name bug (L1).** `genWorld()` built the sea-gate port's name with an
  un-anchored greedy regex (`replace(/ ?.*$/,'')`) that erased the whole original name, leaving
  `" Seagate"` (leading space) — which rendered as a double space in chronicle text ("died at
  ␣␣Seagate"). Now `W.towns[5].name.split(/\s/)[0]+' Seagate'` keeps the first name-part →
  a real compound port name, no leading space.
- **"1 months" pluralization (L3).** `doBuild()` emitted `Math.ceil(weeks/4.3)+' months'`, so any
  4-week work (feast, scriptorium, warpath) read "the masons swear 1 months". Now pluralized
  correctly ("1 month" / "N months").
- **King-reign pronoun misgendering (L2).** `fixR()` swaps ruler titles but not possessive
  pronouns, so a King saw "married **her** ward", "in **her** own right", etc. through the opening
  arc. Fixed *surgically* — rewrote only the 16 ruler-referring chronicle strings (cold-chair,
  bride, the-ward, cradle-crown, general-ford, two-heirs, the-widow) to gender-neutral monk voice
  ("married the ward", "named Osrec Protector", "the Crown's own hand"). No blanket `her→his` in
  `fixR` — female NPC pronouns (Mother Senna et al.) are deliberately untouched.

## [0.18.0] — 2026-07-09 — "The Deck Grows"
Twenty new event-letters that thicken the existing decks rather than add a system — pure content
paste into `CARDS` plus additive `maybeFire()` wiring. Every random branch consumes `rHist` only;
no new RNG stream. Seed 3030830 short-circuits to `cold-chair` before any modulo, so the regression
bar is untouched.

- **The Winter Court** (4): `court-in-winter`, `winter-wedding` (both **winter-gated** — pushed
  into the ambient pool only when `seasonOf(S.week)==='Winter'`), `the-tasting`, `hostage-exchange`
  (year-1 ambient). Intrigue, a poisoning, hostages, and a three-way dynastic wedding.
- **The Deep Sea** (4): `ex-leviathan`, `ex-armada`, `ex-drowned-bell`, `ex-vanishing-isle` — added
  to `EX_EVENTS`, so they surface only through Harbor-gated expeditions. Two can bootstrap
  `S.thirdRealm` from the sea (mirroring `ex-castaway`); the drowned bell and the moving isle feed
  the `waken` clock.
- **The Dynastic** (4): `the-bastard`, `mad-heir`, `royal-saint` (ambient), and `regent-ambition`
  (**flag-gated** on `S.flags.regent||heirNamed||constable` — only fires in reigns that actually
  stood up an over-mighty office). Life-of-the-line events keyed on the succession flags.
- **The Uncanny Administrative** (4): `the-census`, `the-returning-road`, `the-honest-rolls`,
  `the-ninth-clerk` — the dread core, joining the **dark pool** after week 260 alongside
  `the-third-bell`. The supernatural arrives through the census, the survey, and the tax rolls;
  three feed `waken`, one feeds `rot`, so the whisper panel escalates as the numbers themselves
  turn ominous.
- **Four seed-varied openings** (`the-widow`, `the-pretender`, `the-empty-treasury`,
  `the-sealed-will`): `openingCard()`'s non-canonical roll widens `[…][SEED%3]` → `[…][SEED%7]`.
  Seed 3030830 still returns `cold-chair` (pre-modulo short-circuit; opening byte-identical).
- **Six state-aware variants** thread real systems: `winter-wedding`/`ex-armada` branch on
  `S.thirdRealm`, `the-honest-rolls` on `S.monk.disp<40` (a bribed monk turns the dread back on the
  player's own gilded chronicle), `the-census` on `S.flags.burned`, `regent-ambition` names the
  specific office the player created, `the-tasting` on an outcome branch.
- **Deepened 3-stage whispers** for `muster`/`waken`/`rot` (text-only; the render was already
  3-stage). Sharpens each arc from bureaucratic unease → named specific → the thing itself, so the
  administrative-dread cards and the threat panel now tell one escalating story.
- New flags (`hostage`, `bastard`, `madHeir`, `churchPact`) are write-and-narrate only — no engine
  read, so plans that never trigger them behave exactly as before.

## [0.17.0] — 2026-07-09 — "The Sworn & the Secret"
A hidden-society layer: three sworn orders, real from the first week of worldgen, that you can only
see through paperwork — a tax roll that balances too cleanly, a warden's report, an informant you
paid good coin for. Pillar 3 (administrative dread) pointed at conspiracy; Pillar 2 (an exposed
order is a chapter heading the monk has been circling for years).

- **Three orders** (`S.societies`, seeded at the `genWorld` tail from `rWorld`, after `genCouncil`):
  the **Wood-Congregation** (patron `church`, bites the `waken` clock — a cult that *feeds* the
  wakening the Crown wants stopped), the **Cleaner Ledger** (patron `commons`, a mint cabal that
  thins the coin and runs the `rot` clock), the **Sworn of the Old Root** (patron `court`, backer
  the Reach — a restorationist underground that leaks `legit` and reads the `muster` clock, wired
  into `continueAsHeir` as deposition-as-restoration).
- **Two meters, on purpose different.** `influence` (how strong the order *is* — a private clock
  that only gates card availability, like `threats.*.clock`) and `suspicion` (how much you *know* —
  rises only from evidence you earn). A powerful order you never investigated sits invisible at high
  influence / suspicion 0. **Runtime consumes ZERO RNG**: both meters are pure integer bookkeeping.
- **A four-rung fog** (`unknown → suspected → named → exposed`). `unknown` orders are **omitted
  from `annals.state()` entirely** — their existence is the first secret. `suspected` shows a shape
  (pips, no name); `named` a name + agenda + head, roster still fogged; `exposed` the full roster +
  influence, and a `moment()` for the Last Leaf.
- **Evidence, never a stat readout.** Suspicion accrues from informants (`paySpies` / a seated P7
  Master of Whispers reuses `W.hints` — the four hint strings were already society fingerprints),
  and from resolving the ambient letters an order animates (`cold-chair`, `false-coin`,
  `the-incorrupt`…). One `socWitness` call at the tail of `resolveCard`; no per-card edits.
- **Nine cards** (`sworn-{restoration,congregation,cabal}-{1,2,3}`) — discovery → dilemma →
  resolution, in monk voice, purge / co-opt / feed on each. The realm-**bite** is delivered only by
  a resolved card or a flag a card set (`restorationRampant`, `congregationRising`, `cabalLicensed`,
  and `captured`-patron guards) — the P7 `marshalSkim` idiom — so a **baseline reign is
  byte-identical**: `factionSeason`/`weeklyEconomy` behave exactly as before.
- **P7 synergy:** at `named`, a seated council holder whose hidden loyalty matches the order's
  patron/backer is revealed as one of its own at exposure (`socCouncilTie`); a sworn Marshal defects
  a fifth of the levy on the restoration's "break it in the field".
- **Determinism:** no fifth RNG stream; membership drawn at worldgen on `rWorld` at the very tail,
  so **seed 3030830's geography stays byte-identical** (verified: towns + council unchanged).
  Society membership varies by seed. New test `tests/sworn-driver.js` drives an order
  unknown→exposed and asserts the fog transitions, the roster fog, and the exposure moment; new
  golden plan `tests/plans/sworn-discovery.json`.
- **Fixed two latent spec bugs:** an option sub-hint string that referenced `S.societies` at module
  load (would crash the game before worldgen) is now name-free; and the restoration resolution read
  `s.captured` *after* resetting it to false — the "strong order → war / marshal defection" gate is
  now computed before the reset.

## [0.16.0] — 2026-07-09 — "Stone & Road"
Six new realm works, a three-tier road network, four shape-keyed wonders, and the balance lever
that finally makes **gold compete with legitimacy** — the sanctioned `--auto=0` softness fix that
ships independently of the council.

- **New works** (`BUILDS`): **Beacon-chain** (readier garrison 0.25→0.40, field-edge 1.2→1.35,
  −250 defensive muster, lights the threat board), **The Royal Mint** (steady seigniorage +2/wk),
  **Canal cut** (opens two more mill-seats → `mill.max` 3→5, +3/wk, lifts a dry town),
  **Lighthouse** (+2.5/wk, +4 on a coastal realm, halves expedition perils), **Monastery**
  (piety + pilgrim income, and slowly un-bribes the P2 chronicler), **Bulwark & outworks**
  (siege factor 2→3).
- **⭐ The Mint lever — `strikecoin`** (repeatable, `cost:0`, `max:99`): converts legitimacy + piety
  → gold (−6 legit, −3 piety, +24..96 gold with **decaying yield**). The exact inverse of
  `progress`/`feast`/`scriptorium`. Overuse raises `S.flags.debase`, which heals −1/yr if left
  quiet and, at debase≥3, erupts the existing **`false-coin`** cabal via `rHist` (logged order).
  A reign that strikes coin now trades legitimacy for gold — cautious legitimacy-hoarding is no
  longer free.
- **Roads depth:** `roads` max 2→3; `roadFactor` adds a −33% third tier; land-trade now scales
  per-town on the net (`buildCount('roads') * realmTowns()*0.4`). The built network inks itself
  solid over the dashed proposed roads in `draw()` (frame-time, no RNG).
- **Harbor-gate fix:** Harbor now needs a city **and** stone roads (or a 2nd city), pushing the sea
  (and expeditions) to ~year 4–8 instead of year 1. `tests/plans/expedition-run.json` updated to
  lay a road before the harbor and still reach the Third Realm (stage 3, unchanged).
- **Four wonders, one per `W.shape`** (Cathedral-tier, `max:1`, hard-gated on city + shape +
  prereqs, gilt map glyph, weight-10 `moment()`, a `leafJudgment` brag): **The Great Weir**
  (valley), **The Twin Pharos** (coastal), **The House of Two Crowns** (island),
  **The Iron Gates** (pass). New `W.sites` use FIXED fractions — seed 3030830 geometry is
  byte-identical (week-0 `state()` diffs clean vs 0.15.0; `smart-builder`/`militarist` byte-identical).
- Determinism: no fifth RNG stream; all new stochastic hooks use `rHist` in logged-order sim code.
  New harness: `tests/stone-and-road.json` + `tests/stone-and-road-check.js` (works/lever/harbor/
  wonder-valley/gate modes). All four regression plans endure with 0 anomalies; double-runs identical.

## [0.15.0] — 2026-07-09 — "The Small Council"
Three council seats — **Marshal, Treasurer, Master of Whispers** — filled by a gamble on a
**hidden loyalty** behind a **visible trait**. Each appointment bends a real system (war splits,
income/upkeep/debt terms, informant cost + threat-board reveal); ~40% of any candidate is secretly
compromised, and a compromised seat pays off through a **3-card disloyalty chain** in the monk's
voice (the marshal's skim, the treasurer's missing third, the spymaster's leak). Candidates and
their hidden loyalties are drawn **at worldgen from `rWorld`, appended at the very end of
`genWorld()`** (after `reshapeRealm`); `rWorld` is read nowhere after `genWorld`, so **seed
3030830's geography is byte-identical to base `main`** (verified: full `W` geometry — towns, river,
mountains, trees, hints — diffs clean). Its *reign trajectory* now differs (it has a council +
appointment letters), which is the feature, not a regression. No fifth RNG stream: runtime
re-appointment on vacancy draws from `rHist` (a sim event), and every new runtime consumption is
gated behind a flag (`S.flags.marshalSkim`/`spyLeak`) no baseline reign sets. All four regression
plans still endure to year 50 with 0 anomalies under `--auto=0`, and double-runs are byte-identical.
### Added
- **`S.council`** — `{marshal,treasurer,spymaster}`, each `{seat,filled,holder,candidates:[2],chain}`.
  A candidate is `{name,house,trait(visible),loyalty(hidden),revealed}`; a holder adds `since:`
  (appointment week). `chain` is the per-seat disloyalty state machine (0 dormant → 4 resolved).
- **Worldgen** — `genCouncil(rWorld)` at the tail of `genWorld()`; tables `COUNCIL_TITLE`,
  `TRAIT_POOL`, `COUNCIL_LOYALTY` (~40% compromised), `makeCandidate`, and accessors
  `seated`/`marshalGarrisonFrac`/`marshalAdv`/`treasIncomeMul`/`treasUpkeepMul`/`treasDebtRate`/
  `spyCost`/`councilSpyReveal`, plus `appoint`/`onSeat`/`vacate`.
- **Three appointment letters** — `appoint-marshal` (wk 6), `appoint-treasurer` (wk 10),
  `appoint-spymaster` (wk 14), each a `get o()` dynamic-option card that composes labels/hints
  from the current candidate pair; a "leave the seat cold" option self-reschedules after 52 weeks.
- **Always-on trait hooks** — Marshal bends the war-AI garrison/field split (`startWar`) and the
  battle edge (`tickWar`); Treasurer scales income, upkeep, and debt interest (`weeklyEconomy`);
  Spymaster halves informant cost (`paySpies` 80→40) and keeps the threat-board lit
  (`renderThreats`), revealing a hint the week he is seated (two for a `keen` spymaster).
- **Three disloyalty chains** (9 cards) — `marshal-skim-*`, `treasurer-third-*`, `spymaster-leak-*`.
  Card 2 flips `holder.revealed` (loyalty leaves `'unknown'` in `state()`); card 3 is the verdict
  (dismiss → `vacate()` → re-appointment 4 weeks later, or tolerate → the penalty rides via
  `S.flags.marshalSkim`/`spyLeak`). Corrupt payloads: marshal skims the levy-chest (−6 gold/wk,
  thinning musters); treasurer siphons ~a third; spymaster feeds a faction and ripens the muster.
- **`state().council`** — a fog-respecting block: traits visible, holder loyalty stays `'unknown'`
  until a chain reveals it; unfilled seats expose the two candidates' traits (never their loyalty).
- **Succession** — the council is **institutional** and persists across reigns; `continueAsHeir`
  resets the chains and re-hides loyalty (a new ruler hasn't caught the mole yet) and re-offers any
  vacant seat.
- **Tests** — `tests/plans/council-appoint.json` + `tests/plans/council-disloyal.json` (golden,
  seed 3030830; the pinned compromised seat is **treasurer candidate[0]** — thrifty/church) and a
  `tests/council-test.js` driver (29 assertions: appointment, the spy-cost 80→40 delta, fog holds,
  the treasurer chain end-to-end with fog-lift + clawback + vacancy + re-appointment, and geometry
  non-perturbation).
### Fixed
- Three latent scope bugs in the disloyalty cards (paste-grade spec): option `f()` bodies in
  `marshal-skim-3` (opt 0/2) and `spymaster-leak-1` (opt 1) referenced `h`, which was defined only
  in the sibling `p()` — they now bind `const h=S.council.<seat>.holder` locally. (Crashed only on
  seeds whose marshal/spymaster is compromised, e.g. seed 2/7; 3030830's are loyal so it never hit.)
### Balance
- The council is the **first half of the sanctioned `--auto=0` softness fix** (R3's Mint is the
  other half): appointment is a real gamble. On seed 7 (compromised marshal), a do-nothing
  `--auto=0` empty-plan reign that **endured on base `main`** is now **deposed** — the skim + the
  legitimacy bleed sink a blind cautious reign. On seed 3030830 (loyal marshal/spymaster, compromised
  treasurer that `--auto=0` recovers) the empty plan still endures (gold 117→665), because the loyal
  trait buffs and the favorable auto-resolution outweigh; the hard gold pressure lands with the Mint.
  Seed sweep (9 seeds): 8 endure, 1 deposed, 0 anomalies, no crashes.

## [0.14.0] — 2026-07-09 — "Realm Shapes"
Seeds now produce **structurally different realms**, so geography changes strategy. The shape is
chosen by **seed modulo — no RNG stream is consumed** (a deterministic branch, not a draw), and
the valley path is left byte-identical: **seed 3030830 is forced valley forever** and all four
regression plans (`smart-builder`, `militarist`, `tier-climber`, `expedition-run`) produce JSON
**byte-identical** to the pre-P9 baseline on 3030830, still endure to year 50 with 0 anomalies,
and a same-plan double-run stays identical. The three new shapes (`coastal`/`island`/`pass`) each
generate, endure to year 50, and are deterministic (double-run identical) on their example seeds
(1001 / 1002 / 1003). Establishes `W.shape ∈ {valley,coastal,island,pass}` for R3's shape-wonders
to consume.
### Added
- **`W.shape` selector** at the top of `genWorld()`:
  `SEED===3030830 ? 'valley' : ['valley','coastal','island','pass'][SEED%4]`. Mapping:
  `SEED%4` → 0 valley · 1 coastal · 2 island · 3 pass (3030830 overridden to valley).
- **`reshapeRealm()`** — non-valley seeds reshape `W` **after** the full base worldgen using fixed
  geometry only (no `rWorld`/`rDetail` draws), so the valley draw order is never perturbed:
  - **coastal** — a second eastern coast (`W.coastE`), the NE mountain teeth trimmed into the new
    sea, a **second port** (`W.towns[3]` → "… Quay", `W.sites.harbor2`), and **cheaper expeditions**
    (`BUILDS.expedition.cost` 160→120).
  - **island** — the realm is an ellipse (`W.island`) ringed by sea; mainland ranges cleared to a
    small central spine; the ore-hill pulled inside; **no land pass** — `W.pass`/`W.camp` staged
    offshore to the east (`W.seaborne`), so the Reach arrives by keel.
  - **pass** — hard mountain **walls north and south**, each with one gap (the NE `W.pass` and a
    south-western `W.pass2`); **thin farmland** (towns poorer/smaller).
- **Shape threat weights** (`applyShapeThreats`) — coastal & island lengthen the muster warning
  (a shorter/absent land border); pass shortens it (the mountains funnel every muster onto the
  gates). Persist as the realm's per-seed signature (reset to `.max` each reign).
- **One shape-specific opening chronicle line** (`SHAPE_OPENING`, spoken at boot) for each
  non-valley shape; valley says nothing extra, keeping 3030830's chronicle byte-identical.
- **Rendering** — `paintTerrain()` paints the coastal east sea + island ring (static layer, no
  RNG), and `draw()` inks the coastal second-port quay. P6's scorch overlay, portraits, season
  tints, and the six works are untouched.

## [0.13.0] — 2026-07-09 — "The Living Map"
The map becomes drawn, living ink. Rendering only: **zero sim changes, zero RNG consumed at
draw time.** All four regression plans (`smart-builder`, `militarist`, `tier-climber`,
`expedition-run`) produce **byte-identical** JSON to the pre-P6 baseline, still endure to year
50 with 0 anomalies, and a same-plan double-run stays identical. Implements P5's motion spec
(ship-minimum + above-cut margin notes & harvest gold) and P4's woodcut portraits, plus a
confirmed `showCard` crash fix.
### Added
- **Persistent scorch overlay** — a THIRD canvas (`scorch`, beside `terrain`), composited in
  `draw()` between the terrain blit and the season tint. A sacked town burns rubric-red
  (`drawTown`, unchanged) then leaves a charcoal-and-ash **scorch stain** for the rest of the
  reign, lifted only when the `rebuild` card clears `t.wasSacked`. The overlay **serializes
  nothing**: it is a pure function of `W.towns[].wasSacked` (reconstructed by the action
  replay) and is rebuilt only when that set's signature changes. The stain's shape is a local
  hash of the town's fixed coordinates — it touches **none** of the four seeded RNG streams,
  so it is bit-identical on every rebuild and across a reload. Exposed to P1's Last Leaf as
  `annals.scorchOverlay()` (the reconciled canvas) and `annals.scorchData()` (JSON accessor).
- **Construction sketch-lines** — works still in `S.projects` are drawn as a dashed ink
  under-drawing (travelling dashes = the pen laying ink, from `S.week`) that "inks in" toward
  the solid marker as the work nears completion; the finished marker takes over automatically
  on the next frame.
- **War columns as marching stroke-rows with banners** — the single pentagon per unit is
  replaced by rows of tiny marching pen-figures (alternating gait) under a fluttering banner,
  scaled by strength; enemy columns sable-grey, player field-armies rubric (colour coding kept).
- **Woodcut portraits on letters** — a pure, framework-free `portrait(seedInt,{role,age,gender})`
  SVG function + `hashName()` + a recurring-figure registry. `showCard()` mounts a small
  iron-gall woodcut portrait beside the `from` line when the letter names a known figure
  (Mother Senna, Lord Osrec, Envoy Caldas Vorn, Old Wend, Dowager Bexley, the Delve-master, the
  sea-captain, or the ruler). Faces are deterministic from the figure's name and consume no
  game RNG.
- **Margin annotations** *(above-cut)* — the monk inks threat-tied notes on the map when a
  clock runs hot ("hic dracones" by the wood, "here the ladders gather" at the pass, "the
  granaries echo" at the capital) plus a coin doodle by a booming market.
- **Harvest gold** *(above-cut)* — the flat autumn wash ripens field-by-field down the valley
  across the autumn weeks (seaward first), clearing at winter.
### Fixed
- **King reigns no longer crash on the `rebuild` letter.** `showCard()` passed `c.from`
  straight to `fixR()` without invoking the function form; the `rebuild` card is the only card
  with `from(){…}`, so `fixR` ran `.replace` on the function object and threw a `TypeError`
  (crashing the letter) in a King reign, and Queen reigns rendered garbage from-text. Now
  resolves `typeof c.from==='function' ? c.from() : c.from` first. Regression:
  `tests/king-crash-check.js`.
### Tests
- `tests/king-crash-check.js` — renders `rebuild` in a King and a Queen reign; asserts no throw.
- `tests/scorch-persistence-check.js` — drives a reign until a town is sacked, then reloads a
  fresh game purely from the history-link payload in a second VM context and asserts the scorch
  set (towns, coords, deterministic signature) returns identical — proving the overlay
  reconstructs from state and serializes nothing.

## [0.12.0] — 2026-07-09 — "Sound of the Realm"
Procedural WebAudio ambience, no assets, no library — one module inside `index.html`.
The mixing rule from the vision holds: peace is *present* (a river, wind by season, a year
bell), danger is *absent* (the mix thins before it swells), and the game's one real melody
is heard only when a reign ends. Purely additive to the sim: the audio module **reads** state
and never writes it, consumes **none** of the four seeded RNG streams (its noise buffers use a
private, constant-seeded generator that nothing in the sim reads), and every entry point is
guarded behind `typeof AudioContext` **and** a master toggle that starts **OFF** and only wakes
on a user gesture — so the Node harness (no `AudioContext`) runs bit-identically and there are no
autoplay warnings. All four regression plans (`smart-builder`, `militarist`, `tier-climber`,
`expedition-run`) produce **byte-identical** JSON to the pre-P3 baseline, still endure to year 50
with 0 anomalies, and a same-plan double-run stays identical.
### Added
- **The footer 🔔 master toggle** (`#soundbtn`, default OFF). First click builds the audio graph
  and resumes the context; the button shows 🔕/🔔 and carries `aria-pressed`. Hidden if the browser
  has no WebAudio. Default-off also honours `prefers-reduced-motion` (silence until the player opts in).
- **River** — brown noise through a lowpass; its gain drops and the filter darkens in winter's freeze
  (`seasonOf(S.week)`).
- **Wind** — filtered noise with an LFO sweeping the band, its level and LFO rate set by the season
  (loudest in winter, a whisper in summer).
- **Year bell** — two detuned sines with exponential decay, rung on the turn-of-year tick
  (the existing `S.week%52===0` block in `tick()`; skipped during replay).
- **War drums** — a lookahead-scheduled noise-burst pattern (accented every fourth beat) that plays
  only while `S.war` is truthy.
- **The thinning** — when the wakening's danger (`1 - S.threats.waken.clock/max`) exceeds 0.6, the
  master gain eases −6 dB and the river mutes: dread you can *hear*.
- **The closing melody** — 8 wordless notes in A-minor (triangle + octave sine, enveloped), played
  once from `endGame()` and nowhere else.
### Notes
- Hooks are three one-line calls (`Sound.yearBell()` in the year tick, `Sound.update()` in `frame()`,
  `Sound.reignEnd()` in `endGame()`), each a no-op unless the toggle is on and an `AudioContext` exists.

## [0.11.0] — 2026-07-09 — "The Monk You Can Bribe"
Separates *what happened* from *what the record says*. Legitimacy and truth are now a
playable tension: pay the scriptorium and the chronicle flatters the Crown for a year —
but a later hand always restores what happened, and the monk who takes the bribe likes
the Crown a little less each time. Fully deterministic: the chronicler's name is drawn
once at worldgen from `rDetail` (the cosmetic-detail stream, so the sim's `rHist` is never
perturbed and every replay reproduces him), and each truth-leak interval is drawn from
`rHist` in logged order — no new RNG stream, no clock. All four regression plans still
endure to year 50 with 0 anomalies (they never fund the scriptorium, so gilding never
fires and their history streams are untouched), and a same-plan double-run stays identical.
### Added
- **The chronicler you can bribe.** `S.monk = {name, disp, gilded}` — named in the reign's
  opening line ("…set down by Brother <name>, who was told to keep his opinions out of it").
  The name is a worldgen-time `pick(rDetail, NM.person)` set in the boot block (the one place
  that runs on both live setup and history-link replay; `finishSetup` does not run on replay).
- **"Fund the scriptorium"** — a repeatable decree (100 gold, 4 weeks, `max:99`). On completion
  it opens a one-year gilding window (`S.flags.gildUntil`).
- **Gilded history.** While the window is open, negative entries about the Crown route through
  `chronCrown(truth, gilded)`: the record shows the flattering rewrite ("was sacked" → "was
  gloriously defended at great cost"; a bought peace → "a generous peace… granted to a chastened
  Reach"; the burned wood → "cleansed… by holy fire"), banks **+1 legitimacy (cap 3 gilds/year**,
  reset on the year tick), and drops the monk's disposition. Both layers are recorded in a
  parallel `S._gildLog` (per-reign, reset with `S._moments`).
- **Truth leaks.** Each gild schedules a marginalia from a later hand **26–78 weeks out**
  (interval via `rHist`) that restores the truth through `marg()`, signed with the monk's initial.
- **The soured monk.** Below **disp 30** he editorializes even on neutral events (a barbed
  margin note at the year's close and when the scriptorium is re-endowed).
- **The Last Leaf pays it off.** `leafData()` now exposes `monk` and a `gilds` array (each with
  `gilded` / `truth` / `correction` / `year`); `composeLeaf()` renders a "What the record was
  made to say…" section showing the gilded line in gilt with the later hand's correction beneath.
- **`tests/scriptorium-check.js`** — drives a reign that keeps the scriptorium endowed, lets
  negative events fire, and asserts (via `annals.chronicle()` and `leafData()`) that both the
  gilded line and a later-hand correction reach the record; deterministic double-run identical.
### Changed
- The chronicle store shape is **unchanged**: `chron()` still pushes plain strings to `API._chron`,
  so `annals.chronicle(n)` stays backward-compatible for the harness. The two-layer history rides
  in the parallel `S._gildLog` (surfaced through `leafData().gilds`), not in the chronicle tail.

## [0.10.0] — 2026-07-09 — "The Last Leaf"
The flagship shareable artifact. Every reign now ends by composing one illuminated
manuscript page — the map as it ended, the reign's five defining moments, the monk's
final judgment, the dynasty line, and the history link — downloadable as a PNG and
reachable anytime from the footer. Fully deterministic: the moment-recorder and the
page composer consume **no RNG stream and no clock**; a same-plan double-run stays
bit-identical, and all four regression plans still endure to year 50 with 0 anomalies.
### Added
- **The Last Leaf.** An offscreen 1200×1600 vellum page (`composeLeaf()`) in the map's
  own iron-gall palette: a title cartouche with gilt rules, a scaled snapshot of the live
  terrain canvas + all current overlays (read generically via `drawImage` — scorch stains,
  works, war units, and future overlays included, nothing hardcoded), a five-moment column
  with rubricated initials, the monk's judgment, the dynasty line, and a seed + history-link
  footer. Word-wrap is done by `measureText`; no external libraries.
- **`moment(text, weight)`** — a defining-moment recorder wired beside the ~12 high-drama
  `chron()` sites (war start/end, town sacked, the burning of the wood, tier rise to town/city,
  famine, the three successions, the sea-harbor opening, third-realm contact, and third-realm
  alliance/rupture). The Last Leaf takes the five highest-weight moments, tie-broken to spread
  across the reign's years, and collapses repeats of a recurring line to a single entry.
- **The monk's final judgment** — 2–3 sentences template-composed from the ending kind, the
  final stats, and a notable flag (a burned wood, a sworn island alliance, sacked towns, or a
  fat valley), in his voice and gender-fixed by `fixR`.
- **UI.** `endGame()` gains a *Compose the Last Leaf* button; a full-screen overlay shows the
  page with *Download the leaf* (`canvas.toBlob` → PNG) and *Copy history link*; the footer
  gains *The annals so far.* to open it any time.
- **`annals.leafData()`** — a pure, canvas-free composer that returns the page's content as
  JSON (title, the five moments, judgment, dynasty, stats, seed, link); it is how the
  composition is tested headless (the canvas is stubbed). New `tests/leaf-check.js` drives a
  reign to its ending and asserts the shape.
### Changed
- Reign bookkeeping: `S._moments`, `S._reignStart`, and `S._dynastyN` track the per-reign
  defining moments and dynasty depth; they reset on a fresh crown and on each succession.

## [0.9.0] — 2026-07-09 — "The Storyteller's Deck"
Two content packs (Batch 2 + Batch 4) integrated on top of Batch 1's tiers/works.
Everything replays bit-identically from `(seed, action log)` — no new RNG source, no new
action type; expedition launches are ordinary `'b'` builds and every outcome is a `'c'` card.
### Added
- **Expeditions & the Third Realm (Batch 2).** A Harbor unlocks a repeatable *Mount an
  expedition* work (160g, 12 weeks, ≤3 in flight). On return the captain's letter deals from
  a 16-card deck: 6 permanent discoveries (Grey Isle quarry, Grey Shoals fishery, drowned-saint
  shrine, salt pans, amber reef, wine coast), 5 sea events (storm, fever ship, castaway,
  corsairs, kind landfall), and a 5-stage Third-Realm arc (contact → embassy → pact →
  entanglement → alliance/rupture) with the island-realm across the Sundered Sea.
- Discovery income flows through one `expeditionIncome()` hook (quarry/amber/salt/vines,
  and a piety-gated pilgrim isle); the fishery cuts winter consumption; salt raises the
  granary cap; a sealed trade pact pays weekly. `S.exped`/`S.thirdRealm` are top-level so
  geography and a foreign realm outlast a succession.
- Agent-API state now reports `expeditions` (returns + discoveries) and `thirdRealm`; the
  Third Realm shows as a fifth power in the ledger.
- **Story variation pack (Batch 4).** 12 new ambient cards (wool-staple war, light coin,
  fallen bridge, toll-farmers, a duel, the ward's indiscretion, the old marshal, the empty
  reliquary, the silent staithes) — three of them dark-deck uncanny cards that enter in year
  five (the incorrupt, the extra hearth, the third bell).
- 4 state-aware variant cards that branch their prose *and* their options on live state:
  the charcoal petition (keyed on whether the wood was burned), the coast bankers (on debt),
  the war reckoning (on a recent bought peace, with a genuine extra fourth option), and the
  new-villages petition (on chartered-village count).
- 3 alternate year-one openings (the cradle and the crown, the general at the ford, the two
  heirs) drawn deterministically per seed; seed 3030830 keeps the canonical Cold Chair.
- Escalating whispers: each threat now carries a calm/uneasy/imminent `whispers[]` triple, so
  the Whispers panel leaks the *register* of a danger from its pip fraction even without paying
  informants — the pips still hide the exact number.
- `expedition-run` test plan (reaches a Harbor, launches 5 expeditions, completes with
  `expeditions.returns === 5` and a clean anomaly scan).
### Changed
- `endWar` timestamps a bought/lost peace (`flags.warLoss`) to gate the war-reckoning card.
- The opening card is chosen by `openingCard()` (seed-modulo, consumes no RNG stream) instead
  of a hard-coded `cold-chair`.

## [0.8.0] — 2026-07-09 — "Settlement Tiers & New Works"
### Added
- Settlement tiers derived from population (a stock, not a rate): village < 900 → town
  900–2,999 → city 3,000+. The capital starts as the realm's one city; river settlements
  start as towns. Tier crossings get a one-time chronicle line.
- Every settlement now grows with prosperity when granaries hold (grain > 200); towns and
  cities grow at ~half the village rate, so a chartered village can climb to town and a
  well-fed town to city over a long reign.
- Six new realm works, auto-sited like mills, with locked buttons that show their tier
  requirement instead of a cost: Market (+1.5g/wk each, town prosperity, max 3), Stone
  roads (all build times −15%, −25% with a second network; +land-trade gold; max 2),
  Guildhall (gold/wk scaling with prosperity), University (royal-progress potency +1 and
  +1 legitimacy/season), Cathedral (piety floor 45, warms the Concord, supersedes shrine
  income; needs a city + guildhall), Harbor (river tolls ×1.3; needs a city + the sea-gate;
  sets a hidden `harborBuilt` flag for Batch 2 expeditions).
- Map treatment for tiers: cities draw a step larger with small-caps labels; markets fly a
  pennant; guildhall/university/cathedral cluster civic glyphs at the capital; an anchor
  marks the sea-harbor.
- `tier-climber` test plan (charters early, grows a new city, builds all six works).
### Changed
- Stone roads apply their build-time discount at project start (stored weeks are already
  reduced), so the roads network never rewrites a project already under way.
- Agent-API state now reports each town's `tier` and a realm `tiers` count.

## [0.7.0] — 2026-07-09 — "The Playtest Overhaul"
### Added
- Real debt: treasury goes negative, 1%/week compounding interest, legitimacy bleed and
  desertion while owing; shady-loan event (Dowager's night-gold with a favor that comes
  due, or League terms that cap your tolls) past −300
- "March on the Reach" decree: player-declared offensive war at a legitimacy cost
- Post-war "Burned Town Petitions" event: crown-funded rebuilding / tax remission / neglect
- Treasury tooltip with full weekly income breakdown (tax/tolls/works/upkeep/tithe)
- Escalating dark-event frequency with reign age; blight harvests grow likelier over time
- Repo established with headless harness, test plans, and docs
### Changed
- Combat rewritten: battle losses scale with opponent strength ratio (numbers finally
  decide battles); army movement ~3× faster (wars no longer time out); capital sieges are
  multi-week garrison attrition behind walls, not an instant check; field army prioritizes
  columns threatening the capital; marshals march 75% and garrison 25%
- Enemy strength scales with muster ripeness + realm prosperity (plunder motive) + low
  legitimacy — never with the player's levy count (military investment wins wars)
- Grain capped at 6,000 + 4,000 per granary (excess spoils); consumption scales with
  prosperity; court upkeep scales with prosperity; royal progress has diminishing returns;
  men-at-arms cap at 7,000
- Threats re-arm: war, the Wakening, and the granary rot can all recur across a reign;
  all three Wakening options now genuinely resolve it (at different costs)
- Event cadence: ambient roll every 9 weeks (was 13), probability escalates with age
### Fixed
- Granary now does something (storage cap + 600-measure emergency reserve before famine)
- Unresolved Wakening no longer passes an unstoppable permanent blight to every heir
- "Fight on" no longer permanently deletes the peace option (eternal-war softlock)
- Wars, wisps, quarantine, spy timers, and volatile flags no longer leak into heirs' reigns
- Wartime men-at-arms no longer erased by army bookkeeping (they reinforce the field)
- Garrison split can no longer produce a negative field army when levies run low

## [0.6.0] — 2026-07-09 — "Dynasty, Saves, Seasons"
### Added
- Character creation: name your ruler, rule as Queen or King (all text re-genders)
- Succession: pass the crown to an heir, return from exile if deposed, raise a banner of
  restoration if conquered; heirs reset threat clocks and reshuffle the event deck
- Save/resume per seed (localStorage) and shareable history links — the full decision log
  in the URL deterministically replays an exact reign anywhere
- Timed construction: works take weeks-to-years; buttons show progress
- Visible seasons: autumn/spring washes; the river freezes in winter and halts toll income
- Espionage: pay informants (80g) to sharpen threat clocks and buy secrets
- Story cards: comet, barefoot prophet, silver under the Teeth, refugee caravan,
  cold-flame heresy; dark deck (Gray Sweat plague, true murrain, town fire) from year 5
- Repeatable gold sinks: raise men-at-arms, royal progress, grand festival
- Map polish: cartographer's frame, compass rose, sea serpent; lore names pinned on seed
  3030830
### Changed
- Harvest scales with population (villages help, not hurt); marriages pay dowries;
  base pace slowed ~2×
### Fixed
- Levy-pay slider no longer snaps back mid-drag; sacked towns targetable in later wars

## [0.5.0] — 2026-07-08 — "Playable v0"
### Added
- Initial single-file game: seeded vellum-map worldgen (mountains, dark wood, river with
  meanders, towns, roads), river-trade barges paying tolls, four-power faction system with
  procedural moods, three threat clocks with whispers, event-card decision system with the
  Cold Chair opening arc, policy sliders (tax/tolls/tithe/levy pay), eight works, wars with
  autonomous marshals, the self-writing chronicle in an unreliable monk's voice, win/lose
  states, seed sharing via #s=, and the window.annals agent API
- Inspired by emollick/annals-kingdom; original engine, no code reused

## Pre-history — 2026-07-08
The design began as a play-by-agent game: four AI faction minds roleplaying the
factions of Vael Ashunn with hidden agendas across year-long turns.
The web game's opening arc is adapted from what those agents did unprompted.
