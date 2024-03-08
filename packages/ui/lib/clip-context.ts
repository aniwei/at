import { Skia, Canvas, Paint, Path, Engine } from '@at/engine'
import { Rect, RRect } from '@at/geometry'

//// => ClipContext
export abstract class ClipContext {
  abstract canvas: Canvas | null

  /**
   * 裁剪并绘制
   * @param {(doAntiAlias: boolean): void} clipCallback 
   * @param {Skia.Clip} clipBehavior 
   * @param {Rect} bounds 
   * @param {VoidFunction} painter 
   */
  clipAndPaint (
    clipCallback: (doAntiAlias: boolean) => void,
    clipBehavior: Skia.Clip, 
    bounds: Rect, 
    painter: VoidFunction
  ) {
    this.canvas?.save()

    switch (clipBehavior) {
      case Engine.skia.Clip.None:
        break
      case Engine.skia.Clip.HardEdge:
        clipCallback(false)
        break
      case Engine.skia.Clip.AntiAlias:
        clipCallback(true)
        break
      case Engine.skia.Clip.AntiAliasWithSaveLayer:
        clipCallback(true)
        this.canvas?.saveLayer(bounds, Paint.create())
        break
    }

    painter()
    
    if (clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      this.canvas?.restore()
    }

    this.canvas?.restore()
  }
  
  /**
   * 根据 Path 进行裁剪绘制
   * @param {Path} path 
   * @param {Skia.Clip} clipBehavior 
   * @param {Rect} bounds 
   * @param {VoidFunction} painter 
   */
  clipPathAndPaint (
    path: Path, 
    clipBehavior: Skia.Clip, 
    bounds: Rect, 
    painter: VoidFunction 
  ) {
    this.clipAndPaint(
      (doAntiAlias: boolean) => this.canvas?.clipPath(path, doAntiAlias), 
      clipBehavior, 
      bounds, 
      painter
    )
  }

  /**
   * 裁剪并绘制
   * @param {RRect} rrect 
   * @param {Skia.Clip} clipBehavior 
   * @param {Rect} bounds 
   * @param {VoidFunction} painter 
   */
  clipRRectAndPaint (
    rrect: RRect, 
    clipBehavior: Skia.Clip, 
    bounds: Rect, 
    painter: VoidFunction
  ) {
    this.clipAndPaint(
      (doAntiAlias: boolean) => this.canvas?.clipRRect(rrect, doAntiAlias), 
      clipBehavior, 
      bounds, 
      painter
    )
  }

  /**
   * 裁剪并绘制
   * @param {Rect} rect 
   * @param {Skia.Clip} clipBehavior 
   * @param {Rect} bounds 
   * @param {VoidFunction} painter 
   */
  clipRectAndPaint (
    rect: Rect, 
    clipBehavior: Skia.Clip, 
    bounds: Rect, 
    painter: VoidFunction
  ) {
    this.clipAndPaint(
      (doAntiAlias: boolean) => {
        this.canvas?.clipRect(rect, Engine.skia.ClipOp.Intersect, doAntiAlias)
      }, 
      clipBehavior, 
      bounds, 
      painter
    )
  }
}