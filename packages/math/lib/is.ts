import { invariant } from '@at/utils'

/**
 * @description: 判断是否有效矩阵
 * @param {Float32Array} matrix4
 * @return {*}
 */
export function matrix4IsValid (matrix4: number[]) {
  invariant(matrix4.length === 16, 'Matrix4 must have 16 entries.')
  
  return true
}