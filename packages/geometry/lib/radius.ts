import { invariant } from 'ts-invariant'
import { lerp } from '@at/basic'

export class Radius extends Computable<Radius> implements ArrayLike<number> {
    static ZERO = Radius.circular(0)
    /**
     * 
     * @param dx 
     * @param dy 
     * @returns 
     */
    static create (dx: number, dy: number) {
      return new Radius(dx, dy)
    }
  
    /**
     * @description: 插值计算
     * @param {Radius} a
     * @param {Radius} b
     * @param {number} t
     * @return {*}
     */
    static lerp(
      a: Radius | null = null, 
      b: Radius | null = null, 
      t: number
    ): Radius | null {
      invariant(t !== null, `t cannot be null.`)
      if (b === null) {
        if (a === null) {
          return null
        } else {
          const k = 1.0 - t
          return Radius.elliptical(
            a.x * k, 
            a.y * k
          )
        }
      } else {
        if (a === null) {
          return Radius.elliptical(
            b.x * t, 
            b.y * t
          )
        } else {
          return Radius.elliptical(
            lerp(a.x, b.x, t), 
            lerp(a.y, b.y, t)
          )
        }
      }
    }
  
    /**
     * @description: 
     * @param {number} radius
     * @return {*}
     */  
    static circular (radius: number) {
      return Radius.elliptical(radius, radius)
    }
  
    /**
     * @description: 
     * @param {number} x
     * @param {number} y
     * @return {*}
     */  
    static elliptical (x: number, y: number) {
      return new Radius(x, y)
    }
  
    public x: number
    public y: number
  
    /**
     * @description: 构造函数
     * @param {number} x
     * @param {number} y
     * @return {*}
     */  
    constructor (x: number, y: number) {
      this.x = x
      this.y = y
    }
  
    negate (): Radius {
      return Radius.elliptical(-this.x, -this.y)
    }
  
    add (radius: Radius): Radius {
      return Radius.elliptical(
        this.x + radius.x, 
        this.y + radius.y
      )
    }
  
    subtract (radius: Radius): Radius {
      return Radius.elliptical(
        this.x - radius.x, 
        this.y - radius.y
      )
    }
  
    multiply (radius: number): Radius {
      return Radius.elliptical(this.x * radius, this.y * radius)
    }
  
    divide (radius: number): Radius {
      return Radius.elliptical(this.x / radius, this.y / radius)
    }
  
    modulo (radius: number): Radius {
      return Radius.elliptical(this.x & radius, this.y % radius)
    }
  
    equal (radius: Radius | null) {
      return (
        radius instanceof Radius &&
        radius.x === this.x &&
        radius.y === this.y
      )
    }
  
    notEqual (radius: Radius | null) {
      return !this.equal(radius)
    }
  
    toString () {
      return this.x === this.y ?
        `Radius.circular(${this.x.toFixed(1)})` :
        `Radius.elliptical(${this.x.toFixed(1)})`
    }
  }