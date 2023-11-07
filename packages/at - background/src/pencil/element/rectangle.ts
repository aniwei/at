import invariant from '@at/utility'
import { Offset, At, Radius, Rect, AtBoxHitTestResult, AtBoxHitTestEntry, AtPaintingContext } from '@at/framework'
import { AtShape, AtShapePainter } from './shape'

export type AtRectangleElementOptions = {
  width?: number,
  height?: number,
  radius?: Radius
}

export class AtRectangle extends AtShape {
  static create (options: AtRectangleElementOptions) {
    return new AtRectangle(
      AtRectanglePainter.create(
        options.width,
        options.height,
        options.radius
      )
    )
  }

  public get painter () {
    return super.painter as AtRectanglePainter
  }

  // => width
  public get width () {
    return this.painter.width
  }
  public set width (width: number | null) {
    this.painter.width = width
  }

  // => height
  public get height () {
    return this.painter.height
  }
  public set height (height: number | null) {
    this.painter.height = height
  }

  hitTest (result: AtBoxHitTestResult, position: Offset): boolean {
    if (this.size?.contains(position)) {
      result.add(new AtBoxHitTestEntry(this, position))
      return true
    }

    return false
  }

  paint (context: AtPaintingContext, offset: Offset): void {
    debugger
    super.paint(context, offset)
  }
}

export class AtRectanglePainter extends AtShapePainter {
  static create (
    width: number = 100.0,
    height: number = 100.0,
    radius: Radius = Radius.zero
  ) {
    return new AtRectanglePainter(
      width,
      height, 
      radius
    )
  }

  static resurrect (
    width: number = 100.0,
    height: number = 100.0,
    radius: Radius = Radius.zero
  ) {
    const path = At.AtPath.create()
    if (radius.notEqual(Radius.zero)) {
      path.addRRect(At.RRect.fromRectAndRadius((At.Offset.zero.and(At.Size.create(width, height))), radius))
    } else {
      path.addRect(At.Offset.zero.and(At.Size.create(width, height)))
    }

    return path
  }

  // => width
  private _width: number 
  public get width () {
    return this._width
  }
  public set width (value: number) {
    if (this.width !== value) {
      this._width = value
      this.shape = AtRectanglePainter.resurrect(this.width, this.height, this.radius)
    }
  }

  // => height
  private _height: number 
  public get height () {
    return this._height
  }
  public set height (value: number) {
    if (this.height !== value) {
      this._height = value
      this.shape = AtRectanglePainter.resurrect(this.width, this.height, this.radius)
    }
  }

  // => radius
  private _radius: Radius 
  public get radius () {
    return this._radius
  }
  public set radius (value: Radius) {
    if (this._radius === null || this._radius.notEqual(value)) {
      this._radius = value
      this.shape = AtRectanglePainter.resurrect(this.width, this.height, this.radius)
    }
  }

  constructor (
    width: number = 100.0,
    height: number = 100.0,
    radius: Radius = Radius.zero
  ) {
    super()

    this._width = width
    this._height = height
    this._radius = radius

    this.shape = AtRectanglePainter.resurrect(width, height, radius)
  }
}