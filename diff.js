// Pure snapshot diff. A snapshot is a map of store -> { key: value }.
// Returns, per store, added / removed / changed keys between two snapshots.
const STORES = ['localStorage', 'sessionStorage', 'cookies', 'indexedDB', 'cacheStorage', 'serviceWorkers'];

function diffStore(a = {}, b = {}) {
  const added = [], removed = [], changed = [];
  for (const k of Object.keys(b)) {
    if (!(k in a)) added.push({ key: k, value: b[k] });
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) changed.push({ key: k, from: a[k], to: b[k] });
  }
  for (const k of Object.keys(a)) if (!(k in b)) removed.push({ key: k, value: a[k] });
  return { added, removed, changed };
}

export function diffSnapshots(before, after) {
  const out = {};
  for (const store of STORES) {
    out[store] = diffStore((before.data || {})[store] || {}, (after.data || {})[store] || {});
  }
  return out;
}

export { STORES };
