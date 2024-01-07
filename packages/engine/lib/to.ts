import { Offset, Rect } from '@at/geometry'
import { Matrix4 } from '@at/math'
import { Color } from '@at/basic'
import { Engine } from './engine'
import { TransformError } from './transform-error'
import { TextPosition } from './text-position'
import { StrutStyle } from './struct-style'
import { TextHeightBehavior } from './text-height-behavior'
import { TextLeadingDistributionKind } from './text-style'
import * as Skia from './skia'
// import { TextBox } from '@at/engine'
// 矩阵索引对照
const kMatrixIndexToMatrix4Index = [
  0, 4, 12, // Row 1
  1, 5, 13, // Row 2
  3, 7, 15, // Row 3
]

/**
 * @param {Float64Array} matrix4
 * @return {*}
 */
export function toMatrix (matrix4: number[]): Float32Array {
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
  const skia = Engine.skia.Malloc(Float32Array, points.length * 2)
  
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
  if (filterQuality === Engine.skia.FilterQuality.None) {
   return {
     filter: Engine.skia.FilterMode.Nearest,
     mipmap: Engine.skia.MipmapMode.None
   }
 } else if (filterQuality === Engine.skia.FilterQuality.Low) {
   return {
     filter: Engine.skia.FilterMode.Linear,
     mipmap: Engine.skia.MipmapMode.None
   }
 } else if (filterQuality === Engine.skia.FilterQuality.Medium) {
   return {
     filter: Engine.skia.FilterMode.Linear,
     mipmap: Engine.skia.MipmapMode.Linear
   }
 } else if (filterQuality === Engine.skia.FilterQuality.High) {
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

export function fromPositionWithAffinity (positionWithAffinity: Skia.PositionWithAffinity) {
  const affinity = positionWithAffinity.affinity
  return TextPosition.create({
    offset: positionWithAffinity.pos,
    affinity: affinity,
  })
}



/**
 * @param {Color} colors
 * @return {*}
 */
export function toColors (colors: Color[]) {
  const result = new Uint32Array(colors.length)
  for (let i = 0; i < colors.length; i++) {
    result[i] = colors[i].value
  }
  return result
}

/**
 * @param {ArrayLike} stops
 * @return {*}
 */
export function toColorStops (stops: number[] | null = null) {
  if (stops === null) {
    return [0, 1]
  }

  const result: number[] = []

  for (let i = 0; i < stops.length; i++) {
    result[i] = stops[i]
  }
  
  return result
}


/**
 * @param {FilterQuality} filterQuality
 * @return {*}
 */
export function toMipmapMode (filterQuality: Skia.FilterQuality) {
  return filterQuality == Engine.skia.FilterQuality.Medium
      ? Engine.skia.MipmapMode.Linear
      : Engine.skia.MipmapMode.None
}

/**
 * @param {FilterQuality} filterQuality
 * @return {*}
 */
export function toFilterMode (filterQuality: Skia.FilterQuality) {
  return filterQuality == Engine.skia.FilterQuality.None
      ? Engine.skia.FilterMode.Nearest
      : Engine.skia.FilterMode.Linear
}


//// => Text Style 
// 字体数据转换
export const toTextStyle = (
  fontFamily: string | null = null,
  fontSize: number | null = null,
  height: number | null = null,
  fontWeight: Skia.FontWeight | null = null,
  fontStyle: Skia.FontSlant | null = null,
): Skia.TextStyle => {
  const style: Skia.TextStyle = {
    fontFamilies: fontFamily 
      ? [fontFamily, Engine.env<string>('ATKIT_FONT_FAMILY', 'Rotobo')] 
      : [Engine.env<string>('ATKIT_FONT_FAMILY', 'Rotobo')],
    fontStyle: toFontStyle(fontWeight, fontStyle),
    fontSize: fontSize 
      ? fontSize 
      : undefined,
    heightMultiplier: height ? height : undefined,
  } as Skia.TextStyle
    
  return style
}

export const toFontStyle = (fontWeight: Skia.FontWeight | null, fontStyle: Skia.FontSlant | null) => {
  return fontWeight || fontStyle 
    ? {
      weight: fontWeight ? fontWeight : undefined,
      slant: fontStyle ? fontStyle : undefined,
    } : undefined
}

// => struct style
export const toStrutStyle = (
  style: StrutStyle, 
  paragraphHeightBehavior?: TextHeightBehavior | null
): Skia.StrutStyle => {
  const leadingDistribution = style.leadingDistribution ?? paragraphHeightBehavior?.leadingDistribution ?? null

  const struct: Skia.StrutStyle = {
    fontFamilies: style.fontFamily 
      ? [style.fontFamily, Engine.env<string>('FONT_FAMILY', 'Roboto')] 
      : [Engine.env<string>('FONT_FAMILY', 'ROBOTO')],
    fontSize: style.fontSize 
      ? style.fontSize 
      : undefined,
    heightMultiplier: style.height 
      ? style.height 
      : undefined,
    halfLeading: leadingDistribution !== null
      ? leadingDistribution === TextLeadingDistributionKind.Even 
          ? true
          : false
      : undefined,
    leading: style.leading 
      ? style.leading 
      : undefined,
    fontStyle: toFontStyle(style.fontWeight, style.fontStyle),
    forceStrutHeight: style.forceStrutHeight 
      ? style.forceStrutHeight 
      : undefined,
    strutEnabled: true
  }

  return struct
}

// => 文本高度行为
let kSkiaTextHeightBehaviors: Skia.TextHeightBehavior[] | null = null
export function toTextHeightBehavior (behavior: TextHeightBehavior) {

  kSkiaTextHeightBehaviors ??= [
    Engine.skia.TextHeightBehavior.All,
    Engine.skia.TextHeightBehavior.DisableFirstAscent,
    Engine.skia.TextHeightBehavior.DisableLastDescent,
    Engine.skia.TextHeightBehavior.DisableAll,
  ]

  const index = (
    (behavior.applyHeightToFirstAscent ? 0 : 1 << 0) |
    (behavior.applyHeightToLastDescent ? 0 : 1 << 1)
  )
  
  return kSkiaTextHeightBehaviors[index]
}
