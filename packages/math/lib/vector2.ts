import { clamp, Numberic } from '@at/basic'
import { Matrix2 } from './matrix2'

// 二维向量
export class Vector2 extends Numberic<Vector2> {
  static ZERO = new Vector2()

  /**
   * 
   * @param {Vector2} a 
   * @param {Vector2} b 
   * @param result 
   */
  static min (
    a: Vector2, 
    b: Vector2,
  ) {
    const result = Vector2.ZERO.clone()
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
  }

  /**
   * 
   * @param {Vector2} a 
   * @param {Vector2} b 
   * @param result 
   */
  static max (
    a: Vector2, 
    b: Vector2,
  ) {
    const result = Vector2.ZERO.clone()
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
  }

  /**
   * 
   * @param min 
   * @param max 
   * @param a 
   * @param result 
   */
  static mix (
    min: Vector2, 
    max: Vector2, 
    a: number
  ) {
    const result = Vector2.ZERO.clone()
    result[0] = min[0] + a * (max[0] - min[0])
    result[1] = min[1] + a * (max[1] - min[1])
  }

  /**
   * 
   * @param array 
   * @param offset 
   * @returns 
   */
  static copyFromArray (array: number[], offset = 0) {
    const vec = Vector2.ZERO.clone()
    vec.copyFromArray(array, offset)

    return vec
  }
  
  /**
   * 
   * @param value 
   * @returns 
   */
  static all (value: number) {
    const vec = Vector2.ZERO.clone()
    vec.splat(value)
    return vec
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  static copy (other: Vector2): Vector2 {
    const vec = Vector2.ZERO.clone()
    vec.from(other)
    return vec
  }

  /**
   * 
   * @param v 
   * @returns 
   */
  static fromList (v: Iterable<number>) {
    return new Vector2(...v)
  }

  /**
   * 
   * @param buffer 
   * @param offset 
   * @returns 
   */
  static fromBuffer (
    buffer: ArrayBuffer, 
    offset: number
  ) {
    return Vector2.fromList(
      new Float64Array(
        buffer, 
        offset, 
        Math.floor(buffer.byteLength - 4 / Float64Array.BYTES_PER_ELEMENT)
      )
    )
  }

  /**
   * 
   * @param random 
   * @returns 
   */
  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector2(random(), random())
  }

  // => storage
  public get storage () {
    return this
  }

  // => distance
  set distance (value: number) {
    if (value === 0.0) {
      this.zero()
    } else {
      let l = length
      if (l !== 0.0) {
        l = value / l
        this[0] *= l
        this[1] *= l
      }
    }
  }
  get distance () {
    return Math.sqrt(this.distance2)
  }

  // => distance2
  get distance2 () {
    let sum
    sum = this[0] * this[0]
    sum += this[1] * this[1]
    return sum
  }

  // => x
  get x () {
    return this[0]
  }
  // => y
  get y () {
    return this[1]
  }

  values (x: number, y: number) {
    this[0] = x
    this[1] = y
  }

  zero () {
    this[0] = 0.0
    this[1] = 0.0
  }

  from (other: Vector2) {
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
    out.from(this)
    out.normalize()

    return out
  }

  distanceTo (v2: Vector2) {
    return Math.sqrt(this.distanceToSquared(v2))
  }

  distanceToSquared (v2: Vector2) {
    const dx = this[0] - v2[0]
    const dy = this[1] - v2[1]

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
    out.values(-scale * this[1], scale * this[0])
    return out
  }

  reflect (normal: Vector2) {
    this.substract(normal.scaled(2.0 * normal.dot(this)))
  }

  reflected (normal: Vector2) {
    const vec = this.clone()
    vec.reflect(normal)
    return vec
  }

  relativeError (correct: Vector2) {
    const correctNorm = correct.length
    const diff = this.clone()
    diff.substract(correct)
    const diffNorm = diff.length
    return diffNorm / correctNorm
  }

  absoluteError (correct: Vector2) {
    const diff = this.clone()
    diff.substract(correct)
    return diff.length
  }


  add (v2: Vector2 ) {
    this[0] = this[0] + v2[0]
    this[1] = this[1] + v2[1]
  }

  addScaled (
    v2: Vector2, 
    factor: number
  ) {
    this[0] = this[0] + v2[0] * factor
    this[1] = this[1] + v2[1] * factor
  }

  substract (v2: Vector2) {
    this[0] = this[0] - v2[0]
    this[1] = this[1] - v2[1]
  }

  multiply (v2: Vector2) {
    this[0] = this[0] * v2[0]
    this[1] = this[1] * v2[1]
  }

  divide (v2: Vector2) {
    this[0] = this[0] / v2[0]
    this[1] = this[1] / v2[1]
  }

  scale (factor: number) {
    this[1] = this[1] * factor
    this[0] = this[0] * factor
  }

  scaled (factor: number) {
    const vec = this.clone()
    vec.scale(factor)
    return vec
  }

  inverse () {
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

  roundToZero () {
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

  copyInto(v2: Vector2 ) {
    v2[1] = this[1]
    v2[0] = this[0]
    return v2
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
    return `Vector2([0]${this[0]},[1]${this[1]})`
  }
}
