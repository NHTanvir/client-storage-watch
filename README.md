# Client Storage Watch

A Chrome (MV3) extension that snapshots everything a target keeps **in the
browser** — localStorage, sessionStorage, IndexedDB, Cache Storage, readable
(non-HttpOnly) cookies and service workers — before and after key moments
(login, logout, account switch) and shows what was added, changed or **left
behind**.

> **Authorized testing only.** Strictly read-only: it opens IndexedDB
> read-only and never writes, deletes or clears anything. Snapshots can hold
> tokens/personal data from your test accounts — they stay local and are
> deletable from the panel. Empty scope = inert.

## Why not Burp
Browser storage never crosses the network, so a proxy never sees it.

## Install (unpacked)
1. `chrome://extensions` → Developer mode → Load unpacked → this folder.
2. Options → add authorized host(s). Open the side panel from the toolbar.

## Try it
```
cd testpages && python3 -m http.server 8000
```
Open `http://localhost:8000/` (scope `localhost`). Snapshot "before login",
Login, snapshot "after login", Logout, snapshot "after logout", then Diff —
the leftover token is flagged.

## Tests
```
npm test
```
See [FEATURES.md](FEATURES.md) and [PLAN.md](PLAN.md).
