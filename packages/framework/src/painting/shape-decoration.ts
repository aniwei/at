/*
 * @author: Aniwei
 * @date: 2022-07-04 12:10:21
 */
import invariant from '@at/utility'
import { Color } from '../basic/color'
import { AtGradient } from './gradient'
import { AtBorderRadius } from './border-radius'
import { AtBoxBorder } from './box-border'


import { VoidCallback } from '../at'
import { Offset, Rect, Size } from '../basic/geometry'
import { AtPaint } from '../engine/paint'
import { AtPath } from '../engine/path'
import { AtImageConfiguration } from './image-provider'
import { AtCanvas } from '../engine/canvas'
import { AtBoxShadow, AtBoxShadows } from './box-shadow'
import { AtBorder } from './border'
import { AtDecoration, AtDecorationCompositePainter, AtDecorationPainter, DecorationShape } from './decoration'

import type { BlendMode, TextDirection } from '../engine/skia'
import type { AtDecorationImage } from './decoration-image'
import { AtShadow, AtShadows, AtShapeShadows } from './shadow'


export abstract  class AtShapeDecorationPainter extends AtDecorationPainter {
  draw (
    canvas: AtCanvas, 
    decoration: AtShapeDecoration, 
    shape: AtPath,
    paint: AtPaint,
    textDirection: TextDirection
  ): void {    
    canvas.drawPath(shape, paint)
  }

  dispose () {}
}

export class AtShapeDecorationShadowsPainter extends AtShapeDecorationPainter {
  static create () {
    return new AtShapeDecorationShadowsPainter()
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtShapeDecoration, 
    shape: AtPath, 
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ): void {
    if (decoration.shadows !== null) {
      for (const shadow of decoration.shadows) {
        const paint = shadow.toPaint()
        this.draw(
          canvas, 
          decoration, 
          shape,
          paint,
          textDirection,
        )
      }
    }
  }
}

export class AtShapeDecorationBackgroundColorPainter extends AtShapeDecorationPainter {
  static create () {
    return new AtShapeDecorationBackgroundColorPainter()
  }

  public painter: AtPaint | null = null

  createBuiltInPainter (
    shape: AtPath, 
    decoration: AtShapeDecoration,
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
      paint.shader = decoration.gradient.createShader(shape.getBounds(), textDirection)
    }

    return paint 
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtShapeDecoration, 
    shape: AtPath, 
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


export class AtShapeDecorationBackgroundImagePainter extends AtShapeDecorationPainter {
  
  static create (onChange: VoidCallback | null) {
    return new AtShapeDecorationBackgroundImagePainter(onChange)
  }

  protected onChange: VoidCallback | null

  constructor (onChange: VoidCallback | null) {
    super()
    this.onChange = onChange
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtShapeDecoration, 
    shape: AtPath,
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ): void {
    invariant(decoration.image)
    const painter = decoration.image.createPainter(this.onChange)
    let clipPath: AtPath = shape
    
    invariant(clipPath !== null)
    const bounds = shape.getBounds()
    console.log(`bounds`, bounds)
    painter.paint(canvas, bounds, clipPath, configuration)
  }
}


export class AtShapeDecorationBorderPainter extends AtShapeDecorationPainter { 
  static create () {
    return new AtShapeDecorationBorderPainter()
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtShapeDecoration, 
    shape: AtPath, 
    textDirection: TextDirection, 
    configuration: AtImageConfiguration): void 
  {
    if (decoration.border !== null) {
      decoration.border.paint(canvas, shape,)    
    }
  }
}


export type AtShapeDecorationCompositePainterOptions = {
  decoration: AtShapeDecoration, 
  onChange: VoidCallback | null
}

/**
 * @description: 盒子画笔
 */
export class AtShapeDecorationCompositePainter extends AtDecorationCompositePainter<
  AtBorder,
  AtShadow,
  AtShapeDecoration
> {
  static create (
    decoration: AtShapeDecoration,
    onChange: VoidCallback | null = null
  ) {
    return new AtShapeDecorationCompositePainter(decoration, onChange)
  }

   
  createBuiltInBackgroundColorPainter (): AtShapeDecorationBackgroundColorPainter {
    return AtShapeDecorationBackgroundColorPainter.create()
  }

  createBuiltInBackgroundImagePainter (
    onChange: VoidCallback | null
  ): AtShapeDecorationBackgroundImagePainter {
    return AtShapeDecorationBackgroundImagePainter.create(onChange)
  }

  createBuiltInShadowsPainter (): AtShapeDecorationShadowsPainter {
    return AtShapeDecorationShadowsPainter.create()
  }

  createBuiltInBorderPainter () {
    return AtShapeDecorationBorderPainter.create()
  }
  
  createBuiltInPainters () {
    const painters = super.createBuiltInPainters()

    if (this.decoration.border !== null) {
      painters.push(this.createBuiltInBorderPainter())
    }

    return painters
  }

}


export type AtShapeDecorationOptions = {
  color?: Color | null,
  image?: AtDecorationImage | null,
  border?: AtBorder | null,
  shadows?: AtShadows | null,
  gradient?: AtGradient | null,
  backgroundBlendMode?: BlendMode | null,
  shape?: DecorationShape | null,
}

export class AtShapeDecoration extends AtDecoration<
  AtBorder,
  AtShadow,
  AtShapeDecoration
> {
  
  static create (options?: AtShapeDecorationOptions) {
    return new AtShapeDecoration(
      options?.color,
      options?.image,
      options?.shadows,
      options?.gradient,
      options?.backgroundBlendMode,
      options?.border,
      options?.shape ?? DecorationShape.Irregular,
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
    a: AtShapeDecoration | null, 
    b: AtShapeDecoration | null, 
    t: number
  ): AtShapeDecoration | null {
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

    return new AtShapeDecoration(
      Color.lerp(a.color, b.color, t),
      t < 0.5 ? a.image : b.image, 
      AtShadows.lerp(a.shadows, b.shadows, t),
      AtGradient.lerp(a.gradient, b.gradient, t),
      null,
      AtBorder.lerp(a.border, b.border, t),
      t < 0.5 ? a.shape : b.shape,
    )
  }

  // => border
  private _border: AtBorder | null
  public get border (): AtBorder | null {
    return this._border
  }
  public set border (border: AtBorder | null) {
    if (this._border === null || this._border?.notEqual(border)) {
      this._border = border
      this.publish(`border`, border)
    }
  }

  constructor (
    color: Color | null = null,
    image: AtDecorationImage | null = null,
    shadows: AtShapeShadows<AtShadow> | null = null,
    gradient: AtGradient | null = null,
    backgroundBlendMode: BlendMode | null = null,
    border: AtBorder | null = null,
    shape: DecorationShape = DecorationShape.Rectangle,
  ) {
    super(color, image, shadows, gradient, backgroundBlendMode,  shape)

    this._border = border
  }

  createPainter (onChange: VoidCallback | null): AtShapeDecorationCompositePainter {
    invariant(onChange !== null || this.image === null)
    return AtShapeDecorationCompositePainter.create(this, onChange)
  }

  /**
   * 
   * @param a 
   * @param t 
   * @returns 
   */
  lerpFrom (a: AtShapeDecoration | null, t: number): AtShapeDecoration | null {
    if (a === null) {
      return this.scale(t)
    }

    if (a instanceof AtShapeDecoration) {
      return AtShapeDecoration.lerp(a, this, t)
    }

    return null
  }

  /**
   * 
   * @param b 
   * @param t 
   * @returns 
   */
  lerpTo (b: AtShapeDecoration | null, t: number): AtShapeDecoration | null {
    if (b === null) {
      return this.scale(1.0 - t)
    }

    if (b instanceof AtShapeDecoration) {
      return AtShapeDecoration.lerp(this, b, t)
    }

    return null
  }

  clipPath (
    shape: AtPath, 
    textDirection: TextDirection
  ): AtPath {
    return shape
  }

  scale (factor: number): AtShapeDecoration {
    return new AtShapeDecoration(
      Color.lerp(null, this.color, factor),
      this.image, 
      AtShadows.lerp(null, this.shadows, factor),
      this.gradient?.scale(factor),
      this.backgroundBlendMode,
      AtBorder.lerp(null, this.border, factor),
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
    shadows: AtShadows | null = null,
    gradient: AtGradient | null = null,
    backgroundBlendMode: BlendMode | null = null,
    shape: DecorationShape = DecorationShape.Rectangle,
    border: AtBorder | null = null,
  ): AtShapeDecoration  {
    return new AtShapeDecoration(
      color ?? this.color,
      image ?? this.image,
      shadows ?? this.shadows,
      gradient ?? this.gradient,
      backgroundBlendMode ?? this.backgroundBlendMode,
      border ?? this.border,
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

   return false
  }

  equal (other: AtShapeDecoration | null): boolean {
    return !!(
      super.equal(other) &&
      other?.border?.equal(this.border) && 
      other?.backgroundBlendMode === this.backgroundBlendMode
    )
  }
}

