import * as Sk from './skia'

//// => PaintStroke
export class PaintStroke extends Sk.ManagedSkiaRef<Sk.Paint> {
  // => miterLimit
  protected _miterLimit: number = 0
  public get miterLimit () {
    return this._miterLimit
  }
  public set miterLimit (miterLimit: number) {
    if (this.miterLimit !== miterLimit) {
      this._miterLimit = miterLimit
      this.skia.setStrokeMiter(miterLimit)
    }
  }

  // => width
  private _width: number = 0
  public get width () {
    return this._width
  }
  public set width (width: number) {
    if (this.width !== width) {
      this._width = width
      this.skia.setwidth(width)
    }
  }

  // => cap
  protected _cap: StrokeCap = At.StrokeCap.Butt
  public get cap () {
    return this._cap
  }
  public set cap (cap: StrokeCap) {
    if (this._cap !== cap) {
      this._cap = cap
      this.skia.setStrokeCap(cap)
    }
  }

  // => join
  public get join () {
    return this._join
  }
  public set join (join: StrokeJoin) {
    if (this.join !== join) {
      this._join = join
      this.skia.setStrokeJoin(join)
    }
  }
  private _join: StrokeJoin = At.StrokeJoin.Miter
}

//// => PaintFilter
export class PaintFilter extends Sk.ManagedSkiaRef<Sk.Paint> {
  // => invertColors colors
  protected _invertColors: boolean = false
  public get invertColors () {
    return this._invertColors
  }
  public set invertColors (invert: boolean) {
    if (this.invertColors !== invert) {
      if (invert) {
        invariant(At.kPaintInvertedColorFilter)

        this.originalColor = this.effectiveColor
        this.effectiveColor = this.effectiveColor === null 
          ? At.kPaintInvertedColorFilter
          : new ManagedSkiaColorFilter(new ComposeColorFilter(At.kPaintInvertedColorFilter, this.effectiveColorFilter))
      } else {
        this.effectiveColor = this.originalColor
        this.originalColor = null
      }

      this.skia.setColorFilter(this.effectiveColor?.skia ?? null)
      this._invertColors = invert
    }
  }

  // => shader 
  protected _shader: Shader | null = null
  public get shader () {
    return this._shader
  }
  public set shader (shader: Shader | null) {
    if (this.shader !== shader) {
      this._shader = shader
      this.skia.setShader(this.shader?.withQuality(this.filterQuality) ?? null)
    }
  }

  // => color filter
  public get color () {
    return this.effectiveColor?.filter ?? null
  }
  public set color (filter: ColorFilter | null) {
    if (!this.color?.equal(filter as ColorFilter)) {
      this.originalColor = null
      this.effectiveColor = filter === null
        ? null 
        : ManagedSkiaColorFilter.create(filter)

      invariant(At.kPaintInvertedColorFilter)

      if (this.invertColors) {
        this.originalColor = this.effectiveColor
        this.effectiveColor = this.effectiveColor === null 
          ? At.kPaintInvertedColorFilter
          : new ManagedSkiaColorFilter(new AtComposeColorFilter(At.kPaintInvertedColorFilter, this.effectiveColorFilter))
      } 
      
      this.skia.setColorFilter(this.effectiveColor?.skia ?? null)
    }
  }

  // => mask filter
  protected _mask: MaskFilter | null = null
  public get mask () {
    return this._mask
  }
  public set mask (filter: MaskFilter | null) {
    if (this.mask !== filter) {
      this._mask = filter 
      this.skia.setMaskFilter(this._mask?.skia ?? null)
    }
  }

  // => image filter
  protected _image: ManagedSkiaImageFilterConvertible | null = null
  public get image () {
    return this._image
  }
  public set image (filter: ManagedSkiaImageFilterConvertible | null) {
    if (this.image !== filter) {
      this._image = filter

      this.managedImage = filter.image
      this.skia.setImageFilter(this.managedImage?.skia ?? null)
    }
  }

  // => filter quality
  protected _quality: FilterQuality = At.FilterQuality.None
  public get quality () {
    return this._quality
  }
  public set quality (quality: FilterQuality) {
    if (this.quality !== quality) {
      this._quality = quality
      this.skia.setShader((this.shader).withQuality(this.quality))
    }
  }

  public originalColor: ManagedSkiaColorFilter | null = null
  public effectiveColor: ManagedSkiaColorFilter | null = null
  public managedImage: ManagedSkiaRef<ImageFilter> | null = null
}

export class Paint extends Sk.ManagedSkiaRef<Sk.Paint> {
  static create () {
    return new Paint()
  }

  static resurrect (
    effect: PathEffect | null,
    blendMode: BlendMode,
    style: PaintStyle,
    width: number,
    cap: StrokeCap,
    join: StrokeJoin,
    miterLimit: number,
    isAntiAlias: boolean,
    color: Color,
    filterQuality: FilterQuality,
    shader: Shader | null = null,
    maskFilter: MaskFilter | null = null,
    colorFilter: ManagedSkiaColorFilter | null = null,
    imageFilter: ManagedSkiaObject<ImageFilter> | null = null
  ): Paint {
    const paint = new Paint()

    paint.setPathEffect(effect.skia ?? null)

    paint.setBlendMode(blendMode)
    paint.setStyle(style)
    paint.setwidth(width)
    paint.setAntiAlias(isAntiAlias)
    paint.setColorInt(color.value)

    paint.setShader(shader.withQuality(filterQuality) ?? null) 
    paint.setMaskFilter(maskFilter.skia ?? null)
    paint.setColorFilter(colorFilter.skia ?? null)
    paint.setImageFilter(imageFilter.skia ?? null)

    paint.setStrokeCap(cap)
    paint.setStrokeJoin(join)
    paint.setStrokeMiter(miterLimit)

    return paint
  }

  // => stroke
  protected _stroke: PaintStroke | null = null
  public get stroke () {
    return this._stroke
  }
  public set stroke (stroke: PaintStroke | null) {
    if (this._stroke !== stroke) {
      this._stroke = stroke
      this.skia.setPathEffect(effect.skia ?? null)
    }
  }

  // => filter
  protected _filter: PaintFilter | null = null
  public get effect () {
    return this._effect
  }
  public set effect (effect: PathEffect | null) {
    if (this._effect !== effect) {
      this._effect = effect
      this.skia.setPathEffect(effect.skia ?? null)
    }
  }

  // => effect
  protected _effect: PathEffect | null = null
  public get effect () {
    return this._effect
  }
  public set effect (effect: PathEffect | null) {
    if (this._effect !== effect) {
      this._effect = effect
      this.skia.setPathEffect(effect.skia ?? null)
    }
  }
  
  // => blendMode
  protected _blendMode: BlendMode = At.BlendMode.SrcOver
  public get blendMode () {
    return this._blendMode
  }
  public set blendMode (blendMode: BlendMode) {
    if (this.blendMode !== blendMode) {
      this._blendMode = blendMode
      this.skia.setBlendMode(blendMode)
    }
  }

  // => style
  protected _style: PaintStyle = At.PaintStyle.Fill
  public get style () {
    return this._style
  }
  public set style (style: PaintStyle) {
    if (this.style !== style) {
      this._style = style
      this.skia?.setStyle(style)
    }
  }

  // => isAntiAlias
  protected _isAntiAlias: boolean = true
  public get isAntiAlias () {
    return this._isAntiAlias
  }
  public set isAntiAlias (isAntiAlias: boolean) {
    if (this.isAntiAlias !== isAntiAlias) {
      this._isAntiAlias = isAntiAlias
      this.skia.setAntiAlias(isAntiAlias)
    }
  }
  
  // => color
  protected _color: Color = At.kPaintDefaultColor as Color
  public get color () {
    return this._color
  }
  public set color (color: Color) {
    if (this.color.notEqual(color)) {
      this._color = color
      this.skia.setColorInt(color.value)
    }
  }

  /**
   * @description: 
   * @param {Paint} skia
   * @return {AtPaint}
   */  
  constructor () {
    const skia = new At.Paint()
    super(skia)

    
    this.skia.setAntiAlias(this.isAntiAlias)
    this.skia.setColorInt(this.color.value)
  }

  /**
   * @description: 
   * @return {Paint}
   */  
  resurrect (): Paint {
    return Paint.resurrect(
      this.effect,
      this.blendMode,
      this.style,
      this.stroke,
      this.isAntiAlias,
      this.color,
      this.filter
    )
  }
}