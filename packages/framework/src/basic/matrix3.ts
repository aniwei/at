import { invariant } from '@at/utils'
import { Matrix2 } from './matrix2'
import { Matrix4 } from './matrix4'
import { Vector2 } from './vector2'
import { Vector3 } from './vector3'

export class Matrix3 extends Array<number> {
  static zero () {
    return new Matrix3(9)
  }

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

  static fromArrayLike (m3: Iterable<number>) {
    return new Matrix3(...m3)
  }

  static fromArray (values: number[]) {
    const mat = Matrix3.zero()
    mat.setValues(
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

  static identity () {
    const mat = Matrix3.zero()
    mat.setIdentity()
    return mat
  }
  

  static copy (other: Matrix3) {
    const mat = Matrix3.zero()
    mat.setFrom(other)
    return mat
  }

  static columns (
    arg0: Vector3 , 
    arg1: Vector3, 
    arg2: Vector3
  ) {
    const mat = Matrix3.zero()
    mat.setColumns(arg0, arg1, arg2)
  }

  static outer (
    u: Vector3, 
    v: Vector3
  ) {
    const mat = Matrix3.zero()
    mat.setOuter(u, v)
    return mat
  }

  static rotationX (radians: number) {
    const mat = Matrix3.zero()
    mat.setRotationX(radians)
    return mat
  }

  static rotationY (radians: number) {
    const mat = Matrix3.zero()
    mat.setRotationY(radians)
    return mat
  }

  static rotationZ (radians: number) {
    const mat = Matrix3.zero()
    mat.setRotationZ(radians)
    return mat
  }

  get storage () {
    return this
  }

  index (
    row: number, 
    col: number
  ) {
    return (col * 3) + row
  }

  entry (
    row: number, 
    col: number
  ) {
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
    arg3: number,
    arg4: number, 
    arg5: number, 
    arg6: number, 
    arg7: number, 
    arg8: number
  ) {
    this[8] = arg8
    this[7] = arg7
    this[6] = arg6
    this[5] = arg5
    this[4] = arg4
    this[3] = arg3
    this[2] = arg2
    this[1] = arg1
    this[0] = arg0
  }

  setColumns (
    arg0: Vector3, 
    arg1: Vector3, 
    arg2: Vector3
  ) {
    this[0] = arg0[0]
    this[1] = arg0[1]
    this[2] = arg0[2]
    this[3] = arg1[0]
    this[4] = arg1[1]
    this[5] = arg1[2]
    this[6] = arg2[0]
    this[7] = arg2[1]
    this[8] = arg2[2]
  }

  setFrom (arg: Matrix3) {
    this[8] = arg[8]
    this[7] = arg[7]
    this[6] = arg[6]
    this[5] = arg[5]
    this[4] = arg[4]
    this[3] = arg[3]
    this[2] = arg[2]
    this[1] = arg[1]
    this[0] = arg[0]
  }

  setOuter (
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

  splatDiagonal (arg: number) {
    this[0] = arg
    this[4] = arg
    this[8] = arg
  }

  setDiagonal (arg: Vector3) {
    this[0] = arg.storage[0]
    this[4] = arg.storage[1]
    this[8] = arg.storage[2]
  }

  setUpper2x2 (arg: Matrix2) {
    this[0] = arg[0]
    this[1] = arg[1]
    this[3] = arg[2]
    this[4] = arg[3]
  }

  get dimension () {
    return 3
  }

  get right () {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    return new Vector3(x, y, z)
  }

  get up () {
    const x = this[3]
    const y = this[4]
    const z = this[5]
    return new Vector3(x, y, z)
  }

  get forward () {
    const x = this[6]
    const y = this[7]
    const z = this[8]
    return new Vector3(x, y, z)
  }
  
  get row0 () {
    return this.getRow(0)
  }

  get row1 () {
    return this.getRow(1)
  }

  get row2 () {
    return this.getRow(2)
  }

  set row0 (arg: Vector3) {
    this.setRow(0, arg)
  }

  set row1 (arg: Vector3) {
    this.setRow(1, arg)
  }

  set row2 (arg: Vector3) {
    this.setRow(2, arg)
  }

  setRow (
    row: number, 
    arg: Vector3
  ) {
    this[this.index(row, 0)] = arg[0]
    this[this.index(row, 1)] = arg[1]
    this[this.index(row, 2)] = arg[2]
  }

  getRow (row: number) {
    const r = Vector3.zero()
    r[0] = this[this.index(row, 0)]
    r[1] = this[this.index(row, 1)]
    r[2] = this[this.index(row, 2)]
    return r
  }

  setColumn (
    column: number, 
    arg: Vector3
  ) {
    const entry = column * 3
    this[entry + 2] = arg[2]
    this[entry + 1] = arg[1]
    this[entry + 0] = arg[0]
  }

  getColumn (column: number) {
    const r = Vector3.zero()
    const entry = column * 3
    r[2] = this[entry + 2]
    r[1] = this[entry + 1]
    r[0] = this[entry + 0]
    return r
  }

  clone () {
    return Matrix3.copy(this)
  }

  copyInto (arg: Matrix3) {
    arg[0] = this[0]
    arg[1] = this[1]
    arg[2] = this[2]
    arg[3] = this[3]
    arg[4] = this[4]
    arg[5] = this[5]
    arg[6] = this[6]
    arg[7] = this[7]
    arg[8] = this[8]
    return arg
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
  }

  setIdentity () {
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
    const r = Matrix3.zero()
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

  trace() {
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
    diff.subtract(this)
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

  copyInverse (arg: Matrix3 ) {
    let det = arg.determinant()
    if (det === 0.0) {
      this.setFrom(arg)
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

  setRotationX (radians: number) {
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

  setRotationY (radians: number) {
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

  setRotationZ (radians: number) {
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

  
  absoluteRotate (arg: Vector3) {
    const m00 = Math.abs(this[0])
    const m01 = Math.abs(this[3])
    const m02 = Math.abs(this[6])
    const m10 = Math.abs(this[1])
    const m11 = Math.abs(this[4])
    const m12 = Math.abs(this[7])
    const m20 = Math.abs(this[2])
    const m21 = Math.abs(this[5])
    const m22 = Math.abs(this[8])
    const x = arg[0]
    const y = arg[1]
    const z = arg[2]
    arg[0] = x * m00 + y * m01 + z * m02
    arg[1] = x * m10 + y * m11 + z * m12
    arg[2] = x * m20 + y * m21 + z * m22
    return arg
  }

  absoluteRotate2 (arg: Vector2) {
    const m00 = Math.abs(this[0])
    const m01 = Math.abs(this[3])
    const m10 = Math.abs(this[1])
    const m11 = Math.abs(this[4])
    const x = arg[0]
    const y = arg[1]
    arg[0] = x * m00 + y * m01
    arg[1] = x * m10 + y * m11
    return arg
  }

  transform2 (arg: Vector2 ) {
    const x = (this[0] * arg[0]) + (this[3] * arg[1]) + this[6]
    const y = (this[1] * arg[0]) + (this[4] * arg[1]) + this[7]
    arg[0] = x
    arg[1] = y
    return arg
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

  add (o: Matrix3) {
    this[0] = this[0] + o[0]
    this[1] = this[1] + o[1]
    this[2] = this[2] + o[2]
    this[3] = this[3] + o[3]
    this[4] = this[4] + o[4]
    this[5] = this[5] + o[5]
    this[6] = this[6] + o[6]
    this[7] = this[7] + o[7]
    this[8] = this[8] + o[8]
  }

  subtract (o: Matrix3) {
    this[0] = this[0] - o[0]
    this[1] = this[1] - o[1]
    this[2] = this[2] - o[2]
    this[3] = this[3] - o[3]
    this[4] = this[4] - o[4]
    this[5] = this[5] - o[5]
    this[6] = this[6] - o[6]
    this[7] = this[7] - o[7]
    this[8] = this[8] - o[8]
  }

  negate () {
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

  multiply (arg: Matrix3 ) {
    const m00 = this[0]
    const m01 = this[3]
    const m02 = this[6]
    const m10 = this[1]
    const m11 = this[4]
    const m12 = this[7]
    const m20 = this[2]
    const m21 = this[5]
    const m22 = this[8]
    const n00 = arg[0]
    const n01 = arg[3]
    const n02 = arg[6]
    const n10 = arg[1]
    const n11 = arg[4]
    const n12 = arg[7]
    const n20 = arg[2]
    const n21 = arg[5]
    const n22 = arg[8]
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

  multiplied (arg: Matrix3 ) {
    const mat = this.clone()
    mat.multiply(arg)
    return mat
  }

  transposeMultiply (arg: Matrix3 ) {
    const m00 = this[0]
    const m01 = this[1]
    const m02 = this[2]
    const m10 = this[3]
    const m11 = this[4]
    const m12 = this[5]
    const m20 = this[6]
    const m21 = this[7]
    const m22 = this[8]
    this[0] = (m00 * arg[0]) + (m01 * arg[1]) + (m02 * arg[2])
    this[3] = (m00 * arg[3]) + (m01 * arg[4]) + (m02 * arg[5])
    this[6] = (m00 * arg[6]) + (m01 * arg[7]) + (m02 * arg[8])
    this[1] = (m10 * arg[0]) + (m11 * arg[1]) + (m12 * arg[2])
    this[4] = (m10 * arg[3]) + (m11 * arg[4]) + (m12 * arg[5])
    this[7] = (m10 * arg[6]) + (m11 * arg[7]) + (m12 * arg[8])
    this[2] = (m20 * arg[0]) + (m21 * arg[1]) + (m22 * arg[2])
    this[5] = (m20 * arg[3]) + (m21 * arg[4]) + (m22 * arg[5])
    this[8] = (m20 * arg[6]) + (m21 * arg[7]) + (m22 * arg[8])
  }

  multiplyTranspose(arg: Matrix3 ) {
    const m00 = this[0]
    const m01 = this[3]
    const m02 = this[6]
    const m10 = this[1]
    const m11 = this[4]
    const m12 = this[7]
    const m20 = this[2]
    const m21 = this[5]
    const m22 = this[8]
    this[0] = (m00 * arg[0]) + (m01 * arg[3]) + (m02 * arg[6])
    this[3] = (m00 * arg[1]) + (m01 * arg[4]) + (m02 * arg[7])
    this[6] = (m00 * arg[2]) + (m01 * arg[5]) + (m02 * arg[8])
    this[1] = (m10 * arg[0]) + (m11 * arg[3]) + (m12 * arg[6])
    this[4] = (m10 * arg[1]) + (m11 * arg[4]) + (m12 * arg[7])
    this[7] = (m10 * arg[2]) + (m11 * arg[5]) + (m12 * arg[8])
    this[2] = (m20 * arg[0]) + (m21 * arg[3]) + (m22 * arg[6])
    this[5] = (m20 * arg[1]) + (m21 * arg[4]) + (m22 * arg[7])
    this[8] = (m20 * arg[2]) + (m21 * arg[5]) + (m22 * arg[8])
  }

  transform (arg: Vector3) {
    const x = (this[0] * arg[0]) + (this[3] * arg[1]) + (this[6] * arg[2])
    const y = (this[1] * arg[0]) + (this[4] * arg[1]) + (this[7] * arg[2])
    const z = (this[2] * arg[0]) + (this[5] * arg[1]) + (this[8] * arg[2])
    
    arg[0] = x
    arg[1] = y
    arg[2] = z
    return arg
  }

  transformed (
    arg: Vector3, 
    out?: Vector3 | null
  ) {
    out = out ?? null
    if (out === null) {
      out = Vector3.copy(arg)
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

  copyFromArray (
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

  applyToVector3Array (
    array: number[], 
    offset = 0
  ) {
    for (let i = 0, j = offset; i < array.length; i += 3, j += 3) {
      // @TODO
      const v = Vector3.array(array, j)
      v.applyMatrix3(this)
      array[j] = v.storage[0]
      array[j + 1] = v.storage[1]
      array[j + 2] = v.storage[2]
    }

    return array
  }

  isIdentity () {
    return (
      this[0] === 1.0 && // col 1
      this[1] === 0.0 &&
      this[2] === 0.0 &&
      this[3] === 0.0 && // col 2
      this[4] === 1.0 &&
      this[5] === 0.0 &&
      this[6] === 0.0 && // col 3
      this[7] === 0.0 &&
      this[8] === 1.0
    )
  }

  isZero () {
    return (
      this[0] === 0.0 && // col 1
      this[1] === 0.0 &&
      this[2] === 0.0 &&
      this[3] === 0.0 && // col 2
      this[4] === 0.0 &&
      this[5] === 0.0 &&
      this[6] === 0.0 && // col 3
      this[7] === 0.0 &&
      this[8] === 0.0
    )
  }


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

  notEqual (other: Matrix3 | null) {
    return !this.equal(other)
  }

  toString () {
    return `[0] ${this.getRow(0)}\n[1] ${this.getRow(1)}\n[2] ${this.getRow(2)}\n'`
  }
}
