import { invariant, clamp, lerp, UnsupportedError } from '@at/utils'
import { ArrayLike } from './array-like'

/**
 * 放大颜色 Alpha
 * @param {Color} a 
 * @param {number} factor 
 * @returns {Color}
 */
export function scaleAlpha (a: Color, factor: number) {
  return a.withAlpha(clamp(Math.round((a.alpha * factor)), 0, 255))
}

/**
 * 颜色类
 */
export class Color extends ArrayLike<Color> {
  static BLACK = new Color(0xff000000)
  static CLEAR = new Color(0x00000000)

  /**
   * 创建
   * @param {number} value 
   * @returns {Color}
   */
  static create (value: number) {
    return new Color(value) as Color
  }

  /**
   * 插值运算
   * @param {Color | null} a 
   * @param {Color | null} b 
   * @param {number} t 
   * @returns {Color | null}
   */
  static lerp (a: Color | null, b: Color | null, t: number): Color | null {
    invariant(t !== null, `The argument t cannot be null.`)
    if (b === null) {
      if (a === null) {
        return null
      } else {
        return scaleAlpha(a, 1.0 - t)
      }
    } else {
      if (a === null) {
        return scaleAlpha(b, t)
      } else {
        return Color.fromARGB(
          clamp(Math.floor(lerp(a.alpha, b.alpha, t)), 0, 255),
          clamp(Math.floor(lerp(a.red, b.red, t)), 0, 255),
          clamp(Math.floor(lerp(a.green, b.green, t)), 0, 255),
          clamp(Math.floor(lerp(a.blue, b.blue, t)), 0, 255),
        )
      }
    }
  }

  /**
   * 解析颜色字符串
   * @param {string} color 
   * @returns {Color}
   */
  static fromString (color: string) {
    color = color.toLowerCase()

    if (color.startsWith('#')) {
      let r: number = 255
      let g: number = 255
      let b: number = 255
      let a: number = 255

      switch (color.length) {
        case 9: {
          r = parseInt(color.slice(1, 3), 16)
          g = parseInt(color.slice(3, 5), 16)
          b = parseInt(color.slice(5, 7), 16)
          a = parseInt(color.slice(7, 9), 16)
          break
        }

        case 7: {
          r = parseInt(color.slice(1, 3), 16)
          g = parseInt(color.slice(3, 5), 16)
          b = parseInt(color.slice(5, 7), 16)
          break
        }

        case 5: {
          r = parseInt(color.slice(1, 2), 16) * 17
          g = parseInt(color.slice(2, 3), 16) * 17
          b = parseInt(color.slice(3, 4), 16) * 17
          a = parseInt(color.slice(4, 5), 16) * 17
          break
        }

        case 4: {
          r = parseInt(color.slice(1, 2), 16) * 17
          g = parseInt(color.slice(2, 3), 16) * 17
          b = parseInt(color.slice(3, 4), 16) * 17
          break
        }
      }

      return Color.fromARGB(a, r, g, b)
    } else if (color.startsWith('rgba')) {
      color = color.slice(5, -1)
      const[r, g, b, a] = color.split(',').map(v => parseInt(v))

      return Color.fromARGB(a, r, g, b)
    } else if (color.startsWith('rgb')) {
      color = color.slice(4, -1)
      const[r, g, b] = color.split(',').map(v => parseInt(v))

      return Color.fromARGB(255, r, g, b)
    }

    throw new UnsupportedError('Unsupport color format.')
  }

  /**
   * 创建颜色
   * @param {number} a 
   * @param {number} r 
   * @param {number} g 
   * @param {number} b 
   * @returns 
   */
  static fromARGB (...rest: number[]): Color 
  static fromARGB (a: number, r: number, g: number, b: number) {
    const value = (
      (
        ((r & 0xff) << 16) |
        ((g & 0xff) << 8) |
        ((b & 0xff) << 0)
      ) | ((a & 0xff) << 24)
    ) >>> 0

    return Color.create(value)
  }

  /**
   * 通过 RGBO 创建 Color 对象
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @param {number} o
   * @return {*}
   */
  static fromRGBO (...rest: number[]): Color 
  static fromRGBO (r: number, g: number, b: number, o: number) {
    const value = (
      (
        ((r & 0xff) << 16) |
        ((g & 0xff) << 8) |
        ((b & 0xff) << 0)
      ) | (((Math.floor(o * 0xff / 1)) & 0xff) << 24)
    ) >>> 0

    return Color.create(value)
  }

  /**
   * Alpha 颜色混合
   * @param {Color} foreground
   * @param {Color} background
   * @return {Color}
   */
  static alphaBlend (foreground: Color, background: Color) {
    const alpha = foreground.alpha
    
    // 如果前景色透明
    if (alpha === 0) {
      return background
    }

    const invAlpha = 0xff - alpha
    let backAlpha = background.alpha

    if (backAlpha === 0xff) {
      return Color.fromARGB(
        0xff,
        Math.floor((alpha * foreground.red + invAlpha * background.red) / 0xff),
        Math.floor((alpha * foreground.green + invAlpha * background.green) / 0xff),
        Math.floor((alpha * foreground.blue + invAlpha * background.blue) / 0xff),
      )
    } else {
      backAlpha = Math.floor((backAlpha * invAlpha) / 0xff)
      const outAlpha = alpha + backAlpha
      invariant(outAlpha !== 0)
      return Color.fromARGB(
        outAlpha,
        Math.floor((foreground.red * alpha + background.red * backAlpha) / outAlpha),
        Math.floor((foreground.green * alpha + background.green * backAlpha) / outAlpha),
        Math.floor((foreground.blue * alpha + background.blue * backAlpha) / outAlpha),
      )
    }
  }

  /**
   * 
   * @param {number} component 
   * @returns {number}
   */
  static linearizeColorComponent (component: number) {
    if (component <= 0.03928) {
      return component / 12.92
    }
    return Math.pow((component + 0.055) / 1.055, 2.4)
  }

  /**
   * 从 Opacity 计算 Alpha 值
   * @param {number} opacity 
   * @returns {number}
   */
  static computeAlphaFromOpacity (opacity: number) {
    return Math.round((clamp(opacity, 0.0, 1.0) * 255))
  }
  
  // => alpha
  public get alpha () {
    return this[3]
  }

  // => opacity
  public get opacity () {
    return this.alpha / 0xff
  }

  // => red
  public get red () {
    return this[0]
  }

  // => green
  public get green () {
    return this[1]
  }

  // => blue
  public get blue () {
    return this[2]
  }

  // => value
  public get value (): number {
    return (
      (
        ((this.red & 0xff) << 16) |
        ((this.green & 0xff) << 8) |
        ((this.blue & 0xff) << 0)
      ) | ((this.alpha & 0xff) << 24)
    ) >>> 0
  }

  // => fresh
  public get fresh () {
    const color = new Float32Array(4)
    color[0] = this.red / 255.0
    color[1] = this.green / 255.0
    color[2] = this.blue / 255.0
    color[3] = this.alpha / 255.0
    return color
  }

  /**
   * 构造函数
   * @param {number} value 
   */
  constructor (value: number) {
    value = (value & 0xffffffff) >>> 0
    
    super(
      (0x00ff0000 & value) >>> 16,
      (0x0000ff00 & value) >>> 8,
      (0x000000ff & value) >>> 0,
      (0xff000000 & value) >>> 24
    )
  }

  /**
   * @param {number} a
   * @return {Color}
   */  
  withAlpha (a: number) {
    return Color.fromARGB(a, this.red, this.green, this.blue)
  }

  /**
   * 
   * @param {number} opacity 
   * @returns {Color}
   */
  withOpacity (opacity: number) {
    return this.withAlpha(Math.round((255.0 * opacity)))
  }

  /**
   * 
   * @param {number} r 
   * @returns {Color}
   */
  withRed (r: number) {
    return Color.fromARGB(this.alpha, r, this.green, this.blue)
  }

  /**
   * 
   * @param {number} g 
   * @returns {Color}
   */
  withGreen (g: number) {
    return Color.fromARGB(this.alpha, this.red, g, this.blue)
  }

  /**
   * 
   * @param {number} b 
   * @returns {Color}
   */
  withBlue (b: number) {
    return Color.fromARGB(this.alpha, this.red, this.green, b)
  }

  /**
   * 
   * @returns {number}
   */
  computeLuminance () {
    const R = Color.linearizeColorComponent(this.red / 0xff)
    const G = Color.linearizeColorComponent(this.green / 0xff)
    const B = Color.linearizeColorComponent(this.blue / 0xff)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }

  /**
   * 判断颜色值是否相等
   * @param {Color} color  
   * @returns {boolean}
   */
  equal (color: Color | null) {
    if (color instanceof Color) {
      return this.value === color.value
    }
    
    return false
  }

  /**
   * 
   * @param color 
   * @returns 
   */
  notEqual (color: Color | null) {
    return !this.equal(color)
  }

  toJSON () {
    return [
      this.red,
      this.green,
      this.blue,
      this.opacity
    ]
  }

  /**
   * 输出颜色字符串值
   * @returns {string}
   */
  toString (format?: 'hex' | '') {
    return `Color(
      [value]: ${this.value}
    )`
  }
}