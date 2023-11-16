import { invariant } from '@at/utils'
import { Offset, Size } from '@at/geometry'
import { AtEngine, ClipRectLayer, LayerRef } from '@at/engine'
import { Skia } from '@at/engine'
import { Alignment, AlignmentDirectional, AlignmentGeometry } from '@at/painting'
import { Box } from './box'
import { RelativeRect } from './relative-rect'
import { BoxConstraints } from './constraints'
import { PaintingContext } from './painting-context'
import { BoxHitTestResult } from './box-hit-test'
import { ChildLayout, ChildLayouter } from './child-layout'

// => StackFitKind
// 适应方式
export enum StackFitKind {
  Loose,
  Expand,
  Passthrough,
}

export type StackOptions = {
  fit?: StackFitKind,
  alignment?: AlignmentDirectional,
  textDirection?: Skia.TextDirection,
  clipBehavior?: Skia.ClipKind,
}

export class Stack extends Box {
  static create <T extends Stack> (...rests: unknown[]): Stack
  static create (options: StackOptions, children: Box[] = []): Stack {
    return new Stack(
      children,
      options?.alignment,
      options?.textDirection,
      options?.fit,
      options?.clipBehavior
    )
  }

  // => layoutPositionedChild
  // 布局子对象
  static layoutPositionedChild (child: Box, size: Size, alignment: Alignment): boolean {
    invariant(child.isPositioned, `The child must be a positioned object.`)
    // 是否溢出
    let hasVisualOverflow = false
    // 子节点约束
    let childConstraints = new BoxConstraints()

    // 设置宽度约束
    if (child.left !== null && child.right !== null) {
      childConstraints = childConstraints.tighten(size.width - child.right - child.left)
    } else if (child.width !== null) {
      childConstraints = childConstraints.tighten(child.width)
    }

    // 设置高度约束
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
      x = alignment.alongOffset(size.substract(child.size) as unknown as Offset).dx
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
      y = alignment.alongOffset(size.substract(child.size) as unknown as Offset).dy
    }

    if (y < 0 || y + child.size.height > size.height) {
      hasVisualOverflow = true
    }

    child.offset = new Offset(x, y)

    return hasVisualOverflow
  }

  // 布局定位元素
  static layoutPositioned (box: Box, size: Size): boolean {
    invariant(box.isPositioned, `The box object must be a positiond object.`)
    
    let hasVisualOverflow = false
    let constraints = new BoxConstraints()

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

  static getIntrinsicDimension (firstChild: Box, mainChildSizeGetter: (child: Box) => number): number {
    let extent = 0
    let child = firstChild

    while (child !== null) {
      if (!child.isPositioned) {
        extent = Math.max(extent, mainChildSizeGetter(child))
      }

      child = child.nextSibling as Box
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
  private _alignment: AlignmentGeometry | null = null
  public get alignment () {
    invariant(this._alignment)
    return this._alignment
  }
  public set alignment(value: AlignmentGeometry) {
    invariant(value !== null, 'The "Stack.alignment" cannot be assigned to null.')

    if (this._alignment === null || this._alignment.notEqual(value)) {
      this._alignment = value
      this.markNeedResolution()
    }
  }

  // => textDirection
  private _textDirection: Skia.TextDirection | null = null
  public get textDirection () {
    invariant(this._textDirection)
    return this._textDirection
  }
  public set textDirection (value: Skia.TextDirection) {
    invariant(value !== null, 'The "Stack.alignment" cannot be assigned to null.')
    if (this._textDirection === null || this._textDirection !== value) {
      this._textDirection = value
      this.markNeedResolution()
    }
  }

  // => fit
  private _fit: StackFitKind | null = null
  public get fit () {
    invariant(this._fit, 'The "Stack.fit" cannot be null.')
    return this._fit
  }
  public set fit (value: StackFitKind) {
    invariant(value !== null, 'The "Stack.fit" cannot be assigned to null.')
    
    if (this._fit === null || this._fit !== value) {
      this._fit = value
      this.markNeedsLayout()
    }
  }

  // => clipBehavior
  private _clipBehavior: Skia.ClipKind = AtEngine.skia.ClipKind.HardEdge
  public get clipBehavior () {
    return this._clipBehavior
  }
  public set clipBehavior (value: Skia.ClipKind) {
    invariant(value !== null, 'The "Stack.clipBehavior" cannot be assigned to null.')
    if (this._clipBehavior === null || value !== this._clipBehavior) {
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

  // 视图有溢出
  public overflowed: boolean = false
  // 
  public resolvedAlignment: Alignment | null = null
  //
  public clipRectLayer: LayerRef<ClipRectLayer> = new LayerRef<ClipRectLayer>()

  /**
   * 构造函数
   * @param {Box[]} children 

   * @param {Alignment} alignment 
   * @param {TextDirection} textDirection 
   * @param {StackFit} fit 
   * @param {Clip} clipBehavior 
   */
  constructor (
    children: Box[] = [],
    alignment: AlignmentDirectional = AlignmentDirectional.TOP_START,
    textDirection: Skia.TextDirection = AtEngine.skia.TextDirection.LTR,
    fit: StackFitKind = StackFitKind.Loose,
    clipBehavior: Skia.ClipKind = AtEngine.skia.ClipKind.HardEdge,
  ) {
    super()

    this.fit = fit
    this.alignment = alignment
    this.textDirection = textDirection
    this.clipBehavior = clipBehavior 

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
    return Stack.getIntrinsicDimension(this.firstChild as Box, child => child.getMinIntrinsicWidth(height))
  }

  computeMaxIntrinsicWidth (height: number) {
    return Stack.getIntrinsicDimension(this.firstChild as Box, child => child.getMaxIntrinsicWidth(height))
  }
  
  computeMinIntrinsicHeight (width: number) {
    return Stack.getIntrinsicDimension(this.firstChild as Box, child => child.getMinIntrinsicHeight(width))
  }

  computeMaxIntrinsicHeight (width: number) {
    return Stack.getIntrinsicDimension(this.firstChild as Box, child => child.getMaxIntrinsicHeight(width))
  }

  computeDistanceToActualBaseline (baseline: Skia.TextBaseline) {
    return this.defaultComputeDistanceToHighestActualBaseline(baseline)
  }

  computeDryLayout (constraints: BoxConstraints): Size {
    return this.computeSize(
      constraints,
      ChildLayout.dryLayoutChild,
    )
  }

  computeSize (constraints: BoxConstraints, layoutChild: ChildLayouter) {
    this.resolve()
    invariant(this.resolvedAlignment !== null, `The "this.resolvedAlignment" cannot be null.`)

    let hasNonPositionedChildren = false
    if (this.count === 0) {
      return constraints.biggest
        ? constraints.biggest 
        : constraints.smallest
    }

    let width = constraints.minWidth
    let height = constraints.minHeight

    let nonPositionedConstraints: BoxConstraints

    invariant(this.fit !== null, `The "this.fit" cannot be null.`)
    
    switch (this.fit) {
      case StackFitKind.Loose:
        nonPositionedConstraints = constraints.loosen()
        break
      case StackFitKind.Expand:
        nonPositionedConstraints = BoxConstraints.tight(constraints.biggest)
        break
      case StackFitKind.Passthrough:
        nonPositionedConstraints = constraints
        break
    }
    
    invariant(nonPositionedConstraints !== null, `The "nonPositionedConstraints" cannot be null.`)

    let child = this.firstChild
    while (child !== null) {
      if (!child.isPositioned) {
        hasNonPositionedChildren = true

        let childSize = layoutChild(child as Box, nonPositionedConstraints)

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

    invariant(size.isFinite, `The "size" must be finite.`)
    return size
  }

  /**
   * 
   */
  performLayout () {
    const constraints = this.constraints
    this.overflowed = false

    invariant(this.constraints)
    this.size = this.computeSize(constraints as BoxConstraints, ChildLayout.layoutChild)

    invariant(this.resolvedAlignment !== null, `The "this.resolvedAlignment" cannot be null.`)
    let child = this.firstChild as Box    
    
    while (child !== null) {
      if (child.isPositioned) {
        this.overflowed = Stack.layoutPositionedChild(child, this.size, this.resolvedAlignment) || this.overflowed
      } else {
        invariant(child.size, `The "child.size" cannot be null.`)
        child.offset = this.resolvedAlignment.alongOffset(this.size.substract(child.size) as unknown as Offset)
      }

      child = child.nextSibling as Box
    }
  }

  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    return this.defaultHitTestChildren(result, position)
  }

  paintStack (context: PaintingContext, offset: Offset) {
    this.defaultPaint(context, offset)
  }

  /**
   * 
   * @param context 
   * @param offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    invariant(this.size, `The "this.size" cannot be null.`)
    if (this.clipBehavior !== AtEngine.skia.ClipKind.None && this.overflowed) {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        this.offset,
        Offset.ZERO.and(this.size),
        (context: PaintingContext, offset: Offset) => this.paintStack(context, offset),
        this.clipBehavior,
        this.clipRectLayer.layer,
      )
    } else {
      this.clipRectLayer.layer = null
      this.paintStack(context, offset)
    }
  }

  describeApproximatePaintClip (child: object) {
    invariant(this.size)
    switch (this.clipBehavior) {
      case Skia.ClipKind.None:
        return null
      case Skia.ClipKind.HardEdge:
      case Skia.ClipKind.AntiAlias:
      case Skia.ClipKind.AntiAliasWithSaveLayer:
        return this.overflowed 
          ? Offset.ZERO.and(this.size) 
          : null
    }
  }

  dispose () {
    super.dispose()
    this.clipRectLayer.dispose()
    this.clipRectLayer.layer = null
  }
}