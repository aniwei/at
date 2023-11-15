import { invariant } from '@at/utils'
import { ApiService } from '@at/api'
import { nextTick } from '@at/basic'
import { PipelineOwner, View, ViewConfiguration } from '@at/layout'
import { AtManifest } from './manifest'
import { 
  AtEngine, 
  AtEngineLifecycleKind,
  AtEngineConfiguration,
  AtEngineEnvironments,
} from '@at/engine'
import { Size } from '@at/geometry'


// 运行时环境
export enum AtKitEnvKind {
  Dev = 'development',
  Stage = 'stage',
  Production = 'producation'
}

export interface AtKitEnvironments extends AtEngineEnvironments {
  ATKIT_ENV: AtKitEnvKind,
}


export interface AtKitFactory<T> {
  new (configuration?: AtEngineConfiguration): T
  create (configuration?: AtEngineConfiguration): T
}
export abstract class AtKit extends AtEngine {
  // 创建 At 全局对象
  static create <T extends AtKit> (...rests: unknown[]): AtKit
  static create <T extends AtKit> (configuration?: AtEngineConfiguration): AtKit {
    const AtKitFactory = this as unknown as AtKitFactory<T>
    return new AtKitFactory(configuration) as AtKit
  }

  // => isDev
  public get isDev () {
    return AtKit.env<AtKitEnvKind>(
      'ATKIT_ENV', 
      AtKitEnvKind.Production
    ) === AtKitEnvKind.Dev
  }

  // => isStage
  public get isStage () {
    return AtKit.env<AtKitEnvKind>(
      'ATKIT_ENV', 
      AtKitEnvKind.Stage
    ) === AtKitEnvKind.Stage
  }

  // => isProduction
  public get isProduction () {
    return AtKit.env<AtKitEnvKind>(
      'ATKIT_ENV', 
      AtKitEnvKind.Production
    ) === AtKitEnvKind.Production
  }

  // => state
  public get state () {
    return super.state
  }
  public set state (state: AtEngineLifecycleKind) {
    if (super.state !== state) {
      nextTick(() => this.api.Engine.events.publish('runtime.lifecycle.change',[{
        state: state
      }]))
      
      super.state = state
    }
  }

  // => view
  public _view: View | null = null
  public get view () {
    if (this._view === null) {
      this._view = View.create(ViewConfiguration.create())
    }
    return this._view
  }

  // => pipeline
  protected _pipeline: PipelineOwner | null = null
  public get pipeline (): PipelineOwner {
    if (this._pipeline === null) {
      this._pipeline = PipelineOwner.create(
        this.rasterizer,
        () => {

        },
        this.configuration
      )
    }
    return this._pipeline
  }  
  
  public api: ApiService = ApiService.create()
  public environments: AtKitEnvironments

  constructor (configuration?: AtEngineConfiguration) {
    const env = process.env

    invariant(env.ASSETS_BASE_URI)
    invariant(env.ASSETS_ROOT_DIR)
    invariant(env.SKIA_URI)

    super({
      size: configuration?.size ?? Size.create(300, 300),
      devicePixelRatio: configuration?.devicePixelRatio ?? 2.0,
      uri: AtKit.env('SKIA_URI', '/canvaskit.wasm'),
      assets: {
        baseURI: AtKit.env('ATKIT_ASSETS_BASE_URI', '/'),
        rootDir: AtKit.env('ATKIT_ASSETS_ROOT_DIR', '/assets')
      }
    })


    this.environments = process.env as unknown as  AtKitEnvironments
  }

  
  protected preload (manifest: AtManifest) {
    if (!manifest.fonts || manifest.fonts.length === 0) {
      manifest.fonts = []
    }

    const { fonts } = manifest

    return this.api.Engine.events.publish('resource.fonts.loader.change', [{
      state: 'loading'
    }])
    .then(() => {
      return Promise.all(fonts.map(font => {
        return this.load(font.dir)
          .then(res => res.arrayBuffer())
          .then(data => AtEngine.fonts.register(data, font.family))
      })).then(() => AtEngine.fonts.ensure())
    })
    .then(() => this.api.Engine.events.publish('resource.fonts.loader.change', [{
      state: 'loaded'
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
    return this.bindings()
      .then(() => {
      this.api.Engine.events.publish('resource.canvaskit.loader.change', [{
        state: 'loading'
      }])

      return super.ensure().then(() => {
        this.api.Engine.events.publish('resource.canvaskit.loader.change', [{
          state: 'loaded'
        }])
      })
    })
    .then(() => this.prepare())
    .then(() => this.state = AtEngineLifecycleKind.Ready)
    .then(() => AtEngine.skia)
  }

  dispose () {
    this.rasterizer.dispose()
    this.state = AtEngineLifecycleKind.Destory
  }
}