import { Equalable } from '@at/basic'
import { invariant } from '@at/utils'

//// => TextRange
export class TextRange implements Equalable<TextRange> {
  static get EMPTY (): TextRange {
    return new TextRange(-1, -1)
  }

  static empty () {
    return new TextRange(-1, -1)
  }

  static create (start: number, end: number) {
    return new TextRange(start, end)
  }

  static collapsed (offset: number) {
    return TextRange.create(offset, offset)
  }

  // => valid
  // 是否有效的
  get valid () {
    return  this.start >= 0 && this.end >= 0
  }

  // => collapsed
  // 折叠的
  get collapsed () {
    return this.start === this.end
  }
  
  // => normalized
  // 正常的
  get normalized () {
    return this.end >= this.start
  }

  public start: number
  public end: number

  /**
   * @param {number} start
   * @param {number} end
   */
  constructor (start: number, end: number) {
    invariant(start >= -1, 'The argument "start" must be gather than -1.')
    invariant(end >= -1, 'The argument "end" must be gather than -1.')

    this.start = start
    this.end = end
  }

  /**
   * @param {string} text
   * @return {*}
   */
  before (text: string): string {
    invariant(this.normalized)
    return text.substring(0, this.start)
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  after (text: string): string {
    invariant(this.normalized)
    return text.substring(this.end)
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  inside (text: string): string {
    invariant(this.normalized)
    return text.substring(this.start, this.end)
  }

  
  /**
   * 是否相等
   * @param {TextRange} other
   * @return {*}
   */
  equal (other: TextRange | null) {
    return (
      other instanceof TextRange && 
      other.start === this.start && 
      other.end === this.end
    )
  }

  /**
   * 是否相等
   * @param {TextRange | null} other 
   * @return {boolean}
   */
  notEqual (other: TextRange | null) {
    return !this.equal(other)
  }

  /**
   * @return {string}
   */
  toString () {
    return `TextRange(
      [start]: ${this.start}, 
      [end]: ${this.end}
    )`
  }
}