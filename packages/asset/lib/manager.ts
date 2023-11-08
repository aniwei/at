import path from 'path'
import { EventEmitter } from '@at/basic'

//// => AssetManager
export interface AssetsManagerFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
  create (baseURI: string, assetsDir: string): T
}
export abstract class AssetsManager extends EventEmitter<string> {  
  static create <T extends AssetsManager> (...rests: unknown[]): AssetsManager
  static create <T extends AssetsManager> (
    baseURI: string,
    assetsDir: string
  ): AssetsManager {
    const Factory = this as unknown as AssetsManagerFactory<T>
    return new Factory(baseURI, assetsDir)
  }

  public baseURI: string
  public rootDir: string

  protected caches: Map<string, unknown> 

  constructor (...rests: unknown[])
  constructor (
    baseURI: string,
    rootDir: string
  ) {
    super()

    this.baseURI = baseURI
    this.rootDir = rootDir
    this.caches = new Map()
  }

  abstract load (asset: string): Promise<unknown> 
  /**
   * 
   * @param {string} asset 
   * @returns {string}
   */
  getAssetURI (asset: string) {
    const uri = path.resolve(this.rootDir, asset)
    const baseURI = this.baseURI.replace(/\/$/g, '')

    return baseURI + uri
  }

  toString () {
    return `AssetsManager(
      [baseURL]: ${this.baseURI}, 
      [rootDir]: ${this.rootDir}
    )`
  }
}

