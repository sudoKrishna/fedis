import type { EvictionPolicy } from "../eviction/EvictionPolicy";

type CacheEntry<T> = {
  value: T;
  expiry?: number;
};

export class CacheStore<T = any> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(
    private capacity: number,
    private policy: EvictionPolicy<string>
  ) {}

  set(key: string, value: T, ttlMs?: number): void {
    // eviction check
    if (this.store.size >= this.capacity && !this.store.has(key)) {
      const evictKey = this.policy.evict();
      if (evictKey !== null) {
        this.store.delete(evictKey);
      }
    }

    const entry: CacheEntry<T> = ttlMs
      ? { value, expiry: Date.now() + ttlMs }
      : { value };

    this.store.set(key, entry);
    this.policy.onSet(key);
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) return undefined;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.delete(key);
      return undefined;
    }

    this.policy.onGet(key);
    return entry.value;
  }

  delete(key: string): boolean {
    this.policy.onDelete?.(key);
    return this.store.delete(key);
  }

  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) return false;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}