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
- JWTs and token/secret/apikey/password keys, emails, user/tenant/org ids.
- **Leftovers after logout**: secrets still present in an "after logout" snapshot.
- Copy diff + leftovers as Markdown.

## Safety
- Strictly read-only; never writes/deletes/clears.
- Snapshots stay local (`chrome.storage.local`, capped per host), deletable.
- Scope-gated.
