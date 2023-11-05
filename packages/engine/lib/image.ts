import { At } from '@at/core'
import { Color } from '@at/basic'
import * as Skia from './skia'



export interface ImageRefFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class ImageRef {
  static create<T> (...rests: unknown[]): T
  static create<T> (box: Skia.Image | Skia.SkiaRefBox<ImageRef, Skia.Image>): T {
    const Factory = this as unknown as ImageRefFactory<T>
    return new Factory(box)
  }

  /**
   * 克隆 
   * @param {Skia.SkiaRefBox<ImageRef, Skia.Image>} box
   * @return {ImageRef}
   */  
  static cloneOf (box: Skia.SkiaRefBox<ImageRef, Skia.Image>): ImageRef {
    const ref = this.create(box) as ImageRef
    return ref
  }

  // => skia
  public get skia () {
    return this.box.skia
  }

  public box: Skia.SkiaRefBox<ImageRef, Skia.Image>
  public disposed: boolean = false

  constructor (...rests: unknown[])
  constructor (ref: Skia.Image)
  constructor (box: Skia.Image | Skia.SkiaRefBox<ImageRef, Skia.Image>) {
    this.box = box instanceof Skia.SkiaRefBox
      ? box 
      : new Skia.SkiaRefBox(box)
    
    this.box.ref(this)
  }

  dispose () {
    this.disposed = true
    this.box.unref(this)
  }

  clone (): ImageRef {
    return ImageRef.cloneOf(this.box)
  }
}

export class Image extends ImageRef {
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