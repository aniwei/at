import invariant from '@at/utils'
import { At, Surface } from './framework'
import { Offset, Size } from '../basic/geometry'
import { AtPipelineOwner } from '../layout/pipeline-owner'
import { AtRasterizer } from '../engine/rasterizer'
import { AtSurface } from '../engine/surface'
import { AtAssetManager } from '../basic/asset-manager'
import { toMessagePointerEvent } from '../basic/helper'
import { AtGesture } from '../gestures/gesture'
import { AtHitTestResult } from '../gestures/hit-test'
import { AtBoxHitTestResult } from '../layout/box'
import { AtView, AtViewConfiguration } from '../layout/view'
import { WorkerMessagePort, WorkerTransport } from '../basic/worker-transport'
import { MessageOwner, MessageTransportCommands } from '../basic/message-transport'
// import { MouseTracker } from './mouse'

export abstract class AppConfiguration extends AtViewConfiguration {
  public baseURL: string
  public assetsDir: string

  constructor (
    size: Size,
    devicePixelRatio: number = 2.0,
    baseURL: string,
    assetsDir: string
  ) {
    super(size, devicePixelRatio)

    this.baseURL = baseURL
    this.assetsDir = assetsDir
  }

  equal (other: AppConfiguration | null) {
    return (
      other instanceof AppConfiguration &&
      other.baseURL === this.baseURL &&
      other.assetsDir === other.assetsDir &&
      super.equal(other) 
    )
  }

  toJSON () {
    return {
      ...super.toJSON(),
      baseURL: this.baseURL,
      assetsDir: this.assetsDir
    }
  }
}

export class Rasterizer extends AtRasterizer {
  static create (canvas: HTMLCanvasElement, configuration: AppConfiguration) {
    const size = configuration.size
    const devicePixelRatio = configuration.devicePixelRatio
    let surface: Surface | null = null
      
    if (canvas.style) {
      const width = size.width / devicePixelRatio
      const height = size.height / devicePixelRatio

      canvas.style.position = 'absolute'
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
      
    try {
      surface = AtSurface.tryCreate(size, canvas)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.stack}`)
    } finally {
      surface ??= AtSurface.tryCreateSofewareSurface(canvas)
    }

    return new Rasterizer(
      surface,
      devicePixelRatio ?? At.globalSettings.devicePixelRatio
    )
  }
}

export enum PointerEvents {
  PointerEvents = 'pointerevents',
  PointerDown = 'pointerdown',
  PointerMove = 'pointermove',
  PointerUp = 'pointerup',
  PointerCancel = 'pointercancel'
}

export enum AppMessageTypes {
  PointerEvent = 'pointerevent',
  AppLifecycle = 'applifecycle',
  AppMouseCursorChanged = 'appmousecursorchanged'
}

export enum AppLifecycle {
  Started = 'appstarted'
}

export enum AppProgress {
  WarmUp = 1,
  Slient = 2,
  Layout = 4,
  Paint = 8,
  Composit = 16
}

export type AppMessagePayload<T> = {
  type: AppMessageTypes
  data: T
}

export type AppOptions<T extends AppConfiguration> = {
  canvas: HTMLCanvasElement,
  configuration: T
}

export type AppManifestFont = {
  family: string,
  asset: string
}

export type AppManifestImage = {
  name: string,
  asset: string
}

export type AppManifest = {
  fonts: AppManifestFont[]
  images: AppManifestImage[],
  protocol: string
}

export type AppStartCallback = () => void


export abstract class App<
  V extends AtView = AtView,
  T extends AppConfiguration = AppConfiguration> extends AtGesture {

  // => cursor
  private _cursor: string = 'default'
  public get cursor () {
    return this._cursor
  }
  public set cursor (cursor: string) {
    if (this._cursor !== cursor) {
      this._cursor = cursor

      if (this.canvas?.style) {
        this.canvas.style.cursor = cursor
      }

      this.publish('cursor', cursor)
    }
  }

  // => view
  protected _view: V | null = null
  public get view () {
    return this._view
  }
  public set view (view: V | null) {
    if (this._view !== view) {
      this._view = view
      invariant(this.pipeline !== null)
      invariant(this._view !== null)
      this.pipeline.root = view
      this._view.prepareInitial()
    }
  }

  // => pipeline
  private _pipeline: AtPipelineOwner | null = null
  public get pipeline (): AtPipelineOwner {
    invariant(this._pipeline !== null, )
    return this._pipeline
  }
  public set pipeline (pipeline: AtPipelineOwner | null) {
    this._pipeline = pipeline
  }

  // => manifest
  private _manifest: AppManifest | null = null
  public get manifest () {
    invariant(this._manifest !== null)
    return this._manifest
  }
  public set manifest (value: AppManifest) {
    this._manifest = value
  }
  
  private canvas: HTMLCanvasElement

  // public mouse: MouseTracker 
  public assets: AtAssetManager
  public rasterizer: Rasterizer | null
  public configuration: T

  
  private progress: AppProgress = AppProgress.WarmUp

  constructor (
    canvas: HTMLCanvasElement,
    configuration: T
  ) {
    super(configuration.devicePixelRatio)

    this.assets = AtAssetManager.create({
      baseURL: configuration.baseURL,
      assetsDir: configuration.assetsDir
    })
    
    this.canvas = canvas
    this.configuration = configuration
    // TODO
    // this.mouse = MouseTracker.create()

    this.rasterizer = Rasterizer.create(canvas, configuration)
    this.pipeline = AtPipelineOwner.create(this.rasterizer, () => {
      At.schedule()
    }, this.configuration)
  }

  activeElementMouseCursorStyle (kind: string) {
    
  }

  activateSystemCursor (cursor: string) {
    this.cursor = cursor
  }

  prepareInitial (initials: InitialCallback[] = [
    () => this.registerFonts()
  ]) {
    return this.assets.load('manifest.json')
      .then(res => res.json())
      .then((manifest: AppManifest) => {
        this.manifest = manifest
        return Promise.all(initials.map(initial => initial()))
      })
  }

  registerFonts (): Promise<unknown> {
    invariant(this.manifest !== null)
    const fonts = this.manifest.fonts

    return Promise.all(fonts.map(font => {
      return this.assets.load(font.asset)
        .then(res => res.arrayBuffer())
        .then(data => {
          const fonts = At.fonts
          fonts.register(data, font.family)
          fonts.unloaded.push(fonts.register(data, font.family))

          return fonts.ensure()
        })
    }))
  }

  handlePointerEvents = (event: PointerEvent) => {
    const packet = this.decomposite(event)
    this.handlePointerDataPacket(packet)
  }

  hitTest (result: AtHitTestResult, position: Offset): void {
    this.view?.hitTest(result as AtBoxHitTestResult, position)
    super.hitTest(result, position)
  }

  flush = () => {
    invariant(this.pipeline, `The "this.pipeline" cannot be null.`)
    
    if (
      this.view &&
      this.progress & AppProgress.Slient || 
      this.progress & AppProgress.WarmUp
      ) {
      this.progress = AppProgress.Layout
      this.pipeline.flushLayout()
      this.pipeline.flushCompositingBits()


      this.progress = AppProgress.Paint

      if (this.pipeline.flushPaint()) {
        this.progress = AppProgress.Composit
        this.view?.composite()
      }

      
      this.progress = AppProgress.Slient      
    }
  }

  stop () {
    this.dispose()
    this.unsubscribe()

    this.pipeline = null

    At.off('flush', this.flush)
    At.off('pointerevents', this.handlePointerEvents)
  }

  start (callback?: AppStartCallback): Promise<void> {
    At.on('flush', this.flush)
    At.on('pointerevents', this.handlePointerEvents)
    
    return new Promise((resolve, reject) => {
      this.prepareInitial().then(() => {
        At.emit(AppLifecycle.Started, this)
              
        if (typeof callback === 'function') {
          callback()
        }

        resolve()
      }).catch(reject)
    })
  }

  dispose () {
    invariant(this.view, `The "this.view" cannot be null.`)
    invariant(this.rasterizer, `The "this.rasterizer" cannot be null.`)

    this.view?.dispose()
    this.rasterizer?.dispose()

    this.view = null
    this.rasterizer = null
  }
}

export enum WorkerAppState {
  Uninitialized,
  Initialized
}

export type InitialCallback = () => Promise<unknown>

export type WorkerAppOptions<T extends AppConfiguration> = {
  uri: string, 
} & AppOptions<T>

export type CreateApplication<
  V extends AtView,
  T extends AppConfiguration, 
  U extends App<V, T>, 
  J extends unknown
> = (canvas: HTMLCanvasElement, options: J) => U

export type WaitAppStartedCallback<
  V extends AtView,
  T extends AppConfiguration, 
  U extends App<V, T>
> = (app: U, transport: WorkerTransport) => void

export abstract class WorkerApp<
  V extends AtView,
  T extends AppConfiguration
> extends WorkerTransport {
  static async wait<
    V extends AtView,
    T extends AppConfiguration, 
    U extends App<V, T>,
    J extends unknown
  > (
    createApplicationHook: CreateApplication<V, T, U, J>, 
    callback?: WaitAppStartedCallback<V, T, U>
  ): Promise<U> {
    return new Promise((resolve, reject) => {
      self.addEventListener('message', (event: MessageEvent) => {
        At.ensure(() => {
          const { port, canvas, configuration } = event.data
          const transport = new WorkerTransport()
          transport.connect(new WorkerMessagePort(port))
          transport.command(MessageTransportCommands.Message, (messager: MessageOwner) => {
            const payload = messager.payload as AppMessagePayload<any>
  
            switch (payload.type) {
              case AppMessageTypes.PointerEvent: {
                At.emit(payload.data.name, payload.data.event)
                break
              }
            }
          })
    
          const app = createApplicationHook(canvas, configuration)
  
          app.subscribe(() => {
            transport.send({
              command: MessageTransportCommands.Message,
              payload: {
                type: AppMessageTypes.AppMouseCursorChanged,
                data: {
                  cursor: app.cursor
                }
              }
            })
          })
  
          app.start(() => {
            transport.send({
              command: MessageTransportCommands.Message,
              payload: {
                type: AppMessageTypes.AppLifecycle,
                data: {
                  name: AppLifecycle.Started,
                  parameters: []
                }
              }
            }).then(() => {
              resolve(app)
              if (typeof callback === 'function') {
                callback(app, transport)
              }
            })
          })
        })
      })
    })
  }

  abstract register (worker: Worker, port: MessagePort): void

  public uri: string
  public canvas: HTMLCanvasElement
  public worker: Worker | null = null
  public configuration: T

  constructor (
    uri: string, 
    canvas: HTMLCanvasElement,
    configuration: T,
  ) {
    super()
    this.uri = uri
    this.canvas = canvas
    this.configuration = configuration
  }

  protected registerCommands (): void {
    this.command(MessageTransportCommands.Connect, (messager: MessageOwner) => {
      // At.emit('connected')
    })

    this.command(MessageTransportCommands.Message, (messager: MessageOwner) => {
      const payload = messager.payload as AppMessagePayload<any>

      switch (payload.type) {
        case AppMessageTypes.AppLifecycle: {
          At.emit(payload.data.name, ...payload.data.parameters)
          break
        }

        case AppMessageTypes.AppMouseCursorChanged: {
          At.emit(payload.type, payload.data.cursor)
          break
        }
      }
    })
    
    super.registerCommands()
  }


  handlePointerEvents = (event: PointerEvent) => {
    if (event.target === this.canvas) {
      this.send({
        command: MessageTransportCommands.Message,
        payload: {
          type: AppMessageTypes.PointerEvent,
          data: {
            name: PointerEvents.PointerEvents,
            event: toMessagePointerEvent(event)
          }
        }
      })
    }
  }

  handleMouseCursorChanged = (cursor: string) => {
    this.canvas.style.cursor = cursor
  }

  resize (size: Size) {
    // if (this.settings.size?.notEqual(size)) {
    //   this.settings.size = size
    //   this.send({
    //     command: MessageTransportCommands.Message,
    //     payload: {
    //       type: AppMessageTypes.PointerEvent,
    //       data: {
    //         size: size
    //       }
    //     }
    //   })
    // }
  }

  stop () {
    this.close()
    this.worker?.terminate()

    At.off('pointerevents', this.handlePointerEvents)
    At.off('appmousecursorchanged', this.handleMouseCursorChanged)
  }

  start (callback?: AppStartCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel()
      const port1 = channel.port1
      const port2 = channel.port2
  
      super.connect(new WorkerMessagePort(port2))
  
      const worker = new Worker(this.uri, { type: 'module' })
      worker.addEventListener('error', (error) => reject(error))
  
      this.worker = worker
      this.register(worker, port1)
  
      At.on('pointerevents', this.handlePointerEvents)
      At.on('appmousecursorchanged', this.handleMouseCursorChanged)
      At.once('appstarted', () => {
        if (typeof callback === 'function') {
          callback()
        }

        resolve()
      })
    })
  }
}