import { Point } from './point';
export declare class Radius extends Point<Radius> {
    static ZERO: Radius;
    /**
     *
     * @param {number} dx
     * @param {number} dy
     * @returns
     */
    static create(dx: number, dy: number): Radius;
    /**
     * 插值计算
     * @param {Radius} a
     * @param {Radius} b
     * @param {number} t
     * @return {*}
     */
    static lerp(a: Radius | null | undefined, b: Radius | null | undefined, t: number): Radius | null;
    /**
     * @description:
     * @param {number} radius
     * @return {*}
     */
    static circular(radius: number): Radius;
    /**
     * @param {number} x
     * @param {number} y
     * @return {*}
     */
    static elliptical(x: number, y: number): Radius;
    get x(): number;
    set x(x: number);
    get y(): number;
    set y(y: number);
    /**
     *构造函数
     * @param {number} x
     * @param {number} y
     * @return {*}
     */
    constructor(x: number, y: number);
    /**
     * 取反
     * @returns {Radius}
     */
    inverse(): Radius;
    /**
     * 相加
     * @param {Radius} radius
     * @returns {Radius}
     */
    add(radius: Radius): Radius;
    /**
     * 相减
     * @param {Radius} radius
     * @returns {Radius}
     */
    subtract(radius: Radius): Radius;
    /**
     * 相乘
     * @param {Radius} radius
     * @returns {Radius}
     */
    multiply(radius: number): Radius;
    /**
     * 相除
     * @param {Radius} radius
     * @returns {Radius}
     */
    divide(radius: number): Radius;
    /**
     * 求余
     * @param {Radius} radius
     * @returns {Radius}
     */
    modulo(radius: number): Radius;
    /**
     * 克隆
     * @returns {Radius}
     */
    clone(): Radius;
    /**
     * 比较两个对象
     * @param {Radius | null} radius
     * @returns {boolean}
     */
    equal(radius: Radius | null): boolean;
    /**
     * 比较像个对象
     * @param {Radius} radius
     * @returns {boolean}
     */
    notEqual(radius: Radius | null): boolean;
    toString(): string;
}
