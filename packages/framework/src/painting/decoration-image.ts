import { invariant } from '@at/utils'
import { Rect } from '../basic/geometry'
import { BoxFit } from './box-fit'
import { AtAlignment, AtAlignmentGeometry } from './alignment'
import { 
  AtImageConfiguration, 
  AtImageStream, 
  AtImageProvider, 
  AtImageInfo, 
  AtNetworkImage, 
  ImageErrorListener, 
  AtResizeImage 
} from './image-provider'

import { AtPainting } from './painting'
import { At } from '../at'

import type { FilterQuality } from '../engine/skia'
import type { AtPath } from '../engine/path'
import type { AtCanvas } from '../engine/canvas'
import type { AtColorFilter } from '../engine/color-filter'
import type { VoidCallback } from '../at'



export enum ImageRepeat {
  Repeat,
  RepeatX,
  RepeatY,
  NoRepeat,
}

export type AtDecorationImageOptions = {
  image: AtImageProvider,
  onError?: ImageErrorListener | null,
  colorFilter?: AtColorFilter | null,
  fit?: BoxFit | null,
  alignment?: AtAlignmentGeometry,
  centerSlice?: Rect | null,
  repeat?: ImageRepeat,
  matchTextDirection?: boolean,
  scale?: number,
  opacity?: number,
  filterQuality?: FilterQuality,
  invertColors?: boolean,
  isAntiAlias?: boolean,
}

export class AtDecorationImage {
  static create (options: AtDecorationImageOptions) {
    return new AtDecorationImage(
      options.image,
      options.onError,
      options.colorFilter,
      options.fit,
      options.alignment,
      options.centerSlice,
      options.repeat,
      options.matchTextDirection,
      options.scale,
      options.opacity,
      options.filterQuality,
      options.invertColors,
      options.isAntiAlias ,
    )
  }

  public image: AtImageProvider
  public onError: ImageErrorListener | null
  public colorFilter: AtColorFilter | null
  public fit: BoxFit | null
  public alignment: AtAlignmentGeometry
  public centerSlice: Rect | null
  public repeat: ImageRepeat
  public matchTextDirection: boolean
  public scale: number
  public opacity: number
  public filterQuality: FilterQuality
  public invertColors: boolean
  public isAntiAlias: boolean
  
  constructor(
    image: AtImageProvider,
    onError: ImageErrorListener | null = null,
    colorFilter: AtColorFilter | null = null,
    fit: BoxFit | null = null,
    alignment: AtAlignmentGeometry = AtAlignment.center,
    centerSlice: Rect | null = null,
    repeat = ImageRepeat.NoRepeat,
    matchTextDirection: boolean = false,
    scale: number = 1,
    opacity: number = 1,
    filterQuality: FilterQuality = At.FilterQuality.Low,
    invertColors: boolean = false,
    isAntiAlias: boolean = false,
  ) {
    invariant(alignment !== null, `The argument alignment cannot be null.`)
    invariant(repeat !== null, `The argument repeat cannot be null.`)
    invariant(matchTextDirection !== null, `The matchTextDirection alignment cannot be null.`)
    invariant(scale !== null, `The argument scale cannot be null.`)

    this.image = image
    this.onError = onError
    this.colorFilter = colorFilter
    this.fit = fit
    this.alignment = alignment
    this.centerSlice = centerSlice
    this.repeat = repeat
    this.matchTextDirection = matchTextDirection
    this.scale = scale
    this.opacity = opacity
    this.filterQuality = filterQuality
    this.invertColors = invertColors
    this.isAntiAlias = isAntiAlias
  }
  
  /**
   * @description: 创建画笔
   * @param {VoidCallback} onChanged
   * @return {*}
   */  
  createPainter (onChange: VoidCallback | null): AtDecorationImagePainter  {
    invariant(onChange !== null, `The argument onChange cannot be null.`)
    return new AtDecorationImagePainter(this, onChange)
  }

  /**
   * @description: 
   * @param {AtDecorationImage} other
   * @return {*}
   */  
  equal (other: AtDecorationImage | null) {
    return (
      other instanceof AtDecorationImage &&
      other.image === this.image &&
      other.colorFilter === this.colorFilter &&
      other.fit === this.fit &&
      other.alignment === this.alignment &&
      other.centerSlice === this.centerSlice &&
      other.repeat === this.repeat &&
      other.matchTextDirection === this.matchTextDirection &&
      other.scale === this.scale &&
      other.opacity === this.opacity &&
      other.filterQuality === this.filterQuality &&
      other.invertColors === this.invertColors &&
      other.isAntiAlias === this.isAntiAlias
    )
  }

  notEqual (other: AtDecorationImage | null) {
    return !this.equal(other)
  }
}

export class AtDecorationImagePainter {
  public details: AtDecorationImage
  public onChanged: VoidCallback

  public stream: AtImageStream | null = null
  public image: AtImageInfo | null = null

  constructor (details: AtDecorationImage, onChanged: VoidCallback) {
    invariant(details !== null, `The argument "details" cannot be null.`)

    this.details = details
    this.onChanged = onChanged
  }
  
  /**
   * 
   * @param canvas 
   * @param rect 
   * @param clipPath 
   * @param configuration 
   * @returns 
   */
  paint (
    canvas: AtCanvas, 
    rect: Rect, 
    clipPath: AtPath | null, 
    configuration: AtImageConfiguration
  ) {
    invariant(canvas !== null, `The argument canvas cannot be null.`)
    invariant(rect !== null, `The argument rect cannot be null.`)
    invariant(configuration !== null, `The argument configuration cannot be null.`)

    let flipHorizontally = false
    if (this.details.matchTextDirection) {
      if (configuration.textDirection === At.TextDirection.RTL) {
        flipHorizontally = true
      }
    }

    const stream = this.details.image.resolve(configuration)

    if (stream.key !== this.stream?.key) {
      this.stream?.off('image')
      this.stream?.off('error')

      this.stream = stream
      this.stream.on('image', this.handleImage)
      this.stream.on('error', this.details?.onError ?? function () {})
    }

    if (this.image === null) {
      return
    }

    if (clipPath !== null) {
      canvas.save()
      canvas.clipPath(clipPath)
    }

    AtPainting.paintImage(
      canvas,
      rect,
      this.image!.image,
      this.details.scale * this.image!.scale,
      this.details.opacity,
      this.details.colorFilter,
      this.details.fit,
      this.details.alignment.resolve(configuration.textDirection),
      this.details.centerSlice,
      this.details.repeat,
      flipHorizontally,
      this.details.invertColors,
      this.details.filterQuality,
      this.details.isAntiAlias,
    )

    if (clipPath !== null) {
      canvas.restore()
    }
  }

  handleImage = (
    value: AtImageInfo, 
    synchronousCall: boolean
  ) => {
    if (this.image?.equal(value)) {
      return
    }

    if (this.image !== null && this.image!.isCloneOf(value)) {
      value.dispose()
      return
    }

    this.image?.dispose()
    this.image = value
    invariant(this.onChanged !== null, `The "this.onChanged" cannot be null.`)
    if (!synchronousCall) {
      this.onChanged()
    }
  }

  dispose () {
    this.stream?.off('image')
    this.stream?.off('error')

    this.image?.dispose()
    this.image = null
  }

  toString () {
    return `AtDecorationImage(...)`
  }
}
