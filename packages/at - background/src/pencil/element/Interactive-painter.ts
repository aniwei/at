import invariant from '@at/utils'
import { At, AtCanvas, AtPaint, Color, Offset, Rect, Size, AtLayoutCustomPainter } from '@at/framework'

export abstract class AtInteractivePainter extends AtLayoutCustomPainter {}

export class AtInteractiveAnchorPainter extends AtInteractivePainter {
  static create (
    color: Color,
    width: number,
    borderColor: Color,
    borderWidth: number
  ) {
    return new AtInteractiveAnchorPainter(color, width, borderColor, borderWidth)
  }
  // => size
  private _width: number
  public get width (): number {
    return this._width
  }
  public set width (width: number) {
    if (this._width !== width) {
      this.publish(`width`, width)
    }
  }

  // => color
  private _color: Color
  public get color (): Color {
    return this._color
  }
  public set color (color: Color) {
    if (this._color.notEqual(color)) {
      this.publish(`color`, color)
    }
  }

  // => borderColor
  private _borderColor: Color
  public get borderColor (): Color {
    return this._borderColor
  }
  public set borderColor (borderColor: Color) {
    if (this._borderColor.notEqual(borderColor)) {
      this.publish(`borderColor`, borderColor)
    }
  }

  // => size
  private _borderWidth: number
  public get borderWidth (): number {
    return this._borderWidth
  }
  public set borderWidth (borderWidth: number) {
    if (this._borderWidth !== borderWidth) {
      this.publish(`borderWidth`, borderWidth)
    }
  }

  constructor (
    color: Color,
    width: number,
    borderColor: Color,
    borderWidth: number
  ) {
    super()

    this._width = width
    this._color = color
    this._borderColor = borderColor
    this._borderWidth = borderWidth
  }

  hitTest (position: Offset): boolean {
    return false
  }

  paintAnchorBorder (canvas: AtCanvas, anchor: Rect) {
    const paint = AtPaint.create()
    paint.strokeWidth = this.borderWidth
    paint.color = this.borderColor
    paint.style = At.PaintStyle.Stroke

    canvas.drawRect(anchor.deflate(this.borderWidth), paint)
  }

  paintAnchorRectangle (canvas: AtCanvas, anchor: Rect) {
    const paint = AtPaint.create()
    paint.strokeWidth = 0.0
    paint.color = this.color
    paint.style = At.PaintStyle.Fill

    canvas.drawRect(anchor, paint)
  }

  paint (canvas: AtCanvas, size: Size): void {

    const width = this.width + this.borderWidth
  
    const anchors = [
      At.Rect.fromCenter(At.Offset.zero, width, width),
      At.Rect.fromCenter(At.Offset.create(size.width, 0), width, width),
      At.Rect.fromCenter(At.Offset.create(size.width, size.height), width,  width),
      At.Rect.fromCenter(At.Offset.create(0, size.height), width, width)
    ]
   
    for (const anchor of anchors) { 
      this.paintAnchorRectangle(canvas, anchor)
      this.paintAnchorBorder(canvas, anchor)
    }

  }

  shouldRepaint (delegate: AtLayoutCustomPainter): boolean {
    throw new Error('Method not implemented.')
  }
}

export class AtInteractiveBorderPainter extends AtInteractivePainter {
  static create (width: number, color: Color) {
    return new AtInteractiveBorderPainter(width, color)
  }

  // => width
  private _width: number
  public get width (): number {
    return this._width
  }
  public set width (width: number) {
    if (this._width !== width) {
      this.publish(`width`, width)
    }
  }

  // => color
  private _color: Color
  public get color (): Color {
    return this._color
  }
  public set color (color: Color) {
    if (this._color.notEqual(color)) {
      this.publish(`color`, color)
    }
  }

  constructor (
    width: number,
    color: Color
  ) {
    super()

    this._width = width
    this._color = color
  }

  hitTest (position: Offset): boolean {
    return false
  }

  paint (canvas: AtCanvas, size: Size): void {
    const paint = AtPaint.create()
    paint.strokeWidth = this.width
    paint.color = this.color
    paint.style = At.PaintStyle.Stroke
    
    const rect = At.Offset.zero.and(size).deflate(this.width / 2)
    canvas.drawRect(rect, paint)
  }

  shouldRepaint (delegate: AtLayoutCustomPainter): boolean {
    throw new Error('Method not implemented.')
  }
}


export type AtInteractiveCompositePainterOptions = {
  borderWidth: number,
  borderColor: Color,
  anchorWidth: number,
  anchorColor: Color,
  anchorBorderColor: Color,
  anchorBorderWidth: number
}


export class AtInteractiveCompositePainter extends AtInteractivePainter {  
  static create (options: AtInteractiveCompositePainterOptions) {
    return new AtInteractiveCompositePainter(
      options.borderWidth,
      options.borderColor,
      options.anchorWidth,
      options.anchorColor,
      options.anchorBorderColor,
      options.anchorBorderWidth
    )
  }

  // => anchorWidth
  public get anchorWidth (): number {
    invariant(this.anchor !== null)
    return this.anchor.width
  }
  public set anchorWidth (value: number) {
    invariant(this.anchor !== null)
    this.anchor.width = value
  }

  // => anchorColor
  public get anchorColor (): Color {
    invariant(this.anchor !== null)
    return this.anchor.color
  }
  public set anchorColor (value: Color) {
    invariant(this.anchor !== null)
    this.anchor.color = value
  }

  // => anchorBorderColor
  public get anchorBorderColor (): Color {
    invariant(this.anchor !== null)
    return this.anchor.borderColor
  }
  public set anchorBackgroundColor (value: Color) {
    invariant(this.anchor !== null)
    this.anchor.borderColor = value
  }

  // => borderWidth
  public get borderWidth (): number {
    invariant(this.border !== null)
    return this.border.width
  }
  public set borderWidth (value: number) {
    invariant(this.border !== null)
    this.border.width = value
  }

  // => borderColor
  public get borderColor (): Color {
    invariant(this.anchor !== null)
    return this.border.color
  }
  public set borderColor (value: Color) {
    invariant(this.border !== null)
    this.border.color = value
  }


  // => painters
  private _painters: AtInteractivePainter[] | null = null
  public get painters () {
    return this._painters ??= this.createBuiltInPointers()
  }

  private anchor: AtInteractiveAnchorPainter
  private border: AtInteractiveBorderPainter

  constructor (
    borderWidth: number,
    borderColor: Color,
    anchorWidth: number,
    anchorColor: Color,
    anchorBorderColor: Color,
    anchorBorderWidth: number
  ) {
    super()

    this.anchor = AtInteractiveAnchorPainter.create(anchorColor, anchorWidth, anchorBorderColor, anchorBorderWidth)
    this.border = AtInteractiveBorderPainter.create(borderWidth, borderColor)

    this.anchor.subscribe(() => this.publish('anchor'))
    this.border.subscribe(() => this.publish('border'))
  }
  
  createBuiltInPointers () {
    return [
      this.border,
      this.anchor,
    ]
  }

  hitTest (position: Offset): boolean {
    for (const painter of this.painters) {
      if (painter.hitTest(position)) {
        return true
      }
    }
    return false
  }


  paint (canvas: AtCanvas, size: Size): void {
    for (const painter of this.painters) {
      painter.paint(canvas, size)
    }
  }

  shouldRepaint (delegate: AtLayoutCustomPainter): boolean {
    throw new Error('Method not implemented.')
  }
}