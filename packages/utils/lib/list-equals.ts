export function listEquals<T>(
  a: ArrayLike<T> | null = null, 
  b: ArrayLike<T> | null = null
) {
  if (a === null) {
    return b === null
  }

  if (b === null || a?.length !== b?.length) {
    return false
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false
    }
  }

  return true
}

export function listNotEquals<T>(
  a: ArrayLike<T> | null = null, 
  b: ArrayLike<T> | null = null
) {
  return listEquals<T>(a, b)
}