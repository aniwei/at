import { Offset, Rect, Size } from '@at/geometry'
import { invariant, lerp } from '@at/utils'

export class RelativeRect {
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

  static fromSize (rect: Rect, container: Size) {
    return RelativeRect.fromLTRB(rect.left, rect.top, container.width - rect.right, container.height - rect.bottom)
  }

  static fromRect (rect: Rect, container: Rect) {
    return RelativeRect.fromLTRB(
      rect.left - container.left,
      rect.top - container.top,
      container.right - rect.right,
      container.bottom - rect.bottom,
    );
  }

  static fill = RelativeRect.fromLTRB(0.0, 0.0, 0.0, 0.0)

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

  shift (offset: Offset): RelativeRect {
    return RelativeRect.fromLTRB(
      this.left + offset.dx, 
      this.top + offset.dy, 
      this.right - offset.dx, 
      this.bottom - offset.dy
    )
  }

  inflate (delta: number): RelativeRect  {
    return RelativeRect.fromLTRB(
      this.left - delta, 
      this.top - delta, 
      this.right - delta, 
      this.bottom - delta
    )
  }

  deflate (delta: number): RelativeRect {
    return this.inflate(-delta)
  }

  intersect (other: RelativeRect ): RelativeRect  {
    return RelativeRect.fromLTRB(
      Math.max(this.left, other.left),
      Math.max(this.top, other.top),
      Math.max(this.right, other.right),
      Math.max(this.bottom, other.bottom),
    )
  }

  toRect (container: Rect): Rect {
    return Rect.fromLTRB(
      this.left, 
      this.top, 
      container.width - this.right, 
      container.height - this.bottom
    )
  }

  toSize (container: Size): Size {
    return new Size(
      container.width - this.left - this.right, 
      container.height - this.top - this.bottom
    )
  }

  
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
  
  equal (other: RelativeRect | null) {
    
    return (
      other instanceof RelativeRect &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  notEqual (other: RelativeRect | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `RelativeRect.fromLTRB(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`
  }
}