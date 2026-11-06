import { getScope, setScope } from './scope.js';

const ta = document.getElementById('hosts');
const status = document.getElementById('status');

getScope().then((hosts) => { ta.value = hosts.join('\n'); });

document.getElementById('save').addEventListener('click', async () => {
  const clean = await setScope(ta.value.split('\n'));
  ta.value = clean.join('\n');
  status.textContent = `Saved ${clean.length} host(s).`;
  setTimeout(() => (status.textContent = ''), 2500);
});
