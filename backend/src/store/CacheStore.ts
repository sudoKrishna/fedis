import type { EvictionPolicy } from "../eviction/EvictionPolicy";
import { SyncBus } from "../sync/SyncBus";

export type CacheEntry<T = any> = {
  value: T;
  expiry?: number;
  timestamp: number; 
};

type SyncEvent<T> = {
  type: "set" | "delete";
  key: string;
  value?: T;
  expiry?: number;
  timestamp: number;
  source?: string;
};

export class CacheStore<T = any> {
  private store = new Map<string, CacheEntry<T>>();
  private instanceId = process.env.INSTANCE_ID || Math.random().toString();
  private hits = 0;
private misses = 0;
private evictionCount = 0;

  constructor(
    private capacity: number,
    private policy: EvictionPolicy<string>,
    private syncBus?: SyncBus
  ) {
   
    this.syncBus?.subscribe("set", (event: SyncEvent<T>) => {
      if (event.source === this.instanceId) return;

      const current = this.store.get(event.key);

      
      if (current && current.timestamp > event.timestamp) return;

      this.store.set(event.key, {
        value: event.value as T,
        timestamp: event.timestamp,
        ...(event.expiry !== undefined && { expiry: event.expiry })
      });

      this.policy.onSet(event.key);

      console.log(" Synced SET:", event.key);
    });

    this.syncBus?.subscribe("delete", (event: SyncEvent<T>) => {
      if (event.source === this.instanceId) return;

      this.store.delete(event.key);
      this.policy.onDelete?.(event.key);

      console.log(" Synced DELETE:", event.key);
    });

  
    setInterval(() => this.cleanupExpired(), 10000);
  }

  private cleanupExpired() {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry && now > entry.expiry) {
        this.delete(key, false); 
      }
    }
  }

  set(key: string, value: T, ttlMs?: number): void {
  if (this.store.size >= this.capacity && !this.store.has(key)) {
    const evictKey = this.policy.evict();

    if (evictKey !== null) {
      this.evictionCount++;
      this.delete(evictKey);
    }
  }

  const timestamp = Date.now();

  const expiryPart =
    ttlMs !== undefined ? { expiry: timestamp + ttlMs } : {};

  const entry: CacheEntry<T> = {
    value,
    timestamp,
    ...expiryPart
  };

  this.store.set(key, entry);
  this.policy.onSet(key);

  this.syncBus?.publish({
    type: "set",
    key,
    value,
    ...(entry.expiry !== undefined && { expiry: entry.expiry }),
    timestamp,
    source: this.instanceId
  });
}

 get(key: string): T | undefined {
  const entry = this.store.get(key);

  if (!entry) {
    this.misses++;
    return undefined;
  }

  if (entry.expiry && Date.now() > entry.expiry) {
    this.delete(key);
    this.misses++;
    return undefined;
  }

  this.hits++;
  this.policy.onGet(key);
  return entry.value;
}

  delete(key: string, broadcast = true): boolean {
    const existed = this.store.delete(key);

    if (existed) {
      this.policy.onDelete?.(key);

      if (broadcast) {
        this.syncBus?.publish({
          type: "delete",
          key,
          timestamp: Date.now(),
          source: this.instanceId
        });
      }
    }

    return existed;
  }

  getStats() {
  return {
    totalKeys: this.store.size,
    hits: this.hits,
    misses: this.misses,
    evictionCount: this.evictionCount
  };
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
    for (const key of this.store.keys()) {
      this.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }

  getAll(): Map<string, CacheEntry<T>> {
    return new Map(this.store);
  }

  loadFrom(entries: Map<string, CacheEntry<T>>) {
    this.store = entries;

    for (const key of this.store.keys()) {
      this.policy.onSet(key);
    }
  }
}