import { Offset, Rect, Size } from '@at/geometry'
import { invariant, lerp } from '@at/utils'

//// => RelativeRect
export class RelativeRect {
  static FILL = RelativeRect.fromLTRB(0.0, 0.0, 0.0, 0.0)
  /**
   * 
   * @param {RelativeRect} a 
   * @param {RelativeRect} b 
   * @param {number} t 
   * @returns 
   */
  static lerp (a: RelativeRect | null, b: RelativeRect | null, t: number): RelativeRect | null {
    invariant(t !== null)

    if (a === null && b === null) {
      return null
    }

    invariant(a)
    invariant(b)

    if (a === null) {
      return RelativeRect.fromLTRB(
        b.left * t, 
        b.top * t, 
        b.right * t, 
        b.bottom * t
      )
    }

    if (b === null) {
      let k = 1 - t
      return RelativeRect.fromLTRB(
        a.left * k, 
        a.top * k, 
        a.right * k, 
        a.bottom * k
      )
    }

    return RelativeRect.fromLTRB(
      lerp(a.left, b.left, t)!,
      lerp(a.top, b.top, t)!,
      lerp(a.right, b.right, t)!,
      lerp(a.bottom, b.bottom, t)!,
    );
  }

  /**
   * 根据 LTRB 创建
   * @param {number} left 
   * @param {number} top 
   * @param {number} right 
   * @param {number} bottom 
   * @returns {RelativeRect}
   */
  static fromLTRB (
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ) {
    return new RelativeRect(
      left, 
      top, 
      right, 
      bottom
    )
  }

  /**
   * 从 Size 创建
   * @param {Rect} rect 
   * @param {Size} container 
   * @returns {RelativeRect}
   */
  static fromSize (rect: Rect, container: Size) {
    return RelativeRect.fromLTRB(rect.left, rect.top, container.width - rect.right, container.height - rect.bottom)
  }

  /**
   * 从 Rect 创建
   * @param {Rect} rect 
   * @param {Rect} container 
   * @returns {RelativeRect}
   */
  static fromRect (rect: Rect, container: Rect) {
    return RelativeRect.fromLTRB(
      rect.left - container.left,
      rect.top - container.top,
      container.right - rect.right,
      container.bottom - rect.bottom,
    );
  }

  public left: number
  public top: number
  public right: number
  public bottom: number

  public get hasInsets () {
    return (
      this.left > 0.0 || 
      this.top > 0.0 || 
      this.right > 0.0 || 
      this.bottom > 0.0
    )
  }

  constructor (
    left: number,
    top: number,
    right: number,
    bottom: number,
  ) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
  }

  /**
   * 
   * @param {Offset} offset 
   * @returns {RelativeRect}
   */
  shift (offset: Offset): RelativeRect {
    return RelativeRect.fromLTRB(
      this.left + offset.dx, 
      this.top + offset.dy, 
      this.right - offset.dx, 
      this.bottom - offset.dy
    )
  }

  /**
   * 平增
   * @param {number} delta 
   * @returns {RelativeRect}
   */
  inflate (delta: number): RelativeRect {
    return RelativeRect.fromLTRB(
      this.left - delta, 
      this.top - delta, 
      this.right - delta, 
      this.bottom - delta
    )
  }

  /**
   * 平减
   * @param {number} delta 
   * @returns {RelativeRect}
   */
  deflate (delta: number): RelativeRect {
    return this.inflate(-delta)
  }

  /**
   * 相交
   * @param {RelativeRect} other 
   * @returns {RelativeRect}
   */
  intersect (other: RelativeRect ): RelativeRect  {
    return RelativeRect.fromLTRB(
      Math.max(this.left, other.left),
      Math.max(this.top, other.top),
      Math.max(this.right, other.right),
      Math.max(this.bottom, other.bottom),
    )
  }

  /**
   * 
   * @param {Rect} container 
   * @returns {Rect}
   */
  toRect (container: Rect): Rect {
    return Rect.fromLTRB(
      this.left, 
      this.top, 
      container.width - this.right, 
      container.height - this.bottom
    )
  }

  /**
   * 
   * @param {Size} container 
   * @returns {Size}
   */
  toSize (container: Size): Size {
    return new Size(
      container.width - this.left - this.right, 
      container.height - this.top - this.bottom
    )
  }
  
  /**
   * 相等
   * @param {RelativeRect | null} other 
   * @returns {boolean}
   */
  equal (other: RelativeRect | null) {
    return (
      other instanceof RelativeRect &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  /**
   * 是否相等
   * @param {RelativeRect | null} other 
   * @returns {boolean}
   */
  notEqual (other: RelativeRect | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `RelativeRect.fromLTRB(
      [left]: ${this.left}, 
      [top]: ${this.top}, 
      [right]: ${this.right}, 
      [bottom]: ${this.bottom}
    )`
  }
}