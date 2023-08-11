
import { AtPointerEvent } from '../gestures/events'
import { AtBoxHitTestEntry, AtLayoutBox } from './box'
import { AtGestureDetector, GestureEventCallback } from '../gestures/detector'
import { TapDetails } from '../gestures/tap'
import { DragDetails } from '../gestures/drag'
import { AtPipelineOwner } from './pipeline-owner'


export type PointerEventListener = (event: AtPointerEvent) => void


export abstract class AtListener extends AtLayoutBox {
  // => onTapDown
  public get onTapDown (): GestureEventCallback<TapDetails> | null {
    return this.detector.onTapDown
  }
  public set onTapDown (onTapDown: GestureEventCallback<TapDetails> | null) {
    this.detector.onTapDown = onTapDown
  }

  // => onTapUp
  public get onTapUp (): GestureEventCallback<TapDetails> | null {
    return this.detector.onTapUp
  }
  public set onTapUp (onTapUp: GestureEventCallback<TapDetails> | null) {
    this.detector.onTapUp = onTapUp
  }

  // => onTap
  public get onTap (): GestureEventCallback<TapDetails> | null {
    return this.detector.onTap
  }
  public set onTap (onTap: GestureEventCallback<TapDetails> | null) {
    this.detector.onTap = onTap
  }

  // => onTapCancel
  public get onTapCancel (): GestureEventCallback<TapDetails> | null {
    return this.detector.onTapCancel
  }
  public set onTapCancel (onTapCancel: GestureEventCallback<TapDetails> | null) {
    this.detector.onTapCancel = onTapCancel
  }

  // => onPanDown
  public get onPanDown (): GestureEventCallback<DragDetails> | null {
    return this.detector.onPanDown
  }
  public set onPanDown (onPanDown: GestureEventCallback<DragDetails> | null) {
    this.detector.onPanDown = onPanDown
  }

  // => onPanStart
  public get onPanStart (): GestureEventCallback<DragDetails> | null {
    return this.detector.onPanStart
  }
  public set onPanStart (onPanStart: GestureEventCallback<DragDetails> | null) {
    this.detector.onPanStart = onPanStart
  }

  // => onPanUpdate
  public get onPanUpdate (): GestureEventCallback<DragDetails> | null {
    return this.detector.onPanUpdate
  }
  public set onPanUpdate (onPanUpdate: GestureEventCallback<DragDetails> | null) {
    this.detector.onPanUpdate = onPanUpdate
  }

  // => onPanEnd
  public get onPanEnd (): GestureEventCallback<DragDetails> | null {
    return this.detector.onPanEnd
  }
  public set onPanEnd (onPanEnd: GestureEventCallback<DragDetails> | null) {
    this.detector.onPanEnd = onPanEnd
  }

  // => onPanCancel
  public get onPanCancel (): GestureEventCallback<DragDetails> | null {
    return this.detector.onPanCancel
  }
  public set onPanCancel (onPanCancel: GestureEventCallback<DragDetails> | null) {
    this.detector.onPanCancel = onPanCancel
  }

  // => onDragStart
  public get onDragStart (): GestureEventCallback<DragDetails> | null {
    return this.detector.onDragStart
  }
  public set onDragStart (onDragStart: GestureEventCallback<DragDetails> | null) {
    this.detector.onDragStart = onDragStart
  }

  protected detector: AtGestureDetector
  
  constructor (
    child: AtLayoutBox | null = null,
  ) {
    super()
    this.child = child
    this.detector = AtGestureDetector.create()
  }

  handleEvent (event: AtPointerEvent, entry: AtBoxHitTestEntry) {
    this.detector.handleEvent(event, entry)
  }

  handleTap () {}
  handleTapDown () {}

  attache (owner: AtPipelineOwner) {
    super.attach(owner)

    this.onTap = this.handleTap
    this.onTapDown = this.handleTapDown
  }
}

