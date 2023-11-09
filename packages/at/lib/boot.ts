import { WorkPort } from '@at/basic'
import { AtInstance } from './at'
import { ApiStateKind, ApiTransport } from '@at/api'

//// => ConnectionPayload
interface ConnectionPayload {
  type: string,
  port: MessagePort
}

//// => App
export class App extends AtInstance {
  connect (): Promise<void> {
    return new Promise((resolve) => {
      self.addEventListener('message', async (event: MessageEvent<ConnectionPayload>) => {
        const payload = event.data
      
        if (payload.type === 'connection') {
          const transport = new ApiTransport()
          transport.connect(new WorkPort(payload.port))
          
          this.api.connect(transport)
          this.api.state |= ApiStateKind.Connected

          self.postMessage({ status: 'connected' })
          resolve()
        }
      })
    })
  }

  bindings (): Promise<void> {
    return Promise.resolve()
  }

  start(callback?: VoidFunction): Promise<void> {
    return this.connect()
      .then(() => super.start(callback))
  }
}



const app = App.create()
app.start(() => {
  
})