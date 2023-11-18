import { invariant } from '@at/utils'
import { Axis, AxisDirection, ScrollDirection } from '../at'


export function axisDirectionToAxis (axisDirection: AxisDirection): Axis {
  switch (axisDirection) {
    case AxisDirection.Up:
    case AxisDirection.Down:
      return Axis.Vertical
    case AxisDirection.Left:
    case AxisDirection.Right:
      return Axis.Horizontal
  }
}

export function flipScrollDirection (direction: ScrollDirection): ScrollDirection {
  switch (direction) {
    case ScrollDirection.Idle:
      return ScrollDirection.Idle
    case ScrollDirection.Forward:
      return ScrollDirection.Reverse
    case ScrollDirection.Reverse:
      return ScrollDirection.Forward
  }
}

export function flipAxisDirection (axisDirection: AxisDirection): AxisDirection {
  switch (axisDirection) {
    case AxisDirection.Up:
      return AxisDirection.Down;
    case AxisDirection.Right:
      return AxisDirection.Left;
    case AxisDirection.Down:
      return AxisDirection.Up;
    case AxisDirection.Left:
      return AxisDirection.Right;
  }
}

export abstract class AtViewportOffset {
  
  static fixed (value: number) {
    return AtFixedViewportOffset.create(value)
  }

  static get zero () {
    return AtFixedViewportOffset.zero
  }

  abstract pixels: number
  abstract hasPixels: boolean

  abstract applyViewportDimension (viewportDimension: number): boolean
  abstract applyContentDimensions (minScrollExtent: number, maxScrollExtent: number): boolean

  abstract correctBy (correction: number): void
  abstract jumpTo (pixels: number): void

  abstract animateTo(
    to: number, 
    duration: number,
    // curve: Curve,
  ): Promise<void> 

  moveTo(
    to: number, 
    duration: number | null,
    // TODO
    // curve: Curve | null,
  ): Promise<void> {
    invariant(to !== null)
    
    if (duration === null || duration === 0) {
      this.jumpTo(to)
      return Promise.resolve(void 0)
    } else {
      return this.animateTo(to, duration)
    }
  }

  abstract userScrollDirection: ScrollDirection
  abstract allowImplicitScrolling: boolean

  toString () {
    return ``
  }
}

export class AtFixedViewportOffset extends AtViewportOffset {
  
  static create (pixels: number) {
    return new AtFixedViewportOffset(pixels)
  }

  static zero = AtFixedViewportOffset.create(0.0)

  public pixels: number

  public get userScrollDirection (): ScrollDirection {
    return ScrollDirection.Idle
  }

  public get hasPixels () {
    return true
  }

  public get allowImplicitScrolling (): boolean {
    return false
  }

  constructor (pixels: number) {
    super()
    this.pixels = pixels
  }

 
  animateTo(to: number, duration: number): Promise<void> {
    throw new Error('Method not implemented.')
  }

  applyViewportDimension (viewportDimension: number) {
    return true
  }

  applyContentDimensions (minScrollExtent: number, maxScrollExtent: number) {
    return true
  }

  correctBy (correction: number) {
    this.pixels += correction
  }

  jumpTo (pixels: number) {
    // Do nothing, viewport is fixed.
  }
}
