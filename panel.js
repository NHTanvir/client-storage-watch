import { diffSnapshots } from './diff.js';
import { flagSnapshot, leftoversAfterLogout } from './flags.js';

let host = '';
let snaps = [];
const out = document.getElementById('out');
const selA = document.getElementById('a');
const selB = document.getElementById('b');
function esc(s){return String(s).replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
async function activeTab(){ const [t]=await chrome.tabs.query({active:true,currentWindow:true}); return t; }

function fillSelects() {
  const opts = snaps.map((s, i) => `<option value="${i}">${esc(s.label)}</option>`).join('');
  selA.innerHTML = opts; selB.innerHTML = opts;
  if (snaps.length > 1) selB.selectedIndex = snaps.length - 1;
}

function flagChips(flags) { return flags.map((f) => `<span class="flag">${esc(f)}</span>`).join(''); }

function renderList() {
  let html = `<section>${snaps.length} snapshot(s) for <code>${esc(host)}</code>.</section>`;
  for (const s of snaps) {
    const f = flagSnapshot(s);
    html += `<section><b>${esc(s.label)}</b> — <code>${esc(s.takenAt)}</code>
      ${f.length ? `<div>${f.length} flagged entr${f.length === 1 ? 'y' : 'ies'}: ` +
        f.slice(0, 20).map((e) => `<span class="k">${esc(e.store)}.${esc(e.key)}</span>${flagChips(e.flags)}`).join(' ') + '</div>' : ''}</section>`;
  }
  out.innerHTML = html;
}

async function load() {
  const t = await activeTab();
  try { host = new URL(t.url).host; } catch { host = ''; }
  const resp = await chrome.runtime.sendMessage({ type: 'csw-list', host });
  snaps = (resp && resp.snaps) || [];
  fillSelects(); renderList();
}

document.getElementById('snap').addEventListener('click', async () => {
  const label = document.getElementById('label').value.trim();
  const t = await activeTab();
  const r = await chrome.runtime.sendMessage({ type: 'csw-snapshot', tabId: t.id, label });
  if (r && r.error) { out.innerHTML = `<section>${esc(r.error)} — add the host to scope and reload.</section>`; return; }
  snaps = r.snaps; fillSelects(); renderList();
});

function groupRows(title, cls, rows, fmt) {
  if (!rows.length) return '';
  return `<h3 class="${cls}">${title} (${rows.length})</h3>` + rows.map((r) => `<div class="${cls}">${fmt(r)}</div>`).join('');
}

document.getElementById('diff').addEventListener('click', () => {
  const a = snaps[Number(selA.value)], b = snaps[Number(selB.value)];
  if (!a || !b) return;
  const d = diffSnapshots(a, b);
  const leftovers = /logout|signout|sign out|logged out/i.test(b.label) ? leftoversAfterLogout(b) : [];
  window.__last = { d, a, b, leftovers };
  let html = `<section><b>${esc(a.label)}</b> → <b>${esc(b.label)}</b></section>`;
  if (leftovers.length) {
    html += `<section><h3 class="leftover">⚠ Secrets still present after logout (${leftovers.length})</h3>` +
      leftovers.map((e) => `<div class="leftover k">${esc(e.store)}.${esc(e.key)}${flagChips(e.flags)}</div>`).join('') + '</section>';
  }
  for (const store of Object.keys(d)) {
    const s = d[store];
    if (!s.added.length && !s.removed.length && !s.changed.length) continue;
    html += `<section><h3>${esc(store)}</h3>
      ${groupRows('added', 'added', s.added, (r) => `<span class="k">${esc(r.key)}</span>`)}
      ${groupRows('removed', 'removed', s.removed, (r) => `<span class="k">${esc(r.key)}</span>`)}
      ${groupRows('changed', 'changed', s.changed, (r) => `<span class="k">${esc(r.key)}</span>`)}
    </section>`;
  }
  out.innerHTML = html;
});

document.getElementById('clear').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'csw-clear', host });
  snaps = []; fillSelects(); renderList();
});

chrome.tabs.onActivated.addListener(load);
load();
