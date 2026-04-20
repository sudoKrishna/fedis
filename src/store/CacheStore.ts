type CacheEntry<T> = {
    value : T;
    expiry?: number;
}

export class CacheStore<T = any> {
    private store = new Map<string, CacheEntry<T>>();

    set(key: string, value: T, ttlMs?: number): void {
        const entry : CacheEntry<T> = ttlMs ? {
            value,
            expiry : Date.now() + ttlMs,
        } : {
            value,
        }
        this.store.set(key , entry);
    }

    get(key : string) : T | undefined {
       const entry = this.store.get(key);

       if(!entry) return undefined;

       if(entry.expiry && Date.now() > entry.expiry) {
        this.store.delete(key);
        return undefined;
       }
       return entry.value;
    }

  
    delete(key: string): boolean {
        return this.store.delete(key);
    }


    has(key: string): boolean {
       const entry  =  this.store.get(key);

       if(!entry) return false;

       if(entry.expiry && Date.now() > entry.expiry) {
        this.store.delete(key);
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