import { invariant } from 'ts-invariant'
import { Vector2 } from './vector2'

export class Matrix2 extends Array<number> {
  static zero () {
    return new Matrix2(4)
  }

  static fromList (values: number[]) {
    const mat = Matrix2.zero()
    mat.setValues(values[0], values[1], values[2], values[3])
  }

  static identity () {
    const mat = Matrix2.zero()
    mat.setIdentity()
    return mat
  }

  static copy (other: Matrix2) {
    const mat = Matrix2.zero()
    mat.setFrom(other)
    return mat
  }

  static columns (
    arg0: Vector2, 
    arg1: Vector2
  ) {
    const mat = Matrix2.zero()
    mat.setColumns(arg0, arg1)

    return mat
  }
   
  static outer (
    u: Vector2, 
    v: Vector2
  ) {
    const mat = Matrix2.zero()
    mat.setOuter(u, v)
    return mat
  }

  static rotation (radians: number) {
    const mat = Matrix2.zero()
    mat.setRotation(radians)
    return mat
  }

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

  get storage () {
    return this
  }

  get dimension () {
    return 2
  }

  get row0 () {
    return this.getRow(0)
  }

  get row1 () {
    return this.getRow(1)
  }

  set row0 (arg: Vector2) {
    this.setRow(0, arg)
  }

  set row1 (arg: Vector2) {
    this.setRow(1, arg)
  }

  index (
    row: number, 
    col: number
  ) {
    return (col * 2) + row
  }

  entry (row: number, col: number) {
    invariant((row >= 0) && (row < this.dimension))
    invariant((col >= 0) && (col < this.dimension))

    return this[this.index(row, col)]
  }

  setEntry (
    row: number, 
    col: number, 
    v: number
  ) {
    invariant((row >= 0) && (row < this.dimension))
    invariant((col >= 0) && (col < this.dimension))

    this[this.index(row, col)] = v
  }

  setValues (
    arg0: number, 
    arg1: number, 
    arg2: number, 
    arg3: number
  ) {
    this[3] = arg3
    this[2] = arg2
    this[1] = arg1
    this[0] = arg0
  }

  setColumns (
    arg0: Vector2, 
    arg1: Vector2
  ) {
    this[0] = arg0[0]
    this[1] = arg0[1]
    this[2] = arg1[0]
    this[3] = arg1[1]
  }

  setFrom (arg: Matrix2) {
    this[3] = arg[3]
    this[2] = arg[2]
    this[1] = arg[1]
    this[0] = arg[0]
  }

  setOuter (
    u: Vector2, 
    v: Vector2
  ) {
    this[0] = u[0] * v[0]
    this[1] = u[0] * v[1]
    this[2] = u[1] * v[0]
    this[3] = u[1] * v[1]
  }

  splatDiagonal (arg: number) {
    this[0] = arg
    this[3] = arg
  }

  setDiagonal (arg: Vector2) {
    this[0] = arg[0]
    this[3] = arg[1]
  }
  
  toString () {
    return `[0] ${this.getRow(0)}\n[1] ${this.getRow(1)}\n`
  }

  
  eq (other: Matrix2) {
    return (
      (other instanceof Matrix2) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2]) &&
      (this[3] === other[3])
    )
  }

  setRow (row: number, arg: Vector2) {
    this[this.index(row, 0)] = arg[0]
    this[this.index(row, 1)] = arg[1]
  }

  getRow (row: number) {
    const r = Vector2.zero()
    r[0] = this[this.index(row, 0)]
    r[1] = this[this.index(row, 1)]
    return r
  }

  setColumn (
    column: number, 
    arg: Vector2
  ) {
    const entry = column * 2
    this[entry + 1] = arg[1]
    this[entry + 0] = arg[0]
  }

  getColumn (column: number) {
    const r = Vector2.zero()
    const entry = column * 2
    r[1] = this[entry + 1]
    r[0] = this[entry + 0]
    
    return r
  }

  clone () {
    return Matrix2.copy(this)
  }

  copyInto (arg: Matrix2) {
    arg[0] = this[0]
    arg[1] = this[1]
    arg[2] = this[2]
    arg[3] = this[3]
    return arg
  }

  setZero () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
  }

  setIdentity() {
    this[0] = 1.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 1.0
  }

  transposed () {
    const mat = this.clone()
    mat.transpose()
    return mat
  }

  transpose() {
    const temp = this[2]
    this[2] = this[1]
    this[1] = temp
  }

  absolute () {
    const r = Matrix2.zero()
    
    r[0] = Math.abs(this[0])
    r[1] = Math.abs(this[1])
    r[2] = Math.abs(this[2])
    r[3] = Math.abs(this[3])
    return r
  }

  determinant () {
    return (this[0] * this[3]) - (this[1] * this[2])
  }
    
  dotRow (
    i: number, 
    v: Vector2
  ) {
    return this[i] * v[0] + this[2 + i] * v[1]
  }

  dotColumn (
    j: number, 
    v: Vector2
  ) {
    return this[j * 2] * v[0] + this[(j * 2) + 1] * v[1]
  }

  trace () {
    let t = 0.0
    t += this[0]
    t += this[3]
    return t
  }

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

  relativeError (correct: Matrix2) {
    const diff = correct.clone() 
    diff.substract(this)
    const correctNorm = correct.infinityNorm()
    const diffNorm = diff.infinityNorm()
    return diffNorm / correctNorm
  }

  absoluteError (correct: Matrix2) {
    const thisNorm = this.infinityNorm()
    const correctNorm = correct.infinityNorm()
    const diffNorm = Math.abs((thisNorm - correctNorm))
    return diffNorm
  }

  invert () {
    const det = this.determinant()
    if (det === 0.0) {
      return 0.0
    }
    const invDet = 1.0 / det
    const temp = this[0]
    this[0] = this[3] * invDet
    this[1] = -this[1] * invDet
    this[2] = -this[2] * invDet;
    this[3] = temp * invDet;
    return det
  }

  copyInverse (arg: Matrix2) {
    const det = arg.determinant()
    if (det === 0.0) {
      this.setFrom(arg)
      return 0.0
    }
    const invDet = 1.0 / det
    this[0] = arg[3] * invDet
    this[1] = -arg[1] * invDet
    this[2] = -arg[2] * invDet
    this[3] = arg[0] * invDet
    return det
  }

  setRotation (radians: number) {
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    this[0] = c
    this[1] = s
    this[2] = -s
    this[3] = c
  }

  scaleAdjoint (scale: number) {
    const temp = this[0]
    this[0] = this[3] * scale
    this[2] = -this[2] * scale
    this[1] = -this[1] * scale
    this[3] = temp * scale
  }

  scale (scale: number) {
    this[0] = this[0] * scale
    this[1] = this[1] * scale
    this[2] = this[2] * scale
    this[3] = this[3] * scale
  }

  scaled (scale: number) {
    const mat = this.clone()
    mat.scale(scale)
    return mat
  }

  add (o: Matrix2) {
    this[0] = this[0] + o[0]
    this[1] = this[1] + o[1]
    this[2] = this[2] + o[2]
    this[3] = this[3] + o[3]
  }

  substract (o: Matrix2) {
    this[0] = this[0] - o[0]
    this[1] = this[1] - o[1]
    this[2] = this[2] - o[2]
    this[3] = this[3] - o[3]
  }

  negate () {
    this[0] = -this[0]
    this[1] = -this[1]
    this[2] = -this[2]
    this[3] = -this[3]
  }

  multiply (arg: Matrix2) {
    const m00 = this[0]
    const m01 = this[2]
    const m10 = this[1]
    const m11 = this[3]
    const n00 = arg[0]
    const n01 = arg[2]
    const n10 = arg[1]
    const n11 = arg[3]
    this[0] = (m00 * n00) + (m01 * n10)
    this[2] = (m00 * n01) + (m01 * n11)
    this[1] = (m10 * n00) + (m11 * n10)
    this[3] = (m10 * n01) + (m11 * n11)
  }

  multiplied (arg: Matrix2) {
    const mat = this.clone()
    mat.multiply(arg)
    return mat
  }

  transposeMultiply (arg: Matrix2) {
    const m00 = this[0]
    const m01 = this[1]
    const m10 = this[2]
    const m11 = this[3]
    this[0] = (m00 * arg[0]) + (m01 * arg[1])
    this[2] = (m00 * arg[2]) + (m01 * arg[3])
    this[1] = (m10 * arg[0]) + (m11 * arg[1])
    this[3] = (m10 * arg[2]) + (m11 * arg[3])
  }

  multiplyTranspose (arg: Matrix2) {
    const m00 = this[0]
    const m01 = this[2]
    const m10 = this[1]
    const m11 = this[3]
    
    this[0] = (m00 * arg[0]) + (m01 * arg[2])
    this[2] = (m00 * arg[1]) + (m01 * arg[3])
    this[1] = (m10 * arg[0]) + (m11 * arg[2])
    this[3] = (m10 * arg[1]) + (m11 * arg[3])
  }

  transform (arg: Vector2) {
    const x = (this[0] * arg[0]) + (this[2] * arg[1])
    const y = (this[1] * arg[0]) + (this[3] * arg[1])
    arg[0] = x
    arg[1] = y
    return arg
  }

  transformed (
    arg: Vector2, 
    out: Vector2 | null
  ) {
    if (out === null) {
      out = Vector2.copy(arg)
    } else {
      out.setFrom(arg)
    }
    return this.transform(out)
  }

  copyIntoArray (
    array: number[], 
    offset = 0
  ) {
    const i = offset
    array[i + 3] = this[3]
    array[i + 2] = this[2]
    array[i + 1] = this[1]
    array[i + 0] = this[0]
  }

  copyFromArray (
    array: number[], 
    offset = 0
  ) {
    const i = offset
    this[3] = array[i + 3]
    this[2] = array[i + 2]
    this[1] = array[i + 1]
    this[0] = array[i + 0]
  }
}
