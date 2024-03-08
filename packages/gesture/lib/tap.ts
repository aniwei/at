import { invariant } from '@at/utils'
import { Matrix4 } from '@at/math'
import { Engine } from '@at/engine'
import { Offset } from '@at/geometry'
import { GestureDispositionKind } from './gesture'
import { PointerChangeKind, PointerDeviceKind, PointerEventButtonKind, SanitizedPointerEvent } from './sanitizer'
import { GestureRecognizerStateKind, PrimaryPointerGestureRecognizer } from './recognizer'

import { Gesture } from './gesture'

// => common
export interface TapDetail {
  globalPosition: Offset
  localPosition: Offset
  kind?: PointerDeviceKind
}

export interface GestureTapCallback {
  (detail?: TapDetail): void
}

export class TapGestureRecognizer extends PrimaryPointerGestureRecognizer {
  static create (engine: Engine): TapGestureRecognizer {
    return new TapGestureRecognizer(engine) 
  }

  public onTapDown: GestureTapCallback | null = null
  public onTapUp: GestureTapCallback | null = null
  public onTap: GestureTapCallback | null = null
  public onTapCancel: GestureTapCallback | null = null

  public onSecondaryTap: GestureTapCallback | null = null
  public onSecondaryTapDown: GestureTapCallback | null = null
  public onSecondaryTapUp: GestureTapCallback | null = null
  public onSecondaryTapCancel: GestureTapCallback | null = null

  public onTertiaryTapDown: GestureTapCallback | null = null
  public onTertiaryTapUp: GestureTapCallback | null = null
  public onTertiaryTapCancel: GestureTapCallback | null = null

  protected down: SanitizedPointerEvent | null = null
  protected up: SanitizedPointerEvent | null = null
  
  protected sent: boolean = false
  protected wonArenaForPrimaryPointer: boolean = false


  constructor (engine: Engine) {
    super(engine, Gesture.env<number>('ATKIT_GESTURE_PRESS_TIMEOUT', 100))
  }

  isPointerAllowed (event: SanitizedPointerEvent) {
    switch (event.buttons) {
      case PointerEventButtonKind.Primary:
        if (
          this.onTapDown === null &&
          this.onTap === null &&
          this.onTapUp === null &&
          this.onTapCancel === null
        ) {
          return false
        }
        break
      case PointerEventButtonKind.Secondary:
        if (
          this.onSecondaryTap === null &&
          this.onSecondaryTapDown === null &&
          this.onSecondaryTapUp === null &&
          this.onSecondaryTapCancel === null
        ) {
          return false
        }
        break
      case PointerEventButtonKind.Tertiary:
        if (
          this.onTertiaryTapDown === null &&
          this.onTertiaryTapUp === null &&
          this.onTertiaryTapCancel === null
        ) {
          return false
        }
        break
      default:
        return false
    }

    return super.isPointerAllowed(event)
  }

  addAllowedPointer (event: SanitizedPointerEvent) {
    invariant(event !== null, 'The argument "event" cannot be null.')
    if (this.state === GestureRecognizerStateKind.Ready) {
      if (this.down !== null && this.up !== null) {
        invariant(this.down.id === this.up.id, 'The "TapGestureRecognizer.down" id must be equal "TapGestureRecognizer.up" id.')
        this.reset()
      }

      this.down = event
    }

    if (this.down !== null) {
      super.addAllowedPointer(event)
    }
  }

  /**
   * 
   * @param {number} id 
   * @param {Matrix4 | null} transform 
   */
  startTrackingPointer (id: number, transform: Matrix4 | null) {
    invariant(this.down !== null, 'The "TapGestureRecognizer.down" cannot be null before calling "startTrackingPointer".')
    super.startTrackingPointer(id, transform)
  }

  handlePrimaryPointer (event: SanitizedPointerEvent) {
    invariant(this.down, 'The "TapGestureRecognizer.down" cannot be null before calling "handlePrimaryPointer".')

    if (event.change === PointerChangeKind.Up) {
      this.up = event
      this.checkUp()
    } else if (event.change === PointerChangeKind.Cancel) {
      this.resolve(GestureDispositionKind.Rejected)
      if (this.sent) {
        this.checkCancel(event)
      }
      this.reset()
    } else if (event.buttons !== this.down.buttons) {
      invariant(this.primary)
      this.resolve(GestureDispositionKind.Rejected)
      this.stopTrackingPointer(this.primary)
    }
  }

  resolve (disposition: GestureDispositionKind) {
    if (this.wonArenaForPrimaryPointer && disposition == GestureDispositionKind.Rejected) {
      invariant(this.sent)
      this.checkCancel(null)
      this.reset()
    }
    
    super.resolve(disposition)
  }

  didExceedDeadline () {
    this.checkDown()
  }

  accept (pointer: number) {
    super.accept(pointer)
    if (pointer === this.primary) {
      this.checkDown()
      this.wonArenaForPrimaryPointer = true
      this.checkUp()
    }
  }

  reject (pointer: number) {
    super.reject(pointer)
    if (pointer === this.primary) {
      invariant(this.state !== GestureRecognizerStateKind.Possible)
      if (this.sent) {
        this.checkCancel(null)
      }
      this.reset()
    }
  }

  checkDown () {
    if (this.sent) {
      return
    }

    invariant(this.down, 'The "TapGestureRecognizer.down" cannot be null.')
    this.handleTapDown(this.down)
    this.sent = true
  }

  checkUp () {
    if (
      !this.wonArenaForPrimaryPointer || 
      this.up === null
    ) {
      return
    }
    
    invariant(this.up, 'The "TapGestureRecognizer.up" cannot be null.')
    invariant(this.down, 'The "TapGestureRecognizer.down" cannot be null.')
    invariant(this.up.id === this.down.id)

    this.handleTapUp(this.down, this.up)
    this.reset()
  }

  checkCancel (event: SanitizedPointerEvent | null, note: string = '') {
    invariant(this.down, 'The "TapGestureRecognizer.down" cannot be null.')
    this.handleTapCancel(this.down, event, note)
  }

  reset () {
    this.sent = false
    this.wonArenaForPrimaryPointer = false
    this.up = null
    this.down = null
  }

  handleTapDown (down: SanitizedPointerEvent) {
    const detail: TapDetail = {
      globalPosition: down.position,
      localPosition: down.localPosition,
      kind: this.getKindForPointer(down.id),
    }

    switch (down.buttons) {
      case PointerEventButtonKind.Primary:
        if (this.onTapDown !== null) {
          this.onTapDown(detail)
        }
        break
      case PointerEventButtonKind.Primary:
        if (this.onSecondaryTapDown !== null) {
          this.onSecondaryTapDown(detail)
        }
        break
      case PointerEventButtonKind.Tertiary:
        if (this.onTertiaryTapDown !== null) {
          this.onTertiaryTapDown(detail)
        }
        break
      default:
    }
  }

  handleTapUp (down: SanitizedPointerEvent, up: SanitizedPointerEvent) {
    const details: TapDetail = {
      kind: up.kind,
      globalPosition: up.position,
      localPosition: up.localPosition,
    }
    switch (down.buttons) {
      case PointerEventButtonKind.Primary:
        if (this.onTapUp !== null) {
          this.onTapUp(details)
        }

        if (this.onTap !== null) {
          this.onTap()
        }
        break
      case PointerEventButtonKind.Secondary:
        if (this.onSecondaryTapUp !== null) {
          this.onSecondaryTapUp(details)
        }

        if (this.onSecondaryTap !== null) {
          this.onSecondaryTap()
        }
        break
      case PointerEventButtonKind.Tertiary:
        if (this.onTertiaryTapUp !== null) {
          this.onTertiaryTapUp(details)
        }
        break
      default:
        break
    }
  }

  handleTapCancel (down: SanitizedPointerEvent, cancel: SanitizedPointerEvent | null, reason: string) {
    switch (down.buttons) {
      case PointerEventButtonKind.Primary:
        if (this.onTapCancel !== null) {
          this.onTapCancel()
        }
        break
      case PointerEventButtonKind.Secondary:
        if (this.onSecondaryTapCancel !== null) {
          this.onSecondaryTapCancel()
        }
        break
      case PointerEventButtonKind.Tertiary:
        if (this.onTertiaryTapCancel !== null) {
          this.onTertiaryTapCancel()
        }
        break
      default:
        break
    }
  }

  dispose (): void {
    this.onTap = null
    this.onTapDown = null
    this.onTapUp = null
    this.onTapCancel = null

    super.dispose()
  }
}
