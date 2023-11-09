import { AtKit, AtKitConfiguration, AtRasterizerElement } from './kit'

export enum AssetsStateKind {
  Unload,
  ManifestLoaded,
  FontsLoaded,
}

//// => AtInstance
export interface AtInstanceFactory<T> {
  new (...rests: unknown[]): T
  create <T extends AtInstance> (): T
} 

export abstract class AtInstance extends AtKit {
  static create <T extends AtInstance> (...rests: unknown[]): AtInstance
  static create <T extends AtInstance> (element: AtRasterizerElement, options: AtKitConfiguration): AtInstance {
    const AtKitFactory = this as unknown as AtInstanceFactory<T>
    return new AtKitFactory(element, options) as AtInstance
  }

  // => skia
  public get skia () {
    return AtKit.skia
  }

  abstract connect (): Promise<void>

  prepare(): Promise<void> {
    return super.prepare().then(() => {
      // 
      // this.tryCreateSurface()
    })
  }
  
  start (callback: VoidFunction = (() => {})) {
    return this.ensure()
      .then(() => this.prepare())
      .then(() => callback())
  }

  stop () {
    this.dispose()
  }
}






