import { invariant } from '@at/utils'
import { Matrix4 } from '@at/math'
import { Offset, Size } from '@at/geometry'
import { LayerRef, TransformLayer } from '@at/engine'
import { BoxHitTestResult } from './box-hit-test'
import { PaintingContext } from './painting-context'
import { BoxConstraints } from './constraints'
import { Box } from './box'


//// => RotatedBox
export interface RotatedBoxOptions {
  child: Box | null,
  quarterTurns: number,
}

export class RotatedBox extends Box {
  /**
   * 创建 RotatedBox 对象
   * @param {RotatedBoxOptions} options 
   * @returns {RotatedBox}
   */
  static create (options: RotatedBoxOptions) {
    return new RotatedBox(
      options.child,
      options.quarterTurns
    )
  }

  // => quarterTurns
  protected _quarterTurns: number = 0
  public get quarterTurns () {
    return this._quarterTurns
  }
  public set quarterTurns (value: number) {
    if (this._quarterTurns !== value) {
      this._quarterTurns = value
      this.markNeedsLayout()
    }
  }

  // => isVertical
  public get isVertical () {
    return this.quarterTurns % 2 !== 0
  }
 
  // 合成层
  public transformLayer: LayerRef<TransformLayer> = new LayerRef<TransformLayer>()
  // 绘制 transform
  public paintTransform: Matrix4 | null = null

  constructor (
    child: Box | null,
    quarterTurns: number,
  ) {
    super([child])
    
    this.quarterTurns = quarterTurns 
  }

  /**
   * 计算布局
   * @param {BoxConstraints} constraints 
   * @returns {Size}
   */
  computeDryLayout (constraints: BoxConstraints) {
    if (this.child === null) {
      return constraints.smallest
    }

    const size = (this.child as Box).getDryLayout(
      this.isVertical 
        ? constraints.flipped 
        : constraints
    )

    return this.isVertical 
      ? Size.create(size.height, size.width) 
      : size
  }

  /**
   * 计算布局
   */
  performLayout () {
    this.paintTransform = null
    
    if (this.child !== null) {
      const child = this.child as Box
      const constraints = this.constraints as BoxConstraints

      child.layout(
        this.isVertical 
          ? constraints.flipped 
          : constraints, 
        true
      )

      invariant(child.size, 'The "RotatedBox.child" cannot be null.')

      this.size = this.isVertical 
        ? Size.create(child.size.height, child.size.width) 
        : child!.size
      
      this.paintTransform = Matrix4.identity()
      this.paintTransform.translate(this.size.width / 2.0, this.size.height / 2.0)
      this.paintTransform.rotateZ(Math.PI / 2 * (this.quarterTurns % 4))
      this.paintTransform.translate(-child!.size.width / 2.0, -child!.size.height / 2.0)
    } else {
      this.size = (this.constraints as BoxConstraints).smallest
    }
  }

  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    if (this.child !== null) {
      invariant(this.paintTransform, 'The "RotatedBox.paintTransform" cannot be null.')

      this.transformLayer.layer = context.pushTransform(
        this.needsCompositing,
        offset,
        this.paintTransform,
        (context: PaintingContext, offset: Offset) => this.defaultPaint(context, offset),
        this.transformLayer.layer,
      )
    } else {
      this.transformLayer.layer = null
    }
  }

  /**
   * 
   * @param {Box} child 
   * @param {Matrix4} transform 
   */
  applyPaintTransform (child: Box, transform: Matrix4) {
    if (this.paintTransform !== null) {
      transform.multiply(this.paintTransform)
    }

    super.applyPaintTransform(child, transform)
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
  ) {
    invariant(this.paintTransform !== null || this.child === null)
    
    if (this.child === null || this.paintTransform === null) {
      return false
    }

    return result.addWithPaintTransform(
      this.paintTransform,
      position,
      (result: BoxHitTestResult, position: Offset) => {
        return this.child?.hitTest(result, position) ?? false
      },
    );
  }

  dispose () {
    this.transformLayer.layer = null
    super.dispose()
  }
}
