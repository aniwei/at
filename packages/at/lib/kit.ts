import { invariant } from '@at/utils'
import { ApiService } from '@at/api'
import { nextTick } from '@at/basic'
import { Offset, Size } from '@at/geometry'
import { Document } from '@at/document'
import { MouseCursorSession, MouseTracker } from '@at/mouse'
import { 
  Gesture, 
  HitTestResult, 
  PointerChangeKind, 
  SanitizedPointerEvent 
} from '@at/gesture'
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
import { Manifest } from './manifest'

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

export interface AtKitConfiguration extends EngineConfiguration {
  documentURI: string
}

//// => AtKit
export interface AtKitFactory<T> {
  new (configuration?: AtKitConfiguration): T
  create (configuration?: AtKitConfiguration): T
}
export abstract class AtKit extends Engine {
  // 创建 At 全局对象
  static create <T extends AtKit> (...rests: unknown[]): AtKit
  static create <T extends AtKit> (configuration?: AtKitConfiguration): AtKit {
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
  // 运行时状态
  public get state () {
    return super.state
  }
  public set state (state: EngineLifecycleKind) {
    if (super.state !== state) {
      nextTick(() => this.api.engine.events.publish('runtime.lifecycle.change',[{ state }]))
      super.state = state
    }
  }

  // => view
  // 根节点
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
  // 渲染管线
  protected _pipeline: PipelineOwner | null = null
  public get pipeline (): PipelineOwner {
    if (this._pipeline === null) {
      this._pipeline = PipelineOwner.create(
        this, 
        this.rasterizer, 
        () => this.schedule(), 
        this.view.configuration
      )

      this.on('performpersistent', () => this.flush())
    }
    return this._pipeline
  }  

  // => mouseTracker
  // 鼠标追踪
  protected _mouseTracker: MouseTracker | null = null
  public get mouseTracker () {
    if (this._mouseTracker === null) {
      this._mouseTracker = MouseTracker.create((position: Offset) => {
        const result = HitTestResult.create()
        this.view.hitTest(result as BoxHitTestResult, position)
        return result
      })

      // 监听鼠标光标变化
      this._mouseTracker.subscribe((session: MouseCursorSession) => {
        this.api.engine.events.publish('system.cursor.change', [session])
      })
    }

    return this._mouseTracker
  }

  // => gesture
  protected _gesture: Gesture | null = null
  public get gesture () {
    if (this._gesture === null) {
      this._gesture = Gesture.create(this as Engine, this.configuration)
    }

    return this._gesture
  }

  // => document
  protected _document: Document | null = null
  public get document () {
    if (this._document === null) {
      this._document = Document.create()
    }

    return this._document as Document
  }

  // => configuration
  public get configuration () {
    return super.configuration as AtKitConfiguration
  }
  public set configuration (configuration : AtKitConfiguration) {
    super.configuration = configuration
  }
  
  // api 
  public api: ApiService = ApiService.create()
  // 环境变量
  public environments: AtKitEnvironments

  /**
   * 构造
   * @param {EngineConfiguration?} configuration 
   */
  constructor (configuration?: AtKitConfiguration) {
    super({
      width: configuration?.width ?? 800,
      height: configuration?.height ?? 800,
      devicePixelRatio: configuration?.devicePixelRatio ?? 1.0,
      uri: AtKit.env('SKIA_URI', '/canvaskit.wasm'),
      baseURI: AtKit.env('ATKIT_ASSETS_BASE_URI', '/'),
      rootDir: AtKit.env('ATKIT_ASSETS_ROOT_DIR', '/assets')
    })

    this.environments = process.env as unknown as  AtKitEnvironments

    this
      .on('performtransient', (t: number) => this.api.engine.events.publish('schedule.phase.change', [t, this]))
      .on('performpersistent', (t: number) => this.api.engine.events.publish('schedule.phase.change', [t, this]))

    this.registerPersistent(() => this.flush())
  }

  
  /**
   * 预加载
   * @param {AtManifest} manifest 
   * @returns {void}
   */
  protected preload (manifest: Manifest) {
    if (!manifest.fonts || manifest.fonts.length === 0) {
      manifest.fonts = []
    }

    const { fonts } = manifest
    return this.api.engine.events.publish('resource.fonts.loader.change', [{
      state: 'loading'
    }]).then(() => {
      return Promise.all(fonts.map(font => {
        return this.load(font.dir)
          .then(res => res.arrayBuffer())
          .then(data => Engine.fonts.register(data, font.family))
      })).then(() => Engine.fonts.ensure())
    }).then(() => this.api.engine.events.publish('resource.fonts.loader.change', [{
      state: 'loaded'
    }]))
  }

  /**
   * 碰撞测试
   * @param {HitTestResult} result 
   * @param {Offset} position 
   */
  hitTest (result: HitTestResult, position: Offset) {
    this.view.hitTest(result as BoxHitTestResult, position)
    this.gesture.hitTest(result, position)
  }

  /**
   * 绑定 API
   * @returns 
   */
  bindings (): Promise<void> {
    return Promise.resolve().then(() => {
      const api = this.api

      /// => api 绑定
      // 窗口大小变化
      api.client.events.on('viewport.resize', (options: {
        width: number,
        height: number,
        devicePixelRatio: number
      }) => {
        const configuration = this.view.configuration.copyWith(Size.create(options.width, options.height), options.devicePixelRatio)
        this.configuration.width = options.width
        this.configuration.height = options.height
        this.configuration.devicePixelRatio = options.devicePixelRatio

        this.view.configuration = configuration
      })

      // 点击事件
      api.client.events.on('pointer.event', (event) => this.gesture.sanitizePointerEvent(event))
      
      // 监听文档加载指令
      api.document.commands.subscribe('load', (uri: string) => {
        api.engine.events.publish('document.state.change', ['loading'])
        
        this.document
          .load(uri)
          .then(loader => {
            loader
              .on('error', (error) => api.document.events.publish('error', [error]))
              .on('progress', (progress) => api.document.events.publish('progress', [progress]))
              .once('end', (sab) => api.document.events.publish('end', [sab]))
              .once('end', () => api.engine.events.publish('document.state.change', ['loaded']))
          })
      })
    })

  }

  /// => utility
  // 启动前准备：
  // 1、初始化 CanvasKit 
  // 2、加载默认字体
  // 3、创建渲染流水线
  // 4、监听事件
  prepare (): Promise<void> {
    return Promise.all([
      // 启动文档进程
      this.api.engine.events.publish('document.state.change', ['ready']),
      // 加载资源
      this.load('manifest.json')
        .then(res => res.json())
        .then((manifest: Manifest) => this.preload(manifest))
    ]).then(() => void 0)
  }

  /**
   * 加载
   * @returns 
   */
  ensure () {
    return this.bindings()
      .then(() => {
      this.api.engine.events.publish('resource.canvaskit.loader.change', [{
        state: 'loading'
      }])

      return super.ensure().then(() => {
        this.api.engine.events.publish('resource.canvaskit.loader.change', [{
          state: 'loaded'
        }])
      })
    })
    .then(() => this.prepare())
    .then(() => this.state = EngineLifecycleKind.Running)
    .then(() => Engine.skia)
  }

  /**
   * 渲染流程
   */
  flush () {
    invariant(this.pipeline, `The "AtKit.pipeline" cannot be null.`)
    invariant(this.view, `The "AtKit.view" cannot be null.`)

    this.api.engine.events.publish('pipeline.phase.change', ['layoutstart', Date.now()])
    this.pipeline.flushLayout()
    this.api.engine.events.publish('pipeline.phase.change', ['layoutend', Date.now()])
    this.api.engine.events.publish('pipeline.phase.change', ['compositestart', Date.now()])
    this.pipeline.flushCompositingBits()
    this.api.engine.events.publish('pipeline.phase.change', ['compositeend', Date.now()])
    this.api.engine.events.publish('pipeline.phase.change', ['paintstart', Date.now()])
    this.pipeline.flushPaint()
    this.api.engine.events.publish('pipeline.phase.change', ['paintend', Date.now()])
    
    this.api.engine.events.publish('view.composite.start', [Date.now()])
    this.view.composite()
    this.api.engine.events.publish('view.composite.end', [Date.now()])
  }

  /**
   * 事件分发
   * @param {SanitizedPointerEvent} event 
   * @param {HitTestResult | null} hitTestResult 
   */
  dispatchEvent (event: SanitizedPointerEvent, hitTestResult: HitTestResult | null): void {
    this.mouseTracker.updateWithEvent(
      event, 
      hitTestResult === null || event.change === PointerChangeKind.Move
        ? this.view.hitTestMouse(event.position)
        : hitTestResult,
    )

    this.gesture.dispatchEvent(event, hitTestResult)
  }

  /**
   * 回收
   */
  dispose () {
    this.api.engine.events.removeAllListeners()
    this.api.client.events.removeAllListeners()

    this.removeAllListeners()

    this.rasterizer.dispose()
    this.mouseTracker.dispose()

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

  /**
   * 准备工作
   * @returns 
   */
  prepare(): Promise<void> {
    return super.prepare().then(() => {
      // 
      // this.tryCreateSurface()
    })
  }
  
  /**
   * 启动
   * @param {VoidFunction} callback 
   * @returns 
   */
  start (callback: VoidFunction = (() => {})) {
    return this.ensure()
      .then(() => callback())
  }

  /**
   * 停止
   */
  stop () {
    this.dispose()
  }
}
