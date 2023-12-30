import { invariant } from '@at/utils'
import { Offset, Radius, Rect, RRect, Size } from '@at/geometry'
import { Paint, Canvas, Engine } from '@at/engine'
import { TextRange, TextSelection } from '@at/engine'
import { Subscribable } from '@at/basic'

// import { AnimationController } from '../animation/controller'

import type { Skia } from '@at/engine'
import type { Color } from '@at/basic'
import type { Paragraph } from './paragraph'

export type CaretChangedHandle = (rect: Rect) => void

//// => ParagraphPainter
// 画笔
export abstract class ParagraphPainter extends Subscribable {
  abstract shouldRepaint (delegate: ParagraphPainter | null): boolean
  abstract paint(canvas: Canvas, size: Size , paragraph: Paragraph): void 
  dispose () {}
}


//// => ParagraphCaretPainter
// 光标画笔
export type ParagraphCaretPainterOptions = {
  width?:number,
  height?: number,
  onCaretChanged?: CaretChangedHandle
}

export class ParagraphCaretPainter extends ParagraphPainter {
  static create (options: ParagraphCaretPainterOptions) {
    return new ParagraphCaretPainter(
      options.width,
      options.height,
      options?.onCaretChanged
    )
  }

  // => shouldPaint
  private _shouldPaint = true
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
  private _color: Color | null = null
  public get color (): Color | null {
    invariant(this._color !== null, 'The "ParagraphCaretPainter.color" cannot be null.')
    return this._color
  }
  public set color (value: Color | null) {
    if (this._color === null || this._color.notEqual(value)) {
      this._color = value
      this.publish(`color`, value)
    }
  }

  // => radius
  private _radius: Radius | null = null
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
  private _offset: Offset = Offset.ZERO
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
  private _backgroundColor: Color | null = null
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
  private _width: number = 2.0
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
  private _height: number | null = null
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
  // private _animation: AtAnimationController | null = null
  // private get animation (): AtAnimationController {
  //   if (this._animation) {
  //     return this._animation
  //   }

  //   this.ticker ??= AtTickerProvider.create()
  //   this._animation = AtAnimationController.create({
  //     vsync: this.ticker
  //   })

  //   this._animation.subscribe(() => this.onChange())

  //   return this._animation
  // }
  // private timer: number | null = null
  // public ticker: AtTickerProvider | null = null

  public painter: Paint = Paint.create()
  public callback: CaretChangedHandle | null

  constructor (
    width: number = 2.0, 
    height: number | null = null,
    callback: CaretChangedHandle | null = null
  ) {
    super()
    this._width = width
    this._height = height
    this.callback = callback
  }

  // private onTick = () => {
  //   invariant(this._animation)
  //   this._animation.value = this.animation.value === 0 ? 1 : 0
  // }

  // private onChange () {
  //   invariant(this.color)
  //   this.color = this.color.withOpacity(this.animation.value)
  // }

  start () {
    // this.stop()
    // this.animation.value = 1.0
    // this.timer = At.periodic(() => {
    //   this.onTick()
    // }, At.kCursorBlinkHalfPeriod)
  }

  // stop () {
  //   if (this.timer !== null) {
  //     clearInterval(this.timer)
  //   }
  // }

  /**
   * 
   * @param {Canvas} canvas 
   * @param {Size} size 
   * @param {Paragraph} paragraph 
   */
  paint (canvas: Canvas, size: Size, paragraph: Paragraph) {
    invariant(paragraph !== null)
    const selection = paragraph.selection
    if (selection === null || !selection.collapsed) {
      return
    }

    const position = selection.extent
    const rect = Rect.fromLTWH(
      0.0, 
      Engine.env('ATKIT_PARAGRAPH_CARET_HEIGHT', 2), 
      this.width, 
      this.height ?? paragraph.preferredLineHeight - 2.0 * Engine.env('ATKIT_PARAGRAPH_CARET_HEIGHT', 2)
    )

    const offset = paragraph.getOffsetForCaret(position, rect)
    let crect = rect.shift(offset.add(this.offset))

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

  shouldRepaint (delegate: ParagraphPainter | null): boolean {
    return false
  }
}

export class ParagraphHighlightPainter extends ParagraphPainter {
  static create (
    range: TextRange | Color | null = null,
    color?: Color | null,
  ) {
    if (color === undefined) {
      color = range as Color
      range = null
    }

    return new ParagraphHighlightPainter(range as TextRange | null, color)
  }

  // => color
  private _color: Color | null
  public get color (): Color | null {
    return this._color
  }
  public set color (value: Color | null) {
    if (this._color === null || this._color.notEqual(value)) {
      this._color = value
      this.publish(`color`, value)
    }
  }

  // => range
  private _range: TextRange | null
  public get range () {
    return this._range
  }
  public set range (value: TextRange | null) {
    if (this._range === null || this._range.notEqual(value)) {
      this._range = value
      this.publish('range', value)
    }
  }

  // => heightStyle
  private _heightStyle: Skia.RectHeightStyle = Engine.skia.RectHeightStyle.Tight
  public get heightStyle () {
    return this._heightStyle
  }
  public set heightStyle (heightStyle: Skia.RectHeightStyle) {
    invariant(heightStyle !== null)
    if (this._heightStyle !== heightStyle) {
      this._heightStyle = heightStyle
      this.publish('heightStyle', heightStyle)
    }
  }

  // => widthStyle
  private _widthStyle: Skia.RectWidthStyle = Engine.skia.RectWidthStyle.Tight
  public get widthStyle () {
    return this._widthStyle
  }
  public set widthStyle (widthStyle: Skia.RectWidthStyle) {
    invariant(widthStyle !== null, )
    if (this._widthStyle !== widthStyle) {
      this._widthStyle = widthStyle
      this.publish(`widthStyle`, widthStyle)
    }
  }

  public painter = Paint.create()

  constructor (range: TextRange | null, color: Color | null) {
    super()
    this._range = range
    this._color = color
  }

  paint(canvas: Canvas, size: Size, paragraph: Paragraph): void {
    const range = this.range
    const color = this.color

    if (range === null || color === null || range.collapsed) {
      return
    }

    invariant(this.painter)
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
      const rect = box.rect.shift(paragraph.paintAt).intersect(Rect.fromLTWH(0, 0, paragraph.painter.width, paragraph.painter.height))
      canvas.drawRect(rect, this.painter)
    }
  }
  
  shouldRepaint(delegate: ParagraphPainter | null): boolean {
    return false
  }
}


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
   * 
   * @param canvas 
   * @param size 
   * @param editable 
   */
  paint (canvas: Canvas, size: Size, paragraph: Paragraph) {
    for (const painter of this.painters) {
      painter.paint(canvas, size, paragraph)
    }
  }

  shouldRepaint (delegate: ParagraphPainter | null): boolean {
    return false
  }
}