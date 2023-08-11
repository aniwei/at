import { invariant } from 'ts-invariant'
import { At } from '../at'
import { AtPaint } from './paint'
import { Color } from '../basic/color'
import { Offset } from '../basic/geometry'
import { AtMaskFilter } from './mask-filter'
import { convertRadiusToSigma, lerp } from '../basic/helper'

export class AtShadow {
  /**
   * 
   * @param a 
   * @param b 
   * @param t 
   * @returns 
   */
  static lerp (
    a: AtShadow | null = null, 
    b: AtShadow | null = null, 
    t: number
  ): AtShadow | null {
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
        return new AtShadow(
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
    a: AtShadow[] | null = null, 
    b: AtShadow[] | null = null, 
    t: number
  ): AtShadow[] | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }
    a ??= []
    b ??= []
    const result: AtShadow[] = []
    const commonLength = Math.min(a.length, b.length)
    for (let i = 0; i < commonLength; i += 1) {
      result.push(AtShadow.lerp(a[i], b[i], t)!)
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
    return convertRadiusToSigma(this.blurRadius)
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
    invariant(color !== null, 'Text shadow color was null.')
    invariant(offset !== null, 'Text shadow offset was null.')
    invariant(blurRadius >= 0.0, 'Text shadow blur radius should be non-negative.')

    this.color = color ?? At.kPaintDefaultColor
    this.offset = offset ?? Offset.zero
    this.blurRadius = blurRadius ?? 0.0
  }
  
  /**
   * 
   * @returns {AtPaint}
   */
  toPaint (): AtPaint {
    const paint = new AtPaint()
    
    paint.color = this.color
    paint.maskFilter = AtMaskFilter.blur(At.BlurStyle.Normal, this.blurSigma)

    return paint
  }

  /**
   * 
   * @param factor 
   * @returns 
   */
  scale (factor: number): AtShadow {
    return new AtShadow(
      this.color,
      this.offset.multiply(factor),
      this.blurRadius * factor,
    )
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  equal (other: AtShadow) {
    return (
      other instanceof AtShadow &&
      other.color === this.color &&
      other.offset === this.offset &&
      other.blurRadius === this.blurRadius
    )
  }

  toString () {
    return `AtShadow(${this.color}, ${this.offset}, ${this.blurRadius})`
  }
}