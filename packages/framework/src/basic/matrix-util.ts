import { invariant } from '@at/utils'
import { Offset, Rect } from './geometry'
import { Matrix4 } from './matrix4'
import { Vector4 } from './vector4'
import type { ArrayLike } from '../at'


export class MatrixUtils {
  static getAsTranslation (transform: Matrix4): Offset | null {
    invariant(transform !== null, `The argument transform cannot be null.`)
    const values = transform.storage
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
      values[14] === 0.0 && // bottom of col 4 (values 12 and 13 are the x and y offsets)
      values[15] === 1.0
    ) {
      return new Offset(values[12], values[13])
    }
    return null
  }

 
  static getAsScale (transform: Matrix4): number | null {
    invariant(transform !== null)
    const values = transform.storage
    if (
      values[1] === 0.0 && // col 1 (value 0 is the scale)
      values[2] === 0.0 &&
      values[3] === 0.0 &&
      values[4] === 0.0 && // col 2 (value 5 is the scale)
      values[6] === 0.0 &&
      values[7] === 0.0 &&
      values[8] === 0.0 && // col 3
      values[9] === 0.0 &&
      values[10] === 1.0 &&
      values[11] === 0.0 &&
      values[12] === 0.0 && // col 4
      values[13] === 0.0 &&
      values[14] === 0.0 &&
      values[15] === 1.0 &&
      values[0] === values[5]
    ) { 
      return values[0]
    }
    return null
  }

  
  static matrixEquals (
    a: Matrix4 | null, 
    b: Matrix4 | null
  ):  boolean {
    if (a === b) {
      return true
    }
    invariant(a !== null || b !== null)
    if (a === null) {
      return MatrixUtils.isIdentity(b!)
    } 
    if (b === null) {
      return MatrixUtils.isIdentity(a)
    }
    invariant(a !== null && b !== null)
    return (
      a.storage[0] === b.storage[0] &&
      a.storage[1] === b.storage[1] &&
      a.storage[2] === b.storage[2] &&
      a.storage[3] === b.storage[3] &&
      a.storage[4] === b.storage[4] &&
      a.storage[5] === b.storage[5] &&
      a.storage[6] === b.storage[6] &&
      a.storage[7] === b.storage[7] &&
      a.storage[8] === b.storage[8] &&
      a.storage[9] === b.storage[9] &&
      a.storage[10] === b.storage[10] &&
      a.storage[11] === b.storage[11] &&
      a.storage[12] === b.storage[12] &&
      a.storage[13] === b.storage[13] &&
      a.storage[14] === b.storage[14] &&
      a.storage[15] === b.storage[15]
    )
  }

  static isIdentity(a: Matrix4): boolean {
    invariant(a !== null)
    return (
      a.storage[0] === 1.0 && // col 1
      a.storage[1] === 0.0 &&
      a.storage[2] === 0.0 &&
      a.storage[3] === 0.0 &&
      a.storage[4] === 0.0 && // col 2
      a.storage[5] === 1.0 &&
      a.storage[6] === 0.0 &&
      a.storage[7] === 0.0 &&
      a.storage[8] === 0.0 && // col 3
      a.storage[9] === 0.0 &&
      a.storage[10] === 1.0 &&
      a.storage[11] === 0.0 &&
      a.storage[12] === 0.0 && // col 4
      a.storage[13] === 0.0 &&
      a.storage[14] === 0.0 &&
      a.storage[15] === 1.0
    )
  }

  
  static transformPoint (
    transform: Matrix4, 
    point: Offset
  ): Offset {
    const storage = transform.storage
    const x = point.dx
    const y = point.dy

    const rx = storage[0] * x + storage[4] * y + storage[12]
    const ry = storage[1] * x + storage[5] * y + storage[13]
    const rw = storage[3] * x + storage[7] * y + storage[15]
    if (rw === 1.0) {
      return new Offset(rx, ry)
    } else {
      return new Offset(rx / rw, ry / rw)
    }
  }

  static safeTransformRect (
    transform: Matrix4, 
    rect: Rect
  ) {
    const storage = transform.storage
    const isAffine = (
      storage[3] === 0.0 &&
      storage[7] === 0.0 &&
      storage[15] === 1.0
    )

    this.accumulate(storage, rect.left,  rect.top,    true,  isAffine)
    this.accumulate(storage, rect.right, rect.top,    false, isAffine)
    this.accumulate(storage, rect.left,  rect.bottom, false, isAffine)
    this.accumulate(storage, rect.right, rect.bottom, false, isAffine)

    return Rect.fromLTRB(
      this.minMax[0], 
      this.minMax[1], 
      this.minMax[2], 
      this.minMax[3]
    )
  }

  static minMax = new Float64Array(4)
  static accumulate (
    m: ArrayLike<number>, 
    x: number, 
    y: number, 
    first: boolean, 
    isAffine: boolean
  ) {
    const w = isAffine ? 1.0 : 1.0 / (m[3] * x + m[7] * y + m[15])
    const tx = (m[0] * x + m[4] * y + m[12]) * w
    const ty = (m[1] * x + m[5] * y + m[13]) * w
    if (first) {
      this.minMax[0] = this.minMax[2] = tx
      this.minMax[1] = this.minMax[3] = ty
    } else {
      if (tx < this.minMax[0]) {
        this.minMax[0] = tx
      }
      if (ty < this.minMax[1]) {
        this. minMax[1] = ty
      }
      if (tx > this.minMax[2]) {
        this.minMax[2] = tx
      }
      if (ty > this.minMax[3]) {
        this.minMax[3] = ty
      }
    }
  }

  static transformRect (
    transform: Matrix4, 
    rect: Rect
  ) {
    const storage = transform.storage
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
      );
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

  static inverseTransformRect(
    transform: Matrix4 , 
    rect: Rect
  ) {
    invariant(rect !== null)
    if (this.isIdentity(transform)) {
      return rect
    }
    
    transform = Matrix4.copy(transform)
    transform.invert()
    return this.transformRect(transform, rect)
  }

  static createCylindricalProjectionTransform(
    radius: number,
    angle: number,
    perspective = 0.001,
    // orientation: Axis = Axis.Vertical,
  ) {
    invariant(radius !== null)
    invariant(angle !== null)
    invariant(perspective >= 0 && perspective <= 1.0)
    invariant(orientation !== null)

    const result = Matrix4.identity()
    result.setEntry(3, 2, -perspective)
    result.setEntry(2, 3, -radius)
    result.setEntry(3, 3, perspective * radius + 1.0)

    // @TODO
    // const m = orientation === Axis.Horizontal
    //   ? Matrix4.rotationY(angle)
    //   : Matrix4.rotationX(angle)
   
    // m.multiply(Matrix4.translationValues(0.0, 0.0, radius))
    // result.multiply(m)

    return result
  }

  static forceToPoint (offset: Offset) {
    const mat = Matrix4.identity()
    mat.setRow(0, new Vector4(0, 0, 0, offset.dx))
    mat.setRow(1, new Vector4(0, 0, 0, offset.dy))
    return mat
  }
}

