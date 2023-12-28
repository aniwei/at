
import { invariant } from '@at/utils'

//// => common 
export enum PointerChangeKind {
  Add,
  Cancel,
  Down,
  Hover,
  Move,
  Up,
  Remove
}

export enum PointerDeviceKind {
  Touch,
  Mouse,
  Stylus,
  InvertedStylus,
  Unknown
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

  static create (x: number, y: number) {
    return new PointerState(x, y)
  }

  public x: number
  public y: number
  public id: number | null = null

  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }

  locationHasChanged (physicalX: number, physicalY: number): boolean {
    return this.x !== physicalX || this.y !== physicalY
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

  ensure (device: number, x: number, y: number) {
    let state = this.states.get(device) ?? null

    if (state === null) {
      state = PointerState.create(x, y)
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
  kind: PointerDeviceKind,
  device: number,
  change: PointerChangeKind,
  buttons: number,
  physicalX: number,
  physicalY: number,
  physicalDeltaX: number,
  physicalDeltaY: number,
  synthesized: boolean,
  timeStamp: number
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

export abstract class PointerEventSanitizer {
  protected devicePixelRatio: number = 2.0

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
    const state = this.states.get(device) as PointerState
    const deltaX = physicalX - state.x
    const deltaY = physicalY - state.y
    state.x = physicalX
    state.y = physicalY

    return {
      id: state.id,
      timeStamp,
      physicalX,
      physicalY,
      physicalDeltaX: deltaX,
      physicalDeltaY: deltaY,
      change,
      kind,
      device,
      buttons,
      synthesized: true,
    }
  }

  generate (
    timeStamp: number,
    kind: PointerDeviceKind,
    device: number,
    change: PointerChangeKind,
    physicalX: number = 0.0,
    physicalY: number = 0.0,
    buttons: number
  ) {
    invariant(this.states.has(device), 'Cannot generate before the state has not add.')
    const state = this.states.get(device) as PointerState
    const deltaX = physicalX - state.x
    const deltaY = physicalY - state.y
    state.x = physicalX
    state.y = physicalY

    return {
      timeStamp,
      physicalX,
      physicalY,
      physicalDeltaX: deltaX,
      physicalDeltaY: deltaY,
      change,
      kind,
      device,
      buttons,
      synthesized: true,
    }
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

    let physicalX = event.x * this.devicePixelRatio
    let physicalY = event.y * this.devicePixelRatio

    const events: SanitizedEvent[] = []

    switch (change) {
      case PointerChangeKind.Add: {
        invariant(!this.states.has(device), `Cannot add a pointer state which has added.`)
        const state = this.states.ensure(device, physicalX, physicalY)
        invariant(!state.locationHasChanged(physicalX, physicalY), `Cannot add a pointer state which has location changed.`)

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          physicalX,
          physicalY,
          buttons
        ))
        break
      }

      case PointerChangeKind.Hover: {
        const alreadyAdded = this.states.has(device)
        const state = this.states.ensure(device, physicalX, physicalY)
        state.start()
        if (!alreadyAdded) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Add,
            physicalX,
            physicalY,
            buttons
          ))
        }

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          physicalX,
          physicalY,
          buttons
        ))
        this.activeButtons = buttons
        break
      }

      case PointerChangeKind.Down: {
        const alreadyAdded = this.states.has(device)
        const state = this.states.ensure(device, physicalX, physicalY)
        state.start()

        if (!alreadyAdded) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Add,
            physicalX,
            physicalY,
            buttons,
          ))
        }

        if (state.locationHasChanged(physicalX, physicalY)) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Add,
            physicalX,
            physicalY,
            buttons
          ))
        }

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          PointerChangeKind.Add,
          physicalX,
          physicalY,
          buttons
        ))
        this.activeButtons = buttons
        break
      }

      case PointerChangeKind.Cancel:
      case PointerChangeKind.Up: {
        invariant(this.states.has(device), `Cannot get a pointer state which has not added.`)
        const state = this.states.get(device) as PointerState
        if (change === PointerChangeKind.Cancel) {
          physicalX = state.x
          physicalY = state.y
        }

        if (state.locationHasChanged(physicalX, physicalY)) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Move,
            physicalX,
            physicalY,
            buttons
          ))
        }

        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          physicalX,
          physicalY,
          buttons
        ))

        if (kind === PointerDeviceKind.Touch) {
          events.push(this.synthesize(
            timeStamp,
            kind,
            device,
            PointerChangeKind.Remove,
            physicalX,
            physicalY,
            buttons
          ))
        }

        break
      }

      case PointerChangeKind.Remove: {
        invariant(this.states.has(device), 'Cannot get a pointer state which has not added.')
        const state = this.states.get(device) as PointerState
          
        events.push(this.generate(
          timeStamp,
          kind,
          device,
          change,
          state.x,
          state.y,
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
    const events: SanitizedEvent[] = []

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