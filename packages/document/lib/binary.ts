import { decode, encode, invariant } from '@at/utils'
import { Color } from './element'

//// => Binary
export abstract class Binary {
  // Transform 维度
  static TRANSFORM_DIMENSION = 6

  // 动态内容
  static DYN = Number.MAX_SAFE_INTEGER

  // 索引区大小
  // 4bytes
  static INDEXES = 4

  // 内容区大小
  // 4bytes
  static CONTENTS = 4

  // 存储长度字节
  // 1byte
  static INDEXES_BYTE = 1

  // 存储文本长度
  // 4 bytes
  static INDEXES_DWORD = 4

  // 版本数据长度 
  // 结构 [xxxx][yyyy][zzzz]
  // 3 bytes
  static DOCUMENT_VERSION = 3
  
  // id 数据最大值
  // 4 bytes
  static DOCUMENT_ID = 4

  // 索引大小
  // 4 bytes
  static ELEMENT_INDEX = 4

  // element count
  // 4 bytes
  static ELEMENT_COUNT = 4

  // element id
  // 4 bytes
  static ELEMENT_ID = 4

  // 节点阶段
  // 1 byte
  static ELEMENT_PHASE = 1

  // 节点类型
  // 1 byte
  static ELEMENT_KIND = 1

  // 节点状态
  // 1byte
  static ELEMENT_STATE = 1
  
  // 节点透明度
  // 1byte 将 0.91 > 91
  static ELEMENT_OPACITY = 1

  // 混合模式
  // 1byte
  static ELEMENT_BLEND_MODE = 1

  // 节点背景色值索引
  // 4byte
  static ELEMENT_COLOR = 4
  
  // 位置x
  // 4byte
  static ELEMENT_X = 4

  // 位置y
  // 4byte
  static ELEMENT_Y = 4

  // 宽度
  // 4byte
  static ELEMENT_WIDTH = 4

  // 高度
  // 4byte
  static ELEMENT_HEIGHT = 4

  // paint count
  // 4bytes
  static PAINT_COUNT = 4 

  // piant index
  // 4bytes
  static PAINT_INDEX = 4

  // piant kind
  // 1byte
  static PAINT_KIND = 1

  // piant state
  // 1byte
  static PAINT_STATE = 1

  // paint opacity
  // 1byte
  static PAINT_OPACITY = 1

  // piant blendMode
  // 1byte
  static PAINT_BLENDMODE = 1

  // paint color
  // 4bytes
  static PAINT_COLOR = 4

  // paint gradient kind
  // 1byte
  static PAINT_GRADIENT_KIND = 1

  // paint gradient transform
  // 4bytes
  static PAINT_GRADIENT_TRANSFORM = 4

  // paint gradient stops count
  // 1byte
  static PAINT_GRADIENT_COUNT = 1

  // paint gradient stop position
  // 1byte
  static PAINT_GRADIENT_POSITION = 1

  // paint blur kind
  // 1byte
  static PAINT_BLUR_KIND = 1
  // paint blur 
  // 4bytes
  static PAINT_BLUR = 4

  // paint shadow kind
  // 1byte
  static PAINT_SHADOW_KIND = 1

  // paint shadow x
  // 4bytes
  static PAINT_SHADOW_X = 4

  // paint shadow y
  // 4bytes
  static PAINT_SHADOW_Y = 4

  // paint shadow blur
  // 4bytes
  static PAINT_SHADOW_BLUR = 4

  // paint shadow spread
  // 4bytes
  static PAINT_SHADOW_SPREAD = 4
}

/// => read
/**
 * 读取长度
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {number}
 */
export const lengthRead = (data: Uint8Array, offset: number = 0) => {
  return uint32Read(data, offset)
}

/**
 * 字符串读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {string}
 */
export const stringRead = (data: Uint8Array, offset: number = 0): string => {
  return decode(data)
}

/**
 * 读取颜色
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {Color}
 */
export const colorRead = (data: Uint8Array, offset: number = 0): Color => {
  const value = uint32Read(data, offset)

  return {
    r: (0xff000000 & value) >>> 24,
    g: (0x00ff0000 & value) >>> 16,
    b: (0x0000ff00 & value) >>> 8,
    a: (0x000000ff & value),
  }
}

/**
 * transform 读取
 * @param {number[]} transform 
 * @param {number} offset 
 * @returns 
 */
export const transformRead = (
  data: Uint8Array,
  offset: number = 0
): number[] => {
  const transform: number[] = []
  
  for (let i = 0; i < Binary.TRANSFORM_DIMENSION; i++) {
    const start = offset + i * Binary.PAINT_GRADIENT_TRANSFORM
    const value = uint32Read(data.slice(start, start + Binary.PAINT_GRADIENT_TRANSFORM))
    transform.push(value)
  }

  return transform
}

/**
 * uint32读取
 * @param {Uint8Array} data 
 * @param offset 
 * @returns 
 */
export const uint32Read = (
  data: Uint8Array, 
  offset: number = 0
) => {
  const value = (
    ((data[offset] & 0xff) << 24) |
    ((data[offset + 1] & 0xff) << 16) |
    ((data[offset + 2] & 0xff) << 8) |
    (data[offset + 3] & 0xff)
  ) 
  
  return value
}

/**
 * uint24 读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {number}
 */
export const uint24Read = (
  data: Uint8Array, 
  offset: number = 0
) => {
  const value = (
    ((data[offset] & 0xff) << 16) |
    ((data[offset + 1] & 0xff) << 8) |
    (data[offset + 2] & 0xff)
  ) 
  
  return value
}

/**
 * uint16 读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {number}
 */
export const uint16Read = (
  data: Uint8Array, 
  offset: number = 0
) => {
  const value = (
    ((data[offset] & 0xff) << 8) |
    (data[offset + 1] & 0xff)
  ) 
  
  return value
}

/**
 * uint8 读取
 * @param {Uint8Array} data 
 * @param {number} offset 
 * @returns {number}
 */
export const uint8Read = (
  data: Uint8Array, 
  offset: number = 0
) => {
  const value = data[offset] & 0xff
  return value
}

/// => write
/**
 * 写入颜色
 * @param {Color} color 
 * @param {number} offset 
 * @returns {Uint8Array}
 */
export const colorWrite = (
  color: Color, 
  offset: number = 0
) => {
  const { r, g, b, a } = color
  const value = (
    ((r & 0xff) << 24) |
    ((g & 0xff) << 16) |
    ((b & 0xff) << 8) |
    ((a & 0xff) << 0)
  ) >>> 0
  return uint32Write(value, offset)
}

/**
 * 字符串写入
 * @param {string} string 
 * @returns {Uint8Array}
 */
export const stringWrite = (
  string: string
) => {
  return encode(string)
}

/**
 * transform 写入
 * @param {number[]} transform 
 * @param {number} offset 
 * @returns 
 */
export const transformWrite = (
  transform: number[],
  offset: number = 0
) => {
  const data = new Uint8Array(
    Uint8Array.BYTES_PER_ELEMENT * 
    Binary.TRANSFORM_DIMENSION * 
    Binary.PAINT_GRADIENT_TRANSFORM
  )
  for (let i = 0; i < Binary.TRANSFORM_DIMENSION; i++) {
    data.set(uint32Write(transform[i]), offset + i * Binary.PAINT_GRADIENT_TRANSFORM)
  }

  return data
}

/**
 * uint8 写入
 * @param {number} value 
 * @param {number} offset 
 * @returns {Uint8Array}
 */
export const uint8Write = (
  value: number, 
  offset: number = 0
) => {
  const chunk = new Uint8Array(Uint8Array.BYTES_PER_ELEMENT)
  chunk.set([value], offset)
  return chunk
}

/**
 * uint16 写入
 * @param {number} value 
 * @param {number} offset 
 * @returns {Uint8Array}
 */
export const uint16Write = (
  value: number, 
  offset: number = 0
) => {
  const chunk = new Uint8Array(Uint8Array.BYTES_PER_ELEMENT * 2)

  chunk.set([(value >> 8) & 0xff], offset)
  chunk.set([(value) & 0xff], offset + 1)

  return chunk
}

/**
 * uint24 写入
 * @param {number} value 
 * @param {number} offset 
 * @returns {Uint8Array}
 */
export const uint24Write = (
  value: number, 
  offset: number = 0
) => {
  const chunk = new Uint8Array(Uint8Array.BYTES_PER_ELEMENT * 3)

  chunk.set([(value >> 16) & 0xff], offset)
  chunk.set([(value >> 8) & 0xff], offset + 1)
  chunk.set([(value) & 0xff], offset + 2)

  return chunk
}

/**
 * uint32 写入
 * @param {number} value 
 * @param {number} offset 
 * @returns {Uint8Array}
 */
export const uint32Write = (
  value: number, 
  offset: number = 0
) => {
  const chunk = new Uint8Array(Uint8Array.BYTES_PER_ELEMENT * 4)

  chunk.set([(value >> 24) & 0xff], offset)
  chunk.set([(value >> 16) & 0xff], offset + 1)
  chunk.set([(value >> 8) & 0xff], offset + 2)
  chunk.set([(value) & 0xff], offset + 3)

  return chunk
}

//// => EntryWriter
export class EntryWriter extends Binary {
  static create () {
    return new EntryWriter
  }

  protected indexes: Uint8Array[] = []
  protected contents: Uint8Array[] = []

  /**
   * 数据写入
   * @param {Uint8Array} content 
   * @param {number} byteLength 
   * @param {number} saveLength 
   */
  bytesWrite (
    content: Uint8Array,
    byteLength: number,
    saveLength: number = EntryWriter.INDEXES_BYTE,
  ) {
    let index: Uint8Array
    
    if (saveLength === EntryWriter.INDEXES_DWORD) {
      index = uint32Write(content.byteLength)
    } else {
      index = uint8Write(content.byteLength)
    }

    invariant(() => {
      return content.byteLength <= byteLength
    }, `Data out of range.`)

    this.indexes.push(index)
    this.contents.push(content)
  }

  /**
   * 合并数据
   * @returns {Uint8Array} 
   */
  bytes () {
    const indexesLength = this.indexes.reduce((byteLength, index) => {
      return byteLength + index.byteLength
    }, 0)

    const contentsLength = this.contents.reduce((byteLength, content) => {
      return byteLength + content.byteLength
    }, 0)

    const byteLength = indexesLength + contentsLength
    
    // 索引区
    const index = uint32Write(indexesLength)
  
    // 内容区
    const content = uint32Write(contentsLength)

    const chunks = [
      index, // 索引区大小
      content, // 内容区大小
      ...this.indexes, // 索引表
      ...this.contents // 数据区
    ] 

    let offset = 0
    const bytes = new Uint8Array(EntryWriter.INDEXES + EntryWriter.CONTENTS + byteLength)

    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset = offset + chunk.byteLength
    }

    return bytes
  }

  write (...rests: unknown[]): void {

  }
}

//// => 数据读取
export class EntryReader extends Binary {
  static create (data: Uint8Array) {
    return new EntryReader(data)
  }

  public data: Uint8Array
  public offset: number

  constructor (data: Uint8Array, offset: number = 0) {
    super()

    this.data = data
    this.offset = offset
  }

  /**
   * 数据段读取
   * @param {number} length 
   * @returns 
   */
  bytesRead (length?: number) {
    const offset = this.offset
    length ??= this.data.byteLength - this.offset
    return this.data.slice(offset, this.offset = this.offset + length)
  }
}

//// => EntryIndexes
// 数据索引表
export class EntryIndexes extends EntryReader {
  static create (data: Uint8Array) {
    return new EntryIndexes(data)
  }

  /**
   * 数据读取
   * @param {number} length 
   * @returns {}
   */
  bytesRead(length: number = EntryIndexes.INDEXES_BYTE): Uint8Array {
    return super.bytesRead(length)
  }

  /**
   * uint8 读取
   * @returns 
   */
  uint8Read () {
    return uint8Read(this.bytesRead())
  }

  /**
   * uint32 读取
   * @returns 
   */
  uint32Read () {
    return uint32Read(this.bytesRead(EntryIndexes.INDEXES_DWORD))
  }
}


export class EntryContents extends EntryReader {
  static create (data: Uint8Array) {
    return new EntryContents(data)
  }

  transformRead (length?: number) {
    return transformRead(this.bytesRead(length ?? Binary.TRANSFORM_DIMENSION))
  }

  stringRead (length?: number) {
    return stringRead(this.bytesRead(length ?? this.data.byteLength))
  }

  colorRead (length: number = EntryContents.ELEMENT_COLOR) {
    return colorRead(this.bytesRead(length))
  }

  uint8Read (length: number) {
    return uint8Read(this.bytesRead(length))
  }

  uint16Read (length: number) {
    return uint16Read(this.bytesRead(length))
  }

  uint24Read (length: number) {
    return uint24Read(this.bytesRead(length))
  }

  uint32Read (length: number) {
    return uint32Read(this.bytesRead(length))
  }
}
