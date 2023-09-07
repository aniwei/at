import { Equalable } from './equalable'

export abstract class Computable<T extends Computable<T>> extends Equalable<Computable<T>> {
  constructor (...rests: number[]) {
    this.length = rests.length

    for (let i = 0; i < rests.length; i++) {
      this[i] = rests[i]
    }

    this.length = rests.length
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
