import { invariant } from 'ts-invariant'
import { Axis, Padding } from './painting'
import { At } from '../at'
import { clamp, lerp } from '../basic/helper'
import { Offset, Rect, Size } from '../basic/geometry'

import type { TextDirection } from '../engine/skia'


const POSITIVE_INFINITY = Number.POSITIVE_INFINITY

export abstract class AtEdgeInsetsGeometry {
  static get infinity () {
    return AtMixedEdgeInsets.fromLRSETB(
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
    )
  }

  static lerp(
    a: AtEdgeInsetsGeometry | null, 
    b: AtEdgeInsetsGeometry | null, 
    t: number
  ): AtEdgeInsetsGeometry | null {
    invariant(t !== null, `The argument "t" cannot be null.`)
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      return b ? b.multiply(t) : null
    }

    if (b === null) {
      return a.multiply(1.0 - t)
    }

    if (a instanceof AtEdgeInsets && b instanceof AtEdgeInsets) {
      return AtEdgeInsets.lerp(a, b, t) as unknown as AtEdgeInsetsGeometry
    }

    if (a instanceof EdgeInsetsDirectional && b instanceof EdgeInsetsDirectional) {
      return EdgeInsetsDirectional.lerp(a, b, t) as unknown as AtEdgeInsetsGeometry
    }

    return AtMixedEdgeInsets.fromLRSETB(
      lerp(a.left, b.left, t)!,
      lerp(a.right, b.right, t)!,
      lerp(a.start, b.start, t)!,
      lerp(a.end, b.end, t)!,
      lerp(a.top, b.top, t)!,
      lerp(a.bottom, b.bottom, t)!,
    );
  }

  public bottom: number
  public end: number
  public left: number
  public right: number
  public start: number
  public top: number

  get isNonNegative (): boolean {
    return (
      this.left >= 0 &&
      this.right >= 0 &&
      this.start >= 0 &&
      this.end >= 0 &&
      this.top >= 0 &&
      this.bottom >= 0
    )
  }

  get horizontal () {
    return this.left + this.right + this.start + this.end
  }

  get vertical () {
    return this.top + this.bottom
  }

  get collapsedSize (): Size {
    return new Size(
      this.horizontal, 
      this.vertical
    )
  } 

  get flipped (): AtEdgeInsetsGeometry {
    return AtMixedEdgeInsets.fromLRSETB(
      this.right, 
      this.left, 
      this.end, 
      this.start, 
      this.bottom, 
      this.top
    )
  }

  constructor (
    bottom: number,
    end: number,
    left: number,
    right: number,
    start: number,
    top: number,
  ) {
    this.bottom = bottom
    this.end = end
    this.left = left
    this.right = right
    this.start = start
    this.top = top
  }

  abstract add (other: AtEdgeInsetsGeometry): AtEdgeInsetsGeometry
  abstract subtract (other: AtEdgeInsetsGeometry): AtEdgeInsetsGeometry
  abstract negate (): AtEdgeInsetsGeometry
  abstract multiply (other: number): AtEdgeInsetsGeometry
  abstract divide (other: number): AtEdgeInsetsGeometry
  abstract modulo (other: number): AtEdgeInsetsGeometry
  abstract resolve (direction: TextDirection): AtEdgeInsets

  along (axis: Axis) {
    invariant(axis !== null)

    switch (axis) {
      case At.Axis.Horizontal:
        return this.horizontal
      case At.Axis.Vertical:
        return this.vertical
    }
  }

  inflateSize (size: Size) {
    return new Size(
      size.width + this.horizontal, 
      size.height + this.vertical
    )
  }

  
  deflateSize (size: Size) {
    return new Size(
      size.width - this.horizontal, 
      size.height - this.vertical
    )
  }

  clamp(
    min: AtEdgeInsetsGeometry, 
    max: AtEdgeInsetsGeometry
  ) {
    return AtMixedEdgeInsets.fromLRSETB(
      clamp(this.left, min.left, max.left),
      clamp(this.right, min.right, max.right),
      clamp(this.start, min.start, max.start),
      clamp(this.end, min.end, max.end),
      clamp(this.top, min.top, max.top),
      clamp(this.bottom, min.bottom, max.bottom),
    )
  }

  equal (other: AtEdgeInsetsGeometry | null) {
    return (
      other instanceof AtEdgeInsetsGeometry &&
      other.left === this.left &&
      other.right === this.right &&
      other.start === this.start &&
      other.end === this.end &&
      other.top === this.top &&
      other.bottom === this.bottom
    )
  }

  notEqual (other: AtEdgeInsetsGeometry | null) {
    return !this.equal(other)
  }

  toString () {
    return ``
  }
}

export class AtEdgeInsets extends AtEdgeInsetsGeometry {
  static zero = AtEdgeInsets.only()

  static lerp (
    a: AtEdgeInsets | null, 
    b: AtEdgeInsets | null, 
    t: number
  ): AtEdgeInsets | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      return b ? b.multiply(t) as unknown as AtEdgeInsets : null
    }
    if (b === null) {
      return a.multiply(1.0 - t) as unknown as AtEdgeInsets
    }

    return AtEdgeInsets.fromLTRB(
      lerp(a.left, b.left, t)!,
      lerp(a.top, b.top, t)!,
      lerp(a.right, b.right, t)!,
      lerp(a.bottom, b.bottom, t)!,
    )
  }

  static fromLTRB(
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ): AtEdgeInsets {
    return new AtEdgeInsets(left, top, right, bottom)
  }

  static fromWindowPadding (
    padding: Padding, 
    devicePixelRatio: number
  ): AtEdgeInsets {
    return new AtEdgeInsets(
      padding.left / devicePixelRatio,
      padding.top / devicePixelRatio,
      padding.right / devicePixelRatio,
      padding.bottom / devicePixelRatio
    )
  }

  static all (value: number): AtEdgeInsets {
    return new AtEdgeInsets(value, value, value, value)
  }
    
  static only (
    left: number = 0,
    top: number = 0,
    right: number = 0,
    bottom: number = 0
  ): AtEdgeInsets {
    return new AtEdgeInsets(
      left,
      top,
      right,
      bottom,
    )
  }

  static symmetric(
    vertical = 0.0,
    horizontal = 0.0,
  ): AtEdgeInsets {
    return new AtEdgeInsets(
      horizontal,
      vertical,
      horizontal,
      vertical
    )
  }

  constructor (
    left: number, 
    top: number, 
    right: number,  
    bottom: number
  ) {
    super(
      left,
      right,
      0.0,
      0.0,
      top,
      bottom,
    )
  }
  
  get topLeft () {
    return new Offset(this.left, this.top)
  } 

  get topRight () {
    return new Offset(-this.right, this.top)
  }

  get bottomLeft () {
    return new Offset(this.left, -this.bottom)
  } 

  get bottomRight () {
    return new Offset(-this.right, -this.bottom)
  } 

  get flipped () {
    return AtEdgeInsets.fromLTRB(
      this.right, 
      this.bottom, 
      this.left, 
      this.top
    ) as unknown as AtEdgeInsets 
  } 

  inflateRect (rect: Rect) {
    return Rect.fromLTRB(
      rect.left - this.left, 
      rect.top - this.top, 
      rect.right + this.right, 
      rect.bottom + this.bottom
    )
  }

  deflateRect (rect: Rect) {
    return Rect.fromLTRB(
      rect.left + this.left, 
      rect.top + this.top, 
      rect.right - this.right, 
      rect.bottom - this.bottom
    )
  }

  clamp (
    min: AtEdgeInsetsGeometry, 
    max: AtEdgeInsetsGeometry
  ): AtEdgeInsetsGeometry {
    return AtEdgeInsets.fromLTRB(
      clamp(this.left, min.left, max.left),
      clamp(this.top, min.top, max.top),
      clamp(this.right, min.right, max.right),
      clamp(this.bottom, min.bottom, max.bottom),
    ) as unknown as AtEdgeInsetsGeometry
  }

  add (other: AtEdgeInsets) {
    return AtEdgeInsets.fromLTRB(
      this.left + other.left,
      this.top + other.top,
      this.right + other.right,
      this.bottom + other.bottom,
    )
  }

  negate () {
    return AtEdgeInsets.fromLTRB(
      -this.left,
      -this.top,
      -this.right,
      -this.bottom,
    )
  }

  subtract (other: AtEdgeInsets) {
    return AtEdgeInsets.fromLTRB(
      this.left - other.left,
      this.top - other.top,
      this.right - other.right,
      this.bottom - other.bottom,
    )
  }

  multiply (other: number): AtEdgeInsets {
    return AtEdgeInsets.fromLTRB(
      this.left * other,
      this.top * other,
      this.right * other,
      this.bottom * other,
    )
  }

 
  divide (other: number): AtEdgeInsets {
    return AtEdgeInsets.fromLTRB(
      this.left / other,
      this.top / other,
      this.right / other,
      this.bottom / other,
    )
  }

  floor (other: number): AtEdgeInsets {
    return AtEdgeInsets.fromLTRB(
      Math.floor(this.left / other),
      Math.floor(this.top / other),
      Math.floor(this.right / other),
      Math.floor(this.bottom / other),
    )
  }

  modulo (other: number): AtEdgeInsets {
    return AtEdgeInsets.fromLTRB(
      this.left % other,
      this.top % other,
      this.right % other,
      this.bottom % other,
    )
  }

  resolve (direction: TextDirection | null) {
    return this
  }

  copyWith(
    left: number | null,
    top: number | null,
    right: number | null,
    bottom: number | null,
  ): AtEdgeInsets {
    return AtEdgeInsets.only(
      left ?? this.left,
      top ?? this.top,
      right ?? this.right,
      bottom ?? this.bottom,
    );
  }
}

export class EdgeInsetsDirectional extends AtEdgeInsetsGeometry {
  static Zero = EdgeInsetsDirectional.only()

  static lerp(
    a: EdgeInsetsDirectional | null, 
    b: EdgeInsetsDirectional | null, 
    t: number
  ): EdgeInsetsDirectional | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      return b ? b.multiply(t) : null
    }
    if (b === null) {
      return a.multiply(1.0 - t)
    }
    return EdgeInsetsDirectional.fromSTEB(
      lerp(a.start, b.start, t)!,
      lerp(a.top, b.top, t)!,
      lerp(a.end, b.end, t)!,
      lerp(a.bottom, b.bottom, t)!,
    );
  }

  static fromSTEB (
    start: number, 
    top: number, 
    end: number, 
    bottom: number
  ) {
    return new EdgeInsetsDirectional(
      start,
      top,
      end,
      bottom
    )
  }

  static only(
    start: number = 0.0,
    top: number = 0.0,
    end: number = 0.0,
    bottom: number = 0.0,
  ) {
    return new EdgeInsetsDirectional(
      start,
      top,
      end,
      bottom
    )
  }

  static all (value: number) {
    return new EdgeInsetsDirectional(
      value,
      value,
      value,
      value
    )
  }

  constructor (
    start: number, 
    top: number, 
    end: number, 
    bottom: number
  ) {
    super(
      0.0, 
      0.0,
      start,
      top,
      end,
      bottom,
    )
  }


  public get isNonNegative () {
    return (
      this.start >= 0.0 && 
      this.top >= 0.0 && 
      this.end >= 0.0 && 
      this.bottom >= 0.0
    ) 
  }

  public get flipped () {
    return EdgeInsetsDirectional.fromSTEB(
      this.end, 
      this.bottom, 
      this.start, 
      this.top
    )
  } 

  add (other: EdgeInsetsDirectional): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      this.start + other.start,
      this.top + other.top,
      this.end + other.end,
      this.bottom + other.bottom,
    );
  }

  negate (): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      -this.start,
      -this.top,
      -this.end,
      -this.bottom,
    )
  }

  subtract (other: EdgeInsetsDirectional): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      -this.start - other.start,
      -this.top - other.top,
      -this.end - other.end,
      -this.bottom - other.bottom,
    )
  }

  multiply (other: number): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      this.start * other,
      this.top * other,
      this.end * other,
      this.bottom * other,
    )
  }

  divide (other: number): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      this.start / other,
      this.top / other,
      this.end / other,
      this.bottom / other,
    )
  }

  floor (other: number): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      Math.floor(this.start / other),
      Math.floor(this.top / other),
      Math.floor(this.end / other),
      Math.floor(this.bottom / other),
    )
  }

  modulo (other: number): EdgeInsetsDirectional {
    return EdgeInsetsDirectional.fromSTEB(
      this.start % other,
      this.top % other,
      this.end % other,
      this.bottom % other,
    )
  }

  /**
   * 
   * @param direction 
   * @returns 
   */
  resolve (direction: TextDirection | null): AtEdgeInsets {
    invariant(direction !== null)

    if (direction === At.TextDirection.RTL) {
      return AtEdgeInsets.fromLTRB(
        this.end, 
        this.top, 
        this.start, 
        this.bottom
      )
    } else {
      return AtEdgeInsets.fromLTRB(
        this.start, 
        this.top, 
        this.end, 
        this.bottom
      )
    }
  }
}

export class AtMixedEdgeInsets extends AtEdgeInsetsGeometry {
  static fromLRSETB(
    left: number, 
    right: number, 
    start: number, 
    end: number, 
    top: number, 
    bottom: number
  ) {
    return new AtMixedEdgeInsets(
      left,
      right,
      start,
      end,
      top,
      bottom
    )
  }
    
  get isNonNegative () {
    return (
      this.left >= 0.0 && 
      this.right >= 0.0 && 
      this.start >= 0.0 && 
      this.end >= 0.0 && 
      this.top >= 0.0 && 
      this.bottom >= 0.0 
    )
  }

  negate(): AtMixedEdgeInsets {
    return AtMixedEdgeInsets.fromLRSETB(
      -this.left,
      -this.right,
      -this.start,
      -this.end,
      -this.top,
      -this.bottom,
    )
  }

  add (other: AtMixedEdgeInsets): AtMixedEdgeInsets {
    return AtMixedEdgeInsets.fromLRSETB(
      this.left + other.left,
      this.right + other.right,
      this.start + other.start,
      this.end + other.end,
      this.top + other.top,
      this.bottom + other.bottom,
    )
  }

  subtract (other: AtMixedEdgeInsets): AtMixedEdgeInsets {
    return AtMixedEdgeInsets.fromLRSETB(
      this.left - other.left,
      this.right - other.right,
      this.start - other.start,
      this.end - other.end,
      this.top - other.top,
      this.bottom - other.bottom,
    )
  }

  multiply (other: number ) {
    return AtMixedEdgeInsets.fromLRSETB(
      this.left * other,
      this.right * other,
      this.start * other,
      this.end * other,
      this.top * other,
      this.bottom * other,
    );
  }

  divide (other: number) {
    return AtMixedEdgeInsets.fromLRSETB(
      this.left / other,
      this.right / other,
      this.start / other,
      this.end / other,
      this.top / other,
      this.bottom / other,
    );
  }

  modulo (other: number) {
    return AtMixedEdgeInsets.fromLRSETB(
      this.left % other,
      this.right % other,
      this.start % other,
      this.end % other,
      this.top % other,
      this.bottom % other
    )
  }

  resolve (direction: TextDirection | null): AtEdgeInsets {
    invariant(direction !== null, `The argument "direction" cannot be null.`)

    if (direction === At.TextDirection.RTL) {
      return AtEdgeInsets.fromLTRB(
        this.end + this.left,
        this.top, 
        this.start + this.right, 
        this.bottom
      )
    } else {
      return AtEdgeInsets.fromLTRB(
        this.start + this.left, 
        this.top, 
        this.end + this.right, 
        this.bottom
      )
    }
  }
}
