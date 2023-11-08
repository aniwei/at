import invariant from '@at/utils'
import { AtLayerScene, AtCanvas, AtImage, AtLayoutCustomPainter, AtPaint, AtPaintingContext, AtTransformLayer, Matrix4, Offset, Rect, Size, AtLayoutCustom } from '@at/framework'


export abstract class AtSnapshot<T extends AtLayoutCustomPainter> extends AtLayoutCustom<T> {
  abstract frame: Rect
  protected snapshot: AtImage | null = null

  markNeedsPaint(): void {
    this.snapshot = null
    super.markNeedsPaint()
  }

  raster (frame: any, layer: any) {
    frame.raster(AtLayerScene.create(layer).tree, true)
    this.snapshot = frame.submit()
  } 

  buildScene (context: AtPaintingContext) {
    invariant((() => {
      console.time(`buildScene`)
      return true
    })())
    const { rasterizer, devicePixelRatio } = context
    const { left, top, width, height } = this.frame
    const transform = Matrix4.diagonal3Values(devicePixelRatio, devicePixelRatio, 1)
    
    const layer = AtTransformLayer.create(
      Offset.create(-left, -top), 
      transform
    )

    const size = Size.create(
      width * devicePixelRatio,
      height * devicePixelRatio
    )

    const frame = rasterizer.acquireFrame(size.equal(Size.zero) ? Size.create(10, 10) : size)
    
    this.duplicateContextAndPaint(context.duplicate(layer))
    this.raster(frame, layer)

    invariant((() => {
      console.timeEnd(`buildScene`)
      return true
    })())
  }

  duplicateContextAndPaint (context: AtPaintingContext) {
    super.paint(context, Offset.zero)
    context.stopRecordingIfNeeded()
  }

  paintSnapshot (
    canvas: AtCanvas, 
    size: Size, 
    offset: Offset, 
    devicePixelRatio: number = 1.0
  ) {
    const rect = Offset.zero.and(size.multiply(devicePixelRatio))
    invariant(this.snapshot !== null)

    canvas.drawImageRect(
      this.snapshot, 
      rect, 
      offset.and(size), 
      AtPaint.create()
    )
  }

  paint (context: AtPaintingContext, offset: Offset) {   
    // return super.paint(context, offset) 
    this.snapshot ?? this.buildScene(context)
    
    const { devicePixelRatio } = context
    const { width, height } = this.frame
    const size = Size.create(width, height)
    
    invariant(context.canvas !== null)
    this.paintSnapshot(
      context.canvas,
      size,
      offset,
      devicePixelRatio
    )
  }
}
