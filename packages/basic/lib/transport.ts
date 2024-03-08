import { EventEmitter } from './events'


export type MessageTransportCommands = 'message::received' | 'message::callback' | 'message::except' | 'message::content' | 'endpoint::connect' | 'endpoint::authenticate' | string

/**
 * 指令处理函数
 */
interface MessageHandle {
  (messager: MessageOwner): Promise<MessageOwner | MessageData | void> | void
}

// => 消息数据
export interface MessageData<T = {
  [key: string]: unknown
} | string | null | undefined | void, C extends MessageTransportCommands = MessageTransportCommands> {
  id?: string,
  sid?: string
  command?: C,
  payload?: T,
  state?: number
}

export enum MessageOwnerStateKind {
  Active = 1,
  Replied = 2
}

export abstract class MessageTransportPort {
  abstract send (message: unknown): void
  abstract close (): void
  abstract on (event: 'message' | 'close' | 'error', listener: () => void): this
  abstract once (event: 'message' | 'close' | 'error', listener: () => void): this
  abstract off (event: 'message' | 'close' | 'error', listener: () => void): this
  abstract removeAllListeners (event?: string | symbol): this
}

//// => MessageError
// 消息错误
export class MessageError extends Error {
  // 错误消息 source id
  public sid: string
  // 错误详情
  public detail: string
  // 错误命令
  public command: MessageTransportCommands

  /**
   * 构造函数
   * @param {MessageOwner} messager 
   */
  constructor (messager: MessageOwner) {
    const payload = messager.payload as ({
      message: string,
      stack: string
    })

    super(payload?.message as string)

    this.command = messager.command as MessageTransportCommands
    this.sid = messager.sid as string
    this.detail = payload?.stack as string
    this.stack = payload.stack
  }
}

//// => MessageOwner
// 消息封装对象
export class MessageOwner {
  // => id
  public get id () {
    return this.data.id
  }

  // => sid
  public get sid () {
    return this.data.sid
  }

  // => payload
  public get payload () {
    return this.data.payload
  }

  // => command
  public get command () {
    return this.data.command
  }

  public port: MessageTransport
  public data: MessageData
  public state: MessageOwnerStateKind = MessageOwnerStateKind.Active


  /**
   * 构造信息对象
   * @param {MessageTransport} port 终端
   * @param {MessageData} data 
   */
  constructor (port: MessageTransport, data: MessageData) {
    this.port = port
    this.data = data
  }

  /**
   * 发送指令
   * @param {MessageData} data 
   * @returns {Promise<Messager>}
   */
  send (data: MessageData) {
    return this.port.send({ ...data, sid: this.id })
  }

  /**
   * 回复指令
   * @param {MessageData} data 
   */
  reply (data: MessageData) {
    if (this.state === MessageOwnerStateKind.Active) {
      this.state = MessageOwnerStateKind.Replied
      this.send({ ...data, command: 'message::callback' })
    }
  }

  /**
   * 回复收到指令
   */
  receive () {
    if (this.state === MessageOwnerStateKind.Active) {
      this.state = MessageOwnerStateKind.Replied
      this.send({ command: 'message::received' })
    }
  }
}


export enum MessageTransportStateKind {
  // 活跃
  Ready = 1,
  // 空闲
  Connected = 2,
  // 销毁
  Disconnected = 4,
  // 错误
  Error = 8
}

/**
 * 终端
 */
export abstract class MessageTransport<
  T extends MessageTransportPort = MessageTransportPort, 
  S extends MessageTransportStateKind = MessageTransportStateKind,
  Command extends MessageTransportCommands = MessageTransportCommands,
> extends EventEmitter<`open` | `close` | `message` | `error` | string> {
  public state: S
  public port: T | null = null
  
  // 指令集
  public commands: Map<Command, MessageHandle> | null = new Map()

  constructor () {
    super()
    this.state = MessageTransportStateKind.Ready as S
  }

  /**
   * 注册指令
   * @param {MessageCommands} command
   * @param {MessageHandle} handle 
   * @returns 
   */
  public command (command: Command, handle: MessageHandle) {
    this.commands?.set(command, async (messager: MessageOwner) => {
      const resp = await handle(messager)

      if (messager.command !== 'message::received') {
        resp !== undefined 
          ? messager.reply(resp) 
          : messager.receive()
      }
    })
    return this
  }

  /**
   * 注册基本指令
   */
  registerCommands () {
    [
      'message::received', 
      'message::callback', 
      'message::except',
    ].forEach(command => this.command(command as Command, async messager => { this.emit(messager.sid as string, messager)}))
  }
  
  // 连接
  connect (port: unknown): void {
    this.port = port as T
    this.registerCommands()
  }

  /**
   * 指令异常
   * @param {string} sid 
   * @param {any} error 
   */
  except (sid: string, error: any) {
    this.send({
      sid,
      command: 'message::except',
      payload: {
        message: error.message,
        stack: error.stack
      }
    })
  }

  abstract send (content: MessageData): Promise<MessageOwner>

  /**
   * 关闭终端
   */
  close () {
    this.port?.close()
  }

  /**
   * 处置
   */
  dispose () {
    this.close()
  }

  /**
   * 终端描述
   * @returns {{}} 
   */
  toJSON (): unknown {
    return {
      state: this.state
    }
  }
}