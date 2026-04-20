import type { EvictionPolicy } from "./EvictionPolicy";
import { DoublyLinkedList } from "../store/DoublyLinkedList";
import { Node } from "../store/Node";

export class LRUPolicy<K> implements EvictionPolicy<K> {
  private list = new DoublyLinkedList<K, null>();
  private map = new Map<K, Node<K, null>>();

  onGet(key: K): void {
    const node = this.map.get(key);
    if (!node) return;

    this.list.moveToHead(node);
  }

  onSet(key: K): void {
    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      this.list.moveToHead(node);
      return;
    }

    const node = new Node(key, null as any);
    this.list.addToHead(node);
    this.map.set(key, node);
  }

  onDelete(key: K): void {
    const node = this.map.get(key);
    if (!node) return;

    this.list.removeNode(node);
    this.map.delete(key);
  }

  evict(): K | null {
    const tail = this.list.removeTail();
    if (!tail) return null;

    this.map.delete(tail.key);
    return tail.key;
  }
}