import { listEquals } from '@at/utils'
import { Engine } from './engine'
import * as Skia from './skia'

//// => PathDashEffect
// 虚线效果
export class PathDashEffect extends Skia.ManagedSkiaRef<Skia.PathEffect> {
  static create (
    pettern: number[], 
    phase?: number,
  ) {
    return new PathDashEffect(pettern, phase)
  }

  static resurrect (pettern: number[], phase: number): Skia.PathEffect {
    return Engine.skia.PathEffect.MakeDash(pettern, phase) as Skia.PathEffect
  }

  // => pattern
  protected _pattern: number[]
  public get pattern () {
    return this._pattern
  }
  public set pattern (pattern: number[]) {
    if (
      this._pattern.length !== pattern.length ||
      this._pattern.some((value: number, index: number) => {
        return pattern[index] !== value
      })
    ) {
      this._pattern = pattern
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
    pattern: number[] = [], 
    phase: number = 0
  ) {
    super(PathDashEffect.resurrect(pattern, phase))

    this._pattern = pattern
    this._phase = phase
  } 

  resurrect (): Skia.PathEffect {
    return PathDashEffect.resurrect(this.pattern, this.phase)
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
      other.pattern.length === this.pattern.length &&
      listEquals(this.pattern, other.pattern)
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

  toString () {
    return `PathDashEffect(
      [pattern]: ${this.pattern},
      [phase]: ${this.phase}
    )`
  }
}