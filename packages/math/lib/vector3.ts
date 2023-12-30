import { ArrayLike } from '@at/basic'
import { clamp } from '@at/utils'
import { Matrix4 } from './matrix4'

export class Vector3 extends ArrayLike<Vector3> {
  static get ZERO () {
    return new Vector3(0, 0, 0)
  }

  static create (x: number, y: number, z: number) {
    return super.create(x, y, z) as Vector3
  }

  static min (a: Vector3 , b: Vector3) {
    const result = Vector3.ZERO
    result.x = Math.min(a.x, b.x)
    result.y = Math.min(a.y, b.y)
    result.x = Math.min(a.z, b.z)
    return result
  }

  static max (a: Vector3 , b: Vector3) {
    const result = Vector3.ZERO
    result.x = Math.max(a.x, b.x)
    result.y = Math.max(a.y, b.y)
    result.x = Math.max(a.z, b.z)
    return result
  }

  static mix (min: Vector3, max: Vector3, a: number) {
    const result = Vector3.ZERO
    result.x = min.x + a * (max.x - min.x)
    result.y = min.y + a * (max.y - min.y)
    result.z = min.z + a * (max.z - min.z)
    return result
  }

  static all (v: number) {
    const v3 = Vector3.ZERO.splat(v)
    return v3
  }

  static copy (v3: Vector3) {
    const v = Vector3.ZERO
    v.setFrom(v3)
    return v
  }

  static fromList (values: number[]) {
    return new Vector3(...values)
  }

  static random () {
    return new Vector3(
      Math.random(), 
      Math.random(), 
      Math.random()
    )
  }

  // => x
  get x () {
    return this[0]
  }
  set x (x: number) {
    this[0] = x
  }

  // => y
  get y () {
    return this[1]
  }
  set y (y: number) {
    this[1] = y
  }

  // => z
  get z () {
    return this[2]
  }
  set z (z: number) {
    this[2] = z
  }


  // => distance
  set distance (value: number) {
    if (value === 0.0) {
      this.zero()
    } else {
      let l = this.distance
      if (l !== 0.0) {
        l = value / l
        this[0] *= l
        this[1] *= l
        this[2] *= l
      }
    }
  }
  get distance () {
    return Math.sqrt(this.distance2)
  }

  // => distance2
  get distance2 () {
    return this[0] * this[0] + this[1] * this[1] + this[2] * this[2]
  }

  // => isFinite
  get isFinite () {
    return (
      Number.isFinite(this[0]) &&
      Number.isFinite(this[1]) &&
      Number.isFinite(this[2])
    )
  }

  // => isInfinite
  get isInfinite () {
    return !this.isFinite
  }

  get isNaN () {
    let isNan = false
    isNan = isNan || Number.isNaN(this[0])
    isNan = isNan || Number.isNaN(this[1])
    isNan = isNan || Number.isNaN(this[2])
    return isNan
  }

  constructor (...rests: number[])
  constructor (x: number, y: number, z: number) {
    super(x, y, z)
  }
  
  set (x: number, y: number, z: number) {
    this[0] = x
    this[1] = y
    this[2] = z
  }

  zero () {
    this[2] = 0.0
    this[1] = 0.0
    this[0] = 0.0
  }

  setFrom (v3: Vector3) {
    this[0] = v3[0]
    this[1] = v3[1]
    this[2] = v3[2]
  }

  splat (v: number) {
    this[2] = v
    this[1] = v
    this[0] = v
  }

  

  normalize () {
    const l = this.distance

    if (l === 0.0) {
      return 0.0
    }

    const d = 1.0 / l
    this[0] *= d
    this[1] *= d
    this[2] *= d
    return l
  }

  normalized () {
    return Vector3.copy(this).normalize()
  }

  normalizeInto (out: Vector3): Vector3  {
    out.setFrom(this)
    out.normalize()
    return out
  }

  distanceTo (v3: Vector3) {
    return Math.sqrt(this.distanceToSquared(v3))
  }

  distanceToSquared (v3: Vector3) {
    const dx = this[0] - v3[0]
    const dy = this[1] - v3[1]
    const dz = this[2] - v3[2]

    return dx * dx + dy * dy + dz * dz
  }

  angleTo (v3: Vector3) {
    if (
      this[0] == v3[0] &&
      this[1] == v3[1] &&
      this[2] == v3[2]
    ) {
      return 0.0
    }

    const d = this.dot(v3) / (this.length * v3.length);
    return Math.acos(clamp(d, -1.0, 1.0))
  }

  dot (v3: Vector3) {
    const sum = this[0] * v3[0] + this[1] * v3[1] + this[2] * v3[2]
    return sum
  }

  applyProjection (m4: Matrix4) {
    const x = this[0]
    const y = this[1]
    const z = this[2]
    const d = 1.0 / (
      m4[3] * x +
      m4[7] * y +
      m4[11] * z +
      m4[15]
    )
    this[0] = (
      m4[0] * x +
      m4[4] * y +
      m4[8] * z +
      m4[12]
    ) * d
    this[1] = (
      m4[1] * x +
      m4[5] * y +
      m4[9] * z +
      m4[13]
    ) * d
    this[2] = (
      m4[2] * x +
      m4[6] * y +
      m4[10] * z +
      m4[14]
    ) * d
  }

  add (v3: Vector3) {
    this[0] = this[0] + v3[0]
    this[1] = this[1] + v3[1]
    this[2] = this[2] + v3[2]
  }

  addScaled (v3: Vector3, factor: number) {
    this[0] = this[0] + v3[0] * factor
    this[1] = this[1] + v3[1] * factor
    this[2] = this[2] + v3[2] * factor
  }

  
  subtract (v3: Vector3) {
    this[0] = this[0] - v3[0]
    this[1] = this[1] - v3[1]
    this[2] = this[2] - v3[2]
  }

  multiply (v3: Vector3) {
    this[0] = this[0] * v3[0]
    this[1] = this[1] * v3[1]
    this[2] = this[2] * v3[2]
  }

  divide (v3: Vector3) {
    this[0] = this[0] / v3[0]
    this[1] = this[1] / v3[1]
    this[2] = this[2] / v3[2]
  }

  scale (v: number) {
    this[2] = this[2] * v
    this[1] = this[1] * v
    this[0] = this[0] * v
  }

  scaled (v: number) {
    const v3 = this.clone()
    v3.scale(v)
    return v3
  }

  clone () {
    return Vector3.copy(this)
  }

  copyInto (v3: Vector3) {
    v3[0] = this[0]
    v3[1] = this[1]
    v3[2] = this[2]
    return v3
  }

  
  copyIntoList (array: number[], offset: number = 0) {
    array[offset + 2] = this[2]
    array[offset + 1] = this[1]
    array[offset + 0] = this[0]
  }

  equal (v3: Vector3 | null): boolean {
    return (
      v3 instanceof Vector3 &&
      v3.x === this.x &&
      v3.y === this.y &&
      v3.z === this.z 
    )
  }

  notEqual (v3: Vector3 | null): boolean {
    return !this.equal(v3)
  }
}
