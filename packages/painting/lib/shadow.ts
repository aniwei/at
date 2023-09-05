import { invariant } from 'ts-invariant'
import { Offset } from '../basic/geometry'
import { AtPaint } from '../engine/paint'
import { Color } from '../basic/color'
import { AtMaskFilter } from '../engine/mask-filter'
import { convertRadiusToSigma, lerp } from '../basic/helper'
import { At } from '../at'

export abstract class AtShapeShadow<T extends AtShapeShadow<T>> {
  public color: Color
  public offset: Offset
  public blurRadius: number

  public get blurSigma () {
    return convertRadiusToSigma(this.blurRadius)
  } 

  /**
   * 构造函数
   * @param {Color} color 
   * @param {Offset} offset 
   * @param {number} blurRadius 
   */
  constructor (
    color: Color = At.kPaintDefaultColor as Color,
    offset: Offset = Offset.zero,
    blurRadius: number = 0.0
  ) {
    invariant(color !== null, `The argument "color" cannot be null.`)
    invariant(offset !== null, `The argument "offset" cannot be null.`)
    invariant(blurRadius >= 0.0, `Text shadow blur radius should be non-negative.`)
    
    this.color = color
    this.offset = offset
    this.blurRadius = blurRadius
  }

  toPaint (): AtPaint {
    const paint = new AtPaint()
    paint.color = this.color
    paint.maskFilter = AtMaskFilter.blur(At.BlurStyle.Normal, this.blurSigma)

    return paint
  }

  /**
   * 
   * @param {number} factor 
   * @returns {AtShadow}
   */
  scale (factor: number): AtShapeShadow<T>  {
    return new AtShadow(this.color, this.offset.multiply(factor), this.blurRadius * factor)
  }

  equal (other: AtShapeShadow<T> | null) {
    return (
      other instanceof AtShapeShadow &&
      other.color == this.color &&
      other.offset == this.offset &&
      other.blurRadius == this.blurRadius
    )
  }

  notEqual (other: AtShapeShadow<T> | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `AtShapeShadow(${this.color}, ${this.offset}, ${this.blurRadius})`
  }
}

export type AtShadowOptions = {
  color: Color,
  offset: Offset,
  blurRadius: number,
}

export class AtShadow extends AtShapeShadow<AtShadow> {
  static create (options: AtShadowOptions) {
    return new AtShadow(
      options.color,
      options.offset,
      options.blurRadius
    )
  }

  /**
   * 阴影插值计算
   * @param {AtShadow} a 
   * @param {AtShadow} b 
   * @param {number | null} t 
   * @returns {AtShadow ｜ null}
   */
  static lerp  (a: AtShadow | null, b: AtShadow | null, t: number): AtShadow | null {
    invariant(t !== null, `The argument "t" cannot be null.`)
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
          Color.lerp(a.color, b.color, t) as Color,
          Offset.lerp(a.offset, b.offset, t) as Offset,
          lerp(a.blurRadius, b.blurRadius, t),
        )
      }
    }
  }

  /**
   * 阴影列表插值计算
   * @param {ArrayLike<AtShadow> | null} a 
   * @param {ArrayLike<AtShadow> | null} b 
   * @param {number} t 
   * @returns {AtShadow[] | null}
   */
  static lerpList (a: ArrayLike<AtShadow> | null, b: ArrayLike<AtShadow> | null, t: number): AtShadow[] | null {
    invariant(t != null, `The argument "t" cannot be null.`)
    if (a === null && b === null) {
      return null
    }

    a ??= []
    b ??= []
    const result: AtShadow[] =[]
    const commonLength = Math.min(a.length, b.length)
    
    for (let i = 0; i < commonLength; i += 1) {
      result.push(AtShadow.lerp(a[i], b[i], t)!)
    }

    for (let i = commonLength; i < a.length; i += 1) {
      result.push(a[i].scale(1.0 - t));
    }

    for (let i = commonLength; i < b.length; i += 1) {
      result.push(b[i].scale(t));
    }

    return result
  }
}

export class AtShapeShadows<T extends AtShapeShadow<T>> extends Array<T> {
  equal (shadows: AtShapeShadows<T> | null) {
    if (shadows instanceof AtShapeShadows) {
      if (shadows.length !== this.length) {
        return false
      }

      for (let i = 0; i < this.length; i++) {
        const shadow = this[i]

        if (shadow.notEqual(shadows[i] ?? null)) {
          return false
        }
      }

      return true
    }

    return false
  }

  /**
   * 
   * @param shadows 
   * @returns 
   */
  notEqual (shadows: AtShapeShadows<T> | null) {
    return !this.equal(shadows)
  }
}

export class AtShadows extends AtShapeShadows<AtShadow> {
  static create (shadows: AtShadow[]) {
    return new AtShadows(...shadows)
  }

  static lerp (a: AtShadows | null, b: AtShadows | null, t: number ): AtShadows | null {
    invariant(t != null, `The argument "t" cannot be null.`)
    if (a === null && b === null) {
      return null
    }

    a ??= AtShadows.create([])
    b ??= AtShadows.create([])
    const result: AtShadow[] = []
    const size = Math.min(a.length, b.length)
    
    for (let i = 0; i < size; i += 1) {
      result.push(AtShadow.lerp(a[i], b[i], t) as AtShadow)
    }

    for (let i = size; i < a.length; i += 1) {
      result.push(a[i].scale(1.0 - t))
    }

    for (let i = size; i < b.length; i += 1) {
      result.push(b[i].scale(t))
    }

    return AtShadows.create(result)
  }
}