import { Matrix4 } from '@at/math'
import { Picture } from './picture'
import { Surface } from './surface'
import { LayerTree } from './layer-tree'

import * as Skia from './skia'


export interface RasterizerFactory<T> {
  new (surface: Skia.Surface, devicePixelRatio: number): T
  create (surface: Skia.Surface, devicePixelRatio: number): T
}
export abstract class Rasterizer extends Surface {
  static create <T extends Rasterizer> (surface: Skia.Surface, devicePixelRatio: number): Rasterizer {
    const RasterizerFactory = this as unknown as RasterizerFactory<T>
    return new RasterizerFactory(surface, devicePixelRatio)
  }

  protected devicePixelRatio: number

  public callbacks: VoidFunction[] = []
  public cacheBytes: number | null = null 
  public forceNewContext: boolean = true
  
  public contextLost: boolean = false
  public glContext: number | null = null
  public grContext: Skia.GrDirectContext | null = null

  public set cacheMaxBytes (bytes: number) {
    this.grContext?.setResourceCacheLimitBytes(this.cacheBytes = bytes)
  }

  constructor (
    surface: Surface,
    devicePixelRatio: number
  ) {
    super(surface)

    this.devicePixelRatio = devicePixelRatio
  }

  postCallback (callback: VoidFunction) {
    this.callbacks.push(callback)
  }

  runCallbacks () {
    for (let i = 0; i < this.callbacks.length; i++) {
      const callback = this.callbacks[i]
      callback()
    }
  }

  draw (layerTree: LayerTree) {
    if (!layerTree.frame.isEmpty) {
      try {
        const frame = this.acquireFrame()
        frame.raster(layerTree, true)
       
        this.flush(frame.commit())
      } catch (error) {
        throw error
      } finally {
        this.runCallbacks()
      }
    }
  }
}


export class RasterCache {
  prepare (
    picture: Picture, 
    matrix: Matrix4, 
    isComplex: boolean, 
    willChange: boolean
  ) {}

  get (
    picture: Picture, 
    matrix: Matrix4
  ) {
  }
      
}

