

import { clamp, invariant, lerp, nearZero } from '@at/utils'
import { Engine } from '@at/engine'
import { AnimationDirectionKind } from './controller'
import { Curve } from './curves'

export interface DirectionSetter {
  (direction: AnimationDirectionKind): void
}

export interface ToleranceOptions {
  distance?: number,
  time?: number,
  velocity?: number,
}

export class Tolerance {
  static default () {
    return Tolerance.create()
  }

  static fling () {
    return Tolerance.create({ 
      velocity: Number.POSITIVE_INFINITY, 
      distance: 0.01 
    })
  }
  
  /**
   * 
   * @param {ToleranceOptions?} options 
   * @returns {Tolerance}
   */
  static create (options?: ToleranceOptions) {
    return new Tolerance(
      options?.distance,
      options?.time,
      options?.velocity,
    )
  }

  public time: number
  public distance: number
  public velocity: number

  /**
   * 构造函数
   * @param {number} distance 
   * @param {number} time 
   * @param {number} velocity 
   */
  constructor (
    distance: number = Engine.env<number>('ATKIT_EPSILONE', 1e-3),
    time: number = Engine.env<number>('ATKIT_EPSILONE', 1e-3),
    velocity: number = Engine.env<number>('ATKIT_EPSILONE', 1e-3),
  ) {
    this.distance = distance
    this.time = time
    this.velocity = velocity
  }

  toString () {
    return `Tolerance(
      [distance]: ${this.distance}, 
      [time]: ${this.time}, 
      [velocity]: ${this.velocity}
    )`
  }
}

//// => Simulation
export abstract class Simulation {
  public tolerance: Tolerance

  constructor (tolerance: Tolerance = Tolerance.default()) {
    this.tolerance = tolerance
  }

  abstract x (time: number): number
  abstract dx (time: number): number
  abstract done (time: number): boolean

  toString () {
    return `Simulation(
      [tolerance]: ${this.tolerance}
    )`
  }
}


//// => SpringDescription
export interface SpringDescriptionOptions {
  mass: number,
  stiffness: number,
  damping?: number, 
}

export class SpringDescription {
  static create (options: SpringDescriptionOptions) {
    return new SpringDescription(
      options.mass,
      options.stiffness,
      options.damping,
    )
  }
  
  static withDampingRatio (
    mass: number,
    stiffness: number,
    ratio: number = 1.0,
  ) {
    const spring = SpringDescription.create({
      mass,
      stiffness
    })

    spring.damping = ratio * 2.0 * Math.sqrt(mass * stiffness)

    return spring
  }

  public mass: number
  public stiffness: number
  public damping: number | null = null

  constructor (
    mass: number,
    stiffness: number,
    damping: number | null = null, 
  ) {
    this.mass = mass
    this.stiffness = stiffness
    this.damping = damping
  }
  
  toString () {
    return `SpringDescription(
      [mass]: ${this.mass}, 
      [stiffness]: ${this.stiffness}, 
      [damping]: ${this.damping}
    )`
  }
}

//// => SpringSimulation
export enum SpringTypeKind {
  CriticallyDamped,
  UnderDamped,
  OverDamped,
}

export interface SpringSimulationOptions {
  spring: SpringDescription,
  start: number,
  end: number,
  velocity: number,
  tolerance: Tolerance 
}

export class SpringSimulation extends Simulation {
  /**
   * 创建 SpringSimulation 对象
   * @param {SpringSimulationOptions} options 
   * @returns {SpringSimulation}
   */
  static create (options: SpringSimulationOptions) {
    return new SpringSimulation(
      options.spring,
      options.start,
      options.end,
      options.velocity,
      options.tolerance,
    ) as SpringSimulation
  }

  // => type
  public get type () {
    return this.solution.type
  }

  protected endPosition: number
  protected solution: SpringSolution

  constructor (
    spring: SpringDescription,
    start: number,
    end: number,
    velocity: number,
    tolerance: Tolerance 
  ) {
    super(tolerance)
    this.endPosition = end
    this.solution = SpringSolution.create(spring, start - end, velocity)
  } 

  x (t: number) {
    return this.endPosition + this.solution.x(t)
  }

  dx (t: number) {
    return this.solution.dx(t)
  }

  done (t: number) {
    return (
      nearZero(this.solution.x(t), this.tolerance.distance) &&
      nearZero(this.solution.dx(t), this.tolerance.velocity)
    )
  }

  toString () {
    return `SpringSimulation(
      [type]: ${this.type},
      [endPosition]: ${this.endPosition},
      [solution]: ${this.solution},
    )`
  }
}

//// => ScrollSpringSimulation
export class ScrollSpringSimulation extends SpringSimulation {
  x (t: number) {
    return this.done(t) 
      ? this.endPosition 
      : super.x(t)
  }
}

//// => SpringSolution
export abstract class SpringSolution {
  static create (
    spring: SpringDescription,
    initialPosition: number,
    initialVelocity: number,
  ) {
    invariant(spring.damping)

    const cmk = spring.damping * spring.damping - 4 * spring.mass * spring.stiffness

    if (cmk === 0.0) {
      return CriticalSolution.create(spring, initialPosition, initialVelocity)
    }

    if (cmk > 0.0) {
      return OverdampedSolution.create(spring, initialPosition, initialVelocity)
    }

    return UnderdampedSolution.create(spring, initialPosition, initialVelocity)
  }

  abstract type: SpringTypeKind
  abstract x(time: number): number
  abstract dx(time: number): number
}

//// => CriticalSolution
export class CriticalSolution implements SpringSolution {
  static create (
    spring: SpringDescription,
    distance: number,
    velocity: number,
  ) {
    invariant(spring.damping)
    const r = -spring.damping / (2.0 * spring.mass)
    const c1 = distance
    const c2 = velocity - (r * distance)
    return CriticalSolution.withArgs(r, c1, c2)
  }

  static withArgs (r: number, c1: number, c2: number) {
    return new CriticalSolution(r, c1, c2)
  }

  readonly type = SpringTypeKind.CriticallyDamped
    
  public r: number 
  public c1: number 
  public c2: number

  constructor (r: number, c1: number, c2: number) {
    this.r = r
    this.c1 = c1
    this.c2 = c2
  }
  
  x (t: number) {
    return (this.c1 + this.c2 * t) * Math.pow(Math.E, this.r * t)
  }

  dx (t: number) {
    const power = Math.pow(Math.E, this.r * t)
    return this.r * (this.c1 + this.c2 * t) * power + this.c2 * power
  }  
}

//// => AtOverdampedSolution
export class OverdampedSolution implements SpringSolution {
  static create (
    spring: SpringDescription,
    distance: number,
    velocity: number,
  ) {
    invariant(spring.damping)
    const cmk = spring.damping * spring.damping - 4 * spring.mass * spring.stiffness
    const r1 = (-spring.damping - Math.sqrt(cmk)) / (2.0 * spring.mass)
    const r2 = (-spring.damping + Math.sqrt(cmk)) / (2.0 * spring.mass)
    const c2 = (velocity - r1 * distance) / (r2 - r1)
    const c1 = distance - c2

    return OverdampedSolution.withArgs(r1, r2, c1, c2)
  }

  static withArgs (r1: number, r2: number, c1: number, c2: number) {
    return new OverdampedSolution(r1, r2, c1, c2)
  }

  readonly type = SpringTypeKind.OverDamped

  public r1: number
  public r2: number
  public c1: number
  public c2: number
  
  constructor (r1: number, r2: number, c1: number, c2: number) {
    this.r1 = r1
    this.r2 = r2
    this.c1 = c1    
    this.c2 = c2
  }

  x (time: number) {
    return (
      this.c1 * Math.pow(Math.E, this.r1 * time) +
      this.c2 * Math.pow(Math.E, this.r2 * time)
    )
  }

  dx (time: number) {
    return (
      this.c1 * this.r1 * Math.pow(Math.E, this.r1 * time) +
      this.c2 * this.r2 * Math.pow(Math.E, this.r2 * time)
    )
  }
}


//// => UnderdampedSolution
export class UnderdampedSolution implements SpringSolution {
  static create (
    spring: SpringDescription,
    distance: number,
    velocity: number,
  ) {
    invariant(spring.damping)
    const w = Math.sqrt(4.0 * spring.mass * spring.stiffness - spring.damping * spring.damping) / (2.0 * spring.mass)
    const r = -(spring.damping / 2.0 * spring.mass)
    const c1 = distance
    const c2 = (velocity - r * distance) / w
    return UnderdampedSolution.withArgs(w, r, c1, c2)
  }

  static withArgs (
    w: number, 
    r: number, 
    c1: number, 
    c2: number
  ) {
    return new UnderdampedSolution(w, r, c1, c2)
  }

  public readonly type = SpringTypeKind.UnderDamped

  public w: number
  public r: number
  public c1: number
  public c2: number

  /**
   * 
   * @param {number} w 
   * @param {number} r 
   * @param {number} c1 
   * @param {number} c2 
   */
  constructor (
    w: number, 
    r: number, 
    c1: number, 
    c2: number
  ) {
    this.w = w
    this.r = r
    this.c1 = c1
    this.c2 = c2
  }

  x (t: number) {
    return (
      Math.pow(Math.E, this.r * t) * 
      (
        this.c1 * Math.cos(this.w * t) + 
        this.c2 * Math.sin(this.w * t)
      )
    )
  }

  dx (t: number) {
    const power = Math.pow(Math.E, this.r * t)
    const cosine = Math.cos(this.w * t)
    const sine = Math.sin(this.w * t)

    return power * (this.c2 * this.w * cosine - this.c1 * this.w * sine) + this.r * power * (this.c2 * sine + this.c1 * cosine)
  }
}


//// => RepeatingSimulation
export interface RepeatingSimulationOptions {
  initialValue: number, 
  min: number, 
  max: number, 
  reverse: boolean, 
  period: number, 
  directionSetter: DirectionSetter
}

export class RepeatingSimulation extends Simulation {
  /**
   * 创建 RepeatingSimulation
   * @param {RepeatingSimulationOptions} options 
   * @returns 
   */
  static create (options: RepeatingSimulationOptions) {
    return new RepeatingSimulation(
      options.initialValue,
      options.min,
      options.max,
      options.reverse,
      options.period,
      options.directionSetter,
    )
  }

  public min: number
  public max: number
  public reverse: boolean
  public directionSetter: DirectionSetter

  private periodInSeconds: number
  private initialT: number

  /**
   * 构造
   * @param {number} initialValue 
   * @param {number} min 
   * @param {number} max 
   * @param {boolean} reverse 
   * @param {number} period 
   * @param {DirectionSetter} directionSetter 
   */
  constructor (
    initialValue: number, 
    min: number, 
    max: number, 
    reverse: boolean, 
    period: number, 
    directionSetter: DirectionSetter
  ) {
    super()
    
    this.min = min
    this.max = max
    this.reverse = reverse
    this.directionSetter = directionSetter
    this.periodInSeconds = period / 1000
    this.initialT = (this.max === this.min) 
      ? 0.0 
      : (initialValue / (this.max - this.min)) * (period / 1000)
  }

  x (t: number) {
    invariant(t >= 0.0)

    const totalTimeInSeconds = t + this.initialT
    const v = (totalTimeInSeconds / this.periodInSeconds) % 1.0
    const isPlayingReverse = Math.ceil(t / this.periodInSeconds)
    //.isOdd;

    if (this.reverse && isPlayingReverse) {
      this.directionSetter(AnimationDirectionKind.Reverse)
      return lerp(this.max, this.min, v)
    } else {
      this.directionSetter(AnimationDirectionKind.Forward)
      return lerp(this.min, this.max, v)
    }
  }

  dx (t: number) {
    return (this.max - this.min) / this.periodInSeconds
  }

  done (t: number) {
    return false
  }
}


//// => InterpolationSimulation
export interface InterpolationSimulationOptions {
  begin: number,
  end: number, 
  duration: number, 
  curve: Curve, 
  scale: number
}
export class InterpolationSimulation extends Simulation {
  /**
   * 创建 InterpolationSimulation 对象
   * @param {InterpolationSimulationOptions} options 
   * @returns {InterpolationSimulation}
   */
  static create (options: InterpolationSimulationOptions) {
    return new InterpolationSimulation(
      options.begin,
      options.end,
      options.duration,
      options.curve,
      options.scale,
    )
  }

  protected duration: number
  protected begin: number
  protected end: number
  protected curve: Curve

  constructor (
    begin: number,
    end: number, 
    duration: number, 
    curve: Curve, 
    scale: number
  ) {
    super()

    this.begin = begin
    this.end = end
    this.curve = curve
    this.duration = duration * scale / 1000
  }

  /**
   * 
   * @param {number} v 
   * @returns 
   */
  x (v: number) {
    const t = clamp(v / this.duration, 0.0, 1.0)
    if (t === 0.0) {
      return this.begin
    } else if (t === 1.0) {
      return this.end
    } else {
      return this.begin + (this.end - this.begin) * this.curve.transform(t)
    }
  }

  /**
   * 
   * @param {number} t 
   * @returns 
   */
  dx (t: number) {
    const epsilon = this.tolerance.time
    return (this.x(t + epsilon) - this.x(t - epsilon)) / (2 * epsilon)
  }

  /**
   * 
   * @param {number} t 
   * @returns 
   */
  done (t: number) {
    return t > this.duration
  }
}