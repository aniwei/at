import { invariant } from 'ts-invariant'
import { Numberic } from '@at/basic'

/**
 * 坐标类
 */
export interface CreateFactory {
  new (...rests: unknown[]): unknown,
  create (...rests: unknown[]): unknown
}
export abstract class Point<T extends Point<T>> extends Numberic<T> {
  static create (...rests: unknown[]): unknown
  static create  (dx: number, dy: number) {
    const CreateFactory = this as CreateFactory
    return new CreateFactory(dx, dy)
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
}