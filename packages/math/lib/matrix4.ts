import { invariant } from 'ts-invariant'
import { UnimplementedError, ArgumentError, Numberic } from '@at/basic'
import { Matrix2 } from './matrix2'
import { Matrix3 } from './matrix3'
import { Vector2 } from './vector2'
import { Vector4 } from './vector4'
import { Vector3 } from './vector3'
import { Quaternion } from './quaternion'


export class Matrix4 extends Numberic<Matrix4> {
  static decomposeV: Vector3 | null = null
  static decomposeM: Matrix4 | null = null
  static decomposeR: Matrix3 | null =null

  static get ZERO () {
    return new Matrix4(16)
  }

  /**
   * @description: 
   * @param {Matrix4} A
   * @param {Vector2} x
   * @param {Vector2} b
   * @return {*}
   */  
  static solve2 (A: Matrix4, x: Vector2, b: Vector2) {
    const a11 = A.entry(0, 0)
    const a12 = A.entry(0, 1)
    const a21 = A.entry(1, 0)
    const a22 = A.entry(1, 1)
    const bx = b[0] - A[8]
    const by = b[1] - A[9]
    let det = a11 * a22 - a12 * a21

    if (det !== 0) {
      det = 1.0 / det
    }

    x[0] = det * (a22 * bx - a12 * by)
    x[1] = det * (a11 * by - a21 * bx)
  }

  
  /**
   * @description: 
   * @param {Matrix4} A
   * @param {Vector3} x
   * @param {Vector3} b
   * @return {*}
   */
  static solve3 (A: Matrix4, x: Vector3, b: Vector3) {
    const A0x = A.entry(0, 0)
    const A0y = A.entry(1, 0)
    const A0z = A.entry(2, 0)
    const A1x = A.entry(0, 1)
    const A1y = A.entry(1, 1)
    const A1z = A.entry(2, 1)
    const A2x = A.entry(0, 2)
    const A2y = A.entry(1, 2)
    const A2z = A.entry(2, 2)
    const bx = b[0] - A[12]
    const by = b[1] - A[13]
    const bz = b[2] - A[14]
    let rx, ry, rz
    let det

    rx = A1y * A2z - A1z * A2y
    ry = A1z * A2x - A1x * A2z
    rz = A1x * A2y - A1y * A2x

    det = A0x * rx + A0y * ry + A0z * rz
    if (det !== 0) {
      det = 1.0 / det
    }
    
    const x1 = det * (bx * rx + by * ry + bz * rz)

    rx = -(A2y * bz - A2z * by)
    ry = -(A2z * bx - A2x * bz)
    rz = -(A2x * by - A2y * bx)
    
    const y1 = det * (A0x * rx + A0y * ry + A0z * rz)

    rx = -(by * A1z - bz * A1y)
    ry = -(bz * A1x - bx * A1z)
    rz = -(bx * A1y - by * A1x)

    const z1 = det * (A0x * rx + A0y * ry + A0z * rz)
    x[0] = x1
    x[1] = y1
    x[2] = z1
  }

  static solve (A: Matrix4, x: Vector4, b: Vector4) {
    const a00 = A[0]
    const a01 = A[1]
    const a02 = A[2]
    const a03 = A[3]
    const a10 = A[4]
    const a11 = A[5]
    const a12 = A[6]
    const a13 = A[7]
    const a20 = A[8]
    const a21 = A[9]
    const a22 = A[10]
    const a23 = A[11]
    const a30 = A[12]
    const a31 = A[13]
    const a32 = A[14]
    const a33 = A[15]
    const b00 = a00 * a11 - a01 * a10
    const b01 = a00 * a12 - a02 * a10
    const b02 = a00 * a13 - a03 * a10
    const b03 = a01 * a12 - a02 * a11
    const b04 = a01 * a13 - a03 * a11
    const b05 = a02 * a13 - a03 * a12
    const b06 = a20 * a31 - a21 * a30
    const b07 = a20 * a32 - a22 * a30
    const b08 = a20 * a33 - a23 * a30
    const b09 = a21 * a32 - a22 * a31
    const b10 = a21 * a33 - a23 * a31
    const b11 = a22 * a33 - a23 * a32

    const bX = b.storage[0]
    const bY = b.storage[1]
    const bZ = b.storage[2]
    const bW = b.storage[3]

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06

    if (det !== 0) {
      det = 1.0 / det
    }

    x[0] = det * (
      (a11 * b11 - a12 * b10 + a13 * b09) * bX -
      (a10 * b11 - a12 * b08 + a13 * b07) * bY +
      (a10 * b10 - a11 * b08 + a13 * b06) * bZ -
      (a10 * b09 - a11 * b07 + a12 * b06) * bW
    )
    x[1] = det * -(
      (a01 * b11 - a02 * b10 + a03 * b09) * bX -
      (a00 * b11 - a02 * b08 + a03 * b07) * bY +
      (a00 * b10 - a01 * b08 + a03 * b06) * bZ -
      (a00 * b09 - a01 * b07 + a02 * b06) * bW
    )
    x[2] = det * (
      (a31 * b05 - a32 * b04 + a33 * b03) * bX -
      (a30 * b05 - a32 * b02 + a33 * b01) * bY +
      (a30 * b04 - a31 * b02 + a33 * b00) * bZ -
      (a30 * b03 - a31 * b01 + a32 * b00) * bW
    )
    x[3] = det * -(
      (a21 * b05 - a22 * b04 + a23 * b03) * bX -
      (a20 * b05 - a22 * b02 + a23 * b01) * bY +
      (a20 * b04 - a21 * b02 + a23 * b00) * bZ -
      (a20 * b03 - a21 * b01 + a22 * b00) * bW
    )
  }

  static tryInvert (other: Matrix4) {
    const r = Matrix4.ZERO
    const determinant = r.copyInverse(other)
    if (determinant === 0.0) {
      return null
    }
    return r
  }

  /**
   * @description: 
   * @param {number} values
   * @return {*}
   */  
  static from (values: number[]) {
    const mat = Matrix4.ZERO
    mat.values(
      values[0],
      values[1],
      values[2],
      values[3],
      values[4],
      values[5],
      values[6],
      values[7],
      values[8],
      values[9],
      values[10],
      values[11],
      values[12],
      values[13],
      values[14],
      values[15]
    )
    return mat
  } 
    
  /**
   * @description: 
   * @return {*}
   */
  static identity () {
    const mat = Matrix4.ZERO
    mat.identity()
    return mat
  }

  static copy (other: Matrix4) {
    const m = Matrix4.ZERO
    m.from(other)
    return m
  }

  static inverted (other: Matrix4) {
    const r = Matrix4.ZERO
    const determinant: number = r.copyInverse(other)

    if (determinant === 0.0) {
      throw new ArgumentError(`Matrix cannot be inverted`)
    }
    
    return r
  }

  /**
   * @description: 
   * @return {*}
   */  
  static columns (
    arg0: Vector4, 
    arg1: Vector4, 
    arg2: Vector4, 
    arg3: Vector4
  ) {
    const mat = Matrix4.ZERO
    mat.columns(arg0, arg1, arg2, arg3)
  }

  static outer (
    u: Vector4, 
    v: Vector4
  ) {
    const mat = Matrix4.ZERO
    mat.outer(u, v)
    return mat
  } 

  static rotationX (radians: number) {
    const m = Matrix4.ZERO
    m[15] = 1.0
    m.setRotationX(radians)
    return m
  }

  static rotationY (radians: number) {
    const m = Matrix4.ZERO
    m[15] = 1.0
    m.setRotationY(radians)
    return m
  }

  static rotationZ (radians: number) {
    const m = Matrix4.ZERO
    m[15] = 1.0
    m.setRotationZ(radians)
    return m
  }

  static translation (translation: Vector3) {
    const mat = Matrix4.ZERO
    mat.setIdentity()
    mat.setTranslation(translation)
    return mat
  }

  static translationValues (
    x: number,
    y: number,
    z: number
  ) {
    const mat = Matrix4.ZERO
    mat.setIdentity()
    mat.setTranslationRaw(x, y, z)
    return mat
  }

  static diagonal3 (scale: Vector3) {
    const m = Matrix4.ZERO
    m[15] = 1.0
    m[10] = scale[2]
    m[5] = scale[1]
    m[0] = scale[0]
    return m
  }

  static diagonal3Values (
    x: number, 
    y: number, 
    z: number
  ) {
    const m = Matrix4.ZERO
    m[15] = 1.0
    m[10] = z
    m[5] = y
    m[0] = x
    return m
  }

  static skewX (alpha: number) {
    const m = Matrix4.identity()
    m[4] = Math.tan(alpha)
    return m
  }

  static skewY (beta: number) {
    const m = Matrix4.identity()
    m[1] = Math.tan(beta)
    return m
  }

  static skew (
    alpha: number, 
    beta: number
  ) {
    const m = Matrix4.identity()
    m[1] = Math.tan(beta)
    m[4] = Math.tan(alpha)
    return m
  }

  static fromList (m4: Iterable<number>) {
    return new Matrix4(...m4)
  }

  static fromBuffer (
    buffer: ArrayBuffer, 
    offset: number,
    length: number = 16
  ) {
    length ??= Math.floor((buffer.byteLength - offset) / Float64Array.BYTES_PER_ELEMENT)
    return Matrix4.fromList(new Float64Array(
      buffer,
      offset,
      length
    ))
  }
     
  static compose (translation: Vector3, rotation: Quaternion, scale: Vector3) {
    const mat = Matrix4.ZERO
    mat.setFromTranslationRotationScale(translation, rotation, scale)
    return mat
  }
  // => dimension
  get dimension () {
    return 4
  }

  // => row0
  get row0 () { 
    return this.row(0) 
  }
  set row0 (v4: Vector4) { 
    this.row(0, v4)
  }

  // => row1
  get row1 () { 
    return this.row(1) 
  }
  set row1 (arg: Vector4) { 
    this.row(1, arg)
  }

  // => row2
  get row2 () { 
    return this.row(2) 
  }
  set row2 (v4: Vector4) { 
    this.row(2, v4)
  }

  // => row3
  get row3 () { 
    return this.row(3) 
  }
  set row3 (v4: Vector4) { 
    this.row(3, v4)
  }

  // => right
  get right () {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    const vec = new Vector3(x, y, z)
    return vec
  }

  // => up
  get up () {
    const x = this[4]
    const y = this[5]
    const z = this[6]
    const vec = new Vector3(x, y, z)
    return vec
  }

  // => forward
  get forward () {
    const x = this[8]
    const y = this[9]
    const z = this[10]
    const vec = new Vector3(x, y, z)
    return vec
  }

  identity () {
    this[0] = 1
    this[1] = 0
    this[2] = 0
    this[3] = 0
    this[4] = 0
    this[5] = 1
    this[6] = 0
    this[7] = 0
    this[8] = 0
    this[9] = 0
    this[10] = 1
    this[11] = 0
    this[12] = 0
    this[13] = 0
    this[14] = 0
    this[15] = 1
  }

  /**
   * 
   * @param {number} row 
   * @param {number} col 
   * @returns 
   */
  index (row: number, col: number): number {
    return (col * 4) + row
  }

  /**
   * 
   * @param row 
   * @param col 
   */
  entry (row: number, col: number): number
  entry (row: number, col: number, v: number): number
  entry (row: number, col: number, v?: number | null): number | undefined {
    invariant((row >= 0) && (row < this.dimension), `The argument row cannot less than zero or gather than this.dimension`)
    invariant((col >= 0) && (col < this.dimension), `The argument col cannot less than zero or gather than this.dimension`)
    v ??= null
    if (v === null) {
      return this[this.index(row, col)]
    }

    this[this.index(row, col)] = v
  }

  /**
   * 
   * @param arg 
   */
  splatDiagonal (factor: number) {
    this[0] = factor
    this[5] = factor
    this[10] = factor
    this[15] = factor
  }

  /**
   * 
   * @param {number} arg0 
   * @param {number} arg1 
   * @param {number} arg2 
   * @param {number} arg3 
   * @param {number} arg4 
   * @param {number} arg5 
   * @param {number} arg6 
   * @param {number} arg7 
   * @param {number} arg8 
   * @param {number} arg9 
   * @param {number} arg10 
   * @param {number} arg11 
   * @param {number} arg12 
   * @param {number} arg13 
   * @param {number} arg14 
   * @param {number} arg15 
   */
  values (
    factor0: number,
    factor1: number,
    factor2: number,
    factor3: number,
    factor4: number,
    factor5: number,
    factor6: number,
    factor7: number,
    factor8: number,
    factor9: number,
    factor10: number,
    factor11: number,
    factor12: number,
    factor13: number,
    factor14: number,
    factor15: number
  ) {
    this[15] = factor15
    this[14] = factor14
    this[13] = factor13
    this[12] = factor12
    this[11] = factor11
    this[10] = factor10
    this[9] = factor9
    this[8] = factor8
    this[7] = factor7
    this[6] = factor6
    this[5] = factor5
    this[4] = factor4
    this[3] = factor3
    this[2] = factor2
    this[1] = factor1
    this[0] = factor0
  }

  columns (
    v0: Vector4, 
    v1: Vector4, 
    v2: Vector4, 
    v3: Vector4
  ) {
    this[0] = v0[0]
    this[1] = v0[1]
    this[2] = v0[2]
    this[3] = v0[3]
    this[4] = v1[0]
    this[5] = v1[1]
    this[6] = v1[2]
    this[7] = v1[3]
    this[8] = v2[0]
    this[9] = v2[1]
    this[10] = v2[2]
    this[11] = v2[3]
    this[12] = v3[0]
    this[13] = v3[1]
    this[14] = v3[2]
    this[15] = v3[3]
  }

  from (m4: Matrix4) {
    this[15] = m4[15]
    this[14] = m4[14]
    this[13] = m4[13]
    this[12] = m4[12]
    this[11] = m4[11]
    this[10] = m4[10]
    this[9] = m4[9]
    this[8] = m4[8]
    this[7] = m4[7]
    this[6] = m4[6]
    this[5] = m4[5]
    this[4] = m4[4]
    this[3] = m4[3]
    this[2] = m4[2]
    this[1] = m4[1]
    this[0] = m4[0]
  }

  setFromTranslationRotation (v3: Vector3, q: Quaternion) {
    const x = q[0]
    const y = q[1]
    const z = q[2]
    const w = q[3]
    const x2 = x + x
    const y2 = y + y
    const z2 = z + z
    const xx = x * x2
    const xy = x * y2
    const xz = x * z2
    const yy = y * y2
    const yz = y * z2
    const zz = z * z2
    const wx = w * x2
    const wy = w * y2
    const wz = w * z2

    this[0] = 1.0 - (yy + zz)
    this[1] = xy + wz
    this[2] = xz - wy
    this[3] = 0.0
    this[4] = xy - wz
    this[5] = 1.0 - (xx + zz)
    this[6] = yz + wx
    this[7] = 0.0
    this[8] = xz + wy
    this[9] = yz - wx
    this[10] = 1.0 - (xx + yy)
    this[11] = 0.0
    this[12] = v3[0]
    this[13] = v3[1]
    this[14] = v3[2]
    this[15] = 1.0
  }

  setFromTranslationRotationScale (
    translation: Vector3, 
    rotation: Quaternion, 
    scale: Vector3
  ) {
    this.setFromTranslationRotation(translation, rotation)
    this.scale(scale)
  }

  setUpper2x2 (m2: Matrix2) {
    this[0] = m2[0]
    this[1] = m2[1]
    this[4] = m2[2]
    this[5] = m2[3]
  }

  setDiagonal (v4: Vector4) {
    this[0] = v4[0]
    this[5] = v4[1]
    this[10] = v4[2]
    this[15] = v4[3]
  }

  outer (u: Vector4, v: Vector4) {
    this[0] = u[0] * v[0]
    this[1] = u[0] * v[1]
    this[2] = u[0] * v[2]
    this[3] = u[0] * v[3]
    this[4] = u[1] * v[0]
    this[5] = u[1] * v[1]
    this[6] = u[1] * v[2]
    this[7] = u[1] * v[3]
    this[8] = u[2] * v[0]
    this[9] = u[2] * v[1]
    this[10] = u[2] * v[2]
    this[11] = u[2] * v[3]
    this[12] = u[3] * v[0]
    this[13] = u[3] * v[1]
    this[14] = u[3] * v[2]
    this[15] = u[3] * v[3]
  }

  row (row: number): Vector4
  row (row: number, v4: Vector4): undefined
  row (row: number, v4?: Vector4 | null): Vector4 | undefined {
    v4 ??= null
    if (v4 === null) {
      const r = Vector4.ZERO
      r[0] = this[this.index(row, 0)]
      r[1] = this[this.index(row, 1)]
      r[2] = this[this.index(row, 2)]
      r[3] = this[this.index(row, 3)]
      return r
    }

    this[this.index(row, 0)] = v4[0]
    this[this.index(row, 1)] = v4[1]
    this[this.index(row, 2)] = v4[2]
    this[this.index(row, 3)] = v4[3]
  }

  column (column: number): Vector4
  column (column: number, v4: Vector4): undefined
  column (column: number, v4?: Vector4 | null): Vector4 | undefined {
    v4 ??= null

    if (v4 === null) {
      const r = Vector4.ZERO
      const entry = column * 4
      r[3] = this[entry + 3]
      r[2] = this[entry + 2]
      r[1] = this[entry + 1]
      r[0] = this[entry + 0]
      return r
    }

    const entry = column * 4
    this[entry + 3] = v4[3]
    this[entry + 2] = v4[2]
    this[entry + 1] = v4[1]
    this[entry + 0] = v4[0]
  }

  clone () {
    return Matrix4.copy(this)
  }

  copyInto (m4: Matrix4) {
    m4[15] = this[15]
    m4[0] = this[0]
    m4[1] = this[1]
    m4[2] = this[2]
    m4[3] = this[3]
    m4[4] = this[4]
    m4[5] = this[5]
    m4[6] = this[6]
    m4[7] = this[7]
    m4[8] = this[8]
    m4[9] = this[9]
    m4[10] = this[10]
    m4[11] = this[11]
    m4[12] = this[12]
    m4[13] = this[13]
    m4[14] = this[14]
    return m4
  }

  translate (x: Vector3 | Vector4 | number, y = 0, z = 0) {
    let tx: number
    let ty: number
    let tz: number
    const tw = x instanceof Vector4 ? x[3] : 1.0
    if (x instanceof Vector3) {
      tx = x[0]
      ty = x[1]
      tz = x[2]
    } else if (x instanceof Vector4) {
      tx = x[0]
      ty = x[1]
      tz = x[2]
    } else if (typeof x === 'number') {
      tx = x
      ty = y
      tz = z
    } else {
      throw new UnimplementedError()
    }
    const t1 = this[0] * tx + this[4] * ty + this[8] * tz + this[12] * tw
    const t2 = this[1] * tx + this[5] * ty + this[9] * tz + this[13] * tw
    const t3 = this[2] * tx + this[6] * ty + this[10] * tz + this[14] * tw
    const t4 = this[3] * tx + this[7] * ty + this[11] * tz + this[15] * tw
    this[12] = t1
    this[13] = t2
    this[14] = t3
    this[15] = t4
  }

  leftTranslate (
    x: number | Vector3 | Vector4, 
    y = 0.0, 
    z = 0.0
  ) {
    let tx: number
    let ty: number
    let tz: number
    const tw = x instanceof Vector4 ? x[3] : 1.0
    if (x instanceof Vector3) {
      tx = x[0]
      ty = x[1]
      tz = x[2]
    } else if (x instanceof Vector4) {
      tx = x[0]
      ty = x[1]
      tz = x[2]
    } else if (typeof x === 'number') {
      tx = x
      ty = y
      tz = z
    } else {
      throw new UnimplementedError()
    }

    this[0] += tx * this[3]
    this[1] += ty * this[3]
    this[2] += tz * this[3]
    this[3] = tw * this[3]

    this[4] += tx * this[7]
    this[5] += ty * this[7]
    this[6] += tz * this[7]
    this[7] = tw * this[7]

    this[8] += tx * this[11]
    this[9] += ty * this[11]
    this[10] += tz * this[11]
    this[11] = tw * this[11]

    this[12] += tx * this[15]
    this[13] += ty * this[15]
    this[14] += tz * this[15]
    this[15] = tw * this[15]
  }

  rotate (axis: Vector3, angle: number) {
    const len = axis.length
    const x = axis[0] / len
    const y = axis[1] / len
    const z = axis[2] / len
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const C = 1.0 - c
    const m11 = x * x * C + c
    const m12 = x * y * C - z * s
    const m13 = x * z * C + y * s
    const m21 = y * x * C + z * s
    const m22 = y * y * C + c
    const m23 = y * z * C - x * s
    const m31 = z * x * C - y * s
    const m32 = z * y * C + x * s
    const m33 = z * z * C + c
    const t1 = this[0] * m11 + this[4] * m21 + this[8] * m31
    const t2 = this[1] * m11 + this[5] * m21 + this[9] * m31
    const t3 = this[2] * m11 + this[6] * m21 + this[10] * m31
    const t4 = this[3] * m11 + this[7] * m21 + this[11] * m31
    const t5 = this[0] * m12 + this[4] * m22 + this[8] * m32
    const t6 = this[1] * m12 + this[5] * m22 + this[9] * m32
    const t7 = this[2] * m12 + this[6] * m22 + this[10] * m32
    const t8 = this[3] * m12 + this[7] * m22 + this[11] * m32
    const t9 = this[0] * m13 + this[4] * m23 + this[8] * m33
    const t10 = this[1] * m13 + this[5] * m23 + this[9] * m33
    const t11 = this[2] * m13 + this[6] * m23 + this[10] * m33
    const t12 = this[3] * m13 + this[7] * m23 + this[11] * m33
    this[0] = t1
    this[1] = t2
    this[2] = t3
    this[3] = t4
    this[4] = t5
    this[5] = t6
    this[6] = t7
    this[7] = t8
    this[8] = t9
    this[9] = t10
    this[10] = t11
    this[11] = t12
  }

  rotateX (angle: number) {
    const cosAngle = Math.cos(angle)
    const sinAngle = Math.sin(angle)
    const t1 = this[4] * cosAngle + this[8] * sinAngle
    const t2 = this[5] * cosAngle + this[9] * sinAngle
    const t3 = this[6] * cosAngle + this[10] * sinAngle
    const t4 = this[7] * cosAngle + this[11] * sinAngle
    const t5 = this[4] * -sinAngle + this[8] * cosAngle
    const t6 = this[5] * -sinAngle + this[9] * cosAngle
    const t7 = this[6] * -sinAngle + this[10] * cosAngle
    const t8 = this[7] * -sinAngle + this[11] * cosAngle
    this[4] = t1
    this[5] = t2
    this[6] = t3
    this[7] = t4
    this[8] = t5
    this[9] = t6
    this[10] = t7
    this[11] = t8
  }

  rotateY (angle: number) {
    const cosAngle = Math.cos(angle)
    const sinAngle = Math.sin(angle)
    const t1 = this[0] * cosAngle + this[8] * -sinAngle
    const t2 = this[1] * cosAngle + this[9] * -sinAngle
    const t3 = this[2] * cosAngle + this[10] * -sinAngle
    const t4 = this[3] * cosAngle + this[11] * -sinAngle
    const t5 = this[0] * sinAngle + this[8] * cosAngle
    const t6 = this[1] * sinAngle + this[9] * cosAngle
    const t7 = this[2] * sinAngle + this[10] * cosAngle
    const t8 = this[3] * sinAngle + this[11] * cosAngle
    this[0] = t1
    this[1] = t2
    this[2] = t3
    this[3] = t4
    this[8] = t5
    this[9] = t6
    this[10] = t7
    this[11] = t8
  }

  rotateZ (angle: number) {
    const cosAngle = Math.cos(angle)
    const sinAngle = Math.sin(angle)
    const t1 = this[0] * cosAngle + this[4] * sinAngle
    const t2 = this[1] * cosAngle + this[5] * sinAngle
    const t3 = this[2] * cosAngle + this[6] * sinAngle
    const t4 = this[3] * cosAngle + this[7] * sinAngle
    const t5 = this[0] * -sinAngle + this[4] * cosAngle
    const t6 = this[1] * -sinAngle + this[5] * cosAngle
    const t7 = this[2] * -sinAngle + this[6] * cosAngle
    const t8 = this[3] * -sinAngle + this[7] * cosAngle
    this[0] = t1
    this[1] = t2
    this[2] = t3
    this[3] = t4
    this[4] = t5
    this[5] = t6
    this[6] = t7
    this[7] = t8
  }

  scale (
    x: number | Vector3 | Vector4, 
    y?: number | null, 
    z?: number | null
  ) {
    y = y ?? null
    z = z ?? null
    let sx: number
    let sy: number
    let sz: number
    const sw = x instanceof Vector4 ? x[3] : 1.0
    if (x instanceof Vector3) {
      sx = x[0]
      sy = x[1]
      sz = x[2]
    } else if (x instanceof Vector4) {
      sx = x[0]
      sy = x[1]
      sz = x[2]
    } else if (typeof x === 'number') {
      sx = x
      sy = y ?? x
      sz = z ?? x
    } else {
      throw new UnimplementedError()
    }
    this[0] *= sx
    this[1] *= sx
    this[2] *= sx
    this[3] *= sx
    this[4] *= sy
    this[5] *= sy
    this[6] *= sy
    this[7] *= sy
    this[8] *= sz
    this[9] *= sz
    this[10] *= sz
    this[11] *= sz
    this[12] *= sw
    this[13] *= sw
    this[14] *= sw
    this[15] *= sw
  }

  scaled (
    x: number | Vector4 | Vector3, 
    y?: number, 
    z?: number
  ) {
    const m = this.clone()
    m.scale(x, y, z)
    return m
  }

  setZero () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
    this[4] = 0.0
    this[5] = 0.0
    this[6] = 0.0
    this[7] = 0.0
    this[8] = 0.0
    this[9] = 0.0
    this[10] = 0.0
    this[11] = 0.0
    this[12] = 0.0
    this[13] = 0.0
    this[14] = 0.0
    this[15] = 0.0
  }

  setIdentity () {
    this[0] = 1
    this[1] = 0
    this[2] = 0
    this[3] = 0
    this[4] = 0
    this[5] = 1
    this[6] = 0
    this[7] = 0
    this[8] = 0
    this[9] = 0
    this[10] = 1
    this[11] = 0
    this[12] = 0
    this[13] = 0
    this[14] = 0
    this[15] = 1
  }

  transposed () {
    const m = this.clone()
    m.transpose()
    return m
  }

  transpose () {
    let temp
    temp = this[4]
    this[4] = this[1]
    this[1] = temp
    temp = this[8]
    this[8] = this[2]
    this[2] = temp
    temp = this[12]
    this[12] = this[3]
    this[3] = temp
    temp = this[9]
    this[9] = this[6]
    this[6] = temp
    temp = this[13]
    this[13] = this[7]
    this[7] = temp
    temp = this[14]
    this[14] = this[11]
    this[11] = temp
  }

  absolute () {
    const r = Matrix4.ZERO
    r[0] = Math.abs(this[0])
    r[1] = Math.abs(this[1])
    r[2] = Math.abs(this[2])
    r[3] = Math.abs(this[3])
    r[4] = Math.abs(this[4])
    r[5] = Math.abs(this[5])
    r[6] = Math.abs(this[6])
    r[7] = Math.abs(this[7])
    r[8] = Math.abs(this[8])
    r[9] = Math.abs(this[9])
    r[10] = Math.abs(this[10])
    r[11] = Math.abs(this[11])
    r[12] = Math.abs(this[12])
    r[13] = Math.abs(this[13])
    r[14] = Math.abs(this[14])
    r[15] = Math.abs(this[15])
    return r
  }

  determinant () {
    const det2_01_01 = this[0] * this[5] - this[1] * this[4]
    const det2_01_02 = this[0] * this[6] - this[2] * this[4]
    const det2_01_03 = this[0] * this[7] - this[3] * this[4]
    const det2_01_12 = this[1] * this[6] - this[2] * this[5]
    const det2_01_13 = this[1] * this[7] - this[3] * this[5]
    const det2_01_23 = this[2] * this[7] - this[3] * this[6]
    const det3_201_012 = this[8] * det2_01_12 - this[9] * det2_01_02 + this[10] * det2_01_01
    const det3_201_013 = this[8] * det2_01_13 - this[9] * det2_01_03 + this[11] * det2_01_01
    const det3_201_023 = this[8] * det2_01_23 - this[10] * det2_01_03 + this[11] * det2_01_02
    const det3_201_123 = this[9] * det2_01_23 - this[10] * det2_01_13 + this[11] * det2_01_12
    return -det3_201_123 * this[12] + det3_201_023 * this[13] - det3_201_013 * this[14] + det3_201_012 * this[15]
  }

  dotRow (i: number, v: Vector4) {
    return (
      this[i] * v[0] +
      this[4 + i] * v[1] +
      this[8 + i] * v[2] +
      this[12 + i] * v[3]
    )
  }

  dotColumn (j: number, v: Vector4) {
    return (
      this[j * 4] * v[0] +
      this[j * 4 + 1] * v[1] +
      this[j * 4 + 2] * v[2] +
      this[j * 4 + 3] * v[3]
    )
  }

  trace () {
    let t = 0.0
    t += this[0]
    t += this[5]
    t += this[10]
    t += this[15]
    return t
  }

  infinityNorm () {
    let norm = 0.0
    {
      let rowNorm = 0.0
      rowNorm += Math.abs(this[0])
      rowNorm += Math.abs(this[1])
      rowNorm += Math.abs(this[2])
      rowNorm += Math.abs(this[3])
      norm = rowNorm > norm ? rowNorm : norm
    }
    {
      let rowNorm = 0.0
      rowNorm += Math.abs(this[4])
      rowNorm += Math.abs(this[5])
      rowNorm += Math.abs(this[6])
      rowNorm += Math.abs(this[7])
      norm = rowNorm > norm ? rowNorm : norm
    }
    {
      let rowNorm = 0.0
      rowNorm += Math.abs(this[8])
      rowNorm += Math.abs(this[9])
      rowNorm += Math.abs(this[10])
      rowNorm += Math.abs(this[11])
      norm = rowNorm > norm ? rowNorm : norm
    }
    {
      let rowNorm = 0.0
      rowNorm += Math.abs(this[12])
      rowNorm += Math.abs(this[13])
      rowNorm += Math.abs(this[14])
      rowNorm += Math.abs(this[15])
      norm = rowNorm > norm ? rowNorm : norm
    }
    return norm
  }

  relativeError (correct: Matrix4) {
    const diff = correct.clone() 
    diff.substract(this)
    const correctNorm = correct.infinityNorm()
    const diffNorm = diff.infinityNorm()
    return diffNorm / correctNorm
  }

  absoluteError (correct: Matrix4) {
    const thisNorm = this.infinityNorm()
    const correctNorm = correct.infinityNorm()
    const diffNorm = Math.abs((thisNorm - correctNorm))
    return diffNorm
  }

  getTranslation () {
    const z = this[14]
    const y = this[13]
    const x = this[12]
    const vec = new Vector3()
    vec.values(x, y, z)
    return vec
  }

  setTranslation (t: Vector3) {
    const z = t[2]
    const y = t[1]
    const x = t[0]
    this[14] = z
    this[13] = y
    this[12] = x
  }

  setTranslationRaw (x: number, y: number, z: number) {
    this[14] = z
    this[13] = y
    this[12] = x
  }

  getRotation () {
    const r = Matrix3.ZERO
    this.copyRotation(r)
    return r
  }

  copyRotation (r: Matrix3) {
    r[0] = this[0]
    r[1] = this[1]
    r[2] = this[2]
    r[3] = this[4]
    r[4] = this[5]
    r[5] = this[6]
    r[6] = this[8]
    r[7] = this[9]
    r[8] = this[10]
  }

  setRotation (r: Matrix3) {
    this[0] = r[0]
    this[1] = r[1]
    this[2] = r[2]
    this[4] = r[3]
    this[5] = r[4]
    this[6] = r[5]
    this[8] = r[6]
    this[9] = r[7]
    this[10] = r[8]
  }

  getNormalMatrix () {
    const mat = Matrix3.identity()
    mat.copyNormalMatrix(this)
    return 
  }

  getMaxScaleOnAxis () {
    const scaleXSq = this[0] * this[0] + this[1] * this[1] + this[2] * this[2]
    const scaleYSq = this[4] * this[4] + this[5] * this[5] + this[6] * this[6]
    const scaleZSq = this[8] * this[8] + this[9] * this[9] + this[10] * this[10]
    return Math.sqrt(Math.max(scaleXSq, Math.max(scaleYSq, scaleZSq)))
  }

  transposeRotation () {
    let temp
    temp = this[1]
    this[1] = this[4]
    this[4] = temp
    temp = this[2]
    this[2] = this[8]
    this[8] = temp
    temp = this[4]
    this[4] = this[1]
    this[1] = temp
    temp = this[6]
    this[6] = this[9]
    this[9] = temp
    temp = this[8]
    this[8] = this[2]
    this[2] = temp
    temp = this[9]
    this[9] = this[6]
    this[6] = temp
  }

  invert () {
    return this.copyInverse(this)
  }

  copyInverse (m: Matrix4) {
    const a01 = m[1]
    const a00 = m[0]
    const a02 = m[2]
    const a03 = m[3]
    const a10 = m[4]
    const a11 = m[5]
    const a12 = m[6]
    const a13 = m[7]
    const a20 = m[8]
    const a21 = m[9]
    const a22 = m[10]
    const a23 = m[11]
    const a30 = m[12]
    const a31 = m[13]
    const a32 = m[14]
    const a33 = m[15]
    const b00 = a00 * a11 - a01 * a10
    const b01 = a00 * a12 - a02 * a10
    const b02 = a00 * a13 - a03 * a10
    const b03 = a01 * a12 - a02 * a11
    const b04 = a01 * a13 - a03 * a11
    const b05 = a02 * a13 - a03 * a12
    const b06 = a20 * a31 - a21 * a30
    const b07 = a20 * a32 - a22 * a30
    const b08 = a20 * a33 - a23 * a30
    const b09 = a21 * a32 - a22 * a31
    const b10 = a21 * a33 - a23 * a31
    const b11 = a22 * a33 - a23 * a32
    const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
    if (det === 0.0) {
      this.from(m)
      return 0.0
    }
    const invDet = 1.0 / det
    this[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet
    this[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet
    this[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet
    this[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet
    this[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet
    this[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet
    this[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet
    this[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet
    this[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet
    this[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet
    this[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet
    this[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet
    this[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet
    this[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet
    this[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet
    this[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet
    return det
  }

  invertRotation () {
    const det = this.determinant()
    if (det === 0) {
      return 0
    }
    const invDet = 1.0 / det
    let ix: number
    let iy: number
    let iz: number
    let jx: number
    let jy: number
    let jz: number
    let kx: number
    let ky: number
    let kz: number
    ix = invDet * (this[5] * this[10] - this[6] * this[9])
    iy = invDet * (this[2] * this[9] - this[1] * this[10])
    iz = invDet * (this[1] * this[6] - this[2] * this[5])
    jx = invDet * (this[6] * this[8] - this[4] * this[10])
    jy = invDet * (this[0] * this[10] - this[2] * this[8])
    jz = invDet * (this[2] * this[4] - this[0] * this[6])
    kx = invDet * (this[4] * this[9] - this[5] * this[8])
    ky = invDet * (this[1] * this[8] - this[0] * this[9])
    kz = invDet * (this[0] * this[5] - this[1] * this[4])
    this[0] = ix
    this[1] = iy
    this[2] = iz
    this[4] = jx
    this[5] = jy
    this[6] = jz
    this[8] = kx
    this[9] = ky
    this[10] = kz
    return det
  }

  setRotationX (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = 1.0
    this[1] = 0.0
    this[2] = 0.0
    this[4] = 0.0
    this[5] = c
    this[6] = s
    this[8] = 0.0
    this[9] = -s
    this[10] = c
    this[3] = 0.0
    this[7] = 0.0
    this[11] = 0.0
  }

  setRotationY (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = c
    this[1] = 0.0
    this[2] = -s
    this[4] = 0.0
    this[5] = 1.0
    this[6] = 0.0
    this[8] = s
    this[9] = 0.0
    this[10] = c
    this[3] = 0.0
    this[7] = 0.0
    this[11] = 0.0
  }

  setRotationZ (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = c
    this[1] = s
    this[2] = 0.0
    this[4] = -s
    this[5] = c
    this[6] = 0.0
    this[8] = 0.0
    this[9] = 0.0
    this[10] = 1.0
    this[3] = 0.0
    this[7] = 0.0
    this[11] = 0.0
  }

  setFromRotation (rotationMatrix: Matrix3) {
    const trace = rotationMatrix.trace()
    if (trace > 0.0) {
      let s = Math.sqrt(trace + 1.0)
      this[3] = s * 0.5
      s = 0.5 / s
      this[0] = (rotationMatrix[5] - rotationMatrix[7]) * s
      this[1] = (rotationMatrix[6] - rotationMatrix[2]) * s
      this[2] = (rotationMatrix[1] - rotationMatrix[3]) * s
    } else {
      const i = rotationMatrix[0] < rotationMatrix[4]
          ? (rotationMatrix[4] < rotationMatrix[8] ? 2 : 1)
          : (rotationMatrix[0] < rotationMatrix[8] ? 2 : 0)
      const j = (i + 1) % 3
      const k = (i + 2) % 3
      let s = Math.sqrt(
        rotationMatrix[rotationMatrix.index(i, i)] -
        rotationMatrix[rotationMatrix.index(j, j)] -
        rotationMatrix[rotationMatrix.index(k, k)] + 1.0
      )
      this[i] = s * 0.5
      s = 0.5 / s
      this[3] = (
        rotationMatrix[rotationMatrix.index(k, j)] -
        rotationMatrix[rotationMatrix.index(j, k)]
      ) * s
      this[j] = (
        rotationMatrix[rotationMatrix.index(j, i)] +
        rotationMatrix[rotationMatrix.index(i, j)]
      ) * s
      this[k] = (
        rotationMatrix[rotationMatrix.index(k, i)] +
        rotationMatrix[rotationMatrix.index(i, k)]
      ) * s
    }
  }

  scaleAdjoint (scale: number) {
    const a1 = this[0]
    const b1 = this[4]
    const c1 = this[8]
    const d1 = this[12]
    const a2 = this[1]
    const b2 = this[5]
    const c2 = this[9]
    const d2 = this[13]
    const a3 = this[2]
    const b3 = this[6]
    const c3 = this[10]
    const d3 = this[14]
    const a4 = this[3]
    const b4 = this[7]
    const c4 = this[11]
    const d4 = this[15]
    this[0] = (
      b2 * (c3 * d4 - c4 * d3) -
      c2 * (b3 * d4 - b4 * d3) +
      d2 * (b3 * c4 - b4 * c3)
    ) * scale
    this[1] = -(
      a2 * (c3 * d4 - c4 * d3) -
      c2 * (a3 * d4 - a4 * d3) +
      d2 * (a3 * c4 - a4 * c3)
    ) * scale
    this[2] = (
      a2 * (b3 * d4 - b4 * d3) -
      b2 * (a3 * d4 - a4 * d3) +
      d2 * (a3 * b4 - a4 * b3)
    ) * scale
    this[3] = -(
      a2 * (b3 * c4 - b4 * c3) -
      b2 * (a3 * c4 - a4 * c3) +
      c2 * (a3 * b4 - a4 * b3)
    ) * scale
    this[4] = -(
      b1 * (c3 * d4 - c4 * d3) -
      c1 * (b3 * d4 - b4 * d3) +
      d1 * (b3 * c4 - b4 * c3)
    ) * scale
    this[5] = (
      a1 * (c3 * d4 - c4 * d3) -
      c1 * (a3 * d4 - a4 * d3) +
      d1 * (a3 * c4 - a4 * c3)
    ) * scale
    this[6] = -(
      a1 * (b3 * d4 - b4 * d3) -
      b1 * (a3 * d4 - a4 * d3) +
      d1 * (a3 * b4 - a4 * b3)
    ) * scale
    this[7] = (
      a1 * (b3 * c4 - b4 * c3) -
      b1 * (a3 * c4 - a4 * c3) +
      c1 * (a3 * b4 - a4 * b3)
    ) * scale
    this[8] = (
      b1 * (c2 * d4 - c4 * d2) -
      c1 * (b2 * d4 - b4 * d2) +
      d1 * (b2 * c4 - b4 * c2)
    ) * scale
    this[9] = -(
      a1 * (c2 * d4 - c4 * d2) -
      c1 * (a2 * d4 - a4 * d2) +
      d1 * (a2 * c4 - a4 * c2)
    ) * scale
    this[10] = (
      a1 * (b2 * d4 - b4 * d2) -
      b1 * (a2 * d4 - a4 * d2) +
      d1 * (a2 * b4 - a4 * b2)
    ) * scale
    this[11] = -(
      a1 * (b2 * c4 - b4 * c2) -
      b1 * (a2 * c4 - a4 * c2) +
      c1 * (a2 * b4 - a4 * b2)
    ) * scale
    this[12] = -(
      b1 * (c2 * d3 - c3 * d2) -
      c1 * (b2 * d3 - b3 * d2) +
      d1 * (b2 * c3 - b3 * c2)
    ) * scale
    this[13] = (
      a1 * (c2 * d3 - c3 * d2) -
      c1 * (a2 * d3 - a3 * d2) +
      d1 * (a2 * c3 - a3 * c2)
    ) * scale
    this[14] = -(a1 * (b2 * d3 - b3 * d2) -
      b1 * (a2 * d3 - a3 * d2) +
      d1 * (a2 * b3 - a3 * b2)
    ) * scale
    this[15] = (
      a1 * (b2 * c3 - b3 * c2) -
      b1 * (a2 * c3 - a3 * c2) +
      c1 * (a2 * b3 - a3 * b2)
    ) * scale
  }

  absoluteRotate (arg: Vector3) {
    const m00 = Math.abs(this[0])
    const m01 = Math.abs(this[4])
    const m02 = Math.abs(this[8])
    const m10 = Math.abs(this[1])
    const m11 = Math.abs(this[5])
    const m12 = Math.abs(this[9])
    const m20 = Math.abs(this[2])
    const m21 = Math.abs(this[6])
    const m22 = Math.abs(this[10])
    const x = arg[0]
    const y = arg[1]
    const z = arg[2]
    arg[0] = x * m00 + y * m01 + z * m02 + 0.0 * 0.0
    arg[1] = x * m10 + y * m11 + z * m12 + 0.0 * 0.0
    arg[2] = x * m20 + y * m21 + z * m22 + 0.0 * 0.0
    return arg
  }

  add (o: Matrix4) {
    this[0] = this[0] + o[0]
    this[1] = this[1] + o[1]
    this[2] = this[2] + o[2]
    this[3] = this[3] + o[3]
    this[4] = this[4] + o[4]
    this[5] = this[5] + o[5]
    this[6] = this[6] + o[6]
    this[7] = this[7] + o[7]
    this[8] = this[8] + o[8]
    this[9] = this[9] + o[9]
    this[10] = this[10] + o[10]
    this[11] = this[11] + o[11]
    this[12] = this[12] + o[12]
    this[13] = this[13] + o[13]
    this[14] = this[14] + o[14]
    this[15] = this[15] + o[15]
  }

  substract (o: Matrix4) {
    this[0] = this[0] - o[0]
    this[1] = this[1] - o[1]
    this[2] = this[2] - o[2]
    this[3] = this[3] - o[3]
    this[4] = this[4] - o[4]
    this[5] = this[5] - o[5]
    this[6] = this[6] - o[6]
    this[7] = this[7] - o[7]
    this[8] = this[8] - o[8]
    this[9] = this[9] - o[9]
    this[10] = this[10] - o[10]
    this[11] = this[11] - o[11]
    this[12] = this[12] - o[12]
    this[13] = this[13] - o[13]
    this[14] = this[14] - o[14]
    this[15] = this[15] - o[15]
  }


  inverse () {
    this[0] = -this[0]
    this[1] = -this[1]
    this[2] = -this[2]
    this[3] = -this[3]
    this[4] = -this[4]
    this[5] = -this[5]
    this[6] = -this[6]
    this[7] = -this[7]
    this[8] = -this[8]
    this[9] = -this[9]
    this[10] = -this[10]
    this[11] = -this[11]
    this[12] = -this[12]
    this[13] = -this[13]
    this[14] = -this[14]
    this[15] = -this[15]
  }

  multiply(arg: Matrix4) {
    const m00 = this[0]
    const m01 = this[4]
    const m02 = this[8]
    const m03 = this[12]
    const m10 = this[1]
    const m11 = this[5]
    const m12 = this[9]
    const m13 = this[13]
    const m20 = this[2]
    const m21 = this[6]
    const m22 = this[10]
    const m23 = this[14]
    const m30 = this[3]
    const m31 = this[7]
    const m32 = this[11]
    const m33 = this[15]
    const n00 = arg[0]
    const n01 = arg[4]
    const n02 = arg[8]
    const n03 = arg[12]
    const n10 = arg[1]
    const n11 = arg[5]
    const n12 = arg[9]
    const n13 = arg[13]
    const n20 = arg[2]
    const n21 = arg[6]
    const n22 = arg[10]
    const n23 = arg[14]
    const n30 = arg[3]
    const n31 = arg[7]
    const n32 = arg[11]
    const n33 = arg[15]
    this[0] = (m00 * n00) + (m01 * n10) + (m02 * n20) + (m03 * n30)
    this[4] = (m00 * n01) + (m01 * n11) + (m02 * n21) + (m03 * n31)
    this[8] = (m00 * n02) + (m01 * n12) + (m02 * n22) + (m03 * n32)
    this[12] = (m00 * n03) + (m01 * n13) + (m02 * n23) + (m03 * n33)
    this[1] = (m10 * n00) + (m11 * n10) + (m12 * n20) + (m13 * n30)
    this[5] = (m10 * n01) + (m11 * n11) + (m12 * n21) + (m13 * n31)
    this[9] = (m10 * n02) + (m11 * n12) + (m12 * n22) + (m13 * n32)
    this[13] = (m10 * n03) + (m11 * n13) + (m12 * n23) + (m13 * n33)
    this[2] = (m20 * n00) + (m21 * n10) + (m22 * n20) + (m23 * n30)
    this[6] = (m20 * n01) + (m21 * n11) + (m22 * n21) + (m23 * n31)
    this[10] = (m20 * n02) + (m21 * n12) + (m22 * n22) + (m23 * n32)
    this[14] = (m20 * n03) + (m21 * n13) + (m22 * n23) + (m23 * n33)
    this[3] = (m30 * n00) + (m31 * n10) + (m32 * n20) + (m33 * n30)
    this[7] = (m30 * n01) + (m31 * n11) + (m32 * n21) + (m33 * n31)
    this[11] = (m30 * n02) + (m31 * n12) + (m32 * n22) + (m33 * n32)
    this[15] = (m30 * n03) + (m31 * n13) + (m32 * n23) + (m33 * n33)
  }

  multiplied (arg: Matrix4) {
    const mat = this.clone()
    mat.multiply(arg)
    return mat
  }

  transposeMultiply (arg: Matrix4) {
    const m00 = this[0]
    const m01 = this[1]
    const m02 = this[2]
    const m03 = this[3]
    const m10 = this[4]
    const m11 = this[5]
    const m12 = this[6]
    const m13 = this[7]
    const m20 = this[8]
    const m21 = this[9]
    const m22 = this[10]
    const m23 = this[11]
    const m30 = this[12]
    const m31 = this[13]
    const m32 = this[14]
    const m33 = this[15]
    this[0] = (m00 * arg[0]) + (m01 * arg[1]) + (m02 * arg[2]) + (m03 * arg[3])
    this[4] = (m00 * arg[4]) + (m01 * arg[5]) + (m02 * arg[6]) + (m03 * arg[7])
    this[8] = (m00 * arg[8]) + (m01 * arg[9]) + (m02 * arg[10]) + (m03 * arg[11])
    this[12] = (m00 * arg[12]) + (m01 * arg[13]) + (m02 * arg[14]) + (m03 * arg[15])
    this[1] = (m10 * arg[0]) + (m11 * arg[1]) + (m12 * arg[2]) + (m13 * arg[3])
    this[5] = (m10 * arg[4]) + (m11 * arg[5]) + (m12 * arg[6]) + (m13 * arg[7])
    this[9] = (m10 * arg[8]) + (m11 * arg[9]) + (m12 * arg[10]) + (m13 * arg[11])
    this[13] = (m10 * arg[12]) + (m11 * arg[13]) + (m12 * arg[14]) + (m13 * arg[15])
    this[2] = (m20 * arg[0]) + (m21 * arg[1]) + (m22 * arg[2]) + (m23 * arg[3])
    this[6] = (m20 * arg[4]) + (m21 * arg[5]) + (m22 * arg[6]) + (m23 * arg[7])
    this[10] = (m20 * arg[8]) + (m21 * arg[9]) + (m22 * arg[10]) + (m23 * arg[11])
    this[14] = (m20 * arg[12]) + (m21 * arg[13]) + (m22 * arg[14]) + (m23 * arg[15])
    this[3] = (m30 * arg[0]) + (m31 * arg[1]) + (m32 * arg[2]) + (m33 * arg[3])
    this[7] = (m30 * arg[4]) + (m31 * arg[5]) + (m32 * arg[6]) + (m33 * arg[7])
    this[11] = (m30 * arg[8]) + (m31 * arg[9]) + (m32 * arg[10]) + (m33 * arg[11])
    this[15] = (m30 * arg[12]) + (m31 * arg[13]) + (m32 * arg[14]) + (m33 * arg[15])
  }

  multiplyTranspose (m: Matrix4) {
    const m00 = this[0]
    const m01 = this[4]
    const m02 = this[8]
    const m03 = this[12]
    const m10 = this[1]
    const m11 = this[5]
    const m12 = this[9]
    const m13 = this[13]
    const m20 = this[2]
    const m21 = this[6]
    const m22 = this[10]
    const m23 = this[14]
    const m30 = this[3]
    const m31 = this[7]
    const m32 = this[11]
    const m33 = this[15]
    this[0] = (
      (m00 * m[0]) +
      (m01 * m[4]) +
      (m02 * m[8]) +
      (m03 * m[12])
    )
    this[4] = (
      (m00 * m[1]) +
      (m01 * m[5]) +
      (m02 * m[9]) +
      (m03 * m[13])
    )
    this[8] = (
      (m00 * m[2]) +
      (m01 * m[6]) +
      (m02 * m[10]) +
      (m03 * m[14])
    )
    this[12] =( 
      (m00 * m[3]) +
      (m01 * m[7]) +
      (m02 * m[11]) +
      (m03 * m[15])
    )
    this[1] = (
      (m10 * m[0]) +
      (m11 * m[4]) +
      (m12 * m[8]) +
      (m13 * m[12])
    )
    this[5] = (
      (m10 * m[1]) +
      (m11 * m[5]) +
      (m12 * m[9]) +
      (m13 * m[13])
    )
    this[9] = (
      (m10 * m[2]) +
      (m11 * m[6]) +
      (m12 * m[10]) +
      (m13 * m[14])
    )
    this[13] =( 
      (m10 * m[3]) +
      (m11 * m[7]) +
      (m12 * m[11]) +
      (m13 * m[15])
    )
    this[2] = (
      (m20 * m[0]) +
      (m21 * m[4]) +
      (m22 * m[8]) +
      (m23 * m[12])
    )
    this[6] = (
      (m20 * m[1]) +
      (m21 * m[5]) +
      (m22 * m[9]) +
      (m23 * m[13])
    )
    this[10] =( 
      (m20 * m[2]) +
      (m21 * m[6]) +
      (m22 * m[10]) +
      (m23 * m[14])
    )
    this[14] =( 
      (m20 * m[3]) +
      (m21 * m[7]) +
      (m22 * m[11]) +
      (m23 * m[15])
    )
    this[3] = (
      (m30 * m[0]) +
      (m31 * m[4]) +
      (m32 * m[8]) +
      (m33 * m[12])
    )
    this[7] = (
      (m30 * m[1]) +
      (m31 * m[5]) +
      (m32 * m[9]) +
      (m33 * m[13])
    )
    this[11] =( 
      (m30 * m[2]) +
      (m31 * m[6]) +
      (m32 * m[10]) +
      (m33 * m[14])
    )
    this[15] =( 
      (m30 * m[3]) +
      (m31 * m[7]) +
      (m32 * m[11]) +
      (m33 * m[15])
    )
  }

  /**
   * 
   * @param {Vector3} translation 
   * @param {Quaternion} rotation 
   * @param {Vector3} scale 
   */
  decompose (
    translation: Vector3, 
    rotation: Quaternion, 
    scale: Vector3
  ) {
    const v = Matrix4.decomposeV ??= Vector3.ZERO
    v.values(this[0], this[1], this[2])
    let sx = v.length

    v.values(this[4], this[5], this[6])
    const sy = v.length

    v.values(this[8], this[9], this[10])
    const sz = v.length

    if (this.determinant() < 0) {
      sx = -sx
    }

    translation[0] = this[12]
    translation[1] = this[13]
    translation[2] = this[14]

    const invSX = 1.0 / sx
    const invSY = 1.0 / sy
    const invSZ = 1.0 / sz

    const m = Matrix4.decomposeM ??= Matrix4.ZERO
    m.from(this)
    m[0] *= invSX
    m[1] *= invSX
    m[2] *= invSX
    m[4] *= invSY
    m[5] *= invSY
    m[6] *= invSY
    m[8] *= invSZ
    m[9] *= invSZ
    m[10] *= invSZ

    const r = Matrix4.decomposeR ??= Matrix3.ZERO
    m.copyRotation(r)
    rotation.setFromRotation(r)

    scale[0] = sx
    scale[1] = sy
    scale[2] = sz
  }

  rotate3 (arg: Vector3) {
    const x1 = (this[0] * arg[0]) + (this[4] * arg[1]) + (this[8] * arg[2])
    const y1 = (this[1] * arg[0]) + (this[5] * arg[1]) + (this[9] * arg[2])
    const z1 = (this[2] * arg[0]) + (this[6] * arg[1]) + (this[10] * arg[2])
    arg[0] = x1
    arg[1] = y1
    arg[2] = z1
    return arg
  }

  rotated3 (v3: Vector3, out?: Vector3 | null) {
    out = out ?? null
    if (out === null) {
      out = Vector3.copy(v3)
    } else {
      out.from(v3)
    }
    return this.rotate3(out)
  }

  transform3 (arg: Vector3) {
    const x1 = (this[0] * arg[0]) + (this[4] * arg[1]) + (this[8] * arg[2]) + this[12]
    const y1 = (this[1] * arg[0]) + (this[5] * arg[1]) + (this[9] * arg[2]) + this[13]
    const z1 = (this[2] * arg[0]) + (this[6] * arg[1]) + (this[10] * arg[2]) + this[14]
    arg[0] = x1
    arg[1] = y1
    arg[2] = z1
    return arg
  }
  /**
   * @description: 
   * @param {Vector3} arg
   * @param {Vector3} out
   * @return {*}
   */
  transformed3 (v3: Vector3, out?: Vector3 | null) {
    out = out ?? null
    if (out === null) {
      out = Vector3.copy(v3)
    } else {
      out.from(v3)
    }
    return this.transform3(out)
  }

  transform (arg: Vector4) {
    const x1 = (this[0] * arg[0]) + (this[4] * arg[1]) + (this[8] * arg[2]) + (this[12] * arg[3])
    const y1 = (this[1] * arg[0]) + (this[5] * arg[1]) + (this[9] * arg[2]) + (this[13] * arg[3])
    const z1 = (this[2] * arg[0]) + (this[6] * arg[1]) + (this[10] * arg[2]) + (this[14] * arg[3])
    const w1 = (this[3] * arg[0]) + (this[7] * arg[1]) + (this[11] * arg[2]) + (this[15] * arg[3])
    arg[0] = x1
    arg[1] = y1
    arg[2] = z1
    arg[3] = w1
    return arg
  }

  perspectiveTransform (v3: Vector3) {
    const x1 = (this[0] * v3[0]) + (this[4] * v3[1]) + (this[8] * v3[2]) + this[12]
    const y1 = (this[1] * v3[0]) + (this[5] * v3[1]) + (this[9] * v3[2]) + this[13]
    const z1 = (this[2] * v3[0]) + (this[6] * v3[1]) + (this[10] * v3[2]) + this[14]
    const w1 = 1.0 / ((this[3] * v3[0]) + (this[7] * v3[1]) + (this[11] * v3[2]) + this[15])
    v3[0] = x1 * w1
    v3[1] = y1 * w1
    v3[2] = z1 * w1
    return v3
  }

  transformed (v4: Vector4, out?: Vector4 | null) {
    out = out ?? null
    if (out === null) {
      out = Vector4.copy(v4)
    } else {
      out.from(v4)
    }
    return this.transform(out)
  }

  copyIntoArray (array: number[], offset: number = 0) {
    const i = offset
    array[i + 15] = this[15]
    array[i + 14] = this[14]
    array[i + 13] = this[13]
    array[i + 12] = this[12]
    array[i + 11] = this[11]
    array[i + 10] = this[10]
    array[i + 9] = this[9]
    array[i + 8] = this[8]
    array[i + 7] = this[7]
    array[i + 6] = this[6]
    array[i + 5] = this[5]
    array[i + 4] = this[4]
    array[i + 3] = this[3]
    array[i + 2] = this[2]
    array[i + 1] = this[1]
    array[i + 0] = this[0]
  }

  /**
   * @description: 
   * @param {number} array
   * @param {number} offset
   * @return {*}
   */  
  copyFromList (array: number[], offset: number = 0) {
    const i = offset
    this[15] = array[i + 15]
    this[14] = array[i + 14]
    this[13] = array[i + 13]
    this[12] = array[i + 12]
    this[11] = array[i + 11]
    this[10] = array[i + 10]
    this[9] = array[i + 9]
    this[8] = array[i + 8]
    this[7] = array[i + 7]
    this[6] = array[i + 6]
    this[5] = array[i + 5]
    this[4] = array[i + 4]
    this[3] = array[i + 3]
    this[2] = array[i + 2]
    this[1] = array[i + 1]
    this[0] = array[i + 0]
  }

  /**
   * @description: 
   * @param {number} array
   * @param {number} offset
   * @return {*}
   */  
  applyToVector3Array (array: number[], offset: number = 0) {
    for (let i = 0, j = offset; i < array.length; i += 3, j += 3) {
      const v = Vector3.copyFromList(array, j)
      v.applyMatrix4(this)
      array[j] = v[0]
      array[j + 1] = v[1]
      array[j + 2] = v[2]
    }

    return array
  }

  /**
   * @description: 
   * @return {*}
   */  
  isIdentity () {
    return (
      this[0] === 1.0 && // col 1
      this[1] === 0.0 &&
      this[2] === 0.0 &&
      this[3] === 0.0 &&
      this[4] === 0.0 && // col 2
      this[5] === 1.0 &&
      this[6] === 0.0 &&
      this[7] === 0.0 &&
      this[8] === 0.0 && // col 3
      this[9] === 0.0 &&
      this[10] === 1.0 &&
      this[11] === 0.0 &&
      this[12] === 0.0 && // col 4
      this[13] === 0.0 &&
      this[14] === 0.0 &&
      this[15] === 1.0
    )
  }

  isIdentityOrTranslation (): boolean {
    return (
      this[15] === 1.0 &&
      this[0] === 1.0 && // col 1
      this[1] === 0.0 &&
      this[2] === 0.0 &&
      this[3] === 0.0 &&
      this[4] === 0.0 && // col 2
      this[5] === 1.0 &&
      this[6] === 0.0 &&
      this[7] === 0.0 &&
      this[8] === 0.0 && // col 3
      this[9] === 0.0 &&
      this[10] === 1.0 &&
      this[11] === 0.0
    )
  }

  isZero () {
    return (
      this[0] === 0.0 && // col 1
      this[1] === 0.0 &&
      this[2] === 0.0 &&
      this[3] === 0.0 &&
      this[4] === 0.0 && // col 2
      this[5] === 0.0 &&
      this[6] === 0.0 &&
      this[7] === 0.0 &&
      this[8] === 0.0 && // col 3
      this[9] === 0.0 &&
      this[10] === 0.0 &&
      this[11] === 0.0 &&
      this[12] === 0.0 && // col 4
      this[13] === 0.0 &&
      this[14] === 0.0 &&
      this[15] === 0.0
    )
  }

  equal (other: Matrix4 | null) {
    return (
      (other instanceof Matrix4) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2]) &&
      (this[3] === other[3]) &&
      (this[4] === other[4]) &&
      (this[5] === other[5]) &&
      (this[6] === other[6]) &&
      (this[7] === other[7]) &&
      (this[8] === other[8]) &&
      (this[9] === other[9]) &&
      (this[10] === other[10]) &&
      (this[11] === other[11]) &&
      (this[12] === other[12]) &&
      (this[13] === other[13]) &&
      (this[14] === other[14]) &&
      (this[15] === other[15])
    )
  }

  notEqual (other: Matrix4 | null) {
    return !this.equal(other)
  }

  toString () {
    return  `Matrix4([0]: ${this.row(0)}, [1]: ${this.row(1)}, [2]: ${this.row(2)}, [3]: ${this.row(3)})`
  }
}
