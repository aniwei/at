//// => 资源加载错误
export class AssetError extends Error {
  // uri
  public uri: string
  public status: number

  constructor (
    uri: string, 
    status: number
  ) {
    super(`Failed to load asset at "${uri}" (${status})`)

    this.uri = uri
    this.status = status
  }
}