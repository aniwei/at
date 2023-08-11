import { invariant } from 'ts-invariant'
import { At, AtPainting } from '../at'
import { Color } from '../basic/color'
import { AtCanvas } from '../engine/canvas'
import { AtPath } from '../engine/path'
import { AtPaint } from '../engine/paint'
import { lerp } from '../basic/helper'
import { AtBorderRadius } from './border-radius'

import type { TextDirection } from '../engine/skia'
import { AtPathDashEffect } from '../engine/path-effect'

export enum BorderShape {
  Rectangle,
  Circle,
  Irregular
}

export enum BorderStyle {
  None,
  Solid,
  Dotted,
  Dashed,
}

export enum BorderPosition {
  Outside,
  Center,
  Inside,
}


export class AtBorderSide {
  /**
   * 
   * @param color 
   * @param width 
   * @param style 
   * @param pettern 
   * @returns 
   */
  static create (
    color?: Color,
    width?: number,
    style?: BorderStyle,
    position?: BorderPosition,
    pettern?: number[]
  ) {
    return new AtBorderSide(color, width, style, position, pettern)
  }

  static none = new AtBorderSide(new Color(0xFF000000), 0, BorderStyle.None)

  /**
   * 合并边框
   * @param {AtBorderSide} a 
   * @param {AtBorderSide} b 
   * @returns {AtBorderSide} 
   */
  static merge (a: AtBorderSide, b: AtBorderSide) {
    invariant(a !== null, `The argument "a" cannot be null.`)
    invariant(b !== null, `The argument "b" cannot be null.`)

    const aIsNone = a.style === BorderStyle.None && a.width === 0
    const bIsNone = b.style === BorderStyle.None && b.width === 0

    if (aIsNone && bIsNone) {
      return AtBorderSide.none
    }

    if (aIsNone) {
      return b
    }

    if (bIsNone) {
      return a
    }
    
    invariant(a.color === b.color, `Merged borders must be the same colo.`)
    invariant(a.style === b.style, `Merged borders must be the same style.`)

    return new AtBorderSide(a.color, a.width + b.width, a.style)
  }

  /**
   * 判断是否可合并边框
   * @param {AtBorderSide} a 
   * @param {AtBorderSide} b 
   * @returns {boolean}
   */
  static canMerge (a: AtBorderSide, b: AtBorderSide) {
    invariant(a !== null, `The argument "a" cannot be null.`)
    invariant(b !== null, `The argument "b" cannot be null.`)

    if (
      (a.style === BorderStyle.None && a.width === 0) ||
      (b.style == BorderStyle.None && b.width === 0)
    ) {
      return true
    }
     
    return (
      a.style === b.style && 
      a.color.equal(b.color)
    )
  }

  /**
   * 边框差值计算
   * @param {AtBorderSide} a 
   * @param {AtBorderSide} b 
   * @param {number} t 
   * @returns {AtBorderSide}
   */
  static lerp (
    a: AtBorderSide, 
    b: AtBorderSide, 
    t: number
  ) {
    invariant(a !== null, `The argument "a" cannot be null.`)
    invariant(b !== null, `The argument "b" cannot be null.`)
    invariant(t !== null, `The argument "t" cannot be null.`)

    if (t === 0) {
      return a
    }
      
    if (t === 1) {
      return b
    }

    const width = lerp(a.width, b.width, t)
    if (width < 0) {
      return AtBorderSide.none
    }
    
    if (a.style === b.style) {
      return new AtBorderSide(
        Color.lerp(a.color, b.color, t)!,
        width,
        a.style,
      )
    }

    let colorA: Color | null = null
    let colorB: Color | null = null

    switch (a.style) {
      case BorderStyle.Solid:
        colorA = a.color
        break
      case BorderStyle.None:
        colorA = a.color.withAlpha(0)
        break
    }

    switch (b.style) {
      case BorderStyle.Solid:
        colorB = b.color
        break
      case BorderStyle.None:
        colorB = b.color.withAlpha(0)
        break
    }

    return new AtBorderSide(
      Color.lerp(colorA, colorB, t) as Color, 
      width
    )
  }

  public width: number = 1.0
  public style: BorderStyle
  public position: BorderPosition
  public color: Color
  public pettern: number[]

  constructor (
    color: Color = new Color(0xFF000000),
    width: number = 1.0,
    style: BorderStyle = BorderStyle.Solid,
    position: BorderPosition = BorderPosition.Center,
    pettern: number[] = []
  ) {
    invariant(color !== null)
    invariant(width !== null)
    invariant(width >= 0.0)
    invariant(style !== null)

    this.width = width
    this.style = style
    this.color = color
    this.position = position
    this.pettern = pettern
  }

  /**
   * 
   * @param color 
   * @param width 
   * @param style 
   * @param position 
   * @param pettern 
   * @returns 
   */
  copyWith (
    color: Color | null, 
    width: number | null, 
    style: BorderStyle | null, 
    position: BorderPosition | null, 
    pettern: number[] | null
  ) {
    invariant(width === null || width >= 0)
    return new AtBorderSide(
      color ?? this.color,
      width ?? this.width,
      style ?? this.style,
      position ?? this.position,
      pettern ?? this.pettern
    )
  }

  scale (t: number) {
    invariant(t !== null)
    return new AtBorderSide(
      this.color,
      Math.max(0, this.width * t),
      t > 0 ? this.style : BorderStyle.None
    )
  }

  toPaint (): AtPaint {
    const paint = new AtPaint()

    switch (this.style) {
      case BorderStyle.Solid:
      case BorderStyle.Dashed:
      case BorderStyle.Dotted:
        paint.color = this.color
        paint.strokeWidth = this.width
        paint.style = At.PaintStyle.Stroke
        break
    }

    switch (this.style) {
      case BorderStyle.Dotted: 
      case BorderStyle.Dashed: {
        paint.effect = AtPathDashEffect.create(this.pettern)
        break
      }

      case BorderStyle.None: {
        paint.color = new Color(0x00000000)
        paint.strokeWidth = 0
        paint.style = At.PaintStyle.Stroke
        break
      }
    }

    return paint
  }

  equal (other: AtBorderSide | null) {
    return (
      other instanceof AtBorderSide &&
      other.color === this.color &&
      other.width === this.width &&
      other.style === this.style
    )
  }

  notEqual (other:AtBorderSide | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtBorderSide(${this.color}, ${this.width}, ${this.style})`
  }
}

export abstract class AtShapeBorder<T extends AtShapeBorder<T>> {
  static lerp<T extends AtShapeBorder<T>>(
    a: AtShapeBorder<T> | null, 
    b: AtShapeBorder<T> | null, 
    t: number
  ): AtShapeBorder<T> | null {
    invariant(t !== null)

    let result: AtShapeBorder<T> | null = null

    if (b !== null) {
      result = b.lerpFrom(a, t)
    }
    if (result === null && a !== null) {
      result = a.lerpTo(b, t)
    }

    return result ?? (t < 0.5 ? a : b)
  }
  
  abstract getOuterPath(
    shape: unknown, 
    textDirection?: TextDirection | null
  ): AtPath
  
  abstract getInnerPath(
    shape: unknown, 
    textDirection?: TextDirection | null
  ): AtPath 
  
  abstract paint (
    canvas: AtCanvas, 
    rect: unknown, 
    textDirection?: TextDirection | null,
    shape?: BorderShape,
    borderRadius?: AtBorderRadius | null
  ): void

  abstract scale (t: number): AtShapeBorder<T>
  
  lerpFrom (a: AtShapeBorder<T> | null, t: number): AtShapeBorder<T> | null {
    if (a === null) {
      return this.scale(1.0 - t)
    }
    return null
  }

  lerpTo (a: AtShapeBorder<T> | null, t: number): AtShapeBorder<T> | null {
    if (a === null) {
      return this.scale(1.0 - t)
    }
    return null
  }
}

export abstract class AtOutlinedBorder extends AtShapeBorder<AtOutlinedBorder> {
  public side: AtBorderSide

  constructor (side: AtBorderSide) {
    super()

    invariant(side !== null)
    this.side = side
  }
   
  abstract copyWith (side: AtBorderSide | null): AtOutlinedBorder

  equal (other: AtOutlinedBorder | null) {
    return other?.side.equal(this.side)
  }

  notEqual (other: AtOutlinedBorder | null) {
    return !this.equal(other)
  }
}

export type AtBorderOptions = {
  color?: Color,
  width?: number,
  style?: BorderStyle
}

export  class AtBorder extends AtOutlinedBorder {
  static create (options?: AtBorderOptions) {
    const side = AtBorderSide.create(
      options?.color,
      options?.width,
      options?.style
    )

    return new AtBorder(side)
  }

  static lerp (
    a: AtBorder | null, 
    b: AtBorder | null, 
    t: number
  ): AtBorder | null {
    invariant(t !== null)

    let result: AtBorder | null = null

    if (b !== null) {
      result = b.lerpFrom(a, t)
    }
    if (result === null && a !== null) {
      result = a.lerpTo(b, t)
    }

    return result ?? (t < 0.5 ? a : b)
  }

  // => color
  public get color () {
    return this.side.color
  }

  // => width 
  public get width () {
    return this.side.width
  }
  
  // => style
  public get style () {
    return this.side.style
  }

  // => position
  public get position () {
    return this.side.position
  }

  constructor (side: AtBorderSide) {
    super(side)
  }

  copyWith (side: AtBorderSide | null): AtBorder {
    return new AtBorder(side ?? this.side)
  }
  
  add (
    other: AtShapeBorder<AtBorder>, 
    reversed: boolean
  ): AtShapeBorder<AtBorder> | null {
    return null
  }

  lerpFrom (
    a: AtBorder | null, 
    t: number
  ): AtBorder | null {
    return super.lerpFrom(a, t) as AtBorder | null
  }

  lerpTo (
    b: AtBorder | null, 
    t: number
  ): AtBorder | null {
    return super.lerpFrom(b, t) as AtBorder | null
  }

  scale (t: number): AtShapeBorder<AtBorder> {
    const side = this.side.scale(t)

    return new AtBorder(side)
  }

  getOuterPath (
    shape: AtPath, 
    textDirection: TextDirection
  ): AtPath {
    const path = shape ?? AtPath.create()
    return path
  }

  getInnerPath (
    shape: AtPath, 
    textDirection: TextDirection
  ): AtPath {
    const path = shape ?? AtPath.create()
    return path
  }

  paint (
    canvas: AtCanvas,
    shape: AtPath, 
  ): void {
    AtPainting.paintBorderWithIrregular(
      canvas, 
      shape,
      this.side
    )
  }
}
