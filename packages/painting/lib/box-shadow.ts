import { UnimplementedError, lerp } from '@at/utils'
import { Color } from '@at/basic'
import { Offset } from '@at/geometry'
import { Engine, MaskFilter, Paint, Skia } from '@at/engine'
import { ShapeShadow, ShapeShadows } from './shadow'

export type BoxShadowOptions = {
  color?: Color
  offset?: Offset
  blurRadius?: number
  spreadRadius?: number
  blurStyle?: Skia.BlurStyle
}

export class BoxShadow extends ShapeShadow {
  /**
   * 创建阴影
   * @param options 
   * @returns 
   */
  static create (options: BoxShadowOptions) {
    return new BoxShadow(
      options.color,
      options.offset,
      options.blurRadius,
      options.spreadRadius,
      options.blurStyle
    ) as BoxShadow
  }

  /**
   * 插值计算
   * @param {BoxShadow} a 
   * @param {BoxShadow} b 
   * @param {number} t 
   * @returns {BoxShadow | null}
   */
  static lerp (a: BoxShadow | null, b: BoxShadow | null, t: number): BoxShadow | null {
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return b!.scale(t)
    }

    if (b === null) {
      return a.scale(1.0 - t)
    }

    return new BoxShadow(
      Color.lerp(a.color, b.color, t) as Color,
      Offset.lerp(a.offset, b.offset, t) as Offset,
      lerp(a.blurRadius, b.blurRadius, t),
      lerp(a.spreadRadius, b.spreadRadius, t),
      a.blurStyle === Engine.skia.BlurStyle.Normal 
        ? b.blurStyle 
        : a.blurStyle
    )
  }  
  
  /**
   * 
   * @param {BoxShadow[] | null} a 
   * @param {BoxShadow[]} b 
   * @param {number} t 
   * @returns {BoxShadow[] | null}
   */
  static lerpList (
    a: BoxShadow[] | null, 
    b: BoxShadow[],
    t: number
  ): BoxShadow[] | null {
    throw new UnimplementedError()
    // if (a === null && b === null) {
    //   return null
    // }
    // a ??= []
    // b ??= []
    // // const commonLength = Math.min(a.length, b.length)

    // return []
  }

  public spreadRadius: number
  public blurStyle: Skia.BlurStyle

  /**
   * 构造函数
   * @param {Color} color 
   * @param {Offset} offset 
   * @param {number} blurRadius 
   * @param {number} spreadRadius 
   * @param {Skia.BlurStyle} blurStyle 
   */
  constructor (
    color: Color = Color.BLACK,
    offset: Offset = Offset.ZERO,
    blurRadius: number = 0,
    spreadRadius: number = 0,
    blurStyle: Skia.BlurStyle = Engine.skia.BlurStyle.Normal,
  ) {
    super(color, offset, blurRadius)

    this.spreadRadius = spreadRadius
    this.blurStyle = blurStyle
  }

  toPaint (): Paint {
    const paint = Paint.create()
    paint.color = this.color
    paint.filter.mask = MaskFilter.blur(this.blurStyle, this.blurSigma)
    
    return paint
  }

  /**
   * @param {number} factor
   * @return {*}
   */  
  scale (factor: number) {
    return new BoxShadow(
      this.color,
      this.offset.multiply(factor),
      this.blurRadius * factor,
      this.spreadRadius * factor,
      this.blurStyle,
    )
  }

  /**
   * 判断盒子阴影是否相同
   * @param {BoxShadow} other
   * @return {*}
   */  
  equal (other: BoxShadow | null) {
    return (
      other instanceof BoxShadow && 
      other.color.equal(this.color) && 
      other.offset.equal(this.offset) && 
      other.blurRadius === this.blurRadius && 
      other.spreadRadius === this.spreadRadius && 
      other.blurStyle === this.blurStyle
    )
  }

  notEqual (other: BoxShadow | null) {
    return !this.equal(other)
  }

  toString () {
    return `BoxShadow(
      [color]: ${this.color}, 
      [offset]: ${this.offset}, 
      [blurRadius]: ${this.blurRadius}, 
      [spreadRadius]: ${this.spreadRadius},
      [blurStyle]: ${this.blurStyle}
    )`
  } 
}

//// => BoxShadows
// 盒子阴影
export class BoxShadows extends ShapeShadows<BoxShadow> { 
  static create (shadows: BoxShadow[]) {
    return new BoxShadows(...shadows)
  }

  static lerp (a: BoxShadows | null, b: BoxShadows | null, t: number ): BoxShadows | null {
    if (a === null && b === null) {
      return null
    }

    a ??= BoxShadows.create([])
    b ??= BoxShadows.create([])
    const result: BoxShadow[] = []
    const size = Math.min(a.length, b.length)
    
    for (let i = 0; i < size; i += 1) {
      result.push(BoxShadow.lerp(a[i], b[i], t) as BoxShadow)
    }

    for (let i = size; i < a.length; i += 1) {
      result.push(a[i].scale(1.0 - t))
    }

    for (let i = size; i < b.length; i += 1) {
      result.push(b[i].scale(t))
    }

    return BoxShadows.create(result)
  }
}