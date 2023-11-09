import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import { defineReadOnly, invariant } from '@at/utils'
import { fetch } from '@at/basic'
import { Size } from '@at/geometry'
import { AssetError, AssetsManager } from '@at/asset'
import { RefsRegistry } from './refs'
import { WebGLMajorKind } from './basic'
import { Fonts } from './font'

import * as Skia from './skia'


// extend canvaskit
export interface AtEngineSkia extends CanvasKit {
  FilterQuality: typeof Skia.FilterQuality,
  Clip: typeof Skia.Clip
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

export interface AtEnvironments {
  SKIA_URI: string,
  AT_ENV: AtEnvKind
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
    defineReadOnly(skia, 'FilterQuality', Skia.FilterQuality)
    defineReadOnly(skia, 'Clip', Skia.Clip)
 
    this._skia = skia
  }

  // => refs
  // skia 对象引用管理
  static refs: RefsRegistry = RefsRegistry.create()

  /**
   * 
   * @param size 
   * @param canvas 
   */
  static tryCreateSurface (size: Size, canvas: HTMLCanvasElement) {
    try {
      return AtEngine.skia.MakeWebGLCanvasSurface(canvas)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.message}`)
    }

    const versions = [
      WebGLMajorKind.WebGL1,
      WebGLMajorKind.WebGL2
    ]

    for (const ver of versions) {
      const glContext = AtEngine.skia.GetWebGLContext(canvas, {
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
    return AtEngine.skia.MakeSWCanvasSurface(canvas)
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
  public state: AtEngineStateKind = AtEngineStateKind.Uninitialized

  // skia 队列
  protected queue: VoidFunction[] = []
  protected uri: string

  constructor (
    uri: string, 
    baseURI: string, 
    rootDir: string
  ) {
    super(baseURI, rootDir)

    this.uri = uri
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
    if (this.state === AtEngineStateKind.Initialized) {
      invariant(AtEngine.skia !== null)
      return Promise.resolve(AtEngine.skia as AtEngineSkia)
    } else if (this.state === AtEngineStateKind.Initializing) {
      return new Promise((resolve) => this.queue.push(() => resolve(AtEngine.skia as AtEngineSkia)))
    } else {
      this.state = AtEngineStateKind.Initializing
      return CanvasKitInit({
        locateFile: () => this.uri
      }).then((skia: CanvasKit) => {
        AtEngine.skia = skia as AtEngineSkia
        this.state = AtEngineStateKind.Initialized

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
