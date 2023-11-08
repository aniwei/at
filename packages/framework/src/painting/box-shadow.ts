import invariant from '@at/utils'
import { Color } from '../basic/color'
import { Offset } from '../basic/geometry'
import { BlurStyle } from '../engine/skia'
import { AtShapeShadow, AtShapeShadows } from './shadow'
import { lerp } from '../basic/helper'
import { At, AtMaskFilter, AtPaint } from '../at'

export type AtBoxShadowOptions = {
  color?: Color
  offset?: Offset
  blurRadius?: number
  spreadRadius?: number
  blurStyle?: BlurStyle
}

export class AtBoxShadow extends AtShapeShadow<AtBoxShadow> {
  /**
   * 创建阴影
   * @param options 
   * @returns 
   */
  static create (options: AtBoxShadowOptions) {
    return new AtBoxShadow(
      options.color,
      options.offset,
      options.blurRadius,
      options.spreadRadius,
      options.blurStyle
    )
  }

  /**
   * 插值计算
   * @param {AtBoxShadow} a 
   * @param {AtBoxShadow} b 
   * @param {number} t 
   * @returns {AtBoxShadow | null}
   */
  static lerp(a: AtBoxShadow | null, b: AtBoxShadow | null, t: number): AtBoxShadow | null {
    invariant(t !== null, `The argument "t" cannot be null.`)

    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return b!.scale(t)
    }

    if (b === null) {
      return a.scale(1.0 - t);
    }

    return new AtBoxShadow(
      Color.lerp(a.color, b.color, t) as Color,
      Offset.lerp(a.offset, b.offset, t) as Offset,
      lerp(a.blurRadius, b.blurRadius, t),
      lerp(a.spreadRadius, b.spreadRadius, t),
      a.blurStyle === At.BlurStyle.Normal ? b.blurStyle : a.blurStyle
    )
  }  
  
  /**
   * 
   * @param {ArrayLike<AtBoxShadow> | null} a 
   * @param {ArrayLike<AtBoxShadow>} b 
   * @param {number} t 
   * @returns {AtBoxShadow[] | null}
   */
  static lerpList (
    a: ArrayLike<AtBoxShadow> | null, 
    b: ArrayLike<AtBoxShadow>,
    t: number
  ): AtBoxShadow[] | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }
    a ??= []
    b ??= []
    const commonLength = Math.min(a.length, b.length)

    return []
  }

  public spreadRadius: number
  public blurStyle: BlurStyle

  /**
   * 构造函数
   * @param {Color} color 
   * @param {Offset} offset 
   * @param {number} blurRadius 
   * @param {number} spreadRadius 
   * @param {BlurStyle} blurStyle 
   */
  constructor (
    color: Color = At.kPaintDefaultColor as Color,
    offset: Offset = Offset.zero,
    blurRadius: number = 0,
    spreadRadius: number = 0,
    blurStyle: BlurStyle = At.BlurStyle.Normal,
  ) {
    super(color, offset, blurRadius)

    this.spreadRadius = spreadRadius
    this.blurStyle = blurStyle
  }

  toPaint (): AtPaint {
    const paint = new AtPaint()
    paint.color = this.color
    paint.maskFilter = AtMaskFilter.blur(this.blurStyle, this.blurSigma)
    
    return paint
  }

  /**
   * @description: 
   * @param {number} factor
   * @return {*}
   */  
  scale (factor: number) {
    return new AtBoxShadow(
      this.color,
      this.offset.multiply(factor),
      this.blurRadius * factor,
      this.spreadRadius * factor,
      this.blurStyle,
    )
  }

  /**
   * 判断盒子阴影是否相同
   * @param {AtBoxShadow} other
   * @return {*}
   */  
  equal (other: AtBoxShadow | null) {
    return (
      other instanceof AtBoxShadow && 
      other.color.equal(this.color) && 
      other.offset.equal(this.offset) && 
      other.blurRadius === this.blurRadius && 
      other.spreadRadius === this.spreadRadius && 
      other.blurStyle === this.blurStyle
    )
  }

  notEqual (other: AtBoxShadow | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtBoxShadow(${this.color}, ${this.offset}, ${this.blurRadius}, ${this.spreadRadius}, ${this.blurStyle})`
  } 
}

export class AtBoxShadows extends AtShapeShadows<AtBoxShadow> { 
  static create (shadows: AtBoxShadow[]) {
    return new AtBoxShadows(...shadows)
  }

  static lerp (a: AtBoxShadows | null, b: AtBoxShadows | null, t: number ): AtBoxShadows | null {
    invariant(t != null, `The argument "t" cannot be null.`)
    if (a === null && b === null) {
      return null
    }

    a ??= AtBoxShadows.create([])
    b ??= AtBoxShadows.create([])
    const result: AtBoxShadow[] = []
    const size = Math.min(a.length, b.length)
    
    for (let i = 0; i < size; i += 1) {
      result.push(AtBoxShadow.lerp(a[i], b[i], t) as AtBoxShadow)
    }

    for (let i = size; i < a.length; i += 1) {
      result.push(a[i].scale(1.0 - t))
    }

    for (let i = size; i < b.length; i += 1) {
      result.push(b[i].scale(t))
    }

    return AtBoxShadows.create(result)
  }
}