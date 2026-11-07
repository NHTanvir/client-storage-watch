# CLAUDE.md — Client Storage Watch

## What this is
MV3 Chrome extension that snapshots + diffs browser storage to find data left
behind (e.g. tokens after logout). Strictly read-only. Authorized use only.

## Layout
- `manifest.json` — MV3; storage/sidePanel/scripting/tabs.
- `scope.js` — scope helpers (shared).
- `diff.js` — PURE snapshot diff. Tested.
- `flags.js` — PURE token/jwt/email/id + logout-leftover detectors. Tested.
- `markdown.js` — PURE Markdown export. Tested.
- `collect.js` — injected MAIN-world collector; reads every store READ-ONLY
  (IndexedDB via read-only transactions). Never writes/deletes/clears.
- `background.js` — scope-gated executeScript to run the collector; stores
  labelled snapshots per host in chrome.storage.local (capped 20).
- `panel.html` / `panel.js` — side panel (snapshots, diff, flags, copy MD).
- `testpages/` — page that leaves a token behind on logout.

## Rules
- collect.js MUST stay read-only — no put/add/delete/clear, ever.
- Keep diff.js / flags.js / markdown.js pure and Node-tested.

## Test
`npm test`; manual: serve `testpages/`, scope `localhost`, snapshot before/after.
