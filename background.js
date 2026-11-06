import { getScope, hostInScope } from './scope.js';

chrome.action.onClicked.addListener((tab) => { if (tab.windowId != null) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {}); });

async function inScope(url) {
  let host=''; try { host=new URL(url).hostname; } catch { return false; }
  return hostInScope(host, await getScope());
}

const K = (host) => `snaps_${host}`;
const CAP = 20; // snapshots kept per host

async function list(host) {
  const { [K(host)]: arr = [] } = await chrome.storage.local.get(K(host));
  return arr;
}

// Inject the collector into an in-scope tab and store the labelled snapshot.
async function snapshot(tabId, label) {
  const tab = await chrome.tabs.get(tabId);
  if (!(await inScope(tab.url))) return { error: 'out-of-scope' };
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', files: ['collect.js'] }).catch(() => {});
  const [out] = await chrome.scripting.executeScript({
    target: { tabId }, world: 'MAIN',
    func: () => (globalThis.cswCollect ? globalThis.cswCollect() : null),
  }).catch(() => [null]);
  const snap = out && out.result;
  if (!snap) return { error: 'collect-failed' };
  snap.label = label || snap.takenAt;
  snap.id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const host = snap.host;
  const arr = await list(host);
  arr.push(snap);
  while (arr.length > CAP) arr.shift();
  await chrome.storage.local.set({ [K(host)]: arr });
  return { snaps: arr };
}

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg && msg.type === 'csw-inscope') { inScope(msg.url).then((v) => sendResponse({ inScope: v })); return true; }
  if (msg && msg.type === 'csw-snapshot') { snapshot(msg.tabId, msg.label).then(sendResponse); return true; }
  if (msg && msg.type === 'csw-list') { list(msg.host).then((snaps) => sendResponse({ snaps })); return true; }
  if (msg && msg.type === 'csw-clear') { chrome.storage.local.remove(K(msg.host)).then(() => sendResponse({ ok: true })); return true; }
});
