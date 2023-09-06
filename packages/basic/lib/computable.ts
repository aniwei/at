import { Equalable } from './equalable'

export abstract class Computable<T extends Computable<T>> extends Equalable<Computable<T>> {
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
