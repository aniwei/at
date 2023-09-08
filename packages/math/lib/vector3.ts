import { clamp } from './helper'
import { Matrix3 } from './matrix3'
import { Matrix4 } from './matrix4'
import { Vector2 } from './vector2'
import { Vector4 } from './vector4'
import { Quaternion } from './quaternion'

export class Vector3 extends Computable<Vector3> implements ArrayLike<number> {
  static ZERO = new Vector3()

  static min (a: Vector3, b: Vector3, result: Vector3) {
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
    result[2] = Math.min(a[2], b[2])
  }

  static max (a: Vector3, b: Vector3, result: Vector3) {
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
    result[2] = Math.max(a[2], b[2])
  }

  static copyFromArray (array: number[], offset = 0) {
    const vec = Vector3.zero()
    vec.copyFromArray(array, offset)
    return vec
  }

  static all (value: number) {
    const v = Vector3.zero()
    v.splat(value)
    return v
  }

  static copy (other: Vector3) {
    const v = Vector3.zero()
    v.setFrom(other)

    return v
  }

  static fromArrayLike (v3: ArrayLike<number>) {
    return new Vector3(...v3)
  }

  static fromBuffer (
    buffer: ArrayBuffer, 
    offset: number
  ) {
    // @TODO
  }

  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector3(random(), random(), random())
  }

  get storage () {
    return this
  }

  set length (value: number) {
    if (value === 0) {
      this.setZero()
    } else {
      let l = length
      if (l === 0.0) {
        return
      }

      l = value / l
      this[0] *= l
      this[1] *= l
      this[2] *= l
    }
  }

  get length () {
    return Math.sqrt(this.length2)
  }

  get length2 () {
    let sum
    sum = this[0] * this[0]
    sum += this[1] * this[1]
    sum += this[2] * this[2]
    return sum
  }

  get isInfinite () {
    let isInfinite = false
    isInfinite = isInfinite || Number.isFinite(this[0])
    isInfinite = isInfinite || Number.isFinite(this[1])
    isInfinite = isInfinite || Number.isFinite(this[2])
    return isInfinite
  }

  get isNaN () {
    let isNaN = false
    isNaN = isNaN || Number.isNaN(this[0])
    isNaN = isNaN || Number.isNaN(this[1])
    isNaN = isNaN || Number.isNaN(this[2])
    return isNaN
  }

  get x () {
    return this[0]
  }
  get y () {
    return this[1]
  }
  get z () {
    return this[2]
  }

  setValues (x: number, y: number, z: number) {
    this[0] = x
    this[1] = y
    this[2] = z
  }

  setZero () {
    this[0] = 0
    this[1] = 0
    this[2] = 0
  }

  setFrom (other: Vector3) {
    this[0] = other[0]
    this[1] = other[1]
    this[2] = other[2]
  }

  splat (arg: number) {
    this[0] = arg
    this[1] = arg
    this[2] = arg
  }

  normalize () {
    const l = this.length
    if (l === 0) {
      return 0
    }
    const d = 1 / l
    this[0] *= d
    this[1] *= d
    this[2] *= d
    return l
  }

  normalizeLength () {
    return this.normalize()
  }

  normalized () {
    const v = Vector3.copy(this)
    v.normalize()
    return v
  }

  normalizeInto (out: Vector3) {
    out.setFrom(this)
    out.normalize()
    return out
  }

  distanceTo (v: Vector3) {
    return Math.sqrt(this.distanceToSquared(v))
  }

  distanceToSquared (v: Vector3) {
    const dx = this[0] - v[0]
    const dy = this[1] - v[1]
    const dz = this[2] - v[2]

    return dx * dx + dy * dy + dz * dz
  }

  angleTo (other: Vector3) {
    if (
      this[0] === other[0] &&
      this[1] === other[1] &&
      this[2] === other[2]
    ) {
      return 0
    }

    const d = this.dot(other) / (length * other.length)

    return Math.acos(clamp(d, -1.0, 1.0))
  }

  angleToSigned (other: Vector3, normal: Vector3) {
    const angle = this.angleTo(other)
    const c = this.cross(other)
    const d = c.dot(normal)

    return d < 0.0 ? -angle : angle
  }

  dot (other: Vector3) {
    let sum
    sum = this[0] * other[0]
    sum += this[1] * other[1]
    sum += this[2] * other[2]
    return sum
  }

  
  postmultiply (arg: Matrix3) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]

    this[0] = v0 * arg[0] + v1 * arg[1] + v2 * arg[2]
    this[1] = v0 * arg[3] + v1 * arg[4] + v2 * arg[5]
    this[2] = v0 * arg[6] + v1 * arg[7] + v2 * arg[8]
  }

  cross (other: Vector3) {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    const ox = other[0]
    const oy = other[1]
    const oz = other[2]
    return new Vector3(
      y * oz - z * oy, 
      z * ox - x * oz, 
      x * oy - y * ox
    )
  }

  crossInto (other: Vector3, out: Vector3) {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    const ox = other[0]
    const oy = other[1]
    const oz = other[2]
    out[0] = y * oz - z * oy
    out[1] = z * ox - x * oz
    out[2] = x * oy - y * ox
    return out
  }

  reflect (normal: Vector3) {
    this.substract(normal.scaled(2.0 * normal.dot(this)))
  }

  reflected (normal: Vector3) {
    const vec = this.clone()
    vec.reflect(normal)
    return vec
  }

  applyProjection (m: Matrix4) {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    const d = (
      1 / (
        m[3] * x +
        m[7] * y +
        m[11] * z +
        m[15]
      )
    )
    this[0] = (
      m[0] * x +
      m[4] * y +
      m[8] * z +
      m[12]
    ) * d
    this[1] = (
      m[1] * x +
      m[5] * y +
      m[9] * z +
      m[13]
    ) * d
    this[2] = (
      m[2] * x +
      m[6] * y +
      m[10] * z +
      m[14]
    ) * d
  }

  applyAxisAngle (axis: Vector3, angle: number) {
    this.applyQuaternion(Quaternion.axisAngle(axis, angle))
  }

  applyQuaternion (arg: Quaternion) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]
    const qx = arg[0]
    const qy = arg[1]
    const qz = arg[2]
    const qw = arg[3]
    const ix = qw * v0 + qy * v2 - qz * v1
    const iy = qw * v1 + qz * v0 - qx * v2
    const iz = qw * v2 + qx * v1 - qy * v0
    const iw = -qx * v0 - qy * v1 - qz * v2
    this[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
    this[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
    this[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx
  }

  applyMatrix3 (arg: Matrix3) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]
    this[0] = arg[0] * v0 + arg[3] * v1 + arg[6] * v2
    this[1] = arg[1] * v0 + arg[4] * v1 + arg[7] * v2
    this[2] = arg[2] * v0 + arg[5] * v1 + arg[8] * v2
  }

  applyMatrix4 (arg: Matrix4) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]
    this[0] = arg[0] * v0 + arg[4] * v1 + arg[8] * v2 + arg[12]
    this[1] = arg[1] * v0 + arg[5] * v1 + arg[9] * v2 + arg[13]
    this[2] = arg[2] * v0 + arg[6] * v1 + arg[10] * v2 + arg[14]
  }

  relativeError (correct: Vector3) {
    const correctNorm = correct.length
    const diff = this.clone()
    diff.substract(correct)
    const diffNorm = diff.length
    return diffNorm / correctNorm
  }

  absoluteError (correct: Vector3) {
    const diff = this.clone()
    diff.substract(correct)
    return diff.length
  }

  add (v: Vector3) {
    this[0] = this[0] + v[0]
    this[1] = this[1] + v[1]
    this[2] = this[2] + v[2]
  }

  addScaled (v: Vector3, factor: number) {
    this[0] = this[0] + v[0] * factor
    this[1] = this[1] + v[1] * factor
    this[2] = this[2] + v[2] * factor
  }

  substract (v: Vector3) {
    this[0] = this[0] - v[0]
    this[1] = this[1] - v[1]
    this[2] = this[2] - v[2]
  }

  multiply (v: Vector3 | number) {
    if (v instanceof Vector3) {
      this[0] = this[0] * v[0]
      this[1] = this[1] * v[1]
      this[2] = this[2] * v[2]
      return this
    } 
    
    return this.scaled(v)
  }

  divide (v: Vector3) {
    this[0] = this[0] / v[0]
    this[1] = this[1] / v[1]
    this[2] = this[2] / v[2]
  }

  scale (arg: number) {
    this[2] = this[2] * arg
    this[1] = this[1] * arg
    this[0] = this[0] * arg
  }

  scaled (arg: number) {
    const v = this.clone()
    v.scale(arg)

    return v
  }

  negate () {
    this[2] = -this[2]
    this[1] = -this[1]
    this[0] = -this[0]
  }

  absolute () {
    this[0] = Math.abs(this[0])
    this[1] = Math.abs(this[1])
    this[2] = Math.abs(this[2])
  }

  clamp (
    min: Vector3, 
    max: Vector3
  ) {
    this[0] = clamp(this[0], min[0], max[0])
    this[1] = clamp(this[1], min[1], max[1])
    this[2] = clamp(this[2], min[2], max[2])
  }

  clampScalar (
    min: number, 
    max: number
  ) {
    this[0] = clamp(this[0], min, max)
    this[1] = clamp(this[1], min, max)
    this[2] = clamp(this[2], min, max)
  }

  floor () {
    this[0] = Math.floor(this[0])
    this[1] = Math.floor(this[1])
    this[2] = Math.floor(this[2])
  }

  ceil () {
    this[0] = Math.ceil(this[0])
    this[1] = Math.ceil(this[1])
    this[2] = Math.ceil(this[2])
  }

  round () {
    this[0] = Math.round(this[0])
    this[1] = Math.round(this[1])
    this[2] = Math.round(this[2])
  }

  roundToZero () {
    this[0] = this[0] < 0.0
        ? Math.ceil(this[0])
        : Math.floor(this[0])
    this[1] = this[1] < 0.0
        ? Math.ceil(this[1])
        : Math.floor(this[1])
    this[2] = this[2] < 0.0
        ? Math.ceil(this[2])
        : Math.floor(this[2])
  }

  clone () {
    return Vector3.copy(this)
  }

  copyInto (v: Vector3) {
    v[0] = this[0]
    v[1] = this[1]
    v[2] = this[2]
    return v
  }

  copyIntoArray (
    array: number[], 
    offset = 0
  ) {
    array[offset + 2] = this[2]
    array[offset + 1] = this[1]
    array[offset + 0] = this[0]
  }

  copyFromArray (
    array: number[], 
    offset = 0
  ) {
    this[2] = array[offset + 2]
    this[1] = array[offset + 1]
    this[0] = array[offset + 0]
  }

  equal (other: Vector3 | null) {
    return (
      (other instanceof Vector3) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2])
    )
  }

  notEqual (other: Vector3 | null) {
    return !this.equal(other)
  }

  toString () {
    return `[${this.storage[0]},${this.storage[1]},${this.storage[2]}]`
  }
}
