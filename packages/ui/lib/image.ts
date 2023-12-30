import { invariant } from '@at/utils'

import { ImageRepeat, Painting, Alignment, BoxFit, AlignmentGeometry } from '@at/painting'
import { Offset, Rect, Size } from '@at/geometry'
import { Color } from '@at/basic'
import { Engine, Canvas, ColorFilter, Skia } from '@at/engine'
import { PipelineOwner } from './pipeline-owner'
import { PaintingContext } from './painting-context'
import { Box } from './box'
import { BoxConstraints } from './constraints'
import * as AtEngine from '@at/engine'

//// => Image
export interface ImageOptions {
  image?: AtEngine.Image | null,
  width?: number | null,
  height?: number | null,
  left?: number | null,
  top?: number | null,
  right?: number | null,
  bottom?: number | null,
  scale?: number,
  color?: Color | null ,
  opacity?: number | null,
  colorBlendMode?: Skia.BlendMode | null ,
  fit?: BoxFit | null,
  alignment?: Alignment,
  repeat?: ImageRepeat,
  centerSlice?: Rect | null,
  matchTextDirection?: boolean,
  textDirection?: Skia.TextDirection | null,
  invertColors?: boolean,
  isAntiAlias?: boolean,
  quality?: Skia.FilterQualityKind,
}

export class Image extends Box {
  static create (options: ImageOptions) {
    return super.create(
      options.image,
      options.left,
      options.top,
      options.right,
      options.bottom,
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
      options.quality
    ) as Image
  }

  public get bounds () {
    return Offset.ZERO.and(this.size as Size)
  }

  // => opacity
  // private _opacity: AtAnimation<number> | null = null
  // public get opacity () {
  //   return this._opacity
  // }
  // public set opacity (opacity: AtAnimation<number> | null) {
  //   if (opacity !== this.opacity) {   
  //     if (this.attached) {
  //       this.opacity?.subscribe(() => this.markNeedsPaint())
  //       this._opacity = opacity
  //     } 
  
  //     if (this.attached) {
  //       opacity?.unsubscribe()
  //     }
  //   }
  // }
  

  // => image
  protected _image: AtEngine.Image | null = null
  public get image () {
    return this._image
  }
  public set image (image: AtEngine.Image | null) {
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
  private _quality: Skia.FilterQualityKind | null = null
  public get quality () {
    return this._quality
  }
  public set quality (quality: Skia.FilterQualityKind | null) {
    if (this._quality !== quality) {
      this._quality = quality
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
  private _blendMode: Skia.BlendMode | null = null
  public get blendMode () {
    return this._blendMode
  }
  public set blendMode (blendMode: Skia.BlendMode | null) {
    if (this._blendMode !== blendMode) {
      this._blendMode = blendMode
      this.updateColorFilter()
      this.markNeedsPaint()
    }
  }

  // => textDirection
  private _textDirection: Skia.TextDirection | null = null
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (textDirection: Skia.TextDirection | null) {
    if (this._textDirection !== textDirection) {
      this._textDirection = textDirection
      this.markNeedResolution()
    }
  }
  
  // => alignment
  private _alignment: AlignmentGeometry
  public get alignment () {
    return this._alignment
  }
  public set alignment (alignment: AlignmentGeometry) {
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

  public resolvedAlignment: Alignment | null = null
  public flipHorizontally: boolean | null = null
  public filter: ColorFilter | null = null

  constructor (
    image: AtEngine.Image | null = null,
    left: number | null = null,
    top: number | null = null,
    right: number | null = null,
    bottom: number | null = null,
    width: number | null = null,
    height: number | null = null,
    scale: number = 1.0,
    color: Color | null = null,
    opacity: number | null = null,
    blendMode: Skia.BlendMode | null = null,
    fit: BoxFit | null = null,
    alignment: Alignment = Alignment.CENTER,
    repeat: ImageRepeat = ImageRepeat.NoRepeat,
    centerSlice: Rect | null = null,
    matchTextDirection: boolean = false,
    textDirection: Skia.TextDirection | null = null,
    invertColors: boolean = false,
    isAntiAlias: boolean = false,
    quality: Skia.FilterQualityKind = Engine.skia.FilterQualityKind.Low,
  ) {
    super(
      null,
      left,
      top,
      right,
      bottom,
      width,
      height,
      scale
    )
    this.image = image
    this.color = color
    // this.opacity = opacity
    this.blendMode = blendMode
    this.fit = fit
    this.repeat = repeat
    this.centerSlice = centerSlice
    this.matchTextDirection = matchTextDirection
    this.invertColors = invertColors
    this.textDirection = textDirection
    this.isAntiAlias = isAntiAlias
    this.quality = quality
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
        this.textDirection === Engine.skia.TextDirection.RTL
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
  
  sizeForConstraints (constraints: BoxConstraints): Size {
    constraints = BoxConstraints.tightFor(
      this.width,
      this.height,
    ).enforce(constraints)

    if (this.image == null) {
      return constraints.smallest
    }

    return constraints.constrainSizeAndAttemptToPreserveAspectRatio(new Size(
      this.image.width / this.scale,
      this.image.height / this.scale,
    ))
  }

  
  computeMinIntrinsicWidth (height: number) {
    invariant(height >= 0.0)
    if (this.width === null && this.height === null) {
      return 0.0
    }
    return this.sizeForConstraints(BoxConstraints.tightForFinite(height)).width
  }

  
  computeMaxIntrinsicWidth (height: number) {
    invariant(height >= 0.0)
    return this.sizeForConstraints(
      BoxConstraints.tightForFinite(height)
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
      BoxConstraints.tightForFinite(width)
    ).height
  }

  
  computeMaxIntrinsicHeight (width: number) {
    invariant(width >= 0.0)
    return this.sizeForConstraints(
      BoxConstraints.tightForFinite(width)
    ).height;
  }

  hitTestSelf (position: Offset) {
    return true
  }

  computeDryLayout (constraints: BoxConstraints): Size {
    return this.sizeForConstraints(constraints)
  }

  performLayout () {
    this.size = this.sizeForConstraints(this.constraints as BoxConstraints)
  }

  attach (owner: PipelineOwner) {
    super.attach(owner)
    // this.opacity?.subscribe(() => this.markNeedsPaint())
  }

  detach () {
    // this.opacity?.unsubscribe()
    super.detach()
  }
  
  paint (context: PaintingContext, offset: Offset) {
    if (this.image !== null) {
      this.resolve()
      invariant(this.resolvedAlignment !== null, `The "this.resolvedAlignment" cannot be null.`)
      invariant(this.flipHorizontally !== null, `The "this.flipHorizontally" cannot be null.`)
  
      Painting.paintWithImage(
        context.canvas as Canvas,
        offset.and(this.size as Size),
        this.image,
        this.scale as number,
        // this.opacity?.value ?? 1.0,
        1.0,
        this.filter,
        this.fit,
        this.resolvedAlignment!,
        this.centerSlice,
        this.repeat!,
        this.flipHorizontally!,
        this.invertColors,
        this.quality!,
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
