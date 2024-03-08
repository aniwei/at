import { isArray, isObject } from './is'

// => cloneDeep
export const clone = <T = unknown>(source: T, deep: boolean = false): T => {
  if (typeof source === 'string') {
    return source + '' as T
  } 

  if (typeof source === 'number') {
    return source - 0 as T
  }

  if (source === null) {
    return null as T
  }

  if (isArray(source as object)) {
    const result: unknown[] = []
    for (let i = 0; i < (source as unknown[]).length; i++) {
      result.push(deep 
        ? (source as unknown[])[i] 
        : clone((source as unknown[])[i])
      )
    }
    return result as T
  }

  if (isObject(source as object)) {
    const object = Object.create(null)
    for (const key of Object.keys(object)) {
      if (object.hasOwnProperty(key)) {
        object[key] = deep 
          ? clone((source as any)[key]) 
          : (source as any)[key]
      }
    }

    return object
  }

  return null as T
}