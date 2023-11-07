/*
 * @author: Aniwei
 * @date: 2022-07-04 12:10:21
 */
import { invariant } from '@at/utility'
import { Color } from '../basic/color'
import { AtGradient } from './gradient'
import { AtBorderRadius } from './border-radius'
import { AtBoxBorder } from './box-border'
import { VoidCallback } from '../at'
import { AtPaint } from '../engine/paint'
import { AtPath } from '../engine/path'
import { AtCanvas } from '../engine/canvas'
import { Offset, Rect, Size } from '../basic/geometry'
import { AtImageConfiguration } from './image-provider'
import { AtBoxShadow, AtBoxShadows } from './box-shadow'
import { BorderShape } from './border'
import { AtDecoration, AtDecorationCompositePainter, AtDecorationPainter, DecorationShape } from './decoration'

import type { AtEdgeInsetsGeometry } from './edge-insets'
import type { BlendMode, TextDirection } from '../engine/skia'
import type { AtDecorationImage } from './decoration-image'


export abstract  class AtBoxDecorationPainter extends AtDecorationPainter {
  /**
   * 
   * @param {AtCanvas} canvas 
   * @param {AtBoxDecoration} decoration 
   * @param {Rect} rect 
   * @param {AtPaint} paint 
   * @param {TextDirection} textDirection 
   */
  draw (
    canvas: AtCanvas, 
    decoration: AtBoxDecoration, 
    rect: Rect,
    paint: AtPaint,
    textDirection: TextDirection
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

  dispose () {}
}

export class AtBoxDecorationShadowsPainter extends AtBoxDecorationPainter {
  /**
   * 
   * @returns {AtBoxDecorationShadowsPainter}
   */
  static create () {
    return new AtBoxDecorationShadowsPainter()
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtBoxDecoration, 
    shape: Rect, 
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ): void {
    if (decoration.shadows !== null) {
      for (const shadow of decoration.shadows) {
        const paint = shadow.toPaint()
        const bounds = shape.shift(shadow.offset).inflate(shadow.spreadRadius)

        switch (decoration.shape) {
          case DecorationShape.Rectangle: {
            this.draw(
              canvas, 
              decoration, 
              bounds,
              paint,
              textDirection,
            )
            break
          }
          case DecorationShape.Circle: {
            this.draw(
              canvas, 
              decoration, 
              bounds,
              paint,
              textDirection
            )
            break
          }
        }
      }
    }
  }
}


export class AtBoxDecorationBackgroundColorPainter extends AtBoxDecorationPainter {
  static create () {
    return new AtBoxDecorationBackgroundColorPainter()
  }

  protected rectForCachedBackgroundPaint: Rect | null = null

  createBuiltInPainter (
    rect: Rect, 
    decoration: AtBoxDecoration,
    textDirection: TextDirection
  ) {
    const paint = AtPaint.create()
    
    if (decoration.backgroundBlendMode !== null) {
      paint.blendMode = decoration.backgroundBlendMode
    }

    if (decoration.color !== null) {
      paint.color = decoration.color
    }

    if (decoration.gradient !== null) {
      paint.shader = decoration.gradient.createShader(rect, textDirection)
    }

    return paint 
    
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtBoxDecoration, 
    shape: Rect, 
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ): void {
    if (decoration.color !== null || decoration.gradient !== null) {
      const painter = this.createBuiltInPainter(shape, decoration, textDirection)
      invariant(painter)
      this.draw(
        canvas, 
        decoration, 
        shape,
        painter, 
        textDirection, 
      )
    }
  }
}

export class AtBoxDecorationBackgroundImagePainter extends AtBoxDecorationPainter {
  
  static create (onChange: VoidCallback | null) {
    return new AtBoxDecorationBackgroundImagePainter(onChange)
  }

  protected onChange: VoidCallback | null

  constructor (onChange: VoidCallback | null = null) {
    super()

    this.onChange = onChange
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtBoxDecoration, 
    rect: Rect,
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ): void {
    if (decoration.image !== null) {

      const painter = decoration.image.createPainter(this.onChange)
      let clipPath: AtPath | null = null
        
      switch (decoration.shape) {
        case DecorationShape.Circle: {
          invariant(decoration.borderRadius === null, `The decoration borderRadius cannot be null.`)
          const center = rect.center
          const radius = rect.shortestSide / 2.0
          const square = Rect.fromCircle(center, radius)
          clipPath = new AtPath()
          clipPath.addOval(square)
          break
        }
  
        case DecorationShape.Rectangle: {
          clipPath = new AtPath()
          if (decoration.borderRadius !== null) {
            clipPath.addRRect(decoration.borderRadius!.resolve(configuration.textDirection).toRRect(rect))
          } else {
            clipPath.addRect(rect)
          }
          break
        }
      }
      
      invariant(clipPath !== null)
      painter.paint(canvas, rect, clipPath, configuration)
    }
  }

}


export class AtBoxDecorationBorderPainter extends AtBoxDecorationPainter { 
  static create () {
    return new AtBoxDecorationBorderPainter()
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtBoxDecoration, 
    shape: Rect, 
    textDirection: TextDirection, 
    configuration: AtImageConfiguration): void 
  {
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


export type AtBoxDecorationCompositePainterOptions = {
  decoration: AtBoxDecoration, 
  onChange: VoidCallback | null
}

/**
 * @description: 盒子画笔
 */
export class AtBoxDecorationCompositePainter extends AtDecorationCompositePainter<
  AtBoxBorder,
  AtBoxShadow,
  AtBoxDecoration
> {
  static create (
    decoration: AtBoxDecoration,
    onChange: VoidCallback | null = null
  ) {
    return new AtBoxDecorationCompositePainter(decoration, onChange)
  }

   
  createBuiltInBackgroundColorPainter (): AtBoxDecorationBackgroundColorPainter {
    return AtBoxDecorationBackgroundColorPainter.create()
  }
  createBuiltInBackgroundImagePainter (onChange: VoidCallback | null): AtBoxDecorationBackgroundImagePainter {
    return AtBoxDecorationBackgroundImagePainter.create(onChange)
  }

  createBuiltInShadowsPainter (): AtBoxDecorationShadowsPainter {
    return AtBoxDecorationShadowsPainter.create()
  }

  createBuiltInBorderPainter () {
    return AtBoxDecorationBorderPainter.create()
  }
  
  createBuiltInPainters () {
    const painters = super.createBuiltInPainters()

    if (this.decoration.border !== null) {
      painters.push(this.createBuiltInBorderPainter())
    }

    return painters
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtBoxDecoration, 
    shape: Offset, 
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ): void {
    invariant(configuration.size !== null)
    const rect = shape.and(configuration.size)

    super.paint(canvas, decoration, rect, textDirection, configuration)  
  }

}


export type AtBoxDecorationOptions = {
  color?: Color | null,
  image?: AtDecorationImage | null,
  border?: AtBoxBorder | null,
  borderRadius?: AtBorderRadius | null,
  shadows?: AtBoxShadows | null,
  gradient?: AtGradient | null,
  backgroundBlendMode?: BlendMode | null,
  shape?: DecorationShape | null,
}

export class AtBoxDecoration extends AtDecoration<
  AtBoxBorder,
  AtBoxShadow,
  AtBoxDecoration
> {
  
  static create (options?: AtBoxDecorationOptions) {
    return new AtBoxDecoration(
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
    a: AtBoxDecoration | null, 
    b: AtBoxDecoration | null, 
    t: number
  ): AtBoxDecoration | null {
    invariant(t !== null, `The argument "t" cannot be null.`)

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

    return new AtBoxDecoration(
      Color.lerp(a.color, b.color, t),
      t < 0.5 ? a.image : b.image, 
      AtBoxShadows.lerp(a.shadows, b.shadows, t),
      AtGradient.lerp(a.gradient, b.gradient, t),
      null,
      AtBoxBorder.lerp(a.border, b.border, t),
      AtBorderRadius.lerp(a.borderRadius, b.borderRadius, t),
      t < 0.5 ? a.shape : b.shape,
    )
  }

  // => border
  private _border: AtBoxBorder | null
  public get border (): AtBoxBorder | null {
    return this._border
  }
  public set border (border: AtBoxBorder | null) {
    if (this._border?.notEqual(border)) {
      this._border = border
      this.publish(`border`, border)
    }
  }

  // => borderRadius
  private _borderRadius: AtBorderRadius | null
  public get borderRadius (): AtBorderRadius | null {
    return this._borderRadius
  }
  public set borderRadius (borderRadius: AtBorderRadius | null) {
    if (this._borderRadius?.notEqual(borderRadius)) {
      this._borderRadius = borderRadius
      this.publish(`borderRadius`, borderRadius)
    }
  }

  // => padding
  public get padding () : AtEdgeInsetsGeometry | null {
    return this.border ? this.border.dimensions : null
  }

  constructor (
    color: Color | null = null,
    image: AtDecorationImage | null = null,
    shadows: AtBoxShadows | null = null,
    gradient: AtGradient | null = null,
    backgroundBlendMode: BlendMode | null = null,
    border: AtBoxBorder | null = null,
    borderRadius: AtBorderRadius | null = null,
    shape: DecorationShape = DecorationShape.Rectangle,
  ) {
    super(color, image, shadows, gradient, backgroundBlendMode,  shape)

    this._border = border
    this._borderRadius = borderRadius
  }

  createPainter (onChange: VoidCallback | null): AtBoxDecorationCompositePainter {
    invariant(onChange !== null || this.image === null)
    return AtBoxDecorationCompositePainter.create(this, onChange)
  }

  /**
   * 
   * @param a 
   * @param t 
   * @returns 
   */
  lerpFrom (a: AtBoxDecoration | null, t: number): AtBoxDecoration | null {
    if (a === null) {
      return this.scale(t)
    }

    if (a instanceof AtBoxDecoration) {
      return AtBoxDecoration.lerp(a, this, t)
    }

    return null
  }

  /**
   * 
   * @param b 
   * @param t 
   * @returns 
   */
  lerpTo (b: AtBoxDecoration | null, t: number): AtBoxDecoration | null {
    if (b === null) {
      return this.scale(1.0 - t)
    }

    if (b instanceof AtBoxDecoration) {
      return AtBoxDecoration.lerp(this, b, t)
    }

    return null
  }

  clipPath (
    rect: Rect, 
    textDirection: TextDirection
  ): AtPath {
    const path = new AtPath()
    switch (this.shape) {
      case DecorationShape.Circle: {
        invariant(rect instanceof Rect)
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

  scale (factor: number): AtBoxDecoration {
    return new AtBoxDecoration(
      Color.lerp(null, this.color, factor),
      this.image, 
      AtBoxShadows.lerp(null, this.shadows, factor),
      this.gradient?.scale(factor),
      this.backgroundBlendMode,
      AtBoxBorder.lerp(null, this.border, factor),
      AtBorderRadius.lerp(null, this.borderRadius, factor),
      this.shape,
    )
  }

  /**
   * 
   * @param {Color | null} color 
   * @param {AtDecorationImage} image 
   * @param {AtBoxBorder} border 
   * @param {AtBorderRadiusGeometry} borderRadius 
   * @param {AtBoxShadow[]} boxShadow 
   * @param {AtGradient | null} gradient 
   * @param {BlendMode} backgroundBlendMode 
   * @param {DecorationShape | null} shape 
   * @returns {AtPathDecoration}
   */
  copyWith (
    color: Color | null = null,
    image: AtDecorationImage | null = null,
    shadows: AtBoxShadows | null = null,
    gradient: AtGradient | null = null,
    backgroundBlendMode: BlendMode | null = null,
    shape: DecorationShape = DecorationShape.Rectangle,
    border: AtBoxBorder | null = null,
    borderRadius: AtBorderRadius | null = null,
  ): AtBoxDecoration  {
    return new AtBoxDecoration(
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
    textDirection: TextDirection
  ): boolean {
    invariant(this.shape !== null, `The argument "shap" cannot be null.`)
    invariant((Offset.zero.and(size)).contains(position))

    switch (this.shape) {
      case DecorationShape.Rectangle: {
        if (this.borderRadius !== null) {
          const bounds = this.borderRadius!.resolve(textDirection).toRRect(Offset.zero.and(size))
          return bounds.contains(position)
        }
        return true
      }
      case DecorationShape.Circle: {
        const center = size.center(Offset.zero)
        const distance = position.subtract(center).distance
        return distance <= Math.min(size.width, size.height) / 2.0
      }

      default: {
        // TODO
        return false
      }
    }
  }

  equal (other: AtBoxDecoration | null): boolean {
    return !!(
      super.equal(other) &&
      other?.borderRadius?.equal(this.borderRadius) &&
      other?.border?.equal(this.border) && 
      other?.backgroundBlendMode === this.backgroundBlendMode
    )
  }
}

