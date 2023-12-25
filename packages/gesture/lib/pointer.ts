import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Matrix4, Vector3 } from '@at/math'

// 类型
export enum PointerChangeKind {
  Add,
  Cancel,
  Down,
  Hover,
  Move,
  Up
}

export enum PointerDeviceKind {
  Mouse = 'mouse'
}

//// => PointerPacket
export interface PointerPacket {
  change: PointerChangeKind,
  buttons: number,

  device: number,
  kind: string,
  timeStamp: number,
  type: 'pointerdown' | 'pointerup' | 'pointermove',
  
  altKey: boolean,
  ctrlKey: boolean,
  shiftKey: boolean,
  
  deltaX: number,
  deltaY: number,
  x: number,
  y: number
}


//// => PointerState
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
  
  start () {
    this.device = ++PointerState.count
  }
}

//// => PointerStates
export class PointerStates {
  static create () {
    return new PointerStates()
  }

  public states: Map<number, PointerState> = new Map()

  ensure (device: number, x: number, y: number) {
    let state = this.states.get(device) ?? null

    if (state === null) {
      state = PointerState.create(x, y)
      this.states.set(device, state)
    }
    
    return state
  }

  has (device: number) {
    return this.states.has(device)
  }
}

//// => PointerSanitizer
export enum MouseButtonsKind {
  Primary = 1,
  Secondary = 2,
  Middle = 4
}

export interface SanitizedDetail {
  buttons: number,
  change: PointerChangeKind
}

export class PointerSanitizer {
  static create () {
    return new PointerSanitizer()
  }
  
  protected pressedButtons = 0

  sanitize (kind: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'missingrightmouseup', button: number, buttons: number): SanitizedDetail | null {
    let detail: SanitizedDetail | null = null

    switch (kind) {
      case 'pointerdown': {
        if (this.pressedButtons !== 0) {
          return this.sanitize('pointermove', button, buttons)
        }

        if (buttons === 0 && button > -1) {
          if (button === 0) {
            this.pressedButtons = MouseButtonsKind.Primary
          } else if (button === 1) {
            this.pressedButtons = MouseButtonsKind.Middle
          } else if (button === 2) {
            this.pressedButtons = MouseButtonsKind.Secondary
          }
        }

        detail = {
          change: PointerChangeKind.Down,
          buttons: this.pressedButtons,
        }

        break
      }

      case 'pointermove': {
        if (this.pressedButtons === 0 && buttons !== 0) {
          return {
            change: PointerChangeKind.Hover,
            buttons: this.pressedButtons,
          }
        }
    
        this.pressedButtons = buttons
    
        detail = {
          change: this.pressedButtons === 0
              ? PointerChangeKind.Hover
              : PointerChangeKind.Move,
          buttons: this.pressedButtons,
        }

        break
      }

      case 'pointerup': {
        if (this.pressedButtons === 0) {
          return null
        }
    
        this.pressedButtons = buttons
        detail = {
          change: this.pressedButtons === 0 
            ? PointerChangeKind.Move
            : PointerChangeKind.Up,
          buttons: this.pressedButtons,
        }
    
        break
      }

      case 'pointercancel': {
        this.pressedButtons = 0

        detail = {
          change: PointerChangeKind.Cancel,
          buttons: this.pressedButtons,
        }

        break
      }

      case 'missingrightmouseup': {
        if (this.pressedButtons !== 0 && buttons === 0) {
          this.pressedButtons = 0

          detail = {
            change: PointerChangeKind.Up,
            buttons: this.pressedButtons
          }
        }
      }
    }

    return detail
  }
}

export class PointerSanitizers {
  static create () {
    return new PointerSanitizers()
  }

  public sanitizers: Map<number, PointerSanitizer> = new Map()

  ensure (device: number) {
    let sanitizer = this.sanitizers.get(device) ?? null
    if (sanitizer === null) {
      sanitizer = PointerSanitizer.create()
      this.sanitizers.set(device, sanitizer)
    }

    return sanitizer
  }

  delete (device: number) {
    return this.sanitizers.delete(device)
  }
}

//// => PointerTransformer
export abstract class PointerEventTransformer {
  protected states: Map<number, PointerState> = new Map()
  protected sanitizers: Map<number, PointerSanitizer> = new Map()

  transform (
    event: PointerEvent, 
    device: number, 
    detail: SanitizedDetail
  ) {
    const results = []

    switch (detail.change) {
      case PointerChangeKind.Down: {
        const alreadyAdded = this.states.get(device) ?? null
        let state = this.states.get(device) ?? null
        if (state === null) {
          state = PointerState.create(event.x, event.y)
        }
        state.start()

        if (!alreadyAdded) {
          results.push()
        }


        break
      }
    }
  }

  sanitize (event: PointerEvent) {
    const device = event.pointerId
    let sanitizer: PointerSanitizer | null = this.sanitizers.get(device) ?? null

    if (sanitizer === null) {
      sanitizer = PointerSanitizer.create()
      this.sanitizers.set(device, sanitizer)
    }

    const packets: PointerPacket[] = []
    
    switch (event.type) {
      case 'pointerdown': {
        const up = sanitizer.sanitize('missingrightmouseup', event.button, event.buttons) ?? null

        if (up !== null) {
          packets.push(this.transform(event, device, up))
        }

        const alreadyAdded = Pointer.states.has(device)
        const state = Pointer.states.ensure(device, event.x, event.y)
        state.start()

        if (!alreadyAdded) {
          packets.push(data)
        }

        break
      }

      case 'pointermove': {

        break
      }

      case 'pointerup':
      case 'pointercancel': {
        invariant(this.packets.has(data.device), '')
        const state = this.packets.get(data.device) as PacketState
        packets.push(data)
        break
      }
    }

    return packets.map(packet => Pointer.create(packet))
  }

  removePerspectiveTransform (transform: Matrix4) {
    const v3 = new Vector3(0, 0, 1)
    const t = transform.clone()

    t.column(2, v3)
    t.row(2, v3)

    return t
  }

}


//// => Pointer
export class Pointer {
  static states: PointerStates = PointerStates.create()
  static sanitizers: PointerSanitizers = PointerSanitizers.create()

  static transform (
    event: PointerEvent, detail: SanitizedDetail, device: number
  ) {
    const alreadyAdded = Pointer.states.has(device)
    const state = Pointer.states.ensure(device, event.x, event.y)
    state.start()

    if (!alreadyAdded) {
      
    }
  }

  static sanitize (event: PointerEvent) {
    const device = event.pointerId
    const sanitizer = Pointer.sanitizers.ensure(device) as PointerSanitizer
    const packets: PointerPacket[] = []
    
    switch (event.type) {
      case 'pointerdown': {
        const up = sanitizer.sanitize('missingrightmouseup', event.button, event.buttons) ?? null

        if (up !== null) {

        }

        const alreadyAdded = Pointer.states.has(device)
        const state = Pointer.states.ensure(device, event.x, event.y)
        state.start()

        if (!alreadyAdded) {
          packets.push(data)
        }

        break
      }

      case 'pointermove': {

        break
      }

      case 'pointerup':
      case 'pointercancel': {
        invariant(this.packets.has(data.device), '')
        const state = this.packets.get(data.device) as PacketState
        packets.push(data)
        break
      }
    }

    return packets.map(packet => Pointer.create(packet))
  }

  static removePerspectiveTransform (transform: Matrix4) {
    const v3 = new Vector3(0, 0, 1)
    const t = transform.clone()

    t.column(2, v3)
    t.row(2, v3)

    return t
  }

  static transformPosition (transform: Matrix4 | null = null, position: Offset) {
    if (transform === null) {
      return position
    }

    const position3 = new Vector3(position.dx, position.dy, 0.0)
    const transformed3 = transform.perspectiveTransform(position3)

    return new Offset(transformed3.x, transformed3.y)
  }


  public change: PointerChangeKind
  public kind: string
  public type: string
  public device: number
  public delta: Offset
  public position: Offset
  public timeStamp: number
  public buttons: number
  public altKey: boolean
  public ctrlKey: boolean
  public shiftKey: boolean

  public transform: Matrix4 | null
  public origin: Pointer | null

  constructor (
    // 设备信息
    change: PointerChangeKind,
    type: string,
    kind: string,
    device: number,
    buttons: number,
    // 位置信息
    delta: Offset,
    position: Offset, 
    transform: Matrix4 | null = null,
    // 按键信息
    altKey: boolean,
    ctrlKey: boolean,
    shiftKey: boolean,
    timeStamp: number,
    origin: Pointer | null = null,
  ) {
    this.change = change
    this.transform = transform
    this.origin = origin
    this.timeStamp = timeStamp
    this.type = type
    this.kind = kind
    this.device = device
    this.delta = delta
    this.position = position
    this.buttons = buttons
    this.altKey = altKey
    this.ctrlKey = ctrlKey
    this.shiftKey = shiftKey
  }

  transformed (transform: Matrix4 | null): Pointer {
    if (transform === null || transform.equal(this.transform)) {
      return this
    }

    return new Pointer(
      this.change,
      this.type,
      this.kind,
      this.device,
      this.buttons,

      this.delta,
      this.position,
      this.transform,
      
      this.altKey,
      this.ctrlKey,
      this.shiftKey,
      this.timeStamp,

      this.origin,
    )
  }

  copyWith (

  ) {

  }
}


