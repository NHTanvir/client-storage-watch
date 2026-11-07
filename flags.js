// Pure detectors. Flag secrets in readable storage, decode/confirm JWTs to cut
// false positives, score expiry, and tier confidence — per the research notes.
const JWT_RE = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\b/;
const TOKEN_KEY_RE = /(token|session|auth|jwt|bearer|secret|api[_-]?key|password|refresh)/i;
// Auth-library storage key seeds (high-value signatures).
const AUTHLIB_KEY_RE = /(sb-[a-z0-9]+-auth-token|firebase:authUser|@@auth0spajs@@|msal\.|okta-token-storage|amplify-)/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const ID_KEY_RE = /(user_?id|uid|tenant_?id|org_?id|account_?id)/i;
const HIGH_ENTROPY_RE = /^[A-Za-z0-9._~+/-]{32,}$/;

function text(v) { return v == null ? '' : (typeof v === 'string' ? v : JSON.stringify(v)); }

function b64urlToStr(seg) {
  let b = seg.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return atob(b); // available in Node >=16 and in the extension context
}

// Decode + confirm a JWT: both header and payload must parse as JSON objects.
export function decodeJwt(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split('.');
  if (parts.length < 2) return null;
  try {
    const header = JSON.parse(b64urlToStr(parts[0]));
    const payload = JSON.parse(b64urlToStr(parts[1]));
    if (typeof header !== 'object' || header === null || typeof payload !== 'object' || payload === null) return null;
    return { header, payload };
  } catch { return null; }
}

// Expiry analysis: no-expiry or long-lived (>7 days) tokens are weaker.
export function jwtExpiry(value) {
  const d = decodeJwt(value);
  if (!d) return null;
  const { iat, exp } = d.payload || {};
  return {
    iat: iat ?? null, exp: exp ?? null,
    noExpiry: exp == null,
    longLived: iat != null && exp != null ? (exp - iat > 60 * 60 * 24 * 7) : false,
  };
}

export function flagSnapshot(snapshot) {
  const out = [];
  const data = snapshot.data || {};
  for (const store of Object.keys(data)) {
    for (const [key, value] of Object.entries(data[store] || {})) {
      const val = text(value);
      const hay = key + ' ' + val;
      const f = [];
      let confidence = 'low';
      let jwt = null;
      if (JWT_RE.test(hay)) {
        f.push('jwt');
        jwt = jwtExpiry(val) || (decodeJwt(val) ? {} : null);
        confidence = decodeJwt(val) ? 'high' : 'low'; // structural-only = low
        if (jwt && (jwt.noExpiry || jwt.longLived)) f.push('weak-expiry');
      }
      if (TOKEN_KEY_RE.test(key) || AUTHLIB_KEY_RE.test(key)) {
        f.push('token-like');
        if (AUTHLIB_KEY_RE.test(key) || HIGH_ENTROPY_RE.test(val)) confidence = 'high';
        else if (confidence !== 'high') confidence = 'medium';
      }
      if (EMAIL_RE.test(hay)) { f.push('email'); if (confidence === 'low') confidence = 'medium'; }
      if (ID_KEY_RE.test(key)) { f.push('id'); if (confidence === 'low') confidence = 'medium'; }
      if (f.length) out.push({ store, key, flags: f, confidence, ...(jwt ? { jwt } : {}) });
    }
  }
  return out;
}

export function leftoversAfterLogout(afterLogoutSnapshot) {
  return flagSnapshot(afterLogoutSnapshot)
    .filter((e) => e.flags.some((f) => f === 'jwt' || f === 'token-like'))
    .map((e) => ({ ...e, leftover: true }));
}

// Values tied to the previous account that persist after an account switch.
export function accountSwitchLeftovers(afterSwitchSnapshot, prevAccountValues = []) {
  const needles = prevAccountValues.map((v) => String(v)).filter((v) => v.length >= 3);
  const data = afterSwitchSnapshot.data || {};
  const hits = [];
  for (const store of Object.keys(data)) {
    for (const [key, value] of Object.entries(data[store] || {})) {
      const val = text(value);
      const matched = needles.filter((n) => val.includes(n) || key.includes(n));
      if (matched.length) hits.push({ store, key, matched, staleAccountData: true });
    }
  }
  return hits;
}
