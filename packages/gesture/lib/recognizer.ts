import { invariant } from '@at/utility'
import { AllowedButtonsFilter, At } from '../at'
import { Offset } from '../basic/geometry'
import { Matrix4 } from '../basic/matrix4'
import { PointerEvent } from './events'
import { PointerDeviceKind } from './pointer'
import { GestureArenaEntry, GestureArenaMember, GestureDisposition } from './arena'
import { DeviceGestureSettings } from './gesture'

type RecognizerCallback<T> = () => T


export enum DragStartBehavior {
  Start,
  Down,
}

// 手势识别状态
export enum GestureRecognizerState {
  Ready,
  Possible,
  Defunct,
}

// 手势识别
export abstract class GestureRecognizer extends GestureArenaMember {
  static defaultButtonAcceptBehavior (buttons: number) {
    return true
  }

  public settings: DeviceGestureSettings | null = null

  protected supportedDevices: Set<PointerDeviceKind> | null
  protected pointerToKind: Map<number, PointerDeviceKind> = new Map()
  protected allowedButtonsFilter: AllowedButtonsFilter

  /**
   * AtGestureRecognizer 构造函数
   * @param {PointerDeviceKind | null} kind 
   * @param {Set<PointerDeviceKind> | null} supportedDevices 
   */
  constructor (
    supportedDevices: Set<PointerDeviceKind> | null = null,
    allowedButtonsFilter: AllowedButtonsFilter | null = null
  ) {
    super()

    this.supportedDevices = supportedDevices
    this.allowedButtonsFilter = allowedButtonsFilter ?? AtGestureRecognizer. defaultButtonAcceptBehavior
  }

  /**
   * 
   * @param {PointerEvent} event 
   */
  addPointer (event: PointerEvent) {
    this.pointerToKind.set(event.pointer, event.kind)
    if (this.isPointerAllowed(event)) {
      this.addAllowedPointer(event)
    } else {
      this.handleNonAllowedPointer(event)
    }
  }

  addAllowedPointer (event: PointerEvent) { }
  handleNonAllowedPointer (event: PointerEvent) { }

  /**
   * 
   * @param {number} pointer 
   * @returns 
   */
  getKindForPointer (pointer: number) {
    invariant(this.pointerToKind.has(pointer))
    return this.pointerToKind.get(pointer)
  }

  /**
   * 
   * @param {PointerEvent} event 
   * @returns {boolean}
   */
  isPointerAllowed (event: PointerEvent) {
    return this.supportedDevices === null || this.supportedDevices?.has(event.kind)
  }

  /**
   * 
   * @param {string} name 
   * @param {RecognizerCallback<T>} callback 
   * @returns 
   */
  invokeCallback<T> (
    name: string, 
    callback: RecognizerCallback<T>
  ): T | null {
    invariant(callback !== null)
    let result: T | null = null
    try {
      result = callback()
    } catch (error: any) {
      throw error
    }

    return result
  }


  dispose () { }
}


// 频率一次的手势识别器
export abstract class OneSequenceGestureRecognizer extends GestureRecognizer {
  protected entries: Map<number, GestureArenaEntry> = new Map()
  // 追踪 pointer id
  protected trackedPointers: Set<number> = new Set<number>()

  /**
   * 构造函数
   * @param {PointerDeviceKind | null} kind 
   * @param {Set<PointerDeviceKind> | null} supportedDevices 
   */
  constructor (
    supportedDevices: Set<PointerDeviceKind> | null,
    allowedButtonsFilter: AllowedButtonsFilter | null
  ) {
    super(supportedDevices, allowedButtonsFilter)
  }
  
  /**
   * 事件处理入口
   * @param {PointerEvent} event 
   * @returns {boolean}
   */
  abstract handleEvent (event: PointerEvent): void

  /**
   * 停止追踪
   * @param {number} pointer 
   */
  abstract didStopTrackingLastPointer (pointer: number): void

  /**
   * 允许追踪
   * @param {PointerEvent} event 
   */
  addAllowedPointer (event: PointerEvent) {
    this.startTrackingPointer(event.pointer, event.transform)
  }

  /**
   * 处理没有允许的 pointer
   * @param {PointerEvent} event 
   */
  handleNonAllowedPointer (event: PointerEvent) {
    this.resolve(GestureDisposition.Rejected)
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
  
  resolve (disposition: GestureDisposition): void {
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
  resolvePointer (pointer: number, disposition: GestureDisposition) {
    const entry = this.entries.get(pointer) ?? null
    if (entry !== null) { 
      this.entries.delete(pointer)
      entry.resolve(disposition)
    }
  }

  dispose () {
    this.resolve(GestureDisposition.Rejected)

    for (const pointer of this.trackedPointers) {
      At.getApplication().router.remove(pointer, this.handleEvent)
    }

    this.trackedPointers = new Set()
    super.dispose()
  }

  /**
   * 加入竞技场
   * @param pointer 
   * @returns 
   */
  private addPointerToArena (pointer: number): GestureArenaEntry {
    const entry = At.getApplication().arena.add(pointer, this)
    return entry
  }

  /**
   * 开始追踪
   * @param pointer 
   * @param transform 
   */
  startTrackingPointer (pointer: number, transform: Matrix4 | null = null) {
    At.getApplication().router.use(pointer, this.handleEvent, transform)
    
    this.trackedPointers.add(pointer)
    this.entries.set(pointer, this.addPointerToArena(pointer))
  }

  /**
   * 停止追踪
   * @param {number} pointer 
   */
  stopTrackingPointer (pointer: number) {
    if (this.trackedPointers.has(pointer)) {
      At.getApplication().router.remove(pointer, this.handleEvent)
      this.trackedPointers.delete(pointer)
      if (this.trackedPointers.size === 0) {
        this.didStopTrackingLastPointer(pointer)
      }
    }
  }

  stopTrackingIfPointerNoLongerDown (event: PointerEvent) {
    if (event.isUp() || event.isCancel()) {
      this.stopTrackingPointer(event.pointer)
    }
  }
}

export abstract class AtPrimaryPointerGestureRecognizer extends AtOneSequenceGestureRecognizer {
  

  // => state
  private _state: GestureRecognizerState = GestureRecognizerState.Ready
  public set state (state: GestureRecognizerState) {
    this._state = state
  }
  public get state (): GestureRecognizerState {
    return this._state
  }

  // => primary
  private _primary: number | null = null
  public get primary () {
    return this._primary
  }

  // => initialPosition
  private _initialPosition: AtOffsetPair | null = null
  public set initialPosition (initialPosition: AtOffsetPair | null) {
    this._initialPosition = initialPosition
  } 
  public get initialPosition () {
    return this._initialPosition
  } 

  private gestureAccepted: boolean = false
  private timer: number | null = null

  public deadline: number
  public preAcceptSlopTolerance: number
  public postAcceptSlopTolerance: number

  /**
   * 构造函数
   * @param deadline 
   * @param preAcceptSlopTolerance 
   * @param postAcceptSlopTolerance 
   * @param kind 
   * @param supportedDevices 
   */
  constructor (
    deadline: number,
    preAcceptSlopTolerance: number = At.kTouchSlop as number,
    postAcceptSlopTolerance: number = At.kTouchSlop as number,
    supportedDevices: Set<PointerDeviceKind> | null = null,
    allowedButtonsFilter: AllowedButtonsFilter | null
  ) {
    super(supportedDevices, allowedButtonsFilter)

    this.deadline = deadline
    this.preAcceptSlopTolerance = preAcceptSlopTolerance
    this.postAcceptSlopTolerance = postAcceptSlopTolerance
  }

  abstract handlePrimaryPointer (event: PointerEvent): void

  private stop () {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private getGlobalDistance (event: PointerEvent): number {
    invariant(this.initialPosition)
    const offset = event.position.subtract(this.initialPosition.global)
    return offset.distance
  }

  addAllowedPointer (event: PointerEvent) {
    super.addAllowedPointer(event)
    if (this.state == GestureRecognizerState.Ready) {
      this._state = GestureRecognizerState.Possible
      this._primary = event.pointer
      this._initialPosition = new AtOffsetPair(event.localPosition, event.position)
      
      if (this.deadline !== null) {
        this.timer = setTimeout(() => {
          this.didExceedDeadlineWithEvent(event)
        }, this.deadline)
      }
    }
  }

  
  handleNonAllowedPointer (event: PointerEvent) {
    if (!this.gestureAccepted) {
      super.handleNonAllowedPointer(event)
    }
  }

  handleEvent = (event: PointerEvent) => {
    invariant(this.state !== GestureRecognizerState.Ready)
    if (this.state == GestureRecognizerState.Possible && event.pointer === this.primary) {
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

      if (event.isMove() && (isPreAcceptSlopPastTolerance || isPostAcceptSlopPastTolerance)) {
        this.resolve(GestureDisposition.Rejected)
        this.stopTrackingPointer(this.primary)
      } else {
        this.handlePrimaryPointer(event)
      }
    }
    
    this.stopTrackingIfPointerNoLongerDown(event)
  }

  didExceedDeadline () {
    invariant(this.deadline === null)
  }

  
  didExceedDeadlineWithEvent (event: PointerEvent) {
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
    if (pointer === this.primary && this.state === GestureRecognizerState.Possible) {
      this.stop()
      this.state = GestureRecognizerState.Defunct
    }
  }

  
  didStopTrackingLastPointer (pointer: number) {
    invariant(this.state !== GestureRecognizerState.Ready)
    this.stop()
    this.state = GestureRecognizerState.Ready
    this.initialPosition = null
    this.gestureAccepted = false
  }

  dispose () {
    this.stop()
    super.dispose()
  }
}


export class AtOffsetPair {
  static zero = new AtOffsetPair(Offset.zero, Offset.zero)

  static fromEventPosition (event: PointerEvent) {
    return new AtOffsetPair(event.localPosition, event.position)
  }

  static fromEventDelta (event: PointerEvent) {
    return new AtOffsetPair(event.localDelta, event.delta)
  }

  static create (
    local: Offset,
    global: Offset,
  ) {
    return new AtOffsetPair(local, global)
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

  add (other: AtOffsetPair) {
    return new AtOffsetPair(
      this.local.add(other.local),
      this.global.add(other.global),
    )
  }

  subtract (other: AtOffsetPair) {
    return new AtOffsetPair(
      this.local.subtract(other.local),
      this.global.subtract(other.global),
    )
  }
 
  toString () {
    return `AtOffsetPari(local: ${this.local}, global: ${this.global})`
  }
}
