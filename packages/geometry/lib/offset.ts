import { lerp, invariant } from '@at/utils'

import { Point } from './point'
import { Rect } from './rect'
import { Size } from './size'

/**
 * 判断是否有效 Offset
 * @param {Offset} offset
 * @return {boolean}
 */
export function offsetIsValid (offset: Offset) {
  invariant(offset !== null, 'The offset cannot be null.')
  invariant(!isNaN(offset.dx) || isNaN(offset.dy), 'The offset argument contained a NaN value.')
  return true
}


//// => offset
// 偏移
export class Offset extends Point {
  static ZERO = new Offset(0, 0)
  static INFINITE = new Offset(Infinity, Infinity)

  static zero () {
    return new Offset(0, 0)
  }

  static create (...rests: unknown[]): Offset
  /**
   * 
   * @param {number} dx 
   * @param {number} dy 
   * @returns  {Offset}
   */
  static create (dx: number, dy: number): Offset {
    return new Offset(dx, dy) as Offset
  }
 
  /**
   * @param {number} direction
   * @param {number} distance
   * @returns {Offset}
   */
  static fromDirection (direction: number, distance: number = 1.0) {
    const offset = Offset.create(
      distance * Math.cos(direction),
      distance * Math.sin(direction)
    )

    return offset
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

  // => distance
  public get distance () {
    return Math.sqrt(
      this.dx * this.dx + 
      this.dy * this.dy
    )
  }

  // => distanceSquared
  public get distanceSquared () {
    return this.dx * this.dx + this.dy * this.dy
  }

  // => direction
  public get direction () {
    return Math.atan2(this.dy, this.dx)
  }

  /**
   * 放大偏移
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
  inverse () {
    return Offset.create(-this.dx, -this.dy)
  }

  /**
   * 相加
   * @param {Offset} offset
   * @returns {Offset}
   */
  add (offset: Offset): Offset {
    return Offset.create(this.dx + offset.dx, this.dy + offset.dy)
  }

  /**
   * 相减
   * @param {Offset} offset
   * @returns {Offset}
   */
  subtract (offset: Offset): Offset {
    return Offset.create(this.dx - offset.dx, this.dy - offset.dy)
  }

  /**
   * 相乘
   * @param {number} operand
   * @return {Offset}
   */  
  multiply (operand: number): Offset {
    return Offset.create(this.dx * operand, this.dy * operand)
  }

  /**
   * 相除
   * @param {number} operand
   * @return {Offset}
   */  
  divide (operand: number): Offset {
    return Offset.create(
      this.dx / operand, 
      this.dy / operand
    )
  }

  /**
   * 求模
   * @param {number} operand 
   * @returns {Offset}
   */
  modulo (operand: number): Offset {
    return Offset.create(
      Math.floor(this.dx / operand),
      Math.floor(this.dy / operand)
    )
  }

  /**
   * 求余
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
   * 是否相等
   * @param {Offset} offset 
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
   * 是否相等
   * @param {Offset} offset 
   * @returns {boolean}
   */
  notEqual (offset: Offset | null): boolean {
    return !this.equal(offset)
  }

  toString () {
    return `Offset(
      [dx]:${this.dx.toFixed(1)},
      [dy]:${this.dy.toFixed(1)}
    )`
  }
}
