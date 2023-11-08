import { invariant } from './invariant'

// => paddingLeft
export const paddingLeft = (value: number | string, length: number, symbol: string = '0') => {
  const string = String(value)
  invariant(length > 0)
  return Array(length - string.length).fill(symbol).join('') + value
}
