import { invariant } from './invariant'

/**
 * 
 * @param {number | null} a 
 * @param {number | null} b 
 * @param {number} epsilon 
 * @returns {boolean}
 */
export function nearEqual (
  a: number | null = null, 
  b: number | null = null, 
  epsilon: number
): boolean {
  invariant(epsilon >= 0.0)
  if (a === null || b === null) {
    return a === b
  }
  return (
    (a > (b - epsilon)) && 
    (a < (b + epsilon)) || 
    a === b
  )
}

/**
 * 
 * @param {number} a 
 * @param {number} epsilon 
 * @returns {boolean}
 */
export function nearZero (a: number, epsilon: number): boolean {
  return nearEqual(a, 0.0, epsilon)
}