//// => ArgumentError
// 参数错误
export class ArgumentError extends Error {
  public argument?: string
  constructor (message?: string, argument?: string) {
    super(message)

    this.argument = argument
  }
}