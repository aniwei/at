import { clamp, invariant } from '@at/utils'
import { Ticker, TickerProvider } from '@at/engine'
import { Curve, Curves } from './curves'
import { AnimationStateKind, Animation } from './animation'
import { 
  InterpolationSimulation, 
  RepeatingSimulation, 
  Simulation, 
  SpringDescription, 
  SpringSimulation, 
  Tolerance 
} from './simulation'

// 动画方向
export enum AnimationDirectionKind {
  Forward,
  Reverse,
}

// 动画行为
export enum AnimationBehaviorKind {
  Normal,
  Preserve,
}

//// => AnimationController
export interface AnimationControllerOptions {
  value?: number | null,
  duration?: number | null,
  reverseDuration?: number,
  lowerBound?: number,
  upperBound?: number,
  behavior?: AnimationBehaviorKind,
  vsync: TickerProvider,
}

export class AnimationController extends Animation<number> {
  /**
   * 创建 AnimationController 对象
   * @param {AnimationControllerOptions} options 
   * @returns {AnimationController}
   */
  static create <T> (options: AnimationControllerOptions) {
    return new AnimationController(
      options?.vsync,
      options?.value,
      options?.duration,
      options?.reverseDuration,
      options?.lowerBound,
      options?.upperBound,
      options?.behavior,
    ) as T
  }
  
  /**
   * 无边界
   * @param {number} value 
   * @param {number} duration 
   * @param {number} reverseDuration 
   * @param {TickerProvider} vsync 
   * @param {AnimationBehaviorKind} behavior 
   */
  static unbounded (
    value: number = 0.0,
    duration: number,
    reverseDuration: number,
    vsync: TickerProvider,
    behavior = AnimationBehaviorKind.Preserve,
  ) {
    const ctrl = AnimationController.create<AnimationController>({
      value,
      duration,
      reverseDuration,
      vsync,
      behavior,
    })
    
    ctrl.lowerBound = Number.NEGATIVE_INFINITY
    ctrl.upperBound = Number.NEGATIVE_INFINITY
    ctrl.direction = AnimationDirectionKind.Forward 

    ctrl.ticker = vsync.create((t: number) => ctrl.tick(t))
    ctrl.value = value

    return ctrl
  }

  // => value
  protected _value: number | null = null
  public get value (): number {
    invariant(this._value !== null)
    return this._value as number
  }
  public set value (value: number | null) {
    invariant(value !== null, 'The argument "value" cannot be null.')

    if (
      this._value === null || 
      this._value !== value
    ) {

      this.stop()
      
      this._value = clamp(
        value, 
        this.lowerBound, 
        this.upperBound
      )

      if (this._value === this.lowerBound) {
        this.state = AnimationStateKind.Dismissed
      } else if (this._value === this.upperBound) {
        this.state = AnimationStateKind.Completed
      } else {
        this.state = this.direction === AnimationDirectionKind.Forward 
          ? AnimationStateKind.Forward 
          : AnimationStateKind.Reverse
      }

      this.checkStateChanged()
      this.publish()
    }
  }

  // => state
  protected _state: AnimationStateKind = AnimationStateKind.Dismissed
  public get state (): AnimationStateKind {
    invariant(this._state !== null)
    return this._state
  }
  public set state (state: AnimationStateKind) {
    if (this._state !== state) {
      this._state = state
    }
  }

  // => view
  public get view (): Animation<number> {
    return this
  } 

  // => velocity
  public get velocity () {
    if (!this.isAnimating) {
      return 0.0
    }

    invariant(this.simulation, 'The "AnimationContaroller.simulation" cannot be null.')
    invariant(this.lastElapsedDuration, 'The "AnimationContaroller.lastElapsedDuration" cannot be null.')

    return this.simulation.dx(this.lastElapsedDuration / 1000)
  }
 
  // => isAnimating
  public get isAnimating (): boolean {
    return this.ticker !== null && this.ticker.actived
  }

  // 最后状态
  protected lastState: AnimationStateKind = AnimationStateKind.Dismissed
  // 动画方向
  public direction: AnimationDirectionKind
  // 动画时长
  public duration: number | null
  // 反转时长
  public reverseDuration: number | null
  // 计算器
  public ticker: Ticker | null
  // 上下边界
  public lowerBound: number
  public upperBound: number
  // 行为
  public behavior: AnimationBehaviorKind
  // 最后时长
  public lastElapsedDuration: number | null = null
  // 仿真
  public simulation: Simulation | null = null

  /**
   * 构造函数
   * @param {TickerProvider} vsync 
   * @param {number | null} value 
   * @param {number | null} duration 
   * @param {number | null} reverseDuration 
   * @param {number} lowerBound 
   * @param {number} upperBound 
   * @param {AnimationBehaviorKind} behavior 
   * @param {AnimationDirectionKind} direction 
   */
  constructor (
    vsync: TickerProvider,
    value: number | null = null,
    duration: number | null = null,
    reverseDuration: number | null = null,
    lowerBound: number = 0.0,
    upperBound: number = 1.0,
    behavior: AnimationBehaviorKind = AnimationBehaviorKind.Normal,
    direction: AnimationDirectionKind = AnimationDirectionKind.Forward 
  ) {
    super()

    invariant(upperBound >= lowerBound)
    this.lowerBound = lowerBound
    this.upperBound = upperBound

    this.behavior = behavior
    this.duration = duration
    this.reverseDuration = reverseDuration

    this.direction = direction
    this.ticker = vsync.create((t: number) => this.tick(t))

    this.setValue(value ?? lowerBound)
  }

  /**
   * 设置值
   * @param v 
   */
  setValue (v: number) {
    this.value = clamp(v, this.lowerBound, this.upperBound)
  }

  /**
   * 重启
   * @param {TickerProvider} vsync 
   */
  resync (vsync: TickerProvider) {
    invariant(this.ticker, 'The  "AnimationController.ticker" cannot be null.')
    const oldTicker = this.ticker

    this.ticker = vsync.create((t: number) => this.tick(t))
    this.ticker.absorb(oldTicker)
  }

  /**
   * 向前
   * @param {number | null} from 
   * @returns 
   */
  forward (from: number | null = null) {
    this.direction = AnimationDirectionKind.Forward

    if (from !== null) {
      this.value = from
    }

    return this.animateTo(this.upperBound)
  }

  /**
   * 向后
   * @param {number | null} from 
   * @returns 
   */
  reverse (from: number | null = null) {
    this.direction = AnimationDirectionKind.Reverse
    if (from !== null) {
      this.value = from
    }

    return this.animateTo(this.lowerBound)
  }

  /**
   * 
   * @param {number} target 
   * @param {number} duration 
   * @param {Curve} curve 
   * @returns 
   */
  animateTo (
    target: number, 
    duration: number | null = null, 
    curve: Curve = Curves.LINEARE
  ) {
    invariant(
      this.ticker !== null,
      'AnimationController.animateTo() called after AnimationController.dispose()\n'
    )
    const scale = 1.0
    let simulationDuration = duration
    
    this.direction = AnimationDirectionKind.Forward

    if (simulationDuration === null) {
      const range = this.upperBound - this.lowerBound

      const remainingFraction = Number.isFinite(range) 
        ? Math.abs((target - this.value)) / range 
        : 1.0

      const directionDuration = (
        this.direction !== AnimationDirectionKind.Forward && 
        this.reverseDuration !== null
      ) ? this.reverseDuration
        : this.duration

      invariant(directionDuration)

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

      this.state = (this.direction === AnimationDirectionKind.Forward) 
        ? AnimationStateKind.Completed 
        : AnimationStateKind.Dismissed
      
      this.checkStateChanged()
    }

    invariant(simulationDuration > 0)
    invariant(!this.isAnimating)

    return this.start(InterpolationSimulation.create({
      begin: this.value, 
      end: target, 
      duration: simulationDuration, 
      curve, 
      scale
    }))
  }

  /**
   * 
   * @param {number} target 
   * @param {number | null} duration 
   * @param curve 
   * @returns 
   */
  animateBack (
    target: number, 
    duration: number | null, 
    curve: Curve = Curves.LINEARE
  ) {
    invariant(
      this.ticker !== null,
      'AnimationController.animateBack() called after AnimationController.dispose()\n'
    )

    this.direction = AnimationDirectionKind.Reverse
    return this.animateTo(target, duration, curve)
  }

  /**
   * 重复
   * @param {number | null} min 
   * @param {number | null} max 
   * @param {boolean} reverse 
   * @param {number | null} period 
   * @returns 
   */
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

    return this.start(RepeatingSimulation.create({ 
      initialValue: this.value, 
      min, 
      max, 
      reverse, 
      period, 
      directionSetter: this.directionSetter
    }))
  }

  /**
   * 计算方向
   * @param direction 
   */
  directionSetter (direction: AnimationDirectionKind) {

    this.direction = direction
    this.state = (this.direction == AnimationDirectionKind.Forward) 
      ? AnimationStateKind.Forward 
      : AnimationStateKind.Reverse

    this.checkStateChanged()
  }

  /**
   * 
   * @param {number} velocity 
   * @param {SpringDescription} springDescription 
   * @param {AnimationBehaviorKind | null} behavior 
   * @returns 
   */
  fling (
    velocity: number = 1.0, 
    springDescription: SpringDescription = SpringDescription.withDampingRatio(1.0, 500.0),
    behavior: AnimationBehaviorKind | null = null
  ) {
    const fling = Tolerance.fling()

    this.direction = velocity < 0.0 
      ? AnimationDirectionKind.Reverse 
      : AnimationDirectionKind.Forward
    
    const target = velocity < 0.0 
      ? this.lowerBound - fling.distance
      : this.upperBound + fling.distance
    behavior = behavior ?? this.behavior
    
    const scale = 1.0

    const simulation = SpringSimulation.create({
      spring: springDescription, 
      start: this.value, 
      end: target, 
      velocity: velocity * scale,
      tolerance: Tolerance.fling()
    })
    
    this.stop()

    return this.start(simulation)
  }

  /**
   * 
   * @param {Simulation} simulation 
   * @returns {void}
   */
  animateWith (simulation: Simulation) {
    this.stop()
    this.direction = AnimationDirectionKind.Forward
    return this.start(simulation)
  }

  /**
   * 检查状态变更
   */
  checkStateChanged () {
    const state = this.state

    if (this.lastState !== state) {
      this.lastState = state
      this.publish(state)
    }
  }

  /**
   * 执行计算
   * @param {number} elapsed 
   * @returns {void}
   */
  tick (elapsed: number): void {
    this.lastElapsedDuration = elapsed
    const elapsedInSeconds = elapsed / 1000
    
    invariant(elapsedInSeconds >= 0.0)
    invariant(this.simulation)

    this.value = clamp(
      this.simulation.x(elapsedInSeconds), 
      this.lowerBound, 
      this.upperBound
    )
    
    // 完成
    if (this.simulation.done(elapsedInSeconds)) {
      this.state = (this.direction == AnimationDirectionKind.Forward) 
        ? AnimationStateKind.Completed 
        : AnimationStateKind.Dismissed
      
      this.stop()
    }
    
    this.publish()
    this.checkStateChanged()
  }

  /**
   * 开始执行
   * @param {Simulation} simulation 
   * @returns 
   */
  start (simulation: Simulation) {
    invariant(!this.isAnimating)

    this.simulation = simulation
    this.lastElapsedDuration = 0

    this.value = clamp(simulation.x(0.0), this.lowerBound, this.upperBound)

    invariant(this.ticker, 'The "AnimationController.ticker" cannot be null.')
    const result = this.ticker.start()

    this.state = (this.direction === AnimationDirectionKind.Forward) 
      ? AnimationStateKind.Forward 
      : AnimationStateKind.Reverse
    this.checkStateChanged()
    
    return result
  }

  /**
   * 停止
   */
  stop () {
    this.simulation = null
    this.lastElapsedDuration = null
    invariant(this.ticker, 'The "AnimationController.ticker" cannot be null.')

    this.ticker.stop()
  }

  /**
   * 重置
   */
  reset () {
    this.value = this.lowerBound
  }

  /**
   * 销毁
   */
  dispose () {
    invariant(this.ticker !== null)
    this.ticker.dispose()
    this.ticker = null
    this.clear()
  }
}