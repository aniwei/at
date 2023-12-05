import { invariant } from '@at/utils'
import { Offset } from '../basic/geometry'
import { AtGestureArenaManager } from './arena'
import { AtPointerEvent, AtPointerEventConverter, AtPointerEventDecomposition } from './events'
import { AtHitTestEntry, AtHitTestResult } from './hit-test'
import { AtPointerPacket } from './pointer'

import { AtViewConfiguration } from '../layout/view'
import { AtPointerRouter } from './pointer'

export class AtDeviceGestureSettings {
  static fromConfirugation (configuration: AtViewConfiguration) {
    // const physicalTouchSlop = configuration.settings.physicalTouchSlop
    // return new AtDeviceGestureSettings(
    //   touchSlop: physicalTouchSlop == null ? null : physicalTouchSlop / window.devicePixelRatio
    // );

    return AtDeviceGestureSettings.create(1.0)
  }

  /**
   * 
   * @param {number} touchSlop 
   * @returns {AtDeviceGestureSettings}
   */
  static create (touchSlop: number) {
    return new AtDeviceGestureSettings(touchSlop)
  }

   public touchSlop: number | null
   public get panSlop () {
    return this.touchSlop !== null ? (this.touchSlop * 2) : null
   }

  constructor (touchSlop: number) {
    this.touchSlop = touchSlop
  }

  /**
   * 
   * @param {AtDeviceGestureSettings | null} other 
   * @returns {boolean}
   */
  equal (other: AtDeviceGestureSettings | null) {
    return (
      other instanceof AtDeviceGestureSettings &&
      other.touchSlop === this.touchSlop
    )
  }
  
  /**
   * 
   * @param {AtDeviceGestureSettings | null} other 
   * @returns {boolean}
   */
  notEqual (other: AtDeviceGestureSettings | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtDeviceGestureSettings(touchSlop: ${this.touchSlop})`
  }
}


export abstract class AtGesture extends AtPointerEventDecomposition {
  private locked: boolean = false
  private pendingPointerEvents: AtPointerEvent[] = []
  private hitTests: Map<number, AtHitTestResult> = new Map()
  
  public router: AtPointerRouter = AtPointerRouter.create()
  public  arena: AtGestureArenaManager = new AtGestureArenaManager()


  constructor (devicePixelRatio: number) {
    super(devicePixelRatio)
  }

  private flushPointerEventQueue () {
    invariant(!this.locked)
    while (this.pendingPointerEvents.length > 0) {
      this.handlePointerEvent(this.pendingPointerEvents.shift() as AtPointerEvent)
    }
  }

  private handlePointerEventImmediately (event: AtPointerEvent) {
    let hitTestResult: AtHitTestResult | null = null

    if (
      event.isDown() || 
      event.isHover() ||
      event.isSignal() 
    ) {
      invariant(!this.hitTests.has(event.pointer), `Cannot exist event.pointer in hitTests`)
      hitTestResult = AtHitTestResult.create()

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
  handlePointerDataPacket (packet: AtPointerPacket) {
    AtPointerEventConverter.expand(packet.data, this.devicePixelRatio).map((event) => {
      this.pendingPointerEvents.push(event)
    })
    
    if (!this.locked) {
      this.flushPointerEventQueue()
    }
  }

  hitTest (result: AtHitTestResult, position: Offset) {
    result.add(new AtHitTestEntry(this))
  }

  /**
   * 
   * @param {AtPointerEvent} event 
   */
  handlePointerEvent (event: AtPointerEvent) {
    invariant(!this.locked)
    this.handlePointerEventImmediately(event)
  }

  /**
   * 
   * @param {AtPointerEvent} event 
   * @param {AtHitTestEntry} entry 
   */
  handleEvent (event: AtPointerEvent, entry: AtHitTestEntry) {
    this.router.route(event)
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
   * @param {AtPointerEvent} event 
   * @param {AtHitTestResult | null} hitTestResult 
   * @returns 
   */
  dispatchEvent (event: AtPointerEvent, hitTestResult: AtHitTestResult | null) {
    invariant(!this.locked)
    
    if (hitTestResult === null) {
      invariant(event.isAdded() || event.isRemoved())
      try {
        this.router.route(event)
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
  