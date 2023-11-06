import { AssetError, AssetsManager } from '@at/asset'
import { CanvasKit } from 'canvaskit-wasm'
import { AtInit } from './init'

export const At = AtInit.create()

export enum AssetsStateKind {
  Unload,
  ManifestLoaded,
  FontsLoaded,
}

//// => AtInstance
export interface AtInstanceFactory<T> {
  new (...rests: unknown[]): T
  create <T extends AtInstance<E>, E extends string> (): T
} 

export abstract class AtInstance<T extends string> extends AssetsManager<T> {
  // => skia
  public get skia (): CanvasKit {
    return At.skia
  }

  async load (asset: string): Promise<Response> {
    const uri = this.getAssetURI(asset)

    try {
      return At.fetch(uri)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${1}`)
      throw new AssetError(uri, error.status)
    }
  }

  prepare (): Promise<void> {
    return new Promise((resolve) => {
      resolve()
    })
  }

  start (callback: VoidFunction = (() => {})) {
    return At.ensure()
      .then(() => this.prepare())
      .then(() => callback())
  }
}






