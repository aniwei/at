import { AssetError, AssetsManager } from '@at/asset'
import { CanvasKit } from 'canvaskit-wasm'
import { AtInit } from './init'

export const At = AtInit.create()

export enum AssetsStateKind {
  Unload,
  ManifestLoaded,
  FontsLoaded,
}

//// => Manifest
export class AssetsManifest<T extends string> extends AssetsManager<'progress' | T> {
  public state: AssetsStateKind = AssetsStateKind.Unload

  async load (asset: string): Promise<Response> {
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

  prepare (): Promise<void> {
    return new Promise((resolve) => {
      this.load('manifest.json')
        .then(res => res.json())
        .then((res) => {
        }).then(() => resolve())
    })
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






