import { Offset } from '@at/geometry'
import { HitTestEntry } from './hit-test'
import { TapGestureRecognizer, TapDetail } from './tap'
import { Gesture } from './gesture'
import { 
  PointerChangeKind, 
  PointerDeviceKind,
  SanitizedPointerEvent 
} from './sanitizer'
import { DragStartBehaviorKind } from './drag'

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
}

//// => GestureDetector
export class GestureDetector {
  static create (gesture: Gesture, options?: GestureDetectorOptions) {
    return new GestureDetector(
      gesture,
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

  public behavior: HitTestBehavior
  public dragStartBehavior: DragStartBehaviorKind
  public devices: Set<PointerDeviceKind> | null
  public trackpadScrollCausesScale: boolean
  public trackpadScrollToScaleFactor: Offset

  protected gesture: Gesture
  protected tap: TapGestureRecognizer | null = null
  
  constructor (
    gesture: Gesture,
    onTapDown: GestureEventCallback<TapDetail> | null = null,
    onTapUp: GestureEventCallback<TapDetail> | null = null,
    onTap: GestureEventCallback<TapDetail> | null = null,
    onTapCancel: GestureEventCallback<TapDetail> | null = null,

    behavior: HitTestBehavior = HitTestBehavior.DeferToChild,
    dragStartBehavior: DragStartBehaviorKind = DragStartBehaviorKind.Start,
    trackpadScrollCausesScale: boolean = false,
    trackpadScrollToScaleFactor = Gesture.env<Offset>(
      'ATKIT_GESTURE_TRACK_SCROLL_TO_SCALE_FACTOR', 
      Offset.create(0, -1 / Gesture.env<number>('ATKIT_GESTURE_MOUSE_SCROLL_TO_SCALE_FACTOR', 200))
    ),

    devices: Set<PointerDeviceKind> | null = null,
  ) {
    this.gesture = gesture
    this.behavior = behavior
    this.dragStartBehavior = dragStartBehavior
    this.trackpadScrollCausesScale = trackpadScrollCausesScale
    this.trackpadScrollToScaleFactor = trackpadScrollToScaleFactor
    this.devices = devices

    this.onTapDown = onTapDown
    this.onTapUp = onTapUp
    this.onTap = onTap
    this.onTapCancel = onTapCancel
  }

  markNeedsCreateTapGestureRecognizer () {
    if (
      this.onTapDown !== null ||
      this.onTapUp !== null ||
      this.onTap !== null ||
      this.onTapCancel !== null
    ) {
      this.tap ??= TapGestureRecognizer.create(this.gesture)
      this.tap.onTapDown = this.onTapDown
      this.tap.onTapUp = this.onTapUp
      this.tap.onTap = this.onTap
      this.tap.onTapCancel = this.onTapCancel
    } else {
      this.tap?.dispose()
      this.tap = null
    }
  }

  handleEvent (event: SanitizedPointerEvent, entry: HitTestEntry) {
    if (event.change === PointerChangeKind.Down) {
      this.tap?.addPointer(event)
    }
  }

  dispose () {
    this.tap?.dispose()
    this.tap = null
  }
}
