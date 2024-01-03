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
import { PipelineOwner } from './pipeline-owner'
import { BoxConstraints } from './constraints'
import { PaintingContext } from './painting-context'
import { ParagraphDelegate } from './paragraph-delegate'
import { 
  ParagraphCaretPainter, 
  ParagraphCompositePainter, 
  ParagraphHighlightPainter, 
  ParagraphPainter 
} from './paragraph-painter'

/// =>
export enum SelectionChangedCauseKind {
  Tap,
  DoubleTap,
  LongPress,
  ForcePress,
  Keyboard,
  Toolbar,
  Drag,
}

//// => ParagraphPaint
// 画笔
export class ParagraphPaint extends Box {
  /**
   * 
   * @param {ParagraphPainter} painter 
   * @returns {ParagraphPainter}
   */
  static create (painter: ParagraphPainter) {
    return new ParagraphPaint(painter)
  }

  // => isRepaintBoundary
  public isRepaintBoundary = true
    
  // => sizedByParent
  public sizedByParent = true
    
  // => painter
  protected _painter: ParagraphPainter | null = null
  public get painter (): ParagraphPainter | null {
    invariant(this._painter !== null, 'The "ParagraphPainter.painter" cannot be null.')
    return this._painter
  }
  public set painter (painter: ParagraphPainter | null ) {
    if (painter !== this._painter) {
      if (painter?.shouldRepaint(this._painter) ?? true) {
        this.markNeedsPaint()
      }

      if (this.attached) {
        this._painter?.unsubscribe()
        painter?.subscribe(() => this.markNeedsPaint())
      }

      this._painter = painter
    }
  }
  
  constructor (painter: ParagraphPainter) {
    super()
    this.painter = painter
  } 

  paint (context: PaintingContext, offset: Offset) {
    const parent = this.parent as Paragraph
    invariant(parent !== null)
    invariant(this.size !== null)
    invariant(context.canvas)

    const painter = this.painter
    if (painter !== null && parent !== null) {
      parent.computeTextMetricsIfNeeded()
      painter.paint(context.canvas, this.size, parent)
    }
  }

  computeDryLayout (constraints: BoxConstraints): Size {
    return constraints.biggest
  }

  attach (owner: PipelineOwner) {
    super.attach(owner)
    this.painter?.subscribe(() => this.markNeedsPaint())
  }
  
  detach () {
    this.painter?.unsubscribe()
    super.detach()
  }
}

//// => Paragraph
export interface ParagraphOptions {
  delegate: ParagraphDelegate, 
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
   * 
   * @param options 
   * @returns 
   */
  static create(options: ParagraphOptions) {
    return new Paragraph(
      options.delegate,
      options.scale,
      options.viewport,
      options.paintCaretAboveText,
      options.editable,
      options.selectable,
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
      options.caret,
      options.highlighter,
      options.children,
    ) as Paragraph
  }

  // => delegate
  protected _delegate: ParagraphDelegate | null = null
  public get delegate () {
    invariant(this._delegate, 'The "Paragraph.delegate" cannot be null.')
    return this._delegate
  }
  public set delegate (value: ParagraphDelegate) {
    if (this._delegate === null || this._delegate !== value) {
      if (this._delegate) {
        this._delegate.unsubscribe()
      }

      this._delegate = value
      this._delegate?.subscribe(() => this.markNeedsLayout())
      this.markNeedsLayout()
    }
  }

  // => selection
  // 选择区间
  public get selection () {
    return this.delegate.selection
  }
  public set selection (value: TextSelection) {
    if (this.selection.notEqual(value)) {
      if (this.selectable) {
        invariant(this.highlighter)
        this.highlighter.range = value
      }

      this.caret?.start()
      this.delegate.selection = value
    }
  }
  
  // => softWrap
  // 软换行
  protected _softWrap: boolean = true
  public get softWrap () {
    invariant(this._softWrap, 'The "Paragraph.softWrap" cannot be null.')
    return this._softWrap
  }
  public set softWrap (value: boolean) {
    if (this._softWrap === null || this._softWrap !== value) {
      this._softWrap = value
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
  public set overflow (value: TextOverflowKind) {
    if (this._overflow === null || this._overflow !== value) {
      this._overflow = value
      
      tryCatch(() => {
        this.painter.ellipsis = value == TextOverflowKind.Ellipsis 
          ? Engine.env('ATKIT_PARAGRAPH_ELLIPSIS', '...') 
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
      case Skia.RenderComparisonKind.Identical:
      case Skia.RenderComparisonKind.Metadata:
        return
      case Skia.RenderComparisonKind.Paint:
        this.painter.text = value
        this.extractPlaceholderSpans(value)
        this.markNeedsPaint()
        break
      case Skia.RenderComparisonKind.Layout:
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
  public get viewportAxis (): Skia.AxisKind {
    return this.isMultiline 
      ? Engine.skia.AxisKind.Vertical 
      : Engine.skia.AxisKind.Horizontal
  }

  // => paintAt
  public get paintAt (): Offset {
    invariant(this.viewport)
    switch (this.viewportAxis) {
      case Engine.skia.AxisKind.Horizontal:
        return new Offset(-this.viewport.pixels, 0.0)
      case Engine.skia.AxisKind.Vertical:
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
  public get devicePixelRatio (): number {
    return this.owner?.configuration.devicePixelRatio ?? 2.0
  }

  // => clipBehavior
  protected _clipBehavior: Skia.ClipKind = Skia.ClipKind.HardEdge
  public get clipBehavior (): Skia.ClipKind {
    return this._clipBehavior
  }
  public set clipBehavior (value: Skia.ClipKind) {
    if (this._clipBehavior === null || value !== this._clipBehavior) {
      this._clipBehavior = value
      this.markNeedsPaint()
    }
  }

  // => hasVisualOverflow
  protected get hasVisualOverflow () {
    return this.maxScrollExtent > 0 || this.paintAt.notEqual(Offset.ZERO)
  }

  // => paintCursorAboveText
  protected _paintCaretAboveText: boolean = false
  public get paintCursorAboveText (): boolean {
    return this._paintCaretAboveText
  }
  public set paintCaretAboveText (value: boolean) {
    if (this._paintCaretAboveText !== value) {
      this._paintCaretAboveText = value
      this._cachedBuiltInForegroundPainters = null
      this._cachedBuiltInPainters = null
      
      this.updateForegroundPainter()
      this.updateBackgroundPainter()
    }   
  }

  // => caret
  // 光标画笔
  protected _caret: ParagraphCaretPainter | null = null
  public get caret (): ParagraphCaretPainter | null {
    return this._caret
  }
  public set caret (caret: ParagraphCaretPainter | null) {
    if (this._caret === null || this._caret !== caret) {
      if (this._caret) {
        this._caret.unsubscribe()
      }

      this._caret = caret
      this._caret?.subscribe(() => this.markNeedsPaint())
    }
  }

  // => highlighter
  // 高亮画笔
  protected _highlighter: ParagraphHighlightPainter | null = null
  public get highlighter (): ParagraphHighlightPainter | null {
    return this._highlighter
  }
  public set highlighter (highlighter: ParagraphHighlightPainter | null) {
    if (this._highlighter === null || this._highlighter !== highlighter) {
      if (this._highlighter) {
        this._highlighter.unsubscribe()
      }

      this._highlighter = highlighter
      this._highlighter?.subscribe(() => this.markNeedsPaint())
    }
  }

  // => builtInForegroundPainters
  // 前景画笔
  protected _cachedBuiltInForegroundPainters: ParagraphCompositePainter | null = null
  protected get builtInForegroundPainters () {
    return this._cachedBuiltInForegroundPainters ??= this.createBuiltInForegroundPainters()
  } 
  protected createBuiltInForegroundPainters (): ParagraphCompositePainter {
    const painters: ParagraphPainter[] = []

    if (this.paintCursorAboveText) {
      if (this.editable) {
        invariant(this.caret, 'The "Paragraph.caret" cannot be null.')
        painters.push(this.caret)
      }
    }

    return ParagraphCompositePainter.create(painters)
  }

  // => builtInPainters
  protected _cachedBuiltInPainters: ParagraphCompositePainter | null = null
  protected get builtInPainters () {
    return this._cachedBuiltInPainters ??= this.createBuiltInPainters()
  } 
  protected createBuiltInPainters (): ParagraphCompositePainter{
    const painters: ParagraphPainter[] = []
    if (this.selectable) {
      invariant(this.highlighter)
      painters.push(this.highlighter)
      
      if (this.paintCursorAboveText) {
        if (this.editable) {
          invariant(this.caret)
          painters.push(this.caret)
        }
      }
    }

    return ParagraphCompositePainter.create(painters)
  }

  // => ediable
  protected _editable: boolean = false
  protected get editable () {
    return this._editable
  } 
  protected set editable (value: boolean) {
    if (this._editable !== value) {
      invariant(this.caret !== null, `The "Paragraph.caret" cannot be null.`)
      this._editable = value
      if (value) {
        this.selectable = true
      }
    }
  }

  // => painter
  protected _painter: TextPainter | null = null
  public get painter () {
    invariant(this._painter !== null, 'The "Paragraph.painter" cannot be null.')
    return this._painter
  } 
  public set painter (painter: TextPainter) {
    if (this._painter === null || this._painter !== painter) {
      this._painter = painter
      tryCatch(() => {
        if (painter) {
          painter.ellipsis = this.overflow === TextOverflowKind.Ellipsis 
            ? Engine.env('ATKIT_PARAGRAPH_ELLIPSIS', '...') 
            : null
        }
      })
    }
  }

  // => selectable
  protected _selectable: boolean = false
  protected get selectable () {
    return this._selectable
  } 
  protected set selectable (selectable: boolean) {
    if (this._selectable !== selectable) {
      invariant(this.highlighter !== null, `The "Paragraph.highlighter" cannot be null.`)
      this._selectable = selectable
    }
  }

  protected maxScrollExtent: number = 0
  
  protected needsClipping: boolean = false
  protected overflowShader: Shader | null = null

  protected placeholderSpans: PlaceholderSpan[] = []
  protected placeholderDimensions: PlaceholderDimensions[] | null = null
  protected clipRectLayer: LayerRef<ClipRectLayer> = LayerRef.create<ClipRectLayer>()

  protected foregroundLayout: ParagraphPaint | null = null
  protected backgroundLayout: ParagraphPaint | null = null
  
  /**
   * 构造 Paragraph 对象
   * @param {AtLayoutParagraphDelegate} delegate 
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
    delegate: ParagraphDelegate, 
    scale: number = 1.0,
    viewport: ViewportOffset = ViewportOffset.ZERO,
    paintCaretAboveText: boolean = true,
    editable: boolean = false,
    selectable: boolean = false,
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
    caret: ParagraphCaretPainter | null = null,
    highlighter: ParagraphHighlightPainter | null = null,
    children: Box[] = [],
  ) {
    super(
      null,
      scale,
    )

    this.painter = TextPainter.create({
      text: delegate.text,
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
    
    this.delegate = delegate
    this.viewport = viewport
    this.paintCaretAboveText = paintCaretAboveText

    this.softWrap = softWrap
    this.overflow = overflow

    this.minLines = minLines
    this.maxLines = maxLines

    this.caret = caret
    this.highlighter = highlighter

    
    this.caret?.subscribe(() => {
      this.markNeedsPaint()
    })

    this.highlighter?.subscribe(() => {
      this.markNeedsPaint()
    })

    this.selectable = selectable ?? !!highlighter ?? !!caret
    this.editable = editable ?? !!caret

    this.updateForegroundPainter()
    this.updateBackgroundPainter()

    for (const child of children) {
      this.append(child)
    }
    
    this.extractPlaceholderSpans(delegate.text)    
  }

  protected handleHover = (details?: any): void => {
    // Engine.activateSystemCursor(this.cursor)
  }

  protected updateForegroundPainter () {
    const painter = this.builtInForegroundPainters

    if (this.foregroundLayout === null) {
      const foregroundLayout = ParagraphPaint.create(painter)
      this.adoptChild(foregroundLayout)
      this.foregroundLayout = foregroundLayout
    } else {
      invariant(this.foregroundLayout)
      this.foregroundLayout.painter = painter
    }
  }

  protected updateBackgroundPainter () {
    const painter = this.builtInPainters

    if (this.backgroundLayout === null) {
      const backgroundLayout = ParagraphPaint.create(painter)
      this.adoptChild(backgroundLayout)
      this.backgroundLayout = backgroundLayout
    } else {
      this.backgroundLayout.painter = painter
    }
  }

  markNeedsPaint () {
    super.markNeedsPaint()
    
    this.foregroundLayout?.markNeedsPaint()
    this.backgroundLayout?.markNeedsPaint()
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

  selectPosition (cause: SelectionChangedCauseKind) {
    // invariant(this.lastTapDownDetail)
    // this.selectPositionAt(this.lastTapDownDetail.globalPosition, null, cause)
  }
  
  selectPositionAt (from: Offset, to: Offset | null, cause: SelectionChangedCauseKind) {
    invariant(this.constraints, 'The "Paragraph.constraints" cannot be null, when selecting text.')
    const constraints = this.constraints as BoxConstraints

    this.layoutText(constraints.minWidth, constraints.maxWidth)
    
    const fromPosition = this.painter.getPositionForOffset(this.globalToLocal(from.subtract(this.paintAt)))
    const toPosition = to === null
      ? null
      : this.painter.getPositionForOffset(this.globalToLocal(to.subtract(this.paintAt)))

    const baseOffset = fromPosition.offset
    const extentOffset = toPosition?.offset ?? fromPosition.offset

    const selection = TextSelection.create({
      baseOffset: baseOffset,
      extentOffset: extentOffset,
      affinity: fromPosition.affinity,
    })

    this.selection = selection
  }

  computeTextMetricsIfNeeded () {
    invariant(this.constraints !== null, `The "Paragraph.constraints" cannot be null.`)
    const constraints = this.constraints as BoxConstraints

    this.layoutText(constraints.minWidth, constraints.maxWidth)
  }

  /**
   * 最小固定宽度
   * @param {number} height 
   * @returns {number}
   */
  computeMinIntrinsicWidth (height: number) {
    if (!this.canComputeIntrinsics()) {
      return 0.0
    }

    this.computeChildrenWidthWithMinIntrinsics(height)
    this.layoutText()
    
    return this.painter.minIntrinsicWidth
  }
  
  /**
   * 最大固定宽度
   * @param {number} height 
   * @returns {number}
   */
  computeMaxIntrinsicWidth (height: number) {
    if (!this.canComputeIntrinsics()) {
      return 0.0
    }
    this.computeChildrenWidthWithMaxIntrinsics(height)
    this.layoutText()
    return this.painter.maxIntrinsicWidth
  }

  /**
   * 计算固定高度
   * @param {number} height 
   * @returns {number}
   */
  computeIntrinsicHeight (height: number) {
    if (!this.canComputeIntrinsics()) {
      return 0.0;
    }
    this.computeChildrenHeightWithMinIntrinsics(height)
    this.layoutText(height, height)
    return this.painter.height
  }

  /**
   * 计算最小高度
   * @param {number} height 
   * @returns 
   */
  computeMinIntrinsicHeight (width: number) {
    return this.computeIntrinsicHeight(width)
  }

  /**
   * 
   * @param {number} width 
   * @returns {number}
   */
  computeMaxIntrinsicHeight (width: number) {
    return this.computeIntrinsicHeight(width)
  }

  computeDistanceToActualBaseline (baseline: Skia.TextBaseline) {
    invariant(this.constraints !== null)
    this.layoutTextWithConstraints(this.constraints as BoxConstraints)
    
    return this.painter.computeDistanceToActualBaseline(Engine.skia.TextBaseline.Alphabetic) as number
  }

  /**
   * 
   * @returns {boolean}
   */
  canComputeIntrinsics () {
    for (const span of this.placeholderSpans) {
      switch (span.alignment) {
        case Engine.skia.PlaceholderAlignment.Baseline:
        case Engine.skia.PlaceholderAlignment.AboveBaseline:
        case Engine.skia.PlaceholderAlignment.BelowBaseline: {
          return false
        }
        case Engine.skia.PlaceholderAlignment.Top:
        case Engine.skia.PlaceholderAlignment.Middle:
        case Engine.skia.PlaceholderAlignment.Bottom: {
          continue
        }
      }
    }

    return true
  }

  /**
   * 
   * @param {number} height 
   */
  computeChildrenWidthWithMaxIntrinsics (height: number) {
    let child: Box | null = this.firstChild as Box
    const placeholderDimensions = Array(this.count).fill(PlaceholderDimensions.EMPTY)
    let childIndex = 0

    while (child !== null) {
      placeholderDimensions[childIndex] = PlaceholderDimensions.create({
        size: new Size(child.getMaxIntrinsicWidth(Infinity), 0.0),
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
      })

      child = this.after(child) as Box | null
      childIndex += 1
    }
    this.painter.placeholderDimensions = placeholderDimensions
  }

  computeChildrenWidthWithMinIntrinsics (height: number) {
    const placeholderDimensions = Array(this.count).fill(PlaceholderDimensions.EMPTY)
    let child: Box | null = this.firstChild as Box
    let childIndex = 0
    
    while (child !== null) {
      placeholderDimensions[childIndex] = PlaceholderDimensions.create({
        size: new Size(child.getMinIntrinsicWidth(Infinity), 0.0),
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
      })

      child = this.after(child) as Box | null
      childIndex += 1
    }

    this.painter.placeholderDimensions = placeholderDimensions
  }

  computeChildrenHeightWithMinIntrinsics (width: number) {
    let child: Box | null = this.firstChild as Box
    const placeholderDimensions = Array(this.count).fill(PlaceholderDimensions.EMPTY)
    let childIndex = 0
    
    width = width / this.textScaleFactor
    
    while (child !== null) {
      const size = child.getDryLayout(BoxConstraints.create({ maxWidth: width }))
      
      placeholderDimensions[childIndex] = PlaceholderDimensions.create({
        size,
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
      })

      child = this.after(child) as Box | null
      childIndex += 1
    }

    this.painter.placeholderDimensions = placeholderDimensions
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
    const placeholderDimensions = Array(this.count).fill(PlaceholderDimensions.EMPTY)
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

    const contentSize = new Size(size.width + Engine.env('ATKIT_PARAGRAPH_CARET_GAP', 1), size.height)
    const painterConstraints = BoxConstraints.tight(contentSize)

    this.foregroundLayout?.layout(painterConstraints)
    this.backgroundLayout?.layout(painterConstraints)
    
    const hasVisualOverflow = didOverflowWidth || didOverflowHeight
    if (hasVisualOverflow) {
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

  hitTestChildren (result: BoxHitTestResult, position: Offset) {
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
    return this.painter.getPositionForOffset(offset)
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

  paintContents (context: PaintingContext, offset: Offset) {
    const effective = offset.add(this.paintAt)

    const backgroundChild = this.backgroundLayout
    if (backgroundChild !== null) {
      context.paintChild(backgroundChild, offset)
    }

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

    const foregroundChild = this.foregroundLayout
    if (foregroundChild !== null) {
      context.paintChild(foregroundChild, offset)
    }
  }

  /**
   * 
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    this.computeTextMetricsIfNeeded()

    invariant(context.canvas)
    invariant(this.size)

    if (this.hasVisualOverflow && this.clipBehavior !== Engine.skia.ClipKind.None) {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        this.offset,
        Offset.ZERO.and(this.size),
        () => this.paintContents(context, offset),
        this.clipBehavior,
        this.clipRectLayer.layer,
      )
    } else {
      this.clipRectLayer.layer = null
      this.paintContents(context, offset)
    }
  }

  attach (owner: PipelineOwner) {
    super.attach(owner)
    this.foregroundLayout?.attach(owner)
    this.backgroundLayout?.attach(owner)

    if (this.selectable) {
      // this.onHover = this.handleHover
      // this.onTapDown = this.handleTapDown
      // this.onTap = this.handleTap
      // this.onPanStart = this.handleDragSelectionStart
      // this.onPanUpdate = this.handleDragSelectionUpdateThrottle
      // this.onPanEnd = this.handleDragEnd
    }
  }

  
  detach () {
    super.detach()
    
    // this.onTapDown = null
    // this.onTap = null
    // this.onPanStart = null
    // this.onPanUpdate = null
    // this.onPanEnd = null

    this.foregroundLayout?.detach()
    this.backgroundLayout?.detach()
  }
}