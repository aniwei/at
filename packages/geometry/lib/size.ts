import invariant from 'ts-invariant'
import { Point } from './point'
import { Offset } from './offset'

export class Size extends Point {
    static ZERO = new Size(0.0, 0.0)
    static INFINITE = new Size(Infinity, Infinity)
  
    static create <T = Size> (...rests: number[]): Size
    static create <T = Size> (dx: number, dy: number) {
      return new Size(dx, dy) as T
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
            // @ts-ignore TODO
            lerp(sizeA.width, sizeB.width, t), 
            // @ts-ignore TODO
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
  
    // 取反
    negate (): Size {
      return new Size(-this.width, -this.width)
    }
  
    // 加法
    add (size: Size): Size {
      return new Size(this.width + size.width, this.height + size.height)
    }
  
    // 减法
    subtract (size: Size | Offset): Size | Offset {
      if (size instanceof Size) {
        return new Offset(
          this.width - size.width, 
          this.height - size.height
        )
      }
  
      return new Size(this.width - size.dx, this.height - size.dy)
    }
  
    // 乘法  
    multiply (operand: number): Size {
      return new Size(this.width * operand, this.height * operand)
    }
  
    // 除法
    divide (operand: number): Size {
      return new Size(this.width / operand, this.height / operand)
    }
  
    // 向下取整
    floor (operand: number): Size {
      return new Size(
        Math.floor(this.width / operand),
        Math.floor(this.height / operand)
      )
    }
  
    // 向上取整
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