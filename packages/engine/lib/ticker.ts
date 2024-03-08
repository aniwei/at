import { invariant } from '@at/utils'
import { Engine } from '@at/engine'
import { SchedulerPhaseKind } from './scheduler'

export interface TickerCallback {
  (elapsed: number): void
}

export class TickerProvider {
  static create (instance: Engine,  mode?: boolean) {
    return new TickerProvider(instance, mode)
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

  protected engine: Engine
  protected tickers: Set<Ticker> | null = null

  constructor (
    engine: Engine,
    mode: boolean = false
  ) {
    this.engine = engine
    this.mode = mode
  }

  /**
   * 创建 Ticker 对象
   * @param {TickerCallback} onTick 
   * @returns {Ticker}
   */
  create (onTick: TickerCallback): Ticker {
    invariant(this.mode !== null, 'The "TickerProvider.mode" cannot be null.')
    
    this.tickers ??= new Set()

    const ticker = Ticker.create(this.engine, this.mode, onTick)
    this.tickers.add(ticker)

    return ticker
  }

  /**
   * 删除 Ticker
   * @param {Ticker} ticker 
   */
  remove (ticker: Ticker) {
    invariant(this.tickers !== null, 'The "TickerProvider.tickers" cannot be null.')
    this.tickers.delete(ticker)
  }

  dispose () {
    this.tickers?.clear()
    this.tickers = null
  }
}


export enum TickerStateKind {
  Actived = 1,
  Scheduled = 2
}

//// => Ticker
export class Ticker {
  static create (
    instance: Engine, 
    mode: boolean, 
    onTick: TickerCallback
  ) {
    return new Ticker(instance, mode, onTick)
  }

  // => muted
  protected _muted: boolean = false
  public get muted (): boolean {
    return this._muted
  }
  public set muted (value: boolean) {
    if (value !== this._muted) {
      this._muted = value
      value ? this.unregister() : this.register()
    }
  }

  public get actived () {
    return (this.state & TickerStateKind.Actived) === TickerStateKind.Actived
  }

  // => scheduled
  public get scheduled () {
    return (this.state & TickerStateKind.Scheduled) === TickerStateKind.Scheduled
  }

  // => shouldSchedule
  public get shouldScheduleTick () {
    if (!this.muted) {
      return this.actived && !this.scheduled
    }

    return false
  }

  protected onTick: TickerCallback

  protected t: number | null = null
  protected instance: Engine

  protected state: TickerStateKind = TickerStateKind.Actived

  constructor (
    instance: Engine,
    mode: boolean,
    onTick: TickerCallback, 
  ) {

    this.muted = mode
    
    this.instance = instance
    this.instance?.on('performtransient', this.tick.bind(this))

    this.onTick = onTick
  }

  tick (t: number) {
    this.t ??= t
    this.onTick(t - this.t)

    if (this.shouldScheduleTick) {
      this.register()
    }
  }


  register () {
    if (!this.scheduled) {
      this.state |= TickerStateKind.Scheduled
      this.instance.registerPersistent(this.tick.bind(this))
    }
  }

  unregister () {
    if (this.scheduled) {
      this.state = this.state &~ TickerStateKind.Scheduled
      this.instance.unregisterPersistent(this.tick.bind(this))
    }
  }
  
  start () {
    this.state |= TickerStateKind.Actived

    if (
      this.instance.phase > SchedulerPhaseKind.Idle &&
      this.instance.phase < SchedulerPhaseKind.Persistent
    ) {
      this.t = this.instance.t
    }

    if (this.shouldScheduleTick) {
      this.register()
    }
  }

  stop () {
    if (this.actived) {
      this.t = null    
      this.state = this.state &~ TickerStateKind.Actived

      this.unregister()
    }
  }

  absorb (origin: Ticker) {
    invariant(!this.actived)
    invariant(!this.scheduled)
    
    this.state = origin.state
    this.t = origin.t

    if (this.shouldScheduleTick) {
      this.register()
    }
    
    origin.unregister()
    origin.dispose()
  }
  
  dispose () {
    this.stop()
    
  }
}