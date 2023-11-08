import invariant from '@at/utils'
import { AtPointerEvent } from '../gestures/events'
import { AtHitTestResult } from '../gestures/hit-test'
import { Offset, Subscribable, VoidCallback } from '../at'
import { PointerDeviceKind } from 'src/gestures/pointer'
import { AtMouseCursorManager, AtSystemMouseCursors } from './mouse-session'

type MouseDetectorAnnotationFinder = (offset: Offset) => AtHitTestResult


export class AtMouseState {

  
  public latestEvent: AtPointerEvent
  public get device () {
    return this.latestEvent.device
  }

  constructor (initialEvent: AtPointerEvent) {
    this.latestEvent = initialEvent
  }

  replaceLatestEvent (value: AtPointerEvent) {
    invariant(value.device === this.latestEvent.device)
    const previous = this.latestEvent
    this.latestEvent = value
    return previous
  }
}

export class AtMouseTrackerUpdateDetails  {
  static create (
    previousEvent: AtPointerEvent,
    triggeringEvent: AtPointerEvent,
  ) {
    return new AtMouseTrackerUpdateDetails(
      previousEvent,
      triggeringEvent,
    )
  }

  static byNewFrame (
    previousEvent: AtPointerEvent,
    triggeringEvent: AtPointerEvent,
  ) {
    return AtMouseTrackerUpdateDetails.create(
      previousEvent,
      triggeringEvent
    )
  }

  static byPointerEvent(
    previousEvent: AtPointerEvent,
    triggeringEvent: AtPointerEvent,
  ) {
    const detail = AtMouseTrackerUpdateDetails.create(
      previousEvent,
      triggeringEvent
    ) 
    return detail
  }

  constructor (
    previousEvent: AtPointerEvent,
    triggeringEvent: AtPointerEvent,
  ) {
      this.previousEvent = previousEvent
      this.triggeringEvent = triggeringEvent 
  }

  

  public previousEvent: AtPointerEvent | null = null
  public triggeringEvent: AtPointerEvent | null = null

  public get device () {
    invariant(this.triggeringEvent !== null)
    const result = (this.previousEvent ?? this.triggeringEvent).device
    return result
  }

  
  public get latestEvent (): AtPointerEvent {
    invariant(this.triggeringEvent !== null)
    const result = this.triggeringEvent ?? this.previousEvent
    return result
  }
}


export class AtMouseTracker extends Subscribable {
  public mouseCursorMixin = new AtMouseCursorManager(
    AtSystemMouseCursors.basic,
  )

  
  public states: Map<number, AtMouseState> = new Map()

  monitorMouseConnection (task: VoidCallback) {
    const mouseWasConnected = this.mouseIsConnected
    task()
    if (mouseWasConnected !== this.mouseIsConnected) {
      this.publish()
    }
  }

  
  deviceUpdatePhase (task: VoidCallback) {
    task()
  }

  
  static shouldMarkStateDirty(state: AtMouseState | null, event: AtPointerEvent) {
    if (state === null) {
      return true
    }

    const lastEvent = state.latestEvent
    invariant(event.device === lastEvent.device)
    

    if (event.isSignal()) {
      return false
    }

    return (
      lastEvent.isAdded() || 
      event.isRemoved() || 
      lastEvent.position.notEqual(event.position)
    )
  }

  handleDeviceUpdate (details: AtMouseTrackerUpdateDetails) {
    AtMouseTracker.handleDeviceUpdateMouseEvents(details)
    this.mouseCursorMixin.handleDeviceCursorUpdate(
      details.device,
      details.triggeringEvent,
    )
  }

  
  public get mouseIsConnected () {
    return this.states.size > 0
  }

  updateWithEvent (event: AtPointerEvent, getResult: AtHitTestResult) {
    if (event.kind !== PointerDeviceKind.Mouse) {
      return
    }
    if (event.isSignal()) {
      return
    }

    const result = event.isRemoved() ? AtHitTestResult.create() : getResult()
    const device = event.device
    const existingState = this.states.get(device) ?? null
    if (!AtMouseTracker.shouldMarkStateDirty(existingState, event)) {
      return
    }

    this.monitorMouseConnection(() => {
      this.deviceUpdatePhase(() => {
        if (existingState === null) {
          if (event.isRemoved()) {
            return
          }
          this.states.set(device, new AtMouseState(event))
        } else {
          
          if (event.isRemoved()) {
            this.states.delete(event.device)
          }
        }
        const targetState = this.states.get(device) ?? existingState
        invariant(targetState)

        const lastEvent = targetState.replaceLatestEvent(event)
        
        this.handleDeviceUpdate(AtMouseTrackerUpdateDetails.byPointerEvent(
          lastEvent,
          event,
        ))
      })
    })
  }

  updateAllDevices (hitTest: MouseDetectorAnnotationFinder) {
    this.deviceUpdatePhase(() => {
      for (const [device, dirtyState] of this.states) {
        const lastEvent = dirtyState.latestEvent

        this.handleDeviceUpdate(AtMouseTrackerUpdateDetails.byNewFrame(lastEvent))
      }
    })
  }

  
  static handleDeviceUpdateMouseEvents (details: AtMouseTrackerUpdateDetails) {
    const latestEvent = details.latestEvent

    
  }
}
