import express from "express";
import { CacheStore } from "../store/CacheStore.js";
import { LRUPolicy } from "../eviction/LRUPolicy.js";
import { SyncBus } from "../sync/SyncBus.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || Math.random().toString();

const bus = new SyncBus("ws://sync-hub:4000");

const cache = new CacheStore<any>(100, new LRUPolicy(), bus);

console.log(` Instance started: ${INSTANCE_ID}`);



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

app.get("/monitor", (_, res) => {
  res.json({
    instance: INSTANCE_ID,
    totalKeys: cache.size(),
  });
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});