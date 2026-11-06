# Client Storage Watch — Plan

## Goal
Snapshot everything the target keeps **in the browser** — localStorage, sessionStorage, IndexedDB, Cache Storage, readable (non-HttpOnly) cookies, service workers — before and after key moments (login, logout, account switch, role change) and show what was added, changed or **left behind**.

**Roadmap fit:** information disclosure (Phase 1 first-finding class), session handling and logout flaws, multi-tenant data left after switching accounts (#4), tokens readable by JavaScript (chains with XSS / postMessage).

**Why Burp can't:** browser storage never crosses the network, so Burp never sees it.

## Features
### v1 (MVP)
- **Snapshot** on demand with a label ("before login", "after logout"…): localStorage, sessionStorage, IndexedDB (databases, stores, record counts + sample records), Cache Storage (cache names + cached URLs), `document.cookie`, registered service workers.
- **Diff** two snapshots: added / removed / changed keys and records.
- **Flags:** JWTs and other tokens in readable storage, emails/user ids/tenant ids, data still present after a "logout" snapshot, cached API responses with personal data.
- **Panel:** snapshots list, diff view, flagged items first; copy as Markdown.
- Scope list; off elsewhere.

### Later
- Auto-snapshot on navigations that look like login/logout.
- Decode JWTs inline (header/claims, expiry).

## Design
| File | Role |
|---|---|
| `manifest.json` | MV3. `storage`, `sidePanel`, `scripting`, `tabs`; host permissions per scope host. |
| `collect.js` | Content script (runs in the page's origin, so it can read its storage): reads all stores with size limits (IndexedDB via `indexedDB.databases()` + read-only cursors; Cache Storage via `caches.keys()`). |
| `diff.js` | Snapshot diff (shared, Node-testable). |
| `flags.js` | Token / JWT / email / id detectors. |
| `background.js` | Scope, snapshots per host in `chrome.storage.local` (capped). |
| `panel.html/.js` | Side panel. |

## Safety and scope
- Strictly read-only: opens IndexedDB read-only, never writes, deletes or clears anything.
- Snapshots can contain tokens and personal data from your test accounts — stored locally only, deletable from the panel, never exported unless you choose.
- In-scope hosts only.

## Testing
- Test page that writes tokens/ids to each store on "login" and only partly clears them on "logout".
- Node tests for diff and detectors; CDP + **error watcher**, 0 errors.
- Check: every store captured, diff correct, leftovers after logout flagged, nothing written to the page's storage.

## Issues → commits
1. Scaffold: manifest, worker, scope
2. Collectors for each storage type, with limits
3. Snapshot storage + diff engine (Node tests)
4. Flag detectors (tokens, JWT, ids, leftovers after logout)
5. Side panel: snapshots, diff, flags
6. Test pages + README/FEATURES/CLAUDE.md
