import { invariant } from 'ts-invariant'
import { lerp } from '../basic/helper'
import { At } from '../at'
import { Offset, Rect, Size } from '../basic/geometry'
import { AtBoxConstraints } from './box-constraints'
import { AtLayoutObject } from './object'
import { AtPaintingContext } from './painting-context'
import { AtClipRectLayer, AtLayerHandle } from '../engine/layer'
import { ChildLayout, ChildLayouter } from './child-layout'
import { AtBoxHitTestResult, AtLayoutBox } from './box'
import { AtListener } from './listener'
import { Clip, TextBaseline, TextDirection } from '../engine/skia'
import { AtAlignment, AtAlignmentDirectional, AtAlignmentGeometry } from '../painting/alignment'

export enum StackFit {
  Loose,
  Expand,
  Passthrough,
}

export class RelativeRect {
  static fromLTRB (
    left: number, 
    top: number, 
    right: number, 
    bottom: number
  ) {
    return new RelativeRect(
      left, 
      top, 
      right, 
      bottom
    )
  }

  static fromSize (rect: Rect, container: Size) {
    return RelativeRect.fromLTRB(rect.left, rect.top, container.width - rect.right, container.height - rect.bottom)
  }

  static fromRect (rect: Rect, container: Rect) {
    return RelativeRect.fromLTRB(
      rect.left - container.left,
      rect.top - container.top,
      container.right - rect.right,
      container.bottom - rect.bottom,
    );
  }

  static fill = RelativeRect.fromLTRB(0.0, 0.0, 0.0, 0.0)

  public left: number
  public top: number
  public right: number
  public bottom: number

  public get hasInsets () {
    return (
      this.left > 0.0 || 
      this.top > 0.0 || 
      this.right > 0.0 || 
      this.bottom > 0.0
    )
  }

  constructor (
    left: number,
    top: number,
    right: number,
    bottom: number,
  ) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
  }

  shift (offset: Offset): RelativeRect {
    return RelativeRect.fromLTRB(
      this.left + offset.dx, 
      this.top + offset.dy, 
      this.right - offset.dx, 
      this.bottom - offset.dy
    )
  }

  inflate (delta: number): RelativeRect  {
    return RelativeRect.fromLTRB(
      this.left - delta, 
      this.top - delta, 
      this.right - delta, 
      this.bottom - delta
    )
  }

  deflate (delta: number): RelativeRect {
    return this.inflate(-delta)
  }

  intersect (other: RelativeRect ): RelativeRect  {
    return RelativeRect.fromLTRB(
      Math.max(this.left, other.left),
      Math.max(this.top, other.top),
      Math.max(this.right, other.right),
      Math.max(this.bottom, other.bottom),
    )
  }

  toRect (container: Rect): Rect {
    return Rect.fromLTRB(
      this.left, 
      this.top, 
      container.width - this.right, 
      container.height - this.bottom
    )
  }

  toSize (container: Size): Size {
    return new Size(
      container.width - this.left - this.right, 
      container.height - this.top - this.bottom
    )
  }

  
  static lerp (a: RelativeRect | null, b: RelativeRect | null, t: number): RelativeRect | null {
    invariant(t !== null)

    if (a === null && b === null) {
      return null
    }

    invariant(a)
    invariant(b)

    if (a === null) {
      return RelativeRect.fromLTRB(
        b.left * t, 
        b.top * t, 
        b.right * t, 
        b.bottom * t
      )
    }

    if (b === null) {
      let k = 1 - t
      return RelativeRect.fromLTRB(
        a.left * k, 
        a.top * k, 
        a.right * k, 
        a.bottom * k
      )
    }

    return RelativeRect.fromLTRB(
      lerp(a.left, b.left, t)!,
      lerp(a.top, b.top, t)!,
      lerp(a.right, b.right, t)!,
      lerp(a.bottom, b.bottom, t)!,
    );
  }
  
  equal (other: RelativeRect | null) {
    
    return (
      other instanceof RelativeRect &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  notEqual (other: RelativeRect | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `RelativeRect.fromLTRB(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`
  }
}

export type AtLayoutStackOptions = {
  fit?: StackFit,
  alignment?: AtAlignmentDirectional,
  textDirection?: TextDirection,
  clipBehavior?: Clip,
  [key: string]: unknown
}

export class AtLayoutStack extends AtListener {
  /**
   * 
   * @param options 
   * @example
   * AtLayout.create(children)
   * AtLayout.create(options, children)
   */
  static create (options: AtLayoutStackOptions, children: AtLayoutBox[] = []): AtLayoutStack {

    return new AtLayoutStack(
      children,
      options?.alignment,
      options?.textDirection,
      options?.fit,
      options?.clipBehavior
    )
  }

  static layoutPositionedChild (child: AtLayoutBox, size: Size, alignment: AtAlignment): boolean {
    invariant(child.isPositioned)
    
    let hasVisualOverflow = false
    let childConstraints = new AtBoxConstraints()

    if (child.left !== null && child.right !== null) {
      childConstraints = childConstraints.tighten(size.width - child.right - child.left)
    } else if (child.width !== null) {
      childConstraints = childConstraints.tighten(child.width)
    }

    if (child.top !== null && child.bottom !== null) {
      childConstraints = childConstraints.tighten(null, size.height - child.bottom - child.top)
    } else if (child.height !== null) {
      childConstraints = childConstraints.tighten(null, child.height)
    }

    child.layout(childConstraints, true)
    invariant(child.size, `The "child.size" cannot be null after layouted.`)

    let x: number = 0
    if (child.left !== null) {
      x = child.left
    } else if (child.right !== null) {
      x = size.width - child.right - child.size.width
    } else {
      x = alignment.alongOffset(size.subtract(child.size) as Offset).dx
    }

    if (x < 0.0 || x + child.size.width > size.width) {
      hasVisualOverflow = true
    }

    let y: number = 0
    if (child.top !== null) {
      y = child.top
    } else if (child.bottom !== null) {
      y = size.height - child.bottom - child.size.height
    } else {
      y = alignment.alongOffset(size.subtract(child.size) as Offset).dy
    }

    if (y < 0 || y + child.size.height > size.height) {
      hasVisualOverflow = true
    }

    child.offset = new Offset(x, y)

    return hasVisualOverflow
  }


  static layoutPositioned (box: AtLayoutBox, size: Size): boolean {
    invariant(box.isPositioned)
    
    let hasVisualOverflow = false
    let constraints = new AtBoxConstraints()

    if (box.left !== null && box.right !== null) {
      constraints = constraints.tighten(size.width - box.right - box.left)
    } else if (box.width !== null) {
      constraints = constraints.tighten(box.width)
    }

    if (box.top !== null && box.bottom !== null) {
      constraints = constraints.tighten(null, size.height - box.bottom - box.top)
    } else if (box.height !== null) {
      constraints = constraints.tighten(null, box.height)
    }

    // child.layout(constraints, true)
    invariant(box.size, `The "box.size" cannot be null after layouted.`)

    let x: number = 0
    if (box.left !== null) {
      x = box.left
    } else if (box.right !== null) {
      x = size.width - box.right - box.size.width
    } 

    if (x < 0.0 || x + box.size.width > size.width) {
      hasVisualOverflow = true
    }

    let y: number = 0
    if (box.top !== null) {
      y = box.top
    } else if (box.bottom !== null) {
      y = size.height - box.bottom - box.size.height
    }

    if (y < 0 || y + box.size.height > size.height) {
      hasVisualOverflow = true
    }

    box.offset = new Offset(x, y)
    return hasVisualOverflow
  }

  static getIntrinsicDimension (firstChild: AtLayoutBox, mainChildSizeGetter: (child: AtLayoutBox) => number): number {
    let extent = 0
    let child = firstChild

    while (child !== null) {
      if (!child.isPositioned) {
        extent = Math.max(extent, mainChildSizeGetter(child))
      }

      child = child.nextSibling as AtLayoutBox
    }

    return extent
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


  // => alignment
  private _alignment: AtAlignmentGeometry
  public get alignment () {
    return this._alignment
  }
  public set alignment(value: AtAlignmentGeometry) {
    invariant(value !== null)

    if (this._alignment.notEqual(value)) {
      this._alignment = value
      this.markNeedResolution()
    }
  }

  // => textDirection
  private _textDirection: TextDirection
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (value: TextDirection) {
    if (this._textDirection !== value) {
      this._textDirection = value
      this.markNeedResolution()
    }
  }

  // => fit
  private _fit: StackFit
  public get fit () {
    return this._fit
  }
  public set fit (value: StackFit) {
    invariant(value !== null)
    
    if (this._fit !== value) {
      this._fit = value
      this.markNeedsLayout()
    }
  }

  // => clipBehavior
  private _clipBehavior: Clip = At.Clip.HardEdge
  public get clipBehavior () {
    return this._clipBehavior
  }
  public set clipBehavior (value: Clip) {
    invariant(value !== null, `The argument "clipBehavior" cannot be null`)

    if (value !== this._clipBehavior) {
      this._clipBehavior = value
      this.markNeedsPaint()
    }
  }

  // => rect
  get rect () {
    return RelativeRect.fromLTRB(
      this.left ?? Infinity, 
      this.top ?? Infinity, 
      this.right ?? Infinity, 
      this.bottom ?? Infinity
    )
  }

  set rect (value: RelativeRect) {
    this.top = value.top
    this.right = value.right
    this.bottom = value.bottom
    this.left = value.left
  }

  public hasVisualOverflow: boolean = false
  public resolvedAlignment: AtAlignment | null = null
  public clipRectLayer: AtLayerHandle<AtClipRectLayer> = new AtLayerHandle<AtClipRectLayer>()

  /**
   * 构造函数
   * @param {AtLayoutBox[]} children 

   * @param {AtAlignment} alignment 
   * @param {TextDirection} textDirection 
   * @param {StackFit} fit 
   * @param {Clip} clipBehavior 
   */
  constructor (
    children: AtLayoutBox[] = [],
    alignment: AtAlignmentDirectional = AtAlignmentDirectional.topStart,
    textDirection: TextDirection = At.TextDirection.LTR,
    fit: StackFit = StackFit.Loose,
    clipBehavior: Clip = At.Clip.HardEdge,
  ) {
    super()

    this._fit = fit
    this._alignment = alignment
    this._textDirection = textDirection
    this._clipBehavior = clipBehavior 

    for (const child of children) {
      this.append(child)
    }
  }

  /**
   * 
   * @returns 
   */
  resolve () {
    if (this.resolvedAlignment !== null) {
      return
    }

    this.resolvedAlignment = this.alignment.resolve(this.textDirection)
  }

  markNeedResolution () {
    this.resolvedAlignment = null
    this.markNeedsLayout()
  }
  
  computeMinIntrinsicWidth (height: number) {
    return AtLayoutStack.getIntrinsicDimension(this.firstChild as AtLayoutBox, child => child.getMinIntrinsicWidth(height))
  }

  computeMaxIntrinsicWidth (height: number) {
    return AtLayoutStack.getIntrinsicDimension(this.firstChild as AtLayoutBox, child => child.getMaxIntrinsicWidth(height))
  }
  
  computeMinIntrinsicHeight (width: number) {
    return AtLayoutStack.getIntrinsicDimension(this.firstChild as AtLayoutBox, child => child.getMinIntrinsicHeight(width))
  }

  computeMaxIntrinsicHeight (width: number) {
    return AtLayoutStack.getIntrinsicDimension(this.firstChild as AtLayoutBox, child => child.getMaxIntrinsicHeight(width))
  }

  computeDistanceToActualBaseline (baseline: TextBaseline) {
    return this.defaultComputeDistanceToHighestActualBaseline(baseline)
  }

  computeDryLayout (constraints: AtBoxConstraints): Size {
    return this.computeSize(
      constraints,
      ChildLayout.dryLayoutChild,
    )
  }

  computeSize (constraints: AtBoxConstraints, layoutChild: ChildLayouter) {
    this.resolve()
    invariant(this.resolvedAlignment !== null, `The "this.resolvedAlignment" cannot be null.`)

    let hasNonPositionedChildren = false
    if (this.childCount === 0) {
      return constraints.biggest
        ? constraints.biggest 
        : constraints.smallest
    }

    let width = constraints.minWidth
    let height = constraints.minHeight

    let nonPositionedConstraints: AtBoxConstraints

    invariant(this.fit !== null, `The "this.fit" cannot be null.`)
    
    switch (this.fit) {
      case StackFit.Loose:
        nonPositionedConstraints = constraints.loosen()
        break
      case StackFit.Expand:
        nonPositionedConstraints = AtBoxConstraints.tight(constraints.biggest)
        break
      case StackFit.Passthrough:
        nonPositionedConstraints = constraints
        break
    }
    
    invariant(nonPositionedConstraints !== null, `The "nonPositionedConstraints" cannot be null.`)

    let child = this.firstChild
    while (child !== null) {
      if (!child.isPositioned) {
        hasNonPositionedChildren = true

        let childSize = layoutChild(child as AtLayoutBox, nonPositionedConstraints)

        width = Math.max(width, childSize.width)
        height = Math.max(height, childSize.height)
      }

      child = child.nextSibling
    }

    let size: Size
    if (hasNonPositionedChildren) {
      size = new Size(width, height)
      invariant(size.width === constraints.constrainWidth(width))
      invariant(size.height === constraints.constrainHeight(height))
    } else {
      size = constraints.biggest
    }

    invariant(size.isFinite(), `The "size" must be finite.`)
    return size
  }

  

  /**
   * 
   */
  performLayout () {
    const constraints = this.constraints
    this.hasVisualOverflow = false

    invariant(this.constraints)
    this.size = this.computeSize(constraints as AtBoxConstraints, ChildLayout.layoutChild)

    invariant(this.resolvedAlignment !== null, `The "this.resolvedAlignment" cannot be null.`)
    let child = this.firstChild as AtLayoutBox    
    
    while (child !== null) {
      if (child.isPositioned) {
        this.hasVisualOverflow = AtLayoutStack.layoutPositionedChild(child, this.size, this.resolvedAlignment) || this.hasVisualOverflow
      } else {
        invariant(child.size, `The "child.size" cannot be null.`)
        child.offset = this.resolvedAlignment.alongOffset(this.size.subtract(child.size) as Offset)
      }

      child = child.nextSibling as AtLayoutBox
    }
  }

  hitTestChildren (result: AtBoxHitTestResult, position: Offset) {
    return this.defaultHitTestChildren(result, position)
  }

  paintStack (context: AtPaintingContext, offset: Offset) {
    this.defaultPaint(context, offset)
  }

  /**
   * 
   * @param context 
   * @param offset 
   */
  paint (context: AtPaintingContext, offset: Offset) {
    invariant(this.size, `The "this.size" cannot be null.`)
    if (this.clipBehavior !== Clip.None && this.hasVisualOverflow) {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        this.offset,
        Offset.zero.and(this.size),
        (context: AtPaintingContext, offset: Offset) => this.paintStack(context, offset),
        this.clipBehavior,
        this.clipRectLayer.layer,
      )
    } else {
      this.clipRectLayer.layer = null
      this.paintStack(context, offset)
    }
  }

  describeApproximatePaintClip (child: AtLayoutObject) {
    invariant(this.size)
    switch (this.clipBehavior) {
      case Clip.None:
        return null
      case Clip.HardEdge:
      case Clip.AntiAlias:
      case Clip.AntiAliasWithSaveLayer:
        return this.hasVisualOverflow 
          ? Offset.zero.and(this.size) 
          : null
    }
  }

  dispose () {
    this.clipRectLayer.layer = null
    super.dispose()
  }
}