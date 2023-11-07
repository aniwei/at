import { invariant } from '@at/utility'
import { clamp } from '../basic/helper'
import { AtPointerEvent } from '../gestures/events'
import { Matrix4 } from '../basic/matrix4';
import { AtHitTestEntry, AtHitTestResult } from '../gestures/hit-test'
import { AtConstraints, AtLayoutObject } from './object'
import { AtBoxHitTestResult, AtLayoutBox } from './box'
import { AtBoxConstraints } from './box-constraints'
import { Offset, Rect, Size } from '../basic/geometry'
import { axisDirectionToAxis, flipAxisDirection, flipScrollDirection } from './viewport-offset'
import { Axis, AxisDirection, ScrollDirection } from '../at'

export enum GrowthDirection {
  Forward,
  Reverse,
}

export function applyGrowthDirectionToAxisDirection (axisDirection: AxisDirection, growthDirection: GrowthDirection): AxisDirection {
  switch (growthDirection) {
    case GrowthDirection.Forward:
      return axisDirection;
    case GrowthDirection.Reverse:
      return flipAxisDirection(axisDirection)
  }
}

export function applyGrowthDirectionToScrollDirection (scrollDirection: ScrollDirection, growthDirection: GrowthDirection): ScrollDirection{
  switch (growthDirection) {
    case GrowthDirection.Forward:
      return scrollDirection;
    case GrowthDirection.Reverse:
      return flipScrollDirection(scrollDirection);
  }
}



export class AtSliverConstraints extends AtConstraints {
  public axisDirection: AxisDirection
  public growthDirection: GrowthDirection
  public userScrollDirection: ScrollDirection
  public scrollOffset: number
  public precedingScrollExtent: number
  public overlap: number
  public remainingPaintExtent: number
  public crossAxisExtent: number
  public crossAxisDirection: AxisDirection
  public viewportMainAxisExtent: number
  public cacheOrigin: number
  public remainingCacheExtent: number

  constructor (
    axisDirection: AxisDirection,
    growthDirection: GrowthDirection,
    userScrollDirection: ScrollDirection,
    scrollOffset: number,
    precedingScrollExtent: number,
    overlap: number,
    remainingPaintExtent: number,
    crossAxisExtent: number,
    crossAxisDirection: AxisDirection,
    viewportMainAxisExtent: number,
    remainingCacheExtent: number,
    cacheOrigin: number,
  ) {
    super()
    this.axisDirection = axisDirection
    this.growthDirection = growthDirection
    this.userScrollDirection = userScrollDirection
    this.scrollOffset = scrollOffset
    this.precedingScrollExtent = precedingScrollExtent
    this.overlap = overlap
    this.remainingPaintExtent = remainingPaintExtent
    this.crossAxisExtent = crossAxisExtent
    this.crossAxisDirection = crossAxisDirection
    this.viewportMainAxisExtent = viewportMainAxisExtent
    this.remainingCacheExtent = remainingCacheExtent
    this.cacheOrigin = cacheOrigin
  }

  copyWith (
    axisDirection?: AxisDirection,
    growthDirection?: GrowthDirection,
    userScrollDirection?: ScrollDirection,
    scrollOffset?: number,
    precedingScrollExtent?: number,
    overlap?: number,
    remainingPaintExtent?: number,
    crossAxisExtent?: number,
    crossAxisDirection?: AxisDirection,
    viewportMainAxisExtent?: number,
    remainingCacheExtent?: number,
    cacheOrigin?: number,
  ): AtSliverConstraints  {
    return new AtSliverConstraints(
      axisDirection ?? this.axisDirection,
      growthDirection ?? this.growthDirection,
      userScrollDirection ?? this.userScrollDirection,
      scrollOffset ?? this.scrollOffset,
      precedingScrollExtent ?? this.precedingScrollExtent,
      overlap ?? this.overlap,
      remainingPaintExtent ?? this.remainingPaintExtent,
      crossAxisExtent ?? this.crossAxisExtent,
      crossAxisDirection ?? this.crossAxisDirection,
      viewportMainAxisExtent ?? this.viewportMainAxisExtent,
      remainingCacheExtent ?? this.remainingCacheExtent,
      cacheOrigin ?? this.cacheOrigin,
    )
  }

  public get axis () {
    return axisDirectionToAxis(this.axisDirection)
  }

 
  public get normalizedGrowthDirection (): GrowthDirection {
    switch (this.axisDirection) {
      case AxisDirection.Down:
      case AxisDirection.Right:
        return this.growthDirection
      case AxisDirection.Up:
      case AxisDirection.Left:
        switch (this.growthDirection) {
          case GrowthDirection.Forward:
            return GrowthDirection.Reverse
          case GrowthDirection.Reverse:
            return GrowthDirection.Forward
        }
    }
  }

  
  public get isTight () {
    return false
  }

  public get isNormalized () {
    return (
      this.scrollOffset >= 0.0 && 
      this.crossAxisExtent >= 0.0 && 
      this.viewportMainAxisExtent >= 0.0 && 
      this.remainingPaintExtent >= 0.0 &&
      axisDirectionToAxis(this.axisDirection) !== axisDirectionToAxis(this.crossAxisDirection)
    )
  }


  asBoxConstraints (
    minExtent: number = 0.0,
    maxExtent: number = Infinity,
    crossAxisExtent: number,
  ): AtBoxConstraints {
    crossAxisExtent ??= this.crossAxisExtent
    switch (this.axis) {
      case Axis.Horizontal:
        return new AtBoxConstraints(
          crossAxisExtent,
          crossAxisExtent,
          minExtent,
          maxExtent,
        )
      case Axis.Vertical:
        return new AtBoxConstraints(
          crossAxisExtent,
          crossAxisExtent,
          minExtent,
          maxExtent,
        )
    }
  }

  equal (other: AtSliverConstraints | null) {
    return (
      other instanceof AtSliverConstraints &&
      other.axisDirection === this.axisDirection &&
      other.growthDirection === this.growthDirection &&
      other.scrollOffset === this.scrollOffset &&
      other.overlap === this.overlap &&
      other.remainingPaintExtent === this.remainingPaintExtent &&
      other.crossAxisExtent === this.crossAxisExtent &&
      other.crossAxisDirection === this.crossAxisDirection &&
      other.viewportMainAxisExtent === this.viewportMainAxisExtent &&
      other.remainingCacheExtent === this.remainingCacheExtent &&
      other.cacheOrigin === this.cacheOrigin
    )
  }

  notEqual (other: AtSliverConstraints | null) {
    return !this.equal(other)
  }

  toString () {
    return ``
  }
}

export type AtSliverGeometryOptions = {

}

export class AtSliverGeometry {
  static zero = new AtSliverGeometry()
  static create () {

  }

  public scrollExtent: number
  public paintOrigin: number
  public paintExtent: number
  public layoutExtent: number | null 
  public maxPaintExtent: number
  public maxScrollObstructionExtent: number 
  public hitTestExtent: number | null
  public visible: boolean 
  public hasVisualOverflow: boolean 
  public cacheExtent: number | null
  public scrollOffsetCorrection: number | null

  constructor (
    scrollExtent: number = 0.0,
    paintExtent: number = 0.0,
    paintOrigin: number = 0.0,
    layoutExtent: number | null = null,
    maxPaintExtent: number = 0.0,
    maxScrollObstructionExtent: number = 0.0,
    hitTestExtent: number | null = null,
    visible: boolean = false,
    hasVisualOverflow: boolean = false,
    scrollOffsetCorrection: number | null = null,
    cacheExtent: number | null = null,
  ) {
    this.scrollExtent = scrollExtent
    this.paintExtent = paintExtent
    this.paintOrigin = paintOrigin
    this.layoutExtent = layoutExtent

    this.maxPaintExtent = maxPaintExtent
    this.maxScrollObstructionExtent = maxScrollObstructionExtent

    this.hitTestExtent = hitTestExtent
    this.visible = visible
    this.cacheExtent = cacheExtent

    this.hasVisualOverflow = hasVisualOverflow
    this.scrollOffsetCorrection = scrollOffsetCorrection
  }
  
  toString () {

  }
}

type SliverHitTest = (result: AtSliverHitTestResult, mainAxisPosition: number, crossAxisPosition: number) => boolean


export class AtSliverHitTestResult extends AtHitTestResult {
  static wrap (result: AtSliverHitTestResult ) {
    return new AtSliverHitTestResult(result.path, result.transforms, result.localTransforms)
  }

  addWithAxisOffset(
    paintOffset: Offset | null = null,
    mainAxisOffset: number,
    crossAxisOffset: number,
    mainAxisPosition: number,
    crossAxisPosition: number,
    hitTest: SliverHitTest,
  ): boolean {
    if (paintOffset !== null) {
      this.pushOffset(paintOffset.negate())
    }
    const isHit = hitTest(
      this,
      mainAxisPosition - mainAxisOffset,
      crossAxisPosition - crossAxisOffset,
    )

    if (paintOffset !== null) {
      this.popTransform()
    }

    return isHit
  }
}

export type AtSliverHitTestEntryOptions = {
  target: AtLayoutSliver, 
  mainAxisPosition: number,
  crossAxisPosition: number,
}

export class AtSliverHitTestEntry extends AtHitTestEntry {
  static create (
    target: AtLayoutSliver, 
    mainAxisPosition: number,
    crossAxisPosition: number,
  ) {
    invariant(mainAxisPosition)
    invariant(crossAxisPosition)
    return new AtSliverHitTestEntry(
      target,
      mainAxisPosition,
      crossAxisPosition
    )
  }

  public mainAxisPosition: number
  public crossAxisPosition: number
  
  constructor (
    target: AtLayoutSliver, 
    mainAxisPosition: number,
    crossAxisPosition: number,
  ) {
    super(target)
    this.mainAxisPosition = mainAxisPosition
    this.crossAxisPosition = crossAxisPosition
  }

  toString () {
    return ``
  }
}



export abstract class AtLayoutSliver extends AtLayoutObject {
  
  private _geometry: AtSliverGeometry | null = null
  public get geometry () {
    return this._geometry
  }
  public set geometry (value: AtSliverGeometry | null) {
    this._geometry = value
  }
  
  get bounds () {
    invariant(this.constraints)
    invariant(this.geometry)
    const constraints = this.constraints as AtSliverConstraints

    switch (constraints.axis) {
      case Axis.Horizontal:
        return Rect.fromLTWH(
          0.0, 
          0.0,
          this.geometry.paintExtent,
          constraints.crossAxisExtent,
        )
      case Axis.Vertical:
        return Rect.fromLTWH(
          0.0, 
          0.0,
          constraints.crossAxisExtent,
          this.geometry.paintExtent,
        )
    }
  }
  
  performResize () { }

  hitTest (result: AtSliverHitTestResult, mainAxisPosition: number, crossAxisPosition: number): boolean {
    invariant(this.constraints)
    invariant(this.geometry !== null)
    invariant(this.geometry.hitTestExtent)

    const constraints = this.constraints as AtSliverConstraints
    if (
      mainAxisPosition >= 0.0 && 
      mainAxisPosition < this.geometry.hitTestExtent &&
      crossAxisPosition >= 0.0 && 
      crossAxisPosition < constraints.crossAxisExtent
    ) {
      if (this.hitTestChildren(
        result, 
        mainAxisPosition, 
        crossAxisPosition
        ) || this.hitTestSelf(
          mainAxisPosition, 
          crossAxisPosition
        )
      ) {
        result.add(AtSliverHitTestEntry.create(this, mainAxisPosition, crossAxisPosition))
        return true
      }
    }

    return false
  }

  hitTestSelf (mainAxisPosition: number, crossAxisPosition: number) {
    return false
  }

  hitTestChildren (result: AtSliverHitTestResult, mainAxisPosition: number, crossAxisPosition: number) {
    return false
  }

  calculatePaintOffset (constraints: AtSliverConstraints, from: number, to: number) {
    invariant(from <= to)
    const a = constraints.scrollOffset
    const b = constraints.scrollOffset + constraints.remainingPaintExtent
    return clamp(clamp(to, a, b) - clamp(from, a, b), 0.0, constraints.remainingPaintExtent)
  }
  
  calculateCacheOffse (constraints: AtSliverConstraints, from: number, to: number) {
    invariant(from <= to)
    const a = constraints.scrollOffset + constraints.cacheOrigin
    const b = constraints.scrollOffset + constraints.remainingCacheExtent
    return clamp(clamp(to, a, b) - clamp(from, a, b), 0.0, constraints.remainingCacheExtent)
  }

  childMainAxisPosition (child: AtLayoutObject) {
    return 0.0;
  }

  childCrossAxisPosition (child: AtLayoutObject) {
    return 0.0
  }

  childScrollOffset (child: AtLayoutObject): number | null {
    invariant(child.parent === this)
    return 0.0
  }

  
  applyPaintTransform (child: AtLayoutObject, transform: Matrix4) { }

  getAbsoluteSizeRelativeToOrigin (): Size {
    const constraints = this.constraints as AtSliverConstraints
    invariant(this.geometry)
    switch (applyGrowthDirectionToAxisDirection(constraints.axisDirection, constraints.growthDirection)) {
      case AxisDirection.Up:
        return new Size(constraints.crossAxisExtent, -this.geometry.paintExtent)
      case AxisDirection.Right:
        return new Size(this.geometry.paintExtent, constraints.crossAxisExtent)
      case AxisDirection.Down:
        return new Size(constraints.crossAxisExtent, this.geometry.paintExtent)
      case AxisDirection.Left:
        return new Size(-this.geometry.paintExtent, constraints.crossAxisExtent)
    }
  }

  getAbsoluteSize (): Size {
    invariant(this.geometry)
    const constraints = this.constraints as AtSliverConstraints
    switch (constraints.axisDirection) {
      case AxisDirection.Up:
      case AxisDirection.Down:
        return new Size(constraints.crossAxisExtent, this.geometry.paintExtent);
      case AxisDirection.Right:
      case AxisDirection.Left:
        return new Size(this.geometry.paintExtent, constraints.crossAxisExtent)
    }
  }
  
  handleEvent (event: AtPointerEvent, entry: AtSliverHitTestEntry) { }

  getRightWayUp (constraints: AtSliverConstraints) {
    let rightWayUp
    switch (constraints.axisDirection) {
      case AxisDirection.Up:
      case AxisDirection.Left:
        rightWayUp = false
        break
      case AxisDirection.Down:
      case AxisDirection.Right:
        rightWayUp = true
        break
    }
    switch (constraints.growthDirection) {
      case GrowthDirection.Forward:
        break;
      case GrowthDirection.Reverse:
        rightWayUp = !rightWayUp
        break
    }
    return rightWayUp
  }

  
  hitTestBoxChild (result: AtBoxHitTestResult, child: AtLayoutBox, mainAxisPosition: number, crossAxisPosition: number) {
    invariant(this.constraints instanceof AtSliverConstraints)
    invariant(this.geometry)
    invariant(child.size)
    const rightWayUp = this.getRightWayUp(this.constraints)
    const crossAxisDelta = this.childCrossAxisPosition(child)
    let delta = this.childMainAxisPosition(child)
    let absolutePosition = mainAxisPosition - delta
    const absoluteCrossAxisPosition = crossAxisPosition - crossAxisDelta
    let paintOffset: Offset
    let transformedPosition: Offset
    switch (this.constraints.axis) {
      case Axis.Horizontal:
        if (!rightWayUp) {
          absolutePosition = child.size.width - absolutePosition
          delta = this.geometry!.paintExtent - child.size.width - delta
        }
        paintOffset = new Offset(delta, crossAxisDelta)
        transformedPosition = new Offset(absolutePosition, absoluteCrossAxisPosition)
        break
      case Axis.Vertical:
        if (!rightWayUp) {
          absolutePosition = child.size.height - absolutePosition
          delta = this.geometry.paintExtent - child.size.height - delta
        }
        paintOffset = new Offset(crossAxisDelta, delta)
        transformedPosition = new Offset(absoluteCrossAxisPosition, absolutePosition)
        break
    }
    return result.addWithOutOfBandPosition(
      paintOffset,
      null,
      null,
      (result: AtBoxHitTestResult) => {
        return child.hitTest(result, transformedPosition)
      },
    )
  }

  
  applyPaintTransformForBoxChild (child: AtLayoutBox, transform: Matrix4) {
    invariant(this.constraints instanceof AtSliverConstraints)
    invariant(this.geometry)
    invariant(child.size)
    const rightWayUp = this.getRightWayUp(this.constraints)
    let delta = this.childMainAxisPosition(child)
    const crossAxisDelta = this.childCrossAxisPosition(child)
    switch (this.constraints.axis) {
      case Axis.Horizontal:
        if (!rightWayUp) {
          delta = this.geometry.paintExtent - child.size.width - delta
        }

        transform.translate(delta, crossAxisDelta)
        break;
      case Axis.Vertical:
        if (!rightWayUp) {
          delta = this.geometry.paintExtent - child.size.height - delta
        }
        transform.translate(crossAxisDelta, delta)
        break
    }
  }
}


