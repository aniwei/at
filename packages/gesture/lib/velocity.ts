import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Equalable } from '@at/basic'
import { LeastSquaresSolver } from './lsq-solver'
import { PointerDeviceKind } from './sanitizer'

export class Velocity implements Equalable<Velocity> {
  static ZERO = new Velocity(Offset.ZERO)

  static create (pixelsPerSecond: Offset) {
    return new Velocity(pixelsPerSecond)
  }

  public pixelsPerSecond: Offset

  constructor (pixelsPerSecond: Offset) {
    this.pixelsPerSecond = pixelsPerSecond
  }

  /**
   * 相加
   * @param {Velocity} other 
   * @returns {Velocity}
   */
  add (other: Velocity) {
    return new Velocity(this.pixelsPerSecond.add(other.pixelsPerSecond))
  }

  /**
   * 相减
   * @param {Velocity} other 
   * @returns {Velocity}
   */
  subtract (other: Velocity) {
    return new Velocity(this.pixelsPerSecond.subtract(other.pixelsPerSecond))
  }

  /**
   * 取反
   * @returns 
   */
  inverse () {
    return new Velocity(this.pixelsPerSecond.inverse())
  }
 
  /**
   * 
   * @param {number} min 
   * @param {number} maxValue 
   * @returns {Velocity}
   */
  clampMagnitude (min: number, max: number): Velocity {
    invariant(min !== null && min >= 0.0, 'The "min" value is invalid')
    invariant(max !== null && max >= 0.0 && max >= max, 'The "max" value is invalid')
    
    const squared = this.pixelsPerSecond.distanceSquared
    
    if (squared > max * max) {
      return new Velocity((this.pixelsPerSecond.divide(this.pixelsPerSecond.distance)).multiply(max))
    }

    if (squared < min * min) {
      return new Velocity((this.pixelsPerSecond.divide(this.pixelsPerSecond.distance)).multiply(min))
    }

    return this
  }

  /**
   * 
   * @param {Velocity | null} other 
   * @returns {boolean}
   */
  equal (other: Velocity | null): boolean {
    return ( 
      other instanceof Velocity &&
      other.pixelsPerSecond.equal(this.pixelsPerSecond)
    )
  }

  /**
   * 
   * @param {Velocity | null} other 
   * @returns {boolean}
   */
  notEqual (other: Velocity | null): boolean {
    return !this.equal(other)
  }

  toString () {
    return `Velocity(
      [pixelsPerSecond]: ${this.pixelsPerSecond}
    )`
  }
}

export interface VelocityEstimate {
  pixelsPerSecond: Offset,
  confidence: number,
  duration: number,
  offset: Offset,
}

export class PointAtTime {
  /**
   * 
   * @param {Offset} point 
   * @param {number} time 
   * @returns {PointAtTime}
   */
  static create (point: Offset, time: number) {
    return new PointAtTime(point, time)
  }

  public time: number
  public point: Offset

  /**
   * 
   * @param {Offset} point 
   * @param {number} time 
   */
  constructor (point: Offset, time: number) {
    this.point = point
    this.time = time
  }

  toString () {
    return `PointAtTime(
      [point]: ${this.point}, 
      [time]: ${this.time}
    )`
  }
}

export class VelocityTracker {
  static ASSUME_MOVE_STOPPED_MILLISECONDS = 40
  static HORIZON_MILLISECONDS = 100
  static MIN_SAMPLE_SIZE = 3
  static HISTORY_SIZE = 20

  static create (kind: PointerDeviceKind) {
    return new VelocityTracker(kind)
  }

  static withKind (kind: PointerDeviceKind) {
    return new VelocityTracker(kind)
  }

  // => estimate
  get estimate (): VelocityEstimate | null {
    const x: number[] = []
    const y: number[] = []
    const w: number[] = []

    const time: number[] = []

    let count = 0
    let index = this.index

    const newest = this.samples[index] ?? null

    if (newest === null) {
      return null
    }

    let previous = newest
    let oldest = newest

    do {
      const sample = this.samples[index] ?? null

      if (sample === null) {
        break
      }

      const age = (newest.time - sample.time) / 1000
      const delta = Math.abs((sample.time - previous.time)) / 1000
      
      previous = sample

      if (
        age > VelocityTracker.HORIZON_MILLISECONDS || 
        delta > VelocityTracker.ASSUME_MOVE_STOPPED_MILLISECONDS
      ) {
        break
      }

      oldest = sample
      const position = sample.point

      x.push(position.dx)
      y.push(position.dy)
      w.push(1.0)
      time.push(-age)
      
      index = (index === 0 ? VelocityTracker.HISTORY_SIZE : index) - 1
      count += 1
    } while (count < VelocityTracker.HISTORY_SIZE)

    if (count >= VelocityTracker.MIN_SAMPLE_SIZE) {
      const xSolver = LeastSquaresSolver.create(time, x, w)
      const xFit = xSolver.solve(2)

      if (xFit !== null) {
        const ySolver = LeastSquaresSolver.create(time, y, w)
        const yFit = ySolver.solve(2)

        if (yFit !== null) {
          invariant(xFit.confidence !== null)
          invariant(yFit.confidence !== null)

          return {
            pixelsPerSecond: new Offset(xFit.coefficients[1] * 1000, yFit.coefficients[1] * 1000),
            confidence: xFit.confidence * yFit.confidence,
            duration: newest.time - oldest.time,
            offset: newest.point.subtract(oldest.point)
          }
        }
      }
    }
    
    return {
      pixelsPerSecond: Offset.ZERO,
      confidence: 1.0,
      duration: newest.time - oldest.time,
      offset: newest.point.subtract(oldest.point),
    }
  }

  // => velocity
  get velocity (): Velocity  {
    const estimate = this.estimate

    if (estimate === null || estimate.pixelsPerSecond.equal(Offset.ZERO)) {
      return Velocity.ZERO
    }

    return Velocity.create(estimate.pixelsPerSecond)
  }

  protected samples: Array<PointAtTime | null> = []
  protected index: number = 0
  public kind: PointerDeviceKind

  /**
   * 
   * @param {PointerDeviceKind} kind 
   */
  constructor (kind: PointerDeviceKind = PointerDeviceKind.Touch) {
    this.kind = kind
  }

  

  addPosition (time: number, position: Offset) {
    this.index += 1

    if (this.index === VelocityTracker.HISTORY_SIZE) {
      this.index = 0
    }

    this.samples[this.index] = PointAtTime.create(position, time)
  }
}

