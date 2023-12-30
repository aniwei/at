import { clamp } from './helper'
import { Matrix2 } from './matrix2'
import { Vector3 } from './vector3'
import { Vector4 } from './vector4'

export class Vector2 extends Array<number> {
  static zero () {
    return new Vector2()
  }

  static min (a: Vector2, b: Vector2, result: Vector2) {
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
  }

  /// Set the values of [result] to the maximum of [a] and [b] for each line.
  static max (a: Vector2, b: Vector2, result: Vector2) {
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
  }

  
  static mix (min: Vector2, max: Vector2, a: number, result: Vector2) {
    result[0] = min[0] + a * (max[0] - min[0])
    result[1] = min[1] + a * (max[1] - min[1])
  }

  static array (array: number[],offset = 0) {
    const vec = Vector2.zero()
    vec.copyFromArray(array, offset)

    return vec
  }
  
  static all(value: number) {
    const vec = Vector2.zero()
    vec.splat(value)
    return vec
  }

  static copy (other: Vector2) {
    const vec = Vector2.zero()
    vec.setFrom(other)
    return vec
  }

  
  static fromArrayLike (v: Iterable<number>) {
    return new Vector2(...v)
  }

  static fromBuffer (
    buffer: ArrayBuffer, 
    offset: number
  ) {
    return Vector2.fromArrayLike(
      new Float64Array(buffer, offset, Math.floor(buffer.byteLength - 4 / Float64Array.BYTES_PER_ELEMENT))
    )
  }

  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector2(random(), random())
  }

  public get storage () {
    return this
  }

  set length (value: number) {
    if (value === 0.0) {
      this.setZero()
    } else {
      let l = length
      if (l === 0.0) {
        return
      }
      l = value / l
      this[0] *= l
      this[1] *= l
    }
  }

  get length () {
    return Math.sqrt(this.length2)
  }

  get length2 () {
    let sum
    sum = this[0] * this[0]
    sum += this[1] * this[1]
    return sum
  }

  get isInfinite () {
    let isInfinite = false
    isInfinite = isInfinite || !Number.isFinite(this[0])
    isInfinite = isInfinite || !Number.isFinite(this[1])
    return isInfinite
  }

  get isNaN () {
    let isNaN = false
    isNaN = isNaN || Number.isNaN(this[0])
    isNaN = isNaN || Number.isNaN(this[1])
    return isNaN
  }

  get x () {
    return this[0]
  }
  get y () {
    return this[1]
  }

  setValues (x: number, y: number) {
    this[0] = x
    this[1] = y
  }

  setZero () {
    this[0] = 0.0
    this[1] = 0.0
  }

  setFrom (other: Vector2) {
    this[1] = other[1]
    this[0] = other[0]
  }

  splat (arg: number) {
    this[0] = arg
    this[1] = arg
  }

  normalize () {
    const l = length
    if (l === 0.0) {
      return 0.0
    }
    let d = 1.0 / l
    this[0] *= d
    this[1] *= d
    return l
  }

  normalizeLength () {
    return this.normalize()
  }

  normalized () {
    const vec = this.clone()
    vec.normalize()
    return vec
  }

  normalizeInto (out: Vector2) {
    out.setFrom(this)
    out.normalize()

    return out
  }

  distanceTo (arg: Vector2) {
    return Math.sqrt(this.distanceToSquared(arg))
  }

  distanceToSquared (arg: Vector2) {
    const dx = this[0] - arg[0]
    const dy = this[1] - arg[1]

    return dx * dx + dy * dy
  }

  angleTo (other: Vector2) {
    if (
      this[0] === other[0] && 
      this[1] === other[1]
    ) {
      return 0.0
    }

    const d = this.dot(other) / (length * other.length)

    return Math.acos(clamp(d, -1.0, 1.0))
  }

  angleToSigned (other: Vector2) {
    if (
      this[0] === other[0] && 
      this[1] === other[1]
    ) {
      return 0.0
    }

    const s = this.cross(other)
    const c = this.dot(other)

    return Math.atan2(s, c)
  }

  dot (other: Vector2) {
    let sum
    sum = this[0] * other[0]
    sum += this[1] * other[1]
    return sum
  }

  postmultiply (arg: Matrix2) {
    const v0 = this[0]
    const v1 = this[1]
    this[0] = v0 * arg[0] + v1 * arg[1]
    this[1] = v0 * arg[2] + v1 * arg[3]
  }

  
  cross (other: Vector2) {
    return this[0] * other[1] - this[1] * other[0]
  }

  scaleOrthogonalInto (
    scale: number, 
    out: Vector2
  ) {
    out.setValues(-scale * this[1], scale * this[0])
    return out
  }

  reflect (normal: Vector2) {
    this.subtract(normal.scaled(2.0 * normal.dot(this)))
  }

  reflected (normal: Vector2) {
    const vec = this.clone()
    vec.reflect(normal)
    return vec
  }

  relativeError (correct: Vector2) {
    const correctNorm = correct.length
    const diff = this.clone()
    diff.subtract(correct)
    const diffNorm = diff.length
    return diffNorm / correctNorm
  }

  absoluteError (correct: Vector2) {
    const diff = this.clone()
    diff.subtract(correct)
    return diff.length
  }


  add (arg: Vector2 ) {
    this[0] = this[0] + arg[0]
    this[1] = this[1] + arg[1]
  }

  addScaled (
    arg: Vector2, 
    factor: number
  ) {
    this[0] = this[0] + arg[0] * factor
    this[1] = this[1] + arg[1] * factor
  }

  subtract (arg: Vector2) {
    this[0] = this[0] - arg[0]
    this[1] = this[1] - arg[1]
  }

  multiply (arg: Vector2) {
    this[0] = this[0] * arg[0]
    this[1] = this[1] * arg[1]
  }

  divide (arg: Vector2) {
    this[0] = this[0] / arg[0]
    this[1] = this[1] / arg[1]
  }

  scale (arg: number) {
    this[1] = this[1] * arg
    this[0] = this[0] * arg
  }

  scaled (arg: number) {
    const vec = this.clone()
    vec.scale(arg)
    return vec
  }

  negate () {
    this[1] = -this[1]
    this[0] = -this[0]
  }

  absolute () {
    this[1] = Math.abs(this[1])
    this[0] = Math.abs(this[0])
  }

  clamp (
    min: Vector2,
    max:  Vector2
  ) {
    this[0] = clamp(this[0], min[0], max[0])
    this[1] = clamp(this[1], min[1], max[1])
  }

  clampScalar (min: number, max: number) {
    this[0] = clamp(this[0], min, max)
    this[1] = clamp(this[1], min, max)
  }

  floor () {
    this[0] = Math.floor(this[0])
    this[1] = Math.floor(this[1])
  }

  ceil () {
    this[0] = Math.ceil(this[0])
    this[1] = Math.ceil(this[1])
  }

  round () {
    this[0] = Math.round(this[0])
    this[1] = Math.round(this[1])
  }

  roundToZero() {
    this[0] = this[0] < 0.0
      ? Math.ceil(this[0])
      : Math.floor(this[0])
    this[1] = this[1] < 0.0
      ? Math.ceil(this[1])
      : Math.floor(this[1])
  }

  clone () {
    return Vector2.copy(this)
  }

  copyInto(arg: Vector2 ) {
    arg[1] = this[1]
    arg[0] = this[0]
    return arg
  }

  copyIntoArray (
    array: number[], 
    offset = 0
  ) {
    array[offset + 1] = this[1]
    array[offset + 0] = this[0]
  }

  copyFromArray (
    array: number[], 
    offset = 0
  ) {
    this[1] = array[offset + 1]
    this[0] = array[offset + 0]
  }  

  equal (other: Vector2 | null) {
    return (
      (other instanceof Vector2) &&
      (this[0] === other[0]) &&
      (this[1] === other[1])
    )
  }

  notEqual (other: Vector2 | null) {
    return !this.equal(other)
  }

  toString () {
    return `[${this[0]},${this[1]}]`
  }
}
