import { invariant } from '@at/utility'
import { Offset } from '../basic/geometry'
import { AtLeastSquaresSolver } from './lsq-solver'
import { PointerDeviceKind } from './pointer'

export class AtVelocity {
  static create (pixelsPerSecond: Offset) {
    return new AtVelocity(pixelsPerSecond)
  }

  constructor (pixelsPerSecond: Offset) {
    this.pixelsPerSecond = pixelsPerSecond
    invariant(pixelsPerSecond !== null)
  }

  static zero = new AtVelocity(Offset.zero)

  pixelsPerSecond: Offset

  /**
   * 
   * @param {AtVelocity} other 
   * @returns {AtVelocity}
   */
  add (other: AtVelocity) {
    return new AtVelocity(this.pixelsPerSecond.add(other.pixelsPerSecond))
  }

  /**
   * 
   * @param {AtVelocity} other 
   * @returns {AtVelocity}
   */
  subtract (other: AtVelocity) {
    return new AtVelocity(this.pixelsPerSecond.subtract(other.pixelsPerSecond))
  }

  negate () {
    return new AtVelocity(this.pixelsPerSecond.negate())
  }
 
  /**
   * 
   * @param {number} minValue 
   * @param {number} maxValue 
   * @returns {AtVelocity}
   */
  clampMagnitude (minValue: number, maxValue: number): AtVelocity {
    invariant(minValue !== null && minValue >= 0.0)
    invariant(maxValue !== null && maxValue >= 0.0 && maxValue >= minValue)
    
    const valueSquared = this.pixelsPerSecond.distanceSquared
    
    if (valueSquared > maxValue * maxValue) {
      return new AtVelocity((this.pixelsPerSecond.divide(this.pixelsPerSecond.distance)).multiply(maxValue))
    }

    if (valueSquared < minValue * minValue) {
      return new AtVelocity((this.pixelsPerSecond.divide(this.pixelsPerSecond.distance)).multiply(minValue))
    }

    return this
  }

  /**
   * 
   * @param {AtVelocity | null} other 
   * @returns {boolean}
   */
  equal (other: AtVelocity | null): boolean {
    return ( 
      other instanceof AtVelocity &&
      other.pixelsPerSecond.equal(this.pixelsPerSecond)
    )
  }

  /**
   * 
   * @param {AtVelocity | null} other 
   * @returns {boolean}
   */
  notEqual (other: AtVelocity | null): boolean {
    return !this.equal(other)
  }

  toString () {
    return `Velocity(${this.pixelsPerSecond})`
  }
}

export type AtVelocityEstimateOptions = {
  pixelsPerSecond: Offset,
  confidence: number,
  duration: number,
  offset: Offset,
}

export class AtVelocityEstimate {
  static create (options: AtVelocityEstimateOptions) {
    return new AtVelocityEstimate(
      options.pixelsPerSecond,
      options.confidence,
      options.duration,
      options.offset,
    )
  }

  /**
   * 
   * @param {Offset} pixelsPerSecond 
   * @param {number} confidence 
   * @param {number} duration 
   * @param {Offset} offset 
   */
  constructor (
    pixelsPerSecond: Offset,
    confidence: number,
    duration: number,
    offset: Offset,
  ) {
    invariant(pixelsPerSecond !== null)
    invariant(confidence !== null)
    invariant(duration !== null)
    invariant(offset !== null)

    this.pixelsPerSecond = pixelsPerSecond
    this.confidence = confidence
    this.duration = duration
    this.offset = offset
  }
  
  public pixelsPerSecond: Offset
  public confidence: number
  public duration: number
  public offset: Offset
  
  toString () {
    return `AtVelocityEstimate()`
  }
}

export class AtPointAtTime {
  /**
   * 
   * @param {Offset} point 
   * @param {number} time 
   * @returns {AtPointAtTime}
   */
  static create (point: Offset, time: number) {
    return new AtPointAtTime(point, time)
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
    return `AtPointAtTime(point: ${this.point}, time: ${this.time})`
  }
}

export class AtVelocityTracker {
  static create (kind: PointerDeviceKind) {
    return new AtVelocityTracker(kind)
  }

  static withKind (kind: PointerDeviceKind) {
    return new AtVelocityTracker(kind)
  }

  /**
   * 
   * @param {PointerDeviceKind} kind 
   */
  constructor (kind: PointerDeviceKind = PointerDeviceKind.Touch) {
    this.kind = kind
  }

  static assumePointerMoveStoppedMilliseconds: number = 40
  static historySize: number = 20
  static horizonMilliseconds: number = 100
  static minSampleSize: number = 3

  public kind: PointerDeviceKind


  private samples: Array<AtPointAtTime | null> = []
  private index: number = 0

  addPosition (time: number, position: Offset) {
    this.index += 1
    if (this.index === AtVelocityTracker.historySize) {
      this.index = 0
    }
    this.samples[this.index] = AtPointAtTime.create(position, time)
  }

  getVelocityEstimate (): AtVelocityEstimate | null {
    const x: number[] = []
    const y: number[] = []
    const w: number[] = []
    const time: number[] = []
    let sampleCount = 0
    let index = this.index

    const newestSample = this.samples[index]
    if (newestSample === null) {
      return null
    }

    let previousSample = newestSample
    let oldestSample = newestSample

    do {
      const sample = this.samples[index]
      if (sample === null) {
        break
      }

      const age = (newestSample.time - sample.time) / 1000
      const delta = Math.abs((sample.time - previousSample.time)) / 1000
      
      previousSample = sample

      if (age > AtVelocityTracker.horizonMilliseconds || delta > AtVelocityTracker.assumePointerMoveStoppedMilliseconds) {
        break
      }

      oldestSample = sample
      const position = sample.point
      x.push(position.dx)
      y.push(position.dy)
      w.push(1.0)
      time.push(-age)
      index = (index == 0 ? AtVelocityTracker.historySize : index) - 1

      sampleCount += 1
    } while (sampleCount < AtVelocityTracker.historySize)

    if (sampleCount >= AtVelocityTracker.minSampleSize) {
      const xSolver = AtLeastSquaresSolver.create(time, x, w)
      const xFit = xSolver.solve(2)
      if (xFit !== null) {
        const ySolver = AtLeastSquaresSolver.create(time, y, w)
        const yFit = ySolver.solve(2)
        if (yFit !== null) {
          invariant(xFit.confidence !== null)
          invariant(yFit.confidence !== null)

          return AtVelocityEstimate.create({
            pixelsPerSecond: new Offset(xFit.coefficients[1] * 1000, yFit.coefficients[1] * 1000),
            confidence: xFit.confidence * yFit.confidence,
            duration: newestSample.time - oldestSample.time,
            offset: newestSample.point.subtract(oldestSample.point)
          })
        }
      }
    }
    
    return AtVelocityEstimate.create({
      pixelsPerSecond: Offset.zero,
      confidence: 1.0,
      duration: newestSample.time - oldestSample.time,
      offset: newestSample.point.subtract(oldestSample.point),
    })
  }

 
  getVelocity (): AtVelocity  {
    const estimate = this.getVelocityEstimate()
    if (estimate == null || estimate.pixelsPerSecond == Offset.zero)
      return AtVelocity.zero;
    return AtVelocity.create(estimate.pixelsPerSecond);
  }
}

