/*
 * @author: Aniwei
 * @date: 2022-10-21 16:50:53
 */
import { invariant } from '@at/utils'
import { ArrayLike, At } from '../at'
import { Color } from './color'
import { Matrix4 } from './matrix4'
import { AtPath } from '../engine/path'
import { Offset, Point, Rect, RRect } from './geometry'
import { AtTextPosition, TextLeadingDistribution } from '../engine/text'
import type { 
  AtStrutStyle, 
  AtTextHeightBehavior 
} from '../engine/text'
import type { 
  PositionWithAffinity, 
  FilterQuality, 
  TextAlign, 
  TextDirection, 
  TextHeightBehavior, 
  TextStyle, 
  FontStyle, 
  FontWeight, 
  FontSlant, 
  PlaceholderAlignment, 
  TextBaseline, 
  ParagraphStyle, 
  StrutStyle 
} from '../engine/skia'
import { PointerChange, PointerDeviceKind } from '../gestures/pointer'


// => compute
const kSkiaShadowAmbientAlpha = 0.039
const kSkiaShadowSpotAlpha = 0.25
const kSkiaShadowLightRadius = 1.1
const kSkiaShadowLightHeight = 600.0
const kSkiaShadowLightXOffset = 0
const kSkiaShadowLightYOffset = -450
const kSkiaShadowLightXTangent = kSkiaShadowLightXOffset / kSkiaShadowLightHeight
const kSkiaShadowLightYTangent = kSkiaShadowLightYOffset / kSkiaShadowLightHeight

const kAmbientHeightFactor = 1.0 / 128.0
const kAmbientGeomFactor = 64.0
const kMaxAmbientRadius = 300 * kAmbientHeightFactor * kAmbientGeomFactor

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

export function ambientBlurRadius (height: number) {
  return Math.min(
    height * kAmbientHeightFactor * kAmbientGeomFactor, 
    kMaxAmbientRadius
  )
}

export function computeSkiaShadowBounds(
  path: AtPath,
  elevation: number,
  devicePixelRatio: number,
  matrix: Matrix4,
): Rect {
  let pathBounds: Rect = path.getBounds()

  if (elevation === 0) {
    return pathBounds
  }

  const isComplex = !matrix.isIdentityOrTranslation()
  if (isComplex) {
    pathBounds = transformRect(matrix, pathBounds)
  }

  let left = pathBounds.left
  let top = pathBounds.top
  let right = pathBounds.right
  let bottom = pathBounds.bottom

  const ambientBlur = ambientBlurRadius(elevation)
  const spotBlur = kSkiaShadowLightRadius * elevation
  const spotOffsetX = -elevation * kSkiaShadowLightXTangent
  const spotOffsetY = -elevation * kSkiaShadowLightYTangent

  left = left - 1 + (spotOffsetX - ambientBlur - spotBlur) * devicePixelRatio
  top = top - 1 + (spotOffsetY - ambientBlur - spotBlur) * devicePixelRatio
  right = right + 1 + (spotOffsetX + ambientBlur + spotBlur) * devicePixelRatio
  bottom = bottom + 1 + (spotOffsetY + ambientBlur + spotBlur) * devicePixelRatio

  const shadowBounds: Rect = Rect.fromLTRB(left, top, right, bottom)

  if (isComplex) {
    const inverse = Matrix4.zero()
    
    if (inverse.copyInverse(matrix) != 0.0) {
      return transformRect(inverse, shadowBounds)
    } else {
      return shadowBounds
    }
  } else {
    return shadowBounds
  }
}

// => condition
/**
 * @description: 判断 List 是否相等
 * @param {T} a
 * @param {T} b
 * @return {*}
 */
export function listEquals<T>(
  a: ArrayLike<T> | null = null, 
  b: ArrayLike<T> | null = null
) {
  if (a === null) {
    return b === null
  }

  if (b === null || a?.length !== b?.length) {
    return false
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false
    }
  }

  return true
}

// => condition
/**
 * @description: 判断 List 是否相等
 * @param {T} a
 * @param {T} b
 * @return {*}
 */
export function listNotEquals<T>(
  a: ArrayLike<T> | null = null, 
  b: ArrayLike<T> | null = null
) {
  return !listEquals(a, b)
}


// => calc
/**
 * @description: 差值函数
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @return {*}
 */
export function lerp (a: number, b: number, t: number) {
  return a * (1.0 - t) + b * t
}

/**
 * @description: 
 * @return {*}
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

// => transform
export function fromPositionWithAffinity (positionWithAffinity: PositionWithAffinity) {
  const affinity = positionWithAffinity.affinity
  return new AtTextPosition(
    positionWithAffinity.pos,
    affinity,
  )
}


export function scaleAlpha (a: Color, factor: number) {
  return a.withAlpha(clamp(Math.round((a.alpha * factor)), 0, 255))
}

const _tempPointData = new Float32Array(16)
const _tempPointMatrix = Matrix4.fromArrayLike(_tempPointData)

/**
 * @description: 
 * @param {Matrix4} transform
 * @param {Float32Array} ltrb
 * @return {*}
 */
export function transformLTRB (transform: Matrix4, ltrb: Float32Array) {
  _tempPointData[0] = ltrb[0]
  _tempPointData[4] = ltrb[1]
  _tempPointData[8] = 0
  _tempPointData[12] = 1

  // Row 1: top-right
  _tempPointData[1] = ltrb[2]
  _tempPointData[5] = ltrb[1]
  _tempPointData[9] = 0
  _tempPointData[13] = 1

  // Row 2: bottom-left
  _tempPointData[2] = ltrb[0]
  _tempPointData[6] = ltrb[3]
  _tempPointData[10] = 0
  _tempPointData[14] = 1

  // Row 3: bottom-right
  _tempPointData[3] = ltrb[2]
  _tempPointData[7] = ltrb[3]
  _tempPointData[11] = 0
  _tempPointData[15] = 1

  _tempPointMatrix.multiplyTranspose(transform);

  // Handle non-homogenous matrices.
  let w = transform[15]
  if (w === 0) {
    w = 1
  }

  ltrb[0] = Math.min(Math.min(Math.min(_tempPointData[0], _tempPointData[1]), _tempPointData[2]), _tempPointData[3]) / w
  ltrb[1] = Math.min(Math.min(Math.min(_tempPointData[4], _tempPointData[5]), _tempPointData[6]), _tempPointData[7]) / w
  ltrb[2] = Math.max(Math.max(Math.max(_tempPointData[0], _tempPointData[1]), _tempPointData[2]), _tempPointData[3]) / w
  ltrb[3] = Math.max(Math.max(Math.max(_tempPointData[4], _tempPointData[5]), _tempPointData[6]), _tempPointData[7]) / w
}


const _tempRectData = new Float32Array(4)
/**
 * @description: 
 * @param {*} Matrix4
 * @param {*} ui
 * @return {*}
 */
export function transformRect (transform: Matrix4, rect: Rect) {
  _tempRectData[0] = rect.left
  _tempRectData[1] = rect.top
  _tempRectData[2] = rect.right
  _tempRectData[3] = rect.bottom
  transformLTRB(transform, _tempRectData)
  return Rect.fromLTRB(
    _tempRectData[0],
    _tempRectData[1],
    _tempRectData[2],
    _tempRectData[3],
  )
}

/**
 * @description: 
 * @param {Offset} offset
 * @return {*}
 */
export function toPoint (offset: Offset) {
  const point = new Float32Array(2)
  point[0] = offset.dx
  point[1] = offset.dy
  return point
}


/**
 * @description: 
 * @param {Point} points
 * @return {*}
 */
export function toPoints (points: ArrayLike<Offset>) {
  const skia = At.Malloc(Float32Array, points.length * 2)
  
  const typed = skia.toTypedArray()
  
  for (let i = 0; i < points.length; i++) {
    typed[2 * i] = points[i].dx
    typed[2 * i + 1] = points[i].dy
  }

  return skia
}

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
export function toMatrix (matrix4: ArrayLike<number>) {
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
 * @param {FilterQuality} filterQuality
 * @return {*}
 */
export function toFilterQuality (filterQuality: FilterQuality) {
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
     B: 1.0 / 3,
     C: 1.0 / 3
   }
 } 
}
/**
 * @description: 
 * @param {FilterQuality} filterQuality
 * @return {*}
 */
export function toMipmapMode (filterQuality: FilterQuality) {
  return filterQuality == At.FilterQuality.Medium
      ? At.MipmapMode.Linear
      : At.MipmapMode.None
}

/**
 * @description: 
 * @param {FilterQuality} filterQuality
 * @return {*}
 */
export function toFilterMode (filterQuality: FilterQuality) {
  return filterQuality == At.FilterQuality.None
      ? At.FilterMode.Nearest
      : At.FilterMode.Linear
}

/**
 * @description: 
 * @param {number} width
 * @param {number} height
 * @param {PlaceholderAlignment} alignment
 * @param {number} offset
 * @param {TextBaseline} baseline
 * @return {*}
 */
export function toPlaceholderStyle (
  width: number,
  height: number,
  alignment: PlaceholderAlignment,
  offset: number,
  baseline: TextBaseline,
) {
  const properties = {
    width,
    height,
    alignment,
    offset,
    baseline
  }

  return properties
}

export function toTextStyle (
  fontFamily: string | null = null,
  fontSize: number | null = null,
  height: number | null = null,
  fontWeight: FontWeight | null = null,
  fontStyle: FontSlant | null = null,
): TextStyle {
  const style: TextStyle = {
    fontFamilies: getEffectiveFontFamilies(fontFamily)
  }
    
  if (fontWeight !== null || fontStyle !== null) {
    style.fontStyle = toFontStyle(fontWeight, fontStyle)
  }

  if (fontSize !== null) {
    style.fontSize = fontSize
  }

  if (height !== null) {
    style.heightMultiplier = height;
  }

  return style
}

export function toParagraphStyle (
  textAlign: TextAlign | null = null,
  textDirection: TextDirection | null = null,
  maxLines: number | null = null,
  fontFamily: string | null = null,
  fontSize: number | null = null,
  height: number | null = null,
  textHeightBehavior: AtTextHeightBehavior | null = null,
  fontWeight: FontWeight | null = null,
  fontStyle: FontSlant | null = null,
  strutStyle: AtStrutStyle | null = null,
  ellipsis: string | null = null,
) {
  const properties: ParagraphStyle = {}

  if (
    textAlign !== null && 
    textAlign !== undefined
  ) {
    properties.textAlign = textAlign
  }

  if (textDirection !== null) {
    properties.textDirection = textDirection
  }

  if (maxLines !== null) {
    properties.maxLines = maxLines
  }

  if (height !== null) {
    properties.heightMultiplier = height;
  }

  if (textHeightBehavior !== null) {
    properties.textHeightBehavior = toTextHeightBehavior(textHeightBehavior)
  }

  if (ellipsis !== null) {
    properties.ellipsis = ellipsis
  }

  if (strutStyle !== null) {
    properties.strutStyle = toStrutStyle(
      strutStyle, 
      textHeightBehavior
    )
  }

  properties.textStyle = toTextStyle(
    fontFamily, 
    fontSize, 
    height, 
    fontWeight, 
    fontStyle
  )

  return new At.ParagraphStyle(properties)
}

export function toStrutStyle (
  style: AtStrutStyle, 
  paragraphHeightBehavior?: AtTextHeightBehavior | null
): StrutStyle {
  const properties: StrutStyle = {
    fontFamilies: getEffectiveFontFamilies(
      style.fontFamily,
      style.fontFamilyFallback
    )
  }
  
  if (style.fontSize !== null) {
    properties.fontSize = style.fontSize
  }

  if (style.height !== null) {
    properties.heightMultiplier = style.height
  }

  const effectiveLeadingDistribution = style.leadingDistribution ?? paragraphHeightBehavior?.leadingDistribution

  switch (effectiveLeadingDistribution) {
    case null:
      break
    case TextLeadingDistribution.Even:
      properties.halfLeading = true
      break
    case TextLeadingDistribution.Proportional:
      properties.halfLeading = false
      break
  }

  if (style.leading !== null) {
    properties.leading = style.leading
  }

  if (
    style.fontWeight !== null || 
    style.fontStyle !== null
  ) {
    properties.fontStyle = toFontStyle(
      style.fontWeight, 
      style.fontStyle
    )
  }

  if (style.forceStrutHeight !== null) {
    properties.forceStrutHeight = style.forceStrutHeight
  }

  properties.strutEnabled = true

  return properties
}

let kSkiaTextHeightBehaviors: TextHeightBehavior[] | null = null

export function toTextHeightBehavior (behavior: AtTextHeightBehavior) {
  kSkiaTextHeightBehaviors ??= [
    At.TextHeightBehavior.All,
    At.TextHeightBehavior.DisableFirstAscent,
    At.TextHeightBehavior.DisableLastDescent,
    At.TextHeightBehavior.DisableAll,
  ]

  const index = (
    (behavior.applyHeightToFirstAscent ? 0 : 1 << 0) |
    (behavior.applyHeightToLastDescent ? 0 : 1 << 1)
  )
  
  return kSkiaTextHeightBehaviors[index]
}

export function convertRadiusToSigma (radius: number) {
  return radius > 0 ? radius * 0.57735 + 0.5 : 0
}

export function toFreshColor (color: Color) {
  const result = new Float32Array(4)
  result[0] = color.red / 255.0
  result[1] = color.green / 255.0
  result[2] = color.blue / 255.0
  result[3] = color.alpha / 255.0
  return result
}

export function toDeviceKind (pointerType: string) {
  switch (pointerType) {
    case 'mouse':
      return PointerDeviceKind.Mouse
    case 'pen':
      return PointerDeviceKind.Stylus
    case 'touch':
      return PointerDeviceKind.Touch
    default:
      return PointerDeviceKind.Unknown
  }
}

export function toMessagePointerEvent (event: PointerEvent) {
  const { isTrusted, altKey, bubbles, button, buttons, cancelable, clientX, clientY, composed, ctrlKey, defaultPrevented, detail, eventPhase, height, isPrimary, metaKey, movementX, movementY, offsetX, offsetY, pageX, pageY, pointerId, pointerType, pressure, screenX, screenY, shiftKey, tangentialPressure, tiltX, tiltY, timeStamp, twist, type, width, x, y } = event
  return { isTrusted, altKey, bubbles, button, buttons, cancelable, clientX, clientY, composed, ctrlKey, defaultPrevented, detail, eventPhase, height, isPrimary, metaKey, movementX, movementY, offsetX, offsetY, pageX, pageY, pointerId, pointerType, pressure, screenX, screenY, shiftKey, tangentialPressure, tiltX, tiltY, timeStamp, twist, type, width, x, y }
}

/**
 * @description: 
 * @param {Color} colors
 * @return {*}
 */
export function toColors (colors: ArrayLike<Color>) {
  const result = new Uint32Array(colors.length)
  for (let i = 0; i < colors.length; i++) {
    result[i] = colors[i].value
  }
  return result
}

/**
 * @description: 
 * @param {ArrayLike} stops
 * @return {*}
 */
export function toColorStops (stops: ArrayLike<number> | null = null) {
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
 * @description: 
 * @param {FontWeight} fontWeight
 * @param {FontSlant} fontStyle
 * @return {*}
 */
export function toFontStyle (
  fontWeight: FontWeight | null, 
  fontStyle: FontSlant | null
) {
  const style: FontStyle = {}
  if (fontWeight !== null) {
    style.weight = fontWeight
  }
  if (fontStyle !== null) {
    style.slant = fontStyle
  }
  return style;
}

// => About validator
/**
 * @description: 判断是否有效矩阵
 * @param {Float32Array} matrix4
 * @return {*}
 */
export function matrix4IsValid (matrix4: ArrayLike<number>) {
  invariant(matrix4 !== null, 'Matrix4 argument cannot be null.')
  invariant(matrix4.length === 16, 'Matrix4 must have 16 entries.')
  return true
}

/**
 * @description: 判断是否有效 RRect
 * @param {RRect} rrect
 * @return {*}
 */
export function rrectIsValid (rrect: RRect) {
  invariant(rrect !== null, 'RRect argument was null.')
  invariant(
    !(isNaN(rrect.left) || isNaN(rrect.right) || isNaN(rrect.top) || isNaN(rrect.bottom)),
    'RRect argument contained a NaN value.'
  )

  return true
}

/**
 * @description: 判断是否有效 Offset
 * @param {Offset} offset
 * @return {*}
 */
export function offsetIsValid (offset: Offset | Point) {
  invariant(offset !== null, 'The offset cannot be null.')
  invariant(!isNaN(offset.dx) || isNaN(offset.dy), 'The offset argument contained a NaN value.')
  return true
}

/**
 * @description: 判断是否有效 Rect
 * @param {Rect} rect
 * @return {*}
 */
export function rectIsValid (rect: Rect) {
  invariant(rect !== null, 'Rect argument cannot be null.')
  invariant(
    !(isNaN(rect.left) || isNaN(rect.right) || isNaN(rect.top) || isNaN(rect.bottom)),
    'Rect argument contained a NaN value.'
  )
  return true
}

// => font family
/**
 * @description: 
 * @param {string} fontFamily
 * @param {string} fontFamilyFallback
 * @return {*}
 */
 export function getEffectiveFontFamilies (
  fontFamily: string | null = null,
  fontFamilyFallback: string[] | null = null
): string[] {
  const fontFamilies: string[] = []

  if (fontFamily !== null) {
    fontFamilies.push(fontFamily)
  }

  if (
    fontFamilyFallback !== null &&
    !fontFamilyFallback.every((font: string) => fontFamily === font)
  ) {
    for (const font of fontFamilyFallback) {
      fontFamilies.push(font)
    }
  }

  // TODO
  // fontFamilies.addAll(FontFallbackData.instance.globalFontFallbacks);
  return fontFamilies
}

/**
 * @description: 
 * @param {Uint8Array} list
 * @param {string} fontFamily
 * @return {*}
 */
 export async function loadFontFromList (
  list: Uint8Array,
  fontFamily?: string | null
) {

}
