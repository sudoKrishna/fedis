import { Node } from "../store/Node";
import { DoublyLinkedList } from "../store/DoublyLinkedList";

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, Node<K, V>>;
  private list: DoublyLinkedList<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    this.list = new DoublyLinkedList();
  }

  get(key: K): V | null {
    if (!this.map.has(key)) return null;

    const node = this.map.get(key)!;

    // move to head (recently used)
    this.list.moveToHead(node);

    return node.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      // update existing
      const node = this.map.get(key)!;
      node.value = value;

      this.list.moveToHead(node);
      return;
    }

    // new node
    const newNode = new Node(key, value);

    if (this.map.size >= this.capacity) {
      // remove LRU
      const tail = this.list.removeTail();
      if (tail) {
        this.map.delete(tail.key);
      }
    }

    this.list.addToHead(newNode);
    this.map.set(key, newNode);
  }

  delete(key: K): boolean {
    if (!this.map.has(key)) return false;

    const node = this.map.get(key)!;
    this.list.removeNode(node);
    this.map.delete(key);

    return true;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }
}