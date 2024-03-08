import { invariant } from '@at/utils'
import { ArrayLike } from '@at/basic'
import { lerp } from '@at/utils'
import { Offset } from './offset'
import { Size } from './size'


/**
 * 判断是否有效 Rect
 * @param {Rect} rect
 * @return {*}
 */
export function rectIsValid (rect: Rect) {
  invariant(rect !== null, 'Rect argument cannot be null.')
  invariant(
    !(isNaN(rect.left) || isNaN(rect.right) || isNaN(rect.top) || isNaN(rect.bottom)),
    'Rect argument contained a NaN value.'
  )
  return true
}

export class Rect extends ArrayLike<Rect> {
  static ZERO = new Rect(0, 0, 0, 0)
  static LARGEST = new Rect(-1.0E+9, -1.0E+9, 1.0E+9, 1.0E+9)
    
  static zero () {
    return new Rect(0, 0, 0, 0)
  }

  /**
   * 
   * @param {number} left 
   * @param {number} top 
   * @param {number} right 
   * @param {number} bottom 
   * @returns {Rect}
   */
  static create (
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ): Rect {
    return Rect.fromLTRB(left, top, right, bottom) as Rect
  }

  /**
   * 创建 Rect
   * @param {number} left 
   * @param {number} top 
   * @param {number} right 
   * @param {number} bottom 
   * @returns {Rect}
   */
  static fromLTRB (
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ) {
    return new Rect(left, top, right, bottom)
  }
  
  /**
   * 创建 Rect
   * @param {number} left 
   * @param {number} top 
   * @param {number} width 
   * @param {number} height 
   * @returns 
   */
  static fromLTWH (
    left: number, 
    top: number, 
    width: number, 
    height: number
  ) {
    return new Rect(left, top, left + width, top + height)
  }
  
  /**
   * 
   * @param {Offset} center 
   * @param {number} radius 
   * @returns 
   */
  static fromCircle (center: Offset, radius: number) {
    return Rect.fromCenter(
      center, 
      radius * 2, 
      radius * 2
    )
  }

  /**
   * 从中心
   * @param {Offset} center 
   * @param {number} width 
   * @param {number} height 
   * @returns {Rect}
   */
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
  
  /**
   * 
   * @param {Offset} offsetA 
   * @param {Offset} offsetB 
   * @returns {Rect}
   */
  static fromPonumbers (offsetA: Offset, offsetB: Offset): Rect {
    return new Rect(
      Math.min(offsetA.dx, offsetB.dx),
      Math.min(offsetA.dy, offsetB.dy),
      Math.max(offsetA.dx, offsetB.dx),
      Math.max(offsetA.dy, offsetB.dy)
    )
  }
  
  /**
   * 差值计算
   * @param a 
   * @param b 
   * @param t 
   * @returns 
   */
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
  
  // => left
  public get left () {
    return this[0]
  }
  public set left (value: number) {
    this[0] = value
  }
  
  // => top
  public get top () {
    return this[1]
  }
  public set top (value: number) {
    this[1] = value
  }

  // => right
  public get right () {
    return this[2]
  }
  public set right (value: number) {
    this[2] = value
  }

  // => bottom
  public get bottom () {
    return this[3]
  }
  public set bottom (value: number) {
    this[3] = value
  }

  // => width
  public get width (): number {
    return this.right - this.left
  }

  // => height
  public get height (): number {
    return this.bottom - this.top
  }

  // => size
  public get size (): Size {
    return new Size(this.width, this.height)
  }

  // => isEmapy
  public get isEmpty () {
    return (
      this.left >= this.right ||
      this.top >= this.bottom
    )
  }

  // => shortestSide
  public get shortestSide () {
    return Math.min(
      Math.abs(this.width), 
      Math.abs(this.height)
    )
  }

  // => longestSide
  public get longestSide () {
    return Math.min(
      Math.abs(this.width), 
      Math.abs(this.height)
    )
  }

  // => topLeft
  public get topLeft (): Offset {
    return new Offset(this.left, this.top)
  }

  // => topCenter
  public get topCenter (): Offset {
    return new Offset(
      this.left + this.width / 2, 
      this.top
    )
  }

  // => topRight
  public get topRight (): Offset {
    return new Offset(this.right, this.top)
  }

  // => centerLeft
  public get centerLeft (): Offset {
    return new Offset(
      this.left,
      this.top + this.height / 2
    )
  }

  // => center
  public get center (): Offset {
    return new Offset(
      this.left + this.width / 2,
      this.top + this.height / 2
    )
  }

  // => centerRight
  public get centerRight (): Offset {
    return new Offset(
      this.right,
      this.top + this.height / 2
    )
  }

  // => bottomLeft
  public get bottomLeft (): Offset {
    return new Offset(
      this.left,
      this.bottom,
    )
  }

  // => bottomCenter
  public get bottomCenter (): Offset {
    return new Offset(
      this.left + this.width / 2,
      this.bottom,
    )
  }

  // => bottomRight
  public get bottomRight (): Offset {
    return new Offset(
      this.left,
      this.bottom,
    )
  }

  constructor (...rests: unknown[])
  /**
   * 
   * @param left 
   * @param top 
   * @param right 
   * @param bottom 
   */
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

  translate (offset: Offset, ...rests: unknown[]): Rect
  /**
   * 偏移
   * @param {number} translateX 
   * @param {number} translateY 
   * @returns {Rect}
   */
  translate (translateX: number | Offset, translateY: number) {      
    if (translateX instanceof Offset) {
      translateY = translateX.dy
      translateX = translateX.dx
    }

    return Rect.fromLTRB(
      this.left + translateX, 
      this.top + translateY,
      this.right + translateX, 
      this.bottom + translateY
    )
  }

  /**
   * 扩大范围
   * @param {number} delta 
   * @returns {Rect}
   */
  inflate (delta: number) {
    return Rect.fromLTRB(
      this.left - delta, 
      this.top - delta, 
      this.right + delta, 
      this.bottom + delta
    )
  }

  /**
   * 缩小范围
   * @param {number} delta 
   * @returns {Rect}
   */
  deflate (delta: number) {
    return this.inflate(-delta)
  }

  /**
   * 求相交部分
   * @param {Rect} rect 
   * @returns {Rect}
   */
  intersect (rect: Rect) {
    return Rect.fromLTRB(
      Math.max(this.left, rect.left),
      Math.max(this.top, rect.top),
      Math.min(this.right, rect.right),
      Math.min(this.bottom, rect.bottom),
    )
  }

  /**
   * 求相交最大Rect
   * @param {Rect} rect 
   * @returns {Rect}
   */
  expandToInclude (rect: Rect): Rect {
    return Rect.fromLTRB(
      Math.min(this.left, rect.left),
      Math.min(this.top, rect.top),
      Math.max(this.right, rect.right),
      Math.max(this.bottom, rect.bottom)
    )
  }

  /**
   * 判断是否重叠
   * @param {Rect} rect 
   * @returns {Boolean}
   */
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

  /**
   * 判断是否包含某个点
   * @param {Offset} offset 
   * @returns {boolean}
   */
  contains (offset: Offset): boolean {
    return (
      offset.dx >= this.left &&
      offset.dx < this.right &&
      offset.dy >= this.top &&
      offset.dy < this.bottom
    )
  }

  /**
   * 判断是否相等
   * @param {Rect | null} rect 
   * @returns {boolean}
   */
  equal (rect: Rect | null): boolean {
    return (
      rect instanceof Rect &&
      this.left === rect.left &&
      this.top === rect.top &&
      this.right === rect.right &&
      this.bottom === rect.bottom
    )
  }

  /**
   * 判断是否相等
   * @param {Rect | null} rect 
   * @returns {boolean}
   */
  notEqual (rect: Rect | null) {
    return this.equal(rect)
  }

  toString () {
    return `Rect(
      [left]: ${this.left}, 
      [top]: ${this.top},
      [right]: ${this.right},
      [bottom]: ${this.bottom}
    )`
  }  
}