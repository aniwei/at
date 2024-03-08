import { StrutStyle } from './struct-style'
import { Engine } from './engine'
import { TextLeadingDistributionKind, TextStyle } from './text-style'
import { TextHeightBehavior } from './text-height-behavior'

import * as Skia from './skia'
import { toStrutStyle, toTextHeightBehavior, toTextStyle } from './to'

//// => ParagraphStyle
export interface ParagraphStyleOptions {
  textAlign?: Skia.TextAlign | null
  textDirection?: Skia.TextDirection | null
  maxLines?: number | null
  fontFamily?: string | null
  fontSize?: number | null
  height?: number | null
  textHeightBehavior?: TextHeightBehavior | null
  fontWeight?: Skia.FontWeight | null
  fontStyle?: Skia.FontSlant | null
  strutStyle?: StrutStyle | null
  ellipsis?: string | null
}

export class ParagraphStyle extends Skia.ManagedSkiaRef<Skia.ParagraphStyle> {
  /**
   * 
   * @param {ParagraphStyleOptions} options 
   * @returns {ParagraphStyle}
   */
  static create (options?: ParagraphStyleOptions): ParagraphStyle {
    return new ParagraphStyle(
      options?.textAlign,
      options?.textDirection,
      options?.maxLines,
      options?.fontFamily,
      options?.fontSize,
      options?.height,
      options?.textHeightBehavior,
      options?.fontWeight,
      options?.fontStyle,
      options?.strutStyle,
      options?.ellipsis,
    )
  }

  static resurrect (
    textAlign: Skia.TextAlign | null = null,
    textDirection: Skia.TextDirection | null = null,
    maxLines: number | null = null,
    fontFamily: string | null = null,
    fontSize: number | null = null,
    height: number | null = null,
    textHeightBehavior: TextHeightBehavior | null = null,
    fontWeight: Skia.FontWeight | null = null,
    fontStyle: Skia.FontSlant | null = null,
    strutStyle: StrutStyle | null = null,
    ellipsis: string | null = null,
  ) {
    return new Engine.skia.ParagraphStyle({
      textAlign: textAlign 
        ? textAlign
        : undefined,
      textDirection: textDirection 
        ? textDirection
        : undefined,
      maxLines: maxLines 
        ? maxLines
        : undefined,
      heightMultiplier: height 
        ? height 
        : undefined,
      textHeightBehavior: textHeightBehavior 
        ? toTextHeightBehavior(textHeightBehavior)
        : undefined,
      ellipsis: ellipsis 
        ? ellipsis
        : undefined,
      strutStyle: strutStyle 
        ? toStrutStyle(strutStyle, textHeightBehavior)
        : undefined,
      textStyle: toTextStyle(
        fontFamily,
        fontSize,
        height,
        fontWeight,
        fontStyle
      )
    }) as Skia.ParagraphStyle
  }

  // 文本布局方向
  public textDirection: Skia.TextDirection | null
  // 字体
  public fontFamily: string | null
  // 字号
  public fontSize: number | null
  // 高度
  public height: number | null
  // 字宽
  public fontWeight: Skia.FontWeight | null
  // 字体样式
  public fontStyle: Skia.FontSlant | null
  // 
  public leadingDistribution: TextLeadingDistributionKind | null

  /**
    * @description: 
    * @return {*}
    */
  get style () {
    return TextStyle.create({
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      height: this.height,
      leadingDistribution: this.leadingDistribution,
    })
  }

  constructor (
    textAlign: Skia.TextAlign | null = null,
    textDirection: Skia.TextDirection | null = null,
    maxLines: number | null = null,
    fontFamily: string | null = null,
    fontSize: number | null = null,
    height: number | null = null,
    textHeightBehavior: TextHeightBehavior | null = null,
    fontWeight: Skia.FontWeight | null = null,
    fontStyle: Skia.FontSlant | null = null, // MAKE SURE?
    strutStyle: StrutStyle | null = null,
    ellipsis: string | null = null,
  ) {

    textDirection ??= Engine.skia.TextDirection.LTR 

    const skia = ParagraphStyle.resurrect(
      textAlign,
      textDirection,
      maxLines,
      fontFamily,
      fontSize,
      height,
      textHeightBehavior,
      fontWeight,
      fontStyle,
      strutStyle,
      ellipsis,
    )

    super(skia)

    this.height = height ?? null
    this.fontFamily = fontFamily ?? null
    this.fontSize = fontSize ?? null
    this.fontWeight = fontWeight ?? null
    this.fontStyle = fontStyle ?? null
    this.textDirection = textDirection ?? null
    this.leadingDistribution = textHeightBehavior?.leadingDistribution ?? null 
  } 
}