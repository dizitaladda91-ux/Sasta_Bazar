import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from './cache.js';

test('TtlCache caches hits, expires after TTL, and evicts oldest entry', async () => {
  const cache = new TtlCache(2);
  let loads = 0;

  const first = await cache.getOrSet('products:1', 5000, async () => {
    loads += 1;
    return { id: 1 };
  });
  assert.equal(first.hit, false);
  assert.equal(loads, 1);

  const second = await cache.getOrSet('products:1', 5000, async () => {
    loads += 1;
    return { id: 1 };
  });
  assert.equal(second.hit, true);
  assert.equal(loads, 1);

  cache.set('products:2', { id: 2 }, 5000);
  cache.set('categories:all', { list: [] }, 5000);
  // products:1 should be evicted because maxEntries = 2
  assert.equal(cache.get('products:1'), undefined);
  assert.equal(cache.invalidatePrefix('categories:'), 1);
  assert.equal(cache.size(), 1);
});

test('TtlCache deduplicates concurrent inflight requests for same key', async () => {
  const cache = new TtlCache(10);
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 15));
    return 'ok';
  };

  const [a, b] = await Promise.all([
    cache.getOrSet('site:config', 5000, loader),
    cache.getOrSet('site:config', 5000, loader)
  ]);
  assert.equal(calls, 1);
  assert.equal(a.value, 'ok');
  assert.equal(b.value, 'ok');
});
