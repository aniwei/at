import { Numberic } from '@at/basic';
import { Rect } from './rect';
import { Radius } from './radius';
import { Offset } from './offset';
export declare class RRect extends Numberic<RRect> {
    /**
     * 0
     * @return {RRect}
     */
    static ZERO: RRect;
    /**
     * 创建RRect
     * @return {RRect}
     */
    static fromLTRBXY(left: number, top: number, right: number, bottom: number, radiusX: number, radiusY: number): RRect;
    /**
     * @description:
     * @return {RRect}
     */
    static fromLTRBR(left: number, top: number, right: number, bottom: number, radius: Radius): RRect;
    /**
     * 创建 RRect
     * @param {Rect} rect
     * @param {number} radiusX
     * @param {number} radiusY
     * @return {*}
     */
    static fromRectXY(rect: Rect, radiusX: number, radiusY: number): RRect;
    /**
     * 创建 RRect
     * @param {Rect} rect
     * @param {Radius} radius
     * @return {*}
     */
    static fromRectAndRadius(rect: Rect, radius: Radius): RRect;
    /**
     * 创建RRect
     * @param {Rect} rect
     * @param {Radius} topLeft
     * @param {Radius} topRight
     * @param {Radius} bottomRight
     * @param {Radius} bottomLeft
     * @return {*}
     */
    static fromRectAndCorners(rect: Rect, topLeft?: Radius, topRight?: Radius, bottomRight?: Radius, bottomLeft?: Radius): RRect;
    /**
     * @description:
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @param {Radius} topLeft
     * @param {Radius} topRight
     * @param {Radius} bottomRight
     * @param {Radius} bottomLeft
     * @return {*}
     */
    static fromLTRBAndCorners(left: number, top: number, right: number, bottom: number, topLeft?: Radius, topRight?: Radius, bottomRight?: Radius, bottomLeft?: Radius): RRect;
    /**
     * 创建 RRect
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @param {number} tlRadiusX
     * @param {number} tlRadiusY
     * @param {number} trRadiusX
     * @param {number} trRadiusY
     * @param {number} brRadiusX
     * @param {number} brRadiusY
     * @param {number} blRadiusX
     * @param {number} blRadiusY
     * @param {boolean} uniformRadii
     * @return {*}
     */
    static raw(left?: number, top?: number, right?: number, bottom?: number, tlRadiusX?: number, tlRadiusY?: number, trRadiusX?: number, trRadiusY?: number, blRadiusX?: number, blRadiusY?: number, brRadiusX?: number, brRadiusY?: number, uniformRadii?: boolean): RRect;
    get left(): number;
    set left(value: number);
    get top(): number;
    set top(value: number);
    get right(): number;
    set right(value: number);
    get bottom(): number;
    set bottom(value: number);
    get tlRadiusX(): number;
    set tlRadiusX(value: number);
    get tlRadiusY(): number;
    set tlRadiusY(value: number);
    get trRadiusX(): number;
    set trRadiusX(value: number);
    get trRadiusY(): number;
    set trRadiusY(value: number);
    get brRadiusX(): number;
    set brRadiusX(value: number);
    get brRadiusY(): number;
    set brRadiusY(value: number);
    get blRadiusX(): number;
    set blRadiusX(value: number);
    get blRadiusY(): number;
    set blRadiusY(value: number);
    get tlRadius(): Radius;
    get trRadius(): Radius;
    get blRadius(): Radius;
    get brRadius(): Radius;
    get width(): number;
    get height(): number;
    get outerRect(): Rect;
    get safeInnerRect(): Rect;
    uniformRadii: boolean;
    webOnlyUniformRadii: boolean;
    /**
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @param {number} tlRadiusX
     * @param {number} tlRadiusY
     * @param {number} trRadiusX
     * @param {number} trRadiusY
     * @param {number} brRadiusX
     * @param {number} brRadiusY
     * @param {number} blRadiusX
     * @param {number} blRadiusY
     * @param {boolean} uniformRadii
     * @return {*}
     */
    constructor(left?: number, top?: number, right?: number, bottom?: number, tlRadiusX?: number, tlRadiusY?: number, trRadiusX?: number, trRadiusY?: number, brRadiusX?: number, brRadiusY?: number, blRadiusX?: number, blRadiusY?: number, uniformRadii?: boolean);
    /**
     * @description:
     * @param {number} min
     * @param {number} radiusA
     * @param {number} radiusB
     * @param {number} limit
     * @return {*}
     */
    min(min: number, radiusA: number, radiusB: number, limit: number): number;
    /**
     * @description:
     * @return {*}
     */
    scaleRadii(): RRect;
    /**
     * @description:
     * @param {Offset} point
     * @return {*}
     */
    contains(point: Offset): boolean;
    /**
     * @description:
     * @param {Offset} offset
     * @return {*}
     */
    translate(offset: Offset): RRect;
    /**
     * 扩大
     * @param {number} delta
     * @return {RRect}
     */
    inflate(delta: number): RRect;
    /**
     * 缩小
     * @param {number} delta
     * @return {RRect}
     */
    deflate(delta: number): RRect;
    /**
     * 是否相等
     * @param {RRect} other
     * @return {boolean}
     */
    equal(other: RRect | null): boolean;
    /**
     * 是否相等
     * @param {RRect | null} other
     * @returns {boolean}
     */
    notEqual(other: RRect | null): boolean;
}
