import invariant from '@at/utility'
import { AllowedButtonsFilter, At, Matrix4, Offset } from 'src/at'
import { AtVelocity, AtVelocityTracker } from './velocity-tracker'
import { AtOneSequenceGestureRecognizer, DragStartBehavior } from './recognizer'
import { PointerDeviceKind } from './pointer'
import { AtPointerEvent, computePanSlop, computeScaleSlop } from './events'
import { GestureDisposition } from './arena'

const kDefaultMouseScrollToScaleFactor = 200
const kDefaultTrackpadScrollToScaleFactor = new Offset(0, -1 / kDefaultMouseScrollToScaleFactor)

enum ScaleState {  
  Ready,
  Possible,
  Accepted,
  Started,
}

class AtPointerPanZoomData {
  static fromStartEvent(
    parent: AtScaleGestureRecognizer,
    event: AtPointerEvent 
  ) {
    const data = new AtPointerPanZoomData()
    data.position = event.position
    data.pan = Offset.zero
    data.scale = 1
    data.rotation = 0
    return data
  }
    

  static fromUpdateEvent (
    parent: AtScaleGestureRecognizer, 
    event: AtPointerEvent
  ) {
    const data = new AtPointerPanZoomData()
    data.position = event.position
    data.pan = event.pan
    data.scale = event.scale
    data.rotation = event.rotation

    return data
  }

  // => focalPoint
  public get focalPoint () {
    if (this.parent.trackpadScrollCausesScale) {
      return this.position
    }
    return this.position.add(this.pan)
  }

  // => scale
  private _scale: number = 1.0
  public get scale () {
    if (this.parent.trackpadScrollCausesScale) {
      return this.scale * Math.exp((this.pan.dx * this.parent.trackpadScrollToScaleFactor.dx) + (this.pan.dy * this.parent.trackpadScrollToScaleFactor.dy))
    }

    return this.scale
  }  
  public set scale (value: number) {
    this._scale = value
  }

  // => parent
  private _parent: AtScaleGestureRecognizer | null = null
  public get parent () : AtScaleGestureRecognizer {
    invariant(this._parent !== null)
    return this._parent
  }
  public set parent (parent: AtScaleGestureRecognizer) {
    this._parent = parent
  }

  // => position
  private _position: Offset = Offset.zero
  public get position (): Offset {
    invariant(this._position !== null)
    return this._position
  }
  public set position (position: Offset) {
    if (this._position === null || this._position.notEqual(position)) {
      this._position = position
    }
  }

  // => pan
  private _pan: Offset = Offset.zero
  public get pan (): Offset {
    invariant(this._pan !== null)
    return this._pan
  }
  public set pan (pan: Offset) {
    if (this._pan === null || this._pan.notEqual(pan)) {
      this._pan = pan
    }
  }

  // => rotation
  private _rotation: number = 1.0
  public get rotation (): number {
    invariant(this._rotation !== null)
    return this._rotation
  }
  public set rotation (rotation: number) {
    if (this._rotation !== rotation) {
      this._rotation = rotation
    }
  }
}

export type ScaleDetails = {
  pointerCount?: number,
  focalPoint?: Offset
  localFocalPoint?: Offset
  focalPointDelta?: Offset,
  scale?: number,
  horizontalScale?: number,
  verticalScale?: number,
  rotation?: number,
  velocity?: AtVelocity,
  scaleVelocity?: number,
}




export type GestureScaleCallback = (details: ScaleDetails) => void

const isFlingGesture = (velocity: AtVelocity) => {
  const speedSquared = velocity.pixelsPerSecond.distanceSquared
  return speedSquared > At.kMinFlingVelocity * At.kMinFlingVelocity
}

export class AtLineBetweenPointers {
  constructor (
    pointerStartLocation: Offset = Offset.zero,
    pointerStartId: number = 0,
    pointerEndLocation: Offset = Offset.zero,
    pointerEndId: number = 1,
  ) {
    this.pointerStartLocation = pointerStartLocation
    this.pointerStartId = pointerStartId
    this.pointerEndLocation = pointerEndLocation
    this.pointerEndId = pointerEndId
  }

  public pointerStartLocation: Offset
  public pointerStartId: number
  
  public pointerEndLocation: Offset
  public pointerEndId: number
}


export class AtScaleGestureRecognizer extends AtOneSequenceGestureRecognizer {
  // => pointerScaleFactor
  public get pointerScaleFactor () {
    return this.initialSpan > 0.0 
      ? this.currentSpan / this.initialSpan 
      : 1.0
  } 

  // => pointerHorizontalScaleFactor
  public get pointerHorizontalScaleFactor () {
    return this.initialHorizontalSpan > 0.0
      ? this.currentHorizontalSpan / this.initialHorizontalSpan
      : 1.0
  }
     

  // => pointerVerticalScaleFactor
  public get pointerVerticalScaleFactor () {
    return this.initialVerticalSpan > 0.0
      ? this.currentVerticalSpan / this.initialVerticalSpan
      : 1.0
  }

  // => scaleFactor
  public get scaleFactor () {
    let scale = this.pointerScaleFactor
    for (const p of this.pointerPanZooms.values()) {
      scale *= p.scale / this.initialPanZoomScaleFactor
    }
    return scale
  }

  public get horizontalScaleFactor () {
    let scale = this.pointerHorizontalScaleFactor
    for (const p of this.pointerPanZooms.values()) {
      scale *= p.scale / this.initialPanZoomScaleFactor
    }
    return scale
  }

  public get verticalScaleFactor () {
    let scale = this.pointerVerticalScaleFactor
    for (const p of this.pointerPanZooms.values()) {
      scale *= p.scale / this.initialPanZoomScaleFactor
    }
    return scale
  }

  public get pointerCount () {
    return this.pointerPanZooms.size + this.pointerQueue.length
  }

  public initialFocalPoint: Offset | null = null
  public currentFocalPoint: Offset | null = null
  public initialSpan: number | null = null
  public currentSpan: number | null = null
  public initialHorizontalSpan: number | null = null
  public currentHorizontalSpan: number | null = null
  public initialVerticalSpan: number | null = null
  public currentVerticalSpan: number | null = null
  public localFocalPoint: Offset | null = null
  public initialLine: AtLineBetweenPointers | null | null = null
  public currentLine: AtLineBetweenPointers | null | null = null

  public pointerLocations: Map<number, Offset> = new Map()
  public pointerQueue: number[] = []
  public velocityTrackers: Map<number, AtVelocityTracker> = new Map()
  
  public scaleVelocityTracker: AtVelocityTracker | null | null = null
  public delta: Offset | null = null
  public pointerPanZooms: Map<number, AtPointerPanZoomData> = new Map()
  public initialPanZoomScaleFactor: number = 1
  public initialPanZoomRotationFactor: number = 0


  public dragStartBehavior: DragStartBehavior
  public trackpadScrollCausesScale: boolean
  public trackpadScrollToScaleFactor: Offset

  public onStart: GestureScaleCallback | null = null
  public onUpdate: GestureScaleCallback | null = null
  public onEnd: GestureScaleCallback | null = null
  public lastTransform: Matrix4 | null  = null
  public state: ScaleState = ScaleState.Ready

  constructor (
    supportedDevices: Set<PointerDeviceKind> | null,
    allowedButtonsFilter: AllowedButtonsFilter | null,
    dragStartBehavior: DragStartBehavior = DragStartBehavior.Down,
    trackpadScrollCausesScale: boolean = false,
    trackpadScrollToScaleFactor: Offset = Offset.zero,
  ) { 
    super(supportedDevices, allowedButtonsFilter)

    this.dragStartBehavior = dragStartBehavior
    this.trackpadScrollCausesScale = trackpadScrollCausesScale
    this.trackpadScrollToScaleFactor = trackpadScrollToScaleFactor
  }

  computeRotationFactor () {
    let factor = 0.0
    if (this.initialLine !== null && this.currentLine !== null) {
      const fx = this.initialLine.pointerStartLocation.dx
      const fy = this.initialLine.pointerStartLocation.dy
      const sx = this.initialLine.pointerEndLocation.dx
      const sy = this.initialLine.pointerEndLocation.dy

      const nfx = this.currentLine.pointerStartLocation.dx
      const nfy = this.currentLine.pointerStartLocation.dy
      const nsx = this.currentLine.pointerEndLocation.dx
      const nsy = this.currentLine.pointerEndLocation.dy

      const angle1 = Math.atan2(fy - sy, fx - sx)
      const angle2 = Math.atan2(nfy - nsy, nfx - nsx)

      factor = angle2 - angle1
    }

    for (const p of this.pointerPanZooms.values()) {
      factor += p.rotation
    }

    factor -= this.initialPanZoomRotationFactor
    return factor
  }

  addAllowedPointer (event: AtPointerEvent) {
    super.addAllowedPointer(event)
    this.velocityTrackers.set(event.pointer, AtVelocityTracker.withKind(event.kind))
    if (this.state === ScaleState.Ready) {
      this.state = ScaleState.Possible
      this.initialSpan = 0.0
      this.currentSpan = 0.0
      this.initialHorizontalSpan = 0.0
      this.currentHorizontalSpan = 0.0
      this.initialVerticalSpan = 0.0
      this.currentVerticalSpan = 0.0
    }
  }

  isPointerPanZoomAllowed (event: AtPointerEvent) {
    return true
  }

  
  addAllowedPointerPanZoom (event: AtPointerEvent) {
    // super.addAllowedPointerPanZoom(event)
    this.startTrackingPointer(event.pointer, event.transform)
    this.velocityTrackers.set(event.pointer, AtVelocityTracker.withKind(event.kind))
    if (this.state === ScaleState.Ready) {
      this.state = ScaleState.Possible
      this.initialPanZoomScaleFactor = 1.0
      this.initialPanZoomRotationFactor = 0.0
    }
  }

  
  handleEvent (event: AtPointerEvent) {
    invariant(this.state !== ScaleState.Ready)
    let didChangeConfiguration = false
    let shouldStartIfAccepted = false
    
    if (event.isMove()) {
      const tracker = this.velocityTrackers.get(event.pointer) ?? null
      invariant(tracker !== null)
      
      if (!event.synthesized) {
        tracker.addPosition(event.timeStamp, event.position)
      }
      this.pointerLocations.set(event.pointer, event.position)
      shouldStartIfAccepted = true
      this.lastTransform = event.transform
    } else if (event.isDown()) {
      this.pointerLocations.set(event.pointer, event.position)
      this.pointerQueue.push(event.pointer)
      didChangeConfiguration = true
      shouldStartIfAccepted = true
      this.lastTransform = event.transform
    } else if (event.isUp() || event.isCancel()) {
      this.pointerLocations.delete(event.pointer)
      const index = this.pointerQueue.indexOf(event.pointer)
      if (index > -1) {
        this.pointerQueue.splice(1, index)
      }
      didChangeConfiguration = true
      this.lastTransform = event.transform

    } else if (event.isZoomStart()) {
      invariant(!this.pointerPanZooms.get(event.pointer))

      this.pointerPanZooms.set(event.pointer, AtPointerPanZoomData.fromStartEvent(this, event))
      didChangeConfiguration = true
      shouldStartIfAccepted = true
      this.lastTransform = event.transform
    } else if (event.isZoomUpdate()) {
      invariant(this.pointerPanZooms.get(event.pointer))

      if (!event.synthesized && !this.trackpadScrollCausesScale) {
        this.velocityTrackers.get(event.pointer)?.addPosition(event.timeStamp, event.pan)
      }

      this.pointerPanZooms.set(event.pointer, AtPointerPanZoomData.fromUpdateEvent(this, event))
      this.lastTransform = event.transform
      shouldStartIfAccepted = true
    } else if (event.isZoomEnd()) {
      invariant(this.pointerPanZooms.get(event.pointer))
      this.pointerPanZooms.delete(event.pointer)
      didChangeConfiguration = true
    }

    this.updateLines()
    this.update()

    if (!didChangeConfiguration || this.reconfigure(event.pointer)) {
      this.advanceStateMachine(shouldStartIfAccepted, event)
    }
    this.stopTrackingIfPointerNoLongerDown(event)
  }

  update () {
    const previousFocalPoint = this.currentFocalPoint
    let focalPoint = Offset.zero;

    for (const pointer of this.pointerLocations.keys()) {
      const value = this.pointerLocations.get(pointer)
      invariant(value)
      focalPoint = focalPoint.add(value)
    }
    for (const p of this.pointerPanZooms.values()) {
      focalPoint = focalPoint.add(p.focalPoint)
    }

    this.currentFocalPoint = this.pointerCount > 0 
      ? focalPoint.divide(this.pointerCount) 
      : Offset.zero

    if (previousFocalPoint === null) {
      this.localFocalPoint = AtPointerEvent.transformPosition(
        this.lastTransform,
        this.currentFocalPoint,
      )
      this.delta = Offset.zero
    } else {
      const localPreviousFocalPoint = this.localFocalPoint
      this.localFocalPoint = AtPointerEvent.transformPosition(
        this.lastTransform,
        this.currentFocalPoint,
      )
      invariant(localPreviousFocalPoint !== null)
      this.delta = this.localFocalPoint.subtract(localPreviousFocalPoint)
    }

    const keys = this.pointerLocations.keys()
    const count = Array.from(keys).length
    let pointerFocalPoint = Offset.zero

    for (const pointer of keys) {
      const value = this.pointerLocations.get(pointer) ?? null
      invariant(value !== null)
      pointerFocalPoint = pointerFocalPoint.add(value)
    }
    if (count > 0) {
      pointerFocalPoint = pointerFocalPoint.divide(count)
    }

    
    let totalDeviation = 0.0
    let totalHorizontalDeviation = 0.0
    let totalVerticalDeviation = 0.0
    for (const pointer of keys) {
      const value = this.pointerLocations.get(pointer) ?? null
      invariant(value !== null)
      totalDeviation += (pointerFocalPoint.subtract(value)).distance
      totalHorizontalDeviation += Math.abs((pointerFocalPoint.dx - value.dx))
      totalVerticalDeviation += Math.abs((pointerFocalPoint.dy - value.dy))
    }
    
    this.currentSpan = count > 0 ? totalDeviation / count : 0.0
    this.currentHorizontalSpan = count > 0 ? totalHorizontalDeviation / count : 0.0
    this.currentVerticalSpan = count > 0 ? totalVerticalDeviation / count : 0.0
  }

  
  updateLines () {
    const keys = this.pointerLocations.keys()
    const count = Array.from(keys).length
    invariant(this.pointerQueue.length >= count)

    
    if (count < 2) {
      this.initialLine = this.currentLine
    } else if (
      this.initialLine !== null &&
      this.initialLine.pointerStartId === this.pointerQueue[0] &&
      this.initialLine.pointerEndId === this.pointerQueue[1]
    ) {
      
      this.currentLine = new AtLineBetweenPointers(
        this.pointerLocations.get(this.pointerQueue[0]),
        this.pointerQueue[0],
        this.pointerLocations.get(this.pointerQueue[1]),
        this.pointerQueue[1],
      )
    } else {
      
      this.initialLine = new AtLineBetweenPointers(
        this.pointerLocations.get(this.pointerQueue[0]),
        this.pointerQueue[0],
        this.pointerLocations.get(this.pointerQueue[1]),
        this.pointerQueue[1],
      )
      this.currentLine = this.initialLine
    }
  }

  reconfigure (pointer: number) {
    this.initialFocalPoint = this.currentFocalPoint
    this.initialSpan = this.currentSpan
    this.initialLine = this.currentLine
    this.initialHorizontalSpan = this.currentHorizontalSpan
    this.initialVerticalSpan = this.currentVerticalSpan
    if (this.pointerPanZooms.size === 0) {
      this.initialPanZoomScaleFactor = 1.0
      this.initialPanZoomRotationFactor = 0.0
    } else {
      this.initialPanZoomScaleFactor = this.scaleFactor / this.pointerScaleFactor
      this.initialPanZoomRotationFactor = Array.from(this.pointerPanZooms.values()).map(x => x.rotation).reduce((a, b) => a + b, 0)
    }
    if (this.state === ScaleState.Started) {
      if (this.onEnd !== null) {
        const tracker = this.velocityTrackers.get(pointer) ?? null
        invariant(tracker !== null)
        let velocity = tracker.getVelocity()
        if (isFlingGesture(velocity)) {
          const pixelsPerSecond = velocity.pixelsPerSecond

          if (pixelsPerSecond.distanceSquared > At.kMaxFlingVelocity * At.kMaxFlingVelocity) {
            velocity = AtVelocity.create(pixelsPerSecond.divide(pixelsPerSecond.distance).multiply(At.kMaxFlingVelocity))
          }

          this.invokeCallback<void>('onEnd', () => {
            invariant(this.onEnd !== null)
            this.onEnd({
              velocity,
              scaleVelocity: this.scaleVelocityTracker?.getVelocity().pixelsPerSecond.dx ?? -1,
              pointerCount: this.pointerCount 
            })
          })
        } else {
          this.invokeCallback<void>('onEnd', () => {
            invariant(this.onEnd !== null)
            this.onEnd({
              scaleVelocity: this.scaleVelocityTracker?.getVelocity().pixelsPerSecond.dx ?? -1,
              pointerCount: this.pointerCount
            })
          })
        }
      }
      
      this.state = ScaleState.Accepted
      this.scaleVelocityTracker = AtVelocityTracker.withKind(PointerDeviceKind.Touch)
      return false
    }
    this.scaleVelocityTracker = AtVelocityTracker.withKind(PointerDeviceKind.Touch)
    return true
  }

  advanceStateMachine (shouldStartIfAccepted: boolean, event: AtPointerEvent) {
    if (this.state === ScaleState.Ready) {
      this.state = ScaleState.Possible
    }

    if (this.state === ScaleState.Possible) {
      invariant(this.currentSpan !== null)
      invariant(this.initialSpan !== null)
      invariant(this.initialFocalPoint !== null)
      invariant(this.currentFocalPoint !== null)

      const spanDelta = Math.abs(this.currentSpan - this.initialSpan)
      const focalPointDelta = this.currentFocalPoint.subtract(this.initialFocalPoint).distance
      
      if (
        spanDelta > computeScaleSlop(event.kind) ||
        focalPointDelta > computePanSlop(event.kind, this.settings) ||
        Math.max(this.scaleFactor / this.pointerScaleFactor, this.pointerScaleFactor / this.scaleFactor) > 1.05
      ) {
        this.resolve(GestureDisposition.Accepted)
      }

    } else if (this.state >= ScaleState.Accepted) {
      this.resolve(GestureDisposition.Accepted)
    }

    if (this.state === ScaleState.Accepted && shouldStartIfAccepted) {
      this.state = ScaleState.Started
      this.dispatchOnStartCallbackIfNeeded()
    }

    if (this.state == ScaleState.Started) {
      this.scaleVelocityTracker?.addPosition(event.timeStamp, new Offset(this.scaleFactor, 0))
      
      if (this.onUpdate !== null) {
        this.invokeCallback<void>('onUpdate', () => {
          invariant(this.onUpdate !== null)
          this.onUpdate({
            scale: this.scaleFactor,
            horizontalScale: this.horizontalScaleFactor,
            verticalScale: this.verticalScaleFactor,
            focalPoint: this.currentFocalPoint,
            localFocalPoint: this.localFocalPoint,
            rotation: this.computeRotationFactor(),
            pointerCount: this.pointerCount,
            focalPointDelta: this.delta,
          })
        })
      }
    }
  }

  dispatchOnStartCallbackIfNeeded () {
    invariant(this.state === ScaleState.Started)
    if (this.onStart !== null) {
      this.invokeCallback<void>('onStart', () => {
        invariant(this.onStart !== null)
        this.onStart({
          focalPoint: this.currentFocalPoint,
          localFocalPoint: this.localFocalPoint,
          pointerCount: this.pointerCount,
        })
      })
    }
  }

  accept (pointer: number) {
    if (this.state === ScaleState.Possible) {
      this.state = ScaleState.Started
      this.dispatchOnStartCallbackIfNeeded()

      if (this.dragStartBehavior === DragStartBehavior.Start) {
        this.initialFocalPoint = this.currentFocalPoint
        this.initialSpan = this.currentSpan
        this.initialLine = this.currentLine
        this.initialHorizontalSpan = this.currentHorizontalSpan
        this.initialVerticalSpan = this.currentVerticalSpan

        if (this.pointerPanZooms.size === 0) {
          this.initialPanZoomScaleFactor = 1.0
          this.initialPanZoomRotationFactor = 0.0
        } else {
          this.initialPanZoomScaleFactor = this.scaleFactor / this.pointerScaleFactor
          this.initialPanZoomRotationFactor = Array.from(this.pointerPanZooms.values()).map(x => x.rotation).reduce((a, b) => a + b)
        }
      }
    }
  }

  
  reject (pointer: number) {
    this.pointerPanZooms.delete(pointer)
    this.pointerLocations.delete(pointer)
    const index = this.pointerQueue.indexOf(pointer)
    if (index > -1) {
      this.pointerQueue.splice(index, 1)
    }
    this.stopTrackingPointer(pointer)
  }

  didStopTrackingLastPointer (pointer: number) {
    switch (this.state) {
      case ScaleState.Possible:
        this.resolve(GestureDisposition.Rejected)
        break
      case ScaleState.Ready:
        break
      case ScaleState.Accepted:
        break
      case ScaleState.Started:
        break
    }
    
    this.state = ScaleState.Ready
  }

  dispose () {
    this.velocityTrackers.clear()
    super.dispose()
  }
}
