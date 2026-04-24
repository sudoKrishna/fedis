import { CacheStore } from "../store/CacheStore.js";
import { SyncBus } from "../sync/SyncBus.js";
import { LRUPolicy } from "../eviction/LRUPolicy.js";

const bus = new SyncBus("ws://sync-hub:4000");


const cache = new CacheStore(100, new LRUPolicy(), bus);

console.log("Cache instance started");

setInterval(() => {
  const value = Math.random();

  console.log("Setting key from instance:", value);

  cache.set("test", value);
}, 5000);

setInterval(() => {
  console.log("Current Cache:", cache.getAll());
}, 3000);