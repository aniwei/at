import invariant from 'ts-invariant'
import CanvasKitInit from 'canvaskit-wasm'

// => basic
import { Timer } from '../basic/timer'
import { Color } from '../basic/color'
import { Offset, Radius, RRect, Point, Size, Rect } from '../basic/geometry'
import { WorkerTransport } from '../basic/worker-transport'
import { Subscribable } from '../basic/subscribable'
import { Matrix4 } from '../basic/matrix4'
import { EventEmitter } from '../basic/events'
import { 
  MessageError, 
  MessageOwner,
  MessageOwnerState, 
  MessageTransport,
  MessageTransportCommands,
} from '../basic/message-transport'

export * from '../basic/timer'
export * from '../basic/color'
export * from '../basic/geometry'
export * from '../basic/subscribable'
export * from '../basic/message-transport'
export * from '../basic/worker-transport'
export * from '../basic/subscribable'
export * from '../basic/matrix2'
export * from '../basic/matrix3'
export * from '../basic/matrix4'
export * from '../basic/events'

// => App
import { App, AppLifecycle, WorkerApp } from './app'
import { AtPlatform } from './platform'

export * from './app'

// => engine
import { AtImage } from '../engine/image'
import { AtFonts } from '../engine/font'
import { AtPath } from '../engine/path'
import { AtPaint } from '../engine/paint'
import { AtShader } from '../engine/shader'
import { AtCanvas } from '../engine/canvas'
import { AtMaskFilter } from '../engine/mask-filter'
import { AtAnimatedImage } from '../engine/animated-image'
import { AtSurfaceFrame } from '../engine/surface'
import { CanvasKit, Clip, FilterQuality, ImageByteFormat } from '../engine/skia'
import { AtTextHeightBehavior, AtTextPosition, AtTextRange, AtTextSelection } from '../engine/text'
import { AtImageFilter, AtBlurImageFilter } from '../engine/image-filter'
import { AtManagedSkiaColorFilter, AtMatrixColorFilter, AtBlendModeColorFilter } from '../engine/color-filter'
import { AtTransformLayer } from '../engine/layer'
import { AtLayerScene } from '../engine/layer-scene'
import { AtLayerTree } from '../engine/layer-tree'

export * from '../engine/text'
export * from '../engine/image'
export * from '../engine/font'
export * from '../engine/path'
export * from '../engine/paint'
export * from '../engine/shader'
export * from '../engine/canvas'
export * from '../engine/mask-filter'
export * from '../engine/image-filter'
export * from '../engine/color-filter'
export * from '../engine/animated-image'
export * from '../engine/animated-image'
export * from '../engine/skia'
export * from '../engine/layer'
export * from '../engine/layer-tree'
export * from '../engine/layer-scene'
export * from '../engine/surface'


// => painting
import { Axis } from '../painting/painting'
import { AtAlignment } from '../painting/alignment'
import { AtTextSpan } from '../painting/text-span'
import { AtInlineSpan } from '../painting/inline-span'
import { AtTextPaintingStyle } from '../painting/text-style'
import { AtImageCache, ImageChunkListener, AtImageProvider, AtNetworkImage, AtImageStream, AtImageConfiguration } from '../painting/image-provider'
import { AtPlaceholderDimensions } from '../painting/text-painter'
import { AtBoxDecoration, AtBoxDecorationCompositePainter, AtBoxDecorationPainter } from '../painting/box-decoration'
import { AtBoxShadow, AtBoxShadows } from '../painting/box-shadow'
import { AtBorderRadius } from '../painting/border-radius'
import { AtBoxBorder } from '../painting/box-border'
import { AtDecoration } from '../painting/decoration'
import { AtDecorationImage } from '../painting/decoration-image'
import { AtLinearGradient } from '../painting/gradient'
import { AtShadows, AtShadow } from '../painting/shadow'
import { AtShapeDecoration, AtShapeDecorationCompositePainter } from '../painting/shape-decoration'
import { AtBorder } from '../painting/border'

export * from '../painting/painting'
export * from '../painting/inline-span'
export * from '../painting/text-span'
export * from '../painting/text-style'
export * from '../painting/text-painter'
export * from '../painting/alignment'
export * from '../painting/image-provider'
export * from '../painting/border'
export * from '../painting/box-border'
export * from '../painting/box-decoration'
export * from '../painting/shape-decoration'
export * from '../painting/border-radius'
export * from '../painting/shadow'
export * from '../painting/box-shadow'
export * from '../painting/decoration'
export * from '../painting/decoration-image'
export * from '../painting/gradient'

// => layout
import { AtLayoutObject } from '../layout/object'
import { AtPaintingContext } from '../layout/painting-context'
import { AtLayoutBox } from '../layout/box'
import { AtLayoutImage } from '../layout/image'
import { AtLayoutStack } from '../layout/stack'
import { AtListener } from '../layout/listener'
import { AtLayoutSliver } from '../layout/sliver'
import { AtLayoutParagraph } from '../layout/paragraph'
import { AtLayoutDecoratedBox } from '../layout/decorated-box'
import { AtViewportOffset } from '../layout/viewport-offset'
import { AtLayoutParagraphDelegate } from '../layout/paragraph-delegate'
import { AtLayoutCustom, AtLayoutCustomPainter } from '../layout/custom'
import { AtLayoutScrollbar, AtLayoutScrollbarPainter } from '../layout/scrollbar'
import { AtParagraphCaretPainter, AtParagraphHighlightPainter } from '../layout/paragraph-painter'
import { AtBoxConstraints } from '../layout/box-constraints'


export * from '../layout/object'
export * from '../layout/box'
export * from '../layout/view'
export * from '../layout/image'
export * from '../layout/stack'
export * from '../layout/listener'
export * from '../layout/custom'
export * from '../layout/paragraph'
export * from '../layout/paragraph-delegate'
export * from '../layout/paragraph-painter'
export * from '../layout/viewport-offset'
export * from '../layout/scrollbar'
export * from '../layout/painting-context'
export * from '../layout/pipeline-owner'
export * from '../layout/decorated-box'
export * from '../layout/box-constraints'

// => animation
import { AtSpringDescription, AtTolerance } from '../animation/simulation'


export * from '../animation/animation'
export * from '../animation/simulation'

// => gesture
export * from '../gestures/drag'

// => global types
export type VoidCallback = () => void
export type ArrayLike<T> = Array<T> | {
  [Symbol.iterator](): any
  length: number
  [n: number]: T
}

export type FrameInfo = {
  duration: number
  image: AtImage
}

export type Codec = {
  frameCount: number
  repetitionCount: number

  getNextFrame (): Promise<FrameInfo>
  dispose (): void
}

// framework type
export enum WebGLMajorVersion {
  WebGL1 = 1,
  WebGL2 = 2
}


export enum RenderComparison {
  Identical,
  Metadata,
  Paint,
  Layout,
}

export enum TargetPlatform {
  Android,
  Fuchsia,
  iOS,
  Linux,
  MacOS,
  Windows,
}

export enum VerticalDirection {
  Up,
  Down,
}

export enum ScrollDirection {
  Idle,
  Forward,
  Reverse,
}

export enum AxisDirection {
  Up,
  Right,
  Down,
  Left,
}

export enum DecorationPosition {
  Background,
  Foreground,
}


// => AtFramework
export enum FrameworkGPUAccelerated {
  WebGPU,
  WebGL2,
  WebGL1
}

export enum FrameworkState {
  Uninitialized = 1,
  Initializing = 2,
  Initialized = 4,
  WarmUpping = 8,
  WarmUpped = 16
}

export type AtFrameworkOptions = {
  skiaURL: string,
}

export type AtFrameworkCache = {
  image?: AtImageCache
}

export type AtFrameworkSettings = {
  baseURL: string,
  assetsDir: string,
  platform: TargetPlatform,
  devicePixelRatio: number,
  accelerated:  FrameworkGPUAccelerated
}

export type EnsureQueueCallback = (At: AtFramework) => void
export type AtFrameworkEvents = 'appstarted' | 'appmousecursorchanged' | 'flush' | 'route' | 'pointerup' | 'pointermove' | 'pointerdown' | 'pointercancel' | 'pointerevents'

// @ts-ignore 
export interface AtFramework extends CanvasKit {}

export class AtFramework extends AtPlatform<AtFrameworkEvents> implements AtFramework {
  static create () {
    return new AtFramework()
  }

  // => basic 
  
  public Color = Color
  public EventEmitter = EventEmitter
  public Matrix4 = Matrix4
  public MessageError = MessageError
  public MessageOwner = MessageOwner
  public MessageTransport = MessageTransport
  public MessageOwnerState = MessageOwnerState 
  public MessageTransportCommands = MessageTransportCommands
  public Offset = Offset 
  public Point = Point
  public Rect = Rect 
  public RRect = RRect 
  public Radius = Radius 
  public Size = Size
  public Subscribable = Subscribable
  public Timer = Timer
  public WorkerTransport = WorkerTransport

  // => App
  public App = App
  public WorkerApp = WorkerApp

  // => engine
  public AtAnimatedImage = AtAnimatedImage
  public AtBlendModeColorFilter = AtBlendModeColorFilter
  public AtBlurImageFilter = AtBlurImageFilter
  public AtCanvas = AtCanvas
  public AtImage = AtImage
  public AtImageFilter = AtImageFilter
  public AtLayerScene = AtLayerScene
  public AtLayerTree = AtLayerTree

  public AtMaskFilter = AtMaskFilter
  public AtPath = AtPath
  public AtPaint = AtPaint
  public AtShader = AtShader
  public AtSurfaceFrame = AtSurfaceFrame
  public AtTextHeightBehavior = AtTextHeightBehavior
  public AtTextPosition = AtTextPosition
  public AtTextRange = AtTextRange
  public AtTextSelection = AtTextSelection
  public AtTransformLayer = AtTransformLayer

  // painting
  public AtAlignment = AtAlignment
  public AtBorder = AtBorder
  public AtBoxBorder = AtBoxBorder
  public AtBoxDecoration = AtBoxDecoration
  public AtBoxDecorationPainter = AtBoxDecorationPainter
  public AtBoxDecorationCompositePainter = AtBoxDecorationCompositePainter
  public AtBoxShadows = AtBoxShadows
  public AtBorderRadius = AtBorderRadius
  public AtBoxShadow = AtBoxShadow
  public AtDecoration = AtDecoration
  public AtDecorationImage = AtDecorationImage

  public AtImageConfiguration = AtImageConfiguration
  public AtImageProvider = AtImageProvider
  public AtImageStream = AtImageStream
  public AtInlineSpan = AtInlineSpan
  public AtLinearGradient = AtLinearGradient
  public AtNetworkImage = AtNetworkImage
  public AtShadow = AtShadow
  public AtShadows = AtShadows
  public AtShapeDecoration = AtShapeDecoration
  public AtShapeDecorationCompositePainter = AtShapeDecorationCompositePainter
  public AtTextPaintingStyle = AtTextPaintingStyle
  public AtTextSpan = AtTextSpan


  // => layout
  public AtBoxConstraints = AtBoxConstraints
  public AtLayoutDecoratedBox = AtLayoutDecoratedBox
  public AtLayoutBox = AtLayoutBox
  public AtLayoutCustom = AtLayoutCustom
  public AtLayoutCustomPainter = AtLayoutCustomPainter
  public AtLayoutImage = AtLayoutImage
  // public AtLayerLink = AtLayerLink
  public AtLayoutObject = AtLayoutObject
  public AtLayoutParagraph = AtLayoutParagraph
  public AtLayoutParagraphDelegate = AtLayoutParagraphDelegate
  public AtLayoutScrollbar = AtLayoutScrollbar
  public AtLayoutScrollbarPainter = AtLayoutScrollbarPainter
  public AtLayoutSliver = AtLayoutSliver
  public AtLayoutStack = AtLayoutStack
  public AtListener = AtListener
  public AtPaintingContext = AtPaintingContext
  public AtParagraphCaretPainter = AtParagraphCaretPainter 
  public AtParagraphHighlightPainter = AtParagraphHighlightPainter
  public AtViewportOffset = AtViewportOffset
  

  // => enum
  public Axis = Axis
  public Clip = Clip
  public FilterQuality = FilterQuality
  public ImageByteFormat = ImageByteFormat

  // constants
  public kAssetManifestFileName = 'manifest.json'
  public kPaintInvertedColorFilter?: AtManagedSkiaColorFilter
  public kEmptyPlaceholderDimensions?: AtPlaceholderDimensions
  public kFlingSpringDescription?: AtSpringDescription
  public kDefaultTolerance?: AtTolerance
  public kFlingTolerance?: AtTolerance
   

  public cache: AtFrameworkCache = {}
  public fonts: AtFonts = AtFonts.create()
  
  public globalSettings: AtFrameworkSettings

  private application: App | null = null
  private queue: EnsureQueueCallback[] = []
  private state = FrameworkState.Uninitialized

  public skia: CanvasKit | null = null
  public FinalizationRegistry = this.window.FinalizationRegistry

  constructor () {
    super()

    this.globalSettings = {
      baseURL: '/',
      platform: TargetPlatform.iOS,
      assetsDir: 'assets',
      devicePixelRatio: 2.0,
      accelerated: FrameworkGPUAccelerated.WebGL2
    }
  }

  private handleApplicationStarted = (app: App) => {
    this.application = app
    this.warmUp()
    this.listen()
  }

  private handlePointerEvents = (event: PointerEvent) => {
    this.emit('pointerevents', event)
  }

  private unlisten () {
    const window = this.window

    window.removeEventListener('pointerdown', this.handlePointerEvents)
    window.removeEventListener('pointermove', this.handlePointerEvents)
    window.removeEventListener('pointerup', this.handlePointerEvents)
    window.removeEventListener('pointercancel', this.handlePointerEvents)

    this.on(AppLifecycle.Started, this.handleApplicationStarted, this)
  }

  public listen () {
    const window = this.window

    window.addEventListener('pointerdown', this.handlePointerEvents)
    window.addEventListener('pointermove', this.handlePointerEvents)
    window.addEventListener('pointerup', this.handlePointerEvents)
    window.addEventListener('pointercancel', this.handlePointerEvents)

    this.off('appstarted', this.handleApplicationStarted, this)
  }

  schedule () {
    super.schedule(() => {
      this.emit('flush')
    })
  }

  warmUp () {
    this.emit('flush')
  }

  getApplication <T extends App = App> (): T {
    invariant(this.application, `The "this.application" cannot be null.`)
    return this.application as T
  }

  instantiateImageCodec () {
    throw new Error(``)
  }

  /**
   * 
   * @param {string} url 
   * @param {ImageChunkListener} chunkCallback 
   * @returns {Promise<AtImage>}
   */
  instantiateImageCodecFromURL (url: string, chunkCallback: ImageChunkListener) {
    return this.fetch(url).then(resp => resp.arrayBuffer()).then((data: ArrayBuffer) => {
      return AtAnimatedImage.decodeFromBytes(new Uint8Array(data), url)
    })
  }
  
  destory () {
    this.unlisten()
  }

  /**
   * 确实 CanvasKit 初始化
   * @param callback 
   * @param options 
   * @returns 
   */
  ensure (
    callback: EnsureQueueCallback = ((At: AtFramework) => {}), 
    options: AtFrameworkOptions = {
      skiaURL: '/canvaskit.wasm',
    }
  ) {
    switch (this.state) {
      case FrameworkState.Initialized: {
        return Promise.resolve().then(() => {
          callback(this)
          return this
        })
      }

      case FrameworkState.Initializing: {
        return new Promise((resolve) => {
          this.queue.push(() => {
            callback(this)
            resolve(this)
          })
        })
      }

      default: {
        this.queue.push(callback)
        this.state = FrameworkState.Initializing
        
        return CanvasKitInit({
          locateFile: () => options.skiaURL
        }).then((skia: CanvasKit) => {
          this.skia = skia
          this.state = FrameworkState.Initialized

          do {
            const ensure = this.queue.shift()
            if (typeof ensure === 'function') {
              ensure(this)
            }
          } while (this.queue.length > 0)

          return this
        })
      }
    }
  }
}

export const At = AtFramework.create()


At.ensure((At) => {
  invariant(At.skia)
  Object.entries(At.skia).forEach(([key, value]) => {
    if (typeof At[key as keyof CanvasKit] === 'undefined') {
      Reflect.defineProperty(At, key, {
        get () {
          return value
        }
      })
    }
  })
})

At.ensure((At: AtFramework) => {
  At.kPaintInvertedColorFilter = new AtManagedSkiaColorFilter(new AtMatrixColorFilter(Float64Array.from([
    -1.0, 0.0, 0.0, 1.0, 0.0,
    0.0, -1.0, 0.0, 1.0, 0.0,
    0.0, 0.0, -1.0, 1.0, 0.0,
    1.0, 1.0, 1.0, 1.0, 0.0
  ])))

  At.kEmptyPlaceholderDimensions = AtPlaceholderDimensions.create({
    size: Size.zero, 
    alignment: At.PlaceholderAlignment.Bottom
  })

  At.kFlingSpringDescription = AtSpringDescription.withDampingRatio(1.0, 500.0)
  At.kDefaultTolerance = AtTolerance.create()
  At.kFlingTolerance = AtTolerance.create({ 
    velocity: Infinity, 
    distance: 0.01 
  })

  At.cache.image = AtImageCache.create()
})

At.ensure(() => At.destory())
