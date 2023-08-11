/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-10-30 01:51:15
 */
import invariant from 'ts-invariant'
import { At } from '../at'

import type { Font, Typeface, TypefaceFontProvider } from './skia'

export type UnloadedFont = {
  family: string,
  buffer?: ArrayBuffer,
  uri?: string
}

/**
 * @description: 已注册字体
 * @return {AtRegisteredFont}
 */
class AtRegisteredFont {
  public family: string
  public buffer: ArrayBuffer
  public typeface: Typeface

  constructor (
    family: string,
    buffer: ArrayBuffer,
    typeface: Typeface
  ) {
    this.family = family
    this.buffer = buffer
    this.typeface = typeface

    const font = new At.Font(typeface)
    font.getGlyphBounds([0], null)
  }
}

/**
 * @description: 字体管理
 * @return {AtFonts}
 */
export class AtFonts {
  static create () {
    return new AtFonts()
  }

  public provider: TypefaceFontProvider | null = null
  public unloaded: Promise<AtRegisteredFont | null>[] = []
  
  public registered: AtRegisteredFont[] = []
  public familyToFont: Map<string, Font[]> = new Map()

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
    this.provider = At.TypefaceFontProvider.Make()

    for (const font of this.registered) {
      this.provider.registerFont(font.buffer, font.family)
      let families = this.familyToFont.get(font.family)

      if (families === undefined) {
        this.familyToFont.set(font.family, families = [])
      }

      families.push(new At.Font(font.typeface))
    }
  }

  async registerFromAssets () {}

  /**
   * @description: 注册字体
   * @param {ArrayBuffer} data
   * @param {string} faimily
   * @return {*}
   */
  register (data: ArrayBuffer, family: string): Promise<null | AtRegisteredFont>
  register (url: string, family: string): Promise<null | AtRegisteredFont>
  register (url: string | ArrayBuffer, family: string) {
    if (typeof url === 'string') {
      return window.fetch(url)
        .then(resp => resp.arrayBuffer())
        .then((buffer: ArrayBuffer) => {
          const typeface = At.Typeface.MakeFreeTypeFaceFromData(buffer)
          invariant(typeface)
  
          return new AtRegisteredFont(family, buffer, typeface)
        }).catch((error: any) => {
          throw error
          return null
        })
    } else {
      const typeface = At.Typeface.MakeFreeTypeFaceFromData(url)
      return new AtRegisteredFont(family, url, typeface!)
    }
  }
}