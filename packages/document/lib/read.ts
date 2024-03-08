import { 
  PaintKind, 
  Paint,
  Color,
  Blur,
  Shadow,
  Gradient,
  GradientStop,
  documentAssemble, 
} from './element'
import { 
  EntryContents, 
  EntryIndexes, 
  EntryReader, 
  lengthRead, 
  uint24Read 
} from './binary'
import { BinaryElement } from './flat'

/**
 * 读取索引区 / 数据区
 * @param {Uint8Array} data 
 * @returns 
 */
export const indexesAndContentsRead = (data: Uint8Array) => {
  const entry = EntryReader.create(data)
  const s1 = lengthRead(entry.bytesRead(EntryReader.INDEXES))
  const s2 = lengthRead(entry.bytesRead(EntryReader.CONTENTS))

  const indexes = EntryIndexes.create(entry.bytesRead(s1)) 
  const contents = EntryContents.create(entry.bytesRead(s2))

  return {
    indexes,
    contents
  }
}

/**
 * 版本读取
 * @param {Uint8Array} data 
 * @returns 
 */
export const versionRead = (data: Uint8Array) => {
  const value = uint24Read(data)
  return {
    x: (0xff0000 & value) >>> 16,
    y: (0x00ff00 & value) >>> 8,
    z: (0x0000ff & value),
  }
}

/**
 * stops 读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 */
export const stopsRead = (
  data: Uint8Array, 
  offset: number = 0
) => {
  const { indexes, contents } = indexesAndContentsRead(data)
  const count = contents.uint8Read(indexes.uint8Read())
  const stops: GradientStop[] = []

  for (let i = 0; i < count; i++) {
    const position = contents.uint8Read(EntryContents.PAINT_GRADIENT_POSITION)
    const color = contents.colorRead()

    stops.push({
      position,
      color
    })
  }

  return stops
}

/**
 * paint value 读取
 * @param {PaintKind} kind 
 * @param {Uint8Array} data 
 * @returns {string | Color | Shadow | Blur | Gradient}
 */
export const valueRead = (
  kind: PaintKind, 
  data: Uint8Array
): string | Color | Blur | Shadow | Gradient => {
  const { contents } = indexesAndContentsRead(data)
  
  switch(kind) {
    case PaintKind.Image:
    case PaintKind.Video:
      return contents.stringRead()
    case PaintKind.Color:
      return contents.colorRead()

    case PaintKind.Gradient:
      const kind = contents.uint8Read(EntryContents.PAINT_GRADIENT_KIND)
      const transform = contents.transformRead(EntryContents.PAINT_GRADIENT_TRANSFORM * EntryContents.TRANSFORM_DIMENSION) 

      return {
        kind,
        transform,
        stops: stopsRead(contents.bytesRead())
      }

    case PaintKind.Shadow: 
      return {
        kind: contents.uint8Read(EntryContents.PAINT_SHADOW_KIND),
        color: contents.colorRead(),
        x: contents.uint32Read(EntryContents.PAINT_SHADOW_X),
        y: contents.uint32Read(EntryContents.PAINT_SHADOW_Y),
        blur: contents.uint32Read(EntryContents.PAINT_SHADOW_BLUR),
        spread: contents.uint32Read(EntryContents.PAINT_SHADOW_SPREAD),
      }

    case PaintKind.Blur: 
      return {
        kind: contents.uint8Read(EntryContents.PAINT_BLUR_KIND),
        blur: contents.uint32Read(EntryContents.PAINT_BLUR),
      }
  }

  throw new Error('Unsupport paint value.')
}

/**
 * paint 读取
 * @param {Uint8Array} data 
 * @param offset 
 * @returns 
 */
export const paintRead = (
  data: Uint8Array, 
  offset: number = 0
): Paint => {
  const { indexes, contents } = indexesAndContentsRead(data)

  // => index
  const index = contents.uint32Read(indexes.uint8Read())

  // => kind
  const kind = contents.uint8Read(indexes.uint8Read())

  // => state
  const state = contents.uint8Read(indexes.uint8Read())

  // => opacity
  const opacity = contents.uint8Read(indexes.uint8Read())

  // => blendMode
  const blendMode = contents.uint8Read(indexes.uint8Read())

  // => value
  const value = valueRead(kind, contents.bytesRead(indexes.uint32Read()))

  return {
    index,
    kind,
    state,
    opacity,
    blendMode,
    value
  }
}

/**
 * paints 读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {Paint[]}
 */
export const paintsRead = (data: Uint8Array, offset: number = 0) => {
  const { indexes, contents } = indexesAndContentsRead(data)
  const count = contents.uint32Read(indexes.uint8Read())
  const paints: Paint[] = []

  for (let i = 0; i < count; i++) {
    const paint = paintRead(contents.bytesRead(indexes.uint32Read()))
    paints.push(paint)
  }

  return paints
}


/**
 * 元素读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {Element}
 */
export const elementRead = (data: Uint8Array, offset: number = 0) => {
  const { indexes, contents } = indexesAndContentsRead(data)
  
  // => id
  const id = contents.uint32Read(indexes.uint8Read())
  
  // => parentId
  const parentId = contents.uint32Read(indexes.uint8Read())

  // => phase
  const phase = contents.uint8Read(indexes.uint8Read())

  // => kind
  const kind = contents.uint8Read(indexes.uint8Read())

  // => index
  const index = contents.uint32Read(indexes.uint8Read())

  // => name
  const name = contents.stringRead(indexes.uint32Read())

  // => state
  const state = contents.uint8Read(indexes.uint8Read())

  // => opacity
  const opacity = contents.uint8Read(indexes.uint8Read())

  // => blendMode
  const blendMode = contents.uint8Read(indexes.uint8Read())
  
  // => backgroundColor
  const backgroundColor = contents.colorRead(indexes.uint8Read())

  // => x
  const x = contents.uint32Read(indexes.uint8Read())

  // => y
  const y = contents.uint32Read(indexes.uint8Read())

  // => width
  const width = contents.uint32Read(indexes.uint8Read())

  // => height
  const height = contents.uint32Read(indexes.uint8Read())

  // => paints
  const paints = paintsRead(contents.bytesRead(indexes.uint32Read()))

  return {
    id, 
    parentId,
    phase,
    kind,
    index,
    name,
    state,
    opacity,
    blendMode,
    backgroundColor,
    x,
    y,
    width,
    height,
    paints,
  }
}

/**
 * 元素列表读取
 * @param {Uint8Array} data 
 * @returns {}
 */
export const elementsRead = (data: Uint8Array) => {
  const { indexes, contents } = indexesAndContentsRead(data)

  const count = contents.uint32Read(indexes.uint8Read())
  const elements: BinaryElement[] = []

  for (let i = 0; i < count; i++) {
    const element = elementRead(contents.bytesRead(indexes.uint32Read()))
    elements.push(element)
  }

  return elements
}

/**
 * 文档读取
 * @param {Uint8Array} data 
 * @returns 
 */
export const documentRead = (data: Uint8Array) => {
  const { indexes, contents } = indexesAndContentsRead(data)
  
  const version = versionRead(contents.bytesRead(indexes.uint8Read()))
  const id = contents.uint32Read(indexes.uint8Read())
  const elements = elementsRead(contents.bytesRead(indexes.uint32Read()))
  const root = documentAssemble(id, elements)

  return {
    id,
    version,
    root
  }
}