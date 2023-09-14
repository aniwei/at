import { clamp, Numberic } from '@at/basic'
import { Matrix4 } from './matrix4'

export class Vector4 extends Numberic<Vector4> {
  static get ZERO () {
    return new Vector4(4)
  } 
  /**
   * 求最小
   * @param a 
   * @param b 
   * @param result 
   */
  static min (
    a: Vector4, 
    b: Vector4, 
    ) {
    const result: Vector4 = Vector4.ZERO
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
    result[2] = Math.min(a[2], b[2])
    result[3] = Math.min(a[3], b[3])
    return result
  }

  /**
   * 求最大
   * @param {Vector4} a 
   * @param {Vector4} b 
   * @returns {Vector4}
   */
  static max(
    a: Vector4, 
    b: Vector4, 
  ) {
    const result: Vector4 = Vector4.ZERO
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
    result[2] = Math.max(a[2], b[2])
    result[3] = Math.max(a[3], b[3])
    return result
  }

  /**
   * 混合
   * @param {Vector4} min 
   * @param {Vector4} max 
   * @param {number} a 
   * @returns {Vector4}
   */
  static mix(
    min: Vector4, 
    max: Vector4, 
    a: number, 
  ) {
    const result: Vector4 = Vector4.ZERO
    result[0] = min[0] + a * (max[0] - min[0])
    result[1] = min[1] + a * (max[1] - min[1])
    result[2] = min[2] + a * (max[2] - min[2])
    result[3] = min[3] + a * (max[3] - min[3])
    return result
  }

  /**
   * 
   * @param array 
   * @param offset 
   * @returns 
   */
  static copyFromList (
    array: number[], 
    offset = 0
  ) {
    const vec = Vector4.ZERO
    vec.copyFromList(array, offset)
    return vec
  }

  /**
   * 
   * @returns 
   */
  static identity () {
    const vec = Vector4.ZERO
    vec.identity()
    return vec
  } 

  /**
   * 
   * @param value 
   * @returns 
   */
  static all (value: number) {
    const vec = Vector4.ZERO
    vec.splat(value)
    return vec
  } 

  /**
   * 
   * @param other 
   * @returns 
   */
  static copy (other: Vector4): Vector4 {
    const vec = Vector4.ZERO
    vec.from(other)
    return vec
  }

  /**
   * 
   * @param v4 
   * @returns 
   */
  static fromList (v4: Iterable<number>) {
    return new Vector4(...v4)
  }
  
  /**
   * 从 ArrayBuffer 创建
   * @param {ArrayBuffer} buffer 
   * @param {number} offset 
   * @param {number} length 
   * @returns {Vector4}
   */
  static fromArrayBuffer (
    buffer: ArrayBuffer, 
    offset: number,
    length: number = 4
  ) {
    length ??= Math.floor(
      (buffer.byteLength - offset) / 
      Float64Array.BYTES_PER_ELEMENT
    )

    return Vector4.fromList(new Float64Array(
      buffer, 
      offset, 
      length
    ))
  }
 
  /**
   * 随机创建
   * @param {(): number} random 
   * @returns {Vector4}
   */
  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector4(random(), random(), random())
  }

  // => length
  set distance (value: number) {
    if (value === 0.0) {
      this.zero()
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
  get distance () { 
    return Math.sqrt(this.distance2)
  } 

  // => length2
  get distance2 () {
    let sum: number
    sum = this[0] * this[0]
    sum += this[1] * this[1]
    sum += this[2] * this[2]
    sum += this[3] * this[3]
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

  // => z
  get z () {
    return this[2]
  }

  // => w
  get w () {
    return this[3]
  }

  values (x: number, y: number, z: number, w: number) {
    this[3] = w
    this[2] = z
    this[1] = y
    this[0] = x
  }

  zero () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 0.0
  }

  identity () {
    this[0] = 0.0
    this[1] = 0.0
    this[2] = 0.0
    this[3] = 1.0
  }

  from (v4: Vector4) {
    this[3] = v4[3]
    this[2] = v4[2]
    this[1] = v4[1]
    this[0] = v4[0]
  }

  splat (factor: number) {
    this[3] = factor
    this[2] = factor
    this[1] = factor
    this[0] = factor
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
    out.from(this)
    out.normalize()
    return out
  }

  distanceTo (v4: Vector4) {
    return Math.sqrt(this.distanceToSquared(v4))
  } 

  distanceToSquared (v4: Vector4) {
    const dx = this[0] - v4[0]
    const dy = this[1] - v4[1]
    const dz = this[2] - v4[2]
    const dw = this[3] - v4[3]

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

  applyMatrix4 (m4: Matrix4) {
    const v1 = this[0]
    const v2 = this[1]
    const v3 = this[2]
    const v4 = this[3]
    this[0] = (
      m4[0] * v1 +
      m4[4] * v2 +
      m4[8] * v3 +
      m4[12] * v4
    )
    this[1] = (
      m4[1] * v1 +
      m4[5] * v2 +
      m4[9] * v3 +
      m4[13] * v4
    )
    this[2] = (
      m4[2] * v1 +
      m4[6] * v2 +
      m4[10] * v3 +
      m4[14] * v4
    )
    this[3] = (
      m4[3] * v1 +
      m4[7] * v2 +
      m4[11] * v3 +
      m4[15] * v4
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

  add (v4: Vector4) {
    this[0] = this[0] + v4[0]
    this[1] = this[1] + v4[1]
    this[2] = this[2] + v4[2]
    this[3] = this[3] + v4[3]
  }

  addScaled (
    v4: Vector4, 
    factor: number
  ) {
    this[0] = this[0] + v4[0] * factor
    this[1] = this[1] + v4[1] * factor
    this[2] = this[2] + v4[2] * factor
    this[3] = this[3] + v4[3] * factor
  }

  /**
   * 
   * @param {Vector4} v4 
   * @returns {void}
   */
  substract (v4: Vector4) {
    this[0] = this[0] - v4[0]
    this[1] = this[1] - v4[1]
    this[2] = this[2] - v4[2]
    this[3] = this[3] - v4[3]
  }

  /**
   * 
   * @param {Vector4} v4 
   */
  multiply (v4: Vector4) {
    this[0] = this[0] * v4[0]
    this[1] = this[1] * v4[1]
    this[2] = this[2] * v4[2]
    this[3] = this[3] * v4[3]
  }

  divide (v4: Vector4) {
    this[0] = this[0] / v4[0]
    this[1] = this[1] / v4[1]
    this[2] = this[2] / v4[2]
    this[3] = this[3] / v4[3]
  }

  scale (factor: number) {
    this[0] = this[0] * factor
    this[1] = this[1] * factor
    this[2] = this[2] * factor
    this[3] = this[3] * factor
  }

  scaled (factor: number) {
    const vec = this.clone()
    vec.scale(factor)
    return vec
  }

  inverse () {
    this[0] = -this[0]
    this[1] = -this[1]
    this[2] = -this[2]
    this[3] = -this[3]
  }

  absolute () {
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
    this[3] = this[3] < 0.0
      ? Math.ceil(this[3])
      : Math.floor(this[3])
  }

  copyInto (v4: Vector4) {
    v4[0] = this[0]
    v4[1] = this[1]
    v4[2] = this[2]
    v4[3] = this[3]
    return v4
  }

  copyIntoList (
    array: number[], 
    offset = 0
  ) {
    array[offset + 0] = this[0]
    array[offset + 1] = this[1]
    array[offset + 2] = this[2]
    array[offset + 3] = this[3]
  }

  copyFromList (
    array: number[], 
    offset = 0
  ) {
    this[0] = array[offset + 0]
    this[1] = array[offset + 1]
    this[2] = array[offset + 2]
    this[3] = array[offset + 3]
  }

  /**
   * 复制
   * @returns 
   */
  clone (): Vector4 {
    return Vector4.copy(this)
  }

  /**
   * 是否相等
   * @param other 
   * @returns 
   */
  equal (other: Vector4 | null)  {
    return (
      (other instanceof Vector4) &&
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
  notEqual (other: Vector4 | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `Vector4([0]${this[0]},[1]${this[1]},[2]${this[2]},[3]${this[3]})`
  }
}
