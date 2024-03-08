import { HitTestResult, PointerChangeKind, PointerDeviceKind, SanitizedPointerEvent } from '@at/gesture'
import { Offset } from '@at/geometry'
import { Matrix4 } from '@at/math'
import { invariant } from '@at/utils'
import { Subscribable } from '@at/basic'
import { MouseCursor, MouseCursorManager } from './cursor'


export interface MouseTrackerHitTest {
  (offset: Offset): HitTestResult
}

export interface MouseEvent {
  (event: SanitizedPointerEvent): void
}

export interface MouseTrackerAnnotation {
  cursor: MouseCursor,
  validForMouseTracker: boolean,
  onEnter: MouseEvent | null,
  onHover: MouseEvent | null,
  onExit: MouseEvent | null,
}

class MouseState {
  static create (event: SanitizedPointerEvent) {
    return new MouseState(event)
  }
  // => annotations
  protected _annotations: Map<MouseTrackerAnnotation, Matrix4> = new Map()
  public get annotations () {
    return this._annotations
  }
  public set annotations (annotations: Map<MouseTrackerAnnotation, Matrix4>) {
    if (this._annotations !== annotations) {
      this._annotations = annotations
    }
  }

  // => latestEvent
  protected _latestEvent: SanitizedPointerEvent | null = null
  public get latestEvent () {
    invariant(this._latestEvent !== null)
    return this._latestEvent
  }
  public set latestEvent (latestEvent: SanitizedPointerEvent) {
    if (
      this._latestEvent === null || 
      this._latestEvent !== latestEvent
    ) {
      this._latestEvent = latestEvent
    }
  }

  // => device
  public get device () {
    return this.latestEvent.device
  }

  constructor(initialEvent: SanitizedPointerEvent) {
    this.latestEvent = initialEvent
  }

  /**
   * 
   * @param value 
   * @returns 
   */
  replaceAnnotations (value: Map<MouseTrackerAnnotation, Matrix4>) {
    const previous = this._annotations
    this.annotations = value

    return previous
  }

  /**
   * 
   * @param value 
   * @returns 
   */
  replaceLatestEvent (value: SanitizedPointerEvent) {
    invariant(value.device === this.latestEvent.device)
    const previous = this.latestEvent
    this.latestEvent = value
    return previous
  }

  toString () {
    return `MouseState(
      [latestEvent]: ${this.latestEvent},
      [annotations]: ${this.annotations}
    )`
  }
}

//// => MouseTrackerUpdateDetail
class MouseTrackerUpdateDetail {
  static byNewFrame(options: {
    lastAnnotations: Map<MouseTrackerAnnotation, Matrix4>,
    nextAnnotations: Map<MouseTrackerAnnotation, Matrix4>,
    previousEvent: SanitizedPointerEvent,
  }) {
    return new MouseTrackerUpdateDetail(
      options.lastAnnotations,
      options.nextAnnotations,
      options.previousEvent,
      null
    )
  }

  static byPointerEvent(options: {
    lastAnnotations: Map<MouseTrackerAnnotation, Matrix4>,
    nextAnnotations: Map<MouseTrackerAnnotation, Matrix4>,
    previousEvent: SanitizedPointerEvent,
    triggeringEvent: SanitizedPointerEvent,
  }) {
    return new MouseTrackerUpdateDetail(
      options.lastAnnotations,
      options.nextAnnotations,
      options.previousEvent,
      options.triggeringEvent,
    )
  }

  //
  public get device (): number | null {
    return this.triggeringEvent?.device ?? this.latestEvent?.device ?? null
  }

  public get latestEvent () {
    const result = this.triggeringEvent ?? this.previousEvent
    return result
  }
  
  public lastAnnotations: Map<MouseTrackerAnnotation, Matrix4> 
  public nextAnnotations: Map<MouseTrackerAnnotation, Matrix4>

  public previousEvent: SanitizedPointerEvent | null
  public triggeringEvent: SanitizedPointerEvent | null
  

  constructor (
    lastAnnotations: Map<MouseTrackerAnnotation, Matrix4>,
    nextAnnotations: Map<MouseTrackerAnnotation, Matrix4>,
    previousEvent: SanitizedPointerEvent | null = null,
    triggeringEvent: SanitizedPointerEvent | null = null,
  ) {
    this.lastAnnotations = lastAnnotations
    this.nextAnnotations = nextAnnotations
    this.previousEvent = previousEvent
    this.triggeringEvent = triggeringEvent
  }
}

export class MouseTracker extends Subscribable {
  static create (hitTest: MouseTrackerHitTest) {
    return new MouseTracker(hitTest)
  }

  static shouldMarkStateDirty (
    state: MouseState | null = null, 
    event: SanitizedPointerEvent
  ) {
    if (state === null) {
      return true
    }

    const lastEvent = state.latestEvent
    invariant(event.device === lastEvent.device)
    // assert((event is PointerAddedEvent) == (lastEvent is PointerRemovedEvent));

    if (event.change === PointerChangeKind.Signal) {
      return false
    }

    return lastEvent.change === PointerChangeKind.Added ||
      event.change === PointerChangeKind.Removed ||
      lastEvent.position.notEqual(event.position)
  }

  static updateMouseEvents (detail: MouseTrackerUpdateDetail) {
    const latestEvent = detail.latestEvent
    const lastAnnotations = detail.lastAnnotations
    const nextAnnotations = detail.nextAnnotations

    invariant(latestEvent?.position)
    invariant(latestEvent?.physicalPosition)

    const baseExitEvent = SanitizedPointerEvent.create({
      id: 0,
      kind: PointerDeviceKind.Touch,
      device: latestEvent.device,
      buttons: latestEvent.buttons,
      down: false,
      synthesized: false,
      timeStamp: latestEvent.timeStamp,
      change: PointerChangeKind.Exit,
      x: latestEvent?.position.dx as number,
      y: latestEvent?.position.dy as number,
      physicalX: latestEvent.physicalPosition.dx as number,
      physicalY: latestEvent.physicalPosition.dx as number,
      deltaX: latestEvent.delta.dy,
      deltaY: latestEvent.delta.dy,
      physicalDeltaX: latestEvent.physicalDelta.dx,
      physicalDeltaY: latestEvent.physicalDelta.dy,
    })

    for (const [target] of lastAnnotations) {
      if (target.validForMouseTracker && !nextAnnotations.has(target)) {
        const event = baseExitEvent.transformed(lastAnnotations.get(target) as Matrix4)
        target.onExit?.call(target, event)
      }
    }
    
    const enteringAnnotations = new Map(Array.from(nextAnnotations.entries()).filter(([target, transform]) => {
      return !lastAnnotations.has(target)
    }))

    const baseEnterEvent = SanitizedPointerEvent.create({
      id: 0,
      kind: PointerDeviceKind.Touch,
      device: latestEvent.device,
      buttons: latestEvent.buttons,
      down: false,
      synthesized: false,
      timeStamp: latestEvent.timeStamp,
      change: PointerChangeKind.Enter,
      x: latestEvent?.position.dx as number,
      y: latestEvent?.position.dy as number,
      physicalX: latestEvent.physicalPosition.dx as number,
      physicalY: latestEvent.physicalPosition.dx as number,
      deltaX: latestEvent.delta.dy,
      deltaY: latestEvent.delta.dy,
      physicalDeltaX: latestEvent.physicalDelta.dx,
      physicalDeltaY: latestEvent.physicalDelta.dy,
      
    })
    
    for (const [target] of enteringAnnotations) {
      if (target.validForMouseTracker) {
        const event = baseEnterEvent.transformed(nextAnnotations.get(target) as Matrix4)
        target.onEnter?.call(target, event)
      }
    }
  }

  // => connected
  public get connected () {
    return this.states.size > 0
  }

  public hitTest: MouseTrackerHitTest
  public states: Map<number, MouseState> = new Map()
  public cursors: MouseCursorManager = MouseCursorManager.create()
  
  constructor (hitTest: MouseTrackerHitTest) {
    super()
    this.hitTest = hitTest
  }

  hitTestResultToAnnotations (result: HitTestResult): Map<MouseTrackerAnnotation, Matrix4> {
    const annotations = new Map<MouseTrackerAnnotation, Matrix4>()
    
    for (const entry of result.path) {
      const target = entry.target
      annotations.set(
        target as unknown as MouseTrackerAnnotation, 
        entry.transform as Matrix4
      )
    }

    return annotations
  }

  findAnnotations (state: MouseState) {
    const globalPosition = state.latestEvent.position
    const device = state.device

    if (!this.states.has(device)) {
      return new Map()
    }

    return this.hitTestResultToAnnotations(this.hitTest(globalPosition))
  }

  update (detail: MouseTrackerUpdateDetail) {
    MouseTracker.updateMouseEvents(detail)

    const session = this.cursors.handleCursorUpdate(
      detail.device as number,
      detail.triggeringEvent as SanitizedPointerEvent,
      Array.from(detail.nextAnnotations.entries()).map(([target]) => {
        return target.cursor
      }).filter(cursor => !!cursor)
    ) ?? null

    if (session !== null) {
      this.publish(session)
    }
  }

  updateWithEvent (event: SanitizedPointerEvent, hitTestResult: HitTestResult | null = null) {
    if (event.kind !== PointerDeviceKind.Mouse) {
      return
    }

    if (event.change === PointerChangeKind.Signal) {
      return
    }

    let result: HitTestResult 
    if (event.change === PointerChangeKind.Removed) {
      result = HitTestResult.create()
    } else {
      result = hitTestResult ?? this.hitTest(event.position)
    }

    const device = event.device
    const existingState: MouseState | null = this.states.get(device) ?? null
    
    if (!MouseTracker.shouldMarkStateDirty(existingState, event)) {
      return
    }

    if (existingState === null) {
      if (event.change === PointerChangeKind.Removed) {
        return
      }

      this.states.set(device, MouseState.create(event))
    } else {
      invariant(event.change !== PointerChangeKind.Added)
      if (event.change === PointerChangeKind.Removed) {
        this.states.delete(event.device)
      }
    }
    
    const target = this.states.get(device) ?? existingState ?? null
    invariant(target !== null)

    const lastEvent = target.replaceLatestEvent(event)
    const nextAnnotations = event.change === PointerChangeKind.Removed 
      ? new Map()
      : this.hitTestResultToAnnotations(result)
    
    const lastAnnotations = target.replaceAnnotations(nextAnnotations)

    this.update(MouseTrackerUpdateDetail.byPointerEvent({
      lastAnnotations: lastAnnotations,
      nextAnnotations: nextAnnotations,
      previousEvent: lastEvent,
      triggeringEvent: event,
    }))
    
  }

  updateAllDevices () {
    for (const [, dirtyState] of this.states) {
      const lastEvent = dirtyState.latestEvent
      const nextAnnotations = this.findAnnotations(dirtyState)
      const lastAnnotations = dirtyState.replaceAnnotations(nextAnnotations)

      this.update(MouseTrackerUpdateDetail.byNewFrame({
        lastAnnotations: lastAnnotations,
        nextAnnotations: nextAnnotations,
        previousEvent: lastEvent,
      }))
    }
  }

  dispose () {
    this.states.clear()
  }
}
