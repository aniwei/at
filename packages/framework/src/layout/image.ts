import { invariant } from 'ts-invariant'

import { ImageRepeat } from '../painting/decoration-image'
import { Offset, Rect, Size } from '../basic/geometry'
import { Color } from '../basic/color'
import { AtCanvas } from '../engine/canvas'
import { AtColorFilter } from '../engine/color-filter'
import { AtPainting } from '../painting/painting'
import { AtPipelineOwner } from './pipeline-owner'
import { AtPaintingContext } from './painting-context'
import { AtLayoutBox } from './box'
import { AtBoxConstraints } from './box-constraints'
import { FilterQuality, BlendMode, TextDirection } from '../engine/skia'
import { AtAlignment, AtAlignmentGeometry } from '../painting/alignment'
import { At } from '../at'
import type { AtAnimation } from '../animation/animation'
import type { AtImage } from '../engine/image'
import type { BoxFit } from '../painting/box-fit'

export type AtLayoutImageOptions = {
  image?: AtImage | null,
  width?: number | null,
  height?: number | null,
  scale?: number,
  color?: Color | null ,
  opacity?: AtAnimation<number> | null,
  colorBlendMode?: BlendMode | null ,
  fit?: BoxFit | null,
  alignment?: AtAlignment,
  repeat?: ImageRepeat,
  centerSlice?: Rect | null,
  matchTextDirection?: boolean,
  textDirection?: TextDirection | null,
  invertColors?: boolean,
  isAntiAlias?: boolean,
  filterQuality?: FilterQuality,
}

export class AtLayoutImage extends AtLayoutBox {
  static create (options: AtLayoutImageOptions) {
    return new AtLayoutImage(
      options.image,
      options.width,
      options.height,
      options.scale,
      options.color,
      options.opacity,
      options.colorBlendMode,
      options.fit,
      options.alignment,
      options.repeat,
      options.centerSlice,
      options.matchTextDirection,
      options.textDirection,
      options.invertColors,
      options.isAntiAlias,
      options.filterQuality
    )
  }

  public get bounds () {
    return Offset.zero.and(this.size as Size)
  }

  // => opacity
  private _opacity: AtAnimation<number> | null = null
  public get opacity () {
    return this._opacity
  }
  public set opacity (opacity: AtAnimation<number> | null) {
    if (opacity !== this.opacity) {   
      if (this.attached) {
        this.opacity?.subscribe(() => this.markNeedsPaint())
        this._opacity = opacity
      } 
  
      if (this.attached) {
        opacity?.unsubscribe()
      }
    }
  }
  

  // => image
  private _image: AtImage | null = null
  public get image () {
    return this._image
  }
  public set image (image: AtImage | null) {
    if (image !== this._image) {
      if (this.image !== null && image !== null && image.isCloneOf(this.image) ) {
        this.image.dispose()
      } else {
        this._image?.dispose()
        this._image = image
        this.markNeedsPaint()

        if (this.width === null || this.height === null) {
          this.markNeedsLayout()
        }
      }
    }
  }


  // => filterQuality
  private _filterQuality: FilterQuality | null = null
  public get filterQuality () {
    return this._filterQuality
  }
  public set filterQuality (filterQuality: FilterQuality | null) {
    if (this._filterQuality !== filterQuality) {
      this._filterQuality = filterQuality
      this.markNeedsPaint()
    }
  }
  
  // => fit
  private _fit: BoxFit | null = null
  public get fit () {
    return this._fit
  }
  public set fit (fit: BoxFit | null) {
    if (this._fit !== fit) {
      this._fit = fit
      this.markNeedsPaint()
    }
  }
  
  // => isAntiAlias
  private _isAntiAlias: boolean | null = null
  public get isAntiAlias () {
    return this._isAntiAlias
  }
  public set isAntiAlias (isAntiAlias: boolean | null) {
    if (this._isAntiAlias !== isAntiAlias) {
      this._isAntiAlias = isAntiAlias
      this.markNeedsPaint()
    }
  }

  // => repeat
  private _repeat: ImageRepeat | null = null
  public get repeat () {
    return this._repeat
  }
  public set repeat (repeat: ImageRepeat | null) {
    if (this._repeat !== repeat) {
      this._repeat = repeat
      this.markNeedsPaint()
    }
  }
  
  // => centerSlice
  private _centerSlice: Rect | null = null
  public get centerSlice () {
    return this._centerSlice
  }
  public set centerSlice (centerSlice: Rect | null) {
    if (this._centerSlice !== centerSlice) {
      this._centerSlice = centerSlice
      this.markNeedsPaint()
    }
  }

  // => invertColors
  private _invertColors: boolean = false
  public get invertColors () {
    return this._invertColors
  }
  public set invertColors (invertColors: boolean) {
    if (this._invertColors !== invertColors) {
      this._invertColors = invertColors
      this.markNeedsPaint()
    }
  }

  // => color
  private _color: Color | null = null
  public get color () {
    return this._color
  }
  public set color (color: Color | null) {
    if (color === null) {
      this._color = null
    } else if (!color.equal(this._color!)) {
      this._color = color
      this.updateColorFilter()
      this.markNeedsPaint()
    }
  }

  // => blendMode
  private _blendMode: BlendMode | null = null
  public get blendMode () {
    return this._blendMode
  }
  public set blendMode (blendMode: BlendMode | null) {
    if (this._blendMode !== blendMode) {
      this._blendMode = blendMode
      this.updateColorFilter()
      this.markNeedsPaint()
    }
  }

  // => textDirection
  private _textDirection: TextDirection | null = null
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (textDirection: TextDirection | null) {
    if (this._textDirection !== textDirection) {
      this._textDirection = textDirection
      this.markNeedResolution()
    }
  }
  
  // => alignment
  private _alignment: AtAlignmentGeometry
  public get alignment () {
    return this._alignment
  }
  public set alignment (alignment: AtAlignmentGeometry) {
    if (this._alignment !== alignment) {
      this._alignment = alignment
      this.markNeedResolution()
    }
  }

  // => matchTextDirection
  private _matchTextDirection: boolean | null = null
  public get matchTextDirection () {
    return this._matchTextDirection
  }
  public set matchTextDirection (matchTextDirection: boolean | null) {
    if (this._matchTextDirection !== matchTextDirection) {
      this._matchTextDirection = matchTextDirection
      this.markNeedResolution()
    }
  }

  // public left: number | null = null
  // public top: number | null = null
  // public right: number | null = null
  // public bottom: number | null = null
  // public size: Size | null = null
  public resolvedAlignment: AtAlignment | null = null
  public flipHorizontally: boolean | null = null
  public filter: AtColorFilter | null = null

  constructor (
    image: AtImage | null = null,
    width: number | null = null,
    height: number | null = null,
    scale: number = 1,
    color: Color | null = null,
    opacity: AtAnimation<number> | null = null,
    blendMode: BlendMode | null = null,
    fit: BoxFit | null = null,
    alignment: AtAlignment = AtAlignment.center,
    repeat: ImageRepeat = ImageRepeat.NoRepeat,
    centerSlice: Rect | null = null,
    matchTextDirection: boolean = false,
    textDirection: TextDirection | null = null,
    invertColors: boolean = false,
    isAntiAlias: boolean = false,
    filterQuality: FilterQuality = At.FilterQuality.Low,
  ) {
    super()
    this.image = image
    this.width = width
    this.height = height
    this.scale = scale
    this.color = color
    this.opacity = opacity
    this.blendMode = blendMode
    this.fit = fit
    this.repeat = repeat
    this.centerSlice = centerSlice
    this.matchTextDirection = matchTextDirection
    this.invertColors = invertColors
    this.textDirection = textDirection
    this.isAntiAlias = isAntiAlias
    this.filterQuality = filterQuality
    this._alignment = alignment

    this.updateColorFilter()
  }

  performResize(): void {
    throw new Error('Method not implemented.')
  }
  
  resolve () {
    if (this.resolvedAlignment === null) {
      this.resolvedAlignment = this.alignment.resolve(this.textDirection)
      this.flipHorizontally = (
        this.matchTextDirection && 
        this.textDirection === At.TextDirection.RTL
      )
    }
  }

  markNeedResolution () {
    this.resolvedAlignment = null
    this.flipHorizontally = null
    this.markNeedsPaint()
  }

  updateColorFilter () {
    if (this.color === null) {
      this.filter = null
    } else {
      // this.filter = ColorFilter.mode(
      //   this.color!, 
      //   this.blendMode ?? At.BlendMode.SrcIn
      // )
    }
  }
  
  sizeForConstraints (constraints: AtBoxConstraints): Size {
    constraints = AtBoxConstraints.tightFor(
      this.width,
      this.height,
    ).enforce(constraints)

    if (this.image == null) {
      return constraints.smallest
    }

    return constraints.constrainSizeAndAttemptToPreserveAspectRatio(new Size(
      this.image!.width / this.scale!,
      this.image!.height / this.scale!,
    ))
  }

  
  computeMinIntrinsicWidth (height: number) {
    invariant(height >= 0.0)
    if (this.width === null && this.height === null) {
      return 0.0
    }
    return this.sizeForConstraints(AtBoxConstraints.tightForFinite(height)).width
  }

  
  computeMaxIntrinsicWidth (height: number) {
    invariant(height >= 0.0)
    return this.sizeForConstraints(
      AtBoxConstraints.tightForFinite(height)
    ).width
  }

  computeMinIntrinsicHeight (width: number) {
    invariant(width >= 0.0)
    if (
      this.width === null && 
      this.height === null
    ) {
      return 0.0
    }
    return this.sizeForConstraints(
      AtBoxConstraints.tightForFinite(width)
    ).height
  }

  
  computeMaxIntrinsicHeight (width: number) {
    invariant(width >= 0.0)
    return this.sizeForConstraints(
      AtBoxConstraints.tightForFinite(width)
    ).height;
  }

  hitTestSelf (position: Offset) {
    return true
  }

  computeDryLayout (constraints: AtBoxConstraints): Size {
    return this.sizeForConstraints(constraints)
  }

  performLayout () {
    this.size = this.sizeForConstraints(this.constraints as AtBoxConstraints)
  }

  attach (owner: AtPipelineOwner) {
    super.attach(owner)
    this.opacity?.subscribe(() => this.markNeedsPaint())
  }

  detach () {
    this.opacity?.unsubscribe()
    super.detach()
  }
  
  paint (context: AtPaintingContext, offset: Offset) {
    if (this.image !== null) {
      this.resolve()
      invariant(this.resolvedAlignment !== null, `The "this.resolvedAlignment" cannot be null.`)
      invariant(this.flipHorizontally !== null, `The "this.flipHorizontally" cannot be null.`)
  
      AtPainting.paintImage(
        context.canvas as AtCanvas,
        offset.and(this.size as Size),
        this.image,
        this.scale as number,
        this.opacity?.value ?? 1.0,
        this.filter,
        this.fit,
        this.resolvedAlignment!,
        this.centerSlice,
        this.repeat!,
        this.flipHorizontally!,
        this.invertColors,
        this.filterQuality!,
        this.isAntiAlias!,
      )
    }

  }

  dispose () {
    this.image?.dispose()
    this.image = null
    super.dispose()
  }
}
