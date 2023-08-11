import { ClipOp } from './skia'
import { Color } from '../basic/color'
import { Rect, RRect } from '../basic/geometry'

import type { ArrayLike } from '../at'
import type { AtPath } from './path'
import type { AtPaint } from './paint'
import type { AtCanvas } from './canvas'
import type { AtImageFilter } from './image-filter'

export class AtNWCanvas extends Array<AtCanvas> {
  static create () {
    return new AtNWCanvas()
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
  saveLayer (bounds: Rect, paint: AtPaint | null) {
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
  saveLayerWithFilter (bounds: Rect, filter: AtImageFilter, paint: AtPaint) {
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
   * @description: 
   * @param {ArrayLike<number>} matrix
   * @return {*}
   */
  transform (matrix: ArrayLike<number>) {
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
  clipPath (path: AtPath, doAntiAlias: boolean) {
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
    clipOp: ClipOp,
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
