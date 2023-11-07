import { invariant } from '@at/utility'


import { At } from '../at'
import { Color } from '../basic/color'
import { ArgumentError } from '../basic/error'
import { AtPath } from './path'
import { AtPicture } from './picture'
import { RRect, Rect, Point, Offset } from '../basic/geometry'
import { offsetIsValid, rectIsValid, rrectIsValid, toMatrix, toPoints } from '../basic/helper'
import { Canvas, ClipOp, PointMode, BlendMode, PictureRecorder, Picture, Paint } from './skia'


import type { ArrayLike } from '../at'
import type { AtPaint } from './paint'
import type { AtImage } from './image'
import type { AtParagraph } from './text'
import type { AtImageFilter, AtManagedSkiaImageFilterConvertible } from './image-filter'

export class AtCanvas {
  
  public get saveCount () {
    return this.skia.getSaveCount()
  }
  
  protected snapshot: AtSnapshot | null = null
  protected skia: Canvas
  
  /**
   * 构造函数
   * @param {Canvas} skia
   * @return {Canvas}
   */  
  constructor (skia: Canvas) {
    this.skia = skia
  }

  /**
   * 获取保存次数
   * @return {number}
   */  
  getSaveCount () {
    return this.saveCount
  }

  /**
   * 设置剪切路径
   * @param {AtPath} path
   * @param {boolean} doAntiAlias
   * @return {*}
   */
  clipPath (path: AtPath, doAntiAlias: boolean = true) {
    invariant(path !== null, `The path cannot be null.`)
    invariant(doAntiAlias !== null, `The doAntiAlias cannot be null.`)

    this.skia.clipPath(path.skia!, At.ClipOp.Intersect, doAntiAlias)
  }

  /**
   * 圆角矩形裁剪
   * @param {RRect} rrect
   * @param {boolean} doAntiAlias
   * @return {void}
   */
  clipRRect (rrect: RRect, doAntiAlias: boolean = true) {
    invariant(rrectIsValid(rrect), `The argument rrect is invalid.`)
    invariant(doAntiAlias !== null, `The argument doAntiAlias cannot be null.`)

    this.skia.clipRRect(rrect, At.ClipOp.Intersect, doAntiAlias)
  }

  /**
   * 矩形裁剪
   * @param {Rect} rect
   * @param {ClipOp} clipOp
   * @param {boolean} doAntiAlias
   * @return {void}
   */
  clipRect (rect: Rect, clipOp: ClipOp = At.ClipOp.Intersect, doAntiAlias = true) {
    invariant(clipOp !== null, `The argument clipOp cannot be null.`)
    invariant(doAntiAlias !== null, `The argument doAntiAlias cannot be null.`)

    this.skia.clipRect(rect, clipOp, doAntiAlias)
  }

  /**
   * 画圆角
   * @param {Rect} oval 
   * @param {number} startAngle 
   * @param {number} sweepAngle 
   * @param {boolean} useCenter 
   * @param {AtPaint} paint 
   */
  drawArc (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: AtPaint
  ) {
    const degree = 180 / Math.PI
    this.skia.drawArc(
      oval,
      startAngle * degree,
      sweepAngle * degree,
      useCenter,
      paint.skia!
    )
  }

  drawAtlasRaw (
    paint: AtPaint,
    atlas: AtImage,
    rstTransforms: Float32Array,
    rects: Float32Array,
    colors: Uint32Array,
    blendMode: BlendMode
  ) {
    this.skia.drawAtlas(
      atlas.skia,
      rects,
      rstTransforms,
      paint.skia!,
      blendMode,
      colors
    )
  }

  /**
   * 画圆
   * @param {Point} offset
   * @param {number} radius
   * @param {*} paint
   * @return {*}
   */
  drawCircle (point: Offset, radius: number, paint: AtPaint) {
    this.skia.drawCircle(
      point[0],
      point[1],
      radius,
      paint.skia!
    )
  }

  /**
   * 
   * @param {Color} color 
   * @param {BlendMode} blendMode 
   */
  drawColor (color: Color, blendMode: BlendMode) {
    invariant(color !== null, `The color cannot be null.`)
    invariant(blendMode !== null, `The blendMode cannot be null.`)
    this.skia.drawColorInt(color.value, blendMode)
  }

  drawDRRect (outer: RRect, inner: RRect, paint: AtPaint) {
    invariant(rrectIsValid(outer), `The outer is invalid.`)
    invariant(rrectIsValid(inner), `The inner is invalid.`)
    invariant(paint !== null, `The paint cannt be null.`)

    this.skia.drawDRRect(outer, inner, paint.skia!)
  }

  /**
   * @description: 
   * @param {Image} image
   * @param {Offset} Offset
   * @param {Paint} paint
   * @return {*}
   */
  drawImage (image: AtImage, point: Offset, paint: AtPaint) {
    invariant(image !== null, `The image argument cannot be null.`)
    invariant(paint !== null, `The paint argument cannot be null.`)
    invariant(offsetIsValid(point), `The argument point is invalid.`)

    const filterQuality = paint.filterQuality
    
    if (filterQuality === At.FilterQuality.High) {
      invariant(At.kCanvasMitchellNetravaliB)
      invariant(At.kCanvasMitchellNetravaliC)

      this.skia.drawImageCubic(
        image.skia,
        point.dx,
        point.dy,
        At.kCanvasMitchellNetravaliB,
        At.kCanvasMitchellNetravaliC,
        paint.skia,
      )
    } else {
      this.skia.drawImageOptions(
        image.skia,
        point.dx,
        point.dy,
        filterQuality === At.FilterQuality.None 
          ? At.FilterMode.Nearest 
          : At.FilterMode.Linear,
        filterQuality === At.FilterQuality.Medium 
          ? At.MipmapMode.Linear 
          : At.MipmapMode.None,
        paint.skia,
      )
    }
  }

  /**
   * @description: 
   * @param {Image} image
   * @param {Rect} src
   * @param {Rect} dst
   * @param {Paint} paint
   * @return {*}
   */
  drawImageRect (image: AtImage, src: Rect, dst: Rect, paint: AtPaint) {
    invariant(image !== null, `The image argument cannot be null.`)
    invariant(rectIsValid(src), `The src argument was invalid.`)
    invariant(rectIsValid(dst), `The dst argument was invalid.`)
    invariant(paint !== null, `The paint argument cannot be null.`)

    const filterQuality = paint.filterQuality
    if (filterQuality === At.FilterQuality.High) {
      invariant(At.kCanvasMitchellNetravaliB)
      invariant(At.kCanvasMitchellNetravaliC)

      this.skia.drawImageRectCubic(
        image.skia,
        src,
        dst,
        At.kCanvasMitchellNetravaliB,
        At.kCanvasMitchellNetravaliC,
        paint.skia,
      )
    } else {
      this.skia.drawImageRectOptions(
        image.skia,
        src,
        dst,
        filterQuality === At.FilterQuality.None 
          ? At.FilterMode.Nearest 
          : At.FilterMode.Linear,
        filterQuality === At.FilterQuality.Medium 
          ? At.MipmapMode.Linear 
          : At.MipmapMode.None,
        paint.skia,
      )
    }
  }

  /**
   * @description: 
   * @param {Image} image
   * @param {Rect} center
   * @param {Rect} dist
   * @param {Paint} paint
   * @return {*}
   */
  drawImageNine (image: AtImage, center: Rect, dist: Rect, paint: AtPaint) {
    invariant(image !== null, `The argument "image" cannot be null`)
    invariant(rectIsValid(center), `The argument "center" is invalid.`)
    invariant(rectIsValid(dist), `The argument "dist" is invalid.`)
    invariant(paint !== null, `The argument "paint" cannot be null`)

    this.skia.drawImageNine(
      image.skia,
      center,
      dist,
      paint.filterQuality === At.FilterQuality.None 
        ? At.FilterMode.Nearest 
        : At.FilterMode.Linear,
      paint.skia,
    )
  }

  /**
   * @description: 
   * @param {*} pointA
   * @param {*} pointB
   * @param {Paint} paint
   * @return {*}
   */
  drawLine (pointA: Point, pointB: Point, paint: AtPaint) {
    this.skia.drawLine(
      pointA.dx,
      pointA.dy,
      pointB.dx,
      pointB.dy,
      paint.skia!,
    )
  }

  /**
   * @param {Rect} rect
   * @param {Paint} paint
   * @return {void}
   */
  drawOval (rect: Rect, paint: AtPaint) {
    this.skia.drawOval(rect, paint.skia!)
  }

  /**
   * @description: 
   * @param {Paint} paint
   * @return {*}
   */
  drawPaint (paint: AtPaint) {
    this.skia.drawPaint(paint.skia!)
  }

  /**
   * 绘制文本
   * @param {*} paragraph
   * @param {Offset} offset
   * @return {*}
   */
  drawParagraph (paragraph: AtParagraph, offset: Offset) {
    invariant(paragraph !== null, `The paragraph argument cannot be null.`)
    invariant(offsetIsValid(offset), `The offset argument was invalid.`)
    
    this.skia.drawParagraph(paragraph.skia, offset.dx, offset.dy)
    paragraph.markUsed()
  }

  /**
   * 绘制路径
   * @param {AtPath} path
   * @param {AtPaint} paint
   */
  drawPath (path: AtPath, paint: AtPaint) {
    this.skia.drawPath(path.skia!, paint.skia!)
  }

  /**
   * @description: 
   * @param {AtPicture} picture
   * @return {*}
   */
  // @MARK
  drawPicture (picture: AtPicture) { 
    invariant(picture.skia !== null)
    this.skia.drawPicture(picture.skia)
  }

  /**
   * 绘制坐标
   * @param {Paint} paint
   * @param {PointMode} pointMode
   * @param {Offset} points
   */
  drawPoints (paint: AtPaint, pointMode: PointMode, points: ArrayLike<Offset>) {
    invariant(paint !== null, `The paint argument cannot be null.`)
    invariant(pointMode !== null, `The pointMode argument cannot be null.`)
    invariant(points !== null, `The points argument cannot be null.`)

    const skia = toPoints(points)
    this.skia.drawPoints(pointMode, skia, paint.skia as Paint)
    At.Free(skia)
  }

  /**
   * @param {PointMode} pointMode
   * @param {Float32Array} points
   * @param {Paint} paint
   * @return {void}
   */
  drawRawPoints(pointMode: PointMode, points: ArrayLike<Offset>, paint: AtPaint) {
    invariant(pointMode !== null, `The argument "pointMode" cannot be null.`)
    invariant(points !== null, `The argument "points" cannot be null.`)
    invariant(paint !== null, `The argument "paint" cannot be null.`)
    
    if (points.length % 2 !== 0) {
      throw new ArgumentError('"points" must have an even number of values.', 'points')
    }

    this.drawPoints(paint, pointMode, points)
  }

  /**
   * 绘制圆角矩形
   * @param {RRect} rrect
   * @param {Paint} paint
   * @return {*}
   */
  drawRRect (rrect: RRect, paint: AtPaint ) {
    invariant(rrectIsValid(rrect), `The rrect argument was invalid.`)
    invariant(paint !== null, `The paint argument cannot be null.`)

    this.skia.drawRRect(rrect, paint.skia as Paint)
  }

  /** 
   * 绘制矩形
   * @param {Rect} rect
   * @param {Paint} paint
   * @return {void}
   */
  drawRect (rect: Rect, paint: AtPaint) {
    invariant(rectIsValid(rect), `The "rect" argument was invalid.`)
    invariant(paint !== null, `The "paint" argument cannot be null.`)

    this.skia.drawRect(rect, paint.skia!)
  }

  /**
   * 绘制阴影
   * @param {AtPath} path
   * @param {Color} color
   * @param {number} elevation
   * @param {boolean} transparentOccluder
   * @return {void}
   */
  drawShadow (
    path: AtPath, 
    color: Color, 
    elevation: number, 
    transparentOccluder: boolean
  ) {
    invariant(path !== null, `The path argument cannot be null.`)
    invariant(color !== null, `The color argument cannot be null.`)
    invariant(transparentOccluder !== null, `The transparentOccluder argument cannot be null.`)

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
   * @description: 
   * @param {Canvas} skiaCanvas
   * @param {Path} path
   * @param {Color} color
   * @param {number} elevation
   * @param {boolean} transparentOccluder
   * @param {number} devicePixelRatio
   * @return {*}
   */
  // TODO
  // drawSkiaShadow (
  //   skia: Canvas,
  //   path: AtPath,
  //   color: Color,
  //   elevation: number,
  //   transparentOccluder: boolean,
  //   devicePixelRatio: number,
  // ) {
  //   const flags = transparentOccluder
  //     ? kShadowFlags.kTransparentOccluderShadowFlag
  //     : kShadowFlags.kDefaultShadowFlags

  //   const inAmbient = color.withAlpha(Math.round((color.alpha * kShadowAmbientAlpha)))
  //   const inSpot = color.withAlpha(Math.round((color.alpha * kShadowSpotAlpha)))

  //   const inTonalColors = {
  //     ambient: makeFreshSkiaColor(inAmbient),
  //     spot: makeFreshSkiaColor(inSpot),
  //   }

  //   const tonalColors = At.computeTonalColors(inTonalColors)
  //   const zPlaneParams = new Float32Array(3)
  //   zPlaneParams[2] = devicePixelRatio * elevation

  //   const lightPos = new Float32Array(3)
  //   lightPos[0] = kShadowLightXOffset
  //   lightPos[1] = kShadowLightYOffset
  //   lightPos[2] = devicePixelRatio * kShadowLightHeight,


  //   skia.drawShadow(
  //     path.skia!,
  //     zPlaneParams,
  //     lightPos,
  //     devicePixelRatio * kShadowLightRadius,
  //     tonalColors.ambient,
  //     tonalColors.spot,
  //     flags,
  //   )
  // }

  /**
   * @description: 
   * @param {Vertices} vertices
   * @param {BlendMode} blendMode
   * @param {AtPaint} paint
   * @return {*}
   */
  // TODO
  // drawVertices  (
  //   vertices: Vertices, 
  //   blendMode: BlendMode, 
  //   paint: AtPaint
  // ) {
  //   invariant(vertices !== null, `The vertices argument cannot be null.`)
  //   invariant(paint !== null, `The paint argument cannot be null.`)
  //   invariant(blendMode !== null, `The blendMode argument cannot be null.`)

  //   this.skia.drawVertices(
  //     vertices.skia!,
  //     blendMode,
  //     paint.skia!,
  //   )
  // }

  restore () {
    this.skia.restore()
  }

  restoreToCount (count: number) {
    this.skia.restoreToCount(count)
  }

  rotate (radians: number) {
    this.skia.rotate(radians * 180.0 / Math.PI, 0.0, 0.0)
  }

  save () {
    return this.skia.save()
  }

  clear (color: Color) {
    this.skia.clear(color)
  }

  /**
   * @param {Rect} bounds
   * @param {AtPaint} paint
   * @return {void}
   */
  saveLayer (bounds: Rect | null = null, paint: AtPaint | null) {
    invariant(paint !== null, `The paint argument cannot be null.`)
    this.skia.saveLayer(paint.skia!, bounds, null)
  }

  /**
   * @param {Rect} bounds
   * @param {ImageFilter} filter
   * @param {Paint} paint
   * @return {*}
   */
  // TODO
  saveLayerWithFilter (bounds: Rect, filter: AtImageFilter, paint: AtPaint) {
    const convertible: AtManagedSkiaImageFilterConvertible = filter

    return this.skia.saveLayer(paint.skia as Paint, bounds, convertible.imageFilter.skia, 0)
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
   * @description: 
   * @param {number} sx
   * @param {number} sy
   * @return {*}
   */
  skew (sx: number, sy: number) {
    this.skia.skew(sx, sy)
  }

  /**
   * @param { ArrayLike<number>} matrix4
   * @return void}
   */
  transform (matrix4: ArrayLike<number>) {
    invariant(matrix4 !== null, `The matrix4 cannot be null.`)

    if (matrix4.length !== 16) {
      throw new ArgumentError(`"matrix4" must have 16 entries.`, 'matrix4')
    }

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
}

export class AtRecorder extends AtCanvas {
  static create (bounds: Rect | null = null) {
    return new AtRecorder(bounds)
  }

  protected snapshot: AtSnapshot
  protected cullRect: Rect | null = null
  protected prictue: PictureRecorder | null = null

  /**
   * 
   * @param {Rect} bounds 
   */
  constructor (bounds: Rect | null = null) {
    invariant(Rect.largest)
    const prictue = new At.PictureRecorder()
    const cullRect = bounds ?? Rect.largest
    super(prictue.beginRecording(cullRect))

    this.prictue = prictue
    this.cullRect = cullRect
    this.snapshot = new AtSnapshot(cullRect)
  }

  stop () {
    invariant(this.prictue, `AtRecorder is not recording`)

    const picture = this.prictue?.finishRecordingAsPicture()
    this.prictue.delete()
    this.prictue = null

    return new AtPicture(picture, this.cullRect, this.snapshot)
  }

  addCommand (command: AtPaintCommand) {
    this.snapshot.commands.push(command)
  }

  clear (color: Color) {
    super.clear(color)
    this.addCommand(new AtClearCommand(color))
  }

  clipPath (path: AtPath, doAntiAlias: boolean) {
    super.clipPath(path, doAntiAlias)
    this.addCommand(new AtClipPathCommand(path, doAntiAlias))
  }
  
  clipRRect (rrect: RRect, doAntiAlias: boolean) {
    super.clipRRect(rrect, doAntiAlias);
    this.addCommand(new AtClipRRectCommand(rrect, doAntiAlias))
  }

  clipRect (rect: Rect, clipOp: ClipOp, doAntiAlias: boolean) {
    super.clipRect(rect, clipOp, doAntiAlias)
    this.addCommand(new AtClipRectCommand(rect, clipOp, doAntiAlias))
  }

  /**
   * 
   * @param oval 
   * @param startAngle 
   * @param sweepAngle 
   * @param useCenter 
   * @param paint 
   */
  drawArc (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: AtPaint
  ) {
    super.drawArc(oval, startAngle, sweepAngle, useCenter, paint);
    this.addCommand(new AtDrawArcCommand(oval, startAngle, sweepAngle, useCenter, paint))
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
  drawAtlasRaw(
    paint: AtPaint,
    atlas: AtImage,
    rstTransforms: Float32Array,
    rects: Float32Array,
    colors: Uint32Array,
    blendMode: BlendMode
  ) {
    super.drawAtlasRaw(paint, atlas, rstTransforms, rects, colors, blendMode)
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
    paint: AtPaint
  ) {
    super.drawCircle(point, radius, paint)
    this.addCommand(new AtDrawCircleCommand(point, radius, paint))
  }
  
  /**
   * 
   * @param color 
   * @param blendMode 
   */
  drawColor (color: Color, blendMode: BlendMode) {
    super.drawColor(color, blendMode)
    // TODO
    // this.addCommand(new AtDrawColorCommand(color, blendMode))
  }
  
  drawDRRect (outer: RRect, inner: RRect, paint: AtPaint) {
    super.drawDRRect(outer, inner, paint)
    // TODO
    // this.addCommand(new AtDrawDRRectCommand(outer, inner, paint))
  }

  
  drawImage (image: AtImage, point: Offset, paint: AtPaint) {
    super.drawImage(image, point, paint)
    // TODO
    // this.addCommand(new AtDrawImageCommand(image, point, paint))
  }

  
  drawImageRect (
    image: AtImage, 
    src: Rect, 
    dst: Rect, 
    paint: AtPaint
  ) {
    super.drawImageRect(image, src, dst, paint)
    // TODO
    // this.addCommand(new AtDrawImageRectCommand(image, src, dst, paint))
  }

  drawImageNine (
    image: AtImage, 
    center: Rect, 
    dist: Rect, 
    paint: AtPaint
  ) {
    super.drawImageNine(image, center, dist, paint)
    this.addCommand(new AtDrawImageNineCommand(image, center, dist, paint))
  }
  
  drawLine (pointA: Point, pointB: Point, paint: AtPaint) {
    super.drawLine(pointA, pointB, paint)
    this.addCommand(new AtDrawLineCommand(pointA, pointB, paint))
  }
  
  drawOval (rect: Rect, paint: AtPaint) {
    super.drawOval(rect, paint)
    this.addCommand(new AtDrawOvalCommand(rect, paint))
  }
  
  drawPaint (paint: AtPaint) {
    super.drawPaint(paint)
    this.addCommand(new AtDrawPaintCommand(paint))
  }
  
  // TODO
  drawParagraph (
    paragraph: AtParagraph, // TODO
    point: Offset
  ) {
    super.drawParagraph(paragraph, point)
    this.addCommand(new AtDrawParagraphCommand(paragraph, point))
  }
  // 
  // drawPath (path: AtPath, paint: AtPaint) {
  //   super.drawPath(path, paint)
  //   this.addCommand(new AtDrawPathCommand(path, paint))
  // }
  //
  // drawPicture (picture: AtPicture) {
  //   super.drawPicture(picture)
  //   this.addCommand(new DrawPictureCommand(picture))
  // }
  //
  //
  // drawPoints (
  //   paint: AtPaint,
  //   pointMode: PointMode, 
  //   points: Point[]
  // ) {
  //   super.drawPoints(paint, pointMode, points)
  //   this.addCommand(new AtDrawPointsCommand(pointMode, points, paint))
  // }

  
  drawRRect (
    rrect: RRect, 
    paint: AtPaint 
  ) {
    super.drawRRect(rrect, paint)
    this.addCommand(new AtDrawRRectCommand(rrect, paint))
  }
  
  drawRect (rect: Rect, paint: AtPaint) {
    super.drawRect(rect, paint)
    this.addCommand(new AtDrawRectCommand(rect, paint))
  }
  
  drawShadow (
    path: AtPath, 
    color: Color, 
    elevation: number, 
    transparentOccluder: boolean    
  ) {
    super.drawShadow(path, color, elevation, transparentOccluder)
    this.addCommand(new AtDrawShadowCommand(path, color, elevation, transparentOccluder))
  }

  
  // drawVertices(
  //     CkVertices vertices, ui.BlendMode blendMode, CkPaint paint) {
  //   super.drawVertices(vertices, blendMode, paint);
  //   this.addCommand(CkDrawVerticesCommand(vertices, blendMode, paint));
  // }  
  restore() {
    super.restore()
    this.addCommand(new AtRestoreCommand())
  }

  restoreToCount (count: number) {
    super.restoreToCount(count)
    this.addCommand(new AtRestoreToCountCommand(count))
  }

  rotate (radians: number) {
    super.rotate(radians)
    this.addCommand(new AtRotateCommand(radians))
  }

  
  save (): number {
    this.addCommand(new AtSaveCommand())
    return super.save()
  }

  
  saveLayer (
    bounds: Rect | null = null, 
    paint: AtPaint
  ) {
    super.saveLayer(bounds, paint)

    if (bounds === null) {
      this.addCommand(new AtSaveLayerWithoutBoundsCommand(paint))
    } else {
      this.addCommand(new AtSaveLayerCommand(bounds, paint))
    }
  }
  
  // saveLayerWithFilter (
  //   bounds: Rect, 
  //   filter: AtImageFilter, 
  //   paint: AtPaint
  // ) {
  //   super.saveLayerWithFilter(bounds, filter, paint)
  //   this.addCommand(new AtSaveLayerWithFilterCommand(bounds, filter, paint))
  // }

  
  scale (sx: number, sy: number) {
    super.scale(sx, sy)
    this.addCommand(new AtScaleCommand(sx, sy))
  }

  
  skew (sx: number, sy: number) {
    super.skew(sx, sy)
    this.addCommand(new AtSkewCommand(sx, sy))
  }
  
  transform (matrix4: ArrayLike<number>) {
    super.transform(matrix4)
    this.addCommand(new AtTransformCommand(matrix4))
  }

  translate (dx: number, dy: number) {
    super.translate(dx, dy)
    this.addCommand(new AtTranslateCommand(dx, dy))
  }
}

export class AtSnapshot {
  private bounds: Rect
  public commands: AtPaintCommand[] = []

  constructor (bounds: Rect) {
    this.bounds = bounds
  }

  toPicture () {
    const recorder: PictureRecorder = new At.PictureRecorder()
    const canvas: Canvas = recorder.beginRecording(this.bounds)
    
    for (const command of this.commands) {
      command.apply(canvas)
    }

    const picture: Picture = recorder.finishRecordingAsPicture()
    recorder.delete()

    return picture
  }

  dispose() {
    for (const command of this.commands) {
      command.dispose()
    }
  }
}

// => AtPaintCommand
abstract class AtPaintCommand {
  abstract apply (canvas: Canvas): void
  dispose () {}
}

class AtClearCommand extends AtPaintCommand {
  private color: Color
  constructor (color: Color) {
    super()
    this.color = color
  }

  apply (canvas: Canvas) {
    canvas.clear(this.color)
  }
}

class AtClipPathCommand extends AtPaintCommand {
  private path: AtPath
  private doAntiAlias: boolean

  constructor (path: AtPath, doAntiAlias: boolean) {
    super()
    this.path = path
    this.doAntiAlias = doAntiAlias
  }

  apply (canvas: Canvas) {
    canvas.clipPath(
      this.path.skia!,
      At.ClipOp.Intersect,
      this.doAntiAlias,
    )
  }
}

class AtClipRRectCommand extends AtPaintCommand {
  private rrect: RRect
  private doAntiAlias: boolean

  constructor (rrect: RRect, doAntiAlias: boolean) {
    super()
    this.rrect = rrect
    this.doAntiAlias = doAntiAlias
  }

  apply (canvas: Canvas) {
    canvas.clipRRect(
      this.rrect,
      At.ClipOp.Intersect,
      this.doAntiAlias,
    )
  }
}

class AtClipRectCommand extends AtPaintCommand {
  private rect: Rect
  private clipOp: ClipOp
  private doAntiAlias: boolean

  constructor (rect: Rect, clipOp: ClipOp, doAntiAlias: boolean) {
    super()
    this.clipOp = clipOp
    this.rect = rect
    this.doAntiAlias = doAntiAlias
  }

  apply (canvas: Canvas) {
    canvas.clipRect(
      this.rect,
      this.clipOp,
      this.doAntiAlias,
    )
  }
}

class AtDrawOvalCommand extends AtPaintCommand {
  private rect: Rect
  private paint: AtPaint
  constructor (rect: Rect, paint: AtPaint) {
    super()

    this.rect = rect
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawOval(this.rect, this.paint.skia!)
  }
}

class AtDrawPaintCommand extends AtPaintCommand {
  private paint: AtPaint

  constructor (paint: AtPaint) {
    super()

    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawPaint(this.paint.skia!)
  }
}

class AtDrawParagraphCommand extends AtPaintCommand {
  private paragraph: AtParagraph
  private offset: Offset

  constructor (paragraph: AtParagraph, offset: Offset) {
    super()
    this.paragraph = paragraph
    this.offset = offset
  }

  apply (canvas: Canvas) {
    canvas.drawParagraph(
      this.paragraph.skia,
      this.offset.dx,
      this.offset.dy
    )

    this.paragraph.markUsed()
  }
}

class AtDrawLineCommand extends AtPaintCommand {
  private pointA: Point 
  private pointB: Point
  private paint: AtPaint

  constructor (pointA: Point, pointB: Point, paint: AtPaint) {
    super()

    this.pointA = pointA
    this.pointB = pointB
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawLine(
      this.pointA.dx, 
      this.pointA.dy, 
      this.pointB.dx, 
      this.pointB.dy,
      this.paint.skia!
    )
  }
}

class AtDrawImageNineCommand extends AtPaintCommand {
  private image: AtImage 
  private center: Rect 
  private dist: Rect
  private paint: AtPaint

  constructor (
    image: AtImage, 
    center: Rect, 
    dist: Rect, 
    paint: AtPaint
  ) {
    super()

    this.image = image
    this.center = center
    this.dist = dist
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawImageNine(
      this.image.skia,
      this.center,
      this.dist,
      this.paint.filterQuality === At.FilterQuality.None 
        ? At.FilterMode.Nearest 
        : At.FilterMode.Linear,
      this.paint.skia!
    )
  }
}

class AtDrawRRectCommand extends AtPaintCommand {
  private rrect: RRect
  private paint: AtPaint
  constructor (rrect: RRect, paint: AtPaint) {
    super()

    this.rrect = rrect
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawRRect(this.rrect, this.paint.skia!)
  }
}

class AtDrawRectCommand extends AtPaintCommand {
  private rect: Rect
  private paint: AtPaint
  constructor (rect: Rect, paint: AtPaint) {
    super()

    this.rect = rect
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawRect(this.rect, this.paint.skia!)
  }
}

class AtDrawArcCommand extends AtPaintCommand {
  private oval: Rect
  private startAngle: number
  private sweepAngle: number
  private useCenter: boolean
  private paint: AtPaint

  constructor (
    oval: Rect,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: AtPaint
  ) {
    super()
    this.oval = oval
    this.startAngle = startAngle
    this.sweepAngle = sweepAngle
    this.useCenter = useCenter
    this.paint = paint
  }

  apply (canvas: Canvas) {
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

class AtDrawCircleCommand extends AtPaintCommand {
  private point: Point
  private radius: number
  private paint: AtPaint

  constructor (
    point: Point,
    radius: number,
    paint: AtPaint
  ) {
    super()

    this.point = point
    this.radius = radius
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.drawCircle(
      this.point.dx,
      this.point.dy,
      this.radius,
      this.paint.skia!
    )
  }
}

class AtDrawShadowCommand extends AtPaintCommand {
  private path: AtPath 
  private color: Color
  private elevation: number
  private transparentOccluder: boolean 

  constructor (
    path: AtPath, 
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

  apply (canvas: Canvas): void {
    // TODO
    // canvas.drawShadow(
    //   this.path.skia!,
    //   this.color,
    //   this.elevation,
    //   this.transparentOccluder
    // )
  }
}

class AtSaveLayerCommand extends AtPaintCommand {
  private bounds: Rect | null = null
  private paint: AtPaint

  constructor (bounds: Rect, paint: AtPaint) {
    super()

    this.bounds = bounds
    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.saveLayer(this.paint.skia!, this.bounds)
  }
}

class AtRestoreToCountCommand extends AtPaintCommand {
  private count: number
  constructor (count: number) {
    super()

    this.count = count
  }

  apply (canvas: Canvas): void {
    canvas.restoreToCount(this.count)
  }
}

class AtRestoreCommand extends AtPaintCommand {
  apply (canvas: Canvas): void {
    canvas.restore()
  }
}

class AtScaleCommand extends AtPaintCommand {
  private sx: number
  private sy: number

  constructor (sx: number, sy: number) {
    super()

    this.sx = sx
    this.sy = sy
  }

  apply (canvas: Canvas): void {
    canvas.scale(this.sx, this.sy)
  }
}

class AtRotateCommand extends AtPaintCommand {
  private radians: number

  constructor (radians: number) {
    super()

    this.radians = radians
  }

  apply (canvas: Canvas): void {
    canvas.rotate(this.radians * 180.0 / Math.PI, 0, 0)
  }
}

class AtSkewCommand extends AtPaintCommand {
  private sx: number
  private sy: number

  constructor (sx: number, sy: number) {
    super()

    this.sx = sx
    this.sy = sy
  }

  apply (canvas: Canvas): void {
    canvas.skew(this.sx, this.sy)
  }
}

class AtSaveCommand extends AtPaintCommand {
  apply (canvas: Canvas): void {
    canvas.save()
  }
}

class AtSaveLayerWithoutBoundsCommand extends AtPaintCommand {
  private paint: AtPaint

  constructor (paint: AtPaint) {
    super()

    this.paint = paint
  }

  apply (canvas: Canvas): void {
    canvas.saveLayer(this.paint.skia!, null)
  }
}

class AtTransformCommand extends AtPaintCommand {
  private matrix4: ArrayLike<number>
  constructor (matrix4: ArrayLike<number>) {
    super()

    this.matrix4 = matrix4
  }

  apply (canvas: Canvas): void {
    canvas.concat(toMatrix(this.matrix4))
  }
}

class AtTranslateCommand extends AtPaintCommand {
  private dx: number 
  private dy: number

  constructor (dx: number, dy: number) {
    super()
    this.dx = dx
    this.dy = dy
  }

  apply (canvas: Canvas): void {
    canvas.translate(this.dx, this.dy)
  }
}