import { Numberic, clamp } from '@at/basic'
import { Matrix3 } from './matrix3'
import { Matrix4 } from './matrix4'
import { Quaternion } from './quaternion'

export class Vector3 extends Numberic<Vector3> {
  static ZERO = new Vector3()

  /**
   * 求最小
   * @param {Vector3} a 
   * @param {Vector3} b 
   * @param {Vector3} result 
   */
  static min (a: Vector3, b: Vector3) {
    const result: Vector3 = Vector3.ZERO.clone()
    result[0] = Math.min(a[0], b[0])
    result[1] = Math.min(a[1], b[1])
    result[2] = Math.min(a[2], b[2])
    return result
  }

  /**
   * 求最大
   * @param {Vector3} a 
   * @param {Vector3} b 
   * @param {Vector3} result 
   */
  static max (a: Vector3, b: Vector3) {
    const result: Vector3 = Vector3.ZERO.clone()
    result[0] = Math.max(a[0], b[0])
    result[1] = Math.max(a[1], b[1])
    result[2] = Math.max(a[2], b[2])
    return result
  }

  static copyFromList (array: number[], offset = 0) {
    const vec = Vector3.ZERO.clone()
    vec.copyFromList(array, offset)
    return vec
  }

  static all (value: number) {
    const v = Vector3.ZERO.clone()
    v.splat(value)
    return v
  }

  static copy (other: Vector3): Vector3 {
    const v = Vector3.ZERO.clone()
    v.from(other)

    return v
  }

  static fromList (v3: Iterable<number>) {
    return new Vector3(...v3)
  }


  static random (random?: { (): number }) {
    random ??= () => Math.random()
    return new Vector3(random(), random(), random())
  }

  // => distance
  set distance (value: number) {
    if (value === 0) {
      this.zero()
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
  get distance () {
    return Math.sqrt(this.distance2)
  }

  // => distance2
  get distance2 () {
    let sum
    sum = this[0] * this[0]
    sum += this[1] * this[1]
    sum += this[2] * this[2]
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

  /**
   * 设置向量值
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  values (x: number, y: number, z: number) {
    this[0] = x
    this[1] = y
    this[2] = z
  }

  /**
   * 设置为0向量
   */
  zero () {
    this[0] = 0
    this[1] = 0
    this[2] = 0
  }

  /**
   * 从向量设置值
   * @param {Vector3} other 
   */
  from (other: Vector3) {
    this[0] = other[0]
    this[1] = other[1]
    this[2] = other[2]
  }


  /**
   * 抹平向量
   * @param {number} factor 
   */
  splat (factor: number) {
    this[0] = factor
    this[1] = factor
    this[2] = factor
  }

  /**
   * 
   * @returns 
   */
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

  /**
   * 
   * @returns 
   */
  normalizeLength () {
    return this.normalize()
  }

  /**
   * 
   * @returns 
   */
  normalized () {
    const v = Vector3.copy(this)
    v.normalize()
    return v
  }

  /**
   * 
   * @param out 
   * @returns 
   */
  normalizeInto (out: Vector3) {
    out.from(this)
    out.normalize()
    return out
  }

  /**
   * 
   * @param v 
   * @returns 
   */
  distanceTo (v: Vector3) {
    return Math.sqrt(this.distanceToSquared(v))
  }

  /**
   * 
   * @param v 
   * @returns 
   */
  distanceToSquared (v: Vector3) {
    const dx = this[0] - v[0]
    const dy = this[1] - v[1]
    const dz = this[2] - v[2]

    return dx * dx + dy * dy + dz * dz
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  angleTo (other: Vector3) {
    if (
      this[0] === other[0] &&
      this[1] === other[1] &&
      this[2] === other[2]
    ) {
      return 0.0
    }

    const d = this.dot(other) / (length * other.length)
    return Math.acos(clamp(d, -1.0, 1.0))
  }

  /**
   * 
   * @param other 
   * @param normal 
   * @returns 
   */
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

  /**
   * 
   * @param {Vector3} other 
   * @param {Vector3} out 
   * @returns {Vector3}
   */
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

  /**
   * 
   * @param {Vector3} axis 
   * @param {number} angle 
   */
  applyAxisAngle (axis: Vector3, angle: number) {
    this.applyQuaternion(Quaternion.setAxisAngle(axis, angle))
  }

  /**
   * 应用四元素
   * @param {Quaternion} q 
   */
  applyQuaternion (q: Quaternion) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]
    const qx = q[0]
    const qy = q[1]
    const qz = q[2]
    const qw = q[3]
    const ix = qw * v0 + qy * v2 - qz * v1
    const iy = qw * v1 + qz * v0 - qx * v2
    const iz = qw * v2 + qx * v1 - qy * v0
    const iw = -qx * v0 - qy * v1 - qz * v2
    this[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
    this[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
    this[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx
  }

  /**
   * 应用 Matrix3
   * @param {Matrix3} m3 
   */
  applyMatrix3 (m3: Matrix3) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]
    this[0] = m3[0] * v0 + m3[3] * v1 + m3[6] * v2
    this[1] = m3[1] * v0 + m3[4] * v1 + m3[7] * v2
    this[2] = m3[2] * v0 + m3[5] * v1 + m3[8] * v2
  }

  /**
   * 应用 Matrix4
   * @param {Matrix4} m4 
   */
  applyMatrix4 (m4: Matrix4) {
    const v0 = this[0]
    const v1 = this[1]
    const v2 = this[2]
    this[0] = m4[0] * v0 + m4[4] * v1 + m4[8] * v2 + m4[12]
    this[1] = m4[1] * v0 + m4[5] * v1 + m4[9] * v2 + m4[13]
    this[2] = m4[2] * v0 + m4[6] * v1 + m4[10] * v2 + m4[14]
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

  /**
   * 向量加法
   * @param v 
   */
  add (v: Vector3) {
    this[0] = this[0] + v[0]
    this[1] = this[1] + v[1]
    this[2] = this[2] + v[2]
  }

  /**
   * 向量剑法
   * @param {Vector3} v 
   */
  substract (v: Vector3) {
    this[0] = this[0] - v[0]
    this[1] = this[1] - v[1]
    this[2] = this[2] - v[2]
  }

  /**
   * 向量乘法
   * @param {Vector3 | number} v 
   * @returns {Vector3}
   */
  multiply (v: Vector3 | number) {
    if (v instanceof Vector3) {
      this[0] = this[0] * v[0]
      this[1] = this[1] * v[1]
      this[2] = this[2] * v[2]
      return this
    } 
    
    return this.scaled(v)
  }

  /**
   * 向量除法
   * @param {Vector3} v 
   */
  divide (v: Vector3) {
    this[0] = this[0] / v[0]
    this[1] = this[1] / v[1]
    this[2] = this[2] / v[2]
  }

  /**
   * 放大向量
   * @param {factor} factor 
   */
  scale (factor: number) {
    this[2] = this[2] * factor
    this[1] = this[1] * factor
    this[0] = this[0] * factor
  }

  /**
   * 新增放大向量
   * @param {number} factor 
   * @returns {Vector3}
   */
  scaled (factor: number) {
    const v = this.clone()
    v.scale(factor)

    return v
  }

  /**
   * 取反
   */
  inverse () {
    this[2] = -this[2]
    this[1] = -this[1]
    this[0] = -this[0]
  }

  /**
   * 向量绝对值
   */
  absolute () {
    this[0] = Math.abs(this[0])
    this[1] = Math.abs(this[1])
    this[2] = Math.abs(this[2])
  }

  /**
   * 限制向量值范围
   * @param {Vector3} min 
   * @param {Vector3} max 
   */
  clamp (
    min: Vector3, 
    max: Vector3
  ) {
    this[0] = clamp(this[0], min[0], max[0])
    this[1] = clamp(this[1], min[1], max[1])
    this[2] = clamp(this[2], min[2], max[2])
  }

  /**
   * 限制向量值范围
   * @param {number} min 
   * @param {number} max 
   */
  clampScalar (
    min: number, 
    max: number
  ) {
    this[0] = clamp(this[0], min, max)
    this[1] = clamp(this[1], min, max)
    this[2] = clamp(this[2], min, max)
  }

  /**
   * 向上取整
   */
  floor () {
    this[0] = Math.floor(this[0])
    this[1] = Math.floor(this[1])
    this[2] = Math.floor(this[2])
  }

  /**
   * 向下取整
   */
  ceil () {
    this[0] = Math.ceil(this[0])
    this[1] = Math.ceil(this[1])
    this[2] = Math.ceil(this[2])
  }

  /**
   * 四舍五入
   */
  round () {
    this[0] = Math.round(this[0])
    this[1] = Math.round(this[1])
    this[2] = Math.round(this[2])
  }

  /**
   * 取整
   */
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

  /**
   * 克隆向量
   * @returns {Vector3}
   */
  clone () {
    return Vector3.copy(this)
  }

  /**
   * 复制到 Vector3
   * @param {Vector3} v 
   * @returns {Vector3}
   */
  copyInto (v: Vector3) {
    v[0] = this[0]
    v[1] = this[1]
    v[2] = this[2]
    return v
  }

  /**
   * 复制到 Array
   * @param {number[]} array 
   * @param {number} offset 
   */
  copyIntoList (
    array: number[], 
    offset: number = 0
  ) {
    array[offset + 2] = this[2]
    array[offset + 1] = this[1]
    array[offset + 0] = this[0]
  }

  /**
   * 从数组复制
   * @param {number[]} array 
   * @param {number} offset 
   */
  copyFromList (
    array: number[], 
    offset: number = 0
  ) {
    this[2] = array[offset + 2]
    this[1] = array[offset + 1]
    this[0] = array[offset + 0]
  }

  /**
   * 是否相等
   * @param {Vector3 | null} other 
   * @returns {boolean}
   */
  equal (other: Vector3 | null) {
    return (
      (other instanceof Vector3) &&
      (this[0] === other[0]) &&
      (this[1] === other[1]) &&
      (this[2] === other[2])
    )
  }

  /**
   * 是否相等
   * @param {Vector3 | null} other 
   * @returns {boolean}
   */
  notEqual (other: Vector3 | null) {
    return !this.equal(other)
  }

  /**
   * 返回字符串
   * @returns {string}
   */
  toString () {
    return `Vector3([0]:${this[0]}, [1]:${this[1]}, [2]:${this[2]})`
  }
}
