import { ApiStateKind, ApiTransport } from '@at/api'
import { AtEngineConfiguration, Paragraph, ParagraphBuilder, ParagraphStyle, Skia, Surface } from '@at/engine'
import { Offset, Size } from '@at/geometry'
import { Color } from '@at/basic'
import { 
  BoxBorder, 
  BorderStyle, 
  BoxDecoration, 
  DecorationImage, 
  ImageConfiguration, 
  NetworkImage, 
} from '@at/painting'
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
  
  const style = ParagraphStyle.create()
  const paragraph = Paragraph.create({
    paragraph: null,
    style,
    commands: []
  })

  canvas.drawParagraph(paragraph, Offset.create(10, 10))

  surface.skia.flush()
})