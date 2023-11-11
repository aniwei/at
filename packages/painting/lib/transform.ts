import { Rect } from '@at/geometry'

/**
 * 放大 Rect
 * @param {Rect} rect
 * @param {number} scale
 * @return {*}
 */
export function scaleRect(rect: Rect, scale: number): Rect {
  return Rect.fromLTRB(
    rect.left * scale, 
    rect.top * scale, 
    rect.right * scale, 
    rect.bottom * scale
  )
}
