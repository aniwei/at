import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Subscribable } from '@at/basic'
import { HitTestEntry, HitTestResult } from './hit-test'
// import { Packet, Pointer } from './pointer'
import { GestureArenaManager } from './arena'


//// => Gesture
// 手势
export class Gesture extends Subscribable {
  static create (devicePixelRatio: number) {
    return new Gesture(devicePixelRatio)
  }

  protected locked: boolean = false
  // protected queue: Pointer[] = []
  protected hitTests: Map<number, HitTestResult> = new Map()
  protected devicePixelRatio: number
  
  // public router: PointerRouter = PointerRouter.create()
  public arena: GestureArenaManager = new GestureArenaManager()

  constructor (devicePixelRatio: number) {
    super()

    this.devicePixelRatio = devicePixelRatio
  }

  flushPointerEventQueue () {
    invariant(!this.locked)
    // while (this.queue.length > 0) {
    //   this.handlePointerEvent(this.queue.shift() as Pointer)
    // }
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
  handlePointerDataPacket (packet: unknown) {
    // Pointer.decomposite(packet).map(pointer => {
    //   this.queue.push(pointer)
    // })
    // if (!this.locked) {
    //   this.flushPointerEventQueue()
    // }
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
  