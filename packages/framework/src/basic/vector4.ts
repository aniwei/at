import { clamp } from './helper'
import { Vector2 } from './vector2'
import { Vector3 } from './vector3'
import { Matrix4 } from './matrix4'

export class Vector4 extends Array<number> {
  static min (
    a: Vector4, 
    b: Vector4, 
    result: Vector4
  ) {
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
    result[2] = Math.min(a[2], b[2])
    result[3] = Math.min(a[3], b[3])
  }

  /// Set the values of [result] to the maximum of [a] and [b] for each line.
  static max(
    a: Vector4, 
    b: Vector4, 
    result: Vector4
  ) {
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
    result[2] = Math.max(a[2], b[2])
    result[3] = Math.max(a[3], b[3])
  }

  static mix(
    min: Vector4, 
    max: Vector4, 
    a: number, 
    result: Vector4
  ) {
    result[0] = min[0] + a * (max[0] - min[0])
    result[1] = min[1] + a * (max[1] - min[1])
    result[2] = min[2] + a * (max[2] - min[2])
    result[3] = min[3] + a * (max[3] - min[3])
  }

  static array (
    array: number[], 
    offset = 0
  ) {
    const vec = Vector4.zero()
    vec.copyFromArray(array, offset)
    return vec
  }

  static zero() {
    const vec = new Vector4(4)
    return vec
  }

  static identity () {
    const vec = Vector4.zero()
    vec.setIdentity()
    return vec
  } 

  static all (value: number) {
    const vec = Vector4.zero()
    vec.splat(value)
    return vec
  } 

  static copy (other: Vector4) {
    const vec = Vector4.zero()
    vec.setFrom(other)
    return vec
  }

  static fromArrayLike (v4: Iterable<number>) {
    return new Vector4(...v4)
  }

  
  static fromBuffer (
    buffer: ArrayBuffer, 
    offset: number,
    length: number = 4
  ) {
    length ??= Math.floor(
      (buffer.byteLength - offset) / 
      Float64Array.BYTES_PER_ELEMENT
    )

    return Vector4.fromArrayLike(new Float64Array(
      buffer, 
      offset, 
      length
    ))
  }
 

  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector4(random(), random(), random())
  }

  public get storage () {
    return this
  }

  set length (value: number) {
    if (value === 0.0) {
      this.setZero()
    } else {
      var l = length
      if (l === 0.0) {
        return
      }
      l = value / l
      this[0] *= l
      this[1] *= l
      this[2] *= l
      this[3] *= l
    }
  }

  get length () { 
    return Math.sqrt(this.length2)
  } 

  get length2 () {
    let sum: number
    sum = this[0] * this[0]
    sum += this[1] * this[1]
    sum += this[2] * this[2]
    sum += this[3] * this[3]
    return sum
  }

  get isInfinite () {
    let isInfinite = false
    isInfinite = isInfinite || (!Number.isFinite(this[0]))
    isInfinite = isInfinite || (!Number.isFinite(this[1]))
    isInfinite = isInfinite || (!Number.isFinite(this[2]))
    isInfinite = isInfinite || (!Number.isFinite(this[3]))
    return isInfinite
  }

  get isNaN () {
    let isNaN = false
    isNaN = isNaN || Number.isNaN(this[0])
    isNaN = isNaN || Number.isNaN(this[1])
    isNaN = isNaN || Number.isNaN(this[2])
    isNaN = isNaN || Number.isNaN(this[3])
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
  get w () {
    return this[3]
  }

  setValues (x: number, y: number, z: number, w: number) {
    this[3] = w
    this[2] = z
    this[1] = y
    this[0] = x
  }

  setZero () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
  }

  setIdentity () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 1.0
  }

  setFrom (other: Vector4) {
    this[3] = other[3]
    this[2] = other[2]
    this[1] = other[1]
    this[0] = other[0]
  }

  splat (arg: number) {
    this[3] = arg
    this[2] = arg
    this[1] = arg
    this[0] = arg
  }

  normalize () {
    let l = length
    if (l === 0.0) {
      return 0.0
    }
    let d = 1.0 / l
    this[0] *= d
    this[1] *= d
    this[2] *= d
    this[3] *= d
    return l
  }
  
  normalizeLength () {
    return this.normalize()
  }

  normalized (): Vector4  {
    const vec = this.clone()
    vec.normalize()
    return vec
  } 

  normalizeInto (out: Vector4): Vector4 {
    out.setFrom(this)
    out.normalize()
    return out
  }

  distanceTo (arg: Vector4) {
    return Math.sqrt(this.distanceToSquared(arg))
  } 

  distanceToSquared (arg: Vector4) {
    const dx = this[0] - arg[0]
    const dy = this[1] - arg[1]
    const dz = this[2] - arg[2]
    const dw = this[3] - arg[3]

    return dx * dx + dy * dy + dz * dz + dw * dw
  }

  dot (other: Vector4) {
    let sum
    sum = this[0] * other[0]
    sum += this[1] * other[1]
    sum += this[2] * other[2]
    sum += this[3] * other[3]
    return sum
  }

  applyMatrix4 (arg: Matrix4) {
    const v1 = this[0]
    const v2 = this[1]
    const v3 = this[2]
    const v4 = this[3]
    this[0] = (
      arg[0] * v1 +
      arg[4] * v2 +
      arg[8] * v3 +
      arg[12] * v4
    )
    this[1] = (
      arg[1] * v1 +
      arg[5] * v2 +
      arg[9] * v3 +
      arg[13] * v4
    )
    this[2] = (
      arg[2] * v1 +
      arg[6] * v2 +
      arg[10] * v3 +
      arg[14] * v4
    )
    this[3] = (
      arg[3] * v1 +
      arg[7] * v2 +
      arg[11] * v3 +
      arg[15] * v4
    )
  }

  relativeError (correct: Vector4) {
    this.substract(correct)
    const correctNorm = correct.length
    const diffNorm = this.length
    return diffNorm / correctNorm
  }

  absoluteError (correct: Vector4) {
    this.substract(correct)
    return this.length
  }

  add (arg: Vector4) {
    this[0] = this[0] + arg[0]
    this[1] = this[1] + arg[1]
    this[2] = this[2] + arg[2]
    this[3] = this[3] + arg[3]
  }

  addScaled (
    arg: Vector4, 
    factor: number
  ) {
    this[0] = this[0] + arg[0] * factor
    this[1] = this[1] + arg[1] * factor
    this[2] = this[2] + arg[2] * factor
    this[3] = this[3] + arg[3] * factor
  }

  substract (arg: Vector4) {
    this[0] = this[0] - arg[0]
    this[1] = this[1] - arg[1]
    this[2] = this[2] - arg[2]
    this[3] = this[3] - arg[3]
    return this
  }

  
  multiply (arg: Vector4) {
    this[0] = this[0] * arg[0]
    this[1] = this[1] * arg[1]
    this[2] = this[2] * arg[2]
    this[3] = this[3] * arg[3]
  }

  divide (arg: Vector4) {
    this[0] = this[0] / arg[0]
    this[1] = this[1] / arg[1]
    this[2] = this[2] / arg[2]
    this[3] = this[3] / arg[3]
  }

  scale (arg: number) {
    this[0] = this[0] * arg
    this[1] = this[1] * arg
    this[2] = this[2] * arg
    this[3] = this[3] * arg
  }

  scaled (arg: number) {
    const vec = this.clone()
    vec.scale(arg)
    return vec
  }

  negate () {
    this[0] = -this[0]
    this[1] = -this[1]
    this[2] = -this[2]
    this[3] = -this[3]
  }

  absolute() {
    this[3] = Math.abs(this[3])
    this[2] = Math.abs(this[2])
    this[1] = Math.abs(this[1])
    this[0] = Math.abs(this[0])
  }

  clamp (
    min: Vector4, 
    max: Vector4
  ) {
    this[0] = clamp(this[0], min[0], max[0])
    this[1] = clamp(this[1], min[1], max[1])
    this[2] = clamp(this[2], min[2], max[2])
    this[3] = clamp(this[3], min[3], max[3])
  }

  clampScalar (min: number, max: number) {
    this[0] = clamp(this[0], min, max)
    this[1] = clamp(this[1], min, max)
    this[2] = clamp(this[2], min, max)
    this[3] = clamp(this[3], min, max)
  }

  floor () {
    this[0] = Math.floor(this[0])
    this[1] = Math.floor(this[1])
    this[2] = Math.floor(this[2])
    this[3] = Math.floor(this[3])
  }

  ceil () {
    this[0] = Math.ceil(this[0])
    this[1] = Math.ceil(this[1])
    this[2] = Math.ceil(this[2])
    this[3] = Math.ceil(this[3])
  }

  round () {
    this[0] = Math.round(this[0])
    this[1] = Math.round(this[1])
    this[2] = Math.round(this[2])
    this[3] = Math.round(this[3])
  }

  roundToZero() {
    this[0] = this[0] < 0.0
      ? Math.ceil(this[0])
      : Math.floor(this[0])
    this[1] = this[1] < 0.0
      ? Math.ceil(this[1])
      : Math.floor(this[1])
    this[2] = this[2] < 0.0
      ? Math.ceil(this[2])
      : Math.floor(this[2])
    this[3] = this[3] < 0.0
      ? Math.ceil(this[3])
      : Math.floor(this[3])
  }

  copyInto (arg: Vector4) {
    arg[0] = this[0]
    arg[1] = this[1]
    arg[2] = this[2]
    arg[3] = this[3]
    return arg
  }

  copyIntoArray (
    array: number[], 
    offset = 0
  ) {
    array[offset + 0] = this[0]
    array[offset + 1] = this[1]
    array[offset + 2] = this[2]
    array[offset + 3] = this[3]
  }

  copyFromArray (
    array: number[], 
    offset = 0
  ) {
    this[0] = array[offset + 0]
    this[1] = array[offset + 1]
    this[2] = array[offset + 2]
    this[3] = array[offset + 3]
  }

  clone () {
    return Vector4.copy(this)
  }

  
  equal (other: Vector4 | null)  {
    return (
      (other instanceof Vector4) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2]) &&
      (this[3] === other[3])
    )
  }

  notEqual (other: Vector4 | null) {
    return !this.equal(other)
  }

  toString () {
    return `Vector4(${this[0]},${this[1]},${this[2]},${this[3]})`
  }
}
