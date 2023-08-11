import { VoidCallback } from '.'
import { Color } from '../basic/color'
import { EventEmitter } from '../basic/events'
import { Offset, Radius, Rect } from '../basic/geometry'
import { AtEdgeInsets } from '../painting/edge-insets'

// => Schedule
export enum SchedulePhase {
  Idle = 1,
  Frame = 4
}

type SchedulerCallback = (...args: any[]) => void

type SchedulerHandler<T> = {
  id: number,
  callback: SchedulerCallback,
  data?: T
}

class Scheduler<T> {
  static create <T> (phase: SchedulePhase) {
    return new Scheduler<T>(phase)
  }

  private id: number = 0
  public phase: SchedulePhase
  public schedulers: SchedulerHandler<T>[] = []

  constructor (phase: SchedulePhase) {
    this.phase = phase
  }

  register (callback: SchedulerCallback, data?: T): number {
    this.id += 1

    this.schedulers.push({
      id: this.id,
      callback,
      data,
    })
    
    return this.id
  }

  unregister (id: number): void {
    if (id <= this.id) {
      const index = this.schedulers.findIndex(scheduler => {
        return scheduler.id === id
      })

      this.schedulers.splice(index, 1)
    }
  }

  schedule () {}
}

// => AtPlatform
export enum AtPlatformState {
  Uninitialized = 1,
  Initializing = 2,
  Initialized = 4,
  WarmUpping = 8,
  WarmUpped = 16
}

export type AtPlatformOptions = {
  skiaURL: string,
}

export type AtPlatformEvents = 'appstarted' | 'appmousecursorchanged' | 'flush' | 'route' | 'pointerup' | 'pointermove' | 'pointerdown' | 'pointercancel' | 'pointerevents'

export abstract class AtPlatform<T extends AtPlatformEvents> extends EventEmitter<T> {

  public get kGeometryLargestRect (): Rect {
    return Rect.create(
      -this.kGeometryGiantScalar, 
      -this.kGeometryGiantScalar, 
      this.kGeometryGiantScalar, 
      this.kGeometryGiantScalar
    )
  }
  public get kCanvasShadowLightXTangen (): number {
    return this.kCanvasShadowLightXOffset / this.kCanvasShadowLightHeight
  }

  public get kCanvasShadowLightYTangent (): number {
    return this.kCanvasShadowLightYOffset / this.kCanvasShadowLightHeight
  } 

  public kGeometryGiantScalar: number = 1.0E+9
  public kDefaultFontSize: number = 14.0
  public kImageCacheSize: number = 100
  public kImageCacheSizeBytes: number = 100 << 20 
  public kCanvasMitchellNetravaliB: number = 1.0 / 3.0
  public kCanvasMitchellNetravaliC: number = 1.0 / 3.0
  public kCanvasShadowAmbientAlpha: number = 0.039
  public kCanvasShadowSpotAlpha: number = 0.25
  public kCanvasShadowLightRadius: number = 1.1
  public kCanvasShadowLightHeight: number = 600.0
  public kCanvasShadowLightXOffset: number = 0.0
  public kCanvasShadowLightYOffset: number = -450

  public kPaintDefaultColor: Color = Color.create(0xFF000000)

  
  public kPrimaryButton = 0x01
  public kSecondaryButton = 0x02
  public kTertiaryButton = 0x04
  public kBackMouseButton = 0x08
  public kForwardMouseButton = 0x08



  public kMouseDeviceId = -1
  public kButtonsMask = 0x3FFFFF
  public kPrimaryMouseButton = 0x1
  public kSecondaryMouseButton = 0x2
  public kMiddleMouseButton = 0x4

  public kCaretGap = 1.0
  public kCaretHeightOffset = 2.0
  public kFloatingCaretSizeIncrease = AtEdgeInsets.symmetric(0.5, 1.0)
  public kFloatingCaretRadius = Radius.circular(1.0)

  public kTouchSlop = 18.0
  public kPagingTouchSlop = this.kTouchSlop * 2.0
  public kPanSlop = this.kTouchSlop * 2.0
  public kScaleSlop = this.kTouchSlop
  public kPrecisePointerHitSlop = 1.0

  public kPrecisePointerPanSlop = this.kPrecisePointerHitSlop * 2.0
  public kPrecisePointerScaleSlop = this.kPrecisePointerHitSlop

  public kPressTimeout = 100
  public kLongPressTimeout = 500

  public kObscureShowLatestCharCursorTicks = 3
  public kObscureShowCharTicksPending = 0
  public kPrecisionErrorTolerance = 1e-10

  public kCubicErrorBound = 0.001

  public kMinFlingVelocity = 50.0
  public kMaxFlingVelocity = 8000.0

  public kDefaultMouseScrollToScaleFactor = 200
  public kDefaultTrackpadScrollToScaleFactor = new Offset(0, -1 / this.kDefaultMouseScrollToScaleFactor)

  public kEpsilonDefault = 1e-3
  public kEllipsis = '\u2026'

  public kCursorBlinkHalfPeriod = 500
  public kDragSelectionUpdateThrottle = 15


  public kKindToCSSValue = {
    alias: 'alias',
    allScroll: 'all-scroll',
    basic: 'default',
    cell: 'cell',
    click: 'pointer',
    contextMenu: 'context-menu',
    copy: 'copy',
    forbidden: 'not-allowed',
    grab: 'grab',
    grabbing: 'grabbing',
    help: 'help',
    move: 'move',
    none: 'none',
    noDrop: 'no-drop',
    precise: 'crosshair',
    progress: 'progress',
    text: 'text',
    resizeColumn: 'col-resize',
    resizeDown: 's-resize',
    resizeDownLeft: 'sw-resize',
    resizeDownRight: 'se-resize',
    resizeLeft: 'w-resize',
    resizeLeftRight: 'ew-resize',
    resizeRight: 'e-resize',
    resizeRow: 'row-resize',
    resizeUp: 'n-resize',
    resizeUpDown: 'ns-resize',
    resizeUpLeft: 'nw-resize',
    resizeUpRight: 'ne-resize',
    resizeUpLeftDownRight: 'nwse-resize',
    resizeUpRightDownLeft: 'nesw-resize',
    verticalText: 'vertical-text',
    wait: 'wait',
    zoomIn: 'zoom-in',
    zoomOut: 'zoom-out',
  }

  public frame: Scheduler<void> = Scheduler.create(SchedulePhase.Frame)

  public window = typeof window === 'undefined'
    ? globalThis 
    : window
    
  schedule (scheduleCallback?: VoidCallback) {
    this.request(() => {
      if (scheduleCallback) {
        scheduleCallback()
      }
    })
  }

  idle (callback: VoidCallback) {
    if (this.window.requestIdleCallback) {
      this.window.requestIdleCallback(callback)
    } else {
      this.window.setTimeout(callback)
    }
  }

  timeout (callback: VoidCallback, timeout: number) {
    return this.window.setTimeout(callback, timeout)
  }

  periodic (callback: VoidCallback, duration: number) {
    return this.window.setInterval(callback, duration)  
  }
  
  microtask (callback: VoidCallback) {
    
  }

  request (callback: FrameRequestCallback): number {
    return this.window.requestAnimationFrame(callback)
  }

  cancel (requestId: number) {
    return this.window.cancelAnimationFrame(requestId)
  }

  fetch (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return this.window.fetch(input, init)
  }
}