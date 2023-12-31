import { DragDetail, DragTarget, GestureDetector, GestureEventCallback } from '@at/gesture'
import { Offset } from '@at/geometry'
import { PipelineOwner } from './pipeline-owner'
import { PaintingContext } from './painting-context'
import { BoxHitTestResult } from './box-hit-test'
import { Box } from './box'

export class Dragger extends Box {
  static create (child: Box) {
    return new Dragger(child)
  }

  // => detector
  public get detector () {
    return super.detector
  }
  public set detector (detector: GestureDetector | null) {
    if (detector === null || detector !== super.detector) {
      if (super.detector !== null) {
        super.detector.onDragStart = null
      }

      super.detector = detector
      if (super.detector !== null) {
        super.detector.onDragStart = this.handleDragStart.bind(this)
      }
    }
  }

  // => left
  public get left () {
    return this.child.left
  }
  public set left (left: number | null) {
    if (this.child.left === null || this.child.left !== left) {
      this.child.left = left
    }
  }

  // => top
  public get top () {
    return this.child.top
  }
  public set top (top: number | null) {
    if (this.child.top === null || this.child.top !== top) {
      this.child.top = top
    }
  }

  // => width
  public get width () {
    return this.child.width
  }
  public set width (width: number | null) {
    if (this.child.width === null || this.child.width !== width) {
      this.child.width = width
    }
  }

  // => height
  public get height () {
    return this.child.height
  }
  public set height (height: number | null) {
    if (this.child.height === null || this.child.height !== height) {
      this.child.height = height
    }
  }

  // => child
  public get child () {
    return super.child as Box
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

  protected dragTarget: DragTarget

  constructor (child: Box) {
    super(
      child, 
      child.left, 
      child.top,
      child.right,
      child.bottom,
      child.width,
      child.height,
      child.scale
    )

    this.dragTarget = DragTarget.create()
  }

  handleDragStart () {
    return this.dragTarget
  }

  hitTestSelf (position: Offset) {
    return this.child.hitTestSelf(position)
  }

  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    return this.child.hitTestChildren(result, position)
  }

  markNeedsLayout () {
    if (this.parent !== null) {
      this.parent.markParentNeedsLayout()
    }
  }

  paint (context: PaintingContext, offset: Offset) {
    this.defaultPaint(context, offset)
  }

  attach (owner: PipelineOwner): void {
    super.attach(owner)

    this.dragTarget.onDragStart = this.handleDragStart.bind(this)
  }

  detach (): void {
    super.detach()
    this.dragTarget?.dispose()
  }
}