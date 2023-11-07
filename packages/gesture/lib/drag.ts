import invariant from '@at/utility'
import { At, Timer } from '../at'
import { Matrix4 } from '../basic/matrix4'
import { Offset } from '../basic/geometry'
import { AtGestureArenaEntry, GestureDisposition } from './arena'
import { AtPointerEvent, computeHitSlop, computePanSlop } from './events'
import { PointerDeviceKind } from './pointer'
import { AtGestureRecognizer, AtOffsetPair, OneSequenceGestureRecognizer, DragStartBehavior } from './recognizer'
import { AtVelocity, AtVelocityEstimate, AtVelocityTracker } from './velocity-tracker'
import { AtDeviceGestureSettings } from './gesture'

// 拖拽状态枚举
export enum DragStateKind {
  Ready,
  Possible,
  Accepted,
}

export type DragDetails = {
  globalPosition?: Offset | null,
  localPosition?: Offset | null,
  sourceTimeStamp?: number | null,
  kind?: PointerDeviceKind | null,
  delta?: Offset | null,
  primaryDelta?: number | null,
  velocity?: AtVelocity | null,
  primaryVelocity?: number | null
}

export type GestureMultiDragCallback = (position: Offset) => AtDrag | null
export type GestureDragCallback = (details?: unknown) => void
export type GestureVelocityTrackerBuilder = (event: AtPointerEvent) => AtVelocityTracker
export type AllowedButtonsFilter = (buttons: number) => boolean

// 拖拽类
export abstract class Drag {
  update (details: DragDetails) { }
  end (details: DragDetails) { }
  cancel () { }
}

// 拖拽手势识别
export abstract class DragGestureRecognizer extends OneSequenceGestureRecognizer {

  static defaultBuilder (event: AtPointerEvent): AtVelocityTracker {
    return AtVelocityTracker.withKind(event.kind)
  }

  static defaultButtonAcceptBehavior (buttons: number) {
    return buttons === At.kPrimaryButton
  }

  public dragStartBehavior: DragStartBehavior
  public minFlingDistance: number | null = null
  public minFlingVelocity: number | null = null
  public maxFlingVelocity: number | null = null
  public onDown: GestureDragCallback | null = null
  public onStart: GestureDragCallback | null = null
  public onUpdate: GestureDragCallback | null = null
  public onEnd: GestureDragCallback | null = null
  public onCancel: GestureDragCallback | null = null
  
  public velocityTrackerBuilder: GestureVelocityTrackerBuilder 

  private state: DragState = DragState.Ready
  private initialPosition: AtOffsetPair | null = null
  private pendingDragOffset: AtOffsetPair | null = null
  private lastPendingEventTimestamp: number | null = null
  private velocityTrackers: Map<number, AtVelocityTracker> = new Map()
  
  protected initialButtons: number | null = null
  protected lastTransform: Matrix4 | null = null
  protected globalDistanceMoved: number | null = null

  constructor (
    dragStartBehavior: DragStartBehavior = DragStartBehavior.Start,
    velocityTrackerBuilder = AtDragGestureRecognizer.defaultBuilder,
    supportedDevices: Set<PointerDeviceKind> | null = null,
    allowedButtonsFilter: AllowedButtonsFilter | null
  ) {
    super(supportedDevices, allowedButtonsFilter ?? AtDragGestureRecognizer.defaultButtonAcceptBehavior)
  
    this.dragStartBehavior = dragStartBehavior
    this.velocityTrackerBuilder = velocityTrackerBuilder
   } 

 
  abstract isFlingGesture (estimate: AtVelocityEstimate, kind: PointerDeviceKind): boolean
  abstract getDeltaForDetails (delta: Offset): Offset
  abstract getPrimaryValueFromOffset (value: Offset ): number | null
  abstract hasSufficientGlobalDistanceToAccept(pointerDeviceKind: PointerDeviceKind, deviceTouchSlop: number | null): boolean

  isPointerAllowed (event: AtPointerEvent) {
    if (this.initialButtons === null) {
      switch (event.buttons) {
        case At.kPrimaryButton:
          if (
            this.onDown === null &&
            this.onStart === null &&
            this.onUpdate === null &&
            this.onEnd === null &&
            this.onCancel === null
          ) {
            return false
          }
          break;
        default:
          return false;
      }
    } else {
      // There can be multiple drags simultaneously. Their effects are combined.
      if (event.buttons !== this.initialButtons) {
        return false;
      }
    }
    return super.isPointerAllowed(event as AtPointerEvent);
  }

  addAllowedPointer (event: AtPointerEvent) {
    super.addAllowedPointer(event)
    this.velocityTrackers.set(event.pointer, this.velocityTrackerBuilder(event))

    if (this.state === DragState.Ready) {
      this.state = DragState.Possible
      this.initialPosition = AtOffsetPair.create(event.position, event.localPosition)
      this.initialButtons = event.buttons
      this.pendingDragOffset = AtOffsetPair.zero
      this.globalDistanceMoved = 0.0
      this.lastPendingEventTimestamp = event.timeStamp
      this.lastTransform = event.transform
      this.checkDown()
    } else if (this.state === DragState.Accepted) {
      this.resolve(GestureDisposition.Accepted);
    }
  }

  handleEvent = (event: AtPointerEvent) => {
    invariant(this.state !== DragState.Ready)
    if (
      !event.synthesized && 
      (event.isDown() || event.isMove())
    ) {
      const tracker = this.velocityTrackers.get(event.pointer) ?? null
      invariant(tracker !== null)
      tracker.addPosition(event.timeStamp, event.localPosition)
    }

    if (event.isMove()) {
      if (event.buttons !== this.initialButtons) {
        this.giveUpPointer(event.pointer)
        return
      }
      if (this.state === DragState.Accepted) {
        this.checkUpdate(
          event.timeStamp,
          this.getDeltaForDetails(event.localDelta),
          this.getPrimaryValueFromOffset(event.localDelta),
          event.position,
          event.localPosition,
        )
      } else {
        invariant(this.pendingDragOffset)
        this.pendingDragOffset = this.pendingDragOffset?.add(AtOffsetPair.create(event.localDelta, event.delta))
        this.lastPendingEventTimestamp = event.timeStamp
        this.lastTransform = event.transform
        const movedLocally = this.getDeltaForDetails(event.localDelta)
        const localToGlobalTransform = event.transform === null 
          ? null 
          : Matrix4.tryInvert(event.transform)

        invariant(this.globalDistanceMoved !== null)

        const value = this.getPrimaryValueFromOffset(movedLocally) ?? 1
        const sign = value === 0 
          ? 0 
          : value > 0 ? 1 : -1

        this.globalDistanceMoved += AtPointerEvent.transformDeltaViaPositions(
          event.localPosition,
          null,
          movedLocally,
          localToGlobalTransform,
        ).distance * sign
        // invariant(this.settings)
        if (this.hasSufficientGlobalDistanceToAccept(event.kind, this.settings?.touchSlop ?? null)) {

          this.resolve(GestureDisposition.Accepted)
        }
      }
    }

    if (event.isUp() || event.isCancel()) {
      this.giveUpPointer(event.pointer)
    }
  }

  public acceptedActivePointers: Set<number> = new Set()

  accept (pointer: number) {
    invariant(!this.acceptedActivePointers.has(pointer))
    this.acceptedActivePointers.add(pointer)

    if (this.state !== DragState.Accepted) {
      this.state = DragState.Accepted;
      const delta = this.pendingDragOffset
      const timestamp = this.lastPendingEventTimestamp
      const transform = this.lastTransform
      let localUpdateDelta: Offset      
      
      switch (this.dragStartBehavior) {
        case DragStartBehavior.Start:
          invariant(this.initialPosition)
          invariant(delta)
          this.initialPosition = this.initialPosition.add(delta)
          localUpdateDelta = Offset.zero
          break
        case DragStartBehavior.Down:
          invariant(delta)
          localUpdateDelta = this.getDeltaForDetails(delta.local)
          break
      }
      this.pendingDragOffset = AtOffsetPair.zero
      this.lastPendingEventTimestamp = null
      this.lastTransform = null

      invariant(timestamp)
      this.checkStart(timestamp, pointer)
      
      if (localUpdateDelta.notEqual(Offset.zero) && this.onUpdate !== null) {
        const localToGlobal = transform !== null 
          ? Matrix4.tryInvert(transform) 
          : null

        invariant(this.initialPosition)
        const correctedLocalPosition = this.initialPosition.local.add(localUpdateDelta)
        const globalUpdateDelta = AtPointerEvent.transformDeltaViaPositions(
          correctedLocalPosition,
          null,
          localUpdateDelta,
          localToGlobal,
        )
        const updateDelta = AtOffsetPair.create(localUpdateDelta, globalUpdateDelta)
        const correctedPosition = this.initialPosition.add(updateDelta)
        this.checkUpdate(
          timestamp,
          localUpdateDelta,
          this.getPrimaryValueFromOffset(localUpdateDelta),
          correctedPosition.global,
          correctedPosition.local,
        )
      }
      this.resolve(GestureDisposition.Accepted)
    }
  }

  reject (pointer: number) {
    this.giveUpPointer(pointer)
  }

  didStopTrackingLastPointer (pointer: number) {
    switch(this.state) {
      case DragState.Ready:
        break

      case DragState.Possible:
        this.resolve(GestureDisposition.Rejected)
        this.checkCancel()
        break

      case DragState.Accepted:
        this.checkEnd(pointer)
        break
    }
    this.velocityTrackers.clear()
    this.initialButtons = null
    this.state = DragState.Ready
  }

  private giveUpPointer (pointer: number) {
    this.stopTrackingPointer(pointer)
   
    if (!this.acceptedActivePointers.delete(pointer)) {
      this.resolvePointer(pointer, GestureDisposition.Rejected)
    }
  }

  private checkDown () {
    invariant(this.initialButtons === At.kPrimaryButton)
    if (this.onDown !== null) {
      invariant(this.initialPosition)
      const details = {
        globalPosition: this.initialPosition.global,
        localPosition: this.initialPosition.local,
      }
      this.invokeCallback<void>('onDown', () => {
        invariant(this.onDown)
        this.onDown(details)
      })
    }
  }

  private checkStart (timestamp: number, pointer: number) {
    invariant(this.initialButtons === At.kPrimaryButton)
    if (this.onStart !== null) {
      invariant(this.initialPosition)
      const details = {
        sourceTimeStamp: timestamp,
        globalPosition: this.initialPosition.global,
        localPosition: this.initialPosition.local,
        kind: this.getKindForPointer(pointer),
      }
      this.invokeCallback<void>('onStart', () => {
        invariant(this.onStart)
        this.onStart(details)
      })
    }
  }

  private checkUpdate (
    sourceTimeStamp: number | null = null,
    delta: Offset,
    primaryDelta: number | null = null,
    globalPosition: Offset ,
    localPosition: Offset | null = null,
  ) {
    invariant(this.initialButtons === At.kPrimaryButton)
    if (this.onUpdate !== null) {
      const details = {
        sourceTimeStamp,
        delta,
        primaryDelta,
        globalPosition,
        localPosition
      }
      this.invokeCallback<void>('onUpdate', () => {
        invariant(this.onUpdate)
        this.onUpdate(details)
      })
    }
  }

  private checkEnd (pointer: number) {
    invariant(this.initialButtons === At.kPrimaryButton)
    if (this.onEnd === null) {
      return
    }

    const tracker = this.velocityTrackers.get(pointer) ?? null
    invariant(tracker !== null)

    let details: DragDetails
    const estimate = tracker.getVelocityEstimate()
    if (estimate !== null && this.isFlingGesture(estimate, tracker.kind)) {
      const velocity = AtVelocity.create(estimate.pixelsPerSecond)
      velocity.clampMagnitude(this.minFlingVelocity ?? At.kMinFlingVelocity, this.maxFlingVelocity ?? At.kMaxFlingVelocity);
      details = {
        velocity,
        primaryVelocity: this.getPrimaryValueFromOffset(velocity.pixelsPerSecond),
      }
    } else {
      details = {
        primaryVelocity: 0.0,
      }
    }
    this.invokeCallback<void>('onEnd', () => {
      invariant(this.onEnd)
      this.onEnd(details)
    })
  }

  private checkCancel () {
    invariant(this.initialButtons === At.kPrimaryButton)
    if (this.onCancel !== null) {
      this.invokeCallback<void>('onCancel', () => {
        invariant(this.onCancel)
        this.onCancel()
      })
    }
  }

  dispose () {
    this.velocityTrackers.clear()
    super.dispose()
  }
}

export class AtPanGestureRecognizer extends AtDragGestureRecognizer {
  static create (supportedDevices?: Set<PointerDeviceKind>) {
    return new AtPanGestureRecognizer(supportedDevices)
  }
  
  constructor (
    supportedDevices: Set<PointerDeviceKind> | null = null,
    allowedButtonsFilter: AllowedButtonsFilter | null = null
  ) {
    super(
      DragStartBehavior.Start,
      AtDragGestureRecognizer.defaultBuilder,
      supportedDevices, 
      allowedButtonsFilter
    )
  }

  /**
   * 
   * @param {AtVelocityEstimate} estimate 
   * @param {PointerDeviceKind} kind 
   * @returns {boolean}
   */
  isFlingGesture (estimate: AtVelocityEstimate, kind: PointerDeviceKind): boolean {
    const minVelocity = this.minFlingVelocity ?? At.kMinFlingVelocity
    const minDistance = this.minFlingDistance ?? computeHitSlop(kind, this.settings)
    return (
      estimate.pixelsPerSecond.distanceSquared > minVelocity * minVelocity && 
      estimate.offset.distanceSquared > minDistance * minDistance
    )
  }

  hasSufficientGlobalDistanceToAccept (pointerDeviceKind: PointerDeviceKind, deviceTouchSlop: number | null = null): boolean {
    invariant(this.globalDistanceMoved !== null)
    return Math.abs(this.globalDistanceMoved) > computePanSlop(pointerDeviceKind, this.settings)
  }

  getDeltaForDetails (delta: Offset): Offset {
    return delta
  }

  getPrimaryValueFromOffset (value: Offset): number | null {
    return null
  }

}

export abstract class AtMultiDragPointerState {
  public settings: AtDeviceGestureSettings | null
  public initialPosition: Offset
  public velocityTracker: AtVelocityTracker
  public kind: PointerDeviceKind 

  public client: AtDrag | null = null
  public delta: Offset | null = Offset.zero 
  public lastPendingEventTimestamp: number | null = null
  public arenaEntry: AtGestureArenaEntry | null = null
  
  constructor (
    initialPosition: Offset, 
    kind: PointerDeviceKind, 
    settings: AtDeviceGestureSettings | null
  ) {
    this.kind = kind
    this.initialPosition = initialPosition
    this.settings = settings
    this.velocityTracker = AtVelocityTracker.withKind(kind)
  }

  setArenaEntry (entry: AtGestureArenaEntry) {
    invariant(this.arenaEntry === null)
    invariant(this.delta !== null)
    invariant(this.client === null)
    
    this.arenaEntry = entry
  }

  
  resolve (disposition: GestureDisposition) {
    invariant(this.arenaEntry !== null)
    this.arenaEntry.resolve(disposition)
  }

  move (event: AtPointerEvent) {
    invariant(this.arenaEntry !== null);
    if (!event.synthesized) {
      this.velocityTracker.addPosition(event.timeStamp, event.position)
    }
    if (this.client !== null) {
      invariant(this.delta === null)
      // Call client last to avoid reentrancy.
      this.client.update({
        sourceTimeStamp: event.timeStamp,
        delta: event.delta,
        globalPosition: event.position,
      })
    } else {
      invariant(this.delta !== null);
      this.delta = this.delta.add(event.delta)
      this.lastPendingEventTimestamp = event.timeStamp
      this.checkForResolutionAfterMove()
    }
  }

  checkForResolutionAfterMove () {}

  abstract accepted (starter: GestureMultiDragCallback): void


  rejected () {
    invariant(this.arenaEntry !== null)
    invariant(this.client === null)
    invariant(this.delta !== null)
    this.delta = null
    this.lastPendingEventTimestamp = null
    this.arenaEntry = null
  }

  start (client: AtDrag) {
    invariant(this.arenaEntry !== null)
    invariant(this.client === null)
    invariant(this.delta !== null)
    this.client = client
    const details = {
      sourceTimeStamp: this.lastPendingEventTimestamp,
      delta: this.delta,
      globalPosition: this.initialPosition,
    }
    this.delta = null
    this.lastPendingEventTimestamp = null
    
    this.client.update(details)
  }

  up () {
    invariant(this.arenaEntry !== null)
    if (this.client !== null) {
      invariant(this.delta === null)
      const details = { 
        velocity: this.velocityTracker.getVelocity()
      }
      const client = this.client
      this.client = null
      
      client.end(details)
    } else {
      invariant(this.delta !== null)
      this.delta = null
      this.lastPendingEventTimestamp = null
    }
  }

  cancel () {
    invariant(this.arenaEntry !== null)
    if (this.client !== null) {
      invariant(this.delta === null)
      const client = this.client
      this.client = null
      
      client.cancel()
    } else {
      invariant(this.delta !== null)
      this.delta = null
      this.lastPendingEventTimestamp = null
    }
  }

  
  dispose () {
    this.arenaEntry?.resolve(GestureDisposition.Rejected)
    this.arenaEntry = null
  }
}

export abstract class AtMultiDragGestureRecognizer extends AtGestureRecognizer {
  static defaultButtonAcceptBehavior (buttons: number) {
    return buttons === At.kPrimaryButton
  }

  public onStart: GestureMultiDragCallback | null = null
  public pointers: Map<number, AtMultiDragPointerState>  | null = new Map()

  constructor (
    supportedDevices: Set<PointerDeviceKind> | null = null,
    allowedButtonsFilter: AllowedButtonsFilter | null = null,
  ) {
    super(
      supportedDevices, 
      allowedButtonsFilter ?? AtMultiDragGestureRecognizer.defaultButtonAcceptBehavior
    )
  }
  
  addAllowedPointer (event: AtPointerEvent) {
    invariant(this.pointers !== null)
    invariant(!this.pointers.has(event.pointer))

    const state = this.createNewPointerState(event)
    this.pointers.set(event.pointer, state)

    At.getApplication().router.use(event.pointer, this.handleEvent, null)
    state.setArenaEntry(At.getApplication().arena.add(event.pointer, this))
  }

  
  abstract createNewPointerState (event: AtPointerEvent): AtMultiDragPointerState

  handleEvent = (event: AtPointerEvent) => {
    invariant(this.pointers !== null)
    invariant(this.pointers.has(event.pointer))
    const state = this.pointers.get(event.pointer) ?? null
    invariant(state !== null)
    if (event.isMove()) {
      state.move(event)
      
    } else if (event.isUp()) {
      invariant(event.delta === Offset.zero);
      state.up()
      
      this.remove(event.pointer)
    } else if (event.isCancel()) {
      invariant(event.delta.equal(Offset.zero))
      state.cancel()
      
      this.remove(event.pointer)
    } else if (!event.isDown()) {
      invariant(false)
    }
  }

  
  accept (pointer: number) {
    invariant(this.pointers !== null)
    const state = this.pointers.get(pointer) ?? null
    if (state === null) {
      return
    }
    state.accepted((initialPosition: Offset) => {
      return this.start(initialPosition, pointer)
    })
  }

  start (initialPosition: Offset, pointer: number) {
    invariant(this.pointers !== null)
    const state = this.pointers.get(pointer) ?? null
    invariant(state)
    invariant(state.delta !== null)
    let drag: AtDrag | null = null
    
    if (this.onStart !== null) {
      drag = this.invokeCallback<AtDrag | null>('onStart', () => {
        invariant(this.onStart)
        return this.onStart(initialPosition)
      })
    }

    if (drag !== null) {
      state.start(drag)
    } else {
      this.remove(pointer)
    }
    return drag
  }

  
  reject (pointer: number) {
    invariant(this.pointers !== null)
    if (this.pointers.has(pointer)) {
      const state = this.pointers.get(pointer) ?? null
      invariant(state !== null)
      state.rejected()
      this.remove(pointer)
    } 
  }

  remove (pointer: number) {
    if (this.pointers === null) {
      return
    }
    invariant(this.pointers.has(pointer))
    At.getApplication().router.remove(pointer, this.handleEvent)

    this.pointers.get(pointer)?.dispose()
    this.pointers.delete(pointer)
  }

  dispose () {
    invariant(this.pointers !== null)
    Array.from(this.pointers.keys()).forEach(this.remove)
    this.pointers = null
    super.dispose()
  }
}

export class AtImmediatePointerState extends AtMultiDragPointerState {
  static create (
    initialPosition: Offset, 
    kind: PointerDeviceKind, 
    settings: AtDeviceGestureSettings | null
  ) {
    return new AtImmediatePointerState(initialPosition, kind, settings)
  }

  checkForResolutionAfterMove () {
    invariant(this.delta !== null)
    if (this.delta.distance > computeHitSlop(this.kind, this.settings)) {
      this.resolve(GestureDisposition.Accepted)
    }
  }

  
  accepted (starter: GestureMultiDragCallback) {
    starter(this.initialPosition)
  }
}

export class AtImmediateMultiDragGestureRecognizer extends AtMultiDragGestureRecognizer {
  static create () {
    return new AtImmediateMultiDragGestureRecognizer()
  }

  constructor (
    supportedDevices: Set<PointerDeviceKind> | null = null,
    allowedButtonsFilter: AllowedButtonsFilter | null = null,
  ) {
    super(supportedDevices, allowedButtonsFilter)
  }
 
  
  createNewPointerState (event: AtPointerEvent) {
    return AtImmediatePointerState.create(event.position, event.kind, this.settings)
  }
}

export class AtHorizontalPointerState extends AtMultiDragPointerState {
  static create (
    initialPosition: Offset, 
    kind: PointerDeviceKind, 
    settings: AtDeviceGestureSettings
  ) {
    return new AtHorizontalPointerState(initialPosition, kind, settings)
  }

  checkForResolutionAfterMove() {
    invariant(this.delta !== null)
    if (Math.abs(this.delta.dx) > computeHitSlop(this.kind, this.settings)) {
      this.resolve(GestureDisposition.Accepted)
    }
  }

  accepted (starter: GestureMultiDragCallback) {
    starter(this.initialPosition)
  }
}

export class AtHorizontalMultiDragGestureRecognizer extends AtMultiDragGestureRecognizer {
  static create (
    supportedDevices: Set<PointerDeviceKind>,
    allowedButtonsFilter: AllowedButtonsFilter,
  ) {
    return new AtHorizontalMultiDragGestureRecognizer(
      supportedDevices,
      allowedButtonsFilter
    )
  }

  constructor (
    supportedDevices: Set<PointerDeviceKind>,
    allowedButtonsFilter: AllowedButtonsFilter,
  ) {
    super(supportedDevices, allowedButtonsFilter)
  }

  
  createNewPointerState (event: AtPointerEvent) {
    invariant(this.settings !== null)
    return AtHorizontalPointerState.create(event.position, event.kind, this.settings)
  }
}

export class AtVerticalPointerState extends AtMultiDragPointerState {
  static create (
    initialPosition: Offset, 
    kind: PointerDeviceKind, 
    settings: AtDeviceGestureSettings
  ) {
    return new AtVerticalPointerState(initialPosition, kind, settings)
  }

 
  checkForResolutionAfterMove () {
    invariant(this.delta !== null)
    if (Math.abs(this.delta.dy) > computeHitSlop(this.kind, this.settings)) {
      this.resolve(GestureDisposition.Accepted)
    }
  }

  
  accepted (starter: GestureMultiDragCallback) {
    starter(this.initialPosition)
  }
}

export class AtVerticalMultiDragGestureRecognizer extends AtMultiDragGestureRecognizer {
 
  constructor (
    supportedDevices: Set<PointerDeviceKind>,
    allowedButtonsFilter: AllowedButtonsFilter,
  ) {
    super(supportedDevices, allowedButtonsFilter)
  }

  createNewPointerState (event: AtPointerEvent): AtMultiDragPointerState {
    invariant(this.settings !== null)
    return AtVerticalPointerState.create(event.position, event.kind, this.settings)
  }

}

export class AtDelayedPointerState extends AtMultiDragPointerState {
  static create (
    initialPosition: Offset, 
    delay: number, 
    kind: PointerDeviceKind,
    deviceGestureSettings: AtDeviceGestureSettings
  ) {
    return new AtDelayedPointerState(initialPosition, delay, kind, deviceGestureSettings)
  }

  public timer: Timer | null = null
  public starter: GestureMultiDragCallback | null = null

  constructor (
    initialPosition: Offset, 
    delay: number, 
    kind: PointerDeviceKind,
    deviceGestureSettings: AtDeviceGestureSettings
  ) {
    super(initialPosition, kind, deviceGestureSettings)
    this.timer = Timer.timeout(this.delayPassed, delay)
  }

  delayPassed = () => {
    invariant(this.timer !== null);
    invariant(this.delta !== null);
    invariant(this.delta.distance <= computeHitSlop(this.kind, this.settings))

    this.timer = null
    if (this.starter !== null) {
      this.starter(this.initialPosition)
      this.starter = null
    } else {
      this.resolve(GestureDisposition.Accepted)
    }
    invariant(this.starter === null)
  }

  ensureTimerStopped () {
    this.timer?.cancel()
    this.timer = null
  }

  accepted (starter: GestureMultiDragCallback) {
    invariant(this.starter === null);
    if (this.timer === null) {
      starter(this.initialPosition)
    } else {
      this.starter = starter
    }
  }

  checkForResolutionAfterMove () {
    if (this.timer === null) {
      invariant(this.starter !== null)
      return
    }

    invariant(this.delta !== null)
    if (this.delta.distance > computeHitSlop(this.kind, this.settings)) {
      this.resolve(GestureDisposition.Rejected)
      this.ensureTimerStopped()
    }
  }

  dispose () {
    this.ensureTimerStopped()
    super.dispose()
  }
}

export class AtDelayedMultiDragGestureRecognizer extends AtMultiDragGestureRecognizer {
  public delay: number

  constructor (
    delay: number = At.kLongPressTimeout,
    supportedDevices: Set<PointerDeviceKind>,
    allowedButtonsFilter: AllowedButtonsFilter,
  ) {
    super(supportedDevices, allowedButtonsFilter)
    this.delay = delay
  }

  createNewPointerState (event: AtPointerEvent): AtMultiDragPointerState {
    invariant(this.settings !== null)

    return AtDelayedPointerState.create(
      event.position, 
      this.delay, 
      event.kind, 
      this.settings
    )
  }
}
