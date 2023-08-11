import { At } from '../at'

export type AtAssetManagerOptions = {
  baseURL?: string,
  assetsDir?: string,
}

export class AtAssetManager {  
  static create (options: AtAssetManagerOptions) {
    return new AtAssetManager(
      options.baseURL,
      options.assetsDir
    )
  }

  public baseURL: string
  public assetsDir: string
  private caches: Map<string, unknown> 

  constructor (
    baseURL: string = At.globalSettings.baseURL,
    assetsDir: string = At.globalSettings.assetsDir
  ) {
    this.baseURL = baseURL
    this.assetsDir = assetsDir
    this.caches = new Map()
  }

  getAssetURL (asset: string) {
   return this.baseURL + `${this.assetsDir}/${asset}`
  }

  async load (asset: string) {
    const url = this.getAssetURL(asset)
    try {
      return At.fetch(url)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${1}`)
      throw new AtAssetManagerError(url, error.status)
    }
  }
}

export class AtAssetManagerError extends Error {
  public url: string
  public status: number

  constructor (
    url: string, 
    status: number
  ) {
    super(`Failed to load asset at "${url}" (${status})`)

    this.url = url
    this.status = status
  }
}