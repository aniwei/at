import { AssetError, AssetsManager } from '@at/asset'
import { CanvasKit } from 'canvaskit-wasm'
import { At } from './init'

//// => Manifest
export class AssetsManifest<T extends string> extends AssetsManager<T> {
  async load (asset: string): Promise<unknown> {
    const uri = this.getAssetURI(asset)

    try {
      return At.fetch(uri)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${1}`)
      throw new AssetError(uri, error.status)
    }
  }

  start (...rests: unknown[]) {
    return this.prepare()
  }

  prepare () {
    return this.load('manifest.json')
  }
}

//// => AtInstance
export interface AtInstanceFactory<T> {
  new (...rests: unknown[]): T
  create <T extends AtInstance<E>, E extends string> (): T
} 

export abstract class AtInstance<T extends string> extends AssetsManifest<T> {
  // => skia
  public get skia (): CanvasKit {
    return At.skia
  }

  start (callback: VoidFunction = (() => {})) {
    return Promise.all([
      At.ensure(At.env('SKIA_URI')),
      super.start()
    ]).then(() => callback())
  }
}






