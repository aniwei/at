import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { SanitizedEventDispatcher } from './dispatcher'
import { HitTestEntry, HitTestResult } from './hit-test'
import { PointerChangeKind, PointerEventSanitizer, SanitizedPointerEvent } from './sanitizer'
import { GestureArenaManager } from './arena'


//// => Gesture
// 手势
export class Gesture extends PointerEventSanitizer {
  static create (devicePixelRatio: number) {
    return new Gesture(devicePixelRatio)
  }

  protected locked: boolean = false
  protected queue: SanitizedPointerEvent[] = []
  protected hitTests: Map<number, HitTestResult> = new Map()
  
  public arena: GestureArenaManager = new GestureArenaManager()
  public dispatcher: SanitizedEventDispatcher = SanitizedEventDispatcher.create()

  flushPointerEventQueue () {
    invariant(!this.locked, 'Cannot flush event queue when the gesture was locked.')
    while (this.queue.length > 0) {
      this.handlePointerEvent(this.queue.shift() as SanitizedPointerEvent)
    }
  }

  // 处理事件
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
   * @param {PointerPacket} packet 
   */
  sanitizePointerEvent (event: PointerEvent) {
    this.sanitize(event).map(event => {
      this.queue.push(event)
    })

    if (!this.locked) {
      this.flushPointerEventQueue()
    }
  }

  hitTest (result: HitTestResult, position: Offset) {
    result.add(new HitTestEntry(this))
  }

  /**
   * 
   * @param {Pointer} event 
   */
  handlePointerEvent (pointer: SanitizedPointerEvent) {
    invariant(!this.locked)
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

        break
      }

      case PointerChangeKind.Up: {

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
  dispatchEvent (event: SanitizedPointerEvent, hitTestResult: HitTestResult | null) {
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
  