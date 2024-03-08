/**
 * 
 * @param {number} value 
 * @param {number} lower 
 * @param {number} upper 
 * @returns {number}
 */
export function clamp (
  value: number, 
  lower: number, 
  upper: number
) {
  value = +value
  lower = +lower
  upper = +upper
  lower = lower === lower ? lower : 0
  upper = upper === upper ? upper : 0

  if (value === value) {
    value = value <= upper ? value : upper
    value = value >= lower ? value : lower
  }
  
  return value
}