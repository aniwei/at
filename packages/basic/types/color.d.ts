/**
 * 放大颜色 Alpha
 * @param {Color} a
 * @param {number} factor
 * @returns {Color}
 */
export declare function scaleAlpha(a: Color, factor: number): Color;
/**
 * 颜色类
 */
export declare class Color extends Array<number> {
    static BLACK: Color;
    /**
     * 创建
     * @param {number} value
     * @returns {Color}
     */
    static create(value: number): Color;
    /**
     * 插值运算
     * @param {Color | null} a
     * @param {Color | null} b
     * @param {number} t
     * @returns {Color | null}
     */
    static lerp(a: Color | null, b: Color | null, t: number): Color | null;
    /**
     * 解析颜色字符串
     * @param {string} color
     * @returns {Color}
     */
    static fromString(color: string): Color;
    /**
     * 创建颜色
     * @param {number} a
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @returns
     */
    static fromARGB(...rest: number[]): Color;
    /**
     * 通过 RGBO 创建 Color 对象
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} o
     * @return {*}
     */
    static fromRGBO(...rest: number[]): Color;
    /**
     * Alpha 颜色混合
     * @param {Color} foreground
     * @param {Color} background
     * @return {Color}
     */
    static alphaBlend(foreground: Color, background: Color): Color;
    /**
     *
     * @param {number} component
     * @returns {number}
     */
    static linearizeColorComponent(component: number): number;
    /**
     * 从 Opacity 计算 Alpha 值
     * @param {number} opacity
     * @returns {number}
     */
    static computeAlphaFromOpacity(opacity: number): number;
    get alpha(): number;
    get opacity(): number;
    get red(): number;
    get green(): number;
    get blue(): number;
    get value(): number;
    /**
     * 构造函数
     * @param {number} value
     */
    constructor(value: number);
    /**
     * @param {number} a
     * @return {Color}
     */
    withAlpha(a: number): Color;
    /**
     *
     * @param {number} opacity
     * @returns {Color}
     */
    withOpacity(opacity: number): Color;
    /**
     *
     * @param {number} r
     * @returns {Color}
     */
    withRed(r: number): Color;
    /**
     *
     * @param {number} g
     * @returns {Color}
     */
    withGreen(g: number): Color;
    /**
     *
     * @param {number} b
     * @returns {Color}
     */
    withBlue(b: number): Color;
    /**
     *
     * @returns {number}
     */
    computeLuminance(): number;
    /**
     * 判断颜色值是否相等
     * @param {Color} color
     * @returns {boolean}
     */
    equal(color: Color | null): boolean;
    /**
     *
     * @param color
     * @returns
     */
    notEqual(color: Color | null): boolean;
    toJSON(): number[];
    /**
     * 输出颜色字符串值
     * @returns {string}
     */
    toString(format?: 'hex' | ''): string;
}
