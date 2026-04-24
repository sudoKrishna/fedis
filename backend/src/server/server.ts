import express from "express";
import { CacheStore } from "../store/CacheStore.js";
import { LRUPolicy } from "../eviction/LRUPolicy.js";
import { SyncBus } from "../sync/SyncBus.js";
import { SnapshotManager } from "../persistence/SnapshotManager";


const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || Math.random().toString();

const bus = new SyncBus("ws://sync-hub:4000");

const cache = new CacheStore<any>(100, new LRUPolicy(), bus);

console.log(` Instance started: ${INSTANCE_ID}`);

const snapshot = new SnapshotManager("./data/snapshot.json");

const loadSnapshot = async () => {
  try {
    const initialData = await snapshot.load();
    cache.loadFrom(initialData);  
  } catch (err) {
    console.error("Error loading snapshot:", err);
  }
};

loadSnapshot();

const SNAPSHOT_INTERVAL = Number(process.env.SNAPSHOT_INTERVAL || 60000);  
setInterval(() => {
  console.log("Auto-saving snapshot...");
  snapshot.save(cache.getAll());  
}, SNAPSHOT_INTERVAL);


const shutdown = async () => {
  console.log("Shutting down... saving snapshot");
  await snapshot.save(cache.getAll());
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);




app.get("/cache/:key", (req, res) => {
  const value = cache.get(req.params.key);

  if (value === undefined) {
    return res.status(404).json({ message: "Key not found" });
  }

  res.json({ key: req.params.key, value });
});

app.post("/cache/:key", (req, res) => {
  const { value, ttlMs } = req.body;

  if (value === undefined) {
    return res.status(400).json({ message: "Value required" });
  }

  cache.set(req.params.key, value, ttlMs);

  res.json({ message: "OK" });
});

app.delete("/cache/:key", (req, res) => {
  const deleted = cache.delete(req.params.key);

  if (!deleted) {
    return res.status(404).json({ message: "Key not found" });
  }

  res.json({ message: "Deleted" });
});

app.get("/monitor", (req, res) => {
  const stats = cache.getStats();

  const totalRequests = stats.hits + stats.misses;

  const hitRate =
    totalRequests === 0
      ? 0
      : ((stats.hits / totalRequests) * 100).toFixed(2);

  res.json({
    totalKeys: stats.totalKeys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${hitRate}%`,
    evictionCount: stats.evictionCount,
    memoryEstimate: `${JSON.stringify([...cache.getAll()]).length} bytes`
  });
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});