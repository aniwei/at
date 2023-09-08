import { Equalable } from './equalable'

export abstract class Computable<T extends Computable<T>> extends Equalable<Computable<T>> implements ArrayLike<number> {
  public length: number

  constructor (...rests: number[]) {
    let length = rests.length
    if (length === 1) {
      this.length = length
      rests = Array(length).fill(0)
    }

    for (let i = 0; i < rests.length; i++) {
      this[i] = rests[i]
    }

    this.length = length
  }

  isFinite () {
    for (let i = 0; i < this.length; i++) {
      if (Number.isFinite(this[i])) {
        continue
      }

      return false
    }
  }

  isInfinite () {
    return !this.isFinite()
  }

  isNaN () {
    for (let i = 0; i < this.length; i++) {
      if (Number.isNaN(this[i])) {
        return true
      }
    }

    return false
  }

  // +
  abstract add (object: T): T
  // -
  abstract subtract (object: T): T
  // *
  abstract multiply (operand: number): T
  // /
  abstract divide (operand: T | number): T
  // %
  abstract modulo (operand: T | unknown): T
  // -
  abstract inverse (): T
}
