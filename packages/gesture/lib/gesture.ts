import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Engine, EngineConfiguration, EngineEnvironments } from '@at/engine'
import { SanitizedEventDispatcher } from './dispatcher'
import { HitTestEntry, HitTestResult } from './hit-test'
import { PointerChangeKind, PointerEventSanitizer, SanitizedPointerEvent } from './sanitizer'
import { GestureArenaManager } from './arena'


export interface Gesture extends EngineEnvironments {
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
export abstract class Gesture extends Engine {
  public arena: GestureArenaManager
  public dispatcher: SanitizedEventDispatcher
  
  protected locked: boolean
  protected hitTests: Map<number, HitTestResult>
  protected pendingQueue: SanitizedPointerEvent[]
  
  protected sanitizer: PointerEventSanitizer

  constructor (configuration: EngineConfiguration) {
    super(configuration)

    this.locked = false
    this.pendingQueue = []
    this.hitTests = new Map()
    this.arena = GestureArenaManager.create()
    this.dispatcher = SanitizedEventDispatcher.create()
    this.sanitizer = PointerEventSanitizer.create(this.configuration.devicePixelRatio)
  }

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
        this.hitTest(hitTestResult, event.position)

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
        break
      }
    }

    if (
      hitTestResult !== null ||
      event.change === PointerChangeKind.Add ||
      event.change === PointerChangeKind.Remove
    ) {
      this.dispatchEvent(event,hitTestResult)
    }
  }

  /**
   * 
   * @param {HitTestResult} result 
   * @param {Offset} position 
   */
  hitTest (result: HitTestResult, position: Offset) {
    result.add(new HitTestEntry(this))
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
  handlePointerEvent (pointer: SanitizedPointerEvent) {
    invariant(!this.locked, 'Cannot handle pointer event when "Gesture" was locked.')
    this.handlePointerEventImmediately(pointer)
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
  