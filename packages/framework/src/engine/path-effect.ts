import { UnimplementedError } from '../basic/error'
import { AtManagedSkiaObject, PathEffect } from './skia'
import { At } from '../at'

export abstract class AtPathEffect extends AtManagedSkiaObject<PathEffect> {
  static resurrect (...rest: unknown[]) {
    throw new UnimplementedError()
  }

  abstract equal (other: AtPathEffect | null): boolean
  abstract notEqual (other: AtPathEffect | null): boolean
}


export class AtPathDashEffect extends AtPathEffect {
  static create (pettern: number[], phase?: number) {
    return new AtPathDashEffect(pettern, phase)
  }

  static resurrect (pettern: number[], phase: number) {
    return At.PathEffect.MakeDash(pettern, phase)
  }

  // => pettern
  private _pettern: number[]
  public get pettern () {
    return this._pettern
  }
  public set pettern (pettern: number[]) {
    if (
      this._pettern.length !== pettern.length ||
      this._pettern.some((value: number, index: number) => {
        return pettern[index] !== value
      })
    ) {
      this._pettern = pettern
      this.skia = this.resurrect()
    }
  }

  // => phase
  private _phase: number
  public get phase () {
    return this._phase
  }
  public set phase (phase: number) {
    if (this._phase !== phase) {
      this._phase = phase
      this.skia = this.resurrect()
    }
  }

  constructor (
    pettern: number[] = [], 
    phase: number = 0
  ) {
    super(AtPathDashEffect.resurrect(pettern, phase))

    this._pettern = pettern
    this._phase = phase
  } 

  resurrect (): PathEffect {
    return AtPathDashEffect.resurrect(this.pettern, this.phase)
  }

  equal (other: AtPathDashEffect | null): boolean {
    return (
      other instanceof AtPathDashEffect &&
      other.phase === this.phase &&
      other.pettern.length === this.pettern.length &&
      !other.pettern.some((value: number, index: number) => other.pettern[index] !== this.pettern[index])
    )
  }

  notEqual (other: AtPathDashEffect | null): boolean {
    return !this.equal(other)
  }
}