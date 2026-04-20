import express from "express";
import { CacheStore } from "../store/CacheStore";
import { LRUPolicy } from "../eviction/LRUPolicy";


const app = express();
const port = 3000;


app.use(express.json());

const cache = new CacheStore<any>(100, new LRUPolicy());

app.get("/cache/:key", (req, res) => {
    const { key } = req.params;

    const value = cache.get(key);

    if (value === undefined) {
        return res.status(404).json({ message: "Key not found" });
    }
    res.json({ key, value });
})

app.post("/cache/:key", (req, res) => {
    const { key } = req.params;
    const { value, ttlMs } = req.body;

    if (value === undefined) {
        return res.status(400).json({ message: "Value is required" })
    }
    cache.set(key, value, ttlMs);

    res.json({ message: "Key is succesfully " })
})

app.delete("/cache/:key", (req, res) => {
    const { key } = req.params;

    const deleted = cache.delete(key);

    if (!deleted) {
        return res.status(400).json({ message: "Key not found" })
    }

    res.json({ message: "Key deleted" })

})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});