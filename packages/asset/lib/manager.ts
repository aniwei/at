import path from 'path'
import { EventEmitter } from '@at/basic'

//// => AssetManager
export abstract class AssetsManager<T extends string> extends EventEmitter<T> {  
  static create (
    baseURI: string,
    assetsDir: string
  ) {
    
  }

  public baseURI: string
  public rootDir: string

  protected caches: Map<string, unknown> 

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
   return this.baseURI + path.resolve(this.rootDir, asset)
  }

  toString () {
    return `AssetsManager(
      [baseURL]: ${this.baseURI}, 
      [rootDir]: ${this.rootDir}
    )`
  }
}

