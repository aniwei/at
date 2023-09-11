import invariant from 'ts-invariant'
import { nearZero } from '../basic/helper'
import { At } from '../at'

export type ToleranceOptions = {
  distance?: number,
  time?: number,
  velocity?: number,
}

export class Tolerance {
  static get defaultTolerance () {
    invariant(At.kDefaultTolerance)
    return At.kDefaultTolerance
  }
  static create (options?: ToleranceOptions) {
    return new Tolerance(
      options?.distance,
      options?.time,
      options?.velocity,
    )
  }

  public distance: number
  public time: number
  public velocity: number

  /**
   * 
   * @param {number} distance 
   * @param {number} time 
   * @param {number} velocity 
   */
  constructor (
    distance: number = At.kEpsilonDefault,
    time: number = At.kEpsilonDefault,
    velocity: number = At.kEpsilonDefault
  ) {
    this.distance = distance
    this.time = time
    this.velocity = velocity
  }

  toString () {
    return `Tolerance([distance]: ${this.distance}, [time]: ${this.time}, velocity: ${this.velocity})`
  }
}

//// => Simulation
export abstract class Simulation {
  public tolerance: Tolerance

  constructor (tolerance: Tolerance = Tolerance.defaultTolerance) {
    this.tolerance = tolerance
  }

  abstract x (time: number): number
  abstract dx (time: number): number
  abstract isDone (time: number): boolean

  toString () {
    return `Simulation([tolerance]: ${this.tolerance})`
  }
}


//// => SpringDescription
export type SpringDescriptionOptions = {
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
    return `SpringDescription(mass: ${this.mass}, stiffness: ${this.stiffness}, damping: ${this.damping})`
  }
}

//// => SpringSimulation
export enum SpringTypeKind {
  CriticallyDamped,
  UnderDamped,
  OverDamped,
}

export type SpringSimulationOptions = {
  spring: SpringDescription,
  start: number,
  end: number,
  velocity: number,
  tolerance: Tolerance 
}

export class SpringSimulation extends Simulation {
  static create (options: SpringSimulationOptions) {
    return new SpringSimulation(
      options.spring,
      options.start,
      options.end,
      options.velocity,
      options.tolerance,
    )
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

  x (time: number) {
    return this.endPosition + this.solution.x(time)
  }

  dx (time: number) {
    return this.solution.dx(time)
  }

  isDone (time: number) {
    return (
      nearZero(this.solution.x(time), this.tolerance.distance) &&
      nearZero(this.solution.dx(time), this.tolerance.velocity)
    )
  }

  toString () {
    return `SpringSimulation()`
  }
}

//// => ScrollSpringSimulation
export class ScrollSpringSimulation extends SpringSimulation {

  x (time: number) {
    return this.isDone(time) ? this.endPosition : super.x(time)
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

  abstract x(time: number): number
  abstract dx(time: number): number
  abstract type: SpringTypeKind
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
  
  x (time: number) {
    return (this.c1 + this.c2 * time) * Math.pow(Math.E, this.r * time)
  }

  
  dx (time: number) {
    const power = Math.pow(Math.E, this.r * time)
    return this.r * (this.c1 + this.c2 * time) * power + this.c2 * power
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

  static withArgs (w: number, r: number, c1: number, c2: number) {
    return new UnderdampedSolution(w, r, c1, c2)
  }

  public readonly type = SpringTypeKind.UnderDamped

  public w: number
  public r: number
  public c1: number
  public c2: number

  constructor (w: number, r: number, c1: number, c2: number) {
    this.w = w
    this.r = r
    this.c1 = c1
    this.c2 = c2
  }

  x (time: number) {
    return (Math.pow(Math.E, this.r * time)) * (this.c1 * Math.cos(this.w * time) + this.c2 * Math.sin(this.w * time))
  }

  dx (time: number) {
    const power = Math.pow(Math.E, this.r * time)
    const cosine = Math.cos(this.w * time)
    const sine = Math.sin(this.w * time)
    return power * (this.c2 * this.w * cosine - this.c1 * this.w * sine) + this.r * power * (this.c2 * sine + this.c1 * cosine)
  }
}
