import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Color } from '@at/basic'
import * as Engine from '@at/engine'

export abstract class ShapeShadow extends Engine.Shadow {
  static create <T extends ShapeShadow> (...rests: unknown[]): T
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

export class ShapeShadows extends Array<ShapeShadow> {
  equal (shadows: ShapeShadows | null) {
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
   * 
   * @param shadows 
   * @returns 
   */
  notEqual (shadows: ShapeShadows | null) {
    return !this.equal(shadows)
  }
}

export class Shadows extends ShapeShadows {
  static create (shadows: Shadow[]) {
    return new Shadows(...shadows)
  }

  static lerp (a: Shadows | null, b: Shadows | null, t: number ): Shadows | null {
    invariant(t != null, `The argument "t" cannot be null.`)
    if (a === null && b === null) {
      return null
    }

    a ??= Shadows.create([])
    b ??= Shadows.create([])
    const result: Shadow[] = []
    const size = Math.min(a.length, b.length)
    
    for (let i = 0; i < size; i += 1) {
      result.push(Shadow.lerp(a[i], b[i], t) as Shadow)
    }

    for (let i = size; i < a.length; i += 1) {
      result.push(a[i].scale(1.0 - t))
    }

    for (let i = size; i < b.length; i += 1) {
      result.push(b[i].scale(t))
    }

    return Shadows.create(result)
  }
}