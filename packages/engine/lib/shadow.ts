import { invariant, lerp } from '@at/utils'
import { Color, Equalable } from '@at/basic'
import { Offset } from '@at/geometry'
import { toSigma } from './to'
import { Paint } from './paint'
import { Engine } from './engine'
import { MaskFilter } from './mask-filter'


//// => Shadow
// 阴影
export interface ShadowFactory<T> {
  new (
    color: Color,
    offset: Offset,
    blurRadius: number
  ): T
  create (
    color: Color,
    offset: Offset,
    blurRadius: number
  ): T
}
export class Shadow extends Equalable<Shadow> {
  static create <T extends Shadow> (
    color: Color,
    offset: Offset,
    blurRadius: number
  ): Shadow {
    const ShadowFactory = this as unknown as ShadowFactory<T>
    return new ShadowFactory(color, offset, blurRadius) as Shadow
  }
  /**
   * 
   * @param a 
   * @param b 
   * @param t 
   * @returns 
   */
  static lerp (
    a: Shadow | null = null, 
    b: Shadow | null = null, 
    t: number
  ): Shadow | null {
    a ??= null
    b ??= null
    invariant(t !== null)
    if (b === null) {
      if (a === null) {
        return null
      } else {
        return a.scale(1.0 - t)
      }
    } else {
      if (a === null) {
        return b.scale(t)
      } else {
        return new Shadow(
          Color.lerp(a.color, b.color, t)!,
          Offset.lerp(a.offset, b.offset, t)!,
          lerp(a.blurRadius, b.blurRadius, t),
        )
      }
    }
  }

  /**
   * 
   * @param a 
   * @param b 
   * @param t 
   * @returns 
   */
  static lerpList (
    a: Shadow[] | null = null, 
    b: Shadow[] | null = null, 
    t: number
  ): Shadow[] | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }
    a ??= []
    b ??= []
    const result: Shadow[] = []
    const commonLength = Math.min(a.length, b.length)
    for (let i = 0; i < commonLength; i += 1) {
      result.push(Shadow.lerp(a[i], b[i], t)!)
    }
    for (let i = commonLength; i < a.length; i += 1) {
      result.push(a[i].scale(1.0 - t))
    }
    for (let i = commonLength; i < b.length; i += 1) {
      result.push(b[i].scale(t));
    }
    return result
  }

  get blurSigma () {
    return toSigma(this.blurRadius)
  }

  public color: Color
  public offset: Offset
  public blurRadius: number

  /**
   * 构造函数
   * @param color 
   * @param offset 
   * @param blurRadius 
   */
  constructor(
    color: Color,
    offset: Offset,
    blurRadius: number
  ) {
    invariant(blurRadius >= 0.0, 'Text shadow blur radius should be non-negative.')
    super()
    this.color = color ?? Color.BLACK
    this.offset = offset ?? Offset.ZERO
    this.blurRadius = blurRadius ?? 0.0
  }

  /**
   * 
   * @param factor 
   * @returns 
   */
  scale (factor: number): Shadow {
    return new Shadow(
      this.color,
      this.offset.multiply(factor),
      this.blurRadius * factor,
    )
  }

  /**
   * 是否相等
   * @param other 
   * @returns 
   */
  equal (other: Shadow | null): boolean {
    return (
      other instanceof Shadow &&
      other.color === this.color &&
      other.offset === this.offset &&
      other.blurRadius === this.blurRadius
    )
  }

  /**
   * 是否相等
   * @param {Shadow | null} other 
   * @returns {boolean}
   */
  notEqual (other: Shadow | null): boolean {
    return !this.equal(other)
  }

  /**
   * 
   * @returns {Paint}
   */
  toPaint (): Paint {
    const paint = new Paint()
    
    paint.color = this.color
    paint.filter.mask = MaskFilter.blur(Engine.skia.BlurStyle.Normal, this.blurSigma)

    return paint
  }

  toString () {
    return `Shadow(
      [color]: ${this.color}, 
      [offset]: ${this.offset}, 
      [blurRadius]: ${this.blurRadius}
    )`
  }
}