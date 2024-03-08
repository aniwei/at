

import { invariant } from '@at/utils'
import { AbstractNode, Color } from '@at/basic'
import { Matrix4 } from '@at/math'
import { Offset, Rect, RRect } from '@at/geometry'
import { Paint } from './paint'
import { PrerollContext } from './preroll-context'
import { PaintContext } from './paint-context'
import { ColorFilter } from './color-filter'
import { Picture } from './picture'
import { Path } from './path'
import { ImageFilter } from './image-filter'
import { Engine } from './engine'
import { transformRect } from './to'

import * as Skia from './skia'

//// => Layer
// 抽象层
export abstract class Layer extends AbstractNode<Layer> {
  // => attached
  // 是否挂载
  public get attached () {
    return this.owner !== null
  }

  // => isShoudPaint
  public get ignored () {
    return this.bounds.isEmpty
  }

  // 引用计数
  public count: number = 0
  // 挂载对象
  // 节点深度
  public depth: number = 0
  // 节点边界
  public bounds: Rect = Rect.ZERO
  // 父层引用
  // public parentRef: LayerRef<Layer> = new LayerRef<Layer>()
  // 父节点
  public parent: ContainerLayer | null = null
  // 下一个兄弟节点
  public next: Layer | null = null
  // 上一个兄弟节点
  public previous: Layer | null = null

  // 处理绘制边界
  abstract preroll (context: PrerollContext, matrix: Matrix4): void
  // 处理绘制
  abstract paint (context: PaintContext): void

  redepthChild (child: Layer) {
    invariant(child.owner === this.owner)
    if (child.depth <= this.depth) {
      child.depth = this.depth + 1
      child.redepthChildren()
    }
  }

  redepthChildren () {}

  adoptChild (child: Layer) {
    super.adoptChild(child)
  }

  remove () {
    this.parent?.removeChild(this)
  }

  ref () {
    this.count += 1
  }

  unref () {
    invariant(this.count > 0)
    this.count -= 1
    if (this.count === 0) {
      this.dispose()
    }
  }

  /**
   * 挂载
   * @param owner 
   */
  attach (owner: unknown) {
    this.owner = owner
  }

  /**
   * 卸载
   */
  detach () {
    this.owner = null
    this.dispose()
  }

  dispose () {
    
  }
}

//// => LayerRef
// 层引用
export class LayerRef<T extends Layer> {
  static create <T extends Layer> () {
    return new LayerRef<T>()
  }

  // => layer
  protected _layer: T | null = null
  public get layer () {
    return this._layer
  }
  public set layer (layer: T | null) {
    if (layer !== this.layer) {
      this._layer?.unref()
      this._layer = layer

      if (this._layer !== null) {
        this._layer?.ref()
      }
    }
  }

  dispose () {
    this.layer?.dispose()
    this.layer = null
  }
}


//// => ContainerLayer
// 容器层
export interface ContainerLayerFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class ContainerLayer extends Layer {
  static create <T extends ContainerLayer> (...rests: unknown[]): ContainerLayer {
    const Factory = this as unknown as ContainerLayerFactory<T>
    return new Factory(...rests)
  }

  public firstChild: Layer | null = null 
  public lastChild: Layer | null = null 

  public get hasChildren () {
    return this.firstChild !== null
  }

  /**
   * 挂载
   * @param {unknown} owner 
   */
  attach (owner: unknown) {
    super.attach(owner)
    let child: Layer | null = this.firstChild
    while (child !== null) {
      child.attach(owner)
      child = child.next
    }
  }

  /**
   * 卸载
   */
  detach() {
    super.detach()
    let child: Layer | null = this.firstChild

    while (child !== null) {
      child.detach()
      child = child.next ?? null
    }
  }

  /**
   * 插入层
   * @param {Layer} child 
   */
  append (child: Layer) {
    invariant(child !== this as unknown as Layer)
    invariant(child !== this.firstChild)
    invariant(child !== this.lastChild)
    invariant(child.parent === null)
    invariant(!child.attached)
    // invariant(child.parentRef.layer === null)
      
    this.adoptChild(child)
    child.previous = this.lastChild
    if (this.lastChild !== null) {
      this.lastChild.next = child
    }

    this.lastChild = child
    this.firstChild ??= child
    // child.parentRef.layer = child
    invariant(child.attached === this.attached)
  }

  /**
   * 删除层
   * @param {Layer} child 
   */
  removeChild (child: Layer) {
    invariant(child.parent === this as unknown as Layer)
    // invariant(child.parentRef.layer !== null)
    
    if (child.previous === null) {
      this.firstChild = child.next
    } else {
      child.previous.next = child.next
    }

    if (child.next === null) {
      this.lastChild = child.previous
    } else {
      child.next.previous = child.previous
    }
    
    child.previous = null
    child.next = null

    this.dropChild(child)
    // child.parentRef.layer = null
  }

  removeAllChildren () {
    let child: Layer | null = this.firstChild
    while (child !== null) {
      const next: Layer | null = child.next
      child.previous = null
      child.next = null

      this.dropChild(child)
      // child.parentRef.layer = null
      child = next
    }
    this.firstChild = null
    this.lastChild = null
  }

  applyTransform (
    child: Layer | null, 
    transform: Matrix4
  ) {
    invariant(child !== null)
    invariant(transform !== null)
  }
  
  depthFirstIterateChildren (): Layer[] {
    if (this.firstChild === null) {
      return []
    }

    let children: Layer[] = []
    let child: Layer | null = this.firstChild
    while (child !== null) {
      children.push(child)
      if (child instanceof ContainerLayer) {
        children = children.concat(child.depthFirstIterateChildren())
      }
      child = child.next
    }
    return children
  }

  /**
   * 合并子节点绘制边界
   * @param {PrerollContext} context
   * @param {Matrix4} childMatrix
   * @return {Rect}
   */  
  prerollChildren (context: PrerollContext, childMatrix: Matrix4): Rect {
    let childPaintBounds: Rect = Rect.ZERO
    let child: Layer | null = this.firstChild

    while (child !== null) {
      child.preroll(context, childMatrix)

      if (childPaintBounds.isEmpty) {
        childPaintBounds = child.bounds
      } else if (!child.bounds.isEmpty) {
        childPaintBounds = childPaintBounds.expandToInclude(child.bounds)
      }

      child = child.next
    }

    return childPaintBounds
  }

  /**
   * @param {PaintContext} context
   * @return {*}
   */  
  paintChildren (context: PaintContext) {
    invariant(!this.ignored, `The layer bound cannot be empty.`)
    let child: Layer | null = this.firstChild
    
    while (child !== null) {
      if (!child.ignored) {
        child.paint(context)
      }

      child = child.next
    }
  }

  /**
   * @param {PrerollContext} prerollContext
   * @param {Matrix4} matrix
   * @return {*}
   */  
  preroll (prerollContext: PrerollContext,  matrix: Matrix4) {
    this.bounds = this.prerollChildren(prerollContext, matrix)
  }

  dispose () {
    this.removeAllChildren()
    super.dispose()
  }
}

//// => RootLayer
export class RootLayer extends ContainerLayer {
  static create (): RootLayer {
    return super.create()
  }

  /**
   * 绘制
   * @param {PaintContext} context
   * @return {*}
   */  
  paint (context: PaintContext) {
    this.paintChildren(context)
  }
}

//// => TransformLayer
// 变换层
export class TransformLayer extends ContainerLayer {
  /**
   * 创建 TransformLayer
   * @param {Offset} offset 
   * @param {Matrix4} transform 
   * @returns {TransformLayer}
   */
  static create (
    offset: Offset = Offset.zero(),
    transform: Matrix4, 
  ): TransformLayer {
    return super.create(offset, transform) as TransformLayer
  }

   // => offset
  protected _offset: Offset | null = null
  public get offset () {
    invariant(this._offset)
    return this._offset
  }
  public set offset (offset: Offset) {
    if (
      this._offset === null || 
      this._offset.notEqual(offset)
    ) {
      this._offset = offset
    }
  }

  // => transform
  protected _transform: Matrix4 | null = null
  public get transform () {
    invariant(this._transform)
    return this._transform
  }
  public set transform (transform: Matrix4) {
    if (this._transform === null || this._transform.notEqual(transform)) {
      this._transform = transform
      // tryCatch(() => {
      //   this._transform?.multiply(Matrix4.translationValues(this.offset.dx, this.offset.dy, 0.0))
      // })
    }
  }
    
  constructor(
    offset: Offset = Offset.zero(),
    transform: Matrix4,
  ) {
    super()
    this.offset = offset
    this.transform = transform
  }

  /**
   * 应用 transform
   * @param {Layer | null} child 
   * @param {Matrix4} transform 
   */
  applyTransform (
    child: Layer, 
    transform: Matrix4
  ) {
    invariant(transform !== null, 'The argument "transform" cannot be null.')
    transform.multiply(this.transform)
  }

  /**
   * 处理层渲染边界
   * @param {PrerollContext} context 
   * @param {Matrix4} matrix 
   */
  preroll (context: PrerollContext, matrix: Matrix4) {
    invariant(this.transform !== null)
    const transform = this.transform.clone().translate(this.offset.dx, this.offset.dy)

    const childMatrix: Matrix4 = matrix.multiplied(transform)
    context.pushTransform(transform)

    const childPaintBounds: Rect = this.prerollChildren(context, childMatrix)
    this.bounds = transformRect(transform, childPaintBounds)

    context.pop()
  }

  /**
   * 绘制
   * @param {PaintContext} paintContext
   * @return {*}
   */  
  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot be ignored.`)
    invariant(this.transform !== null)

    context.internal.save()
    context.internal.transform(this.transform)
    this.paintChildren(context)
    context.internal.restore()
  }
}

//// => OffsetLayer
// 位移层
export class OffsetLayer extends TransformLayer {
  static create (...rests: unknown[]): OffsetLayer
  static create (offset: Offset): OffsetLayer {
    return new OffsetLayer(offset)
  }

  constructor (offset: Offset = Offset.zero()) {
    super(offset, Matrix4.translationValues(offset.dx, offset.dy, 0.0))
  }

  /**
   * 应用 Matrix
   * @param {Layer | null} child 
   * @param {Matrix4} transform 
   */
  applyTransform (
    child: Layer | null, 
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

  /**
   * 计算绘制边界
   * @param {PrerollContext} context 
   * @param {Matrix4} matrix 
   */
  preroll (context: PrerollContext, matrix: Matrix4) {
    invariant(this.transform !== null, 'The "Offsetlayer.transform" cannot be null.')

    const transform = this.transform.clone().translate(this.offset.dx, this.offset.dy)

    const childMatrix: Matrix4 = matrix.multiplied(transform)
    context.pushTransform(transform)
    
    const childPaintBounds: Rect = this.prerollChildren(context, childMatrix)
    this.bounds = transformRect(transform, childPaintBounds)
    
    context.pop()
  }

  /**
   * 绘制
   * @param {PaintContext} paintContext
   * @return {void}
   */  
  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot be ignored.`)
    invariant(this.transform !== null)

    context.internal.save()
    context.internal.transform(this.transform.clone().translate(this.offset.dx, this.offset.dy))

    this.paintChildren(context)
    context.internal.restore()
  }
}

//// => 
// 位图层
export class PictureLayer extends Layer {
  static create () {
    return new PictureLayer()
  }

  // => picture
  protected _picture: Picture | null = null
  public get picture () {
    return this._picture
  }
  public set picture (picture: Picture | null) {
    if (
      this._picture === null || 
      this._picture !== picture
    ) {
      this._picture?.dispose()
      this._picture = picture
    }
  }

  // => isComplexHint
  public isComplexHint: boolean = false
  public willChangeHint: boolean = false
  
  public offset: Offset = Offset.zero()

  /**
   * 计算边界
   * @param {PrerollContext} context 
   * @param {Matrix4} matrix 
   */
  preroll (
    context: PrerollContext, 
    matrix: Matrix4
  ) {
    invariant(this.picture !== null, 'The "PictureLayer.picture" cannot be null.')
    invariant(this.picture.cullRect, 'The "PictureLayer.picture.cullRect" cannot be null.')

    this.bounds = this.picture.cullRect.shift(this.offset)
  }

  /**
   * 绘制
   * @param {PaintContext} context 
   */
  paint (context: PaintContext) {
    invariant(this.picture !== null, `The "PictureLayer.picture" cannot be null.`) 
    invariant(!this.ignored)

    context.leaf.save()
    context.leaf.translate(this.offset.dx, this.offset.dy)
    context.leaf.drawPicture(this.picture)
    context.leaf.restore()
  }

  detach (): void {
    super.detach()

    this.picture?.dispose()
    this.picture = null
  }

  dispose() {
    super.dispose()
  }
}

//// => ClipRectLayer
// 矩形裁剪层
export class ClipRectLayer extends ContainerLayer {
  static create (
    clipRect: Rect,
    clipBehavior?: Skia.Clip,
  ) {
    return super.create(clipRect, clipBehavior) as  ClipRectLayer
  }

  public clipRect: Rect
  public clipBehavior: Skia.Clip

  constructor (
    clipRect: Rect,
    clipBehavior: Skia.Clip = Engine.skia.Clip.HardEdge,
  ) {
    super()
    invariant(clipBehavior !== Engine.skia.Clip.None)

    this.clipRect = clipRect ?? null
    this.clipBehavior = clipBehavior
  }

  preroll (context: PrerollContext, matrix: Matrix4) {
    context.pushClipRect(this.clipRect)

    const childPaintBounds: Rect = this.prerollChildren(context, matrix)

    if (childPaintBounds.overlaps(this.clipRect)) {
      this.bounds = childPaintBounds.intersect(this.clipRect)
    }

    context.pop()
  }

  paint (context: PaintContext): void {
    invariant(!this.ignored, `The layer cannot be ignored.`)

    context.internal.save()
    context.internal.clipRect(this.clipRect, Engine.skia.ClipOp.Intersect, this.clipBehavior !== Engine.skia.Clip.HardEdge)

    if (this.clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.clipRect, null)
    }

    this.paintChildren(context)

    if (this.clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}

//// => ClipRRectLayer
// 裁减圆角层
export class ClipRRectLayer extends ContainerLayer {
  static create (
    clipRRect: RRect,
    clipBehavior?: Skia.Clip,
  ) {
    return super.create(clipRRect, clipBehavior) as ClipRRectLayer
  }

  public clipRRect: RRect
  public clipBehavior: Skia.Clip

  constructor(
    clipRRect: RRect,
    clipBehavior: Skia.Clip = Engine.skia.Clip.AntiAlias,
  ) {
    super()

    invariant(clipBehavior !== Engine.skia.Clip.None)
    
    this.clipRRect = clipRRect ?? null
    this.clipBehavior = clipBehavior
  }

  preroll (context: PrerollContext, matrix: Matrix4) {
    context.pushClipRRect(this.clipRRect)

    const childPaintBounds: Rect = this.prerollChildren(context, matrix)
    if (childPaintBounds.overlaps(this.clipRRect.outer)) {
      this.bounds = childPaintBounds.intersect(this.clipRRect.outer)
    }

    context.pop()
  }

  paint (context: PaintContext) {
    invariant(!this.ignored, ``)

    context.internal.save()
    context.internal.clipRRect(this.clipRRect, this.clipBehavior !== Engine.skia.Clip.HardEdge)

    if (this.clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.bounds, null)
    }

    this.paintChildren(context)

    if (this.clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}

//// => ClipPathLayer
// 路径裁剪层
export class ClipPathLayer extends ContainerLayer {
  static create (
    clipPath: Path,
    clipBehavior?: Skia.Clip,
  ) {
    return super.create(clipPath, clipBehavior) as ClipPathLayer
  }

  public clipPath: Path
  public clipBehavior: Skia.Clip

  constructor (
    clipPath: Path,
    clipBehavior: Skia.Clip = Engine.skia.Clip.AntiAlias,
  ) {
    super()
    invariant(clipBehavior !== Engine.skia.Clip.None)

    this.clipPath = clipPath
    this.clipBehavior = clipBehavior
  }

  preroll (context: PrerollContext, matrix: Matrix4) {
    context.pushClipPath(this.clipPath)
    const childPaintBounds: Rect = this.prerollChildren(context, matrix)
    const clipBounds: Rect = this.clipPath.getBounds()

    if (childPaintBounds.overlaps(clipBounds)) {
      this.bounds = childPaintBounds.intersect(clipBounds)
    }

    context.pop()
  }

  /**
   * 
   * @param {PaintContext} context
   */  
  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot be ignored.`)

    context.internal.save()
    context.internal.clipPath(this.clipPath, this.clipBehavior !== Engine.skia.Clip.HardEdge)

    if (this.clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.bounds, null)
    }

    this.paintChildren(context)
    if (this.clipBehavior === Engine.skia.Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}

//// => ColorFilterLayer
// 滤镜层
export class ColorFilterLayer extends ContainerLayer {
  static create (filter: ColorFilter) {
    return super.create(filter) as ColorFilterLayer
  }

  public filter: ColorFilter

  constructor (filter: ColorFilter) {
    super()
    this.filter = filter
  }

  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer must be ignore.`)

    const paint: Paint = Paint.create()
    // TODO
    // paint.filter.color = this.filter

    context.internal.saveLayer(this.bounds, paint)
    this.paintChildren(context)
    context.internal.restore()
  }
}

//// => ImageFilterLayer
// 图片滤镜层
export class ImageFilterLayer extends ContainerLayer {
  static create (filter: Skia.ImageFilter) {
    return super.create(filter) as ImageFilterLayer
  }

  public filter: Skia.ImageFilter | null = null

  constructor (filter: Skia.ImageFilter | null) {
    super()
    this.filter = filter
  }
  
  /**
   * 绘制
   * @param {PaintContext} context 
   */
  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot ignore.`)
    const paint: Paint = new Paint()
    // paint.filter.image = this.filter
    
    context.internal.saveLayer(this.bounds, paint)
    this.paintChildren(context)
    context.internal.restore()
  }
}

export class OpacityLayer extends OffsetLayer {
  static create (
    alpha: number,
    offset: Offset  = Offset.ZERO,
  ) {
    return new OpacityLayer(alpha, offset)
  }

  public alpha: number
  
  constructor (
    alpha: number,
    offset: Offset  = Offset.ZERO,
  ) {
    super(offset)
    
    this.alpha = alpha
  }
  
  preroll (context: PrerollContext, matrix: Matrix4) {
    const childMatrix: Matrix4 = Matrix4.copy(matrix)
    childMatrix.translate(this.offset.dx, this.offset.dy)

    context.pushTransform(Matrix4.translationValues(this.offset.dx, this.offset.dy, 0.0))
    context.pushOpacity(this.alpha)

    super.preroll(context, childMatrix)
    
    context.pop()
    context.pop()

    this.bounds = this.bounds.translate(this.offset)
  }

  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot be ignore.`)

    const paint = Paint.create()
    paint.color = Color.fromARGB(this.alpha, 0, 0, 0)

    context.internal.save()
    context.internal.translate(this.offset.dx, this.offset.dy)

    const saveLayerBounds = this.bounds.shift(this.offset.inverse())
    context.internal.saveLayer(saveLayerBounds, paint)
    this.paintChildren(context)
    
    context.internal.restore();
    context.internal.restore();
  }
}

//// => BackdropFilterLayer
// 背景滤镜层
export class BackdropFilterLayer extends ContainerLayer {
  static create (
    filter: ImageFilter,
    blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver,
  ) {
    return super.create(filter, blendMode) as BackdropFilterLayer
  }
  
  public filter: ImageFilter
  public blendMode: Skia.BlendMode

  constructor (
    filter: ImageFilter,
    blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver,
  ) {
    super()
    this.filter = filter
    this.blendMode = blendMode
  }
  
  preroll (context: PrerollContext, matrix: Matrix4) {
    const childBounds: Rect = this.prerollChildren(context, matrix)
    this.bounds = childBounds.expandToInclude(context.cullRect)
  }

  /**
   * 绘制
   * @param {PaintContext} context
   */  
  paint (context: PaintContext) {
    const paint = new Paint()
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
