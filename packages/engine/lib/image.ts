import * as Skia from './skia'

export interface ImageRefBoxFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class ImageRefBox {
  static create<T> (...rests: unknown[]): T
  static create<T> (box: Skia.Image | Skia.SkiaRefBox<ImageRefBox, Skia.Image>): T {
    const Factory = this as unknown as ImageRefBoxFactory<T>
    return new Factory(box)
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

  dispose () {
    this.disposed = true
    this.box.unref(this)
  }

  clone (): ImageRefBox {
    return ImageRefBox.cloneOf(this.box)
  }
}

export class Image extends ImageRefBox {
  // => width
  public get width (): number {
    return this.skia!.width()
  }

  // => height
  public get height (): number {
    return this.skia!.height()
  }

  // => image
  public get image () {
    return this.box.skia
  }

  toString () {
    return `Image([width: ${this.width}], [height: ${this.height}])`
  }
}