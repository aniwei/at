import { invariant } from 'ts-invariant'
import { Rect, RRect } from '@at/geometry'
import { Path } from './Path'
import * as Sk from './skia'

export class Canvas extends Sk.ManagedSkiaRef<Sk.Canvas> {
  // => count
  public get count () {
    return this.skia.getSaveCount()
  }

  /**
   * 设置剪切路径
   * @param {Path} path
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipPath (path: Path, doAntiAlias: boolean = true) {
    invariant(path !== null, `The path cannot be null.`)
    invariant(doAntiAlias !== null, `The doAntiAlias cannot be null.`)

    this.skia.clipPath(
      path.skia, 
      At.ClipOp.Intersect, 
      doAntiAlias
    )
  }

  /**
   * 圆角矩形裁剪
   * @param {RRect} rrect
   * @param {boolean} doAntiAlias
   * @return {void}
   */
  clipRRect (rrect: RRect, doAntiAlias: boolean = true) {
    invariant(rrectIsValid(rrect), `The argument rrect is invalid.`)
    invariant(doAntiAlias !== null, `The argument doAntiAlias cannot be null.`)

    this.skia.clipRRect(
      rrect, 
      At.ClipOp.Intersect, 
      doAntiAlias
    )
  }

  /**
   * 矩形裁剪
   * @param {Rect} rect
   * @param {ClipOp} clipOp
   * @param {boolean} doAntiAlias
   * @return {void}
   */
  clipRect (rect: Rect, clipOp: ClipOp, doAntiAlias = true) {
    invariant(clipOp !== null, `The argument clipOp cannot be null.`)
    invariant(doAntiAlias !== null, `The argument doAntiAlias cannot be null.`)

    this.skia.clipRect(
      rect, 
      clipOp, 
      doAntiAlias
    )
  }

  /**
   * 画圆角
   * @param {Rect} oval 
   * @param {number} startAngle 
   * @param {number} sweepAngle 
   * @param {boolean} useCenter 
   * @param {AtPaint} paint 
   */
  drawArc (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: AtPaint
  ) {
    const degree = 180.0 / Math.PI
    this.skia.drawArc(
      oval,
      startAngle * degree,
      sweepAngle * degree,
      useCenter,
      paint.skia
    )
  }

  /**
   * 
   * @param paint 
   * @param atlas 
   * @param rstTransforms 
   * @param rects 
   * @param colors 
   * @param blendMode 
   */
  drawAtlasRaw (
    paint: Paint,
    atlas: Image,
    rstTransforms: Float32Array,
    rects: Float32Array,
    colors: Uint32Array,
    blendMode: BlendMode
  ) {
    this.skia.drawAtlas(
      atlas.skia,
      rects,
      rstTransforms,
      paint.skia,
      blendMode,
      colors
    )
  }
}