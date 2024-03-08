import { Equalable } from './equalable'

export interface ArrayLike<T extends ArrayLike<T>> extends Array<number> {
  length: number
  [n: number]: number,
}

//// => ArrayLike
export interface ArrayLikeFactory {
  new (...rests: unknown[]): unknown,
  create (...rests: unknown[]): unknown
}

//// => ArrayLike
// 类数组
export abstract class ArrayLike<T extends ArrayLike<T>> extends Equalable<T> {
  static create (...rests: unknown[]): unknown {
    const ArrayLikeFactory = this as ArrayLikeFactory
    return new ArrayLikeFactory(...rests)
  }

  // => isFinite
  public get isFinite () {
    for (let i = 0; i < this.length; i++) {
      if (!Number.isFinite(this[i])) {
        return false
      }
    }

    return true
  }

  // => isInfinite
  public get isInfinite () {
    return !this.isFinite
  }

  // => isNaN
  public get isNaN () {
    for (let i = 0; i < this.length; i++) {
      if (Number.isNaN(this[i])) {
        return true
      }
    }

    return false
  }

  //对象长度
  public length: number

  /**
   * 构造函数
   * @param {T[]} rests 
   */
  constructor (...rests: number[]) {
    super()
    let length: number = rests.length === 1 
      ? rests.shift() as number : rests.length
    
    if (rests.length === 0) {
      rests = Array(length).fill(0)
    }

    for (let i = 0; i < rests.length; i++) {
      this[i] = rests[i]
    }

    this.length = length
  }
}