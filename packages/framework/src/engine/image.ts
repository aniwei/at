
import { At } from '../at'
import { AtSkiaObjectBox, ImageByteFormat } from './skia'
import type { Image } from './skia'

// TODO VideoFrame
export class AtImage {
  static create (image: Image) {
    return new AtImage(image)
  }

  /**
   * 克隆 
   * @param {SkiaObjectBox<Image, IImage>} box
   * @param {*} IImage
   * @return {Image}
   */  
  static cloneOf (box: AtSkiaObjectBox<AtImage, Image>): AtImage {
    const image = new AtImage(box)
    box.ref(image)
    return image
  }

  public get skia () {
    return this.box.skia
  }

  public get width (): number {
    return this.skia!.width()
  }

  public get height (): number {
    return this.skia!.height()
  }

  
  public get image () {
    return this.box.skia
  }
  
  public box: AtSkiaObjectBox<AtImage, Image>
  public disposed: boolean = false

  /**
   * 构造函数
   * @param {SkiaObjectBox<Image, IImage>} image
   * @return {Atmage}
   */  
  constructor (image: Image)
  constructor (image: AtSkiaObjectBox<AtImage, Image>)

  constructor (image: Image | AtSkiaObjectBox<AtImage, Image>) {
    if (image instanceof AtSkiaObjectBox) {
      this.box = image as AtSkiaObjectBox<AtImage, Image>
    } else {
      this.box = new AtSkiaObjectBox(image)
      this.box.ref(this)
    }
  }
  
  /**
   * @description: 
   * @param {ImageByteFormat} format
   * @return {*}
   */  
  async toByteData (format: ImageByteFormat = At.ImageByteFormat.RawRGBA) {
    return this.readPixelsFromSkiaImage(format)
  }

  /**
   * @description: 
   * @param {ImageByteFormat} format
   * @return {ArrayBuffer | Buffer}
   */
  readPixelsFromSkiaImage (format: ImageByteFormat) {
    const alphaType = At.ImageByteFormat.RawStraightRGBA 
      ? At.AlphaType.Unpremul 
      : At.AlphaType.Premul

    let bytes: Uint8Array
    if (format === ImageByteFormat.RawRGBA || format === ImageByteFormat.RawStraightRGBA) {
      bytes = this.skia?.readPixels(0, 0, {
        width: this.width,
        height: this.height,
        alphaType,
        colorType: At.ColorType.RGBA_8888,
        colorSpace: At.ColorSpace.SRGB
      }) as Uint8Array
    } else {
      bytes = this.skia?.encodeToBytes() as Uint8Array
    }

    return bytes.buffer
  }

  /**
   * @description: 
   * @return {void}
   */  
  dispose () {
    this.disposed = true
    this.box.unref(this)
  }

  /**
   * @description: 
   * @return {Image}
   */  
  clone (): AtImage  {
    return AtImage.cloneOf(this.box)
  }

  /**
   * @description: 
   * @param {AtImage} other
   * @return {boolean}
   */  
  isCloneOf (other: AtImage) {
    return (
      other instanceof AtImage && 
      other.skia!.isAliasOf(this.skia)
    )
  }

  /**
   * @description: 
   * @return {string}
   */  
  toString (): string {
    return `AtImage(${this.width}, ${this.height})`
  }
}