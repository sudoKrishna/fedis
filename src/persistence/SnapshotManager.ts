import fs from "fs/promises";

type CacheEntry = {
    value : any;
    expiresAt: number | null;
};

export class SnapshotManager {
  constructor(private filePath: string) {}

  async save(store: Map<string, CacheEntry>) {
    try {
      await fs.mkdir("data", { recursive: true });

      const data = JSON.stringify([...store.entries()]);
      await fs.writeFile(this.filePath, data, "utf-8");

      console.log("snapshot saved");
    } catch (err) {
      console.error("Error saving snapshot:", err);
    }
  }

  async load(): Promise<Map<string, CacheEntry>> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const parsed: [string, CacheEntry][] = JSON.parse(data);

      const map = new Map(parsed);
      const now = Date.now();

      for (const [key, entry] of map) {
        if (entry.expiresAt && entry.expiresAt < now) {
          map.delete(key);
        }
      }

      console.log("Snapshot loaded");
      return map;

    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.log("No snapshot found, starting fresh");
        return new Map();
      }

      console.error("Error loading snapshot:", err);
      return new Map();
    }
  }
}