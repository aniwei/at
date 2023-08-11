import { invariant } from 'ts-invariant'
import { AtCanvas } from '../engine/canvas'
import { AtPaint } from '../engine/paint'
import { AtPath } from '../engine/path'
import { AtImage } from '../engine/image'
import { Color } from '../basic/color'
import { AtColorFilter } from '../engine/color-filter'
import { AtAlignment } from './alignment'
import { applyBoxFit, BoxFit } from './box-fit'
import { ImageRepeat } from './decoration-image'
import { Offset, Rect, Size } from '../basic/geometry'
import { At } from '../at'

import type { FilterQuality, PaintStyle, TextDirection } from '../engine/skia'
import { AtBorderSide, BorderStyle } from './border'

export enum Axis {
  Horizontal,
  Vertical
}

export type Padding = {
  left: number,
  top: number,
  right: number,
  bottom: number
}

export class AtPainting {
  static paintBorderWithRectangle (
    canvas: AtCanvas,
    rect: Rect, 
    top: AtBorderSide = AtBorderSide.none,
    right: AtBorderSide = AtBorderSide.none,
    bottom: AtBorderSide = AtBorderSide.none,
    left: AtBorderSide = AtBorderSide.none,
  ) {
    invariant(canvas !== null, `The canvas argument cannot be null.`)
    invariant(rect !== null, `The rect argument cannot be null.`)
    invariant(top !== null, `The top argument cannot be null.`)
    invariant(right !== null, `The right argument cannot be null.`)
    invariant(bottom !== null, `The bottom argument cannot be null.`)
    invariant(left !== null, `The left argument cannot be null.`)

    const paint = AtPaint.create()
    paint.strokeWidth = 0

    const path = AtPath.create()

    switch (top.style) {
      case BorderStyle.Solid: {
        paint.color = top.color
        path.reset()
        path.moveTo(rect.left, rect.top)
        path.lineTo(rect.right, rect.top)

        if (top.width == 0.0) {
          paint.style = At.PaintStyle.Stroke
        } else {
          paint.style =  At.PaintStyle.Fill
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
        
        if (right.width === 0)  {
          paint.style = At.PaintStyle.Stroke
        } else {
          paint.style = At.PaintStyle.Fill
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
        if (bottom.width === 0) {
          paint.style = At.PaintStyle.Stroke
        } else {
          paint.style = At.PaintStyle.Fill
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
        if (left.width === 0) {
          paint.style = At.PaintStyle.Stroke
        } else {
          paint.style = At.PaintStyle.Fill
          path.lineTo(rect.left + left.width, rect.top + top.width)
          path.lineTo(rect.left + left.width, rect.bottom - bottom.width)
        }
        canvas.drawPath(path, paint)
        break
      case BorderStyle.None:
        break
    }
  }

  static paintBorderWithIrregular (
    canvas: AtCanvas,
    shape: AtPath, 
    side: AtBorderSide
  ) {
    const paint = AtPaint.create()
    paint.strokeWidth = 0
    paint.color = side.color

    const path = shape ?? AtPath.create()

    switch (side.style) {
      case BorderStyle.None:
        break

      case BorderStyle.Solid:
        paint.style = At.PaintStyle.Stroke
        paint.strokeWidth = side.width
        canvas.drawPath(path, paint)
        break
    }
  }

  static paintImage (
    canvas: AtCanvas,
    rect: Rect,
    image: AtImage,
    scale: number = 1.0,
    opacity: number = 1.0,
    colorFilter: AtColorFilter | null = null,
    fit: BoxFit | null = null,
    alignment: AtAlignment = AtAlignment.center,
    centerSlice: Rect | null = null,
    repeat: ImageRepeat = ImageRepeat.NoRepeat,
    flipHorizontally: boolean = false,
    invertColors: boolean = false,
    filterQuality: FilterQuality = At.FilterQuality.Low,
    isAntiAlias: boolean = false,
  ) {
    invariant(canvas !== null, `The argument canvas cannot be null.`)
    invariant(image !== null, `The argument image cannot be null.`)
    invariant(alignment !== null, `The argument alignment cannot be null.`)
    invariant(repeat !== null, `The argument repeat cannot be null.`)
    invariant(flipHorizontally !== null, `The argument flipHorizontally cannot be null.`)
    invariant(isAntiAlias !== null, `The argument isAntiAlias cannot be null.`)

    if (rect.isEmpty) {
      return
    }

    let outputSize = rect.size
    let inputSize = new Size(image.width, image.height)
    let sliceBorder: Size | null  

    if (centerSlice !== null) {
      sliceBorder = inputSize.divide(scale).subtract(centerSlice.size) as Size
      outputSize = outputSize.subtract(sliceBorder) as Size
      inputSize = inputSize.subtract(sliceBorder.multiply(scale)) as Size
    }

    fit ??= centerSlice == null ? BoxFit.ScaleDown : BoxFit.Fill
    invariant(centerSlice === null || (fit !== BoxFit.None && fit !== BoxFit.Cover))

    const fittedSizes = applyBoxFit(fit, inputSize.divide(scale), outputSize)
    const sourceSize = fittedSizes.source.multiply(scale)
    let destinationSize = fittedSizes.destination
    
    if (centerSlice !== null) {
      outputSize = outputSize.add(sliceBorder!)
      destinationSize = destinationSize.add(sliceBorder!)
    
      invariant(sourceSize.equal(inputSize), 'centerSlice was used with a BoxFit that does not guarantee that the image is fully visible.')
    }

    if (repeat !== ImageRepeat.NoRepeat && destinationSize.equal(outputSize)) {
      repeat = ImageRepeat.NoRepeat
    }
    

    const paint = new AtPaint()
    paint.isAntiAlias = isAntiAlias

    // paint.imageFilter = At.AtImageFilter.blur(9, 9, At.TileMode.Clamp)

    if (colorFilter !== null) {
      paint.colorFilter = colorFilter
    }

    paint.color = Color.fromRGBO(0, 0, 0, opacity)
    paint.filterQuality = filterQuality
    paint.invertColors = invertColors

    const halfWidthDelta = (outputSize.width - destinationSize.width) / 2;
    const halfHeightDelta = (outputSize.height - destinationSize.height) / 2;
    const dx = halfWidthDelta + (flipHorizontally ? -alignment.x : alignment.x) * halfWidthDelta;
    const dy = halfHeightDelta + alignment.y * halfHeightDelta;
    const destinationPosition: Offset = rect.topLeft.translate(dx, dy)
    const destinationRect = destinationPosition.and(destinationSize)

    const invertedCanvas = false

    const needSave = (
      centerSlice !== null || 
      repeat !== ImageRepeat.NoRepeat || 
      flipHorizontally
    )
  
    if (needSave) {
      canvas.save()
    }
    
    if (repeat !== ImageRepeat.NoRepeat) {
      canvas.clipRect(rect)
    }
  
    if (flipHorizontally) {
      const dx = -(rect.left + rect.width / 2)
      canvas.translate(-dx, 0)
      canvas.scale(-1, 1)
      canvas.translate(dx, 0)
    }
  
    if (centerSlice === null) {
      const sourceRect = alignment.inscribe(sourceSize, Offset.zero.and(inputSize))
  
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
        canvas.drawImageNine(image, scaleRect(centerSlice, scale), scaleRect(destinationRect, scale), paint)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          canvas.drawImageNine(image, scaleRect(centerSlice, scale), scaleRect(tileRect, scale), paint)
        }
      }
    }
  
    if (needSave) {
      canvas.restore()
    }
  
    if (invertedCanvas) {
      canvas.restore()
    }
  }
}


export function createImageTileRects (
  outputRect: Rect, 
  fundamentalRect: Rect, 
  repeat: ImageRepeat
): Rect[] {
  let startX = 0
  let startY = 0
  let stopX = 0
  let stopY = 0
  const strideX = fundamentalRect.width
  const strideY = fundamentalRect.height

  if (repeat === ImageRepeat.Repeat || repeat === ImageRepeat.RepeatX) {
    startX = Math.floor(((outputRect.left - fundamentalRect.left) / strideX))
    stopX = Math.ceil(((outputRect.right - fundamentalRect.right) / strideX))
  }

  if (repeat === ImageRepeat.Repeat || repeat === ImageRepeat.RepeatY) {
    startY = Math.floor(((outputRect.top - fundamentalRect.top) / strideY))
    stopY = Math.ceil(((outputRect.bottom - fundamentalRect.bottom) / strideY))
  }

  const rects: Rect[] = []

  for (let i = startX; i <= stopX; ++i) {
    for (let j = startY; j <= stopY; ++j) {
      rects.push(fundamentalRect.shift(new Offset(i * strideX, j * strideY)))
    }
  }

  return rects
}

/**
 * @description: 
 * @param {Rect} rect
 * @param {number} scale
 * @return {*}
 */
function scaleRect(rect: Rect, scale: number): Rect {
  return Rect.fromLTRB(
    rect.left * scale, 
    rect.top * scale, 
    rect.right * scale, 
    rect.bottom * scale
  )
}
