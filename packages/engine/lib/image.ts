import { Engine } from './engine'
import * as Skia from './skia'

export interface ImageRefBoxFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class ImageRefBox {
  static create<T> (...rests: unknown[]): T
  static create<T> (box: Skia.Image | Skia.SkiaRefBox<ImageRefBox, Skia.Image>): T {
    const ImageRefBoxFactory = this as unknown as ImageRefBoxFactory<T>
    return new ImageRefBoxFactory(box)
  }

  /**
   * 克隆 
   * @param {Skia.SkiaRefBox<ImageRefBox, Skia.Image>} box
   * @return {ImageRefBox}
   */  
  static cloneOf (box: Skia.SkiaRefBox<ImageRefBox, Skia.Image>): ImageRefBox {
    const ref = this.create(box) as ImageRefBox
    return ref
  }

   // => width
   public get width (): number {
    return this.skia.width()
  }

  // => height
  public get height (): number {
    return this.skia.height()
  }


  // => skia
  public get skia () {
    return this.box.skia
  }

  public box: Skia.SkiaRefBox<ImageRefBox, Skia.Image>
  public disposed: boolean = false

  constructor (...rests: unknown[])
  constructor (ref: Skia.Image)
  constructor (box: Skia.Image | Skia.SkiaRefBox<ImageRefBox, Skia.Image>) {
    this.box = box instanceof Skia.SkiaRefBox
      ? box 
      : new Skia.SkiaRefBox(box)
    
    this.box.ref(this)
  }

  async toByteData (format: Skia.ImageByteFormat = Engine.skia.ImageByteFormat.RawRGBA) {
    return this.readPixelsFromSkiaImage(format)
  }

  /**
   * @param {ImageByteFormat} format
   * @return {ArrayBuffer | Buffer}
   */
  readPixelsFromSkiaImage (format: Skia.ImageByteFormat) {
    const alphaType = Engine.skia.ImageByteFormat.RawStraightRGBA 
      ? Engine.skia.AlphaType.Unpremul 
      : Engine.skia.AlphaType.Premul

    let bytes: Uint8Array
    if (
      format === Engine.skia.ImageByteFormat.RawRGBA || 
      format === Engine.skia.ImageByteFormat.RawStraightRGBA
    ) {
      bytes = this.skia.readPixels(0, 0, {
        width: this.width,
        height: this.height,
        alphaType,
        colorType: Engine.skia.ColorType.RGBA_8888,
        colorSpace: Engine.skia.ColorSpace.SRGB
      }) as Uint8Array
    } else {
      bytes = this.skia?.encodeToBytes() as Uint8Array
    }

    return bytes.buffer
  }

  /**
   * @param {Image} other
   * @return {boolean}
   */  
  isCloneOf (other: ImageRefBox) {
    return (
      other instanceof ImageRefBox && 
      other.skia.isAliasOf(this.skia)
    )
  }

  clone (): ImageRefBox {
    return ImageRefBox.cloneOf(this.box)
  }

  dispose () {
    this.disposed = true
    this.box.unref(this)
  }

}
export class Image extends ImageRefBox {
  // => image
  public get image () {
    return this.box.skia
  }

  clone (): Image {
    return super.clone() as Image
  }

  isCloneOf (other: Image): boolean {
    return super.isCloneOf(other)
  }

  toString () {
    return `Image(
      [width]: ${this.width}, 
      [height]: ${this.height}
    )`
  }
}