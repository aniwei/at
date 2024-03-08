import { ParagraphPlaceholder } from './paragraph-placeholder'
import { TextStyle } from './text-style'

//// => ParagraphCommand
export enum ParagraphCommandKind {
  // 增加文本操作
  Text,
  // 弹出操作
  Pop,
  // 增加文本样式
  Style,
  // 增加占位符样式
  Placeholder,
}

export interface ParagraphCommandOptions {
  type: ParagraphCommandKind,
  text?: string | null,
  style?: TextStyle | null,
  placeholder?: ParagraphPlaceholder | null,
}

export class ParagraphCommand {
  static create (options: ParagraphCommandOptions) {
    return new ParagraphCommand(
      options.type,
      options?.text,
      options?.style,
      options?.placeholder,
    )
  }

  public type: ParagraphCommandKind
  public text: string | null = null
  public style: TextStyle | null = null
  public placeholder: ParagraphPlaceholder | null = null

  /**
   * @param {ParagraphCommandKind} type
   * @param {string} text
   * @param {TextStyle} style
   * @param {ParagraphPlaceholder} placeholder
   * @return {*}
   */
  constructor (
    type: ParagraphCommandKind,
    text: string | null = null,
    style: TextStyle | null = null,
    placeholder: ParagraphPlaceholder | null = null,
  ) {
    this.type = type 
    this.text = text ?? null
    this.style = style ?? null
    this.placeholder = placeholder ?? null
  }

  /**
   * @param {string} text
   * @return {*}
   */
  static text (text: string) {
    return ParagraphCommand.create({
      type: ParagraphCommandKind.Text, 
      text, 
    })
  }

  /**
   * @return {*}
   */
  static pop () {
    return ParagraphCommand.create({
      type: ParagraphCommandKind.Pop
    })
  }

  /**
   * @param {TextStyle} style
   * @return {*}
   */
  static style (style: TextStyle) {
    return ParagraphCommand.create({
      type: ParagraphCommandKind.Style, 
      style,
    })
  }

  /**
   * @param {ParagraphPlaceholder} placeholderStyle
   * @return {*}
   */
  static placeholder (placeholder: ParagraphPlaceholder) {
    return ParagraphCommand.create({
      type: ParagraphCommandKind.Placeholder, 
      placeholder
    })
  }
}