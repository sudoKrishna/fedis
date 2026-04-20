import { CacheStore } from "../src/store/CacheStore";
import { LRUPolicy } from "../src/eviction/LRUPolicy";

describe("CacheStore - basic functionality", () => {
  let cache: CacheStore<number>;

  beforeEach(() => {
    cache = new CacheStore<number>(2, new LRUPolicy());
  });

  it("should set and get value", () => {
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("should return undefined for missing key", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("should delete value", () => {
    cache.set("a", 1);
    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
  });
});

describe("CacheStore - TTL", () => {
  it("should expire value after ttl", (done) => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 100, 100); // 100ms TTL

    setTimeout(() => {
      expect(cache.get("a")).toBeUndefined();
      done();
    }, 150);
  });

  it("should return value before expiry", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 100, 1000);
    expect(cache.get("a")).toBe(100);
  });
});

describe("CacheStore - LRU eviction", () => {
  it("should evict least recently used item", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);

    // "a" becomes recent
    cache.get("a");

    // this should evict "b"
    cache.set("c", 3);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("should evict correct item when capacity exceeded", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.size()).toBe(2);
  });
});

describe("CacheStore - edge cases", () => {
  it("should handle overwrite correctly", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("a", 99);

    expect(cache.get("a")).toBe(99);
  });

  it("should respect capacity = 1", () => {
    const cache = new CacheStore<number>(1, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
  });
});