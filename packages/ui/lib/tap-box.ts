
import { TapDetail } from '@at/gesture'
import { 
  GestureDetector, 
  GestureEventCallback, 
} from '@at/gesture'

import { Box } from './box'
import { DetectorBox } from './detector-box'

//// => TapBox
export interface TapBoxOptions {
  child?: Box | null,
  onTap?: GestureEventCallback<TapDetail>,
  onTapDown?: GestureEventCallback<TapDetail>,
  onTapUp?: GestureEventCallback<TapDetail>,
  onTapCancel?: GestureEventCallback<TapDetail>
}

export class TapBox extends DetectorBox {
  static create (options: TapBoxOptions) {
    return new TapBox(
      options.child,
      options.onTap,
      options.onTapDown,
      options.onTapUp,
      options.onTapCancel,
    ) as TapBox
  }

  // => onTap
  protected _onTap: GestureEventCallback<TapDetail> | null = null
  public get onTap () {
    return this._onTap
  }
  public set onTap (onTap: GestureEventCallback<TapDetail> | null) {
    if (this._onTap !== onTap) {
      this._onTap = onTap
      if (this.detector) {
        this.detector.onTap = onTap
      }
    }
  }

  // => onTapDown
  protected _onTapDown: GestureEventCallback<TapDetail> | null = null
  public get onTapDown () {
    return this._onTapDown
  }
  public set onTapDown (onTapDown: GestureEventCallback<TapDetail> | null) {
    if (this._onTapDown !== onTapDown) {
      this._onTapDown = onTapDown
      if (this.detector) {
        this.detector.onTapDown = onTapDown
      }
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
      if (this.detector) {
        this.detector.onTapUp = onTapUp
      }
    }
  }

  // => onTapCancel
  protected _onTapCancel: GestureEventCallback<TapDetail> | null = null
  public get onTapCancel () {
    return this._onTapCancel
  }
  public set onTapCancel (onTapCancel: GestureEventCallback<TapDetail> | null) {
    if (this._onTapCancel !== onTapCancel) {
      this._onTapCancel = onTapCancel
      if (this.detector) {
        this.detector.onTapCancel = onTapCancel
      }
    }
  }

  // => detector
  // 手势
  protected _detector: GestureDetector | null = null
  public get detector () {
    return this._detector as GestureDetector
  }
  public set detector (detector: GestureDetector | null) {
    if (
      detector === null || 
      detector !== this._detector
    ) {
      if (this._detector !== null) {
        this._detector.onTap = null
        this._detector.onTapDown = null
        this._detector.onTapUp = null
        this._detector.onTapCancel = null
      }
      
      this._detector?.dispose()
      this._detector = detector

      if (this._detector !== null) {
        this._detector.onTap = this.onTap
        this._detector.onTapDown = this.onTapDown
        this._detector.onTapUp = this.onTapUp
        this._detector.onTapCancel = this.onTapCancel
      }
    }
  }


  constructor (
    child: Box | null = null,
    onTap: GestureEventCallback<TapDetail> | null = null,
    onTapDown: GestureEventCallback<TapDetail> | null = null,
    onTapUp: GestureEventCallback<TapDetail> | null = null,
    onTapCancel: GestureEventCallback<TapDetail> | null = null
  ) {
    super(child)

    this.onTap = onTap
    this.onTapDown = onTapDown
    this.onTapUp = onTapUp
    this.onTapCancel = onTapCancel
  }
}