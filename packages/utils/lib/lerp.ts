/**
 * 插值
 * @param {number} a 
 * @param {number} b 
 * @param {number} t 
 * @returns {number} 
 */
export function lerp (a: number, b: number, t: number) {
  return a * (1.0 - t) + b * t
}