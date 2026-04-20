import net from "net";

// ===== Types
type CacheEntry = {
  value: string;
  expiry: number | undefined;
};

// ===== CacheStore
class CacheStore {
  private store = new Map<string, CacheEntry>();

  set(key: string, value: string, ttlMs?: number) {
    const entry: CacheEntry = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : undefined,
    };

    this.store.set(key, entry);
  }

  get(key: string): string | null {
    const data = this.store.get(key);
    if (!data) return null;

    if (data.expiry !== undefined && Date.now() > data.expiry) {
      this.store.delete(key);
      return null;
    }

    return data.value;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  ttl(key: string): number {
    const data = this.store.get(key);
    if (!data) return -2;
    if (data.expiry === undefined) return -1;

    const remaining = data.expiry - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : -2;
  }
}

const cache = new CacheStore();


// ===== RESP Parser 
function parseRESP(input: string): string[] {
  const lines = input.split("\r\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line && line.startsWith("$")) {
      const value = lines[i + 1];
      if (value !== undefined) {
        result.push(value);
      }
      i++;
    }
  }

  return result;
}


// ===== RESP Builders 
function respSimple(msg: string): string {
  return `+${msg}\r\n`;
}

function respError(msg: string): string {
  return `-ERR ${msg}\r\n`;
}

function respInteger(num: number): string {
  return `:${num}\r\n`;
}

function respBulk(str: string | null): string {
  if (str === null) return "$-1\r\n";
  return `$${str.length}\r\n${str}\r\n`;
}

function respArray(arr: string[]): string {
  let res = `*${arr.length}\r\n`;
  for (const item of arr) {
    res += respBulk(item);
  }
  return res;
}


// ===== Helpers 
function isValidNumber(value: string): boolean {
  return !isNaN(Number(value));
}


// ===== Command Handler
function handleCommand(args: string[]): string {
  if (args.length === 0) return respError("empty command");

  const cmd = args[0]?.toUpperCase();
  if (!cmd) return respError("invalid command");

  switch (cmd) {
    case "SET": {
      if (args.length < 3) return respError("wrong number of arguments");

      const key = args[1];
      const value = args[2];
      if (!key || !value) return respError("invalid arguments");

      // EX support
      if (args.length >= 5) {
        const flag = args[3];
        const ttlRaw = args[4];

        if (flag?.toUpperCase() === "EX") {
          if (!ttlRaw || !isValidNumber(ttlRaw)) {
            return respError("invalid TTL");
          }

          const ttlSec = Number(ttlRaw);
          cache.set(key, value, ttlSec * 1000);
          return respSimple("OK");
        }
      }

      cache.set(key, value);
      return respSimple("OK");
    }

    case "GET": {
      if (args.length !== 2) return respError("wrong number of arguments");

      const key = args[1];
      if (!key) return respError("invalid key");

      const val = cache.get(key);
      return respBulk(val);
    }

    case "DEL": {
      if (args.length !== 2) return respError("wrong number of arguments");

      const key = args[1];
      if (!key) return respError("invalid key");

      const deleted = cache.delete(key);
      return respInteger(deleted ? 1 : 0);
    }

    case "EXPIRE": {
      if (args.length !== 3) return respError("wrong number of arguments");

      const key = args[1];
      const secondsRaw = args[2];

      if (!key || !secondsRaw || !isValidNumber(secondsRaw)) {
        return respError("invalid arguments");
      }

      const seconds = Number(secondsRaw);
      const val = cache.get(key);

      if (val === null) return respInteger(0);

      cache.set(key, val, seconds * 1000);
      return respInteger(1);
    }

    case "TTL": {
      if (args.length !== 2) return respError("wrong number of arguments");

      const key = args[1];
      if (!key) return respError("invalid key");

      return respInteger(cache.ttl(key));
    }

    case "KEYS": {
      if (args.length !== 2) return respError("wrong number of arguments");

      const pattern = args[1];
      if (pattern !== "*") return respError("only * supported");

      return respArray(cache.keys());
    }

    default:
      return respError("unknown command");
  }
}


// ===== TCP Server 
const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on("data", (buffer) => {
    try {
      const input = buffer.toString();
      const args = parseRESP(input);

      const response = handleCommand(args);
      socket.write(response);
    } catch {
      socket.write(respError("internal error"));
    }
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

server.listen(6380, () => {
  console.log("fedis  running on port 6380");
});