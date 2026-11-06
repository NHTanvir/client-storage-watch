import { getScope, hostInScope } from './scope.js';
// Snapshots are taken on demand by injecting collect.js into in-scope tabs.
chrome.action.onClicked.addListener((tab) => { if (tab.windowId != null) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {}); });
async function inScope(url) {
  let host=''; try { host=new URL(url).hostname; } catch { return false; }
  return hostInScope(host, await getScope());
}
chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg && msg.type === 'csw-inscope') { inScope(msg.url).then((v) => sendResponse({ inScope: v })); return true; }
});
