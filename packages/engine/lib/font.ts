import { invariant } from '@at/utils'
import { Engine } from './engine'


import * as Skia from './skia'

//// => RegisteredFont
export interface UnloadedFont {
  family: string,
  buffer?: ArrayBuffer,
  uri?: string
}

/**
 * @description: 已注册字体
 * @return {RegisteredFont}
 */
export class RegisteredFont {
  /**
   * 创建
   * @param {string} family 
   * @param {ArrayBuffer} buffer 
   * @param {Skia.Typeface} typeface 
   * @returns {RegisteredFont}
   */
  static create (
    family: string,
    buffer: ArrayBuffer,
    typeface: Skia.Typeface
  ) {
    return new RegisteredFont(family, buffer, typeface)
  }

  public family: string
  public buffer: ArrayBuffer
  public typeface: Skia.Typeface

  /**
   * 
   * @param {string} family 
   * @param {ArrayBuffer} buffer 
   * @param {Skia.Typeface} typeface 
   */
  constructor (
    family: string,
    buffer: ArrayBuffer,
    typeface: Skia.Typeface
  ) {
    this.family = family
    this.buffer = buffer
    this.typeface = typeface

    const font = new Engine.skia.Font(typeface)
    font.getGlyphBounds([0], null)
  }
}

/**
 * @字体管理
 * @return {Fonts}
 */
export class Fonts {
  static create () {
    return new Fonts()
  }

  public provider: Skia.TypefaceFontProvider | null = null
  public unloaded: Array<Promise<RegisteredFont | null>> = []
  
  public registered: RegisteredFont[] = []
  public familyToFont: Map<string, Skia.Font[]> = new Map()

  /**
   * @description: 加载字体
   * @return {*}
   */  
  async load () {
    if (this.unloaded.length > 0) {
      const fonts = await Promise.all(this.unloaded)

      for (const font of fonts) {
        if (font !== null) {
          this.registered.push(font)
        }
      }

      this.unloaded = []
    }
  }

  async ensure () {
    await this.load()

    if (this.provider !== null) {
      this.provider.delete()
      this.provider = null
    }

    this.familyToFont.clear()
    this.provider = Engine.skia.TypefaceFontProvider.Make()

    for (const font of this.registered) {
      this.provider.registerFont(font.buffer, font.family)
      let families = this.familyToFont.get(font.family)

      if (families === undefined) {
        this.familyToFont.set(font.family, families = [])
      }

      families.push(new Engine.skia.Font(font.typeface))
    }
  }

  /**
   * @description: 注册字体
   * @param {ArrayBuffer} data
   * @param {string} faimily
   * @return {*}
   */

  register (data: ArrayBuffer, family: string): Promise<void> {
    const typeface = Engine.skia.Typeface.MakeFreeTypeFaceFromData(data)
    invariant(typeface)
    const font = RegisteredFont.create(family, data, typeface)
    this.registered.push(font)
    return Promise.resolve()
  }
}