import { Numberic } from '@at/basic';
import { Offset } from './offset';
import { Size } from './size';
export declare class Rect extends Numberic<Rect> {
    static ZERO: Rect;
    static LARGEST: Rect;
    /**
     *
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @returns {Rect}
     */
    static create(left: number, top: number, right: number, bottom: number): Rect;
    /**
     * 创建 Rect
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @returns {Rect}
     */
    static fromLTRB(left: number, top: number, right: number, bottom: number): Rect;
    /**
     * 创建 Rect
     * @param {number} left
     * @param {number} top
     * @param {number} width
     * @param {number} height
     * @returns
     */
    static fromLTWH(left: number, top: number, width: number, height: number): Rect;
    /**
     *
     * @param {Offset} center
     * @param {number} radius
     * @returns
     */
    static fromCircle(center: Offset, radius: number): Rect;
    /**
     * 从中心
     * @param {Offset} center
     * @param {number} width
     * @param {number} height
     * @returns {Rect}
     */
    static fromCenter(center: Offset, width: number, height: number): Rect;
    /**
     *
     * @param {Offset} offsetA
     * @param {Offset} offsetB
     * @returns {Rect}
     */
    static fromPonumbers(offsetA: Offset, offsetB: Offset): Rect;
    /**
     * 差值计算
     * @param a
     * @param b
     * @param t
     * @returns
     */
    static lerp(a: Rect | null, b: Rect | null, t: number): Rect | null;
    get left(): number;
    set left(value: number);
    get top(): number;
    set top(value: number);
    get right(): number;
    set right(value: number);
    get bottom(): number;
    set bottom(value: number);
    get width(): number;
    get height(): number;
    get size(): Size;
    get isEmpty(): boolean;
    get shortestSide(): number;
    get longestSide(): number;
    get topLeft(): Offset;
    get topCenter(): Offset;
    get topRight(): Offset;
    get centerLeft(): Offset;
    get center(): Offset;
    get centerRight(): Offset;
    get bottomLeft(): Offset;
    get bottomCenter(): Offset;
    get bottomRight(): Offset;
    constructor(...rests: unknown[]);
    shift(): number;
    shift(offset: Offset): Rect;
    translate(offset: Offset, ...rests: unknown[]): Rect;
    /**
     * 扩大范围
     * @param {number} delta
     * @returns {Rect}
     */
    inflate(delta: number): Rect;
    /**
     * 缩小范围
     * @param {number} delta
     * @returns {Rect}
     */
    deflate(delta: number): Rect;
    /**
     * 求相交部分
     * @param {Rect} rect
     * @returns {Rect}
     */
    intersect(rect: Rect): Rect;
    /**
     * 求相交最大Rect
     * @param {Rect} rect
     * @returns {Rect}
     */
    expandToInclude(rect: Rect): Rect;
    /**
     * 判断是否重叠
     * @param {Rect} rect
     * @returns {Boolean}
     */
    overlaps(rect: Rect): boolean;
    /**
     * 判断是否包含某个点
     * @param {Offset} offset
     * @returns {boolean}
     */
    contains(offset: Offset): boolean;
    /**
     * 判断是否相等
     * @param {Rect | null} rect
     * @returns {boolean}
     */
    equal(rect: Rect | null): boolean;
    /**
     * 判断是否相等
     * @param {Rect | null} rect
     * @returns {boolean}
     */
    notEqual(rect: Rect | null): boolean;
    toString(): string;
}
