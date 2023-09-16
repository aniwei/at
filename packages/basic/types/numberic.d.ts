import { Equalable } from './equalable';
export interface Numberic<T extends Numberic<T>> extends ArrayLike<number>, Iterable<number> {
    length: number;
    [Symbol.iterator](): Iterator<number>;
    [n: number]: number;
}
export interface CreateFactory {
    new (...rests: unknown[]): unknown;
    create(...rests: unknown[]): unknown;
}
export declare abstract class Numberic<T extends Numberic<T>> extends Equalable<T> {
    static create(...rests: unknown[]): unknown;
    get isFinite(): boolean;
    get isInfinite(): boolean;
    get isNaN(): boolean;
    length: number;
    /**
     * 构造函数
     * @param {T[]} rests
     */
    constructor(...rests: number[]);
}
