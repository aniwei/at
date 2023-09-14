import { clamp, Numberic } from '@at/basic'
import { Matrix2 } from './matrix2'

// 二维向量
export class Vector2 extends Numberic<Vector2> {
  static get ZERO () {
    return new Vector2()
  }

  /**
   * 求最小
   * @param {Vector2} a 
   * @param {Vector2} b 
   * @param {Vector2} result 
   */
  static min (
    a: Vector2, 
    b: Vector2,
  ) {
    const result = Vector2.ZERO
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
  }

  /**
   * 求最大
   * @param {Vector2} a 
   * @param {Vector2} b 
   * @param {Vector2} result 
   */
  static max (
    a: Vector2, 
    b: Vector2,
  ) {
    const result = Vector2.ZERO
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
  }

  /**
   * 
   * @param {Vector2} min 
   * @param {Vector2} max 
   * @param {number} a 
   * @param {Vector2} result 
   */
  static mix (
    min: Vector2, 
    max: Vector2, 
    a: number
  ) {
    const result = Vector2.ZERO
    result[0] = min[0] + a * (max[0] - min[0])
    result[1] = min[1] + a * (max[1] - min[1])
  }

  /**
   * 从数组复制
   * @param array 
   * @param offset 
   * @returns 
   */
  static copyFromList (array: number[], offset = 0) {
    const vec = Vector2.ZERO
    vec.copyFromList(array, offset)

    return vec
  }
  
  /**
   * 抹平
   * @param {number} value 
   * @returns {Vector2}
   */
  static all (value: number) {
    const vec = Vector2.ZERO
    vec.splat(value)
    return vec
  }

  /**
   * 从向量复制
   * @param {Vector2} other 
   * @returns {Vector2}
   */
  static copy (other: Vector2): Vector2 {
    const vec = Vector2.ZERO
    vec.from(other)
    return vec
  }

  /**
   * 从列表创建
   * @param {Iterable<number>} v 
   * @returns {Vector2}
   */
  static fromList (v: Iterable<number>) {
    return new Vector2(...v)
  }

  /**
   * 从 ArrayBuffer 创建
   * @param {ArrayBuffer} buffer 
   * @param {number} offset 
   * @returns 
   */
  static fromArrayBuffer (
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
   * 随机生成
   * @param {(): number} random 
   * @returns {Vector2}
   */
  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector2(random(), random())
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

  /**
   * 设置值
   * @param {number} x 
   * @param {number} y 
   */
  values (x: number, y: number) {
    this[0] = x
    this[1] = y
  }

  /**
   * 清零
   */
  zero () {
    this[0] = 0.0
    this[1] = 0.0
  }

  /**
   * 从向量设置值
   * @param {Vector2} other 
   */
  from (other: Vector2) {
    this[1] = other[1]
    this[0] = other[0]
  }

  /**
   * 抹平
   * @param {number} factor 
   */
  splat (factor: number) {
    this[0] = factor
    this[1] = factor
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

  /**
   * 
   * @param {Vector2} v2 
   * @returns {number}
   */
  distanceToSquared (v2: Vector2) {
    const dx = this[0] - v2[0]
    const dy = this[1] - v2[1]

    return dx * dx + dy * dy
  }

  /**
   * 
   * @param {Vector2} other 
   * @returns {number}
   */
  angleTo (other: Vector2) {
    if (this[0] === other[0] && this[1] === other[1]) {
      return 0.0
    }

    const d = this.dot(other) / (length * other.length)
    return Math.acos(clamp(d, -1.0, 1.0))
  }

  /**
   * 
   * @param {Vector2} other 
   * @returns {number}
   */
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

  /**
   * 求乘积
   * @param {Vector2} other 
   * @returns {number}
   */
  dot (other: Vector2) {
    let sum
    sum = this[0] * other[0]
    sum += this[1] * other[1]
    return sum
  }

  /**
   * 
   * @param {Matrix2} m2 
   */
  postmultiply (m2: Matrix2) {
    const v0 = this[0]
    const v1 = this[1]
    this[0] = v0 * m2[0] + v1 * m2[1]
    this[1] = v0 * m2[2] + v1 * m2[3]
  }

  /**
   * 
   * @param {Vector2} other 
   * @returns {number}
   */
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

  /**
   * 加法
   * @param {Vector2} v2 
   */
  add (v2: Vector2) {
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

  /**
   * 减法
   * @param {Vector2} v2 
   */
  substract (v2: Vector2) {
    this[0] = this[0] - v2[0]
    this[1] = this[1] - v2[1]
  }

  /**
   * 乘法
   * @param {Vector2} v2 
   */
  multiply (v2: Vector2) {
    this[0] = this[0] * v2[0]
    this[1] = this[1] * v2[1]
  }

  /**
   * 除法
   * @param {Vector2} v2 
   */
  divide (v2: Vector2) {
    this[0] = this[0] / v2[0]
    this[1] = this[1] / v2[1]
  }

  /**
   * 放大
   * @param {number} factor 
   */
  scale (factor: number) {
    this[1] = this[1] * factor
    this[0] = this[0] * factor
  }

  /**
   * 放大并创建新的向量
   * @param {number} factor 
   * @returns {Vector2}
   */
  scaled (factor: number) {
    const vec = this.clone()
    vec.scale(factor)
    return vec
  }

  /**
   * 取反
   */
  inverse () {
    this[1] = -this[1]
    this[0] = -this[0]
  }

  /**
   * 绝对值
   */
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

  copyIntoList (
    array: number[], 
    offset = 0
  ) {
    array[offset + 1] = this[1]
    array[offset + 0] = this[0]
  }

  copyFromList (
    array: number[], 
    offset = 0
  ) {
    this[1] = array[offset + 1]
    this[0] = array[offset + 0]
  }  

  /**
   * 是否相等
   * @param other 
   * @returns 
   */
  equal (other: Vector2 | null) {
    return (
      (other instanceof Vector2) &&
      (this[0] === other[0]) &&
      (this[1] === other[1])
    )
  }

  /**
   * 是否相等
   * @param other 
   * @returns 
   */
  notEqual (other: Vector2 | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @returns 
   */
  toString () {
    return `Vector2([0]${this[0]},[1]${this[1]})`
  }
}
