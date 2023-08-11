import { invariant } from 'ts-invariant'
import { Offset, Size } from '../basic/geometry'
import { Matrix4 } from '../basic/matrix4'
import { MatrixUtils } from '../basic/matrix-util'
import { TextBaseline } from '../engine/skia'
import { Vector3 } from '../basic/vector3'

import { AtPointerEvent } from '../gestures/events'

import { AtHitTestEntry, AtHitTestResult, AtHitTestResultOptions } from '../gestures/hit-test'
import { AtConstraints, AtLayoutObject } from './object'
import { AtPaintingContext } from './painting-context'
import { AtBoxConstraints } from './box-constraints'
import { AtLayoutContainer } from './container'


export enum IntrinsicDimension { 
  minWidth, 
  maxWidth, 
  minHeight, 
  maxHeight 
}

export class IntrinsicDimensionsCacheEntry {
  public dimension: IntrinsicDimension
  public argument: number


  constructor (
    dimension: IntrinsicDimension,
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

export abstract class AtLayoutBox extends AtLayoutContainer {
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
  protected _scale: number | null = null
  public get scale () {
    return this._scale
  }
  public set scale (scale: number | null) {
    if (this._scale === null || this._scale !== scale) {
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
  protected _offset: Offset = Offset.zero
  public get offset () {
    return this._offset
  }
  public set offset (offset: Offset) {
    if (this._offset === null || this._offset.notEqual(offset)) {
      this._offset = offset
    }
  }

  
  // abstract width: number | null
  // abstract height: number | null
  // abstract scale: number | null
  // abstract size: Size | null 
  
  public get bounds () {
    invariant(this.size !== null)
    return Offset.zero.and(this.size)
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
  public cachedDryLayoutSizes: Map<AtBoxConstraints, Size> | null = null
  public cachedIntrinsicDimensions: Map<IntrinsicDimensionsCacheEntry, number> | null = null
  public cachedBaselines: Map<TextBaseline, number | null> | null = null


  constructor (child: AtLayoutBox | null = null) {
    super()

    if (child !== null) {
      this.append(child)
    }
  }

  handleEvent (event: AtPointerEvent, entry: AtBoxHitTestEntry) { }

  computeIntrinsicDimension (
    dimension: IntrinsicDimension, 
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
      IntrinsicDimension.minWidth, 
      height, 
      this.computeMinIntrinsicWidth
    )
  }

  
  computeMinIntrinsicWidth (height: number) {
    return 0
  }

  getMaxIntrinsicWidth (height: number) {
    
    return this.computeIntrinsicDimension(
      IntrinsicDimension.maxWidth, 
      height, 
      this.computeMaxIntrinsicWidth
    )
  }

  computeMaxIntrinsicWidth (height: number): number {
    return 0.0
  }

  getMinIntrinsicHeight (width: number): number {
    return this.computeIntrinsicDimension(
      IntrinsicDimension.minHeight, 
      width, 
      this.computeMinIntrinsicHeight
    )
  }

  
  computeMinIntrinsicHeight (width: number) {
    return 0
  }

  getMaxIntrinsicHeight (width: number) {
    return this.computeIntrinsicDimension(
      IntrinsicDimension.maxHeight, 
      width, 
      this.computeMaxIntrinsicHeight
    )
  }

  computeMaxIntrinsicHeight (width: number) {
    return 0
  }

  getDryLayout (constraints: AtBoxConstraints): Size {
    let shouldCache: boolean = true
    
    if (shouldCache) {
      this.cachedDryLayoutSizes ??= new Map<AtBoxConstraints, Size>()
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

  computeDryLayout (constraints: AtBoxConstraints) {
    const result = Size.zero
    return result
  }
  
  getDistanceToBaseline (
    baseline: TextBaseline, 
    onlyReal = false 
  ): number | null {
    const result = this.getDistanceToActualBaseline(baseline)
    if (result === null && !onlyReal) {
      return this.size!.height
    }
    return result
  }

  getDistanceToActualBaseline (baseline: TextBaseline): number | null {
    this.cachedBaselines ??= new Map<TextBaseline, number | null>()

    if (!this.cachedBaselines.has(baseline)) {
      this.cachedBaselines.set(baseline, this.computeDistanceToActualBaseline(baseline))
    }

    return this.cachedBaselines.get(baseline) ?? null
  }

 
  computeDistanceToActualBaseline (baseline: TextBaseline): number | null {
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
      
      if (parent instanceof AtLayoutObject) {
        this.markParentNeedsLayout()
        return
      }
    }

    super.markNeedsLayout()
  }

  layout (constraints: AtConstraints, parentUsesSize = false) {
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
    this.size = this.computeDryLayout(this.constraints as AtBoxConstraints)
    // @TODO 
    // invariant(this.size.isFinite);
  }

  
  performLayout () {
    if (this.child !== null) {
      invariant(this.child instanceof AtLayoutBox)
      invariant(this.constraints)
      this.child.layout(this.constraints, true)
      this.size = this.child.size
    } else {
      invariant(this.constraints instanceof AtBoxConstraints)
      this.size = this.computeSizeForNoChild(this.constraints)
    }
  }

  computeSizeForNoChild (constraints: AtBoxConstraints) {
    return constraints.smallest
  }
  
  applyPaintTransform (
    child: AtLayoutBox, 
    transform: Matrix4
  ) {
    invariant(child !== null)
    invariant(child.parent === this)
    
    
    const offset = child.offset
    transform.translate(offset.dx, offset.dy)
  }

  getTransformTo (ancestor?: AtLayoutObject | null) {
    const ancestorSpecified = ancestor !== null
    invariant(this.attached)
    
    if (ancestor === null) {
      invariant(this.owner)
      const root = this.owner.root
      if (root instanceof AtLayoutObject) {
        ancestor = root
      }
    }

    const renderers: AtLayoutObject[] = []
    for (
      let renderer = this as AtLayoutObject; 
      renderer !== ancestor; 
      renderer = renderer.parent as AtLayoutObject
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

  globalToLocal (point: Offset, ancestor: AtLayoutObject | null = null) {
    const transform: Matrix4 = this.getTransformTo(ancestor)
    const det = transform.invert()
    
    if (det === 0.0) {
      return Offset.zero
    }

    const n = new Vector3(0.0, 0.0, 1.0)
    const i = transform.perspectiveTransform(new Vector3(0.0, 0.0, 0.0))
    const d = transform.perspectiveTransform(new Vector3(0.0, 0.0, 1.0))
    const s = transform.perspectiveTransform(new Vector3(point.dx, point.dy, 0.0))

    d.substract(i)
    s.substract(d.multiply(n.dot(s) / n.dot(d)))

    return new Offset(s.x, s.y)
  }

  localToGlobal (
    point: Offset, 
    ancestor: AtLayoutObject | null = null
  ) {
    return MatrixUtils.transformPoint(this.getTransformTo(ancestor), point);
  }  
  // @TODO-EVENT

  defaultComputeDistanceToFirstActualBaseline (baseline: TextBaseline): number | null {
    let child = this.firstChild as AtLayoutBox

    while (child !== null) {
      const result: number | null = child.getDistanceToActualBaseline(baseline)
      if (result !== null) {
        return result + this.offset.dy
      }

      child = this.nextSibling as AtLayoutBox
    }

    return null
  }

  defaultComputeDistanceToHighestActualBaseline (baseline: TextBaseline): number | null {
    let result: number | null = null
    let child: AtLayoutBox | null = this.firstChild as AtLayoutBox

    while (child !== null) {
      let candidate: number | null = child.getDistanceToActualBaseline(baseline)
      
      if (candidate !== null) {
        candidate += this.offset.dy
        if (result !== null) {
          result = Math.min(result, candidate);
        } else
          result = candidate;
      }
      child = this.nextSibling as AtLayoutBox
    }

    return result
  }

  defaultPaint (context: AtPaintingContext, offset: Offset) {
    let child = this.firstChild as AtLayoutBox
    
    while (child !== null) {
      context.paintChild(
        child, 
        this.isRepaintBoundary 
          ? Offset.zero.add(child.offset)
          : child.offset.add(offset)
      )
      
      child = child.nextSibling as AtLayoutBox
    }
    // console.log(`tag: ${tag}`, performance.now() - t, this.childCount)
  }

  defaultHitTestChildren (result: AtBoxHitTestResult, position: Offset): boolean {
    let child: AtLayoutBox | null  = this.lastChild as AtLayoutBox
    while (child !== null) {
      
      const isHit = result.addWithPaintOffset(
        child.offset,
        position,
        (result: AtBoxHitTestResult, transformed: Offset) => {
          invariant(child)
          invariant(transformed.equal(position.subtract(child.offset)))
          return child.hitTest(result, transformed)
        }
      )

      if (isHit) {
        return true
      }

      child = child.previousSibling as AtLayoutBox
    }
    return false;
  }

  hitTestChildren (result: AtBoxHitTestResult, position: Offset) {
    return false
  }

  hitTestSelf (position: Offset) {
    return false
  }

  hitTest (
    result: AtBoxHitTestResult, 
    position: Offset 
  ) {
    invariant(this.size)
    if (this.size.contains(position)) {
      if (this.hitTestChildren(result, position) || this.hitTestSelf(position)) {
        result.add(new AtBoxHitTestEntry(this, position))
        return true
      }
    }
    return false
  }
}

export type BoxHitTest = (result: AtBoxHitTestResult, position: Offset ) => boolean
export type BoxHitTestWithOutOfBandPosition = (result: AtBoxHitTestResult) => boolean

export type AtBoxHitTestResultOptions = AtHitTestResultOptions

export class AtBoxHitTestResult extends AtHitTestResult {
  static create (options: AtHitTestResultOptions) {
    return new AtBoxHitTestResult(
      options.path,
      options.transforms,
      options.localTransforms
    )
  }

  static wrap (result: AtHitTestResult) {
    return AtBoxHitTestResult.create({
      path: result.path,
      transforms: result.transforms,
      localTransforms: result.localTransforms
    })
  }

  addWithPaintTransform (
    transform: Matrix4 | null,
    position: Offset,
    hitTest: BoxHitTest,
  ) {
    invariant(position !== null)
    invariant(hitTest !== null)

    if (transform !== null) {
      transform = Matrix4.tryInvert(AtPointerEvent.removePerspectiveTransform(transform))
      if (transform === null) {
        return false
      }
    }

    return this.addWithRawTransform(
      transform,
      position,
      hitTest,
    )
  }

  addWithPaintOffset(
    offset: Offset,
    position: Offset,
    hitTest: BoxHitTest,
  ) {
    invariant(position !== null)
    invariant(hitTest !== null)
    
    const transformedPosition = offset === null 
      ? position 
      : position.subtract(offset)

    if (offset !== null) {
      this.pushOffset(offset.negate())
    }

    const isHit = hitTest(this, transformedPosition)
    
    if (offset !== null) {
      this.popTransform()
    }

    return isHit
  }

  addWithRawTransform (
    transform: Matrix4 | null,
    position: Offset,
    hitTest: BoxHitTest,
  ) {
    invariant(position !== null)
    invariant(hitTest !== null)
    invariant(position !== null)

    const transformedPosition = transform === null 
      ? position 
      : MatrixUtils.transformPoint(transform, position)

    if (transform !== null) {
      this.pushTransform(transform)
    }
    const isHit = hitTest(this, transformedPosition)
    
    if (transform !== null) {
      this.popTransform()
    }

    return isHit
  }

  addWithOutOfBandPosition(
    paintOffset: Offset | null,
    paintTransform: Matrix4 | null,
    rawTransform: Matrix4 | null,
    hitTest: BoxHitTestWithOutOfBandPosition,
  ) {
    invariant(hitTest !== null)
    invariant(
      (paintOffset === null && paintTransform === null && rawTransform !== null) ||
      (paintOffset === null && paintTransform !== null && rawTransform === null) ||
      (paintOffset !== null && paintTransform === null && rawTransform === null),
      'Exactly one transform or offset argument must be provided.',
    )

    if (paintOffset !== null) {
      this.pushOffset(paintOffset.negate())
    } else if (rawTransform !== null) {
      this.pushTransform(rawTransform)
    } else {
      invariant(paintTransform !== null)
      paintTransform = Matrix4.tryInvert(AtPointerEvent.removePerspectiveTransform(paintTransform))

      invariant(paintTransform !== null, 'paintTransform must be invertible.')
      this.pushTransform(paintTransform)
    }

    const isHit = hitTest(this)
    this.popTransform()

    return isHit
  }
}


export class AtBoxHitTestEntry extends AtHitTestEntry {
  constructor (target: AtLayoutBox, position: Offset) {
    super(target)

    this.localPosition = position
  }

  public localPosition: Offset

  toString () {
    return `AtBoxHitTestEntry(${this.localPosition})`
  }
}



