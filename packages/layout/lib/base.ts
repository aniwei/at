import { invariant } from '@at/utils'
import { Canvas } from '@at/engine'
import { Offset, Size } from '@at/geometry'
import { Subscribable } from '@at/basic'
import { AlignmentDirectional } from '@at/painting'
import { PaintingContext } from './painting-context'
import { PipelineOwner } from './pipeline-owner'
import { BoxConstraints } from './constraints'
import { BoxHitTestResult } from './box-hit-test'
import { Box } from './box'
import { Stack } from './stack'

//// => Base
export type BaseOptions = {
  painter: any
  foregroundPainter: any
}

export interface BaseFactory<T extends BasePainter> {
  new (...rests: unknown[]): Base<T>
  create (...rests: unknown[]): Base<T>
}
export class Base<T extends BasePainter> extends Stack {
  static create <T extends BasePainter> (...rests: unknown[]): Base<T> {
    const BaseFactory = this as unknown as BaseFactory<T>
    return new BaseFactory(...rests)
  }

  // => preferredSize
  private _preferredSize: Size | null = null
  public get preferredSize () {
    invariant(this._preferredSize)
    return this._preferredSize
  }
  public set preferredSize (value: Size) {
    if (this._preferredSize === null || this._preferredSize.notEqual(value)) {
      this._preferredSize = value
      this.markNeedsLayout()
    }
  }

  // => painter
  // 背景画笔
  private _painter: T | null = null
  public get painter () {
    invariant(this._painter)
    return this._painter
  }
  public set painter (painter: T | null) {
    if (this._painter === null || this._painter !== painter) {
      this._painter?.unsubscribe()
      this._painter = painter
      painter?.subscribe(() => this.markNeedsPaint())
    }
  }

  // => foregroundPainter
  // 前景画笔
  private _foregroundPainter: T | null = null
  public get foregroundPainter () {
    invariant(this._foregroundPainter, ``)
    return this._foregroundPainter
  }
  public set foregroundPainter (foregroundPainter: T | null) {
    if (this._foregroundPainter === null || this._foregroundPainter !== foregroundPainter) {
      this._foregroundPainter?.unsubscribe()
      this._foregroundPainter = foregroundPainter
      foregroundPainter?.subscribe(() => this.markNeedsPaint())
    }
  }
  
  public isComplex: boolean
  public willChange: boolean

  constructor (
    children: Box[] = [],
    painter: T | null = null,
    foregroundPainter: T | null = null,
    preferredSize: Size = Size.ZERO,
    isComplex: boolean = false,
    isWillChange: boolean = false,
    alignment: AlignmentDirectional = AlignmentDirectional.CENTER,
    ...rests: unknown[]
  ) {
    super(children, alignment, ...rests)

    this.isComplex = isComplex
    this.willChange = isWillChange
    
    this.preferredSize = preferredSize
    this.painter = painter
    this.foregroundPainter = foregroundPainter
  }

  computeMinIntrinsicWidth (height: number) {
    if (this.child === null) {
      return Number.isFinite(this.preferredSize.width) 
        ? this.preferredSize.width 
        : 0
    }
    return super.computeMinIntrinsicWidth(height);
  }

  computeMaxIntrinsicWidth (height: number) {
    if (this.child === null) {
      return Number.isFinite(this.preferredSize.width) 
        ? this.preferredSize.width 
        : 0
    }
    return super.computeMaxIntrinsicWidth(height);
  }

  computeMinIntrinsicHeight (width: number) {
    if (this.child === null) {
      return Number.isFinite(this.preferredSize.height) 
        ? this.preferredSize.height 
        : 0
    }
    return super.computeMinIntrinsicHeight(width)
  }

  computeMaxIntrinsicHeight (width: number) {
    if (this.child === null) {
      return Number.isFinite(this.preferredSize.height) 
        ? this.preferredSize.height 
        : 0
    }

    return super.computeMaxIntrinsicHeight(width)
  }

  computeSizeForNoChild (constraints: BoxConstraints) {
    return constraints.constrain(this.preferredSize)
  }

  setRasterCacheHints (context: PaintingContext) {
    if (this.isComplex) {
      context.setIsComplexHint()
    }
    if (this.willChange) {
      context.setWillChangeHint()
    }
  }

  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    if (this.foregroundPainter !== null && (this.foregroundPainter.hitTest(position) ?? false)) {
      return true
    }

    return super.hitTestChildren(result, position)
  }

  hitTestSelf (position: Offset) {
    return this.painter !== null && (this.painter.hitTest(position) ?? true)
  }

  paint (context: PaintingContext, offset: Offset) {
    invariant(context.canvas !== null)
    if (this.painter !== null) {
      invariant(this.size !== null, `The "Base.size" cannot be null before painting.`)
      this.paintWithPainter(
        context.canvas, 
        offset, 
        this.size,
        this.painter, 
      )
      this.setRasterCacheHints(context)
    }

    super.paint(context, offset)
    
    if (this.foregroundPainter !== null) {
      invariant(this.size !== null, `The "Base.size" cannot be null before painting.`)
      this.paintWithPainter(
        context.canvas, 
        offset, 
        this.size,
        this.foregroundPainter, 
      )
      this.setRasterCacheHints(context)
    }
  }

  paintWithPainter (
    canvas: Canvas, 
    offset: Offset, 
    size: Size,
    painter: T, 
  ) {
    canvas.save()

    if (offset.notEqual(Offset.ZERO)) {
      canvas.translate(offset.dx, offset.dy)
    }

    painter.paint(canvas, size)
    canvas.restore()
  }

  attach (owner: PipelineOwner) {
    super.attach(owner)
    this.painter?.subscribe(() => this.markNeedsPaint())
    this.foregroundPainter?.subscribe(() => this.markNeedsPaint())
  }

  detach () {
    this.painter?.unsubscribe()
    this.foregroundPainter?.unsubscribe()
    super.detach()
  }
}

export abstract class BasePainter extends Subscribable {
  abstract paint (...rest: unknown[]): void
  abstract paint (canvas: Canvas, size: Size, ...rest: unknown[]): void
  abstract hitTest (position: Offset): boolean
}