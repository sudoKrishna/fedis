export interface EvictionPolicy<K> {
  onGet(key: K): void;
  onSet(key: K): void;
  onDelete?(key: K): void;
  evict(): K | null;
}