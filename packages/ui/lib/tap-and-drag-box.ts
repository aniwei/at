import { DragDetail, GestureEventCallback, TapDetail } from '@at/gesture'
import { Box } from './box'
import { TapBox, TapBoxOptions } from './tap-box'
import { DragBox, DragBoxOptions } from './drag-box'

//// => TapAndDragBox
export interface TapAndDragBoxOptions extends TapBoxOptions, DragBoxOptions { }

export class TapAndDragBox extends DragBox {
  static create (options: TapAndDragBoxOptions): TapAndDragBox {
    return new TapAndDragBox(
      options.child,
      options?.onTap,
      options?.onTapDown,
      options?.onTapUp,
      options?.onTapCancel,
      options?.onDragStart,
      options?.onDragUpdate,
      options?.onDragEnd,
      options?.onDragCancel
    )
  }

  // => onTap
  public get onTap () {
    return this.tap.onTap
  }
  public set onTap (onTap: GestureEventCallback<TapDetail> | null) {
    this.tap.onTap = onTap
  }

  // => onTapDown
  public get onTapDown () {
    return this.tap.onTapDown
  }
  public set onTapDown (onTapDown: GestureEventCallback<TapDetail> | null) {
    this.tap.onTapDown = onTapDown
  }

  // => onTapUp
  public get onTapUp () {
    return this.tap.onTapUp
  }
  public set onTapUp (onTapUp: GestureEventCallback<TapDetail> | null) {
    this.tap.onTapUp = onTapUp
  }

  // => onTapCancel
  public get onTapCancel () {
    return this.tap.onTapCancel
  }
  public set onTapCancel (onTapCancel: GestureEventCallback<TapDetail> | null) {
    this.tap.onTapCancel = onTapCancel
  }

  // => tap
  public get tap () {
    return this.child as TapBox
  }

  constructor (
    child: Box | null = null,
    onTap?: GestureEventCallback<TapDetail>,
    onTapDown?: GestureEventCallback<TapDetail>,
    onTapUp?: GestureEventCallback<TapDetail>,
    onTapCancel?: GestureEventCallback<TapDetail>,
    onDragStart?: GestureEventCallback<DragDetail>,
    onDragUpdate?: GestureEventCallback<DragDetail>,
    onDragEnd?: GestureEventCallback<DragDetail>,
    onDragCancel?: GestureEventCallback<DragDetail>
  ) {
    super(
      TapBox.create({
        child,
        onTap,
        onTapDown,
        onTapUp,
        onTapCancel
      }), 
      onDragStart,
      onDragUpdate,
      onDragEnd,
      onDragCancel
    )
  }
}