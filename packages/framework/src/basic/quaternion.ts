import { invariant } from '@at/utils'
import { Matrix3 } from './matrix3'
import { Vector3 } from './vector3'
import { Vector4 } from './vector4'

export class Quaternion extends Array<number> {
  
  get storage () {
    return this
  }

  get x () {
    return this[0]
  }

  set x (x: number) {
    this[0] = x
  }

  get y () {
    return this[1]
  }
  set y (y: number) {
    this[1] = y
  }

  get z () {
    return this[2]
  }
  set z (z: number) {
    this[2] = z
  }

  get w () {
    return this[3]
  }
  set w (w: number) {
    this[3] = w
  }

  static fromRotation (rotationMatrix: Matrix3) {
    const q = new Quaternion()
    q.setFromRotation(rotationMatrix)
    return q
  }

  static axisAngle (
    axis: Vector3, 
    angle: number
  ) {
    const q = new Quaternion()
    q.setAxisAngle(axis, angle)
    return q
  }

  static fromTwoVectors (
    a: Vector3, 
    b: Vector3
  ) {
    const q = new Quaternion()
    q.setFromTwoVectors(a, b)
    return q
  }

  static copy (original: Quaternion) {
    const q = new Quaternion()
    q.setFrom(original)
    return q
  }

  static random (random: { (): number }) {
    const q = new Quaternion()
    q.setRandom(random)
    return q
  }

  static identity () {
    const q = new Quaternion
    q[3] = 1.0
    return q
  }

  static dq (
    q: Quaternion, 
    omega: Vector3
  ) {
    const nQ = new Quaternion()
    nQ.setDQ(q, omega)
    return nQ
  }

  static euler (
    yaw: number, 
    pitch: number, 
    roll: number
  ) {
    const q = new Quaternion()
    q.setEuler(yaw, pitch, roll)
    return q
  }

  static fromArrayLike (q: Iterable<number>) {
    return new Quaternion(...q)
  }

  static fromBuffer (
    buffer: ArrayBuffer,
    offset: number = 0,
    length?: number
  ) {
    length ??= Math.floor((buffer.byteLength - offset) / Float64Array.BYTES_PER_ELEMENT) 

    return Vector4.fromArrayLike(new Float64Array(
      buffer,
      offset,
      length
    ))

  }

  // Quaternion.fromBuffer(ByteBuffer buffer, int offset)
  //     : _qStorage = Float64List.view(buffer, offset, 4);

  clone () {
    return Quaternion.copy(this)
  }

  setFrom (source: Quaternion) {
    this[0] = source[0]
    this[1] = source[1]
    this[2] = source[2]
    this[3] = source[3]
  }

  setValues (
    x: number, 
    y: number, 
    z: number, 
    w: number
  ) {
    this[0] = x
    this[1] = y
    this[2] = z
    this[3] = w
  }

  setAxisAngle (
    axis: Vector3, 
    radians: number
  ) {
    const len = axis.length
    if (len === 0.0) {
      return
    }
    const halfSin = Math.sin(radians * 0.5) / len
    this[0] = axis[0] * halfSin
    this[1] = axis[1] * halfSin
    this[2] = axis[2] * halfSin
    this[3] = Math.cos(radians * 0.5)
  }

  setFromRotation (rotationMatrix: Matrix3) {
    const rotationMatrixStorage = rotationMatrix.storage
    const trace = rotationMatrix.trace()
    if (trace > 0.0) {
      let s = Math.sqrt(trace + 1.0)
      this[3] = s * 0.5
      s = 0.5 / s
      this[0] = (rotationMatrixStorage[5] - rotationMatrixStorage[7]) * s
      this[1] = (rotationMatrixStorage[6] - rotationMatrixStorage[2]) * s
      this[2] = (rotationMatrixStorage[1] - rotationMatrixStorage[3]) * s
    } else {
      const i = rotationMatrixStorage[0] < rotationMatrixStorage[4]
          ? (rotationMatrixStorage[4] < rotationMatrixStorage[8] ? 2 : 1)
          : (rotationMatrixStorage[0] < rotationMatrixStorage[8] ? 2 : 0)
      const j = (i + 1) % 3
      const k = (i + 2) % 3
      let s = Math.sqrt(
        rotationMatrixStorage[rotationMatrix.index(i, i)] -
        rotationMatrixStorage[rotationMatrix.index(j, j)] -
        rotationMatrixStorage[rotationMatrix.index(k, k)] + 1.0
      )
      this[i] = s * 0.5
      s = 0.5 / s
      this[3] = (
        rotationMatrixStorage[rotationMatrix.index(k, j)] -
        rotationMatrixStorage[rotationMatrix.index(j, k)]
      ) * s
      this[j] = (
        rotationMatrixStorage[rotationMatrix.index(j, i)] +
        rotationMatrixStorage[rotationMatrix.index(i, j)]
      ) * s
      this[k] = (
        rotationMatrixStorage[rotationMatrix.index(k, i)] +
        rotationMatrixStorage[rotationMatrix.index(i, k)]
      ) * s
    }
  }

  setFromTwoVectors (
    a: Vector3, 
    b: Vector3
  ) {
    const v1 = a.normalized()
    const v2 = b.normalized()

    const c = v1.dot(v2)
    let angle = Math.acos(c)
    let axis = v1.cross(v2)

    if (Math.abs(1.0 + c) < 0.0005) {
      angle = Math.PI

     
      if (v1[0] > v1[1] && v1[0] > v1[2]) {
        axis = v1.cross(new Vector3(0.0, 1.0, 0.0))
      } else {
        axis = v1.cross(new Vector3(1.0, 0.0, 0.0))
      }
    } else if (Math.abs(1.0 - c) < 0.0005) {
      angle = 0.0
      axis = new Vector3(1.0, 0.0, 0.0)
    }

    this.setAxisAngle(axis.normalized(), angle)
  }

  setRandom (random: { (): number }) {
    const x0 = random()
    const r1 = Math.sqrt(1.0 - x0)
    const r2 = Math.sqrt(x0)
    const t1 = Math.PI * 2.0 * random()
    const t2 = Math.PI * 2.0 * random()
    const c1 = Math.cos(t1)
    const s1 = Math.sin(t1)
    const c2 = Math.cos(t2)
    const s2 = Math.sin(t2)
    this[0] = s1 * r1;
    this[1] = c1 * r1;
    this[2] = s2 * r2;
    this[3] = c2 * r2;
  }

  setDQ (
    q: Quaternion, 
    omega: Vector3
  ) {
    const qx = q[0]
    const qy = q[1]
    const qz = q[2]
    const qw = q[3]
    const ox = omega[0]
    const oy = omega[1]
    const oz = omega[2]
    const x = ox * qw + oy * qz - oz * qy
    const y = oy * qw + oz * qx - ox * qz
    const z = oz * qw + ox * qy - oy * qx
    const w = -ox * qx - oy * qy - oz * qz
    this[0] = x * 0.5
    this[1] = y * 0.5
    this[2] = z * 0.5
    this[3] = w * 0.5
  }

  setEuler (
    yaw: number, 
    pitch: number, 
    roll: number
  ) {
    const halfYaw = yaw * 0.5
    const halfPitch = pitch * 0.5
    const halfRoll = roll * 0.5
    const cosYaw = Math.cos(halfYaw)
    const sinYaw = Math.sin(halfYaw)
    const cosPitch = Math.cos(halfPitch)
    const sinPitch = Math.sin(halfPitch)
    const cosRoll = Math.cos(halfRoll)
    const sinRoll = Math.sin(halfRoll)
    this[0] = cosRoll * sinPitch * cosYaw + sinRoll * cosPitch * sinYaw
    this[1] = cosRoll * cosPitch * sinYaw - sinRoll * sinPitch * cosYaw
    this[2] = sinRoll * cosPitch * cosYaw - cosRoll * sinPitch * sinYaw
    this[3] = cosRoll * cosPitch * cosYaw + sinRoll * sinPitch * sinYaw
  }

  
  normalize () {
    const l = length
    if (l === 0.0) {
      return 0.0
    }
    const d = 1.0 / l
    this[0] *= d
    this[1] *= d
    this[2] *= d
    this[3] *= d
    return l
  }

  
  conjugate () {
    this[2] = -this[2]
    this[1] = -this[1]
    this[0] = -this[0]
  }

  inverse () {
    const l = 1.0 / this.length2
    this[3] = this[3] * l
    this[2] = -this[2] * l
    this[1] = -this[1] * l
    this[0] = -this[0] * l
  }

  normalized () {
    const q = this.clone()
    q.normalize()
    return q
  }

  conjugated () {
    const q = this.clone()
    q.conjugate()
    return q
  }

  inverted () {
    const q = this.clone()
    q.inverse()
    return q
  }

  get radians () {
    return 2.0 * Math.acos(this[3])
  } 

  get axis () {
    const den = 1.0 - (this[3] * this[3])
    if (den < 0.0005) {
      return Vector3.zero()
    }

    const scale = 1.0 / Math.sqrt(den)
    return new Vector3(
      this[0] * scale, 
      this[1] * scale, 
      this[2] * scale
    )
  }

  get length2 () {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    const w = this[3]
    return (x * x) + (y * y) + (z * z) + (w * w)
  }

  get length () {
    return Math.sqrt(this.length2)
  }

  rotated (v: Vector3) {
    const out = v.clone()
    this.rotate(out)
    return out
  }

  rotate (v: Vector3) {
    const w = this[3]
    const z = this[2]
    const y = this[1]
    const x = this[0]
    const tiw = w
    const tiz = -z
    const tiy = -y
    const tix = -x
    const tx = tiw * v[0] + tix * 0.0 + tiy * v[2] - tiz * v[1]
    const ty = tiw * v[1] + tiy * 0.0 + tiz * v[0] - tix * v[2]
    const tz = tiw * v[2] + tiz * 0.0 + tix * v[1] - tiy * v[0]
    const tw = tiw * 0.0 - tix * v[0] - tiy * v[1] - tiz * v[2]
    const resultX = tw * x + tx * w + ty * z - tz * y
    const resultY = tw * y + ty * w + tz * x - tx * z
    const resultZ = tw * z + tz * w + tx * y - ty * x
    v[2] = resultX
    v[1] = resultY
    v[0] = resultZ
    return v
  }

  add (arg: Quaternion) {
    this[0] = this[0] + arg[0]
    this[1] = this[1] + arg[1]
    this[2] = this[2] + arg[2]
    this[3] = this[3] + arg[3]
  }

  
  substract (arg: Quaternion) {
    this[0] = this[0] - arg[0]
    this[1] = this[1] - arg[1]
    this[2] = this[2] - arg[2]
    this[3] = this[3] - arg[3]
  }

  scale (scale: number) {
    this[3] = this[3] * scale
    this[2] = this[2] * scale
    this[1] = this[1] * scale
    this[0] = this[0] * scale
  }

  scaled (scale: number) {
    const q = this.clone()
    q.scale(scale)
    return q
  }

  asRotationMatrix () {
    return this.copyRotationInto(Matrix3.zero())
  }

  
  copyRotationInto (rotationMatrix: Matrix3) {
    const d = this.length2
    invariant(d !== 0.0)
    const s = 2.0 / d

    const x = this[0]
    const y = this[1]
    const z = this[2]
    const w = this[3]

    const xs = x * s
    const ys = y * s
    const zs = z * s

    const wx = w * xs
    const wy = w * ys
    const wz = w * zs

    const xx = x * xs
    const xy = x * ys
    const xz = x * zs

    const yy = y * ys
    const yz = y * zs
    const zz = z * zs

    const rotationMatrixStorage = rotationMatrix
    rotationMatrixStorage[0] = 1.0 - (yy + zz) // column 0
    rotationMatrixStorage[1] = xy + wz
    rotationMatrixStorage[2] = xz - wy
    rotationMatrixStorage[3] = xy - wz // column 1
    rotationMatrixStorage[4] = 1.0 - (xx + zz)
    rotationMatrixStorage[5] = yz + wx
    rotationMatrixStorage[6] = xz + wy // column 2
    rotationMatrixStorage[7] = yz - wx
    rotationMatrixStorage[8] = 1.0 - (xx + yy)
    return rotationMatrix
  }

  
  toString () {
    return `${this[0]}, ${this[1]},${this[2]},${this[3]}`
  }

  relativeError (correct: Quaternion) {
    const diff = correct.clone()
    diff.substract(this)
    const normDiff = diff.length
    const correctNorm = correct.length
    return normDiff / correctNorm
  }

  absoluteError (correct: Quaternion) {
    const thisNorm = length
    const correctNorm = correct.length
    const normDiff = Math.abs((thisNorm - correctNorm))
    return normDiff
  }
}
