export class AssetError extends Error {
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