import { invariant, periodic } from '@at/utils'
import { Offset, Radius, Rect, RRect } from '@at/geometry'
import { 
  Canvas, 
  Engine, 
  Paint,
  TickerProvider, 
  TextRange, 
  TextSelection 
} from '@at/engine'
import { Color, Subscribable } from '@at/basic'
import { AnimationController } from '@at/animation'

import { ParagraphEditable } from './paragraph-editable'
import type { Skia } from '@at/engine'

export interface CaretChangedHandle {
  (rect: Rect): void
}

//// => ParagraphPainter
// 画笔
export abstract class ParagraphPainter extends Subscribable {
  abstract shouldRepaint (delegate: ParagraphPainter | null): boolean
  abstract paint(canvas: Canvas, offset: Offset , paragraph: ParagraphEditable): void 
  dispose () {}
}


//// => ParagraphCaretPainter
// 光标画笔
export interface ParagraphCaretPainterOptions {
  engine?: Engine,
  width?:number,
  height?: number,
  color?: Color,
  onCaretChanged?: CaretChangedHandle
}

export class ParagraphCaretPainter extends ParagraphPainter {
  /**
   * 创建 ParagraphCaretPainter 对象
   * @param {ParagraphCaretPainterOptions} options 
   * @returns {ParagraphCaretPainterOptions}
   */
  static create (options?: ParagraphCaretPainterOptions) {
    return new ParagraphCaretPainter(
      options?.engine,
      options?.width,
      options?.height,
      options?.color,
      options?.onCaretChanged
    )
  }

  // => shouldPaint
  protected _shouldPaint = true
  public get shouldPaint (): boolean {
    return this._shouldPaint
  }
  public set shouldPaint (value: boolean) {
    if (this._shouldPaint !== value) {
      this._shouldPaint = value
      this.publish('shouldPaint', value)
    }
  }

  // => color
  // 颜色
  protected _color: Color | null = Color.BLACK
  public get color (): Color | null {
    invariant(this._color !== null, 'The "ParagraphCaretPainter.color" cannot be null.')
    return this._color
  }
  public set color (value: Color | null) {
    if (
      this._color === null || 
      this._color.notEqual(value)
    ) {
      this._color = value
      this.publish(`color`, value)
    }
  }

  // => radius
  protected _radius: Radius | null = null
  public get radius (): Radius | null {
    return this._radius
  }
  public set radius (value: Radius | null) {
    if (this._radius !== value) {
      this._radius = value
      this.publish(`radius`, value)
    }
  }

  // => offset
  protected _offset: Offset = Offset.ZERO
  public get offset (): Offset {
    return this._offset
  }
  public set offset (value: Offset) {
    if (this._offset !== value) {
      this._offset = value
      this.publish('offset', value)
    }
  }

  // => backgroundColor
  protected _backgroundColor: Color | null = null
  public get backgroundColor (): Color | null {
    return this._backgroundColor
  }
  public set backgroundColor (value: Color | null) {
    if (this._backgroundColor?.value !== value?.value) {
      this._backgroundColor = value
      
      this.publish('backgroundColor', value)
    }
  }

  // => width
  protected _width: number = 2.0
  public get width () {
    return this._width
  }
  public set width (width: number) {
    if (this._width !== width) {
      this._width = width
      this.publish(`width`, width)
    }
  }

  // => height
  protected _height: number | null = null
  public get height () {
    return this._height
  }
  public set height (height: number | null) {
    if (this._height !== height) {
      this._height = height
      this.publish(`height`, height)
    }
  }

  // => animation
  protected _animation: AnimationController | null = null
  protected get animation (): AnimationController {
    if (this._animation === null) {
      this.ticker ??= TickerProvider.create(this.engine as Engine)

      this._animation = AnimationController.create({
        vsync: this.ticker
      }) as AnimationController
  
      this._animation.subscribe(() => this.onChange())
    }

    return this._animation
  }

  // => engine
  protected _engine: Engine | null = null
  public get engine () {
    invariant(this._engine, 'The "ParagraphCaretPainter.engine" cannot be null.')
    return this._engine
  }
  public set engine (engine: Engine | null) {
    if (
      this._engine === null || 
      this._engine !== engine
    ) {
      this._engine = engine
    }
  }

  protected timer: number | null = null

  public ticker: TickerProvider | null = null
  public painter: Paint = Paint.create()
  public callback: CaretChangedHandle | null

  constructor (
    engine: Engine | null = null,
    width: number = 2.0, 
    height: number | null = null,
    color: Color = Color.BLACK,
    callback: CaretChangedHandle | null = null
  ) {
    super()

    this.engine = engine
    this.width = width
    this.height = height
    this.color = color
    this.callback = callback
  }

  protected onTick = () => {
    invariant(this.animation)
    this.animation.value = this.animation.value === 0 ? 1 : 0
  }

  protected onChange () {
    invariant(this.color)
    this.color = this.color.withOpacity(this.animation.value)
  }

  start () {
    this.stop()
    this.animation.value = 1.0
    this.timer = periodic(() => {
      this.onTick()
    }, Engine.env<number>('ATKIT_CURSOR_BLINK_PERIOD', 500)) as unknown as number
  }

  stop () {
    if (this.timer !== null) {
      clearInterval(this.timer)
    }
  }

  /**
   * 绘制
   * @param {Canvas} canvas 
   * @param {Size} size 
   * @param {Paragraph} paragraph 
   */
  paint (canvas: Canvas, offset: Offset, paragraph: ParagraphEditable) {
    invariant(paragraph !== null)
    const selection = paragraph.selection

    if (
      selection === null || 
      !selection.collapsed
    ) {
      return
    }

    const position = selection.extent
    const rect = Rect.fromLTWH(0.0, 
      Engine.env('ATKIT_PARAGRAPH_CARET_HEIGHT', 2), 
      this.width, 
      this.height ?? paragraph.preferredLineHeight - 2.0 * Engine.env('ATKIT_PARAGRAPH_CARET_HEIGHT', 2)
    )

    const target = paragraph.getOffsetForCaret(position, rect)
    let crect = rect.shift(target.add(this.offset))

    const height = paragraph.getFullHeightForCaret(position)
    if (height !== null) {
      crect = Rect.fromLTWH(
        crect.left,
        crect.top - Engine.env('ATKIT_PARAGRAPH_CARET_HEIGHT', 2),
        crect.width,
        height,
      )
    }

    crect = crect.shift(paragraph.paintAt)
    const integralRect = crect.shift(paragraph.snapToPhysicalPixel(crect.topLeft))

    if (this.shouldPaint) {
      if (this.color) {
        this.painter.color = this.color
      }
      const radius = this.radius

      if (radius === null) {
        canvas.drawRect(integralRect, this.painter)
      } else {
        const caretRRect = RRect.fromRectAndRadius(integralRect, radius)
        canvas.drawRRect(caretRRect, this.painter)
      }
    }

    if (this.callback) {
      this.callback(integralRect)
    }
  }

  /**
   * 
   * @param {ParagraphPainter | null} delegate 
   * @returns {boolean}
   */
  shouldRepaint (delegate: ParagraphPainter | null): boolean {
    return false
  }
}


//// => ParagraphHighlightPainter
// 高亮 Painter
export interface ParagraphHighlightPainterOptions {
  engine?: Engine
  range?: TextRange | Color,
  color?: Color
}
export class ParagraphHighlightPainter extends ParagraphPainter {
  /**
   * 创建 ParagraphHighlightPainter 对象
   * @param {ParagraphHighlightPainterOptions | null?} options 
   * @returns 
   */
  static create (options?: ParagraphHighlightPainterOptions) {
    return new ParagraphHighlightPainter(
      options?.engine,
      options?.range as TextRange | null, 
      options?.color as Color
    )
  }

  // => color
  // 颜色
  protected _color: Color | null = Color.BLACK
  public get color (): Color {
    invariant(this._color, 'The "ParagraphHighlightPainter.color" cannot be null.')
    return this._color
  }
  public set color (value: Color | null) {
    if (
      this._color === null || 
      this._color.notEqual(value)
    ) {
      this._color = value
      this.publish(`color`, value)
    }
  }

  // => range
  protected _range: TextRange | null = null
  public get range () {
    return this._range
  }
  public set range (range: TextRange | null) {
    if (
      this._range === null || 
      this._range.notEqual(range)
    ) {
      this._range = range
      this.publish('range', range)
    }
  }

  // => heightStyle
  protected _heightStyle: Skia.RectHeightStyle = Engine.skia.RectHeightStyle.Tight
  public get heightStyle () {
    return this._heightStyle
  }
  public set heightStyle (heightStyle: Skia.RectHeightStyle) {
    invariant(heightStyle !== null, 'The argument "heightStyle" cannot be null.')
    if (this._heightStyle !== heightStyle) {
      this._heightStyle = heightStyle
      this.publish('heightStyle', heightStyle)
    }
  }

  // => widthStyle
  protected _widthStyle: Skia.RectWidthStyle = Engine.skia.RectWidthStyle.Tight
  public get widthStyle () {
    return this._widthStyle
  }
  public set widthStyle (widthStyle: Skia.RectWidthStyle) {
    invariant(widthStyle !== null, 'The argument "widthStyle" cannot be null.')
    if (this._widthStyle !== widthStyle) {
      this._widthStyle = widthStyle
      this.publish(`widthStyle`, widthStyle)
    }
  }

  // => engine
  protected _engine: Engine | null = null
  public get engine () {
    invariant(this._engine, 'The "ParagraphCaretPainter.engine" cannot be null.')
    return this._engine
  }
  public set engine (engine: Engine | null) {
    if (
      this._engine === null || 
      this._engine !== engine
    ) {
      this._engine = engine
    }
  }


  public painter = Paint.create()

  constructor (
    engine: Engine | null = null,
    range: TextRange | null = null, 
    color: Color | null = null
  ) {
    super()

    this.engine = engine
    this.range = range
    this.color = color
  }

  /**
   * 绘制选择
   * @param {Canvas} canvas 
   * @param {Offset} offset 
   * @param {ParagraphEditable} paragraph 
   * @returns {void}
   */
  paint (
    canvas: Canvas, 
    offset: Offset, 
    paragraph: ParagraphEditable
  ): void {
    const range = this.range
    const color = this.color

    if (
      range === null || 
      color === null || 
      range.collapsed
    ) {
      return
    }

    invariant(this.painter, 'The "ParagraphHighlightPainter.painter" cannot be null.')
    this.painter.color = color
    
    const boxes = paragraph.getBoxesForSelection(
      TextSelection.create({
        baseOffset: range.start, 
        extentOffset: range.end
      }),
      this.heightStyle,
      this.widthStyle,
    )
    
    for (const box of boxes) {
      const rect = box.rect
        .shift(paragraph.paintAt)
        .intersect(Rect.fromLTWH(0, 0, paragraph.painter.width, paragraph.painter.height))

      canvas.drawRect(rect, this.painter)
    }
  }
  
  /**
   * 
   * @param {ParagraphPainter | null} delegate 
   * @returns {boolean}
   */
  shouldRepaint (delegate: ParagraphPainter | null): boolean {
    return false
  }
}


//// => ParagraphCompositePainter
export class ParagraphCompositePainter extends ParagraphPainter {
  static create (painters: ParagraphPainter[]) {
    return new ParagraphCompositePainter(painters)
  }

  public painters: ParagraphPainter[]

  constructor (painters: ParagraphPainter[]) {
    super()
    this.painters = painters
  }

  /**
   * 绘制
   * @param {Canvas} canvas 
   * @param {Offset} offset 
   * @param {Paragraph} paragraph 
   */
  paint (
    canvas: Canvas, 
    offset: Offset, 
    paragraph: ParagraphEditable
  ) {
    for (const painter of this.painters) {
      painter.paint(canvas, offset, paragraph)
    }
  }

  /**
   * 是否需要重新绘制
   * @param {ParagraphPainter | null} delegate 
   * @returns {boolean}
   */
  shouldRepaint (
    delegate: ParagraphPainter | null
  ): boolean {
    return false
  }
}