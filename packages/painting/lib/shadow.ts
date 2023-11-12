import { Offset } from '@at/geometry'
import { Color } from '@at/basic'
import * as Engine from '@at/engine'

//// => ShapeShadow
// 图形引用
export abstract class ShapeShadow extends Engine.Shadow {
  static create <T extends ShapeShadow> (...rests: unknown[]): ShapeShadow
  static create (
    color: Color,
    offset: Offset,
    blurRadius: number
  ) {
    return super.create(color, offset, blurRadius) as ShapeShadow
  }
  /**
   * 
   * @param {number} factor 
   * @returns {Shadow}
   */
  scale (factor: number): ShapeShadow  {
    return ShapeShadow.create(
      this.color, 
      this.offset.multiply(factor), 
      this.blurRadius * factor
    )
  }

  equal (other: ShapeShadow | null) {
    return (
      other instanceof ShapeShadow &&
      other.color == this.color &&
      other.offset == this.offset &&
      other.blurRadius == this.blurRadius
    )
  }

  notEqual (other: ShapeShadow | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `ShapeShadow(
      [color]: ${this.color}, 
      [offset]: ${this.offset}, 
      [blurRadius]: ${this.blurRadius}
    )`
  }
}

//// => Shadow
export type ShadowOptions = {
  color: Color,
  offset: Offset,
  blurRadius: number,
}

export class Shadow extends ShapeShadow {
  static create <T extends Shadow> (options: ShadowOptions) {
    return super.create(
      options.color,
      options.offset,
      options.blurRadius
    ) as T
  }
}

//// => ShapeShadows
export class ShapeShadows<T extends ShapeShadow> extends Array<T> {
  /**
   * 是否相等
   * @param {ShapeShadows} shadows 
   * @returns 
   */
  equal (shadows: ShapeShadows<T> | null) {
    if (shadows instanceof ShapeShadows) {
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
   * 是否相等
   * @param {ShapeShadows} shadows 
   * @returns 
   */
  notEqual (shadows: ShapeShadows<T> | null) {
    return !this.equal(shadows)
  }
}
