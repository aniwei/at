import { ClipRectLayer, Engine, LayerRef, Skia } from '@at/engine'
import { Offset, Size } from '@at/geometry'
import { invariant } from '@at/utils'
import { Box } from './box'
import { BoxConstraints } from './constraints'
import { LayoutChildHandle } from './stack-box'
import { FlexFit, Flexible } from './flexible'
import { PaintingContext } from './painting-context'
import { BoxHitTestResult } from './box-hit-test'

/// => LayoutSizes
// flex 布局计算结果结构
export interface LayoutSizes {
  mainSize: number
  crossSize: number
  allocatedSize: number
}

/// => CrossAxisAlignment
// 侧轴
export enum CrossAxisAlignment {
  Start,
  End,
  Center,
  Stretch,
  Baseline,
}

/// => MainAxisAlignment
// 主轴
export enum MainAxisAlignment {
  Start,
  End,
  Center,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly,
}

/// => MainAxisSize
// 主轴大小
export enum MainAxisSize {
  Min,
  Max,
}

//// => Flex
export interface FlexOptions {
  children?: Flexible[],
  direction?: Skia.Axis.Horizontal,
  mainAxisSize?: MainAxisSize,
  mainAxisAlignment?: MainAxisAlignment,
  crossAxisAlignment?: CrossAxisAlignment,
  textDirection?: Skia.TextDirection,
  verticalDirection?: Skia.VerticalDirection,
  textBaseline?: Skia.TextBaseline,
  clipBehavior?: Skia.Clip,
}

export class Flex extends Box {
  static create (options: FlexOptions) {
    return new Flex(
      options.children ?? [],
      options.direction,
      options.mainAxisSize,
      options.mainAxisAlignment,
      options.crossAxisAlignment,
      options.textDirection,
      options.verticalDirection,
      options.textBaseline,
      options.clipBehavior,
    )
  }

  // => direction
  // 布局方向
  protected _direction: Skia.Axis = Skia.Axis.Horizontal
  public get direction () {
    return this._direction
  }
  public set direction (direction: Skia.Axis) {
    if (this._direction !== direction) {
      this._direction = direction
      this.markNeedsLayout()
    }
  }

  // => textDirection
  // 文本方向
  protected _textDirection: Skia.TextDirection | null = null
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (textDirection: Skia.TextDirection | null) {
    if (
      this._textDirection !== null || 
      this._textDirection !== textDirection
    ) {
      this._textDirection = textDirection
      this.markNeedsLayout()
    }
  }

  // => textBaseline
  // 文本基线
  protected _textBaseline: Skia.TextBaseline | null = null
  public get textBaseline () {
    return this._textBaseline
  }
  public set textBaseline (textBaseline: Skia.TextBaseline | null) {
    if (
      this._textBaseline === null || 
      this._textBaseline !== textBaseline
    ) {
      this._textBaseline = textBaseline
      this.markNeedsLayout()
    }
  }

  // => crossAxisAlignment
  // 侧轴对其方式
  protected _crossAxisAlignment: CrossAxisAlignment  = CrossAxisAlignment.Center
  public get crossAxisAlignment () {
    return this._crossAxisAlignment
  }
  public set crossAxisAlignment (crossAxisAlignment: CrossAxisAlignment) {
    invariant((crossAxisAlignment ?? null) !== null)
    if (this._crossAxisAlignment !== crossAxisAlignment) {
      this._crossAxisAlignment = crossAxisAlignment
      this.markNeedsLayout()
    }
  }

  // => verticalDirection
  protected _verticalDirection: Skia.VerticalDirection = Skia.VerticalDirection.Down
  public get verticalDirection () {
    return this._verticalDirection
  }
  public set verticalDirection (verticalDirection: Skia.VerticalDirection) {
    if (this._verticalDirection !== verticalDirection) {
      this._verticalDirection = verticalDirection
      this.markNeedsLayout()
    }
  }

  // => clipBehavior
  // 裁剪方式
  protected _clipBehavior: Skia.Clip = Skia.Clip.None
  public get clipBehavior () {
    return this._clipBehavior
  }
  public set clipBehavior (clipBehavior: Skia.Clip) {
    if (this.clipBehavior !== clipBehavior) {
      this._clipBehavior = clipBehavior
      this.markNeedsPaint()
    }
  }
  
  // => overflowed
  public get overflowed () {
    return this.overflow > Engine.env<number>('ATKIT_PRECISION_ERROR_TOLERANCE', 1e-10)
  }

  // => canComputeIntrinsics
  public get canComputeIntrinsics () {
    return this.crossAxisAlignment !== CrossAxisAlignment.Baseline
  }

  public overflow: number = 0
  public clipRectLayer: LayerRef<ClipRectLayer>  = LayerRef.create<ClipRectLayer>()
  public mainAxisSize: MainAxisSize = MainAxisSize.Max
  public mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.Center

  constructor (
    children: Flexible[],
    direction: Skia.Axis = Skia.Axis.Horizontal,
    mainAxisSize: MainAxisSize = MainAxisSize.Max,
    mainAxisAlignment: MainAxisAlignment  = MainAxisAlignment.Start,
    crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.Center,
    textDirection: Skia.TextDirection | null = null,
    verticalDirection: Skia.VerticalDirection = Engine.skia.VerticalDirection.Down,
    textBaseline: Skia.TextBaseline | null = null,
    clipBehavior: Skia.Clip = Engine.skia.Clip.None,
  ) {
    super(children)
    this.direction = direction
    this.mainAxisSize = mainAxisSize
    this.mainAxisAlignment = mainAxisAlignment
    this.crossAxisAlignment = crossAxisAlignment
    this.textDirection = textDirection
    this.verticalDirection = verticalDirection
    this.textBaseline = textBaseline
    this.clipBehavior = clipBehavior
  }

  /**
   * 主轴
   * @param {Size} size 
   * @returns {number}
   */
  getMainSize (size: Size) {
    switch (this.direction) {
      case Engine.skia.Axis.Horizontal:
        return size.width
      case Engine.skia.Axis.Vertical:
        return size.height
    }
  }


  /**
   * 侧轴
   * @param {Size} size 
   * @returns {number}
   */
  getCrossSize (size: Size) {
    switch (this.direction) {
      case Engine.skia.Axis.Horizontal:
        return size.height
      case Engine.skia.Axis.Vertical:
        return size.width
    }
  }

  /**
   * 计算大小
   * @param {BoxConstraints} constraints 
   * @param {LayoutChildHandle} layoutChild 
   * @returns {LayoutSizes}
   */
  computeSizes (
    constraints: BoxConstraints, 
    layoutChild: LayoutChildHandle
  ) {
    invariant(constraints !== null, 'The argument "constraints" cannot be null.')

    // 纵向布局
    // 计算宽高
    const maxMainSize = this.direction === Skia.Axis.Horizontal 
      ? constraints.maxWidth 
      : constraints.maxHeight

    const canFlex = maxMainSize < Number.POSITIVE_INFINITY

    // 侧轴大小
    let crossSize: number = 0.0
    // 主轴大小
    let allocatedSize: number = 0.0
    let child: Flexible | null = this.firstChild as Flexible
    
    let lastFlexChild: Flexible | null = null
    let totalFlex: number = 0
    
    while (child !== null) {
      const flex = child.flex
      // 计算子节点 flex 
      if (flex > 0) {
        totalFlex += flex
        lastFlexChild = child
      } else {
        let inner: BoxConstraints | null = null

        // 计算约束
        // 侧轴对其方式
        if (this.crossAxisAlignment === CrossAxisAlignment.Stretch) {
          switch (this.direction) {
            case Skia.Axis.Horizontal:
              inner = BoxConstraints.tightFor(null, constraints.maxHeight)
              break
            case Skia.Axis.Vertical:
              inner = BoxConstraints.tightFor(constraints.maxWidth, null)
              break
          }
        } else {
          switch (this.direction) {
            case Skia.Axis.Horizontal:
              inner = BoxConstraints.create({ 
                maxHeight: constraints.maxHeight
              })
              break
            case Skia.Axis.Vertical:
              inner = BoxConstraints.create({ 
                maxWidth: constraints.maxWidth
              })
              break
          }
        }

        // 布局子节点
        const size = layoutChild(child, inner)
        allocatedSize += this.getMainSize(size)
        crossSize = Math.max(crossSize, this.getCrossSize(size))
      }
      
      child = child.nextSibling as Flexible ?? null
    }

    // 计算间距
    const freeSpace = Math.max(0.0, (canFlex ? maxMainSize : 0.0) - allocatedSize)
    let allocatedFlexSpace = 0.0

    if (totalFlex > 0) {
      const spacePerFlex = canFlex 
        ? (freeSpace / totalFlex) 
        : Number.NaN

      let child: Flexible | null = this.firstChild as Flexible

      while (child !== null) {
        const flex = child.flex

        if (flex > 0) {
          const maxChildExtent = canFlex 
            ? (
                child === lastFlexChild 
                  ? (freeSpace - allocatedFlexSpace) 
                  : spacePerFlex * flex
              ) 
            : Number.POSITIVE_INFINITY

          let minChildExtent: number | null = null

          switch (child.fit) {
            case FlexFit.Tight:
              invariant(maxChildExtent < Number.POSITIVE_INFINITY)
              minChildExtent = maxChildExtent
              break
            case FlexFit.Loose:
              minChildExtent = 0.0
              break
          }
          
          invariant(minChildExtent !== null, 'The var "minChildExtent" cannot be null.')

          let inner: BoxConstraints | null = null

          if (this.crossAxisAlignment === CrossAxisAlignment.Stretch) {
            switch (this.direction) {
              case Engine.skia.Axis.Horizontal:
                inner = BoxConstraints.create({
                  minWidth: minChildExtent,
                  maxWidth: maxChildExtent,
                  minHeight: constraints.maxHeight,
                  maxHeight: constraints.maxHeight,
                })
                break
              case Engine.skia.Axis.Vertical:
                inner = BoxConstraints.create({
                  minWidth: constraints.maxWidth,
                  maxWidth: constraints.maxWidth,
                  minHeight: minChildExtent,
                  maxHeight: maxChildExtent,
                })
                break
            }
          } else {
            switch (this.direction) {
              case Engine.skia.Axis.Horizontal:
                inner = BoxConstraints.create({
                  minWidth: minChildExtent,
                  maxWidth: maxChildExtent,
                  maxHeight: constraints.maxHeight,
                })
                break
              case Engine.skia.Axis.Vertical:
                inner = BoxConstraints.create({
                  maxWidth: constraints.maxWidth,
                  minHeight: minChildExtent,
                  maxHeight: maxChildExtent,
                })
                break
            }
          }

          const size = layoutChild(child, inner as BoxConstraints)
          const childMainSize = this.getMainSize(size)
          invariant(childMainSize <= maxChildExtent)

          allocatedSize += childMainSize
          allocatedFlexSpace += maxChildExtent
          crossSize = Math.max(crossSize, this.getCrossSize(size))
        }

        child = child.nextSibling as Flexible ?? null
      }
    }

    const idealSize = canFlex && this.mainAxisSize === MainAxisSize.Max 
      ? maxMainSize 
      : allocatedSize
    
    return {
      mainSize: idealSize,
      crossSize: crossSize,
      allocatedSize: allocatedSize,
    }
  }

  /**
   * 
   * @param {BoxConstraints} constraints 
   * @returns {Size}
   */
  computeDryLayout (constraints: BoxConstraints) {
    if (!this.canComputeIntrinsics) {
      return Size.ZERO
    }
   
    const sizes = this.computeSizes(constraints, (child) => child.getDryLayout(constraints))

    switch (this.direction) {
      case Engine.skia.Axis.Horizontal:
        return constraints.constrain(Size.create(sizes.mainSize, sizes.crossSize))
      case Engine.skia.Axis.Vertical:
        return constraints.constrain(Size.create(sizes.crossSize, sizes.mainSize))
    }
  }

  /**
   * 计算布局
   */
  performLayout () {
    const constraints = this.constraints as BoxConstraints
    
    const sizes = this.computeSizes(constraints, (child: Box, constraints: BoxConstraints) => {
      child.layout(constraints, true)
      invariant(child.size, `The "child.size" cannot be null.`)
      return child.size
    })

    const allocatedSize = sizes.allocatedSize
    let actualSize = sizes.mainSize
    let crossSize = sizes.crossSize
    let maxBaselineDistance = 0.0

    if (this.crossAxisAlignment == CrossAxisAlignment.Baseline) {
      let child: Flexible | null = this.firstChild as Flexible ?? null
      let maxSizeAboveBaseline = 0
      let maxSizeBelowBaseline = 0

      while (child !== null) {
        invariant(this.textBaseline)
        const distance = child.getDistanceToBaseline(this.textBaseline, true) ?? null
        if (distance !== null) {
          invariant(child.size)
          maxBaselineDistance = Math.max(maxBaselineDistance, distance)
          maxSizeAboveBaseline = Math.max(distance, maxSizeAboveBaseline)
          maxSizeBelowBaseline = Math.max(
            child.size.height - distance,
            maxSizeBelowBaseline,
          )

          crossSize = Math.max(maxSizeAboveBaseline + maxSizeBelowBaseline, crossSize)
        }
        
        
        child = child.nextSibling as Flexible ?? null
      }
    }

    switch (this.direction) {
      case Engine.skia.Axis.Horizontal:
        this.size = constraints.constrain(Size.create(actualSize, crossSize))
        
        invariant(this.size, 'The "Flex.size" cannot be null.')
        
        actualSize = this.size.width
        crossSize = this.size.height
        break;
      case Engine.skia.Axis.Vertical:
        this.size = constraints.constrain(Size.create(crossSize, actualSize))
        
        invariant(this.size, 'The "Flex.size" cannot be null.')
        
        actualSize = this.size.height
        crossSize = this.size.width
        break
    }
    
    const actualSizeDelta = actualSize - allocatedSize
    
    this.overflow = Math.max(0.0, -actualSizeDelta)
    
    const remainingSpace = Math.max(0.0, actualSizeDelta)
    let leadingSpace: number | null = null
    let betweenSpace: number | null = null
    
    const flipMainAxis = !(startIsTopLeft(this.direction, this.textDirection, this.verticalDirection) ?? true)
    
    switch (this.mainAxisAlignment) {
      case MainAxisAlignment.Start:
        leadingSpace = 0.0
        betweenSpace = 0.0
        break
      case MainAxisAlignment.End:
        leadingSpace = remainingSpace
        betweenSpace = 0.0
        break
      case MainAxisAlignment.Center:
        leadingSpace = remainingSpace / 2.0
        betweenSpace = 0.0
        break
      case MainAxisAlignment.SpaceBetween:
        leadingSpace = 0.0
        betweenSpace = this.count > 1 
          ? remainingSpace / (this.count - 1) 
          : 0.0
        break
      case MainAxisAlignment.SpaceAround:
        betweenSpace = this.count > 0 
          ? remainingSpace / this.count 
          : 0.0
        leadingSpace = betweenSpace / 2.0
        break
      case MainAxisAlignment.SpaceEvenly:
        betweenSpace = this.count > 0 
          ? remainingSpace / (this.count + 1) 
          : 0.0
        leadingSpace = betweenSpace
        break
    }

    invariant(leadingSpace !== null, 'The leadingSpace cannot be null.')

    let childMainPosition = flipMainAxis 
      ? actualSize - leadingSpace 
      : leadingSpace
    
    let child: Flexible | null = this.firstChild as Flexible
    
    while (child !== null) {
      let childCrossPosition: number | null = null
      invariant(child.size !== null)
      switch (this.crossAxisAlignment) {
        case CrossAxisAlignment.Start:
        case CrossAxisAlignment.End:
          childCrossPosition = startIsTopLeft(
            flipAxis(this.direction), 
            this.textDirection, 
            this.verticalDirection
          ) === (this.crossAxisAlignment === CrossAxisAlignment.Start)
            ? 0.0
            : crossSize - this.getCrossSize(child.size)
          break
        case CrossAxisAlignment.Center:
          childCrossPosition = crossSize / 2.0 - this.getCrossSize(child.size) / 2.0
          break
        case CrossAxisAlignment.Stretch:
          childCrossPosition = 0.0
          break
        case CrossAxisAlignment.Baseline:
          if (this.direction === Skia.Axis.Horizontal) {
            invariant(this.textBaseline !== null)
            const distance = child.getDistanceToBaseline(this.textBaseline, true) ?? null
            if (distance !== null) {
              childCrossPosition = maxBaselineDistance - distance
            } else {
              childCrossPosition = 0.0
            }
          } else {
            childCrossPosition = 0.0
          }
          break
      }

      if (flipMainAxis) {
        childMainPosition -= this.getMainSize(child.size)
      }

      switch (this.direction) {
        case Engine.skia.Axis.Horizontal:
          child.offset = Offset.create(childMainPosition, childCrossPosition)
          break
        case Engine.skia.Axis.Vertical:
          child.offset = Offset.create(childCrossPosition, childMainPosition)
          break
      }

      invariant(betweenSpace !== null, 'The betweenSpace cannot be null.')

      if (flipMainAxis) {
        childMainPosition -= betweenSpace
      } else {
        childMainPosition += this.getMainSize(child.size) + betweenSpace
      }
      
      child = child.nextSibling as Flexible ?? null
    }
  }

  paint (context: PaintingContext, offset: Offset) {
    if (!this.overflowed) {
      return this.defaultPaint(context, offset)
    }

    invariant(this.size !== null, 'The "Flex.size" cannot be null.')

    if (this.size.isEmpty) {
      return
    }

    invariant(this.clipBehavior !== null)

    if (this.clipBehavior === Skia.Clip.None) {
      this.clipRectLayer.layer = null
      this.defaultPaint(context, offset)
    } else {
      this.clipRectLayer.layer = context.pushClipRect(
        this.needsCompositing,
        offset,
        Offset.ZERO.and(this.size),
        this.defaultPaint,
        this.clipBehavior,
        this.clipRectLayer.layer,
      );
    }
  }

  hitTestChildren (result: BoxHitTestResult, position: Offset) {
    return this.defaultHitTestChildren(result, position)
  }

  dispose () {
    this.clipRectLayer.layer = null
    super.dispose()
  }
}


//// => Column
// 垂直布局
export interface ColumnOptions extends FlexOptions { }

export class Column extends Flex {
  static create (options: FlexOptions) {
    return new Column(
      options.children ?? [],
      Engine.skia.Axis.Vertical,
      options.mainAxisSize,
      options.mainAxisAlignment,
      options.crossAxisAlignment,
      options.textDirection,
      options.verticalDirection,
      options.textBaseline,
      options.clipBehavior,
    )
  }
}

//// => Row
// 水平布局
export interface RowOptions extends FlexOptions { }

export class Row extends Flex {
  static create (options: FlexOptions) {
    return new Row(
      options.children ?? [],
      Engine.skia.Axis.Horizontal,
      options.mainAxisSize,
      options.mainAxisAlignment,
      options.crossAxisAlignment,
      options.textDirection,
      options.verticalDirection,
      options.textBaseline,
      options.clipBehavior,
    )
  }
}

/**
 * 
 * @param {Skia.Axis} direction 
 * @param {Skia.TextDirection | null} textDirection 
 * @param {Skia.VerticalDirection | null} verticalDirection 
 * @returns {boolean | null}
 */
const startIsTopLeft = (
  direction: Skia.Axis, 
  textDirection: Skia.TextDirection | null, 
  verticalDirection: Skia.VerticalDirection | null
) => {
  switch (direction) {
    case Engine.skia.Axis.Horizontal:
      switch (textDirection) {
        case Engine.skia.TextDirection.LTR:
          return true
        case Engine.skia.TextDirection.RTL:
          return false
        case null:
          return null
      }
      break
    case Engine.skia.Axis.Horizontal:
      switch (verticalDirection) {
        case Engine.skia.VerticalDirection.Down:
          return true
        case Engine.skia.VerticalDirection.Up:
          return false
        case null:
          return null
      }
      break
  }
}

/**
 * 反转
 * @param {Skia.Axis} direction 
 * @returns {Skia.Axis}
 */
const flipAxis = (direction: Skia.Axis) => {
  switch (direction) {
    case Engine.skia.Axis.Horizontal:
      return Engine.skia.Axis.Vertical
    case Engine.skia.Axis.Vertical:
      return Engine.skia.Axis.Horizontal
  }
}


