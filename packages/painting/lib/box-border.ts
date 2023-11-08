import { invariant } from '@at/utils'
import { At, AtPaint } from '../at'
import { Rect } from '../basic/geometry'
import { Color } from '../basic/color'
import { AtCanvas } from '../engine/canvas'
import { AtPath } from '../engine/path'
import { AtBorderRadius } from './border-radius'
import { AtPainting } from './painting'
import { AtEdgeInsets, AtEdgeInsetsGeometry } from './edge-insets'
import { AtBorderSide, AtShapeBorder, BorderShape, BorderStyle } from './border'

import type { TextDirection } from '../engine/skia'

export type AtBoxBorderOptions = {
  color?: Color,
  width?: number,
  style?: BorderStyle
}

export class AtBoxBorder extends AtShapeBorder<AtBoxBorder> {
  static create (options: AtBoxBorderOptions) {
    const side = new AtBorderSide(
      options.color,
      options.width,
      options.style
    )

    return AtBoxBorder.fromBorderSide(side)
  }

  static all (
    color = new Color(0xFF000000),
    width = 1.0,
    style = BorderStyle.Solid
  ) {
    const side = new AtBorderSide(
      color,
      width,
      style
    )

    return AtBoxBorder.fromBorderSide(side)
  }

  static fromBorderSide (side: AtBorderSide) {
    invariant(side !== null)
    return new AtBoxBorder(side, side, side, side)
  }

  static paintUniformBorderWithCircle (
    canvas: AtCanvas,
    rect: Rect,
    side: AtBorderSide
  ) {
    invariant(side.style !== BorderStyle.None)
    const width = side.width
    const paint = side.toPaint()
    const radius = (rect.shortestSide - width) / 2.0
    canvas.drawCircle(rect.center, radius, paint)
  }

  static paintUniformBorderWithRectangle (
    canvas: AtCanvas,
    rect: Rect,
    side: AtBorderSide,
  ) {
    invariant(side.style !== BorderStyle.None)
    const width = side.width
    const paint = side.toPaint()
    canvas.drawRect(rect.deflate(width / 2.0), paint)
  }

  static paintUniformBorderWithRadius (
    canvas: AtCanvas,
    rect: Rect,
    side: AtBorderSide,
    borderRadius: AtBorderRadius
  ) {
    invariant(side.style !== BorderStyle.None)
    const paint = AtPaint.create()
    paint.color = side.color

    const outer = borderRadius.toRRect(rect)
    const width = side.width
    if (width === 0) {
      paint.style = At.PaintStyle.Stroke
      paint.strokeWidth = 0.0
      canvas.drawRRect(outer, paint)
    } else {
      const inner = outer.deflate(width)
      canvas.drawDRRect(outer, inner, paint)
    }
  }

  static merge (
    a: AtBoxBorder,
    b: AtBoxBorder
  ) {
    invariant(a !== null)
    invariant(b !== null)
    invariant(AtBorderSide.canMerge(a.top, b.top))
    invariant(AtBorderSide.canMerge(a.right, b.right))
    invariant(AtBorderSide.canMerge(a.bottom, b.bottom))
    invariant(AtBorderSide.canMerge(a.left, b.left))

    return new AtBoxBorder(
      AtBorderSide.merge(a.top, b.top),
      AtBorderSide.merge(a.right, b.right),
      AtBorderSide.merge(a.bottom, b.bottom),
      AtBorderSide.merge(a.left, b.left),
    )
  }

  static lerp (
    a: AtBoxBorder | null, 
    b: AtBoxBorder | null, 
    t: number
  ): AtBoxBorder | null {
    invariant(t !== null)

    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      invariant(b !== null)
      return b.scale(t)
    }
    if (b === null) {
      return a.scale(1.0 - t)
    }
    return new AtBoxBorder(
      AtBorderSide.lerp(a.top, b.top, t),
      AtBorderSide.lerp(a.right, b.right, t),
      AtBorderSide.lerp(a.bottom, b.bottom, t),
      AtBorderSide.lerp(a.left, b.left, t),
    )
  }

  // => dimensions
  public get dimensions (): AtEdgeInsetsGeometry {
    return AtEdgeInsets.fromLTRB(
      this.left.width,
      this.top.width,
      this.right.width,
      this.bottom.width
    )
  }

  // => isUniform
  public get isUniform () {
    return (
      this.colorIsUniform && 
      this.widthIsUniform && 
      this.styleIsUniform
    )
  }

  // => colorIsUniform
  public get colorIsUniform () {
    const topColor = this.top.color
    return (
      this.right.color === topColor &&
      this.bottom.color === topColor &&
      this.left.color === topColor
    )
  }

  // => widthIsUniform
  public get widthIsUniform () {
    const topWidth = this.top.width
    return (
      this.right.width === topWidth &&
      this.bottom.width === topWidth &&
      this.left.width === topWidth
    )
  }

  // => styleIsUniform
  public get styleIsUniform () {
    const topStyle = this.top.style
    return (
      this.right.style === topStyle &&
      this.bottom.style === topStyle &&
      this.left.style === topStyle
    )
  }

  public top: AtBorderSide
  public right: AtBorderSide
  public bottom: AtBorderSide
  public left: AtBorderSide

  constructor (
    top: AtBorderSide = AtBorderSide.none,
    right: AtBorderSide = AtBorderSide.none,
    bottom: AtBorderSide = AtBorderSide.none,
    left: AtBorderSide = AtBorderSide.none
  ) {
    super()
    this.top = top
    this.right = right
    this.bottom = bottom
    this.left = left
  }

  add (
    other: AtBoxBorder, 
    reversed: boolean = false
  ) {
    if (
      other instanceof AtBoxBorder &&
      AtBorderSide.canMerge(this.top, other.top) &&
      AtBorderSide.canMerge(this.right, other.right) &&
      AtBorderSide.canMerge(this.bottom, other.bottom) &&
      AtBorderSide.canMerge(this.left, other.left)
    ) {
      return AtBoxBorder.merge(this, other)
    }

    return null
  }

  scale (t: number): AtBoxBorder {
    return new AtBoxBorder(
      this.top.scale(t),
      this.right.scale(t),
      this.bottom.scale(t),
      this.left.scale(t),
    )
  }

  lerpFrom (
    a: AtBoxBorder | null, 
    t: number
  ) {
    if (a instanceof AtBoxBorder) {
      return AtBoxBorder.lerp(a, this, t)
    }

    return super.lerpFrom(a, t)
  }

  lerpTo (
    b: AtBoxBorder | null, 
    t: number
  ): AtBoxBorder | null {
    if (b instanceof AtBoxBorder) {
      return AtBoxBorder.lerp(this, b, t)
    }

    return null
  }

  getInnerPath (
    rect: Rect, 
    textDirection: TextDirection | null
  ): AtPath {
    invariant(textDirection !== null, 'The textDirection argument to $runtimeType.getInnerPath must not be null.')
    const path = new AtPath()
    path.addRect(this.dimensions.resolve(textDirection).deflateRect(rect))

    return path
  }

  getOuterPath (
    rect: Rect, 
    textDirection: TextDirection
  ): AtPath {
    invariant(textDirection !== null, 'The textDirection argument to $runtimeType.getOuterPath must not be null.')
    const path = new AtPath()
    path.addRect(rect)
    
    return path
  }

  paint (
    canvas: AtCanvas, 
    rect: Rect, 
    textDirection: TextDirection | null, 
    shape: BorderShape = BorderShape.Rectangle, 
    borderRadius: AtBorderRadius | null
  ) {
    if (this.isUniform) {
      switch (this.top.style) {
        case BorderStyle.None: {
          return 
        }

        case BorderStyle.Solid: {
          switch (shape) {
            case BorderShape.Circle: {
              invariant(borderRadius === null, `A borderRadius can only be given for rectangular boxes.`)
              AtBoxBorder.paintUniformBorderWithCircle(
                canvas,
                rect,
                this.top
              )
              break
            }

            case BorderShape.Rectangle: {
              if (borderRadius === null) {
                AtBoxBorder.paintUniformBorderWithRectangle(canvas, rect, this.top) 
              } else {
                AtBoxBorder.paintUniformBorderWithRadius(canvas, rect, this.top, borderRadius)  
              }
              
              break
            }
          }
          return
        }
      }
    }

    AtPainting.paintBorderWithRectangle(
      canvas,
      rect,
      this.top,
      this.right,
      this.bottom,
      this.left
    )
  }

  equal (other: AtBoxBorder | null) {
    return (
      other instanceof AtBoxBorder &&
      other.left.equal(this.left) &&
      other.top.equal(other.top) &&
      other.right.equal(other.right) &&
      other.bottom.equal(other.bottom)
    )
  }

  notEqual (other: AtBoxBorder | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtBoxBorder(left: ${this.left}, top: ${this.top}, right: ${this.right}, bottom: ${this.bottom})`
  }
}


