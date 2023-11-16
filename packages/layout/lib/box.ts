import { invariant } from '@at/utils'
import { Offset, Size } from '@at/geometry'
import { Matrix4, MatrixUtils, Vector3 } from '@at/math'
import { Skia } from '@at/engine'

import { Object } from './object'
import { PaintingContext } from './painting-context'
import { BoxConstraints } from './constraints'
import { Container } from './container'
import { Constraints } from './constraints'
import { BoxHitTestEntry, BoxHitTestResult } from './box-hit-test'


export enum IntrinsicDimensionKind { 
  MinWidth, 
  MaxWidth, 
  MinHeight, 
  MaxHeight 
}

export class IntrinsicDimensionsCacheEntry {
  public dimension: IntrinsicDimensionKind
  public argument: number


  constructor (
    dimension: IntrinsicDimensionKind,
    argument: number
  ) {
    this.dimension = dimension
    this.argument = argument
  }

  
  equal (other: IntrinsicDimensionsCacheEntry | null) {
    return (
      other instanceof IntrinsicDimensionsCacheEntry &&
      other.dimension === this.dimension &&
      other.argument === this.argument
    )
  }

  notEqual (other: IntrinsicDimensionsCacheEntry | null) {
    return !this.equal(other)
  }
}

export abstract class Box extends Container {
  static dryLayoutCalculationValid: boolean = true

  // => left
  protected _left: number | null = null
  public get left () {
    return this._left
  }
  public set left (left: number | null) {
    invariant(left !== null)
    if (this._left === null || this._left !== left) {
      this._left = left
      this.markNeedsLayoutForPositionedChange()
    }
  }

  // => top
  protected _top: number | null = null
  public get top () {
    return this._top
  }
  public set top (top: number | null) {
    invariant(top !== null)
    if (this._top === null || this._top !== top) {
      this._top = top
      this.markNeedsLayoutForPositionedChange()
    }
  }

  // => right
  protected _right: number | null = null
  public get right () {
    return this._right
  }
  public set right (right: number | null) {
    if (this._right === null || this._right !== right) {
      this._right = right
      this.markNeedsLayoutForPositionedChange()
    }
  }

  // => bottom
  protected _bottom: number | null = null
  public get bottom () {
    return this._bottom
  }
  public set bottom (bottom: number | null) {
    if (this._bottom === null || this._bottom !== bottom) {
      this._bottom = bottom
      this.markNeedsLayoutForPositionedChange()
    }
  }
  
  // => width
  protected _width: number | null = null
  public get width () {
    return this._width
  }
  public set width (width: number | null) {
    if (this._width === null || this._width !== width) {
      this._width = width
      this.markNeedsLayout()
    }
  }

  // => height
  protected _height: number | null = null
  public get height () {
    return this._height
  }
  public set height (height: number | null) {
    if (this._height === null || this._height !== height) {
      this._height = height
      this.markNeedsLayout()
    }
  }

  // => scale
  protected _scale: number = 1.0
  public get scale () {
    invariant(this._scale)
    return this._scale
  }
  public set scale (scale: number) {
    if (this._scale !== scale) {
      this._scale = scale
      this.markNeedsLayout()
    }
  }

  // => size
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
  protected _offset: Offset = Offset.ZERO
  public get offset () {
    return this._offset
  }
  public set offset (offset: Offset) {
    if (this._offset === null || this._offset.notEqual(offset)) {
      this._offset = offset
    }
  }
  
  public get bounds () {
    invariant(this.size !== null)
    return Offset.ZERO.and(this.size)
  }

  public get hasSize () {
    return this.size !== null
  }

  public get isPositioned () {
    return (
      this.left !== null || 
      this.top !== null || 
      this.right !== null || 
      this.bottom !== null || 
      this.width !== null || 
      this.height !== null
    )
  }

  public transform: Matrix4 | null = null
  public computingThisDryLayout: boolean = false
  public cachedDryLayoutSizes: Map<BoxConstraints, Size> | null = null
  public cachedIntrinsicDimensions: Map<IntrinsicDimensionsCacheEntry, number> | null = null
  public cachedBaselines: Map<Skia.TextBaseline, number | null> | null = null

  constructor (child: Box | null = null) {
    super()

    if (child !== null) {
      this.append(child)
    }
  }

  handleEvent (event: PointerEvent, entry: BoxHitTestEntry) { }

  computeIntrinsicDimension (
    dimension: IntrinsicDimensionKind, 
    argument: number, 
    computer: { (argument: number): number }
  ) {
    let shouldCache = true
    
    if (shouldCache) {
      this.cachedIntrinsicDimensions ??= new Map<IntrinsicDimensionsCacheEntry, number>()
      const entry = new IntrinsicDimensionsCacheEntry(dimension, argument)

      for (const [key] of this.cachedIntrinsicDimensions) {
        if (key.equal(entry)) {
          return computer(argument)
        }
      }

      const result = computer(argument)
      this.cachedIntrinsicDimensions.set(entry, result)

      return result
    }

    return computer(argument)
  }

  getMinIntrinsicWidth (height: number) {
    return this.computeIntrinsicDimension(
      IntrinsicDimensionKind.MinWidth, 
      height, 
      this.computeMinIntrinsicWidth
    )
  }

  
  computeMinIntrinsicWidth (height: number) {
    return 0
  }

  getMaxIntrinsicWidth (height: number) {
    
    return this.computeIntrinsicDimension(
      IntrinsicDimensionKind.MaxWidth, 
      height, 
      this.computeMaxIntrinsicWidth
    )
  }

  computeMaxIntrinsicWidth (height: number): number {
    return 0.0
  }

  getMinIntrinsicHeight (width: number): number {
    return this.computeIntrinsicDimension(
      IntrinsicDimensionKind.MinHeight, 
      width, 
      this.computeMinIntrinsicHeight
    )
  }

  
  computeMinIntrinsicHeight (width: number) {
    return 0
  }

  getMaxIntrinsicHeight (width: number) {
    return this.computeIntrinsicDimension(
      IntrinsicDimensionKind.MaxHeight, 
      width, 
      this.computeMaxIntrinsicHeight
    )
  }

  computeMaxIntrinsicHeight (width: number) {
    return 0
  }

  getDryLayout (constraints: BoxConstraints): Size {
    let shouldCache: boolean = true
    
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
    return this.computeDryLayout(constraints);
  }

  computeDryLayout (constraints: BoxConstraints) {
    const result = Size.ZERO
    return result
  }
  
  getDistanceToBaseline (
    baseline: Skia.TextBaseline, 
    onlyReal = false 
  ): number | null {
    const result = this.getDistanceToActualBaseline(baseline)
    if (result === null && !onlyReal) {
      return this.size!.height
    }
    return result
  }

  getDistanceToActualBaseline (baseline: Skia.TextBaseline): number | null {
    this.cachedBaselines ??= new Map<Skia.TextBaseline, number | null>()

    if (!this.cachedBaselines.has(baseline)) {
      this.cachedBaselines.set(baseline, this.computeDistanceToActualBaseline(baseline))
    }

    return this.cachedBaselines.get(baseline) ?? null
  }

 
  computeDistanceToActualBaseline (baseline: Skia.TextBaseline): number | null {
    return null
  }

  markNeedsLayoutForPositionedChange () {
    this.markNeedsLayout()
    if (this.parent !== null) {
      this.markParentNeedsLayout()
    }
  }
  
  markNeedsLayout() {
    if (
      (this.cachedBaselines !== null && this.cachedBaselines.size > 0) ||
      (this.cachedIntrinsicDimensions !== null && this.cachedIntrinsicDimensions.size > 0) ||
      (this.cachedDryLayoutSizes !== null && this.cachedDryLayoutSizes.size > 0)
    ) {
      this.cachedBaselines?.clear()
      this.cachedIntrinsicDimensions?.clear()
      this.cachedDryLayoutSizes?.clear()
      
      if (parent instanceof Object) {
        this.markParentNeedsLayout()
        return
      }
    }

    super.markNeedsLayout()
  }

  layout (constraints: Constraints, parentUsesSize = false) {
    if (
      this.hasSize && 
      this.constraints !== constraints &&
      this.cachedBaselines !== null && 
      this.cachedBaselines.size > 0
    ) {
      this.cachedBaselines?.clear()
    }

    super.layout(constraints, parentUsesSize)
  }

  
  performResize() {
    this.size = this.computeDryLayout(this.constraints as BoxConstraints)
    // @TODO 
    // invariant(this.size.isFinite);
  }

  
  performLayout () {
    if (this.child !== null) {
      invariant(this.child instanceof Box)
      invariant(this.constraints)
      this.child.layout(this.constraints, true)
      this.size = this.child.size
    } else {
      invariant(this.constraints instanceof BoxConstraints)
      this.size = this.computeSizeForNoChild(this.constraints)
    }
  }

  computeSizeForNoChild (constraints: BoxConstraints) {
    return constraints.smallest
  }
  
  applyPaintTransform (
    child: Box, 
    transform: Matrix4
  ) {
    invariant(child !== null)
    invariant(child.parent === this)
    
    
    const offset = child.offset
    transform.translate(offset.dx, offset.dy)
  }

  getTransformTo (ancestor?: Object | null) {
    const ancestorSpecified = ancestor !== null
    invariant(this.attached)
    
    if (ancestor === null) {
      invariant(this.owner)
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
      renderers.push(ancestor!)
    }
    const transform = Matrix4.identity()

    for (let index = renderers.length - 1; index > 0; index -= 1) {
      renderers[index].applyPaintTransform(renderers[index - 1], transform)
    }

    return transform
  }

  globalToLocal (point: Offset, ancestor: Object | null = null) {
    const transform: Matrix4 = this.getTransformTo(ancestor)
    const det = transform.invert()
    
    if (det === 0.0) {
      return Offset.ZERO
    }

    // const n = new Vector3(0.0, 0.0, 1.0)
    const i = transform.perspectiveTransform(new Vector3(0.0, 0.0, 0.0))
    const d = transform.perspectiveTransform(new Vector3(0.0, 0.0, 1.0))
    const s = transform.perspectiveTransform(new Vector3(point.dx, point.dy, 0.0))

    d.substract(i)
    // s.substract(d.multiply(n.dot(s) / n.dot(d)))

    return Offset.create(s.x, s.y)
  }

  localToGlobal (
    point: Offset, 
    ancestor: Object | null = null
  ) {
    return MatrixUtils.transformPoint(this.getTransformTo(ancestor), point);
  }  
  // @TODO-EVENT

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

  defaultPaint (context: PaintingContext, offset: Offset) {
    let child = this.firstChild as Box
    
    while (child !== null) {
      context.paintChild(
        child, 
        this.isRepaintBoundary 
          ? Offset.ZERO.add(child.offset)
          : child.offset.add(offset)
      )
      
      child = child.nextSibling as Box
    }
    // console.log(`tag: ${tag}`, performance.now() - t, this.childCount)
  }

  defaultHitTestChildren (result: BoxHitTestResult, position: Offset): boolean {
    let child: Box | null  = this.lastChild as Box
    while (child !== null) {
      
      const isHit = result.addWithPaintOffset(
        child.offset,
        position,
        (result: BoxHitTestResult, transformed: Offset) => {
          invariant(child)
          invariant(transformed.equal(position.subtract(child.offset)))
          return child.hitTest(result, transformed)
        }
      )

      if (isHit) {
        return true
      }

      child = child.previousSibling as Box
    }
    return false;
  }

  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    return false
  }

  hitTestSelf (position: Offset) {
    return false
  }

  hitTest (
    result: BoxHitTestResult, 
    position: Offset 
  ) {
    invariant(this.size)
    if (this.size.contains(position)) {
      if (this.hitTestChildren(result, position) || this.hitTestSelf(position)) {
        result.add(new BoxHitTestEntry(this, position))
        return true
      }
    }
    return false
  }
}

