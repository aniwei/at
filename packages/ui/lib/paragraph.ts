import { invariant, tryCatch } from '@at/utils'
import { Matrix4 } from '@at/math'
import { Color } from '@at/basic'
import { Offset, Rect, Size } from '@at/geometry'
import { HitTestEntry, HitTestTarget } from '@at/gesture'
import { 
  TextSpan, 
  InlineSpan, 
  Gradient,
  TextPainter, 
  TextOverflowKind, 
  TextWidthBasisKind, 
  PlaceholderDimensions, 
} from '@at/painting'
import { 
  Skia,
  Engine,
  ClipRectLayer, 
  LayerRef, 
  PlaceholderSpan, 
  Shader,
  StrutStyle, 
  TextBox, 
  TextHeightBehavior, 
  TextPosition, 
  TextRange, 
  TextSelection 
} from '@at/engine'
import { Box } from './box'
import { ViewportOffset } from './viewport'
import { BoxHitTestResult } from './box-hit-test'
import { BoxConstraints } from './constraints'
import { PaintingContext } from './painting-context'
import { ParagraphProxy } from './paragraph-proxy'
import { 
  ParagraphCaretPainter, 
  ParagraphHighlightPainter, 
} from './paragraph-painter'

//// => Paragraph
export interface ParagraphOptions {
  proxy: ParagraphProxy, 
  scale?: number,
  viewport?: ViewportOffset,
  paintCaretAboveText?: boolean,
  editable?: boolean,
  selectable?: boolean,
  textAlign?: Skia.TextAlign
  textDirection?: Skia.TextDirection,
  softWrap?: boolean,
  overflow?: TextOverflowKind,
  textScaleFactor?: number,
  maxLines?: number,
  minLines?: number,
  strutStyle?: StrutStyle,
  textWidthBasis?: TextWidthBasisKind,
  textHeightBehavior?: TextHeightBehavior,
  caret?: ParagraphCaretPainter,
  highlighter?: ParagraphHighlightPainter
  children?: Box[],
}

export class Paragraph extends Box {
  /**
   * 创建 Paragraph 对象
   * @param {ParagraphOptions} options 
   * @returns {Paragraph}
   */
  static create(options: ParagraphOptions) {
    return new Paragraph(
      options.proxy,
      options.scale,
      options.viewport,
      options.textAlign,
      options.textDirection,
      options.softWrap,
      options.overflow,
      options.textScaleFactor,
      options.maxLines,
      options.minLines,
      options.strutStyle,
      options.textWidthBasis,
      options.textHeightBehavior,
      options.children,
    ) as Paragraph
  }

  // => proxy
  protected _proxy: ParagraphProxy | null = null
  public get proxy () {
    invariant(this._proxy, 'The "Paragraph.proxy" cannot be null.')
    return this._proxy
  }
  public set proxy (proxy: ParagraphProxy) {
    if (
      this._proxy === null || 
      this._proxy !== proxy
    ) {
      if (this._proxy) {
        this._proxy.unsubscribe()
      }

      this._proxy = proxy
      this._proxy?.subscribe(() => this.markNeedsLayout())
      this.markNeedsLayout()
    }
  }
  
  // => softWrap
  // 软换行
  protected _softWrap: boolean = true
  public get softWrap () {
    invariant(this._softWrap, 'The "Paragraph.softWrap" cannot be null.')
    return this._softWrap
  }
  public set softWrap (softWrap: boolean) {
    if (
      this._softWrap === null || 
      this._softWrap !== softWrap
    ) {
      this._softWrap = softWrap
      this.markNeedsLayout()
    }
  }

  // => overflow
  // 溢出
  protected _overflow: TextOverflowKind = TextOverflowKind.Ellipsis
  public get overflow (): TextOverflowKind {
    invariant(this._overflow !== null, 'The "Paragraph.overflow" cannot be null.')
    return this._overflow
  }
  public set overflow (overflow: TextOverflowKind) {
    if (
      this._overflow === null || 
      this._overflow !== overflow
    ) {
      this._overflow = overflow
      
      // 尝试赋值
      tryCatch(() => {
        this.painter.ellipsis = overflow == TextOverflowKind.Ellipsis 
          ? Engine.env<string>('ATKIT_PARAGRAPH_ELLIPSIS', '...') 
          : null
      })

      this.markNeedsLayout()
    }
  }

  // => text
  // 文本
  public get text (): InlineSpan {
    return this.painter.text
  } 
  public set text (value: InlineSpan) {
    switch (this.painter.text.compareTo(value)) {
      case Skia.RenderComparison.Identical:
      case Skia.RenderComparison.Metadata:
        return
      case Skia.RenderComparison.Paint:
        this.painter.text = value
        this.extractPlaceholderSpans(value)
        this.markNeedsPaint()
        break
      case Skia.RenderComparison.Layout:
        this.painter.text = value
        this.overflowShader = null
        this.extractPlaceholderSpans(value)
        this.markNeedsLayout()
        break
    }
  }

  // => textAlign
  // 文本布局
  public get textAlign (): Skia.TextAlign {
    return this.painter.textAlign
  }
  public set textAlign (value: Skia.TextAlign) {
    if (this.painter.textAlign !== value) {
      this.painter.textAlign = value
      this.markNeedsPaint()
    }
  }

  // => textDirection
  // 文本布局方向
  public get textDirection (): Skia.TextDirection {
    return this.painter.textDirection
  }
  public set textDirection (value: Skia.TextDirection) {
    if (this.painter.textDirection !== value) {
      this.painter.textDirection = value
      this.markNeedsLayout()
    }
  }

  // => textScaleFactor
  // 文本缩放因子
  public get textScaleFactor () {
    return this.painter.textScaleFactor
  }
  public set textScaleFactor (value: number) {
    if (this.painter.textScaleFactor !== value) {
      this.painter.textScaleFactor = value
      this.markNeedsLayout()
    }
      
  }

  // => maxLines
  // 最大行数
  public get maxLines (): number | null {
    return this.painter.maxLines
  }
  public set maxLines (value: number | null) {
    if (this.painter.maxLines !== value) {
      this.painter.maxLines = value
      this.overflowShader = null
      this.markNeedsLayout()
    }
  }

  // => minLines
  // 最小行数
  protected _minLines: number | null = null
  public get minLines (): number | null {
    return this._minLines
  }
  public set minLines (value: number | null) {
    invariant(value === null || value > 0)
    if (this.minLines !== value) {
      this._minLines = value
      this.markNeedsLayout()
    }
  }


  // => strutStyle
  public get strutStyle ():StrutStyle | null {
    return this.painter.strutStyle
  }
  public set strutStyle (value: StrutStyle | null) {
    if (this.painter.strutStyle !== value) {
      this.painter.strutStyle = value
      this.overflowShader = null
      this.markNeedsLayout()
    }
  }

  // => textWidthBasis
  public get textWidthBasis () {
    return this.painter.textWidthBasis
  }
  public set textWidthBasis (value: TextWidthBasisKind) {
    if (this.painter.textWidthBasis !== value) {
      this.painter.textWidthBasis = value
      this.overflowShader = null
      this.markNeedsLayout()
    }
  }

  // => textHeightBehavior
  public get textHeightBehavior () {
    return this.painter.textHeightBehavior
  }
  public set textHeightBehavior (value: TextHeightBehavior | null) {
    if (this.painter.textHeightBehavior !== value) {
      this.painter.textHeightBehavior = value
      this.overflowShader = null
      this.markNeedsLayout()
    }
  }

  // textSize
  public get textSize (): Size {
    return this.painter.size
  }

  // => preferredLineHeight
  public get preferredLineHeight () {
    return this.painter.preferredLineHeight
  }

  // => isMultiline
  public get isMultiline () {
    return this.maxLines !== 1
  }

  // => viewportAxis
  public get viewportAxis (): Skia.Axis {
    return this.isMultiline 
      ? Engine.skia.Axis.Vertical 
      : Engine.skia.Axis.Horizontal
  }

  // => paintAt
  public get paintAt (): Offset {
    invariant(this.viewport)
    switch (this.viewportAxis) {
      case Engine.skia.Axis.Horizontal:
        return new Offset(-this.viewport.pixels, 0.0)
      case Engine.skia.Axis.Vertical:
        return new Offset(0.0, -this.viewport.pixels)
    }
  }

  // => viewport
  protected _viewport: ViewportOffset | null = null
  public get viewport (): ViewportOffset {
    invariant(this._viewport !== null, `The "Paragraph.viewport" cannot be null.`)
    return this._viewport
  }
  public set viewport (value: ViewportOffset) {
    if (this._viewport === null || this._viewport !== value) {
      this._viewport = value
      this.markNeedsLayout()
    }
  }

  // => devicePixelRatio
  // 设备像素比
  public get devicePixelRatio (): number {
    invariant(this.owner, 'The "Paragraph.owner" cannot be null.')
    return this.owner.configuration.devicePixelRatio
  }

  // => clipBehavior
  protected _clipBehavior: Skia.Clip = Skia.Clip.HardEdge
  public get clipBehavior (): Skia.Clip {
    return this._clipBehavior
  }
  public set clipBehavior (value: Skia.Clip) {
    if (this._clipBehavior === null || value !== this._clipBehavior) {
      this._clipBehavior = value
      this.markNeedsPaint()
    }
  }

  // => overflowed
  protected get overflowed () {
    return this.maxScrollExtent > 0 || this.paintAt.notEqual(Offset.ZERO)
  }
  
  // => painter
  // 文本绘制画笔
  protected _painter: TextPainter | null = null
  public get painter () {
    invariant(this._painter !== null, 'The "Paragraph.painter" cannot be null.')
    return this._painter
  } 
  public set painter (painter: TextPainter) {
    if (
      this._painter === null || 
      this._painter !== painter
    ) {
      this._painter = painter
      tryCatch(() => {
        if (painter) {
          painter.ellipsis = this.overflow === TextOverflowKind.Ellipsis 
            ? Engine.env<string>('ATKIT_PARAGRAPH_ELLIPSIS', '...') 
            : null
        }
      })
    }
  }

  
  protected maxScrollExtent: number = 0
  
  protected needsClipping: boolean = false
  protected overflowShader: Shader | null = null

  protected placeholderSpans: PlaceholderSpan[] = []
  protected placeholderDimensions: PlaceholderDimensions[] | null = null
  protected clipRectLayer: LayerRef<ClipRectLayer> = LayerRef.create<ClipRectLayer>()

  /**
   * 构造 Paragraph 对象
   * @param {AtLayoutParagraphProxy} proxy 
   * @param {TextAlign} textAlign 
   * @param {TextDirection} textDirection 
   * @param {boolean} softWrap 
   * @param {TextOverflow} overflow 
   * @param {number | null} textScaleFactor 
   * @param {number | null} maxLines 
   * @param {AtStrutStyle | null} strutStyle 
   * @param {TextWidthBasis} textWidthBasis 
   * @param {AtTextHeightBehavior} textHeightBehavior 
   * @param {AtLayoutBox} children 
   */
  constructor (
    proxy: ParagraphProxy, 
    scale: number = 1.0,
    viewport: ViewportOffset = ViewportOffset.ZERO,
    textAlign: Skia.TextAlign = Engine.skia.TextAlign.Start,
    textDirection: Skia.TextDirection = Engine.skia.TextDirection.LTR,
    softWrap: boolean = true,
    overflow: TextOverflowKind = TextOverflowKind.Clip,
    textScaleFactor: number = 1.0,
    maxLines: number | null = null,
    minLines: number | null = null,
    strutStyle: StrutStyle | null = null,
    textWidthBasis: TextWidthBasisKind = TextWidthBasisKind.Parent,
    textHeightBehavior: TextHeightBehavior | null = null,
    children: Box[] = [],
  ) {
    super(null, scale)

    this.painter = TextPainter.create({
      text: proxy.text,
      textAlign,
      textDirection,
      textScaleFactor,
      maxLines,
      ellipsis: overflow === TextOverflowKind.Ellipsis 
        ? Engine.env<string>('ATKIT_PARAGRAPH_ELLIPSIS', '...')
        : null,
      strutStyle,
      textWidthBasis,
      textHeightBehavior
    })
    
    this.proxy = proxy
    this.viewport = viewport

    this.softWrap = softWrap
    this.overflow = overflow

    this.minLines = minLines
    this.maxLines = maxLines

    for (const child of children) {
      this.append(child)
    }
    
    this.extractPlaceholderSpans(proxy.text)    
  }

  /**
   * 
   * @param {InlineSpan} span 
   */
  extractPlaceholderSpans (span: InlineSpan) {
    this.placeholderSpans = []
    span.visit((span: InlineSpan) => {
      if (span instanceof PlaceholderSpan) {
        this.placeholderSpans.push(span)
      }
      return true
    })
  }

  /**
   * 计算文本
   */
  computeTextMetricsIfNeeded () {
    invariant(this.constraints !== null, `The "Paragraph.constraints" cannot be null.`)
    const constraints = this.constraints as BoxConstraints

    this.layoutText(constraints.minWidth, constraints.maxWidth)
  }

  computeDistanceToActualBaseline (baseline: Skia.TextBaseline) {
    invariant(this.constraints !== null)
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    
    return this.painter.computeDistanceToActualBaseline(Engine.skia.TextBaseline.Alphabetic) as number
  }

  layoutText (minWidth: number = 0.0, maxWidth: number = Infinity) {
    const widthMatters = this.softWrap || this.overflow === TextOverflowKind.Ellipsis
    this.painter.layout(
      minWidth,
      widthMatters 
        ? maxWidth 
        : Infinity,
    )
  }

  layoutTextWithConstraints (constraints: BoxConstraints) {
    this.painter.placeholderDimensions = this.placeholderDimensions
    this.layoutText(constraints.minWidth, constraints.maxWidth)
  }

  layoutChildren (constraints: BoxConstraints, dry = false) {
    if (this.count === 0) {
      return []
    }

    let child: Box | null = this.firstChild as Box
    const placeholderDimensions = Array(this.count).fill(PlaceholderDimensions.empty())
    let childIndex = 0
    
    let boxConstraints = BoxConstraints.create({ maxWidth: constraints.maxWidth })
    boxConstraints = boxConstraints.divide(this.textScaleFactor)
    
    while (child !== null) {
      let baselineOffset: number | null = null
      let childSize: Size | null
      if (!dry) {
        child.layout(boxConstraints, true)
        childSize = child.size
        switch (this.placeholderSpans[childIndex].alignment) {
          case Engine.skia.PlaceholderAlignment.Baseline:
            baselineOffset = child.getDistanceToBaseline(
              this.placeholderSpans[childIndex].baseline!,
            )
            break;
          case Engine.skia.PlaceholderAlignment.AboveBaseline:
          case Engine.skia.PlaceholderAlignment.BelowBaseline:
          case Engine.skia.PlaceholderAlignment.Bottom:
          case Engine.skia.PlaceholderAlignment.Middle:
          case Engine.skia.PlaceholderAlignment.Top:
            baselineOffset = null
            break
        }
      } else {
        invariant(this.placeholderSpans[childIndex].alignment !== Engine.skia.PlaceholderAlignment.Baseline)
        childSize = child.getDryLayout(boxConstraints)
      }

      invariant(childSize)
      invariant(baselineOffset)

      placeholderDimensions[childIndex] = PlaceholderDimensions.create({
        size: childSize,
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
        baselineOffset,
      })
      
      child = this.after(child) as Box | null
      childIndex += 1
    }
    return placeholderDimensions;
  }

  canComputeDryLayout() {
    for (const span of this.placeholderSpans) {
      switch (span.alignment) {
        case Engine.skia.PlaceholderAlignment.Baseline:
        case Engine.skia.PlaceholderAlignment.AboveBaseline:
        case Engine.skia.PlaceholderAlignment.BelowBaseline:
          return false
        case Engine.skia.PlaceholderAlignment.Top:
        case Engine.skia.PlaceholderAlignment.Middle:
        case Engine.skia.PlaceholderAlignment.Bottom:
          continue
      }
    }

    return true
  }

  /**
   * 
   * @param {BoxConstraints} constraints 
   * @returns {Sizse}
   */
  computeDryLayout (constraints: BoxConstraints): Size {
    if (!this.canComputeDryLayout()) {
      return Size.ZERO

    }
    this.painter.placeholderDimensions = this.layoutChildren(constraints, true)
    this.layoutText(constraints.minWidth, constraints.maxWidth)
    return constraints.constrain(this.painter.size)
  }

  performLayout () {
    const constraints = this.constraints as BoxConstraints
    this.placeholderDimensions = this.layoutChildren(constraints)

    this.layoutTextWithConstraints(constraints)
    this.setup()

    const size = this.painter.size
    const textDidExceedMaxLines = this.painter.didExceedMaxLines
    this.size = constraints.constrain(size)

    const didOverflowHeight = this.size.height < size.height || textDidExceedMaxLines
    const didOverflowWidth = this.size.width < size.width
    
    const overflowed = didOverflowWidth || didOverflowHeight
    if (overflowed) {
      switch (this.overflow) {
        case TextOverflowKind.Visible:
          this.needsClipping = false
          this.overflowShader = null
          break
        case TextOverflowKind.Clip:
        case TextOverflowKind.Ellipsis:
          this.needsClipping = true
          this.overflowShader = null
          break
        case TextOverflowKind.Fade:
          invariant(this.textDirection !== null)

          this.needsClipping = true
          const fadeSizePainter = TextPainter.create({
            text: TextSpan.create({ 
              style: this.painter.text.style, 
              text: '\u2026'
            }),
            textDirection: this.textDirection,
            textScaleFactor: this.textScaleFactor
          })

          fadeSizePainter.layout()
          
          if (didOverflowWidth) {
            let fadeEnd, fadeStart;
            switch (this.textDirection) {
              case Engine.skia.TextDirection.RTL:
                fadeEnd = 0.0
                fadeStart = fadeSizePainter.width
                break
              case Engine.skia.TextDirection.LTR:
                fadeEnd = this.size.width
                fadeStart = fadeEnd - fadeSizePainter.width
                break
            }

            invariant(fadeStart)
            invariant(fadeEnd)

            this.overflowShader = Gradient.linear(
              new Offset(fadeStart, 0.0),
              new Offset(fadeEnd, 0.0),
              [new Color(0xFFFFFFFF), new Color(0x00FFFFFF)],
              [],
            )
          } else {
            let fadeEnd = this.size.height
            let fadeStart = fadeEnd - fadeSizePainter.height / 2.0
            this.overflowShader = Gradient.linear(
              new Offset(0.0, fadeStart),
              new Offset(0.0, fadeEnd),
              [new Color(0xFFFFFFFF), new Color(0x00FFFFFF)],
              []
            )
          }
          break
      }
    } else {
      this.needsClipping = false
      this.overflowShader = null
    }
  }

  setup () {
    let child: Box | null = this.firstChild as Box
    let childIndex = 0

    invariant(this.painter.inlinePlaceholderBoxes)
    
    while (
      child !== null && 
      childIndex < this.painter.inlinePlaceholderBoxes.length
    ) {
      child.offset = new Offset(
        this.painter.inlinePlaceholderBoxes[childIndex].left,
        this.painter.inlinePlaceholderBoxes[childIndex].top,
      )
      
      child.scale = this.painter.inlinePlaceholderScales![childIndex];
      child = this.after(child) as Box | null
      childIndex += 1
    }
  }

  hitTestSelf (position: Offset) {
    return true
  }

  /**
   * 
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns 
   */
  hitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ) {
    let hitText = false
    const textPosition = this.painter.getPositionForOffset(position)
    const span = this.painter.text.getSpanForPosition(textPosition)
    
    if (span !== null && span instanceof HitTestTarget) {
      result.add(new HitTestEntry(span as HitTestTarget))
      hitText = true
    }

    let child: Box | null = this.firstChild as Box
    let childIndex = 0

    while (child !== null && childIndex < this.painter.inlinePlaceholderBoxes!.length) {
      const transform = Matrix4.translationValues(
        child.offset.dx,
        child.offset.dy,
        0.0,
      )

      invariant(child.scale)

      transform.scale(
        child.scale,
        child.scale,
        child.scale,
      )

      const isHit = result.addWithPaintTransform(
        transform,
        position,
        (result: BoxHitTestResult, transformed: Offset) => {
          return child!.hitTest(result, transformed)
        }
      )

      if (isHit) {
        return true
      }

      child = this.after(child) as Box | null
      childIndex += 1
    }

    return hitText
  }

  /**
   * 
   * @param position 
   * @param caretPrototype 
   * @returns 
   */
  getOffsetForCaret (position: TextPosition, caretPrototype: Rect) {
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    return this.painter.getOffsetForCaret(position, caretPrototype)
  }

  getFullHeightForCaret (position: TextPosition): number | null {
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    return this.painter.getFullHeightForCaret(position, Rect.ZERO)
  }

  /**
   * 
   * @param {TextSelection} selection 
   * @param {RectHeightStyle} boxHeightStyle 
   * @param {RectWidthStyle} boxWidthStyle 
   * @returns {AtTextBox[]}
   */
  getBoxesForSelection (
    selection: TextSelection,
    boxHeightStyle: Skia.RectHeightStyle = Engine.skia.RectHeightStyle.Tight,
    boxWidthStyle: Skia.RectWidthStyle = Engine.skia.RectWidthStyle.Tight,
  ): TextBox[] {
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    return this.painter.getBoxesForSelection(
      selection,
      boxHeightStyle,
      boxWidthStyle,
    );
  }

  /**
   * 
   * @param {Offset} offset 
   * @returns {AtTextPosition}
   */
  getPositionForOffset (offset: Offset): TextPosition {
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    const target = this.globalToLocal(offset.subtract(this.paintAt))
    return this.painter.getPositionForOffset(target)
  }


  getWordBoundary (position: TextPosition): TextRange {
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    return this.painter.getWordBoundary(position)
  }

  snapToPhysicalPixel (sourceOffset: Offset): Offset {
    const globalOffset = this.localToGlobal(sourceOffset)
    const pixelMultiple = 1.0 / this.devicePixelRatio
    return new Offset(
      Number.isFinite(globalOffset.dx)
        ? Math.round((globalOffset.dx / pixelMultiple)) * pixelMultiple - globalOffset.dx
        : 0,
      Number.isFinite(globalOffset.dy)
        ? Math.round((globalOffset.dy / pixelMultiple)) * pixelMultiple - globalOffset.dy
        : 0,
      )
  }

  defaultPaint (context: PaintingContext, offset: Offset) {
    const effective = offset.add(this.paintAt)

    invariant(context.canvas)
    invariant(this.painter.inlinePlaceholderBoxes)

    this.painter.paint(context.canvas, effective)
    let child = this.firstChild as Box | null
    let childIndex = 0

    while (child !== null && childIndex < this.painter.inlinePlaceholderBoxes.length) {
      const scale = this.scale
      invariant(scale)
      context.pushTransform(
        this.needsCompositing,
        effective.add(this.offset),
        Matrix4.diagonal3Values(scale, scale, scale),
        (context: PaintingContext, offset: Offset) => {
          context.paintChild(child as Box, offset)
        },
      )
      child = this.after(child) as Box | null
      childIndex += 1
    }
  }

  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (
    context: PaintingContext, 
    offset: Offset
  ) {
    this.computeTextMetricsIfNeeded()

    invariant(context.canvas, 'The "PaintingContext.canvas" cannot be null.')
    invariant(this.size, 'The "Paragraph.size" cannot be null.')

    if (this.overflowed && this.clipBehavior !== Engine.skia.Clip.None) {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        this.offset,
        Offset.ZERO.and(this.size),
        () => this.defaultPaint(context, offset),
        this.clipBehavior,
        this.clipRectLayer.layer,
      )
    } else {
      this.clipRectLayer.layer = null
      this.defaultPaint(context, offset)
    }
  }
}