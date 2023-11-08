import invariant from '@at/utils'
import { At, VoidCallback } from '../at'

export type TickerCallback = (elapsed: number) => void

export class AtTickerProvider {
  static create (mode?: boolean) {
    return new AtTickerProvider(mode)
  }

  // => mode
  private _mode: boolean = false
  public get mode () {
    return this._mode
  }
  public set mode (value: boolean) {
    if (value !== this._mode) {
      this._mode = value

      invariant(this.tickers)
      for (const ticker of this.tickers) {
        ticker.muted = this._mode
      }
    }
  }

  private tickers: Set<AtTicker> | null = null

  constructor (mode: boolean = false) {
    this.mode = mode
  }

  createTicker (onTick: TickerCallback): AtTicker {
    this.tickers ??= new Set()

    const ticker = AtTicker.create(onTick)
    invariant(this.mode !== null)
    ticker.muted = this.mode
    this.tickers.add(ticker)

    return ticker
  }

  removeTicker (ticker: AtTicker) {
    invariant(this.tickers !== null)
    this.tickers.delete(ticker)
  }

  dispose () {
    this.tickers?.clear()
    this.tickers = null
  }
}

export class AtTicker {
  static create (onTick: TickerCallback) {
    return new AtTicker(onTick)
  }

  constructor (onTick: TickerCallback) {
    this.onTick = onTick
  }

  // => muted
  private _muted = false
  public get muted (): boolean {
    return this._muted
  }
  set muted (value: boolean) {
    if (value !== this._muted) {
      this._muted = value
      if (value) {
        this.unscheduleTick()
      } else if (this.shouldScheduleTick) {
        this.scheduleTick()
      }
    }
  }

  // => isTicking
  public get isTicking (): boolean {
    if (this.future === null) {
      return false
    }

    if (this.muted) {
      return false
    }

    return false
  }

  // => isActive
  public get isActive () {
    return this.future !== null
  }

  // => scheduled
  public get scheduled () {
    return this.animationId !== null
  }

  // => shouldScheduleTick
  public get shouldScheduleTick () {
    return !this.muted && this.isActive && !this.scheduled
  }

  private onTick: TickerCallback
  private animationId: number | null = null
  private startTime: number | null = null
  private future: AtTickerFuture | null = null
  
  start () {
    invariant(this.startTime === null)
    this.future = AtTickerFuture.create()
    if (this.shouldScheduleTick) {
      this.scheduleTick()
    }

    // if (
    //   SchedulerBinding.instance.schedulerPhase.index > SchedulerPhase.idle.index &&
    //   SchedulerBinding.instance.schedulerPhase.index < SchedulerPhase.postFrameCallbacks.index
    // ) {
    //   this.startTime = SchedulerBinding.instance.currentFrameTimeStamp
    // }

    return this.future
  }


  stop (canceled: boolean = false) {
    if (!this.isActive) {
      return
    }

    const localFuture = this.future
    this.future = null
    this.startTime = null
    
    invariant(!this.isActive)
    this.unscheduleTick()

    invariant(localFuture)
    if (canceled) {
      localFuture.reject(this)
    } else {
      localFuture.resolve()
    }
  }

  private tick (timeStamp: number) {
    invariant(this.isTicking)
    invariant(this.scheduled)
    this.animationId = null
    
    this.startTime ??= timeStamp
    this.onTick(timeStamp - this.startTime!)

    
    if (this.shouldScheduleTick) {
      this.scheduleTick(true)
    }
  }


  scheduleTick (rescheduling: boolean = false ) {
    invariant(!this.scheduled)
    invariant(this.shouldScheduleTick)

    At.frame.register((timeStamp: number) => this.tick(timeStamp))
  }

  
  unscheduleTick () {
    if (this.scheduled) {
      invariant(this.animationId !== null)
      At.frame.unregister(this.animationId)

      this.animationId = null
    }
    invariant(!this.shouldScheduleTick)
  }

  absorbTicker (originalTicker: AtTicker) {
    invariant(!this.isActive)
    invariant(this.future === null)
    invariant(this.startTime === null)
    invariant(this.animationId === null)
    invariant((originalTicker.future === null) == (originalTicker.startTime === null), 'Cannot absorb Ticker after it has been disposed.')
    
    if (originalTicker.future !== null) {
      this.future = originalTicker.future
      this.startTime = originalTicker.startTime
      if (this.shouldScheduleTick) {
        this.scheduleTick()
      }
      originalTicker.future = null
      originalTicker.unscheduleTick()
    }
    originalTicker.dispose()
  }

  
  dispose () {
    if (this.future !== null) {
      const localFuture = this.future
      this.future = null

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
      invariant(!this.isActive)
      this.unscheduleTick()
      localFuture.reject(this)
    }
  }

  toString () {
    return ``
  }
}

export type TickerFutureResolve<T> = (value: T | PromiseLike<T>) => T
export type TickerFutureReject = (reason?: any) => void

export class AtTickerFuture extends Promise<void> {
  static create () {
    return new AtTickerFuture()
  }

  private completed: boolean = false
  private _resolve: TickerFutureResolve<void> | null = null
  private _reject: TickerFutureReject | null = null


  constructor () {
    super((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve () {
    this.completed = true
    invariant(this._resolve)
    this._resolve()
  }

  reject (ticker: AtTicker) {
    this.completed = false
    invariant(this._reject)
    this._reject(ticker)
  }
  
  toString () {
    return `AtTickerFuture()`
  }
}
