import { invariant } from '@at/utils'
import { Offset, Size } from '@at/geometry'

import { Canvas } from './canvas'
import { Image } from './image'
import { Paint } from './paint'
import { LayerTree } from './layer-tree'

import * as Skia from './skia'

export type SubmitCallback = (image: Image) => void 

export class SurfaceFrame {
  static create (surface: Surface) {
    return new SurfaceFrame(surface)
  }

  public get canvas () {
    invariant(this.surface)
    return this.surface.canvas
  }

  public surface: Surface | null
  public caches: null = null
  
  /**
   * 
   * @param skia 
   * @param onSubmit 
   */
  constructor (surface: Surface) {    
    this.surface = surface
  }

  raster (layerTree: LayerTree, ignoreCache: boolean = false) {
    layerTree.preroll(this, ignoreCache)
    layerTree.paint(this, ignoreCache)
  }

  commit (): Image {
    invariant(this.surface)
    const image = this.surface.snapshot()
    return Image.create(image)
  }

  dispose () {
    this.surface?.dispose()
    this.surface = null
  }
}

export class Surface extends Skia.ManagedSkiaRef<Skia.Surface> {
  static create (...rests: unknown[]): Surface
  static create (skia: Skia.Surface): Surface {
    return new Surface(skia) as Surface
  }

  static fromSkia (skia: Surface) {
    return new Surface(skia)
  }

  // => skia
  get skia () {
    invariant(super.skia)
    return super.skia
  }
  
  // => canvas
  get canvas () {
    invariant(!this.disposed, 'Attempting to use the canvas of a disposed surface.')
    return Canvas.create(this.skia.getCanvas())
  }

  // => width
  get width () {
    invariant(this.skia)
    return this.skia.width()
  }

  // => height
  get height () {
    invariant(this.skia)
    return this.skia.height()
  } 

  protected disposed: boolean = false

  acquireFrame (size?: Size): SurfaceFrame {
    const surface = new Surface(this.skia.makeSurface({
      ...this.skia?.imageInfo(),
      width: size ? size.width : this.width,
      height: size ? size.height : this.height
    }))
    
    const frame = new SurfaceFrame(surface)
    return frame
  }

  snapshot () {
    return this.skia?.makeImageSnapshot()
  }

  flush (image: Image) {
    const paint = Paint.create()
    this.canvas.drawImage(image, Offset.ZERO, paint)

    this.skia.flush()
  }
}
