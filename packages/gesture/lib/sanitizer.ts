
import { invariant } from '@at/utils'
import { Matrix4, Vector3 } from '@at/math'
import { Offset } from '@at/geometry'

//// => common 
export enum PointerChangeKind {
  Signal,
  Added,
  Cancel,
  Down,
  Hover,
  Move,
  Up,
  Removed,
  Enter,
  Exit,
}

export enum PointerDeviceKind {
  Touch,
  Mouse,
  Stylus,
  InvertedStylus,
  Unknown
}

export enum PointerEventButtonKind {
  Primary = 1,
  Secondary = 2,
  Tertiary = 4
}

export function toDeviceKind (type: string) {
  switch (type) {
    case 'mouse':
      return PointerDeviceKind.Mouse

    case 'pen':
      return PointerDeviceKind.Stylus

    case 'touch':
      return PointerDeviceKind.Touch

    default:
      return PointerDeviceKind.Unknown
  }
}

//// => PointerState
// pointer 状态
export class PointerState {
  static count: number = 0

  static create (x: number, y: number, devicePixelRatio: number = 2.0) {
    return new PointerState(x, y, devicePixelRatio)
  }

  // => id
  protected _id: number | null = null
  public get id () {
    invariant(this._id, 'The "id" cannot be null.')
    return this._id
  }
  public set id (id: number) {
    this._id = id
  }

  // => physicalX
  public get physicalX () {
    return this.x * this.devicePixelRatio
  }

  // => physicalX
  public get physicalY () {
    return this.y * this.devicePixelRatio
  }

  public x: number
  public y: number
  public devicePixelRatio: number = 2.0

  constructor (x: number, y: number, devicePixelRatio: number = 2.0) {
    this.x = x
    this.y = y
    this.devicePixelRatio = devicePixelRatio
  }

  locationHasChanged (x: number, y: number): boolean {
    return this.x !== x || this.y !== y
  }
  
  start () {
    PointerState.count += 1
    this.id = PointerState.count
  }
}

//// => PointerStateManager
export class PointerStateManager {
  static create () {
    return new PointerStateManager()
  }

  protected states: Map<number, PointerState> = new Map()

  ensure (device: number, x: number, y: number, devicePixelRatio: number = 2.0) {
    let state = this.states.get(device) ?? null

    if (state === null) {
      state = PointerState.create(x, y, devicePixelRatio)
      this.states.set(device, state)
    }

    return state
  }

  delete (device: number) {
    return this.states.delete(device)
  }

  has (device: number) {
    return this.states.has(device)
  }

  get (device: number) {
    return this.states.get(device)
  }
}


export interface SanitizedEvent {
  id: number
  kind: PointerDeviceKind,
  device: number,
  change: PointerChangeKind,
  buttons: number,
  down: boolean,
  x: number,
  y: number,
  physicalX: number,
  physicalY: number,
  deltaX: number,
  deltaY: number,
  physicalDeltaX: number,
  physicalDeltaY: number,
  synthesized: boolean,
  timeStamp: number
}

export class SanitizedPointerEvent {
  static create (event: SanitizedEvent, transform: Matrix4 | null = null) {
    const position = Offset.create(event.x, event.y)
    const delta = Offset.create(event.deltaX, event.deltaY)
    const physicalPosition = Offset.create(event.physicalX, event.physicalY)
    const physicalDelta = Offset.create(event.physicalDeltaX, event.physicalDeltaY)

    return new SanitizedPointerEvent(
      event.id,
      event.timeStamp,
      event.change,
      transform,
      null,
      event.kind,
      event.device,
      position,
      delta,
      physicalPosition,
      physicalDelta,
      event.synthesized,
      event.buttons,
      event.down,
    )
  }

  static removePerspectiveTransform (transform: Matrix4) {
    const vector = Vector3.create(0.0, 0.0, 1.0)
    
    const cloned = transform.clone()
    cloned.column(2, vector)
    cloned.row(2, vector)

    return cloned
  }

  static transformPosition (transform: Matrix4 | null = null, position: Offset) {
    if (transform == null) {
      return position
    }
    const position3 = Vector3.create(position.dx, position.dy, 0.0)
    const transformed3 = transform.perspectiveTransform(position3)
    return Offset.create(transformed3.x, transformed3.y)
  }

  static transformDeltaViaPositions(
    untransformedEndPosition: Offset ,
    transformedEndPosition: Offset | null = null,
    untransformedDelta: Offset,
    transform: Matrix4 | null = null,
  ) {
    if (transform === null) {
      return untransformedDelta
    }
   
    transformedEndPosition ??= SanitizedPointerEvent.transformPosition(transform, untransformedEndPosition)
    const transformedStartPosition = SanitizedPointerEvent.transformPosition(transform, untransformedEndPosition.subtract(untransformedDelta))
    return transformedEndPosition.subtract(transformedStartPosition)
  }

  // => localPosition
  public get localPosition () {
    return this.position
  }

  // => localDelta
  public get localDelta () {
    return this.delta
  }

  public get localPhysicalPosition () {
    return this.physicalPosition
  }

  public get localPhysicalDelta () {
    return this.physicalDelta
  }

  public id: number
  public timeStamp: number
  public change: PointerChangeKind
  
  public kind: PointerDeviceKind
  public device: number
  public buttons: number

  public delta: Offset
  public position: Offset
  public physicalDelta: Offset
  public physicalPosition: Offset
  public transform: Matrix4 | null
  public origin: SanitizedPointerEvent | null
  public synthesized: boolean
  public down: boolean

  constructor (
    id: number,
    timeStamp: number,
    change: PointerChangeKind,
    transform: Matrix4 | null = null,
    origin: SanitizedPointerEvent | null = null,
    kind: PointerDeviceKind = PointerDeviceKind.Touch,
    device: number = 0,
    position: Offset = Offset.ZERO,
    delta: Offset = Offset.ZERO,
    physicalPosition: Offset,
    physicalDelta: Offset,
    synthesized: boolean = false,
    buttons: number = 0,
    down: boolean = false
  ) {
    this.id = id
    this.timeStamp = timeStamp
    this.change = change
    this.transform = transform
    this.origin = origin
    this.kind = kind
    this.device = device
    this.position = position
    this.delta = delta
    this.physicalPosition = physicalPosition
    this.physicalDelta = physicalDelta
    this.synthesized = synthesized
    this.buttons = buttons
    this.down = down
  }

  transformed (transform: Matrix4 | null): SanitizedPointerEvent {
    if (transform === null || transform.equal(this.transform)) {
      return this
    }

    const event = this.origin ?? this

    return SanitizedPointerEvent.create({
      id: event.id,
      timeStamp: event.timeStamp,
      kind: event.kind,
      device: event.device,
      change: event.change,
      buttons: event.buttons,
      x: event.position.dx,
      y: event.position.dy,
      deltaX: event.delta.dx,
      deltaY: event.delta.dy,
      physicalDeltaX: event.physicalDelta.dx,
      physicalDeltaY: event.physicalDelta.dy,
      physicalX: event.physicalPosition.dx,
      physicalY: event.physicalPosition.dy,
      synthesized: event.synthesized,
      down: event.down,
    }, transform)
  }

  copyWith (

  ) {

  }
}
export interface SanitizedDetail {
  change: PointerChangeKind,
  buttons: number
}

export class PointerSanitizer {
  static create () {
    return new PointerSanitizer()
  }

  protected pressedButtons: number = 0

  sanitizeMissingMouseUp (event: PointerEvent) {
    const buttons = event.buttons
    if (this.pressedButtons !== 0 && buttons === 0) {
      this.pressedButtons = 0
      return { 
        change: PointerChangeKind.Up, 
        buttons: this.pressedButtons
      }
    }

    return null
  }

  sanitizeDownEvent (event: PointerEvent) {
    const { button, buttons } = event

    if (this.pressedButtons !== 0) {
      return this.sanitizeMoveEvent(event)
    }

    if (buttons === 0 && button > -1) {
      if (button === 0) {
        this.pressedButtons = 1
      } else if (button === 1) {
        this.pressedButtons = 4
      } else if (button === 2) {
        this.pressedButtons = 2
      }
    } else {
      this.pressedButtons = buttons
    }

    return {
      change: PointerChangeKind.Down,
      buttons: this.pressedButtons,
    }
  }

  sanitizeMoveEvent (event: PointerEvent) {
    const buttons = event.buttons
    
    if (this.pressedButtons === 0 && buttons !== 0) {
      return {
        change: PointerChangeKind.Hover,
        buttons: this.pressedButtons,
      }
    }

    this.pressedButtons = buttons

    return {
      change: this.pressedButtons === 0
        ? PointerChangeKind.Hover
        : PointerChangeKind.Move,
      buttons: this.pressedButtons,
    }
  }

  sanitizeUpEvent (event: PointerEvent) {
    if (this.pressedButtons === 0) {
      return null
    }

    this.pressedButtons = event.buttons

    return {
      change: this.pressedButtons === 0 
        ? PointerChangeKind.Up
        : PointerChangeKind.Move, 
      buttons: this.pressedButtons
    }
  }
}

export class PointerSanitizerManager {
  static create () {
    return new PointerSanitizerManager()
  }

  protected sanitizers: Map<number, PointerSanitizer> = new Map()

  ensure (device: number) {
    let sanitizer = this.sanitizers.get(device) ?? null

    if (sanitizer === null) {
      sanitizer = PointerSanitizer.create()
      this.sanitizers.set(device, sanitizer)
    }

    return sanitizer
  }

  has (device: number) {
    return this.sanitizers.has(device)
  }

  delete (device: number) {
    return this.sanitizers.delete(device)
  }
}

export class PointerEventSanitizer {
  static create (devicePixelRatio: number) {
    return new PointerEventSanitizer(devicePixelRatio)
  }

  protected devicePixelRatio: number = 2.0
  // pointer 状态
  protected states: PointerStateManager = PointerStateManager.create()
  protected sanitizers: PointerSanitizerManager = PointerSanitizerManager.create()
  protected activeButtons: number = 0

  constructor (devicePixelRatio: number) {
    this.devicePixelRatio = devicePixelRatio
  }

  synthesize (
    timeStamp: number,
    kind: PointerDeviceKind,
    device: number,
    change: PointerChangeKind,
    physicalX: number = 0.0,
    physicalY: number = 0.0,
    buttons: number
  ) {
    return this.generate(
      timeStamp,
      kind,
      device,
      change,
      physicalX,
      physicalY,
      buttons,
      true,
    )
  }

  generate (
    timeStamp: number,
    kind: PointerDeviceKind,
    device: number,
    change: PointerChangeKind,
    x: number,
    y: number,
    buttons: number = 0,
    down: boolean = false,
    synthesized: boolean = false,
  ) {
    invariant(this.states.has(device), 'Cannot generate before the state has not add.')
    const state = this.states.get(device) as PointerState
    const deltaX = x - state.x
    const deltaY = y - state.y
    state.x = x
    state.y = y

    return SanitizedPointerEvent.create({
      id: state.id,
      timeStamp,
      x: state.x,
      y: state.y,
      physicalX: state.physicalX,
      physicalY: state.physicalY,
      deltaX,
      deltaY,
      physicalDeltaX: deltaX * this.devicePixelRatio,
      physicalDeltaY: deltaY * this.devicePixelRatio,
      change,
      kind,
      device,
      buttons,
      down,
      synthesized
    })
  }

  transform (
    event: PointerEvent, 
    kind: PointerDeviceKind,
    device: number, 
    sanitized: SanitizedDetail
  ) {
    const timeStamp = event.timeStamp
    const change = sanitized.change
    const buttons = sanitized.buttons

    let x = event.x
    let y = event.y
    
    const events: SanitizedPointerEvent[] = []

    switch (change) {
      case PointerChangeKind.Added: {
        invariant(!this.states.has(device), `Cannot add a pointer state which has added.`)
        const state = this.states.ensure(device, x, y, this.devicePixelRatio)
        invariant(!state.locationHasChanged(x, y), `Cannot add a pointer state which has location changed.`)

        const event = this.generate(
          timeStamp,
          kind,
          device,
          change,
          x,
          y,
          buttons
        )

        events.push(event)
        break
      }

      case PointerChangeKind.Hover: {
        const alreadyAdded = this.states.has(device)
        const state = this.states.ensure(device, x, y, this.devicePixelRatio)
        state.start()
        if (!alreadyAdded) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Added,
            x,
            y,
            buttons
          ))
        }

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          x,
          y,
          buttons
        ))

        this.activeButtons = buttons
        break
      }

      case PointerChangeKind.Down: {
        const alreadyAdded = this.states.has(device)
        const state = this.states.ensure(device, x, y, this.devicePixelRatio)
        state.start()

        if (!alreadyAdded) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Added,
            x,
            y,
            buttons,
          ))
        }

        if (state.locationHasChanged(x, y)) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Hover,
            x,
            y,
            buttons
          ))
        }

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          x,
          y,
          buttons
        ))

        this.activeButtons = buttons
        break
      }

      case PointerChangeKind.Move: {
        invariant(this.states.has(device), `Cannot get a pointer state which has not added.`)
        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          x,
          y,
          buttons,
          true
        ))
        break
      }

      case PointerChangeKind.Cancel:
      case PointerChangeKind.Up: {
        invariant(this.states.has(device), `Cannot get a pointer state which has not added.`)
        const state = this.states.get(device) as PointerState
        if (change === PointerChangeKind.Cancel) {
          x = state.x
          y = state.y
        }

        if (state.locationHasChanged(x, y)) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Move,
            x,
            y,
            buttons
          ))
        }

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          x,
          y,
          buttons
        ))

        if (kind === PointerDeviceKind.Touch) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Removed,
            x,
            y,
            buttons
          ))
        }

        break
      }

      case PointerChangeKind.Removed: {
        invariant(this.states.has(device), 'Cannot get a pointer state which has not added.')          
        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          x,
          y,
          buttons,
        ))

        this.states.delete(device)
        break
      }
    }

    return events
  }

  sanitize (event: PointerEvent) {
    const kind = toDeviceKind(event.pointerType)
    const device = kind === PointerDeviceKind.Mouse 
      ? -1 
      : event.pointerId

    const sanitizer = this.sanitizers.ensure(device)
    const events: SanitizedPointerEvent[] = []

    switch (event.type) {
      case 'pointerdown': {
        // 处理右键
        const sanitizedUp = sanitizer.sanitizeMissingMouseUp(event)
        if (sanitizedUp !== null) {
          const results = this.transform(event, kind, device, sanitizedUp)
          
          for (const result of results) {
            events.push(result)
          }
        }

        const results = this.transform(event, kind, device, sanitizer.sanitizeDownEvent(event))

        for (const result of results) {
          events.push(result)
        }
        break
      }

      case 'pointermove': {
        const sanitizedUp = sanitizer.sanitizeMissingMouseUp(event)
        if (sanitizedUp !== null) {
          const results = this.transform(event, kind, device, sanitizedUp)
          
          for (const result of results) {
            events.push(result)
          }
        }

        const sanitizedMove = sanitizer.sanitizeMoveEvent(event)
        const results = this.transform(event, kind, device, sanitizedMove)
        for (const result of results) {
          events.push(result)
        }

        break
      }

      case 'pointerup': {
        const sanitizedUp = sanitizer.sanitizeUpEvent(event)
        if (event.pointerType === 'touch') {
          this.sanitizers.delete(device)
        }

        if (sanitizedUp !== null) {
          const results = this.transform(event, kind, device, sanitizedUp)
          for (const result of results) {
            events.push(result)
          }
        }

        break
      }
    }

    return events
  }
}