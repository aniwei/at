import invariant from '@at/utils'
import { Matrix4 } from '../basic/matrix4'
import { AtPointerEvent } from './events'

type PointerRoute = (event: AtPointerEvent) => void

export enum PointerDeviceKind {
  Touch,
  Mouse,
  Stylus,
  InvertedStylus,
  Unknown
}

export enum PointerChange {
  Add,
  Cancel,
  Down,
  Hover,
  Move,
  Remove,
  Scroll,
  Signal,
  Up,
  PanStart,
  PanUpdate,
  PanEnd
}

export enum PointerSignalKind {
  None,
  Scroll,
  Unknown
}

export class AtPointerState {
  static pointerCount = 0

  public x: number
  public y: number
  public pointer: number | null = null

  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }
  
  startNewPointer () {
    AtPointerState.pointerCount += 1
    this.pointer = AtPointerState.pointerCount
  }
}

export class AtGlobalPointerRouter {
  public routes: Map<PointerRoute, Matrix4 | null> = new Map()

  use (route: PointerRoute, transform: Matrix4 | null) {
    this.routes.set(route, transform as Matrix4)
  }

  remove (route: PointerRoute) {
    this.routes?.delete(route)
  }
}

export class AtPointerRouter {
  static create () {
    return new AtPointerRouter()
  }

  private routes: Map<number, Map<PointerRoute, Matrix4 | null>> = new Map()
  private global: AtGlobalPointerRouter = new AtGlobalPointerRouter()

  private putIfAbsent (pointer: number) {
    if (!this.routes.has(pointer)) {
      this.routes.set(pointer, new Map())
    }

    return this.routes.get(pointer)
  }
  
  use (pointer: number, route: PointerRoute, transform: Matrix4 | null) {
    const routes = this.putIfAbsent(pointer) as Map<PointerRoute, Matrix4 | null>
    routes.set(route, transform as Matrix4)
  }

  remove (pointer: number, route: PointerRoute) {
    invariant(this.routes.has(pointer))
    const routes = this.routes.get(pointer)
    
    routes?.delete(route)
    if (routes?.size === 0) {
      this.routes.delete(pointer)
    }
  }

  route (event: AtPointerEvent) {
    const routes = this.routes.get(event.pointer) ?? null
    
    if (routes !== null) {
      invariant(routes)
      this.dispatchEventToRoutes(event, routes)
    }

    this.dispatchEventToRoutes(event, this.global.routes)
  }
  
  private dispatch (event: AtPointerEvent, route: PointerRoute, transform: Matrix4 | null = null) {
    try {
      event = event.transformed(transform)
      route(event)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.stack}`)
    }
  }

  private dispatchEventToRoutes(
    event: AtPointerEvent,
    reference: Map<PointerRoute, Matrix4 | null>
  ) {

    // TODO
    reference.forEach((transform: Matrix4 | null, route: PointerRoute) => this.dispatch(event, route, transform))
  }
}


export type AtPointerDataOptions = {
  embedderId?: number
  timeStamp?: number
  change?: PointerChange
  kind?: PointerDeviceKind
  signalKind: PointerSignalKind
  device?: number
  pointerIdentifier?: number
  physicalX?: number
  physicalY?: number
  physicalDeltaX?: number
  physicalDeltaY?: number
  buttons?: number
  obscured?: boolean
  synthesized?: boolean
  pressure?: number
  pressureMin?: number
  pressureMax?: number
  distance?: number
  distanceMax?: number
  size?: number
  radiusMajor?: number
  radiusMinor?: number
  radiusMin?: number
  radiusMax?: number
  orientation?: number
  tilt?: number
  platform?: number
  scrollDeltaX?: number
  scrollDeltaY?: number
}

export class AtPointerData {
  static create (options: AtPointerDataOptions) {
    return new AtPointerData(
      options.signalKind,
      options.embedderId,
      options.timeStamp,
      options.change,
      options.kind,
      options.device,
      options.pointerIdentifier,
      options.physicalX,
      options.physicalY,
      options.physicalDeltaX,
      options.physicalDeltaY,
      options.buttons,
      options.obscured,
      options.synthesized,
      options.pressure,
      options.pressureMin,
      options.pressureMax,
      options.distance,
      options.distanceMax,
      options.size,
      options.radiusMajor,
      options.radiusMinor,
      options.radiusMin,
      options.radiusMax,
      options.orientation,
      options.tilt,
      options.platform,
      options.scrollDeltaX,
      options.scrollDeltaY,
    )
  }

  public embedderId: number
  public timeStamp: number
  public change: PointerChange
  public kind: PointerDeviceKind
  public signalKind: PointerSignalKind
  public device: number
  public pointerIdentifier: number
  public physicalX: number
  public physicalY: number
  public physicalDeltaX: number
  public physicalDeltaY: number
  public buttons: number
  public obscured: boolean
  public synthesized: boolean
  public pressure: number
  public pressureMin: number
  public pressureMax: number
  public distance: number
  public distanceMax: number
  public size: number
  public radiusMajor: number
  public radiusMinor: number
  public radiusMin: number
  public radiusMax: number
  public orientation: number
  public tilt: number
  public platform: number
  public scrollDeltaX: number
  public scrollDeltaY: number

  constructor (
    signalKind: PointerSignalKind,
    embedderId: number = 0,
    timeStamp: number = 0,
    change: PointerChange = PointerChange.Cancel,
    kind: PointerDeviceKind = PointerDeviceKind.Touch,
    device: number = 0,
    pointerIdentifier: number = 0,
    physicalX: number = 0.0,
    physicalY: number = 0.0,
    physicalDeltaX: number = 0.0,
    physicalDeltaY: number = 0.0,
    buttons: number = 0,
    obscured: boolean = false,
    synthesized: boolean = false,
    pressure: number = 0.0,
    pressureMin: number = 0.0,
    pressureMax: number = 0.0,
    distance: number = 0.0,
    distanceMax: number = 0.0,
    size: number = 0.0,
    radiusMajor: number = 0.0,
    radiusMinor: number = 0.0,
    radiusMin: number = 0.0,
    radiusMax: number = 0.0,
    orientation: number = 0.0,
    tilt: number = 0.0,
    platform: number = 0,
    scrollDeltaX: number = 0.0,
    scrollDeltaY: number = 0.0,
  ) {
    this.embedderId = embedderId
    this.timeStamp = timeStamp
    this.change = change
    this.kind = kind
    this.signalKind = signalKind
    this.device = device
    this.pointerIdentifier = pointerIdentifier
    this.physicalX = physicalX
    this.physicalY = physicalY
    this.physicalDeltaX = physicalDeltaX
    this.physicalDeltaY = physicalDeltaY
    this.buttons = buttons
    this.obscured = obscured
    this.synthesized = synthesized
    this.pressure = pressure
    this.pressureMin = pressureMin
    this.pressureMax = pressureMax
    this.distance = distance
    this.distanceMax = distanceMax
    this.size = size
    this.radiusMajor = radiusMajor
    this.radiusMinor = radiusMinor
    this.radiusMin = radiusMin
    this.radiusMax = radiusMax
    this.orientation = orientation
    this.tilt = tilt
    this.platform = platform
    this.scrollDeltaX = scrollDeltaX
    this.scrollDeltaY = scrollDeltaY
  }

  toString () {
    return `PointerData(x: ${this.physicalX}, y: ${this.physicalY})`
  }
}

export class AtPointerPacket {
  static create (data: AtPointerData[]) {
    return new AtPointerPacket(data)
  }

  public data: AtPointerData[]

  constructor (data: AtPointerData[] = []) {
    invariant(data !== null)
    this.data = data
  }
}

export class AtPointerDataConverter {
  static create () {
    return new AtPointerDataConverter()
  }

  private pointers: Map<number, AtPointerState> = new Map()
  private activeButtons = 0

  /**
   * 
   * @param {number} device 
   * @param {number} x 
   * @param {number} y 
   * @returns 
   */
  private ensureStateForPointer (device: number, x: number, y: number) {
    if (this.pointers.has(device)) {
      return this.pointers.get(device) as AtPointerState
    }
    const state = new AtPointerState(x, y)
    this.pointers.set(device, state)

    return state
  }

  clearPointerState () {
    this.pointers.clear()
    this.activeButtons = 0

    AtPointerState.pointerCount = 0
  }

  generateCompletePointerData(
    timeStamp: number,
    change: PointerChange,
    kind: PointerDeviceKind,
    signalKind: PointerSignalKind,
    device: number,
    physicalX: number,
    physicalY: number,
    buttons: number,
    obscured: boolean,
    pressure: number,
    pressureMin: number,
    pressureMax: number,
    distance: number,
    distanceMax: number,
    size: number,
    radiusMajor: number,
    radiusMinor: number,
    radiusMin: number,
    radiusMax: number,
    orientation: number,
    tilt: number,
    platform: number,
    scrollDeltaX: number,
    scrollDeltaY: number,
  ) {
    invariant(this.pointers.has(device))
    const state = this.pointers.get(device) as AtPointerState
    const deltaX = physicalX - state.x
    const deltaY = physicalY - state.y
    state.x = physicalX
    state.y = physicalY
    return AtPointerData.create({
      physicalDeltaX: deltaX,
      physicalDeltaY: deltaY,
      pointerIdentifier: state.pointer ?? 0,
      timeStamp,
      change,
      kind,
      signalKind,
      device,
      physicalX,
      physicalY,
      buttons,
      obscured,
      pressure,
      pressureMin,
      pressureMax,
      distance,
      distanceMax,
      size,
      radiusMajor,
      radiusMinor,
      radiusMin,
      radiusMax,
      orientation,
      tilt,
      platform,
      scrollDeltaX,
      scrollDeltaY,
    })
  }

  locationHasChanged (device: number, physicalX: number, physicalY: number): boolean {
    invariant(this.pointers.has(device))
    const state = this.pointers.get(device) as AtPointerState
    return state.x !== physicalX || state.y !== physicalY
  }

  synthesizePointerData (
    timeStamp: number,
    change: PointerChange,
    kind: PointerDeviceKind,
    device: number,
    physicalX: number,
    physicalY: number,
    buttons: number,
    obscured: boolean,
    pressure: number,
    pressureMin: number,
    pressureMax: number,
    distance: number,
    distanceMax: number,
    size: number,
    radiusMajor: number,
    radiusMinor: number,
    radiusMin: number,
    radiusMax: number,
    orientation: number,
    tilt: number,
    platform: number,
    scrollDeltaX: number,
    scrollDeltaY: number,
  ) {
    invariant(this.pointers.has(device))
    const state = this.pointers.get(device) as AtPointerState
    const deltaX = physicalX - state.x
    const deltaY = physicalY - state.y
    state.x = physicalX
    state.y = physicalY
    return AtPointerData.create({
      physicalDeltaX: deltaX,
      physicalDeltaY: deltaY,
      synthesized: true,
      signalKind: PointerSignalKind.None,
      pointerIdentifier: state.pointer ?? 0,
      timeStamp,
      change,
      kind,
      device,
      physicalX,
      physicalY,
      buttons,
      obscured,
      pressure,
      pressureMin,
      pressureMax,
      distance,
      distanceMax,
      size,
      radiusMajor,
      radiusMinor,
      radiusMin,
      radiusMax,
      orientation,
      tilt,
      platform,
      scrollDeltaX,
      scrollDeltaY,
    })
  }

  convert (
    timeStamp: number = 0,
    change: PointerChange = PointerChange.Cancel,
    kind: PointerDeviceKind = PointerDeviceKind.Touch,
    signalKind: PointerSignalKind,
    device: number = 0,
    physicalX: number = 0.0,
    physicalY: number = 0.0,
    buttons: number = 0,
    obscured: boolean = false,
    pressure: number = 0.0,
    pressureMin: number = 0.0,
    pressureMax: number = 0.0,
    distance: number = 0.0,
    distanceMax: number = 0.0,
    size: number = 0.0,
    radiusMajor: number = 0.0,
    radiusMinor: number = 0.0,
    radiusMin: number = 0.0,
    radiusMax: number = 0.0,
    orientation: number = 0.0,
    tilt: number = 0.0,
    platform: number = 0,
    scrollDeltaX: number = 0.0,
    scrollDeltaY: number = 0.0,
  ): AtPointerData[] {
    const result: AtPointerData[] = []
    const isDown = buttons !== 0
    invariant(change !== null)
    if (signalKind === null || signalKind === PointerSignalKind.None) {
      switch (change) {
        case PointerChange.Add: 
          invariant(!this.pointers.has(device))
          this.ensureStateForPointer(device, physicalX, physicalY)
          invariant(!this.locationHasChanged(device, physicalX, physicalY))
          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            physicalX,
            physicalY,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          break
        case PointerChange.Hover:
          const alreadyAdded = this.pointers.has(device)
          this.ensureStateForPointer(device, physicalX, physicalY)
          invariant(!isDown)
          if (!alreadyAdded) {
            result.push(this.synthesizePointerData(
              timeStamp,
              PointerChange.Add,
              kind,
              device,
              physicalX,
              physicalY,
              buttons,
              obscured,
              pressure,
              pressureMin,
              pressureMax,
              distance,
              distanceMax,
              size,
              radiusMajor,
              radiusMinor,
              radiusMin,
              radiusMax,
              orientation,
              tilt,
              platform,
              scrollDeltaX,
              scrollDeltaY,
            ))
          }
          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            physicalX,
            physicalY,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          this.activeButtons = buttons
          break
        case PointerChange.Down: {

          const alreadyAdded = this.pointers.has(device)
          const state = this.ensureStateForPointer(device, physicalX, physicalY)
          invariant(isDown)
          state.startNewPointer()
          if (!alreadyAdded) {
            result.push(this.synthesizePointerData(
              timeStamp,
              PointerChange.Add,
              kind,
              device,
              physicalX,
              physicalY,
              buttons,
              obscured,
              pressure,
              pressureMin,
              pressureMax,
              distance,
              distanceMax,
              size,
              radiusMajor,
              radiusMinor,
              radiusMin,
              radiusMax,
              orientation,
              tilt,
              platform,
              scrollDeltaX,
              scrollDeltaY,
            ))
          }

          if (this.locationHasChanged(device, physicalX, physicalY)) {
            invariant(alreadyAdded)
            
            result.push(this.synthesizePointerData(
              timeStamp,
              PointerChange.Hover,
              kind,
              device,
              physicalX,
              physicalY,
              0,
              obscured,
              0.0,
              pressureMin,
              pressureMax,
              distance,
              distanceMax,
              size,
              radiusMajor,
              radiusMinor,
              radiusMin,
              radiusMax,
              orientation,
              tilt,
              platform,
              scrollDeltaX,
              scrollDeltaY
            ))
          }

          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            physicalX,
            physicalY,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          this.activeButtons = buttons
          break
        }
        case PointerChange.Move: {

          invariant(this.pointers.has(device))
          invariant(isDown)
          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            physicalX,
            physicalY,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          this.activeButtons = buttons
          break
        }
        case PointerChange.Up:
        case PointerChange.Cancel: {
          invariant(this.pointers.has(device))
          const state = this.pointers.get(device) as AtPointerState
          invariant(!isDown)
          
          if (change === PointerChange.Cancel) {
            physicalX = state.x
            physicalY = state.y
          }

          if (this.locationHasChanged(device, physicalX, physicalY)) {
            result.push(this.synthesizePointerData(
              timeStamp,
              PointerChange.Move,
              kind,
              device,
              physicalX,
              physicalY,
              this.activeButtons,
              obscured,
              pressure,
              pressureMin,
              pressureMax,
              distance,
              distanceMax,
              size,
              radiusMajor,
              radiusMinor,
              radiusMin,
              radiusMax,
              orientation,
              tilt,
              platform,
              scrollDeltaX,
              scrollDeltaY,
            ))
          }

          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            physicalX,
            physicalY,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          if (kind === PointerDeviceKind.Touch) {
            result.push(this.synthesizePointerData(
              timeStamp,
              PointerChange.Remove,
              kind,
              device,
              physicalX,
              physicalY,
              0,
              obscured,
              0.0,
              pressureMin,
              pressureMax,
              distance,
              distanceMax,
              size,
              radiusMajor,
              radiusMinor,
              radiusMin,
              radiusMax,
              orientation,
              tilt,
              platform,
              scrollDeltaX,
              scrollDeltaY,
            ))
            this.pointers.delete(device)
          }
          break
        }
        case PointerChange.Remove:
          invariant(this.pointers.has(device))
          const state = this.pointers.get(device) as AtPointerState
          
          invariant(!isDown)
          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            state.x,
            state.y,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          this.pointers.delete(device)
          break
      }
    } else {
      switch (signalKind) {
        case PointerSignalKind.Scroll:
          const alreadyAdded = this.pointers.has(device)
          this.ensureStateForPointer(device, physicalX, physicalY)
          if (!alreadyAdded) {
            result.push(this.synthesizePointerData(
              timeStamp,
              PointerChange.Add,
              kind,
              device,
              physicalX,
              physicalY,
              buttons,
              obscured,
              pressure,
              pressureMin,
              pressureMax,
              distance,
              distanceMax,
              size,
              radiusMajor,
              radiusMinor,
              radiusMin,
              radiusMax,
              orientation,
              tilt,
              platform,
              scrollDeltaX,
              scrollDeltaY,
            ))
          }
          if (this.locationHasChanged(device, physicalX, physicalY)) {
            if (isDown) {
              result.push(this.synthesizePointerData(
                timeStamp,
                PointerChange.Move,
                kind,
                device,
                physicalX,
                physicalY,
                buttons,
                obscured,
                pressure,
                pressureMin,
                pressureMax,
                distance,
                distanceMax,
                size,
                radiusMajor,
                radiusMinor,
                radiusMin,
                radiusMax,
                orientation,
                tilt,
                platform,
                scrollDeltaX,
                scrollDeltaY,
              ))
            } else {
              result.push(this.synthesizePointerData(
                timeStamp,
                PointerChange.Hover,
                kind,
                device,
                physicalX,
                physicalY,
                buttons,
                obscured,
                pressure,
                pressureMin,
                pressureMax,
                distance,
                distanceMax,
                size,
                radiusMajor,
                radiusMinor,
                radiusMin,
                radiusMax,
                orientation,
                tilt,
                platform,
                scrollDeltaX,
                scrollDeltaY,
              ))
            }
          }

          result.push(this.generateCompletePointerData(
            timeStamp,
            change,
            kind,
            signalKind,
            device,
            physicalX,
            physicalY,
            buttons,
            obscured,
            pressure,
            pressureMin,
            pressureMax,
            distance,
            distanceMax,
            size,
            radiusMajor,
            radiusMinor,
            radiusMin,
            radiusMax,
            orientation,
            tilt,
            platform,
            scrollDeltaX,
            scrollDeltaY,
          ))
          break
        case PointerSignalKind.None | PointerSignalKind.Unknown:
          break
      }
    }

    return result
  }
}