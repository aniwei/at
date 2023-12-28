import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { HitTestEntry, HitTestResult } from './hit-test'
import { SanitizedEvent, PointerEventSanitizer } from './sanitizer'
import { GestureArenaManager } from './arena'


//// => Gesture
// 手势
export class Gesture extends PointerEventSanitizer {
  static create (devicePixelRatio: number) {
    return new Gesture(devicePixelRatio)
  }

  protected locked: boolean = false
  protected queue: SanitizedEvent[] = []
  protected hitTests: Map<number, HitTestResult> = new Map()
  
  // public router: PointerRouter = PointerRouter.create()
  public arena: GestureArenaManager = new GestureArenaManager()

  flushPointerEventQueue () {
    invariant(!this.locked)
    while (this.queue.length > 0) {
      this.handlePointerEvent(this.queue.shift() as SanitizedEvent)
    }
  }

  // 处理事件
  handlePointerEventImmediately (pointer: unknown) {
    let hitTestResult: HitTestResult | null = null
    this.dispatchEvent(pointer, hitTestResult)
  }

  /**
   * 
   * @param {PointerPacket} packet 
   */
  handlePointerDataPacket (event: PointerEvent) {
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
  handlePointerEvent (pointer: unknown) {
    invariant(!this.locked)
    this.handlePointerEventImmediately(pointer)
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @param {HitTestEntry} entry 
   */
  handleEvent (event: PointerEvent, entry: HitTestEntry) {
   
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @param {HitTestResult | null} hitTestResult 
   * @returns 
   */
  dispatchEvent (event: unknown, hitTestResult: HitTestResult | null) {
  }
}
  