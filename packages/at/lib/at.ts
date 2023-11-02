import { invariant } from 'ts-invariant'
import { CanvasKit } from 'canvaskit-wasm'



export enum AtStateKind {
  Uninitialized = 1,
  Initializing = 2,
  Initialized = 4,
}


//// => At
// const at = At.init({
//   baseURL: '' 
// })
// at.start()
export class AtInstance {
  public _sk: CanvasKit | null = null
  public get sk (): CanvasKit {
    invariant(this._sk, `Not yet initialized sk.`)
    return this._sk
  }
  public set (sk: CanvasKit) {
    this._sk = sk
  }
  
  public state: AtStateKind = AtStateKind.Uninitialized

  ensure (): Promise<void> {
    if (AtStateKind.Initialized) {
      return Promise.resolve()
    } else if ()
  }
}

export class At {
  
}