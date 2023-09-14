import { invariant } from 'ts-invariant'
import { Numberic } from '@at/basic'
import { Matrix2 } from './matrix2'
import { Matrix4 } from './matrix4'
import { Vector2 } from './vector2'
import { Vector3 } from './vector3'

export class Matrix3 extends Numberic<Matrix3> {
  static get ZERO () {
    return new Matrix3(9)
  }

  /**
   * 
   * @param A 
   * @param x 
   * @param b 
   */
  static solve2 (
    A: Matrix3, 
    x: Vector2, 
    b: Vector2 
  ) {
    const a11 = A.entry(0, 0)
    const a12 = A.entry(0, 1)
    const a21 = A.entry(1, 0)
    const a22 = A.entry(1, 1)
    const bx = b[0] - A[6]
    const by = b[1] - A[7]
    let det = a11 * a22 - a12 * a21

    if (det !== 0.0) {
      det = 1.0 / det
    }

    x[0] = det * (a22 * bx - a12 * by)
    x[1] = det * (a11 * by - a21 * bx)
  }

  static solve (
    A: Matrix3, 
    x: Vector3, 
    b: Vector3
  ) {
    const A0x = A.entry(0, 0)
    const A0y = A.entry(1, 0)
    const A0z = A.entry(2, 0)
    const A1x = A.entry(0, 1)
    const A1y = A.entry(1, 1)
    const A1z = A.entry(2, 1)
    const A2x = A.entry(0, 2)
    const A2y = A.entry(1, 2)
    const A2z = A.entry(2, 2)
    let rx, ry, rz
    let det

    rx = A1y * A2z - A1z * A2y
    ry = A1z * A2x - A1x * A2z
    rz = A1x * A2y - A1y * A2x

    det = A0x * rx + A0y * ry + A0z * rz
    if (det !== 0.0) {
      det = 1.0 / det
    }

    const x1 = det * (b[0] * rx + b[1] * ry + b[2] * rz)

    rx = -(A2y * b[0] - A2z * b[0])
    ry = -(A2z * b[1] - A2x * b[1])
    rz = -(A2x * b[2] - A2y * b[2])
    
    const y1 = det * (A0x * rx + A0y * ry + A0z * rz)

    rx = -(b[0] * A1z - b[0] * A1y)
    ry = -(b[1] * A1x - b[1] * A1z)
    rz = -(b[2] * A1y - b[2] * A1x)
    
    const z1 = det * (A0x * rx + A0y * ry + A0z * rz)

    x[0] = x1
    x[1] = y1
    x[2] = z1
  }

  static fromList (values: number[]) {
    const mat = Matrix3.ZERO
    mat.values(
      values[0], 
      values[1],
      values[2], 
      values[3], 
      values[4],
      values[5], 
      values[6], 
      values[7], 
      values[8]
    )

    return mat
  }

  /**
   * 
   * @returns 
   */
  static identity () {
    const mat = Matrix3.ZERO
    mat.identity()
    return mat
  }
  
  /**
   * 
   * @param other 
   * @returns 
   */
  static copy (other: Matrix3): Matrix3 {
    const mat = Matrix3.ZERO
    mat.from(other)
    return mat
  }

  /**
   * 
   * @param arg0 
   * @param arg1 
   * @param arg2 
   */
  static columns (
    arg0: Vector3 , 
    arg1: Vector3, 
    arg2: Vector3
  ) {
    const mat = Matrix3.ZERO
    mat.columns(arg0, arg1, arg2)
  }

  /**
   * 
   * @param u 
   * @param v 
   * @returns 
   */
  static outer (
    u: Vector3, 
    v: Vector3
  ) {
    const mat = Matrix3.ZERO
    mat.outer(u, v)
    return mat
  }

  /**
   * 
   * @param radians 
   * @returns 
   */
  static rotationX (radians: number) {
    const mat = Matrix3.ZERO
    mat.setRotationX(radians)
    return mat
  }

  /**
   * 
   * @param radians 
   * @returns 
   */
  static rotationY (radians: number) {
    const mat = Matrix3.ZERO
    mat.setRotationY(radians)
    return mat
  }

  /**
   * 
   * @param radians 
   * @returns 
   */
  static rotationZ (radians: number) {
    const mat = Matrix3.ZERO
    mat.setRotationZ(radians)
    return mat
  }

  // 纬度
  // => dimension
  get dimension () {
    return 3
  }

  // => right
  get right () {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    return new Vector3(x, y, z)
  }

  // => up
  get up () {
    const x = this[3]
    const y = this[4]
    const z = this[5]
    return new Vector3(x, y, z)
  }

  // => forward
  get forward () {
    const x = this[6]
    const y = this[7]
    const z = this[8]
    return new Vector3(x, y, z)
  }
  
  // => row0
  get row0 () {
    return this.row(0)
  }
  set row0 (v3: Vector3) {
    this.row(0, v3)
  }

  // => row1
  get row1 () {
    return this.row(1)
  }
  set row1 (v3: Vector3) {
    this.row(1, v3)
  }

  // => row2
  get row2 () {
    return this.row(2)
  }
  set row2 (arg: Vector3) {
    this.row(2, arg)
  }

  /**
   * 
   * @param row 
   * @param col 
   * @returns 
   */
  index (
    row: number, 
    col: number
  ) {
    return (col * 3) + row
  }

  /**
   * 
   * @param {number} row 
   * @param {number} col 
   * @returns {undefined | number}
   */
  entry (row: number, col: number): number
  entry (row: number, col: number, v: number | null): undefined
  entry (row: number, col: number, v?: number | null): undefined | number {
    invariant((row >= 0) && (row < this.dimension))
    invariant((col >= 0) && (col < this.dimension))
    v ??= null
    if (v !== null) {
      this[this.index(row, col)] = v
    } else {
      return this[this.index(row, col)]
    }
  }
  /**
   * 
   * @param factor0 
   * @param factor1 
   * @param factor2 
   * @param factor3 
   * @param factor4 
   * @param factor5 
   * @param factor6 
   * @param factor7 
   * @param factor8 
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
    factor8: number
  ) {
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

  /**
   * 
   * @param {Vector3} v0 
   * @param {Vector3} v1 
   * @param {Vector3} v2 
   */
  columns (
    v0: Vector3, 
    v1: Vector3, 
    v2: Vector3
  ) {
    this[0] = v0[0]
    this[1] = v0[1]
    this[2] = v0[2]
    this[3] = v1[0]
    this[4] = v1[1]
    this[5] = v1[2]
    this[6] = v2[0]
    this[7] = v2[1]
    this[8] = v2[2]
  }

  /**
   * 
   * @param m3 
   */
  from (m3: Matrix3) {
    this[8] = m3[8]
    this[7] = m3[7]
    this[6] = m3[6]
    this[5] = m3[5]
    this[4] = m3[4]
    this[3] = m3[3]
    this[2] = m3[2]
    this[1] = m3[1]
    this[0] = m3[0]
  }

  /**
   * 
   * @param {Vector3} u 
   * @param {Vector3} v 
   */
  outer (
    u: Vector3, 
    v: Vector3
  ) {
    this[0] = u[0] * v[0]
    this[1] = u[0] * v[1]
    this[2] = u[0] * v[2]
    this[3] = u[1] * v[0]
    this[4] = u[1] * v[1]
    this[5] = u[1] * v[2]
    this[6] = u[2] * v[0]
    this[7] = u[2] * v[1]
    this[8] = u[2] * v[2]
  }

  /**
   * 
   * @param factor 
   */
  splatDiagonal (factor: number) {
    this[0] = factor
    this[4] = factor
    this[8] = factor
  }

  /**
   * 
   * @param v3 
   */
  diagonal (v3: Vector3) {
    this[0] = v3[0]
    this[4] = v3[1]
    this[8] = v3[2]
  }

  setUpper2x2 (m2: Matrix2) {
    this[0] = m2[0]
    this[1] = m2[1]
    this[3] = m2[2]
    this[4] = m2[3]
  }

  /**
   * 
   * @param row 
   * @param row 
   */
  row (row: number): Vector3
  row (row: number, v3: Vector3): undefined
  row (row: number, v3?: Vector3 | null): Vector3 | undefined {
    v3 ??= null
    if (v3 === null) {
      const r = Vector3.ZERO
      r[0] = this[this.index(row, 0)]
      r[1] = this[this.index(row, 1)]
      r[2] = this[this.index(row, 2)]
      return r
    } else {
      this[this.index(row, 0)] = v3[0]
      this[this.index(row, 1)] = v3[1]
      this[this.index(row, 2)] = v3[2]
    }
  }

  /**
   * 
   * @param column 
   * @param arg 
   */
  column (column: number): Vector3
  column (column: number, v3: Vector3): undefined
  column (column: number, v3?: Vector3 | null): Vector3 | undefined {
    v3 ??= null
    if (v3 === null) {
      const r = Vector3.ZERO
      const entry = column * 3
      r[2] = this[entry + 2]
      r[1] = this[entry + 1]
      r[0] = this[entry + 0]
      return r
    } else {
      const entry = column * 3
      this[entry + 2] = v3[2]
      this[entry + 1] = v3[1]
      this[entry + 0] = v3[0]
    }
  }

  copyInto (m3: Matrix3) {
    m3[0] = this[0]
    m3[1] = this[1]
    m3[2] = this[2]
    m3[3] = this[3]
    m3[4] = this[4]
    m3[5] = this[5]
    m3[6] = this[6]
    m3[7] = this[7]
    m3[8] = this[8]
    return m3
  }

  zero () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
    this[4] = 0.0
    this[5] = 0.0
    this[6] = 0.0
    this[7] = 0.0
    this[8] = 0.0
  }

  identity () {
    this[0] = 1.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
    this[4] = 1.0
    this[5] = 0.0
    this[6] = 0.0
    this[7] = 0.0
    this[8] = 1.0
  }

  transposed () {
    const mat = this.clone()
    mat.transpose()
    return mat
  } 

  transpose () {
    let temp
    temp = this[3]
    this[3] = this[1]
    this[1] = temp
    temp = this[6]
    this[6] = this[2]
    this[2] = temp
    temp = this[7]
    this[7] = this[5]
    this[5] = temp
  }

  absolute () {
    const r = Matrix3.ZERO
    r[0] = Math.abs(this[0])
    r[1] = Math.abs(this[1])
    r[2] = Math.abs(this[2])
    r[3] = Math.abs(this[3])
    r[4] = Math.abs(this[4])
    r[5] = Math.abs(this[5])
    r[6] = Math.abs(this[6])
    r[7] = Math.abs(this[7])
    r[8] = Math.abs(this[8])
    return r
  }

  determinant () {
    const x = this[0] * ((this[4] * this[8]) - (this[5] * this[7]))
    const y = this[1] * ((this[3] * this[8]) - (this[5] * this[6]))
    const z = this[2] * ((this[3] * this[7]) - (this[4] * this[6]))
    return x - y + z
  }

  dotRow (
    i: number, 
    v: Vector3
  ) {
    return this[i] * v[0] + this[3 + i] * v[1] + this[6 + i] * v[2]
  }

  dotColumn (
    j: number, 
    v: Vector3
  ) {
    return this[j * 3] * v[0] + this[j * 3 + 1] * v[1] + this[j * 3 + 2] * v[2]
  }

  trace () {
    let t = 0.0
    t += this[0]
    t += this[4]
    t += this[8]
    return t
  }

  infinityNorm () {
    let norm = 0.0
    {
      var rowNorm = 0.0;
      rowNorm += Math.abs(this[0])
      rowNorm += Math.abs(this[1])
      rowNorm += Math.abs(this[2])
      norm = rowNorm > norm ? rowNorm : norm
    }
    {
      var rowNorm = 0.0;
      rowNorm += Math.abs(this[3])
      rowNorm += Math.abs(this[4])
      rowNorm += Math.abs(this[5])
      norm = rowNorm > norm ? rowNorm : norm
    }
    {
      var rowNorm = 0.0;
      rowNorm += Math.abs(this[6])
      rowNorm += Math.abs(this[7])
      rowNorm += Math.abs(this[8])
      norm = rowNorm > norm ? rowNorm : norm
    }
    return norm
  }

   elativeError (correct: Matrix3) {
    const diff = correct.clone() 
    diff.substract(this)
    const correctNorm = correct.infinityNorm()
    const diffNorm = diff.infinityNorm()
    return diffNorm / correctNorm
  }

  absoluteError (correct: Matrix3) {
    const thisNorm = this.infinityNorm()
    const correctNorm = correct.infinityNorm()
    const diffNorm = Math.abs((thisNorm - correctNorm))
    return diffNorm
  }

  invert () {
    return this.copyInverse(this)
  }

  rotationX (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = 1.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
    this[4] = c
    this[5] = s
    this[6] = 0.0
    this[7] = -s
    this[8] = c
  }

  rotationY (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = c
    this[1] = 0.0
    this[2] = s
    this[3] = 0.0
    this[4] = 1.0
    this[5] = 0.0
    this[6] = -s
    this[7] = 0.0
    this[8] = c
  }

  rotationZ (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = c
    this[1] = s
    this[2] = 0.0
    this[3] = -s
    this[4] = c
    this[5] = 0.0
    this[6] = 0.0
    this[7] = 0.0
    this[8] = 1.0
  }

  scaleAdjoint (scale: number) {
    const m00 = this[0]
    const m01 = this[3]
    const m02 = this[6]
    const m10 = this[1]
    const m11 = this[4]
    const m12 = this[7]
    const m20 = this[2]
    const m21 = this[5]
    const m22 = this[8]
    this[0] = (m11 * m22 - m12 * m21) * scale
    this[1] = (m12 * m20 - m10 * m22) * scale
    this[2] = (m10 * m21 - m11 * m20) * scale
    this[3] = (m02 * m21 - m01 * m22) * scale
    this[4] = (m00 * m22 - m02 * m20) * scale
    this[5] = (m01 * m20 - m00 * m21) * scale
    this[6] = (m01 * m12 - m02 * m11) * scale
    this[7] = (m02 * m10 - m00 * m12) * scale
    this[8] = (m00 * m11 - m01 * m10) * scale
  }

  
  absoluteRotate (v2: Vector3) {
    const m00 = Math.abs(this[0])
    const m01 = Math.abs(this[3])
    const m02 = Math.abs(this[6])
    const m10 = Math.abs(this[1])
    const m11 = Math.abs(this[4])
    const m12 = Math.abs(this[7])
    const m20 = Math.abs(this[2])
    const m21 = Math.abs(this[5])
    const m22 = Math.abs(this[8])
    const x = v2[0]
    const y = v2[1]
    const z = v2[2]
    v2[0] = x * m00 + y * m01 + z * m02
    v2[1] = x * m10 + y * m11 + z * m12
    v2[2] = x * m20 + y * m21 + z * m22
    return v2
  }

  absoluteRotate2 (v2: Vector2) {
    const m00 = Math.abs(this[0])
    const m01 = Math.abs(this[3])
    const m10 = Math.abs(this[1])
    const m11 = Math.abs(this[4])
    const x = v2[0]
    const y = v2[1]
    v2[0] = x * m00 + y * m01
    v2[1] = x * m10 + y * m11
    return v2
  }

  transform2 (v2: Vector2) {
    const x = (this[0] * v2[0]) + (this[3] * v2[1]) + this[6]
    const y = (this[1] * v2[0]) + (this[4] * v2[1]) + this[7]
    v2[0] = x
    v2[1] = y
    return v2
  }

  scale (scale: number) {
    this[0] = this[0] * scale
    this[1] = this[1] * scale
    this[2] = this[2] * scale
    this[3] = this[3] * scale
    this[4] = this[4] * scale
    this[5] = this[5] * scale
    this[6] = this[6] * scale
    this[7] = this[7] * scale
    this[8] = this[8] * scale
  }

  scaled (scale: number) {
    const mat = this.clone()
    mat.scale(scale)
    return mat
  }

  add (m3: Matrix3) {
    this[0] = this[0] + m3[0]
    this[1] = this[1] + m3[1]
    this[2] = this[2] + m3[2]
    this[3] = this[3] + m3[3]
    this[4] = this[4] + m3[4]
    this[5] = this[5] + m3[5]
    this[6] = this[6] + m3[6]
    this[7] = this[7] + m3[7]
    this[8] = this[8] + m3[8]
  }

  substract (m3: Matrix3) {
    this[0] = this[0] - m3[0]
    this[1] = this[1] - m3[1]
    this[2] = this[2] - m3[2]
    this[3] = this[3] - m3[3]
    this[4] = this[4] - m3[4]
    this[5] = this[5] - m3[5]
    this[6] = this[6] - m3[6]
    this[7] = this[7] - m3[7]
    this[8] = this[8] - m3[8]
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
  }

  multiply (m3: Matrix3) {
    const m00 = this[0]
    const m01 = this[3]
    const m02 = this[6]
    const m10 = this[1]
    const m11 = this[4]
    const m12 = this[7]
    const m20 = this[2]
    const m21 = this[5]
    const m22 = this[8]
    const n00 = m3[0]
    const n01 = m3[3]
    const n02 = m3[6]
    const n10 = m3[1]
    const n11 = m3[4]
    const n12 = m3[7]
    const n20 = m3[2]
    const n21 = m3[5]
    const n22 = m3[8]
    this[0] = (m00 * n00) + (m01 * n10) + (m02 * n20)
    this[3] = (m00 * n01) + (m01 * n11) + (m02 * n21)
    this[6] = (m00 * n02) + (m01 * n12) + (m02 * n22)
    this[1] = (m10 * n00) + (m11 * n10) + (m12 * n20)
    this[4] = (m10 * n01) + (m11 * n11) + (m12 * n21)
    this[7] = (m10 * n02) + (m11 * n12) + (m12 * n22)
    this[2] = (m20 * n00) + (m21 * n10) + (m22 * n20)
    this[5] = (m20 * n01) + (m21 * n11) + (m22 * n21)
    this[8] = (m20 * n02) + (m21 * n12) + (m22 * n22)
  }

  multiplied (m3: Matrix3 ) {
    const mat = this.clone()
    mat.multiply(m3)
    return mat
  }

  transposeMultiply (m3: Matrix3 ) {
    const m00 = this[0]
    const m01 = this[1]
    const m02 = this[2]
    const m10 = this[3]
    const m11 = this[4]
    const m12 = this[5]
    const m20 = this[6]
    const m21 = this[7]
    const m22 = this[8]
    this[0] = (m00 * m3[0]) + (m01 * m3[1]) + (m02 * m3[2])
    this[3] = (m00 * m3[3]) + (m01 * m3[4]) + (m02 * m3[5])
    this[6] = (m00 * m3[6]) + (m01 * m3[7]) + (m02 * m3[8])
    this[1] = (m10 * m3[0]) + (m11 * m3[1]) + (m12 * m3[2])
    this[4] = (m10 * m3[3]) + (m11 * m3[4]) + (m12 * m3[5])
    this[7] = (m10 * m3[6]) + (m11 * m3[7]) + (m12 * m3[8])
    this[2] = (m20 * m3[0]) + (m21 * m3[1]) + (m22 * m3[2])
    this[5] = (m20 * m3[3]) + (m21 * m3[4]) + (m22 * m3[5])
    this[8] = (m20 * m3[6]) + (m21 * m3[7]) + (m22 * m3[8])
  }

  multiplyTranspose (m3: Matrix3) {
    const m00 = this[0]
    const m01 = this[3]
    const m02 = this[6]
    const m10 = this[1]
    const m11 = this[4]
    const m12 = this[7]
    const m20 = this[2]
    const m21 = this[5]
    const m22 = this[8]
    this[0] = (m00 * m3[0]) + (m01 * m3[3]) + (m02 * m3[6])
    this[3] = (m00 * m3[1]) + (m01 * m3[4]) + (m02 * m3[7])
    this[6] = (m00 * m3[2]) + (m01 * m3[5]) + (m02 * m3[8])
    this[1] = (m10 * m3[0]) + (m11 * m3[3]) + (m12 * m3[6])
    this[4] = (m10 * m3[1]) + (m11 * m3[4]) + (m12 * m3[7])
    this[7] = (m10 * m3[2]) + (m11 * m3[5]) + (m12 * m3[8])
    this[2] = (m20 * m3[0]) + (m21 * m3[3]) + (m22 * m3[6])
    this[5] = (m20 * m3[1]) + (m21 * m3[4]) + (m22 * m3[7])
    this[8] = (m20 * m3[2]) + (m21 * m3[5]) + (m22 * m3[8])
  }

  transform (v3: Vector3) {
    const x = (this[0] * v3[0]) + (this[3] * v3[1]) + (this[6] * v3[2])
    const y = (this[1] * v3[0]) + (this[4] * v3[1]) + (this[7] * v3[2])
    const z = (this[2] * v3[0]) + (this[5] * v3[1]) + (this[8] * v3[2])
    
    v3[0] = x
    v3[1] = y
    v3[2] = z
    return v3
  }

  transformed (
    v3: Vector3, 
    out?: Vector3 | null
  ) {
    out = out ?? null
    if (out === null) {
      out = Vector3.copy(v3)
    } else {
      out.from(v3)
    }
    return this.transform(out)
  }

  applyToVector3Array (
    array: number[], 
    offset = 0
  ) {
    for (let i = 0, j = offset; i < array.length; i += 3, j += 3) {
      // @TODO
      const v = Vector3.copyFromList(array, j)
      v.applyMatrix3(this)
      array[j] = v[0]
      array[j + 1] = v[1]
      array[j + 2] = v[2]
    }

    return array
  }

  /**
   * 
   * @param {Matrix3} arg 
   * @returns {number}
   */
  copyInverse (arg: Matrix3) {
    let det = arg.determinant()
    if (det === 0.0) {
      this.from(arg)
      return 0.0
    }
    const invDet = 1.0 / det
    const ix = invDet * (arg[4] * arg[8] - arg[5] * arg[7])
    const iy = invDet * (arg[2] * arg[7] - arg[1] * arg[8])
    const iz = invDet * (arg[1] * arg[5] - arg[2] * arg[4])
    const jx = invDet * (arg[5] * arg[6] - arg[3] * arg[8])
    const jy = invDet * (arg[0] * arg[8] - arg[2] * arg[6])
    const jz = invDet * (arg[2] * arg[3] - arg[0] * arg[5])
    const kx = invDet * (arg[3] * arg[7] - arg[4] * arg[6])
    const ky = invDet * (arg[1] * arg[6] - arg[0] * arg[7])
    const kz = invDet * (arg[0] * arg[4] - arg[1] * arg[3])
    this[0] = ix
    this[1] = iy
    this[2] = iz
    this[3] = jx
    this[4] = jy
    this[5] = jz
    this[6] = kx
    this[7] = ky
    this[8] = kz
    return det
  }

  copyNormalMatrix (arg: Matrix4) {
    this.copyInverse(arg.getRotation())
    this.transpose()
  }

  copyIntoList (
    array: number[], 
    offset = 0
  ) {
    const i = offset
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

  copyFromList (
    array: number[], 
    offset = 0
  ) {
    const i = offset
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

  clone () {
    return Matrix3.copy(this)
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  equal (other: Matrix3 | null) {
    return (
      (other instanceof Matrix3) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2]) &&
      (this[3] === other[3]) &&
      (this[4] === other[4]) &&
      (this[5] === other[5]) &&
      (this[6] === other[6]) &&
      (this[7] === other[7]) &&
      (this[8] === other[8])
    )
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  notEqual (other: Matrix3 | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `Matrix3([0]: ${this.row(0)}, [1]: ${this.row(1)}, [2]:${this.row(2)})`
  }
}
