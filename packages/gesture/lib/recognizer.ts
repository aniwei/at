import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Matrix4 } from '@at/math'
import { Equalable } from '@at/basic'
import { Engine } from '@at/engine'
import { 
  PointerChangeKind, 
  PointerDeviceKind, 
  SanitizedPointerEvent 
} from './sanitizer'
import { 
  GestureArenaEntry, 
  GestureArenaMember,  
} from './arena'
import { DeviceGestureSettings } from './device-gesture-settings'
import { Gesture, GestureDispositionKind } from './gesture'


export interface AllowedButtonsHandle {
  (buttons: number): boolean
}

export interface RecognizerHandle<T> {
  (): T
}

// 手势识别状态
export enum GestureRecognizerStateKind {
  // 就绪
  Ready,
  // 可能
  Possible,
  // 废弃
  Defunct,
}

//// => GestureRecognizer
// 手势识别基础类
export interface GestureRecognizerFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class GestureRecognizer extends GestureArenaMember {
  static create (...rests: unknown[]): unknown
  static create (
    devices: Set<PointerDeviceKind> | null = null,
    allowedButtonsHandle: AllowedButtonsHandle | null = null
  ) {
    const GestureRecognizerFactory = this as unknown as GestureRecognizerFactory<GestureRecognizer>
    return new GestureRecognizerFactory(devices, allowedButtonsHandle)
  }

  static defaultButtonAcceptBehavior (buttons: number) {
    return true
  }
  
  public settings: DeviceGestureSettings | null = null

  protected engine: Engine
  protected devices: Set<PointerDeviceKind> | null
  protected pointerToKind: Map<number, PointerDeviceKind> = new Map()
  protected allowedButtonsHandle: AllowedButtonsHandle

  /**
   * AtGestureRecognizer 构造函数
   * @param {PointerDeviceKind | null} kind 
   * @param {Set<PointerDeviceKind> | null} devices 
   */
  constructor (
    engine: Engine,
    devices: Set<PointerDeviceKind> | null = null,
    allowedButtonsHandle: AllowedButtonsHandle | null = null
  ) {
    super()

    this.engine = engine
    this.devices = devices
    this.allowedButtonsHandle = allowedButtonsHandle ?? GestureRecognizer.defaultButtonAcceptBehavior
  }

  /**
   * 
   * @param {SanitizedPointerEvent} event 
   */
  addPointer (event: SanitizedPointerEvent) {
    this.pointerToKind.set(event.id, event.kind)

    this.isPointerAllowed(event)
      ? this.addAllowedPointer(event)
      : this.handleNonAllowedPointer(event)
  }

  addAllowedPointer (event: SanitizedPointerEvent) { }
  handleNonAllowedPointer (event: SanitizedPointerEvent) { }

  /**
   * 
   * @param {number} pointer 
   * @returns 
   */
  getKindForPointer (id: number) {
    invariant(this.pointerToKind.has(id), `The pointer is not exist which "id" is ${id}.`)
    return this.pointerToKind.get(id)
  }

  /**
   * 
   * @param {SanitizedPointerEvent} event 
   * @returns {boolean}
   */
  isPointerAllowed (event: SanitizedPointerEvent) {
    return this.devices === null || this.devices.has(event.kind)
  }

  dispose () { }
}

//// => OneSequenceGestureRecognizer
// 频率一次的手势识别器
export abstract class OneSequenceGestureRecognizer extends GestureRecognizer {
  protected entries: Map<number, GestureArenaEntry> = new Map()
  // 追踪 pointer id
  protected trackedPointers: Set<number> = new Set<number>()

  /**
   * 构造函数
   * @param {PointerDeviceKind | null} kind 
   * @param {Set<PointerDeviceKind> | null} devices 
   */
  constructor (
    engine: Engine,
    devices: Set<PointerDeviceKind> | null,
    allowedButtonsFilter: AllowedButtonsHandle | null
  ) {
    super(engine, devices, allowedButtonsFilter)
  }
  
  /**
   * 事件处理入口
   * @param {SanitizedPointerEvent} event 
   * @returns {boolean}
   */
  abstract handleEvent (event: SanitizedPointerEvent): void

  /**
   * 停止追踪
   * @param {number} pointer 
   */
  abstract didStopTrackingLastPointer (pointer: number): void

  /**
   * 追踪
   * @param {SanitizedPointerEvent} event 
   */
  addAllowedPointer (event: SanitizedPointerEvent) {
    this.startTrackingPointer(event.id, event.transform)
  }

  /**
   * 处理没有允许的 pointer
   * @param {SanitizedPointerEvent} event 
   */
  handleNonAllowedPointer (event: SanitizedPointerEvent) {
    this.resolve(GestureDispositionKind.Rejected)
  }

  /**
   * 接受
   * @param {number} pointer 
   */
  accept (pointer: number): void { }
  
  /**
   * 拒绝
   * @param {number} pointer 
   */
  reject (pointer: number): void  { }
  
  resolve (disposition: GestureDispositionKind): void {
    const localEntries: GestureArenaEntry[] = Array.from(this.entries.values())

    for (const entry of localEntries) {
      entry.resolve(disposition)
    }
    
    this.entries = new Map()
  }

  /**
   * 
   * @param pointer 
   * @param disposition 
   */
  resolvePointer (pointer: number, disposition: GestureDispositionKind) {
    const entry = this.entries.get(pointer) ?? null
    if (entry !== null) { 
      this.entries.delete(pointer)
      entry.resolve(disposition)
    }
  }

  /**
   * 加入竞技场
   * @param pointer 
   * @returns 
   */
  addPointerToArena (id: number): GestureArenaEntry {
    const entry = (this.engine.gesture as Gesture).arena.add(id, this)
    return entry
  }

  /**
   * 开始追踪
   * @param pointer 
   * @param transform 
   */
  startTrackingPointer (id: number, transform: Matrix4 | null = null) {
    (this.engine.gesture as Gesture).dispatcher.use(id, this.handleEvent.bind(this), transform)
    
    this.trackedPointers.add(id)
    this.entries.set(id, this.addPointerToArena(id))
  }

  /**
   * 停止追踪
   * @param {number} pointer 
   */
  stopTrackingPointer (pointer: number) {
    if (this.trackedPointers.has(pointer)) {
      (this.engine.gesture as Gesture).dispatcher.delete(pointer, this.handleEvent)
      
      this.trackedPointers.delete(pointer)
      if (this.trackedPointers.size === 0) {
        this.didStopTrackingLastPointer(pointer)
      }
    }
  }

  stopTrackingIfNoLongerDown (event: SanitizedPointerEvent) {
    if (
      event.change === PointerChangeKind.Up || 
      event.change === PointerChangeKind.Cancel
    ) {
      this.stopTrackingPointer(event.id)
    }
  }

  dispose () {
    this.resolve(GestureDispositionKind.Rejected)

    for (const pointer of this.trackedPointers) {
      (this.engine.gesture as Gesture).dispatcher.delete(pointer, this.handleEvent)
    }

    this.trackedPointers = new Set()
    super.dispose()
  }

}

export abstract class PrimaryPointerGestureRecognizer extends OneSequenceGestureRecognizer {
  // => state
  protected _state: GestureRecognizerStateKind = GestureRecognizerStateKind.Ready
  public get state (): GestureRecognizerStateKind {
    return this._state
  }
  public set state (state: GestureRecognizerStateKind) {
    if (this._state !== state) {
      this._state = state
    }
  }
 
  // => primary
  protected _primary: number | null = null
  public get primary () {
    return this._primary
  }
  public set primary (primary: number | null) {
    if (this._primary !== primary) {
      this._primary = primary
    }
  }

  // => position
  protected _position: OffsetPair | null = null
  public set position (position: OffsetPair | null) {
    if (this._position === null || this._position.notEqual(position)) {
      this._position = position
    }
  } 
  public get position () {
    return this._position
  } 

  protected gestureAccepted: boolean = false
  protected timerId: number | null = null

  public deadline: number
  // 容错
  public preAcceptSlopTolerance: number
  public postAcceptSlopTolerance: number

  /**
   * 构造函数
   * @param {number} deadline 
   * @param {number} preAcceptSlopTolerance 
   * @param {number} postAcceptSlopTolerance 
   * @param {PointerDeviceKind} kind 
   * @param {Set<PointerDeviceKind> | null} devices 
   */
  constructor (
    engine: Engine,
    deadline: number,
    preAcceptSlopTolerance: number = Gesture.env<number>('ATKIT_GESTURE_TOUCH_SLOP', 18),
    postAcceptSlopTolerance: number = Gesture.env<number>('ATKIT_GESTURE_TOUCH_SLOP', 18),
    devices: Set<PointerDeviceKind> | null = null,
    allowedButtonsHandle: AllowedButtonsHandle | null = null
  ) {
    super(engine, devices, allowedButtonsHandle)

    this.deadline = deadline
    this.preAcceptSlopTolerance = preAcceptSlopTolerance
    this.postAcceptSlopTolerance = postAcceptSlopTolerance
  }

  abstract handlePrimaryPointer (event: SanitizedPointerEvent): void

  stop () {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  getGlobalDistance (event: SanitizedPointerEvent): number {
    invariant(this.position, 'The "PrimaryPointerGestureRecognizer.position" cannot be null.')
    const offset = event.position.subtract(this.position.global)
    return offset.distance
  }

  addAllowedPointer (event: SanitizedPointerEvent) {
    super.addAllowedPointer(event)

    if (this.state === GestureRecognizerStateKind.Ready) {
      this.state = GestureRecognizerStateKind.Possible
      this.primary = event.id
      this.position = new OffsetPair(event.localPosition, event.position)
      
      if (this.deadline !== null) {
        this.timerId = setTimeout(() => {
          this.didExceedDeadlineWithEvent(event)
        }, this.deadline) as unknown as number
      }
    }
  }

  handleNonAllowedPointer (event: SanitizedPointerEvent) {
    if (!this.gestureAccepted) {
      super.handleNonAllowedPointer(event)
    }
  }

  handleEvent (event: SanitizedPointerEvent) {
    invariant(this.state !== GestureRecognizerStateKind.Ready, 'The "PrimaryPointerGestureRecognizer.state" cannot be ready.')

    if (
      this.state == GestureRecognizerStateKind.Possible && 
      event.id === this.primary
    ) {
      const isPreAcceptSlopPastTolerance = (
        !this.gestureAccepted &&
        this.preAcceptSlopTolerance !== null &&
        this.getGlobalDistance(event) > this.preAcceptSlopTolerance
      )

      const isPostAcceptSlopPastTolerance = (
        this.gestureAccepted && 
        this.postAcceptSlopTolerance !== null &&
        this.getGlobalDistance(event) > this.postAcceptSlopTolerance
      )

      if (
        event.change === PointerChangeKind.Move && 
        (
          isPreAcceptSlopPastTolerance || 
          isPostAcceptSlopPastTolerance
        )
      ) {
        this.resolve(GestureDispositionKind.Rejected)
        this.stopTrackingPointer(this.primary)
      } else {
        this.handlePrimaryPointer(event)
      }
    }
    
    this.stopTrackingIfNoLongerDown(event)
  }

  didExceedDeadline () {
    invariant(this.deadline === null)
  }
  
  didExceedDeadlineWithEvent (event: SanitizedPointerEvent) {
    this.didExceedDeadline()
  }

  /**
   * 
   * @param {number} pointer 
   */
  accept (pointer: number) {
    if (pointer === this.primary) {
      this.stop()
      this.gestureAccepted = true
    }
  }

  /**
   * 
   * @param {number} pointer 
   */
  reject (pointer: number) {
    if (pointer === this.primary && this.state === GestureRecognizerStateKind.Possible) {
      this.stop()
      this.state = GestureRecognizerStateKind.Defunct
    }
  }

  
  didStopTrackingLastPointer (pointer: number) {
    invariant(this.state !== GestureRecognizerStateKind.Ready)
    this.stop()

    this.state = GestureRecognizerStateKind.Ready
    this.position = null
    this.gestureAccepted = false
  }

  dispose () {
    this.stop()
    super.dispose()
  }
}


//// => OffsetPair
export class OffsetPair implements Equalable<OffsetPair> {
  static ZERO = new OffsetPair(Offset.ZERO, Offset.ZERO)

  static fromEventPosition (event: SanitizedPointerEvent) {
    return new OffsetPair(event.localPosition, event.position)
  }

  static fromEventDelta (event: SanitizedPointerEvent) {
    return new OffsetPair(event.localDelta, event.delta)
  }

  static create (
    local: Offset,
    global: Offset,
  ) {
    return new OffsetPair(local, global)
  }

  public local:  Offset
  public global:  Offset

  constructor (
    local: Offset,
    global: Offset,
   ) {
    this.local = local
    this.global = global
  }

  add (other: OffsetPair) {
    return new OffsetPair(
      this.local.add(other.local),
      this.global.add(other.global),
    )
  }

  subtract (other: OffsetPair) {
    return new OffsetPair(
      this.local.subtract(other.local),
      this.global.subtract(other.global),
    )
  }

  equal (object: OffsetPair | null): boolean {
    return (
      object instanceof OffsetPair &&
      this.local.equal(object.local) &&
      this.global.equal(object.global) 
    )
  }

  notEqual (object: OffsetPair | null): boolean {
    return !this.equal(object)
  }
 
  toString () {
    return `OffsetPair(
      [local]: ${this.local}, 
      [global]: ${this.global}
    )`
  }
}
