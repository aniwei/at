import { invariant } from '@at/utility'
import { clamp, lerp } from '@at/basic'
import { Curve, Curves } from './curves'
import { AnimationStatus, Animation } from './animation'
import { AtTicker, AtTickerFuture, AtTickerProvider } from '../basic/ticker'
import { AtSpringDescription, AtSpringSimulation, Tolerance } from './simulation'

export enum AnimationDirectionKind {
  Forward,
  Reverse,
}

export enum AnimationBehaviorKind {
  Normal,
  Preserve,
}

//// => AnimationController
export type AnimationControllerOptions = {
  value?: number | null,
  duration?: number | null,
  reverseDuration?: number,
  lowerBound?: number,
  upperBound?: number,
  behavior?: AnimationBehaviorKind,
  vsync: AtTickerProvider,
}

export class AnimationController extends Animation<number> {
  static create (options: AnimationControllerOptions) {
    return new AnimationController(
      options?.value,
      options?.duration,
      options?.reverseDuration,
      options?.lowerBound,
      options?.upperBound,
      options?.behavior,
      options?.vsync,
    )
  }
  
  static unbounded (
    value: number = 0.0,
    duration: number,
    reverseDuration: number,
    vsync: AtTickerProvider,
    behavior = AnimationBehaviorKind.Preserve,
  ) {
    const controller = AnimationController.create({
      value,
      duration,
      reverseDuration,
      vsync,
      behavior,
    })
    controller.lowerBound = Number.NEGATIVE_INFINITY
    controller.upperBound = Infinity
    controller.direction = AnimationDirectionKind.Forward 

    controller.ticker = vsync.createTicker(controller.tick)
    controller.internalSetValue(value)
  }

  public get view (): Animation<number> {
    return this
  } 

  public get velocity () {
    if (!this.isAnimating) {
      return 0.0
    }
    invariant(this.simulation)
    invariant(this.lastElapsedDuration)
    return this.simulation.dx(this.lastElapsedDuration / 1000)
  }

  // => value
  private _value: number | null = null
  public get value (): number {
    invariant(this._value !== null)
    return this._value
  }
  public set value (newValue: number | null) {
    this.stop()
    invariant(newValue !== null)
    this.internalSetValue(newValue)
    this.publish()
    this.checkStatusChanged()
  }

  // => status
  private _status: AnimationStatus | null = null
  public get status (): AnimationStatus {
    invariant(this._status !== null)
    return this._status
  }
 
  public get isAnimating (): boolean {
    return this.ticker !== null && this.ticker.isActive
  }

  public direction: AnimationDirectionKind
  public lastElapsedDuration: number | null = null
  public duration: number | null
  public reverseDuration: number | null
  public ticker: AtTicker | null
  public simulation: Simulation | null = null
  public lowerBound: number
  public upperBound: number
  public behavior: AnimationBehaviorKind

  constructor (
    value: number | null = null,
    duration: number | null = null,
    reverseDuration: number | null = null,
    lowerBound: number = 0.0,
    upperBound: number = 1.0,
    behavior = AnimationBehaviorKind.Normal,
    vsync: AtTickerProvider,
  ) {
    super()
    invariant(upperBound >= lowerBound)
    this.lowerBound = lowerBound
    this.upperBound = upperBound
    this.behavior = behavior
    this.duration = duration
    this.reverseDuration = reverseDuration

    this.direction = AnimationDirectionKind.Forward 
    this.ticker = vsync.createTicker(this.tick)
    this.internalSetValue(value ?? lowerBound)
  }

 

  resync (vsync: AtTickerProvider) {
    invariant(this.ticker)
    const oldTicker = this.ticker
    this.ticker = vsync.createTicker(this.tick)
    this.ticker.absorbTicker(oldTicker)
  }


 
  reset () {
    this._value = this.lowerBound
  }

  private internalSetValue (newValue: number) {
    this._value = clamp(newValue, this.lowerBound, this.upperBound)
    
    if (this._value === this.lowerBound) {
      this._status = AnimationStatus.Dismissed
    } else if (this._value === this.upperBound) {
      this._status = AnimationStatus.Completed
    } else {
      this._status = this.direction === AnimationDirectionKind.Forward 
        ? AnimationStatus.Forward 
        : AnimationStatus.Reverse
    }
  }

  forward (from: number | null = null) {
    
    this.direction = AnimationDirectionKind.Forward;
    if (from !== null) {
      this.value = from
    }

    return this.animateToInternal(this.upperBound)
  }

  reverse (from: number | null = null) {
    this.direction = AnimationDirectionKind.Reverse
    if (from !== null) {
      this.value = from
    }

    return this.animateToInternal(this.lowerBound)
  }

  animateTo (target: number, duration: number | null, curve: Curve = Curves.linear) {
    invariant(
      this.ticker !== null,
      'AnimationController.animateTo() called after AnimationController.dispose()\n'
    )
    this.direction = AnimationDirectionKind.Forward
    return this.animateToInternal(target, duration, curve)
  }


  animateBack (target: number, duration: number | null, curve: Curve = Curves.linear) {
    invariant(
      this.ticker !== null,
      'AnimationController.animateBack() called after AnimationController.dispose()\n'
    )
    this.direction = AnimationDirectionKind.Reverse
    return this.animateToInternal(target, duration, curve)
  }

  animateToInternal (
    target: number, 
    duration: number | null = null, 
    curve: Curve = Curves.linear
  ) {
    const scale = 1.0
    let simulationDuration = duration
    if (simulationDuration == null) {
      invariant(!(this.duration === null && this.direction == AnimationDirectionKind.Forward))
      invariant(!(this.duration === null && this.direction == AnimationDirectionKind.Reverse && this.reverseDuration == null))
      const range = this.upperBound - this.lowerBound
      const remainingFraction = Number.isFinite(range) 
        ? Math.abs((target - this.value)) / range 
        : 1.0

      const directionDuration =
        (this.direction === AnimationDirectionKind.Reverse && this.reverseDuration !== null)
        ? this.reverseDuration
        : this.duration
      invariant(directionDuration !== null)
      simulationDuration = directionDuration * remainingFraction
    } else if (target === this.value) {
      simulationDuration = 0
    }

    this.stop()
    
    if (simulationDuration === 0) {
      if (this._value !== target) {
        this._value = clamp(target, this.lowerBound, this.upperBound)
        this.publish()
      }

      this._status = (this.direction === AnimationDirectionKind.Forward) 
        ? AnimationStatus.Completed 
        : AnimationStatus.Dismissed
      
        this.checkStatusChanged()
      return AtTickerFuture.resolve()
    }

    invariant(simulationDuration > 0)
    invariant(!this.isAnimating)

    return this.startSimulation(InterpolationSimulation.create({
      begin: this.value, 
      end: target, 
      duration: simulationDuration, 
      curve, 
      scale
    }))
  }

  repeat (
    min: number | null = null, 
    max: number | null = null, 
    reverse: boolean = false, 
    period: number | null = null
  ) {
    min ??= this.lowerBound
    max ??= this.upperBound
    period ??= this.duration
    
    invariant(max >= min)
    invariant(max <= this.upperBound && min >= this.lowerBound)
    this.stop()

    invariant(period)
    return this.startSimulation(RepeatingSimulation.create({ 
      initialValue: this.value, 
      min, 
      max, 
      reverse, 
      period, 
      directionSetter: this.directionSetter
    }))
  }

  private directionSetter (direction: AnimationDirectionKind) {
    this.direction = direction
    this._status = (this.direction == AnimationDirectionKind.Forward) 
      ? AnimationStatus.Forward 
      : AnimationStatus.Reverse
    this.checkStatusChanged()
  }


  fling (
    velocity: number = 1.0, 
    springDescription: AtSpringDescription = At.kFlingSpringDescription as AtSpringDescription, 
    behavior: AnimationBehaviorKind | null = null
  ) {
    invariant(At.kFlingTolerance)
    this.direction = velocity < 0.0 
      ? AnimationDirectionKind.Reverse 
      : AnimationDirectionKind.Forward
    const target = velocity < 0.0 
      ? this.lowerBound - At.kFlingTolerance.distance
      : this.upperBound + At.kFlingTolerance.distance
    behavior = behavior ?? this.behavior
    
    const scale = 1.0

    
    const simulation = AtSpringSimulation.create({
      spring: springDescription, 
      start: this.value, 
      end: target, 
      velocity: velocity * scale,
      tolerance: At.kFlingTolerance
    })
    
    this.stop()
    return this.startSimulation(simulation)
  }

  animateWith (simulation: Simulation) {
    this.stop()
    this.direction = AnimationDirectionKind.Forward
    return this.startSimulation(simulation)
  }

  startSimulation (simulation: Simulation) {
    invariant(!this.isAnimating)
    this.simulation = simulation
    this.lastElapsedDuration = 0

    this._value = clamp(simulation.x(0.0), this.lowerBound, this.upperBound)
    invariant(this.ticker)
    const result = this.ticker.start()
    this._status = (this.direction === AnimationDirectionKind.Forward) 
      ? AnimationStatus.Forward 
      : AnimationStatus.Reverse
    this.checkStatusChanged()
    
    return result
  }

  
  stop (canceled: boolean = true ) {
    this.simulation = null
    this.lastElapsedDuration = null
    invariant(this.ticker !== null)
    this.ticker.stop(canceled)
  }

  dispose () {
    invariant(this.ticker !== null)
    this.ticker.dispose()
    this.ticker = null
    this.clearStatusSubscribers()
    this.clear()
  }

  private lastReportedStatus: AnimationStatus = AnimationStatus.Dismissed
  private checkStatusChanged() {
    const newStatus = this.status
    if (this.lastReportedStatus !== newStatus) {
      this.lastReportedStatus = newStatus
      this.publishStatusChange(newStatus)
    }
  }

  tick (elapsed: number): void {
    this.lastElapsedDuration = elapsed
    const elapsedInSeconds = elapsed / 1000
    
    invariant(elapsedInSeconds >= 0.0)
    invariant(this.simulation)
    this._value = clamp(this.simulation.x(elapsedInSeconds), this.lowerBound, this.upperBound)
    
    if (this.simulation.isDone(elapsedInSeconds)) {
      this._status = (this.direction == AnimationDirectionKind.Forward) 
        ? AnimationStatus.Completed 
        : AnimationStatus.Dismissed
      
      this.stop(false)
    }
    
    this.publish()
    this.checkStatusChanged()
  }
}

type DirectionSetter = (direction: AnimationDirectionKind) => void


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
    return `Simulation()`
  }
}

export type RepeatingSimulationOptions = {
  initialValue: number, 
  min: number, 
  max: number, 
  reverse: boolean, 
  period: number, 
  directionSetter: DirectionSetter
}

export class RepeatingSimulation extends Simulation {
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

  constructor (
    initialValue: number, 
    min: number, 
    max: number, 
    reverse: boolean, 
    period: number, 
    directionSetter: DirectionSetter
  ) {
    super()
    // TODO
    this.min = min
    this.max = max
    this.reverse = reverse
    this.directionSetter = directionSetter
    this.periodInSeconds = period / 1000
    this.initialT = (this.max === this.min) 
      ? 0.0 
      : (initialValue / (this.max - this.min)) * (period / 1000) 
    invariant(this.periodInSeconds > 0.0)
    invariant(this.initialT >= 0.0)
  }
  

  public min: number
  public max: number
  public reverse: boolean
  public directionSetter: DirectionSetter

  private periodInSeconds: number
  private initialT: number

  
  x (timeInSeconds: number) {
    invariant(timeInSeconds >= 0.0)

    const totalTimeInSeconds = timeInSeconds + this.initialT
    const t = (totalTimeInSeconds / this.periodInSeconds) % 1.0
    const isPlayingReverse = Math.ceil(totalTimeInSeconds / this.periodInSeconds)
    //.isOdd;

    if (this.reverse && isPlayingReverse) {
      this.directionSetter(AnimationDirectionKind.Reverse)
      return lerp(this.max, this.min, t)
    } else {
      this.directionSetter(AnimationDirectionKind.Forward)
      return lerp(this.min, this.max, t)
    }
  }

  dx (timeInSeconds: number) {
    return (this.max - this.min) / this.periodInSeconds
  }

  isDone (timeInSeconds: number) {
    return false
  }
}

export type InterpolationSimulationOptions = {
  begin: number,
  end: number, 
  duration: number, 
  curve: Curve, 
  scale: number
}

export class InterpolationSimulation extends Simulation {
  static create (options: InterpolationSimulationOptions) {
    return new InterpolationSimulation(
      options.begin,
      options.end,
      options.duration,
      options.curve,
      options.scale,
    )
  }

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
    this.durationInSeconds = duration * scale / 1000
  }

  private durationInSeconds: number
  private begin: number
  private end: number
  private curve: Curve

  x (timeInSeconds: number) {
    const t = clamp(timeInSeconds / this.durationInSeconds, 0.0, 1.0)
    if (t === 0.0) {
      return this.begin
    } else if (t === 1.0) {
      return this.end
    } else {
      return this.begin + (this.end - this.begin) * this.curve.transform(t)
    }
  }

  dx (timeInSeconds: number) {
    const epsilon = this.tolerance.time
    return (this.x(timeInSeconds + epsilon) - this.x(timeInSeconds - epsilon)) / (2 * epsilon)
  }

  isDone (timeInSeconds: number) {
    return timeInSeconds > this.durationInSeconds
  }
}