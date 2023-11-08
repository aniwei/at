import invariant from '@at/utils'
import { At, AtPaintingContext, AtPath, AtPipelineOwner, BlendMode, DragDetails, Offset, Radius, Timer } from '@at/framework'
import { AtElementPainter } from './element-painter'
import { AtSnapshot } from './snapshot'


export abstract class AtElement<T extends AtElementPainter = AtElementPainter> extends AtSnapshot<AtElementPainter> {
  public get frame () {
    invariant(this.painter instanceof AtElementPainter)
    const frame = this.painter.frame
    invariant(frame !== null)
    return frame
  }

  // => visible
  private _visible: boolean = false
  public get visible () {
    return this._visible
  }
  public set visible (value: boolean) {
    if (this._visible !== value) {
      this._visible = value
      this.markNeedsPaint()
    }
  }

  // => fills
  public get fills () {
    invariant(this.painter instanceof AtElementPainter)
    return this.painter.fills
  }

  // => strokes
  public get strokes () {
    invariant(this.painter instanceof AtElementPainter)
    return this.painter.strokes
  }

  // => effects
  public get effects () {
    invariant(this.painter instanceof AtElementPainter)
    return this.painter.effects
  }

  // => shaep
  public get shape () {
    invariant(this.painter instanceof AtElementPainter)
    return this.painter.shape
  }
  public set shape (value: AtPath) {
    invariant(this.painter instanceof AtElementPainter)
    this.painter.shape = value
  }

  // => blendMode
  public get blendMode () {
    invariant(this.painter instanceof AtElementPainter)
    return this.painter.blendMode
  }
  public set blendMode (value: BlendMode) {
    invariant(this.painter instanceof AtElementPainter)
    this.painter.blendMode = value
  }
 
  // => x
  public get x () {
    return this.left
  }
  public set x (x: number | null) {
    this.left = x
  }

  // => y
  public get y () {
    return this.top
  }
  public set y (y: number | null) {
   this.top = y
  }

  // => radius
  private _radius: Radius = Radius.zero
  public get radius () {
    return this._radius
  }
  public set radius (value: Radius) {
    if (this._radius === null || this._radius.notEqual(value)) {
      this._radius = this.radius
      this.markNeedsPaint()
    }
  }

  public id: string | null = null
  public name: string | null = null
  
  public dragStartOffset: Offset | null = null
  public dragStartDetails: DragDetails | null = null
  public dragUpdateDetails: DragDetails | null = null

  public dragUpdateThrottleTimer: Timer | null = null

  constructor (painter: AtElementPainter = AtElementPainter.create()) {
    super([], painter)

    this.isComplex = true
    this.willChange = true
    this.isRepaintBoundary = false
  }

  paint (context: AtPaintingContext, offset: Offset): void {
    super.paint(context, offset)
  }

  hitTestSelf (position: Offset): boolean {
    return true
  }

  handleTap = (details?: DragDetails) => {
    
  }

  handleDragSelectionStart = (details?: DragDetails) => {
    if (!this.attached) {
      return
    }
    invariant(details)
    
    this.dragStartDetails = details
    this.dragStartOffset = this.offset
  }

  handleDragSelectionUpdate = (details: DragDetails) => {
    invariant(this.dragStartDetails?.globalPosition)
    invariant(details?.globalPosition)

    invariant(this.x !== null)
    invariant(this.y !== null)
    
    invariant(this.dragStartOffset)

    const offset = this.dragStartOffset?.add(details.globalPosition.subtract(this.dragStartDetails?.globalPosition))

    this.x = offset.dx
    this.y = offset.dy
  }

  handleDragSelectionUpdateThrottle = (details?: DragDetails) => {
    invariant(details)
    this.dragUpdateDetails = details

    this.dragUpdateThrottleTimer ??= At.Timer.throttle(() => {
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

  attach (owner: AtPipelineOwner): void {
    super.attach(owner)

    this.onTapDown = this.handleTapDown
    this.onTap = this.handleTap
    this.onPanStart = this.handleDragSelectionStart
    this.onPanUpdate = this.handleDragSelectionUpdateThrottle
  }

  toJSON () {

  }
}

