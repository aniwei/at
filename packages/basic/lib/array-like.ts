import { Equalable } from './equalable'

export interface ArrayLike extends Array<number> {
  length: number
  [n: number]: number,
}

//// => ArrayLike
export interface CreateFactory {
  new (...rests: unknown[]): ArrayLike,
  create (...rests: unknown[]): ArrayLike
}

export abstract class ArrayLike extends Equalable<ArrayLike> {
  static create (...rests: unknown[]): ArrayLike {
    const CreateFactory = this as CreateFactory
    return new CreateFactory(...rests)
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
