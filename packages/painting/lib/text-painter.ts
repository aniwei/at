import { invariant, clamp, listEquals, kNewLineCodeUnit } from '@at/utils'
import { Offset, Rect, Size } from '@at/geometry'
import { 
  Skia, 
  Canvas, 
  Engine, 
  StrutStyle, 
  TextHeightBehavior, 
  Paragraph, 
  TextBox, 
  TextPosition, 
  ParagraphStyle, 
  ParagraphBuilder, 
  ParagraphConstraints, 
  TextRange, 
  TextSelection
} from '@at/engine'
import { InlineSpan } from './inline-span'

// => TextOverflowKind
// 文本
export enum TextOverflowKind {
  Clip,
  Fade,
  Ellipsis,
  Visible,
}

//// => PlaceholderDimensions
// 占位符
export type PlaceholderDimensionsOptions = {
  size: Size,
  alignment: Skia.PlaceholderAlignment,
  baseline?: Skia.TextBaseline,
  baselineOffset?: number
}

export class PlaceholderDimensions {
  static get EMPTY (): PlaceholderDimensions {
    return PlaceholderDimensions.create({
      size: Size.ZERO,
      alignment: Engine.skia.PlaceholderAlignment.Bottom
    })
  }

  static empty () {
    return PlaceholderDimensions.create({
      size: Size.ZERO,
      alignment: Engine.skia.PlaceholderAlignment.Bottom
    })
  }

  static create (options: PlaceholderDimensionsOptions) {
    return new PlaceholderDimensions(
      options.size,
      options.alignment,
      options.baseline,
      options.baselineOffset
    )
  }

  /**
   * 
   * @param {Size} size 
   * @param {PlaceholderAlignment} alignment 
   * @param {TextBaseline} baseline 
   * @param {number} baselineOffset 
   */
  constructor (
    size: Size,
    alignment: Skia.PlaceholderAlignment,
    baseline: Skia.TextBaseline = Engine.skia.TextBaseline.Alphabetic,
    baselineOffset: number = 1.0,
  ) {
    this.size = size
    this.alignment = alignment
    this.baseline = baseline
    this.baselineOffset = baselineOffset
  }
  
  public size: Size
  public alignment: Skia.PlaceholderAlignment
  public baselineOffset: number
  public baseline: Skia.TextBaseline

  
  toString () {
    return `PlaceholderDimensions(
      [size]: ${this.size}, 
      [baseline]: ${this.baseline}
    )`
  }
}

/// 类型定义
export enum TextWidthBasisKind {
  Parent,
  LongestLine,
}

// 光标
export interface CaretMetrics {
  offset: Offset,
  fullHeight: number | null
}

export type TextPainterOptions = {
  text: InlineSpan
  maxLines?: number | null
  ellipsis?: string | null
  strutStyle?: StrutStyle | null
  textAlign?: Skia.TextAlign
  textDirection?: Skia.TextDirection
  textScaleFactor?: number
  textWidthBasis?: TextWidthBasisKind
  textHeightBehavior?: TextHeightBehavior | null
}


export class TextPainter {
  static create (options: TextPainterOptions) {
    return new TextPainter(
      options.text,
      options.maxLines,
      options.ellipsis,
      options.strutStyle,
      options.textAlign,
      options.textDirection,
      options.textScaleFactor,
      options.textWidthBasis,
      options.textHeightBehavior,
    )
  }

  static zwjUtf16 = 0x200d

  /**
   * 
   * @param {number} value 
   * @returns {boolean}
   */
  static isUtf16Surrogate (value: number): boolean {
    return (value & 0xF800) === 0xD800
  }

  /**
   * 
   * @param {number} value 
   * @returns {boolean}
   */
  static isUnicodeDirectionality (value: number): boolean {
    return value === 0x200F || value === 0x200E
  }
  
  // => text
  private _text: InlineSpan
  public get text (): InlineSpan {
    return this._text
  }
  public set text (value: InlineSpan) {
    invariant(value !== null)
    
    if (this._text !== value) {
      // if (this._text.style !== value?.style) {
      //   this.layoutTemplate = null
      // }
  
      let comparison = value === null
        ? Skia.RenderComparison.Layout
        : this._text?.compareTo(value) ?? Skia.RenderComparison.Layout
      
      this._text = value
  
      if (comparison >= Skia.RenderComparison.Layout) {
        this.markNeedsLayout()
      } else if (comparison >= Skia.RenderComparison.Paint) {
        this.rebuildParagraphForPaint = true
      }
    }
  }

  // => textAlign
  // 文本对齐
  private _textAlign: Skia.TextAlign
  public get textAlign (): Skia.TextAlign {
    return this._textAlign
  }
  public set textAlign (value: Skia.TextAlign) {
    if (this._textAlign !== value) {
      this._textAlign = value
      this.markNeedsLayout()
    }  
  }

  // => textDirection
  // 文本布局方向
  private _textDirection: Skia.TextDirection
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (value: Skia.TextDirection) {
    if (this._textDirection !== value) {
      this._textDirection = value
      this.markNeedsLayout()
      this.layoutTemplate = null
    }
  }

  // => textScaleFactor
  private _textScaleFactor: number
  public get textScaleFactor () {
    return this._textScaleFactor
  } 
  public set textScaleFactor (value: number) {
    invariant(value !== null)
    if (this._textScaleFactor === value) {
      this.textScaleFactor = value
      this.markNeedsLayout()
      this.layoutTemplate = null
    }
      
  }

  // => ellipsis
  private _ellipsis: string | null
  public get ellipsis () {
    return this._ellipsis
  }
  public set ellipsis (value: string | null) {
    invariant(value === null || value.length > 0, `The string "value" cannot be null or the length of the string "value" cannot be zero`)
    if (this._ellipsis !== value) {
      this._ellipsis = value
      this.markNeedsLayout()
    }
  }

  // => maxLines
  private _maxLines: number | null
  public get maxLines () {
    return this._maxLines
  }
  public set maxLines (value: number | null) {
    invariant(value === null || value > 0, `The number "value" cannot be null or the value of the number "value" cannot be zero`)

    if (this._maxLines !== value) {
      this._maxLines = value
      this.markNeedsLayout()
    }
  }

  // => strutStyle
  private _strutStyle: StrutStyle | null
  public get strutStyle () {
    return this._strutStyle
  } 
  public set strutStyle (value: StrutStyle | null) {
    if (this._strutStyle !== value) {
      this._strutStyle = value
      this.markNeedsLayout()
    }
  }

  // => textWidthBasis
  private _textWidthBasis: TextWidthBasisKind
  public get textWidthBasis (): TextWidthBasisKind {
    return this._textWidthBasis 
  }
  public set textWidthBasis (value: TextWidthBasisKind) {
    invariant(value !== null, `The argument "value" cannot be null.`)
    if (this._textWidthBasis !== value) {
      this._textWidthBasis = value
      this.markNeedsLayout()
    }
  }

  // => textHeightBehavior
  private _textHeightBehavior: TextHeightBehavior | null
  public get textHeightBehavior () {
    return this._textHeightBehavior
  }
  public set textHeightBehavior (value: TextHeightBehavior | null) {
    if (this._textHeightBehavior !== value) {
      this._textHeightBehavior = value
      this.markNeedsLayout()
    }
  }


  // => placeholderDimensions
  private _placeholderDimensions: PlaceholderDimensions[] | null = null
  public get placeholderDimensions () {
    return this._placeholderDimensions
  }
  public set placeholderDimensions (value: PlaceholderDimensions[] | null) {
    if (value == null || value.length === 0 || listEquals<PlaceholderDimensions>(value, this._placeholderDimensions)) {
      return;
    }
    
    this._placeholderDimensions = value
    this.markNeedsLayout()
  }


  public get preferredLineHeight () {
    return (this.layoutTemplate ??= this.createLayoutTemplate()).height
  }

  public get minIntrinsicWidth (): number {
    invariant(this.paragraph)
    return this.applyFloatingPointHack(this.paragraph.minIntrinsicWidth)
  }

  public get maxIntrinsicWidth () {
    invariant(this.paragraph)
    return this.applyFloatingPointHack(this.paragraph.maxIntrinsicWidth)
  }

  public get width () {
    invariant(this.paragraph)
    return this.applyFloatingPointHack(
      this.textWidthBasis === TextWidthBasisKind.LongestLine 
        ? this.paragraph.longestLine 
        : this.paragraph.width
    )
  }

  public get height () {
    invariant(this.paragraph)
    return this.applyFloatingPointHack(this.paragraph.height)
  }

  public get size (): Size {
    return new Size(this.width, this.height)
  }

  public get didExceedMaxLines () {
    invariant(this.paragraph)
    return this.paragraph.didExceedMaxLines
  }

  public get empty (): Offset {
    invariant(this.textAlign !== null)
    switch (this.textAlign) {
      case Engine.skia.TextAlign.Left:
        return Offset.ZERO
      case Engine.skia.TextAlign.Right:
        return new Offset(this.width, 0)
      case Engine.skia.TextAlign.Center:
        return new Offset(this.width / 2, 0)
      case Engine.skia.TextAlign.Justify:
        break
      case Engine.skia.TextAlign.Start:
        invariant(this.textDirection !== null)
        switch (this.textDirection) {
          case Engine.skia.TextDirection.RTL:
            return new Offset(this.width, 0)
          case Engine.skia.TextDirection.LTR:
            return Offset.ZERO
        }
        break
      case Engine.skia.TextAlign.End:
        invariant(this.textDirection !== null)
        switch (this.textDirection) {
          case Engine.skia.TextDirection.RTL:
            return Offset.ZERO
          case Engine.skia.TextDirection.LTR:
            return new Offset(this.width, 0)
        }
    }

    return Offset.ZERO
  }

  public paragraph: Paragraph | null = null
  public rebuildParagraphForPaint: ConstrainBoolean = true
  public layoutTemplate: Paragraph | null = null
  public inlinePlaceholderBoxes: TextBox[] | null = null
  public inlinePlaceholderScales: number[] | null = null


  private lastMinWidth: number | null = null
  private lastMaxWidth: number | null = null
  private caretMetrics: CaretMetrics | null = null
  private lineMetricsCache: Skia.LineMetrics[] | null = null

  private previousCaretPosition: TextPosition | null = null
  private previousCaretPrototype: Rect | null = null
  /**
   * 
   * @param {AtInlineSpan} text 
   * @param {TextAlign} textAlign 
   * @param {TextDirection} textDirection 
   * @param {number} textScaleFactor 
   * @param {number} maxLines 
   * @param {string | null} ellipsis 
   * @param {StrutStyle | null} strutStyle 
   * @param {TextWidthBasisKind} textWidthBasis 
   * @param {TextHeightBehavior | null} textHeightBehavior 
   */
  constructor (
    text: InlineSpan,
    maxLines: number | null = null,
    ellipsis: string | null = null,
    strutStyle: StrutStyle | null = null,
    textAlign: Skia.TextAlign = Engine.skia.TextAlign.Start,
    textDirection: Skia.TextDirection = Engine.skia.TextDirection.LTR,
    textScaleFactor: number = 1.0,
    textWidthBasis: TextWidthBasisKind = TextWidthBasisKind.Parent,
    textHeightBehavior: TextHeightBehavior | null = null,
  ) {
    invariant(maxLines === null || maxLines > 0)

    this._text = text
    this._textAlign = textAlign
    this._textDirection = textDirection
    this._textScaleFactor = textScaleFactor
    this._maxLines = maxLines
    this._ellipsis = ellipsis
    this._strutStyle = strutStyle
    this._textWidthBasis = textWidthBasis
    this._textHeightBehavior = textHeightBehavior
  }
  
  markNeedsLayout () {
    this.paragraph = null
    this.lineMetricsCache = null
    this.previousCaretPosition = null
    this.previousCaretPrototype = null
  }

  createParagraphStyle (defaultTextDirection?: Skia.TextDirection) {
    invariant(this.textDirection !== null || defaultTextDirection !== null, 'TextPainter.textDirection must be set to a non-null value before using the TextPainter.')
    invariant(this.text, `The member "this.text" cannot be null.`)
    
    return this.text.style?.getParagraphStyle(
      this.textAlign,
      this.textDirection ?? defaultTextDirection,
      this.ellipsis,
      this.maxLines,
      this.textScaleFactor,
      this.textHeightBehavior,
      null, // fontFamily,
      null, // fontSize,
      null, // fontWeight,
      null, // fontStyle,
      null, // height
      this.strutStyle,
    ) ?? ParagraphStyle.create({
      textAlign: this.textAlign,
      textDirection: this.textDirection ?? defaultTextDirection,
      maxLines: this.maxLines,
      fontSize: Engine.env<number>('TEXT_FONTSIZE', 12) * this.textScaleFactor,
      textHeightBehavior: this.textHeightBehavior,
      ellipsis: this.ellipsis,
    })
  }
  
  createLayoutTemplate () {
    const builder = new ParagraphBuilder(this.createParagraphStyle(Engine.skia.TextDirection.RTL))
    invariant(this.text)

    let textStyle = this.text.style?.getTextStyle(this.textScaleFactor) ?? null
    
    if (textStyle !== null) {
      builder.push(textStyle)
    }

    builder.text(' ')
    const paragraph = builder.build()
    paragraph.layout(ParagraphConstraints.create(Infinity))
    return paragraph
  }

  applyFloatingPointHack (value: number) {
    return Math.ceil(value)
  }

  computeDistanceToActualBaseline (baseline: Skia.TextBaseline) {
    invariant(this.paragraph)
    switch (baseline) {
      case Engine.skia.TextBaseline.Alphabetic:
        return this.paragraph.alphabeticBaseline
      case Engine.skia.TextBaseline.Ideographic:
        return this.paragraph.ideographicBaseline
    }
  }

  /**
   * 
   */
  createParagraph () {
    invariant(this.paragraph === null || this.rebuildParagraphForPaint)
    let text = this.text
    
    if (text === null) {
      throw Error('TextPainter.text must be set to a non-null value before using the TextPainter.')
    }

    const builder = ParagraphBuilder.create(this.createParagraphStyle())
    text.build(builder, this.textScaleFactor, this._placeholderDimensions)

    this.inlinePlaceholderScales = builder.scales
    this.paragraph = builder.build()
    this.rebuildParagraphForPaint = false
  }

  /**
   * 
   * @param {number} minWidth 
   * @param {number} maxWidth 
   */
  layoutParagraph (minWidth: number, maxWidth: number) {
    invariant(this.paragraph)
    this.paragraph.layout(ParagraphConstraints.create(maxWidth))
    
    if (minWidth !== maxWidth) {
      let width
      switch (this.textWidthBasis) {
        case TextWidthBasisKind.LongestLine:
          width = this.applyFloatingPointHack(this.paragraph.longestLine)
          break
        case TextWidthBasisKind.Parent:
          width = this.maxIntrinsicWidth
          break
      }

      width = clamp(width, minWidth, maxWidth)
      if (width !== this.applyFloatingPointHack(this.paragraph.width)) {
        this.paragraph.layout(ParagraphConstraints.create(width))
      }
    }
  }

  layout (minWidth: number = 0, maxWidth: number = Infinity) {
    invariant(this.text !== null, 'TextPainter.text must be set to a non-null value before using the TextPainter.')
    invariant(this.textDirection !== null, 'TextPainter.textDirection must be set to a non-null value before using the TextPainter.')
    
    if (
      this.paragraph === null ||
      minWidth !== this.lastMinWidth ||
      maxWidth !== this.lastMaxWidth
    ) {
      if (this.rebuildParagraphForPaint || this.paragraph === null) {
        this.createParagraph()
      }
  
      invariant(this.paragraph)
  
      this.lastMinWidth = minWidth
      this.lastMaxWidth = maxWidth
      
      this.previousCaretPosition = null
      this.previousCaretPrototype = null
  
      this.layoutParagraph(minWidth, maxWidth)
      this.inlinePlaceholderBoxes = this.paragraph.getBoxesForPlaceholders()
    }
    
  }

  paint (canvas: Canvas, offset: Offset) {
    const minWidth = this.lastMinWidth
    const maxWidth = this.lastMaxWidth
    
    if (this.paragraph === null || minWidth === null || maxWidth === null) {
      throw new Error(`TextPainter.paint called when text geometry was not yet calculated.\nPlease call layout() before paint() to position the text before painting it.`)
    }

    if (this.rebuildParagraphForPaint) {
      this.createParagraph()
      this.layoutParagraph(minWidth, maxWidth)
    }
    
    canvas.drawParagraph(this.paragraph, offset)
  }


  getOffsetAfter (offset: number): number | null {
    const nextCodeUnit = this.text.codeUnitAt(offset)
    if (nextCodeUnit === null) {
      return null
    }
    
    return TextPainter.isUtf16Surrogate(nextCodeUnit) ? offset + 2 : offset + 1
  }

  getOffsetBefore (offset: number): number | null  {
    const prevCodeUnit = this.text.codeUnitAt(offset - 1)
    if (prevCodeUnit === null) {
      return null
    }
    
    return TextPainter.isUtf16Surrogate(prevCodeUnit) ? offset - 2 : offset - 1
  }

  getRectFromUpstream (offset: number, caretPrototype: Rect): Rect | null {
    invariant(this.text)
    
    const flattenedText = this.text.toPlainText(false)
    const prevCodeUnit = this.text.codeUnitAt(Math.max(0, offset - 1))
    
    if (prevCodeUnit === null) {
      return null
    }

    invariant(this.paragraph)

    const needsSearch = (
      TextPainter.isUtf16Surrogate(prevCodeUnit) || 
      this.text.codeUnitAt(offset) === TextPainter.zwjUtf16 || 
      TextPainter.isUnicodeDirectionality(prevCodeUnit)
    )

    let graphemeClusterLength = needsSearch ? 2 : 1
    let boxes: TextBox[] = []

    while (boxes.length === 0) {
      const prevRuneOffset = offset - graphemeClusterLength
      boxes = this.paragraph.getBoxesForRange(prevRuneOffset, offset, Engine.skia.RectHeightStyle.Strut)
      
      if (boxes.length === 0) {
        if (!needsSearch && prevCodeUnit == kNewLineCodeUnit) {
          break
        }

        if (prevRuneOffset < -flattenedText.length) {
          break
        }
        
        graphemeClusterLength *= 2
        continue
      }

      let box = boxes[0]

      if (prevCodeUnit == kNewLineCodeUnit) {
        return Rect.fromLTRB(
          this.empty.dx, 
          box.bottom, 
          this.empty.dx, 
          box.bottom + box.bottom - box.top
        )
      }

      const caretEnd = box.end
      const dx = box.direction == Engine.skia.TextDirection.RTL 
        ? caretEnd - caretPrototype.width 
        : caretEnd

      return Rect.fromLTRB(
        clamp(dx, 0, this.paragraph.width), 
        box.top, 
        clamp(dx, 0, this.paragraph.width), 
        box.bottom
      )
    }

    return null
  }

  getRectFromDownstream (offset: number, caretPrototype: Rect): Rect | null {
    invariant(this.text)
    const flattenedText = this.text.toPlainText(false)
    const nextCodeUnit = this.text.codeUnitAt(Math.min(offset, flattenedText.length - 1))
    
    if (nextCodeUnit === null) {
      return null
    }
    
    const needsSearch = TextPainter.isUtf16Surrogate(nextCodeUnit) || (nextCodeUnit === TextPainter.zwjUtf16) || TextPainter.isUnicodeDirectionality(nextCodeUnit)
    let graphemeClusterLength = needsSearch ? 2 : 1
    let boxes: TextBox[] = []

    invariant(this.paragraph)

    while (boxes.length === 0) {
      const nextRuneOffset = offset + graphemeClusterLength
      boxes = this.paragraph.getBoxesForRange(offset, nextRuneOffset, Engine.skia.RectHeightStyle.Strut)
      
      if (boxes.length === 0) {
        if (!needsSearch) {
          break 
        }

        if (nextRuneOffset >= flattenedText.length << 1) {
          break
        }

        graphemeClusterLength *= 2
        continue
      }

      const box = boxes[boxes.length - 1]
      const caretStart = box.start
      const dx = box.direction === Engine.skia.TextDirection.RTL 
        ? caretStart - caretPrototype.width 
        : caretStart
      
      return Rect.fromLTRB(
        clamp(dx, 0, this.paragraph.width), 
        box.top, 
        clamp(dx, 0, this.paragraph.width), 
        box.bottom
      )
    }

    return null
  }
  
  getOffsetForCaret (position: TextPosition, caretPrototype: Rect): Offset {
    this.computeCaretMetrics(position, caretPrototype)
    invariant(this.caretMetrics)
    return this.caretMetrics.offset
  }

  getFullHeightForCaret (position: TextPosition, caretPrototype: Rect) {
    this.computeCaretMetrics(position, caretPrototype)
    invariant(this.caretMetrics)
    return this.caretMetrics.fullHeight
  }

  computeCaretMetrics (position: TextPosition, caretPrototype: Rect) {
    if (
      position.notEqual(this.previousCaretPosition) ||
      caretPrototype.notEqual(this.previousCaretPrototype)
    ) {
      invariant(position.affinity !== null)
      
      const offset = position.offset
      let rect: Rect | null = null
      
      switch (position.affinity) {
        case Engine.skia.Affinity.Upstream: {
          rect = this.getRectFromUpstream(offset, caretPrototype) ?? this.getRectFromDownstream(offset, caretPrototype)
          break
        }
        case Engine.skia.Affinity.Downstream: {
          rect = this.getRectFromDownstream(offset, caretPrototype) ?? this.getRectFromUpstream(offset, caretPrototype)
          break
        }
      }
  
      this.caretMetrics = {
        offset: rect !== null 
          ? new Offset(rect.left, rect.top) 
          : this.empty,
        fullHeight: rect !== null ? 
          rect.bottom - rect.top 
          : null,
      }
  
      
      this.previousCaretPosition = position
      this.previousCaretPrototype = caretPrototype
    }

  }

  getBoxesForSelection (
    selection: TextSelection,
    boxHeightStyle: Skia.RectHeightStyle = Engine.skia.RectHeightStyle.Tight,
    boxWidthStyle: Skia.RectWidthStyle = Engine.skia.RectWidthStyle.Tight,
  ) {
    invariant(this.paragraph)
    return this.paragraph.getBoxesForRange(
      selection.start,
      selection.end,
      boxHeightStyle,
      boxWidthStyle,
    )
  }

  getPositionForOffset (offset: Offset): TextPosition {
    invariant(this.paragraph)
    return this.paragraph.getPositionForOffset(offset)
  }

  getWordBoundary (position: TextPosition ): TextRange {
    invariant(this.paragraph)
    return this.paragraph.getWordBoundary(position)
  }
  
  getLineBoundary (position: TextPosition): TextRange {
    invariant(this.paragraph)
    return this.paragraph.getLineBoundary(position)
  }
  
  computeLineMetrics (): Skia.LineMetrics[] {
    invariant(this.paragraph)
    this.lineMetricsCache ??= this.paragraph.computeLineMetrics() 
    invariant(this.lineMetricsCache)
    return this.lineMetricsCache
  }
}
