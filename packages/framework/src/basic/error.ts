// => 相关错误定义
/**
 * 未实现错误
 */
export class UnimplementedError extends Error {
  public method?: string
  constructor (message?: string, method?: string) {
    super(message)

    this.method = method
  }
}

/**
 * 参数错误
 */
export class ArgumentError extends Error {
  public argument?: string
  constructor (message?: string, argument?: string) {
    super(message)

    this.argument = argument
  }
}

/**
 * 未支持错误
 */
export class UnsupportedError extends Error {}