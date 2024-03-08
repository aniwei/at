import { invariant, clamp, lerp, UnimplementedError, sign } from '@at/utils'
import { Offset } from '@at/geometry'
import { Engine } from '@at/engine'

/**
 * 
 * @param {number} t 
 * @returns {number}
 */
const bounce = (t: number) => {
  if (t < 1.0 / 2.75) {
    return 7.5625 * t * t
  } else if (t < 2 / 2.75) {
    t -= 1.5 / 2.75
    return 7.5625 * t * t + 0.75
  } else if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75
    return 7.5625 * t * t + 0.9375
  }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

// => ParametricCurve
export abstract class ParametricCurve<T> {
  /**
   * 
   * @param {number} t 
   * @returns {number}
   */
  transform (t: number): T  {
    invariant(t >= 0.0 && t <= 1.0, 'Parametric value $t is outside of [0, 1] range.')
    return this.transformInternal(t)
  }

  /**
   * 
   * @param {number} t 
   * @returns {T}
   */
  transformInternal (t: number): T {
    throw new UnimplementedError('transformInternal')
  }
  
  toString () {
    return 'ParametricCurve()'
  }
}

//// => Curve
export interface CurveFactory<T> {
  create <T> (...rests: unknown[]): T
  new (...rests: unknown[]): T
}
export abstract class Curve extends ParametricCurve<number> {
  static create <T> (...rests: unknown[]) {
    const CurveFactory = this as unknown as CurveFactory<T>
    return new CurveFactory(...rests) as T
  }

  // => flipped
  public get flipped (): Curve {
    return FlippedCurve.create(this)
  }

  // 
  constructor (...rests: unknown[]) {
    super()
  }

  /**
   * 
   * @param {number} t 
   * @returns {number}
   */
  transform (t: number): number {
    if (t === 0.0 || t === 1.0) {
      return t
    }

    return super.transform(t)
  }
}

//// => Linear
export class Linear extends Curve {
  transformInternal (t: number) {
    return t
  }
}

//// => SawTooth
export class SawTooth extends Curve {
  public count: number

  /**
   * 
   * @param count 
   */
  constructor (count: number) {
    super()
    this.count = count
  }

  /**
   * 
   * @param t 
   * @returns 
   */
  transformInternal (t: number): number {
    t *= this.count
    return t - Math.floor(t)
  }

  toString () {
    return `SawTooth([count]:${this.count})`
  }
}

//// => Interval
export class Interval extends Curve {
  public begin: number
  public end: number
  public curve: Curve 

  constructor (
    begin: number, 
    end: number, 
    curve: Curve
  ) {
    super()
    this.begin = begin
    this.end = end
    this.curve = Curves.LINEARE
  }

  transformInternal (t: number) {
    invariant(this.begin >= 0.0)
    invariant(this.begin <= 1.0)
    invariant(this.end >= 0.0)
    invariant(this.end <= 1.0)
    invariant(this.end >= this.begin)

    t = clamp((t - this.begin) / (this.end - this.begin), 0.0, 1.0)
    if (t === 0.0 || t === 1.0) {
      return t
    }

    return this.curve.transform(t)
  }

  toString () {
    return `Interval([begin]: ${this.begin},[end]: ${this.end}, [curve]: ${this.curve})`
  }
}

//// => Threshold
export class Threshold extends Curve {
  public threshold: number

  constructor (threshold: number) {
    super()
    this.threshold = threshold
  }

  /**
   * 
   * @param {number} t 
   * @returns {number}
   */
  transformInternal (t: number) {
    invariant(this.threshold >= 0.0)
    invariant(this.threshold <= 1.0)
    return t < this.threshold ? 0.0 : 1.0
  }
}

//// => Cubic
export class Cubic extends Curve {
  static create <T = Cubic> (
    a: number, 
    b: number, 
    c: number, 
    d: number
  ) {
    return new Cubic(a, b, c, d) as T
  }

  public a: number
  public b: number
  public c: number
  public d: number

  constructor (
    a: number, 
    b: number, 
    c: number, 
    d: number
  ) {
    super()

    this.a = a
    this.b = b
    this.c = c
    this.d = d
  }
  
  evaluateCubic (a: number, b: number, m: number) {
    return (
      3 * this.a * (1 - m) * (1 - m) * m +
      3 * this.b * (1 - m) * m * m + m * m * m
    )
  }

  transformInternal (t: number): number {
    let start = 0.0
    let end = 1.0
    while (true) {
      const midpoint = (start + end) / 2
      const estimate = this.evaluateCubic(this.a, this.c, midpoint)
      if (Math.abs((t - estimate)) < Engine.env<number>('ATKIT_CUBIC_ERROR_BOUND', 0.001)) {
        return this.evaluateCubic(this.b, this.d, midpoint)
      }

      if (estimate < t) {
        start = midpoint
      } else {
        end = midpoint
      }
    }
  }

  toString(): string {
    return `Cubic(
      [a]: ${this.a},
      [b]: ${this.b},
      [c] :${this.c}, 
      [d]: ${this.d
    })`
  }
}


//// => ThreePointCubic
class ThreePointCubic extends Curve {
  static create <T = ThreePointCubic> (
    a1: Offset,
    b1: Offset,
    midpoint: Offset,
    a2: Offset,
    b2: Offset
  ) {
    return new ThreePointCubic(a1, b1, midpoint, a2, b2) as T
  }

  public a1: Offset
  public b1: Offset
  public a2: Offset
  public b2: Offset
  public midpoint: Offset

  constructor (
    a1: Offset,
    b1: Offset,
    midpoint: Offset,
    a2: Offset,
    b2: Offset,
  ) {
    super()

    this.a1 = a1
    this.b1 = b1
    this.midpoint = midpoint
    this.a2 = a2
    this.b2 = b2
  }

  transformInternal (t: number) {
    const firstCurve = t < this.midpoint.dx
    const scaleX = firstCurve ? this.midpoint.dx : 1.0 - this.midpoint.dx
    const scaleY = firstCurve ? this.midpoint.dy : 1.0 - this.midpoint.dy
    const scaledT = (t - (firstCurve ? 0.0 : this.midpoint.dx)) / scaleX

    if (firstCurve) {
      return Cubic.create(
        this.a1.dx / scaleX,
        this.a1.dy / scaleY,
        this.b1.dx / scaleX,
        this.b1.dy / scaleY,
      ).transform(scaledT) * scaleY

    } else {

      return Cubic.create(
        (this.a2.dx - this.midpoint.dx) / scaleX,
        (this.a2.dy - this.midpoint.dy) / scaleY,
        (this.b2.dx - this.midpoint.dx) / scaleX,
        (this.b2.dy - this.midpoint.dy) / scaleY,
      ).transform(scaledT) * scaleY + this.midpoint.dy
    }
  }

  toString () {
    return `ThreePointCubic(
      [a1]: ${this.a1} 
      [b1]: ${this.b1} 
      [midpoint]: ${this.midpoint} 
      [a2]: ${this.a2} 
      [b2]: ${this.b2}
    )`
  }
}

//// => Curve2D
export abstract class Curve2D extends ParametricCurve<Offset> {
  generateSamples(
    start: number = 0.0,
    end: number = 1.0,
    tolerance: number = 1e-10,
  ) {
   
    invariant(end > start)

    const isFlat = (p: Offset, q: Offset, r: Offset) => {
      const pr = p.subtract(r)
      const qr = q.subtract(r)
      const z = pr.dx * qr.dy - qr.dx * pr.dy
      return (z * z) < tolerance
    }

    const first = Curve2DSample.create(start, this.transform(start))
    const last = Curve2DSample.create(end, this.transform(end))
    const samples: Curve2DSample[] = [first]

    const sample = (p: Curve2DSample, q: Curve2DSample, forceSubdivide: boolean = false) => {  
      const t = p.t + (0.45 + 0.1 * Math.random()) * (q.t - p.t)
      const r = Curve2DSample.create(t, this.transform(t))

      if (!forceSubdivide && isFlat(p.value, q.value, r.value)) {
        samples.push(q);
      } else {
        sample(p, r)
        sample(r, q)
      }
    }

    sample(
      first,
      last,
      Math.abs((first.value.dx - last.value.dx)) < tolerance && 
      Math.abs((first.value.dy - last.value.dy)) < tolerance
    )
    
    return samples
  }
  
  findInverse (x: number) {
    let start = 0.0
    let end = 1.0
    let mid: number = 0
    
    const offsetToOrigin = (position: number) => {
      return x - this.transform(position).dx
    }
    
    const errorLimit = 1e-6
    const startValue = offsetToOrigin(start)
    let count = 100

    while ((end - start) / 2.0 > errorLimit && count > 0) {
      mid = (end + start) / 2.0
      const value = offsetToOrigin(mid)

      if (sign(value) === sign(startValue)) {
        start = mid
      } else {
        end = mid
      }
      count--
    }
    return mid
  }
}

//// => Curve2DSample
class Curve2DSample {
  static create (t: number, value: Offset) {
    return new Curve2DSample(t, value)
  }

  public t: number 
  public value: Offset 

  constructor (t: number, value: Offset) {
    this.t = t
    this.value = value
  }


  toString () {
    return `Curve2DSample([t]: ${this.t}, [value]: ${this.value})`
  }
}

//// => CatmullRomSpline
class CatmullRomSpline extends Curve2D {
  static create (
    controlPoints: Offset[], 
    tension: number = 0.0,
    startHandle: Offset | null = null,
    endHandle: Offset | null = null,
  ) {
    return new CatmullRomSpline(
      controlPoints,
      tension,
      startHandle,
      endHandle
    )
  }

  constructor (
    controlPoints: Offset[], 
    tension: number = 0.0,
    startHandle: Offset | null = null,
    endHandle: Offset | null = null,
  ) {
    super()
    invariant(tension >= 0.0, 'The argument "tension" must not be negative.')
    invariant(controlPoints.length > 3, 'There must be at least four control points to create a CatmullRomSpline.')

    this.controlPoints = controlPoints
    this.startHandle = startHandle
    this.endHandle = endHandle
    this.tension = tension
    this.cubicSegments = []
  }

  static precompute(
    controlPoints: Offset[],
    tension: number = 0.0,
    startHandle: Offset | null = null,
    endHandle: Offset | null = null,
  ) {
    invariant(tension <= 1.0, 'The argument "tension" must not be greater than 1.0.')
    invariant(tension >= 0.0, 'The argument "tension" must not be negative.')
    invariant(controlPoints.length > 3, 'There must be at least four control points to create a CatmullRomSpline.')

    const cr = CatmullRomSpline.create(
      controlPoints,
      tension,
      startHandle,
      endHandle,
    )

    cr.controlPoints = null
    cr.startHandle = null
    cr.endHandle = null
    cr.tension = null

    cr.cubicSegments = CatmullRomSpline.computeSegments(
      controlPoints, 
      tension, 
      startHandle, 
      endHandle
    )

    return cr
  }


  static computeSegments (
    controlPoints: Offset[],
    tension: number, 
    startHandle: Offset | null = null,
    endHandle: Offset | null = null,
  ): Offset[][]  {
    
    startHandle ??= controlPoints[0].multiply(2.0).subtract(controlPoints[1])
    endHandle ??= controlPoints[controlPoints.length -1].multiply(2.0).subtract(controlPoints[controlPoints.length - 2])
    const allPoints: Offset[] = [
      startHandle,
      ...controlPoints,
      endHandle,
    ]

    const alpha = 0.5
    const reverseTension = 1.0 - tension
    const result: Offset[][] = []
    
    for (let i = 0; i < allPoints.length - 3; ++i) {
      const curve = [
        allPoints[i], 
        allPoints[i + 1], 
        allPoints[i + 2], 
        allPoints[i + 3]
      ]
      const diffCurve10 = curve[1].subtract(curve[0])
      const diffCurve21 = curve[2].subtract(curve[1])
      const diffCurve32 = curve[3].subtract(curve[2])

      const t01 = Math.pow(diffCurve10.distance, alpha)
      const t12 = Math.pow(diffCurve21.distance, alpha)
      const t23 = Math.pow(diffCurve32.distance, alpha)

      const m1: Offset = diffCurve21.add((diffCurve10.divide(t01).subtract((curve[2].subtract(curve[0])).divide((t01 + t12))))).multiply(t12).multiply(reverseTension)
      const m2: Offset = diffCurve21.add((diffCurve32.divide(t23).subtract((curve[3].subtract(curve[1])).divide((t12 + t23))))).multiply(t12).multiply(reverseTension)
      const sumM12 = m1.add(m2)

      const segment: Offset[] = [
        diffCurve21.multiply(-2.0).add(sumM12),
        diffCurve21.multiply(3.0).subtract(m1).subtract(sumM12),
        m1,
        curve[1],
      ]

      result.push(segment)
    }

    return result
  }

  private cubicSegments: Offset[][]
  public controlPoints: Offset[] | null
  public startHandle: Offset | null
  public endHandle: Offset | null
  public tension: number | null

  // => samplingSeed
  public get samplingSeed () {
    this.initializeIfNeeded()
    const seedPoint = this.cubicSegments[0][1]
    return Math.round((seedPoint.dx + seedPoint.dy) * 10000)
  }

  private initializeIfNeeded() {
    if (this.cubicSegments.length > 0) {
      return
    }
    
    invariant(this.controlPoints)
    invariant(this.tension)

    const segments = CatmullRomSpline.computeSegments(this.controlPoints, this.tension, this.startHandle, this.endHandle)

    for (const segment of segments) {
      this.cubicSegments.push(segment)
    }
  }

  transformInternal (t: number) {
    this.initializeIfNeeded()
    const length = this.cubicSegments.length
    let position: number
    let localT: number
    let index: number
    if (t < 1.0) {
      position = t * length
      localT = position % 1.0
      index = Math.floor(position)
    } else {
      position = length
      localT = 1.0
      index = this.cubicSegments.length - 1
    }
    const cubicControlPoints: Offset[] = this.cubicSegments[index]
    const localT2 = localT * localT
    return (
      cubicControlPoints[0].multiply(localT2).multiply(localT).add(
        cubicControlPoints[1].multiply(localT2).add(
          cubicControlPoints[2].multiply(localT).add(
            cubicControlPoints[3]
          )
        )
      )
    )
  }
}

//// => CatmullRomCurve
export class CatmullRomCurve extends Curve {
  static create <T = CatmullRomCurve> (controlPoints: Offset[], tension?: number) {
    return new CatmullRomCurve(controlPoints, tension) as T
  }

  public precomputedSamples: Curve2DSample[] = []
  public controlPoints: Offset[]
  public tension: number

  constructor (controlPoints: Offset[], tension: number = 0.0) {
    super()

    this.controlPoints = controlPoints
    this.tension = tension
  }

  static precompute (controlPoints: Offset[], tension: number = 0.0) {
    const cr = CatmullRomCurve.create(controlPoints, tension)
    cr.precomputedSamples = CatmullRomCurve.computeSamples(controlPoints, tension)
  }

  static computeSamples (controlPoints: Offset[], tension: number): Curve2DSample[] {
    return CatmullRomSpline.precompute(
      [
        Offset.zero(), 
        ...controlPoints, 
        new Offset(1.0, 1.0)
      ],
      tension,
    ).generateSamples(1e-12)
  }
  
  static validateControlPoints (
    controlPoints: Offset[] | null = null, 
    tension: number = 0.0,
    reasons: string[] | null = null,
  ) {
    if (controlPoints === null) {
      return false
    }

    if (controlPoints.length < 2) {
      return false
    }

    controlPoints = [
      Offset.zero(), 
      ...controlPoints, 
      new Offset(1.0, 1.0)
    ]
    const startHandle = controlPoints[0].multiply(2.0).subtract(controlPoints[1])
    const endHandle = controlPoints[controlPoints.length - 1].multiply(2.0).subtract(controlPoints[controlPoints.length - 2])
    controlPoints = [startHandle, ...controlPoints, endHandle]
    
    let lastX = -Infinity
    for (let i = 0; i < controlPoints.length; ++i) {
      if (
        i > 1 &&
        i < controlPoints.length - 2 &&
        (controlPoints[i].dx <= 0.0 || controlPoints[i].dx >= 1.0)
      ) {
        return false
      }

      if (controlPoints[i].dx <= lastX) {
        return false
      }

      lastX = controlPoints[i].dx
    }

    let success = true

    lastX = -Infinity
    const tolerance = 1e-3
    const testSpline = CatmullRomSpline.create(controlPoints, tension)
    const start = testSpline.findInverse(0.0)
    const end = testSpline.findInverse(1.0)
    const samplePoints = testSpline.generateSamples(start, end)
    
    if (
      Math.abs(samplePoints[0].value.dy) > tolerance || 
      Math.abs((1.0 - samplePoints[samplePoints.length - 1].value.dy)) > tolerance
    ) {
      const bail = true
      success = false
     
      if (bail) {
        return false
      }
    }
    for (const sample of samplePoints) {
      const point = sample.value
      const t = sample.t
      const x = point.dx
      if (t >= start && t <= end && (x < -1e-3 || x > 1.0 + 1e-3)) {
        const bail = true
        success = false
       
        if (bail) {
          return false
        }
      }

      if (x < lastX) {
        const bail = true
        success = false;
        if (bail) {
          return false;
        }
      }
      lastX = x
    }

    return success
  }

  /**
   * 
   * @param {number} t 
   * @returns {number}
   */
  transformInternal (t: number): number {
    if (this.precomputedSamples.length === 0) {
      const samples = CatmullRomCurve.computeSamples(this.controlPoints, this.tension)
      this.precomputedSamples.push(...samples)
    }
    let start = 0
    let end = this.precomputedSamples.length - 1
    let mid: number
    let value: Offset
    let startValue: Offset = this.precomputedSamples[start].value
    let endValue: Offset = this.precomputedSamples[end].value
    
    while (end - start > 1) {
      mid = Math.ceil((end + start) / 2)
      value = this.precomputedSamples[mid].value
      if (t >= value.dx) {
        start = mid;
        startValue = value;
      } else {
        end = mid;
        endValue = value;
      }
    }

    const t2 = (t - startValue.dx) / (endValue.dx - startValue.dx);
    return lerp(startValue.dy, endValue.dy, t2)
  }

  toString () {
    return ``
  }
}

//// => FlippedCurve
export class FlippedCurve extends Curve {
  static create <T = FlippedCurve> (curve: Curve) {
    return new FlippedCurve(curve) as T
  }

  public curve: Curve

  constructor (curve: Curve) {
    super()
    this.curve = curve
  }

  transformInternal (t: number) {
    return 1.0 - this.curve.transform(1.0 - t)
  }

  toString () {
    return `FlippedCurve(
      [curve]: ${this.curve}
    )`
  }
}

//// => DecelerateCurve
export class DecelerateCurve extends Curve {
  static create <T = DecelerateCurve> () {
    return new DecelerateCurve() as T
  }

  transformInternal (t: number) {
    t = 1.0 - t
    return 1.0 - t * t
  }
}

//// => BounceInCurve
export class BounceInCurve extends Curve {
  static create <T = BounceInCurve> () {
    return new BounceInCurve() as T
  }

  transformInternal (t: number) {
    return 1.0 - bounce(1.0 - t)
  }
}

//// => BounceOutCurve
export class BounceOutCurve extends Curve {
  static create <T = BounceOutCurve> () {
    return new BounceInCurve() as T
  }

  transformInternal (t: number) {
    return bounce(t)
  }
}

//// => BounceInOutCurve
export class BounceInOutCurve extends Curve {
  static create <T = BounceInOutCurve> () {
    return new BounceInCurve() as T
  }

  transformInternal (t: number) {
    if (t < 0.5) {
      return (1.0 - bounce(1.0 - t * 2.0)) * 0.5
    } else {
      return bounce(t * 2.0 - 1.0) * 0.5 + 0.5
    }
  }
}

//// => ElasticInCurve
export class ElasticInCurve extends Curve {
  static create <T = ElasticInCurve> (period?: number) {
    return new ElasticInCurve(period) as T
  }
  
  public period: number

  constructor (period: number = 0.4) {
    super()
    this.period = period
  }

  transformInternal (t: number) {
    const s = this.period / 4.0
    t = t - 1.0
    return -Math.pow(2.0, 10.0 * t) * Math.sin((t - s) * (Math.PI * 2.0) / this.period)
  }

  toString () {
    return `ElasticInCurve(
      [period]: ${this.period}
    )`
  }
}


//// => ElasticOutCurve
export class ElasticOutCurve extends Curve {
  static create <T = ElasticOutCurve> (period?: number) {
    return new ElasticOutCurve(period) as T
  }

  public period: number

  constructor (period: number = 0.4) {
    super()
    this.period = period
  }

  transformInternal (t: number) {
    const s = this.period / 4.0
    return Math.pow(2.0, -10 * t) * Math.sin((t - s) * (Math.PI * 2.0) / this.period) + 1.0
  }

  toString () {
    return `ElasticOutCurve(
      [period]: ${this.period}
    )`
  }
}

//// => ElasticInOutCurve
export class ElasticInOutCurve extends Curve {
  static create <T = ElasticInOutCurve> (period?: number) {
    return new ElasticInOutCurve(period) as T
  }

  public period: number

  constructor (period: number = 0.4) {
    super()
    this.period = period
  }

  transformInternal (t: number): number {
    const s = this.period / 4.0
    t = 2.0 * t - 1.0
    if (t < 0.0) {
      return -0.5 * Math.pow(2.0, 10.0 * t) * Math.sin((t - s) * (Math.PI * 2.0) / this.period)
    } else {
      return Math.pow(2.0, -10.0 * t) * Math.sin((t - s) * (Math.PI * 2.0) / this.period) * 0.5 + 1.0
    }
  }

  toString () {
    return `ElasticInOutCurve(
      [period]: ${this.period}
    )`
  }
}

//// => Curves
export class Curves {
  static LINEARE = Linear.create<Linear>()
  static DECELERATE = DecelerateCurve.create()
  static FAST_LINEAR_TO_SLOW_EASE_IN = Cubic.create(0.18, 1.0, 0.04, 1.0)
  static EASE = Cubic.create(0.25, 0.1, 0.25, 1.0)
  static EASE_IN = Cubic.create(0.42, 0.0, 1.0, 1.0)
  static EASE_IN_TO_LINEAR = Cubic.create(0.67, 0.03, 0.65, 0.09)
  static EASE_IN_SINE = Cubic.create(0.47, 0.0, 0.745, 0.715)
  static EASE_IN_QUAD = Cubic.create(0.55, 0.085, 0.68, 0.53)
  static EASE_IN_CUBIC = Cubic.create(0.55, 0.055, 0.675, 0.19)
  static EASE_IN_QUART = Cubic.create(0.895, 0.03, 0.685, 0.22)
  static EASE_IN_QUINT = Cubic.create(0.755, 0.05, 0.855, 0.06)
  static EASE_IN_EXPO = Cubic.create(0.95, 0.05, 0.795, 0.035)
  static EASE_IN_CIRC = Cubic.create(0.6, 0.04, 0.98, 0.335)
  static EASE_IN_BACK = Cubic.create(0.6, -0.28, 0.735, 0.045)
  static EASE_OUT = Cubic.create(0.0, 0.0, 0.58, 1.0)
  static LINEAR_TO_EASE_OUT = Cubic.create(0.35, 0.91, 0.33, 0.97)
  static EASE_OUT_SINE = Cubic.create(0.39, 0.575, 0.565, 1.0)
  static EASE_OUT_QUAD = Cubic.create(0.25, 0.46, 0.45, 0.94)
  static EASE_OUT_CUBIC = Cubic.create(0.215, 0.61, 0.355, 1.0)
  static EASE_OUT_QUART = Cubic.create(0.165, 0.84, 0.44, 1.0)
  static EASE_OUT_QUINT = Cubic.create(0.23, 1.0, 0.32, 1.0)
  static EASE_OUT_EXPO = Cubic.create(0.19, 1.0, 0.22, 1.0)
  static EASE_OUT_CIRC = Cubic.create(0.075, 0.82, 0.165, 1.0)
  static EASE_OUT_BACK = Cubic.create(0.175, 0.885, 0.32, 1.275)
  static EASE_IN_OUT = Cubic.create(0.42, 0.0, 0.58, 1.0)
  static EASE_IN_OUT_SINE = Cubic.create(0.445, 0.05, 0.55, 0.95)
  static EASE_IN_OUT_QUAD = Cubic.create(0.455, 0.03, 0.515, 0.955)
  static EASE_IN_OUT_CUBIC = Cubic.create(0.645, 0.045, 0.355, 1.0)
  static EASE_IN_OUT_CUBIC_EMPHASIZED = ThreePointCubic.create(
    new Offset(0.05, 0), 
    new Offset(0.133333, 0.06),
    new Offset(0.166666, 0.4),
    new Offset(0.208333, 0.82), 
    new Offset(0.25, 1),
  )
  static EASE_IN_OUT_QUART = Cubic.create(0.77, 0.0, 0.175, 1.0)
  static EASE_IN_OUT_QUINT = Cubic.create(0.86, 0.0, 0.07, 1.0)
  static EASE_IN_OUT_EXPO = Cubic.create(1.0, 0.0, 0.0, 1.0)
  static EASE_IN_OUT_CIRC = Cubic.create(0.785, 0.135, 0.15, 0.86)
  static EASE_IN_OUT_BACK = Cubic.create(0.68, -0.55, 0.265, 1.55)
  static FAST_OUT_SLOW_IN = Cubic.create(0.4, 0.0, 0.2, 1.0)
  static SLOW_MIDDLE = Cubic.create(0.15, 0.85, 0.85, 0.15)
  static BOUNCE_IN = BounceInCurve.create()
  static BOUNCE_OUT = BounceOutCurve.create()
  static BOUNCE_IN_OUT = BounceInOutCurve.create()
  static ELASTIC_IN = ElasticInCurve.create()
  static ELASTIC_OUT = ElasticOutCurve.create()
  static ELASTIC_IN_OUT = ElasticInOutCurve.create()
}


