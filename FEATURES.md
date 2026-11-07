# Features

## Snapshot (read-only)
- localStorage, sessionStorage (all keys, value-size capped).
- Readable cookies (`document.cookie`; HttpOnly never visible to JS).
- IndexedDB: databases, object stores, record counts + up to 3 sample records,
  via read-only transactions.
- Cache Storage: cache names + cached URLs.
- Registered service workers.

## Diff
- Added / removed / changed keys per store between two labelled snapshots.

## Flags
- JWTs (decoded and **confirmed** by parsing header+payload — unconfirmed
  3-dot base64 drops to low confidence), token/secret/apikey/password keys,
  auth-library key seeds (`sb-*-auth-token`, `firebase:authUser`,
  `@@auth0spajs@@`, `msal.*`), emails, user/tenant/org ids.
- **weak-expiry**: no-`exp` or long-lived (>7 day) JWTs.
- **Leftovers after logout** and **previous-account data after switch**.
- `ngsw` Angular SW caches and lingering service workers are noted
  (check against CVE-2026-50184).
- Each flagged entry carries a high/medium/low **confidence** tier.
- Copy diff + leftovers + stale-account data as Markdown.

## Safety
- Strictly read-only; never writes/deletes/clears.
- Snapshots stay local (`chrome.storage.local`, capped per host), deletable.
- Scope-gated.
