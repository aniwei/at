

import { invariant } from '@at/utility'
import { AbstractNode } from '../basic/node'
import { Matrix4 } from '../basic/matrix4'
import { Offset, Rect, RRect, Size } from '../basic/geometry'
import { At, AtCanvas, AtPaint } from '../at'
import { MutatorType, Mutators } from '../engine/embedded-views'
import { transformRect } from '../basic/helper'
import { AtNWCanvas } from './n-way-canvas'

import type { AtImageFilter } from '../engine/image-filter'
import type { AtPicture } from '../engine/picture'
import type { BlendMode, Clip } from '../engine/skia'
import type { AtPath } from '../engine/path'
import type { AtColorFilter } from '../engine/color-filter'
import type { AtRasterCache } from '../engine/rasterizer'

export class AtPrerollContext {
  static create (cache: AtRasterCache | null) {
    return new AtPrerollContext(cache)
  }

  public get cullRect () {
    invariant(Rect.largest)
    let cullRect = Rect.largest
    for (const mutator of this.mutators) {
      let rect: Rect

      if (mutator.type === MutatorType.ClipRect) {
        invariant(mutator.rect)
        rect = mutator.rect
      } else if (mutator.type === MutatorType.ClipRRect) {
        invariant(mutator.rrect)
        rect = mutator.rrect.outerRect
      } else if (mutator.type === MutatorType.ClipPath) {
        invariant(mutator.path)
        rect = mutator.path.getBounds()
      } else {
        continue
      }
      cullRect = cullRect.intersect(rect)
    }
      
    return cullRect
  }

  public cache: AtRasterCache | null
  public mutators: Mutators = new Mutators()

  constructor (cache: AtRasterCache | null) {
    this.cache = cache 
  }
}

export class AtPaintContext {
  static create (internal: AtNWCanvas, leaf: AtCanvas, rasterCache: AtRasterCache | null) {
    return new AtPaintContext(internal, leaf, rasterCache)
  }

  public internal: AtNWCanvas
  public leaf: AtCanvas
  public rasterCache: AtRasterCache | null

  constructor (internal: AtNWCanvas, leaf: AtCanvas, rasterCache: AtRasterCache | null) {
    this.internal = internal
    this.leaf = leaf
    this.rasterCache = rasterCache
  }
}

export abstract class AtLayer extends AbstractNode<AtLayer> {
  // => attached
  public get attached () {
    return this.owner !== null
  }

  // => paintable
  public get paintable () {
    return !this.bounds.isEmpty
  }

  public owner: unknown | null = null
  public depth: number = 0
  public refCount: number = 0
  public parent: AtContainerLayer | null = null
  public bounds: Rect = Rect.zero
  public parentHandle: AtLayerHandle<AtLayer> = new AtLayerHandle<AtLayer>()
  public nextSibling: AtLayer | null = null
  public previousSibling: AtLayer | null = null

  abstract preroll (context: AtPrerollContext, matrix: Matrix4): void
  abstract paint (context: AtPaintContext): void

  attach (owner: unknown) {
    invariant(owner !== null, `The argument "owner" cannot be null.`)
    invariant(this.owner === null, `The "this.owner" cannot be null.`)
    this.owner = owner
  }

  detach () {
    invariant(this.owner !== null, `The "this.owner" cannot be null.`)
    this.owner = null
    this.dispose()
  }

  redepthChild (child: AtLayer) {
    invariant(child.owner === this.owner)
    if (child.depth <= this.depth) {
      child.depth = this.depth + 1
      child.redepthChildren()
    }
  }

  redepthChildren () {}

  adoptChild (child: AbstractNode<AtLayer>) {
    super.adoptChild(child)
  }

  remove () {
    this.parent?.removeChild(this)
  }

  unref () {
    invariant(this.refCount > 0)
    this.refCount -= 1
    if (this.refCount === 0) {
      this.dispose()
    }
  }

  dispose () {
  }
}

export class AtLayerHandle<T extends AtLayer> {
  static create <T extends AtLayer> () {
    return new AtLayerHandle<T>()
  }

  private _layer: T | null = null
  public get layer () {
    return this._layer
  }
  public set layer (layer: T | null) {
    if (layer !== this.layer) {
      this._layer?.unref()
      this._layer = layer
      if (this.layer !== null) {
        this.layer.refCount += 1
      }
    }
  }
}

export abstract class AtContainerLayer extends AtLayer {
  public firstChild: AtLayer | null = null 
  public lastChild: AtLayer | null = null 

  public get hasChildren () {
    return this.firstChild !== null
  }

  attach (owner: unknown) {
    super.attach(owner)
    let child: AtLayer | null = this.firstChild
    while (child !== null) {
      child.attach(owner)
      child = child.nextSibling
    }
  }

  
  detach() {
    super.detach()
    let child: AtLayer | null = this.firstChild
    while (child !== null) {
      child.detach()
      child = child.nextSibling
    }
  }

  append (child: AtLayer) {
    invariant(child !== this as unknown as AtLayer)
    invariant(child !== this.firstChild)
    invariant(child !== this.lastChild)
    invariant(child.parent === null)
    invariant(!child.attached)
    invariant(child.nextSibling === null)
    invariant(child.previousSibling === null)
    invariant(child.parentHandle.layer === null)
      
    this.adoptChild(child)
    child.previousSibling = this.lastChild
    if (this.lastChild !== null) {
      this.lastChild.nextSibling = child
    }

    this.lastChild = child
    this.firstChild ??= child
    child.parentHandle.layer = child
    invariant(child.attached === this.attached)
  }

  
  removeChild (child: AtLayer) {
    invariant(child.parent === this as unknown as AtLayer)
    invariant(child.attached === this.attached)
    invariant(child.parentHandle.layer !== null)
    if (child.previousSibling === null) {
      invariant(this.firstChild === child)
      this.firstChild = child.nextSibling
    } else {
      child.previousSibling.nextSibling = child.nextSibling;
    }
    if (child.nextSibling === null) {
      invariant(this.lastChild === child)
      this.lastChild = child.previousSibling
    } else {
      child.nextSibling.previousSibling = child.previousSibling
    }
    invariant((this.firstChild === null) === (this.lastChild === null))
    invariant(
      this.firstChild === null || 
      this.firstChild.attached === this.attached
    )
    invariant(
      this.lastChild === null || 
      this.lastChild.attached === this.attached
    )
    
    child.previousSibling = null
    child.nextSibling = null
    this.dropChild(child)
    child.parentHandle.layer = null
    invariant(!child.attached)
  }

  removeAllChildren () {
    let child: AtLayer | null = this.firstChild
    while (child !== null) {
      const next: AtLayer | null = child.nextSibling
      child.previousSibling = null
      child.nextSibling = null
      // invariant(child.attached === this.attached)
      this.dropChild(child)
      invariant(child.parentHandle !== null)
      child.parentHandle.layer = null
      child = next
    }
    this.firstChild = null
    this.lastChild = null
  }

  applyTransform (
    child: AtLayer | null, 
    transform: Matrix4
  ) {
    invariant(child !== null)
    invariant(transform !== null)
  }
  
  depthFirstIterateChildren (): AtLayer[] {
    if (this.firstChild === null) {
      return []
    }

    let children: AtLayer[] = []
    let child: AtLayer | null = this.firstChild
    while (child !== null) {
      children.push(child)
      if (child instanceof AtContainerLayer) {
        children = children.concat(child.depthFirstIterateChildren())
      }
      child = child.nextSibling
    }
    return children
  }

  /**
   * 合并子节点绘制边界
   * @param {AtPrerollContext} context
   * @param {Matrix4} childMatrix
   * @return {Rect}
   */  
  prerollChildren (context: AtPrerollContext, childMatrix: Matrix4): Rect {
    let childPaintBounds: Rect = Rect.zero
    let child: AtLayer | null = this.firstChild

    while (child !== null) {
      child.preroll(context, childMatrix)

      if (childPaintBounds.isEmpty) {
        childPaintBounds = child.bounds
      } else if (!child.bounds.isEmpty) {
        childPaintBounds = childPaintBounds.expandToInclude(child.bounds)
      }

      child = child.nextSibling
    }

    return childPaintBounds
  }

  /**
   * @description: 绘制子节点
   * @param {AtPaintContext} context
   * @return {*}
   */  
  paintChildren (context: AtPaintContext) {
    invariant(this.paintable, `The layer bound cannot be empty.`)

    let child: AtLayer | null = this.firstChild
    
    while (child !== null) {

      if (child.paintable) {
        child.paint(context)
      }

      child = child.nextSibling
    }
  }

  /**
   * @description: 
   * @param {AtPrerollContext} prerollContext
   * @param {Matrix4} matrix
   * @return {*}
   */  
  preroll (prerollContext: AtPrerollContext,  matrix: Matrix4) {
    this.bounds = this.prerollChildren(prerollContext, matrix)
  }

  dispose () {
    this.removeAllChildren()
    super.dispose()
  }
}

export class AtRootLayer extends AtContainerLayer {
  static create () {
    return new AtRootLayer()
  }

  /**
   * @description: 
   * @param {AtPaintContext} context
   * @return {*}
   */  
  paint (context: AtPaintContext) {
    this.paintChildren(context)
  }
}

export class AtTransformLayer extends AtContainerLayer {
  static create (
    offset: Offset = Offset.zero,
    transform: Matrix4, 
  ) {
    transform.multiply(Matrix4.translationValues(offset.dx, offset.dy, 0.0))
    return new AtTransformLayer(offset, transform)
  }

   // => offset
   private _offset: Offset
   public get offset () {
     return this._offset
   }
   public set offset (offset: Offset) {
     if (this._offset.notEqual(offset)) {
       this._offset = offset
       this.transform = Matrix4.translationValues(offset.dx, offset.dy, 0.0)
     }
   }

  // => transform
  private _transform: Matrix4
  public get transform () {
    return this._transform
  }
  public set transform (transform: Matrix4) {
    if (transform !== this.transform) {
      this._transform = transform
      this.inverseDirty = true
    }
  }
  
  public inverseDirty: boolean = true
  
  constructor(
    offset: Offset = Offset.zero,
    transform: Matrix4,
  ) {
    super()
    this._offset = offset
    this._transform = transform
  }

  applyTransform (
    child: AtLayer | null, 
    transform: Matrix4
  ) {
    invariant(child !== null)
    invariant(transform !== null)

    transform.multiply(this.transform)
  }

  preroll (context: AtPrerollContext, matrix: Matrix4) {
    invariant(this.transform !== null)

    const childMatrix: Matrix4 = matrix.multiplied(this.transform)
    context.mutators.pushTransform(this.transform)
    const childPaintBounds: Rect = this.prerollChildren(context, childMatrix)
    this.bounds = transformRect(this.transform, childPaintBounds)
    context.mutators.pop()
  }

  /**
   * @description: 
   * @param {AtPaintContext} paintContext
   * @return {*}
   */  
  paint (context: AtPaintContext) {
    invariant(this.paintable, `The layer must be paintable.`)
    invariant(this.transform !== null)

    context.internal.save()
    context.internal.transform(this.transform)
    this.paintChildren(context)
    context.internal.restore()
  }
}

export class AtOffsetLayer extends AtTransformLayer {
  static create (...rests: unknown[]) {
    const offset = rests[0] as Offset
    return new AtOffsetLayer(offset)
  }

  constructor (offset: Offset = Offset.zero) {
    super(offset, Matrix4.translationValues(offset.dx, offset.dy, 0.0))
  }

  applyTransform (
    child: AtLayer | null, 
    transform: Matrix4 
  ) {
    invariant(child !== null)
    invariant(transform !== null)
    transform.multiply(
      Matrix4.translationValues(
        this.offset.dx, 
        this.offset.dy,
        0.0
      )
    )
  }

  preroll (context: AtPrerollContext, matrix: Matrix4) {
    invariant(this.transform !== null)

    // console.log(this.transform)

    const childMatrix: Matrix4 = matrix.multiplied(this.transform)
    context.mutators.pushTransform(this.transform)
    
    const childPaintBounds: Rect = this.prerollChildren(context, childMatrix)
    this.bounds = transformRect(this.transform, childPaintBounds)
    
    context.mutators.pop()
  }

  /**
   * @description: 
   * @param {AtPaintContext} paintContext
   * @return {*}
   */  
  paint (context: AtPaintContext) {
    invariant(this.paintable, `The layer must be paintable.`)
    invariant(this.transform !== null)

    context.internal.save()
    context.internal.transform(this.transform)
    this.paintChildren(context)
    context.internal.restore()
  }
}

export class AtPictureLayer extends AtLayer {
  static create () {
    return new AtPictureLayer()
  }

  // => picture
  private _picture: AtPicture | null = null
  public get picture () {
    return this._picture
  }
  public set picture (picture: AtPicture | null) {
    this._picture?.dispose()
    this._picture = picture
  }

  // => isComplexHint
  public isComplexHint: boolean = false
  public willChangeHint: boolean = false
  
  public offset: Offset = Offset.zero

  preroll (context: AtPrerollContext, matrix: Matrix4) {
    invariant(this.picture !== null)
    invariant(this.picture.cullRect)
    this.bounds = this.picture.cullRect.shift(this.offset)
  }

  paint (context: AtPaintContext) {
    invariant(this.picture !== null, `The this.picture cannot be null.`) 
    invariant(this.paintable, ``)

    // invariant((() => {
    //   console.time(`picture.paint`)
    //   return true
    // })())

    context.leaf.save()
    context.leaf.translate(this.offset.dx, this.offset.dy)
    context.leaf.drawPicture(this.picture)
    context.leaf.restore()

    // invariant((() => {
    //   console.timeEnd(`picture.paint`)
    //   return true
    // })())
  }

  detach (): void {
    super.detach()

    this._picture?.dispose()
    this._picture = null
  }

  dispose() {
    this.picture = null
    super.dispose()
  }
}


export class AtClipRectLayer extends AtContainerLayer {
  static create (
    clipRect: Rect,
    clipBehavior?: Clip,
  ) {
    return new AtClipRectLayer(clipRect, clipBehavior)
  }

  public clipRect: Rect
  public clipBehavior: Clip

  constructor (
    clipRect: Rect,
    clipBehavior: Clip = At.Clip.HardEdge,
  ) {
    super()
    this.clipRect = clipRect ?? null
    this.clipBehavior = clipBehavior
    invariant(clipBehavior !== null)
    invariant(clipBehavior !== At.Clip.None)
  }

  preroll (context: AtPrerollContext, matrix: Matrix4) {
    context.mutators.pushClipRect(this.clipRect)

    const childPaintBounds: Rect = this.prerollChildren(context, matrix)

    if (childPaintBounds.overlaps(this.clipRect)) {
      this.bounds = childPaintBounds.intersect(this.clipRect)
    }

    context.mutators.pop()
  }

  paint (context: AtPaintContext): void {
    invariant(this.paintable, `The layer must be painting.`)

    context.internal.save()
    context.internal.clipRect(this.clipRect, At.ClipOp.Intersect, this.clipBehavior !== At.Clip.HardEdge)

    if (this.clipBehavior === At.Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.clipRect, null)
    }

    this.paintChildren(context)

    if (this.clipBehavior === At.Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}

export class AtClipRRectLayer extends AtContainerLayer {
  static create (
    clipRRect: RRect,
    clipBehavior?: Clip,
  ) {
    return new AtClipRRectLayer(clipRRect, clipBehavior)
  }

  public clipRRect: RRect
  public clipBehavior: Clip

  constructor(
    clipRRect: RRect,
    clipBehavior: Clip = At.Clip.AntiAlias,
  ) {
    super()

    invariant(clipBehavior !== null)
    invariant(clipBehavior !== At.Clip.None)
    
    this.clipRRect = clipRRect ?? null
    this.clipBehavior = clipBehavior
  }

  preroll (context: AtPrerollContext, matrix: Matrix4) {
    context.mutators.pushClipRRect(this.clipRRect)
    const childPaintBounds: Rect = this.prerollChildren(context, matrix)
    if (childPaintBounds.overlaps(this.clipRRect.outerRect)) {
      this.bounds = childPaintBounds.intersect(this.clipRRect.outerRect)
    }
    context.mutators.pop()
  }

  paint (context: AtPaintContext) {
    invariant(this.paintable, ``)

    context.internal.save()
    context.internal.clipRRect(this.clipRRect, this.clipBehavior !== At.Clip.HardEdge)

    if (this.clipBehavior === At.Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.bounds, null)
    }

    this.paintChildren(context)

    if (this.clipBehavior === At.Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}

export class AtClipPathLayer extends AtContainerLayer {
  static create (
    clipPath: AtPath,
    clipBehavior?: Clip,
  ) {
    return new AtClipPathLayer(clipPath, clipBehavior)
  }

  public clipPath: AtPath
  public clipBehavior: Clip

  constructor (
    clipPath: AtPath,
    clipBehavior: Clip = At.Clip.AntiAlias,
  ) {
    super()
    invariant(clipBehavior !== null)
    invariant(clipBehavior !== At.Clip.None)

    this.clipPath = clipPath
    this.clipBehavior = clipBehavior
  }

  preroll (context: AtPrerollContext, matrix: Matrix4) {
    context.mutators.pushClipPath(this.clipPath)
    const childPaintBounds: Rect = this.prerollChildren(context, matrix)
    const clipBounds: Rect = this.clipPath.getBounds()

    if (childPaintBounds.overlaps(clipBounds)) {
      this.bounds = childPaintBounds.intersect(clipBounds)
    }

    context.mutators.pop()
  }

  /**
   * 
   * @param {AtPaintContext} context
   */  
  paint (context: AtPaintContext) {
    invariant(this.paintable, `The "this.paintable" must be true.`)

    context.internal.save()
    context.internal.clipPath(this.clipPath, this.clipBehavior !== At.Clip.HardEdge)

    if (this.clipBehavior === At.Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.bounds, null)
    }

    this.paintChildren(context)
    if (this.clipBehavior === At.Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}

export class AtColorFilterLayer extends AtContainerLayer {
  static create (filter: AtColorFilter) {
    return new AtColorFilterLayer(filter)
  }

  public filter: AtColorFilter

  constructor (filter: AtColorFilter) {
    super()
    this.filter = filter
  }

  paint (context: AtPaintContext) {
    invariant(this.paintable, `The layer must be paintable.`)

    const paint: AtPaint = AtPaint.create()
    paint.colorFilter = this.filter

    context.internal.saveLayer(this.bounds, paint)
    this.paintChildren(context)
    context.internal.restore()
  }
}

export class AtImageFilterLayer extends AtContainerLayer {
  static create (filter: AtImageFilter) {
    return new AtImageFilterLayer(filter)
  }

  public filter: AtImageFilter | null = null

  constructor (filter: AtImageFilter | null) {
    super()
    this.filter = filter
  }
  
  paint (context: AtPaintContext) {
    invariant(this.paintable, `The layer must be paintable.`)
    const paint: AtPaint = new AtPaint()
    paint.imageFilter = this.filter
    
    context.internal.saveLayer(this.bounds, paint)
    this.paintChildren(context)
    context.internal.restore()
  }
}

export class AtOpacityLayer extends AtOffsetLayer {
  static create (
    alpha: number,
    offset: Offset  = Offset.zero,
  ) {
    return new AtOpacityLayer(alpha, offset)
  }

  public alpha: number
  
  constructor (
    alpha: number,
    offset: Offset  = Offset.zero,
  ) {
    super(offset)
    
    this.alpha = alpha
  }
  
  preroll (context: AtPrerollContext, matrix: Matrix4) {
    const childMatrix: Matrix4 = Matrix4.copy(matrix)
    childMatrix.translate(this.offset.dx, this.offset.dy)

    context.mutators.pushTransform(Matrix4.translationValues(this.offset.dx, this.offset.dy, 0.0))
    context.mutators.pushOpacity(this.alpha)

    super.preroll(context, childMatrix)
    
    context.mutators.pop()
    context.mutators.pop()

    this.bounds = this.bounds.translate(this.offset.dx, this.offset.dy)
  }
}


export class AtBackdropFilterLayer extends AtContainerLayer {
  static create (
    filter: AtImageFilter,
    blendMode: BlendMode = At.BlendMode.SrcOver,
  ) {
    return new AtBackdropFilterLayer(
      filter, 
      blendMode
    )
  }
  
  public filter: AtImageFilter
  public blendMode: BlendMode

  constructor (
    filter: AtImageFilter,
    blendMode: BlendMode = At.BlendMode.SrcOver,
  ) {
    super()
    this.filter = filter
    this.blendMode = blendMode
  }
  
  preroll (context: AtPrerollContext, matrix: Matrix4) {
    const childBounds: Rect = this.prerollChildren(context, matrix)
    this.bounds = childBounds.expandToInclude(context.cullRect)
  }

  /**
   * 绘制
   * @param {AtPaintContext} context
   */  
  paint (context: AtPaintContext) {
    const paint = new AtPaint()
    paint.blendMode = this.blendMode

    context.internal.saveLayerWithFilter(
      this.bounds, 
      this.filter, 
      paint
    )

    this.paintChildren(context)
    context.internal.restore()
  }
}
