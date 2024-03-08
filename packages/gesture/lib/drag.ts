import { Offset } from '@at/geometry'
import { invariant } from '@at/utils'
import { Engine } from '@at/engine'
import { GestureArenaEntry } from './arena'
import { DeviceGestureSettings } from './device-gesture-settings'
import { GestureRecognizer } from './recognizer'
import { Velocity, VelocityTracker } from './velocity'
import { Gesture, GestureDispositionKind } from './gesture'
import { 
  PointerChangeKind, 
  PointerDeviceKind, 
  PointerEventButtonKind, 
  SanitizedPointerEvent 
} from './sanitizer'
import { GestureEventCallback } from './detector'

export interface DragDetail {
  globalPosition?: Offset | null,
  localPosition?: Offset | null,
  sourceTimeStamp?: number | null,
  kind?: PointerDeviceKind | null,
  delta?: Offset | null,
  primaryDelta?: number | null,
  velocity?: Velocity | null,
  primaryVelocity?: number | null
}

// 拖拽
export interface Drag {
  update (detail: DragDetail): void
  end (detail: DragDetail): void
  cancel (): void
}

export class DragTarget {
  static create () {
    return new DragTarget()
  }

  // => onDragStart
  protected _onDragStart: GestureEventCallback<DragDetail> | null = null
  public get onDragStart () {
    return this._onDragStart
  }
  public set onDragStart (onDragStart: GestureEventCallback<DragDetail> | null) {
    if (this._onDragStart !== onDragStart) {
      this._onDragStart = onDragStart
    }
  }

  // => onDragUpdate
  protected _onDragUpdate: GestureEventCallback<DragDetail> | null = null
  public get onDragUpdate () {
    return this._onDragUpdate
  }
  public set onDragUpdate (onDragUpdate: GestureEventCallback<DragDetail> | null) {
    if (this._onDragUpdate !== onDragUpdate) {
      this._onDragUpdate = onDragUpdate
    }
  }

  // => onDragEnd
  protected _onDragEnd: GestureEventCallback<DragDetail> | null = null
  public get onDragEnd () {
    return this._onDragEnd
  }
  public set onDragEnd (onDragEnd: GestureEventCallback<DragDetail> | null) {
    if (this._onDragEnd !== onDragEnd) {
      this._onDragEnd = onDragEnd
    }
  }

  // => onDragCancel
  protected _onDragCancel: GestureEventCallback<DragDetail> | null = null
  public get onDragCancel () {
    return this._onDragCancel
  }
  public set onDragCancel (onDragCancel: GestureEventCallback<DragDetail> | null) {
    if (this._onDragCancel !== onDragCancel) {
      this._onDragCancel = onDragCancel
    }
  }

  start (detail: DragDetail) {
    if (this.onDragStart !== null) {
      this.onDragStart(detail)
    }
  }

  update (detail: DragDetail) {
    if (this.onDragUpdate !== null) {
      this.onDragUpdate(detail)
    }
  }

  end (detail: DragDetail) {
    if (this.onDragEnd !== null) {
      this.onDragEnd(detail)
    }
  }

  cancel () {
    if (this.onDragCancel !== null) {
      this.onDragCancel()
    }
  }

  dispose () {
    this.onDragStart = null
    this.onDragUpdate = null
    this.onDragEnd = null
    this.onDragCancel = null
  }
}

export interface GestureDragStartCallback {
  (position: Offset): DragTarget | null
}

export interface DragPointerStateFactory <T> {
  new (
    position: Offset, 
    kind: PointerDeviceKind, 
    settings: DeviceGestureSettings
  ): T
  create (
    position: Offset, 
    kind: PointerDeviceKind, 
    settings: DeviceGestureSettings
  ): T
}
export abstract class DragPointerState {
  static create <T> (
    position: Offset, 
    kind: PointerDeviceKind, 
    settings: DeviceGestureSettings
  ): T {
    const DragPointerStateFactory = this as unknown as DragPointerStateFactory<T>
    return new DragPointerStateFactory(position, kind, settings) as T
  }

  // => delta
  protected _delta: Offset | null = Offset.ZERO
  public get delta () {
    return this._delta
  }
  public set delta (delta: Offset | null) {
    this._delta = delta
  }

  protected position: Offset
  protected velocityTracker: VelocityTracker
  protected kind: PointerDeviceKind
  protected client: DragTarget | null = null
  protected settings: DeviceGestureSettings | null = null

  protected setttings: DeviceGestureSettings
  protected entry: GestureArenaEntry | null = null
  protected lastPendingEventTimestamp: number | null = null

  constructor (
    position: Offset, 
    kind: PointerDeviceKind, 
    settings: DeviceGestureSettings
  ) {
    this.kind = kind
    this.position = position
    this.setttings = settings
    this.velocityTracker = VelocityTracker.withKind(kind)
  }

  abstract accepted (starter: GestureDragStartCallback): void

  setArenaEntry (entry: GestureArenaEntry) {
    invariant(this.delta !== null, 'The "DragPointerState.delta" cannot be null.')
    invariant(this.client === null)
    this.entry = entry
  }

  resolve (disposition: GestureDispositionKind) {
    invariant(this.entry, 'The "DragPointerState.entry" cannot be null.')
    this.entry.resolve(disposition)
  }

  move (event: SanitizedPointerEvent) {
    invariant(this.entry !== null, 'The "DragPointerState.entry" cannot be null.')
    
    if (!event.synthesized) {
      this.velocityTracker.addPosition(event.timeStamp, event.position)
    }

    if (this.client !== null) {
      invariant(this.delta === null)
      
      this.client.update({
        delta: event.delta,
        globalPosition: event.position,
        sourceTimeStamp: event.timeStamp,
      })
    } else {
      invariant(this.delta !== null, 'The "DragPointerState.delta" cannot be null.')
      this.delta = this.delta.add(event.delta)
      this.lastPendingEventTimestamp = event.timeStamp
      this.checkForResolutionAfterMove()
    }
  }

  checkForResolutionAfterMove () { }

  rejected () {
    invariant(this.entry !== null, 'The "DragPointerState.entry" cannot be null.')
    invariant(this.client === null)
    invariant(this.delta !== null)
    this.delta = null
    this.lastPendingEventTimestamp = null
    this.entry = null
  }

  start (client: DragTarget) {
    invariant(this.entry !== null, 'The "DragPointerState.entry" cannot be null.')
    invariant(this.client === null)
    invariant(this.delta !== null, 'The "DragPointerState.delta" cannot be null.')
    this.client = client
    
    const detail = {
      sourceTimeStamp: this.lastPendingEventTimestamp,
      delta: this.delta,
      globalPosition: this.position,
    }

    this.delta = null
    this.lastPendingEventTimestamp = null
    this.client.start(detail)
    this.client.update(detail)
  }

  up () {
    invariant(this.entry !== null, 'The "DragPointerState.entry" cannot be null.')
    if (this.client !== null) {
      invariant(this.delta === null, 'The "DragPointerState.delta" cannot be null.')
      const detail = {
        velocity: this.velocityTracker.velocity
      }

      const client = this.client
      this.client = null
      
      client.end(detail)
    } else {
      invariant(this.delta === null, 'The "DragPointerState.delta" cannot be null.')
      this.delta = null
      this.lastPendingEventTimestamp = null
    }
  }

  cancel () {
    invariant(this.entry !== null, 'The "DragPointerState.entry" cannot be null.')
    if (this.client !== null) {
      invariant(this.delta === null, 'The "DragPointerState.delta" cannot be null.')
      
      const client = this.client
      this.client = null
      client.cancel()
    } else {
      invariant(this.delta === null, 'The "DragPointerState.delta" cannot be null.')
      this.delta = null
      this.lastPendingEventTimestamp = null
    }
  }

  dispose () {
    this.entry?.resolve(GestureDispositionKind.Rejected)
    this.entry = null
  }
}
export abstract class DragGestureRecognizer extends GestureRecognizer {
  static defaultButtonAcceptBehavior (buttons: number) {
    return buttons == PointerEventButtonKind.Primary
  }

  static create (
    engine: Engine, 
    kind: PointerDeviceKind | null = null, 
    settings: DeviceGestureSettings | null = null
  ): DragGestureRecognizer {
    return super.create(
      engine, 
      kind, 
      settings
    ) as DragGestureRecognizer
  }

  protected pointers: Map<number, DragPointerState> | null = new Map()
  public onStart: GestureDragStartCallback | null = null

  abstract createNewPointerState (event: SanitizedPointerEvent): DragPointerState
  
  /**
   * 
   * @param {SanitizedPointerEvent} event 
   */
  addAllowedPointer (event: SanitizedPointerEvent) {
    invariant(this.pointers !== null, 'The "DragGestureRecognizer.pointers" cannot be null.')
    invariant(!this.pointers.has(event.id))

    const state = this.createNewPointerState(event)
    this.pointers.set(event.id, state)
    ;(this.engine.gesture as Gesture).dispatcher.use(event.id, this.handleEvent.bind(this), null)

    state.setArenaEntry((this.engine.gesture as Gesture).arena.add(event.id, this))
  }

  handleEvent (event: SanitizedPointerEvent) {
    invariant(this.pointers !== null, 'The "DragGestureRecognizer.pointers" cannot be null.')
    const state = this.pointers.get(event.id) as unknown as DragPointerState

    if (event.change === PointerChangeKind.Move) {
      state.move(event)
    } else if (event.change === PointerChangeKind.Up) {
      invariant(event.delta.equal(Offset.ZERO))
      state.up()
      this.destory(event.id)
    } else if (event.change === PointerChangeKind.Cancel) {
      invariant(event.delta.equal(Offset.ZERO))
      state.cancel()
      this.destory(event.id)
    }
  }

  accept (id: number) {
    invariant(this.pointers !== null, 'The "DragGestureRecognizer.pointers" cannot be null.')
    const state = this.pointers.get(id) ?? null

    if (state !== null) {
      state.accepted((position: Offset) => this.start(position, id))
    }
  }

  start (position: Offset, id: number) {
    invariant(this.pointers !== null, 'The "DragGestureRecognizer.pointer" cannot be null.')
    const state = this.pointers.get(id) ?? null

    invariant(state !== null, 'The "state" cannot be null.')
    invariant(state.delta !== null, 'The "DragPointerState.delta" cannot be null.')

    let drag: DragTarget | null = null
    if (this.onStart !== null) {
      drag = this.onStart(position) ?? null
    }

    if (drag !== null) {
      state.start(drag)
    } else {
      this.destory(id)
    }

    return drag
  }

  reject (id: number) {
    invariant(this.pointers !== null, 'The "DragGestureRecognizer.pointer" cannot be null.')
    
    if (this.pointers.has(id)) {
      const state = this.pointers.get(id) ?? null
      invariant(state !== null, 'The "DragPointerState" cannot be null.')
      state.rejected()
      this.destory(id)
    }
  }

  destory (id: number) {
    if (this.pointers !== null) {
      invariant(this.pointers.has(id))

      const state = this.pointers.get(id) ?? null
      ;(this.engine.gesture as Gesture).dispatcher.delete(id, this.handleEvent)

      if (state !== null) {
        this.pointers.delete(id)
        state.dispose()
      }
    }
  }
  
  dispose () {
    if (this.pointers !== null) {
      Array.from(this.pointers.keys()).forEach(this.destory)
    }
    
    this.pointers = null
    super.dispose()
  }
}

class ImmediatePointerState extends DragPointerState {
  checkForResolutionAfterMove () {
    invariant(this.delta !== null, 'The "ImmediatePointerState.delta" cannot be null.')
    
    if (this.delta.distance > computeHitSlop(this.kind, this.settings)) {
      this.resolve(GestureDispositionKind.Accepted)
    }
  }
  
  accepted (starter: GestureDragStartCallback) {
    starter(this.position)
  }
}

export class ImmediateMultiDragGestureRecognizer extends DragGestureRecognizer { 
  createNewPointerState (event: SanitizedPointerEvent): DragPointerState {
    return ImmediatePointerState.create(
      event.position, 
      event.kind, 
      this.settings as DeviceGestureSettings
    )
  }
}

/**
 * 
 * @param {PointerDeviceKind} kind 
 * @param {DeviceGestureSettings | null} settings 
 * @returns {number}
 */
function computeHitSlop (kind: PointerDeviceKind, settings: DeviceGestureSettings | null) {
  switch (kind) {
    case PointerDeviceKind.Mouse:
      return Gesture.env<number>('ATKIT_GESTURE_PRECISE_HIT_SLOP', 1.0)
    case PointerDeviceKind.Stylus:
    case PointerDeviceKind.InvertedStylus:
    case PointerDeviceKind.Unknown:
    case PointerDeviceKind.Touch:
      return settings?.slop ?? Gesture.env<number>('ATKIT_GESTURE_TOUCH_SLOP', 18)
  }
}