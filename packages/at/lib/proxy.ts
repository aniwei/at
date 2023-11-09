import { EventEmitter, WorkPort } from '@at/basic'
import { ApiService, ApiStateKind, ApiTransport } from '@at/api'
import { AtKitConfiguration } from './index'

export interface ProxyAppConfiguration extends AtKitConfiguration {

}

export class ProxyApp extends EventEmitter<string> {
  static create (
    element: HTMLCanvasElement, 
    configuration: ProxyAppConfiguration
  ) {
    return new ProxyApp(element, configuration)
  }

  // => worker
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

  public api: ApiService = ApiService.create()
  public element: HTMLCanvasElement
  public configuration: ProxyAppConfiguration

  constructor (element: HTMLCanvasElement, configuration: ProxyAppConfiguration) {
    super()
    this.element = element
    this.configuration = configuration
  }

  private connect (): Promise<void> {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel()
      const port1 = channel.port1
      const port2 = channel.port2

      const passage = new Worker(new URL('boot.ts', import.meta.url).href, { 
        type: 'module',
        name: 'Rasterizer'
      })

      const transport = new ApiTransport()
      transport.connect(new WorkPort(port1))

      this.api.state |= ApiStateKind.Connecting
      this.api.connect(transport)

      passage.addEventListener('message', (event: MessageEvent<{ status: 'connected' }>) => {
        if (event.data.status === 'connected') {
          this.api.state |= ApiStateKind.Connected
          resolve()
        }
      })

      passage.postMessage({ 
        type: 'connection', 
        port: port2 
      }, [port2])
    })
  }

  binding () {
    return Promise.resolve()
  }

  start (callback: VoidFunction = (() => {})) {
    return this.connect()
      .then(() => this.binding())
      .then(() => callback())
  }

  dispose () {
    this.passage?.terminate()
    this.passage = null
  }
}