/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-10-30 01:51:15
 */
import invariant from 'ts-invariant'
import { At } from '@at/core'

import type { 
  Font, 
  Typeface, 
  TypefaceFontProvider 
} from './skia'

export type UnloadedFont = {
  family: string,
  buffer?: ArrayBuffer,
  uri?: string
}

/**
 * @description: 已注册字体
 * @return {RegisteredFont}
 */
export class RegisteredFont {
  static create (
    family: string,
    buffer: ArrayBuffer,
    typeface: Typeface
  ) {
    return new RegisteredFont(family, buffer, typeface)
  }

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

    const font = new At.skia.Font(typeface)
    font.getGlyphBounds([0], null)
  }
}

/**
 * @description: 字体管理
 * @return {Fonts}
 */
export class Fonts {
  static create () {
    return new Fonts()
  }

  public provider: TypefaceFontProvider | null = null
  public unloaded: Promise<RegisteredFont | null>[] = []
  
  public registered: RegisteredFont[] = []
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
    this.provider = At.skia.TypefaceFontProvider.Make()

    for (const font of this.registered) {
      this.provider.registerFont(font.buffer, font.family)
      let families = this.familyToFont.get(font.family)

      if (families === undefined) {
        this.familyToFont.set(font.family, families = [])
      }

      families.push(new At.skia.Font(font.typeface))
    }
  }

  async registerFromAssets () {}

  /**
   * @description: 注册字体
   * @param {ArrayBuffer} data
   * @param {string} faimily
   * @return {*}
   */
  register (data: ArrayBuffer, family: string): Promise<null | RegisteredFont>
  register (url: string, family: string): Promise<null | RegisteredFont>
  register (url: string | ArrayBuffer, family: string) {
    if (typeof url === 'string') {
      return window.fetch(url)
        .then(resp => resp.arrayBuffer())
        .then((buffer: ArrayBuffer) => {
          const typeface = At.skia.Typeface.MakeFreeTypeFaceFromData(buffer)
          invariant(typeface)
  
          return new RegisteredFont(family, buffer, typeface)
        }).catch((error: any) => {
          throw error
          return null
        })
    } else {
      const typeface = At.skia.Typeface.MakeFreeTypeFaceFromData(url)
      return new RegisteredFont(family, url, typeface!)
    }
  }
}