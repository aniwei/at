/*
 * @author: Aniwei
 * @date: 2022-07-04 12:10:21
 */
import { invariant } from '@at/utility'
import { Offset, Size } from '../basic/geometry'
import { Subscribable } from '../basic/subscribable'
import { Color } from '../basic/color'
import { AtPath } from '../engine/path'
import { AtPaint } from '../engine/paint'
import { AtGradient } from './gradient'
import { AtShapeBorder } from './border'
import { AtShapeShadow, AtShapeShadows } from './shadow'

import type { BlendMode, TextDirection } from '../engine/skia'
import type { AtCanvas } from '../engine/canvas'
import type { VoidCallback } from '../at'
import type { AtImageConfiguration } from './image-provider'
import type { AtDecorationImage } from './decoration-image'

export enum DecorationShape {
  Rectangle,
  Circle,
  Irregular
}

export type AtDecorationPainterOptions<
  B extends AtShapeBorder<B>,
  S extends AtShapeShadow<S>,
  T extends AtDecoration<B, S, T>
> = {
  decoration: AtDecoration<B, S, T>, 
  onChange: VoidCallback | null
}

export abstract class AtDecorationPainter {

  abstract paint (
    canvas: AtCanvas, 
    decoration: unknown, 
    shape: unknown,
    textDirection: TextDirection,
    configuration: AtImageConfiguration
  ): void

  abstract draw (
    canvas: AtCanvas, 
    decoration: unknown, 
    shape: unknown,
    paint: AtPaint,
    textDirection: TextDirection
  ): void 

  dispose () {}
}


export abstract class AtDecorationCompositePainter<
  B extends AtShapeBorder<B>,
  S extends AtShapeShadow<S>,
  T extends AtDecoration<B, S, T>
> {
  // => painters
  public get painters (): AtDecorationPainter[] {
    this.cachedBuiltInPainters ??= this.createBuiltInPainters()
    invariant(this.cachedBuiltInPainters !== null)
    return this.cachedBuiltInPainters
  }
  
  private cachedBuiltInPainters: AtDecorationPainter[] | null = null

  public onChange: VoidCallback | null
  public decoration: T

  constructor (dectoration: T, onChange: VoidCallback | null) {
    this.onChange = onChange
    this.decoration = dectoration
  }

  abstract createBuiltInBackgroundColorPainter (): AtDecorationPainter
  abstract createBuiltInBackgroundImagePainter (onChange: VoidCallback | null): AtDecorationPainter
  abstract createBuiltInShadowsPainter (): AtDecorationPainter

  createBuiltInPainters () {
    invariant(this.cachedBuiltInPainters === null)

    const painters: AtDecorationPainter[] = []

    if (this.decoration.shadows !== null) {
      painters.push(this.createBuiltInShadowsPainter())
    }

    if (this.decoration.color !== null || this.decoration.gradient !== null) {
      painters.push(this.createBuiltInBackgroundColorPainter())
    }

    if (this.decoration.image !== null) {
      painters.push(this.createBuiltInBackgroundImagePainter(this.onChange))
    }


    this.cachedBuiltInPainters = painters
    return this.cachedBuiltInPainters
  }

  paint (
    canvas: AtCanvas, 
    decoration: AtDecoration<B, S, T>, 
    shape: unknown,
    textDirection: TextDirection, 
    configuration: AtImageConfiguration
  ) {
    for (const painter of this.painters) {
      painter.paint(
        canvas, 
        decoration, 
        shape,
        textDirection, 
        configuration
      )
    }
  }

  dispose () {

  }
}

export abstract class AtDecoration<
  B extends AtShapeBorder<B>,
  S extends AtShapeShadow<S>,
  T extends AtDecoration<B, S, T>
> extends Subscribable {
  // => isComplex
  public get isComplex () {
    return this.shadows !== null
  } 

  // => color
  private _color: Color | null
  public get color (): Color | null {
    return this._color
  }
  public set color (color: Color | null) {
    if (this._color === null || this._color?.notEqual(color)) {
      this._color = color
      this.publish(`color`, color)
    }
  }

  // => shape
  private _shape: DecorationShape = DecorationShape.Rectangle
  public get shape (): DecorationShape {
    return this._shape
  }
  public set shape (shape: DecorationShape) {
    if (this._shape !== shape) {
      this._shape = shape
      this.publish(`shape`, shape)
    }
  }
  
  // => image
  private _image: AtDecorationImage | null
  public get image (): AtDecorationImage | null {
    return this._image
  }
  public set image (image: AtDecorationImage | null) {
    if (this._image === null || this._image?.notEqual(image)) {
      this._image = image
      this.publish(`image`, image)
    }
  }

  // => shadows
  private _shadows: AtShapeShadows<S> | null
  public get shadows (): AtShapeShadows<S> | null {
    return this._shadows
  }
  public set shadows (shadows: AtShapeShadows<S> | null) {
    if (this._shadows === null || this._shadows?.notEqual(shadows)) {
      this._shadows = shadows
      this.publish(`shadows`, shadows)
    }
  }

  // => gradient
  private _gradient: AtGradient | null
  public get gradient (): AtGradient | null {
    return this._gradient
  }
  public set gradient (gradient: AtGradient | null) {
    if (this._gradient === null || this._gradient?.notEqual(gradient)) {
      this._gradient = gradient
      this.publish(`gradient`, gradient)
    }
  }

  // => backgroundBlendMode
  private _backgroundBlendMode: BlendMode | null
  public get backgroundBlendMode (): BlendMode | null {
    return this._backgroundBlendMode
  }
  public set backgroundBlendMode (blendMode: BlendMode | null) {
    if (this.backgroundBlendMode !== blendMode) {
      this._backgroundBlendMode = blendMode
      this.publish(`backgroundBlendMode`, blendMode)
    }
  }

  /**
   * 
   * @param color 
   * @param image 
   * @param border 
   * @param shadows 
   * @param gradient 
   * @param shape
   */
  constructor (
    color: Color | null = null,
    image: AtDecorationImage | null = null,
    shadows: AtShapeShadows<S> | null = null,
    gradient: AtGradient | null = null,
    backgroundBlendMode: BlendMode | null,
    shape: DecorationShape = DecorationShape.Rectangle
  ) {
    super()

    this._color = color
    this._image = image
    this._shadows = shadows
    this._gradient = gradient
    this._backgroundBlendMode = backgroundBlendMode
    this._shape = shape
  }

  abstract lerpFrom (a: AtDecoration<B, S, T> | null, t: number): AtDecoration<B, S, T> | null 
  abstract lerpTo (b: AtDecoration<B, S, T> | null, t: number): AtDecoration<B, S, T> | null

  abstract clipPath (
    rect: unknown,
    textDirection: TextDirection
  ): AtPath

  abstract scale (factor: number): AtDecoration<B, S, T>
  abstract copyWith (
    color: Color | null,
    image: AtDecorationImage | null,
    shadows: AtShapeShadows<S> | null,
    gradient: AtGradient | null,
    backgroundBlendMode: BlendMode | null,
    shape: DecorationShape,
    ...rest: unknown[]
  ): AtDecoration<B, S, T>

  abstract hitTest (
    size: Size, 
    position: Offset , 
    textDirection: TextDirection
  ): boolean

  abstract createPainter (onChange: VoidCallback | null): AtDecorationCompositePainter<B, S, T> 

  equal (other: AtDecoration<B, S, T> | null): boolean {
    return !!(
      other instanceof AtDecoration &&
      other.color?.equal(this.color) &&
      other.image === this.image &&
      other.gradient === this.gradient &&
      other.shadows?.equal(other.shadows)
    )
  }

  notEqual (other: AtDecoration<B, S, T> | null) {
    return !this.equal(other)
  }
}

