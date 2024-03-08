import { invariant } from '@at/utils'
import { lerp } from '@at/utils'
import { Point } from './point'
import { Offset } from './offset'

export class Size extends Point {
  static ZERO = new Size(0.0, 0.0)
  static INFINITE = new Size(Infinity, Infinity)
  
  static zero () {
    return new Size(0.0, 0.0)
  }

  /**
   * 创建 Size 对象
   * @param {number} dx 
   * @param {number} dy 
   * @returns {Size}
   */
  static create (dx: number, dy: number): Size {
    return new Size(dx, dy) as Size
  }

  /**
   * 复制
   * @param {Size} source 
   * @returns {Size}
   */
  static copy (source: Size) {
    return Size.create(source.width, source.height)
  }

  /**
   * 创建 Size
   * @param {number} dimension 
   * @returns {Size}
   */
  static square (dimension: number) {
    return Size.create(dimension, dimension)
  }

  /**
   * 创建
   * @param {number} width 
   * @returns {Size}
   */
  static fromWidth (width: number) {
    return new Size(width, Infinity)
  }

  /**
   * 创建
   * @param {number} height 
   * @returns {Size}
   */
  static fromHeight (height: number) {
    return Size.create(height, Infinity)
  }

  /**
   * 创建
   * @param {number} radius 
   * @returns {Size}
   */
  static fromRadius (radius: number) {
    return Size.create(radius * 2, radius * 2)
  }

  /**
   * 插值
   * @param {Size | null} sizeA 
   * @param {Size | null} sizeB 
   * @param {number} t 
   * @returns {Size}
   */
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

  // => width
  public get width (): number {
    return this[2]
  }
  public set width (width: number) {
    this[2] = width
  }

  // => height
  public get height (): number {
    return this[3]
  }
  public set height (height: number) {
    this[3] = height
  }

  // => isEmpty
  public get isEmpty (): boolean {
    return (
      this.width <= 0 ||
      this.height <= 0
    )
  }

  // => aspectRatio
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

  // => shortestSize
  public get shortestSize (): number {
    return (
      Math.min(
        Math.abs(this.width), 
        Math.abs(this.height)
      )
    )
  }

  // => longestSize
  public get longestSize (): number {
    return (
      Math.max(
        Math.abs(this.width), 
        Math.abs(this.height)
      )
    )
  }

  // => flipped
  public get flipped (): Size {
    return new Size(this.height, this.width)
  }

  /**
   * 构造函数
   * @param {number} width 
   * @param {number} height 
   */
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

  /**
   * 取反
   * @returns {Size}
   */
  inverse (): Size {
    return new Size(-this.width, -this.width)
  }

  /**
   * 相加
   * @param {Size} size 
   * @returns {Size}
   */
  add (size: Size): Size {
    return new Size(this.width + size.width, this.height + size.height)
  }

  /**
   * 相减
   * @param {Size | Offset | null} size 
   * @returns 
   */
  subtract (size: Size): Size {
    return new Size(
      this.width - size.width, 
      this.height - size.width
    )
  }

  /**
   * 乘法
   * @param {number} operand 
   * @returns {Size}
   */
  multiply (operand: number): Size {
    return new Size(this.width * operand, this.height * operand)
  }

  /**
   * 除法
   * @param {number} operand 
   * @returns {Size}
   */
  divide (operand: number): Size {
    return new Size(this.width / operand, this.height / operand)
  }

  /**
   * 向下取整
   * @param {number} operand 
   * @returns {Size}
   */
  floor (operand: number): Size {
    return new Size(
      Math.floor(this.width / operand),
      Math.floor(this.height / operand)
    )
  }

  /**
   * 向上取整
   * @param {number} operand 
   * @returns 
   */ 
  ceil (operand: number): Size {
    return new Size(
      Math.ceil(this.width / operand),
      Math.ceil(this.height / operand)
    )
  }

  /**
   * 
   * @param origin 
   * @returns 
   */
  topLeft (origin: Offset): Offset {
    return origin
  }

  /**
   * 
   * @param {Offset} origin 
   * @returns {Offset} 
   */
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
      offset.dy >= 0 &&
      offset.dx < this.width &&
      offset.dy < this.height
    )
  }

  equal (size: Size | null) {
    return (
      size !== null &&
      size instanceof Size && 
      size.width === this.width &&
      size.height === this.height
    )
  }

  notEqual (size: Size | null) {
    return !this.equal(size)
  }

  toString () {
    return `Size([dx]:${this.dx},[dy]:${this.dy})`
  }
}