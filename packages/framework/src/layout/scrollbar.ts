import { invariant } from '@at/utils'
import { Color } from '../basic/color'
import { AtAnimation } from '../animation/animation'
import { AtCanvas } from '../engine/canvas'
import { AtPaint } from '../engine/paint'
import { Offset, Radius, Rect, RRect, Size } from '../basic/geometry'
import { PointerDeviceKind } from '../gestures/pointer'
import { AtEdgeInsets } from '../painting/edge-insets'
import { TextDirection } from '../engine/skia'
import { clamp } from '../basic/helper'
import { AtOutlinedBorder } from '../painting/border'
import { At, AtLayoutBox, Axis, AxisDirection, axisDirectionToAxis, ScrollDirection } from '../at'
import { AtLayoutCustom, AtLayoutCustomPainter } from './custom'
import { AtAnimationController } from '../animation/controller'
import { AtTickerProvider } from '../basic/ticker'

const kMinThumbExtent = 18.0
const kMinInteractiveSize = 48.0
const kScrollbarThickness = 6.0
const kScrollbarFadeDuration = 300
const kScrollbarTimeToFade = 600

export type AtLayoutScrollbarOptions = {
  children?: AtLayoutBox[],
}

export class AtLayoutScrollbar extends AtLayoutCustom {
  // static create (options: AtLayoutScrollbarOptions) {
  //   return new AtLayoutScrollbar(
  //     options?.children,
  //   )
  // }

  public painter: AtLayoutScrollbarPainter
  
  constructor (
    children: AtLayoutBox[] = [],
  ) {

    const ticker = AtTickerProvider.create()
    const painter = AtLayoutScrollbarPainter.create({
      color: Color.fromRGBO(211, 211, 211, .5),
      radius: Radius.circular(3),
      fadeoutOpacityAnimation: AtAnimationController.create({
        value: 1,
        vsync: ticker
      }),
    })

    super(children, null, painter, Size.zero, false, false)

    this.painter = painter

    setInterval(() => {
      painter.update(new AtScrollMetrics(
        0,
        359,
        1,
        793,
        AxisDirection.Down,
        2.0
      ), AxisDirection.Down)
    }, 1000)
  }
}

export enum ScrollbarOrientation {
  Left,
  Right,
  Top,
  Bottom,
}

export type AtLayoutScrollbarPainterOptions = {
  color: Color,
  fadeoutOpacityAnimation: AtAnimation<number>,
  trackColor?: Color,
  trackBorderColor?: Color,
  textDirection?: TextDirection,
  thickness?: number,
  padding?: AtEdgeInsets,
  mainAxisMargin?: number,
  crossAxisMargin?: number,
  radius?: Radius | null ,
  trackRadius?: Radius | null,
  shape?: AtOutlinedBorder | null,
  minLength?: number,
  minOverscrollLength?: number | null,
  scrollbarOrientation?: ScrollbarOrientation | null,
  ignorePointer?: boolean,
}

export class AtLayoutScrollbarPainter extends AtLayoutCustomPainter {
  static create (options: AtLayoutScrollbarPainterOptions) {
    return new AtLayoutScrollbarPainter(
      options?.color,
      options?.fadeoutOpacityAnimation,
      options?.trackColor,
      options?.trackBorderColor,
      options?.textDirection,
      options?.thickness,
      options?.padding,
      options?.mainAxisMargin,
      options?.crossAxisMargin,
      options?.radius,
      options?.trackRadius,
      options?.shape,
      options?.minLength,
      options?.minOverscrollLength,
      options?.scrollbarOrientation,
      options?.ignorePointer  ,
    )
  }

  // => color
  private _color: Color
  public get color () {
    return this._color
  } 
  public set color (value: Color) {
    if (this._color.notEqual(value)) {
      this._color = value
      this.publish(`color`, value)
    }
  }

  // => trackColor
  private _trackColor: Color
  public get trackColor () {
    return this._trackColor
  } 
  public set trackColor (value: Color) {
    if (this._trackColor.notEqual(value)) {
      this._trackColor = value
      this.publish(`trackColor`, value)
    }
  }

  // => trackBorderColor
  private _trackBorderColor: Color
  public get trackBorderColor () {
    return this._trackBorderColor
  } 
  public set trackBorderColor (value: Color) {
    if (this._trackBorderColor.notEqual(value)) {
      this._trackBorderColor = value
      this.publish(`trackBorderColor`, value)
    }
  }

  // => trackRadius
  private _trackRadius: Radius | null
  public get trackRadius () {
    return this._trackRadius
  } 
  public set trackRadius (value: Radius | null) {
    if (this._trackRadius?.notEqual(value)) {
      this._trackRadius = value
      this.publish(`trackRadius`, value)
    }
  }

  // => textDirection
  private _textDirection: TextDirection | null
  public get textDirection () {
    return this._textDirection
  } 
  public set textDirection (value: TextDirection | null) {
    if (this._textDirection !== value) {
      this._textDirection = value
      this.publish(`textDirection`, value)
    }
  }

  // => thickness
  private _thickness: number
  public get thickness () {
    return this._thickness
  } 
  public set thickness (value: number) {
    if (this._thickness !== value) {
      this._thickness = value
      this.publish(`thickness`, value)
    }
  }

  // => mainAxisMargin
  private _mainAxisMargin: number
  public get mainAxisMargin () {
    return this._mainAxisMargin
  } 
  public set mainAxisMargin (value: number) {
    if (this._mainAxisMargin !== value) {
      this._mainAxisMargin = value
      this.publish(`mainAxisMargin`, value)
    }
  }

  // => crossAxisMargin
  private _crossAxisMargin: number
  public get crossAxisMargin () {
    return this._crossAxisMargin
  } 
  public set crossAxisMargin (value: number) {
    if (this._crossAxisMargin !== value) {
      this._crossAxisMargin = value
      this.publish(`crossAxisMargin`, value)
    }
  }

  // => radius
  private _radius: Radius | null
  public get radius () {
    return this._radius
  } 
  public set radius (value: Radius | null) {
    if (this._radius?.notEqual(value)) {
      this._radius = value
      this.publish(`radius`, value)
    }
  }
  
  // => shape
  private _shape: AtOutlinedBorder | null
  public get shape () {
    return this._shape
  } 
  public set shape (value: AtOutlinedBorder | null) {
    if (this._shape?.notEqual(value)) {
      this._shape = value
      this.publish(`shape`, value)
    }
  }

  // => padding
  private _padding: AtEdgeInsets
  public get padding () {
    return this._padding
  } 
  public set padding (value: AtEdgeInsets) {
    if (this._padding.notEqual(value)) {
      this._padding = value
      this.publish(`padding`, value)
    }
  }

  // => minLength
  private _minLength: number
  public get minLength () {
    return this._minLength
  } 
  public set minLength (value: number) {
    if (this._minLength !== value) {
      this._minLength = value
      this.publish(`minLength`, value)
    }
  }

  // => minOverscrollLength
  private _minOverscrollLength: number
  public get minOverscrollLength () {
    return this._minOverscrollLength
  } 
  public set minOverscrollLength (value: number) {
    if (this._minOverscrollLength !== value) {
      this._minOverscrollLength = value
      this.publish(`minOverscrollLength`, value)
    }
  }

  // => scrollbarOrientation
  private _scrollbarOrientation: ScrollbarOrientation | null
  public get scrollbarOrientation () {
    return this._scrollbarOrientation
  } 
  public set scrollbarOrientation (value: ScrollbarOrientation | null) {
    if (this._scrollbarOrientation !== value) {
      this._scrollbarOrientation = value
      this.publish(`scrollbarOrientation`, value)
    }
  }

  // => ignorePointer
  private _ignorePointer: boolean
  public get ignorePointer () {
    return this._ignorePointer
  } 
  public set ignorePointer (value: boolean) {
    if (this._ignorePointer !== value) {
      this._ignorePointer = value
      this.publish(`ignorePointer`, value)
    }
  }
  
  private get trackExtent () {
    invariant(this.lastMetrics !== null)
    invariant(this.lastMetrics.viewportDimension !== null)
    return this.lastMetrics.viewportDimension - this.totalTrackMainAxisOffsets
  }
  
  private get traversableTrackExtent () {
    return this.trackExtent - (2 * this.mainAxisMargin)
  }

  private get totalTrackMainAxisOffsets () {
    return this.isVertical 
      ? this.padding.vertical 
      : this.padding.horizontal
  }
  
  private get leadingTrackMainAxisOffset () {
    switch(this.resolvedOrientation) {
      case ScrollbarOrientation.Left:
      case ScrollbarOrientation.Right:
        return this.padding.top
      case ScrollbarOrientation.Top:
      case ScrollbarOrientation.Bottom:
        return this.padding.left
    }
  }

  private get leadingThumbMainAxisOffset () {
    switch(this.resolvedOrientation) {
      case ScrollbarOrientation.Left:
      case ScrollbarOrientation.Right:
        return this.padding.top + this.mainAxisMargin
      case ScrollbarOrientation.Top:
      case ScrollbarOrientation.Bottom:
        return this.padding.left + this.mainAxisMargin
    }
  }  

  public get lastMetricsAreScrollable () {
    invariant(this.lastMetrics !== null)
    return this.lastMetrics.minScrollExtent !== this.lastMetrics.maxScrollExtent
  }

  private get isVertical () {
    return this.lastAxisDirection === AxisDirection.Down || this.lastAxisDirection === AxisDirection.Up
  }

  private get isReversed () {
    return this.lastAxisDirection === AxisDirection.Up || this.lastAxisDirection === AxisDirection.Left
  } 

  private get beforeExtent () {
    invariant(this.lastMetrics !== null)
    return this.isReversed 
      ? this.lastMetrics.extentAfter 
      : this.lastMetrics.extentBefore
  }

  private get afterExtent () {
    invariant(this.lastMetrics !== null)
    return this.isReversed 
      ? this.lastMetrics.extentBefore 
      : this.lastMetrics.extentAfter
  }

  
  private get totalContentExtent () {
    invariant(this.lastMetrics !== null)
    invariant(this.lastMetrics.maxScrollExtent !== null)
    invariant(this.lastMetrics.minScrollExtent !== null)
    invariant(this.lastMetrics.viewportDimension !== null)
    return this.lastMetrics.maxScrollExtent - this.lastMetrics.minScrollExtent + this.lastMetrics.viewportDimension
  }

  private get resolvedOrientation (): ScrollbarOrientation {
    if (this.scrollbarOrientation === null) {
      if (this.isVertical) {
        return this.textDirection === At.TextDirection.LTR
          ? ScrollbarOrientation.Right
          : ScrollbarOrientation.Left
      }

      return ScrollbarOrientation.Bottom
    }
    return this.scrollbarOrientation
  }

  // => paintThumb
  private get paintThumb (): AtPaint {
    const paint = AtPaint.create()
    invariant(this.fadeoutOpacityAnimation.value !== null)
    paint.color = this.color.withOpacity(this.color.opacity * this.fadeoutOpacityAnimation.value)
    return paint
  }

  public fadeoutOpacityAnimation: AtAnimation<number>
  public lastMetrics: AtScrollMetrics | null = null

  private lastAxisDirection: AxisDirection | null = null
  private trackRect: Rect | null = null
  private thumbRect: Rect | null = null
  private thumbOffset: number | null = null
  private thumbExtent: number | null = null

  constructor (
    color: Color,
    fadeoutOpacityAnimation: AtAnimation<number>,
    trackColor: Color = new Color(0x00000000),
    trackBorderColor: Color = new Color(0x00000000),
    textDirection: TextDirection = At.TextDirection.LTR,
    thickness: number = kScrollbarThickness,
    padding: AtEdgeInsets = AtEdgeInsets.zero,
    mainAxisMargin: number = 0.0,
    crossAxisMargin: number = 0.0,
    radius: Radius | null = null,
    trackRadius: Radius | null= null,
    shape: AtOutlinedBorder | null= null,
    minLength: number = kMinThumbExtent,
    minOverscrollLength: number | null = null,
    scrollbarOrientation: ScrollbarOrientation | null = null,
    ignorePointer: boolean = false,
  ) {
    super()
    this._color = color
    this._textDirection = textDirection
    this._thickness = thickness
    this._radius = radius
    this._shape = shape
    this._padding = padding
    this._mainAxisMargin = mainAxisMargin
    this._crossAxisMargin = crossAxisMargin
    this._minLength = minLength
    this._trackColor = trackColor
    this._trackBorderColor = trackBorderColor
    this._trackRadius = trackRadius
    this._scrollbarOrientation = scrollbarOrientation
    this._minOverscrollLength = minOverscrollLength ?? minLength
    this._ignorePointer = ignorePointer 
    
    this.fadeoutOpacityAnimation = fadeoutOpacityAnimation
    this.fadeoutOpacityAnimation.subscribe(() => {
      this.publish()
    })

  }

  
  private setThumbExtent () {
    invariant(this.lastMetrics !== null)
    const fractionVisible = clamp(
      (this.lastMetrics.extentInside - this.totalTrackMainAxisOffsets) / 
      (this.totalContentExtent - this.totalTrackMainAxisOffsets),
      0.0,
      1.0,
    )

    const thumbExtent = Math.max(
      Math.min(this.traversableTrackExtent, this.minOverscrollLength),
      this.traversableTrackExtent * fractionVisible,
    )

    invariant(this.lastMetrics !== null)
    invariant(this.lastMetrics.viewportDimension !== null)
    
    const fractionOverscrolled = 1.0 - this.lastMetrics.extentInside / this.lastMetrics.viewportDimension
    const safeMinLength = Math.min(this.minLength, this.traversableTrackExtent)
    const newMinLength = (this.beforeExtent > 0 && this.afterExtent > 0)
      ? safeMinLength
      : safeMinLength * (1.0 - clamp(fractionOverscrolled, 0.0, 0.2) / 0.2)

    this.thumbExtent = clamp(thumbExtent, newMinLength, this.traversableTrackExtent)
  }
  
  update (
    metrics: AtScrollMetrics,
    axisDirection: AxisDirection,
  ) {
    if (
      this.lastMetrics !== null &&
      this.lastMetrics.extentBefore === metrics.extentBefore &&
      this.lastMetrics.extentInside === metrics.extentInside &&
      this.lastMetrics.extentAfter === metrics.extentAfter &&
      this.lastAxisDirection === axisDirection
    ) {
      return
    }

    const oldMetrics: AtScrollMetrics | null = this.lastMetrics
    this.lastMetrics = metrics
    this.lastAxisDirection = axisDirection

    const needPaint = (metrics: AtScrollMetrics | null) => {
      if (metrics !== null) {
        invariant(metrics.maxScrollExtent !== null)
        invariant(metrics.minScrollExtent !== null)

        return metrics.maxScrollExtent > metrics.minScrollExtent
      
      }

      return false
    }

    if (!needPaint(oldMetrics) && !needPaint(metrics)) {
      return
    }
    this.publish()
  }

  
  updateThickness (nextThickness: number, nextRadius: Radius) {
    this.thickness = nextThickness
    this.radius = nextRadius
  }


  paintTrack (isBorder = false): AtPaint {
    if (isBorder) {
      const paint = AtPaint.create()
      invariant(this.fadeoutOpacityAnimation.value !== null)
      paint.color = this.trackBorderColor.withOpacity(this.trackBorderColor.opacity * this.fadeoutOpacityAnimation.value)
      paint.style = At.PaintStyle.Stroke
      paint.strokeWidth = 1.0
      return paint
    }

    const paint =  AtPaint.create()
    invariant(this.fadeoutOpacityAnimation.value !== null)
    paint.color = this.trackColor.withOpacity(this.trackColor.opacity * this.fadeoutOpacityAnimation.value)
    return paint
  }

  private paintScrollbar (canvas: AtCanvas, size: Size) {
    let x: number 
    let y: number
    let thumbSize: Size 
    let trackSize: Size
    let trackOffset: Offset
    let borderStart: Offset
    let borderEnd: Offset

    invariant(this.thumbExtent !== null)
    invariant(this.thumbOffset !== null)
    
    switch (this.resolvedOrientation) {
      case ScrollbarOrientation.Left:
        thumbSize = new Size(this.thickness, this.thumbExtent)
        trackSize = new Size(this.thickness + 2 * this.crossAxisMargin, this.trackExtent)
        x = this.crossAxisMargin + this.padding.left
        y = this.thumbOffset
        trackOffset = new Offset(x - this.crossAxisMargin, this.leadingTrackMainAxisOffset)
        borderStart = trackOffset.add(new Offset(trackSize.width, 0.0))
        borderEnd = new Offset(trackOffset.dx + trackSize.width, trackOffset.dy + this.trackExtent)
        break
      case ScrollbarOrientation.Right:
        thumbSize = new Size(this.thickness, this.thumbExtent)
        trackSize = new Size(this.thickness + 2 * this.crossAxisMargin, this.trackExtent)
        x = size.width - this.thickness - this.crossAxisMargin - this.padding.right
        y = this.thumbOffset
        trackOffset = new Offset(x - this.crossAxisMargin, this.leadingTrackMainAxisOffset)
        borderStart = trackOffset
        borderEnd = new Offset(trackOffset.dx, trackOffset.dy + this.trackExtent)
        break
      case ScrollbarOrientation.Top:
        thumbSize = new Size(this.thumbExtent, this.thickness)
        trackSize = new Size(this.trackExtent, this.thickness + 2 * this.crossAxisMargin)
        x = this.thumbOffset
        y = this.crossAxisMargin + this.padding.top
        trackOffset = new Offset(this.leadingTrackMainAxisOffset, y - this.crossAxisMargin)
        borderStart = trackOffset.add(new Offset(0.0, trackSize.height))
        borderEnd = new Offset(trackOffset.dx + this.trackExtent, trackOffset.dy + trackSize.height)
        break
      case ScrollbarOrientation.Bottom:
        thumbSize = new Size(this.thumbExtent, this.thickness)
        trackSize = new Size(this.trackExtent, this.thickness + 2 * this.crossAxisMargin)
        x = this.thumbOffset
        y = size.height - this.thickness - this.crossAxisMargin - this.padding.bottom
        trackOffset = new Offset(this.leadingTrackMainAxisOffset, y - this.crossAxisMargin)
        borderStart = trackOffset
        borderEnd = new Offset(trackOffset.dx + this.trackExtent, trackOffset.dy)
        break
    }

    
    this.trackRect = trackOffset.and(trackSize)
    this.thumbRect = new Offset(x, y).and(thumbSize)

    if (this.fadeoutOpacityAnimation.value !== 0.0) {
      if (this.trackRadius === null) {
        canvas.drawRect(this.trackRect, this.paintTrack())
      } else {
        canvas.drawRRect(RRect.fromRectAndRadius(this.trackRect, this.trackRadius), this.paintTrack())
      }
      
      canvas.drawLine(borderStart, borderEnd, this.paintTrack(true))

      if (this.radius !== null) {
        canvas.drawRRect(RRect.fromRectAndRadius(this.thumbRect, this.radius), this.paintThumb)
      } else if (this.shape === null) {
        canvas.drawRect(this.thumbRect, this.paintThumb)
      } else {
        const outerPath = this.shape.getOuterPath(this.thumbRect)
        canvas.drawPath(outerPath, this.paintThumb)
        invariant(this.thumbRect !== null)
        this.shape.paint(canvas, this.thumbRect)
      }
    }
  }

  
  paint (canvas: AtCanvas, size: Size) {
    if (
      this.lastAxisDirection === null || 
      this.lastMetrics === null
    ) {
      return
    }

    invariant(this.lastMetrics.minScrollExtent !== null)
    invariant(this.lastMetrics.maxScrollExtent !== null)
    if (this.lastMetrics.maxScrollExtent <= this.lastMetrics.minScrollExtent) {
      return 
    }
    
    if (this.traversableTrackExtent <= 0) {
      return
    }
    
    if (!Number.isFinite(this.lastMetrics.maxScrollExtent)) {
      return
    }

    this.setThumbExtent()
    invariant(this.thumbExtent !== null)
    const thumbPositionOffset = this.getScrollToTrack(this.lastMetrics, this.thumbExtent)
    this.thumbOffset = thumbPositionOffset + this.leadingThumbMainAxisOffset

    return this.paintScrollbar(canvas, size)
  }

  getTrackToScroll (thumbOffsetLocal: number) {
    invariant(this.thumbExtent !== null)
    invariant(this.lastMetrics !== null)
    invariant(this.lastMetrics.minScrollExtent !== null)
    invariant(this.lastMetrics.maxScrollExtent !== null)

    const scrollableExtent = this.lastMetrics.maxScrollExtent - this.lastMetrics.minScrollExtent
    const thumbMovableExtent = this.traversableTrackExtent - this.thumbExtent

    return scrollableExtent * thumbOffsetLocal / thumbMovableExtent
  }

  getScrollToTrack (metrics: AtScrollMetrics, thumbExtent: number) {
    invariant(metrics.maxScrollExtent !== null)
    invariant(metrics.minScrollExtent !== null)
    const scrollableExtent = metrics.maxScrollExtent - metrics.minScrollExtent

    invariant(metrics.pixels !== null)
    const fractionPast = (scrollableExtent > 0)
      ? clamp((metrics.pixels - metrics.minScrollExtent) / scrollableExtent, 0.0, 1.0)
      : 0

    return (
      this.isReversed 
        ? 1 - fractionPast 
        : fractionPast) * (this.traversableTrackExtent - thumbExtent)
  }
  
  getThumbScrollOffset () {
    invariant(this.lastMetrics !== null)
    invariant(this.lastMetrics.minScrollExtent !== null)
    invariant(this.lastMetrics.maxScrollExtent !== null)
    invariant(this.lastMetrics.pixels !== null)
    const scrollableExtent = this.lastMetrics.maxScrollExtent - this.lastMetrics.minScrollExtent
    const fractionPast = (scrollableExtent > 0)
      ? clamp(this.lastMetrics.pixels / scrollableExtent, 0.0, 1.0)
      : 0

    invariant(this.thumbExtent !== null)
    return fractionPast * (this.traversableTrackExtent - this.thumbExtent)
  }

  getScrollToTrackv (metrics: AtScrollMetrics, thumbExtent: number) {
    invariant(metrics !== null)
    invariant(metrics.pixels !== null)
    invariant(metrics.maxScrollExtent !== null)
    invariant(metrics.minScrollExtent !== null)

    const scrollableExtent = metrics.maxScrollExtent - metrics.minScrollExtent
    const fractionPast = (scrollableExtent > 0)
      ? clamp((metrics.pixels - metrics.minScrollExtent) / scrollableExtent, 0.0, 1.0)
      : 0

    return (this.isReversed ? 1 - fractionPast : fractionPast) * (this.traversableTrackExtent - thumbExtent)
  }

  hitTest (position: Offset) {
    if (this.thumbRect === null) {
      return false
    }

    if (this.ignorePointer || this.fadeoutOpacityAnimation.value === 0.0 || this.lastMetricsAreScrollable) {
      return false
    }

    invariant(this.trackRect !== null)
    invariant(position !== null)

    return this.trackRect.contains(position)
  }

  hitTestInteractive (position: Offset, kind: PointerDeviceKind, forHover = false) {
    if (this.trackRect === null) {
      return false
    }

    if (this.ignorePointer) {
      return false
    }

    if (!this.lastMetricsAreScrollable) {
      return false
    }

    invariant(this.thumbRect !== null)

    const interactiveRect = this.trackRect
    const paddedRect = interactiveRect.expandToInclude(
      Rect.fromCircle(this.thumbRect.center, kMinInteractiveSize / 2),
    )

    if (this.fadeoutOpacityAnimation.value === 0.0) {
      if (forHover && kind === PointerDeviceKind.Mouse) {
        return paddedRect.contains(position)
      }
      return false
    }

    switch (kind) {
      case PointerDeviceKind.Touch:
      // TODO
      // case PointerDeviceKind.Trackpad:
        return paddedRect.contains(position);
      case PointerDeviceKind.Mouse:
      case PointerDeviceKind.Stylus:
      case PointerDeviceKind.InvertedStylus:
      case PointerDeviceKind.Unknown:
        return interactiveRect.contains(position);
    }
  }

  hitTestOnlyThumbInteractive (position: Offset, kind: PointerDeviceKind) {
    if (this.thumbRect === null) {
      return false
    }
    if (this.ignorePointer) {
      return false
    }
    
    if (this.fadeoutOpacityAnimation.value == 0.0) {
      return false
    }

    if (this.lastMetricsAreScrollable) {
      return false
    }

    switch (kind) {
      case PointerDeviceKind.Touch:
      // TODO
      // case PointerDeviceKind.Trackpad:
        const touchThumbRect = this.thumbRect.expandToInclude(
          Rect.fromCircle(this.thumbRect.center, kMinInteractiveSize / 2),
        )
        return touchThumbRect.contains(position)
      case PointerDeviceKind.Mouse:
      case PointerDeviceKind.Stylus:
      case PointerDeviceKind.InvertedStylus:
      case PointerDeviceKind.Unknown:
        return this.thumbRect.contains(position)
    }
  }

  shouldRepaint (delegate: AtLayoutScrollbarPainter): boolean {
    return (
      this.color.notEqual(delegate.color) ||
      this.trackColor.notEqual(delegate.trackColor) ||
      this.trackBorderColor.notEqual(delegate.trackBorderColor) ||
      this.textDirection !== delegate.textDirection ||
      this.thickness !== delegate.thickness ||
      this.fadeoutOpacityAnimation !== delegate.fadeoutOpacityAnimation ||
      this.mainAxisMargin !== delegate.mainAxisMargin ||
      this.crossAxisMargin !== delegate.crossAxisMargin ||
      this.radius !== delegate.radius ||
      this.trackRadius !== delegate.trackRadius ||
      this.shape !== delegate.shape ||
      this.padding !== delegate.padding ||
      this.minLength !== delegate.minLength ||
      this.minOverscrollLength !== delegate.minOverscrollLength ||
      this.scrollbarOrientation !== delegate.scrollbarOrientation ||
      this.ignorePointer !== delegate.ignorePointer
    )
  }

  toString() {}
  
  dispose () {
    this.fadeoutOpacityAnimation.unsubscribe()
    // super.dispose()
  }
}

export abstract class AtScrollContext {
  // BuildContext? get notificationContext;
  // BuildContext get storageContext;
  // mating the scroll position.
  // TickerProvider get vsync;
  // AxisDirection get axisDirection;
  // void setIgnorePointer(bool value);
  // void setCanDrag(bool value);
  // void setSemanticsActions(Set<SemanticsAction> actions);
  // void saveOffset(double offset)
}

export abstract class AtScrollPhysics {}


export class AtScrollMetrics {
  // applyViewportDimension(viewportDimension: number): boolean {
  //   throw new Error('Method not implemented.')
  // }
  // applyContentDimensions(minScrollExtent: number, maxScrollExtent: number): boolean {
  //   throw new Error('Method not implemented.')
  // }
  // correctBy(correction: number): void {
  //   throw new Error('Method not implemented.')
  // }
  // jumpTo(pixels: number): void {
  //   throw new Error('Method not implemented.')
  // }
  // animateTo(to: number, duration: number): Promise<void> {
  //   throw new Error('Method not implemented.')
  // }
  
  public userScrollDirection: ScrollDirection = ScrollDirection.Forward
  public allowImplicitScrolling: boolean = true

  public get hasContentDimensions () {
    return this.minScrollExtent !== null && this.maxScrollExtent !== null
  }

  public get hasPixels () {
    return this.pixels !== null
  }

  public get hasViewportDimension () {
    return this.viewportDimension !== null
  }

  public axisDirection: AxisDirection
  public devicePixelRatio: number
  public minScrollExtent: number | null
  public maxScrollExtent: number | null
  public pixels: number
  public viewportDimension: number | null
  
  constructor (
    minScrollExtent: number | null = null,
    maxScrollExtent: number | null = null,
    pixels: number = 0,
    viewportDimension: number | null = null,
    axisDirection: number = 0,
    devicePixelRatio: number = 2.0,
  ) {
    // super()
    this.minScrollExtent = minScrollExtent
    this.maxScrollExtent = maxScrollExtent
    this.viewportDimension = viewportDimension

    this.axisDirection = axisDirection
    this.pixels = pixels
    this.devicePixelRatio = devicePixelRatio
  }

  copyWith (
    minScrollExtent: number | null,
    maxScrollExtent: number | null,
    pixels: number | null,
    viewportDimension: number | null,
    axisDirection: number | null,
    devicePixelRatio: number | null,
  ) {
    return new AtScrollMetrics(
      minScrollExtent ?? (this.hasContentDimensions ? this.minScrollExtent : null),
      maxScrollExtent ?? (this.hasContentDimensions ? this.maxScrollExtent : null),
      pixels ?? (this.hasPixels ? this.pixels : 0),
      viewportDimension ?? (this.hasViewportDimension ? this.viewportDimension : null),
      axisDirection ?? this.axisDirection,
      devicePixelRatio ?? this.devicePixelRatio,
    )
  }

  public get axis (): Axis {
    return axisDirectionToAxis(this.axisDirection)
  }

  public get outOfRange () {
    invariant(this.pixels !== null)
    invariant(this.minScrollExtent !== null)
    invariant(this.maxScrollExtent !== null)

    return (
      this.pixels < this.minScrollExtent || 
      this.pixels > this.maxScrollExtent
    )
  }

  public get atEdge () {
    return (
      this.pixels === this.minScrollExtent || 
      this.pixels === this.maxScrollExtent
    )
  }

  public get extentBefore () {
    invariant(this.pixels !== null)
    invariant(this.minScrollExtent !== null)
    return Math.max(this.pixels - this.minScrollExtent, 0.0)
  }

  public get extentInside () {
    invariant(this.pixels !== null)
    invariant(this.minScrollExtent !== null)
    invariant(this.maxScrollExtent !== null)
    invariant(this.viewportDimension !== null)
    invariant(this.minScrollExtent <= this.maxScrollExtent)
    return this.viewportDimension - 
      clamp(this.minScrollExtent - this.pixels, 0, this.viewportDimension) - 
      clamp(this.pixels - this.maxScrollExtent, 0, this.viewportDimension)
  }

  
  public get extentAfter () {
    invariant(this.pixels !== null)
    invariant(this.minScrollExtent !== null)
    invariant(this.maxScrollExtent !== null)
    return Math.max(this.maxScrollExtent - this.pixels, 0.0)
  }

  toString () {
    return `AtScrollMetrice()`
  }
}

export enum ScrollPositionAlignmentPolicy {
  Explicit,
  KeepVisibleAtEnd,
  KeepVisibleAtStart,
}

export abstract class AtScrollPosition extends AtScrollMetrics {

  public physics: AtScrollPhysics
  public context: AtScrollContext
  public keepScrollOffset: boolean
  
  constructor (
    physics: AtScrollPhysics,
    context: AtScrollContext,
    keepScrollOffset: boolean = true,
    position: AtScrollPosition | null,
  ) {
    super()

    if (position !== null) {
      this.absorb(position)
    }
    if (keepScrollOffset) {
      this.restoreScrollOffset()
    }

    this.physics = physics
    this.context = context
    this.keepScrollOffset = keepScrollOffset
  }

  absorb (other: AtScrollPosition) {
    if (other.hasContentDimensions) {
      this.minScrollExtent = other.minScrollExtent
      this.maxScrollExtent = other.maxScrollExtent
    }
    if (other.hasPixels) {
      this.pixels = other.pixels
    }
    if (other.hasViewportDimension) {
      this.viewportDimension = other.viewportDimension
    }

    // invariant(activity == null)
    // invariant(other.activity != null)

    // this.activity = other.activity
    // other.activity = null
    // this.context.setIgnorePointer(activity!.shouldIgnorePointer);
    // isScrollingNotifier.value = activity!.isScrolling;
  }

  
  setPixels (newPixels: number) {
    // if (newPixels !== this.pixels) {
    //   const overscroll = this.applyBoundaryConditions(newPixels)
    //   const oldPixels = this.pixels
    //   this.pixels = newPixels - overscroll
    //   if (this.pixels !== oldPixels) {
    //     notifyListeners();
    //     didUpdateScrollPositionBy(pixels - oldPixels);
    //   }
    //   if (overscroll != 0.0) {
    //     didOverscrollBy(overscroll);
    //     return overscroll;
    //   }
    // }
    // return 0.0
  }

  correctPixels (value: number) {
    this.pixels = value
  }

  
  correctBy (correction: number) {
    this.pixels = this.pixels + correction
    // _didChangeViewportDimensionOrReceiveCorrection = true
  }

  forcePixels (value: number) {
    // assert(hasPixels);
    // _impliedVelocity = value - pixels;
    this.pixels = value
    // notifyListeners()
    // SchedulerBinding.instance.addPostFrameCallback((Duration timeStamp) {
    //   _impliedVelocity = 0;
    // });
  }
  
  saveScrollOffset() {
    // PageStorage.maybeOf(context.storageContext)?.writeState(context.storageContext, pixels);
  }

  restoreScrollOffset () {
    if (!this.hasPixels) {
      // final double? value = PageStorage.maybeOf(context.storageContext)?.readState(context.storageContext) as double?;
      // if (value != null) {
      //   correctPixels(value);
      // }
    }
  }

  restoreOffset (offset: number, initialRestore: boolean = false) {
    if (initialRestore) {
      this.correctPixels(offset)
    } else {
      // this.jumpTo(offset)
    }
  }

  
  saveOffset () {
    invariant(this.hasPixels)
    // this.context.saveOffset(this.pixels)
  }

  applyBoundaryConditions (value: number) {
    // const result = this.physics.applyBoundaryConditions(this, value)
    // return result
  }


}
