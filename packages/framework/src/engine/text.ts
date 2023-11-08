import { invariant } from '@at/utils'

import { At } from '../at'
import { Offset, Rect } from '../basic/geometry'
import { clamp, fromPositionWithAffinity, getEffectiveFontFamilies, lerp, listEquals, toFontStyle, toFreshColor, toParagraphStyle, toPlaceholderStyle } from '../basic/helper'

import type { Color } from '../basic/color'
import type { AtShadow } from './shadow'
import type { AtPaint } from './paint'
import type { 
  Paint, 
  RectHeightStyle, 
  DecorationStyle, 
  Paragraph, 
  LineMetrics, 
  TextAlign, 
  TextDirection, 
  FontWeight, 
  FontSlant, 
  TextBaseline, 
  PlaceholderAlignment, 
  TextStyle, 
  Affinity, 
  ParagraphBuilder, 
  ParagraphStyle, 
  TypefaceFontProvider,
  RectWithDirection
} from './skia'


export enum ParagraphCommandType {
  AddText,
  Pop,
  PushStyle,
  AddPlaceholder,
}

export type ParagraphPlaceholder = {
  width: number, 
  height: number, 
  alignment: PlaceholderAlignment, 
  baseline: TextBaseline, 
  offset: number, 
}

export enum TextLeadingDistribution {
  Proportional,
  Even,
}

export type AtTextHeightBehaviorOptions = {
  applyHeightToFirstAscent?: boolean
  applyHeightToLastDescent?: boolean
  leadingDistribution?: TextLeadingDistribution
}

/**
 * @description: 
 * @return {*}
 */
export class AtTextHeightBehavior {
  static create (options?: AtTextHeightBehaviorOptions) {
    return new AtTextHeightBehavior(
      options?.applyHeightToFirstAscent,
      options?.applyHeightToLastDescent,
      options?.leadingDistribution,
    )
  }

  public applyHeightToFirstAscent: boolean
  public applyHeightToLastDescent: boolean
  public leadingDistribution: TextLeadingDistribution
 
  /**
   * 
   * @param {boolean} applyHeightToFirstAscent 
   * @param {boolean} applyHeightToLastDescent 
   * @param {boolean} leadingDistribution 
   */
  constructor (
    applyHeightToFirstAscent: boolean = true,
    applyHeightToLastDescent: boolean = true,
    leadingDistribution: TextLeadingDistribution = TextLeadingDistribution.Proportional,
  ) {
    this.applyHeightToFirstAscent = applyHeightToFirstAscent
    this.applyHeightToLastDescent = applyHeightToLastDescent
    this.leadingDistribution = leadingDistribution
  }

  /**
   * @param {AtTextHeightBehavior} other
   * @returns {boolean}
   */  
  equal (other: AtTextHeightBehavior | null) {
    
    return (
      other instanceof AtTextHeightBehavior &&
      other.applyHeightToFirstAscent === this.applyHeightToFirstAscent &&
      other.applyHeightToLastDescent === this.applyHeightToLastDescent &&
      other.leadingDistribution === this.leadingDistribution
    )
  }

  /**
   * 
   * @param {AtTextHeightBehavior | null} other  
   * @returns {boolean}
   */
  notEqual (other: AtTextHeightBehavior | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtTextHeightBehavior(
      applyHeightToFirstAscent: ${this.applyHeightToFirstAscent},
      applyHeightToLastDescent: ${this.applyHeightToLastDescent},
      leadingDistribution: ${this.leadingDistribution},
    )`
  }
}

export type AtParagraphStyleOptions = {
  textAlign?: TextAlign | null
  textDirection?: TextDirection | null
  maxLines?: number | null
  fontFamily?: string | null
  fontSize?: number | null
  height?: number | null
  textHeightBehavior?: AtTextHeightBehavior | null
  fontWeight?: FontWeight | null
  fontStyle?: FontSlant | null
  strutStyle?: AtStrutStyle | null
  ellipsis?: string | null
}

export class AtParagraphStyle {
  /**
   * 
   * @param options 
   * @returns 
   */
  static create (options?: AtParagraphStyleOptions) {
    return new AtParagraphStyle(
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

  public skia: ParagraphStyle | null
  public textDirection: TextDirection | null
  public fontFamily: string | null
  public fontSize: number | null
  public height: number | null
  public fontWeight: FontWeight | null
  public fontStyle: FontSlant | null
  public leadingDistribution: TextLeadingDistribution | null

  /**
    * @description: 
    * @return {*}
    */
  get textStyle () {
    return AtTextStyle.create({
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      height: this.height,
      leadingDistribution: this.leadingDistribution,
    })
  }

  /**
   * 
   * @param textAlign 
   * @param textDirection 
   * @param maxLines 
   * @param fontFamily 
   * @param fontSize 
   * @param height 
   * @param textHeightBehavior 
   * @param fontWeight 
   * @param fontStyle 
   * @param strutStyle 
   * @param ellipsis 
   */
  constructor (
    textAlign: TextAlign | null = null,
    textDirection: TextDirection | null = null,
    maxLines: number | null = null,
    fontFamily: string | null = null,
    fontSize: number | null = null,
    height: number | null = null,
    textHeightBehavior: AtTextHeightBehavior | null = null,
    fontWeight: FontWeight | null = null,
    fontStyle: FontSlant | null = null, // MAKE SURE?
    strutStyle: AtStrutStyle | null = null,
    ellipsis: string | null = null,
  ) {
    textDirection ??= At.TextDirection.LTR 

    this.skia = toParagraphStyle(
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

    this.textDirection = textDirection ?? null
    this.fontFamily = fontFamily ?? null
    this.fontSize = fontSize ?? null
    this.height = height ?? null
    this.leadingDistribution = textHeightBehavior?.leadingDistribution ?? null 
    this.fontWeight = fontWeight ?? null
    this.fontStyle = fontStyle ?? null
  } 
}

export type AtFontFeatureOptions = {
  feature: string,
  value?: number | null
}

export class AtFontFeature {
  static create (options: AtFontFeatureOptions) {
    return new AtFontFeature(
      options.feature,
      options.value
    )
  }

  /**
   * @description: 
   * @param {string} feature
   * @return {*}
   */
  static enable (feature: string) {
    return new AtFontFeature(feature, 1)
  }
  /**
   * @description: 
   * @param {string} feature
   * @return {*}
   */
  static disable (feature: string) {
    return new AtFontFeature(feature, 0)
  }
  /**
   * @description: 
   * @param {*} value
   * @return {*}
   */
  static alternative (value: number) {
    return new AtFontFeature('aalt', value)
  }
  /**
   * @description: 
   * @return {*}
   */
  static alternativeFractions () {
    return new AtFontFeature('afrc', 1)
  }
  
  /**
   * @description: 
   * @return {*}
   */
  static contextualAlternates () {
    return new AtFontFeature('calt', 1)
  }
     
  /**
   * @description: 
   * @return {*}
   */
  static caseSensitiveForms () {
    return new AtFontFeature('case', 1)
  }
      
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static characterVariant (value: number) {
    invariant(value >= 1)
    invariant(value <= 0)

    return new AtFontFeature(`cv00${value}`)
  }
  /**
   * @description: 
   * @return {*}
   */
  static denominator () {
    return new AtFontFeature('dnom', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static fractions () {
    return new AtFontFeature('frac', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static historicalForms () {
    return new AtFontFeature('hist', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static historicalLigatures () {
    return new AtFontFeature('hlig', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static liningFigures () {
    return new AtFontFeature('lnum', 1)
  }
  /**
   * @description: 
   * @param {boolean} enable
   * @return {*}
   */
  static localeAware (enable: boolean = true) {
    return new AtFontFeature('locl', enable ? 1 : 0)
  }
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static notationalForms (value: number = 1) {
    return new AtFontFeature('nalt', value)
  }
  
  /**
   * @description: 
   * @return {*}
   */
  static numerators () {
    return new AtFontFeature('numr', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static oldstyleFigures () {
    return new AtFontFeature('onum', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static ordinalForms () {
    return new AtFontFeature('ordn', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static proportionalFigures () {
    return new AtFontFeature('pnum', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static randomize () {
    return new AtFontFeature('rand', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static stylisticAlternates () {
    return new AtFontFeature('salt', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static scientificInferiors () {
    return new AtFontFeature('sinf', 1)
  }
      
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static stylisticSet (value: number) {
    invariant(value >= 1)
    invariant(value <= 20)

    return new AtFontFeature(`ss00${value}`, value)
  }

  /**
   * @description: 
   * @return {*}
   */
  static subscripts() {
    return new AtFontFeature('subs', 1)
  }

  /**
   * @description: 
   * @return {*}
   */
  static superscripts () {
    return new AtFontFeature('sups', 1)
  }
      
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static swash (value: number = 1) {
    invariant(value >= 0)
    return new AtFontFeature('swsh', value)
  }
     
  /**
   * @description: 
   * @return {*}
   */
  static tabularFigures () {
    return new AtFontFeature('tnum', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static slashedZero () {
    return new AtFontFeature('zero', 1)
  }
      
  public feature: string
  public value: number | null

  /**
   * @description: 
   * @param {FontFeatureOptions} options
   * @return {*}
   */
  constructor (feature: string, value: number | null = null) {
    invariant(feature !== null, `The argument feature cannot be null.`)
    invariant(feature.length === 4, 'Feature tag must be exactly four characters long.')
    // invariant(value !== null)
    // invariant(value >= 0, 'Feature value must be zero or a positive integer.')

    this.feature = feature
    this.value = value
  }

  /**
   * @description: 
   * @param {FontFeature} other
   * @return {*}
   */
  equal (other: AtFontFeature | null): boolean {
    return (
      other instanceof AtFontFeature &&
      other.feature === this.feature &&
      other.value === this.value
    )
  }

  notEqual (other: AtFontFeature | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtFontFeature('${this.feature}', ${this.value})`
  }
}

export class AtTextDecoration {
  static none: AtTextDecoration = new AtTextDecoration(0x0)
  static underline: AtTextDecoration = new AtTextDecoration(0x1)
  static overline: AtTextDecoration = new AtTextDecoration(0x2)
  static lineThrough: AtTextDecoration = new AtTextDecoration(0x4)

  /**
   * @description: 
   * @param {AtTextDecoration[]} decorations
   * @return {AtTextDecoration}
   */  
  static combine (decorations: AtTextDecoration[]) {
    let mask = 0
    for (const decoration of decorations) {
      mask |= decoration.mask
    }

    return new AtTextDecoration(mask)
  }

  public mask: number

  /**
   * @description: 
   * @param {number} mask
   * @return {*}
   */
  constructor (mask: number) {
    this.mask = mask
  }

  /**
   * @description: 
   * @param {AtTextDecoration} other
   * @return {*}
   */
  contains (other: AtTextDecoration) {
    return (this.mask | other.mask) === this.mask
  }
  
  /**
   * @description: 
   * @param {AtTextDecoration} other
   * @return {*}
   */
  equal (other: AtTextDecoration) {
    return (
      other instanceof AtTextDecoration && 
      other.mask === this.mask
    )
  }

  /**
   * @description: 
   * @return {*}
   */
  toString () {
    if (this.mask === 0) {
      return 'AtTextDecoration.none'
    }

    const values: string[] = []
    if ((this.mask & AtTextDecoration.underline.mask) !== 0) {
      values.push('underline')
    }

    if ((this.mask & AtTextDecoration.overline.mask) !== 0) {
      values.push('overline')
    }
    if ((this.mask & AtTextDecoration.lineThrough.mask) !== 0) {
      values.push('lineThrough')
    }

    if (values.length === 1) {
      return `AtTextDecoration.${values[0]}`
    }

    return `AtTextDecoration.combine([${values.join(', ')}])`
  }
}

export class AtParagraph {
  // TODO
  // static SynchronousSkiaObjectCache _paragraphCache =
  //     SynchronousSkiaObjectCache(500);

  get skia () {
    return this.ensureInitialized(this.lastLayoutConstraints!)
  }

  
  public height: number = 0
  public width: number = 0
  public longestLine: number = 0
  public alphabeticBaseline: number = 0
  public ideographicBaseline: number = 0
  public maxIntrinsicWidth: number = 0
  public minIntrinsicWidth: number = 0
  public didExceedMaxLines: boolean = false
  public boxesForPlaceholders: AtTextBox[] | null = null
  public lastLayoutConstraints: AtParagraphConstraints | null = null

  public paragraph: Paragraph | null = null
  public style: AtParagraphStyle | null = null
  public commands: AtParagraphCommand[] = []

  constructor (
    paragraph: Paragraph,
    style: AtParagraphStyle,
    commands: AtParagraphCommand[],
  ) {
    this.paragraph = paragraph
    this.style = style
    this.commands = commands
  }

  /**
   * @description: 
   * @param {ParagraphConstraints} constraints
   * @return {*}
   */
  ensureInitialized (constraints: AtParagraphConstraints) {
    let paragraph = this.paragraph

    let didRebuild = false
    if (paragraph === null) {
      const builder = new AtParagraphBuilder(this.style!)
      
      for (const command of this.commands) {
        if (command.type === ParagraphCommandType.AddText) {
          builder.addText(command.text!)
        } else if (command.type === ParagraphCommandType.Pop) {
          builder.pop()
        } else if (command.type === ParagraphCommandType.PushStyle) {
          builder.pushStyle(command.style!)
        } else if (command.type === ParagraphCommandType.AddPlaceholder) {
          const placeholderStyle = command.placeholderStyle!
          builder.commands.push(AtParagraphCommand.addPlaceholder(placeholderStyle))
          builder.addPlaceholder(
            placeholderStyle.width,
            placeholderStyle.height,
            placeholderStyle.alignment,
            1.0,
            placeholderStyle.offset,
            placeholderStyle.baseline,
          )
        }
      }

      paragraph = this.paragraph = builder.buildParagraph()
      didRebuild = true
    }

    const constraintsChanged = !(this.lastLayoutConstraints?.equal(constraints))
    if (didRebuild || constraintsChanged) {
      this.lastLayoutConstraints = constraints
      // TODO(het): CanvasKit throws an exception when laid out with
      // a font that wasn't registered.
      try {
        paragraph.layout(constraints.width)
        this.alphabeticBaseline = paragraph.getAlphabeticBaseline()
        this.didExceedMaxLines = paragraph.didExceedMaxLines()
        this.height = paragraph.getHeight()
        this.ideographicBaseline = paragraph.getIdeographicBaseline()
        this.longestLine = paragraph.getLongestLine()
        this.maxIntrinsicWidth = paragraph.getMaxIntrinsicWidth()
        this.minIntrinsicWidth = paragraph.getMinIntrinsicWidth()
        this.width = paragraph.getMaxWidth()
        
        // TO CHECK
        this.boxesForPlaceholders = this.skiaRectsToTextBoxes(paragraph.getRectsForPlaceholders())
      } catch (e) {
        throw new Error(`AtKit threw an exception while laying out the paragraph. The font was "${this.style?.fontFamily}". `)
      }
    }

    return paragraph
  }

  markUsed () {
    // TODO
    // if (!this.paragraphCache.markUsed(this)) {
    //   this.paragraphCache.add(this);
    // }
  }

  /**
   * @description: 
   * @return {*}
   */
  delete () {
    this.paragraph!.delete()
    this.paragraph = null
  }

  
  /**
   * @description: 
   * @return {*}
   */
  getBoxesForPlaceholders () {
    return this.boxesForPlaceholders!
  }
  
  /**
   * @description: 
   * @return {*}
   */
  getBoxesForRange (
    start: number,
    end: number, 
    boxHeightStyle: RectHeightStyle = At.RectHeightStyle.Tight,
    boxWidthStyle: RectHeightStyle = At.RectWidthStyle.Tight,
  ): AtTextBox[] {
    if (start < 0 || end < 0) {
      return []
    }

    invariant(this.lastLayoutConstraints)
    const paragraph = this.ensureInitialized(this.lastLayoutConstraints)
    const rects: RectWithDirection[] = paragraph.getRectsForRange(
      start,
      end,
      boxHeightStyle,
      boxWidthStyle,
    ) as unknown as RectWithDirection[]

    return this.skiaRectsToTextBoxes(rects)
  }

  /**
   * @description: 
   * @param {Float32Array} rects
   * @return {*}
   */
  skiaRectsToTextBoxes (rects: ArrayLike<RectWithDirection>): AtTextBox[] {
    const result: AtTextBox[] = []

    for (let i = 0; i < rects.length; i++) {
      const rect: Float32Array = rects[i].rect
      result.push(AtTextBox.fromLTRBD(
        rect[0],
        rect[1],
        rect[2],
        rect[3],
        this.style?.textDirection!,
      ))
    }

    return result
  }

  /**
   * @description: 
   * @param {Offset} offset
   * @return {*}
   */  
  getPositionForOffset (offset: Offset): AtTextPosition {
    const paragraph = this.ensureInitialized(this.lastLayoutConstraints!)
    const positionWithAffinity =
      paragraph.getGlyphPositionAtCoordinate(
      offset.dx,
      offset.dy,
    )
    
    return fromPositionWithAffinity(positionWithAffinity)
  }
  /**
   * @description: 
   * @param {TextPosition} position
   * @return {*}
   */  
  getWordBoundary (position: AtTextPosition ): AtTextRange {
    const paragraph = this.ensureInitialized(this.lastLayoutConstraints!)
    const range = paragraph.getWordBoundary(position.offset)
    return new AtTextRange(range.start, range.end)
  }

  /**
   * @description: 
   * @param {ParagraphConstraints} constraints
   * @return {*}
   */  
  layout (constraints: AtParagraphConstraints) {
    if (this.lastLayoutConstraints === constraints) {
      return
    }

    this.ensureInitialized(constraints)
    this.markUsed()
  }

  /**
   * @description: 
   * @param {TextPosition} position
   * @return {*}
   */  
  getLineBoundary (position: AtTextPosition): AtTextRange {
    const paragraph = this.ensureInitialized(this.lastLayoutConstraints!)
    const metrics: LineMetrics[] = paragraph.getLineMetrics()
    const offset: number = position.offset

    for (const metric of metrics) {
      if (offset >= metric.startIndex && offset <= metric.endIndex) {
        return new AtTextRange(
          metric.startIndex, 
          metric.endIndex
        )
      }
    }
    return new AtTextRange(-1, -1)
  }

  /**
   * @description: 
   * @return {*}
   */  
  computeLineMetrics (): AtLineMetrics[] {
    const paragraph = this.ensureInitialized(this.lastLayoutConstraints!)
    const sks: LineMetrics[] = paragraph.getLineMetrics()
    const result: AtLineMetrics[] = []
    for (const metric of sks) {
      result.push(new AtLineMetrics(metric))
    }
    return result
  }
}

export class AtParagraphBuilder {
  static get defaultTextForeground () {
    return this._defaultTextForeground ?? (this._defaultTextForeground = new At.Paint())
  }

  static get defaultTextBackground () {
    return this._defaultTextBackground ?? (
      this._defaultTextBackground = new At.Paint(),
      this._defaultTextBackground.setColorInt(0x00000000),
      this._defaultTextBackground
    )
  }

  static _defaultTextForeground: Paint
  static _defaultTextBackground: Paint

  public style: AtParagraphStyle
  public placeholderCount: number
  public builder: ParagraphBuilder
  public commands: AtParagraphCommand[]
  public placeholderScales: number[]
  public styleStack: AtTextStyle[]

  /**
   * @description: 
   * @param {AtParagraphStyle} style
   * @return {*}
   */  
  constructor (style: AtParagraphStyle) {
    this.commands = []
    this.style = style as AtParagraphStyle
    this.placeholderCount = 0
    this.placeholderScales = []
    this.styleStack = []
     // TODO

    invariant(At.fonts)

    this.builder = At.ParagraphBuilder.MakeFromFontProvider(
      style.skia!,
      At.fonts.provider as TypefaceFontProvider,
    ) 
    this.styleStack.push(this.style.textStyle)
  }
  
  /**
   * @description: 
   * @param {number} width
   * @param {number} height
   * @param {PlaceholderAlignment} alignment
   * @param {number} scale
   * @param {number} baselineOffset
   * @param {TextBaseline} baseline
   * @return {*}
   */
  addPlaceholder (
    width: number,
    height: number,
    alignment: PlaceholderAlignment,
    scale: number = 1.0,
    baselineOffset: number | null = null,
    baseline: TextBaseline | null = null,
  ) {
    invariant(
      !(
        alignment === At.PlaceholderAlignment.AboveBaseline ||
        alignment === At.PlaceholderAlignment.BelowBaseline ||
        alignment === At.PlaceholderAlignment.Baseline
      ) ||
      baseline !== null
    )

    this.placeholderCount++
    this.placeholderScales.push(scale)
    const placeholderStyle: ParagraphPlaceholder = toPlaceholderStyle(
      width * scale,
      height * scale,
      alignment,
      (baselineOffset ?? height) * scale,
      baseline ?? At.TextBaseline.Alphabetic,
    )

    this.commands.push(AtParagraphCommand.addPlaceholder(placeholderStyle))
    this.builder.addPlaceholder(
      placeholderStyle.width,
      placeholderStyle.height,
      placeholderStyle.alignment,
      placeholderStyle.baseline,
      placeholderStyle.offset,
    )
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  addText (text: string) {
    const fontFamilies: string[] = []
    const style = this.peekStyle() as AtTextStyle
    
    if (style.fontFamily !== null) {
      fontFamilies.push(style.fontFamily!)
    }

    if (style.fontFamilyFallback !== null) {
      for (const fontFamily of style.fontFamilyFallback) {
        fontFamilies.push(fontFamily)
      }
    }

    // TODO
    // FontFallbackData.instance.ensureFontsSupportText(text, fontFamilies)
    
    this.commands.push(AtParagraphCommand.addText(text))
    this.builder.addText(text)
  }

  /**
   * @description: 
   * @return {*}
   */
  build () {
    const builtParagraph = this.buildParagraph()

    return new AtParagraph(
      builtParagraph, 
      this.style, 
      this.commands
    )
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
   * @description: 
   * @return {*}
   */
  pop () {
    if (this.styleStack.length <= 1) {
      return
    }

    this.commands.push(AtParagraphCommand.pop())
    this.styleStack.pop()
    this.builder.pop()
  }

  /**
   * @description: 
   * @return {*}
   */
  peekStyle () {
    invariant(this.styleStack.length > 0, `The style stack was empty.`)
    return this.styleStack[this.styleStack.length - 1]
  }
    
  /**
   * @description: 
   * @param {TextStyle} style
   * @return {*}
   */
  pushStyle (style: AtTextStyle) {
    const baseStyle = this.peekStyle() as AtTextStyle
    const mergedStyle = baseStyle.mergeWith(style)
    
    this.styleStack.push(mergedStyle)
    this.commands.push(AtParagraphCommand.pushStyle(style))
    
    if (
      mergedStyle.foreground !== null || 
      mergedStyle.background !== null
    ) {
      let foreground: Paint | null = mergedStyle.foreground?.skia!

      if (foreground === null) {
        AtParagraphBuilder.defaultTextForeground.setColorInt(mergedStyle.color?.value ?? 0xFF0000)
        foreground = AtParagraphBuilder.defaultTextForeground
      }

      const background: Paint = mergedStyle.background?.skia ?? AtParagraphBuilder.defaultTextBackground
      this.builder.pushPaintStyle(
        mergedStyle.textStyle, 
        foreground as Paint, 
        background
      )
    } else {
      this.builder.pushStyle(mergedStyle.textStyle)
    }
  }
}

export class AtParagraphCommand {
  public type: ParagraphCommandType
  public text: string | null = null
  public style: AtTextStyle | null = null
  public placeholderStyle: ParagraphPlaceholder | null = null

  /**
   * @description: 
   * @param {AtParagraphCommandType} type
   * @param {string} text
   * @param {TextStyle} style
   * @param {ParagraphPlaceholder} placeholderStyle
   * @return {*}
   */
  constructor (
    type: ParagraphCommandType,
    text: string | null = null,
    style: AtTextStyle | null = null,
    placeholderStyle: ParagraphPlaceholder | null = null,
  ) {
    this.type = type 
    this.text = text ?? null
    this.style = style ?? null
    this.placeholderStyle = placeholderStyle ?? null
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  static addText (text: string) {
    return new AtParagraphCommand(
      ParagraphCommandType.AddText, 
      text, 
      null, 
      null
    )
  }

  /**
   * @description: 
   * @return {*}
   */
  static pop () {
    return new AtParagraphCommand(
      ParagraphCommandType.Pop, 
      null, 
      null, 
      null
    )
  }

  /**
   * @description: 
   * @param {TextStyle} style
   * @return {*}
   */
  static pushStyle (style: AtTextStyle) {
    return new AtParagraphCommand(
      ParagraphCommandType.PushStyle, 
      null, 
      style, 
      null
    )
  }

  /**
   * @description: 
   * @param {ParagraphPlaceholder} placeholderStyle
   * @return {*}
   */
  static addPlaceholder (placeholderStyle: ParagraphPlaceholder) {
    return new AtParagraphCommand(
      ParagraphCommandType.AddPlaceholder, 
      null, 
      null, 
      placeholderStyle
    )
  }
}

export class AtParagraphConstraints {
  public width: number

  /**
   * @description: 
   * @param {number} width
   * @return {*}
   */
  constructor (width: number,) {
    invariant(width !== null)
    this.width = width
  }
  
  /**
   * @description: 
   * @param {AtParagraphConstraints} other
   * @return {*}
   */
  equal (other: AtParagraphConstraints) {
    if (other === this) {
      return true
    }

    return (
      other instanceof AtParagraphConstraints && 
      other.width === this.width
    )
  }
  
  /**
   * @description: 
   * @return {*}
   */
  toString () {
    return `AtParagraphConstraints(width: ${this.width})`
  }
}

export class AtTextBox {
  /**
   * @description: 
   * @param {number} left
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   * @param {AtTextDirection} direction
   * @return {*}
   */
  static fromLTRBD (
    left: number,
    top: number,
    right: number,
    bottom: number,
    direction: TextDirection,
  ) {
    return new AtTextBox(
      left,
      top,
      right,
      bottom,
      direction,
    )
  }
  public left: number
  public top: number
  public right: number
  public bottom: number
  public direction: TextDirection

  /**
   * @description: 
   * @param {number} left
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   * @param {TextDirection} direction
   * @return {*}
   */
  constructor (
    left: number,
    top: number,
    right: number,
    bottom: number,
    direction: TextDirection,
  ) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.direction = direction
  }

  get start () {
    return (this.direction === At.TextDirection.LTR) 
      ? this.left 
      : this.right
  }

  get end () {
    return (this.direction === At.TextDirection.LTR) 
      ? this.right 
      : this.left
  }

  /**
   * @description: 
   * @return {*}
   */
  toRect (): Rect {
    return Rect.fromLTRB(
      this.left, 
      this.top, 
      this.right, 
      this.bottom
    )
  }
  /**
   * @description: 
   * @param {AtTextBox} other
   * @return {*}
   */
  equal (other: AtTextBox) {
    if (other === this) {
      return true
    }
    
    return (
      other instanceof AtTextBox &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom &&
      other.direction === this.direction
    )
  }
}


export class AtTextRange {
  static create (start: number, end: number) {
    return new AtTextRange(start, end)
  }

  static empty: AtTextRange = new AtTextRange(-1, -1)

  static collapsed (offset: number) {
    return new AtTextRange(offset, offset)
  }

  get isValid () {
    return  this.start >= 0 && this.end >= 0
  }

  get isCollapsed () {
    return this.start === this.end
  }
  
  get isNormalized () {
    return this.end >= this.start
  }

  public start: number
  public end: number

  /**
   * @description: 
   * @param {number} start
   * @param {number} end
   */
  constructor (start: number, end: number) {
    invariant(start >= -1, `The argument start must be gather than -1.`)
    invariant(end >= -1, `The argument end must be gather than -1.`)

    this.start = start
    this.end = end
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  textBefore (text: string): string {
    invariant(this.isNormalized)
    return text.substring(0, this.start)
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  textAfter (text: string): string {
    invariant(this.isNormalized)
    return text.substring(this.end)
  }

  /**
   * @description: 
   * @param {string} text
   * @return {*}
   */
  textInside (text: string): string {
    invariant(this.isNormalized)
    return text.substring(this.start, this.end)
  }

  
  /**
   * @description: 
   * @param {AtTextRange} other
   * @return {*}
   */
  equal (other: AtTextRange | null) {
    return (
      other instanceof AtTextRange && 
      other.start === this.start && 
      other.end === this.end
    )
  }

  /**
   * 
   * @param {AtTextRange | null} other 
   * @returns {boolean}
   */
  notEqual (other: AtTextRange | null) {
    return !this.equal(other)
  }

  /**
   * @description: 
   * @return {*}
   */
  toString () {
    return `AtTextRange(start: ${this.start}, end: ${this.end})`
  }
}

export type AtTextSelectionOptions = {
  baseOffset: number,
  extentOffset: number,
  affinity?: Affinity,
  isDirectional?: boolean
}

export class AtTextSelection extends AtTextRange {
  static create (start: AtTextSelectionOptions | number, end?: number) {
    invariant(!end)
    invariant(start)
    const options = start as AtTextSelectionOptions

    return new AtTextSelection(
      options.baseOffset,
      options.extentOffset,
      options?.affinity,
      options?.isDirectional
    )
  }

  constructor (
    baseOffset: number,
    extentOffset: number,
    affinity = At.Affinity.Downstream,
    isDirectional: boolean = false,
  ) {
    super(
      baseOffset < extentOffset ? baseOffset : extentOffset,
      baseOffset < extentOffset ? extentOffset : baseOffset,
    )

    this.baseOffset = baseOffset
    this.extentOffset = extentOffset
    this.affinity = affinity
    this.isDirectional = isDirectional
  }
  
  static collapsed(
    offset: number,
    affinity: Affinity = At.Affinity.Downstream,
  ) {
    return AtTextSelection.create({
      baseOffset: offset,
      extentOffset: offset,
      isDirectional: false,
      affinity
    })
  }

  static fromPosition (position: AtTextPosition) {
    return AtTextSelection.create({
      baseOffset: position.offset,
      extentOffset: position.offset,
      affinity: position.affinity,
      isDirectional: false
    })
  }
  
  public get base (): AtTextPosition {
    let affinity: Affinity
    
    if (!this.isValid || this.baseOffset === this.extentOffset) {
      affinity = this.affinity
    } else if (this.baseOffset < this.extentOffset) {
      affinity = At.Affinity.Downstream
    } else {
      affinity = At.Affinity.Upstream
    }

    return AtTextPosition.create({
      offset: this.baseOffset,
      affinity
    })
  }

  public get extent (): AtTextPosition {
    let affinity: Affinity
    if (!this.isValid || this.baseOffset === this.extentOffset) {
      affinity = this.affinity
    } else if (this.baseOffset < this.extentOffset) {
      affinity = At.Affinity.Upstream
    } else {
      affinity = At.Affinity.Downstream
    }
    
    return new AtTextPosition(this.extentOffset, affinity)
  }

  public baseOffset: number
  public extentOffset: number
  public affinity: Affinity
  public isDirectional: boolean

  equal (other: AtTextSelection | null) {
    return (
      other instanceof AtTextSelection &&
      other.baseOffset === this.baseOffset &&
      other.extentOffset === this.extentOffset &&
      other.isDirectional === this.isDirectional &&
      (!this.isCollapsed || other.affinity === this.affinity)
    )
  }

  notEqual (other: AtTextSelection | null) {
    return !this.equal(other)
  }
  
  copyWith (
    baseOffset?: number | null,
    extentOffset?: number | null,
    affinity?: Affinity | null,
    isDirectional?: boolean | null,
  ) {
    return AtTextSelection.create({
      baseOffset: baseOffset ?? this.baseOffset,
      extentOffset: extentOffset ?? this.extentOffset,
      affinity: affinity ?? this.affinity,
      isDirectional: isDirectional ?? this.isDirectional,
    })
  }

  expandTo (position: AtTextPosition, extentAtIndex: boolean = false): AtTextSelection {
    if (position.offset >= this.start && position.offset <= this.end) {
      return this;
    }

    const normalized = this.baseOffset <= this.extentOffset
    if (position.offset <= this.start) {
      if (extentAtIndex) {
        return this.copyWith(
          this.end,
          position.offset,
          position.affinity,
          false
        )
      }
      return this.copyWith(
        normalized ? position.offset : this.baseOffset,
        normalized ? this.extentOffset : position.offset,
        null,
        false
      )
    }
    if (extentAtIndex) {
      return this.copyWith(
        this.start,
        position.offset,
        position.affinity,
        false
      )
    }
    return this.copyWith(
      normalized ? this.baseOffset : position.offset,
      normalized ? position.offset : this.extentOffset,
      null,
      false
    )
  }

  extendTo (position: AtTextPosition): AtTextSelection {
    if (this.extent === position) {
      return this
    }

    return this.copyWith(
      position.offset,
      null,
      position.affinity,
      false
    )
  }
    
  toStrin () {
    return ``
  }
}

export type AtTextPositionOptions = {
  offset: number
  affinity?: Affinity
}

export class AtTextPosition {
  static create (options: AtTextPositionOptions) {
    return new AtTextPosition(
      options.offset,
      options.affinity
    )
  }

  public offset: number
  public affinity: Affinity

  /**
   * @description: 
   * @param {number} offset
   * @param {Affinity} affinity
   * @return {*}
   */
  constructor (offset: number, affinity: Affinity = At.Affinity.Downstream) {
    invariant(offset !== null, `The argument cannot be null.`) 
    invariant(affinity !== null, `The argument affinity cannot be null.`)

    this.offset = offset
    this.affinity = affinity
  }
  
  /**
   * @description: 
   * @param {TextPosition} other
   * @return {*}
   */
  equal (other: AtTextPosition | null) {
    return (
      other instanceof AtTextPosition &&
      other.offset === this.offset &&
      other.affinity === this.affinity
    )
  }

  notEqual (other: AtTextPosition | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `AtTextPosition(offset: ${this.offset}, affinity: ${this.affinity})`
  }
}

export type AtTextStyleOptions = {
  color?: Color | null
  decoration?: AtTextDecoration | null
  decorationColor?: Color | null
  decorationStyle?: DecorationStyle | null
  decorationThickness?: number | null
  fontWeight?: FontWeight | null
  fontStyle?: FontSlant | null
  textBaseline?: TextBaseline | null
  fontFamily?: string | null
  fontFamilyFallback?: string[] | null
  fontSize?: number | null
  letterSpacing?: number | null
  wordSpacing?: number | null
  height?: number | null
  leadingDistribution?: TextLeadingDistribution | null
  background?: AtPaint | null
  foreground?: AtPaint | null
  shadows?: AtShadow[] | null
  fontFeatures?: AtFontFeature[] | null
}

export class AtTextStyle {
  static create (options?: AtTextStyleOptions) {
    return new AtTextStyle(
      options?.color,
      options?.decoration,
      options?.decorationColor,
      options?.decorationStyle,
      options?.decorationThickness,
      options?.fontWeight,
      options?.fontStyle,
      options?.textBaseline,
      options?.fontFamily,
      options?.fontFamilyFallback,
      options?.fontSize,
      options?.letterSpacing,
      options?.wordSpacing,
      options?.height,
      options?.leadingDistribution,
      options?.background,
      options?.foreground,
      options?.shadows,
      options?.fontFeatures
    )
  }

  public color: Color | null
  public decoration: AtTextDecoration | null
  public decorationColor: Color | null
  public decorationStyle: DecorationStyle | null
  public decorationThickness: number | null
  public fontWeight: FontWeight | null
  public fontStyle: FontSlant | null
  public textBaseline: TextBaseline | null
  public fontFamily: string | null
  public fontFamilyFallback: string[] | null
  public fontSize: number | null
  public letterSpacing: number | null
  public wordSpacing: number | null
  public height: number | null
  public leadingDistribution: TextLeadingDistribution | null
  public background: AtPaint | null
  public foreground: AtPaint | null
  public shadows: AtShadow[] | null
  public fontFeatures: AtFontFeature[] | null

  public get effectiveFontFamilies (): string[] {
    this._effectiveFontFamilies = this._effectiveFontFamilies ?? getEffectiveFontFamilies(this.fontFamily, this.fontFamilyFallback)
    return this._effectiveFontFamilies
  }

  private _effectiveFontFamilies: string[] | null = null

  private _textStyle: TextStyle | null = null
  public get textStyle () {
    if (this._textStyle === null) {
      const properties: TextStyle = {
        fontFamilies: this.effectiveFontFamilies
      }

      if (this.background !== null) {
        properties.backgroundColor = toFreshColor(this.background.color)
      }
  
      if (this.color !== null) {
        properties.color = toFreshColor(this.color)
      }

      if (this.decoration !== null) {
        let decorationValue = At.NoDecoration
        if (this.decoration.contains(AtTextDecoration.underline)) {
          decorationValue |= At.UnderlineDecoration
        }
        if (this.decoration.contains(AtTextDecoration.overline)) {
          decorationValue |= At.OverlineDecoration
        }
        if (this.decoration.contains(AtTextDecoration.lineThrough)) {
          decorationValue |= At.LineThroughDecoration
        }
        properties.decoration = decorationValue
      }

      if (this.decorationThickness !== null) {
        properties.decorationThickness = this.decorationThickness
      }
  
      if (this.decorationColor !== null) {
        properties.decorationColor = toFreshColor(this.decorationColor)
      }
  
      if (this.decorationStyle !== null) {
        properties.decorationStyle = this.decorationStyle
      }
  
      if (this.textBaseline !== null) {
        properties.textBaseline = this.textBaseline
      }
  
      if (this.fontSize !== null) {
        properties.fontSize = this.fontSize
      }
  
      if (this.letterSpacing !== null) {
        properties.letterSpacing = this.letterSpacing
      }
  
      if (this.wordSpacing !== null) {
        properties.wordSpacing = this.wordSpacing
      }
  
      if (this.height !== null) {
        properties.heightMultiplier = this.height
      }
  
      switch (this.leadingDistribution) {
        case null:
          break
        case TextLeadingDistribution.Even:
          properties.halfLeading = true
          break;
        case TextLeadingDistribution.Proportional:
          properties.halfLeading = false
          break
      }
  
      if (this.fontWeight !== null || this.fontStyle !== null) {
        properties.fontStyle = toFontStyle(this.fontWeight, this.fontStyle)
      }
  
      if (this.foreground !== null) {
        properties.foregroundColor = toFreshColor(this.foreground.color)
      }
  
      if (this.shadows !== null) {
        properties.shadows = this.shadows?.map(shadow => {
          return {
            color: toFreshColor(shadow.color),
            offset: shadow.offset,
            blurRadius: shadow.blurRadius
          }
        })
      }
  
      if (this.fontFeatures !== null) {
        properties.fontFeatures = this.fontFeatures.map(({ feature, value }) => {
          return {
            name: feature,
            value: value as number
          }
        })
      }

      this._textStyle = new At.TextStyle(properties)
    }

    return this._textStyle
  }

  constructor (
    color: Color | null = null,
    decoration: AtTextDecoration | null = null,
    decorationColor: Color | null = null,
    decorationStyle: DecorationStyle | null = null,
    decorationThickness: number | null = null,
    fontWeight: FontWeight | null = null,
    fontStyle: FontSlant | null = null,
    textBaseline: TextBaseline | null = null,
    fontFamily: string | null = null,
    fontFamilyFallback: string[] | null = null,
    fontSize: number | null = null,
    letterSpacing: number | null = null,
    wordSpacing: number | null = null,
    height: number | null = null,
    leadingDistribution: TextLeadingDistribution | null = null,
    background: AtPaint | null = null,
    foreground: AtPaint | null = null,
    shadows: AtShadow[] | null = null,
    fontFeatures: AtFontFeature[] | null = null,
  ) {
    this.color = color 
    this.decoration = decoration 
    this.decorationColor = decorationColor 
    this.decorationStyle = decorationStyle 
    this.decorationThickness = decorationThickness 
    this.fontWeight = fontWeight 
    this.fontStyle = fontStyle 
    this.textBaseline = textBaseline 
    this.fontFamily = fontFamily 
    this.fontFamilyFallback = fontFamilyFallback 
    this.fontSize = fontSize 
    this.letterSpacing = letterSpacing 
    this.wordSpacing = wordSpacing 
    this.height = height 
    this.leadingDistribution = leadingDistribution 
    this.background = background 
    this.foreground = foreground 
    this.shadows = shadows 
    this.fontFeatures = fontFeatures 
  }

  /**
   * @description: 
   * @param {TextStyle} other
   * @return {*}
   */
  mergeWith (other: AtTextStyle): AtTextStyle  {
    return new AtTextStyle(
      other.color ?? this.color,
      other.decoration ?? this.decoration,
      other.decorationColor ?? this.decorationColor,
      other.decorationStyle ?? this.decorationStyle,
      other.decorationThickness ?? this.decorationThickness,
      other.fontWeight ?? this.fontWeight,
      other.fontStyle ?? this.fontStyle,
      other.textBaseline ?? this.textBaseline,
      other.fontFamily ?? this.fontFamily,
      other.fontFamilyFallback ?? this.fontFamilyFallback,
      other.fontSize ?? this.fontSize,
      other.letterSpacing ?? this.letterSpacing,
      other.wordSpacing ?? this.wordSpacing,
      other.height ?? this.height,
      other.leadingDistribution ?? this.leadingDistribution,
      other.background ?? this.background,
      other.foreground ?? this.foreground,
      other.shadows ?? this.shadows,
      other.fontFeatures ?? this.fontFeatures,
    )
  }
}

export class AtLineMetrics {
  public skia: LineMetrics

  get ascent () {
    return this.skia.ascent
  } 

  get descent () {
    return this.skia.descent
  }

  get unscaledAscent () {
    return this.skia.ascent
  }

  get hardBreak () {
    return this.skia.isHardBreak
  }

  get baseline () {
    return this.skia.baseline
  }

  get height () {
    return Math.round(this.skia.ascent + this.skia.descent)
  }

  get left () {
    return this.skia.left
  } 

  get width () {
    return this.skia.width
  }

  get lineNumber () {
    return this.skia.lineNumber
  } 
  
  /**
   * @description: 
   * @param {LineMetrics} lineMetrics
   * @return {*}
   */
  constructor (lineMetrics: LineMetrics) {
    this.skia = lineMetrics
  }
}

export type AtStructStyleOptions = {
  fontFamily: string | null 
  fontFamilyFallback: string[] | null 
  fontSize: number | null 
  height: number | null 
  leadingDistribution: TextLeadingDistribution | null 
  leading: number | null 
  fontWeight: FontWeight | null 
  fontStyle: FontSlant | null 
  forceStrutHeight: boolean | null 
}

/**
 * @description: 
 * @return {*}
 */
export class AtStrutStyle {
  static create (options?: AtStructStyleOptions) {
    return new AtStrutStyle(
      options?.fontFamily,
      options?.fontFamilyFallback,
      options?.fontSize,
      options?.height,
      options?.leadingDistribution,
      options?.leading,
      options?.fontWeight,
      options?.fontStyle,
      options?.forceStrutHeight,
    )
  }

  public fontFamily: string | null
  public fontFamilyFallback: string[] | null
  public fontSize: number | null
  public height: number | null
  public leading: number | null
  public fontWeight: FontWeight | null
  public fontStyle: FontSlant | null
  public forceStrutHeight: boolean | null
  public leadingDistribution: TextLeadingDistribution | null
  
  /**
   * @description: 
   * @param {string} fontFamily
   * @param {string} fontFamilyFallback
   * @param {number} fontSize
   * @param {number} height
   * @param {TextLeadingDistribution} leadingDistribution
   * @param {number} leading
   * @param {FontWeight} fontWeight
   * @param {FontSlant} fontStyle
   * @param {boolean} forceStrutHeight
   * @return {*}
   */
  constructor (
    fontFamily: string | null = null,
    fontFamilyFallback: string[] | null = null,
    fontSize: number | null = null,
    height: number | null = null,
    leadingDistribution: TextLeadingDistribution | null = null,
    leading: number | null = null,
    fontWeight: FontWeight | null = null,
    fontStyle: FontSlant | null = null,
    forceStrutHeight: boolean | null = null,
  ) {
    this.fontFamily = fontFamily
    this.fontFamilyFallback = fontFamilyFallback
    this.fontSize = fontSize
    this.height = height
    this.leadingDistribution = leadingDistribution
    this.leading = leading
    this.fontWeight = fontWeight
    this.fontStyle = fontStyle
    this.forceStrutHeight = forceStrutHeight
  }  

  /**
   * @description: 
   * @param {AtStrutStyle} other
   * @return {boolean}
   */
  equal (other: AtStrutStyle | null) {
    return (
      other instanceof AtStrutStyle &&
      other.fontFamily === this.fontFamily &&
      other.fontSize === this.fontSize &&
      other.height === this.height &&
      other.leading === this.leading &&
      other.leadingDistribution === this.leadingDistribution &&
      other.fontWeight === this.fontWeight &&
      other.fontStyle === this.fontStyle &&
      other.forceStrutHeight === this.forceStrutHeight &&
      listEquals<string>(other.fontFamilyFallback ?? [], this.fontFamilyFallback ?? [])
    )
  }

  /**
   * 
   * @param {AtStrutStyle | null} other 
   * @returns 
   */
  notEqual (other: AtStrutStyle | null) {
    return !this.equal(other)
  }
}

export class AtParagraphPlaceholder {
  public width: number
  public height: number
  public alignment: PlaceholderAlignment
  public baselineOffset: number
  public baseline: TextBaseline

  constructor (
    width: number,
    height: number,
    alignment: PlaceholderAlignment, 
    baselineOffset: number,
    baseline: TextBaseline,
  ) {
    this.width = width
    this.height = height
    this.alignment = alignment
    this.baselineOffset = baselineOffset
    this.baseline = baseline
  }
}


export class AtPlaceholderSpan extends AtParagraphPlaceholder {

  public start: number
  public end: number

  constructor (
    index: number,
    width: number,
    height: number,
    alignment: PlaceholderAlignment, 
    baselineOffset: number,
    baseline: TextBaseline,
  ) {
    super(
      width,
      height,
      alignment,
      baselineOffset,
      baseline,
    )

    this.start = index
    this.end = index
  }
}
