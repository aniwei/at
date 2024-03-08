import { Equalable } from '@at/basic'
import { Rect } from '@at/geometry'

import { Engine } from './engine'
import * as Skia from './skia'

//// => TextBox
export class TextBox implements Equalable<TextBox> {
  /**
   * @param {number} left
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   * @param {AtTextDirection} direction
   * @return {*}
   */
  static fromLTRBD (
    left: number,
    top: number,
    right: number,
    bottom: number,
    direction: Skia.TextDirection,
  ) {
    return new TextBox(
      left,
      top,
      right,
      bottom,
      direction,
    )
  }

  // => start
  // 开始位置
  public get start () {
    return this.direction === Engine.skia.TextDirection.LTR
      ? this.left 
      : this.right
  }

  // => end
  // 结束为止
  public get end () {
    return this.direction === Engine.skia.TextDirection.LTR
      ? this.right 
      : this.left
  }

  /**
   * 导出文本位置
   * @return {Rect}
   */
  public get rect (): Rect {
    return Rect.fromLTRB(
      this.left, 
      this.top, 
      this.right, 
      this.bottom
    )
  }

  // 位置
  public left: number
  public top: number
  public right: number
  public bottom: number
  // 文本方向
  public direction: Skia.TextDirection

  /**
   * @param {number} left
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   * @param {Skia.TextDirection} direction
   * @return {TextBox}
   */
  constructor (
    left: number,
    top: number,
    right: number,
    bottom: number,
    direction: Skia.TextDirection,
  ) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.direction = direction
  }

  /**
   * @param {TextBox} other
   * @return {boolean}
   */
  equal (other: TextBox | null) {
    return (
      other instanceof TextBox &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom &&
      other.direction === this.direction
    )
  }

  notEqual (other: TextBox | null) {
    return !this.equal(other)
  }
}