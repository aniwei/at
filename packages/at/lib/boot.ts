import { ApiStateKind, ApiTransport } from '@at/api'
import { AtEngineConfiguration, Skia, Surface } from '@at/engine'
import { Color } from '@at/basic'
import { Size, Offset } from '@at/geometry'
import { TextSpan, TextPaintingStyle, TextPainter } from '@at/painting'
import { AtInstance } from './at'


//// => ConnectionPayload
interface ConnectionPayload {
  type: string,
  port: MessagePort,
  element: OffscreenCanvas,
  configuration: AtEngineConfiguration
}

//// => App
export class App extends AtInstance {
  connect (): Promise<void> {
    return new Promise((resolve) => {
      self.addEventListener('message', async (event: MessageEvent<ConnectionPayload>) => {
        const payload = event.data
      
        if (payload.type === 'connection') {
          this.element = payload.element
          this.configuration = payload.configuration
          
          const transport = ApiTransport.connect(payload.port)
          this.api.connect(transport) 
          this.api.state &= ~ApiStateKind.Connecting
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

  const size = Size.create(400, 400)
  const surface = Surface.create(App.tryCreateSurface(size, app.element) as Skia.Surface)

  const canvas = surface.canvas

  const span = TextSpan.create({
    text: 'Welcome to Beijing.',
    style: TextPaintingStyle.create({
      fontFamily: 'Roboto',
      color: Color.BLACK,
      fontSize: 50,
      letterSpacing: 10,
    })
  })

  const painter = TextPainter.create({
    text: span
  })

  painter.layout()
  painter.paint(canvas, Offset.create(40, 40))
  
  surface.skia.flush()
})