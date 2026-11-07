import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flagSnapshot, leftoversAfterLogout } from '../flags.js';

const snap = { data: { localStorage: {
  authToken: 'eyJhbGciOi.eyJzdWIiOi.sigPART123',
  profile: '{"email":"a@b.com","userId":9}',
  theme: 'dark',
} } };

test('flags jwt, token key, email and id', () => {
  const f = flagSnapshot(snap);
  const byKey = Object.fromEntries(f.map((x) => [x.key, x.flags]));
  assert.ok(byKey.authToken.includes('jwt'));
  assert.ok(byKey.authToken.includes('token-like'));
  assert.ok(byKey.profile.includes('email'));
});
test('clean entry not flagged', () => {
  assert.ok(!flagSnapshot(snap).some((x) => x.key === 'theme'));
});
test('leftovers after logout keeps only secrets', () => {
  const left = leftoversAfterLogout(snap);
  assert.ok(left.every((x) => x.leftover));
  assert.ok(left.some((x) => x.key === 'authToken'));
});

import { toMarkdown } from '../markdown.js';
import { diffSnapshots } from '../diff.js';
test('markdown renders leftovers and per-store changes', () => {
  const a = { label: 'before', data: { localStorage: { x: '1' } } };
  const b = { label: 'after logout', data: { localStorage: { authToken: 'eyJa.eyJb.sigPART123' } } };
  const md = toMarkdown({ d: diffSnapshots(a, b), a, b, leftovers: [{ store: 'localStorage', key: 'authToken', flags: ['jwt'] }] });
  assert.ok(md.includes('still present after logout'));
  assert.ok(md.includes('authToken'));
});

import { decodeJwt, jwtExpiry, accountSwitchLeftovers } from '../flags.js';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const realJwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '1', iat: 1000, exp: 1000 + 60 * 60 * 24 * 30 })}.sig`;

test('decodeJwt confirms real jwt, rejects random 3-dot base64', () => {
  assert.ok(decodeJwt(realJwt));
  assert.equal(decodeJwt('aaa.bbb.ccc'), null);
});
test('jwtExpiry flags long-lived token', () => {
  const e = jwtExpiry(realJwt);
  assert.equal(e.longLived, true);
  assert.equal(e.noExpiry, false);
});
test('confidence: decodable jwt is high, structural-only is low', () => {
  const high = flagSnapshot({ data: { localStorage: { t: realJwt } } })[0];
  assert.equal(high.confidence, 'high');
  const low = flagSnapshot({ data: { localStorage: { t: 'eyJaaaaa.eyJbbbbb.ccccc' } } })[0];
  assert.equal(low.confidence, 'low');
});
test('auth-library key names flagged high confidence', () => {
  const e = flagSnapshot({ data: { localStorage: { 'sb-abcde-auth-token': 'x' } } })[0];
  assert.ok(e.flags.includes('token-like'));
  assert.equal(e.confidence, 'high');
});
test('account-switch leftovers detect previous account values', () => {
  const after = { data: { localStorage: { profile: '{"email":"alice@x.com"}' } } };
  const hits = accountSwitchLeftovers(after, ['alice@x.com']);
  assert.ok(hits.some((h) => h.staleAccountData));
});
