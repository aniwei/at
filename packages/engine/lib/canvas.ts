import { invariant } from 'ts-invariant'
import { Rect, RRect } from '@at/geometry'
import { At } from '@at/core'
import { Path } from './path'
import { Paint } from './paint'
import { rrectIsValid } from './utility'
import * as Skia from './skia'

export class Canvas extends Skia.ManagedSkiaRef<Skia.Canvas> {

  // => count
  public get count () {
    return this.skia?.getSaveCount()
  }

  /**
   * 设置剪切路径
   * @param {Path} path
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipPath (
    path: Path, 
    doAntiAlias: boolean = true
  ) {
    invariant(path !== null, `The path cannot be null.`)
    invariant(doAntiAlias !== null, `The doAntiAlias cannot be null.`)

    this.skia?.clipPath(
      path.skia as Skia.Path, 
      At.skia.ClipOp.Intersect, 
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

    this.skia?.clipRRect(
      rrect as unknown as number[], 
      At.skia.ClipOp.Intersect, 
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
  clipRect (rect: Rect, clipOp: Skia.ClipOp, doAntiAlias = true) {
    invariant(clipOp !== null, `The argument clipOp cannot be null.`)
    invariant(doAntiAlias !== null, `The argument doAntiAlias cannot be null.`)

    this.skia?.clipRect(
      rect as unknown as number[], 
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
    paint: Paint
  ) {
    const degree = 180.0 / Math.PI
    this.skia?.drawArc(
      oval as unknown as number[],
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
  // drawAtlasRaw (
  //   paint: Paint,
  //   atlas: Image,
  //   rstTransforms: Float32Array,
  //   rects: Float32Array,
  //   colors: Uint32Array,
  //   blendMode: Skia.BlendMode
  // ) {
  //   this.skia?.drawAtlas(
  //     atlas.skia as Skia.Image,
  //     rects,
  //     rstTransforms,
  //     paint.skia,
  //     blendMode,
  //     colors
  //   )
  // }
}