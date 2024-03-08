import { invariant } from '@at/utils'
import { ArrayLike } from '@at/basic'

/**
 * 坐标类
 */
export interface PointFactory {
  new (...rests: unknown[]): unknown,
  create (...rests: unknown[]): unknown
}
export abstract class Point extends ArrayLike<Point> {
  static create (...rests: unknown[]): Point
  static create  (dx: number, dy: number): Point {
    const PointFactory = this as PointFactory
    return new PointFactory(dx, dy) as Point
  }

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
  constructor (...rests: unknown[])
  
  constructor (dx: number, dy: number, ...rests: number[]) {
    invariant(dx !== null, 'The argument "dx" cannot be null.')
    invariant(dy !== null, 'The argument "dy" cannot be null.')
    super(dx, dy, ...rests)
  }

  toString () {
    return `Point(
      [dx]: ${this.dx}, 
      [dy]: ${this.dy}
    )`
  }
}