import { AtKit } from './kit'

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
  // => skia
  public get skia () {
    return AtKit.skia
  }

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






