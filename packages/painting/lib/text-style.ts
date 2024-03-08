import { invariant, lerp, listEquals, listNotEquals  } from '@at/utils' 
import { Color } from '@at/basic'
import { 
  Skia,
  Paint, 
  Shadow, 
  ParagraphStyle, 
  StrutStyle, 
  TextDecoration, 
  TextHeightBehavior, 
  TextStyle, 
  FontFeature, 
  TextLeadingDistributionKind, 
  Engine
} from '@at/engine'
import { TextOverflowKind } from './text-painter'


//// => TextPaintingStyle
// 文本样式
export type TextPaintingStyleOptions = {
  // 是否继承
  inherit?: boolean,
  // 字体颜色
  color?: Color,
  // 背景颜色
  backgroundColor?: Color,
  // 字号
  fontSize?: number,
  // 字体
  fontWeight?: Skia.FontWeight,
  // 字体样式
  fontStyle?: Skia.FontSlant,
  // 字间距
  letterSpacing?: number,
  // 词间距
  wordSpacing?: number,
  // 基础线
  textBaseline?: Skia.TextBaseline,
  // 高度
  height?: number,
  leadingDistribution?: TextLeadingDistributionKind,
  // 前景画笔
  foreground?: Paint,
  // 背景画笔
  background?: Paint,
  // 阴影
  shadows?: Shadow[],
  // 字体特性
  fontFeatures?: FontFeature[],
  // 文本装饰
  decoration?: TextDecoration,
  // 装饰颜色
  decorationColor?: Color,
  // 装饰样式
  decorationStyle?: Skia.DecorationStyle,
  decorationThickness?: number,
  // 字体
  fontFamily?: string,
  package?: string,
  // 溢出类型
  overflow?: TextOverflowKind,
}

export class TextPaintingStyle {
  static create (options?: TextPaintingStyleOptions) {
    return new TextPaintingStyle(
      options?.inherit,
      options?.color,
      options?.backgroundColor,
      options?.fontSize,
      options?.fontWeight,
      options?.fontStyle,
      options?.letterSpacing,
      options?.wordSpacing,
      options?.textBaseline,
      options?.height,
      options?.leadingDistribution,
      options?.foreground,
      options?.background,
      options?.shadows,
      options?.fontFeatures,
      options?.decoration,
      options?.decorationColor,
      options?.decorationStyle,
      options?.decorationThickness,
      options?.fontFamily,
      options?.overflow,
    )
  }

  static lerp (a: TextPaintingStyle | null, b: TextPaintingStyle | null, t: number): TextPaintingStyle | null {
    invariant(t !== null);
    invariant(a === null || b === null || a.inherit === b.inherit)

    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      invariant(b)

      return new TextPaintingStyle(
        b.inherit,
        Color.lerp(null, b.color, t),
        Color.lerp(null, b.backgroundColor, t),
        t < 0.5 ? null : b.fontSize,
        t < 0.5 ? null : b.fontWeight,
        t < 0.5 ? null : b.fontStyle,
        t < 0.5 ? null : b.letterSpacing,
        t < 0.5 ? null : b.wordSpacing,
        t < 0.5 ? null : b.textBaseline,
        t < 0.5 ? null : b.height,
        t < 0.5 ? null : b.leadingDistribution,
        t < 0.5 ? null : b.foreground,
        t < 0.5 ? null : b.background,
        t < 0.5 ? null : b.shadows,
        t < 0.5 ? null : b.fontFeatures,
        t < 0.5 ? null : b.decoration,
        Color.lerp(null, b.decorationColor, t),
        t < 0.5 ? null : b.decorationStyle,
        t < 0.5 ? null : b.decorationThickness,
        t < 0.5 ? null : b.fontFamily,
        t < 0.5 ? null : b.overflow,
      )
    }

    if (b === null) {
      invariant(a)
      return new TextPaintingStyle(
        a.inherit,
        Color.lerp(a.color, null, t),
        Color.lerp(null, a.backgroundColor, t),
        t < 0.5 ? a.fontSize : null,
        t < 0.5 ? a.fontWeight : null,
        t < 0.5 ? a.fontStyle : null,
        t < 0.5 ? a.letterSpacing : null,
        t < 0.5 ? a.wordSpacing : null,
        t < 0.5 ? a.textBaseline : null,
        t < 0.5 ? a.height : null,
        t < 0.5 ? a.leadingDistribution : null,
        t < 0.5 ? a.foreground : null,
        t < 0.5 ? a.background : null,
        t < 0.5 ? a.shadows : null,
        t < 0.5 ? a.fontFeatures : null,
        t < 0.5 ? a.decoration : null,
        Color.lerp(a.decorationColor, null, t),
        t < 0.5 ? a.decorationStyle : null,
        t < 0.5 ? a.decorationThickness : null,
        t < 0.5 ? a.fontFamily : null,
        t < 0.5 ? a.overflow : null,
      );
    }

    let foregroundPaint: Paint | null = null

    if (a.foreground !== null || b.foreground !== null) {
      if (t < 0.5) {
        if (!a.foreground) {
          foregroundPaint = new Paint()
          foregroundPaint.color = a.color as Color
        } 
      } else {
        if (!b.foreground) {
          foregroundPaint = new Paint()
          foregroundPaint.color = b.color as Color
        } 
      }
    }

    let backgroundPaint: Paint | null = null

    if (a.background !== null || b.background !== null) {
      if (t < 0.5) {
        if (!a.background) {
          backgroundPaint = new Paint()
          backgroundPaint.color = a.color as Color
        } 
      } else {
        if (!b.background) {
          backgroundPaint = new Paint()
          backgroundPaint.color = b.color as Color
        } 
      }
    }


    return new TextPaintingStyle(
      // inherit
      b.inherit,
      // foreground
      a.foreground === null && b.foreground === null 
        ? Color.lerp(a.color, b.color, t) 
        : null,
      // background
      a.background === null && b.background === null 
        ? Color.lerp(a.backgroundColor, b.backgroundColor, t) 
        : null,
      // fontsize
      lerp(a.fontSize ?? b.fontSize as number, b.fontSize ?? a.fontSize as number, t),
      t < 0.5 ? a.fontWeight : b.fontWeight,
      t < 0.5 ? a.fontStyle : b.fontStyle,
      // letterSpacing
      lerp(a.letterSpacing ?? b.letterSpacing as number, b.letterSpacing ?? a.letterSpacing as number, t),
      // wordSpacing
      lerp(a.wordSpacing ?? b.wordSpacing as number, b.wordSpacing ?? a.wordSpacing as number, t),
      // textBaseline
      t < 0.5 ? a.textBaseline : b.textBaseline,
      // height
      lerp(a.height ?? b.height as number, b.height ?? a.height as number, t),
      // leadingDistribution
      t < 0.5 ? a.leadingDistribution : b.leadingDistribution,
      foregroundPaint,
      backgroundPaint,
      t < 0.5 ? a.shadows : b.shadows,
      t < 0.5 ? a.fontFeatures : b.fontFeatures,
      t < 0.5 ? a.decoration : b.decoration,
      Color.lerp(a.decorationColor, b.decorationColor, t),
      t < 0.5 ? a.decorationStyle : b.decorationStyle,
      lerp(a.decorationThickness ?? b.decorationThickness as number, b.decorationThickness ?? a.decorationThickness as number, t),
      t < 0.5 ? a.fontFamily : b.fontFamily,
      t < 0.5 ? a.overflow : b.overflow,
    )
  }

  public inherit: boolean
  public color: Color | null
  public backgroundColor: Color | null
  public fontFamily: string | null
  public fontSize: number | null
  public fontWeight: Skia.FontWeight | null
  public fontStyle: Skia.FontSlant | null
  public letterSpacing: number | null
  public wordSpacing: number | null
  public textBaseline: Skia.TextBaseline | null
  public height: number | null
  public leadingDistribution: TextLeadingDistributionKind | null
  public foreground: Paint | null
  public background: Paint | null
  public decoration: TextDecoration | null
  public decorationColor: Color | null
  public decorationStyle: Skia.DecorationStyle | null
  public decorationThickness: number | null
  public shadows: Shadow[] | null
  public fontFeatures: FontFeature[] | null
  public overflow: TextOverflowKind | null

  constructor (
    inherit: boolean = true,
    color: Color | null = null,
    backgroundColor: Color | null = null,
    fontSize: number | null = null,
    fontWeight: Skia.FontWeight | null = null,
    fontStyle: Skia.FontSlant | null = null,
    letterSpacing: number | null = null,
    wordSpacing: number | null = null,
    textBaseline: Skia.TextBaseline | null = null,
    height: number | null = null,
    leadingDistribution: TextLeadingDistributionKind | null = null,
    foreground: Paint | null = null,
    background: Paint | null = null,
    shadows: Shadow[] | null = null,
    fontFeatures: FontFeature[] | null = null,
    decoration: TextDecoration | null = null,
    decorationColor: Color | null = null,
    decorationStyle: Skia.DecorationStyle | null = null,
    decorationThickness: number | null = null,
    fontFamily: string | null = null,
    overflow: TextOverflowKind | null = null,
  ) {
    this.inherit = inherit
    this.color = color
    this.backgroundColor = backgroundColor
    this.fontSize = fontSize
    this.fontWeight = fontWeight
    this.fontStyle = fontStyle
    this.letterSpacing = letterSpacing
    this.wordSpacing = wordSpacing
    this.textBaseline = textBaseline
    this.height = height
    this.leadingDistribution = leadingDistribution
    this.foreground = foreground
    this.background = background
    this.shadows = shadows
    this.fontFeatures = fontFeatures
    this.decoration = decoration
    this.decorationColor = decorationColor
    this.decorationStyle = decorationStyle
    this.decorationThickness = decorationThickness
    this.fontFamily = fontFamily
    this.overflow = overflow
  }

  copyWith (
    inherit?: boolean,
    color?: Color | null,
    backgroundColor?: Color | null,
    fontSize?: number | null,
    fontWeight?: Skia.FontWeight | null,
    fontStyle?: Skia.FontSlant | null,
    letterSpacing?: number | null,
    wordSpacing?: number | null,
    textBaseline?: Skia.TextBaseline | null,
    height?: number | null,
    leadingDistribution?: TextLeadingDistributionKind | null,
    foreground?: Paint | null,
    background?: Paint | null,
    shadows?: Shadow[] | null,
    fontFeatures?: FontFeature[] | null,
    decoration?: TextDecoration | null,
    decorationColor?: Color | null,
    decorationStyle?: Skia.DecorationStyle | null,
    decorationThickness?: number | null,
    fontFamily?: string | null,
    overflow?: TextOverflowKind | null,
  ): TextPaintingStyle {

    return new TextPaintingStyle(
      inherit ?? this.inherit,
      this.foreground === null && foreground === null 
        ? color ?? this.color 
        : null,
      this.background === null && background === null 
        ? backgroundColor ?? this.backgroundColor 
        : null,

      fontSize ?? this.fontSize,
      fontWeight ?? this.fontWeight,
      fontStyle ?? this.fontStyle,
      letterSpacing ?? this.letterSpacing,
      wordSpacing ?? this.wordSpacing,
      textBaseline ?? this.textBaseline,
      height ?? this.height,
      leadingDistribution ?? this.leadingDistribution,
      foreground ?? this.foreground,
      background ?? this.background,
      shadows ?? this.shadows,
      fontFeatures ?? this.fontFeatures,
      decoration ?? this.decoration,
      decorationColor ?? this.decorationColor,
      decorationStyle ?? this.decorationStyle,
      decorationThickness ?? this.decorationThickness,
      fontFamily ?? this.fontFamily,
      overflow ?? this.overflow,
    )
  }
  
  apply (
    decorationThicknessFactor: number = 1.0,
    fontSizeFactor: number = 1.0,
    letterSpacingFactor: number = 1.0,
    wordSpacingFactor: number = 1.0,
    heightFactor: number = 1.0,
    color: Color | null,
    backgroundColor: Color | null,
    decoration: TextDecoration | null,
    decorationColor: Color | null,
    fontFamily: string | null,
    fontStyle: Skia.FontSlant | null,
    decorationStyle: Skia.DecorationStyle | null,
    textBaseline: Skia.TextBaseline | null,
    leadingDistribution: TextLeadingDistributionKind | null,
    shadows: Shadow[] | null,
    fontFeatures: FontFeature[] | null,
    overflow: TextOverflowKind | null,
  ) {    
    return new TextPaintingStyle(
      this.inherit,
      this.foreground === null 
        ? color ?? this.color 
        : null,
      this.background === null 
        ? backgroundColor ?? this.backgroundColor 
        : null,
      this.fontSize === null 
        ? null 
        : this.fontSize * fontSizeFactor,
      this.fontWeight === null 
        ? null 
        : this.fontWeight,
      fontStyle ?? this.fontStyle,
      this.letterSpacing === null 
        ? null 
        : this.letterSpacing! * letterSpacingFactor,
      this.wordSpacing === null 
        ? null 
        : this.wordSpacing * wordSpacingFactor,
      textBaseline ?? this.textBaseline,
      this.height === null 
        ? null 
        : this.height * heightFactor,
      leadingDistribution ?? this.leadingDistribution,
      
      this.foreground,
      this.background,

      shadows ?? this.shadows,
      fontFeatures ?? this.fontFeatures,
      decoration ?? this.decoration,
      decorationColor ?? this.decorationColor,
      decorationStyle ?? this.decorationStyle,

      this.decorationThickness === null 
        ? null 
        : this.decorationThickness * decorationThicknessFactor,
      fontFamily ?? this.fontFamily,
      overflow ?? this.overflow,
    )
  }
  
  mergeWith (other: TextPaintingStyle | null) {
    if (other === null) {
      return this
    }

    if (other.inherit) {
      return other
    }

    return this.copyWith(
      other.inherit,
      other.color,
      other.backgroundColor,
      other.fontSize,
      other.fontWeight,
      other.fontStyle,
      other.letterSpacing,
      other.wordSpacing,
      other.textBaseline,
      other.height,
      other.leadingDistribution,
      other.foreground,
      other.background,
      other.shadows,
      other.fontFeatures,
      other.decoration,
      other.decorationColor,
      other.decorationStyle,
      other.decorationThickness,
      other.fontFamily,
      other.overflow,
    )
  }

  getTextStyle (textScaleFactor: number = 1.0): TextStyle {
    let background: Paint | null = this.background
    if (background === null) {
      background = Paint.create()

      if (this.backgroundColor !== null) {
        background.color = this.backgroundColor
      }
    }

    return TextStyle.create({
      color: this.color,
      decoration: this.decoration,
      decorationColor: this.decorationColor,
      decorationStyle: this.decorationStyle,
      decorationThickness: this.decorationThickness,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      textBaseline: this.textBaseline,
      leadingDistribution: this.leadingDistribution,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize === null 
        ? null 
        : this.fontSize * textScaleFactor,
      letterSpacing: this.letterSpacing,
      wordSpacing: this.wordSpacing,
      height: this.height,
      foreground: this.foreground,
      background: this.background ?? (
        this.backgroundColor !== null
          ? background
          : null
      ),
      shadows: this.shadows,
      fontFeatures: this.fontFeatures,
    })
  }
  
  getParagraphStyle(
    textAlign: Skia.TextAlign | null,
    textDirection: Skia.TextDirection | null,
    ellipsis: string | null,
    maxLines: number | null,
    textScaleFactor: number = 1.0,
    textHeightBehavior: TextHeightBehavior | null,
    fontFamily: string | null,
    fontSize: number | null,
    fontWeight: Skia.FontWeight | null,
    fontStyle: Skia.FontSlant | null,
    height: number | null,
    strutStyle: StrutStyle | null,
  ) {
    invariant(maxLines === null || maxLines > 0, `The argument "maxLines" cannot be null or the "maxLines" value must be gather than zero.`)

    const leadingDistribution = this.leadingDistribution
    const effectiveTextHeightBehavior = textHeightBehavior ?? (
      leadingDistribution === null 
        ? null 
        : TextHeightBehavior.create({ leadingDistribution })
    )

    return ParagraphStyle.create({
      textAlign,
      textDirection,
      fontWeight: fontWeight ?? this.fontWeight,
      fontStyle: fontStyle ?? this.fontStyle,
      fontFamily: fontFamily ?? this.fontFamily,
      fontSize: (fontSize ?? this.fontSize ?? Engine.env<number>('ATKIT_FONT_SIZE', 12)) * textScaleFactor,
      maxLines: maxLines,
      ellipsis: ellipsis,
      height: height ?? this.height,
      textHeightBehavior: effectiveTextHeightBehavior,
      strutStyle: strutStyle === null 
        ? null 
        : StrutStyle.create({
          fontFamily: strutStyle.fontFamily,
          fontFamilyFallback: strutStyle.fontFamilyFallback,
          fontSize: strutStyle.fontSize === null 
            ? null 
            : strutStyle.fontSize * textScaleFactor,
          height: strutStyle.height,
          leading: strutStyle.leading,
          fontWeight: strutStyle.fontWeight,
          fontStyle: strutStyle.fontStyle,
          forceStrutHeight: strutStyle.forceStrutHeight,
          leadingDistribution: strutStyle.leadingDistribution
        }),
    })
  }

  compareTo (other: TextPaintingStyle): Skia.RenderComparison {
    if (
      this.inherit !== other.inherit ||
      this.fontFamily !== other.fontFamily ||
      this.fontSize !== other.fontSize ||
      this.fontWeight !== other.fontWeight ||
      this.fontStyle !== other.fontStyle ||
      this.letterSpacing !== other.letterSpacing ||
      this.wordSpacing !== other.wordSpacing ||
      this.textBaseline !== other.textBaseline ||
      this.height !== other.height ||
      this.leadingDistribution !== other.leadingDistribution ||
      this.foreground !== other.foreground ||
      this.background !== other.background ||
      this.overflow !== other.overflow ||
      listNotEquals(this.shadows, other.shadows) ||
      listNotEquals(this.fontFeatures, other.fontFeatures) 
    ) {
      return Skia.RenderComparison.Layout
    }

    if (
      this.decoration !== other.decoration ||
      this.decorationStyle !== other.decorationStyle ||
      this.decorationThickness !== other.decorationThickness ||
      this.decorationColor?.notEqual(other.decorationColor) ||
      this.color?.notEqual(other.color) ||
      this.backgroundColor?.notEqual(other.backgroundColor) 
    ) {
      return Skia.RenderComparison.Paint
    }

    return Skia.RenderComparison.Identical
  }

  equal (other: TextPaintingStyle | null) {
    return (
      other instanceof TextPaintingStyle &&
      other.inherit === this.inherit &&
      other.fontSize === this.fontSize &&
      other.fontWeight === this.fontWeight &&
      other.fontStyle === this.fontStyle &&
      other.letterSpacing === this.letterSpacing &&
      other.wordSpacing === this.wordSpacing &&
      other.textBaseline === this.textBaseline &&
      other.height === this.height &&
      other.leadingDistribution === this.leadingDistribution &&
      other.foreground === this.foreground &&
      other.background === this.background &&
      other.decoration === this.decoration &&
      other.decorationThickness === this.decorationThickness &&
      other.fontFamily === this.fontFamily &&
      other.overflow === this.overflow &&
      other.decorationStyle === this.decorationStyle &&
      other.color?.equal(this.color) &&
      other.backgroundColor?.equal(this.backgroundColor) &&
      other.decorationColor?.equal(this.decorationColor) &&
      listEquals(other.shadows, this.shadows) &&
      listEquals(other.fontFeatures, this.fontFeatures) 
    )
  }

  notEqual (other: TextPaintingStyle | null) {
    return !this.equal(other)
  }
}
