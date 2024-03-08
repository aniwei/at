import { invariant } from '@at/utils'
import { Rect } from '@at/geometry'
import { Color } from '@at/basic'
import { Engine, Canvas, Paint, Path, Skia } from '@at/engine'
import { BorderRadius } from './border-radius'
import { Painting } from './painting'
import { EdgeInsets, EdgeInsetsGeometry } from './edge-insets'
import { BorderSide, ShapeBorder, BorderShape, BorderStyle } from './border'


export type BoxBorderOptions = {
  color?: Color,
  width?: number,
  style?: BorderStyle
}

export class BoxBorder extends ShapeBorder<BoxBorder> {
  static create (options: BoxBorderOptions) {
    const side = new BorderSide(
      options.color,
      options.width,
      options.style
    )

    return BoxBorder.fromBorderSide(side)
  }

  static all (
    color = new Color(0xFF000000),
    width = 1.0,
    style = BorderStyle.Solid
  ) {
    const side = BorderSide.create({
      color,
      width,
      style
    })

    return BoxBorder.fromBorderSide(side)
  }

  static fromBorderSide (side: BorderSide) {
    invariant(side !== null)
    return new BoxBorder(side, side, side, side)
  }

  static paintUniformBorderWithCircle (
    canvas: Canvas,
    rect: Rect,
    side: BorderSide
  ) {
    invariant(side.style !== BorderStyle.None)
    const width = side.width
    const paint = side.toPaint()

    const radius = (rect.shortestSide - width) / 2.0
    canvas.drawCircle(rect.center, radius, paint)
  }

  static paintUniformBorderWithRectangle (
    canvas: Canvas,
    rect: Rect,
    side: BorderSide,
  ) {
    invariant(side.style !== BorderStyle.None)
    const width = side.width
    const paint = side.toPaint()

    canvas.drawRect(rect.deflate(width / 2.0), paint)
  }

  static paintUniformBorderWithRadius (
    canvas: Canvas,
    rect: Rect,
    side: BorderSide,
    borderRadius: BorderRadius
  ) {
    invariant(side.style !== BorderStyle.None)
    const paint = Paint.create()
    paint.color = side.color

    const outer = borderRadius.toRRect(rect)
    const width = side.width
    if (width === 0) {
      paint.style = Engine.skia.PaintStyle.Stroke
      paint.stroke.width = 0.0
      canvas.drawRRect(outer, paint)
    } else {
      const inner = outer.deflate(width)
      canvas.drawDRRect(outer, inner, paint)
    }
  }

  static merge (
    a: BoxBorder,
    b: BoxBorder
  ) {
    invariant(BorderSide.canMerge(a.top, b.top))
    invariant(BorderSide.canMerge(a.right, b.right))
    invariant(BorderSide.canMerge(a.bottom, b.bottom))
    invariant(BorderSide.canMerge(a.left, b.left))

    return new BoxBorder(
      BorderSide.merge(a.top, b.top),
      BorderSide.merge(a.right, b.right),
      BorderSide.merge(a.bottom, b.bottom),
      BorderSide.merge(a.left, b.left),
    )
  }

  static lerp (
    a: BoxBorder | null, 
    b: BoxBorder | null, 
    t: number
  ): BoxBorder | null {
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
    return new BoxBorder(
      BorderSide.lerp(a.top, b.top, t),
      BorderSide.lerp(a.right, b.right, t),
      BorderSide.lerp(a.bottom, b.bottom, t),
      BorderSide.lerp(a.left, b.left, t),
    )
  }

  // => dimensions
  // 维度
  public get dimensions (): EdgeInsetsGeometry {
    return EdgeInsets.fromLTRB(
      this.left.width,
      this.top.width,
      this.right.width,
      this.bottom.width
    )
  }

  // => isUniform
  // 是否统一
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

  public top: BorderSide
  public right: BorderSide
  public bottom: BorderSide
  public left: BorderSide

  constructor (
    top: BorderSide = BorderSide.NONE,
    right: BorderSide = BorderSide.NONE,
    bottom: BorderSide = BorderSide.NONE,
    left: BorderSide = BorderSide.NONE
  ) {
    super()
    this.top = top
    this.right = right
    this.bottom = bottom
    this.left = left
  }

  add (
    other: BoxBorder, 
    reversed: boolean = false
  ) {
    if (
      other instanceof BoxBorder &&
      BorderSide.canMerge(this.top, other.top) &&
      BorderSide.canMerge(this.right, other.right) &&
      BorderSide.canMerge(this.bottom, other.bottom) &&
      BorderSide.canMerge(this.left, other.left)
    ) {
      return BoxBorder.merge(this, other)
    }

    return null
  }

  scale (t: number): BoxBorder {
    return new BoxBorder(
      this.top.scale(t),
      this.right.scale(t),
      this.bottom.scale(t),
      this.left.scale(t),
    )
  }

  lerpFrom (
    a: BoxBorder | null, 
    t: number
  ) {
    if (a instanceof BoxBorder) {
      return BoxBorder.lerp(a, this, t)
    }

    return super.lerpFrom(a, t)
  }

  lerpTo (
    b: BoxBorder | null, 
    t: number
  ): BoxBorder | null {
    if (b instanceof BoxBorder) {
      return BoxBorder.lerp(this, b, t)
    }

    return null
  }

  getInnerPath (
    rect: Rect, 
    textDirection: Skia.TextDirection
  ): Path {
    const path = Path.create()
    path.addRect(this.dimensions.resolve(textDirection).deflateRect(rect))

    return path
  }

  getOuterPath (
    rect: Rect, 
    textDirection: Skia.TextDirection
  ): Path {
    const path = Path.create()
    path.addRect(rect)
    
    return path
  }

  paint (
    canvas: Canvas, 
    rect: Rect, 
    textDirection: Skia.TextDirection | null, 
    shape: BorderShape = BorderShape.Rectangle, 
    borderRadius: BorderRadius | null
  ) {
    if (this.isUniform) {
      switch (this.top.style) {
        case BorderStyle.None: {
          return 
        }

        case BorderStyle.Solid: {
          switch (shape) {
            case BorderShape.Circle: {
              BoxBorder.paintUniformBorderWithCircle(
                canvas,
                rect,
                this.top
              )
              break
            }

            case BorderShape.Rectangle: {
              if (borderRadius === null) {
                BoxBorder.paintUniformBorderWithRectangle(canvas, rect, this.top) 
              } else {
                BoxBorder.paintUniformBorderWithRadius(canvas, rect, this.top, borderRadius)  
              }
              
              break
            }
          }
          return
        }
      }
    }

    Painting.paintBorderWithRectangle(
      canvas,
      rect,
      this.top,
      this.right,
      this.bottom,
      this.left
    )
  }

  equal (other: BoxBorder | null) {
    return (
      other instanceof BoxBorder &&
      other.left.equal(this.left) &&
      other.top.equal(other.top) &&
      other.right.equal(other.right) &&
      other.bottom.equal(other.bottom)
    )
  }

  notEqual (other: BoxBorder | null) {
    return !this.equal(other)
  }

  toString () {
    return `BoxBorder(
      [left]: ${this.left}, 
      [top]: ${this.top}, 
      [right]: ${this.right}, 
      [bottom]: ${this.bottom}
    )`
  }
}


