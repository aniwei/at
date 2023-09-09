import { Point } from './point';
import { Rect } from './rect';
import { Size } from './size';
export declare class Offset extends Point<Offset> {
    static ZERO: Offset;
    static INFINITE: Offset;
    static create<T>(...rests: unknown[]): Offset;
    /**
     * @param {number} direction
     * @param {number} distance
     * @returns {Offset}
     */
    static fromDirection(direction: number, distance?: number): Offset;
    /**
     * 坐标差值运算
     * @param {Offset} offsetA
     * @param {Offset} offsetB
     * @param {number} t
     * @returns {Offset | null}
     */
    static lerp(offsetA: Offset | null | undefined, offsetB: Offset | null | undefined, t: number): Offset | null;
    get distance(): number;
    get distanceSquared(): number;
    get direction(): number;
    /**
     * 放大偏移
     * @param {number} scaleX
     * @param {number} scaleY
     * @returns {Offset}
     */
    scale(scaleX: number, scaleY: number): Offset;
    /**
     * 坐标变换
     * @param {number} translateX
     * @param {number} translateY
     * @returns {Offset}
     */
    translate(translateX: number, translateY: number): Offset;
    /**
     * 取反
     * @return {Offset}
     */
    inverse(): Offset;
    /**
     * 相加
     * @param {Offset} offset
     * @returns {Offset}
     */
    add(offset: Offset): Offset;
    /**
     * 相减
     * @param {Offset} offset
     * @returns {Offset}
     */
    subtract(offset: Offset): Offset;
    /**
     * 相乘
     * @param {number} operand
     * @return {Offset}
     */
    multiply(operand: number): Offset;
    /**
     * 相除
     * @param {number} operand
     * @return {Offset}
     */
    divide(operand: number): Offset;
    /**
     * 求模
     * @param {number} operand
     * @returns {Offset}
     */
    modulo(operand: number): Offset;
    /**
     * 求余
     * @param other
     * @returns
     */
    and(other: Size): Rect;
    /**
     * 是否相等
     * @param {Offset} offset
     * @returns
     */
    equal(offset: Offset | null): boolean;
    /**
     * 是否相等
     * @param {Offset} offset
     * @returns {boolean}
     */
    notEqual(offset: Offset | null): boolean;
    toString(): string;
}
