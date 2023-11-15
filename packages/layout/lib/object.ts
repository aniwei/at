import { invariant } from '@at/utils'
import { Matrix4 } from '@at/math'
import { AbstractNode } from '@at/basic'
import { Offset, Rect, Size } from '@at/geometry'
import { ContainerLayer, LayerHandle, OffsetLayer } from '@at/engine'
import { HitTestEntry, HitTestResult, HitTestTarget } from '@at/gesture'

import { PipelineOwner } from './pipeline-owner'
import { Constraints } from './constraints'
import { PaintingContext } from './painting-context'

export type ObjectVisitorHandle = (child: Object) => void

export abstract class Object extends AbstractNode<Object, PipelineOwner> implements HitTestTarget {
  /**
   * 
   * @param child 
   */
  static cleanChildRelayoutBoundary (child: Object) {
    child.cleanRelayoutBoundary()
  }

  // => child
  // private _child: Object | null = null
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

  // => isPositioned
  public get isPositioned () {
    return false
  }

  // => layer
  public get layer () {
    invariant(
      this.isRepaintBoundary ||
      this.layerHandle.layer === null ||
      this.layerHandle.layer instanceof OffsetLayer,
      `Cannot get the layer.`
    )

    return this.layerHandle.layer
  }
  public set layer (layer: ContainerLayer | null) {
    invariant(!this.isRepaintBoundary)
    this.layerHandle.layer = layer
  }

  public count: number = 0
  public firstChild: Object | null = null
  public lastChild: Object | null = null
  public previousSibling: Object | null = null
  public nextSibling: Object | null = null

  public needsLayout: boolean = true
  public relayoutBoundary: Object | null = null
  
  public owner: PipelineOwner | null = null
  public needsPaint: boolean = true
  public sizedByParent: boolean = false
  public isRepaintBoundary: boolean = false
  public alwaysNeedsCompositing: boolean = false
  public needsCompositingBitsUpdate: boolean = false
  public layerHandle: LayerHandle<ContainerLayer> = new LayerHandle<ContainerLayer>()

  public constraints: Constraints | null = null
  public needsCompositing: boolean = this.isRepaintBoundary || this.alwaysNeedsCompositing

  abstract bounds: Rect

  abstract performLayout (): void
  abstract performLayout (size: Size): void
  abstract performLayout (size?: Size): void

  abstract performResize (): void

  abstract hitTest (result: HitTestResult, ...rest: unknown[]): void
  abstract handleEvent(event: PointerEvent, entry: HitTestEntry): void

  layout (constraints: Constraints, parentUsesSize = false) {
    invariant(constraints !== null)
    invariant(this.parent !== null && this.parent instanceof Object)

    const isRelayoutBoundary = !parentUsesSize || constraints.tight || this.sizedByParent
    const relayoutBoundary = isRelayoutBoundary ? this : this.parent.relayoutBoundary

    if (
      !this.needsLayout &&
      this.constraints !== constraints
    ) {
      if (this.relayoutBoundary !== relayoutBoundary) {
        this.relayoutBoundary = relayoutBoundary
        // this.visit((child) => child.)
      }

      return
    }

    this.constraints = constraints
    if (this.relayoutBoundary !== null && relayoutBoundary != this.relayoutBoundary) {
      this.visit(Object.cleanChildRelayoutBoundary)
    }
    this.relayoutBoundary = relayoutBoundary
    
    if (this.sizedByParent) {
      try {
        this.performResize()
      } catch (error) {
        throw error
      }
    }
    
    try {
      this.performLayout()
    } catch (error: any) {
      throw error
    }
    
    this.needsLayout = false
    this.markNeedsPaint()
  }

  layoutWithoutResize () {
    invariant(this.relayoutBoundary === this, `The "this.relayoutBoundary" must be equal "this".`)
    
    try {
      this.performLayout()
    } catch (error: any) {
      throw error
    }
    
    this.needsLayout = false
    this.markNeedsPaint()
  }

  // 初始化
  scheduleInitialPaint (root: ContainerLayer) {
    invariant(root.attached)
    invariant(this.attached)
    invariant(this.isRepaintBoundary)
    invariant(this.layerHandle.layer === null)

    this.layerHandle.layer = root
    invariant(this.needsPaint)
    this.owner?.nodesNeedingPaint.add(this)
  }

  scheduleInitialLayout () {
    invariant(this.attached, `The "this.attached" cannot be null.`)
    invariant(this.owner, `The "this.owner" cannot be null.`)
    invariant(this.relayoutBoundary === null, `The "this.relayoutBoundary" must be null.`)
    
    this.relayoutBoundary = this
    this.owner.nodesNeedingLayout.add(this)
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
    invariant(this.layerHandle.layer !== null, `The "this.layerHandle.layer" cannot be null.`)

    this.layerHandle.layer.detach()
    this.layerHandle.layer = rootLayer

    this.markNeedsPaint()
  }

  appendLayer () {}

  skippedPaintingOnLayer () {
    invariant(this.attached)
    invariant(this.isRepaintBoundary)
    invariant(this.needsPaint)
    invariant(this.layerHandle.layer !== null)
    invariant(!this.layerHandle.layer.attached)

    let node: Object | null = this.parent as Object
    
    while (node instanceof Object) {
      if (node.isRepaintBoundary) {
        if (node.layerHandle.layer === null) {
          break
        }

        if (node.layerHandle.layer.attached) {
          break
        }

        node.needsPaint = true
      }

      node = node.parent as Object
    }
  }

  /**
   * 
   * @returns 
   */
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
        this.owner.nodesNeedingLayout.add(this)
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
      this.owner.nodesNeedingCompositingBitsUpdate.add(this)
    }
  }

  markNeedsPaint (): void {
    if (this.needsPaint) {
      return 
    }

    this.needsPaint = true
  
    if (this.isRepaintBoundary) {
      if (this.owner) {
        this.owner.nodesNeedingPaint.add(this)
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
    if (this.needsPaint && this.layerHandle.layer !== null) {
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
    this.layerHandle.layer = null
  }
}