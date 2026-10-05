import assert from "node:assert/strict";
import test from "node:test";
import { createLazyRecords } from "./lazyRecords.js";

test("does not fetch unopened records and deduplicates concurrent opens", async () => {
  const cache = createLazyRecords();
  let calls = 0;
  const fetchRecords = async () => { calls++; return [{ id: 1 }]; };
  assert.equal(calls, 0);
  const first = cache.load("course:1", fetchRecords);
  const second = cache.load("course:1", fetchRecords);
  assert.equal(first, second);
  assert.deepEqual(await first, [{ id: 1 }]);
  assert.equal(calls, 1);
  await cache.load("course:1", fetchRecords);
  assert.equal(calls, 1);
});

test("separate contexts load individually, including empty lists", async () => {
  const cache = createLazyRecords();
  const calls = [];
  const fetchRecords = (id) => async () => { calls.push(id); return []; };
  await cache.load("learning:1:course:1", fetchRecords(1));
  assert.deepEqual(calls, [1]);
  await cache.load("learning:2:course:1", fetchRecords(2));
  await cache.load("learning:2:course:1", fetchRecords(2));
  assert.deepEqual(calls, [1, 2]);
});

test("failed and aborted requests can be retried", async () => {
  for (const name of ["Error", "AbortError"]) {
    const cache = createLazyRecords();
    const error = new Error("failed"); error.name = name;
    await assert.rejects(cache.load("record:1", () => { throw error; }), { name });
    assert.deepEqual(await cache.load("record:1", async () => [1]), [1]);
  }
});

test("a new session loads fresh data after saving", async () => {
  const cache = createLazyRecords();
  await cache.load("record:1", async () => [1]);
  const refreshed = createLazyRecords();
  assert.deepEqual(await refreshed.load("record:1", async () => [2]), [2]);
});
