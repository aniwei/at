import path from 'path'
import { EventEmitter } from '@at/basic'

//// => AssetManager
// 资源管理
export interface AssetsManagerFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
  create (baseURI: string, assetsDir: string): T
}
export abstract class AssetsManager extends EventEmitter<string> {  
  /**
   * 创建 AssetsManager 对象
   * @param {unknown[]} rests 
   */
  static create <T extends AssetsManager> (...rests: unknown[]): AssetsManager
  static create <T extends AssetsManager> (
    baseURI: string,
    assetsDir: string
  ): AssetsManager {
    const Factory = this as unknown as AssetsManagerFactory<T>
    return new Factory(baseURI, assetsDir)
  }

  // 资源 baseURI
  public baseURI: string
  // 资源根目录
  public rootDir: string
  // 缓存
  protected caches: Map<string, unknown> 

  constructor (...rests: unknown[])
  /**
   * 构造函数
   * @param {string} baseURI 
   * @param {string} rootDir 
   */
  constructor (
    baseURI: string,
    rootDir: string
  ) {
    super()

    this.caches = new Map()
    this.baseURI = baseURI
    this.rootDir = rootDir
  }

  /**
   * 加载资源
   * @param {string} asset 
   */

  abstract load (asset: string): Promise<unknown> 
  /**
   * 获取资源 URI
   * @param {string} asset 
   * @returns {string}
   */
  getAssetURI (asset: string) {
    const uri = path.resolve(this.rootDir, asset)
    const baseURI = this.baseURI.replace(/\/$/g, '')

    return baseURI + uri
  }

  /**
   * 处理缓存
   */
  dispose () {
    this.caches.clear()
  }

  toString () {
    return `AssetsManager(
      [baseURL]: ${this.baseURI}, 
      [rootDir]: ${this.rootDir}
    )`
  }
}

