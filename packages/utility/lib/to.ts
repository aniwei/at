import { At } from '@at/core'
import { Offset } from '@at/geometry'

import type { MallocObj } from 'canvaskit-wasm'

const kMatrixIndexToMatrix4Index = [
  0, 4, 12, // Row 1
  1, 5, 13, // Row 2
  3, 7, 15, // Row 3
]

/**
 * @description: 
 * @param {Float64Array} matrix4
 * @return {*}
 */
export function toMatrix (matrix4: ArrayLike<number>): Float32Array {
  const matrix = new Float32Array(9)

  for (let i = 0; i < 9; i++) {
    const index = kMatrixIndexToMatrix4Index[i]

    matrix[i] = index < matrix4.length 
      ? matrix4[index]
      : matrix[i] = 0
  }

  return matrix
}

/**
 * @description: 
 * @param {Point} points
 * @return {*}
 */
export function toPoints (points: ArrayLike<Offset>): MallocObj {
  const skia = At.skia.Malloc(Float32Array, points.length * 2)
  
  const typed = skia.toTypedArray()
  
  for (let i = 0; i < points.length; i++) {
    typed[2 * i] = points[i].dx
    typed[2 * i + 1] = points[i].dy
  }

  return skia
}