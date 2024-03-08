import { Equalable } from '@at/basic'
import { Engine } from './engine'
import * as Skia from './skia'

//// => TextPosition
export interface TextPositionOptions {
  offset: number
  affinity?: Skia.Affinity
}

export class TextPosition implements Equalable<TextPosition> {
  static create (options: TextPositionOptions) {
    return new TextPosition(
      options.offset,
      options.affinity
    )
  }

  public offset: number
  public affinity: Skia.Affinity

  /**
   * @param {number} offset
   * @param {Skia.Affinity} affinity
   * @return {*}
   */
  constructor (offset: number, affinity: Skia.Affinity = Engine.skia.Affinity.Downstream) {
    this.offset = offset
    this.affinity = affinity
  }
  
  /**
   * 是否相等
   * @param {TextPosition} other
   * @return {boolean}
   */
  equal (other: TextPosition | null) {
    return (
      other instanceof TextPosition &&
      other.offset === this.offset &&
      other.affinity === this.affinity
    )
  }

  /**
   * 是否相等
   * @param {TextPosition | null} 
   * @returns {boolean}
   */
  notEqual (other: TextPosition | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `TextPosition(
      [offset]: ${this.offset}, 
      [affinity]: ${this.affinity}
    )`
  }
}