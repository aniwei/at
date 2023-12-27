
import { invariant } from '@at/utils'

//// => PointerState
// pointer 状态
export class PointerState {
  static count: number = 0

  static create (x: number, y: number) {
    return new PointerState(x, y)
  }

  public x: number
  public y: number
  public device: number | null = null

  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }

  locationHasChanged (physicalX: number, physicalY: number): boolean {
    return this.x !== physicalX || this.y !== physicalY
  }
  
  start () {
    PointerState.count += 1
    this.device = PointerState.count
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

export enum PointerChangeKind {
  Add,
  Cancel,
  Down,
  Hover,
  Move,
  Up
}


export interface SanitizedDetail {
  change: number,
  buttons: number,
  deltaX: number,
  deltaY: number,
  physicalDeltaX: number,
  physicalDeltaY: number,
  synthesized: boolean,
  timeStamp: number
}

export interface SanitizedResult {
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

  exist (device: number) {
    return this.sanitizers.has(device)
  }


}

export class PointerEventSanitizer {
  protected devicePixelRatio: number = 2.0

  protected states: PointerStateManager = PointerStateManager.create()
  protected sanitizers: PointerSanitizerManager = PointerSanitizerManager.create()
  
  protected activeButtons: number = 0

  constructor (devicePixelRatio: number) {
    this.devicePixelRatio = devicePixelRatio
  }

  sanitize (event: PointerEvent) {
    const timeStamp = event.timeStamp
    const buttons = event.buttons
    const device = event.pointerId
    const sanitizer = this.sanitizers.ensure(device)

    const physicalX = event.clientX * this.devicePixelRatio
    const physicalY = event.clientY * this.devicePixelRatio

    const details: SanitizedDetail[] = []

    switch (event.type) {
      case 'pointerdown': {
        // 处理右键
        const sanitizedUp = sanitizer.sanitizeMissingMouseUp(event)
        if (sanitizedUp !== null) {
          const state = this.states.get(device) as PointerState

          if (state.locationHasChanged(physicalX, physicalY)) {
            details.push({
              
            })
          }

          details.push(sanitizedUp.complete())
        }

        const sanitizedDown = sanitizer.sanitizeDownEvent(event)
        
        const alreadyAdded = this.states.has(device)  
        const state = this.states.ensure(device, physicalX, physicalY)
        state.start()

        if (!alreadyAdded) {
          details.push({
            timeStamp,
            device,
            change: PointerChangeKind.Add,
            physicalX,
            physicalY,
            buttons: sanitizedDown.buttons
          })
        }

        if (state.locationHasChanged(physicalX, physicalY)) {
          sanitizedDown.synthesize()
        }

        this.activeButtons = buttons
        break
      }

      case 'pointermove': {

        this.activeButtons = buttons
        break
      }

      case 'pointerup':
      case 'pointercancel': {
        const state = this.states.get(device) as PointerState
        
        this.states.delete(device)
        break
      }
    }

    return details
  }
}