import { invariant } from '@at/utility'
import { At, AtCanvas, VoidCallback } from '../at'
import { Offset, Radius, Rect, RRect, Size } from '../basic/geometry'
import { AtPaint } from '../engine/paint'
import { AtTextRange, AtTextSelection } from '../engine/text'
import { Subscribable } from '../basic/subscribable'
import { AtAnimationController } from '../animation/controller'
import { AtTickerProvider } from '../basic/ticker'

import type { AtLayoutParagraph } from './paragraph'
import type { Color } from '../basic/color'
import type { RectHeightStyle, RectWidthStyle, } from '../engine/skia'

export type CaretChangedHandler = (rect: Rect) => void

export abstract class AtParagraphPainter extends Subscribable<VoidCallback> {
  abstract shouldRepaint (delegate: AtParagraphPainter | null): boolean
  abstract paint(canvas: AtCanvas, size: Size , paragraph: AtLayoutParagraph): void 

  dispose () {}
}

export type AtParagraphCaretPainterOptions = {
  width?:number,
  height?: number,
  onCaretChanged?: CaretChangedHandler
}

export class AtParagraphCaretPainter extends AtParagraphPainter {
  static create (options: AtParagraphCaretPainterOptions) {
    return new AtParagraphCaretPainter(
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
      this.publish(`shouldPaint`, value)
    }
  }

  // => color
  private _color: Color | null = null
  public get color (): Color | null {
    return this._color
  }
  public set color (value: Color | null) {
    if (this._color?.value !== value?.value) {
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
  private _offset: Offset = Offset.zero
  public get offset (): Offset {
    return this._offset
  }
  public set offset (value: Offset) {
    if (this._offset !== value) {
      this._offset = value
      this.publish(`offset`, value)
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
      
      this.publish(`backgroundColor`, value)
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
  private _animation: AtAnimationController | null = null
  private get animation (): AtAnimationController {
    if (this._animation) {
      return this._animation
    }

    this.ticker ??= AtTickerProvider.create()
    this._animation = AtAnimationController.create({
      vsync: this.ticker
    })

    this._animation.subscribe(() => this.onChange())

    return this._animation
  }

  private timer: number | null = null

  public painter: AtPaint = AtPaint.create()
  public callback: CaretChangedHandler | null
  public ticker: AtTickerProvider | null = null

  constructor (
    width: number = 2.0, 
    height: number | null = null,
    callback: CaretChangedHandler | null = null
  ) {
    super()
    this._width = width
    this._height = height
    this.callback = callback
  }

  private onTick = () => {
    invariant(this._animation)
    this._animation.value = this.animation.value === 0 ? 1 : 0
  }

  private onChange () {
    invariant(this.color)
    this.color = this.color.withOpacity(this.animation.value)
  }

  start () {
    this.stop()
    this.animation.value = 1.0
    this.timer = At.periodic(() => {
      this.onTick()
    }, At.kCursorBlinkHalfPeriod)
  }

  stop () {
    if (this.timer !== null) {
      clearInterval(this.timer)
    }
  }

  /**
   * 
   * @param {AtCanvas} canvas 
   * @param {Size} size 
   * @param {AtLayoutParagraph} paragraph 
   */
  paint (canvas: AtCanvas, size: Size, paragraph: AtLayoutParagraph) {
    invariant(paragraph !== null)
    const selection = paragraph.selection
    if (selection === null || !selection.isCollapsed) {
      return
    }
    invariant(At.kCaretHeightOffset)
    const position = selection.extent

    const rect = Rect.fromLTWH(
      0.0, 
      At.kCaretHeightOffset, 
      this.width, 
      this.height ?? paragraph.preferredLineHeight - 2.0 * At.kCaretHeightOffset
    )

    const offset = paragraph.getOffsetForCaret(position, rect)
    let crect = rect.shift(offset.add(this.offset))

    const height = paragraph.getFullHeightForCaret(position)
    if (height !== null) {
      crect = Rect.fromLTWH(
        crect.left,
        crect.top - At.kCaretHeightOffset,
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

  shouldRepaint(delegate: AtParagraphPainter | null): boolean {
    return false
  }
}

export class AtParagraphHighlightPainter extends AtParagraphPainter {
  static create (
    range: AtTextRange | Color | null = null,
    color?: Color | null,
  ) {
    if (color === undefined) {
      color = range as Color
      range = null
    }

    return new AtParagraphHighlightPainter(range as AtTextRange | null, color)
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
  private _range: AtTextRange | null
  public get range () {
    return this._range
  }
  public set range (value: AtTextRange | null) {
    if (this._range === null || this._range.notEqual(value)) {
      this._range = value
      this.publish(`range`, value)
    }
  }

  // => heightStyle
  private _heightStyle: RectHeightStyle = At.RectHeightStyle.Tight
  public get heightStyle () {
    return this._heightStyle
  }
  public set heightStyle (heightStyle: RectHeightStyle) {
    invariant(heightStyle !== null)
    if (this._heightStyle !== heightStyle) {
      this._heightStyle = heightStyle
      this.publish(`heightStyle`, heightStyle)
    }
  }

  // => widthStyle
  private _widthStyle: RectWidthStyle = At.RectWidthStyle.Tight
  public get widthStyle () {
    return this._widthStyle
  }
  public set widthStyle (widthStyle: RectWidthStyle) {
    invariant(widthStyle !== null, )
    if (this._widthStyle !== widthStyle) {
      this._widthStyle = widthStyle
      this.publish(`widthStyle`, widthStyle)
    }
  }

  public painter = AtPaint.create()

  constructor (range: AtTextRange | null, color: Color | null) {
    super()
    this._range = range
    this._color = color
  }

  paint(canvas: AtCanvas, size: Size, paragraph: AtLayoutParagraph): void {
    const range = this.range
    const color = this.color

    if (range === null || color === null || range.isCollapsed) {
      return
    }

    invariant(this.painter)
    this.painter.color = color
    
    const boxes = paragraph.getBoxesForSelection(
      AtTextSelection.create({
        baseOffset: range.start, 
        extentOffset: range.end
      }),
      this.heightStyle,
      this.widthStyle,
    )
    
    for (const box of boxes) {
      const rect = box.toRect().shift(paragraph.paintAt).intersect(Rect.fromLTWH(0, 0, paragraph.painter.width, paragraph.painter.height))
      canvas.drawRect(rect, this.painter)
    }
  }
  
  shouldRepaint(delegate: AtParagraphPainter | null): boolean {
    return false
  }
}


export class AtParagraphCompositePainter extends AtParagraphPainter {
  static create (painters: AtParagraphPainter[]) {
    return new AtParagraphCompositePainter(painters)
  }

  public painters: AtParagraphPainter[]

  constructor (painters: AtParagraphPainter[]) {
    super()
    this.painters = painters
  }

  /**
   * 
   * @param canvas 
   * @param size 
   * @param editable 
   */
  paint (canvas: AtCanvas, size: Size, paragraph: AtLayoutParagraph) {
    for (const painter of this.painters) {
      painter.paint(canvas, size, paragraph)
    }
  }

  shouldRepaint (delegate: AtParagraphPainter | null): boolean {
    return false
  }
}