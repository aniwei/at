import { fetch } from '@at/basic'
import { invariant } from '@at/utils'
import { ApiStateKind, ApiTransport } from '@at/api'
import { EngineConfiguration } from '@at/engine'
import { Alignment, TextPaintingStyle, TextSpan } from '@at/painting'
import { Image, Stack, ParagraphDelegate, Paragraph, Dragger } from '@at/ui'
import { AtInstance } from './kit'
import * as Engine from '@at/engine'


//// => ConnectionPayload
interface ConnectionPayload {
  type: string,
  port: MessagePort,
  element: OffscreenCanvas,
  configuration: EngineConfiguration
}

//// => AtBoot
export class App extends AtInstance {
  static ready (ready: (instance: App) => void) {
    const app = App.create() as App
    app.start(() => ready(app))
    return app
  }

  connect (): Promise<void> {
    return new Promise((resolve) => {
      self.addEventListener('message', async (event: MessageEvent<ConnectionPayload>) => {
        const payload = event.data
      
        if (payload.type === 'connection') {
          const { element, configuration } = payload

          this.configuration.uri = configuration.uri
          this.configuration.width = configuration.width
          this.configuration.height = configuration.height
          this.configuration.devicePixelRatio = configuration.devicePixelRatio
          this.configuration.assets.baseURI = configuration.assets.baseURI
          this.configuration.assets.rootDir = configuration.assets.rootDir

          this.element = element
          this.baseURI = configuration.assets.baseURI
          this.rootDir = configuration.assets.rootDir
          
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
    return super.bindings()
  }

  start(callback?: VoidFunction): Promise<void> {
    return this.connect()
      .then(() => super.start(callback))
  }
  
  stop (): void {
    this.api.Engine.events.removeAllListeners()
    this.api.Client.events.removeAllListeners()
  }
}

App.ready((instance) => {
  fetch('/assets/medal.png')
    .then(res => res.arrayBuffer())
    .then(data => {
      const delegate = ParagraphDelegate.create({
        text: TextSpan.create({
          text: '相亲，竟不可接近相亲，竟不可接近相亲，竟不可接近',
          style: TextPaintingStyle.create({
            fontFamily: 'SourceHanSansSC-VF',
            fontSize: 30
          })
        })
      })

      const paragraph = Paragraph.create({
        left : 0,
        width: 400,
        delegate,
      })

      const dragger = Dragger.create(paragraph)
      dragger.onDragUpdate = (detail) => {
        invariant(detail && detail.delta)
        // invariant(paragraph.left !== null && paragraph.top !== null)
        paragraph.left = paragraph.left + detail.delta.dx
        paragraph.top = paragraph.top + detail.delta.dy
      }

      const draggers = [dragger]

      const image = Image.create({
        left: 10 ,
        top: 10,
        width: 50,
        height: 50,
        image: Engine.Image.create(App.skia.MakeImageFromEncoded(data))
      })  

      const dragger1 = Dragger.create(image)
      dragger1.onDragUpdate = (detail) => {
        invariant(detail && detail.delta)
        invariant(image.left !== null && image.top !== null)
        image.left = image.left + detail.delta.dx
        image.top = image.top + detail.delta.dy
      }


      const stack = Stack.create({ 
        alignment: Alignment.TOP_CENTER,
      }, [...draggers, dragger1])    

      instance.view.append(stack)
      instance.flush()
    })
 

})
