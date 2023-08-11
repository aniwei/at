import { invariant } from 'ts-invariant'
import { At } from '../at'
import { lerp } from './helper'

/**
 * 坐标
 */
export abstract class Point extends Array<number> {
  // => dx
  public get dx () {
    return this[0]
  }
  public set dx (dx) {
    this[0] = dx
  }

  // => dy
  public get dy () {
    return this[1]
  }
  public set dy (dy) {
    this[1] = dy
  }

  /**
   * 构造函数
   * @param {number} dx 
   * @param {number} dy 
   * @param {number[]} rest 
   */
  constructor (dx: number, dy: number, ...rest: number[]) {
    super(dx, dy, ...rest)
    
    invariant(dx !== null, `The argument dx cannot be null.`)
    invariant(dy !== null, `The argument dy cannot be null.`)
  }
}

export class Offset extends Point {
  static zero = new Offset(0, 0)
  static infinite = new Offset(Infinity, Infinity)

  /**
   * 
   * @param dx 
   * @param dy 
   * @returns 
   */
  static create (dx: number, dy: number) {
    return new Offset(dx, dy)
  }
 
  /**
   * @param {number} direction
   * @param {number} distance
   * @returns {Offset}
   */
  static fromDirection (direction: number, distance: number = 1.0) {
    const offset = new Offset(
      distance * Math.cos(direction),
      distance * Math.sin(direction)
    )

    return offset
  }

  /**
   * 
   * @param offset 
   * @returns 
   */
  static isFinite (offset: Offset) {
    return (
      Number.isFinite(offset.dx) && 
      Number.isFinite(offset.dy)
    )
  }

  /**
   * 
   * @param offset 
   * @returns 
   */
  static isInfinite (offset: Offset) {
    return !Offset.isFinite(offset)
  }

  /**
   * 坐标差值运算
   * @param {Offset} offsetA
   * @param {Offset} offsetB
   * @param {number} t
   * @returns {Offset | null}
   */
  static lerp (
    offsetA: Offset | null = null, 
    offsetB: Offset | null = null, 
    t: number
  ): Offset | null {
    invariant(t !== null, `The argument "t" cannot be null`)

    if (offsetB === null) {
      if (offsetA === null) {
        return null
      } else {
        return offsetA.multiply(1.0 - t)
      }
    } else {
      if (offsetA === null) {
        return offsetB.multiply(t)
      } else {
        return new Offset(
          lerp(offsetA.dx, offsetB.dx, t),
          lerp(offsetA.dy, offsetB.dy, t)
        )
      }
    }
  }

  public get distance () {
    return Math.sqrt(
      this.dx * this.dx + 
      this.dy * this.dy
    )
  }

  public get distanceSquared () {
    return this.dx * this.dx + this.dy * this.dy
  }

  public get direction () {
    return Math.atan2(this.dy, this.dx)
  }

  /**
   * 
   * @param {number} scaleX
   * @param {number} scaleY
   * @returns {Offset}
   */
  scale (scaleX: number, scaleY: number): Offset {
    return new Offset(
      this.dx * scaleX, 
      this.dy * scaleY
    )
  }

  /**
   * 坐标变换
   * @param {number} translateX
   * @param {number} translateY
   * @returns {Offset}
   */
  translate (translateX: number, translateY: number): Offset {
    return new Offset(
      this.dx + translateX, 
      this.dy + translateY
    )
  }

  /**
   * 取反
   * @return {Offset}
   */
  negate () {
    return new Offset(-this.dx, -this.dy)
  }

  /**
   * 相加
   * @param {Offset} offset
   * @returns {Offset}
   */
  add (offset: Offset): Offset {
    return new Offset(this.dx + offset.dx, this.dy + offset.dy)
  }

  /**
   * 相减
   * @param {Offset} offset
   * @returns {Offset}
   */
  subtract (offset: Offset): Offset {
    return new Offset(this.dx - offset.dx, this.dy - offset.dy)
  }

  /**
   * @description: 相乘
   * @param {number} operand
   * @return {Offset}
   */  
  multiply (operand: number): Offset {
    return new Offset(this.dx * operand, this.dy * operand)
  }

  /**
   * @description: 相除
   * @param {number} operand
   * @return {*}
   */  
  divide (operand: number): Offset {
    return new Offset(
      this.dx / operand, 
      this.dy / operand
    )
  }

  /**
   * 
   * @param operand 
   * @returns 
   */
  modulo (operand: number): Offset {
    return new Offset(
      Math.floor(this.dx / operand),
      Math.floor(this.dy / operand)
    )
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  and (other: Size): Rect {
    return Rect.fromLTWH(
      this.dx, 
      this.dy, 
      other.width, 
      other.height
    )
  }

  /**
   * 
   * @param offset 
   * @returns 
   */
  equal (offset: Offset | null): boolean {
    return (
      offset instanceof Offset &&
      offset.dx === this.dx &&
      offset.dy === this.dy
    )
  }

  /**
   * 
   * @param offset 
   * @returns 
   */
  notEqual (offset: Offset | null): boolean {
    return !this.equal(offset)
  }

  toString () {
    return `Offset(dx: ${this.dx.toFixed(1)}, dy: ${this.dy.toFixed(1)})`
  }
}

export class Size extends Point {
  static zero = new Size(0.0, 0.0)
  static infinite = new Size(Infinity, Infinity)

  static create (dx: number, dy: number) {
    return new Size(dx, dy)
  }

  static isFinite (size: Size) {
    return (
      Number.isFinite(size.width) && 
      Number.isFinite(size.height)
    )
  }

  static isInfinite (size: Size) {
    return !Size.isFinite(size)
  }

  static copy (source: Size) {
    return new Size(source.width, source.height)
  }

  static square (dimension: number) {
    return new Size(dimension, dimension)
  }

  static fromWidth (width: number) {
    return new Size(width, Infinity)
  }

  static fromHeight (height: number) {
    return new Size(height, Infinity)
  }

  static fromRadius (radius: number) {
    return new Size(radius * 2, radius * 2)
  }

  static lerp (
    sizeA: Size | null = null,
    sizeB: Size | null = null,
    t: number
  ): Size | null {
    invariant(t !== null)

    if (sizeB === null) {
      if (sizeA === null) {
        return null
      } else {
        return sizeA.multiply(1 - t)
      }
    } else {
      if (sizeA === null) {
        return sizeB.multiply(t)
      } else {
        return new Size(
          lerp(sizeA.width, sizeB.width, t), 
          lerp(sizeA.height, sizeB.height, t)
        )
      }
    }
  }

  public get width (): number {
    return this[2]
  }

  public set width (width: number) {
    this[2] = width
  }

  public get height (): number {
    return this[3]
  }

  public set height (height: number) {
    this[3] = height
  }

  public get isEmpty (): boolean {
    return (
      this.width <= 0 ||
      this.height <= 0
    )
  }

  public get aspectRatio () {
    if (this.height !== 0) {
      return this.width / this.height
    } else if (this.width > 0) {
      return Infinity
    } else if (this.width < 0) {
      return Infinity
    }
    
    return 0
  }

  public get shortestSize (): number {
    return (
      Math.min(
        Math.abs(this.width), 
        Math.abs(this.height)
      )
    )
  }

  public get longestSize (): number {
    return (
      Math.max(
        Math.abs(this.width), 
        Math.abs(this.height)
      )
    )
  }

  public get flipped (): Size {
    return new Size(this.height, this.width)
  }

  constructor (
    width: number, 
    height: number
  ) {
    super (
      Infinity, 
      Infinity,
      width,
      height
    )
  }

  negate (): Size {
    return new Size(-this.width, -this.width)
  }

  add (size: Size): Size {
    return new Size(this.width + size.width, this.height + size.height)
  }

  subtract (size: Size | Offset): Size | Offset {
    if (size instanceof Size) {
      return new Offset(
        this.width - size.width, 
        this.height - size.height
      )
    }

    return new Size(this.width - size.dx, this.height - size.dy)
  }

  multiply (operand: number): Size {
    return new Size(this.width * operand, this.height * operand)
  }

  divide (operand: number): Size {
    return new Size(this.width / operand, this.height / operand)
  }

  floor (operand: number): Size {
    return new Size(
      Math.floor(this.width / operand),
      Math.floor(this.height / operand)
    )
  }

  ceil (operand: number): Size {
    return new Size(
      Math.ceil(this.width / operand),
      Math.ceil(this.height / operand)
    )
  }

  topLeft (origin: Offset): Offset {
    return origin
  }

  topCenter (origin: Offset): Offset {
    return new Offset(
      origin.dx + this.width / 2,
      origin.dy
    )
  }

  topRight (origin: Offset): Offset {
    return new Offset(
      origin.dx + this.width,
      origin.dy
    )
  }

  centerLeft (origin: Offset): Offset {
    return new Offset(
      origin.dx,
      origin.dy + this.height / 2
    )
  }

  center (origin: Offset): Offset {
    return new Offset(
      origin.dx + this.width / 2,
      origin.dy + this.height / 2
    )
  }

  centerRight (origin: Offset): Offset {
    return new Offset(
      origin.dx + this.width,
      origin.dy + this.height / 2
    )
  }

  bottomLeft (origin: Offset): Offset {
    return new Offset(
      origin.dx,
      origin.dy + this.height
    )
  }

  bottomCenter (origin: Offset): Offset {
    return new Offset(
      origin.dx + this.width / 2,
      origin.dy + this.height
    )
  }

  bottomRight (origin: Offset): Offset {
    return new Offset(
      origin.dx + this.width,
      origin.dy + this.height
    )
  }

  contains (offset: Offset) {
    return (
      offset.dx >= 0 &&
      offset.dx < this.width &&
      offset.dy >= 0 &&
      offset.dy < this.height
    )
  }

  isFinite () {
    return Size.isFinite(this)
  }

  equal (size: Size | null) {
    return (
      size instanceof Size &&
      size.width === this.width &&
      size.height === this.height
    )
  }

  notEqual (size: Size | null) {
    return !this.equal(size)
  }
}

export class Radius {
  static zero = Radius.circular(0)

  /**
   * 
   * @param dx 
   * @param dy 
   * @returns 
   */
  static create (dx: number, dy: number) {
    return new Radius(dx, dy)
  }

  /**
   * @description: 插值计算
   * @param {Radius} a
   * @param {Radius} b
   * @param {number} t
   * @return {*}
   */
  static lerp(
    a: Radius | null = null, 
    b: Radius | null = null, 
    t: number
  ): Radius | null {
    invariant(t !== null, `t cannot be null.`)
    if (b === null) {
      if (a === null) {
        return null
      } else {
        const k = 1.0 - t
        return Radius.elliptical(
          a.x * k, 
          a.y * k
        )
      }
    } else {
      if (a === null) {
        return Radius.elliptical(
          b.x * t, 
          b.y * t
        )
      } else {
        return Radius.elliptical(
          lerp(a.x, b.x, t), 
          lerp(a.y, b.y, t)
        )
      }
    }
  }

  /**
   * @description: 
   * @param {number} radius
   * @return {*}
   */  
  static circular (radius: number) {
    return Radius.elliptical(radius, radius)
  }

  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @return {*}
   */  
  static elliptical (x: number, y: number) {
    return new Radius(x, y)
  }

  public x: number
  public y: number

  /**
   * @description: 构造函数
   * @param {number} x
   * @param {number} y
   * @return {*}
   */  
  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }

  negate (): Radius {
    return Radius.elliptical(-this.x, -this.y)
  }

  add (radius: Radius): Radius {
    return Radius.elliptical(
      this.x + radius.x, 
      this.y + radius.y
    )
  }

  subtract (radius: Radius): Radius {
    return Radius.elliptical(
      this.x - radius.x, 
      this.y - radius.y
    )
  }

  multiply (radius: number): Radius {
    return Radius.elliptical(this.x * radius, this.y * radius)
  }

  divide (radius: number): Radius {
    return Radius.elliptical(this.x / radius, this.y / radius)
  }

  modulo (radius: number): Radius {
    return Radius.elliptical(this.x & radius, this.y % radius)
  }

  equal (radius: Radius | null) {
    return (
      radius instanceof Radius &&
      radius.x === this.x &&
      radius.y === this.y
    )
  }

  notEqual (radius: Radius | null) {
    return !this.equal(radius)
  }

  toString () {
    return this.x === this.y ?
      `Radius.circular(${this.x.toFixed(1)})` :
      `Radius.elliptical(${this.x.toFixed(1)})`
  }
}

export class Rect extends Array<number> {
  static zero = new Rect(0, 0, 0, 0)
  static get largest () {
    return At.kGeometryLargestRect
  } 

  /**
   * 
   * @param left 
   * @param top 
   * @param right 
   * @param bottom 
   * @returns 
   */
  static create (left: number, top: number, right: number, bottom: number) {
    return Rect.fromLTRB(left, top, right, bottom)
  }

  /**
   * 
   * @param left 
   * @param top 
   * @param right 
   * @param bottom 
   * @returns 
   */
  static fromLTRB (left: number, top: number, right: number, bottom: number) {
    return new Rect(left, top, right, bottom)
  }

  /**
   * 
   * @param left 
   * @param top 
   * @param width 
   * @param height 
   * @returns 
   */
  static fromLTWH (left: number, top: number, width: number, height: number) {
    return new Rect(left, top, left + width, top + height)
  }

  /**
   * 
   * @param center 
   * @param radius 
   * @returns 
   */
  static fromCircle (center: Offset, radius: number) {
    return Rect.fromCenter(
      center, 
      radius * 2, 
      radius * 2
    )
  }

  static fromCenter (
    center: Offset,
    width: number,
    height: number
  ) {
    return new Rect(
      center.dx - width / 2, 
      center.dy - height / 2,
      center.dx + width / 2,
      center.dy + height / 2
    )
  }

  static fromPonumbers (offsetA: Offset, offsetB: Offset) {
    return new Rect(
      Math.min(offsetA.dx, offsetB.dx),
      Math.min(offsetA.dy, offsetB.dy),
      Math.max(offsetA.dx, offsetB.dx),
      Math.max(offsetA.dy, offsetB.dy)
    )
  }

  static lerp (a: Rect | null, b: Rect | null, t: number): Rect | null {
    invariant(t !== null)
    if (b === null) {
      if (a === null) {
        return null
      } else {
        const k = 1.0 - t
        return Rect.fromLTRB(a.left * k, a.top * k, a.right * k, a.bottom * k)
      }
    } else {
      if (a === null) {
        return Rect.fromLTRB(b.left * t, b.top * t, b.right * t, b.bottom * t)
      } else {
        return Rect.fromLTRB(
          lerp(a.left, b.left, t),
          lerp(a.top, b.top, t),
          lerp(a.right, b.right, t),
          lerp(a.bottom, b.bottom, t),
        )
      }
    }
  }

  public get left () {
    return this[0]
  }
  public set left (value: number) {
    this[0] = value
  }
  public get top () {
    return this[1]
  }
  public set top (value: number) {
    this[1] = value
  }
  public get right () {
    return this[2]
  }
  public set right (value: number) {
    this[2] = value
  }
  public get bottom () {
    return this[3]
  }
  public set bottom (value: number) {
    this[3] = value
  }

  public get width (): number {
    return this.right - this.left
  }

  public get height (): number {
    return this.bottom - this.top
  }

  public get size (): Size {
    return new Size(this.width, this.height)
  }

  public get isInfinite () {
    return (
      this.left > Infinity ||
      this.top > Infinity ||
      this.right > Infinity ||
      this.bottom > Infinity
    )
  }

  public get isFinite () {
    return (
      Number.isFinite(this.left) &&
      Number.isFinite(this.top) &&
      Number.isFinite(this.right) &&
      Number.isFinite(this.bottom) 
    )
  }

  public get isNaN () {
    return (
      Number.isNaN(this.left) ||
      Number.isNaN(this.top) ||
      Number.isNaN(this.right) || 
      Number.isNaN(this.bottom)
    )
  }

  public get isEmpty () {
    return (
      this.left >= this.right ||
      this.top >= this.bottom
    )
  }

  public get shortestSide () {
    return Math.min(
      Math.abs(this.width), 
      Math.abs(this.height)
    )
  }

  public get longestSide () {
    return Math.min(
      Math.abs(this.width), 
      Math.abs(this.height)
    )
  }

  public get topLeft (): Offset {
    return new Offset(this.left, this.top)
  }

  public get topCenter (): Offset {
    return new Offset(
      this.left + this.width / 2, 
      this.top
    )
  }

  public get topRight (): Offset {
    return new Offset(this.right, this.top)
  }

  public get centerLeft (): Offset {
    return new Offset(
      this.left,
      this.top + this.height / 2
    )
  }

  public get center (): Offset {
    return new Offset(
      this.left + this.width / 2,
      this.top + this.height / 2
    )
  }

  public get centerRight (): Offset {
    return new Offset(
      this.right,
      this.top + this.height / 2
    )
  }

  public get bottomLeft (): Offset {
    return new Offset(
      this.left,
      this.bottom,
    )
  }

  public get bottomCenter (): Offset {
    return new Offset(
      this.left + this.width / 2,
      this.bottom,
    )
  }

  public get bottomRight (): Offset {
    return new Offset(
      this.left,
      this.bottom,
    )
  }

  constructor (
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ) {
    super(left, top, right, bottom)
  }

  shift (): number
  shift (offset: Offset): Rect
  shift (offset?: Offset): number | Rect | undefined {
    if (offset !== undefined) {
      return Rect.fromLTRB(
        this.left + offset.dx, 
        this.top + offset.dy,
        this.right + offset.dx,
        this.bottom + offset.dy
      )
    }
  }

  translate (translateX: number, translateY: number) {
    return Rect.fromLTRB(
      this.left + translateX, 
      this.top + translateY,
      this.right + translateX, 
      this.bottom + translateY
    )
  }

  inflate (delta: number) {
    return Rect.fromLTRB(
      this.left - delta, 
      this.top - delta, 
      this.right + delta, 
      this.bottom + delta
    )
  }

  deflate (delta: number) {
    return this.inflate(-delta)
  }

  intersect (rect: Rect) {
    return Rect.fromLTRB(
      Math.max(this.left, rect.left),
      Math.max(this.top, rect.top),
      Math.min(this.right, rect.right),
      Math.min(this.bottom, rect.bottom),
    );
  }

  expandToInclude (rect: Rect): Rect {
    return Rect.fromLTRB(
      Math.min(this.left, rect.left),
      Math.min(this.top, rect.top),
      Math.max(this.right, rect.right),
      Math.max(this.bottom, rect.bottom)
    )
  }

  overlaps (rect: Rect): boolean {
    if (
      this.right <= rect.left ||
      rect.right <= this.left
    ) {
      return false
    }

    if (
      this.bottom <= rect.top ||
      rect.bottom <= this.top
    ) {
      return false
    }

    return true
  }

  contains (offset: Offset): boolean {
    return (
      offset.dx >= this.left &&
      offset.dx < this.right &&
      offset.dy >= this.top &&
      offset.dy < this.bottom
    )
  }

  equal (rect: Rect | null): boolean {
    return (
      rect instanceof Rect &&
      this.left === rect.left &&
      this.top === rect.top &&
      this.right === rect.right &&
      this.bottom === rect.bottom
    )
  }

  notEqual (rect: Rect | null) {
    return this.equal(rect)
  }

  toString () {
    return `Rect.fromLTRB(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`
  }  
}

export class RRect extends Array<number> {
  /**
   * @description: 
   * @return {RRect}
   */  
  static zero = RRect.raw()

  /**
   * @description: 
   * @return {RRect}
   */  
  static fromLTRBXY (
    left: number, 
    top: number, 
    right: number, 
    bottom: number,
    radiusX: number,
    radiusY: number
  ) {
    return new RRect(
      left,
      top,
      right,
      bottom,
      radiusX,
      radiusY,
      radiusX,
      radiusY,
      radiusX,
      radiusY,
      radiusX,
      radiusY,
      radiusX === radiusY
    )
  }

  /**
   * @description: 
   * @return {RRect}
   */  
  static fromLTRBR (
    left: number, 
    top: number, 
    right: number, 
    bottom: number,
    radius: Radius
  ) {
    return new RRect(
      top,
      left,
      right,
      bottom,
      radius.x,
      radius.y,
      radius.x,
      radius.y,
      radius.x,
      radius.y,
      radius.x,
      radius.y,
      radius.x === radius.y
    )
  }


  /**
   * @description: 
   * @param {Rect} rect
   * @param {number} radiusX
   * @param {number} radiusY
   * @return {*}
   */
  static fromRectXY (
    rect: Rect,
    radiusX: number,
    radiusY: number
  ) {
    return RRect.raw(
      rect.top,
      rect.left,
      rect.right,
      rect.bottom,
      radiusX,
      radiusY,
      radiusX,
      radiusY,
      radiusX,
      radiusY,
      radiusX,
      radiusY,
      radiusX === radiusY
    )
  }

  /**
   * @description: 
   * @param {Rect} rect
   * @param {Radius} radius
   * @return {*}
   */
  static fromRectAndRadius (
    rect: Rect,
    radius: Radius
  ) {
    return RRect.raw(
      rect.left,
      rect.top,
      rect.right,
      rect.bottom,
      radius.x,
      radius.y,
      radius.x,
      radius.y,
      radius.x,
      radius.y,
      radius.x,
      radius.y,
      radius.x === radius.y
    )
  }

  /**
   * @description: 
   * @param {Rect} rect
   * @param {Radius} topLeft
   * @param {Radius} topRight
   * @param {Radius} bottomRight
   * @param {Radius} bottomLeft
   * @return {*}
   */
  static fromRectAndCorners (
    rect: Rect,
    topLeft: Radius = Radius.zero,
    topRight: Radius = Radius.zero,
    bottomRight: Radius = Radius.zero,
    bottomLeft: Radius = Radius.zero,
  ) {
    return RRect.raw(
      rect.left,
      rect.top,
      rect.right,
      rect.bottom,
      topLeft.x,
      topLeft.y,
      topRight.x,
      topRight.y,
      bottomRight.x,
      bottomRight.y,
      bottomLeft.x,
      bottomLeft.y,
      (
        topLeft.x === topLeft.y &&
        topLeft.x === topRight.x &&
        topLeft.x === topRight.y &&
        topLeft.x === bottomLeft.x &&
        topLeft.x === bottomLeft.y &&
        topLeft.x === bottomRight.x &&
        topLeft.x === bottomRight.y
      )
    )
  }

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
  static fromLTRBAndCorners (
    left: number,
    top: number,
    right: number,
    bottom: number,
    topLeft: Radius = Radius.zero,
    topRight: Radius = Radius.zero,
    bottomRight: Radius = Radius.zero,
    bottomLeft: Radius = Radius.zero,
  ) {
    return RRect.raw(
      top,
      left,
      right,
      bottom,
      topLeft.x,
      topLeft.y,
      topRight.x,
      topRight.y,
      bottomLeft.x,
      bottomLeft.y,
      bottomRight.x,
      bottomRight.y,
      (
        topLeft.x == topLeft.y &&
        topLeft.x == topRight.x &&
        topLeft.x == topRight.y &&
        topLeft.x == bottomLeft.x &&
        topLeft.x == bottomLeft.y &&
        topLeft.x == bottomRight.x &&
        topLeft.x == bottomRight.y
      )
    )
  }

  /**
   * @description: 
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
  static raw(
    left: number = 0.0,
    top: number = 0.0,
    right: number = 0.0,
    bottom: number = 0.0,
    tlRadiusX: number = 0.0,
    tlRadiusY: number = 0.0,
    trRadiusX: number = 0.0,
    trRadiusY: number = 0.0,
    blRadiusX: number = 0.0,
    blRadiusY: number = 0.0,
    brRadiusX: number = 0.0,
    brRadiusY: number = 0.0,
    uniformRadii: boolean = false,
  ) {
    invariant(left !== null, `The left argument cannot be null.`)
    invariant(top !== null, `The top argument cannot be null.`)
    invariant(right !== null, `The right argument cannot be null.`)
    invariant(bottom !== null, `The bottom argument cannot be null.`)
    invariant(tlRadiusX !== null, `The tlRadiusX argument cannot be null.`)
    invariant(tlRadiusY !== null, `The tlRadiusY argument cannot be null.`)
    invariant(trRadiusX !== null, `The trRadiusX argument cannot be null.`)
    invariant(trRadiusY !== null, `The trRadiusY argument cannot be null.`)
    invariant(brRadiusX !== null, `The brRadiusX argument cannot be null.`)
    invariant(brRadiusY !== null, `The brRadiusY argument cannot be null.`)
    invariant(blRadiusX !== null, `The blRadiusX argument cannot be null.`)
    invariant(blRadiusY !== null, `The blRadiusY argument cannot be null.`)

    return new RRect(
      left,
      top,
      right,
      bottom,
      tlRadiusX,
      tlRadiusY,
      trRadiusX,
      trRadiusY,
      blRadiusX,
      blRadiusY,
      brRadiusX,
      brRadiusY,
      uniformRadii,
    )
  }

  public get left () {
    return this[0]
  }
  public set left (value: number) {
    this[0] = value
  }
  public get top () {
    return this[1]
  }
  public set top (value: number) {
    this[1] = value
  }
  public get right () {
    return this[2]
  }
  public set right (value: number) {
    this[2] = value
  }
  public get bottom () {
    return this[3]
  }
  public set bottom (value: number) {
    this[3] = value
  }
  public get tlRadiusX () {
    return this[4]
  }
  public set tlRadiusX (value: number) {
    this[4] = value
  }
  public get tlRadiusY () {
    return this[5]
  }
  public set tlRadiusY (value: number) {
    this[5] = value
  }
  public get trRadiusX () {
    return this[6]
  }
  public set trRadiusX (value: number) {
    this[6] = value
  }
  public get trRadiusY () {
    return this[7]
  }
  public set trRadiusY (value: number) {
    this[7] = value
  }
  public get brRadiusX () {
    return this[8]
  }
  public set brRadiusX (value: number) {
    this[8] = value
  }
  public get brRadiusY () {
    return this[9]
  }
  public set brRadiusY (value: number) {
    this[9] = value
  }
  public get blRadiusX () {
    return this[10]
  }
  public set blRadiusX (value: number) {
    this[10] = value
  }
  public get blRadiusY () {
    return this[11]
  }
  public set blRadiusY (value: number) {
    this[11] = value
  }
  
  public get tlRadius () {
    return Radius.elliptical(this.tlRadiusX, this.tlRadiusY)
  }

  public get trRadius () {
    return Radius.elliptical(this.trRadiusX, this.trRadiusY)
  }

  public get blRadius () {
    return Radius.elliptical(this.blRadiusX, this.blRadiusY)
  }

  public get brRadius () {
    return Radius.elliptical(this.brRadiusX, this.brRadiusY)
  }

  public get width () {
    return this.right - this.left
  }

  public get height () {
    return this.bottom - this.top
  }

  public get outerRect () {
    return Rect.fromLTRB(this.left, this.top, this.right, this.bottom)
  }

  public get safeInnerRect () {
    const kInsetFactor = 0.29289321881 // 1-cos(pi/4)

    const leftRadius = Math.max(this.blRadiusX, this.tlRadiusX)
    const topRadius = Math.max(this.tlRadiusY, this.trRadiusY)
    const rightRadius = Math.max(this.trRadiusX, this.brRadiusX)
    const bottomRadius = Math.max(this.brRadiusY, this.blRadiusY)

    return Rect.fromLTRB(
      this.left + leftRadius * kInsetFactor,
      this.top + topRadius * kInsetFactor,
      this.right - rightRadius * kInsetFactor,
      this.bottom - bottomRadius * kInsetFactor
    )
  }

  public uniformRadii: boolean = false
  public webOnlyUniformRadii: boolean

  /**
   * @description: 
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
  constructor (
    left: number = 0,
    top: number = 0,
    right: number = 0,
    bottom: number = 0,
    tlRadiusX: number = 0,
    tlRadiusY: number = 0,
    trRadiusX: number = 0,
    trRadiusY: number = 0,
    brRadiusX: number = 0,
    brRadiusY: number = 0,
    blRadiusX: number = 0,
    blRadiusY: number = 0,
    uniformRadii: boolean = false
  ) {
    super(
      left,
      top,
      right,
      bottom,
      tlRadiusX,
      tlRadiusY,
      trRadiusX,
      trRadiusY,
      brRadiusX,
      brRadiusY,
      blRadiusX,
      blRadiusY
    )

    this.uniformRadii = uniformRadii
    this.webOnlyUniformRadii = uniformRadii
  }

  /**
   * @description: 
   * @param {number} min
   * @param {number} radiusA
   * @param {number} radiusB
   * @param {number} limit
   * @return {*}
   */
  getMin (min: number, radiusA: number, radiusB: number, limit: number) {
    const sum = radiusA + radiusB
    if (sum > limit && sum !== 0) {
      return Math.min(min, limit / sum)
    }

    return min
  } 

  /**
   * @description: 
   * @return {*}
   */  
  scaleRadii () {
    let scale = 1
    const absWidth = Math.abs(this.width)
    const absHeight = Math.abs(this.height)

    scale = this.getMin(scale, this.blRadiusY, this.tlRadiusY, absHeight)
    scale = this.getMin(scale, this.tlRadiusX, this.trRadiusX, absWidth)
    scale = this.getMin(scale, this.trRadiusY, this.brRadiusY, absHeight)
    scale = this.getMin(scale, this.brRadiusX, this.blRadiusX, absWidth)

    if (scale < 1) {
      return RRect.raw(
        this.top,
        this.left,
        this.right,
        this.bottom,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale,
        this.tlRadiusX * scale
      )
    }

    return RRect.raw(
      this.top,
      this.left,
      this.right,
      this.bottom,
      this.tlRadiusX,
      this.tlRadiusX,
      this.tlRadiusX,
      this.tlRadiusX,
      this.tlRadiusX,
      this.tlRadiusX,
      this.tlRadiusX,
      this.tlRadiusX
    )
  }

  /**
   * @description: 
   * @param {Offset} point
   * @return {*}
   */  
  contains (point: Offset) {
    if (
      point.dx < this.left ||
      point.dx >= this.right ||
      point.dy < this.top ||
      point.dy >= this.bottom
    ) {
      return false
    }

     const scaled = this.scaleRadii()

    let x: number
    let y: number
    let radiusX: number
    let radiusY: number
    
    if (
      point.dx < this.left + scaled.tlRadiusX &&
      point.dy < this.top + scaled.tlRadiusY
    ) {
      x = point.dx - this.left - scaled.tlRadiusX
      y = point.dy - this.top - scaled.tlRadiusY
      radiusX = scaled.tlRadiusX
      radiusY = scaled.tlRadiusY
    } else if (
      point.dx > this.right - scaled.trRadiusX &&
      point.dy < this.top + scaled.trRadiusY
    ) {
      x = point.dx - this.right + scaled.trRadiusX
      y = point.dy - this.top - scaled.trRadiusY
      radiusX = scaled.trRadiusX
      radiusY = scaled.trRadiusY
    } else if (
      point.dx > this.right - scaled.brRadiusX &&
      point.dy > this.bottom - scaled.brRadiusY
    ) {
      x = point.dx - this.right + scaled.brRadiusX
      y = point.dy - this.bottom + scaled.brRadiusY
      radiusX = scaled.brRadiusX
      radiusY = scaled.brRadiusY
    } else if (
      point.dx < this.left + scaled.blRadiusX &&
      point.dy > this.bottom - scaled.blRadiusY
    ) {
      x = point.dx - this.left - scaled.blRadiusX
      y = point.dy - this.bottom + scaled.blRadiusY
      radiusX = scaled.blRadiusX
      radiusY = scaled.blRadiusY
    } else {
      return true
    }

    x = x / radiusX
    y = y / radiusY
    
    if (x * x + y * y > 1.0) {
      return false
    }

    return true
  }

  /**
   * @description: 
   * @param {Offset} offset
   * @return {*}
   */  
  
  shift (): number
  shift (offset: Offset): RRect
  shift (offset?: Offset): number | RRect | undefined  {
    invariant(offset, `The argument "offset" cannot be null.`)
    return RRect.raw(
      this.left + offset.dx,
      this.top + offset.dy,
      this.right + offset.dx,
      this.bottom + offset.dy,
      this.tlRadiusX,
      this.tlRadiusY,
      this.trRadiusX,
      this.trRadiusY,
      this.blRadiusX,
      this.blRadiusY,
      this.brRadiusX,
      this.brRadiusY,
    )
  }

  /**
   * @description: 
   * @param {number} delta
   * @return {*}
   */  
  inflate (delta: number) {
    return RRect.raw(
      this.left - delta,
      this.top - delta,
      this.right + delta,
      this.bottom + delta,
      this.tlRadiusX + delta,
      this.tlRadiusY + delta,
      this.trRadiusX + delta,
      this.trRadiusY + delta,
      this.brRadiusX + delta,
      this.brRadiusY + delta,
      this.blRadiusX + delta,
      this.blRadiusY + delta,
    )
  }

  /**
   * @description: 
   * @param {number} delta
   * @return {*}
   */  
  deflate (delta: number) {
    return this.inflate(-delta)
  }

  /**
   * @description: 
   * @param {RRect} other
   * @return {*}
   */  
  equal (other: RRect | null) {
    return (
      other instanceof RRect &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom &&
      other.tlRadiusX === this.tlRadiusX &&
      other.tlRadiusY === this.tlRadiusY &&
      other.trRadiusX === this.trRadiusX &&
      other.trRadiusY === this.trRadiusY &&
      other.blRadiusX === this.blRadiusX &&
      other.blRadiusY === this.blRadiusY &&
      other.brRadiusX === this.brRadiusX &&
      other.brRadiusY === this.brRadiusY
    )
  }

  notEqual (other: RRect | null) {
    return !this.equal(other)
  }
}