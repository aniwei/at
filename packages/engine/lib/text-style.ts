import { Color } from '@at/basic'
import { invariant } from '@at/utils'
import { Shadow } from './shadow'
import { Paint } from './paint'
import { Engine } from './engine'
import { FontFeature } from './font-feature'
import { TextDecoration } from './text-decoration'

import * as Skia from './skia'

//// => TextHeightBehavior
// 文本高度行为
export enum TextLeadingDistributionKind {
  Proportional, // 比例
  Even,         // 均匀
}

//// => TextStyle
// 文本样式
export interface TextStyleOptions {
  color?: Color | null
  decoration?: TextDecoration | null
  decorationColor?: Color | null
  decorationStyle?: Skia.DecorationStyle | null
  decorationThickness?: number | null
  fontWeight?: Skia.FontWeight | null
  fontStyle?: Skia.FontSlant | null
  textBaseline?: Skia.TextBaseline | null
  fontFamily?: string | null
  fontSize?: number | null
  letterSpacing?: number | null
  wordSpacing?: number | null
  height?: number | null
  leadingDistribution?: TextLeadingDistributionKind | null
  background?: Paint | null
  foreground?: Paint | null
  shadows?: Shadow[] | null
  fontFeatures?: FontFeature[] | null
}

export class TextStyle extends Skia.ManagedSkiaRef<Skia.TextStyle> {
  static create (options?: TextStyleOptions) {
    return new TextStyle(
      options?.color,
      options?.decoration,
      options?.decorationColor,
      options?.decorationStyle,
      options?.decorationThickness,
      options?.fontWeight,
      options?.fontStyle,
      options?.textBaseline,
      options?.fontFamily,
      options?.fontSize,
      options?.letterSpacing,
      options?.wordSpacing,
      options?.height,
      options?.leadingDistribution,
      options?.background,
      options?.foreground,
      options?.shadows
    )
  }

  static resurrect<T extends Skia.SkiaRef>(
    color: Color | null = null,
    decoration: TextDecoration | null = null,
    decorationColor: Color | null = null,
    decorationStyle: Skia.DecorationStyle | null = null,
    decorationThickness: number | null = null,
    fontWeight: Skia.FontWeight | null = null,
    fontStyle: Skia.FontSlant | null = null,
    textBaseline: Skia.TextBaseline | null = null,
    fontFamily: string | null = null,
    fontSize: number | null = null,
    letterSpacing: number | null = null,
    wordSpacing: number | null = null,
    height: number | null = null,
    leadingDistribution: TextLeadingDistributionKind | null = null,
    background: Paint | null = null,
    foreground: Paint | null = null,
    shadows: Shadow[] | null = null
  ): Skia.TextStyle {
    return new Engine.skia.TextStyle({
      fontFamilies: fontFamily ? [fontFamily] : undefined,
      backgroundColor: background ? background.color.fresh : undefined,
      color: color ? color.fresh : undefined,
      decoration: decoration ? decoration.mask : undefined,
      decorationColor: decorationColor ? decorationColor : undefined,
      decorationStyle: decorationStyle ? decorationStyle : undefined,
      decorationThickness: decorationThickness ? decorationThickness : undefined,
      textBaseline: textBaseline ? textBaseline : undefined,
      fontSize: fontSize ? fontSize : undefined,
      letterSpacing: letterSpacing ? letterSpacing : undefined,
      wordSpacing: wordSpacing ? wordSpacing : undefined,
      heightMultiplier: height ? height : undefined,
      halfLeading: leadingDistribution 
        ? leadingDistribution === TextLeadingDistributionKind.Even ? true : false
        : undefined,
      fontStyle: {
        weight: fontWeight ? fontWeight : undefined,
        slant: fontStyle ? fontStyle : undefined
      },
      foregroundColor: foreground ? foreground.color.fresh : undefined,
      shadows: shadows ? shadows.map(shadow => ({
        ...shadow,
        color: shadow.color.fresh,
      })) : undefined
    }) as  unknown as Skia.TextStyle
  }

  public get skia () {
    invariant(super.skia)
    return super.skia
  }

  // => _fontFamilies
  protected _fontFamilies: string[] | null = null
  public get fontFamilies (): string[] {
    if (this._fontFamilies === null) {
      const fontFamilies: string[] = []
      const fontFamily = this.fontFamily
      
    if (fontFamily !== null) {
      fontFamilies.push(fontFamily)
    }
  
      this._fontFamilies = fontFamilies 
    }

    return this._fontFamilies
  }

  public color: Color | null
  public decoration: TextDecoration | null
  public decorationColor: Color | null
  public decorationStyle: Skia.DecorationStyle | null
  public decorationThickness: number | null
  public fontWeight: Skia.FontWeight | null
  public fontStyle: Skia.FontSlant | null
  public textBaseline: Skia.TextBaseline | null
  public fontFamily: string | null
  public fontSize: number | null
  public letterSpacing: number | null
  public wordSpacing: number | null
  public height: number | null
  public leadingDistribution: TextLeadingDistributionKind | null
  public background: Paint | null
  public foreground: Paint | null
  public shadows: Shadow[] | null

  constructor (
    color: Color | null = null,
    decoration: TextDecoration | null = null,
    decorationColor: Color | null = null,
    decorationStyle: Skia.DecorationStyle | null = null,
    decorationThickness: number | null = null,
    fontWeight: Skia.FontWeight | null = null,
    fontStyle: Skia.FontSlant | null = null,
    textBaseline: Skia.TextBaseline | null = null,
    fontFamily: string | null = null,
    fontSize: number | null = null,
    letterSpacing: number | null = null,
    wordSpacing: number | null = null,
    height: number | null = null,
    leadingDistribution: TextLeadingDistributionKind | null = null,
    background: Paint | null = null,
    foreground: Paint | null = null,
    shadows: Shadow[] | null = null,
  ) {
    const skia = TextStyle.resurrect(
      color,
      decoration,
      decorationColor,
      decorationStyle,
      decorationThickness,
      fontWeight,
      fontStyle,
      textBaseline,
      fontFamily,
      fontSize,
      letterSpacing,
      wordSpacing,
      height,
      leadingDistribution,
      background,
      foreground,
      shadows,
    )

    super(skia)
    this.color = color 
    this.decoration = decoration 
    this.decorationColor = decorationColor 
    this.decorationStyle = decorationStyle 
    this.decorationThickness = decorationThickness 
    this.fontWeight = fontWeight 
    this.fontStyle = fontStyle 
    this.textBaseline = textBaseline 
    this.fontFamily = fontFamily 
    this.fontSize = fontSize 
    this.letterSpacing = letterSpacing 
    this.wordSpacing = wordSpacing 
    this.height = height 
    this.leadingDistribution = leadingDistribution 
    this.background = background 
    this.foreground = foreground 
    this.shadows = shadows 
  }

  resurrect (): Skia.TextStyle {
    return TextStyle.resurrect(
      this.color,
      this.decoration,
      this.decorationColor,
      this.decorationStyle,
      this.decorationThickness,
      this.fontWeight,
      this.fontStyle,
      this.textBaseline,
      this.fontFamily,
      this.fontSize,
      this.letterSpacing,
      this.wordSpacing,
      this.height,
      this.leadingDistribution,
      this.background,
      this.foreground,
      this.shadows,
    )
  }

  /**
   * 样式合并
   * @param {TextStyle} other
   * @return {*}
   */
  mergeWith (other: TextStyle): TextStyle  {
    return new TextStyle(
      other.color ?? this.color,
      other.decoration ?? this.decoration,
      other.decorationColor ?? this.decorationColor,
      other.decorationStyle ?? this.decorationStyle,
      other.decorationThickness ?? this.decorationThickness,
      other.fontWeight ?? this.fontWeight,
      other.fontStyle ?? this.fontStyle,
      other.textBaseline ?? this.textBaseline,
      other.fontFamily ?? this.fontFamily,
      other.fontSize ?? this.fontSize,
      other.letterSpacing ?? this.letterSpacing,
      other.wordSpacing ?? this.wordSpacing,
      other.height ?? this.height,
      other.leadingDistribution ?? this.leadingDistribution,
      other.background ?? this.background,
      other.foreground ?? this.foreground,
      other.shadows ?? this.shadows,
    )
  }
}