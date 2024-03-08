
import { DragTarget, DragDetail } from '@at/gesture'
import { 
  GestureDetector, 
  GestureEventCallback, 
} from '@at/gesture'

import { Box } from './box'
import { DetectorBox } from './detector-box'

//// => DragBox
// 拖拽 盒子 对象
export interface DragBoxOptions {
  child?: Box | null,
  onDragStart?: GestureEventCallback<DragDetail>,
  onDragUpdate?: GestureEventCallback<DragDetail>,
  onDragEnd?: GestureEventCallback<DragDetail>
  onDragCancel?: GestureEventCallback<DragDetail>
}

export class DragBox extends DetectorBox {
  static create (...rests: unknown[]): DragBox
  static create (options: DragBoxOptions): DragBox {
    return new DragBox(
      options.child,
      options.onDragStart,
      options.onDragUpdate,
      options.onDragEnd,
      options.onDragCancel,
    ) as DragBox
  }

  // => onDragStart
  public get onDragStart () {
    return this.dragTarget.onDragStart
  }
  public set onDragStart (onDragStart: GestureEventCallback<DragDetail> | null) {
    if (this.onDragStart !== onDragStart) {
      this.dragTarget.onDragStart = onDragStart
    }
  }

  // => onDragUpdate
  public get onDragUpdate () {
    return this.dragTarget.onDragUpdate
  }
  public set onDragUpdate (onDragUpdate: GestureEventCallback<DragDetail> | null) {
    if (this.onDragUpdate !== onDragUpdate) {
      this.dragTarget.onDragUpdate = onDragUpdate
    }
  }

  // => onDragEnd
  public get onDragEnd () {
    return this.dragTarget.onDragEnd
  }
  public set onDragEnd (onDragEnd: GestureEventCallback<DragDetail> | null) {
    if (this.onDragEnd !== onDragEnd) {
      this.dragTarget.onDragEnd = onDragEnd
    }
  }

  // => onDragCancel
  public get onDragCancel () {
    return this.dragTarget.onDragCancel
  }
  public set onDragCancel (onDragCancel: GestureEventCallback<DragDetail> | null) {
    if (this.onDragCancel !== onDragCancel) {
      this.dragTarget.onDragCancel = onDragCancel
    }
  }

  // => detector
  public get detector () {
    return super.detector 
  }
  public set detector (detector: GestureDetector | null) {
    if (
      detector === null || 
      detector !== this._detector
    ) {
      super.detector = detector
      if (detector !== null) {
        detector.onDragStart = () => {
          return this.dragTarget
        }
      }
    }
  }

  protected dragTarget: DragTarget

  constructor (
    child: Box | null = null,
    onDragStart: GestureEventCallback<DragDetail> | null = null,
    onDragUpdate: GestureEventCallback<DragDetail> | null = null,
    onDragEnd: GestureEventCallback<DragDetail> | null = null,
    onDragCancel: GestureEventCallback<DragDetail> | null = null
  ) {
    super(child)

    this.dragTarget = DragTarget.create()

    this.onDragStart = onDragStart
    this.onDragUpdate = onDragUpdate
    this.onDragEnd = onDragEnd
    this.onDragCancel = onDragCancel
  }
}