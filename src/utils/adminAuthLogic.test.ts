import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_ACCESS_CODE,
  ADMIN_SESSION_KEY,
  resolveInitialAdminMode,
  setAdminSession,
  verifyAdminPassword,
  type SimpleSessionStorage,
} from './adminAuthLogic';

function createMemStorage(): SimpleSessionStorage {
  const store = new Map<string, string>();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
    removeItem: (k) => {
      store.delete(k);
    },
  };
}

test('visitor mode is locked by default and unlocks only with ?admin=true or valid password', () => {
  const mem = createMemStorage();
  assert.equal(resolveInitialAdminMode('', mem), false);
  assert.equal(resolveInitialAdminMode('?foo=bar', mem), false);

  assert.equal(resolveInitialAdminMode('?admin=true', mem), true);
  assert.equal(mem.getItem(ADMIN_SESSION_KEY), '1');

  // Subsequent navigation without query string preserves unlocked session until locked
  assert.equal(resolveInitialAdminMode('', mem), true);
  assert.equal(resolveInitialAdminMode('?admin=false', mem), false);
  assert.equal(mem.getItem(ADMIN_SESSION_KEY), null);
});

test('verifyAdminPassword checks access code and setAdminSession toggles lock state', () => {
  const mem = createMemStorage();
  assert.equal(verifyAdminPassword('wrong'), false);
  assert.equal(verifyAdminPassword(` ${ADMIN_ACCESS_CODE} `), true);

  setAdminSession(true, mem);
  assert.equal(resolveInitialAdminMode('', mem), true);

  setAdminSession(false, mem);
  assert.equal(resolveInitialAdminMode('', mem), false);
});
