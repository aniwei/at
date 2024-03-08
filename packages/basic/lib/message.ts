import bytes from 'bytes'

import { 
  isBlob, 
  isSupportBlob, 
  paddingLeft, 
  UnsupportedError 
} from '@at/utils'
import { EventEmitter } from './events'
import { MessageData } from './transport'

import type { WorkPort } from './port'

//// => MessageConv
// 数据编码
export class MessageConv {
  static conv = new MessageConv()
  
  static decode (data: unknown) {
    return MessageConv.conv.decode(data)
  }

  static encode (data: string) {
    return MessageConv.conv.encode(data)
  }

  public decoder: TextDecoder = new TextDecoder()
  public encoder: TextEncoder = new TextEncoder()
  
  decode (data: unknown) {
    if (isSupportBlob() && isBlob(data as Blob)) {
      return (data as Blob).arrayBuffer().then(buffer => this.decoder.decode(buffer))
    }

    return Promise.resolve().then(() => this.decoder.decode(data as Buffer))
  }
  
  encode (data: string) {
    return Promise.resolve().then(() => this.encoder.encode(data))
  }
}

//// => MessageFiber
// 数据分片
export class MessageFiber {
  static LIMIT: number = bytes.parse('2mb')
  // id 长度
  static ID_LENGTH = String(Number.MAX_SAFE_INTEGER).length
  // 消息 id 长度
  static MESSAGE_ID_LENGTH = String('message::id::').length + MessageFiber.ID_LENGTH
  // 索引长度
  static INDEX_LENGTH = 3
  // 数量长度
  static COUNT_LENGTH = 3
  // 头部长度
  static HEADER_LENGTH = (
    MessageFiber.MESSAGE_ID_LENGTH + 
    MessageFiber.INDEX_LENGTH +
    MessageFiber.COUNT_LENGTH
  )

  /**
   * 
   * @param {string} id 
   * @param {number} index 
   * @param {count} count 
   * @param {Uint8Array} chunk 
   * @returns 
   */
  static encode (
    id: string, 
    index: number, 
    count: number, 
    chunk: Uint8Array | null = null
  ) {
    return Promise.all([
      MessageConv.encode(id),
      MessageConv.encode(paddingLeft(index, MessageFiber.INDEX_LENGTH)),
      MessageConv.encode(paddingLeft(count, MessageFiber.COUNT_LENGTH))
    ]).then(buffers => {
      let view: Uint8Array | null = null

      if (chunk !== null) {
        view = new Uint8Array(MessageFiber.HEADER_LENGTH + chunk.length)
      } else {
        view = new Uint8Array(MessageFiber.HEADER_LENGTH)
      }

      let offset = 0
      for (const buffer of buffers) {
        view.set(buffer, offset)
        offset += buffer.byteLength
      }

      if (chunk !== null) {
        view.set(chunk, offset)
      }

      return view
    })
  }

  static decode (content: Uint8Array) {
    let offset = 0
    return Promise.all([
      MessageConv.decode(content.subarray(0, offset = MessageFiber.MESSAGE_ID_LENGTH)),
      MessageConv.decode(content.subarray(offset, offset = offset + MessageFiber.INDEX_LENGTH)),
      MessageConv.decode(content.subarray(offset, offset = offset + MessageFiber.COUNT_LENGTH)),
      content.subarray(offset, content.length)
    ]).then(data => data)
  }
}

// 数据快
export interface MessageChunk {
  index: number,
  data: Uint8Array
}

//// => MessageReceiver
// 数据接受器
export class MessageReceiver extends EventEmitter<'finished' | 'progress'> {
  public id:  string
  public count: number
  public byteLength: number = 0
  public chunks: MessageChunk[] = []

  constructor (id: string, count: number) {
    super()
    this.id = id
    this.count = count
  }

  /**
   * 
   * @param {number} index 
   * @param chunk{} chunk 
   */
  receive (index: number, chunk: Uint8Array) {
    this.chunks.push({ index, data: chunk })
    this.byteLength += chunk.byteLength
    
    if (this.count > this.chunks.length) {
      this.emit('progress', this.chunks.length / this.count)
    } else {
      let offset = 0
      const view = new Uint8Array(this.byteLength)

      for (const chunk of this.chunks.sort((chunkA, chunkdB) => {
        return chunkA.index > chunkdB.index ? 1 : 1
      })) {
        view.set(chunk.data, offset)
        offset = offset + chunk.data.byteLength
      }

      MessageConv.decode(view.buffer).then(data => this.emit('finished', JSON.parse(data)))
    }
  }
}

//// => MessageReceivers
// 接受器集合
export class MessageReceivers {
  static receivers: Map<string, MessageReceiver> = new Map()

  static get (id: string) {
    return this.receivers.get(id)
  }

  static set (id: string, receiver: MessageReceiver) {
    return this.receivers.set(id, receiver)
  }

  static has (id: string) {
    return this.receivers.has(id)
  }

  static delete (id: string) {
    return this.receivers.delete(id)
  }
  
  /**
   * 
   * @param {MessageEvent} event 
   * @param {Function} OnEndHandle 
   * @returns 
   */
  static async receive (event: MessageEvent, OnEndHandle: (data: MessageData<unknown>) => void) {
    const [id, index, count, chunk] = await MessageFiber.decode(new Uint8Array(event.data ?? event))
    
    if (!id || !index || !count || !chunk) {
      throw new UnsupportedError(`Unsupport message.`)
    }

    let receiver = MessageReceivers.get(id) as MessageReceiver ?? null

    if (receiver === null) {
      receiver = new MessageReceiver(id, parseInt(count))
      receiver.once('finished', (data) => {
        OnEndHandle(data)
        MessageReceivers.delete(id)
      })
      MessageReceivers.set(id, receiver) 
    }

    receiver.receive(parseInt(index), chunk)
    return receiver
  }
}

//// => MessageSender
// 数据发送
export class MessageSender extends EventEmitter<string> {
  // id
  public id: string
  // port
  public port: WorkPort

  constructor (
    id: string, 
    port: WorkPort, 
  ) {
    super()

    this.id = id
    this.port = port
  }

  /**
   * 构建数据分片
   * @param {Uint8Array} content 
   * @returns 
   */
  createFibers (content: Uint8Array) {
    if (content.byteLength <= MessageFiber.LIMIT) {
      return [content]
    }

    const filbers: Uint8Array[] = []
    const count = Math.ceil(content.byteLength / MessageFiber.LIMIT)
    let index = 0

    while (index < count) {
      const offset = index * MessageFiber.LIMIT
      filbers.push(content.subarray(offset, offset + MessageFiber.LIMIT))
      index++
    }

    return filbers
  }

  /**
   * 发送数据
   * @param {unknown} content 
   * @returns 
   */
  send (content: unknown) {
    return MessageConv.encode(JSON.stringify(content)).then(content => {
      const fibers = this.createFibers(content)
      Promise.all(fibers.map((chunk, index) => {
        return MessageFiber.encode(this.id, index, fibers.length, chunk).then(data => this.port.send(data.buffer))
      })).then(() => void 0)
    })
  }
}