import invariant from '@at/utils'
import { At } from '../at'
import { Offset } from '../basic/geometry'
import { GestureDisposition } from './arena'
import { AtPointerEvent } from './events'
import { PointerDeviceKind } from './pointer'
import { AtVelocity, AtVelocityTracker } from './velocity-tracker'
import { AtOffsetPair, AtPrimaryPointerGestureRecognizer, GestureRecognizerState } from './recognizer'

export type LongPressDetails = {
  globalPosition: Offset,
  kind?: PointerDeviceKind | null
  localPosition: Offset
}

export type GestureLongPressCallback = (details?: LongPressDetails | null) => void

export type AtLongPressGestureRecognizerOptions = {
  duration?: number | null,
  postAcceptSlopTolerance?: number,
  kind?: PointerDeviceKind | null,
  supportedDevices?: Set<PointerDeviceKind> | null,
}

export class AtLongPressGestureRecognizer extends AtPrimaryPointerGestureRecognizer {
  /**
   * 
   * @param {AtLongPressGestureRecognizerOptions} options 
   * @returns {AtLongPressGestureRecognizer}
   */
  static create (options?: AtLongPressGestureRecognizerOptions) {
    return new AtLongPressGestureRecognizer(
      options?.duration,
      options?.postAcceptSlopTolerance,
      options?.kind,
      options?.supportedDevices,
    )
  }

  /**
   * 
   * @param {number | null} duration 
   * @param {number} postAcceptSlopTolerance 
   * @param kind 
   * @param supportedDevices 
   */
  constructor (
    duration: number | null = null,
    postAcceptSlopTolerance: number = At.kTouchSlop,
    kind: PointerDeviceKind | null = null,
    supportedDevices: Set<PointerDeviceKind> | null = null,
  ) {
    super(
      duration ?? At.kLongPressTimeout,
      At.kTouchSlop,
      postAcceptSlopTolerance,
      kind,
      supportedDevices
    )
  }

  private longPressAccepted: boolean = false
  private longPressOrigin: AtOffsetPair | null = null
  private initialButtons: number | null = null

  public onLongPressDown: GestureLongPressCallback | null = null
  public onLongPressCancel: GestureLongPressCallback | null = null
  public onLongPress: GestureLongPressCallback | null = null
  public onLongPressStart: GestureLongPressCallback | null = null
  public onLongPressMoveUpdate: GestureLongPressCallback | null = null
  public onLongPressUp: GestureLongPressCallback | null = null
  public onLongPressEnd: GestureLongPressCallback | null = null
  public onSecondaryLongPressDown: GestureLongPressCallback | null = null
  public onSecondaryLongPressCancel: GestureLongPressCallback | null = null
  public onSecondaryLongPress: GestureLongPressCallback | null = null
  public onSecondaryLongPressStart: GestureLongPressCallback | null = null
  public onSecondaryLongPressMoveUpdate: GestureLongPressCallback | null = null
  public onSecondaryLongPressUp: GestureLongPressCallback | null = null
  public onSecondaryLongPressEnd: GestureLongPressCallback | null = null
  public onTertiaryLongPressDown: GestureLongPressCallback | null = null
  public onTertiaryLongPressCancel: GestureLongPressCallback | null = null
  public onTertiaryLongPress: GestureLongPressCallback | null = null
  public onTertiaryLongPressStart: GestureLongPressCallback | null = null
  public onTertiaryLongPressMoveUpdate: GestureLongPressCallback | null = null
  public onTertiaryLongPressUp: GestureLongPressCallback | null = null
  public onTertiaryLongPressEnd: GestureLongPressCallback | null = null


  private velocityTracker: AtVelocityTracker | null = null

  isPointerAllowed (event: AtPointerEvent) {
    switch (event.buttons) {
      case At.kPrimaryButton:
        if (
          this.onLongPressDown === null &&
          this.onLongPressCancel === null &&
          this.onLongPressStart === null &&
          this.onLongPress === null &&
          this.onLongPressMoveUpdate === null &&
          this.onLongPressEnd === null &&
          this.onLongPressUp === null
        ) {
          return false
        }
        break
      case At.kSecondaryButton:
        if (
          this.onSecondaryLongPressDown === null &&
          this.onSecondaryLongPressCancel === null &&
          this.onSecondaryLongPressStart === null &&
          this.onSecondaryLongPress === null &&
          this.onSecondaryLongPressMoveUpdate === null &&
          this.onSecondaryLongPressEnd === null &&
          this.onSecondaryLongPressUp === null
        ) {
          return false
        }
        break
      case At.kTertiaryButton:
        if (
          this.onTertiaryLongPressDown === null &&
          this.onTertiaryLongPressCancel === null &&
          this.onTertiaryLongPressStart === null &&
          this.onTertiaryLongPress === null &&
          this.onTertiaryLongPressMoveUpdate === null &&
          this.onTertiaryLongPressEnd === null &&
          this.onTertiaryLongPressUp === null
        ) {
          return false
        }
        break
      default:
        return false
    }

    return super.isPointerAllowed(event)
  }

  didExceedDeadline () {
    this.resolve(GestureDisposition.Accepted)
    this.longPressAccepted = true
    invariant(this.primary)
    super.accept(this.primary)
    this.checkLongPressStart()
  }

  handlePrimaryPointer (event: AtPointerEvent) {
    if (!event.synthesized) {
      if (event.isDown()) {
        this.velocityTracker = AtVelocityTracker.withKind(event.kind)
        this.velocityTracker.addPosition(event.timeStamp, event.localPosition)
      }
      if (event.isMove()) {
        invariant(this.velocityTracker !== null)
        this.velocityTracker.addPosition(event.timeStamp, event.localPosition)
      }
    }

    if (event.isUp()) {
      if (this.longPressAccepted === true) {
        this.checkLongPressEnd(event)
      } else {
        this.resolve(GestureDisposition.Rejected)
      }
      this.reset()
    } else if (event.isCancel()) {
      this.checkLongPressCancel()
      this.reset()
    } else if (event.isDown()) {
      this.longPressOrigin = AtOffsetPair.fromEventPosition(event)
      this.initialButtons = event.buttons
      this.checkLongPressDown(event)
    } else if (event.isMove()) {
      if (event.buttons !== this.initialButtons) {
        invariant(this.primary)
        this.resolve(GestureDisposition.Rejected)
        this.stopTrackingPointer(this.primary)
      } else if (this.longPressAccepted) {
        this.checkLongPressMoveUpdate(event)
      }
    }
  }

  private checkLongPressDown (event: AtPointerEvent) {
    invariant(this.longPressOrigin !== null)

    const details: LongPressDetails = {
      globalPosition: this.longPressOrigin.global,
      localPosition: this.longPressOrigin.local,
      kind: this.getKindForPointer(event.pointer),
    }

    switch (this.initialButtons) {
      case At.kPrimaryButton:
        if (this.onLongPressDown !== null) {
          this.invokeCallback<void>('onLongPressDown', () => {
            invariant(this.onLongPressDown)
            this.onLongPressDown(details)
          })
        }
        break
      case At.kSecondaryButton:
        if (this.onSecondaryLongPressDown !== null) {
          this.invokeCallback<void>('onSecondaryLongPressDown', () => {
            invariant(this.onSecondaryLongPressDown)
            this.onSecondaryLongPressDown(details)
          })
        }
        break
      case At.kTertiaryButton:
        if (this.onTertiaryLongPressDown !== null) [
          this.invokeCallback<void>('onTertiaryLongPressDown', () => {
            invariant(this.onTertiaryLongPressDown)
            this.onTertiaryLongPressDown(details)
          })
        ]
        break
      default:
        invariant(false, 'Unhandled button $_initialButtons')
    }
  }

  private checkLongPressCancel () {
    if (this.state === GestureRecognizerState.Possible) {
      switch (this.initialButtons) {
        case At.kPrimaryButton:
          if (this.onLongPressCancel !== null)
            this.invokeCallback<void>('onLongPressCancel', () => {
              invariant(this.onLongPressCancel)
              this.onLongPressCancel()
            })
          break;
        case At.kSecondaryButton:
          if (this.onSecondaryLongPressCancel !== null) {
            this.invokeCallback<void>('onSecondaryLongPressCancel', () => {
              invariant(this.onSecondaryLongPressCancel)
              this.onSecondaryLongPressCancel()
            })
          }
          break
        case At.kTertiaryButton:
          if (this.onTertiaryLongPressCancel !== null) {
            this.invokeCallback<void>('onTertiaryLongPressCancel', () => {
              invariant(this.onTertiaryLongPressCancel)
              this.onTertiaryLongPressCancel()
            })
          }
          break
        default:
          invariant(false, 'Unhandled button $_initialButtons')
      }
    }
  }

  private checkLongPressStart () {
    switch (this.initialButtons) {
      case At.kPrimaryButton:
        if (this.onLongPressStart !== null) {
          invariant(this.longPressOrigin)
          const details = {
            globalPosition: this.longPressOrigin.global,
            localPosition: this.longPressOrigin.local,
          }
          this.invokeCallback<void>('onLongPressStart', () => {
            invariant(this.onLongPressStart)
            this.onLongPressStart(details)
          })
        }
        if (this.onLongPress !== null) {
          this.invokeCallback<void>('onLongPress', () => {
            invariant(this.onLongPress)
            this.onLongPress()
          })
        }
        break;
      case At.kSecondaryButton:
        if (this.onSecondaryLongPressStart !== null) {
          invariant(this.longPressOrigin)
          const details = {
            globalPosition: this.longPressOrigin.global,
            localPosition: this.longPressOrigin.local,
          }
          this.invokeCallback<void>('onSecondaryLongPressStart', () => {
            invariant(this.onSecondaryLongPressStart)
            this.onSecondaryLongPressStart(details)
          })
        }
        if (this.onSecondaryLongPress !== null) {
          this.invokeCallback<void>('onSecondaryLongPress', () => {
            invariant(this.onSecondaryLongPress)
            this.onSecondaryLongPress()
          })
        }
        break
      case At.kTertiaryButton:
        if (this.onTertiaryLongPressStart !== null) {
          invariant(this.longPressOrigin)
          const details = {
            globalPosition: this.longPressOrigin.global,
            localPosition: this.longPressOrigin.local,
          }
          this.invokeCallback<void>('onTertiaryLongPressStart', () => {
            invariant(this.onTertiaryLongPressStart)
            this.onTertiaryLongPressStart(details)
          })
        }
        if (this.onTertiaryLongPress !== null) {
          this.invokeCallback<void>('onTertiaryLongPress', () => {
            invariant(this.onTertiaryLongPress)
            this.onTertiaryLongPress()
          })
        }
        break
      default:
        invariant(false, 'Unhandled button $_initialButtons')
    }
  }

  private checkLongPressMoveUpdate (event: AtPointerEvent) {
    invariant(this.longPressOrigin)
    const details = {
      globalPosition: event.position,
      localPosition: event.localPosition,
      offsetFromOrigin: event.position.subtract(this.longPressOrigin.global),
      localOffsetFromOrigin: event.localPosition.subtract(this.longPressOrigin.local),
    }

    switch (this.initialButtons) {
      case At.kPrimaryButton:
        if (this.onLongPressMoveUpdate !== null) {
          this.invokeCallback<void>('onLongPressMoveUpdate', () => {
            invariant(this.onLongPressMoveUpdate)
            this.onLongPressMoveUpdate(details)
          })
        }
        break;
      case At.kSecondaryButton:
        if (this.onSecondaryLongPressMoveUpdate !== null) {
          this.invokeCallback<void>('onSecondaryLongPressMoveUpdate', () => {
            invariant(this.onSecondaryLongPressMoveUpdate)
            this.onSecondaryLongPressMoveUpdate(details)
          })
        }
        break;
      case At.kTertiaryButton:
        if (this.onTertiaryLongPressMoveUpdate !== null) {
          this.invokeCallback<void>('onTertiaryLongPressMoveUpdate', () => {
            invariant(this.onTertiaryLongPressMoveUpdate)
            this.onTertiaryLongPressMoveUpdate(details)
          })
        }
        break
      default:
        invariant(false, 'Unhandled button $_initialButtons')
    }
  }

  private checkLongPressEnd (event: AtPointerEvent) {
    invariant(this.velocityTracker)
    const estimate = this.velocityTracker.getVelocityEstimate()
    const velocity = estimate === null
      ? AtVelocity.zero
      : AtVelocity.create(estimate.pixelsPerSecond)
  
    const details = {
      globalPosition: event.position,
      localPosition: event.localPosition,
      velocity: velocity,
    }

    this.velocityTracker = null
    switch (this.initialButtons) {
      case At.kPrimaryButton:
        if (this.onLongPressEnd !== null) {
          this.invokeCallback<void>('onLongPressEnd', () => {
            invariant(this.onLongPressEnd)
            this.onLongPressEnd!(details)
          })
        }
        if (this.onLongPressUp !== null) {
          this.invokeCallback<void>('onLongPressUp', ()=> {
            invariant(this.onLongPressUp)
            this.onLongPressUp()
          })
        }
        break
      case At.kSecondaryButton:
        if (this.onSecondaryLongPressEnd !== null) {
          this.invokeCallback<void>('onSecondaryLongPressEnd', () => {
            invariant(this.onSecondaryLongPressEnd)
            this.onSecondaryLongPressEnd(details)
          })
        }
        if (this.onSecondaryLongPressUp !== null) {
          this.invokeCallback<void>('onSecondaryLongPressUp', () => {
            invariant(this.onSecondaryLongPressUp)
            this.onSecondaryLongPressUp()
          })
        }
        break
      case At.kTertiaryButton:
        if (this.onTertiaryLongPressEnd !== null) {
          this.invokeCallback<void>('onTertiaryLongPressEnd', () => {
            invariant(this.onTertiaryLongPressEnd)
            this.onTertiaryLongPressEnd(details)
          })
        }
        if (this.onTertiaryLongPressUp !== null) {
          this.invokeCallback<void>('onTertiaryLongPressUp', () => {
            invariant(this.onTertiaryLongPressUp)
            this.onTertiaryLongPressUp()
          })
        }
        break
      default:
        invariant(false, 'Unhandled button $_initialButtons')
    }
  }

  private reset() {
    this.longPressAccepted = false
    this.longPressOrigin = null
    this.initialButtons = null
    this.velocityTracker = null
  }

  resolve (disposition: GestureDisposition) {
    if (disposition === GestureDisposition.Rejected) {
      if (this.longPressAccepted) {
        this.reset()
      } else {
        this.checkLongPressCancel()
      }
    }
    super.resolve(disposition)
  }

  
  accept (pointer: number) {
    
  }
}
