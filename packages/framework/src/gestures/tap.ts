import { invariant } from 'ts-invariant'
import { Matrix4 } from '../basic/matrix4'
import { Offset } from '../basic/geometry'
import { PointerDeviceKind } from './pointer'
import { GestureDisposition } from './arena'
import { AtPointerEvent, PointerEventButtonTypes } from './events'
import { AtPrimaryPointerGestureRecognizer, GestureRecognizerState } from './recognizer'
import { At } from '../at'


export type TapDetails = {
  globalPosition: Offset
  kind?: PointerDeviceKind
  localPosition: Offset
}

type GestureTapCallback = (details?: TapDetails) => void

export abstract class AtBaseTapGestureRecognizer extends AtPrimaryPointerGestureRecognizer {

  private sentTapDown: boolean = false
  private wonArenaForPrimaryPointer: boolean = false

  private down: AtPointerEvent | null = null
  private up: AtPointerEvent | null = null

  constructor () {
    invariant(At.kPressTimeout)
    super(At.kPressTimeout)
  }

  abstract handleTapDown (down: AtPointerEvent): void
  abstract handleTapUp (down: AtPointerEvent, up: AtPointerEvent): void
  abstract handleTapCancel(down: AtPointerEvent, cancel: AtPointerEvent | null, reason: string ): void

  addAllowedPointer (event: AtPointerEvent) {
    invariant(event !== null)
    if (this.state == GestureRecognizerState.Ready) {
      if (this.down !== null && this.up !== null) {
        invariant(this.down.pointer === this.up.pointer)
        this.reset()
      }

      invariant(this.down === null && this.up === null)
      this.down = event
    }
    if (this.down !== null) {
      super.addAllowedPointer(event)
    }
  }
  
  startTrackingPointer (pointer: number, transform: Matrix4 | null) {
    invariant(this.down !== null)
    super.startTrackingPointer(pointer, transform)
  }

  handlePrimaryPointer (event: AtPointerEvent) {
    invariant(this.down)
    if (event.isUp()) {
      this.up = event
      this.checkUp()
    } else if (event.isCancel()) {
      this.resolve(GestureDisposition.Rejected)
      if (this.sentTapDown) {
        this.checkCancel(event, '')
      }
      this.reset()
    } else if (event.buttons !== this.down.buttons) {
      invariant(this.primary)
      this.resolve(GestureDisposition.Rejected)
      this.stopTrackingPointer(this.primary)
    }
  }

  resolve (disposition: GestureDisposition) {
    if (this.wonArenaForPrimaryPointer && disposition == GestureDisposition.Rejected) {
      invariant(this.sentTapDown)
      this.checkCancel(null, 'spontaneous')
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
      invariant(this.state !== GestureRecognizerState.Possible)
      if (this.sentTapDown) {
        this.checkCancel(null, 'forced')
      }
      this.reset()
    }
  }

  checkDown () {
    if (this.sentTapDown) {
      return
    }

    invariant(this.down)
    this.handleTapDown(this.down)
    this.sentTapDown = true
  }

  checkUp () {
    if (!this.wonArenaForPrimaryPointer || this.up === null) {
      return
    }
    
    invariant(this.up)
    invariant(this.down)
    invariant(this.up.pointer === this.down.pointer)

    this.handleTapUp(this.down, this.up)
    this.reset()
  }

  checkCancel (event: AtPointerEvent | null, note: string) {
    invariant(this.down)
    this.handleTapCancel(this.down, event, note)
  }

  reset () {
    this.sentTapDown = false
    this.wonArenaForPrimaryPointer = false
    this.up = null
    this.down = null
  }
}


export class AtTapGestureRecognizer extends AtBaseTapGestureRecognizer {
  static create () {
    return new AtTapGestureRecognizer()
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

  isPointerAllowed (event: AtPointerEvent) {
    switch (event.buttons) {
      case PointerEventButtonTypes.Primary:
        if (
          this.onTapDown === null &&
          this.onTap === null &&
          this.onTapUp === null &&
          this.onTapCancel === null
        ) {
          return false
        }
        break
      case PointerEventButtonTypes.Secondary:
        if (
          this.onSecondaryTap === null &&
          this.onSecondaryTapDown === null &&
          this.onSecondaryTapUp === null &&
          this.onSecondaryTapCancel === null
        ) {
          return false
        }
        break
      case PointerEventButtonTypes.Tertiary:
        if (
          this.onTertiaryTapDown === null &&
          this.onTertiaryTapUp === null &&
          this.onTertiaryTapCancel === null
        ) {
          return false
        }
        break
      default:
        return false;
    }

    return super.isPointerAllowed(event)
  }

  
  handleTapDown (down: AtPointerEvent) {
    const details: TapDetails = {
      globalPosition: down.position,
      localPosition: down.localPosition,
      kind: this.getKindForPointer(down.pointer),
    }

    switch (down.buttons) {
      case PointerEventButtonTypes.Primary:
        if (this.onTapDown !== null) {
          this.invokeCallback<void>('onTapDown', () => this.onTapDown!(details))
        }
        break
      case PointerEventButtonTypes.Primary:
        if (this.onSecondaryTapDown !== null) {
          this.invokeCallback<void>('onSecondaryTapDown', () => {
            invariant(this.onSecondaryTapDown)
            this.onSecondaryTapDown(details)
          })
        }
        break
      case PointerEventButtonTypes.Tertiary:
        if (this.onTertiaryTapDown !== null) {
          this.invokeCallback<void>('onTertiaryTapDown', () => {
            invariant(this.onTertiaryTapDown)
            this.onTertiaryTapDown(details)
          })
        }
        break
      default:
    }
  }

  handleTapUp (down: AtPointerEvent, up: AtPointerEvent) {
    const details: TapDetails = {
      kind: up.kind,
      globalPosition: up.position,
      localPosition: up.localPosition,
    }
    switch (down.buttons) {
      case PointerEventButtonTypes.Primary:
        if (this.onTapUp !== null) {
          this.invokeCallback<void>('onTapUp', () => {
            invariant(this.onTapUp)
            this.onTapUp(details)
          })
        }
        if (this.onTap !== null) {
          this.invokeCallback<void>('onTap', () => {
            invariant(this.onTap)
            this.onTap()
          })
        }
        break
      case PointerEventButtonTypes.Secondary:
        if (this.onSecondaryTapUp !== null) {
          this.invokeCallback<void>('onSecondaryTapUp', () => {
            invariant(this.onSecondaryTapUp)
            this.onSecondaryTapUp(details)
          })
        }
        if (this.onSecondaryTap !== null) {
          this.invokeCallback<void>('onSecondaryTap', () => {
            invariant(this.onSecondaryTap)
            this.onSecondaryTap()
          })
        }
        break
      case PointerEventButtonTypes.Tertiary:
        if (this.onTertiaryTapUp !== null) {
          this.invokeCallback<void>('onTertiaryTapUp', () => this.onTertiaryTapUp!(details))
        }
        break
      default:
    }
  }

  handleTapCancel (down: AtPointerEvent, cancel: AtPointerEvent | null, reason: string) {
    const note = reason == '' ? reason : '$reason '
    switch (down.buttons) {
      case PointerEventButtonTypes.Primary:
        if (this.onTapCancel !== null) {
          this.invokeCallback<void>('${note}onTapCancel', () => {
            invariant(this.onTapCancel)
            this.onTapCancel()
          })
        }
        break
      case PointerEventButtonTypes.Secondary:
        if (this.onSecondaryTapCancel !== null) {
          this.invokeCallback<void>('${note}onSecondaryTapCancel', () => {
            invariant(this.onSecondaryTapCancel)
            this.onSecondaryTapCancel()
          })
        }
        break
      case PointerEventButtonTypes.Tertiary:
        if (this.onTertiaryTapCancel !== null) {
          this.invokeCallback<void>('${note}onTertiaryTapCancel', () => {
            invariant(this.onTertiaryTapCancel)
            this.onTertiaryTapCancel()
          })
        }
        break
      default:
    }
  }
}
