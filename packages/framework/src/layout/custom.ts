import invariant from '@at/utility'
import { AtCanvas } from '../engine/canvas'
import { Offset, Size } from '../basic/geometry'
import { Subscribable } from '../basic/subscribable'
import { AtPaintingContext } from './painting-context'
import { AtPipelineOwner } from './pipeline-owner'
import { AtBoxConstraints } from './box-constraints'
import { AtBoxHitTestResult, AtLayoutBox } from './box'
import { AtAlignmentDirectional } from '../painting/alignment'
import { AtLayoutStack } from './stack'
import { DecorationPosition } from '../at'

export type AtLayoutCustomOptions = {
  painter: any
  foregroundPainter: any
}

export class AtLayoutCustom<T extends AtLayoutCustomPainter = AtLayoutCustomPainter> extends AtLayoutStack {
  // => preferredSize
  private _preferredSize: Size
  public get preferredSize () {
    return this._preferredSize
  }
  public set preferredSize (value: Size) {
    if (this._preferredSize.notEqual(value)) {
      this._preferredSize = value
      this.markNeedsLayout()
    }
  }

  // => painter
  private _painter: T | null
  public get painter () {
    return this._painter
  }
  public set painter (painter: T | null) {
    if (this._painter === null || this._painter !== painter) {
      this._painter?.unsubscribe()
      this._painter = painter
      this._painter?.subscribe(() => this.markNeedsPaint())
    }
  }

  // => foregroundPainter
  private _foregroundPainter: T | null
  public get foregroundPainter () {
    return this._foregroundPainter
  }
  public set foregroundPainter (foregroundPainter: T | null) {
    if (this._foregroundPainter === null || this._foregroundPainter !== foregroundPainter) {
      this._foregroundPainter?.unsubscribe()
      this._foregroundPainter = foregroundPainter
      this._foregroundPainter?.subscribe(() => this.markNeedsPaint())
    }
  }
  
  
  public isComplex: boolean
  public willChange: boolean

  constructor (
    children: AtLayoutBox[] = [],
    painter: T | null = null,
    foregroundPainter: T | null = null,
    preferredSize: Size = Size.zero,
    isComplex: boolean = false,
    isWillChange: boolean = false,
    alignment: AtAlignmentDirectional = AtAlignmentDirectional.center
  ) {
    super(children, alignment)

    this.isComplex = isComplex
    this.willChange = isWillChange
    
    this._painter = painter
    this._foregroundPainter = foregroundPainter
    this._preferredSize = preferredSize
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

  computeSizeForNoChild (constraints: AtBoxConstraints) {
    return constraints.constrain(this.preferredSize)
  }

  setRasterCacheHints (context: AtPaintingContext) {
    if (this.isComplex) {
      context.setIsComplexHint()
    }
    if (this.willChange) {
      context.setWillChangeHint()
    }
  }

  hitTestChildren (result: AtBoxHitTestResult, position: Offset) {
    if (this.foregroundPainter !== null && (this.foregroundPainter.hitTest(position) ?? false)) {
      return true
    }

    return super.hitTestChildren(result, position)
  }

  hitTestSelf (position: Offset) {
    return this.painter !== null && (this.painter.hitTest(position) ?? true)
  }

  paint (context: AtPaintingContext, offset: Offset) {
    invariant(context.canvas !== null)
    if (this.painter !== null) {
      invariant(this.size !== null)
      this.paintWithPainter(
        context.canvas, 
        offset, 
        this.size,
        this.painter, 
        DecorationPosition.Background
      )
      this.setRasterCacheHints(context)
    }

    super.paint(context, offset)
    
    if (this.foregroundPainter !== null) {
      invariant(this.size !== null)
      this.paintWithPainter(
        context.canvas, 
        offset, 
        this.size,
        this.foregroundPainter, 
        DecorationPosition.Foreground
      )
      this.setRasterCacheHints(context)
    }
  }

  paintWithPainter (
    canvas: AtCanvas, 
    offset: Offset, 
    size: Size,
    painter: T, 
    position: DecorationPosition
  ) {
    canvas.save()
    if (offset.notEqual(Offset.zero)) {
      canvas.translate(offset.dx, offset.dy)
    }
    painter.paint(canvas, size)
    canvas.restore()
  }

  attach (owner: AtPipelineOwner) {
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

export abstract class AtLayoutCustomPainter extends Subscribable {
  abstract paint (canvas: AtCanvas, size: Size, ...rest: unknown[]): void
  abstract hitTest (position: Offset): boolean
  // abstract shouldRepaint (delegate: AtLayoutCustomPainter): boolean
}