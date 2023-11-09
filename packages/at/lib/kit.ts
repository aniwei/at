import { invariant } from '@at/utils'
import { Size } from '@at/geometry'
import { AtEngine, Rasterizer, Skia } from '@at/engine'
import { tryCatch } from '@at/utils'
import { ApiService } from '@at/api'

// Manifest
export interface Font {
  family: string,
  dir: string
}

export interface AtManifest {
  protocol: string,
  fonts: Font[],
  theme: {}
}


export enum AtEnvKind {
  Dev = 'development',
  Stage = 'stage',
  Production = 'producation'
}

export interface Environments {
  SKIA_URI: string,
  AT_ENV: AtEnvKind,
  BASE_URI: string,
  ROOT_DIR: string
}

///// => AtRasterizer
// 光栅器
export interface AtRasterizerElement {
  width: number,
  height: number,
  style?: CSSStyleDeclaration | null
}

export interface AtRasterizerOptions {
  size: Size,
  devicePixelRatio: number
}

export class AtRasterizer extends Rasterizer {
  static create (
    surface: Skia.Surface,
    devicePixelRatio: number
  ) {
    return super.create(surface, devicePixelRatio) as AtRasterizer
  }
}

export interface AtKitConfiguration extends AtRasterizerOptions {
  
}

export interface AtKitFactory<T> {
  new (element: AtRasterizerElement, configuration: AtKitConfiguration): T
  create (element: AtRasterizerElement, configuration: AtKitConfiguration): T
}
export abstract class AtKit extends AtEngine {
  // 创建 At 全局对象
  static create <T extends AtKit> (...rests: unknown[]): AtKit
  static create <T extends AtKit> (element: AtRasterizerElement, options: AtKitConfiguration): AtKit {
    const AtKitFactory = this as unknown as AtKitFactory<T>
    return new AtKitFactory(element, options) as AtKit
  }

  /**
   * 获取环境变了
   * @param {string} key 
   * @param {string?} defaultEnv 
   * @returns 
   */
  static env (key: string, defaultEnv?: string) {
    if (Reflect.has(process.env, key)) {
      return Reflect.get(process.env, key)
    }

    return defaultEnv
  }

  // => isDev
  public get isDev () {
    return AtKit.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Dev
  }

  // => isStage
  public get isStage () {
    return AtKit.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Stage
  }

  // => isProduction
  public get isProduction () {
    return AtKit.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Production
  }

  // => rasterizer
  public _rasterizer: AtRasterizer | null = null
  public get rasterizer () {
    if (this._rasterizer === null) {
      const size = this.configuration.size
      const devicePixelRatio = this.configuration.devicePixelRatio

      tryCatch(() => {
        if (this.element.style) {
          const width = size.width / devicePixelRatio
          const height = size.height / devicePixelRatio
    
          this.element.style.position = 'absolute'
          this.element.style.width = `${width}px`
          this.element.style.height = `${height}px`
        }
      })

      const surface = AtKit.tryCreateSurface(
        size, 
        this.element as unknown as HTMLCanvasElement
      ) 

      invariant(surface)
      this._rasterizer = AtRasterizer.create(surface, devicePixelRatio)
    }

    return this._rasterizer
  }

  protected element: AtRasterizerElement
  protected environments: Environments
  protected configuration: AtKitConfiguration

  public api: ApiService = ApiService.create()

  constructor (
    element: AtRasterizerElement, 
    configuration: AtKitConfiguration
  ) {
    const env = process.env

    invariant(env.BASE_URI)
    invariant(env.ROOT_DIR)
    invariant(env.SKIA_URI)

    super(env.SKIA_URI, env.BASE_URI, env.ROOT_DIR)

    this.element = element
    this.configuration = configuration
    this.environments = process.env as unknown as  Environments
  }

  
  protected preload (manifest: AtManifest) {
    if (!manifest.fonts || manifest.fonts.length === 0) {
      manifest.fonts = []
    }

    const { fonts } = manifest

    this.api.Engine.events.publish('Resource.Fonts.Loader.Update', [{
      state: 'Loading'
    }])
    .then(() => {
      return Promise.all(fonts.map(font => {
        return this.load(font.dir)
          .then(res => res.arrayBuffer())
          .then(data => this.fonts.register(data, font.family))
      }))
    })
    .then(() => this.api.Engine.events.publish('Resource.Fonts.Loader.Update', [{
      state: 'Loaded'
    }]))
  }

  // 绑定
  abstract bindings (): Promise<void>

  /// => utility
  // 启动前准备：
  // 1、初始化 CanvasKit 
  // 2、加载默认字体
  // 3、创建渲染流水线
  // 4、监听事件
  prepare (): Promise<void> {
    return new Promise((resolve) => {
      this.load('manifest.json')
        .then(res => res.json())
        .then((manifest: AtManifest) => this.preload(manifest))
        .then(() => resolve())
    })
  }

  ensure () {
    return this.api.Engine.events.publish('Runtime.Lifecycle.Update', [{
      state: 'Loading'
    }])
    .then(() => this.bindings())
    .then(() => this.api.Engine.events.publish('Resource.CanvasKit.Loader.Update', [{
        state: 'Loading'
      }])
      .then(() => super.ensure())
      .then(() => this.api.Engine.events.publish('Resource.CanvasKit.Loader.Update', [{
        state: 'Loaded'
      }]))
    )
    .then(() => this.prepare())
    .then(() => this.api.Engine.events.publish('Runtime.Lifecycle.Update', [{
      state: 'Ready'
    }]))
    .then(() => AtEngine.skia)
  }

  dispose () {
    this.rasterizer.dispose()
    this.api.Engine.events.publish('Runtime.Lifecycle.Update', [{
      state: 'Destroy'
    }])
  }
}