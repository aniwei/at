export type SubscribeHandle = (...rests: unknown[]) => void;
export type Subscriber<T extends SubscribeHandle> = {
    handler: T;
    context: unknown;
    once: boolean;
};
/**
 * 订阅类
 */
export declare class Subscribable<T extends SubscribeHandle = SubscribeHandle> {
    protected subscribers: Subscriber<T>[];
    /**
     * 订阅消息
     * @param {T} handler
     * @param {unknown} context?
     * @param {boolean} once = false
     */
    subscribe(handler: T, context?: unknown, once?: boolean): void;
    /**
     * 一次订阅
     * @param {T} handler
     * @param {unknown} context
     */
    once(handler: T, context?: unknown): void;
    /**
     * 取消订阅
     * @param {T} handler ?
     * @param {unknown} context?
     */
    unsubscribe(handler?: T, context?: unknown, once?: boolean): void;
    /**
     * 发布消息
     * @param {unknown[]} rests
     */
    publish(...rests: unknown[]): void;
    /**
     * 清除
     */
    clear(): void;
}
