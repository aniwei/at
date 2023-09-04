import { invariant } from 'ts-invariant'

/**
 * 坐标类
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
  constructor (dx: number, dy: number, ...rests: number[]) {
    super(dx, dy, ...rests)
    
    invariant(dx !== null, `The argument dx cannot be null.`)
    invariant(dy !== null, `The argument dy cannot be null.`)
  }
}