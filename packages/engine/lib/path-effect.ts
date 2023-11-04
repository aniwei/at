import { listEquals } from '@at/basic'
import { At } from '@at/core'
import * as Skia from './skia'


export class PathDashEffect extends Skia.ManagedSkiaRef<Skia.PathEffect> {
  // static create (
  //   pettern: number[], 
  //   phase?: number,
  // ) {
  //   return new PathDashEffect(pettern, phase)
  // }

  static resurrect <T extends Skia.PathEffect> (pettern: number[], phase: number): T{
    return At.skia.PathEffect.MakeDash(pettern, phase) as T
  }

  // => pettern
  protected _pettern: number[]
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
  protected _phase: number
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
    super(PathDashEffect.resurrect(pettern, phase))

    this._pettern = pettern
    this._phase = phase
  } 

  resurrect (): Skia.PathEffect {
    return PathDashEffect.resurrect(this.pettern, this.phase)
  }

  /**
   * 是否相等
   * @param {PathDashEffect | null} other 
   * @returns {boolean}
   */
  equal (other: PathDashEffect | null): boolean {
    return (
      other instanceof PathDashEffect &&
      other.phase === this.phase &&
      other.pettern.length === this.pettern.length &&
      listEquals(this.pettern, other.pettern)
    )
  }

  /**
   * 是否相等
   * @param {PathDashEffect | null} other 
   * @returns {boolean}
   */
  notEqual (other: PathDashEffect | null): boolean {
    return !this.equal(other)
  }
}