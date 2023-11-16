import { fetch } from '@at/basic'
import { ApiStateKind, ApiTransport } from '@at/api'
import { AtEngineConfiguration } from '@at/engine'
import { Image } from '@at/layout'
import { AtInstance } from './at'

import * as Engine from '@at/engine'
import { Offset } from '@at/geometry'


//// => ConnectionPayload
interface ConnectionPayload {
  type: string,
  port: MessagePort,
  element: OffscreenCanvas,
  configuration: AtEngineConfiguration
}

//// => AtBoot
export class App extends AtInstance {
  static ready (readyHandle: (instance: App) => void) {
    const app = App.create()
    app.start(() => readyHandle(app))
    return app
  }

  connect (): Promise<void> {
    return new Promise((resolve) => {
      self.addEventListener('message', async (event: MessageEvent<ConnectionPayload>) => {
        const payload = event.data
      
        if (payload.type === 'connection') {
          const { element, configuration } = payload

          this.element = element
          this.baseURI = configuration.assets.baseURI
          this.rootDir = configuration.assets.rootDir
          
          this.configuration = configuration
          
          this.api.connect(ApiTransport.connect(payload.port)) 
          this.api.state &= ~ApiStateKind.Connecting
          this.api.state |= ApiStateKind.Connected

          self.postMessage({ status: 'connected' })
          resolve()
        }
      })
    })
  }

  bindings (): Promise<void> {
    const api = this.api
    
    /// => api 绑定
    // 窗口大小变化
    api.Client.events.on('client.viewport.resize', () => {
      
    })

    // 点击事件
    api.Client.events.on('client.pointer.event', () => {
      
    })

    return Promise.resolve()
  }

  start(callback?: VoidFunction): Promise<void> {
    return this.connect()
      .then(() => super.start(callback))
  }
}

App.ready((instance) => {
  fetch('/assets/medal.png')
    .then(res => res.arrayBuffer())
    .then(data => {
      const image = Image.create({
        width: 400,
        height: 400,
        image: Engine.Image.create(App.skia.MakeImageFromEncoded(data))
      })  
      
      instance.view.append(image)
      instance.flush()
    })
 

})
