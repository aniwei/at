import { invariant } from 'ts-invariant'
import { Offset, Rect, Size } from '../basic/geometry'
import { At, RenderComparison } from '../at'
import { 
  PlaceholderAlignment, 
  RectHeightStyle, 
  RectWidthStyle, 
  TextAlign, 
  TextBaseline, 
  TextDirection 
} from '../engine/skia'
import { 
  AtLineMetrics, 
  AtParagraph, 
  AtParagraphBuilder, 
  AtParagraphConstraints, 
  AtParagraphStyle, 
  AtStrutStyle, 
  AtTextBox, 
  AtTextHeightBehavior, 
  AtTextPosition, 
  AtTextRange, 
  AtTextSelection 
} from '../engine/text'
import { clamp, listEquals } from '@at/basic'
import { AtCanvas } from '../engine/canvas'
import { InlineSpan } from './inline-span'

export enum TextOverflow {
  Clip,
  Fade,
  Ellipsis,
  Visible,
}

export type AtPlaceholderDimensionsOptions = {
  size: Size,
  alignment: PlaceholderAlignment,
  baseline?: TextBaseline,
  baselineOffset?: number
}

export class AtPlaceholderDimensions {
  static get empty (): AtPlaceholderDimensions {
    invariant(At.kEmptyPlaceholderDimensions)
    return At.kEmptyPlaceholderDimensions
  }

  static create (options: AtPlaceholderDimensionsOptions) {
    return new AtPlaceholderDimensions(
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
    alignment: PlaceholderAlignment,
    baseline: TextBaseline = At.TextBaseline.Alphabetic,
    baselineOffset: number = 1.0,
  ) {
    invariant(size !== null, `The argument "size" cannot be null.`)
    invariant(alignment !== null, `The argument "alignment" cannot be null.`)

    this.size = size
    this.alignment = alignment
    this.baseline = baseline
    this.baselineOffset = baselineOffset
  }
  
  public size: Size
  public alignment: PlaceholderAlignment
  public baselineOffset: number
  public baseline: TextBaseline

  
  toString () {
    return `AtPlaceholderDimensions(${this.size}, ${this.baseline})`
  }
}

export enum TextWidthBasis {
  Parent,
  LongestLine,
}

export type CaretMetrics = {
  offset: Offset,
  fullHeight: number | null
}

export type AtTextPainterOptions = {
  text: AtInlineSpan
  maxLines?: number | null
  ellipsis?: string | null
  strutStyle?: AtStrutStyle | null
  textAlign?: TextAlign
  textDirection?: TextDirection
  textScaleFactor?: number
  textWidthBasis?: TextWidthBasis
  textHeightBehavior?: AtTextHeightBehavior | null
}


export class AtTextPainter {
  static create (options: AtTextPainterOptions) {
    return new AtTextPainter(
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
  private _text: AtInlineSpan
  public get text (): AtInlineSpan {
    return this._text
  }
  public set text (value: AtInlineSpan) {
    invariant(value !== null)
    
    if (this._text !== value) {
      // if (this._text.style !== value?.style) {
      //   this.layoutTemplate = null
      // }
  
      let comparison = value === null
        ? RenderComparison.Layout
        : this._text?.compareTo(value) ?? RenderComparison.Layout
      
      this._text = value
  
      if (comparison >= RenderComparison.Layout) {
        this.markNeedsLayout()
      } else if (comparison >= RenderComparison.Paint) {
        this.rebuildParagraphForPaint = true
      }
    }
  }

  // => textAlign
  private _textAlign: TextAlign
  public get textAlign (): TextAlign {
    return this._textAlign
  }
  public set textAlign (value: TextAlign) {
    invariant(value !== null)

    if (this._textAlign !== value) {
      this._textAlign = value
      this.markNeedsLayout()
    }  
  }

  // => textDirection
  private _textDirection: TextDirection
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (value: TextDirection) {
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
  private _strutStyle: AtStrutStyle | null
  public get strutStyle () {
    return this._strutStyle
  } 
  public set strutStyle (value: AtStrutStyle | null) {
    if (this._strutStyle !== value) {
      this._strutStyle = value
      this.markNeedsLayout()
    }
  }

  // => textWidthBasis
  private _textWidthBasis: TextWidthBasis
  public get textWidthBasis (): TextWidthBasis {
    return this._textWidthBasis 
  }
  public set textWidthBasis (value: TextWidthBasis) {
    invariant(value !== null, `The argument "value" cannot be null.`)
    if (this._textWidthBasis !== value) {
      this._textWidthBasis = value
      this.markNeedsLayout()
    }
  }

  // => textHeightBehavior
  private _textHeightBehavior: AtTextHeightBehavior | null
  public get textHeightBehavior () {
    return this._textHeightBehavior
  }
  public set textHeightBehavior (value: AtTextHeightBehavior | null) {
    if (this._textHeightBehavior !== value) {
      this._textHeightBehavior = value
      this.markNeedsLayout()
    }
  }


  // => placeholderDimensions
  private _placeholderDimensions: AtPlaceholderDimensions[] | null = null
  public get placeholderDimensions () {
    return this._placeholderDimensions
  }
  public set placeholderDimensions (value: AtPlaceholderDimensions[] | null) {
    if (value == null || value.length === 0 || listEquals<AtPlaceholderDimensions>(value, this._placeholderDimensions)) {
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
      this.textWidthBasis === TextWidthBasis.LongestLine 
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

  public paragraph: AtParagraph | null = null
  public rebuildParagraphForPaint: ConstrainBoolean = true
  public layoutTemplate: AtParagraph | null = null
  public inlinePlaceholderBoxes: AtTextBox[] | null = null
  public inlinePlaceholderScales: number[] | null = null


  private lastMinWidth: number | null = null
  private lastMaxWidth: number | null = null
  private caretMetrics: CaretMetrics | null = null
  private lineMetricsCache: AtLineMetrics[] | null = null

  private previousCaretPosition: AtTextPosition | null = null
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
   * @param {TextWidthBasis} textWidthBasis 
   * @param {TextHeightBehavior | null} textHeightBehavior 
   */
  constructor (
    text: AtInlineSpan,
    maxLines: number | null = null,
    ellipsis: string | null = null,
    strutStyle: AtStrutStyle | null = null,
    textAlign: TextAlign = At.TextAlign.Start,
    textDirection: TextDirection = At.TextDirection.LTR,
    textScaleFactor: number = 1,
    textWidthBasis: TextWidthBasis = TextWidthBasis.Parent,
    textHeightBehavior: AtTextHeightBehavior | null = null,
  ) {
    invariant(text !== null, `The argument "text" cannot be null.`)
    invariant(textAlign !== null, `The argument "textAlign" cannot be null.`)
    invariant(textScaleFactor !== null, `The argument "textScaleFactor" cannot be null.`)
    invariant(maxLines === null || maxLines > 0)
    invariant(textWidthBasis !== null, `The argument "textWidthBasis" cannot be null.`)

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

  createParagraphStyle (defaultTextDirection?: TextDirection) {
    invariant(this.textDirection !== null || defaultTextDirection !== null, 'AtTextPainter.textDirection must be set to a non-null value before using the AtTextPainter.')
    invariant(this.text, `The member "this.text" cannot be null.`)
    // invariant(this.text.style, `The member "this.text.style" cannot be null.`)
    invariant(At.kDefaultFontSize)
    
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
    ) ?? AtParagraphStyle.create({
      textAlign: this.textAlign,
      textDirection: this.textDirection ?? defaultTextDirection,
      maxLines: this.maxLines,
      fontSize: At.kDefaultFontSize * this.textScaleFactor,
      textHeightBehavior: this.textHeightBehavior,
      ellipsis: this.ellipsis,
    })
  }
  
  createLayoutTemplate () {
    const builder = new AtParagraphBuilder(this.createParagraphStyle(At.TextDirection.RTL))
    invariant(this.text)

    let textStyle = this.text.style?.getTextStyle(this.textScaleFactor) ?? null
    
    if (textStyle !== null) {
      builder.pushStyle(textStyle)
    }

    builder.addText(' ')
    const paragraph = builder.build()
    paragraph.layout(new AtParagraphConstraints(Infinity))
    return paragraph
  }

  applyFloatingPointHack (layoutValue: number) {
    return Math.ceil(layoutValue)
  }

  computeDistanceToActualBaseline (baseline: TextBaseline) {
    invariant(baseline !== null)
    invariant(this.paragraph)
    switch (baseline) {
      case At.TextBaseline.Alphabetic:
        return this.paragraph.alphabeticBaseline
      case At.TextBaseline.Ideographic:
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
      throw Error('AtTextPainter.text must be set to a non-null value before using the AtTextPainter.')
    }

    const builder = new AtParagraphBuilder(this.createParagraphStyle())
    text.build(builder, this.textScaleFactor, this._placeholderDimensions)

    this.inlinePlaceholderScales = builder.placeholderScales
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
    this.paragraph.layout(new AtParagraphConstraints(maxWidth))
    
    if (minWidth !== maxWidth) {
      let newWidth
      switch (this.textWidthBasis) {
        case TextWidthBasis.LongestLine:
          newWidth = this.applyFloatingPointHack(this.paragraph.longestLine)
          break
        case TextWidthBasis.Parent:
          newWidth = this.maxIntrinsicWidth
          break
      }

      newWidth = clamp(newWidth, minWidth, maxWidth)
      if (newWidth !== this.applyFloatingPointHack(this.paragraph.width)) {
        this.paragraph.layout(new AtParagraphConstraints(newWidth))
      }
    }
  }

  layout (minWidth: number = 0, maxWidth: number = Infinity) {
    invariant(this.text !== null, 'AtTextPainter.text must be set to a non-null value before using the AtTextPainter.')
    invariant(this.textDirection !== null, 'AtTextPainter.textDirection must be set to a non-null value before using the AtTextPainter.')
    
    if (
      this.paragraph !== null && 
      minWidth === this.lastMinWidth && 
      maxWidth === this.lastMaxWidth
    ) {
      return
    }
    
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

  paint (canvas: AtCanvas, offset: Offset) {
    const minWidth = this.lastMinWidth
    const maxWidth = this.lastMaxWidth
    
    if (this.paragraph === null || minWidth === null || maxWidth === null) {
      throw new Error(`AtTextPainter.paint called when text geometry was not yet calculated.\nPlease call layout() before paint() to position the text before painting it.`)
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
    
    return AtTextPainter.isUtf16Surrogate(nextCodeUnit) ? offset + 2 : offset + 1
  }

  getOffsetBefore (offset: number): number | null  {
    const prevCodeUnit = this.text.codeUnitAt(offset - 1)
    if (prevCodeUnit === null) {
      return null
    }
    
    return AtTextPainter.isUtf16Surrogate(prevCodeUnit) ? offset - 2 : offset - 1
  }

  private getRectFromUpstream (offset: number, caretPrototype: Rect): Rect | null {
    invariant(this.text)
    
    const flattenedText = this.text.toPlainText(false)
    const prevCodeUnit = this.text.codeUnitAt(Math.max(0, offset - 1))
    
    if (prevCodeUnit === null) {
      return null
    }

    invariant(this.paragraph)

    const NEWLINE_CODE_UNIT = 10
    const needsSearch = AtTextPainter.isUtf16Surrogate(prevCodeUnit) || this.text.codeUnitAt(offset) === AtTextPainter.zwjUtf16 || AtTextPainter.isUnicodeDirectionality(prevCodeUnit)
    let graphemeClusterLength = needsSearch ? 2 : 1
    let boxes: AtTextBox[] = []
    while (boxes.length === 0) {
      const prevRuneOffset = offset - graphemeClusterLength
      boxes = this.paragraph.getBoxesForRange(prevRuneOffset, offset, At.RectHeightStyle.Strut)
      
      if (boxes.length === 0) {
        if (!needsSearch && prevCodeUnit == NEWLINE_CODE_UNIT) {
          break
        }

        if (prevRuneOffset < -flattenedText.length) {
          break
        }
        
        graphemeClusterLength *= 2
        continue
      }

      let box = boxes[0]

      if (prevCodeUnit == NEWLINE_CODE_UNIT) {
        return Rect.fromLTRB(this.empty.dx, box.bottom, this.empty.dx, box.bottom + box.bottom - box.top)
      }

      const caretEnd = box.end
      const dx = box.direction == At.TextDirection.RTL 
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

  private getRectFromDownstream (offset: number, caretPrototype: Rect): Rect | null {
    invariant(this.text)
    const flattenedText = this.text.toPlainText(false)
    const nextCodeUnit = this.text.codeUnitAt(Math.min(offset, flattenedText.length - 1))
    
    if (nextCodeUnit === null) {
      return null
    }
    
    const needsSearch = AtTextPainter.isUtf16Surrogate(nextCodeUnit) || (nextCodeUnit === AtTextPainter.zwjUtf16) || AtTextPainter.isUnicodeDirectionality(nextCodeUnit)
    let graphemeClusterLength = needsSearch ? 2 : 1
    let boxes: AtTextBox[] = []

    invariant(this.paragraph)

    while (boxes.length === 0) {
      const nextRuneOffset = offset + graphemeClusterLength
      boxes = this.paragraph.getBoxesForRange(offset, nextRuneOffset, At.RectHeightStyle.Strut)
      
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
      const dx = box.direction === At.TextDirection.RTL 
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

  private get empty (): Offset {
    invariant(this.textAlign !== null)
    switch (this.textAlign) {
      case At.TextAlign.Left:
        return Offset.zero
      case At.TextAlign.Right:
        return new Offset(this.width, 0)
      case At.TextAlign.Center:
        return new Offset(this.width / 2, 0)
      case At.TextAlign.Justify:
      case At.TextAlign.Start:
        invariant(this.textDirection !== null)
        switch (this.textDirection) {
          case At.TextDirection.RTL:
            return new Offset(this.width, 0)
          case At.TextDirection.LTR:
            return Offset.zero
        }
      case At.TextAlign.End:
        invariant(this.textDirection !== null)
        switch (this.textDirection) {
          case At.TextDirection.RTL:
            return Offset.zero
          case At.TextDirection.LTR:
            return new Offset(this.width, 0)
        }
    }

    return Offset.zero
  }

  
  getOffsetForCaret (position: AtTextPosition, caretPrototype: Rect): Offset {
    this.computeCaretMetrics(position, caretPrototype)
    invariant(this.caretMetrics)
    return this.caretMetrics.offset
  }

  getFullHeightForCaret (position: AtTextPosition, caretPrototype: Rect) {
    this.computeCaretMetrics(position, caretPrototype)
    invariant(this.caretMetrics)
    return this.caretMetrics.fullHeight
  }

  private computeCaretMetrics (position: AtTextPosition, caretPrototype: Rect) {
    
    if (
      position.equal(this.previousCaretPosition) && 
      caretPrototype.equal(this.previousCaretPrototype)
    ) {
      return
    }

    invariant(position.affinity !== null)
    
    const offset = position.offset
    let rect: Rect | null = null
    
    switch (position.affinity) {
      case At.Affinity.Upstream: {
        rect = this.getRectFromUpstream(offset, caretPrototype) ?? this.getRectFromDownstream(offset, caretPrototype)
        break
      }
      case At.Affinity.Downstream: {
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

  getBoxesForSelection (
    selection: AtTextSelection,
    boxHeightStyle: RectHeightStyle = At.RectHeightStyle.Tight,
    boxWidthStyle: RectWidthStyle = At.RectWidthStyle.Tight,
  ) {
    invariant(boxHeightStyle !== null)
    invariant(boxWidthStyle !== null)
    invariant(this.paragraph)

    return this.paragraph.getBoxesForRange(
      selection.start,
      selection.end,
      boxHeightStyle,
      boxWidthStyle,
    );
  }

  getPositionForOffset (offset: Offset): AtTextPosition {
    invariant(this.paragraph)
    return this.paragraph.getPositionForOffset(offset)
  }

  getWordBoundary (position: AtTextPosition ): AtTextRange {
    invariant(this.paragraph)
    return this.paragraph.getWordBoundary(position)
  }
  
  getLineBoundary (position: AtTextPosition): AtTextRange {
    invariant(this.paragraph)
    return this.paragraph.getLineBoundary(position)
  }
  
  computeLineMetrics(): AtLineMetrics[] {
    invariant(this.paragraph)
    return  this.lineMetricsCache ??= this.paragraph!.computeLineMetrics()
  }
}
