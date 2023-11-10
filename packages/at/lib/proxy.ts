import { invariant, tryCatch } from '@at/utils'
import { EventEmitter } from '@at/basic'
import { Size } from '@at/geometry'
import { 
  ApiService, 
  ApiStateKind, 
  ApiTransport, 
  EngineApiLifecycleEvent 
} from '@at/api'

export interface ProxyAppConfiguration {
  size: Size,
  devicePixelRatio: number,
  assets?: {
    rootDir: string,
    baseURI: string
  },
  uri?: string
}

export class ProxyApp extends EventEmitter<string> {
  static create (
    element: HTMLCanvasElement, 
    configuration: ProxyAppConfiguration
  ) {
    return new ProxyApp(element, configuration)
  }

  /**
   * 获取环境变了
   * @param {string} key 
   * @param {string?} defaultEnv 
   * @returns 
   */
  static env (key: string, defaultEnv?: string) {
    if (Reflect.has(process.env, key)) {
      return Reflect.get(process.env, key) as string
    }

    return defaultEnv as string
  }

  // => passage
  public _passage: Worker | null = null
  public get passage () {
    return this._passage
  }
  public set passage (passage: Worker | null) {
    if (this._passage !== passage) {
      this.dispose()
      this._passage = passage
    }
  }

  // => element
  protected _element: HTMLCanvasElement | null = null
  public get element () {
    invariant(this._element)
    return this._element
  }
  public set element (element: HTMLCanvasElement | null) {
    

    if (element !== null) {
      tryCatch(() => {
        const size = this.configuration.size
        const devicePixelRatio = this.configuration.devicePixelRatio
  
        element.width = size.width * devicePixelRatio
        element.height = size.height * devicePixelRatio

        element.style.width = `${size.width}px`
        element.style.height = `${size.height}px`
        element.style.position = 'absolute'
      })
    } else {
      this._element?.removeEventListener('pointerdown', this.handlePointerEvent)
      this._element?.removeEventListener('pointermove', this.handlePointerEvent)
      this._element?.removeEventListener('pointerup', this.handlePointerEvent)
      this._element?.removeEventListener('pointercancel', this.handlePointerEvent)
    }

    this._element = element
  }

  public api: ApiService = ApiService.create()
  public configuration: ProxyAppConfiguration

  constructor (element: HTMLCanvasElement, configuration: ProxyAppConfiguration) {
    super()
    
    this.configuration = {
      ...configuration,
      uri: ProxyApp.env('SKIA_URI', '/canvaskit.wasm'),
      assets: {
        baseURI: ProxyApp.env('ASSETS_BASE_URI', '/'),
        rootDir: ProxyApp.env('ASSETS_ROOT_DIR', '/assets')
      }
    }

    this.element = element
  }

  private handlePointerEvent = (event: PointerEvent) => {
    this.api.Client.events.publish('client.pointer.event', [{
      type: event.type,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      pageX: event.pageX,
      pageY: event.pageY,
      clientX: event.clientX,
      clientY: event.clientX,
      timeStamp: event.timeStamp
    }])
  }

  private registerPointerEvents () {
    this.element?.addEventListener('pointerdown', this.handlePointerEvent)
    this.element?.addEventListener('pointermove', this.handlePointerEvent)
    this.element?.addEventListener('pointerup', this.handlePointerEvent)
    this.element?.addEventListener('pointercancel', this.handlePointerEvent)
  }

  private connect (): Promise<void> {
    return new Promise((resolve) => {
      const channel = new MessageChannel()
      const port1 = channel.port1
      const port2 = channel.port2

      const passage = new Worker(new URL('boot', import.meta.url).href, { 
        type: 'module',
        name: 'AtKitRuntime'
      })
      
      this.api.connect(ApiTransport.connect(port1))
      this.api.state |= ApiStateKind.Connecting

      passage.addEventListener('message', (event: MessageEvent<{ status: 'connected' }>) => {
        if (event.data.status === 'connected') {
          this.api.state &= ~ApiStateKind.Connecting
          this.api.state |= ApiStateKind.Connected
          resolve()
        }
      })

      const configuration = this.configuration
      
      invariant(this.element)
      const element = this.element.transferControlToOffscreen()

      passage.postMessage({ 
        type: 'connection', 
        port: port2,
        element,
        configuration,
      }, [
        port2, 
        element
      ])
    })
  }

  binding () {
    return Promise.resolve()
  }

  start (callback: VoidFunction = (() => {})) {
    return this.connect()
      .then(() => this.binding())
      .then(() => {
        return new Promise((resolve) => {
          this.api.Engine.events.on('runtime.lifecycle.change', (detail: EngineApiLifecycleEvent) => {
            switch (detail.state) {
              case 'ready':
                resolve(void 0)
                break
            }
          })
        })
      })
      .then(() => this.registerPointerEvents())
      .then(() => callback())

  }

  dispose () {
    this.passage?.terminate()
    this.passage = null
    this.element = null
  }
}