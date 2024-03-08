/**
 * 
 * @param {number} value 
 * @returns {number}
 */
export function sign (value: number) {
  if (value === 0) {
    return 0
  }

  return value < 0 ? -1 : 1
}