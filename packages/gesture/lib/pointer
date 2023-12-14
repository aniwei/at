import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Matrix4, Vector3 } from 'packages/math/types/lib'
import { PointerEventPacket, PointerEventPacketState } from './pointer-packet'


// => PacketChange
export enum PointerChangeKind {
  Add,
  Hover,
  Move
}

export enum PointerEventKind {
  Mouse = 'mouse'
}

//// => Pointer
export class PointerEvent {
  static packets: Map<number, PointerEventPacketState>

  static decomposite (data: PointerEventPacket) {
    const packets: PointerEventPacket[] = []
    
    switch (data.kind) {
      case 'pointerdown': {
        const alreadyAdded = this.packets.has(data.device) ?? null
        const state = this.ensure(data.device, data.x, data.y)
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

  static ensure (device: number, x: number, y: number) {
    if (!this.packets.has(device)) {
      this.packets.set(device, PacketState.create(x, y))
    }
    
    return this.packets.get(device) as PacketState
  }

  static removePerspectiveTransform (transform: Matrix4) {
    const v3 = new Vector3(0, 0, 1)
    const t = transform.clone()

    t.column(2, v3)
    t.row(2, v3)

    return t
  }

  static transformPosition (transform: Matrix4 | null = null, position: Offset) {
    if (transform == null) {
      return position
    }

    const position3 = new Vector3(position.dx, position.dy, 0.0)
    const transformed3 = transform.perspectiveTransform(position3)

    return new Offset(transformed3.x, transformed3.y)
  }


  public change: PacketChangeKind
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
    change: PacketChangeKind,
    transform: Matrix4 | null = null,
    origin: Pointer | null = null,
    timeStamp: number,
    type: string,
    kind: string,
    device: number,
    delta: Offset,
    position: Offset, 
    buttons: number,
    altKey: boolean,
    ctrlKey: boolean,
    shiftKey: boolean
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
      this.transform,
      this.origin,
      this.timeStamp,
      this.type,
      this.kind,
      this.device,
      this.delta,
      this.position,
      this.buttons,
      this.altKey,
      this.ctrlKey,
      this.shiftKey,
    )
  }

  copyWith (

  ) {

  }
}


