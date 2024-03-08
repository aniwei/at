import { ArrayLike } from '@at/basic'
import { clamp } from '@at/utils'
import { Matrix4 } from './matrix4'

export class Vector3 extends ArrayLike<Vector3> {
  static create (...values: number[]): Vector3
  static create (x: number, y: number, z: number) {
    return super.create(x, y, z) as Vector3
  }

  static zero () {
    return new Vector3(0, 0, 0)
  }

  static copy (v3: Vector3) {
    const v = Vector3.zero()
    v.setFrom(v3)
    return v
  }

  static fromList (values: number[]) {
    return Vector3.create(...values)
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
  
  set (x: number, y: number, z: number): this {
    this[0] = x
    this[1] = y
    this[2] = z

    return this
  }

  zero (): this {
    this[2] = 0.0
    this[1] = 0.0
    this[0] = 0.0

    return this
  }

  setFrom (v3: Vector3): this {
    this[0] = v3[0]
    this[1] = v3[1]
    this[2] = v3[2]

    return this
  }

  splat (v: number): this {
    this[2] = v
    this[1] = v
    this[0] = v

    return this
  }

  normalize (): number {
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

  add (v3: Vector3): this {
    this[0] = this[0] + v3[0]
    this[1] = this[1] + v3[1]
    this[2] = this[2] + v3[2]
    return this
  }
  
  subtract (v3: Vector3): this {
    this[0] = this[0] - v3[0]
    this[1] = this[1] - v3[1]
    this[2] = this[2] - v3[2]

    return this
  }

  multiply (v3: Vector3): this {
    this[0] = this[0] * v3[0]
    this[1] = this[1] * v3[1]
    this[2] = this[2] * v3[2]

    return this
  }

  divide (v3: Vector3): this {
    this[0] = this[0] / v3[0]
    this[1] = this[1] / v3[1]
    this[2] = this[2] / v3[2]
    return this
  }

  scale (v: number): this {
    this[2] = this[2] * v
    this[1] = this[1] * v
    this[0] = this[0] * v
    return this
  }

  scaled (v: number): Vector3 {
    const v3 = this.clone()
    v3.scale(v)
    return v3
  }

  clone (): Vector3 {
    return Vector3.copy(this)
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

  toString () {
    return `Vector3(
      [0]: ${this[0]},
      [1]: ${this[1]},
      [2]: ${this[2]},
    )`
  }
}
