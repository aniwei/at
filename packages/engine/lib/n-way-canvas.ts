import { Color } from '@at/basic'
import { Rect, RRect } from '@at/geometry'

import * as Skia from './skia'

import type { Path } from './path'
import type { Paint } from './paint'
import type { Canvas } from './canvas'
import type { ImageFilter } from './image-filter'

export class NWayCanvas extends Array<Canvas> {
  static create () {
    return new NWayCanvas()
  }

  /**
   * 保存
   * @return {number}
   */
  save (): number {
    return this.reduce((count, canvas) => (count + canvas.save()), 0)
  }

  /**
   * 图层保存
   * @param {Rect} bounds
   * @param {Paint} paint
   * @return {*}
   */
  saveLayer (bounds: Rect, paint: Paint | null) {
    for (const canvas of this) {
      canvas.saveLayer(bounds, paint)
    }
  }

  /**
   * @description: 
   * @param {Rect} bounds
   * @param {ImageFilter} filter
   * @param {Paint} paint
   * @return {*}
   */
  saveLayerWithFilter (bounds: Rect, filter: ImageFilter, paint: Paint) {
    for (const canvas of this) {
      canvas.saveLayerWithFilter(bounds, filter, paint)
    }
  }

  /**
   * 会滚
   */
  restore () {
    for (const canvas of this) {
      canvas.restore()
    }
  }

  /**
   * @description: 
   * @param {number} count
   * @return {*}
   */
  restoreToCount (count: number) {
    for (const canvas of this) {
      canvas.restoreToCount(count)
    }
  }

  /**
   * @description: 
   * @param {number} dx
   * @param {number} dy
   * @return {*}
   */
  translate (dx: number, dy: number) {
    for (const canvas of this) {
      canvas.translate(dx, dy)
    }
  }

  /**
   * @param {number[]} matrix
   * @return {*}
   */
  transform (matrix: number[]) {
    for (const canvas of this) {
      canvas.transform(matrix)
    }
  }

  /**
   * @description: 
   * @param {Color} color
   */
  clear (color: Color) {
    for (const canvas of this) {
      canvas.clear(color)
    }
  }

  /**
   * @description: 
   * @param {AtPath} path
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipPath (path: Path, doAntiAlias: boolean) {
    for (const canvas of this) {
      canvas.clipPath(path, doAntiAlias)
    }
  }

  /**
   * @description: 
   * @param {Rect} rect
   * @param {ClipOp} clipOp
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipRect (
    rect: Rect, 
    clipOp: Skia.ClipOp,
    doAntiAlias: boolean
  ) {
    for (const canvas of this) {
      canvas.clipRect(rect, clipOp, doAntiAlias)
    }
  }

  /**
   * 圆角矩形裁剪
   * @param {RRect} rrect
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipRRect (rrect: RRect, doAntiAlias: boolean) {
    for (const canvas of this) {
      canvas.clipRRect(rrect, doAntiAlias)
    }
  }
}
