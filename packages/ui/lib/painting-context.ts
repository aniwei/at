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


type PaintingContextCallback = (
  context: PaintingContext,
  offset: Offset
) => void

export class PaintingContext extends ClipContext {
  static create (pipeline: PipelineOwner, containerLayer: ContainerLayer, estimatedBounds: Rect) {
    return new PaintingContext(pipeline, containerLayer, estimatedBounds)
  }

  static fromContext (context: PaintingContext, container?: ContainerLayer) {
    return new PaintingContext(
      context.pipeline,
      container ?? context.containerLayer, 
      context.estimatedBounds
    )
  }

  /**
   * 
   * @param child 
   * @param childContext 
   */
  static repaintCompositedChild (
    child: Object,
    childContext?: PaintingContext | null,
  ) {
    invariant(child.needsPaint)
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
    return !!this._canvas
  }

  // => devicePixelRatio
  public get devicePixelRatio () {
    return this.pipeline.configuration.devicePixelRatio
  }

  // => rasterizer
  public get rasterizer () {
    return this.pipeline.rasterizer
  }

  private _canvas: Canvas | null = null
  public get canvas () {
    if (this._canvas === null) {
      this.startRecording()
    }

    invariant(this._canvas, 'The property "canvas" cannot be null.')
    return this._canvas as Canvas
  }
  public set canvas (canvas: Canvas | null) {
    this._canvas = canvas
  }

  public pipeline: PipelineOwner
  public estimatedBounds: Rect
  public containerLayer: ContainerLayer

  public currentLayer: PictureLayer  | null = null
  public recorder: Recorder | null = null

  constructor (pipeline: PipelineOwner, containerLayer: ContainerLayer, estimatedBounds: Rect) {
    super()
    invariant(containerLayer !== null)
    invariant(estimatedBounds !== null)

    this.pipeline = pipeline
    this.containerLayer = containerLayer
    this.estimatedBounds = estimatedBounds
  }

  acquire (container?: ContainerLayer) {
    return PaintingContext.fromContext(this, container)
  }

  duplicate (container?: ContainerLayer) {
    return this.acquire(container)
  }
  
  paintChild (child: Object, offset: Offset) {
    if (child.isRepaintBoundary) {
      this.stopRecordingIfNeeded()
      this.dispose()
      this.compositeChild(child, offset)
    } else {
      child.paintWithContext(this, offset)
    }
  }

  compositeChild (
    child: Object, 
    offset: Offset
  ) {
    invariant(!this.recording)
    invariant(child.isRepaintBoundary)
    invariant(
      this.canvas === null || 
      this.canvas.count === 1
    )

    if (child.needsPaint) {
      PaintingContext.repaintCompositedChild(child)
    }
    
    invariant(child.layerRef.layer instanceof OffsetLayer)
    const childOffsetLayer = child.layerRef.layer as OffsetLayer
    childOffsetLayer.offset = offset
    
    this.appendLayer(childOffsetLayer)
  }

  appendLayer (layer: Layer) {
    layer.remove()
    this.containerLayer?.append(layer)
  }

  startRecording () {
    invariant(!this.recording, `The paintingcontext cannot recording.`)
    this.currentLayer = new PictureLayer()
    this.recorder = new Recorder()
    this.canvas = this.recorder
    this.containerLayer.append(this.currentLayer)
  }

  stopRecordingIfNeeded () {
    if (this.recording) {
      invariant(this.currentLayer)
      this.currentLayer.picture = this.recorder?.stop()!
    }
  }

  setIsComplexHint () {
    invariant(this.currentLayer)
    this.currentLayer.isComplexHint = true
  }

  setWillChangeHint () {
    invariant(this.currentLayer)
    this.currentLayer.willChangeHint = true
  }

  addLayer (layer: Layer) {
    this.stopRecordingIfNeeded()
    this.dispose()
    this.appendLayer(layer)
  }

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

  createChildContext (
    pipeline: PipelineOwner,
    childLayer: ContainerLayer , 
    bounds: Rect
  ): PaintingContext {
    return PaintingContext.create(pipeline, childLayer, bounds)
  }

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

  toImage (width: number, height: number) {
    this.stopRecordingIfNeeded()
    invariant(this.currentLayer)
    invariant(this.currentLayer.picture)
    const image = this.currentLayer.picture.toImage(width, height)
    return image
  }

  dispose () {
    this.recorder?.dispose()
    this.canvas?.dispose()

    this.currentLayer = null
    this.recorder = null
    this.canvas = null
  }
}

