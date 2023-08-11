import { invariant } from 'ts-invariant'

/**
 * 坐标
 */
export abstract class Point extends Array<number> {
  public get dx () {
    return this[0]
  }

  public set dx (dx) {
    this[0] = dx
  }

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

  equal (offset: Offset): boolean {
    if (offset === this) {
      return true
    }

    return (
      offset.dx === this.dx &&
      offset.dy === this.dy
    )
  }

  notEqual (offset: Offset): boolean {
    return !this.equal(offset)
  }

  toString () {
    return `Offset(${this.dx.toFixed(1)}, ${this.dy.toFixed(1)})`
  }
}

export class Size extends Point {
  static zero = new Size(0.0, 0.0)

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

  equal (size: Size) {
    return (
      size.width === this.width &&
      size.height === this.height
    )
  }
}

export class Rect extends Array<number> {
  static zero = new Rect(0, 0, 0, 0)

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

  constructor (
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ) {
    super(left, top, right, bottom)
  }

  contains (offset: Offset): boolean {
    return (
      offset.dx >= this.left &&
      offset.dx < this.right &&
      offset.dy >= this.top &&
      offset.dy < this.bottom
    )
  }

  equal (rect: Rect): boolean {

    return (
      this.left === rect.left &&
      this.top === rect.top &&
      this.right === rect.right &&
      this.bottom === rect.bottom
    )
  }

  toString () {
    return `Rect.fromLTRB(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`
  }  
}
