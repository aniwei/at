import invariant from '@at/utils'
import { 
  At, 
  AtCanvas, 
  Color, 
  AtLayoutCustomPainter, 
  AtPath, 
  BlendMode, 
  Offset, 
  PaintStyle, 
  Rect,
  Size, 
  AtGradient, 
  AtShapeDecoration, 
  AtShapeDecorationCompositePainter, 
  AtBorder, 
  AtShadows, 
  AtDecorationImage, 
  AtImageConfiguration, 
  BorderPosition
} from '@at/framework'



export class AtElementPainter extends AtLayoutCustomPainter {
  static create () {
    return new AtElementPainter()
  }

  static fromSVGString (svg: string) {
    const painter = AtElementPainter.create()
    painter.fromSVGString(svg)
    return painter
  }

  private _shape: AtPath = At.AtPath.create()
  public get shape () {
    return this._shape
  }
  public set shape (value: AtPath) {
    if (this._shape !== value) {
      this._shape = value
      this.publish(`shape`, value)
    }
  }

  // => blendMode
  private _blendMode: BlendMode = At.BlendMode.SrcOver
  public get blendMode () {
    return this._blendMode
  }
  public set blendMode (value: BlendMode) {
    if (this._blendMode !== value) {
      this._blendMode = value
      this.publish(`blendMode`, value)
    }
  }

  // => frame
  private _frame: Rect | null = null
  public get frame () {
    this._frame ??= this.computeIntrinsicFrame()
    return this._frame
  }
  public set frame (value: Rect | null) {
    this._frame = value
  }

  public fills: AtElementCompositePainter
  public strokes: AtElementCompositePainter
  public effects: AtElementCompositePainter

  constructor () {
    super()

    this.fills = AtElementCompositePainter.create(At.PaintStyle.Fill)
    this.strokes = AtElementCompositePainter.create(At.PaintStyle.Stroke)
    this.effects = AtElementCompositePainter.create(At.PaintStyle.Stroke)

    this.fills.subscribe(() => this.publish())
    this.strokes.subscribe(() => this.publish())
  }

  computeIntrinsicFrame (): Rect {
    const bounds = this.shape.getBounds()
    let frame = At.Rect.create(0, 0, bounds.width, bounds.height)

    for (const [index, stroke] of this.strokes) {
      const { visible } = stroke
      if (visible) {
        const { border } = stroke.decoration
        invariant(border !== null)
        const { position, width } = border
  
        switch (position) {
          case BorderPosition.Center: 
            frame = frame.inflate(width / 2.0)
            break
          
  
          case BorderPosition.Outside: 
            frame = frame.inflate(width)
            break
          
  
          case BorderPosition.Inside: 
            break
        }
      }
    } 

    for (const [index, effect] of this.effects) {
      const { visible } = effect
      if (visible) {
        const { shadows } = effect.decoration
        if (shadows !== null) {
          const shadow = shadows[0]
          if (shadow) {
            const { offset, blurRadius } = shadow
            frame = frame.translate(offset.dx, offset.dy).inflate(blurRadius)
          }
        }
      }
    }
    
    return frame
  }

  hitTest (position: Offset): boolean {
    return false
  }

  paint (
    canvas: AtCanvas, 
    size: Size, 
    offset: Offset,
  ): void {
    this.fills.paint(canvas, size, this.shape, this.blendMode)
    this.strokes.paint(canvas, size, this.shape, this.blendMode)
    this.effects.paint(canvas, size, this.shape, this.blendMode)
  }

  fromSVGString (svg: string) {
    this.shape = At.AtPath.fromSVGString(svg)
  }

  toSVGString () {
    return this.shape.toSVGString()
  }
}

export class AtElementDecoratedPainter extends AtLayoutCustomPainter {
  static create () {
    return new AtElementDecoratedPainter()
  }

  // => visible
  private _visible: boolean = true
  public get visible () {
    return this._visible
  }
  public set visible (value: boolean) {
    if (this._visible !== value) {
      this._visible = value
      this.publish(`visible`, value)
    }
  }

  // => color
  public get color (): Color | null {
    return this.decoration.color
  }
  public set color (value: Color | null) {
    if (this.decoration.color === null || this.decoration.color.notEqual(value)) {
      this.decoration.color = value
      this.publish(`color`, value)
    }
  }

  // => gradient
  public get gradient () {
    return this.decoration.gradient
  }
  public set gradient (value: AtGradient | null) {
    if (this.decoration.gradient === null || this.decoration.gradient.notEqual(value)) {
      this.decoration.gradient = value
      this.publish(`gradient`, value)
    }
  }

  // => border
  public get border () {
    return this.decoration.border
  }
  public set border (value: AtBorder | null) {
    if (this.decoration.border === null || this.decoration.border.notEqual(value)) {
      this.decoration.border = value
      this.publish(`border`, value)
    }
  }

  // => shadows
  public get shadows () {
    return this.decoration.shadows
  }
  public set shadows (value: AtShadows | null) {
    if (this.decoration.shadows === null || this.decoration.shadows.notEqual(value)) {
      this.decoration.shadows = value
      this.publish(`shadow`, value)
    }
  }

  // => image
  public get image () {
    return this.decoration.image
  }
  public set image (value: AtDecorationImage | null) {
    if (this.decoration.image === null || this.decoration.image.notEqual(value)) {
      this.decoration.image = value
      this.publish(`image`, value)
    }
  }

  public shouldRepaint: boolean = true
  public decoration: AtShapeDecoration
  public painter: AtShapeDecorationCompositePainter

  constructor () {
    super()

    this.decoration = At.AtShapeDecoration.create()
    this.decoration.subscribe(() => this.publish())

    this.painter = this.decoration.createPainter(() => this.publish())
  }

  hitTest (position: Offset): boolean {
    throw new Error('Method not implemented.')
  }

  paint (
    canvas: AtCanvas, 
    size: Size,   
    shape: AtPath,
    style: PaintStyle,
    blendMode: BlendMode
  ): void {
    this.painter.paint(
      canvas,
      this.decoration, 
      shape, 
      At.TextDirection.LTR,
      AtImageConfiguration.empty
    )
  }
}

export class AtElementCompositePainter extends AtLayoutCustomPainter {
  static create (style: PaintStyle) {
    return new AtElementCompositePainter(style)
  }

  public painters: AtElementDecoratedPainter[] = []
  public shouldRepaint: boolean = true
  public style: PaintStyle

  constructor (style: PaintStyle = At.PaintStyle.Stroke) {
    super()

    this.style = style
  }

  [Symbol.iterator] () {
    return this.painters.entries()
  }

  hitTest (position: Offset): boolean {
    return false
  }

  paint (
    canvas: AtCanvas, 
    size: Size,   
    shape: AtPath,
    blendMode: BlendMode
  ): void {
    for (const painter of this.painters) {
      painter.paint(canvas, size, shape, this.style, blendMode)
    }
  }

  use (painter: AtElementDecoratedPainter) {
    if (!this.painters.includes(painter)) {
      painter.subscribe(() => this.publish())
      
      this.painters.push(painter)
      this.publish()
    }
  }

  remove (painter: AtElementDecoratedPainter) {
    const index = this.painters.findIndex((internal: AtElementDecoratedPainter) => {
      return internal === painter
    })

    if (index > -1) {
      this.painters.splice(index, 1)
      painter.unsubscribe(() => this.publish())
      this.publish()
    }
  }
}
