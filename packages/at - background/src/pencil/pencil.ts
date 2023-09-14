import invariant from 'ts-invariant'
import { App, AppConfiguration, InitialCallback, Size, WorkerApp } from '@at/framework'
import { AtInspector } from './inspector'
import { AtDocument } from './element/document'
import { DocumentProtocol } from './protocol'
import { FSM } from './basic/fsm'

export type AtPencilConfiguationOptions = {
  size: Size,
  devicePixelRatio: number
  baseURL: string,
  assetsDir: string,
} 

export type AtPencilConfiguationJSON = {
  size: number[],
  devicePixelRatio: number,
  baseURL: string,
  assetsDir: string,
}

export abstract class AtPencilConfiguation extends AppConfiguration {}


export class AtPencil<T extends AtPencilConfiguation> extends App<AtDocument, T> {
  static create <T extends AtPencilConfiguation> (canvas: HTMLCanvasElement, configuration: T) {
    return new AtPencil(
      canvas,
      configuration
    )
  }

  // => 
  public get document () {
    invariant(this.view !== null)
    return this.view
  }
  public set document (value: AtDocument) {
    if (this._view === null || this._view === value)  {
      this._view?.detach()
      this.view = value

      this.start()
    }
  }

  private _protocol: DocumentProtocol | null = null
  public get protocol () {
    invariant(this._protocol !== null)
    return this._protocol
  }
  public set protocol (value: DocumentProtocol) {
    this._protocol = value
  }

  registerProtocol () {
    invariant(this.manifest !== null)
    return this.assets.load(this.manifest.protocol)
      .then(res => res.json())
      .then(protocol => {
        this.protocol = protocol
      })
  }

  prepareInitial (initials: InitialCallback[] = [
    () => this.registerFonts(),
    () => this.registerProtocol()
  ]) {
    return super.prepareInitial(initials)
  }
}

export type AtWorkerPencilOptions<T> = {
  file: string,
  configuration: T
} 


export class AtWorkerPencil extends WorkerApp<AtDocument, AtPencilConfiguation> {
  static create (options: AtWorkerPencilOptions<AtPencilConfiguation>) {
    return new AtWorkerPencil(
      options.file,
      options.configuration
    )
  }

  // => inspector
  private _inspector: AtInspector | null = null 
  public get inspector (): AtInspector {
    invariant(this._inspector !== null)
    return this._inspector
  }
  public set inspector (value: AtInspector) {
    this._inspector = value
  }

  private _fsm: FSM | null = null 
  public get fsm (): FSM {
    invariant(this._fsm !== null)
    return this._fsm
  }
  public set fsm (value: FSM) {
    this._fsm = value
  }

  public configuration: AtPencilConfiguation

  constructor (
    file: string, 
    configuration: AtPencilConfiguation,
  ) {
    const devicePixelRatio = configuration.devicePixelRatio ?? 2.0
    const size = configuration.size
    const canvas = document.createElement('canvas')
    canvas.width = size.width * devicePixelRatio
    canvas.height = size.height * devicePixelRatio

    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`

    super(
      file,
      canvas,
      configuration
    )

    this.configuration = configuration
    this.inspector = AtInspector.create()
  }

  register (worker: Worker, port: MessagePort): void {
    const canvas = this.canvas.transferControlToOffscreen()
    const configuration = this.configuration
    const size = configuration.size
    invariant(!!size)

    worker.postMessage({
      configuration: configuration.toJSON(),
      port,
      canvas
    }, [port, canvas])
  }

  resize () {
    // this.app.resize()
  }

  dispose () {
  
  }

  async start () {
    return super.start(() => {
      document.body.appendChild(this.canvas)
    })
  } 
}