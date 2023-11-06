import { At } from '@at/core'
import { Color } from '@at/basic'
import { toMatrix } from '@at/utility'
import { Offset, RRect, Rect } from '@at/geometry'

import { Path } from './path'
import { Paint } from './paint'
import { Image } from './image'
// import { Paragraph } from './paragraph'

import * as Skia from './skia'

//// => PaintCommand
// 绘制指令
export interface PaintCommandFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}

export abstract class PaintCommand {
  static create <T extends PaintCommand> (...rests: unknown[]): PaintCommand {
    const Factory = this as unknown as PaintCommandFactory<T>
    return new Factory(...rests)
  }

  abstract apply (canvas: Skia.Canvas): void

  dispose () {}
}

//// => ClearCommand
// 清楚指令
export class ClearCommand extends PaintCommand {
  static create (color: Color) {
    return super.create(color)
  }

  protected color: Color

  constructor (color: Color) {
    super()
    this.color = color
  }

  apply (canvas: Skia.Canvas) {
    canvas.clear(this.color)
  }
}

//// => ClipPathCommand
// 裁剪指令
export class ClipPathCommand extends PaintCommand {
  static create (path: Path, doAntiAlias: boolean) {
    return super.create(path, doAntiAlias) as ClipPathCommand
  }

  protected path: Path
  protected doAntiAlias: boolean

  constructor (path: Path, doAntiAlias: boolean) {
    super()
    this.path = path
    this.doAntiAlias = doAntiAlias
  }

  apply (canvas: Skia.Canvas) {
    canvas.clipPath(
      this.path.skia!,
      At.skia.ClipOp.Intersect,
      this.doAntiAlias,
    )
  }
}
//// => ClipRRectCommand
export class ClipRRectCommand extends PaintCommand {
  static create (rrect: RRect, doAntiAlias: boolean) {
    return super.create(rrect, doAntiAlias) as ClipRRectCommand
  }

  protected rrect: RRect
  protected doAntiAlias: boolean

  constructor (rrect: RRect, doAntiAlias: boolean) {
    super()
    this.rrect = rrect
    this.doAntiAlias = doAntiAlias
  }

  apply (canvas: Skia.Canvas) {
    canvas.clipRRect(
      this.rrect,
      At.skia.ClipOp.Intersect,
      this.doAntiAlias,
    )
  }
}

export class ClipRectCommand extends PaintCommand {
  static create (rect: Rect, clipOp: Skia.ClipOp, doAntiAlias: boolean) {
    return super.create(rect, clipOp, doAntiAlias)
  }

  protected rect: Rect
  protected clipOp: Skia.ClipOp
  protected doAntiAlias: boolean

  constructor (rect: Rect, clipOp: Skia.ClipOp, doAntiAlias: boolean) {
    super()
    this.clipOp = clipOp
    this.rect = rect
    this.doAntiAlias = doAntiAlias
  }

  apply (canvas: Skia.Canvas) {
    canvas.clipRect(
      this.rect,
      this.clipOp,
      this.doAntiAlias,
    )
  }
}

export class DrawOvalCommand extends PaintCommand {
  static create (rect: Rect, paint: Paint) {
    return super.create(rect, paint)
  }
  protected rect: Rect
  protected paint: Paint

  constructor (rect: Rect, paint: Paint) {
    super()

    this.rect = rect
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawOval(this.rect, this.paint.skia)
  }
}

export class DrawPaintCommand extends PaintCommand {
  static create (paint: Paint) {
    return super.create(paint)
  }

  protected paint: Paint

  constructor (paint: Paint) {
    super()

    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawPaint(this.paint.skia!)
  }
}

// @TODOs
// export class DrawParagraphCommand extends PaintCommand {
//   protected paragraph: Paragraph
//   protected offset: Offset

//   constructor (paragraph: Paragraph, offset: Offset) {
//     super()
//     this.paragraph = paragraph
//     this.offset = offset
//   }

//   apply (canvas: Skia.Canvas) {
//     invariant(this.paragraph.skia)
//     canvas.drawParagraph(
//       this.paragraph.skia,
//       this.offset.dx,
//       this.offset.dy
//     )

//     this.paragraph.markUsed()
//   }
// }

export class DrawLineCommand extends PaintCommand {
  static create (pointA: Offset, pointB: Offset, paint: Paint) {
    return super.create(pointA, pointB, paint)
  }

  protected pointA: Offset
  protected pointB: Offset
  protected paint: Paint

  constructor (pointA: Offset, pointB: Offset, paint: Paint) {
    super()

    this.pointA = pointA
    this.pointB = pointB
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawLine(
      this.pointA.dx, 
      this.pointA.dy, 
      this.pointB.dx, 
      this.pointB.dy,
      this.paint.skia!
    )
  }
}

export class DrawImageNineCommand extends PaintCommand {
  static create (
    image: Image, 
    center: Rect, 
    dist: Rect, 
    paint: Paint
  ) {
    return super.create(image, center, dist, paint)
  }
  protected image: Image 
  protected center: Rect 
  protected dist: Rect
  protected paint: Paint

  constructor (
    image: Image, 
    center: Rect, 
    dist: Rect, 
    paint: Paint
  ) {
    super()

    this.image = image
    this.center = center
    this.dist = dist
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawImageNine(
      this.image.skia,
      this.center,
      this.dist,
      // @TODO
      At.skia.FilterMode.Nearest
      // this.paint.filterQuality === At.FilterQuality.None 
      //   ? At.FilterMode.Nearest 
      //   : At.FilterMode.Linear,
      // this.paint.skia
    )
  }
}

export class DrawRRectCommand extends PaintCommand {
  static create (rrect: RRect, paint: Paint) {
    return super.create(rrect, paint)
  }

  protected rrect: RRect
  protected paint: Paint
  constructor (rrect: RRect, paint: Paint) {
    super()

    this.rrect = rrect
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawRRect(this.rrect, this.paint.skia!)
  }
}

export class DrawRectCommand extends PaintCommand {
  static create (rect: Rect, paint: Paint) {
    return super.create(rect, paint)
  }

  protected rect: Rect
  protected paint: Paint
  
  constructor (rect: Rect, paint: Paint) {
    super()

    this.rect = rect
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawRect(this.rect, this.paint.skia!)
  }
}

export class DrawArcCommand extends PaintCommand {
  static create (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: Paint
  ) {
    return super.create(
      oval,
      startAngle,
      sweepAngle,
      useCenter,
      paint,
    )
  }

  protected oval: Rect
  protected startAngle: number
  protected sweepAngle: number
  protected useCenter: boolean
  protected paint: Paint

  constructor (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: Paint
  ) {
    super()
    this.oval = oval
    this.startAngle = startAngle
    this.sweepAngle = sweepAngle
    this.useCenter = useCenter
    this.paint = paint
  }

  apply (canvas: Skia.Canvas) {
    const degrees = 180 / Math.PI
    canvas.drawArc(
      this.oval,
      this.startAngle * degrees,
      this.sweepAngle * degrees,
      this.useCenter,
      this.paint.skia!
    )
  }
}

export class DrawCircleCommand extends PaintCommand {
  static create (
    point: Offset,
    radius: number,
    paint: Paint
  ) {
    return super.create(point, radius, paint)
  }

  protected point: Offset
  protected radius: number
  protected paint: Paint

  constructor (
    point: Offset,
    radius: number,
    paint: Paint
  ) {
    super()

    this.point = point
    this.radius = radius
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawCircle(
      this.point.dx,
      this.point.dy,
      this.radius,
      this.paint.skia!
    )
  }
}

export class DrawShadowCommand extends PaintCommand {
  static create (
    path: Path, 
    color: Color, 
    elevation: number, 
    transparentOccluder: boolean 
  ) {
    return super.create(path, color, elevation, transparentOccluder)
  }

  protected path: Path 
  protected color: Color
  protected elevation: number
  protected transparentOccluder: boolean 

  constructor (
    path: Path, 
    color: Color, 
    elevation: number, 
    transparentOccluder: boolean 
  ) {
    super()

    this.path = path
    this.color = color
    this.elevation = elevation
    this.transparentOccluder = transparentOccluder
  }

  apply (canvas: Skia.Canvas): void {
    // TODO
    // canvas.drawShadow(
    //   this.path.skia!,
    //   this.color,
    //   this.elevation,
    //   this.transparentOccluder
    // )
  }
}

// export class DrawColorCommand extends PaintCommand {
//   static create (
//     color: Path, 
//     color: Color, 
//     elevation: number, 
//     transparentOccluder: boolean 
//   ) {
//     return super.create(path, color, elevation, transparentOccluder)
//   }

//   apply (canvas: Skia.Canvas): void {
//     // TODO
//     // canvas.drawShadow(
//     //   this.path.skia!,
//     //   this.color,
//     //   this.elevation,
//     //   this.transparentOccluder
//     // )
//   }
// }

export class SaveLayerCommand extends PaintCommand {
  protected bounds: Rect | null = null
  protected paint: Paint

  constructor (bounds: Rect, paint: Paint) {
    super()

    this.bounds = bounds
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.saveLayer(this.paint.skia!, this.bounds)
  }
}

export class RestoreToCountCommand extends PaintCommand {
  protected count: number
  constructor (count: number) {
    super()

    this.count = count
  }

  apply (canvas: Skia.Canvas): void {
    canvas.restoreToCount(this.count)
  }
}

export class RestoreCommand extends PaintCommand {
  apply (canvas: Skia.Canvas): void {
    canvas.restore()
  }
}

export class ScaleCommand extends PaintCommand {
  protected sx: number
  protected sy: number

  constructor (sx: number, sy: number) {
    super()

    this.sx = sx
    this.sy = sy
  }

  apply (canvas: Skia.Canvas): void {
    canvas.scale(this.sx, this.sy)
  }
}

export class RotateCommand extends PaintCommand {
  protected radians: number

  constructor (radians: number) {
    super()

    this.radians = radians
  }

  apply (canvas: Skia.Canvas): void {
    canvas.rotate(this.radians * 180.0 / Math.PI, 0, 0)
  }
}

export class SkewCommand extends PaintCommand {
  protected sx: number
  protected sy: number

  constructor (sx: number, sy: number) {
    super()

    this.sx = sx
    this.sy = sy
  }

  apply (canvas: Skia.Canvas): void {
    canvas.skew(this.sx, this.sy)
  }
}

export class SaveCommand extends PaintCommand {
  apply (canvas: Skia.Canvas): void {
    canvas.save()
  }
}

export class SaveLayerWithoutBoundsCommand extends PaintCommand {
  protected paint: Paint

  constructor (paint: Paint) {
    super()

    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.saveLayer(this.paint.skia!, null)
  }
}

export class TransformCommand extends PaintCommand {
  protected matrix4: ArrayLike<number>
  constructor (matrix4: ArrayLike<number>) {
    super()

    this.matrix4 = matrix4
  }

  apply (canvas: Skia.Canvas): void {
    canvas.concat(toMatrix(this.matrix4))
  }
}

export class TranslateCommand extends PaintCommand {
  protected dx: number 
  protected dy: number

  constructor (dx: number, dy: number) {
    super()
    this.dx = dx
    this.dy = dy
  }

  apply (canvas: Skia.Canvas): void {
    canvas.translate(this.dx, this.dy)
  }
}

//// => Snapshot
// 绘制快照
export class Snapshot {
  // 绘制边界
  public bounds: Rect
  // 绘制指令集
  public commands: PaintCommand[] = []

  constructor (bounds: Rect) {
    this.bounds = bounds
  }

  toPicture () {
    const recorder: Skia.PictureRecorder = new At.skia.PictureRecorder()
    const canvas: Skia.Canvas = recorder.beginRecording(this.bounds)
    
    for (const command of this.commands) {
      command.apply(canvas)
    }

    const picture: Skia.Picture = recorder.finishRecordingAsPicture()
    recorder.delete()

    return picture
  }

  dispose() {
    for (const command of this.commands) {
      command.dispose()
    }
  }
}