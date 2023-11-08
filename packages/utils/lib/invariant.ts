import i from 'ts-invariant'

export * from 'ts-invariant'
export function invariant (
  condition: any, 
  message?: string | number
): asserts condition {
  if (typeof condition === 'function') {
    return i(!!condition(), message)
  }

  return i(condition, message)
}