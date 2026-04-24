# Fedis ⚡

> A distributed in-memory cache system built from scratch — inspired by Redis, written in TypeScript.

[![TypeScript](https://img.shields.io/badge/TypeScript-94.6%25-3178C6?style=flat-square&logo=typescript)](https://github.com/sudoKrishna/fedis)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-sudoKrishna%2Ffedis-black?style=flat-square&logo=github)](https://github.com/sudoKrishna/fedis)
[![Demo](https://img.shields.io/badge/Live%20Demo-fedis.vercel.app-purple?style=flat-square)](https://fedis.vercel.app)

---

## What is Fedis?

Fedis is a from-scratch implementation of a distributed in-memory cache — the same kind of system that powers Redis. It is not a wrapper around Redis. Every piece of it — the eviction logic, the TTL system, the persistence layer, the sync mechanism — is hand-built in TypeScript.

The goal was to deeply understand how caching systems actually work under the hood, and to build something interview-worthy that demonstrates real systems thinking.

---

## Live Demo



**Source →** [github.com/sudoKrishna/fedis](https://github.com/sudoKrishna/fedis)

---

## Architecture

```
fedis/
├── backend/          # Cache engine — TCP server, REST API, eviction, TTL, persistence
├── dashboard/        # Next.js live monitor — key explorer, TTL countdown, stats
└── data/             # Snapshot files (auto-generated)
```

### How it works

```
Client (REST or TCP)
        │
        ▼
  Command Parser
  (GET, SET, DEL, EXPIRE, TTL, KEYS)
        │
        ▼
   Cache Engine
  ┌─────────────────────────────────┐
  │  HashMap + DoublyLinkedList     │  ← LRU eviction
  │  FrequencyMap + MinFreq ptr     │  ← LFU eviction
  │  TTL timers (lazy deletion)     │  ← Expiration
  └─────────────────────────────────┘
        │                    │
        ▼                    ▼
   Snapshot             Sync Bus
  (JSON dump)       (Invalidation events)
```

---

## Core Features

### In-memory store
All data lives in memory. `get`, `set`, `delete`, `has` — O(1) operations via a plain `Map`. TTL (time-to-live) is supported per key — keys expire lazily on access, so there is zero timer overhead for the common case.

### LRU eviction
When the cache reaches capacity, the Least Recently Used key is evicted. Implemented with a `HashMap` + `DoublyLinkedList` — both `get` and `set` are O(1). Moving a node to the head of the list on every access keeps the MRU/LRU order maintained without sorting.

### LFU eviction
An alternative eviction policy — evicts the Least Frequently Used key. Uses a `freqMap: Map<number, Set<string>>` and a `minFreq` pointer to achieve O(1) for all operations. The eviction policy is swappable at instantiation — LRU and LFU share a common interface.

### TTL (Time To Live)
Every key can have an optional TTL in milliseconds. On `get`, if `Date.now() > expiresAt`, the key is deleted and `null` is returned. No `setInterval` polling — lazy deletion means zero wasted cycles for keys that are never read again.

### Persistence — RDB-style snapshotting
The entire cache is serialized to a JSON snapshot every 60 seconds, and on graceful shutdown. On startup, the snapshot is loaded back into memory. Expired keys are filtered at both save and load time.

Trade-off: up to 60 seconds of data loss on a hard crash. This is the same trade-off Redis makes with its default RDB persistence — acceptable for most cache use cases.

### Multi-instance sync — cache invalidation
Multiple Fedis instances stay consistent via a WebSocket-based pub/sub bus. When Instance A sets or deletes a key, it publishes an `INVALIDATE` event. Instances B and C delete their local copy — so the next read fetches fresh data from the source of truth.

This is eventual consistency — a small window where instances disagree. For a cache, this is the right trade-off vs. the latency cost of strong consistency.

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cache/:key` | Get a value |
| `POST` | `/cache/:key` | Set a value (body: `{ value, ttlMs? }`) |
| `DELETE` | `/cache/:key` | Delete a key |
| `GET` | `/cache` | List all keys |
| `GET` | `/stats` | Hit rate, eviction count, key count |

### TCP Server with RESP protocol
Fedis speaks RESP (Redis Serialization Protocol) over TCP. Connect with:

```bash
redis-cli -p 6380
```

Supported commands: `SET`, `GET`, `DEL`, `EXPIRE`, `TTL`, `KEYS`

### Live dashboard
A Next.js dashboard at [fedis.vercel.app](https://fedis.vercel.app) shows real-time cache state — all live keys, TTL countdown per key, hit/miss ratio, and eviction stats.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Run locally

```bash
git clone https://github.com/sudoKrishna/fedis.git
cd fedis

# Backend
cd backend
npm install
npm run dev

# Dashboard (new terminal)
cd ../dashboard
npm install
npm run dev
```

Backend → `http://localhost:3000`
Dashboard → `http://localhost:3001`

### Run with Docker

```bash
docker-compose up
```

---

## Design Decisions

**Why lazy TTL deletion instead of active timers?**
Active timers waste memory and CPU for keys that may never be read again. Lazy deletion checks expiry on access — zero overhead, matches how Redis's `volatile-lru` works.

**Why JSON snapshots?**
Human-readable, debuggable, and sufficient for this use case. Binary (like Redis RDB) offers smaller files and faster parsing — a natural next step.

**Why eventual consistency for sync?**
Strong consistency requires a distributed lock on every write, adding latency. For a cache layer, eventual consistency is almost always the right trade-off — worst case is a stale read, not data corruption.

---

## What I learned

Every data structure that felt abstract became real here. LRU is not a concept — it is a `Map` and a linked list working together. Distributed systems are not theory — they are two instances disagreeing about a key's value for 12 milliseconds.

The biggest insight: performance trade-offs are not about algorithms in isolation. They are about what you are optimizing for in a specific context.

---

## References

- [Redis persistence docs](https://redis.io/docs/management/persistence)
- [RESP protocol spec](https://redis.io/docs/reference/protocol-spec)
- [LeetCode 146 — LRU Cache](https://leetcode.com/problems/lru-cache/)
- [LeetCode 460 — LFU Cache](https://leetcode.com/problems/lfu-cache/)
- [Designing Data-Intensive Applications](https://dataintensive.net/) — Ch. 5

---

## License

MIT

---

<p align="center">Built by <a href="https://github.com/sudoKrishna">@sudoKrishna</a></p>
