import invariant from '@at/utils'
import { AtPaint } from '../engine/paint'
import { AtPath } from '../engine/path'
import { AtCanvas } from '../engine/canvas'
import { Clip } from '../engine/skia'
import { VoidCallback } from '../at/framework'
import { Rect, RRect } from '../basic/geometry'
import { At } from '../at'

/**
 * 裁剪上下文
 */
export abstract class AtClipContext {
  abstract canvas: AtCanvas | null

  /**
   * 
   * @param clipCallback 
   * @param clipBehavior 
   * @param bounds 
   * @param painter 
   */
  clipAndPaint (
    clipCallback: (doAntiAlias: boolean) => void,
    clipBehavior: Clip, 
    bounds: Rect, 
    painter: VoidCallback
  ) {
    invariant(clipCallback !== null, `The argument "clipCallback" cannot be null.`)
    this.canvas?.save()

    switch (clipBehavior) {
      case Clip.None:
        break
      case Clip.HardEdge:
        clipCallback(false)
        break
      case Clip.AntiAlias:
        clipCallback(true)
        break
      case Clip.AntiAliasWithSaveLayer:
        clipCallback(true)
        this.canvas?.saveLayer(bounds, new AtPaint())
        break
    }

    painter()
    
    if (clipBehavior === Clip.AntiAliasWithSaveLayer) {
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
    path: AtPath, 
    clipBehavior: Clip, 
    bounds: Rect, 
    painter: VoidCallback 
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
    clipBehavior: Clip, 
    bounds: Rect, 
    painter: VoidCallback
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
    clipBehavior: Clip, 
    bounds: Rect, 
    painter: VoidCallback
  ) {
    this.clipAndPaint(
      (doAntiAlias: boolean) => {
        this.canvas?.clipRect(rect, At.ClipOp.Intersect, doAntiAlias)
      }, 
      clipBehavior, 
      bounds, 
      painter
    )
  }
}