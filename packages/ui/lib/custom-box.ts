import { invariant } from '@at/utils'
import { Canvas } from '@at/engine'
import { Offset, Size } from '@at/geometry'
import { Subscribable } from '@at/basic'
import { AlignmentDirectional } from '@at/painting'

import { Box } from './box'
import { PaintingContext } from './painting-context'
import { PipelineOwner } from './pipeline-owner'
import { BoxConstraints } from './constraints'
import { BoxHitTestResult } from './box-hit-test'

//// => CustomBox
// 自定义绘制
export interface CustomBoxOptions {
  painter: any
  foregroundPainter: any
}

export class CustomBox<T extends CustomBoxPainter = CustomBoxPainter> extends Box {
  // => preferredSize
  // 预设大小
  private _preferredSize: Size | null = null
  public get preferredSize () {
    invariant(this._preferredSize, 'The property "preferredSize" cannot be null.')
    return this._preferredSize
  }
  public set preferredSize (value: Size) {
    if (
      this._preferredSize === null || 
      this._preferredSize.notEqual(value)
    ) {
      this._preferredSize = value
      this.markNeedsLayout()
    }
  }

  // => painter
  // 前景画笔
  private _painter: T | null = null
  public get painter () {
    invariant(this._painter, 'The "Custom._painter" cannot be null.')
    return this._painter
  }
  public set painter (painter: T | null) {
    if (
      this._painter === null || 
      this._painter !== painter
    ) {
      this._painter?.unsubscribe()
      this._painter = painter
      this._painter?.subscribe(() => this.markNeedsPaint())
    }
  }

  // => foregroundPainter
  // 背景画笔
  private _foregroundPainter: T | null = null
  public get foregroundPainter () {
    invariant(this._painter, 'The "Custom._foregroundPainter" cannot be null.')
    invariant(this._foregroundPainter)
    return this._foregroundPainter
  }
  public set foregroundPainter (foregroundPainter: T | null) {
    if (
      this._foregroundPainter === null || 
      this._foregroundPainter !== foregroundPainter
    ) {
      this._foregroundPainter?.unsubscribe()
      this._foregroundPainter = foregroundPainter
      this._foregroundPainter?.subscribe(() => this.markNeedsPaint())
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
    alignment: AlignmentDirectional = AlignmentDirectional.CENTER
  ) {
    super(children, alignment)

    this.isComplex = isComplex
    this.willChange = isWillChange
    this.preferredSize = preferredSize
    
    this.painter = painter
    this.foregroundPainter = foregroundPainter
  }

  /**
   * 无子节点大小计算
   * @param {BoxConstraints} constraints 
   * @returns {Size}
   */
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

  paint (context: PaintingContext, offset: Offset) {
    if (this.painter !== null) {
      invariant(this.size !== null)

      this.paintWithPainter(
        context.canvas as Canvas, 
        offset, 
        this.size,
        this.painter, 
      )

      this.setRasterCacheHints(context)
    }

    super.paint(context, offset)
    
    if (this.foregroundPainter !== null) {
      invariant(this.size !== null)
      this.paintWithPainter(
        context.canvas as Canvas, 
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
    ...rests: unknown[]
  ): void
  paintWithPainter (
    canvas: Canvas, 
    offset: Offset, 
    size: Size,
    painter: T, 
  ): void {
    canvas.save()
    if (offset.notEqual(Offset.ZERO)) {
      canvas.translate(offset.dx, offset.dy)
    }
    painter.paint(canvas, size)
    canvas.restore()
  }

  /**
   * 子节点碰撞检测
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    if (
      this.foregroundPainter !== null && 
      (this.foregroundPainter.hitTest(position) ?? false)) {
      return true
    }

    return super.hitTestChildren(result, position)
  }

  /**
   * 碰撞测试
   * @param { Offset }position 
   * @returns {boolean}
   */
  hitTestSelf (position: Offset) {
    return this.painter !== null && (this.painter.hitTest(position) ?? true)
  }

  /**
   * 挂载
   * @param {PipelineOwner} owner 
   */
  attach (owner: PipelineOwner) {
    super.attach(owner)

    this.painter?.subscribe(() => this.markNeedsPaint())
    this.foregroundPainter?.subscribe(() => this.markNeedsPaint())
  }

  /**
   * 卸载
   */
  detach () {
    this.painter?.unsubscribe()
    this.foregroundPainter?.unsubscribe()
    super.detach()
  }
}

export abstract class CustomBoxPainter extends Subscribable {
  abstract paint (...rests: unknown[]): void
  abstract paint (
    canvas: Canvas, 
    size: Size, 
    ...rests: unknown[]
  ): void
  abstract hitTest (position: Offset): boolean
  // abstract shouldRepaint (delegate: AtLayoutCustomPainter): boolean
}