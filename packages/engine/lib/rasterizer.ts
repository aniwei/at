import { Picture } from './picture'
import { Matrix4 } from '@at/math'
import { Surface } from './surface'

import * as Skia from './skia'
import { LayerTree } from './layer-tree'

export abstract class Rasterizer extends Surface {
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
        // TODO
        // frame.flush()
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

