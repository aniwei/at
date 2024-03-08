import { Offset } from 'packages/geometry/types/lib'
import { BoxHitTestResult, PaintingContext } from '.'
import { Box } from './box'

export enum FlexFit {
  Tight,
  Loose
}
//// => Flexible
export interface FlexibleOptions {
  child?: Box,
  flex?: number,
  fit?: FlexFit,
}

export class Flexible extends Box {
  static create (options: FlexibleOptions) {
    return new Flexible(
      options.child,
      options.flex,
      options.fit,
    )
  }

  // => flex
  // 弹性比例
  protected _flex: number = 1
  public get flex () {
    return this._flex
  }
  public set flex (flex: number) {
    if (this._flex !== flex) {
      this._flex = flex
      this.markNeedsLayout()
    }
  }

  // => fit
  // 弹性类型
  protected _fit: number = FlexFit.Loose
  public get fit () {
    return this._fit
  }
  public set fit (fit: FlexFit) {
    if (this._fit !== fit) {
      this._fit = fit
      this.markNeedsLayout()
    }
  }

  constructor (
    child: Box | null = null,
    flex: number = 1,
    fit: FlexFit = FlexFit.Loose,
  ) {
    super(child ? [child] : [])

    this.flex = flex
    this.fit = fit
  }

  /**
   * 
   */
  markNeedsLayout (): void {
    super.markNeedsLayout()

    if (this.needsLayout) {
      this.parent?.markNeedsLayout()
    }
  }

  /**
   * 碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ): boolean {
    return this.defaultHitTestChildren(result, position)
  }

  hitTestSelf (position: Offset): boolean {
    return false
  }

  paint (context: PaintingContext, offset: Offset): void {
    this.defaultPaint(context, offset)
  }
}

//// => Expanded
export interface ExpandedOptions {
  child?: Box,
  flex?: number,
  fit?: FlexFit,
}

export class Expanded extends Flexible { 
  static create (options: ExpandedOptions) {
    return new Expanded(
      options.child,
      options.flex,
      options.fit,
    )
  }
}
