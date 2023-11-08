import { invariant } from '@at/utils'
import { At, Axis, RenderComparison } from '../at'
import { AtClipRectLayer, AtLayerHandle } from '../engine/layer'
import { AtViewportOffset } from './viewport-offset'
import { AtInlineSpan } from '../painting/inline-span'
import { Offset, Rect, Size } from '../basic/geometry'
import { Matrix4 } from '../basic/matrix4'
import { AtShader } from '../engine/shader'
import { AtPaintingContext } from './painting-context'
import { AtPipelineOwner } from './pipeline-owner'
import { AtGradient } from '../painting/gradient'
import { Color } from '../basic/color'
import { AtTextSpan } from '../painting/text-span'
import { AtHitTestEntry, AtHitTestTarget } from '../gestures/hit-test'
import { 
  AtBoxHitTestResult, 
  AtLayoutBox 
} from './box'
import { 
  AtTextPainter, 
  TextOverflow, 
  TextWidthBasis, 
  AtPlaceholderDimensions, 
} from '../painting/text-painter'
import { 
  Clip,
  RectHeightStyle, 
  RectWidthStyle, 
  TextAlign, 
  TextBaseline, 
  TextDirection, 
} from '../engine/skia'
import { 
  AtPlaceholderSpan, 
  AtStrutStyle, 
  AtTextBox, 
  AtTextHeightBehavior, 
  AtTextPosition, 
  AtTextRange, 
  AtTextSelection 
} from '../engine/text'
import { 
  AtParagraphCaretPainter, 
  AtParagraphCompositePainter, 
  AtParagraphHighlightPainter, 
  AtParagraphPainter 
} from './paragraph-painter'
import { AtMouseRegion } from './mouse'
import { TapDetails } from '../gestures/tap'
import { DragDetails } from '../gestures/drag'
import { AtBoxConstraints } from './box-constraints'
import { AtLayoutParagraphPaint } from './paragraph-paint'
import { Timer } from '../basic/timer'

import type { AtLayoutParagraphDelegate } from './paragraph-delegate'


export enum SelectionChangedCause {
  Tap,
  DoubleTap,
  LongPress,
  ForcePress,
  Keyboard,
  Toolbar,
  Drag,
}


export type AtLayoutParagraphOptions = {
  delegate: AtLayoutParagraphDelegate, 
  viewport: AtViewportOffset,
  devicePixelRatio?: number,
  paintCaretAboveText?: boolean,
  editable?: boolean,
  selectable?: boolean,
  textAlign?: TextAlign
  textDirection: TextDirection,
  softWrap?: boolean,
  overflow?: TextOverflow,
  textScaleFactor?: number,
  maxLines?: number,
  minLines?: number,
  strutStyle?: AtStrutStyle,
  textWidthBasis?: TextWidthBasis,
  textHeightBehavior: AtTextHeightBehavior,
  caret?: AtParagraphCaretPainter,
  highlighter?: AtParagraphHighlightPainter
  children?: AtLayoutBox[],
}

export class AtLayoutParagraph extends AtMouseRegion {
  /**
   * 
   * @param options 
   * @returns 
   */
  static create(options: AtLayoutParagraphOptions) {
    return new AtLayoutParagraph(
      options.delegate,
      options.devicePixelRatio,
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
    )
  }

  // => delegate
  private _delegate: AtLayoutParagraphDelegate
  public get delegate () {
    return this._delegate
  }
  public set delegate (value: AtLayoutParagraphDelegate) {
    invariant(value !== null)
    if (this._delegate !== value) {
      if (this._delegate) {
        this._delegate.unsubscribe()
      }

      this._delegate = value
      this.markNeedsLayout()
      this._delegate.subscribe(() => this.markNeedsLayout())
    }
  }

  // => selection
  public get selection () {
    return this.delegate.selection
  }
  public set selection (value: AtTextSelection) {
    invariant(value !== null)
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
  private _softWrap: boolean
  public get softWrap () {
    return this._softWrap
  }
  public set softWrap (value: boolean) {
    invariant(value !== null)
    if (this._softWrap !== value) {
      this._softWrap = value
      this.markNeedsLayout()
    }
  }

  // => overflow
  private _overflow: TextOverflow
  public get overflow (): TextOverflow {
    return this._overflow
  }
  public set overflow (value: TextOverflow ) {
    invariant(value !== null)
    if (this._overflow !== value) {
      this._overflow = value
      this.painter.ellipsis = value == TextOverflow.Ellipsis ? At.kEllipsis : null;
      this.markNeedsLayout()
    }
  }

  // => text
  public get text (): AtInlineSpan {
    return this.painter.text
  } 
  public set text (value: AtInlineSpan) {
    invariant(value !== null)
    switch (this.painter.text.compareTo(value)) {
      case RenderComparison.Identical:
      case RenderComparison.Metadata:
        return;
      case RenderComparison.Paint:
        this.painter.text = value
        this.extractPlaceholderSpans(value)
        this.markNeedsPaint()
        break;
      case RenderComparison.Layout:
        this.painter.text = value
        this.overflowShader = null
        this.extractPlaceholderSpans(value)
        this.markNeedsLayout()
        break;
    }
  }

  // => textAlign
  public get textAlign (): TextAlign {
    return this.painter.textAlign
  }
  public set textAlign (value: TextAlign) {
    invariant(value !== null)
    if (this.painter.textAlign !== value) {
      this.painter.textAlign = value
      this.markNeedsPaint()
    }
  }

  // => textDirection
  public get textDirection (): TextDirection {
    return this.painter.textDirection
  }
  public set textDirection (value: TextDirection) {
    invariant(value !== null)

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
    invariant(value !== null)
    if (this.painter.textScaleFactor !== value) {
      this.painter.textScaleFactor = value
      // _overflowShader = null;
      this.markNeedsLayout()
    }
      
  }

  // => maxLines
  private _maxLines: number | null
  public get maxLines (): number | null {
    return this.painter.maxLines
  }
  public set maxLines (value: number | null) {
    invariant(value === null || value > 0)

    if (this.painter.maxLines !== value) {
      this.painter.maxLines = value
      this.overflowShader = null
      this.markNeedsLayout()
    }
  }

  // => minLines
  private _minLines: number | null 
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
  public get strutStyle (): AtStrutStyle | null {
    return this.painter.strutStyle
  }
  public set strutStyle (value: AtStrutStyle | null) {
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
  public set textWidthBasis (value: TextWidthBasis) {
    invariant(value !== null)

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
  public set textHeightBehavior (value: AtTextHeightBehavior | null) {
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
  public get viewportAxis (): Axis {
    return this.isMultiline ? Axis.Vertical : Axis.Horizontal
  }

  // => paintAt
  public get paintAt (): Offset {
    invariant(this.viewport)
    switch (this.viewportAxis) {
      case Axis.Horizontal:
        return new Offset(-this.viewport.pixels, 0.0)
      case Axis.Vertical:
        return new Offset(0.0, -this.viewport.pixels)
    }
  }

  // => viewport
  private _viewport: AtViewportOffset
  public get viewport (): AtViewportOffset {
    return this._viewport
  }
  public set viewport (value: AtViewportOffset) {
    invariant(value !== null)
    if (this._viewport !== value) {
      this._viewport = value
      this.markNeedsLayout()
    }
  }

  // => devicePixelRatio
  private _devicePixelRatio: number
  public get devicePixelRatio (): number {
    return this._devicePixelRatio
  }
  public set devicePixelRatio (value: number) {
    if (devicePixelRatio !== value) {
      this._devicePixelRatio = value
      this.markNeedsLayout()
    }
  }

  // => clipBehavior
  private _clipBehavior = Clip.HardEdge
  public get clipBehavior (): Clip {
    return this._clipBehavior
  }
  public set clipBehavior (value: Clip) {
    invariant(value !== null)
    if (value !== this._clipBehavior) {
      this._clipBehavior = value
      this.markNeedsPaint()
    }
  }

  // => hasVisualOverflow
  private get hasVisualOverflow () {
    return this.maxScrollExtent > 0 || this.paintAt.notEqual(Offset.zero)
  }

  // => paintCursorAboveText
  private _paintCaretAboveText: boolean
  public get paintCursorAboveText (): boolean {
    return this._paintCaretAboveText
  }
  public set paintCursorAboveText (value: boolean) {
    if (this._paintCaretAboveText !== value) {
      this._paintCaretAboveText = value
      this._cachedBuiltInForegroundPainters = null
      this._cachedBuiltInPainters = null
      
      this.updateForegroundPainter()
      this.updateBackgroundPainter()
    }   
  }

  // => caret
  private _caret: AtParagraphCaretPainter | null
  public get caret (): AtParagraphCaretPainter | null {
    return this._caret
  }
  public set caret (caret: AtParagraphCaretPainter | null) {
    invariant(caret !== null)
    if (this._caret !== caret) {
      if (this._caret) {
        this._caret.unsubscribe()
      }

      this._caret = caret
      this._caret.subscribe(() => this.markNeedsPaint())
    }
  }

  // => highlighter
  private _highlighter: AtParagraphHighlightPainter | null
  public get highlighter (): AtParagraphHighlightPainter | null {
    return this._highlighter
  }
  public set highlighter (highlighter: AtParagraphHighlightPainter | null) {
    invariant(highlighter !== null)
    if (this._highlighter !== highlighter) {
      if (this._highlighter) {
        this._highlighter.unsubscribe()
      }

      this._highlighter = highlighter
      this._highlighter.subscribe(() => this.markNeedsPaint())
    }
  }

  // => builtInForegroundPainters
  private _cachedBuiltInForegroundPainters: AtParagraphCompositePainter | null = null
  private get builtInForegroundPainters () {
    return this._cachedBuiltInForegroundPainters ??= this.createBuiltInForegroundPainters()
  } 
  private createBuiltInForegroundPainters (): AtParagraphCompositePainter {
    const painters: AtParagraphPainter[] = []

    if (this.paintCursorAboveText) {
      if (this.editable) {
        invariant(this.caret)
        painters.push(this.caret)
      }
    }

    return AtParagraphCompositePainter.create(painters)
  }

  // => builtInPainters
  private _cachedBuiltInPainters: AtParagraphCompositePainter | null = null
  private get builtInPainters () {
    return this._cachedBuiltInPainters ??= this.createBuiltInPainters()
  } 
  private createBuiltInPainters (): AtParagraphCompositePainter{
    const painters: AtParagraphPainter[] = []
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

    return AtParagraphCompositePainter.create(painters)
  }

  // => ediable
  private _editable: boolean = false
  private get editable () {
    return this._editable
  } 
  private set editable (editable: boolean) {
    if (this._editable !== editable) {
      invariant(this.caret !== null, `The "this.caret" cannot be null.`)
      this._editable = editable
      if (editable) {
        this.selectable = true
      }
    }
  }

  // => selectable
  private _selectable: boolean = false
  private get selectable () {
    return this._selectable
  } 
  private set selectable (selectable: boolean) {
    if (this._selectable !== selectable) {
      invariant(this.highlighter !== null, `The "this.highlighter" cannot be null.`)
      this._selectable = selectable
    }
  }

  // public left: number | null = null
  // public top: number | null = null
  // public right: number | null = null
  // public bottom: number | null = null
  // public height: number | null = null
  // public width: number | null = null
  // public scale: number | null = null
  // public size: Size | null = null

  public  painter: AtTextPainter

  private maxScrollExtent: number = 0
  private needsClipping: boolean = false
  private overflowShader: AtShader | null = null
  private placeholderSpans: AtPlaceholderSpan[] = []
  private placeholderDimensions: AtPlaceholderDimensions[] | null = null
  private clipRectLayer: AtLayerHandle<AtClipRectLayer> = AtLayerHandle.create<AtClipRectLayer>()

  private foregroundLayout: AtLayoutParagraphPaint | null = null
  private backgroundLayout: AtLayoutParagraphPaint | null = null
  

  private lastTapDownDetail: TapDetails | null = null 
  private dragStartDetails: DragDetails | null = null
  private dragUpdateDetails: DragDetails | null = null
  private dragStartSelection: AtTextSelection | null = null
  private dragStartViewport: number = 0.0

  private dragUpdateThrottleTimer: Timer | null = null
  
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
    delegate: AtLayoutParagraphDelegate, 
    devicePixelRatio: number = 2.0,
    viewport: AtViewportOffset = AtViewportOffset.zero,
    paintCaretAboveText: boolean = true,
    editable: boolean = false,
    selectable: boolean = false,
    textAlign: TextAlign = At.TextAlign.Start,
    textDirection: TextDirection = At.TextDirection.LTR,
    softWrap: boolean = true,
    overflow: TextOverflow = TextOverflow.Clip,
    textScaleFactor: number = 1.0,
    maxLines: number | null = null,
    minLines: number | null = null,
    strutStyle: AtStrutStyle | null = null,
    textWidthBasis: TextWidthBasis = TextWidthBasis.Parent,
    textHeightBehavior: AtTextHeightBehavior,
    caret: AtParagraphCaretPainter | null = null,
    highlighter: AtParagraphHighlightPainter | null = null,
    children: AtLayoutBox[] = [],
  ) {
    super()

    
    this._delegate = delegate
    this._viewport = viewport
    this._devicePixelRatio = devicePixelRatio
    this._paintCaretAboveText = paintCaretAboveText

    this._softWrap = softWrap
    this._overflow = overflow

    this._minLines = minLines
    this._maxLines = maxLines

    this._caret = caret
    this._highlighter = highlighter

    

    this._caret?.subscribe(() => {
      this.markNeedsPaint()
    })

    this._highlighter?.subscribe(() => {
      this.markNeedsPaint()
    })

    this.cursor = 'text'

    this.selectable = selectable ?? !!highlighter ?? !!caret
    this.editable = editable ?? !!caret
    
    this.painter = AtTextPainter.create({
      text: delegate.text,
      textAlign,
      textDirection,
      textScaleFactor,
      maxLines,
      ellipsis: overflow === TextOverflow.Ellipsis 
        ? At.kEllipsis 
        : null,
      strutStyle,
      textWidthBasis,
      textHeightBehavior
    })

    this.updateForegroundPainter()
    this.updateBackgroundPainter()

    for (const child of children) {
      this.append(child)
    }
    
    this.extractPlaceholderSpans(delegate.text)    
  }

  private handleHover = (details?: any): void => {
    At.getApplication().activateSystemCursor(this.cursor)
  }

  private updateForegroundPainter () {
    const painter = this.builtInForegroundPainters

    if (this.foregroundLayout === null) {
      const foregroundLayout = AtLayoutParagraphPaint.create(painter)
      this.adoptChild(foregroundLayout)
      this.foregroundLayout = foregroundLayout
    } else {
      invariant(this.foregroundLayout)
      this.foregroundLayout.painter = painter
    }
  }

  private updateBackgroundPainter () {
    const painter = this.builtInPainters

    if (this.backgroundLayout === null) {
      const backgroundLayout = AtLayoutParagraphPaint.create(painter)
      this.adoptChild(backgroundLayout)
      this.backgroundLayout = backgroundLayout
    } else {
      this.backgroundLayout.painter = painter
    }
  }


  handleTapDown = (details?: TapDetails): void => {
    invariant(details)
    this.lastTapDownDetail = details
    this.selectPosition(SelectionChangedCause.Tap)
  }

  handleTap = () => {
    this.selectPosition(SelectionChangedCause.Tap)
  }

  handleDragSelectionStart = (details?: DragDetails) => {
    if (!this.attached) {
      return
    }
    invariant(details)
    
    this.dragStartDetails = details
    this.dragStartSelection = this.selection
    this.dragStartViewport = this.viewport.pixels

    invariant(details.globalPosition)
    this.selectPositionAt(
      details.globalPosition,
      null,
      SelectionChangedCause.Drag,
    )
    // }
  }

  handleDragSelectionUpdate = (detail: DragDetails) => {
    const editableOffset = this.maxLines === 1
      ? new Offset(this.viewport.pixels - this.dragStartViewport, 0.0)
      : new Offset(0.0, this.viewport.pixels - this.dragStartViewport)
  
    invariant(this.dragStartDetails?.globalPosition)
    invariant(detail?.globalPosition)

    return this.selectPositionAt(
      this.dragStartDetails.globalPosition.subtract(editableOffset),
      detail.globalPosition,
      SelectionChangedCause.Drag,
    )
  }

  handleDragSelectionUpdateThrottle = (details?: DragDetails) => {
    invariant(details)
    this.dragUpdateDetails = details

    this.dragUpdateThrottleTimer ??= Timer.throttle(() => {
      invariant(this.dragUpdateDetails !== null)
      this.handleDragSelectionUpdate(this.dragUpdateDetails)

      this.dragUpdateThrottleTimer = null
      this.dragUpdateDetails = null
    }, At.kDragSelectionUpdateThrottle)
  }

  handleDragEnd = (details?: DragDetails) => {
    if (this.dragUpdateThrottleTimer !== null) {
      this.dragUpdateThrottleTimer.cancel()
      invariant(details)
      this.handleDragSelectionUpdate(details)
    }

    this.dragUpdateThrottleTimer = null
    this.dragStartDetails = null
    this.dragUpdateDetails = null
  }


  markNeedsPaint () {
    super.markNeedsPaint()
    
    this.foregroundLayout?.markNeedsPaint()
    this.backgroundLayout?.markNeedsPaint()
  }

  /**
   * 
   * @param {AtInlineSpan} span 
   */
  extractPlaceholderSpans (span: AtInlineSpan) {
    this.placeholderSpans = []
    span.visit((span: AtInlineSpan) => {
      if (span instanceof AtPlaceholderSpan) {
        this.placeholderSpans.push(span)
      }
      return true
    })
  }

  selectPosition (cause: SelectionChangedCause) {
    invariant(this.lastTapDownDetail)
    this.selectPositionAt(this.lastTapDownDetail.globalPosition, null, cause)
  }
  
  selectPositionAt (from: Offset, to: Offset | null, cause: SelectionChangedCause) {
    invariant(cause !== null)
    invariant(from !== null)
    invariant(this.constraints)
    const constraints = this.constraints as AtBoxConstraints

    this.layoutText(constraints.minWidth, constraints.maxWidth)
    
    const fromPosition = this.painter.getPositionForOffset(this.globalToLocal(from.subtract(this.paintAt)))
    const toPosition = to === null
      ? null
      : this.painter.getPositionForOffset(this.globalToLocal(to.subtract(this.paintAt)))

    const baseOffset = fromPosition.offset
    const extentOffset = toPosition?.offset ?? fromPosition.offset

    const selection = AtTextSelection.create({
      baseOffset: baseOffset,
      extentOffset: extentOffset,
      affinity: fromPosition.affinity,
    })

    this.selection = selection
  }

  computeTextMetricsIfNeeded () {
    invariant(this.constraints !== null, `The "this.constraints" cannot be null.`)
    const constraints = this.constraints as AtBoxConstraints

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

  computeDistanceToActualBaseline (baseline: TextBaseline) {
    invariant(this.constraints !== null)
    this.layoutTextWithConstraints(this.constraints as AtBoxConstraints)
    
    return this.painter.computeDistanceToActualBaseline(At.TextBaseline.Alphabetic) as number
  }

  /**
   * 
   * @returns {boolean}
   */
  canComputeIntrinsics () {
    for (const span of this.placeholderSpans) {
      switch (span.alignment) {
        case At.PlaceholderAlignment.Baseline:
        case At.PlaceholderAlignment.AboveBaseline:
        case At.PlaceholderAlignment.BelowBaseline: {
          return false
        }
        case At.PlaceholderAlignment.Top:
        case At.PlaceholderAlignment.Middle:
        case At.PlaceholderAlignment.Bottom: {
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
    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox
    const placeholderDimensions = Array(this.childCount).fill(AtPlaceholderDimensions.empty)
    let childIndex = 0

    while (child !== null) {
      placeholderDimensions[childIndex] = AtPlaceholderDimensions.create({
        size: new Size(child.getMaxIntrinsicWidth(Infinity), 0.0),
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
      })

      child = this.childAfter(child) as AtLayoutBox | null
      childIndex += 1
    }
    this.painter.placeholderDimensions = placeholderDimensions
  }

  computeChildrenWidthWithMinIntrinsics (height: number) {
    const placeholderDimensions = Array(this.childCount).fill(AtPlaceholderDimensions.empty)
    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox
    let childIndex = 0
    
    while (child !== null) {
      placeholderDimensions[childIndex] = AtPlaceholderDimensions.create({
        size: new Size(child.getMinIntrinsicWidth(Infinity), 0.0),
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
      })

      child = this.childAfter(child) as AtLayoutBox | null
      childIndex += 1
    }

    this.painter.placeholderDimensions = placeholderDimensions
  }

  computeChildrenHeightWithMinIntrinsics (width: number) {
    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox
    const placeholderDimensions = Array(this.childCount).fill(AtPlaceholderDimensions.empty)
    let childIndex = 0
    
    width = width / this.textScaleFactor
    
    while (child !== null) {
      const size = child.getDryLayout(AtBoxConstraints.create({ maxWidth: width }))
      
      placeholderDimensions[childIndex] = AtPlaceholderDimensions.create({
        size,
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
      })

      child = this.childAfter(child) as AtLayoutBox | null
      childIndex += 1
    }

    this.painter.placeholderDimensions = placeholderDimensions
  }

  layoutText (minWidth: number = 0.0, maxWidth: number = Infinity) {
    const widthMatters = this.softWrap || this.overflow === TextOverflow.Ellipsis
    this.painter.layout(
      minWidth,
      widthMatters 
        ? maxWidth 
        : Infinity,
    )
  }

  layoutTextWithConstraints (constraints: AtBoxConstraints) {
    this.painter.placeholderDimensions = this.placeholderDimensions
    this.layoutText(constraints.minWidth, constraints.maxWidth)
  }

  layoutChildren (constraints: AtBoxConstraints, dry = false) {
    if (this.childCount === 0) {
      return []
    }

    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox
    const placeholderDimensions = Array(this.childCount).fill(AtPlaceholderDimensions.empty)
    let childIndex = 0
    
    let boxConstraints = AtBoxConstraints.create({ maxWidth: constraints.maxWidth })
    boxConstraints = boxConstraints.divide(this.textScaleFactor)
    
    while (child !== null) {
      let baselineOffset: number | null = null
      let childSize: Size | null
      if (!dry) {
        child.layout(boxConstraints, true)
        childSize = child.size
        switch (this.placeholderSpans[childIndex].alignment) {
          case At.PlaceholderAlignment.Baseline:
            baselineOffset = child.getDistanceToBaseline(
              this.placeholderSpans[childIndex].baseline!,
            )
            break;
          case At.PlaceholderAlignment.AboveBaseline:
          case At.PlaceholderAlignment.BelowBaseline:
          case At.PlaceholderAlignment.Bottom:
          case At.PlaceholderAlignment.Middle:
          case At.PlaceholderAlignment.Top:
            baselineOffset = null
            break
        }
      } else {
        invariant(this.placeholderSpans[childIndex].alignment !== At.PlaceholderAlignment.Baseline)
        childSize = child.getDryLayout(boxConstraints)
      }

      invariant(childSize)
      invariant(baselineOffset)

      placeholderDimensions[childIndex] = AtPlaceholderDimensions.create({
        size: childSize,
        alignment: this.placeholderSpans[childIndex].alignment,
        baseline: this.placeholderSpans[childIndex].baseline,
        baselineOffset,
      })
      
      child = this.childAfter(child) as AtLayoutBox | null
      childIndex += 1
    }
    return placeholderDimensions;
  }

  canComputeDryLayout() {
    for (const span of this.placeholderSpans) {
      switch (span.alignment) {
        case At.PlaceholderAlignment.Baseline:
        case At.PlaceholderAlignment.AboveBaseline:
        case At.PlaceholderAlignment.BelowBaseline:
          return false
        case At.PlaceholderAlignment.Top:
        case At.PlaceholderAlignment.Middle:
        case At.PlaceholderAlignment.Bottom:
          continue
      }
    }

    return true
  }

  /**
   * 
   * @param {AtBoxConstraints} constraints 
   * @returns {Sizse}
   */
  computeDryLayout (constraints: AtBoxConstraints): Size {
    if (!this.canComputeDryLayout()) {
      return Size.zero

    }
    this.painter.placeholderDimensions = this.layoutChildren(constraints, true)
    this.layoutText(constraints.minWidth, constraints.maxWidth)
    return constraints.constrain(this.painter.size)
  }

  performLayout () {
    const constraints = this.constraints as AtBoxConstraints
    this.placeholderDimensions = this.layoutChildren(constraints)
    this.layoutTextWithConstraints(constraints)
    this.setup()

    const size = this.painter.size
    const textDidExceedMaxLines = this.painter.didExceedMaxLines
    this.size = constraints.constrain(size)

    const didOverflowHeight = this.size.height < size.height || textDidExceedMaxLines
    const didOverflowWidth = this.size.width < size.width

    const contentSize = new Size(size.width + At.kCaretGap, size.height)
    const painterConstraints = AtBoxConstraints.tight(contentSize)

    this.foregroundLayout?.layout(painterConstraints)
    this.backgroundLayout?.layout(painterConstraints)
    
    const hasVisualOverflow = didOverflowWidth || didOverflowHeight
    if (hasVisualOverflow) {
      switch (this.overflow) {
        case TextOverflow.Visible:
          this.needsClipping = false
          this.overflowShader = null
          break
        case TextOverflow.Clip:
        case TextOverflow.Ellipsis:
          this.needsClipping = true
          this.overflowShader = null
          break
        case TextOverflow.Fade:
          invariant(this.textDirection !== null)

          this.needsClipping = true
          const fadeSizePainter = AtTextPainter.create({
            text: AtTextSpan.create({ 
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
              case At.TextDirection.RTL:
                fadeEnd = 0.0
                fadeStart = fadeSizePainter.width
                break
              case At.TextDirection.LTR:
                fadeEnd = this.size.width
                fadeStart = fadeEnd - fadeSizePainter.width
                break
            }

            invariant(fadeStart)
            invariant(fadeEnd)

            this.overflowShader = AtGradient.linear(
              new Offset(fadeStart, 0.0),
              new Offset(fadeEnd, 0.0),
              [new Color(0xFFFFFFFF), new Color(0x00FFFFFF)],
              [],
            )
          } else {
            let fadeEnd = this.size.height
            let fadeStart = fadeEnd - fadeSizePainter.height / 2.0
            this.overflowShader = AtGradient.linear(
              new Offset(0.0, fadeStart),
              new Offset(0.0, fadeEnd),
              [new Color(0xFFFFFFFF), new Color(0x00FFFFFF)],
              []
            )
          }
          break;
      }
    } else {
      this.needsClipping = false
      this.overflowShader = null
    }
  }

  setup () {
    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox
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
      child = this.childAfter(child) as AtLayoutBox | null
      childIndex += 1
    }
  }

  hitTestSelf (position: Offset) {
    return true
  }

  hitTestChildren (result: AtBoxHitTestResult, position: Offset) {
    let hitText = false
    const textPosition = this.painter.getPositionForOffset(position)
    const span = this.painter.text.getSpanForPosition(textPosition)
    
    if (span !== null && span instanceof AtHitTestTarget) {
      result.add(new AtHitTestEntry(span as AtHitTestTarget))
      hitText = true
    }

    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox
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
        (result: AtBoxHitTestResult, transformed: Offset) => {
          return child!.hitTest(result, transformed)
        }
      )

      if (isHit) {
        return true
      }

      child = this.childAfter(child) as AtLayoutBox | null
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
  getOffsetForCaret (position: AtTextPosition, caretPrototype: Rect) {
    this.layoutTextWithConstraints(this.constraints as AtBoxConstraints)
    return this.painter.getOffsetForCaret(position, caretPrototype)
  }

  getFullHeightForCaret (position: AtTextPosition): number | null {
    this.layoutTextWithConstraints(this.constraints as AtBoxConstraints)
    return this.painter.getFullHeightForCaret(position, Rect.zero)
  }

  /**
   * 
   * @param {AtTextSelection} selection 
   * @param {RectHeightStyle} boxHeightStyle 
   * @param {RectWidthStyle} boxWidthStyle 
   * @returns {AtTextBox[]}
   */
  getBoxesForSelection (
    selection: AtTextSelection,
    boxHeightStyle: RectHeightStyle = At.RectHeightStyle.Tight,
    boxWidthStyle: RectWidthStyle = At.RectWidthStyle.Tight,
  ): AtTextBox[] {
    this.layoutTextWithConstraints(this.constraints as AtBoxConstraints)
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
  getPositionForOffset (offset: Offset): AtTextPosition {
    this.layoutTextWithConstraints(this.constraints as AtBoxConstraints)
    return this.painter.getPositionForOffset(offset)
  }


  getWordBoundary (position: AtTextPosition): AtTextRange {
    this.layoutTextWithConstraints(this.constraints as AtBoxConstraints)
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

  paintContents (context: AtPaintingContext, offset: Offset) {
    const effective = offset.add(this.paintAt)

    const backgroundChild = this.backgroundLayout
    if (backgroundChild !== null) {
      context.paintChild(backgroundChild, offset)
    }

    invariant(context.canvas)
    invariant(this.painter.inlinePlaceholderBoxes)

    this.painter.paint(context.canvas, effective)
    let child = this.firstChild as AtLayoutBox | null
    let childIndex = 0

    while (child !== null && childIndex < this.painter.inlinePlaceholderBoxes.length) {
      const scale = this.scale
      invariant(scale)
      context.pushTransform(
        this.needsCompositing,
        effective.add(this.offset),
        Matrix4.diagonal3Values(scale, scale, scale),
        (context: AtPaintingContext, offset: Offset) => {
          context.paintChild(child as AtLayoutBox, offset)
        },
      )
      child = this.childAfter(child) as AtLayoutBox | null
      childIndex += 1
    }

    const foregroundChild = this.foregroundLayout
    if (foregroundChild !== null) {
      context.paintChild(foregroundChild, offset)
    }
  }

  /**
   * 
   * @param {AtPaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: AtPaintingContext, offset: Offset) {
    this.computeTextMetricsIfNeeded()

    invariant(context.canvas)
    invariant(this.size)

    if (this.hasVisualOverflow && this.clipBehavior !== Clip.None) {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        this.offset,
        Offset.zero.and(this.size),
        () => this.paintContents(context, offset),
        this.clipBehavior,
        this.clipRectLayer.layer,
      )
    } else {
      this.clipRectLayer.layer = null
      this.paintContents(context, offset)
    }
  }

  attach (owner: AtPipelineOwner) {
    super.attach(owner)
    this.foregroundLayout?.attach(owner)
    this.backgroundLayout?.attach(owner)

    if (this.selectable) {
      // this.onHover = this.handleHover
      this.onTapDown = this.handleTapDown
      this.onTap = this.handleTap
      this.onPanStart = this.handleDragSelectionStart
      this.onPanUpdate = this.handleDragSelectionUpdateThrottle
      this.onPanEnd = this.handleDragEnd
    }
  }

  
  detach () {
    super.detach()
    
    this.onTapDown = null
    this.onTap = null
    this.onPanStart = null
    this.onPanUpdate = null
    this.onPanEnd = null

    this.foregroundLayout?.detach()
    this.backgroundLayout?.detach()
  }
}