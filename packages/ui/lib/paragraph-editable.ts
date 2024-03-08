import { invariant, tryCatch } from '@at/utils'
import { Offset, Rect, Size } from '@at/geometry'
import { 
  Engine, 
  Skia, 
  TextPosition, 
  TextSelection 
} from '@at/engine'
import { DragDetail, TapDetail } from '@at/gesture'

import { Box } from './box'
import { BoxHitTestResult } from './box-hit-test'
import { PipelineOwner } from './pipeline-owner'
import { BoxConstraints } from './constraints'
import { PaintingContext } from './painting-context'
import { 
  ParagraphCaretPainter, 
  ParagraphCompositePainter, 
  ParagraphHighlightPainter, 
  ParagraphPainter 
} from './paragraph-painter'
import { Paragraph } from './paragraph'
import { TapAndDragBox, TapAndDragBoxOptions } from './tap-and-drag-box'


/// => SelectionChangedCauseKind
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
    
  // => painter
  // 文本画笔
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

  // => isRepaintBoundary
  public isRepaintBoundary = true
  
  // => sizedByParent
  public sizedByParent = true
  
  constructor (painter: ParagraphPainter) {
    super()
    this.painter = painter
  } 

  /**
   * 
   * @param {BoxConstraints} constraints 
   * @returns {Size}
   */
  computeDryLayout (constraints: BoxConstraints): Size {
    return constraints.biggest
  }

  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    const parent = this.parent as ParagraphEditable
    invariant(parent !== null)
    invariant(context.canvas)

    const painter = this.painter
    if (painter !== null && parent !== null) {
      painter.paint(context.canvas, offset, parent)
    }
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


//// => ParagraphEditable
export interface ParagraphEditableOptions extends TapAndDragBoxOptions {
  paragraph: Paragraph, 
  selectable?: boolean,
  disabled?: boolean,
  caret?: ParagraphCaretPainter,
  highlighter?: ParagraphHighlightPainter,
}

export class ParagraphEditable extends TapAndDragBox {
  /**
   * 创建 Paragraph 对象
   * @param {ParagraphOptions} options 
   * @returns {Paragraph}
   */
  static create(options: ParagraphEditableOptions) {
    return new ParagraphEditable(
      options.paragraph,
      options.selectable,
      options.disabled,
      options.caret,
      options.highlighter
    ) as ParagraphEditable
  }

  // => painter
  public get painter () {
    return this.paragraph.painter
  }

  // => paintAt
  public get paintAt () {
    return this.paragraph.paintAt
  }
  
  // => preferredLineHeight
  public get preferredLineHeight () {
    return this.paragraph.preferredLineHeight
  }

  // => disable 
  public get disable () {
    return !this.enable
  }
  public set disable (value: boolean) {
    if (this.enable === value) {
      this.enable = !value
    }
  }

  // => enable
  protected _enable: boolean = true
  public get enable () {
    return this._enable
  }
  public set enable (value: boolean) {
    if (this._enable !== value) {
      this._enable = value
      if (this.enable) {
        this.onDragStart = this.handleDragStart.bind(this)
        this.onDragUpdate = this.handleDragUpdate.bind(this)
      } else {
        this.onDragStart = null
        this.onDragUpdate = null
      }
    }
  }

  // => selectable
  protected _selectable: boolean = true
  public get selectable () {
    return this._selectable
  }
  public set selectable (value: boolean) {
    if (this._selectable !== value) {
      this._selectable = value
    }
  }

  // => paragraph
  protected _paragraph: Paragraph | null = null
  public get paragraph () {
    invariant(this._paragraph !== null)
    return this._paragraph
  }
  public set paragraph (paragraph: Paragraph) {
    invariant(paragraph !== null, 'The argument "paragraph" cannot be null.')
    if (
      this._paragraph === null || 
      this._paragraph !== paragraph
    ) {
      this._paragraph = paragraph
    }
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
    if (
      this._caret === null || 
      this._caret !== caret
    ) {
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

      if (this.attached) {
        invariant(this._highlighter !== null)
        this._highlighter.engine = this.owner?.engine as Engine
      }

      tryCatch(() => {
        if (this._highlighter) {
          this._highlighter.range = this.paragraph.proxy.selection
        }
      })
    }
  }

  // => builtInForegroundPainters
  // 前景画笔
  protected _cachedBuiltInForegroundPainters: ParagraphCompositePainter | null = null
  protected get builtInForegroundPainters () {
    if (this._cachedBuiltInForegroundPainters === null) {
      this._cachedBuiltInForegroundPainters = this.createBuiltInForegroundPainters()
    }

    return this._cachedBuiltInForegroundPainters
  } 
  protected createBuiltInForegroundPainters (): ParagraphCompositePainter {
    const painters: ParagraphPainter[] = []
    
    if (this.paintCursorAboveText) {
      invariant(this.caret)
      painters.push(this.caret)
    }

    return ParagraphCompositePainter.create(painters)
  }

  // => builtInPainters
  // 背景画笔
  protected _cachedBuiltInPainters: ParagraphCompositePainter | null = null
  protected get builtInPainters () {
    if (this._cachedBuiltInPainters === null) {
      this._cachedBuiltInPainters = this.createBuiltInPainters()
    }
    return this._cachedBuiltInPainters
  } 
  protected createBuiltInPainters (): ParagraphCompositePainter{
    const painters: ParagraphPainter[] = []
    invariant(this.highlighter, 'The "ParagraphEditable.highlighter" cannot be null.')
    painters.push(this.highlighter)

    if (!this.paintCursorAboveText) {
      invariant(this.caret, 'The "ParagraphEditable.caret" cannot be null.')
      painters.push(this.caret)
    }

    return ParagraphCompositePainter.create(painters)
  }

  // => selection
  // 选择区间
  public get selection () {
    return this.paragraph.proxy.selection
  }
  public set selection (selection: TextSelection) {
    invariant('The argument "selection" cannot be null.')

    if (this.selection.notEqual(selection)) {
      invariant(this.highlighter)

      this.paragraph.proxy.selection = selection
      this.highlighter.range = selection

      if (selection.collapsed) {
        this.caret?.start()
      } else {
        this.caret?.stop()
      }
    }
  }

  protected foreground: ParagraphPaint | null = null
  protected background: ParagraphPaint | null = null

  protected dragStartDetail: DragDetail | null = null
  protected lastTapDownDetail: TapDetail | null = null
  
  /**
   * 构造 Paragraph 对象
   * @param {Paragraph} paragraph 
   * @param {AtTextHeightBehavior} textHeightBehavior 
   * @param {AtLayoutBox} children 
   */
  constructor (
    paragraph: Paragraph,
    selectable: boolean = true,
    disable: boolean = false,
    caret: ParagraphCaretPainter | null = null,
    highlighter: ParagraphHighlightPainter | null = null,
  ) {

    super(paragraph)
    this.paragraph = paragraph

    this.caret = caret
    this.caret?.subscribe(() => this.markNeedsPaint())

    this.highlighter = highlighter
    this.highlighter?.subscribe(() => this.markNeedsPaint())

    this.onDragStart = this.handleDragStart.bind(this)
    this.onDragUpdate = this.handleDragUpdate.bind(this)

    this.updateForegroundPainter()
    this.updateBackgroundPainter()
  }

  handleTapDown (detail?: TapDetail) {
    invariant(detail)

    this.lastTapDownDetail = this.lastTapDownDetail
    this.selectPosition(SelectionChangedCauseKind.Tap)
  }

  handleDragStart (detail: DragDetail | null = null) {
    invariant(detail !== null, 'The "onDragStart" argument "detail" cannot be null.')
    this.dragStartDetail = detail

    invariant(detail.globalPosition)

    this.selectPositionAt(
      detail.globalPosition,
      null,
      SelectionChangedCauseKind.Drag
    )
  }

  handleDragUpdate (detail?: DragDetail) {
    invariant(detail !== null, 'The "onDragUpdate" argument "detail" cannot be null.')
    invariant(this.dragStartDetail?.globalPosition)
    invariant(detail?.globalPosition)

    this.selectPositionAt(
      this.dragStartDetail.globalPosition,
      detail.globalPosition,
      SelectionChangedCauseKind.Drag,
    )
  }

  handleDragEnd (detail?: DragDetail) {

  }

  handleDragCancel () {

  }

  /**
   * 更新前景画笔
   */
  updateForegroundPainter () {
    const painter = this.builtInForegroundPainters

    if (this.foreground === null) {
      const foreground = ParagraphPaint.create(painter)
      this.adoptChild(foreground)
      this.foreground = foreground
    } else {
      this.foreground.painter = painter
    }
  }

  /**
   * 更新背景画笔
   */
  updateBackgroundPainter () {
    const painter = this.builtInPainters

    if (this.background === null) {
      const background = ParagraphPaint.create(painter)
      this.adoptChild(background)
      this.background = background
    } else {
      this.background.painter = painter
    }
  }

  markNeedsPaint () {
    super.markNeedsPaint()
    
    this.foreground?.markNeedsPaint()
    this.background?.markNeedsPaint()
  }

  getOffsetForCaret (position: TextPosition, rect: Rect) {
    return this.paragraph.getOffsetForCaret(position, rect)
  }

  getFullHeightForCaret (position: TextPosition) {
    return this.paragraph.getFullHeightForCaret(position)
  }

  getBoxesForSelection (
    selection: TextSelection,
    boxHeightStyle: Skia.RectHeightStyle = Engine.skia.RectHeightStyle.Tight,
    boxWidthStyle: Skia.RectWidthStyle = Engine.skia.RectWidthStyle.Tight,
  ) {
    return this.paragraph.getBoxesForSelection(
      selection,
      boxHeightStyle,
      boxWidthStyle,
    )
  }

  snapToPhysicalPixel (sourceOffset: Offset): Offset {
    return this.paragraph.snapToPhysicalPixel(sourceOffset)
  }

  selectPosition (cause: SelectionChangedCauseKind) {
    invariant(this.lastTapDownDetail)
    this.selectPositionAt(this.lastTapDownDetail.globalPosition, null, cause)
  }
  
  selectPositionAt (
    from: Offset, 
    to: Offset | null, 
    cause: SelectionChangedCauseKind
  ) {
    invariant(this.constraints, 'The "Paragraph.constraints" cannot be null, when selecting text.')
    const constraints = this.constraints as BoxConstraints
    this.paragraph.layoutText(constraints.minWidth, constraints.maxWidth)
    
    const fromPosition = this.paragraph.getPositionForOffset(from)
    const toPosition = to === null
      ? null
      : this.paragraph.getPositionForOffset(to)

    const baseOffset = fromPosition.offset
    const extentOffset = toPosition?.offset ?? fromPosition.offset

    const selection = TextSelection.create({
      baseOffset: baseOffset,
      extentOffset: extentOffset,
      affinity: fromPosition.affinity,
    })

    this.selection = selection
  }

  performLayout (): void {
    super.performLayout()

    invariant(this.size !== null)

    const size = this.paragraph.painter.size
    const constraints = BoxConstraints.tight(new Size(size.width + Engine.env<number>('ATKIT_PARAGRAPH_CARET_GAP', 2), size.height))

    this.background?.layout(constraints)
    this.foreground?.layout(constraints)
  }

  /**
   * 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestSelf (position: Offset) {
    return false
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
    return this.defaultHitTestChildren(result, position)
  }


  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    this.paragraph.computeTextMetricsIfNeeded()
    
    if (this.background !== null) {
      context.paintChild(this.background, offset)
    }

    this.painter.paint(context.canvas, offset)

    if (this.foreground !== null) {
      context.paintChild(this.foreground, offset)
    }
  }

  attach (owner: PipelineOwner) {
    super.attach(owner)
    
    invariant(this.caret !== null)
    this.caret.engine = owner.engine as Engine

    invariant(this.highlighter !== null)
    this.highlighter.engine = owner.engine as Engine

    this.foreground?.attach(owner)
    this.background?.attach(owner)
  }

  
  detach () {
    super.detach()

    invariant(this.caret !== null)
    this.caret.engine = null

    invariant(this.highlighter !== null)
    this.highlighter.engine = null

    this.foreground?.detach()
    this.background?.detach()
  }
}