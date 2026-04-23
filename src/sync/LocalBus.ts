import { EventEmitter } from "events";

export const localBus = new EventEmitter();

export type CacheEvent =
  | { type: "set"; key: string; value?: any }
  | { type: "delete"; key: string };

export function publish(event: CacheEvent) {
  localBus.emit("cache", event);
}

export function subscribe(handler: (event: CacheEvent) => void) {
  localBus.on("cache", handler);
}