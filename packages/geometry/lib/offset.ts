// @ts-nocheck
import { invariant } from 'ts-invariant'
// import { lerp } from ''
import { Point } from './point'

export class Offset extends Point {
  static ZERO = new Offset(0, 0)
  static INFINITE = new Offset(Infinity, Infinity)

  static create (...rests: unknown[]): Offset
  /**
   * 
   * @param {number} dx 
   * @param {number} dy 
   * @returns  {Offset}
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
   * 
   * @param {Offset} offset 
   * @returns {boolean}
   */
  notEqual (offset: Offset | null): boolean {
    return !this.equal(offset)
  }

  toString () {
    return `Offset(dx: ${this.dx.toFixed(1)}, dy: ${this.dy.toFixed(1)})`
  }
}