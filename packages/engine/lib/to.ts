import { Offset, Rect } from '@at/geometry'
import { Matrix4 } from '@at/math'
import { AtEngine } from './engine'
import { TransformError } from './transform-error'
import * as Skia from './skia'
// import { TextBox } from '@at/engine'

const kMatrixIndexToMatrix4Index = [
  0, 4, 12, // Row 1
  1, 5, 13, // Row 2
  3, 7, 15, // Row 3
]

/**
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
 * @param {Point} points
 * @return {*}
 */
export function toPoints (points: ArrayLike<Offset>): Skia.MallocObj {
  const skia = AtEngine.skia.Malloc(Float32Array, points.length * 2)
  
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
export function toFilterQuality (filterQuality: Skia.FilterQuality): {
  filter: Skia.FilterMode,
  mipmap: Skia.MipmapMode
} | {
  B: number,
  C: number
} {
  if (filterQuality === AtEngine.skia.FilterQuality.None) {
   return {
     filter: AtEngine.skia.FilterMode.Nearest,
     mipmap: AtEngine.skia.MipmapMode.None
   }
 } else if (filterQuality === AtEngine.skia.FilterQuality.Low) {
   return {
     filter: AtEngine.skia.FilterMode.Linear,
     mipmap: AtEngine.skia.MipmapMode.None
   }
 } else if (filterQuality === AtEngine.skia.FilterQuality.Medium) {
   return {
     filter: AtEngine.skia.FilterMode.Linear,
     mipmap: AtEngine.skia.MipmapMode.Linear
   }
 } else if (filterQuality === AtEngine.skia.FilterQuality.High) {
   return {
     B: 1.0 / 3.0,
     C: 1.0 / 3.0
   }
 } 

 throw new TransformError()
}

//// => transform
// 数据变换

const kPointData = new Float32Array(16)
const kPointMatrix = Matrix4.fromList(kPointData as unknown as number[])

/**
 * @description: 
 * @param {Matrix4} transform
 * @param {Float32Array} ltrb
 * @return {*}
 */
export function transformLTRB (transform: Matrix4, ltrb: Float32Array) {
  kPointData[0] = ltrb[0]
  kPointData[4] = ltrb[1]
  kPointData[8] = 0
  kPointData[12] = 1

  // Row 1: top-right
  kPointData[1] = ltrb[2]
  kPointData[5] = ltrb[1]
  kPointData[9] = 0
  kPointData[13] = 1

  // Row 2: bottom-left
  kPointData[2] = ltrb[0]
  kPointData[6] = ltrb[3]
  kPointData[10] = 0
  kPointData[14] = 1

  // Row 3: bottom-right
  kPointData[3] = ltrb[2]
  kPointData[7] = ltrb[3]
  kPointData[11] = 0
  kPointData[15] = 1

  kPointMatrix.multiplyTranspose(transform);

  // Handle non-homogenous matrices.
  let w = transform[15]
  if (w === 0) {
    w = 1
  }

  ltrb[0] = Math.min(Math.min(Math.min(kPointData[0], kPointData[1]), kPointData[2]), kPointData[3]) / w
  ltrb[1] = Math.min(Math.min(Math.min(kPointData[4], kPointData[5]), kPointData[6]), kPointData[7]) / w
  ltrb[2] = Math.max(Math.max(Math.max(kPointData[0], kPointData[1]), kPointData[2]), kPointData[3]) / w
  ltrb[3] = Math.max(Math.max(Math.max(kPointData[4], kPointData[5]), kPointData[6]), kPointData[7]) / w
}


const kRectData = new Float32Array(4)
/**
 * @param {Matrix4} transform
 * @param {Rect} rect
 * @return {Rect}
 */
export function transformRect (transform: Matrix4, rect: Rect) {
  kRectData[0] = rect.left
  kRectData[1] = rect.top
  kRectData[2] = rect.right
  kRectData[3] = rect.bottom
  transformLTRB(transform, kRectData)
  return Rect.fromLTRB(
    kRectData[0],
    kRectData[1],
    kRectData[2],
    kRectData[3],
  )
}
