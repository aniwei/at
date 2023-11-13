import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import { defineReadOnly, invariant, tryCatch } from '@at/utils'
import { AssetError, AssetsManager } from '@at/asset'
import { fetch } from '@at/basic'
import { Size } from '@at/geometry'

import { RefsRegistry } from './refs'
import { WebGLMajorKind } from './basic'
import { Fonts } from './font'
import { Rasterizer } from './rasterizer'
import { AnimatedImage } from './animated-image'

import * as Skia from './skia'


//// => AtRasterizer
export class AtRasterizer extends Rasterizer {
  static create (
    surface: Skia.Surface,
    devicePixelRatio: number
  ) {
    return super.create(
      surface, 
      devicePixelRatio
    ) as AtRasterizer
  }
}

//// => basic types
// 基础类型定义
export interface AtEngineSkia extends CanvasKit {
  AxisKind: typeof Skia.AxisKind,
  ClipKind: typeof Skia.ClipKind,
  FilterQualityKind: typeof Skia.FilterQualityKind,
  ImageByteFormatKind: typeof Skia.ImageByteFormatKind
}

// 环境变量
export interface AtEngineEnvironments {
  SKIA_URI: string,
  ATKIT_ASSETS_BASE_URI: string,
  ATKIT_ASSETS_ROOT_DIR: string,
  ATKIT_TEXT_FONTSIZE: number,
  ATKIT_FONT_FAMILY: string,
  ATKIT_IMAGE_CACHE_MAXIMUM_BYTES: number,
  ATKIT_IMAGE_CACHE_MAXIMUM_SIZE: number
}


// 运行时生命周期
export enum AtEngineLifecycleKind {
  Created = 'created',
  Initializing = 'initializing',
  Ready = 'ready',
  Running = 'running',
  Destory = 'destroy'
}

export interface AtEngineConfiguration {
  size: Size,
  devicePixelRatio: number,
  uri: string,  
  assets: {
    baseURI: string,
    rootDir: string
  }
}

export abstract class AtEngine extends AssetsManager {
  
  
  // => engine
  // Skia Runtime 对象
  static _skia: AtEngineSkia | null = null
  static get skia () {
    invariant(this._skia)
    return this._skia
  }
  static set skia (skia: AtEngineSkia) {
    /// => extending skia
    // 扩展 Skia
    defineReadOnly(skia, 'AxisKind', Skia.AxisKind)
    defineReadOnly(skia, 'ClipKind', Skia.ClipKind)
    defineReadOnly(skia, 'FilterQualityKind', Skia.FilterQualityKind)
    defineReadOnly(skia, 'ImageByteFormatKind', Skia.ImageByteFormatKind)
    
 
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
      return AtEngine.skia.MakeWebGLCanvasSurface(canvas as unknown as HTMLCanvasElement)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.message}`)
    }

    const versions = [ WebGLMajorKind.WebGL1, WebGLMajorKind.WebGL2 ]

    for (const ver of versions) {
      const glContext = AtEngine.skia.GetWebGLContext(canvas as unknown as HTMLCanvasElement, {
        antialias: 1,
        majorVersion: ver
      })

      if (glContext !== 0) {
        const grContext = AtEngine.skia.MakeWebGLContext(glContext) ?? null
        if (grContext === null) {
          continue
        }

        const surface = AtEngine.skia.MakeOnScreenGLSurface(
          grContext,
          Math.ceil(size.width),
          Math.ceil(size.height),
          AtEngine.skia.ColorSpace.SRGB
        )

        return surface
      }
    }

    console.warn(`Caught ProgressEvent with target: Cannot create WebGL context.`)
    return AtEngine.skia.MakeSWCanvasSurface(canvas as unknown as HTMLCanvasElement)
  }

  /**
   * 获取环境变了
   * @param {string} key 
   * @param {string?} defaultEnv 
   * @returns 
   */
  static env <T extends string | number> (key: string, defaultEnv?: T): T {
    if (Reflect.has(process.env, key)) {
      return Reflect.get(process.env, key) as T
    }

    return defaultEnv as T
  }

  //  Engine 生命周期
  // => 
  public _state: AtEngineLifecycleKind = AtEngineLifecycleKind.Created
  public get state () {
    return this._state
  }
  public set state (state: AtEngineLifecycleKind) {
    if (this._state !== state) {
      this._state = state
    }
  }

  // => rasterizer
  public _rasterizer: AtRasterizer | null = null
  public get rasterizer () {
    if (this._rasterizer === null) {
      const size = this.configuration.size
      const devicePixelRatio = this.configuration.devicePixelRatio

      tryCatch(() => {
        if (this.element) {
          const width = size.width / devicePixelRatio
          const height = size.height / devicePixelRatio

          this.element.width = width
          this.element.height = height
        }
      })

      const surface = AtEngine.tryCreateSurface(
        size, 
        this.element
      ) 

      invariant(surface)
      this._rasterizer = AtRasterizer.create(surface, devicePixelRatio)
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

  // skia 队列
  protected queue: VoidFunction[] = []  
  public configuration: AtEngineConfiguration


  constructor (configuration: AtEngineConfiguration) {
    const assets = configuration.assets
    super(assets.baseURI, assets.rootDir)

    this.configuration = configuration
  } 

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
  ensure (): Promise<AtEngineSkia> {
    if (this.state === AtEngineLifecycleKind.Ready) {
      invariant(AtEngine.skia !== null)
      return Promise.resolve(AtEngine.skia as AtEngineSkia)
    } else if (this.state === AtEngineLifecycleKind.Initializing) {
      return new Promise((resolve) => this.queue.push(() => resolve(AtEngine.skia as AtEngineSkia)))
    } else {
      this.state = AtEngineLifecycleKind.Initializing
      return CanvasKitInit({
        locateFile: () => this.configuration.uri
      }).then((skia: CanvasKit) => {
        AtEngine.skia = skia as AtEngineSkia
        this.state = AtEngineLifecycleKind.Ready

        do {
          const callback = this.queue.shift() ?? null
          if (typeof callback === 'function') {
            Reflect.apply(callback, undefined, [])
          }
        } while (this.queue.length > 0)

        return AtEngine.skia
      })
    }
  }

  abstract prepare (): Promise<void>
}
