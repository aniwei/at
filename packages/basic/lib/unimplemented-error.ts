//// => UnimplementedError
export class UnimplementedError extends Error {
  public method?: string
  constructor (message?: string, method?: string) {
    super(message)

    this.method = method
  }
}