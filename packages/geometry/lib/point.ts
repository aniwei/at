import { invariant } from 'ts-invariant'

/**
 * 坐标类
 */
export interface PointCreate<T> {
  new (...rests: unknown[]): T,
  create (...rests: unknown[]): T 
}
export abstract class Point extends Computable<Point> implements ArrayLike<number> {
  static create <T> (...rests: unknown[])
  static create <T> (dx: number, dy: number, ...rests: number[]) {
    const PointCreate = this as unknown as PointCreate<T>
    return new PointCreate(dx, dy)
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
    super(dx, dy, ...rests)
    
    invariant(dx !== null, `The argument dx cannot be null.`)
    invariant(dy !== null, `The argument dy cannot be null.`)
  }
}