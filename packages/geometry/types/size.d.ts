import { Point } from './point';
import { Offset } from './offset';
export declare class Size extends Point<Size> {
    static ZERO: Size;
    static INFINITE: Size;
    /**
     * 创建
     * @param {number} dx
     * @param {number} dy
     * @returns {Size}
     */
    static create(dx: number, dy: number): Size;
    /**
     * 复制
     * @param {Size} source
     * @returns {Size}
     */
    static copy(source: Size): Size;
    /**
     * 创建 Size
     * @param {number} dimension
     * @returns {Size}
     */
    static square(dimension: number): Size;
    /**
     * 创建
     * @param {number} width
     * @returns {Size}
     */
    static fromWidth(width: number): Size;
    /**
     * 创建
     * @param {number} height
     * @returns {Size}
     */
    static fromHeight(height: number): Size;
    /**
     * 创建
     * @param {number} radius
     * @returns {Size}
     */
    static fromRadius(radius: number): Size;
    /**
     * 插值
     * @param {Size | null} sizeA
     * @param {Size | null} sizeB
     * @param {number} t
     * @returns {Size}
     */
    static lerp(sizeA: Size | null | undefined, sizeB: Size | null | undefined, t: number): Size | null;
    get width(): number;
    set width(width: number);
    get height(): number;
    set height(height: number);
    get isEmpty(): boolean;
    get aspectRatio(): number;
    get shortestSize(): number;
    get longestSize(): number;
    get flipped(): Size;
    /**
     * 构造函数
     * @param {number} width
     * @param {number} height
     */
    constructor(width: number, height: number);
    /**
     * 取反
     * @returns {Size}
     */
    inverse(): Size;
    /**
     * 相加
     * @param {Size} size
     * @returns {Size}
     */
    add(size: Size): Size;
    /**
     * 相减
     * @param {Size | Offset | null} size
     * @returns
     */
    subtract(size: Size): Size;
    /**
     * 乘法
     * @param {number} operand
     * @returns {Size}
     */
    multiply(operand: number): Size;
    /**
     * 除法
     * @param {number} operand
     * @returns {Size}
     */
    divide(operand: number): Size;
    /**
     * 向下取整
     * @param {number} operand
     * @returns {Size}
     */
    floor(operand: number): Size;
    /**
     * 向上取整
     * @param {number} operand
     * @returns
     */
    ceil(operand: number): Size;
    /**
     *
     * @param origin
     * @returns
     */
    topLeft(origin: Offset): Offset;
    topCenter(origin: Offset): Offset;
    topRight(origin: Offset): Offset;
    centerLeft(origin: Offset): Offset;
    center(origin: Offset): Offset;
    centerRight(origin: Offset): Offset;
    bottomLeft(origin: Offset): Offset;
    bottomCenter(origin: Offset): Offset;
    bottomRight(origin: Offset): Offset;
    contains(offset: Offset): boolean;
    equal(size: Size | null): boolean;
    notEqual(size: Size | null): boolean;
    toString(): string;
}
