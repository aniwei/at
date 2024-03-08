import { invariant } from '@at/utils'
import { Offset, Rect } from '@at/geometry'

import { Matrix4 } from './matrix4'

//// => MatrixUtils
export class MatrixUtils {
  /**
   * 将 Matrix4 转成 Offset
   * @param {Matrix4} values 
   * @returns {Offset | null}
   */
  static getAsTranslation (values: Matrix4): Offset | null {
    if (
      values[0] === 1.0 && // col 1
      values[1] === 0.0 &&
      values[2] === 0.0 &&
      values[3] === 0.0 &&
      values[4] === 0.0 && // col 2
      values[5] === 1.0 &&
      values[6] === 0.0 &&
      values[7] === 0.0 &&
      values[8] === 0.0 && // col 3
      values[9] === 0.0 &&
      values[10] === 1.0 &&
      values[11] === 0.0 &&
      values[14] === 0.0 &&
      values[15] === 1.0
    ) {
      return new Offset(values[12], values[13])
    }

    return null
  }

  /**
   * 相乘
   * @param {Matrix4} transform 
   * @param {Offset} point 
   * @returns {Offset}
   */
  static transformPoint (
    transform: Matrix4, 
    point: Offset
  ): Offset {
    const x = point.dx
    const y = point.dy

    const rx = transform[0] * x + transform[4] * y + transform[12]
    const ry = transform[1] * x + transform[5] * y + transform[13]
    const rw = transform[3] * x + transform[7] * y + transform[15]

    return rw === 1.0 
      ? new Offset(rx, ry) 
      : new Offset(rx / rw, ry / rw)
  }

  /**
   * 
   * @param transform 
   * @param rect 
   * @returns 
   */
  static safeTransformRect (
    transform: Matrix4, 
    rect: Rect
  ) {
    const isAffine = (
      transform[3] === 0.0 &&
      transform[7] === 0.0 &&
      transform[15] === 1.0
    )

    this.accumulate(transform as unknown as  number[], rect.left,  rect.top,    true,  isAffine)
    this.accumulate(transform as unknown as  number[], rect.right, rect.top,    false, isAffine)
    this.accumulate(transform as unknown as  number[], rect.left,  rect.bottom, false, isAffine)
    this.accumulate(transform as unknown as  number[], rect.right, rect.bottom, false, isAffine)

    return Rect.fromLTRB(
      this.MIN_MAX[0], 
      this.MIN_MAX[1], 
      this.MIN_MAX[2], 
      this.MIN_MAX[3]
    )
  }

  static MIN_MAX = new Float64Array(4)

  /**
   * 
   * @param m 
   * @param x 
   * @param y 
   * @param first 
   * @param isAffine 
   */
  static accumulate (
    m: number[], 
    x: number, 
    y: number, 
    first: boolean, 
    isAffine: boolean
  ) {
    const w = isAffine ? 1.0 : 1.0 / (m[3] * x + m[7] * y + m[15])
    const tx = (m[0] * x + m[4] * y + m[12]) * w
    const ty = (m[1] * x + m[5] * y + m[13]) * w
    if (first) {
      this.MIN_MAX[0] = this.MIN_MAX[2] = tx
      this.MIN_MAX[1] = this.MIN_MAX[3] = ty
    } else {
      if (tx < this.MIN_MAX[0]) {
        this.MIN_MAX[0] = tx
      }
      if (ty < this.MIN_MAX[1]) {
        this. MIN_MAX[1] = ty
      }
      if (tx > this.MIN_MAX[2]) {
        this.MIN_MAX[2] = tx
      }
      if (ty > this.MIN_MAX[3]) {
        this.MIN_MAX[3] = ty
      }
    }
  }

  /**
   * 
   * @param {Matrix4} transform 
   * @param {Rect} rect 
   * @returns {Rect}
   */
  static transformRect (
    transform: Matrix4, 
    rect: Rect
  ) {
    const storage = transform
    const x = rect.left
    const y = rect.top
    const w = rect.right - x
    const h = rect.bottom - y

    if (
      !Number.isFinite(w) || 
      !Number.isFinite(h)
    ) {
      return this.safeTransformRect(transform, rect)
    }

    const wx = storage[0] * w
    const hx = storage[4] * h
    const rx = storage[0] * x + storage[4] * y + storage[12]
    const wy = storage[1] * w
    const hy = storage[5] * h
    const ry = storage[1] * x + storage[5] * y + storage[13]

    if (
      storage[3] === 0.0 && 
      storage[7] === 0.0 && 
      storage[15] === 1.0
    ) {
      let left  = rx
      let right = rx
      if (wx < 0) {
        left += wx
      } else {
        right += wx
      }
      if (hx < 0) {
        left += hx
      } else {
        right += hx
      }

      let top = ry
      let bottom = ry
      if (wy < 0) {
        top += wy
      } else {
        bottom += wy
      }
      if (hy < 0) {
        top += hy
      } else {
        bottom += hy
      }

      return Rect.fromLTRB(left, top, right, bottom)
    } else {
      const ww = storage[3] * w
      const hw = storage[7] * h
      const rw = storage[3] * x + storage[7] * y + storage[15]

      const ulx =  rx / rw
      const uly =  ry / rw
      const urx = (rx + wx) / (rw + ww)
      const ury = (ry + wy) / (rw + ww)
      const llx = (rx + hx) / (rw + hw)
      const lly = (ry + hy) / (rw + hw)
      const lrx = (rx + wx + hx) / (rw + ww + hw)
      const lry = (ry + wy + hy) / (rw + ww + hw)

      return Rect.fromLTRB(
        this.min4(ulx, urx, llx, lrx),
        this.min4(uly, ury, lly, lry),
        this.max4(ulx, urx, llx, lrx),
        this.max4(uly, ury, lly, lry),
      )
    }
  }

  static min4(
    a: number, 
    b: number, 
    c: number, 
    d: number
  ) {
    const e = (a < b) ? a : b
    const f = (c < d) ? c : d
    return (e < f) ? e : f
  }

  static max4(
    a: number, 
    b: number, 
    c: number, 
    d: number
  ) {
    const e = (a > b) ? a : b
    const f = (c > d) ? c : d
    return (e > f) ? e : f
  }

  /**
   * 
   * @param {Matrix4} transform 
   * @param {Rect} rect 
   * @returns {Rect}
   */
  static inverseTransformRect (
    transform: Matrix4 , 
    rect: Rect
  ) {
    invariant(rect !== null, `The argument "rect" cannot be null.`)

    if (transform.isIdentity()) {
      return rect
    }
    
    transform.invert(Matrix4.copy(transform))
    
    return this.transformRect(transform, rect)
  }

  /**
   * 
   * @param {Offset} offset 
   * @returns {Matrix4}
   */
  static forceToPoint (offset: Offset) {
    const mat = Matrix4.identity()
    // mat.row(0, new Vector4(0, 0, 0, offset.dx))
    // mat.row(1, new Vector4(0, 0, 0, offset.dy))
    return mat
  }
}

