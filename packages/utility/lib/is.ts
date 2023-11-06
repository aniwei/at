import { invariant } from 'ts-invariant'
import { Offset, RRect, Rect } from '@at/geometry'

//// => type
// 类型判断
export const isTypeOf = (object: object, type: string) => {
  return Object.prototype.toString.call(object) === `[object ${type}]`
}

export const isDarwin = () => {
  return process.platform === 'darwin'
}

export const isLinux = () => {
  return process.platform === 'linux'
}

export const isWindow = () => {
  return process.platform === 'win32'
}

export const isArm64 = () => {
  return process.arch === 'arm64'
}

export const isSupportBlob = () => {
  return typeof globalThis.Blob !== 'undefined'
}

export const isBlob = (blob: Blob) => {
  return isTypeOf(blob, 'Blob')
}

export const isRegExp = (r: RegExp) => {
  return isTypeOf(r, 'RegExp')
}

export const isSupportSharedArrayBuffer = () => {
  return typeof globalThis.SharedArrayBuffer !== 'undefined'
}

export const isNative = (Constructor: unknown): boolean => {
  return typeof Constructor === 'function' && /native code/.test(Constructor.toString())
}

export const isArray = (object: object) => {
  return isTypeOf(object, 'Array')
}

export const isObject = (object: object) => {
  return isTypeOf(object, 'Object')
} 

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

