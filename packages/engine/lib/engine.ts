import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import { defineReadOnly, invariant, tryCatch } from '@at/utils'
import { AssetError } from '@at/asset'
import { fetch } from '@at/basic'
import { Size } from '@at/geometry'

import { RefsRegistry } from './refs'
import { WebGLMajorKind } from './basic'
import { Fonts } from './font'
import { Rasterizer } from './rasterizer'
import { AnimatedImage } from './animated-image'
import { Scheduler } from './scheduler'

import * as Skia from './skia'


//// => basic types
// 基础类型定义
export interface EngineSkia extends CanvasKit {
  Axis: typeof Skia.Axis,
  Clip: typeof Skia.Clip,
  FilterQuality: typeof Skia.FilterQuality,
  ImageByteFormat: typeof Skia.ImageByteFormat,
  AxisDirection: typeof Skia.AxisDirection,
  ScrollDirection: typeof Skia.ScrollDirection,
  VerticalDirection: typeof Skia.VerticalDirection
}

// 环境变量
export interface EngineEnvironments {
  SKIA_URI: string,
  ATKIT_ASSETS_BASE_URI: string,
  ATKIT_ASSETS_ROOT_DIR: string,
  ATKIT_TEXT_FONTSIZE: number,
  ATKIT_FONT_FAMILY: string,
  ATKIT_IMAGE_CACHE_MAXIMUM_BYTES: number,
  ATKIT_IMAGE_CACHE_MAXIMUM_SIZE: number,
  ATKIT_PRECISION_ERROR_TOLERANCE: number,
  ATKIT_EPSILONE: number,
  ATKIT_CUBIC_ERROR_BOUND: number,
  ATKIT_CURSOR_BLINK_PERIOD: number
}



// 运行时生命周期
export enum EngineLifecycleKind {
  Created = 'created',
  Initializing = 'initializing',
  Ready = 'ready',
  Running = 'running',
  Destory = 'destroy'
}

//// => EngineRasterizer
export class EngineRasterizer extends Rasterizer {
  static create (
    surface: Skia.Surface,
    devicePixelRatio: number
  ) {
    return super.create(
      surface, 
      devicePixelRatio
    ) as EngineRasterizer
  }
}

//// => Engine
export interface EngineConfiguration {
  uri: string,  
  width: number,
  height: number,
  devicePixelRatio: number,
  baseURI: string,
  rootDir: string
}

//// => Engine
// AtKit Engine
export abstract class Engine extends Scheduler {  
  // => instance
  static instances: Engine[] = []

  /**
   * 注册实例
   * @param {Engine} engine 
   */
  static register (engine: Engine) {
    if (!Engine.instances.includes(engine)) {
      this.instances.push(engine)
    }
  }

  /**
   * 
   * @param {engine} engine 
   */
  static unregister (engine: Engine) {
    const index = this.instances.findIndex(e => e === engine)
    if (index > -1) {
      this.instances.splice(index, 1)
    }
  }

  // => engine
  // Skia Runtime 对象
  static _skia: EngineSkia | null = null
  static get skia () {
    invariant(this._skia)
    return this._skia
  }
  static set skia (skia: EngineSkia) {
    /// => extending skia
    // 扩展 Skia
    defineReadOnly(skia, 'AxisDirection', Skia.AxisDirection)
    defineReadOnly(skia, 'Axis', Skia.Axis)
    defineReadOnly(skia, 'Clip', Skia.Clip)
    defineReadOnly(skia, 'FilterQuality', Skia.FilterQuality)
    defineReadOnly(skia, 'ImageByteFormat', Skia.ImageByteFormat)
    defineReadOnly(skia, 'ScrollDirection', Skia.ScrollDirection)
    defineReadOnly(skia, 'VerticalDirection', Skia.ImageByteFormat)
 
    this._skia = skia
  }

  // => fonts
  // 懒创建
  static _fonts: Fonts | null = null
  static get fonts () {
    if (this._fonts === null) {
      this._fonts = Fonts.create()
    }

    return this._fonts
  }

  // => refs
  // skia 对象引用管理
  static refs: RefsRegistry = RefsRegistry.create()

  /**
   * 
   * @param {string} url 
   * @param {ImageChunkListener} chunkCallback 
   * @returns {Promise<AtImage>}
   */
  static instantiateImageCodec (uri: string) {
    return fetch(uri).then(res => res.arrayBuffer()).then((data: ArrayBuffer) => {
      return AnimatedImage.decodeFromBytes(new Uint8Array(data), uri)
    })
  }

  /**
   * 
   * @param {Size} size 
   * @param {OffscreenCanvas} canvas 
   */
  static tryCreateSurface (size: Size, canvas: OffscreenCanvas) {
    try {
      return Engine.skia.MakeWebGLCanvasSurface(canvas as unknown as HTMLCanvasElement)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.message}`)
    }

    const versions = [ 
      WebGLMajorKind.WebGL1, 
      WebGLMajorKind.WebGL2 
    ]

    for (const ver of versions) {
      const glContext = Engine.skia.GetWebGLContext(canvas as unknown as HTMLCanvasElement, {
        antialias: 1,
        majorVersion: ver
      })

      if (glContext !== 0) {
        const grContext = Engine.skia.MakeWebGLContext(glContext) ?? null
        if (grContext === null) {
          continue
        }

        const surface = Engine.skia.MakeOnScreenGLSurface(
          grContext,
          Math.ceil(size.width),
          Math.ceil(size.height),
          Engine.skia.ColorSpace.SRGB
        )

        return surface
      }
    }

    console.warn(`Caught ProgressEvent with target: Cannot create WebGL context.`)
    return Engine.skia.MakeSWCanvasSurface(canvas as unknown as HTMLCanvasElement)
  }

  /**
   * 获取环境变了
   * @param {string} key 
   * @param {string?} defaultEnv 
   * @returns 
   */
  static env <T extends string | number | unknown> (key: string, defaultEnv?: T): T {
    if (Reflect.has(process.env, key)) {
      return Reflect.get(process.env, key) as T
    }

    return defaultEnv as T
  }

  //  Engine 生命周期
  // => 
  public _state: EngineLifecycleKind = EngineLifecycleKind.Created
  public get state () {
    return this._state
  }
  public set state (state: EngineLifecycleKind) {
    if (this._state !== state) {
      this._state = state
    }
  }

  // => rasterizer
  public _rasterizer: EngineRasterizer | null = null
  public get rasterizer () {
    if (this._rasterizer === null) {
      const width = this.configuration.width
      const height = this.configuration.height
      const devicePixelRatio = this.configuration.devicePixelRatio

      tryCatch(() => {
        if (this.element) {
          
          this.element.width = width * devicePixelRatio
          this.element.height = height * devicePixelRatio
        }
      })

      const surface = Engine.tryCreateSurface(
        Size.create(width, height), 
        this.element
      ) ?? null

      invariant(surface, 'The "surface" cannot be null.')
      this._rasterizer = EngineRasterizer.create(surface, devicePixelRatio)
    }

    return this._rasterizer
  } 

  // => element
  // 离屏绘制
  protected _element: OffscreenCanvas | null = null
  public get element () {
    invariant(this._element)
    return this._element
  }
  public set element (element: OffscreenCanvas) {
    this._element = element
  }

  // => configuration
  protected _configuration: EngineConfiguration | null = null
  public get configuration () {
    invariant(this._configuration !== null)
    return this._configuration
  }
  public set configuration (configuration: EngineConfiguration) {
    if (
      this._configuration === null || 
      this._configuration !== configuration
    ) {
      this._configuration = configuration
    }
  }

  // skia 队列
  protected queue: VoidFunction[] = []  
  // gesture
  abstract gesture: unknown

  /**
   * 构造函数
   * @param {EngineConfiguration} configuration 
   */
  constructor (configuration: EngineConfiguration) {
    super(configuration.baseURI, configuration.rootDir)

    this.configuration = configuration
    Engine.register(this)
  } 

  abstract prepare (): Promise<void>
  
  abstract hitTest (...rests: unknown[]): void
  abstract dispatchEvent (...rests: unknown[]): void

  /**
   * 加载框架资源
   * @param {string} asset 
   * @returns {Promise<Response>}
   */
  async load (asset: string): Promise<Response> {
    const uri = this.getAssetURI(asset)

    try {
      return fetch(uri)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${1}`)
      throw new AssetError(uri, error.status)
    }
  }

  /**
   * 
   * @param {string} uri 
   * @returns {CanvasKit}
   */
  ensure (): Promise<EngineSkia> {
    if (this.state === EngineLifecycleKind.Ready) {
      invariant(Engine.skia !== null)
      return Promise.resolve(Engine.skia as EngineSkia)
    } else if (this.state === EngineLifecycleKind.Initializing) {
      return new Promise((resolve) => this.queue.push(() => resolve(Engine.skia as EngineSkia)))
    } else {
      this.state = EngineLifecycleKind.Initializing
      return CanvasKitInit({
        locateFile: () => this.configuration.uri
      }).then((skia: CanvasKit) => {
        Engine.skia = skia as EngineSkia

        do {
          const callback = this.queue.shift() ?? null
          if (typeof callback === 'function') {
            Reflect.apply(callback, undefined, [])
          }
        } while (this.queue.length > 0)

        this.state = EngineLifecycleKind.Ready

        return Engine.skia
      })
    }
  }

  dispose () {
    super.dispose()
    Engine.unregister(this)
  }
}
