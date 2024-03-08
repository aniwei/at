import { invariant } from '@at/utils'
import { lerp } from '@at/utils'
import { Point } from './point'

export class Radius extends Point {
    static ZERO = Radius.circular(0)

    static zero () {
      return Radius.circular(0)
    }

    /**
     * 
     * @param {number} dx 
     * @param {number} dy 
     * @returns 
     */
    static create (dx: number, dy: number) {
      return new Radius(dx, dy) as Radius
    }
  
    /**
     * 插值计算
     * @param {Radius} a
     * @param {Radius} b
     * @param {number} t
     * @return {*}
     */
    static lerp (
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
     * @param {number} radius
     * @return {*}
     */  
    static circular (radius: number) {
      return Radius.elliptical(radius, radius)
    }
  
    /**
     * @param {number} x
     * @param {number} y
     * @return {*}
     */  
    static elliptical (x: number, y: number) {
      return new Radius(x, y)
    }
  
    // => x
    public get x () {
      return super.dx
    }
    public set x (x: number) {
      super.dx = x
    }

    // => y
    public get y (): number {
      return super.dy
    }
    public set y (y: number) {
      super.dy = y
    }

    /**
     *构造函数
     * @param {number} x
     * @param {number} y
     * @return {*}
     */  
    constructor (x: number, y: number) {
      super(x, y)
    }
  
    /**
     * 取反
     * @returns {Radius}
     */
    inverse (): Radius {
      return Radius.elliptical(-this.x, -this.y)
    }
  
    /**
     * 相加
     * @param {Radius} radius 
     * @returns {Radius}
     */
    add (radius: Radius): Radius {
      return Radius.elliptical(
        this.x + radius.x, 
        this.y + radius.y
      )
    }
  
    /**
     * 相减
     * @param {Radius} radius 
     * @returns {Radius}
     */
    subtract (radius: Radius): Radius {
      return Radius.elliptical(
        this.x - radius.x, 
        this.y - radius.y
      )
    }
  
    /**
     * 相乘
     * @param {Radius} radius 
     * @returns {Radius}
     */
    multiply (radius: number): Radius {
      return Radius.elliptical(this.x * radius, this.y * radius)
    }
  
    /**
     * 相除
     * @param {Radius} radius 
     * @returns {Radius}
     */
    divide (radius: number): Radius {
      return Radius.elliptical(this.x / radius, this.y / radius)
    }
  
    /**
     * 求余
     * @param {Radius} radius 
     * @returns {Radius}
     */
    modulo (radius: number): Radius {
      return Radius.elliptical(this.x % radius, this.y % radius)
    }

    /**
     * 克隆
     * @returns {Radius}
     */
    clone () {
      return Radius.elliptical(this.x, this.y)
    }
  
    /**
     * 比较两个对象
     * @param {Radius | null} radius 
     * @returns {boolean}
     */
    equal (radius: Radius | null) {
      return (
        radius instanceof Radius &&
        radius.x === this.x &&
        radius.y === this.y
      )
    }
  
    /**
     * 比较像个对象
     * @param {Radius} radius 
     * @returns {boolean}
     */
    notEqual (radius: Radius | null) {
      return !this.equal(radius)
    }
  
    toString () {
      return `Radius(
        [x]: ${this.x.toFixed(1)}, 
        [y]: ${this.x.toFixed(1)}
      )`
    }
  }