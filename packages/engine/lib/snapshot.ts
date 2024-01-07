import { Color } from '@at/basic'
import { invariant } from '@at/utils'
import { Offset, RRect, Rect } from '@at/geometry'

import { Path } from './path'
import { Paint } from './paint'
import { Image } from './image'
import { Picture } from './picture'
import { toMatrix } from './to'
import { Engine } from './engine'
import { ImageFilter } from './image-filter'
import { Paragraph } from './paragraph'

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
// 清除指令
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
      this.path.skia,
      Engine.skia.ClipOp.Intersect,
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
      Engine.skia.ClipOp.Intersect,
      this.doAntiAlias,
    )
  }
}

//// => ClipRectCommand
// 裁剪矩形
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

//// => DrawOvalCommand
// 绘制椭圆
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

//// => DrawPaintCommand
// 绘制画笔
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
    canvas.drawPaint(this.paint.skia)
  }
}

//// => DrawPictureCommand
// 绘制 Picture 对象
export class DrawPictureCommand extends PaintCommand {
  static create (picture: Picture) {
    return super.create(picture)
  }

  protected picture: Picture

  constructor (picture: Picture) {
    super()

    this.picture = picture
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawPicture(this.picture.skia)
  }
}

//// => DrawParagraphCommand
// 绘制段落指令
export class DrawParagraphCommand extends PaintCommand {
  static create (paragraph: Paragraph, offset: Offset) {
    return super.create(paragraph, offset) as DrawParagraphCommand
  }

  protected paragraph: Paragraph
  protected offset: Offset

  constructor (paragraph: Paragraph, offset: Offset) {
    super()
    this.paragraph = paragraph
    this.offset = offset
  }

  apply (canvas: Skia.Canvas) {
    invariant(this.paragraph.skia)
    canvas.drawParagraph(
      this.paragraph.skia,
      this.offset.dx,
      this.offset.dy
    )

    this.paragraph.markUsed()
  }
}

//// => DrawLineCommand
// 绘制线段
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
      this.paint.skia
    )
  }
}

//// => DrawImageNineCommand
// 绘制位图
export class DrawImageNineCommand extends PaintCommand {
  static create (
    image: Image, 
    center: Rect, 
    dest: Rect, 
    paint: Paint
  ) {
    return super.create(image, center, dest, paint)
  }
  protected image: Image 
  protected center: Rect 
  protected dest: Rect
  protected paint: Paint

  constructor (
    image: Image, 
    center: Rect, 
    dest: Rect, 
    paint: Paint
  ) {
    super()

    this.image = image
    this.center = center
    this.dest = dest
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawImageNine(
      this.image.skia,
      this.center,
      this.dest,
      this.paint.filter?.quality === Engine.skia.FilterQuality.None 
        ? Engine.skia.FilterMode.Nearest 
        : Engine.skia.FilterMode.Linear,
      this.paint.skia
    )
  }
}

//// => DrawPathCommand
// 绘制路径
export class DrawPathCommand extends PaintCommand {
  static create (path: Path, paint: Paint) {
    return super.create(paint)
  }

  protected path: Path
  protected paint: Paint

  constructor (path: Path, paint: Paint) {
    super()

    this.path = path
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawPath(
      this.path.skia,
      this.paint.skia
    )
  }
}

//// => DrawRRectCommand
// 绘制圆角矩形
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
    canvas.drawRRect(this.rrect, this.paint.skia)
  }
}

//// => DrawRectCommand
// 绘制矩形
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
    canvas.drawRect(this.rect, this.paint.skia)
  }
}

/// => DrawArcCommand
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
      this.paint.skia
    )
  }
}

//// => DrawCircleCommand
// 绘制圆
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
      this.paint.skia
    )
  }
}

//// => DrawShadowCommand
// 绘制阴影
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
    //   this.path.skia,
    //   this.color,
    //   this.elevation,
    //   this.transparentOccluder
    // )
  }
}

//// => DrawColorCommand
// 绘制颜色
export class DrawColorCommand extends PaintCommand {
  static create (
    color: Color, 
    blendMode: Skia.BlendMode
  ) {
    return super.create(color, blendMode)
  }

  protected color: Color
  protected blendMode: Skia.BlendMode

  constructor (
    color: Color, 
    blendMode: Skia.BlendMode
  ) {
    super()
    this.color = color
    this.blendMode = blendMode
  }

  apply (canvas: Skia.Canvas): void {
    canvas.drawColor(this.color, this.blendMode)
  }
}

//// => SaveLayerCommand
// 保存绘制层
export class SaveLayerCommand extends PaintCommand {
  protected bounds: Rect | null = null
  protected paint: Paint

  constructor (bounds: Rect, paint: Paint) {
    super()

    this.bounds = bounds
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.saveLayer(this.paint.skia, this.bounds)
  }
}

//// => RestoreToCountCommand
// 恢复绘制上下文
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

//// => RestoreCommand
// 恢复上下文
export class RestoreCommand extends PaintCommand {
  apply (canvas: Skia.Canvas): void {
    canvas.restore()
  }
}

//// => ScaleCommand
// 放大
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

//// => RotateCommand
// 旋转
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

//// => SkewCommand
// 倾斜
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

//// => SaveCommand
// => 保存
export class SaveCommand extends PaintCommand {
  apply (canvas: Skia.Canvas): void {
    canvas.save()
  }
}

//// => SaveLayerWithoutBoundsCommand
export class SaveLayerWithoutBoundsCommand extends PaintCommand {
  protected paint: Paint

  constructor (paint: Paint) {
    super()

    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.saveLayer(this.paint.skia, null)
  }
}

//// => SaveLayerWithFilterCommand
export class SaveLayerWithFilterCommand extends PaintCommand {
  protected paint: Paint
  protected bounds: Rect
  protected filter: ImageFilter

  constructor (bounds: Rect, filter: ImageFilter, paint: Paint) {
    super()

    this.bounds = bounds
    this.filter = filter
    this.paint = paint
  }

  apply (canvas: Skia.Canvas): void {
    canvas.saveLayer(this.paint.skia, this.bounds, this.filter.image.skia)
  }
}

//// => TransformCommand
// 形变操作
export class TransformCommand extends PaintCommand {
  protected matrix4: number[]
  constructor (matrix4: number[]) {
    super()

    this.matrix4 = matrix4
  }

  apply (canvas: Skia.Canvas): void {
    canvas.concat(toMatrix(this.matrix4))
  }
}

//// => TranslateCommand
// 位移操作
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
    const recorder: Skia.PictureRecorder = new Engine.skia.PictureRecorder()
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