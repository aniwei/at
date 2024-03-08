import { invariant } from '@at/utils'
import { Color } from '@at/basic'
import { Paint, Path, Canvas, Skia } from '@at/engine'
import { Offset, Rect, Size } from '@at/geometry'
import { Gradient } from './gradient'
import { BorderRadius } from './border-radius'
import { BoxBorder } from './box-border'
import { ImageConfiguration } from './image-provider'
import { BoxShadow, BoxShadows } from './box-shadow'
import { BorderShape } from './border'
import { Decoration, DecorationCompositePainter, DecorationPainter, DecorationShape } from './decoration'

import type { EdgeInsetsGeometry } from './edge-insets'
import type { DecorationImage } from './decoration-image'


//// => BoxDecorationPainter
// 盒子画笔
export abstract class BoxDecorationPainter extends DecorationPainter {
  /**
   * 
   * @param {Canvas} canvas 
   * @param {BoxDecoration} decoration 
   * @param {Rect} rect 
   * @param {Paint} paint 
   * @param {Skia.TextDirection} textDirection 
   */
  paint (
    canvas: Canvas, 
    decoration: BoxDecoration, 
    rect: Rect,
    textDirection: Skia.TextDirection,
    paint: Paint,
  ): void {
    switch (decoration.shape) {
      case DecorationShape.Circle: {
        invariant(decoration.borderRadius === null)
  
        const center = rect.center
        const radius = rect.shortestSide / 2.0
        canvas.drawCircle(center, radius, paint)
        break
      }
      case DecorationShape.Rectangle: {
        if (decoration.borderRadius === null) {
          canvas.drawRect(rect, paint)
        } else {
          canvas.drawRRect(decoration.borderRadius.resolve(textDirection).toRRect(rect), paint)
        }
        break
      }
    }
  }
}

//// => BoxDecorationShadowsPainter
// 阴影画笔
export class BoxDecorationShadowsPainter extends BoxDecorationPainter {
  /**
   * 
   * @returns {BoxDecorationShadowsPainter}
   */
  static create () {
    return new BoxDecorationShadowsPainter()
  }

  paint (
    canvas: Canvas, 
    decoration: BoxDecoration, 
    shape: Rect, 
    textDirection: Skia.TextDirection, 
  ): void {
    if (decoration.shadows !== null) {
      for (const shadow of decoration.shadows) {
        const paint = shadow.toPaint()
        const bounds = shape.shift(shadow.offset).inflate(shadow.spreadRadius)

        switch (decoration.shape) {
          case DecorationShape.Rectangle: {
            super.paint(
              canvas, 
              decoration, 
              bounds,
              textDirection,
              paint,
            )
            break
          }
          case DecorationShape.Circle: {
            super.paint(
              canvas, 
              decoration, 
              bounds,
              textDirection,
              paint,
            )
            break
          }
        }
      }
    }
  }
}

//// => BoxDecorationBackgroundColorPainter
// 背景色
export class BoxDecorationBackgroundColorPainter extends BoxDecorationPainter {
  static create () {
    return new BoxDecorationBackgroundColorPainter()
  }

  protected rectForCachedBackgroundPaint: Rect | null = null

  createBuiltInPainter (
    rect: Rect, 
    decoration: BoxDecoration,
    textDirection: Skia.TextDirection
  ) {
    const paint = Paint.create()
    
    if (decoration.backgroundBlendMode !== null) {
      paint.blendMode = decoration.backgroundBlendMode
    }

    if (decoration.color !== null) {
      paint.color = decoration.color
    }

    if (decoration.gradient !== null) {
      paint.filter.shader = decoration.gradient.createShader(rect, textDirection)
    }

    return paint 
    
  }

  paint (
    canvas: Canvas, 
    decoration: BoxDecoration, 
    shape: Rect, 
    textDirection: Skia.TextDirection
  ): void {
    if (decoration.color !== null || decoration.gradient !== null) {
      const painter = this.createBuiltInPainter(shape, decoration, textDirection)
      super.paint(
        canvas, 
        decoration, 
        shape,
        textDirection, 
        painter, 
      )
    }
  }
}

export class BoxDecorationBackgroundImagePainter extends BoxDecorationPainter {
  
  static create (onChange: VoidFunction | null) {
    return new BoxDecorationBackgroundImagePainter(onChange)
  }

  protected onChange: VoidFunction | null

  constructor (onChange: VoidFunction | null = null) {
    super()

    this.onChange = onChange
  }

  paint (
    canvas: Canvas, 
    decoration: BoxDecoration, 
    rect: Rect,
    textDirection: Skia.TextDirection, 
    configuration: unknown
  ): void {
    if (decoration.image !== null) {

      const painter = decoration.image.createPainter(this.onChange ?? (() => {}))
      let clipPath: Path | null = null
        
      switch (decoration.shape) {
        case DecorationShape.Circle: {
          const center = rect.center
          const radius = rect.shortestSide / 2.0
          const square = Rect.fromCircle(center, radius)
          clipPath = Path.create()
          clipPath.addOval(square)
          break
        }
  
        case DecorationShape.Rectangle: {
          clipPath = Path.create()
          if (decoration.borderRadius !== null) {
            clipPath.addRRect(decoration.borderRadius!.resolve((configuration as ImageConfiguration).textDirection).toRRect(rect))
          } else {
            clipPath.addRect(rect)
          }
          break
        }
      }
      
      painter.paint(
        canvas, 
        rect, 
        clipPath, 
        configuration as ImageConfiguration
      )
    }
  }

}


export class BoxDecorationBorderPainter extends BoxDecorationPainter { 
  static create () {
    return new BoxDecorationBorderPainter()
  }

  paint (
    canvas: Canvas, 
    decoration: BoxDecoration, 
    shape: Rect, 
    textDirection: Skia.TextDirection, 
    configuration: unknown
  ): void {
    if (decoration.border !== null) {
      decoration.border.paint(
        canvas, 
        shape, 
        textDirection, 
        decoration.shape as unknown as BorderShape,
        decoration.borderRadius
      )    
    }
  }
}


//// => BoxDecorationCompositePainter
// 复合画笔
export type BoxDecorationCompositePainterOptions = {
  decoration: BoxDecoration, 
  onChange: VoidFunction | null
}

export class BoxDecorationCompositePainter extends DecorationCompositePainter<BoxShadow> {
  static create (
    decoration: BoxDecoration,
    onChange: VoidFunction | null = null
  ) {
    return new BoxDecorationCompositePainter(decoration, onChange)
  }

  createBuiltInBackgroundColorPainter (): BoxDecorationBackgroundColorPainter {
    return BoxDecorationBackgroundColorPainter.create()
  }
  createBuiltInBackgroundImagePainter (onChange: VoidFunction | null): BoxDecorationBackgroundImagePainter {
    return BoxDecorationBackgroundImagePainter.create(onChange)
  }

  createBuiltInShadowsPainter (): BoxDecorationShadowsPainter {
    return BoxDecorationShadowsPainter.create()
  }

  createBuiltInBorderPainter () {
    return BoxDecorationBorderPainter.create()
  }
  
  createBuiltInPainters () {
    const painters = super.createBuiltInPainters()

    // @TODO
    // if (this.decoration.border !== null) {
    //   painters.push(this.createBuiltInBorderPainter())
    // }

    return painters
  }

  paint (
    canvas: Canvas, 
    decoration: BoxDecoration, 
    shape: Offset, 
    textDirection: Skia.TextDirection, 
    configuration: ImageConfiguration
  ): void {
    invariant(configuration.size !== null)
    const rect = shape.and(configuration.size)

    super.paint(canvas, decoration, rect, textDirection, configuration)  
  }

}


//// => BoxDecoration
// 盒子样式
export type BoxDecorationOptions = {
  color?: Color | null,
  image?: DecorationImage | null,
  border?: BoxBorder | null,
  borderRadius?: BorderRadius | null,
  shadows?: BoxShadows | null,
  gradient?: Gradient | null,
  backgroundBlendMode?: Skia.BlendMode | null,
  shape?: DecorationShape | null,
}

export class BoxDecoration extends Decoration<BoxShadow> {
  /**
   * 
   * @param {BoxDecorationOptions} options 
   * @returns 
   */
  static create (options?: BoxDecorationOptions) {
    return new BoxDecoration(
      options?.color,
      options?.image,
      options?.shadows,
      options?.gradient,
      options?.backgroundBlendMode,
      options?.border,
      options?.borderRadius,
      options?.shape ?? DecorationShape.Rectangle,
    )
  }

  /**
   * 
   * @param a 
   * @param b 
   * @param t 
   * @returns 
   */
  static lerp (
    a: BoxDecoration | null, 
    b: BoxDecoration | null, 
    t: number
  ): BoxDecoration | null {
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      invariant(b !== null)
      return b.scale(t)
    }

    if (b === null) {
      invariant(a !== null)
      return a.scale(1.0 - t)
    }
    if (t === 0.0) {
      return a
    }
    if (t === 1.0) {
      return b
    }

    return new BoxDecoration(
      Color.lerp(a.color, b.color, t),
      t < 0.5 ? a.image : b.image, 
      BoxShadows.lerp(a.shadows, b.shadows, t),
      Gradient.lerp(a.gradient, b.gradient, t),
      null,
      BoxBorder.lerp(a.border, b.border, t),
      BorderRadius.lerp(a.borderRadius, b.borderRadius, t),
      t < 0.5 ? a.shape : b.shape,
    )
  }

  // => border
  private _border: BoxBorder | null
  public get border (): BoxBorder | null {
    return this._border
  }
  public set border (border: BoxBorder | null) {
    if (this._border?.notEqual(border)) {
      this._border = border
      this.publish('border', border)
    }
  }

  // => borderRadius
  private _borderRadius: BorderRadius | null
  public get borderRadius (): BorderRadius | null {
    return this._borderRadius
  }
  public set borderRadius (borderRadius: BorderRadius | null) {
    if (this._borderRadius?.notEqual(borderRadius)) {
      this._borderRadius = borderRadius
      this.publish('borderRadius', borderRadius)
    }
  }

  // => padding
  public get padding () : EdgeInsetsGeometry | null {
    return this.border ? this.border.dimensions : null
  }

  constructor (
    color: Color | null = null,
    image: DecorationImage | null = null,
    shadows: BoxShadows | null = null,
    gradient: Gradient | null = null,
    backgroundBlendMode: Skia.BlendMode | null = null,
    border: BoxBorder | null = null,
    borderRadius: BorderRadius | null = null,
    shape: DecorationShape = DecorationShape.Rectangle,
  ) {
    super(
      color, 
      image, 
      shadows, 
      gradient, 
      backgroundBlendMode,  
      shape
    )

    this._border = border
    this._borderRadius = borderRadius
  }

  createPainter (onChange: VoidFunction | null): BoxDecorationCompositePainter {
    invariant(onChange !== null || this.image === null)
    return BoxDecorationCompositePainter.create(this, onChange)
  }

  /**
   * 
   * @param a 
   * @param t 
   * @returns 
   */
  lerpFrom (a: BoxDecoration | null, t: number): BoxDecoration | null {
    if (a === null) {
      return this.scale(t)
    }

    if (a instanceof BoxDecoration) {
      return BoxDecoration.lerp(a, this, t)
    }

    return null
  }

  /**
   * 
   * @param b 
   * @param t 
   * @returns 
   */
  lerpTo (b: BoxDecoration | null, t: number): BoxDecoration | null {
    if (b === null) {
      return this.scale(1.0 - t)
    }

    if (b instanceof BoxDecoration) {
      return BoxDecoration.lerp(this, b, t)
    }

    return null
  }

  clipPath (
    rect: Rect, 
    textDirection: Skia.TextDirection
  ): Path {
    const path = Path.create()
    switch (this.shape) {
      case DecorationShape.Circle: {
        const center = rect.center
        const radius = rect.shortestSide / 2.0
        const square = Rect.fromCircle(center, radius)
        path.addOval(square)
        break
      }
      case DecorationShape.Rectangle: {
        invariant(rect instanceof Rect)
        if (this.borderRadius !== null) {
          path.addRRect(this.borderRadius.resolve(textDirection).toRRect(rect))
          return path
        }
        path.addRect(rect)
        break
      }
    }

    return path
  }

  scale (factor: number): BoxDecoration {
    return new BoxDecoration(
      Color.lerp(null, this.color, factor),
      this.image, 
      BoxShadows.lerp(null, this.shadows, factor),
      this.gradient?.scale(factor),
      this.backgroundBlendMode,
      BoxBorder.lerp(null, this.border, factor),
      BorderRadius.lerp(null, this.borderRadius, factor),
      this.shape,
    )
  }

  /**
   * 
   * @param {Color | null} color 
   * @param {DecorationImage} image 
   * @param {BoxBorder} border 
   * @param {BorderRadiusGeometry} borderRadius 
   * @param {BoxShadow[]} boxShadow 
   * @param {Gradient | null} gradient 
   * @param {Skia.BlendMode} backgroundBlendMode 
   * @param {DecorationShape | null} shape 
   * @returns {PathDecoration}
   */
  copyWith (
    color: Color | null = null,
    image: DecorationImage | null = null,
    shadows: BoxShadows | null = null,
    gradient: Gradient | null = null,
    backgroundBlendMode: Skia.BlendMode | null = null,
    shape: DecorationShape = DecorationShape.Rectangle,
    border: BoxBorder | null = null,
    borderRadius: BorderRadius | null = null,
  ): BoxDecoration  {
    return new BoxDecoration(
      color ?? this.color,
      image ?? this.image,
      shadows ?? this.shadows,
      gradient ?? this.gradient,
      backgroundBlendMode ?? this.backgroundBlendMode,
      border ?? this.border,
      borderRadius ?? this.borderRadius,
      shape ?? this.shape,
    )
  }

  hitTest (
    size: Size, 
    position: Offset , 
    textDirection: Skia.TextDirection
  ): boolean {
    invariant((Offset.ZERO.and(size)).contains(position))

    switch (this.shape) {
      case DecorationShape.Rectangle: {
        if (this.borderRadius !== null) {
          const bounds = this.borderRadius!.resolve(textDirection).toRRect(Offset.ZERO.and(size))
          return bounds.contains(position)
        }
        return true
      }
      case DecorationShape.Circle: {
        const center = size.center(Offset.ZERO)
        const distance = position.subtract(center).distance
        return distance <= Math.min(size.width, size.height) / 2.0
      }

      default: {
        // TODO
        return false
      }
    }
  }

  equal (other: BoxDecoration | null): boolean {
    return !!(
      other instanceof BoxDecoration && 
      super.equal(other) &&
      other.borderRadius?.equal(this.borderRadius) &&
      other?.border?.equal(this.border) && 
      other?.backgroundBlendMode === this.backgroundBlendMode
    )
  }

  notEqual(other: BoxDecoration | null): boolean {
    return !this.equal(other)
  }
}

