import { invariant } from '@at/utils'
import { Offset, Size } from '@at/geometry'
import { Skia } from '@at/engine'
import { Matrix4, MatrixUtils, Vector3 } from '@at/math'
import { SanitizedPointerEvent } from '@at/gesture'

import { Object } from './object'
import { Container } from './container'
import { Constraints } from './constraints'
import { PaintingContext } from './painting-context'
import { BoxConstraints } from './constraints'
import { BoxHitTestEntry, BoxHitTestResult } from './box-hit-test'


//// => Box
// 盒子选人对象
export interface BoxFactory<T> {
  new (...rests: unknown[]): T,
  create (...rests: unknown[]): T
}
export abstract class Box extends Container {
  static create <T extends Box> (...rests: unknown[]): Box {
    const BoxFactory = this as unknown as BoxFactory<T>
    return new BoxFactory(...rests) 
  }

  // => scale
  // 缩放系数
  protected _scale: number = 1.0
  public get scale () {
    invariant(this._scale !== null, 'The "Box.scale" cannot be null.')
    return this._scale
  }
  public set scale (scale: number) {
    if (this._scale !== scale) {
      this._scale = scale
      this.markNeedsLayout()
    }
  }

  // => size
  // 宽高
  protected _size: Size | null = null
  public get size () {
    return this._size
  }
  public set size (size: Size | null) {
    if (this._size === null || this._size.notEqual(size)) {
      this._size = size
      this.markNeedsLayout()
    }
  }

  // => offset
  // 偏移
  protected _offset: Offset = Offset.ZERO
  public get offset () {
    return this._offset
  }
  public set offset (offset: Offset) {
    if (this._offset === null || this._offset.notEqual(offset)) {
      this._offset = offset
    }
  }
  
  // => bounds
  // 边界
  public get bounds () {
    invariant(this.size !== null, 'The "Box.size" cannot be null.')
    return Offset.ZERO.and(this.size)
  }

  // => transform
  protected _transform: Matrix4 | null = null
  public get transform () {
    invariant(this._transform, 'The "Box.transform" cannot be null.')
    return this._transform
  }
  public set transform (transform: Matrix4) {
    invariant(transform !== null, 'The argument "transform" cannot be null.')
    if (
      this._transform === null || 
      this._transform.notEqual(transform)
    ) {
      this._transform = Matrix4.copy(transform)
      this.markNeedsPaint()
    }
  }
  
  public cachedDryLayoutSizes: Map<BoxConstraints, Size> | null = null
  public cachedBaselines: Map<Skia.TextBaseline, number | null> | null = null

  constructor (...rests: unknown[])
  constructor (
    children: Box[] | null = null,
    ...rests: unknown[]
  ) {
    super()

    if (children !== null) {
      for (const child of children) {
        this.append(child)
      }
    }
  }

  /**
   * 处理事件
   * @param {SanitizedPointerEvent} event 
   * @param {BoxHitTestEntry} entry 
   */
  handleEvent (event: SanitizedPointerEvent, entry: BoxHitTestEntry) {
    
  }

  /**
   * 标记布局
   */
  markNeedsLayout() {
    if (
      (
        this.cachedBaselines !== null && 
        this.cachedBaselines.size > 0
      ) ||
      (
        this.cachedDryLayoutSizes !== null && 
        this.cachedDryLayoutSizes.size > 0
      )
    ) {
      this.cachedBaselines?.clear()
      this.cachedDryLayoutSizes?.clear()
      
      if (parent !== null) {
        return this.markParentNeedsLayout()
      }
    }

    super.markNeedsLayout()
  }

  /**
   * 坐标转换
   * @param {Offset} point 
   * @param {Object | null} ancestor 
   * @returns 
   */
  globalToLocal (
    point: Offset, 
    ancestor: Object | null = null
  ) {
    const transform: Matrix4 = this.getTransformTo(ancestor)
    const det = transform.invert(Matrix4.copy(transform))
    
    if (det === null) {
      return Offset.ZERO
    }

    const n = Vector3.create(0.0, 0.0, 1.0)
    const i = transform.perspectiveTransform(Vector3.create(0.0, 0.0, 0.0))
    const d = transform.perspectiveTransform(Vector3.create(0.0, 0.0, 1.0)).subtract(i)
    const s = transform.perspectiveTransform(Vector3.create(point.dx, point.dy, 0.0))

    s.subtract(d.scaled(n.dot(s) / n.dot(d)))
    return Offset.create(s.x, s.y)
  }

  /**
   * 坐标转换
   * @param {Offset} point 
   * @param {Object | null} ancestor 
   * @returns 
   */
  localToGlobal (
    point: Offset, 
    ancestor: Object | null = null
  ) {
    return MatrixUtils.transformPoint(this.getTransformTo(ancestor), point);
  }  

  /**
   * 获取布局
   * @param {BoxConstraints} constraints 
   * @returns {Size}
   */
  getDryLayout (constraints: BoxConstraints): Size {
    const shouldCache: boolean = true
    
    if (shouldCache) {
      this.cachedDryLayoutSizes ??= new Map<BoxConstraints, Size>()
      const size = this.computeDryLayout(constraints)
      
      for (const [key] of this.cachedDryLayoutSizes) {
        if (key.equal(constraints)) {
          return size
        }
      }

      const result = this.computeDryLayout(constraints)
      this.cachedDryLayoutSizes.set(constraints, result)
      
      return result
    }

    return this.computeDryLayout(constraints)
  }

  /**
   * 计算大小
   * @param {BoxConstraints} constraints 
   * @returns 
   */
  computeDryLayout (constraints: BoxConstraints) {
    return Size.ZERO
  }

  /**
   * 
   * @param {Constraints} constraints 
   * @param {boolean} parentUsesSize 
   */
  layout (
    constraints: Constraints, 
    parentUsesSize: boolean = false
  ) {
    if (
      this.size !== null && 
      this.constraints?.notEqual(constraints) &&
      this.cachedBaselines !== null && 
      this.cachedBaselines.size > 0
    ) {
      this.cachedBaselines?.clear()
    }

    super.layout(constraints, parentUsesSize)
  }

  /**
   * 计算布局
   */
  performResize() {
    this.size = this.computeDryLayout(this.constraints as BoxConstraints)
  }
  
  /**
   * 布局
   */
  performLayout () {
    if (this.child !== null) {
      invariant(this.constraints, 'The "Box.constraints" cannot be null.')

      this.child.layout(this.constraints, true)
      this.size = (this.child as Box).size
    } else {
      this.size = this.computeSizeForNoChild(this.constraints as BoxConstraints)
    }
  }

  /**
   * 计算没有子节点大小
   * @param {BoxConstraints} constraints 
   * @returns {BoxConstraints}
   */
  computeSizeForNoChild (constraints: BoxConstraints) {
    return constraints.smallest
  }
  
  /**
   * 应用矩阵
   * @param {Box} child 
   * @param {Matrix4} transform 
   */
  applyPaintTransform (
    child: Box, 
    transform: Matrix4
  ) {    
    const offset = child.offset
    transform.translate(offset.dx, offset.dy)
  }

  /**
   * 获取矩阵
   * @param {object | null} ancestor 
   * @returns 
   */
  getTransformTo (ancestor?: Object | null) {
    const ancestorSpecified = ancestor !== null
    invariant(this.attached)
    
    if (ancestor === null) {
      invariant(this.owner, 'The "Box.owner" cannot be null.')
      const root = this.owner.root

      if (root instanceof Object) {
        ancestor = root
      }
    }

    const renderers: Object[] = []

    for (
      let renderer = this as Object; 
      renderer !== ancestor; 
      renderer = renderer.parent as Object
    ) {
      renderers.push(renderer)
      invariant(renderer.parent !== null)
    }

    if (ancestorSpecified) {
      renderers.push(ancestor)
    }
    const transform = Matrix4.identity()

    for (let index = renderers.length - 1; index > 0; index -= 1) {
      renderers[index].applyPaintTransform(renderers[index - 1], transform)
    }

    return transform
  }

  /**
   * 获取距离
   * @param {Skia.TextBaseline} baseline 
   * @param {boolean} onlyReal 
   * @returns {number | null}
   */
  getDistanceToBaseline (
    baseline: Skia.TextBaseline, 
    onlyReal = false 
  ): number | null {
    const result = this.getDistanceToActualBaseline(baseline)
    invariant(this.size !== null, `The "Box.size" cannot be null.`)

    if (result === null && !onlyReal) {
      return this.size.height
    }

    return result
  }

  /**
   * 获取距离
   * @param {Skia.TextBaseline} baseline 
   * @returns {number | null}
   */
  getDistanceToActualBaseline (baseline: Skia.TextBaseline): number | null {
    this.cachedBaselines ??= new Map<Skia.TextBaseline, number | null>()

    if (!this.cachedBaselines.has(baseline)) {
      this.cachedBaselines.set(baseline, this.computeDistanceToActualBaseline(baseline))
    }

    return this.cachedBaselines.get(baseline) ?? null
  }

  /**
   * 计算距离
   * @param {Skia.TextBaseline} baseline 
   * @returns {number | null}
   */
  computeDistanceToActualBaseline (baseline: Skia.TextBaseline): number | null {
    return null
  }

  /**
   * 默认计算距离
   * @param {Skia.TextBaseline} baseline 
   * @returns {number | null}
   */
  defaultComputeDistanceToFirstActualBaseline (baseline: Skia.TextBaseline): number | null {
    let child = this.firstChild as Box

    while (child !== null) {
      const result: number | null = child.getDistanceToActualBaseline(baseline)
      if (result !== null) {
        return result + this.offset.dy
      }

      child = this.nextSibling as Box
    }

    return null
  }

  /**
   * 默认计算距离
   * @param {Skia.TextBaseline} baseline 
   * @returns {number | null}
   */
  defaultComputeDistanceToHighestActualBaseline (baseline: Skia.TextBaseline): number | null {
    let result: number | null = null
    let child: Box | null = this.firstChild as Box

    while (child !== null) {
      let candidate: number | null = child.getDistanceToActualBaseline(baseline)
      
      if (candidate !== null) {
        candidate += this.offset.dy
        if (result !== null) {
          result = Math.min(result, candidate);
        } else
          result = candidate;
      }
      child = this.nextSibling as Box
    }

    return result
  }

  /**
   * 默认绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  defaultPaint (
    context: PaintingContext,
    offset: Offset
  ) {
    let child: Box | null = this.firstChild as Box
    
    while (child !== null) {
      context.paintChild(
        child, 
        this.isRepaintBoundary 
          ? Offset.ZERO.add(child.offset)
          : child.offset.add(offset)
      )
      
      child = child.nextSibling as Box
    }
  }

  /**
   * 子节点碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  defaultHitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ): boolean {
    let child: Box | null  = this.lastChild as Box

    while (child !== null) {  
      const isHit = result.addWithPaintOffset(child.offset, position, (result: BoxHitTestResult, transformed: Offset) => {
        invariant(child)
        return child.hitTest(result, transformed)
      })

      if (isHit) {
        return true
      }

      child = child.previousSibling as Box
    }

    return false
  }

  /**
   * 自定义子节点碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ) {
    return false
  }

  /**
   * 自身碰撞测试
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestSelf (position: Offset) {
    return false
  }

  /**
   * 碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTest (
    result: BoxHitTestResult, 
    position: Offset 
  ) {
    invariant(this.size, 'The "Box.size" cannot be null.')

    if (this.size.contains(position)) {
      if (
        this.hitTestChildren(result, position) || 
        this.hitTestSelf(position)
      ) {
        result.add(new BoxHitTestEntry(this, position))
        return true
      }
    }

    return false
  }
}

