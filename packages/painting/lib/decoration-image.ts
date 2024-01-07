import { Rect } from '@at/geometry'
import { Equalable } from '@at/basic'
import { Engine, Canvas, Path, Skia, ColorFilter } from '@at/engine'
import { Alignment, AlignmentGeometry } from './alignment'
import { ImageConfiguration, ImageProvider } from './image-provider'
import { ImageErrorHandle, ImageInfo, ImageStream } from './image-stream'
import { Painting } from './painting'
import { BoxFit } from './box-fit'


//// => DecorationImage
// 图片绘制方式
export enum ImageRepeat {
  Repeat,
  RepeatX,
  RepeatY,
  NoRepeat,
}

export type DecorationImageOptions = {
  image: ImageProvider,
  onError?: ImageErrorHandle | null,
  colorFilter?: ColorFilter | null,
  fit?: BoxFit | null,
  alignment?: AlignmentGeometry,
  center?: Rect | null,
  repeat?: ImageRepeat,
  matchTextDirection?: boolean,
  scale?: number,
  opacity?: number,
  filterQuality?: Skia.FilterQuality,
  invertColors?: boolean,
  isAntiAlias?: boolean,
}

export class DecorationImage extends Equalable<DecorationImage> {
  static create (options: DecorationImageOptions) {
    return new DecorationImage(
      options.image,
      options.onError,
      options.colorFilter,
      options.fit,
      options.alignment,
      options.center,
      options.repeat,
      options.matchTextDirection,
      options.scale,
      options.opacity,
      options.filterQuality,
      options.invertColors,
      options.isAntiAlias ,
    )
  }

  public image: ImageProvider
  public onError: ImageErrorHandle | null
  public filter: ColorFilter | null
  public fit: BoxFit | null
  public alignment: AlignmentGeometry
  public center: Rect | null
  public repeat: ImageRepeat
  public matchTextDirection: boolean
  public scale: number
  public opacity: number
  public quality: Skia.FilterQuality
  public invertColors: boolean
  public isAntiAlias: boolean
  
  constructor(
    image: ImageProvider,
    onError: ImageErrorHandle | null = null,
    filter: ColorFilter | null = null,
    fit: BoxFit | null = null,
    alignment: AlignmentGeometry = Alignment.CENTER,
    center: Rect | null = null,
    repeat = ImageRepeat.NoRepeat,
    matchTextDirection: boolean = false,
    scale: number = 1,
    opacity: number = 1,
    quality: Skia.FilterQuality = Engine.skia.FilterQuality.Low,
    invertColors: boolean = false,
    isAntiAlias: boolean = false,
  ) {
    super()
    this.image = image
    this.onError = onError
    this.filter = filter
    this.fit = fit
    this.alignment = alignment
    this.center = center
    this.repeat = repeat
    this.matchTextDirection = matchTextDirection
    this.scale = scale
    this.opacity = opacity
    this.quality = quality
    this.invertColors = invertColors
    this.isAntiAlias = isAntiAlias
  }
  
  /**
   * 创建画笔
   * @param {VoidCallback} onChanged
   * @return {*}
   */  
  createPainter (onChange: VoidFunction): DecorationImagePainter  {
    return new DecorationImagePainter(this, onChange)
  }

  /**
   * @param {DecorationImage} other
   * @return {*}
   */  
  equal (other: DecorationImage | null) {
    return (
      other instanceof DecorationImage &&
      other.image === this.image &&
      other.filter === this.filter &&
      other.fit === this.fit &&
      other.alignment === this.alignment &&
      other.center === this.center &&
      other.repeat === this.repeat &&
      other.matchTextDirection === this.matchTextDirection &&
      other.scale === this.scale &&
      other.opacity === this.opacity &&
      other.quality === this.quality &&
      other.invertColors === this.invertColors &&
      other.isAntiAlias === this.isAntiAlias
    )
  }

  notEqual (other: DecorationImage | null) {
    return !this.equal(other)
  }

  toString () {
    return `DecorationImage(
      [image]: ${this.image},
      [onError]: ${this.onError},
      [filter]: ${this.filter},
      [fit]: ${this.fit},
      [alignment]: ${this.alignment},
      [center]: ${this.center},
      [repeat]: ${this.repeat},
      [matchTextDirection]: ${this.matchTextDirection},
      [scale]: ${this.scale},
      [opacity]: ${this.opacity},
      [quality]: ${this.quality},
      [invertColors]: ${this.invertColors},
      [isAntiAlias]: ${this.isAntiAlias},
    )`
  }
}

export class DecorationImagePainter {
  
  public onChanged: VoidFunction
  public details: DecorationImage

  public image: ImageInfo | null = null
  public stream: ImageStream | null = null

  constructor (details: DecorationImage, onChanged: VoidFunction) {
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
    canvas: Canvas, 
    rect: Rect, 
    clipPath: Path | null, 
    configuration: ImageConfiguration
  ) {
    let flipHorizontally = false
    if (this.details.matchTextDirection) {
      if (configuration.textDirection === Engine.skia.TextDirection.RTL) {
        flipHorizontally = true
      }
    }

    const stream = this.details.image.resolve(configuration)

    if (stream.key !== this.stream?.key) {
      this.stream?.removeAllListeners('end')
      this.stream?.removeAllListeners('error')

      this.stream = stream
      this.stream.on('end', this.handleImage)
      this.stream.on('error', this.details?.onError ?? function () {})
    }

    if (this.image === null) {
      return
    }

    if (clipPath !== null) {
      canvas.save()
      canvas.clipPath(clipPath)
    }

    Painting.paintWithImage(
      canvas,
      rect,
      this.image.image,
      this.details.scale * this.image.scale,
      this.details.opacity,
      this.details.filter,
      this.details.fit,
      this.details.alignment.resolve(configuration.textDirection),
      this.details.center,
      this.details.repeat,
      flipHorizontally,
      this.details.invertColors,
      this.details.quality,
      this.details.isAntiAlias,
    )

    if (clipPath !== null) {
      canvas.restore()
    }
  }

  handleImage = (
    image: ImageInfo, 
    synchronousCall: boolean
  ) => {
    if (this.image?.equal(image)) {
      return
    }

    if (this.image !== null && this.image.isCloneOf(image)) {
      image.dispose()
    } else {
      this.image?.dispose()
      this.image = image
      if (!synchronousCall) {
        this.onChanged()
      }
    }
  }

  dispose () {
    this.stream?.removeAllListeners('end')
    this.stream?.removeAllListeners('error')

    this.image?.dispose()
    this.image = null
  }

  toString () {
    return `DecorationImage(
      [onChanged]: ${this.onChanged}
      [details]: ${this.details}
      [image]: ${this.image}
      [stream]: ${this.stream}
    )`
  }
}
