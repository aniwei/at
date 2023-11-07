import { invariant } from '@at/utility'
import { ArrayLike } from '@at/basic'
import { Vector2 } from './vector2'

export class Matrix2 extends ArrayLike<Matrix2> {
  static get ZERO () {
    return new Matrix2(4)
  } 

  /**
   * 
   * @param {number[]} values 
   * @returns {Matrix2}
   */
  static fromList (values: ArrayLike<number>) {
    const mat = Matrix2.ZERO
    mat.values(
      values[0], 
      values[1], 
      values[2], 
      values[3]
    )
    return mat
  }

  /**
   * 恒等式
   * @returns {Matrix2}
   */
  static identity () {
    const mat = Matrix2.ZERO
    mat.identity()
    return mat
  }

  /**
   * 复制 Matrix2
   * @param {Matrix2} other 
   * @returns {Matrix2}
   */
  static copy (other: Matrix2): Matrix2 {
    const mat = Matrix2.ZERO
    mat.from(other) 
    return mat
  }

  /**
   * 设置列
   * @param {Vector2} v1 
   * @param {Vector2} v2 
   * @returns {Matrix2}
   */
  static columns (
    v1: Vector2, 
    v2: Vector2
  ): Matrix2 {
    const mat = Matrix2.ZERO.clone()
    mat.columns(v1, v2)

    return mat
  }
   
  /**
   * 设置 outer
   * @param {Vector2} u 
   * @param {Vector2} v 
   * @returns {Matrix2}
   */
  static outer (
    u: Vector2, 
    v: Vector2
  ) {
    const mat = Matrix2.ZERO.clone()
    mat.outer(u, v)
    return mat
  }

  /**
   * 设置 rotation
   * @param {number} radians 
   * @returns {Matrix2}
   */
  static rotation (radians: number) {
    const mat = Matrix2.ZERO.clone()
    mat.rotation(radians)
    return mat
  }

  /**
   * 
   * @param {Matrix2} A 
   * @param {Vector2} x 
   * @param {Vector2} b 
   */
  static solve (
    A: Matrix2, 
    x: Vector2, 
    b: Vector2
  ) {
    const a11 = A.entry(0, 0)
    const a12 = A.entry(0, 1)
    const a21 = A.entry(1, 0)
    const a22 = A.entry(1, 1)
    const bx = b[0]
    const by = b[1]
    let det = a11 * a22 - a12 * a21

    if (det !== 0.0) {
      det = 1.0 / det
    }

    x[0] = det * (a22 * bx - a12 * by)
    x[1] = det * (a11 * by - a21 * bx)
  }

  // => dimension
  get dimension () {
    return 2
  }

  // => row0
  get row0 () {
    return this.row(0)
  }
  set row0 (v2: Vector2) {
    this.row(0, v2)
  }

  // => row1
  get row1 () {
    return this.row(1)
  }
  set row1 (v2: Vector2) {
    this.row(1, v2)
  }

  /**
   * 获取索引
   * @param row 
   * @param col 
   * @returns 
   */
  index (
    row: number, 
    col: number
  ) {
    return (col * 2) + row
  }

  /**
   * 设置 entry
   * @param {number} row 
   * @param {number} col 
   */
  entry (row: number, col: number): number
  entry (row: number, col: number, v: number): undefined
  entry (row: number, col: number, v?: number | null): number | undefined {
    invariant((row >= 0) && (row < this.dimension), 'The "row" cannot out of matrix2 edge.')
    invariant((col >= 0) && (col < this.dimension), 'The "col" cannot out of matrix2 edge.')
    
    v ??= null
    if (v !== null) {
      this[this.index(row, col)] = v
    } else {
      return this[this.index(row, col)]
    }
  }

  /**
   * 设置值
   * @param {number} v0 
   * @param {number} v1 
   * @param {number} v2 
   * @param {number} v3 
   */
  values (
    v0: number, 
    v1: number, 
    v2: number, 
    v3: number
  ) {
    this[3] = v3
    this[2] = v2
    this[1] = v1
    this[0] = v0
  }

  /**
   * 设置列
   * @param {Vector2} v1 
   * @param {Vector2} v2 
   */
  columns (
    v1: Vector2, 
    v2: Vector2
  ) {
    this[0] = v1[0]
    this[1] = v1[1]
    this[2] = v2[0]
    this[3] = v2[1]
  }

  /**
   * 从 Matrix2 设置值
   * @param m2 
   */
  from (m2: Matrix2) {
    this[3] = m2[3]
    this[2] = m2[2]
    this[1] = m2[1]
    this[0] = m2[0]
  }

  /**
   * 设置 outer
   * @param {Vector2} u 
   * @param {Vector2} v 
   */
  outer (
    u: Vector2, 
    v: Vector2
  ) {
    this[0] = u[0] * v[0]
    this[1] = u[0] * v[1]
    this[2] = u[1] * v[0]
    this[3] = u[1] * v[1]
  }

  /**
   * 抹平
   * @param {number} factor 
   */
  splatDiagonal (factor: number) {
    this[0] = factor
    this[3] = factor
  }

  /**
   * 对角矩阵
   * @param {Vector2} v2 
   */
  diagonal (v2: Vector2) {
    this[0] = v2[0]
    this[3] = v2[1]
  }

  /**
   * 获取或设置 row
   * @param {number} row 
   * @param {Vector2 | null | undefined} v2 
   */
  row (row: number): Vector2
  row (row: number, v2: Vector2): undefined
  row (row: number, v2?: Vector2 | null): Vector2 | undefined {
    v2 ??= null
    if (v2 === null) {
      const r = Vector2.ZERO
      r[0] = this[this.index(row, 0)]
      r[1] = this[this.index(row, 1)]
      return r
    } else {
      this[this.index(row, 0)] = v2[0]
      this[this.index(row, 1)] = v2[1]
    }
  }

  /**
   * 获取或设置 column
   * @param {number} column 
   * @param {Vector2 | null | undefined} v2 
   */
  column (column: number): Vector2
  column (column: number, v2: Vector2): undefined
  column (column: number, v2?: Vector2 | null) {
    v2 ??= null

    if (v2 === null) {
      const r = Vector2.ZERO
      const entry = column * 2
      r[1] = this[entry + 1]
      r[0] = this[entry + 0]
      
      return r
    } else {
      const entry = column * 2
      this[entry + 1] = v2[1]
      this[entry + 0] = v2[0]
    }

  }

  /**
   * 置0
   */
  zero () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
  }

  /**
   * 恒等式
   */
  identity () {
    this[0] = 1.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 1.0
  }

  /**
   * 矩阵转置
   * @returns {Matrix2} 
   */
  transposed () {
    const mat = this.clone()
    mat.transpose()
    return mat
  }

  /**
   * 矩阵转置
   * @returns {Matrix2} 
   */
  transpose () {
    const m2 = this[2]
    this[2] = this[1]
    this[1] = m2
  }

  /**
   * 绝对值
   * @returns {Matrix2}
   */
  absolute () {
    const r = Matrix2.ZERO
    
    r[0] = Math.abs(this[0])
    r[1] = Math.abs(this[1])
    r[2] = Math.abs(this[2])
    r[3] = Math.abs(this[3])
    return r
  }

  /**
   * 
   * @returns 
   */
  determinant () {
    return (this[0] * this[3]) - (this[1] * this[2])
  }
    
  /**
   * 求行乘积
   * @param i 
   * @param v 
   * @returns 
   */
  dotRow (
    i: number, 
    v: Vector2
  ) {
    return this[i] * v[0] + this[2 + i] * v[1]
  }

  /**
   * 求列乘积
   * @param j 
   * @param v 
   * @returns 
   */
  dotColumn (
    j: number, 
    v: Vector2
  ) {
    return this[j * 2] * v[0] + this[(j * 2) + 1] * v[1]
  }

  /**
   * 
   * @returns 
   */
  trace () {
    let t = 0.0
    t += this[0]
    t += this[3]
    return t
  }

  /**
   * 
   * @returns 
   */
  infinityNorm () {
    let norm = 0.0
    {
      let rowNorm = 0.0
      rowNorm += Math.abs(this[0])
      rowNorm += Math.abs(this[1])
      norm = rowNorm > norm ? rowNorm : norm
    }
    {
      let rowNorm = 0.0
      rowNorm += Math.abs(this[2])
      rowNorm += Math.abs(this[3])
      norm = rowNorm > norm ? rowNorm : norm
    }
    return norm
  }

  /**
   * 
   * @param {Matrix2} correct 
   * @returns {number}
   */
  relativeError (correct: Matrix2) {
    const diff = correct.clone() 
    diff.substract(this)
    const correctNorm = correct.infinityNorm()
    const diffNorm = diff.infinityNorm()
    return diffNorm / correctNorm
  }

  /**
   * 
   * @param {Matrix2} correct 
   * @returns {number}
   */
  absoluteError (correct: Matrix2) {
    const thisNorm = this.infinityNorm()
    const correctNorm = correct.infinityNorm()
    const diffNorm = Math.abs((thisNorm - correctNorm))
    return diffNorm
  }

  /**
   * 取反
   * @returns 
   */
  invert () {
    const det = this.determinant()
    if (det === 0.0) {
      return 0.0
    }
    const inv = 1.0 / det
    const v = this[0]
    this[0] = this[3] * inv
    this[1] = -this[1] * inv
    this[2] = -this[2] * inv
    this[3] = v * inv
    return det
  }

  /**
   * 
   * @param {Matrix2} m2 
   * @returns 
   */
  copyInverse (m2: Matrix2) {
    const det = m2.determinant()
    if (det === 0.0) {
      this.from(m2)
      return 0.0
    }
    const inv = 1.0 / det
    this[0] = m2[3] * inv
    this[1] = -m2[1] * inv
    this[2] = -m2[2] * inv
    this[3] = m2[0] * inv
    return det
  }

  rotation (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = c
    this[1] = s
    this[2] = -s
    this[3] = c
  }

  scaleAdjoint (scale: number) {
    const v = this[0]
    this[0] = this[3] * scale
    this[2] = -this[2] * scale
    this[1] = -this[1] * scale
    this[3] = v * scale
  }

  /**
   * 向量放大
   * @param {number} scale 
   */
  scale (scale: number) {
    this[0] = this[0] * scale
    this[1] = this[1] * scale
    this[2] = this[2] * scale
    this[3] = this[3] * scale
  }

  /**
   * 向量放大
   * @param {number} scale 
   */
  scaled (scale: number) {
    const mat = this.clone()
    mat.scale(scale)
    return mat
  }

  /**
   * 向量加法
   * @param {Matrix2} o 
   */
  add (o: Matrix2) {
    this[0] = this[0] + o[0]
    this[1] = this[1] + o[1]
    this[2] = this[2] + o[2]
    this[3] = this[3] + o[3]
  }

  /**
   * 向量减法
   * @param {Matrix2} o 
   */
  substract (o: Matrix2) {
    this[0] = this[0] - o[0]
    this[1] = this[1] - o[1]
    this[2] = this[2] - o[2]
    this[3] = this[3] - o[3]
  }

  /**
   * 取反
   * @param {Matrix2} o 
   */
  inverse () {
    this[0] = -this[0]
    this[1] = -this[1]
    this[2] = -this[2]
    this[3] = -this[3]
  }

  /**
   * 相乘
   * @param {Matrix2} o 
   */
  multiply (m2: Matrix2) {
    const m00 = this[0]
    const m01 = this[2]
    const m10 = this[1]
    const m11 = this[3]
    const n00 = m2[0]
    const n01 = m2[2]
    const n10 = m2[1]
    const n11 = m2[3]
    this[0] = (m00 * n00) + (m01 * n10)
    this[2] = (m00 * n01) + (m01 * n11)
    this[1] = (m10 * n00) + (m11 * n10)
    this[3] = (m10 * n01) + (m11 * n11)
  }

  /**
   * 相乘
   * @param {Matrix2} o 
   */
  multiplied (m2: Matrix2) {
    const mat = this.clone()
    mat.multiply(m2)
    return mat
  }

  /**
   * 转置相乘
   * @param {Matrix2} o 
   */
  transposeMultiply (m2: Matrix2) {
    const m00 = this[0]
    const m01 = this[1]
    const m10 = this[2]
    const m11 = this[3]
    this[0] = (m00 * m2[0]) + (m01 * m2[1])
    this[2] = (m00 * m2[2]) + (m01 * m2[3])
    this[1] = (m10 * m2[0]) + (m11 * m2[1])
    this[3] = (m10 * m2[2]) + (m11 * m2[3])
  }

  /**
   * 相乘转置
   * @param {Matrix2} m2 
   */
  multiplyTranspose (m2: Matrix2) {
    const m00 = this[0]
    const m01 = this[2]
    const m10 = this[1]
    const m11 = this[3]
    
    this[0] = (m00 * m2[0]) + (m01 * m2[2])
    this[2] = (m00 * m2[1]) + (m01 * m2[3])
    this[1] = (m10 * m2[0]) + (m11 * m2[2])
    this[3] = (m10 * m2[1]) + (m11 * m2[3])
  }

  /**
   * 矩阵变换
   * @param {Vector2} v2 
   * @param {Vector2} out 
   * @returns {Vector2}
   */
  transform (v2: Vector2) {
    const x = (this[0] * v2[0]) + (this[2] * v2[1])
    const y = (this[1] * v2[0]) + (this[3] * v2[1])
    v2[0] = x
    v2[1] = y
    return v2
  }

  /**
   * 矩阵变换
   * @param {Vector2} v2 
   * @param {Vector2} out 
   * @returns {Vector2}
   */
  transformed (
    v2: Vector2, 
    out: Vector2 | null
  ) {
    if (out === null) {
      out = Vector2.copy(v2)
    } else {
      out.from(v2)
    }
    return this.transform(out)
  }

  /**
   * 复制到数组
   * @param {number[]} array 
   * @param {number} offset 
   */
  copyIntoList (
    array: number[], 
    offset = 0
  ) {
    const i = offset
    array[i + 3] = this[3]
    array[i + 2] = this[2]
    array[i + 1] = this[1]
    array[i + 0] = this[0]
  }

  /**
   * 从数组复制到矩阵
   * @param {number[]} array 
   * @param {number} offset 
   */
  copyFromList (
    array: number[], 
    offset = 0
  ) {
    const i = offset
    this[3] = array[i + 3]
    this[2] = array[i + 2]
    this[1] = array[i + 1]
    this[0] = array[i + 0]
  }

  /**
   * 复制到矩阵
   * @param {Matrix2} m2 
   * @returns {Matrix2}
   */
  copyInto (m2: Matrix2) {
    m2[0] = this[0]
    m2[1] = this[1]
    m2[2] = this[2]
    m2[3] = this[3]
    return m2
  }

  /**
   * 复制本矩阵
   * @returns {Matrix2}
   */
  clone (): Matrix2 {
    return Matrix2.copy(this)
  }

  /**
   * 是否相等
   * @param other 
   * @returns 
   */
  equal (other: Matrix2 | null) {
    return (
      (other instanceof Matrix2) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2]) &&
      (this[3] === other[3])
    )
  }

  /**
   * 是否相等
   * @param other 
   * @returns 
   */
  notEqual (other: Matrix2 | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `Matrix2([0]: ${this.row(0)}, [1]: ${this.row(1)})`
  }
}
