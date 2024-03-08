import { Engine } from '@at/engine'
import { HitTestEntry } from './hit-test'
import { TapGestureRecognizer, TapDetail } from './tap'
import { DragDetail, ImmediateMultiDragGestureRecognizer, GestureDragStartCallback } from './drag'
import { 
  PointerChangeKind, 
  PointerDeviceKind,
  SanitizedPointerEvent 
} from './sanitizer'


export interface GestureEventCallback<T> {
  (detail: T): void
  (detail?: T): void
}

export enum HitTestBehavior {
  DeferToChild,
  Opaque,
  Translucent,
}

export enum GestureRecognizerKind {
  Tap,
  Pan,
}

export interface GestureDetectorOptions {
  onTapDown?: GestureEventCallback<TapDetail> | null,
  onTapUp?: GestureEventCallback<TapDetail> | null,
  onTap?: GestureEventCallback<TapDetail> | null,
  onTapCancel?: GestureEventCallback<TapDetail> | null,
  onDragStart?: GestureEventCallback<DragDetail> | null,
  onDragUpdate?: GestureEventCallback<DragDetail> | null,
  onDragEnd?: GestureEventCallback<DragDetail> | null,
}

//// => GestureDetector
export class GestureDetector {
  static create (engine: Engine, options?: GestureDetectorOptions) {
    return new GestureDetector(
      engine,
      options?.onTapDown,
      options?.onTapUp,
      options?.onTap,
      options?.onTapCancel,
    )
  }

  // => onTapDown
  protected _onTapDown: GestureEventCallback<TapDetail> | null = null
  public get onTapDown () {
    return this._onTapDown
  }
  public set onTapDown (onTapDown: GestureEventCallback<TapDetail> | null) {
    if (this._onTapDown !== onTapDown) {
      this._onTapDown = onTapDown
      this.markNeedsCreateTapGestureRecognizer()
    }
  }

  // => onTapUp
  protected _onTapUp: GestureEventCallback<TapDetail> | null = null
  public get onTapUp () {
    return this._onTapUp
  }
  public set onTapUp (onTapUp: GestureEventCallback<TapDetail> | null) {
    if (this._onTapUp !== onTapUp) {
      this._onTapUp = onTapUp
      this.markNeedsCreateTapGestureRecognizer()
    }
  }

  // => onTap
  protected _onTap: GestureEventCallback<TapDetail> | null = null
  public get onTap () {
    return this._onTap
  }
  public set onTap (onTap: GestureEventCallback<TapDetail> | null) {
    if (this._onTap !== onTap) {
      this._onTap = onTap
      this.markNeedsCreateTapGestureRecognizer()
    }
  }

  // => onTapCancel
  protected _onTapCancel: GestureEventCallback<TapDetail> | null = null
  public get onTapCancel () {
    return this._onTapCancel
  }
  public set onTapCancel (onTapCancel: GestureEventCallback <TapDetail>| null) {
    if (this._onTapCancel !== onTapCancel) {
      this._onTapCancel = onTapCancel
      this.markNeedsCreateTapGestureRecognizer()
    }
  }

  // => onDragStart
  protected _onDragStart: GestureDragStartCallback | null = null
  public get onDragStart () {
    return this._onDragStart
  }
  public set onDragStart (onDragStart: GestureDragStartCallback | null) {
    if (this._onDragStart !== onDragStart) {
      this._onDragStart = onDragStart
      this.markNeedsCreateDragGestureRecognizer()
    }
  }

  public behavior: HitTestBehavior
  public devices: Set<PointerDeviceKind> | null

  protected engine: Engine
  protected tap: TapGestureRecognizer | null = null
  protected drag: ImmediateMultiDragGestureRecognizer | null = null
  
  constructor (
    engine: Engine,
    onTapDown: GestureEventCallback<TapDetail> | null = null,
    onTapUp: GestureEventCallback<TapDetail> | null = null,
    onTap: GestureEventCallback<TapDetail> | null = null,
    onTapCancel: GestureEventCallback<TapDetail> | null = null,

    behavior: HitTestBehavior = HitTestBehavior.DeferToChild,
    devices: Set<PointerDeviceKind> | null = null,
  ) {
    this.engine = engine
    this.behavior = behavior
    this.devices = devices

    this.onTap = onTap
    this.onTapDown = onTapDown
    this.onTapUp = onTapUp
    this.onTapCancel = onTapCancel
  }

  markNeedsCreateDragGestureRecognizer () {
    if (this.onDragStart !== null) {
      this.drag ??= ImmediateMultiDragGestureRecognizer.create(this.engine as Engine)
      this.drag.onStart = this.onDragStart
    } else {
      this.drag?.dispose()
      this.drag = null
    }
  }

  markNeedsCreateTapGestureRecognizer () {
    if (
      this.onTapDown !== null ||
      this.onTapUp !== null ||
      this.onTap !== null ||
      this.onTapCancel !== null
    ) {
      this.tap ??= TapGestureRecognizer.create(this.engine)
      this.tap.onTap = this.onTap
      this.tap.onTapDown = this.onTapDown
      this.tap.onTapUp = this.onTapUp
      this.tap.onTapCancel = this.onTapCancel
    } else {
      this.tap?.dispose()
      this.tap = null
    }
  }

  handleEvent (event: SanitizedPointerEvent, entry: HitTestEntry) {
    if (event.change === PointerChangeKind.Down) {
      this.tap?.addPointer(event)
      this.drag?.addPointer(event)
    }
  }

  dispose () {
    this.tap?.dispose()
    this.drag?.dispose()
    this.tap = null
    this.drag = null
  }
}
