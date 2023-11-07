import { NWayCanvas } from './n-way-canvas'
import { Canvas } from './canvas'
import { RasterCache } from './rasterizer'

export class PaintContext {
  static create (
    internal: NWayCanvas, 
    leaf: Canvas, 
    rasterCache: RasterCache | null
  ) {
    return new PaintContext(internal, leaf, rasterCache)
  }

  public leaf: Canvas
  public internal: NWayCanvas
  public rasterCache: RasterCache | null

  constructor (internal: NWayCanvas, leaf: Canvas, rasterCache: RasterCache | null) {
    this.internal = internal
    this.leaf = leaf
    this.rasterCache = rasterCache
  }
}