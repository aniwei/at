import invariant from 'ts-invariant'
import { At, Offset } from '../at'
import { AtPointerEvent } from './events'
import { AtHitTestEntry } from './hit-test'
import { AtImmediateMultiDragGestureRecognizer, AtPanGestureRecognizer, DragDetails } from './drag'
import { PointerDeviceKind } from './pointer'
import { AtGestureRecognizer, DragStartBehavior } from './recognizer'
import { AtTapGestureRecognizer, TapDetails } from './tap'

export type GestureEventCallback<T> = (details?: T) => void

export enum HitTestBehavior {
  DeferToChild,
  Opaque,
  Translucent,
}

export enum GestureRecognizerTypes {
  Tap,
  Pan,
}

export type AtGestureDetectorOptions = {
  onTapDown?: GestureEventCallback<TapDetails> | null,
  onTapUp?: GestureEventCallback<TapDetails> | null,
  onTap?: GestureEventCallback<TapDetails> | null,
  onTapCancel?: GestureEventCallback<TapDetails> | null,
  onPanDown?: GestureEventCallback<DragDetails> | null,
  onPanStart?: GestureEventCallback<DragDetails> | null,
  onPanUpdate?: GestureEventCallback<DragDetails> | null,
  onPanEnd?: GestureEventCallback<DragDetails> | null,
  onPanCancel?: GestureEventCallback<DragDetails> | null,
}

export class AtGestureDetector {
  static create (options?: AtGestureDetectorOptions) {
    return new AtGestureDetector(
      options?.onTapDown,
      options?.onTapUp,
      options?.onTap,
      options?.onTapCancel,
      options?.onPanDown,
      options?.onPanStart,
      options?.onPanUpdate,
      options?.onPanEnd,
      options?.onPanCancel,
    )
  }

  // => onTapDown
  private _onTapDown: GestureEventCallback<TapDetails> | null
  public get onTapDown () {
    return this._onTapDown
  }
  public set onTapDown (onTapDown: GestureEventCallback<TapDetails> | null) {
    if (this._onTapDown !== onTapDown) {
      this._onTapDown = onTapDown
      this.markHandleTapRecognizer()
    }
  }

  // => onTapUp
  private _onTapUp: GestureEventCallback<TapDetails> | null
  public get onTapUp () {
    return this._onTapUp
  }
  public set onTapUp (onTapUp: GestureEventCallback<TapDetails> | null) {
    if (this._onTapUp !== onTapUp) {
      this._onTapUp = onTapUp
      this.markHandleTapRecognizer()
    }
  }

  // => onTap
  private _onTap: GestureEventCallback<TapDetails> | null
  public get onTap () {
    return this._onTap
  }
  public set onTap (onTap: GestureEventCallback<TapDetails> | null) {
    if (this._onTap !== onTap) {
      this._onTap = onTap
      this.markHandleTapRecognizer()
    }
  }

  // => onTapCancel
  private _onTapCancel: GestureEventCallback<TapDetails> | null
  public get onTapCancel () {
    return this._onTapCancel
  }
  public set onTapCancel (onTapCancel: GestureEventCallback <TapDetails>| null) {
    if (this._onTapCancel !== onTapCancel) {
      this._onTapCancel = onTapCancel
      this.markHandleTapRecognizer()
    }
  }

  // => onPanDown 
  private _onPanDown: GestureEventCallback<DragDetails> | null
  public get onPanDown () {
    return this._onPanDown
  }
  public set onPanDown (onPanDown: GestureEventCallback<DragDetails> | null) {
    if (this._onPanDown !== onPanDown) {
      this._onPanDown = onPanDown
      this.markNeedsPanRecognizer()
    }
  }

  // => onPanStart 
  private _onPanStart: GestureEventCallback<DragDetails> | null
  public get onPanStart () {
    return this._onPanStart
  }
  public set onPanStart (onPanStart: GestureEventCallback<DragDetails> | null) {
    if (this._onPanStart !== onPanStart) {
      this._onPanStart = onPanStart
      this.markNeedsPanRecognizer()
    }
  }

  // => onPanUpdate 
  private _onPanUpdate: GestureEventCallback<DragDetails> | null
  public get onPanUpdate () {
    return this._onPanUpdate
  }
  public set onPanUpdate (onPanUpdate: GestureEventCallback<DragDetails> | null) {
    if (this._onPanUpdate !== onPanUpdate) {
      this._onPanUpdate = onPanUpdate
      this.markNeedsPanRecognizer()
    }
  }

  // => onPanEnd 
  private _onPanEnd: GestureEventCallback<DragDetails> | null
  public get onPanEnd () {
    return this._onPanEnd
  }
  public set onPanEnd (onPanEnd: GestureEventCallback<DragDetails> | null) {
    if (this._onPanEnd !== onPanEnd) {
      this._onPanEnd = onPanEnd
      this.markNeedsPanRecognizer()
    }
  }

  // => onPanCancel 
  private _onPanCancel: GestureEventCallback<DragDetails> | null
  public get onPanCancel () {
    return this._onPanCancel
  }
  public set onPanCancel (onPanCancel: GestureEventCallback<DragDetails> | null) {
    if (this._onPanCancel !== onPanCancel) {
      this._onPanCancel = onPanCancel
      this.markNeedsPanRecognizer()
    }
  }

  // => onPanCancel 
  private _onDragStart: GestureEventCallback<DragDetails> | null
  public get onDragStart () {
    return this._onDragStart
  }
  public set onDragStart (onDragStart: GestureEventCallback<DragDetails> | null) {
    if (this._onDragStart !== onDragStart) {
      this._onDragStart = onDragStart
      this.markNeedsMultiDragGestureRecognizer()
    }
  }

  public behavior: HitTestBehavior
  public dragStartBehavior: DragStartBehavior
  public supportedDevices: Set<PointerDeviceKind> | null
  public trackpadScrollCausesScale: boolean
  public trackpadScrollToScaleFactor: Offset

  private tap: AtTapGestureRecognizer | null = null
  private pan: AtPanGestureRecognizer | null = null
  private dragger: AtImmediateMultiDragGestureRecognizer  | null = null

  constructor (
    onTapDown: GestureEventCallback<TapDetails> | null = null,
    onTapUp: GestureEventCallback<TapDetails> | null = null,
    onTap: GestureEventCallback<TapDetails> | null = null,
    onTapCancel: GestureEventCallback<TapDetails> | null = null,
    onPanDown: GestureEventCallback<DragDetails> | null = null,
    onPanStart: GestureEventCallback<DragDetails> | null = null,
    onPanUpdate: GestureEventCallback<DragDetails> | null = null,
    onPanEnd: GestureEventCallback<DragDetails> | null = null,
    onPanCancel: GestureEventCallback<DragDetails> | null = null,
    onDragStart: GestureEventCallback<DragDetails> | null = null,
    behavior: HitTestBehavior = HitTestBehavior.DeferToChild,
    dragStartBehavior: DragStartBehavior = DragStartBehavior.Start,
    trackpadScrollCausesScale: boolean = false,
    trackpadScrollToScaleFactor = At.kDefaultTrackpadScrollToScaleFactor,
    supportedDevices: Set<PointerDeviceKind> | null = null,
  ) {

    this.behavior = behavior
    this.dragStartBehavior = dragStartBehavior
    this.trackpadScrollCausesScale = trackpadScrollCausesScale
    this.trackpadScrollToScaleFactor = trackpadScrollToScaleFactor
    this.supportedDevices = supportedDevices

    this._onTapDown = onTapDown
    this._onTapUp = onTapUp
    this._onTap = onTap
    this._onTapCancel = onTapCancel

    this._onPanDown = onPanDown
    this._onPanStart = onPanStart
    this._onPanUpdate = onPanUpdate
    this._onPanEnd = onPanEnd
    this._onPanCancel = onPanCancel

    this._onDragStart = onDragStart

    this.markHandleTapRecognizer()
  }

  markHandleTapRecognizer () {
    if (
      this._onTapDown !== null ||
      this._onTapUp !== null ||
      this._onTap !== null ||
      this._onTapCancel !== null
    ) {
      this.tap ??= AtTapGestureRecognizer.create()
      this.tap.onTapDown = this.onTapDown
      this.tap.onTapUp = this.onTapUp
      this.tap.onTap = this.onTap
      this.tap.onTapCancel = this.onTapCancel
    } else {
      this.tap?.dispose()
      this.tap = null
    }
  }

  markNeedsMultiDragGestureRecognizer () {
    if (
      this._onDragStart !== null 
    ) {
      this.dragger ??= AtImmediateMultiDragGestureRecognizer.create()
      invariant(this.pan)
    // @ts-ignore
      this.dragger.onStart = this.onDragStart
    } else {
      this.dragger?.dispose()
      this.dragger = null
    }
  }

  markNeedsPanRecognizer () {
    if (
      this._onPanDown !== null ||
      this._onPanStart !== null ||
      this._onPanUpdate !== null ||
      this._onPanEnd !== null ||
      this._onPanCancel !== null
    ) {
      this.pan ??= AtPanGestureRecognizer.create()
      invariant(this.pan)
      // @ts-ignore
      this.pan.onDown = this.onPanDown
      // @ts-ignore
      this.pan.onStart = this.onPanStart
      // @ts-ignore
      this.pan.onUpdate = this.onPanUpdate
    } else {
      this.pan?.dispose()
      this.pan = null
    }
  }

  handleEvent = (event: AtPointerEvent, entry: AtHitTestEntry) => {
    if (event.isDown()) {
      this.tap?.addPointer(event)
      this.pan?.addPointer(event)
      // this.dragger?.addPointer(event)
    }
  }
}
