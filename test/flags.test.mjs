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
