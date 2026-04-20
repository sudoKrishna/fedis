export class Node<K , V > {
    key : K;
    value : V;
    prev : Node<K, V> | null = null;
    next : Node<K, V> | null = null;

    constructor(key : K, value : V) {
        this.key = key;
        this.value = value;
    }
}