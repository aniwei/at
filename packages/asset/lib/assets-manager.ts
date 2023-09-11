//// => AssetManager
export class AssetsManager {  
  static create (
    baseURL: string,
    assetsDir: string
  ) {
    return new AssetsManager(
      options.baseURL,
      options.assetsDir
    )
  }

  public baseURL: string
  public assetsDir: string

  protected caches: Map<string, unknown> 

  constructor (
    baseURL: string,
    assetsDir: string
  ) {
    this.baseURL = baseURL
    this.assetsDir = assetsDir
    this.caches = new Map()
  }

  /**
   * 
   * @param asset 
   * @returns 
   */
  getAssetURL (asset: string) {
   return this.baseURL + `${this.assetsDir}/${asset}`
  }

  async load (asset: string) {
    const url = this.getAssetURL(asset)
    try {
      return At.fetch(url)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${1}`)
      throw new AssetManagerError(url, error.status)
    }
  }

  toString () {
    return `AssetsManager([baseURL]: ${this.baseURL}, [assetsDir]:${this.assetsDir})`
  }
}

