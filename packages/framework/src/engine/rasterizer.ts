/*
 * @author: Aniwei
 * @date: 2022-08-09 10:04:53
 */

import { invariant } from '@at/utils'
import { AtPicture } from './picture'
import { Matrix4 } from '../basic/matrix4'
import { AtSurface } from './surface'

import type { AtLayer } from './layer'
import type { AtLayerTree, VoidCallback } from '../at'
import type { GrDirectContext, Surface } from './skia'


export abstract class AtRasterizer extends AtSurface {
  protected devicePixelRatio: number

  public cacheBytes: number | null = null 
  public contextLost: boolean = false
  public grContext: GrDirectContext | null = null
  public glContext: number | null = null
  public forceNewContext: boolean = true
  public callbacks: VoidCallback[] = []

  public set cacheMaxBytes (bytes: number) {
    this.grContext?.setResourceCacheLimitBytes(this.cacheBytes = bytes)
  }

  /**
   * 
   * @param size 
   */
  constructor (
    surface: Surface,
    devicePixelRatio: number
  ) {
    super(surface)

    this.devicePixelRatio = devicePixelRatio
  }

  postCallback (callback: VoidCallback) {
    this.callbacks.push(callback)
  }

  runCallbacks () {
    for (let i = 0; i < this.callbacks.length; i++) {
      const callback = this.callbacks[i]
      callback()
    }
  }

  draw (layerTree: AtLayerTree) {
    if (!layerTree.frame.isEmpty) {
      try {
        invariant((() => {
          console.time(`rasterizing`)
          return true
        })())

        const frame = this.acquireOnScreenFrame()
        frame.raster(layerTree, true)

        invariant((() => {
          console.timeEnd(`rasterizing`)
          return true
        })())

        invariant((() => {
          console.time(`flushing`)
          return true
        })())

        frame.flush()

        invariant((() => {
          console.timeEnd(`flushing`)
          return true
        })())
      } catch (error) {
        throw error
      } finally {
        this.runCallbacks()
      }
    }
  }
}


export class AtRasterCache {
  prepare (
    picture: AtPicture, 
    matrix: Matrix4, 
    isComplex: boolean, 
    willChange: boolean
  ) {}

  get (
    picture: AtPicture, 
    matrix: Matrix4
  ) {
  }
      
}

