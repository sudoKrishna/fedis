import fs from "fs/promises";
import path from "path";
import type { CacheEntry } from "../store/CacheStore";

export class SnapshotManager {
  constructor(private filePath: string) {}


async save(store: Map<string, CacheEntry<any>>) {
  try {
    
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    const obj: Record<string, CacheEntry<any>> = {};

    for (const [key, value] of store.entries()) {
      obj[key] = value;
    }

    await fs.writeFile(this.filePath, JSON.stringify(obj), "utf-8");

    console.log("Snapshot saved");
  } catch (err) {
    console.error("Error saving snapshot:", err);
  }
}


  async load(): Promise<Map<string, CacheEntry<any>>> {
  try {
    const data = await fs.readFile(this.filePath, "utf-8");
    const parsed = JSON.parse(data);

    const map = new Map<string, CacheEntry<any>>();
    const now = Date.now();

    for (const key of Object.keys(parsed)) {
      const entry = parsed[key];

      if (entry.expiry && entry.expiry < now) continue;

      map.set(key, {
        value: entry.value,
        expiry: entry.expiry,
        timestamp: entry.timestamp ?? now 
      });
    }

    return map;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return new Map();
    }
    return new Map();
  }
}
}