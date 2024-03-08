import { invariant, tryCatch } from '@at/utils'
import { EventEmitter, MessagePort } from '@at/basic'
import { MouseCursorSession } from '@at/mouse'
import { 
  ApiService, 
  ApiStateKind, 
  ApiTransport, 
  EngineApiLifecycleEvent 
} from '@at/api'

import pkg from '../package.json'


export interface ProxyAppConfiguration {
  width: number,
  height: number,
  devicePixelRatio: number,
  documentURI: string,
  rootDir?: string,
  baseURI?: string,
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
        const width = this.configuration.width
        const height = this.configuration.height
        const devicePixelRatio = this.configuration.devicePixelRatio
  
        element.width = width * devicePixelRatio
        element.height = height * devicePixelRatio

        element.style.width = `${width}px`
        element.style.height = `${height}px`
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

  // => width
  public get width () {
    return this.configuration.width
  }
  public set width (width: number) {
    if (this.width !== width) {
      this.configuration.width = width
      tryCatch(() => {
        invariant(this.element)
        this.element.width = width * this.devicePixelRatio
        this.element.style.width = `${width}px`
      })
    }
  }

  // => height
  public get height () {
    return this.configuration.height
  }
  public set height (height: number) {
    if (this.height !== height) {
      this.configuration.height = height
      tryCatch(() => {
        invariant(this.element)
        this.element.height = height * this.devicePixelRatio
        this.element.style.height = `${height}px`
      })
    }
  }

  // => devicePixelRatio
  public get devicePixelRatio () {
    return this.configuration.devicePixelRatio
  }
  public set devicePixelRatio (devicePixelRatio: number) {
    if (this.devicePixelRatio !== devicePixelRatio) {
      this.configuration.devicePixelRatio = devicePixelRatio
    }
  }

  public api: ApiService = ApiService.create()
  public configuration: ProxyAppConfiguration

  constructor (element: HTMLCanvasElement, configuration: ProxyAppConfiguration) {
    super()
    
    this.configuration = {
      ...configuration,
      uri: ProxyApp.env('SKIA_URI', '/canvaskit.wasm'),
      rootDir: ProxyApp.env('ROOT_DIR', '/assets'),
      baseURI: ProxyApp.env('BASE_URI', '/'),
    }

    this.element = element
  }

  protected handlePointerEvent = (event: PointerEvent) => {    
    this.api.client.events.publish('pointer.event', [{
      button: event.button,
      buttons: event.buttons,
      // 键位
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      // 触发 id
      pointerId: event.pointerId,
      // 触发设备类型 
      pointerType: event.pointerType, 
      timeStamp: event.timeStamp,
      // 事件
      type: event.type,
      // 物理坐标
      x: event.clientX,
      y: event.clientY,
    }])
  }

  protected registerPointerEvents () {
    this.element?.addEventListener('pointerdown', this.handlePointerEvent)
    this.element?.addEventListener('pointermove', this.handlePointerEvent)
    this.element?.addEventListener('pointerup', this.handlePointerEvent)
    this.element?.addEventListener('pointercancel', this.handlePointerEvent)
  }

  protected connect (uri: string): Promise<void> {
    return new Promise((resolve) => {
      const channel = new MessageChannel()
      const port1 = channel.port1
      const port2 = channel.port2

      const passage = new Worker(uri, { 
        type: 'module',
        name: `AtKit (v.${pkg.version})`
      })
      
      this.api.connect(ApiTransport.connect(port1 as MessagePort))
      this.api.state |= ApiStateKind.Connecting

      passage.addEventListener('message', (event: MessageEvent<{ status: 'started' }>) => {
        if (event.data.status === 'started') {
          this.api.state &= ~ApiStateKind.Connecting
          this.api.state |= ApiStateKind.Connected
          resolve()
        }
      })

      const configuration = this.configuration
      
      invariant(this.element, 'The "ProxyApp.element" cannot ben null.')
      const element = this.element.transferControlToOffscreen()

      passage.postMessage({ 
        type: 'start', 
        port: port2,
        element,
        configuration,
      }, [
        port2, 
        element
      ])
    })
  }

  protected onWindowResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const devicePixelRatio = window.devicePixelRatio

    this.api.client.events.publish('viewport.resize', [
      {
        width,
        height,
        devicePixelRatio,
      }
    ])

    this.devicePixelRatio = devicePixelRatio
    this.width = width
    this.height = height
  }

  binding () {
    window.addEventListener('resize', this.onWindowResize)

    this.api.engine.events.on('system.cursor.change', (session: MouseCursorSession) => {
      invariant(this.element, 'The "ProxyApp.element" cannot be null.')
      this.element.style.cursor = session.cursor.kind
    })

    return Promise.resolve()
  }

  start (uri: string, callback: VoidFunction = (() => {})) {
    return this.connect(uri)
      .then(() => this.binding())
      .then(() => {
        return new Promise((resolve) => {
          this.api.engine.events.on('runtime.lifecycle.change', (detail: EngineApiLifecycleEvent) => {
            switch (detail.state) {
              case 'running':
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
    window.removeEventListener('resize', this.onWindowResize)

    this.element?.removeEventListener('pointerdown', this.handlePointerEvent)
    this.element?.removeEventListener('pointermove', this.handlePointerEvent)
    this.element?.removeEventListener('pointerup', this.handlePointerEvent)
    this.element?.removeEventListener('pointercancel', this.handlePointerEvent)

    this.passage?.terminate()
    this.passage = null
    this.element = null
  }
}