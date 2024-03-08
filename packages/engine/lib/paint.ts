import { Color } from '@at/basic'
import { invariant } from '@at/utils'
import { Engine } from './engine'
import { Shader } from './shader'
import { ImageFilter } from './image-filter'
import { MaskFilter } from './mask-filter'
import { ManagedSkiaColorFilter } from './color-filter'
import { PathDashEffect } from './path-effect'

import * as Skia from './skia'


//// => PaintBoxRef
// 引用 Box
export interface PaintRefBoxFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class PaintRefBox {
  static create<T extends PaintRefBox> (...rests: unknown[]): PaintRefBox
  static create<T extends PaintRefBox> (box: Skia.Paint | Skia.SkiaRefBox<PaintRefBox, Skia.Paint>): PaintRefBox {
    const Factory = this as unknown as PaintRefBoxFactory<T>
    return new Factory(box)
  }

  /**
   * 克隆 
   * @param {Skia.SkiaRefBox<PaintRefBox, Skia.Paint>} box
   * @return {PaintRefBox}
   */  
  static cloneOf (box: Skia.SkiaRefBox<PaintRefBox, Skia.Paint>): PaintRefBox {
    const ref = this.create(box) as PaintRefBox
    return ref
  }

  // => skia
  public get skia () {
    return this.box.skia
  }

  public box: Skia.SkiaRefBox<PaintRefBox, Skia.Paint>
  public disposed: boolean = false

  constructor (...rests: unknown[])
  constructor (ref: Skia.Paint)
  constructor (box: Skia.Paint | Skia.SkiaRefBox<PaintRefBox, Skia.Paint>) {
    this.box = box instanceof Skia.SkiaRefBox
      ? box 
      : new Skia.SkiaRefBox(box)
    
    this.box.ref(this)
  }

  dispose () {
    this.disposed = true
    this.box.unref(this)
  }

  clone (): PaintRefBox {
    return PaintRefBox.cloneOf(this.box)
  }
}

//// => Stroke
// 线
export class Stroke extends PaintRefBox { 
  static create (box: Skia.SkiaRefBox<PaintRefBox, Skia.Paint>) {
    return super.create(box) as Stroke
  }

  // => miterLimit
  protected _miterLimit: number = 0
  public get miterLimit () {
    return this._miterLimit
  }
  public set miterLimit (miterLimit: number) {
    if (this.miterLimit !== miterLimit) {
      this._miterLimit = miterLimit
      this.skia?.setStrokeMiter(miterLimit)
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
      this.skia.setStrokeWidth(width)
    }
  }

  // => cap
  protected _cap: Skia.StrokeCap = Engine.skia.StrokeCap.Butt
  public get cap () {
    return this._cap
  }
  public set cap (cap: Skia.StrokeCap) {
    if (this._cap !== cap) {
      this._cap = cap
      this.skia.setStrokeCap(cap)
    }
  }

  // => join
  public get join () {
    return this._join
  }
  public set join (join: Skia.StrokeJoin) {
    if (this.join !== join) {
      this._join = join
      this.skia.setStrokeJoin(join)
    }
  }
  protected _join: Skia.StrokeJoin = Engine.skia.StrokeJoin.Miter

  constructor (...rests: unknown[])
  constructor (ref: Skia.Paint)
  constructor (box: Skia.Paint | Skia.SkiaRefBox<PaintRefBox, Skia.Paint>) {
    super(box)
  }
}

//// => Filter
// 滤镜
export class Filter extends PaintRefBox {
  static create (box: Skia.SkiaRefBox<PaintRefBox, Skia.Paint>) {
    return super.create(box) as Filter
  }
  // => invertColors colors
  // protected _invertColors: boolean = false
  // public get invertColors () {
  //   return this._invertColors
  // }
  // public set invertColors (invert: boolean) {
  //   if (this.invertColors !== invert) {
  //     if (invert) {
  //       invariant(At.kPaintInvertedColorFilter)

  //       this.originalColor = this.effectiveColor
  //       this.effectiveColor = this.effectiveColor === null 
  //         ? At.kPaintInvertedColorFilter
  //         : new ManagedSkiaColorFilter(new ComposeColorFilter(At.kPaintInvertedColorFilter, this.effectiveColorFilter))
  //     } else {
  //       this.effectiveColor = this.originalColor
  //       this.originalColor = null
  //     }

  //     this.skia.setColorFilter(this.effectiveColor?.skia ?? null)
  //     this._invertColors = invert
  //   }
  // }

  // => color filter
  // public get color () {
  //   return this.effectiveColor?.filter ?? null
  // }
  // public set color (filter: ColorFilter | null) {
  //   if (!this.color?.equal(filter as ColorFilter)) {
  //     this.originalColor = null
  //     this.effectiveColor = filter === null
  //       ? null 
  //       : ManagedSkiaColorFilter.create(filter)

  //     invariant(At.kPaintInvertedColorFilter)

  //     if (this.invertColors) {
  //       this.originalColor = this.effectiveColor
  //       this.effectiveColor = this.effectiveColor === null 
  //         ? At.kPaintInvertedColorFilter
  //         : new ManagedSkiaColorFilter(new AtComposeColorFilter(At.kPaintInvertedColorFilter, this.effectiveColorFilter))
  //     } 
      
  //     this.skia.setColorFilter(this.effectiveColor?.skia ?? null)
  //   }
  // }

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
  protected _image: ImageFilter | null = null
  public get image () {
    return this._image
  }
  public set image (filter: ImageFilter | null) {
    if (this.image !== filter) {
      this._image = filter
      this.skia.setImageFilter(this.image?.skia ?? null)
    }
  }

  // => shader 
  protected _shader: Shader | null = null
  public get shader () {
    return this._shader
  }
  public set shader (shader: Shader | null) {
    if (this.shader !== shader) {
      this.skia.setShader(this.shader?.withQuality(this.quality) ?? null)
    }
  }

  // => filter quality
  protected _quality: Skia.FilterQuality = Engine.skia.FilterQuality.None
  public get quality () {
    return this._quality
  }
  public set quality (quality: Skia.FilterQuality) {
    if (this.quality !== quality) {
      this._quality = quality
      if (this.shader !== null) {
        this.skia.setShader(this.shader.withQuality(this.quality))
      }
    }
  }

  public original: ManagedSkiaColorFilter | null = null
  public effective: ManagedSkiaColorFilter | null = null

  constructor (...rests: unknown[])
  constructor (ref: Skia.Paint)
  constructor (box: Skia.Paint | Skia.SkiaRefBox<PaintRefBox, Skia.Paint>) {
    super(box)

    
  }
}


//// => Paint
// 画笔
export class Paint extends PaintRefBox {
  static create () {
    return super.create(new Engine.skia.Paint()) as Paint
  }

  static resurrect (): Skia.Paint {
    const paint = new Engine.skia.Paint()
    return paint
  }

  // => stroke
  // 线
  protected _stroke: Stroke | null = null
  public get stroke () {
    if (this._stroke === null) {
      invariant(this.box)
      this._stroke = Stroke.create(this.box)
    }
    return this._stroke
  }

  // => filter
  // 滤镜对象
  protected _filter: Filter | null = null
  public get filter () {
    if (this._filter === null) {
      this._filter = Filter.create(this.box)
    }
    return this._filter
  }

  // => blendMode
  protected _blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver
  public get blendMode () {
    return this._blendMode
  }
  public set blendMode (blendMode: Skia.BlendMode) {
    if (this.blendMode !== blendMode) {
      this._blendMode = blendMode
      this.skia.setBlendMode(blendMode)
    }
  }

  // => style
  // 画笔样式
  protected _style: Skia.PaintStyle = Engine.skia.PaintStyle.Fill
  public get style () {
    return this._style
  }
  public set style (style: Skia.PaintStyle) {
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
  protected _color: Color = Color.BLACK
  public get color () {
    return this._color
  }
  public set color (color: Color) {
    if (this.color.notEqual(color)) {
      this._color = color
      this.skia.setColorInt(color.value)
    }
  }

  // => effect
  protected _effect: PathDashEffect | null = null
  public get effect () {
    return this._effect
  }
  public set effect (effect: PathDashEffect | null) {
    if (this._effect !== effect) {
      this._effect = effect
      this.skia.setPathEffect(effect?.skia ?? null)
    }
  }
  

  /**
   * @param {Paint} skia
   * @return {AtPaint}
   */  
  constructor () {
    super(new Engine.skia.Paint())

    this.skia.setAntiAlias(this.isAntiAlias)
    this.skia.setColorInt(this.color.value)
  }

  /**
   * @return {Skia.Paint}
   */  
  resurrect (): Skia.Paint {
    return Paint.resurrect()
  }
}