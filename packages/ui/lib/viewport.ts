import { invariant } from '@at/utils'
import { Skia, Engine } from '@at/engine'


export abstract class ViewportOffset {
  static fixed (value: number) {
    return FixedViewportOffset.create(value)
  }

  static get ZERO () {
    return FixedViewportOffset.ZERO
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

  abstract userScrollDirection: Skia.ScrollDirectionKind
  abstract allowImplicitScrolling: boolean

  toString () {
    return ``
  }
}

export class FixedViewportOffset extends ViewportOffset {
  
  static create (pixels: number) {
    return new FixedViewportOffset(pixels)
  }

  static get ZERO () {
    return FixedViewportOffset.create(0.0)
  }

  public pixels: number

  public get userScrollDirection (): Skia.ScrollDirectionKind {
    return Engine.skia.ScrollDirectionKind.Idle
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
