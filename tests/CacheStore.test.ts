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

  it("should check has correctly", () => {
    cache.set("a", 1);

    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });

  it("should clear cache", () => {
    cache.set("a", 1);
    cache.clear();

    expect(cache.size()).toBe(0);
  });
});

describe("CacheStore - TTL", () => {
  it("should expire value after ttl", (done) => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 100, 100); 

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

  it("should expire with has()", (done) => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1, 100);

    setTimeout(() => {
      expect(cache.has("a")).toBe(false);
      done();
    }, 150);
  });
});

describe("CacheStore - LRU eviction", () => {
  it("should evict least recently used item", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);

  
    cache.get("a");

   
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

  it("should update LRU order on get", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);

    cache.get("a"); 

    cache.set("c", 3);

    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });
});

describe("CacheStore - overwrite", () => {
  it("should handle overwrite correctly", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("a", 99);

    expect(cache.get("a")).toBe(99);
  });

  it("should overwrite with ttl", (done) => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1, 100);
    cache.set("a", 2, 200);

    setTimeout(() => {
      expect(cache.get("a")).toBe(2);
      done();
    }, 150);
  });
});

describe("CacheStore - capacity edge cases", () => {
  it("should respect capacity = 1", () => {
    const cache = new CacheStore<number>(1, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
  });
});

describe("CacheStore - loadFrom", () => {
  it("should load entries from map", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    const map = new Map();
    map.set("a", { value: 1 });

    cache.loadFrom(map);

    expect(cache.get("a")).toBe(1);
  });
});

describe("CacheStore - size", () => {
  it("should return correct size", () => {
    const cache = new CacheStore<number>(2, new LRUPolicy());

    cache.set("a", 1);
    cache.set("b", 2);

    expect(cache.size()).toBe(2);
  });
});