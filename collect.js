// Injected into an in-scope tab (page origin) on demand. Reads every client
// store READ-ONLY and returns a snapshot. Opens IndexedDB read-only; never
// writes, deletes or clears anything. Self-contained for executeScript.
function collectStorage() {
  const MAX_VAL = 4000;
  const cap = (s) => (typeof s === 'string' && s.length > MAX_VAL ? s.slice(0, MAX_VAL) + '…[+' + (s.length - MAX_VAL) + ']' : s);

  function readWebStorage(store) {
    const out = {};
    try { for (let i = 0; i < store.length; i++) { const k = store.key(i); out[k] = cap(store.getItem(k)); } } catch {}
    return out;
  }

  function readCookies() {
    const out = {};
    try { for (const part of document.cookie.split(';')) { const [k, ...v] = part.trim().split('='); if (k) out[k] = cap(v.join('=')); } } catch {}
    return out; // only non-HttpOnly cookies are visible to JS
  }

  async function readIndexedDB() {
    const out = {};
    try {
      if (!indexedDB.databases) return out;
      const dbs = await indexedDB.databases();
      for (const info of dbs.slice(0, 20)) {
        const summary = await new Promise((resolve) => {
          let done = false;
          const req = indexedDB.open(info.name);
          req.onsuccess = () => {
            const db = req.result;
            const stores = [...db.objectStoreNames];
            const perStore = {};
            let pending = stores.length;
            if (!pending) { db.close(); return resolve({ version: db.version, stores: {} }); }
            for (const name of stores) {
              try {
                const tx = db.transaction(name, 'readonly'); // READ-ONLY
                const os = tx.objectStore(name);
                const countReq = os.count();
                countReq.onsuccess = () => {
                  const getReq = os.getAll(undefined, 3); // sample up to 3 records
                  getReq.onsuccess = () => {
                    perStore[name] = { count: countReq.result, sample: JSON.parse(JSON.stringify(getReq.result || [])).map((r) => cap(JSON.stringify(r))) };
                    if (--pending === 0) { db.close(); if (!done) { done = true; resolve({ version: db.version, stores: perStore }); } }
                  };
                  getReq.onerror = () => { if (--pending === 0) { db.close(); resolve({ version: db.version, stores: perStore }); } };
                };
                countReq.onerror = () => { if (--pending === 0) { db.close(); resolve({ version: db.version, stores: perStore }); } };
              } catch { if (--pending === 0) { db.close(); resolve({ version: db.version, stores: perStore }); } }
            }
          };
          req.onerror = () => resolve(null);
          setTimeout(() => { if (!done) { done = true; resolve(null); } }, 2000);
        });
        if (summary) out[info.name] = summary;
      }
    } catch {}
    return out;
  }

  async function readCaches() {
    const out = {};
    try {
      if (!self.caches) return out;
      for (const name of await caches.keys()) {
        const c = await caches.open(name);
        out[name] = (await c.keys()).slice(0, 50).map((r) => r.url);
      }
    } catch {}
    return out;
  }

  async function readServiceWorkers() {
    const out = {};
    try {
      if (!navigator.serviceWorker) return out;
      const regs = await navigator.serviceWorker.getRegistrations();
      regs.forEach((r, i) => { out['sw' + i] = (r.active && r.active.scriptURL) || r.scope; });
    } catch {}
    return out;
  }

  return (async () => ({
    url: location.href, host: location.host, takenAt: new Date().toISOString(),
    data: {
      localStorage: readWebStorage(window.localStorage),
      sessionStorage: readWebStorage(window.sessionStorage),
      cookies: readCookies(),
      indexedDB: await readIndexedDB(),
      cacheStorage: await readCaches(),
      serviceWorkers: await readServiceWorkers(),
    },
  }))();
}
globalThis.cswCollect = collectStorage;
