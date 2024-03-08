import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Engine, EngineConfiguration, EngineEnvironments } from '@at/engine'
import { GestureArenaManager } from './arena'
import { SanitizedEventDispatcher } from './dispatcher'
import { HitTestEntry, HitTestResult } from './hit-test'
import { PointerChangeKind, PointerEventSanitizer, SanitizedPointerEvent } from './sanitizer'


// 手势处置
export enum GestureDispositionKind {
  Accepted,
  Rejected,
}

export interface GestureEnvironments extends EngineEnvironments {
  ATKIT_GESTURE_TOUCH_SLOP: number,
  ATKIT_GESTURE_PAN_SLOP: number,
  ATKIT_GESTURE_PRESS_TIMEOUT: number,
  ATKIT_GESTURE_MIN_FLING_VELOCITY: number,
  ATKIT_GESTURE_MAX_FLING_VELOCITY: number,
  ATKIT_GESTURE_MOUSE_SCROLL_TO_SCALE_FACTOR: number,
  ATKIT_GESTURE_TRACK_SCROLL_TO_SCALE_FACTOR: Offset,
  ATKIT_GESTURE_PRECISE_HIT_SLOP: number,
  ATKIT_GESTURE_PRECISE_PAN_SLOP: number
}

//// => Gesture
// 手势
export class Gesture  {
  static create (engine: Engine, configuration: EngineConfiguration) {
    return new Gesture(engine, configuration)
  }

  /**
   * 获取环境变了
   * @param {string} key 
   * @param {string?} defaultEnv 
   * @returns 
   */
  static env <T extends string | number | unknown> (key: string, defaultEnv?: T): T {
    return Engine.env<T>(key, defaultEnv) as T
  }

  // 竞技场
  public arena: GestureArenaManager
  // 事件分发器
  public dispatcher: SanitizedEventDispatcher
  // 是否锁
  protected locked: boolean
  // 碰撞结果
  protected hitTests: Map<number, HitTestResult>
  // 事件队列
  protected pendingQueue: SanitizedPointerEvent[]
  // 事件处理器
  protected sanitizer: PointerEventSanitizer
  // 引擎实例
  protected engine: Engine

  /**
   * 
   * @param {EngineConfiguration} configuration 
   */
  constructor (engine: Engine, configuration: EngineConfiguration) {
    this.locked = false
    this.engine = engine
    this.pendingQueue = []
    this.hitTests = new Map()
    this.arena = GestureArenaManager.create()
    this.dispatcher = SanitizedEventDispatcher.create()
    this.sanitizer = PointerEventSanitizer.create(configuration.devicePixelRatio)
  }

  /**
   * 
   */
  flushPointerEventQueue () {
    invariant(!this.locked, 'Cannot flush event queue when the gesture was locked.')
    while (this.pendingQueue.length > 0) {
      this.handlePointerEvent(this.pendingQueue.shift() as SanitizedPointerEvent)
    }
  }

  /**
   * 
   * @param {SanitizedPointerEvent} event 
   */
  handlePointerEventImmediately (event: SanitizedPointerEvent) {
    let hitTestResult: HitTestResult | null = null

    switch (event.change) {
      case PointerChangeKind.Down:
      case PointerChangeKind.Hover: {
        invariant(!this.hitTests.has(event.id), `Cannot exist event.pointer in hitTests`)
        hitTestResult = HitTestResult.create()
        this.engine.hitTest(hitTestResult, event.position)

        if (event.change === PointerChangeKind.Down) {
          this.hitTests.set(event.id, hitTestResult)
        }

        break
      }
      case PointerChangeKind.Up:
      case PointerChangeKind.Cancel: {
        hitTestResult = this.hitTests.get(event.id) ?? null
        this.hitTests.delete(event.id)
        break
      }

      default: {
        if (event.down) {
          hitTestResult = this.hitTests.get(event.id) ?? null
        }
        break
      }
    }

    if (
      hitTestResult !== null ||
      event.change === PointerChangeKind.Added ||
      event.change === PointerChangeKind.Removed
    ) {
      this.engine.dispatchEvent(event,hitTestResult)
    }
  }

  /**
   * 
   * @param {HitTestResult} result 
   * @param {Offset} position 
   */
  hitTest (result: HitTestResult, position: Offset) {
    result.add(HitTestEntry.create(this))
  }

  /**
   * 
   * @param {PointerEvent} event 
   */
  sanitizePointerEvent (event: PointerEvent) {
    this.sanitizer.sanitize(event).map(event => {
      this.pendingQueue.push(event)
    })

    if (!this.locked) {
      this.flushPointerEventQueue()
    }
  }

  /**
   * 
   * @param {Pointer} event 
   */
  handlePointerEvent (event: SanitizedPointerEvent) {
    invariant(!this.locked, 'Cannot handle pointer event when "Gesture" was locked.')
    this.handlePointerEventImmediately(event)
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @param {HitTestEntry} entry 
   */
  handleEvent (
    event: SanitizedPointerEvent, 
    entry: HitTestEntry
  ) {
    this.dispatcher.route(event)

    switch (event.change) {
      case PointerChangeKind.Down: {
        this.arena.close(event.id)
        break
      }

      case PointerChangeKind.Up: {
        this.arena.sweep(event.id)
        break
      }
    }
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @param {HitTestResult | null} hitTestResult 
   * @returns 
   */
  dispatchEvent (
    event: SanitizedPointerEvent, 
    hitTestResult: HitTestResult | null
  ) {
    invariant(!this.locked, 'Cannot dispatch event when ths gesture was "locked".')
    
    if (hitTestResult === null) {
      try {
        this.dispatcher.route(event)
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
      }
    } else {
      for (const entry of hitTestResult.path) {
        try {
          entry.target.handleEvent(event.transformed(entry.transform), entry)
        } catch (error: any) {
          console.warn(`Caught ProgressEvent with target: ${error.stack}`)
        }
      }
    }

  }
}
  