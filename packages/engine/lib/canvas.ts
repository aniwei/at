import { invariant } from '@at/utils'
import { Color } from '@at/basic'
import { Offset, Rect, RRect } from '@at/geometry'
import { offsetIsValid, rectIsValid, rrectIsValid } from '@at/geometry'
import { toMatrix } from './to'

import { Path } from './path'
import { Paint } from './paint'
import { Picture } from './picture'
import { Image } from './image'
import { ImageFilter } from './image-filter'
import { Engine } from './engine'
import { Paragraph } from './paragraph'
import { 
  ClearCommand, 
  ClipPathCommand, 
  ClipRectCommand, 
  ClipRRectCommand, 
  DrawArcCommand, 
  DrawCircleCommand, 
  DrawImageNineCommand, 
  DrawLineCommand, 
  DrawOvalCommand, 
  DrawPaintCommand, 
  DrawParagraphCommand, 
  DrawPathCommand, 
  DrawPictureCommand, 
  DrawRectCommand, 
  DrawRRectCommand, 
  DrawShadowCommand, 
  PaintCommand, 
  RestoreCommand, 
  RestoreToCountCommand, 
  RotateCommand, 
  SaveCommand, 
  SaveLayerCommand, 
  SaveLayerWithFilterCommand, 
  SaveLayerWithoutBoundsCommand, 
  ScaleCommand, 
  SkewCommand, 
  Snapshot, 
  TransformCommand,
  TranslateCommand
} from './snapshot'

import * as Skia from './skia'

//// => Canvas
// 画布API
export class Canvas extends Skia.ManagedSkiaRef<Skia.Canvas> {
  /**
   * 
   * @param skia 
   * @returns 
   */
  static create (...rests: unknown[]): Canvas
  static create (skia: Skia.Canvas): Canvas {
    return super.create(skia) as Canvas
  }
  // => save count
  // 保存计数
  public get count () {
    return this.skia.getSaveCount()
  }

  // => skia
  // skia 对象
  public get skia () {
    invariant(super.skia)
    return super.skia as Skia.Canvas
  }

  /**
   * 画圆
   * @param {Point} offset
   * @param {number} radius
   * @param {Paint} paint
   * @return {void}
   */
  drawCircle (point: Offset, radius: number, paint: Paint) {
    this.skia.drawCircle(
      point[0],
      point[1],
      radius,
      paint.skia!
    )
  }

  /**
   * 着色
   * @param {Color} color 
   * @param {BlendMode} blendMode 
   */
  drawColor (color: Color, blendMode: Skia.BlendMode) {
    this.skia.drawColorInt(color.value, blendMode)
  }

  /** 
   * 绘制矩形
   * @param {Rect} rect
   * @param {Paint} paint
   * @return {void}
   */
  drawRect (rect: Rect, paint: Paint) {
    invariant(rectIsValid(rect), 'The "rect" argument was invalid.')
    this.skia.drawRect(rect, paint.skia!)
  }

  /**
   * 绘制圆角矩形
   * @param {RRect} rrect
   * @param {Paint} paint
   * @return {*}
   */
  drawRRect (rrect: RRect, paint: Paint) {
    invariant(rrectIsValid(rrect), 'The "rrect" argument was invalid.')
    this.skia.drawRRect(rrect, paint.skia)
  }

  /**
   * 绘制双 RRect
   * @param {RRect} outer 
   * @param {RRect} inner 
   * @param {Paint} paint 
   */
  drawDRRect (outer: RRect, inner: RRect, paint: Paint) {
    invariant(rrectIsValid(outer), `The outer is invalid.`)
    invariant(rrectIsValid(inner), `The inner is invalid.`)
    this.skia.drawDRRect(outer, inner, paint.skia)
  }

  /**
   * 绘图位图
   * @param {Image} image
   * @param {Offset} Offset
   * @param {Paint} paint
   * @return {*}
   */
  drawImage (image: Image, point: Offset, paint: Paint) {
    invariant(offsetIsValid(point), `The argument point is invalid.`)
    const quality = paint.filter?.quality
    
    if (quality === Engine.skia.FilterQuality.High) {
      this.skia.drawImageCubic(
        image.skia,
        point.dx,
        point.dy,
        1.0 / 3.0, // CanvasMitchellNetravaliB
        1.0 / 3.0, // CanvasMitchellNetravaliC
        paint.skia,
      )
    } else {
      this.skia.drawImageOptions(
        image.skia,
        point.dx,
        point.dy,
        quality === Engine.skia.FilterQuality.None 
          ? Engine.skia.FilterMode.Nearest 
          : Engine.skia.FilterMode.Linear,
          quality === Engine.skia.FilterQuality.Medium 
          ? Engine.skia.MipmapMode.Linear 
          : Engine.skia.MipmapMode.None,
        paint.skia,
      )
    }
  }

  /**
   * @param {Image} image
   * @param {Rect} src
   * @param {Rect} dst
   * @param {Paint} paint
   * @return {void}
   */
  drawImageRect (image: Image, src: Rect, dst: Rect, paint: Paint) {
    invariant(rectIsValid(src), 'The "src" argument was invalid.')
    invariant(rectIsValid(dst), 'The "dst" argument was invalid.')

    const quality = paint.filter?.quality
    if (quality === Engine.skia.FilterQuality.High) {
      this.skia.drawImageRectCubic(
        image.skia,
        src,
        dst,
        1.0 / 3.0,
        1.0 / 3.0,
        paint.skia,
      )
    } else {
      this.skia.drawImageRectOptions(
        image.skia,
        src,
        dst,
        quality === Engine.skia.FilterQuality.None 
          ? Engine.skia.FilterMode.Nearest 
          : Engine.skia.FilterMode.Linear,
          quality === Engine.skia.FilterQuality.Medium 
          ? Engine.skia.MipmapMode.Linear 
          : Engine.skia.MipmapMode.None,
        paint.skia,
      )
    }
  }

  /**
   * @param {Image} image
   * @param {Rect} center
   * @param {Rect} dist
   * @param {Paint} paint
   * @return {*}
   */
  drawImageNine (image: Image, center: Rect, dist: Rect, paint: Paint) {    
    invariant(rectIsValid(center), `The argument "center" is invalid.`)
    invariant(rectIsValid(dist), `The argument "dist" is invalid.`)

    this.skia.drawImageNine(
      image.skia,
      center,
      dist,
      paint.filter?.quality === Engine.skia.FilterQuality.None 
        ? Engine.skia.FilterMode.Nearest 
        : Engine.skia.FilterMode.Linear,
      paint.skia,
    )
  }

  /**
   * 绘制图片
   * @param {Picture} picture 
   */
  drawPicture (picture: Picture) {
    this.skia.drawPicture(picture.skia)
  }

  /**
   * 绘制路径
   * @param {Path} path 
   * @param {Paint} paint 
   */
  drawPath (path: Path, paint: Paint) {
    this.skia.drawPath(path.skia, paint.skia)
  }

  /**
   * 绘制线
   * @param {Offset} pointA
   * @param {Offset} pointB
   * @param {Paint} paint
   * @return {void}
   */
  drawLine (pointA: Offset, pointB: Offset, paint: Paint) {
    this.skia.drawLine(
      pointA.dx,
      pointA.dy,
      pointB.dx,
      pointB.dy,
      paint.skia!,
    )
  }

  /**
   * 绘制椭圆
   * @param {Paint} paint
   * @return {void}
   */
  drawOval (rect: Rect, paint: Paint) {
    this.skia.drawOval(rect, paint.skia)
  }

  /**
   * 添加画笔
   * @param {Paint} paint
   * @return {void}
   */
  drawPaint (paint: Paint) {
    this.skia.drawPaint(paint.skia)
  }

  /**
   * 绘制文本
   * @param {Paragraph} paragraph
   * @param {Offset} offset
   * @return {void}
   */
  drawParagraph (paragraph: Paragraph, offset: Offset) {    
    invariant(paragraph.skia)
    this.skia.drawParagraph(paragraph.skia, offset.dx, offset.dy)
    paragraph.markUsed()
  }

  /**
   * 画圆角
   * @param {Rect} oval 
   * @param {number} startAngle 
   * @param {number} sweepAngle 
   * @param {boolean} useCenter 
   * @param {Paint} paint 
   */
  drawArc (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: Paint
  ) {
    const degree = 180.0 / Math.PI
    this.skia.drawArc(
      oval,
      startAngle * degree,
      sweepAngle * degree,
      useCenter,
      paint.skia
    )
  }

  /**
   * 
   * @param path 
   * @param color 
   * @param elevation 
   * @param transparentOccluder 
   */
  drawShadow (
    path: Path, 
    color: Color, 
    elevation: number, 
    transparentOccluder: boolean
  ) {
    // this.drawSkiaShadow(
    //   this.skia, 
    //   path, 
    //   color, 
    //   elevation, 
    //   transparentOccluder,
    //   At.devicePixelRatio
    // )
  }

  /**
   * 设置剪切路径
   * @param {Path} path
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipPath (
    path: Path, 
    doAntiAlias: boolean = true
  ) {
    this.skia.clipPath(path.skia, Engine.skia.ClipOp.Intersect, doAntiAlias)
  }

  /**
   * 圆角矩形裁剪
   * @param {RRect} rrect
   * @param {boolean} doAntiAlias
   * @return {void}
   */
  clipRRect (rrect: RRect, doAntiAlias: boolean = true) {
    invariant(rrectIsValid(rrect), 'The argument "rrect" is invalid.')
    this.skia.clipRRect(rrect, Engine.skia.ClipOp.Intersect, doAntiAlias)
  }

  /**
   * 矩形裁剪
   * @param {Rect} rect
   * @param {ClipOp} clipOp
   * @param {boolean} doAntiAlias
   * @return {void}
   */
  clipRect (rect: Rect, clipOp: Skia.ClipOp, doAntiAlias = true) {
    this.skia.clipRect(rect, clipOp, doAntiAlias)
  }

  /**
   * 
   * @param paint 
   * @param atlas 
   * @param rstTransforms 
   * @param rects 
   * @param colors 
   * @param blendMode 
   */
  // drawAtlasRaw (
  //   paint: Paint,
  //   atlas: Image,
  //   rstTransforms: Float32Array,
  //   rects: Float32Array,
  //   colors: Uint32Array,
  //   blendMode: Skia.BlendMode
  // ) {
  //   this.skia.drawAtlas(
  //     atlas.skia as Skia.Image,
  //     rects,
  //     rstTransforms,
  //     paint.skia,
  //     blendMode,
  //     colors
  //   )
  // }

  save () {
    return this.skia.save()
  }

  saveLayer (bounds: Rect | null = null, paint: Paint | null) {
    this.skia.saveLayer(paint?.skia, bounds, null)
  }

  /**
   * @param {Rect} bounds
   * @param {ImageFilter} filter
   * @param {Paint} paint
   * @return {number}
   */
  saveLayerWithFilter (bounds: Rect, filter: ImageFilter, paint: Paint) {
    return this.skia.saveLayer(paint.skia, bounds, filter.image.skia, 0)
  }

  restore () {
    this.skia.restore()
  }

  restoreToCount (count: number) {
    this.skia.restoreToCount(count)
  }

  rotate (radians: number) {
    this.skia.rotate(radians * 180.0 / Math.PI, 0.0, 0.0)
  }

  /**
   * @description: 
   * @param {number} sx
   * @param {number} sy
   * @return {*}
   */
  scale (sx: number, sy: number = sx) {
    this.skia.scale(sx, sy)
  }

  /**
   * @param {number} sx
   * @param {number} sy
   * @return {*}
   */
  skew (sx: number, sy: number) {
    this.skia.skew(sx, sy)
  }

  /**
   * @param {number[]} matrix4
   * @return {void}
   */
  transform (matrix4: number[]) {
    this.skia.concat(toMatrix(matrix4))
  }

  /**
   * 坐标变换
   * @param {number} dx 
   * @param {number} dy 
   */
  translate (dx: number, dy: number) {
    this.skia.translate(dx, dy)
  }

  clear (color: Color) {
    this.skia.clear(color)
  }
}

//// => Recorder
// 绘制录制
export class Recorder extends Canvas {
  static create (bounds: Rect | null = null) {
    return new Recorder(bounds)
  }

  // 快照
  protected snapshot: Snapshot
  // 绘制范围
  protected cullRect: Rect | null = null
  // 绘制结果
  protected prictue: Skia.PictureRecorder | null = null

  /**
   * 
   * @param {Rect} bounds 
   */
  constructor (bounds: Rect | null = null) {
    const prictue = new Engine.skia.PictureRecorder()
    const cullRect = bounds ?? Rect.LARGEST
    super(prictue.beginRecording(cullRect))

    this.prictue = prictue
    this.cullRect = cullRect
    this.snapshot = new Snapshot(cullRect)
  }

  stop () {
    invariant(this.prictue, `Recorder is not recording`)

    const picture = this.prictue?.finishRecordingAsPicture() as Skia.Picture
    return Picture.create(picture, this.cullRect, this.snapshot)
  }

  addCommand (command: PaintCommand) {
    this.snapshot.commands.push(command)
  }

  clear (color: Color) {
    super.clear(color)
    this.addCommand(ClearCommand.create(color))
  }

  clipPath (path: Path, doAntiAlias: boolean) {
    super.clipPath(path, doAntiAlias)
    this.addCommand(ClipPathCommand.create(path, doAntiAlias))
  }
  
  clipRRect (rrect: RRect, doAntiAlias: boolean) {
    super.clipRRect(rrect, doAntiAlias);
    this.addCommand(ClipRRectCommand.create(rrect, doAntiAlias))
  }

  clipRect (rect: Rect, clipOp: Skia.ClipOp, doAntiAlias: boolean) {
    super.clipRect(rect, clipOp, doAntiAlias)
    this.addCommand(ClipRectCommand.create(rect, clipOp, doAntiAlias))
  }

  /**
   * 
   * @param {Rect} oval 
   * @param {number} startAngle 
   * @param {number} sweepAngle 
   * @param {boolean} useCenter 
   * @param {Paint} paint 
   */
  drawArc (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: Paint
  ) {
    super.drawArc(oval, startAngle, sweepAngle, useCenter, paint);
    this.addCommand(DrawArcCommand.create(oval, startAngle, sweepAngle, useCenter, paint))
  }

  /**
   * 
   * @param {Paint} paint 
   * @param {Image} atlas 
   * @param {number[]} rstTransforms 
   * @param {number[]} rects 
   * @param {number[]} colors 
   * @param {Skia.BlendMode} blendMode 
   */
  drawAtlasRaw(
    paint: Paint,
    atlas: Image,
    rstTransforms: Float32Array,
    rects: Float32Array,
    colors: Uint32Array,
    blendMode: Skia.BlendMode
  ) {
    // super.drawAtlasRaw(paint, atlas, rstTransforms, rects, colors, blendMode)
    // TODO
    // this.addCommand(new AtDrawAtlasCommand(paint, atlas, rstTransforms, rects, colors, blendMode))
  }

  /**
   * 
   * @param point 
   * @param radius 
   * @param paint 
   */
  drawCircle (
    point: Offset,
    radius: number,
    paint: Paint
  ) {
    super.drawCircle(point, radius, paint)
    this.addCommand(DrawCircleCommand.create(point, radius, paint))
  }
  
  /**
   * 
   * @param color 
   * @param blendMode 
   */
  drawColor (color: Color, blendMode: Skia.BlendMode) {
    super.drawColor(color, blendMode)
    // @TODO
    // this.addCommand(DrawColorCommand.create(color, blendMode))
  }
  
  drawDRRect (outer: RRect, inner: RRect, paint: Paint) {
    super.drawDRRect(outer, inner, paint)
    // @TODO
    // this.addCommand(DrawDRRectCommand.create(outer, inner, paint))
  }

  
  drawImage (image: Image, point: Offset, paint: Paint) {
    super.drawImage(image, point, paint)
    // @TODO
    // this.addCommand(new AtDrawImageCommand(image, point, paint))
  }
  
  drawImageRect (
    image: Image, 
    src: Rect, 
    dst: Rect, 
    paint: Paint
  ) {
    super.drawImageRect(image, src, dst, paint)
    // TODO
    // this.addCommand(new AtDrawImageRectCommand(image, src, dst, paint))
  }

  drawImageNine (
    image: Image, 
    center: Rect, 
    dist: Rect, 
    paint: Paint
  ) {
    super.drawImageNine(image, center, dist, paint)
    this.addCommand(DrawImageNineCommand.create(image, center, dist, paint))
  }
  
  drawLine (pointA: Offset, pointB: Offset, paint: Paint) {
    super.drawLine(pointA, pointB, paint)
    this.addCommand(DrawLineCommand.create(pointA, pointB, paint))
  }
  
  drawOval (rect: Rect, paint: Paint) {
    super.drawOval(rect, paint)
    this.addCommand(DrawOvalCommand.create(rect, paint))
  }
  
  drawPaint (paint: Paint) {
    super.drawPaint(paint)
    this.addCommand(DrawPaintCommand.create(paint))
  }
  
  drawParagraph (
    paragraph: Paragraph,
    point: Offset
  ) {
    super.drawParagraph(paragraph, point)
    this.addCommand(DrawParagraphCommand.create(paragraph, point))
  }
  
  drawPath (path: Path, paint: Paint) {
    super.drawPath(path, paint)
    this.addCommand(DrawPathCommand.create(path, paint))
  }
  
  drawPicture (picture: Picture) {
    super.drawPicture(picture)
    this.addCommand(DrawPictureCommand.create(picture))
  }
  //
  //
  // drawPoints (
  //   paint: Paint,
  //   pointMode: PointMode, 
  //   points: Point[]
  // ) {
  //   super.drawPoints(paint, pointMode, points)
  //   this.addCommand(new AtDrawPointsCommand(pointMode, points, paint))
  // }

  drawRRect (
    rrect: RRect, 
    paint: Paint 
  ) {
    super.drawRRect(rrect, paint)
    this.addCommand(DrawRRectCommand.create(rrect, paint))
  }
  
  drawRect (rect: Rect, paint: Paint) {
    super.drawRect(rect, paint)
    this.addCommand(DrawRectCommand.create(rect, paint))
  }
  
  drawShadow (
    path: Path, 
    color: Color, 
    elevation: number, 
    transparentOccluder: boolean    
  ) {
    super.drawShadow(path, color, elevation, transparentOccluder)
    this.addCommand(DrawShadowCommand.create(path, color, elevation, transparentOccluder))
  }

  
  // drawVertices(
  //     CkVertices vertices, ui.BlendMode blendMode, CkPaint paint) {
  //   super.drawVertices(vertices, blendMode, paint);
  //   this.addCommand(CkDrawVerticesCommand(vertices, blendMode, paint));
  // }  
  restore() {
    super.restore()
    this.addCommand(RestoreCommand.create())
  }

  restoreToCount (count: number) {
    super.restoreToCount(count)
    this.addCommand(RestoreToCountCommand.create(count))
  }

  rotate (radians: number) {
    super.rotate(radians)
    this.addCommand(RotateCommand.create(radians))
  }

  
  save (): number {
    const result =  super.save()
    this.addCommand(SaveCommand.create())
    return result
  }

  saveLayer (
    bounds: Rect | null = null, 
    paint: Paint
  ) {
    super.saveLayer(bounds, paint)

    if (bounds === null) {
      this.addCommand(SaveLayerWithoutBoundsCommand.create(paint))
    } else {
      this.addCommand(SaveLayerCommand.create(bounds, paint))
    }
  }
  
  saveLayerWithFilter (
    bounds: Rect, 
    filter: ImageFilter, 
    paint: Paint
  ) {
    const result = super.saveLayerWithFilter(bounds, filter, paint)
    this.addCommand(SaveLayerWithFilterCommand.create(bounds, filter, paint))

    return result
  }

  scale (sx: number, sy: number) {
    super.scale(sx, sy)
    this.addCommand(ScaleCommand.create(sx, sy))
  }

  skew (sx: number, sy: number) {
    super.skew(sx, sy)
    this.addCommand(SkewCommand.create(sx, sy))
  }
  
  transform (matrix4: number[]) {
    super.transform(matrix4)
    this.addCommand(TransformCommand.create(matrix4))
  }

  translate (dx: number, dy: number) {
    super.translate(dx, dy)
    this.addCommand(TranslateCommand.create(dx, dy))
  }
}
