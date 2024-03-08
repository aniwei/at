import { invariant } from '@at/utils'
import { Color } from '@at/basic'
import { Paint } from './paint'
import { Engine } from './engine'
import { ParagraphCommand } from './paragraph-command'
import { ParagraphPlaceholder } from './paragraph-placeholder'
import { ParagraphStyle } from './paragraph-style'
import { Paragraph } from './paragraph'
import { TextStyle } from './text-style'

import * as Skia from './skia'

//// => ParagraphBuilder
export class ParagraphBuilder extends Skia.ManagedSkiaRef<Skia.ParagraphBuilder> {
  static create (style: ParagraphStyle) {
    return new ParagraphBuilder(style)
  }

  static resurrect<T extends Skia.SkiaRef>(style: ParagraphStyle): Skia.ParagraphBuilder {
    invariant(style.skia)
    const skia = Engine.skia.ParagraphBuilder.MakeFromFontProvider(
      style.skia,
      Engine.fonts.provider as Skia.TypefaceFontProvider,
    ) 

    return skia
  }

  // => defaultTextForeground
  // 默认前景画笔
  static _defaultTextForeground: Paint | null = null
  static get defaultTextForeground () {
    if (this._defaultTextForeground === null) {
      this._defaultTextForeground = Paint.create()
    }

    return this._defaultTextForeground
  }

  // => defaultTextBackground
  // 默认背景画笔
  static _defaultTextBackground: Paint | null = null
  static get defaultTextBackground () {
    if (this._defaultTextBackground === null) {
      this._defaultTextBackground = Paint.create()
      this._defaultTextBackground.color = Color.BLACK
    } 
    
    return this._defaultTextBackground
  }

  // => builder
  public get builder () {
    invariant(this.skia)
    return this.skia
  }

  // 文本基础样式
  public style: ParagraphStyle
  // 文本样式集合
  public styles: TextStyle[] = []
  // 指令集
  public commands: ParagraphCommand[] = []
  // => placeholder
  // placeholder 相关成员
  public count: number = 0
  public scales: number[] = []

  /**
   * @param {ParagraphStyle} style
   * @return {*}
   */  
  constructor (paragraphStyle: ParagraphStyle) {
    const skia = ParagraphBuilder.resurrect(paragraphStyle)
    super(skia)

    this.style = paragraphStyle
    this.styles.push(paragraphStyle.style)
  }
  
  /**
   * @param {number} width
   * @param {number} height
   * @param {PlaceholderAlignment} alignment
   * @param {number} scale
   * @param {number} baselineOffset
   * @param {TextBaseline} baseline
   * @return {*}
   */
  placeholder (
    width: number,
    height: number,
    alignment: Skia.PlaceholderAlignment,
    scale: number = 1.0,
    baselineOffset: number | null = null,
    baseline: Skia.TextBaseline | null = null,
  ) {
    this.count++
    this.scales.push(scale)

    const placeholder: ParagraphPlaceholder = ParagraphPlaceholder.create({
      width: width * scale,
      height: height * scale,
      alignment: alignment,
      offset: (baselineOffset ?? height) * scale,
      baseline: baseline ?? Engine.skia.TextBaseline.Alphabetic,
    })

    this.commands.push(ParagraphCommand.placeholder(placeholder))
    this.builder.addPlaceholder(
      placeholder.width,
      placeholder.height,
      placeholder.alignment,
      placeholder.baseline,
      placeholder.offset,
    )
  }

  /**
   * @param {string} text
   * @return {*}
   */
  text (text: string) {
    this.commands.push(ParagraphCommand.text(text))
    this.builder.addText(text)
  }

  /**
   * @description: 
   * @return {*}
   */
  build () {
    const paragraph = this.buildParagraph()

    return Paragraph.create({
      paragraph, 
      style: this.style, 
      commands: this.commands
    })
  }

  /**
   * @description: 
   * @return {*}
   */
  buildParagraph () {
    const result = this.builder.build()
    this.builder.delete()
    return result
  }

  /**
   * @return {*}
   */
  pop () {
    if (this.styles.length > 1) {
      this.commands.push(ParagraphCommand.pop())
      this.styles.pop()
      this.builder.pop()
    }
  }

  /**
   * @description: 
   * @return {*}
   */
  peek () {
    invariant(this.styles.length > 0, 'The style stack was empty.')
    return this.styles[this.styles.length - 1]
  }
    
  /**
   * @description: 
   * @param {TextStyle} style
   * @return {*}
   */
  push (style: TextStyle) {
    const peeked = this.peek() as TextStyle
    const merged = peeked.mergeWith(style)
    
    this.styles.push(merged)
    this.commands.push(ParagraphCommand.style(style))
    
    if (
      merged.foreground !== null || 
      merged.background !== null
    ) {
      let foreground: Paint | null =  merged.foreground ?? null

      if (foreground === null) {
        ParagraphBuilder.defaultTextForeground.color = Color.create(merged.color?.value ?? 0xFF0000)
        foreground = ParagraphBuilder.defaultTextForeground
      }

      const background: Paint = merged.background ?? ParagraphBuilder.defaultTextBackground
      this.builder.pushPaintStyle(
        merged.skia,
        foreground.skia, 
        background.skia
      )
    } else {
      this.builder.pushStyle(merged.skia)
    }
  }
}