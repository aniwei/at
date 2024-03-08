export type TryCatchHandle<T> = () => T

const onError = (error: any) => console.warn(`Catching a error while running, the error detail "%o"`, error)

/**
 * 执行
 * @param {TryCatchHandle<T>} handle
 * @returns {T | void} 
 */
export const tryCatch = <T> (handle: TryCatchHandle<T>, context?: unknown): T | void => {
  try {
    const result = Reflect.apply(handle, context, [])
    if (result instanceof Promise) {
      return result.catch(onError) as T
    }

    return result
  } catch (error: any) {
    onError(error)
  }
}