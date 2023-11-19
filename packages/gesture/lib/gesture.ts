import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { GestureArenaManager } from './arena'
import { PointerEvent, PointerEventConverter, PointerEventDecomposition } from './events'
import { HitTestEntry, HitTestResult } from './hit-test'
import { PointerPacket } from './pointer'

// import { ViewConfiguration } from '@at/layout'
// import { PointerRouter } from './pointer'
import { Equalable } from '@at/basic'

export class DeviceGestureSettings extends Equalable<DeviceGestureSettings> {
  static fromConfirugation (configuration: AtViewConfiguration) {
    // const physicalTouchSlop = configuration.settings.physicalTouchSlop
    // return new DeviceGestureSettings(
    //   touchSlop: physicalTouchSlop == null ? null : physicalTouchSlop / window.devicePixelRatio
    // );

    return DeviceGestureSettings.create(1.0)
  }

  /**
   * 
   * @param {number} slop 
   * @returns {DeviceGestureSettings}
   */
  static create (slop: number) {
    return new DeviceGestureSettings(slop)
  }

  // => slop
  public slop: number | null
  public get panSlop () {
    return this.slop !== null ? (this.slop * 2) : null
  }

  constructor (slop: number) {
    this.slop = slop
  }

  /**
   * 
   * @param {DeviceGestureSettings | null} other 
   * @returns {boolean}
   */
  equal (other: DeviceGestureSettings | null) {
    return (
      other instanceof DeviceGestureSettings &&
      other.slop === this.slop
    )
  }
  
  /**
   * 
   * @param {DeviceGestureSettings | null} other 
   * @returns {boolean}
   */
  notEqual (other: DeviceGestureSettings | null) {
    return !this.equal(other)
  }

  toString () {
    return `DeviceGestureSettings(slop: ${this.slop})`
  }
}


export class Gesture extends PointerEventDecomposition {
  static create () {}

  protected locked: boolean = false
  protected pendingPointerEvents: PointerEvent[] = []
  protected hitTests: Map<number, HitTestResult> = new Map()
  
  // public router: PointerRouter = PointerRouter.create()
  public arena: GestureArenaManager = new GestureArenaManager()

  constructor (devicePixelRatio: number) {
    super(devicePixelRatio)
  }

  private flushPointerEventQueue () {
    invariant(!this.locked)
    while (this.pendingPointerEvents.length > 0) {
      this.handlePointerEvent(this.pendingPointerEvents.shift() as PointerEvent)
    }
  }

  // 处理事件
  private handlePointerEventImmediately (event: PointerEvent) {
    let hitTestResult: HitTestResult | null = null

    if (
      event.isDown() || 
      event.isHover() ||
      event.isSignal() 
    ) {
      invariant(!this.hitTests.has(event.pointer), `Cannot exist event.pointer in hitTests`)
      hitTestResult = HitTestResult.create()

      this.hitTest(hitTestResult, event.position)

      if (event.isDown()) { 
        this.hitTests.set(event.pointer, hitTestResult)
      }

    } else if (
      event.isUp() || 
      event.isCancel()
    ) {
      hitTestResult = this.hitTests.get(event.pointer) ?? null
      this.hitTests.delete(event.pointer)
    } else if (event.down) {
      hitTestResult = this.hitTests.get(event.pointer) ?? null
    }

    if (
      hitTestResult !== null ||
      event.isAdded() ||
      event.isRemoved()
    ) {
      invariant(event.position !== null)
      this.dispatchEvent(event, hitTestResult)
    }
  }

  /**
   * 
   * @param {AtPointerPacket} packet 
   */
  handlePointerDataPacket (packet: PointerPacket) {
    PointerEventConverter.expand(packet.data, this.devicePixelRatio).map((event) => {
      this.pendingPointerEvents.push(event)
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
   * @param {PointerEvent} event 
   */
  handlePointerEvent (event: PointerEvent) {
    invariant(!this.locked)
    this.handlePointerEventImmediately(event)
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @param {HitTestEntry} entry 
   */
  handleEvent (event: PointerEvent, entry: HitTestEntry) {
    // this.router.route(event)
    if (event.isDown()) {
      this.arena.close(event.pointer)
    } else if (event.isUp()) {
      this.arena.sweep(event.pointer)
    } else if (event.isSignal()) {
      // pointerSignalResolver.resolve(event)
    }
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @param {HitTestResult | null} hitTestResult 
   * @returns 
   */
  dispatchEvent (event: PointerEvent, hitTestResult: HitTestResult | null) {
    invariant(!this.locked)
    
    if (hitTestResult === null) {
      invariant(event.isAdded() || event.isRemoved())
      try {
        // this.router.route(event)
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
      }
      return
    }

    for (const entry of hitTestResult.path) {
      try {
        entry.target.handleEvent(event.transformed(entry.transform), entry)
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
      }
    }
  }
}
  