import WebSocket from "ws";
import { EventEmitter } from "events";

type SyncEvent = {
  type: "set" | "delete";
  key: string;
  value?: any;
  timestamp: number;
  source: string;
};

export class SyncBus extends EventEmitter {
  private ws?: WebSocket;
  private reconnectInterval = 2000;
  private maxReconnectInterval = 30000;
  private queue: SyncEvent[] = [];
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(private url: string) {
    super();
    this.connect();
  }

  private connect() {
    console.log(" Connecting to sync hub...");

    this.ws = new WebSocket(this.url);

    this.ws.on("open", () => {
      console.log(" Connected to sync hub");

      this.reconnectInterval = 2000; 
      this.flushQueue();
      this.startHeartbeat();
    });

    this.ws.on("message", (data) => {
      try {
        const event: SyncEvent = JSON.parse(data.toString());

        
        if (!event.type || !event.key) return;

        this.emit(event.type, event); 
      } catch (err) {
        console.error(" Invalid message:", err);
      }
    });

    this.ws.on("close", () => {
      console.log("Disconnected. Reconnecting...");

      this.stopHeartbeat();

      setTimeout(() => this.connect(), this.reconnectInterval);

     
      this.reconnectInterval = Math.min(
        this.reconnectInterval * 2,
        this.maxReconnectInterval
      );
    });

    this.ws.on("error", (err) => {
      console.error("SyncBus error:", err.message);
    });
  }

  publish(event: SyncEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      
      this.queue.push(event);
    }
  }

  subscribe(type: SyncEvent["type"], handler: (e: SyncEvent) => void) {
    this.on(type, handler);
  }

  private flushQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) this.publish(event);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}