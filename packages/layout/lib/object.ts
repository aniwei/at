import { invariant } from '@at/utils'
import { Matrix4 } from '@at/math'
import { AbstractNode } from '@at/basic'
import { Offset, Rect, Size } from '@at/geometry'
import { ContainerLayer, LayerRef, OffsetLayer } from '@at/engine'
import { HitTestEntry, HitTestResult, HitTestTarget } from '@at/gesture'

import { PipelineOwner } from './pipeline-owner'
import { Constraints } from './constraints'
import { PaintingContext } from './painting-context'
import { LayoutError } from './layout-error'
import { ResizeError } from './resize-error'
import type { SanitizedPointerEvent } from '@at/gesture'

export type ObjectVisitorHandle = (child: Object) => void

//// => Object
export interface ObjectFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class Object extends AbstractNode<Object> implements HitTestTarget {
  static create <T extends Object> (...rests: unknown[]): Object {
    const ObjectFactory = this as unknown as ObjectFactory<T>
    return new ObjectFactory(...rests) as Object
  }

  /**
   * 清除子对象布局边界
   * @param child 
   */
  static cleanChildRelayoutBoundary (child: Object) {
    child.cleanRelayoutBoundary()
  }

  // => child
  // 子对象
  public get child () {
    return this.firstChild
  }
  public set child (child: Object | null) {
    if (this.child !== null) {
      this.dropChild(this.child)
    }
    // this._child = child
    if (this.child !== null) {
      this.adoptChild(this.child)
    }
  }

  // => positioned
  // 是否是定位元素
  public get positioned () {
    return false
  }

  // => layer
  // 绘制层
  public get layer () {
    invariant(
      this.isRepaintBoundary ||
      this.layerRef.layer === null ||
      this.layerRef.layer instanceof OffsetLayer,
      `Cannot get the layer.`
    )

    return this.layerRef.layer
  }
  public set layer (layer: ContainerLayer | null) {
    invariant(!this.isRepaintBoundary)
    this.layerRef.layer = layer
  }

  /// => 对象相关
  // 子对象个数
  public count: number = 0
  // 第一个子对象
  public firstChild: Object | null = null
  // 最后一个子对象
  public lastChild: Object | null = null
  // 上一个子对象
  public previousSibling: Object | null = null
  // 下一个子对象
  public nextSibling: Object | null = null

  /// => 对象引用相关
  // 绘制管线
  public owner: PipelineOwner | null = null
  // 绘制层
  public layerRef: LayerRef<ContainerLayer> = new LayerRef<ContainerLayer>()

  /// => 对象状态相关
  // 需要布局
  public needsLayout: boolean = true
  // 需要绘制
  public needsPaint: boolean = true
  
  ////=> 绘制相关
  // 绘制边界对象
  public relayoutBoundary: Object | null = null
  // 父控制大小
  public sizedByParent: boolean = false
  // 是否是绘制边界元素
  public isRepaintBoundary: boolean = false
  public alwaysNeedsCompositing: boolean = false
  public needsCompositingBitsUpdate: boolean = false
  
  // 约束
  public constraints: Constraints | null = null
  public needsCompositing: boolean = this.isRepaintBoundary || this.alwaysNeedsCompositing
  // 元素大小位置
  abstract bounds: Rect

  abstract performResize (): void

  abstract performLayout (): void
  abstract performLayout (size?: Size): void

  /**
   * 
   * @param {HitTestResult} result 
   * @param {...unknown[]} rest 
   */
  // 点击碰撞
  abstract hitTest (result: HitTestResult, ...rest: unknown[]): void
  
  /**
   * 事件处理
   * @param {SanitizedPointerEvent} event 
   * @param {HitTestEntry} entry 
   */
  abstract handleEvent(event: SanitizedPointerEvent, entry: HitTestEntry): void

  /**
   * 布局
   * @param {Constraints} constraints 
   * @param {boolean} parentUsesSize 
   * @returns 
   */
  layout (constraints: Constraints, parentUsesSize: boolean = false) {
    invariant(this.parent !== null)

    const isRelayoutBoundary = !parentUsesSize || constraints.tight || this.sizedByParent
    const relayoutBoundary = isRelayoutBoundary 
      ? this 
      : this.parent.relayoutBoundary

    if (
      !this.needsLayout &&
      this.constraints?.notEqual(constraints)
    ) {
      if (this.relayoutBoundary !== relayoutBoundary) {
        this.relayoutBoundary = relayoutBoundary
        // this.visit((child) => child.)
      }

      return
    }

    this.constraints = constraints
    if (this.relayoutBoundary !== null && relayoutBoundary !== this.relayoutBoundary) {
      this.visit(Object.cleanChildRelayoutBoundary)
    }

    this.relayoutBoundary = relayoutBoundary
    
    if (this.sizedByParent) {
      try {
        this.performResize()
      } catch (error: any) {
        throw new ResizeError(error.message)
      }
    }
    
    try {
      this.performLayout()
    } catch (error: any) {
      throw new LayoutError(error.message)
    }
    
    this.needsLayout = false
    this.markNeedsPaint()
  }

  layoutWithoutResize () {
    invariant(this.relayoutBoundary === this, `The "Object.relayoutBoundary" must be equal "this".`)
    
    try {
      this.performLayout()
    } catch (error: any) {
      throw error
    }
    
    this.needsLayout = false
    this.markNeedsPaint()
  }

  updateCompositingBits () {
    if (!this.needsCompositingBitsUpdate) {
      return
    }

    let oldNeedsCompositing = this.needsCompositing
    this.needsCompositing = false

    // @TODO
    // for (const child of this.children) {
    //   child.updateCompositingBits()

    //   if (child.needsCompositing) {
    //     this.needsCompositing = true
    //   }
    // }

    if (this.isRepaintBoundary || this.alwaysNeedsCompositing) {
      this.needsCompositing = true
    }

    if (oldNeedsCompositing !== this.needsCompositing) {
      this.markNeedsPaint()
    }

    this.needsCompositingBitsUpdate = false
  }

  /**
   * 
   */
  cleanRelayoutBoundary () {
    if (this.relayoutBoundary !== this) {
      this.relayoutBoundary = null
      this.needsLayout = true
      this.visit(Object.cleanChildRelayoutBoundary)
    }
  }

  /**
   * 
   * @param descendant 
   * @param rect 
   * @param duration 
   * @param curve 
   */
  showOnScreen (
    descendant?: Object | null,
    rect?: Rect | null,
    duration: number = 0,
    curve = null
    // Curve curve = Curves.ease,
  ) {
    if (this.parent instanceof Object) {
      const renderParent = this.parent
      renderParent.showOnScreen(
        descendant ?? this,
        rect,
        duration,
        curve,
      );
    }
  }

  applyPaintTransform (child: Object, transform: Matrix4) {
    invariant(child.parent === this, `The argument "child" must be equal `)
  }

  replaceRootLayer (rootLayer: OffsetLayer) {
    invariant(rootLayer.attached, `The "rootLayer" must be attached.`)
    invariant(this.attached, `The "Object" must be attached.`)
    invariant(this.isRepaintBoundary, `The "Object" must is "isRepaintBoundary".`)
    invariant(this.layerRef.layer !== null, `The "this.layerRef.layer" cannot be null.`)

    this.layerRef.layer.detach()
    this.layerRef.layer = rootLayer

    this.markNeedsPaint()
  }

  appendLayer () {}

  skippedPaintingOnLayer () {
    invariant(this.attached)
    invariant(this.isRepaintBoundary)
    invariant(this.needsPaint)
    invariant(this.layerRef.layer !== null)
    invariant(!this.layerRef.layer.attached)

    let node: Object | null = this.parent as Object
    
    while (node instanceof Object) {
      if (node.isRepaintBoundary) {
        if (node.layerRef.layer === null) {
          break
        }

        if (node.layerRef.layer.attached) {
          break
        }

        node.needsPaint = true
      }

      node = node.parent as Object
    }
  }

  markNeedsLayout () {
    if (this.needsLayout) {
      return
    }

    invariant(this.relayoutBoundary !== null, `The "this.relayoutBoundary" cannot be null.`)

    if (this.relayoutBoundary !== this) {
      this.markParentNeedsLayout()
    } else {
      this.needsLayout = true
      if (this.owner !== null) {
        this.owner.objectsNeedingLayout.add(this)
        this.owner.requestUpdate()
      }
    }
  }

  /**
   * 
   */
  markParentNeedsLayout () {
    this.needsLayout = true
    invariant(this.parent, `The "this.parent" cannot be null`)
    const parent = this.parent as Object
    parent.markNeedsLayout()
  }

  /**
   * 
   */
  markNeedsLayoutForSizedByParentChange () {
    this.markNeedsLayout()
    this.markParentNeedsLayout()
  }

  markNeedsCompositingBitsUpdate () {
    if (this.needsCompositingBitsUpdate) {
      return
    }

    this.needsCompositingBitsUpdate = true
    
    if (this.parent instanceof Object) {
      const parent = this.parent as Object

      if (parent.needsCompositingBitsUpdate) {
        return
      }

      if (this.isRepaintBoundary && !parent.isRepaintBoundary) {
        parent.markNeedsCompositingBitsUpdate()
        return
      }
    }
    
    if (this.owner !== null) {
      this.owner.objectsNeedingCompositingBitsUpdate.add(this)
    }
  }

  markNeedsPaint (): void {
    if (this.needsPaint) {
      return 
    }

    this.needsPaint = true
  
    if (this.isRepaintBoundary) {
      if (this.owner) {
        this.owner.objectsNeedingPaint.add(this)
        this.owner.requestUpdate()
      }
    } else if (this.parent instanceof Object) {
      const parent = this.parent as Object
      parent?.markNeedsPaint()
    } else {
      if (this.owner !== null) {
        this.owner.requestUpdate()
      }
    }
  }

  visit (visitor: ObjectVisitorHandle): void {}

  adoptChild (child: Object) {
    invariant(child !== null, `The argument "child" cannot be null.`)
    this.markNeedsLayout()
    this.markNeedsCompositingBitsUpdate()

    super.adoptChild(child)
  }

  dropChild (child: Object) {
    invariant(child !== null, `The argument "child" cannot be null.`)
    
    child.cleanRelayoutBoundary()
    super.dropChild(child)

    this.markNeedsLayout()
    this.markNeedsCompositingBitsUpdate()
  }

  attach (owner: PipelineOwner) {
    super.attach(owner)
    
    if (this.needsLayout && this.relayoutBoundary !== null) {
      this.needsLayout = false
      this.markNeedsLayout()
    }
    if (this.needsCompositingBitsUpdate) {
      this.needsCompositingBitsUpdate = false
      this.markNeedsCompositingBitsUpdate()
    }
    if (this.needsPaint && this.layerRef.layer !== null) {
      this.needsPaint = false
      this.markNeedsPaint()
    }

    if (this.child !== null) {
      this.child.attach(owner)
    }
  }

  detach () {
    super.detach()
    if (this.child !== null) {
      this.child.detach()
    }
  }

  redepthChildren () {
    if (this.child !== null) {
      this.redepthChild(this.child)
    }
  }

  paint (context: PaintingContext, offset: Offset) { }

  paintWithContext (context: PaintingContext, offset: Offset) {
    if (this.needsLayout) {
      return
    }

    try {
      this.paint(context, offset)
    } catch (error) {
      throw error
    } finally {
      this.needsPaint = false
    }

  }

  reassemble () {
    this.markNeedsLayout()
    this.markNeedsCompositingBitsUpdate()
    this.markNeedsPaint()

    // for (const child of this.children) {
    //   child.reassemble()
    // }
  }

  dispose () {
    this.layerRef.dispose()
    this.layerRef.layer = null
  }
}