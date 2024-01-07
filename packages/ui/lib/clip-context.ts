import { Skia, Canvas, Paint, Path, Engine } from '@at/engine'
import { Rect, RRect } from '@at/geometry'

//// => ClipContext
export abstract class ClipContext {
  abstract canvas: Canvas | null

  /**
   * 
   * @param clipCallback 
   * @param clipBehavior 
   * @param bounds 
   * @param painter 
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
   * 
   * @param path 
   * @param clipBehavior 
   * @param bounds 
   * @param painter 
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
   * 
   * @param rrect 
   * @param clipBehavior 
   * @param bounds 
   * @param painter 
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
   * 
   * @param rect 
   * @param clipBehavior 
   * @param bounds 
   * @param painter 
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