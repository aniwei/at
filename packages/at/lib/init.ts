// @ts-nocheck
import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import { invariant } from '@at/utility'
import { Skia, Fonts } from '@at/engine'
import { UnimplementedError } from '@at/basic'
import { Size } from '@at/geometry'
import { AssetError, AssetsManager } from '@at/asset'
import { RefsRegistry } from './refs'

// Manifest
export interface Font {
  family: string,
  dir: string
}

export interface Manifest {
  protocol: string,
  fonts: Font[],
  theme: {}
}

// extend CanvasKit
export interface AtCanvasKit extends CanvasKit {
  FilterQuality: Skia.FilterQuality,
  Clip: Skia.Clip
}

//// => AtInit
export enum AtStateKind {
  Uninitialized,
  Initializing,
  Initialized,
}

export enum AtEnvKind {
  Dev = 'development',
  Stage = 'stage',
  Production = 'producation'
}

export interface Environments {
  SKIA_URI: string,
  AT_ENV: AtEnvKind
}

export class AtInit extends AssetsManager<'progress'> {
  // 创建 At 全局对象
  static create () {
    return new AtInit()
  }

  // => skia
  // Skia Runtime 对象
  public _skia: AtCanvasKit | null = null
  public get skia () {
    invariant(this._skia)
    return this._skia
  }
  public set skia (skia: AtCanvasKit) {
    /// => extending skia
    // 扩展 Skia
    skia.FilterQuality = Skia.FilterQuality
    skia.Clip = Skia.Clip

    this._skia = skia
  }

  // => fonts
  // 懒创建
  protected _fonts: Fonts | null = null
  public get fonts () {
    if (this._fonts === null) {
      this._fonts = Fonts.create()
    }

    return this._fonts
  }

  // => isDev
  public get isDev () {
    return this.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Dev
  }

  // => isStage
  public get isStage () {
    return this.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Stage
  }

  // => isProduction
  public get isProduction () {
    return this.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Production
  }


  // skia 对象加载状态
  public refs: RefsRegistry = RefsRegistry.create()
  public state: AtStateKind = AtStateKind.Uninitialized

  // skia 队列
  protected queue: VoidFunction[] = []
  protected environments: Environments

  constructor () {
    const env = process.env

    invariant(env.BASE_URI)
    invariant(env.ROOT_DIR)

    super(env.BASE_URI, env.ROOT_DIR)
    this.environments = process.env as  Environments
  }

  /**
   * 加载框架资源
   * @param {string} asset 
   * @returns {Promise<Response>}
   */
  private async load (asset: string): Promise<Response> {
    const uri = this.getAssetURI(asset)

    try {
      return this.fetch(uri)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${1}`)
      throw new AssetError(uri, error.status)
    }
  }

  /// => utility
  /**
   * 获取环境变了
   * @param key 
   * @param defaultEnv 
   * @returns 
   */
  env (key: string, defaultEnv?: string) {
    if (Reflect.has(this.environments, key)) {
      return Reflect.get(this.environments, key)
    }

    return defaultEnv
  }

  /**
   * 
   * @param size 
   * @param canvas 
   */
  tryCreateSurface (size: Size, canvas: HTMLCanvasElement) {
    try {
      return this.skia.MakeWebGLCanvasSurface(canvas)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.message}`)
    }

    const versions = [
      WebGLMajorKind.WebGL1,
      WebGLMajorKind.WebGL2
    ]

    for (const ver of versions) {
      const glContext = this.skia.GetWebGLContext(canvas, {
        antialias: 1,
        majorVersion: ver
      })

      if (glContext !== 0) {
        const grContext = this.skia.MakeWebGLContext(glContext) ?? null
        if (grContext === null) {
          continue
        }

        const surface = this.skia.MakeOnScreenGLSurface(
          grContext,
          Math.ceil(size.width),
          Math.ceil(size.height),
          this.skia.ColorSpace.SRGB
        )

        return surface
      }
    }

    console.warn(`Caught ProgressEvent with target: Cannot create WebGL context.`)
    return this.skia.MakeSWCanvasSurface(canvas)
  }

  prepare () {
    return new Promise((resolve) => {
      this.load('manifest.json')
        .then(res => res.json())
        .then((manifest: Manifest) => {
          if (!manifest.fonts || manifest.fonts.length === 0) {
            manifest.fonts = []
          }

          return Promise.all(manifest.fonts.map(font => {
            return this.load(font.dir)
              .then(res => res.arrayBuffer())
              .then(data => this.fonts.register(data, font.family))
          }))
        }).then(() => resolve())
    })
  }

  /**
   * 
   * @param {string} uri 
   * @returns {CanvasKit}
   */
  ensure () {
    if (this.state === AtStateKind.Initialized) {
      invariant(this.skia !== null)
      return Promise.resolve(this.skia as CanvasKit)
    } else if (this.state === AtStateKind.Initializing) {
      return new Promise((resolve) => this.queue.push(() => resolve(this.skia as CanvasKit)))
    } else {
      this.state = AtStateKind.Initializing
      return CanvasKitInit({
        locateFile: () => this.env('SKIA_URI')
      }).then((skia: CanvasKit) => {
        this.skia = skia as AtCanvasKit
        this.state = AtStateKind.Initialized

        do {
          const callback = this.queue.shift() ?? null
          if (typeof callback === 'function') {
            Reflect.apply(callback, undefined, [])
          }
        } while (this.queue.length > 0)

      }).then(() => this.prepare())
    }
  }

  /// => basic utility
  /**
   * 
   * @param {VoidFunction} callback 
   */
  idle (callback: VoidFunction) {
    requestIdleCallback(callback)
  }

  /**
   * 
   * @param {RequestInfo} uri 
   * @param {RequestInit?} init 
   * @returns 
   */
  fetch (uri: RequestInfo, init?: RequestInit) {
    return fetch(uri, init)
  }
}