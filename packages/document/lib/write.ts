import { Version } from '@at/utils'
import { 
  Color, 
  PaintKind, 
  Paint,
  Element,
  Gradient, 
  Blur,
  Shadow,
  GradientStop, 
} from './element'
import { 
  EntryWriter, 
  colorWrite, 
  stringWrite, 
  transformWrite, 
  uint24Write, 
  uint32Write, 
  uint8Write 
} from './binary'
import { 
  BinaryElement, 
  createBinaryElements 
} from './flat'

/**
 * 版本写入
 * @param {Version} version 
 * @param {number} offset 
 * @returns 
 */
export const versionWrite = (
  version: Version, 
  offset: number = 0
) => {
  const { x, y, z } = version
  const value = (
    ((x & 0xff) << 16) |
    ((y & 0xff) << 8) |
    ((z & 0xff) << 0)
  ) >>> 0

  return uint24Write(value, offset)
}

/**
 * stops 写入
 * @param {GradientStop[]} stops 
 * @param {number} offset 
 * @returns {Uint8Array}
 */
export const stopsWrite = (
  stops: GradientStop[],
  offset: number = 0
) => {
  const entry = EntryWriter.create()
  entry.bytesWrite(uint8Write(stops.length, offset), EntryWriter.PAINT_GRADIENT_COUNT)

  for (const stop of stops) {
    entry.bytesWrite(uint8Write(stop.position), EntryWriter.PAINT_GRADIENT_POSITION)
    entry.bytesWrite(colorWrite(stop.color), EntryWriter.PAINT_COLOR)
  }

  return entry.bytes()
}

/**
 * paint value 写入
 * @param {PaintKind} kind 
 * @param {string | Color | Blur | Gradient | Shadow} value 
 * @returns {Uint8Array}
 */
export const valueWrite = (
  kind: PaintKind, 
  value: string | Color | Blur | Gradient | Shadow
) => {
  const entry = EntryWriter.create()

  switch (kind) {
    case PaintKind.Image:
    case PaintKind.Video:
      entry.bytesWrite(stringWrite(value as string), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)
      break
    case PaintKind.Color:
      entry.bytesWrite(colorWrite(value as Color), EntryWriter.PAINT_COLOR)
      break

    case PaintKind.Gradient:
      entry.bytesWrite(uint8Write((value as Gradient).kind), EntryWriter.PAINT_GRADIENT_KIND)
      entry.bytesWrite(transformWrite((value as Gradient).transform), EntryWriter.PAINT_GRADIENT_TRANSFORM * EntryWriter.TRANSFORM_DIMENSION)
      entry.bytesWrite(stopsWrite((value as Gradient).stops), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)
      break

    case PaintKind.Stroke:
      break

    case PaintKind.Shadow:
      entry.bytesWrite(uint8Write((value as Shadow).kind), EntryWriter.PAINT_SHADOW_KIND)
      entry.bytesWrite(colorWrite((value as Shadow).color), EntryWriter.PAINT_COLOR)
      entry.bytesWrite(uint32Write((value as Shadow).x), EntryWriter.PAINT_SHADOW_X)
      entry.bytesWrite(uint32Write((value as Shadow).y), EntryWriter.PAINT_SHADOW_Y)
      entry.bytesWrite(uint32Write((value as Shadow).blur), EntryWriter.PAINT_SHADOW_BLUR)
      entry.bytesWrite(uint32Write((value as Shadow).spread), EntryWriter.PAINT_SHADOW_SPREAD)
      break

    case PaintKind.Blur:
      entry.bytesWrite(uint8Write((value as Blur).kind), EntryWriter.PAINT_BLUR_KIND)
      entry.bytesWrite(uint32Write((value as Blur).blur), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)
      break
  }

  return entry.bytes()
}

/**
 * paint 写入
 * @param {Paint} paint 
 * @returns {Uint8Array}
 */
export const paintWrite = (paint: Paint) => {
  const entry = EntryWriter.create()

  // => paint index
  entry.bytesWrite(uint32Write(paint.index), EntryWriter.PAINT_INDEX)

  // => paint kind
  entry.bytesWrite(uint8Write(paint.kind), EntryWriter.PAINT_KIND)

  // => paint state
  entry.bytesWrite(uint8Write(paint.state), EntryWriter.PAINT_STATE)

  // => paint opacity
  entry.bytesWrite(uint8Write(paint.opacity), EntryWriter.PAINT_OPACITY)

  // => paint blendMode
  entry.bytesWrite(uint8Write(paint.opacity), EntryWriter.PAINT_BLENDMODE)

  // => paint value
  entry.bytesWrite(valueWrite(paint.kind, paint.value), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)

  return entry.bytes()
}

/**
 * paint 写入
 * @param {Paint[]} paints 
 * @returns {Uint8Array}
 */
export const paintsWrite = (paints: Paint[]) => {
  const entry = EntryWriter.create()

  entry.bytesWrite(uint32Write(paints.length), EntryWriter.PAINT_COUNT)

  for (const paint of paints) {
    entry.bytesWrite(paintWrite(paint), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)
  }

  return entry.bytes()
}

/**
 * 元素写入
 * @param {BinaryElement} element 
 * @returns {Uint8Array}
 */
export const elementWrite = (element: BinaryElement) => {
  const entry = EntryWriter.create()

  // => id
  entry.bytesWrite(uint32Write(element.id), EntryWriter.ELEMENT_ID)

  // => parentId
  entry.bytesWrite(uint32Write(element.parentId), EntryWriter.ELEMENT_ID)

  // => phase
  entry.bytesWrite(uint8Write(element.phase), EntryWriter.ELEMENT_PHASE)

  // => kind
  entry.bytesWrite(uint8Write(element.kind), EntryWriter.ELEMENT_KIND)

  // => index
  entry.bytesWrite(uint32Write(element.index), EntryWriter.ELEMENT_INDEX)

  // => name
  entry.bytesWrite(stringWrite(element.name), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)

  // => state
  entry.bytesWrite(uint8Write(element.state), EntryWriter.ELEMENT_STATE)

  // => opacity
  entry.bytesWrite(uint8Write(element.opacity), EntryWriter.ELEMENT_OPACITY)

  // => blendMode
  entry.bytesWrite(uint8Write(element.blendMode), EntryWriter.ELEMENT_BLEND_MODE)

  // => backgroundColor
  entry.bytesWrite(colorWrite(element.backgroundColor), EntryWriter.ELEMENT_COLOR)

  // => x
  entry.bytesWrite(uint32Write(element.x), EntryWriter.ELEMENT_X)

  // => y
  entry.bytesWrite(uint32Write(element.y), EntryWriter.ELEMENT_Y)

  // => width
  entry.bytesWrite(uint32Write(element.width), EntryWriter.ELEMENT_WIDTH)

  // => height
  entry.bytesWrite(uint32Write(element.height), EntryWriter.ELEMENT_HEIGHT)

  // => paints
  entry.bytesWrite(paintsWrite(element.paints), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)

  return entry.bytes()
}

/**
 * 节点写入
 * @param {BinaryElement} elements 
 * @returns 
 */
export const elementsWrite  = (elements: BinaryElement[]) => {
  const entry = EntryWriter.create()
  entry.bytesWrite(uint32Write(elements.length), EntryWriter.ELEMENT_COUNT)

  for (const element of elements) {
    entry.bytesWrite(elementWrite(element), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)
  }

  return entry.bytes()
}

/**
 * 文档读取
 * @param {Element} root 
 * @param {Version} version 
 * @returns {Uint8Array}
 */
export const documentWrite = (root: Element, version: Version) => {
  const entry = EntryWriter.create()
  const elements = createBinaryElements(root)
  
  entry.bytesWrite(versionWrite(version), EntryWriter.DOCUMENT_VERSION)
  entry.bytesWrite(uint32Write(root.id), EntryWriter.DOCUMENT_ID)
  entry.bytesWrite(elementsWrite(elements), EntryWriter.DYN, EntryWriter.INDEXES_DWORD)
  
  return entry.bytes()
}
