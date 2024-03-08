
import { ApiStateKind, ApiTransport } from '@at/api'
import { MessagePort } from '@at/basic'
import { AtInstance, AtKitConfiguration } from './kit'

//// => ConnectionPayload
interface ConnectionPayload {
  type: string,
  port: MessagePort,
  element: OffscreenCanvas,
  configuration: AtKitConfiguration
}

//// => AtBoot
export class AtBoot extends AtInstance {
  connect (): Promise<void> {
    return new Promise((resolve) => {
      self.addEventListener('message', async (event: MessageEvent<ConnectionPayload>) => {
        const payload = event.data
      
        if (payload.type === 'start') {
          const { element, configuration } = payload

          this.configuration.uri = configuration.uri
          this.configuration.width = configuration.width
          this.configuration.height = configuration.height
          this.configuration.devicePixelRatio = configuration.devicePixelRatio
          this.configuration.baseURI = configuration.baseURI
          this.configuration.rootDir = configuration.rootDir
          this.configuration.documentURI = configuration.documentURI

          this.element = element
          this.baseURI = configuration.baseURI
          this.rootDir = configuration.rootDir
          
          this.api.connect(ApiTransport.connect(payload.port as MessagePort)) 
          this.api.state &= ~ApiStateKind.Connecting
          this.api.state |= ApiStateKind.Connected

          self.postMessage({ status: 'started' })
          resolve()
        }
      })
    })
  }

  bindings (): Promise<void> {
    return super.bindings()
  }

  start(callback?: VoidFunction): Promise<void> {
    return this.connect()
      .then(() => super.start(callback))
  }
  
  stop (): void {
    this.api.engine.events.removeAllListeners()
    this.api.client.events.removeAllListeners()
  }
}
