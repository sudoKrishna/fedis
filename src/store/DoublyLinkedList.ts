import { Node } from "./Node";

export class DoublyLinkedList<K, V> {
  private head: Node<K, V>;
  private tail: Node<K, V>;

  constructor() {
    // dummy nodes (edge cases avoid karne ke liye)
    this.head = new Node<K, V>(null as any, null as any);
    this.tail = new Node<K, V>(null as any, null as any);

    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  addToHead(node: Node<K, V>) {
    node.next = this.head.next;
    node.prev = this.head;

    this.head.next!.prev = node;
    this.head.next = node;
  }

  removeNode(node: Node<K, V>) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;

    node.prev = null;
    node.next = null;
  }

  moveToHead(node: Node<K, V>) {
    this.removeNode(node);
    this.addToHead(node);
  }

  removeTail(): Node<K, V> | null {
    const node = this.tail.prev;

    if (node === this.head) return null;

    this.removeNode(node!);
    return node!;
  }
}