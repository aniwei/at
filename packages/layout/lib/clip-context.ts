import { Skia, Canvas, Paint, Path, AtEngine } from '@at/engine'
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
    clipBehavior: Skia.ClipKind, 
    bounds: Rect, 
    painter: VoidFunction
  ) {
    this.canvas?.save()

    switch (clipBehavior) {
      case AtEngine.skia.ClipKind.None:
        break
      case AtEngine.skia.ClipKind.HardEdge:
        clipCallback(false)
        break
      case AtEngine.skia.ClipKind.AntiAlias:
        clipCallback(true)
        break
      case AtEngine.skia.ClipKind.AntiAliasWithSaveLayer:
        clipCallback(true)
        this.canvas?.saveLayer(bounds, Paint.create())
        break
    }

    painter()
    
    if (clipBehavior === AtEngine.skia.ClipKind.AntiAliasWithSaveLayer) {
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
    clipBehavior: Skia.ClipKind, 
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
    clipBehavior: Skia.ClipKind, 
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
    clipBehavior: Skia.ClipKind, 
    bounds: Rect, 
    painter: VoidFunction
  ) {
    this.clipAndPaint(
      (doAntiAlias: boolean) => {
        this.canvas?.clipRect(rect, AtEngine.skia.ClipOp.Intersect, doAntiAlias)
      }, 
      clipBehavior, 
      bounds, 
      painter
    )
  }
}