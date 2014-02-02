export declare class Pool<T> {
    private pool;
    private counter;
    constructor(type: any, len: number);
    public pop(): T;
    public push(s: T): void;
}
export declare class TestPoolClass {
    constructor();
    public juan(): void;
}
