import { invariant } from '@at/utils'
import { ApiService } from '@at/api'
import { nextTick, raf } from '@at/basic'
import { Offset } from '@at/geometry'
import { Gesture, HitTestResult } from '@at/gesture'
import { 
  BoxHitTestResult, 
  PipelineOwner, 
  View, 
  ViewConfiguration 
} from '@at/ui'
import { 
  EngineLifecycleKind,
  EngineConfiguration,
  EngineEnvironments,
  Engine,
} from '@at/engine'
import { AtManifest } from './manifest'

// 运行时环境
export enum AtKitEnvKind {
  Dev = 'development',
  Stage = 'stage',
  Production = 'producation'
}

export interface AtKitEnvironments extends EngineEnvironments {
  ATKIT_ENV: AtKitEnvKind,
  ATKIT_WIDTH: number,
  ATKIT_HEIGHT: number,
  DEVICE_PIXEL_RATIO: number
}

//// => AtKit
export interface AtKitFactory<T> {
  new (configuration?: EngineConfiguration): T
  create (configuration?: EngineConfiguration): T
}
export abstract class AtKit extends Gesture {
  // 创建 At 全局对象
  static create <T extends AtKit> (...rests: unknown[]): AtKit
  static create <T extends AtKit> (configuration?: EngineConfiguration): AtKit {
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
  public set state (state: EngineLifecycleKind) {
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
      this._view = View.create(this, ViewConfiguration.create({
        width: this.configuration.width,
        height: this.configuration.height,
        devicePixelRatio: this.configuration.devicePixelRatio
      }))
      this.pipeline.root = this._view
      this._view.prepareInitial()
    }
    return this._view
  }

  // => pipeline
  protected _pipeline: PipelineOwner | null = null
  public get pipeline (): PipelineOwner {
    if (this._pipeline === null) {
      this._pipeline = PipelineOwner.create(this, this.rasterizer, () => {
        if (this.raf !== null) {
          raf.cancel(this.raf)
        }
        
        this.raf = raf.request(() => {
          this.api.Engine.events.publish('pipeline.flush.start', [])
          this.flush()
          this.api.Engine.events.publish('pipeline.flush.end', [])
        })

      }, this.view.configuration)
    }
    return this._pipeline
  }  
  

  public api: ApiService = ApiService.create()
  public environments: AtKitEnvironments

  protected raf: number | null = null

  constructor (configuration?: EngineConfiguration) {
    super({
      width: configuration?.width ?? 800,
      height: configuration?.height ?? 800,
      devicePixelRatio: configuration?.devicePixelRatio ?? 1.0,
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
    }]).then(() => {
      return Promise.all(fonts.map(font => {
        return this.load(font.dir)
          .then(res => res.arrayBuffer())
          .then(data => Engine.fonts.register(data, font.family))
      })).then(() => Engine.fonts.ensure())
    }).then(() => this.api.Engine.events.publish('resource.fonts.loader.change', [{
      state: 'loaded'
    }]))
  }

  hitTest (result: HitTestResult, position: Offset) {
    this.view.hitTest(result as BoxHitTestResult, position)
    super.hitTest(result, position)
  }

  // 绑定
  bindings (): Promise<void> {
    return Promise.resolve().then(() => {
      const api = this.api

      /// => api 绑定
      // 窗口大小变化
      api.Client.events.on('client.viewport.resize', () => {
        
      })
      // 点击事件
      api.Client.events.on('client.pointer.event', (event) => this.sanitizePointerEvent(event))
    })
  }

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
    .then(() => this.state = EngineLifecycleKind.Ready)
    .then(() => Engine.skia)
  }

  flush () {
    invariant(this.pipeline, `The "AtKit.pipeline" cannot be null.`)
    invariant(this.view, `The "AtKit.view" cannot be null.`)
    
    this.api.Engine.events.publish('pipeline.layout.start', [])
    this.pipeline.flushLayout()
    this.api.Engine.events.publish('pipeline.layout.end', [])
    this.pipeline.flushCompositingBits()
    this.api.Engine.events.publish('pipeline.paint.start', [])
    this.pipeline.flushPaint()
    this.api.Engine.events.publish('pipeline.paint.end', [])
    this.api.Engine.events.publish('view.composite.start', [])
    this.view.composite()
    this.api.Engine.events.publish('view.composite.end', [])
  }

  dispose () {
    this.rasterizer.dispose()
    this.state = EngineLifecycleKind.Destory
  }
}



export enum AssetsStateKind {
  Unload,
  ManifestLoaded,
  FontsLoaded,
}

//// => AtInstance
export interface AtInstanceFactory<T> {
  new (...rests: unknown[]): T
  create <T extends AtInstance> (configuration?: EngineConfiguration): T
} 
export abstract class AtInstance extends AtKit {
  static create <T extends AtInstance> (...rests: unknown[]): AtInstance
  static create <T extends AtInstance> (configuration?: EngineConfiguration): AtInstance {
    const AtKitFactory = this as unknown as AtInstanceFactory<T>
    return new AtKitFactory(configuration) as AtInstance
  }

  // => skia
  public get skia () {
    return AtKit.skia
  }

  abstract connect (): Promise<void>

  prepare(): Promise<void> {
    return super.prepare().then(() => {
      // 
      // this.tryCreateSurface()
    })
  }
  
  start (callback: VoidFunction = (() => {})) {
    return this.ensure()
      .then(() => callback())
  }

  stop () {
    this.dispose()
  }
}
