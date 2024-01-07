import { Canvas, Paint, Path, Engine, Image, ColorFilter, Skia, ImageFilter } from '@at/engine'
import { Offset, Rect, Size } from '@at/geometry'
import { invariant } from '@at/utils'
import { Color } from '@at/basic'

import { BorderSide, BorderStyle } from './border'
import { ImageCache } from './image-cache'
import { Alignment } from './alignment'
import { BoxFit, applyBoxFit } from './box-fit'
import { ImageRepeat } from './decoration-image'
import { scaleRect } from './transform'


//// => PaintingCached
// 绘制缓存
export class PaintingCached {
  static create () {
    return new PaintingCached()
  }

  public images: ImageCache = ImageCache.create()
}

export class Painting {
  static cached: PaintingCached = PaintingCached.create()

  // 绘制矩形
  static paintBorderWithRectangle (
    canvas: Canvas,
    rect: Rect, 
    top: BorderSide = BorderSide.NONE,
    right: BorderSide = BorderSide.NONE,
    bottom: BorderSide = BorderSide.NONE,
    left: BorderSide = BorderSide.NONE,
  ) {
    const paint = Paint.create()
    paint.stroke.width = 0

    // @TODO
    // paint.effect = PathDashEffect.create([15, 5, 5, 10], 10)
    const path = Path.create()

    switch (top.style) {
      case BorderStyle.Solid: {
        paint.color = top.color
        path.reset()
        path.moveTo(rect.left, rect.top)
        path.lineTo(rect.right, rect.top)

        if (top.width === 0.0) {
          paint.style = Engine.skia.PaintStyle.Stroke
        } else {
          paint.style = Engine.skia.PaintStyle.Fill
          path.lineTo(rect.right - right.width, rect.top + top.width)
          path.lineTo(rect.left + left.width, rect.top + top.width)
        }
        canvas.drawPath(path, paint)
        break
      }
      
      case BorderStyle.None:
        break
    }

    switch (right.style) {
      case BorderStyle.Solid: {

        paint.color = right.color
        path.reset()
        path.moveTo(rect.right, rect.top)
        path.lineTo(rect.right, rect.bottom)
        
        if (right.width === 0.0)  {
          paint.style = Engine.skia.PaintStyle.Stroke
        } else {
          paint.style = Engine.skia.PaintStyle.Fill
          path.lineTo(rect.right - right.width, rect.bottom - bottom.width)
          path.lineTo(rect.right - right.width, rect.top + top.width)
        }
        
        canvas.drawPath(path, paint)
        break
      }
      case BorderStyle.None:
        break
    }

    switch (bottom.style) {
      case BorderStyle.Solid:
        paint.color = bottom.color
        path.reset()
        path.moveTo(rect.right, rect.bottom)
        path.lineTo(rect.left, rect.bottom)

        if (bottom.width === 0.0) {
          paint.style = Engine.skia.PaintStyle.Stroke
        } else {
          paint.style = Engine.skia.PaintStyle.Fill
          path.lineTo(rect.left + left.width, rect.bottom - bottom.width)
          path.lineTo(rect.right - right.width, rect.bottom - bottom.width)
        }
        canvas.drawPath(path, paint)
        break
      case BorderStyle.None:
        break
    }

    switch (left.style) {
      case BorderStyle.Solid:
        paint.color = left.color
        path.reset()
        path.moveTo(rect.left, rect.bottom)
        path.lineTo(rect.left, rect.top)

        if (left.width === 0.0) {
          paint.style = Engine.skia.PaintStyle.Stroke
        } else {
          paint.style = Engine.skia.PaintStyle.Fill
          path.lineTo(rect.left + left.width, rect.top + top.width)
          path.lineTo(rect.left + left.width, rect.bottom - bottom.width)
        }
        canvas.drawPath(path, paint)
        break
      case BorderStyle.None:
        break
    }
  }

  // 绘制不规则图形
  static paintBorderWithIrregular (
    canvas: Canvas,
    shape: Path, 
    side: BorderSide
  ) {
    const paint = Paint.create()
    paint.stroke.width = 0
    paint.color = side.color

    const path = shape ?? Path.create()

    switch (side.style) {
      case BorderStyle.None:
        break

      case BorderStyle.Solid:
        paint.style = Engine.skia.PaintStyle.Stroke
        paint.stroke.width = side.width
        canvas.drawPath(path, paint)
        break
    }
  }

  static paintWithImage (
    canvas: Canvas,
    rect: Rect,
    image: Image,
    scale: number = 1.0,
    opacity: number = 1.0,
    filter: ColorFilter | null = null,
    fit: BoxFit | null = null,
    alignment: Alignment = Alignment.CENTER,
    center: Rect | null = null,
    repeat: ImageRepeat = ImageRepeat.NoRepeat,
    flipHorizontally: boolean = false,
    invertColors: boolean = false,
    quality: Skia.FilterQuality = Engine.skia.FilterQuality.Low,
    isAntiAlias: boolean = false,
  ) {
    if (rect.isEmpty) {
      return
    }

    let output = rect.size
    let input = Size.create(image.width, image.height)
    let slice: Size | null  

    if (center !== null) {
      slice = input.divide(scale).subtract(center.size)
      output = output.subtract(slice)
      input = input.subtract(slice.multiply(scale))
    }

    fit ??= center == null ? BoxFit.ScaleDown : BoxFit.Fill
    invariant(center === null || (fit !== BoxFit.None && fit !== BoxFit.Cover))

    const fittedSizes = applyBoxFit(fit, input.divide(scale), output)
    const source = fittedSizes.source.multiply(scale)
    let destination = fittedSizes.destination
    
    if (center !== null) {
      output = output.add(slice!)
      destination = destination.add(slice!)
    
      invariant(source.equal(input), 'centerSlice was used with a BoxFit that does not guarantee that the image is fully visible.')
    }

    if (repeat !== ImageRepeat.NoRepeat && destination.equal(output)) {
      repeat = ImageRepeat.NoRepeat
    }
    

    const paint = Paint.create()
    paint.isAntiAlias = isAntiAlias

    // @TODO
    //paint.filter.image = ImageFilter.blur(9, 9, Engine.skia.TileMode.Clamp)
    ImageFilter.blur(9, 9, Engine.skia.TileMode.Clamp)

    if (filter !== null) {
      // @TODO
      // paint.filter.color = filter
    }

    paint.color = Color.fromRGBO(0, 0, 0, opacity)
    paint.filter.quality = quality
    // @TODO
    // paint.invertColors = invertColors

    const halfWidthDelta = (output.width - destination.width) / 2
    const halfHeightDelta = (output.height - destination.height) / 2

    const dx = halfWidthDelta + (flipHorizontally ? -alignment.x : alignment.x) * halfWidthDelta
    const dy = halfHeightDelta + alignment.y * halfHeightDelta

    const destinationPosition: Offset = rect.topLeft.translate(dx, dy)
    const destinationRect = destinationPosition.and(destination)

    const invertedCanvas = false

    const saved = (
      center !== null || 
      repeat !== ImageRepeat.NoRepeat || 
      flipHorizontally
    )
  
    if (saved) {
      canvas.save()
    }
    
    if (repeat !== ImageRepeat.NoRepeat) {
      canvas.clipRect(rect, Engine.skia.ClipOp.Intersect)
    }
  
    if (flipHorizontally) {
      const dx = -(rect.left + rect.width / 2)
      canvas.translate(-dx, 0)
      canvas.scale(-1, 1)
      canvas.translate(dx, 0)
    }
  
    if (center === null) {
      const sourceRect = alignment.inscribe(source, Offset.ZERO.and(input))
  
      if (repeat === ImageRepeat.NoRepeat) {
        canvas.drawImageRect(image, sourceRect, destinationRect, paint)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          canvas.drawImageRect(image, sourceRect, tileRect, paint)
        }
      }
    } else {
      canvas.scale(1 / scale, 1)
      if (repeat === ImageRepeat.NoRepeat) {
        canvas.drawImageNine(image, scaleRect(center, scale), scaleRect(destinationRect, scale), paint)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          canvas.drawImageNine(image, scaleRect(center, scale), scaleRect(tileRect, scale), paint)
        }
      }
    }
  
    if (saved) {
      canvas.restore()
    }
  
    if (invertedCanvas) {
      canvas.restore()
    }
  }
}


export function createImageTileRects (
  output: Rect, 
  fundamental: Rect, 
  repeat: ImageRepeat
): Rect[] {
  let startX = 0
  let startY = 0
  let stopX = 0
  let stopY = 0
  const strideX = fundamental.width
  const strideY = fundamental.height

  if (repeat === ImageRepeat.Repeat || repeat === ImageRepeat.RepeatX) {
    startX = Math.floor(((output.left - fundamental.left) / strideX))
    stopX = Math.ceil(((output.right - fundamental.right) / strideX))
  }

  if (repeat === ImageRepeat.Repeat || repeat === ImageRepeat.RepeatY) {
    startY = Math.floor(((output.top - fundamental.top) / strideY))
    stopY = Math.ceil(((output.bottom - fundamental.bottom) / strideY))
  }

  const rects: Rect[] = []

  for (let i = startX; i <= stopX; ++i) {
    for (let j = startY; j <= stopY; ++j) {
      rects.push(fundamental.shift(new Offset(i * strideX, j * strideY)))
    }
  }

  return rects
}

