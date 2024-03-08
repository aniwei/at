import { invariant } from '@at/utils'
import { Offset, Size } from '@at/geometry'
import { Engine, ClipRectLayer, LayerRef } from '@at/engine'
import { Skia } from '@at/engine'
import { 
  Alignment, 
  AlignmentDirectional, 
  AlignmentGeometry 
} from '@at/painting'
import { Box } from './box'
import { BoxConstraints } from './constraints'
import { PaintingContext } from './painting-context'
import { BoxHitTestResult } from './box-hit-test'
import { PositionedBox } from './positioned-box'

// => Child Layout
export type ChildLayoutHandle = (child: Box, constraints: BoxConstraints) => Size
export type LayoutChildHandle = (child: Box, constraints: BoxConstraints) => Size

// => StackFitKind
// 适应方式
export enum StackFitKind {
  Loose,
  Expand,
  Passthrough,
}

//// => Stack
export type StackBoxOptions = {
  fit?: StackFitKind,
  alignment?: AlignmentDirectional,
  textDirection?: Skia.TextDirection,
  clipBehavior?: Skia.Clip,
}

export class StackBox extends Box {
  static create <T extends StackBox> (...rests: unknown[]): StackBox
  /**
   * 创建 Stack 对象
   * @param {StackBoxOptions} options 
   * @param {Box[]} children 
   * @returns {Stack}
   */
  static create (options: StackBoxOptions, children: Box[] = []): StackBox {
    return new StackBox(
      children,
      options?.alignment,
      options?.textDirection,
      options?.fit,
      options?.clipBehavior
    )
  }

  /**
   * 布局定位节点
   * @param {Positioned} child 
   * @param {Size} size 
   * @param {Alignment} alignment 
   * @returns {boolean}
   */
  // => layoutPositionedChild
  // 布局子对象
  static layoutPositionedChild (child: PositionedBox, size: Size, alignment: Alignment): boolean {
    invariant(child.positioned, `The "child" must be a positioned object.`)
    // 是否溢出
    let overflowed = false
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
      const s = size.subtract(child.size)
      x = alignment.alongOffset(Offset.create(s.width, s.height)).dx
    }

    if (
      x < 0.0 || // 负数
      x + child.size.width > size.width //超出
    ) {
      overflowed = true
    }

    let y: number = 0
    if (child.top !== null) {
      y = child.top
    } else if (child.bottom !== null) {
      y = size.height - child.bottom - child.size.height
    } else {
      const s = size.subtract(child.size)
      y = alignment.alongOffset(Offset.create(s.width, s.height)).dy
    }

    if (y < 0 || y + child.size.height > size.height) {
      overflowed = true
    }

    child.offset = Offset.create(x, y)
    return overflowed
  }

  /**
   * 布局定位
   * @param {Positioned} box 
   * @param {Size} size 
   * @returns {boolean}
   */
  // 布局定位元素
  // 需要根据父层来计算
  static layoutPositioned (box: PositionedBox, size: Size): boolean {
    invariant(box.positioned, `The box object must be a positiond object.`)
    
    let overflowed = false
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

    // box.layout(constraints, true)
    invariant(box.size, `The "box.size" cannot be null after layouted.`)

    let x: number = 0
    if (box.left !== null) {
      x = box.left
    } else if (box.right !== null) {
      x = size.width - box.right - box.size.width
    } 

    if (x < 0.0 || x + box.size.width > size.width) {
      overflowed = true
    }

    let y: number = 0
    if (box.top !== null) {
      y = box.top
    } else if (box.bottom !== null) {
      y = size.height - box.bottom - box.size.height
    }

    if (y < 0 || y + box.size.height > size.height) {
      overflowed = true
    }

    box.offset = new Offset(x, y)
    return overflowed
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
  // 布局方式
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
  private _fit: StackFitKind | null = StackFitKind.Expand
  public get fit () {
    invariant(this._fit !== null, 'The "Stack.fit" cannot be null.')
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
  private _clipBehavior: Skia.Clip = Engine.skia.Clip.HardEdge
  public get clipBehavior () {
    return this._clipBehavior
  }
  public set clipBehavior (value: Skia.Clip) {
    invariant(value !== null, 'The "Stack.clipBehavior" cannot be assigned to null.')
    if (this._clipBehavior === null || value !== this._clipBehavior) {
      this._clipBehavior = value
      this.markNeedsPaint()
    }
  }

  // 视图有溢出
  public overflowed: boolean = false
  // 
  public resolvedAlignment: Alignment | null = null
  //
  public clipRectLayer: LayerRef<ClipRectLayer> = new LayerRef<ClipRectLayer>()

  constructor (...rests: unknown[])
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
    textDirection: Skia.TextDirection = Engine.skia.TextDirection.LTR,
    fit: StackFitKind = StackFitKind.Loose,
    clipBehavior: Skia.Clip = Engine.skia.Clip.HardEdge,
    ...rests: unknown[]
  ) {
    super(...rests)

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

  computeDistanceToActualBaseline (baseline: Skia.TextBaseline) {
    return this.defaultComputeDistanceToHighestActualBaseline(baseline)
  }

  /**
   * 计算布局
   * @param {BoxConstraints} constraints 
   * @returns {Size}
   */
  computeDryLayout (constraints: BoxConstraints): Size {
    return this.computeSize(
      constraints,
      (child: Box, constraints: BoxConstraints) => child.getDryLayout(constraints),
    )
  }

  /**
   * 计算大小
   * @param {BoxConstraints} constraints 
   * @param {ChildLayoutHandle} layoutChild 
   * @returns 
   */
  computeSize (
    constraints: BoxConstraints, 
    layoutChild: ChildLayoutHandle
  ) {
    this.resolve()
    invariant(this.resolvedAlignment !== null, `The "Stack.resolvedAlignment" cannot be null.`)

    let hasNonPositionedChildren = false
    
    if (this.count === 0) {
      return constraints.biggest ? constraints.biggest : constraints.smallest
    }

    let width = constraints.minWidth
    let height = constraints.minHeight

    let nonPositionedConstraints: BoxConstraints

    invariant(this.fit !== null, `The "Stack.fit" cannot be null.`)
    
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
      if (!child.positioned) {
        hasNonPositionedChildren = true
        let size = layoutChild(child as Box, nonPositionedConstraints)

        width = Math.max(width, size.width)
        height = Math.max(height, size.height)
      }

      child = child.nextSibling
    }

    const size: Size = hasNonPositionedChildren 
      ? Size.create(width, height) 
      : constraints.biggest

    return size
  }

  /**
   * 计算布局
   */
  performLayout () {
    const constraints = this.constraints
    this.overflowed = false

    invariant(this.constraints)
    this.size = this.computeSize(constraints as BoxConstraints, (child: Box, constraints: BoxConstraints) => {
      child.layout(constraints, true)
      invariant(child.size, 'The "Box.size" cannot be null after layouted.')
      return child.size
    })

    invariant(this.resolvedAlignment !== null, `The "Box.resolvedAlignment" cannot be null.`)
    let child = this.firstChild as Box    
    
    while (child !== null) {
      if (child.positioned) {
        this.overflowed = StackBox.layoutPositionedChild(child as PositionedBox, this.size, this.resolvedAlignment) || this.overflowed
      } else {
        invariant(child.size, `The "Box.size" cannot be null.`)
        child.offset = this.resolvedAlignment.alongOffset(this.size.subtract(child.size) as unknown as Offset)
      }

      child = child.nextSibling as Box
    }
  }

  /**
   * 绘制
   * @param context 
   * @param offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    invariant(this.size, `The "Box.size" cannot be null.`)
    if (this.clipBehavior !== Engine.skia.Clip.None && this.overflowed) {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        this.offset,
        Offset.ZERO.and(this.size),
        (context: PaintingContext, offset: Offset) => this.defaultPaint(context, offset),
        this.clipBehavior,
        this.clipRectLayer.layer,
      )
    } else {
      this.clipRectLayer.layer = null
      this.defaultPaint(context, offset)
    }
  }

  describeApproximatePaintClip (child: object) {
    invariant(this.size)
    switch (this.clipBehavior) {
      case Skia.Clip.None:
        return null
      case Skia.Clip.HardEdge:
      case Skia.Clip.AntiAlias:
      case Skia.Clip.AntiAliasWithSaveLayer:
        return this.overflowed 
          ? Offset.ZERO.and(this.size) 
          : null
    }
  }

  /**
   * 碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    return this.defaultHitTestChildren(result, position)
  }

  /**
   * 
   */
  dispose () {
    super.dispose()
    this.clipRectLayer.dispose()
    this.clipRectLayer.layer = null
  }
}