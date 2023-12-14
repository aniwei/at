import { PointerChangeKind } from './pointer'

//// => PointerEventPacket
export interface PointerEventPacket {
  change: PointerChangeKind,
  buttons: number,
  altKey: boolean,
  ctrlKey: boolean,
  shiftKey: boolean,
  device: number,
  kind: string,
  timeStamp: number,
  type: 'pointerdown' | 'pointerup' | 'pointermove',
  deltaX: number,
  deltaY: number,
  x: number,
  y: number
}


//// => PointerEventPacketState
export class PointerEventPacketState {
  static count: number = 0
  static create (x: number, y: number) {
    return new PointerEventPacketState(x, y)
  }

  public x: number
  public y: number
  public device: number | null = null

  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }
  
  start () {
    this.device = ++PointerEventPacketState.count
  }
}
