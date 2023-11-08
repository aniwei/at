import { invariant } from '@at/utils'
import { RRect } from './rrect'
import { Offset } from './offset'
import { Rect } from './rect'

//// => validate
// 数据检验
/**
 * 判断 RRect 是否有效
 * @param {RRect} rrect 
 * @returns {boolean}
 */
export function rrectIsValid (rrect: RRect) {
  invariant(rrect !== null, 'RRect argument was null.')
  invariant(
    !(isNaN(rrect.left) || isNaN(rrect.right) || isNaN(rrect.top) || isNaN(rrect.bottom)),
    'RRect argument contained a NaN value.'
  )

  return true
}

/**
 * 判断是否有效 Offset
 * @param {Offset} offset
 * @return {boolean}
 */
export function offsetIsValid (offset: Offset) {
  invariant(offset !== null, 'The offset cannot be null.')
  invariant(!isNaN(offset.dx) || isNaN(offset.dy), 'The offset argument contained a NaN value.')
  return true
}

/**
 * 判断是否有效 Rect
 * @param {Rect} rect
 * @return {*}
 */
export function rectIsValid (rect: Rect) {
  invariant(rect !== null, 'Rect argument cannot be null.')
  invariant(
    !(isNaN(rect.left) || isNaN(rect.right) || isNaN(rect.top) || isNaN(rect.bottom)),
    'Rect argument contained a NaN value.'
  )
  return true
}

