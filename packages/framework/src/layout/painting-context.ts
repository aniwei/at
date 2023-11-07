import { invariant } from '@at/utility' 
import { Clip } from '../engine/skia'
import { AtPath } from '../engine/path'
import { AtColorFilter } from '../engine/color-filter'
import { Matrix4 } from '../basic/matrix4'
import { MatrixUtils } from '../basic/matrix-util'
import { AtCanvas, AtRecorder } from '../engine/canvas'
import { Offset, Rect, RRect } from '../basic/geometry'
import { AtClipPathLayer, AtClipRectLayer, AtClipRRectLayer, AtColorFilterLayer, AtContainerLayer, AtLayer, AtOffsetLayer, AtOpacityLayer, AtPictureLayer, AtTransformLayer } from '../engine/layer'
import { AtClipContext } from './clip-context'
import type { AtLayoutObject } from './object'
import type { AtPipelineOwner } from './pipeline-owner'


type PaintingContextCallback = (
  context: AtPaintingContext,
  offset: Offset
) => void


export class AtPaintingContext extends AtClipContext {
  static create (pipeline: AtPipelineOwner, containerLayer: AtContainerLayer, estimatedBounds: Rect) {
    return new AtPaintingContext(pipeline, containerLayer, estimatedBounds)
  }

  static fromContext (context: AtPaintingContext, container?: AtContainerLayer) {
    return new AtPaintingContext(
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
    child: AtLayoutObject,
    childContext?: AtPaintingContext | null,
  ) {
    invariant(child.needsPaint)
    invariant(child.isRepaintBoundary)

    childContext = childContext ?? null
    // @TODO-DEBUG

    let childLayer = child.layerHandle.layer
    if (childLayer === null) {
      invariant(child.layerHandle.layer === null)
      
      const layer = new AtOffsetLayer()
      child.layerHandle.layer = childLayer = layer
    } else {
      childLayer.removeAllChildren()
    }

    invariant(childLayer === child.layerHandle.layer)
    invariant(child.owner)
        
    childContext ??= new AtPaintingContext(child.owner, childLayer, child.bounds)
    child.paintWithContext(childContext, Offset.zero)

    invariant(childLayer === child.layerHandle.layer)
    childContext.stopRecordingIfNeeded()
    childContext.dispose()
  }

  // => isRecording
  public get isRecording () {
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

  private _canvas: AtCanvas | null = null
  public get canvas () {
    if (this._canvas === null) {
      this.startRecording()
    }
    
    return this._canvas
  }
  public set canvas (canvas: AtCanvas | null) {
    this._canvas = canvas
  }

  public pipeline: AtPipelineOwner
  public estimatedBounds: Rect
  public containerLayer: AtContainerLayer

  public currentLayer: AtPictureLayer  | null = null
  public recorder: AtRecorder | null = null

  constructor (pipeline: AtPipelineOwner, containerLayer: AtContainerLayer, estimatedBounds: Rect) {
    super()
    invariant(containerLayer !== null)
    invariant(estimatedBounds !== null)

    this.pipeline = pipeline
    this.containerLayer = containerLayer
    this.estimatedBounds = estimatedBounds
  }

  acquire (container?: AtContainerLayer) {
    return AtPaintingContext.fromContext(this, container)
  }

  duplicate (container?: AtContainerLayer) {
    return this.acquire(container)
  }
  
  paintChild (child: AtLayoutObject, offset: Offset) {
    if (child.isRepaintBoundary) {
      this.stopRecordingIfNeeded()
      this.dispose()
      this.compositeChild(child, offset)
    } else {
      child.paintWithContext(this, offset)
    }
  }

  compositeChild (
    child: AtLayoutObject, 
    offset: Offset
  ) {
    invariant(!this.isRecording)
    invariant(child.isRepaintBoundary)
    invariant(
      this.canvas === null || 
      this.canvas.getSaveCount() === 1
    )

    if (child.needsPaint) {
      AtPaintingContext.repaintCompositedChild(child)
    }
    
    invariant(child.layerHandle.layer instanceof AtOffsetLayer)
    const childOffsetLayer = child.layerHandle.layer as AtOffsetLayer
    childOffsetLayer.offset = offset
    
    this.appendLayer(childOffsetLayer)
  }

  appendLayer (layer: AtLayer) {
    layer.remove()
    this.containerLayer?.append(layer)
  }

  startRecording () {
    invariant(!this.isRecording, `The paintingcontext cannot recording.`)
    this.currentLayer = new AtPictureLayer()
    this.recorder = new AtRecorder()
    this.canvas = this.recorder
    this.containerLayer.append(this.currentLayer)
  }

  stopRecordingIfNeeded () {
    if (this.isRecording) {
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

  addLayer (layer: AtLayer) {
    this.stopRecordingIfNeeded()
    this.dispose()
    this.appendLayer(layer)
  }

  pushLayer (
    childLayer: AtContainerLayer, 
    painter: PaintingContextCallback, 
    offset: Offset,
    childPaintBounds?: Rect | null
  ) {
    invariant(painter !== null)

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

    painter(childContext, offset)
    childContext.stopRecordingIfNeeded()
    childContext.dispose()
  }

  createChildContext (
    pipeline: AtPipelineOwner,
    childLayer: AtContainerLayer , 
    bounds: Rect
  ): AtPaintingContext {
    return AtPaintingContext.create(pipeline, childLayer, bounds)
  }

  pushClipRect (
    needsCompositing: boolean, 
    offset: Offset,
    clipRect: Rect, 
    painter: PaintingContextCallback,
    clipBehavior: Clip = Clip.HardEdge, 
    oldLayer?: AtClipRectLayer | null
  ): AtClipRectLayer | null {
    const offsetClipRect = clipRect.shift(offset)
    if (needsCompositing) {
      const layer = oldLayer ?? new AtClipRectLayer(
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
    clipBehavior: Clip = Clip.AntiAlias, 
    oldLayer?: AtClipRRectLayer | null
  ): AtClipRRectLayer | null  {
    invariant(clipBehavior !== null)
    const offsetBounds = bounds.shift(offset)
    const offsetClipRRect = clipRRect.shift(offset) //@TODO
    
    if (needsCompositing) {
      const layer = oldLayer ?? new AtClipRRectLayer(
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
    clipPath: AtPath, 
    painter: PaintingContextCallback,
    clipBehavior: Clip = Clip.AntiAlias, 
    oldLayer?: AtClipPathLayer | null
  ): AtClipPathLayer | null {
    invariant(clipBehavior !== null, `The argument "clipBehavior" cannot be null.`)
    
    const offsetBounds = bounds.shift(offset)
    const offsetClipPath = clipPath.shift(offset)
    
    if (needsCompositing) {
      const layer = oldLayer ?? new AtClipPathLayer(
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
    filter: AtColorFilter, 
    painter: PaintingContextCallback,
    oldLayer?: AtColorFilterLayer | null
  ): AtColorFilterLayer {
    invariant(offset !== null)
    const layer = oldLayer ?? new AtColorFilterLayer(filter)
    layer.filter = filter
    this.pushLayer(layer, painter, offset)
    return layer
  }

  pushTransform (
    needsCompositing: boolean, 
    offset: Offset ,
    transform: Matrix4, 
    painter: PaintingContextCallback,
    oldLayer?: AtTransformLayer | null
  ): AtTransformLayer | null {
    const effectiveTransform = Matrix4.translationValues(offset.dx, offset.dy, 0.0)
    effectiveTransform.multiply(transform)
    effectiveTransform.translate(-offset.dx, -offset.dy)

    if (needsCompositing) {
      const layer = oldLayer ?? AtTransformLayer.create(offset, effectiveTransform)
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
    oldLayer?: AtOpacityLayer | null
  ): AtOpacityLayer  {
    const layer = oldLayer ?? new AtOpacityLayer(alpha, offset)
    
    this.pushLayer(layer, painter, Offset.zero)
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
    this.currentLayer = null
    this.recorder = null
    this.canvas = null
  }
}

