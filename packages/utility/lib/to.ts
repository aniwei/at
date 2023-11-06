// @ts-nocheck
import { At } from '@at/core'
import { Offset } from '@at/geometry'
import { Skia } from '@at/engine'
// import { TextBox } from '@at/engine'

import type { MallocObj, RectWithDirection, TextDirection } from 'canvaskit-wasm'

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

/**
 * 半径转 sigma
 * @param radius 
 * @returns 
 */
export function toSigma (radius: number) {
  return radius > 0 ? radius * 0.57735 + 0.5 : 0
}

/**
 * 转为 TextBox
 * @param {RectWithDirection[]} rects 
 * @param {TextDirection} textDirection 
 * @returns {TextBox[]}
 */
// export function toTextBoxes (rects: RectWithDirection[], textDirection: TextDirection) {
//   const result: TextBox[] = []

//     for (let i = 0; i < rects.length; i++) {
//       const rect: Float32Array = rects[i].rect

//       result.push(TextBox.fromLTRBD(
//         rect[0],
//         rect[1],
//         rect[2],
//         rect[3],
//         textDirection,
//       ))
//     }

//     return result
// }


/**
 * @description: 
 * @param {FilterQuality} filterQuality
 * @return {*}
 */
export function toFilterQuality (filterQuality: Skia.FilterQuality) {
  if (filterQuality === At.FilterQuality.None) {
   return {
     filter: At.FilterMode.Nearest,
     mipmap: At.MipmapMode.None
   }
 } else if (filterQuality === At.FilterQuality.Low) {
   return {
     filter: At.FilterMode.Linear,
     mipmap: At.MipmapMode.None
   }
 } else if (filterQuality === At.FilterQuality.Medium) {
   return {
     filter: At.FilterMode.Linear,
     mipmap: At.MipmapMode.Linear
   }
 } else if (filterQuality === At.FilterQuality.High) {
   return {
     B: 1.0 / 3.0,
     C: 1.0 / 3.0
   }
 } 
}