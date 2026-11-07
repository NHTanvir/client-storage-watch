import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffSnapshots } from '../diff.js';

const before = { data: { localStorage: { token: 'abc', theme: 'dark' } } };
const after = { data: { localStorage: { theme: 'light', user: 'x' } } };

test('added / removed / changed detected', () => {
  const d = diffSnapshots(before, after);
  assert.deepEqual(d.localStorage.added.map((x) => x.key), ['user']);
  assert.deepEqual(d.localStorage.removed.map((x) => x.key), ['token']);
  assert.deepEqual(d.localStorage.changed.map((x) => x.key), ['theme']);
});
test('missing stores diff to empty', () => {
  const d = diffSnapshots({ data: {} }, { data: {} });
  assert.deepEqual(d.cookies, { added: [], removed: [], changed: [] });
});
