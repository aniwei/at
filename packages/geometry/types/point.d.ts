import { Numberic } from '@at/basic';
/**
 * 坐标类
 */
export interface CreateFactory {
    new (...rests: unknown[]): unknown;
    create(...rests: unknown[]): unknown;
}
export declare abstract class Point<T extends Point<T>> extends Numberic<T> {
    static create(...rests: unknown[]): unknown;
    get dx(): number;
    set dx(dx: number);
    get dy(): number;
    set dy(dy: number);
    /**
     * 构造函数
     * @param {number} dx
     * @param {number} dy
     * @param {number[]} rest
     */
    constructor(...rests: unknown[]);
}
