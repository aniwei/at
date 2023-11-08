import { invariant } from '@at/utils'
import { At } from '../at'
import { Color } from '../basic/color'
import { AtManagedSkiaObject, FilterQuality } from './skia'
import { AtManagedSkiaColorFilter, AtComposeColorFilter, AtMatrixColorFilter } from './color-filter'

import type { ArrayLike } from '../at'
import type { AtShader } from './shader'
import type { AtMaskFilter } from './mask-filter'
import type { AtColorFilter } from './color-filter'
import type { AtManagedSkiaImageFilterConvertible } from './image-filter'
import type { PathEffect, Paint, BlendMode, PaintStyle, StrokeCap, StrokeJoin, ImageFilter } from './skia'
import { AtPathEffect } from './path-effect'


export class AtPaint extends AtManagedSkiaObject<Paint> {
  static create () {
    return new AtPaint()
  }

  static resurrect (
    effect: AtPathEffect | null,
    blendMode: BlendMode,
    style: PaintStyle,
    strokeWidth: number,
    strokeCap: StrokeCap,
    strokeJoin: StrokeJoin,
    strokeMiterLimit: number,
    isAntiAlias: boolean,
    color: Color,
    filterQuality: FilterQuality,
    shader: AtShader | null = null,
    maskFilter: AtMaskFilter | null = null,
    colorFilter: AtManagedSkiaColorFilter | null = null,
    imageFilter: AtManagedSkiaObject<ImageFilter> | null = null
  ): Paint {
    const paint = new At.Paint()

    paint.setPathEffect(effect?.skia ?? null)

    paint.setBlendMode(blendMode)
    paint.setStyle(style)
    paint.setStrokeWidth(strokeWidth)
    paint.setAntiAlias(isAntiAlias)
    paint.setColorInt(color.value)

    paint.setShader(shader?.withQuality(filterQuality) ?? null) 
    paint.setMaskFilter(maskFilter?.skia ?? null)
    paint.setColorFilter(colorFilter?.skia ?? null)
    paint.setImageFilter(imageFilter?.skia ?? null)

    paint.setStrokeCap(strokeCap)
    paint.setStrokeJoin(strokeJoin)
    paint.setStrokeMiter(strokeMiterLimit)

    return paint
  }


  // => effect
  public get effect () {
    return this._effect
  }
  public set effect (effect: AtPathEffect | null) {
    if (this._effect !== effect) {
      this._effect = effect
      this.skia?.setPathEffect(effect?.skia ?? null)
    }
  }
  private _effect: AtPathEffect | null = null

  // => blendMode
  public get blendMode () {
    return this._blendMode
  }
  public set blendMode (blendMode: BlendMode) {
    if (this.blendMode !== blendMode) {
      this._blendMode = blendMode
      this.skia?.setBlendMode(blendMode)
    }
  }
  private _blendMode: BlendMode = At.BlendMode.SrcOver

  // => style
  public get style () {
    return this._style
  }
  public set style (style: PaintStyle) {
    if (this.style !== style) {
      this._style = style
      this.skia?.setStyle(style)
    }
  }
  private _style: PaintStyle = At.PaintStyle.Fill

  // => strokeWidth
  public get strokeWidth () {
    return this._strokeWidth
  }
  public set strokeWidth (strokeWidth: number) {
    if (this.strokeWidth !== strokeWidth) {
      this._strokeWidth = strokeWidth
      this.skia?.setStrokeWidth(strokeWidth)
    }
  }
  private _strokeWidth: number = 0

  // => strokeCap
  public get strokeCap () {
    return this._strokeCap
  }
  public set strokeCap (strokeCap: StrokeCap) {
    if (this._strokeCap !== strokeCap) {
      this._strokeCap = strokeCap
      this.skia?.setStrokeCap(strokeCap)
    }
  }
  private _strokeCap: StrokeCap = At.StrokeCap.Butt

  // => strokeJoin
  public get strokeJoin () {
    return this._strokeJoin
  }
  public set strokeJoin (strokeJoin: StrokeJoin) {
    if (this.strokeJoin !== strokeJoin) {
      this._strokeJoin = strokeJoin
      this.skia?.setStrokeJoin(strokeJoin)
    }
  }
  private _strokeJoin: StrokeJoin = At.StrokeJoin.Miter

  // => isAntiAlias
  public get isAntiAlias () {
    return this._isAntiAlias
  }
  public set isAntiAlias (isAntiAlias: boolean) {
    if (this.isAntiAlias !== isAntiAlias) {
      this._isAntiAlias = isAntiAlias
      this.skia?.setAntiAlias(isAntiAlias)
    }
  }
  private _isAntiAlias: boolean = true

  // => color
  public get color () {
    return this._color
  }
  public set color (color: Color) {
    if (this.color.notEqual(color)) {
      this._color = color
      this.skia?.setColorInt(color.value)
    }
  }
  private _color: Color = At.kPaintDefaultColor as Color
  
  // => invertColors colors
  public get invertColors () {
    return this._invertColors
  }
  public set invertColors (invert: boolean) {
    if (this.invertColors !== invert) {
      if (invert) {
        invariant(At.kPaintInvertedColorFilter)

        this.originalColorFilter = this.effectiveColorFilter
        this.effectiveColorFilter = this.effectiveColorFilter === null 
          ? At.kPaintInvertedColorFilter
          : new AtManagedSkiaColorFilter(new AtComposeColorFilter(At.kPaintInvertedColorFilter, this.effectiveColorFilter))
      } else {
        this.effectiveColorFilter = this.originalColorFilter
        this.originalColorFilter = null
      }

      this.skia?.setColorFilter(this.effectiveColorFilter?.skia ?? null)
      this._invertColors = invert
    }
  }
  private _invertColors: boolean = false

  // => shader
  // @MARK
  public get shader () {
    return this._shader
  }
  public set shader (shader: AtShader | null) {
    if (this.shader !== shader) {
      this._shader = shader
      
      if (this.shader !== null) {
        this.skia?.setShader(this.shader.withQuality(this.filterQuality)!)
      }
    }
  }
  private _shader: AtShader | null = null

  // => maskFilter
  // @MARK
  public get maskFilter () {
    return this._maskFilter
  }
  public set maskFilter (maskFilter: AtMaskFilter | null) {
    if (this.maskFilter !== maskFilter) {

      this._maskFilter = maskFilter
      if (this._maskFilter !== null) {
        this.skia?.setMaskFilter(this._maskFilter.skia!)
      }
    }
  }
  private _maskFilter: AtMaskFilter | null = null

  // => filterQuality
  // @MARK
  public get filterQuality () {
    return this._filterQuality
  }
  public set filterQuality (filterQuality: FilterQuality) {
    if (this.filterQuality !== filterQuality) {
      this._filterQuality = filterQuality

      if (this.shader !== null) {
        this.skia?.setShader((this.shader as AtShader).withQuality(this.filterQuality)!)
      }
    }
  }
  private _filterQuality: FilterQuality = At.FilterQuality.None

  // => colorFilter
  public get colorFilter () {
    return this.effectiveColorFilter?.colorFilter ?? null
  }
  public set colorFilter (colorFilter: AtColorFilter | null) {
    if (!this.colorFilter?.equal(colorFilter as AtColorFilter)) {
      this.originalColorFilter = null
      this.effectiveColorFilter = colorFilter === null
        ? null 
        : new AtManagedSkiaColorFilter(colorFilter)

      invariant(At.kPaintInvertedColorFilter)

      if (this.invertColors) {
        this.originalColorFilter = this.effectiveColorFilter
        this.effectiveColorFilter = this.effectiveColorFilter === null 
          ? At.kPaintInvertedColorFilter
          : new AtManagedSkiaColorFilter(new AtComposeColorFilter(At.kPaintInvertedColorFilter, this.effectiveColorFilter))
      } 
      
      this.skia?.setColorFilter(this.effectiveColorFilter?.skia ?? null)
    }
  }

  // => strokeMiterLimit
  public get strokeMiterLimit () {
    return this._strokeMiterLimit
  }
  public set strokeMiterLimit (strokeMiterLimit: number) {
    if (this.strokeMiterLimit !== strokeMiterLimit) {
      this._strokeMiterLimit = strokeMiterLimit
      this.skia?.setStrokeMiter(strokeMiterLimit)
    }
  }
  private _strokeMiterLimit: number = 0

  // => imageFilter
  public get imageFilter () {
    return this._imageFilter
  }
  public set imageFilter (imageFilter: AtManagedSkiaImageFilterConvertible | null) {
    if (this.imageFilter !== imageFilter) {
      this._imageFilter = imageFilter

      if (imageFilter !== null) {
        this.managedImageFilter = imageFilter.imageFilter
        this.skia?.setImageFilter(this.managedImageFilter!.skia!)
      }
    }
  }
  private _imageFilter: AtManagedSkiaImageFilterConvertible | null = null

  public originalColorFilter: AtManagedSkiaColorFilter | null = null
  public effectiveColorFilter: AtManagedSkiaColorFilter | null = null
  public managedImageFilter: AtManagedSkiaObject<ImageFilter> | null = null

  /**
   * @description: 
   * @param {Paint} skia
   * @return {AtPaint}
   */  
  constructor () {
    const skia = new At.Paint()
    super(skia)

    this.skia?.setAntiAlias(this.isAntiAlias)
    this.skia?.setColorInt(this.color.value)
  }

  /**
   * @description: 
   * @return {Paint}
   */  
  resurrect (): Paint {
    return AtPaint.resurrect(
      this.effect,
      this.blendMode,
      this.style,
      this.strokeWidth,
      this.strokeCap,
      this.strokeJoin,
      this.strokeMiterLimit,
      this.isAntiAlias,
      this.color,
      this.filterQuality,
      this.shader,
      this.maskFilter,
      this.effectiveColorFilter,
      this.managedImageFilter
    )
  }
}

// TODO
// function createInverColorFilter() {
//   return kInvertColorFilter = new ManagedSkiaColorFilter(new MatrixColorFilter(kInvertColorMatrix))
//}

