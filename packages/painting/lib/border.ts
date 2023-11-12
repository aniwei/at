import { invariant, lerp } from '@at/utils'
import { Color } from '@at/basic'
import { Canvas, Path, Paint, Skia, PathDashEffect, AtEngine } from '@at/engine'
import { BorderRadius } from './border-radius'


//// => BorderSide
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

export class BorderSide {
  static NONE = new BorderSide(new Color(0xFF000000), 0, BorderStyle.None)

  /**
   * 
   * @param {Color?} color 
   * @param {number?} width 
   * @param {BorderStyle?} style 
   * @param {BorderPosition?} position 
   * @param {number[]?} pettern 
   */
  static create (
    color?: Color,
    width?: number,
    style?: BorderStyle,
    position?: BorderPosition,
    pettern?: number[]
  ) {
    return new BorderSide(color, width, style, position, pettern)
  }

  /**
   * 合并边框
   * @param {BorderSide} a 
   * @param {BorderSide} b 
   * @returns {BorderSide} 
   */
  static merge (a: BorderSide, b: BorderSide) {
    const aIsNone = a.style === BorderStyle.None && a.width === 0
    const bIsNone = b.style === BorderStyle.None && b.width === 0

    if (aIsNone && bIsNone) {
      return BorderSide.NONE
    }

    if (aIsNone) {
      return b
    }

    if (bIsNone) {
      return a
    }
    
    invariant(a.color === b.color, `Merged borders must be the same colo.`)
    invariant(a.style === b.style, `Merged borders must be the same style.`)

    return new BorderSide(
      a.color, 
      a.width + b.width, 
      a.style
    )
  }

  /**
   * 判断是否可合并边框
   * @param {BorderSide} a 
   * @param {BorderSide} b 
   * @returns {boolean}
   */
  static canMerge (a: BorderSide, b: BorderSide) {
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
   * @param {BorderSide} a 
   * @param {BorderSide} b 
   * @param {number} t 
   * @returns {BorderSide}
   */
  static lerp (
    a: BorderSide, 
    b: BorderSide, 
    t: number
  ) {
    if (t === 0) {
      return a
    }
      
    if (t === 1) {
      return b
    }

    const width = lerp(a.width, b.width, t)
    if (width < 0) {
      return BorderSide.NONE
    }
    
    if (a.style === b.style) {
      return new BorderSide(
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

    return new BorderSide(
      Color.lerp(colorA, colorB, t) as Color, 
      width
    )
  }

  public style: BorderStyle
  public color: Color
  public pettern: number[]
  public position: BorderPosition
  public width: number = 1.0

  constructor (
    color: Color = new Color(0xFF000000),
    width: number = 1.0,
    style: BorderStyle = BorderStyle.Solid,
    position: BorderPosition = BorderPosition.Center,
    pettern: number[] = []
  ) {
    invariant(width >= 0.0)

    this.width = width
    this.style = style
    this.color = color
    this.position = position
    this.pettern = pettern
  }

  /**
   * 
   * @param {Color | null} color 
   * @param {number | null} width 
   * @param {BorderStyle | null} style 
   * @param {BorderPosition | null} position 
   * @param {number[]} pettern 
   * @returns {BorderSide}
   */
  copyWith (
    color: Color | null, 
    width: number | null, 
    style: BorderStyle | null, 
    position: BorderPosition | null, 
    pettern: number[] | null
  ) {
    invariant(width === null || width >= 0)
    return new BorderSide(
      color ?? this.color,
      width ?? this.width,
      style ?? this.style,
      position ?? this.position,
      pettern ?? this.pettern
    )
  }

  scale (t: number) {
    return new BorderSide(
      this.color,
      Math.max(0, this.width * t),
      t > 0 ? this.style : BorderStyle.None
    )
  }

  toPaint (): Paint {
    const paint = new Paint()

    switch (this.style) {
      case BorderStyle.Solid:
      case BorderStyle.Dashed:
      case BorderStyle.Dotted:
        paint.color = this.color
        paint.stroke.width = this.width
        paint.style = AtEngine.skia.PaintStyle.Stroke
        break
    }

    switch (this.style) {
      case BorderStyle.Dotted: 
      case BorderStyle.Dashed: {
        paint.effect = PathDashEffect.create(this.pettern)
        break
      }

      case BorderStyle.None: {
        paint.color = new Color(0x00000000)
        paint.stroke.width = 0
        paint.style = AtEngine.skia.PaintStyle.Stroke
        break
      }
    }

    return paint
  }

  equal (other: BorderSide | null) {
    return (
      other instanceof BorderSide &&
      other.color === this.color &&
      other.width === this.width &&
      other.style === this.style
    )
  }

  notEqual (other:BorderSide | null) {
    return !this.equal(other)
  }

  toString () {
    return `BorderSide(
      [color]: ${this.color}, 
      [width]: ${this.width}, 
      [style]: ${this.style}
    )`
  }
}

export abstract class ShapeBorder<T extends ShapeBorder<T>> {
  static lerp<T extends ShapeBorder<T>>(
    a: ShapeBorder<T> | null, 
    b: ShapeBorder<T> | null, 
    t: number
  ): ShapeBorder<T> | null {
    invariant(t !== null)

    let result: ShapeBorder<T> | null = null

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
    textDirection?: Skia.TextDirection | null
  ): Path
  
  abstract getInnerPath(
    shape: unknown, 
    textDirection?: Skia.TextDirection | null
  ): Path 
  
  abstract paint (
    canvas: Canvas, 
    rect: unknown, 
    textDirection?: Skia.TextDirection | null,
    shape?: BorderShape,
    borderRadius?: BorderRadius | null
  ): void

  abstract scale (t: number): ShapeBorder<T>
  
  lerpFrom (a: ShapeBorder<T> | null, t: number): ShapeBorder<T> | null {
    if (a === null) {
      return this.scale(1.0 - t)
    }
    return null
  }

  lerpTo (a: ShapeBorder<T> | null, t: number): ShapeBorder<T> | null {
    if (a === null) {
      return this.scale(1.0 - t)
    }
    return null
  }
}

export abstract class OutlinedBorder extends ShapeBorder<OutlinedBorder> {
  public side: BorderSide

  constructor (side: BorderSide) {
    super()
    this.side = side
  }
   
  abstract copyWith (side: BorderSide | null): OutlinedBorder

  equal (other: OutlinedBorder | null) {
    return other?.side.equal(this.side)
  }

  notEqual (other: OutlinedBorder | null) {
    return !this.equal(other)
  }
}

export type BorderOptions = {
  color?: Color,
  width?: number,
  style?: BorderStyle
}

export  class Border extends OutlinedBorder {
  static create (options?: BorderOptions) {
    const side = BorderSide.create(
      options?.color,
      options?.width,
      options?.style
    )

    return new Border(side)
  }

  static lerp (
    a: Border | null, 
    b: Border | null, 
    t: number
  ): Border | null {
    let result: Border | null = null

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

  constructor (side: BorderSide) {
    super(side)
  }

  copyWith (side: BorderSide | null): Border {
    return new Border(side ?? this.side)
  }
  
  add (
    other: ShapeBorder<Border>, 
    reversed: boolean
  ): ShapeBorder<Border> | null {
    return null
  }

  lerpFrom (
    a: Border | null, 
    t: number
  ): Border | null {
    return super.lerpFrom(a, t) as Border | null
  }

  lerpTo (
    b: Border | null, 
    t: number
  ): Border | null {
    return super.lerpFrom(b, t) as Border | null
  }

  scale (t: number): ShapeBorder<Border> {
    const side = this.side.scale(t)

    return new Border(side)
  }

  getOuterPath (
    shape: Path, 
    textDirection: Skia.TextDirection
  ): Path {
    const path = shape ?? Path.create()
    return path
  }

  getInnerPath (
    shape: Path, 
    textDirection: Skia.TextDirection
  ): Path {
    const path = shape ?? Path.create()
    return path
  }

  paint (
    canvas: Canvas,
    shape: Path, 
  ): void {
    // Painting.paintBorderWithIrregular(
    //   canvas, 
    //   shape,
    //   this.side
    // )
  }
}
