import { invariant } from '@at/utils' 
import { 
  Engine, 
  Canvas, 
  ColorFilter, 
  Path, 
  Recorder, 
  Skia 
} from '@at/engine'
import { 
  ClipPathLayer, 
  ClipRectLayer, 
  ClipRRectLayer, 
  ColorFilterLayer, 
  ContainerLayer, 
  Layer, 
  OffsetLayer, 
  OpacityLayer, 
  PictureLayer, 
  TransformLayer 
} from '@at/engine'
import { Offset, RRect, Rect } from '@at/geometry'
import { Matrix4, MatrixUtils } from '@at/math'
import { ClipContext } from './clip-context'

import type { Object } from './object'
import type { PipelineOwner } from './pipeline-owner'
import type { Picture } from '@at/engine'


interface PaintingContextCallback {
  (
    context: PaintingContext,
    offset: Offset
  ): void
}

//// => PaintingContext
export class PaintingContext extends ClipContext {
  /**
   * 创建绘制上下文
   * @param {PipelineOwner} pipeline 
   * @param {ContainerLayer} containerLayer 
   * @param {Rect} estimatedBounds 
   * @returns {PaintingContext}
   */
  static create (
    pipeline: PipelineOwner, 
    containerLayer: ContainerLayer, 
    estimatedBounds: Rect
  ) {
    return new PaintingContext(pipeline, containerLayer, estimatedBounds)
  }

  /**
   * 
   * @param {PaintingContext} context 
   * @param {ContainerLayer?} container 
   * @returns 
   */
  static fromContext (context: PaintingContext, container?: ContainerLayer) {
    return new PaintingContext(
      context.pipeline,
      container ?? context.containerLayer, 
      context.estimatedBounds
    )
  }

  /**
   * 重新绘制合成子层
   * @param {Object} child 
   * @param {PaintingContext | null} childContext 
   */
  static repaintCompositedChild (
    child: Object,
    childContext?: PaintingContext | null,
  ) {
    invariant(child.needsPaint, 'The "child.needsPaint" cannot be false.')
    invariant(child.isRepaintBoundary)

    childContext = childContext ?? null

    let childLayer = child.layerRef.layer
    if (childLayer === null) {
      invariant(child.layerRef.layer === null)
      
      const layer = new OffsetLayer()
      child.layerRef.layer = childLayer = layer
    } else {
      childLayer.removeAllChildren()
    }

    invariant(childLayer === child.layerRef.layer)
    invariant(child.owner)
        
    childContext ??= new PaintingContext(child.owner, childLayer, child.bounds)
    child.paintWithContext(childContext, Offset.ZERO)

    invariant(childLayer === child.layerRef.layer)
    childContext.stopRecordingIfNeeded()
    childContext.dispose()
  }

  // => isRecording
  public get recording () {
    return !!this.recorder
  }

  // => devicePixelRatio
  public get devicePixelRatio () {
    return this.pipeline.configuration.devicePixelRatio
  }

  // => rasterizer
  public get rasterizer () {
    return this.pipeline.rasterizer
  }

  // => canvas
  public get canvas () {
    if (this.recorder === null) {
      this.startRecording()
    }

    invariant(this.recorder, 'The property "recorder" cannot be null.')
    return this.recorder as Canvas
  }

  // 渲染管道
  public pipeline: PipelineOwner
  // 渲染边界大小
  public estimatedBounds: Rect
  // 容器层
  public containerLayer: ContainerLayer
  // 当前层
  public currentLayer: PictureLayer  | null = null
  // 绘制指令记录
  public recorder: Recorder | null = null

  constructor (pipeline: PipelineOwner, containerLayer: ContainerLayer, estimatedBounds: Rect) {
    super()
  
    this.pipeline = pipeline
    this.containerLayer = containerLayer
    this.estimatedBounds = estimatedBounds
  }

  /**
   * 
   * @param {ContainerLayer} container 
   * @returns {PaintingContext}
   */
  acquire (container?: ContainerLayer) {
    return PaintingContext.fromContext(this, container)
  }

  duplicate (container?: ContainerLayer) {
    return this.acquire(container)
  }
  
  /**
   * 绘制子层
   * @param {Object} child 
   * @param {Offset} offset 
   */
  paintChild (child: Object, offset: Offset) {
    if (child.isRepaintBoundary) {
      this.stopRecordingIfNeeded()
      this.dispose()
      this.compositeChild(child, offset)
    } else {
      child.paintWithContext(this, offset)
    }
  }

  /**
   * 合成子层
   * @param {Object} child 
   * @param {Offset} offset 
   */
  compositeChild (
    child: Object, 
    offset: Offset
  ) {
    invariant(!this.recording)
    invariant(child.isRepaintBoundary)
    invariant(this.canvas === null || this.canvas.count === 1)

    if (child.needsPaint) {
      PaintingContext.repaintCompositedChild(child)
    }
    
    const childOffsetLayer = child.layerRef.layer as OffsetLayer
    childOffsetLayer.offset = offset
    
    this.appendLayer(childOffsetLayer)
  }

  /**
   * 添加层
   * @param {Layer} layer 
   */
  appendLayer (layer: Layer) {
    layer.remove()
    this.containerLayer?.append(layer)
  }

  /**
   * 开始记录
   */
  startRecording () {
    invariant(!this.recording, `The "PaintingContext.recording" cannot be true.`)

    this.currentLayer = PictureLayer.create()
    this.recorder = new Recorder()
    this.containerLayer.append(this.currentLayer)
  }

  /**
   * 停止记录
   */
  stopRecordingIfNeeded () {
    if (this.recording) {
      invariant(this.currentLayer, 'The "PaintingContext.currentLayer" cannot be null.')
      this.currentLayer.picture = this.recorder?.stop() as unknown as Picture
    }
  }

  setIsComplexHint () {
    invariant(this.currentLayer, 'The "PaintingContext.currentLayer" cannot be null.')
    this.currentLayer.isComplexHint = true
  }

  setWillChangeHint () {
    invariant(this.currentLayer, 'The "PaintingContext.currentLayer" cannot be null.')
    this.currentLayer.willChangeHint = true
  }

  /**
   * 添加层
   * @param {Layer} layer 
   */
  addLayer (layer: Layer) {
    this.stopRecordingIfNeeded()
    this.dispose()
    this.appendLayer(layer)
  }

  /**
   * 添加层
   * @param {ContainerLayer} childLayer 
   * @param {PaintingContextCallback} paint 
   * @param {Offset} offset 
   * @param {Rect | null} childPaintBounds 
   */
  pushLayer (
    childLayer: ContainerLayer, 
    paint: PaintingContextCallback, 
    offset: Offset,
    childPaintBounds?: Rect | null
  ) {
    childPaintBounds = childPaintBounds ?? null
    
    if (childLayer.hasChildren) {
      childLayer.removeAllChildren()
    }

    this.stopRecordingIfNeeded()
    this.dispose()
    this.appendLayer(childLayer)
    
    const childContext = this.createChildContext(
      this.pipeline,
      childLayer, 
      childPaintBounds ?? this.estimatedBounds
    )

    paint(childContext, offset)

    childContext.stopRecordingIfNeeded()
    childContext.dispose()
  }

  /**
   * 创建子上下文
   * @param {PipelineOwner} pipeline 
   * @param {ContainerLayer} childLayer 
   * @param {Rect} bounds 
   * @returns {PaintingContext}
   */
  createChildContext (
    pipeline: PipelineOwner,
    childLayer: ContainerLayer , 
    bounds: Rect
  ): PaintingContext {
    return PaintingContext.create(pipeline, childLayer, bounds)
  }

  /**
   * 
   * @param {boolean} needsCompositing 
   * @param {Offset} offset 
   * @param {Rect} clipRect 
   * @param {PaintingContextCallback} painter 
   * @param {Skia.Cli} clipBehavior 
   * @param {ClipRectLayer | null} oldLayer 
   * @returns 
   */
  pushClipRect (
    needsCompositing: boolean, 
    offset: Offset,
    clipRect: Rect, 
    painter: PaintingContextCallback,
    clipBehavior: Skia.Clip = Engine.skia.Clip.HardEdge, 
    oldLayer?: ClipRectLayer | null
  ): ClipRectLayer | null {
    const offsetClipRect = clipRect.shift(offset)
    if (needsCompositing) {
      const layer = oldLayer ?? new ClipRectLayer(
        offsetClipRect,
        clipBehavior
      )

      this.pushLayer(layer, () => painter(this, offset), offset, offsetClipRect)

      return layer
    } else {
      this.clipRectAndPaint(offsetClipRect, clipBehavior, offsetClipRect, () => painter(this, offset))
      return null
    }
  }

  /**
   * 添加圆角裁剪
   * @param {boolean} needsCompositing 
   * @param {Offset} offset 
   * @param {Rect} bounds 
   * @param {RRect} clipRRect 
   * @param {PaintingContextCallback} painter 
   * @param {Skia.Clip} clipBehavior 
   * @param {ClipRRectLayer | null} oldLayer 
   * @returns {ClipRRectLayer | null}
   */
  pushClipRRect (
    needsCompositing: boolean, 
    offset: Offset,
    bounds: Rect, 
    clipRRect: RRect, 
    painter: PaintingContextCallback,
    clipBehavior: Skia.Clip = Engine.skia.Clip.AntiAlias, 
    oldLayer?: ClipRRectLayer | null
  ): ClipRRectLayer | null  {
    invariant(clipBehavior !== null)
    const offsetBounds = bounds.shift(offset)
    const offsetClipRRect = clipRRect.shift(offset) 
    
    if (needsCompositing) {
      const layer = oldLayer ?? new ClipRRectLayer(
        offsetClipRRect,
        clipBehavior
      )
      this.pushLayer(layer, () => painter(this, offset), offset, offsetBounds)
      return layer
    } else {
      this.clipRRectAndPaint(offsetClipRRect, clipBehavior, offsetBounds, () => painter(this, offset))
      return null
    }
  }

  /**
   * 添加 裁剪
   * @param {boolean} needsCompositing 
   * @param {Offset} offset 
   * @param {Rect} bounds 
   * @param {Path} clipPath 
   * @param {PaintingContextCallback} painter 
   * @param {Skia.Clip} clipBehavior 
   * @param {ClipPathLayer | null} oldLayer 
   * @returns {ClipPathLayer | null}
   */
  pushClipPath (
    needsCompositing: boolean, 
    offset: Offset, 
    bounds: Rect,
    clipPath: Path, 
    painter: PaintingContextCallback,
    clipBehavior: Skia.Clip = Engine.skia.Clip.AntiAlias, 
    oldLayer?: ClipPathLayer | null
  ): ClipPathLayer | null {
    invariant(clipBehavior !== null, `The argument "clipBehavior" cannot be null.`)
    
    const offsetBounds = bounds.shift(offset)
    const offsetClipPath = clipPath.shift(offset)
    
    if (needsCompositing) {
      const layer = oldLayer ?? new ClipPathLayer(
        offsetClipPath,
        clipBehavior
      )
      
      this.pushLayer(
        layer, 
        painter, 
        offset, 
        offsetBounds
      )
      return layer
    } else {
      this.clipPathAndPaint(
        offsetClipPath, 
        clipBehavior, 
        offsetBounds,
        () => painter(this, offset)
      )
      return null
    }
  }

  /**
   * 添加滤镜
   * @param {Offset} offset 
   * @param {ColorFilter} filter 
   * @param {PaintingContextCallback} painter 
   * @param {ColorFilterLayer | null} oldLayer 
   * @returns 
   */
  pushColorFilter (
    offset: Offset, 
    filter: ColorFilter, 
    painter: PaintingContextCallback,
    oldLayer?: ColorFilterLayer | null
  ): ColorFilterLayer {
    invariant(offset !== null)
    const layer = oldLayer ?? new ColorFilterLayer(filter)
    layer.filter = filter
    this.pushLayer(layer, painter, offset)
    return layer
  }

  /**
   * 增加 变换层
   * @param {boolean} needsCompositing 
   * @param {Offset} offset 
   * @param {Matrix4} transform 
   * @param {PaintingContextCallback} painter 
   * @param {TransformLayer | null} oldLayer 
   * @returns {TransformLayer | null}
   */
  pushTransform (
    needsCompositing: boolean, 
    offset: Offset ,
    transform: Matrix4, 
    painter: PaintingContextCallback,
    oldLayer?: TransformLayer | null
  ): TransformLayer | null {
    const effectiveTransform = Matrix4.translationValues(offset.dx, offset.dy, 0.0)
    effectiveTransform.multiply(transform)
    effectiveTransform.translate(-offset.dx, -offset.dy)

    if (needsCompositing) {
      const layer = oldLayer ?? TransformLayer.create(offset, effectiveTransform)
      this.pushLayer(
        layer,
        painter,
        offset,
        MatrixUtils.inverseTransformRect(
          effectiveTransform, 
          this.estimatedBounds
        ),
      )
      return layer
    } else {
      this.canvas?.save()
      this.canvas?.transform(effectiveTransform)
      painter(this, offset)
      this.canvas?.restore()
      return null
    }
  }

  /**
   * 添加透明层
   * @param {Offset} offset 
   * @param {number} alpha 
   * @param {PaintingContextCallback} painter 
   * @param {OpacityLayer | null} oldLayer 
   * @returns 
   */
  pushOpacity (
    offset: Offset, 
    alpha: number, 
    painter: PaintingContextCallback,
    oldLayer?: OpacityLayer | null
  ): OpacityLayer  {
    const layer = oldLayer ?? new OpacityLayer(alpha, offset)
    this.pushLayer(layer, painter, Offset.ZERO)
    return layer
  }

  /**
   * 转位位图
   * @param {number} width 
   * @param {number} height 
   * @returns {Skia.Image}
   */
  toImage (width: number, height: number) {
    this.stopRecordingIfNeeded()
    invariant(this.currentLayer)
    invariant(this.currentLayer.picture)
    const image = this.currentLayer.picture.toImage(width, height)
    return image
  }

  dispose () {
    this.recorder?.dispose()
    this.recorder = null
    this.currentLayer = null
  }
}

