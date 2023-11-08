import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import { defineReadOnly, invariant } from '@at/utility'
import { Skia, Fonts } from '@at/engine'
import { Size } from '@at/geometry'
import { AssetError, AssetsManager } from '@at/asset'
import { RefsRegistry } from './refs'
import { WebGLMajorKind } from './basic'

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

// extend canvaskit
export interface AtEngineKit extends CanvasKit {
  FilterQuality: Skia.FilterQuality,
  Clip: Skia.Clip
}

//// => AtInit
export enum AtEngineStateKind {
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

export class AtEngine extends AssetsManager<'progress'> {
  // => engine
  // Skia Runtime 对象
  public _engine: AtEngineKit | null = null
  public get engine () {
    invariant(this._engine)
    return this._engine
  }
  public set engine (engine: AtEngineKit) {
    /// => extending skia
    // 扩展 Skia
    defineReadOnly(engine, 'FilterQuality', Skia.FilterQuality)
    defineReadOnly(engine, 'Clip', Skia.Clip)
 
    this._engine = engine
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

  // skia 对象加载状态
  public refs: RefsRegistry = RefsRegistry.create()
  public state: AtEngineStateKind = AtEngineStateKind.Uninitialized

  // skia 队列
  protected queue: VoidFunction[] = []
  protected environments: Environments

  constructor () {
    const env = process.env

    invariant(env.BASE_URI)
    invariant(env.ROOT_DIR)

    super(env.BASE_URI, env.ROOT_DIR)
    this.environments = process.env as unknown as Environments
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
      return this.engine.MakeWebGLCanvasSurface(canvas)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.message}`)
    }

    const versions = [
      WebGLMajorKind.WebGL1,
      WebGLMajorKind.WebGL2
    ]

    for (const ver of versions) {
      const glContext = this.engine.GetWebGLContext(canvas, {
        antialias: 1,
        majorVersion: ver
      })

      if (glContext !== 0) {
        const grContext = this.engine.MakeWebGLContext(glContext) ?? null
        if (grContext === null) {
          continue
        }

        const surface = this.engine.MakeOnScreenGLSurface(
          grContext,
          Math.ceil(size.width),
          Math.ceil(size.height),
          this.engine.ColorSpace.SRGB
        )

        return surface
      }
    }

    console.warn(`Caught ProgressEvent with target: Cannot create WebGL context.`)
    return this.engine.MakeSWCanvasSurface(canvas)
  }

  prepare (): Promise<void> {
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
    if (this.state === AtEngineStateKind.Initialized) {
      invariant(this.engine !== null)
      return Promise.resolve(this.engine as CanvasKit)
    } else if (this.state === AtEngineStateKind.Initializing) {
      return new Promise((resolve) => this.queue.push(() => resolve(this.engine as CanvasKit)))
    } else {
      this.state = AtEngineStateKind.Initializing
      return CanvasKitInit({
        locateFile: () => this.env('SKIA_URI')
      }).then((skia: CanvasKit) => {
        this.engine = skia as AtEngineKit
        this.state = AtEngineStateKind.Initialized

        do {
          const callback = this.queue.shift() ?? null
          if (typeof callback === 'function') {
            Reflect.apply(callback, undefined, [])
          }
        } while (this.queue.length > 0)

      }).then(() => this.prepare())
    }
  }

}

export const At = AtEngine.create()