import { fetch } from '@at/basic'
import { ApiStateKind, ApiTransport } from '@at/api'
import { AtEngineConfiguration } from '@at/engine'
import { Offset } from '@at/geometry'
import { Alignment, InlineSpan, TextPaintingStyle, TextSpan } from '@at/painting'
import { Image, Stack, ParagraphDelegate, Paragraph } from '@at/layout'
import { AtInstance } from './at'
import * as Engine from '@at/engine'

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
    const app = App.create() as App
    app.start(() => readyHandle(app))
    return app
  }

  private handlePointerEvents = (event: PointerEvent) => {
    // this.handlePointerDataPacket(packet)
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
          text: '相亲，竟不可接近',
          style: TextPaintingStyle.create({
            fontFamily: 'SourceHanSansSC-VF',
            fontSize: 40
          })
        })
      })

      const paragraph = Paragraph.create({
        width: 200,
        delegate,
      })

      const image = Image.create({
        left: 100,
        width: 100,
        height: 100,
        image: Engine.Image.create(App.skia.MakeImageFromEncoded(data))
      })  

      const stack = Stack.create({ 
        alignment: Alignment.TOP_CENTER,
      }, [image, paragraph])
      
      
      instance.view.append(stack)
      // stack.append(image)

      instance.flush()
    })
 

})
