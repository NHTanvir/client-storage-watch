// Pure detectors. Flag secrets in readable storage, and data still present
// after a "logout" snapshot. Node-testable.
const JWT_RE = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/;
const TOKEN_KEY_RE = /(token|session|auth|jwt|bearer|secret|api[_-]?key|password|refresh)/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const ID_KEY_RE = /(user_?id|uid|tenant_?id|org_?id|account_?id)/i;

function text(v) {
  if (v == null) return '';
  return typeof v === 'string' ? v : JSON.stringify(v);
}

// Flag individual entries in a snapshot.
export function flagSnapshot(snapshot) {
  const flags = [];
  const data = snapshot.data || {};
  for (const store of Object.keys(data)) {
    for (const [key, value] of Object.entries(data[store] || {})) {
      const hay = key + ' ' + text(value);
      const f = [];
      if (JWT_RE.test(hay)) f.push('jwt');
      if (TOKEN_KEY_RE.test(key) || TOKEN_KEY_RE.test(text(value))) f.push('token-like');
      if (EMAIL_RE.test(hay)) f.push('email');
      if (ID_KEY_RE.test(key)) f.push('id');
      if (f.length) flags.push({ store, key, flags: f });
    }
  }
  return flags;
}

// Sensitive entries that survive into the "after logout" snapshot.
export function leftoversAfterLogout(afterLogoutSnapshot) {
  return flagSnapshot(afterLogoutSnapshot)
    .filter((e) => e.flags.some((f) => f === 'jwt' || f === 'token-like'))
    .map((e) => ({ ...e, leftover: true }));
}
