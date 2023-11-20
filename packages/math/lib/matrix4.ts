import { ArrayLike } from '@at/basic'
import { ArgumentError, invariant } from '@at/utils'
import { Vector3 } from './vector3'

export class Matrix4 extends ArrayLike<Matrix4> {
  static get ZERO () {
    return new Matrix4(...Array(16).fill(0))
  }
  static tryInvert(m4: Matrix4 ): Matrix4 | null {
    const r = Matrix4.ZERO
    const determinant = r.copyInverse(m4)
    if (determinant === 0.0) {
      return null
    }
    return r
  }

  static identity () {
    const m4 = Matrix4.ZERO
    m4[0] = 1.0
    m4[5] = 1.0
    m4[10] = 1.0
    m4[15] = 1.0
    return m4
  }

  static copy(m4: Matrix4) {
    const m = Matrix4.ZERO
    m.setFrom(m4)
    return m
  }

  static inverted (m4: Matrix4) {
    const r = Matrix4.ZERO
    const determinant = r.copyInverse(m4)
    if (determinant === 0.0) {
      throw new ArgumentError()
    }
    return r
  }

  static rotationX (radians: number) {
    const m4 = Matrix4.ZERO
    m4[15] = 1.0
    m4.setRotationX(radians)
    return m4
  }

  static rotationY(radians: number) {
    const m4 = Matrix4.ZERO
    m4[15] = 1.0
    m4.setRotationY(radians)
    return m4
  }

  static rotationZ(radians: number) {
    const m4 = Matrix4.ZERO
    m4[15] = 1.0
    m4.setRotationZ(radians)
    return m4
  }

  static translation (translation: Vector3) {
    const m4 = Matrix4.identity()
    m4.setTranslation(translation)
    return m4
  }

  static translationValues (x: number, y: number, z: number) {
    const m4 = Matrix4.identity()
    m4.setTranslationRaw(x, y, z)
    return m4
  }

  static diagonal3Values (x: number, y: number, z: number) {
    const m4 = Matrix4.ZERO
    m4[15] = 1.0
    m4[10] = z
    m4[5] = y
    m4[0] = x
    return m4
  }

  static fromList (values: number[]) {
    return new Matrix4(...values)
  }

  get dimension () {
    return 4
  }
  
  constructor (...rests: number[]) {
    super(...rests)
  }
  
  index (row: number, col: number) {
    return (col * 4) + row
  }

  entry (row: number, col: number, v?: number): void | number {
    invariant((row >= 0) && (row < this.dimension), 'The argument "row" must be gather than 0')
    invariant((col >= 0) && (col < this.dimension), 'The argument "col" must be gather than 0')

    if (v === undefined) {
      return this[this.index(row, col)]
    }

    this[this.index(row, col)] = v
  }

  column (column: number, v: number[]) {
    const entry = column * 4
    
    for (let i = 0; i < v.length; i++) {
      this[entry + i] = v[i]
    }
  }

  row (row: number, v: number[]) {    
    for (let i = 0; i < v.length; i++) {
      this[this.index(row, i)] = v[i]
    }
  }

  set (
    v0: number,
    v1: number,
    v2: number,
    v3: number,
    v4: number,
    v5: number,
    v6: number,
    v7: number,
    v8: number,
    v9: number,
    v10: number,
    v11: number,
    v12: number,
    v13: number,
    v14: number,
    v15: number
  ) {
    this[15] = v15
    this[14] = v14
    this[13] = v13
    this[12] = v12
    this[11] = v11
    this[10] = v10
    this[9] = v9
    this[8] = v8
    this[7] = v7
    this[6] = v6
    this[5] = v5
    this[4] = v4
    this[3] = v3
    this[2] = v2
    this[1] = v1
    this[0] = v0
  }

  setFrom (m4: Matrix4) {
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

  translate (x: number, y: number = 0.0, z: number = 0.0) {
    const tw = 1.0
    const t1 = this[0] * x + this[4] * y + this[8] * z + this[12] * tw
    const t2 = this[1] * x + this[5] * y + this[9] * z + this[13] * tw
    const t3 = this[2] * x + this[6] * y + this[10] * z + this[14] * tw
    const t4 = this[3] * x + this[7] * y + this[11] * z + this[15] * tw
    this[12] = t1
    this[13] = t2
    this[14] = t3
    this[15] = t4
  }

  scale (x: number, y?: number, z?: number) {
    const sx = x
    const sy = y ?? x
    const sz = z ?? x
    const sw = 1.0
    this[15] *= sw
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
  }

  
  scaled (x: number, y?: number, z?: number) {
    const m4 = this.clone()
    m4.scale(x, y, z)
    return m4
  }
  
  zero () {
    this[15] = 0.0
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
  }

  setIdentity () {
    this[15] = 1.0
    this[0] = 1.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
    this[4] = 0.0
    this[5] = 1.0
    this[6] = 0.0
    this[7] = 0.0
    this[8] = 0.0
    this[9] = 0.0
    this[10] = 1.0
    this[11] = 0.0
    this[12] = 0.0
    this[13] = 0.0
    this[14] = 0.0
  }

  transposed () {
    const m4 = this.clone()
    m4.transpose()
    return m4
  }

  transpose () {
    let v
    v = this[4]
    this[4] = this[1]
    this[1] = v
    v = this[8]
    this[8] = this[2]
    this[2] = v
    v = this[12]
    this[12] = this[3]
    this[3] = v
    v = this[9]
    this[9] = this[6]
    this[6] = v
    v = this[13]
    this[13] = this[7]
    this[7] = v
    v = this[14]
    this[14] = this[11]
    this[11] = v
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

  perspectiveTransform (v3: Vector3) {
    const x = (this[0] * v3[0]) + (this[4] * v3[1]) + (this[8] * v3[2]) + this[12]
    const y = (this[1] * v3[0]) + (this[5] * v3[1]) + (this[9] * v3[2]) + this[13]
    const z = (this[2] * v3[0]) + (this[6] * v3[1]) + (this[10] * v3[2]) + this[14]
    const w = 1.0 / ((this[3] * v3[0]) + (this[7] * v3[1]) + (this[11] * v3[2]) + this[15])
    v3[0] = x * w
    v3[1] = y * w
    v3[2] = z * w
    return v3
  }

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
 
  isIdentityOrTranslation () {
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
    
  getTranslation (): Vector3 {
    const z = this[14]
    const y = this[13]
    const x = this[12]
    return Vector3.create(x, y, z)
  }

  rotate (axis: Vector3, angle: number) {
    const len = axis.distance
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

  setTranslation (t: Vector3) {
    const z = t[2]
    const y = t[1]
    const x = t[0]
    this[14] = z
    this[13] = y
    this[12] = x
  }

  setTranslationRaw (x: number, y: number, z: number) {
    this[12] = x
    this[13] = y
    this[14] = z
  }

  transposeRotation () {
    let v
    v = this[1]
    this[1] = this[4]
    this[4] = v
    v = this[2]
    this[2] = this[8]
    this[8] = v
    v = this[4]
    this[4] = this[1]
    this[1] = v
    v = this[6]
    this[6] = this[9]
    this[9] = v
    v = this[8]
    this[8] = this[2]
    this[2] = v
    v = this[9]
    this[9] = this[6]
    this[6] = v
  }

  invert () {
    return this.copyInverse(this)
  }

  copyInverse (m4: Matrix4) {
    const a00 = m4[0]
    const a01 = m4[1]
    const a02 = m4[2]
    const a03 = m4[3]
    const a10 = m4[4]
    const a11 = m4[5]
    const a12 = m4[6]
    const a13 = m4[7]
    const a20 = m4[8]
    const a21 = m4[9]
    const a22 = m4[10]
    const a23 = m4[11]
    const a30 = m4[12]
    const a31 = m4[13]
    const a32 = m4[14]
    const a33 = m4[15]
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
      this.setFrom(m4)
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
    if (det === 0.0) {
      return 0.0
    }

    const invDet = 1.0 / det
    let ix
    let iy
    let iz
    let jx
    let jy
    let jz
    let kx
    let ky
    let kz
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

  multiply (m4: Matrix4) {
    const m33 = this[15]
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
    const n33 = m4[15]
    const n00 = m4[0]
    const n01 = m4[4]
    const n02 = m4[8]
    const n03 = m4[12]
    const n10 = m4[1]
    const n11 = m4[5]
    const n12 = m4[9]
    const n13 = m4[13]
    const n20 = m4[2]
    const n21 = m4[6]
    const n22 = m4[10]
    const n23 = m4[14]
    const n30 = m4[3]
    const n31 = m4[7]
    const n32 = m4[11]
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

  multiplied (m4: Matrix4) {
    const m = this.clone()
    m.multiply(m4)
    return m
  }

  transposeMultiply (m4: Matrix4) {
    const m33 = this[15]
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

    this[0] = m00 * m4[0] + m01 * m4[1] + m02 * m4[2] + m03 * m4[3]
    this[4] = m00 * m4[4] + m01 * m4[5] + m02 * m4[6] + m03 * m4[7]
    this[8] = m00 * m4[8] + m01 * m4[9] + m02 * m4[10] + m03 * m4[11]
    this[12] = m00 * m4[12] + m01 * m4[13] + m02 * m4[14] + m03 * m4[15]
    this[1] = m10 * m4[0] + m11 * m4[1] + m12 * m4[2] + m13 * m4[3]
    this[5] = m10 * m4[4] + m11 * m4[5] + m12 * m4[6] + m13 * m4[7]
    this[9] = m10 * m4[8] + m11 * m4[9] + m12 * m4[10] + m13 * m4[11]
    this[13] = m10 * m4[12] + m11 * m4[13] + m12 * m4[14] + m13 * m4[15]
    this[2] = m20 * m4[0] + m21 * m4[1] + m22 * m4[2] + m23 * m4[3]
    this[6] = m20 * m4[4] + m21 * m4[5] + m22 * m4[6] + m23 * m4[7]
    this[10] = m20 * m4[8] + m21 * m4[9] + m22 * m4[10] + m23 * m4[11]
    this[14] = m20 * m4[12] + m21 * m4[13] + m22 * m4[14] + m23 * m4[15]
    this[3] = m30 * m4[0] + m31 * m4[1] + m32 * m4[2] + m33 * m4[3]
    this[7] = m30 * m4[4] + m31 * m4[5] + m32 * m4[6] + m33 * m4[7]
    this[11] = m30 * m4[8] + m31 * m4[9] + m32 * m4[10] + m33 * m4[11]
    this[15] = m30 * m4[12] + m31 * m4[13] + m32 * m4[14] + m33 * m4[15]
  }

  multiplyTranspose (m4: Matrix4) {
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
    this[0] = m00 * m4[0] + m01 * m4[4] + m02 * m4[8] + m03 * m4[12]
    this[4] = m00 * m4[1] + m01 * m4[5] + m02 * m4[9] + m03 * m4[13]
    this[8] = m00 * m4[2] + m01 * m4[6] + m02 * m4[10] + m03 * m4[14]
    this[12] = m00 * m4[3] + m01 * m4[7] + m02 * m4[11] + m03 * m4[15]
    this[1] = m10 * m4[0] + m11 * m4[4] + m12 * m4[8] + m13 * m4[12]
    this[5] = m10 * m4[1] + m11 * m4[5] + m12 * m4[9] + m13 * m4[13]
    this[9] = m10 * m4[2] + m11 * m4[6] + m12 * m4[10] + m13 * m4[14]
    this[13] = m10 * m4[3] + m11 * m4[7] + m12 * m4[11] + m13 * m4[15]
    this[2] = m20 * m4[0] + m21 * m4[4] + m22 * m4[8] + m23 * m4[12]
    this[6] = m20 * m4[1] + m21 * m4[5] + m22 * m4[9] + m23 * m4[13]
    this[10] = m20 * m4[2] + m21 * m4[6] + m22 * m4[10] + m23 * m4[14]
    this[14] = m20 * m4[3] + m21 * m4[7] + m22 * m4[11] + m23 * m4[15]
    this[3] = m30 * m4[0] + m31 * m4[4] + m32 * m4[8] + m33 * m4[12]
    this[7] = m30 * m4[1] + m31 * m4[5] + m32 * m4[9] + m33 * m4[13]
    this[11] = m30 * m4[2] + m31 * m4[6] + m32 * m4[10] + m33 * m4[14]
    this[15] = m30 * m4[3] + m31 * m4[7] + m32 * m4[11] + m33 * m4[15]
  }

  rotate3 (v3: Vector3) {
    const x = (this[0] * v3[0]) + (this[4] * v3[1]) + (this[8] * v3[2])
    const y = (this[1] * v3[0]) + (this[5] * v3[1]) + (this[9] * v3[2])
    const z = (this[2] * v3[0]) + (this[6] * v3[1]) + (this[10] * v3[2])
    v3[0] = x
    v3[1] = y
    v3[2] = z
    return v3
  }

  rotated3 (v3: Vector3, out?: Vector3 | null) {
    out ??= null
    if (out === null) {
      out = Vector3.copy(v3)
    } else {
      out.setFrom(v3)
    }
    return this.rotate3(out)
  }

  transform3 (vector: number[]) {
    const x = (this[0] * vector[0]) +
        (this[4] * vector[1]) +
        (this[8] * vector[2]) +
        this[12]
    const y = (this[1] * vector[0]) +
        (this[5] * vector[1]) +
        (this[9] * vector[2]) +
        this[13]
    const z = (this[2] * vector[0]) +
        (this[6] * vector[1]) +
        (this[10] * vector[2]) +
        this[14]
    vector[0] = x
    vector[1] = y
    vector[2] = z
  }

  
  transform2 (vector: number[]) {
    const x = vector[0]
    const y = vector[1]
    vector[0] = (this[0] * x) + (this[4] * y) + this[12]
    vector[1] = (this[1] * x) + (this[5] * y) + this[13]
  }

  copyIntoList (array: number[], i: number = 0) {
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

  copyFromList (array: number[], i: number = 0) {
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

  clone () {
    return Matrix4.copy(this)
  }

  equal (m4: Matrix4 | null): boolean {
    if (m4 instanceof Matrix4) {
      for (let i = 0; i < 16; i++) {
        if (m4[i] !== this[0]) {
          return false
        }
      }

      return true
    }

    return false
  }

  notEqual (m4: Matrix4 | null): boolean {
    return !this.equal(m4)
  }

  toString () {
    return `Matrix4(
      [15]: ${this[15]},
      [14]: ${this[14]},
      [13]: ${this[13]},
      [12]: ${this[12]},
      [11]: ${this[11]},
      [10]: ${this[10]},
      [9]: ${this[9]},
      [8]: ${this[8]},
      [7]: ${this[7]},
      [6]: ${this[6]},
      [5]: ${this[5]},
      [4]: ${this[4]},
      [3]: ${this[3]},
      [2]: ${this[2]},
      [1]: ${this[1]},
      [0]: ${this[0]}
    )`
  }
}
