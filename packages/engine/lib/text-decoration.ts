import { Equalable } from '@at/basic'


//// => TextDecoration
// 文本装饰雷丁
export enum TextDecorationKind {
  None = 0x0,
  Underline = 0x1,
  Overline = 0x2,
  LineThrough = 0x4
}

export class TextDecoration implements Equalable<TextDecoration> {
  static NONE: TextDecoration = new TextDecoration(TextDecorationKind.None)
  static UNDERLINE: TextDecoration = new TextDecoration(TextDecorationKind.Underline)
  static OVERLINE: TextDecoration = new TextDecoration(TextDecorationKind.Overline)
  static LINE_THROUGHT: TextDecoration = new TextDecoration(TextDecorationKind.LineThrough)

  static create (mask: TextDecorationKind) {
    return new TextDecoration(mask)
  }

  /**
   * 合并文本装饰
   * @param {TextDecoration[]} decorations
   * @return {TextDecoration}
   */  
  static combine (decorations: TextDecoration[]) {
    let mask = 0
    for (const decoration of decorations) {
      mask |= decoration.mask
    }

    return new TextDecoration(mask)
  }

  public mask: TextDecorationKind

  /**
   * 文本装饰
   * @param {TextDecorationKind} mask
   * @return {TextDecoration}
   */
  constructor (mask: TextDecorationKind) {
    this.mask = mask
  }

  /**
   * @param {TextDecoration} other
   * @return {*}
   */
  contains (other: TextDecoration) {
    return (this.mask | other.mask) === this.mask
  }
  
  /**
   * 是否相等
   * @param {TextDecoration} other
   * @return {boolean}
   */
  equal (other: TextDecoration | null) {
    return (
      other instanceof TextDecoration && 
      other.mask === this.mask
    )
  }

  /**
   * 是否相等
   * @param {TextDecoration | null} other 
   * @returns {boolean}
   */
  notEqual (other: TextDecoration | null): boolean {
    return !this.equal(other)
  }

  toString () {
    return `TextDecoration(
      [mask]: ${this.mask}
    )`
  }
}