import { EventEmitter } from './events'

/**
 * 基础指令集
 */
export enum MessageTransportCommands {
  // 接受信息
  Received = 'message::received',
  // 回调
  Callback = 'message::callback',
  // 异常
  Except = 'message::except',
  // 发送指令
  Message = 'message::content',
  // 连接指令
  Connect = 'endpoint::connect',
  // 终端注册
  Register = `endpoint::register`,
}

/**
 * 指令处理函数
 */
type MessageHandle = (messager: MessageOwner) => Promise<MessageOwner | MessageContent | void> | void

export type MessageContent<T = {
  [key: string]: unknown
} | string, C extends MessageTransportCommands = MessageTransportCommands> = {
  id?: string,
  sid?: string
  command?: C,
  count?: number,
  payload?: T,
}

export enum MessageOwnerState {
  Active = 1,
  Replied = 2
}

export abstract class MessageTransportPort {
  abstract send (message: unknown): void
  abstract close (): void
  abstract on (event: 'message' | 'close' | 'error', listener: () => void): this;
  abstract once (event: 'message' | 'close' | 'error', listener: () => void): this;
  abstract off (event: 'message' | 'close' | 'error', listener: () => void): this;
  abstract removeAllListeners (event?: string | symbol): this
}

export class MessageError extends Error {
  public sid: string
  public detail: string
  public command: MessageTransportCommands

  /**
   * 
   * @param messager 
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
    this.stack = payload?.stack
  }
}

/**
 * 信息对象
 */
export class MessageOwner {
  public transport: MessageTransport
  public content: MessageContent
  public state: MessageOwnerState = MessageOwnerState.Active

  public get id () {
    return this.content.id
  }

  public get sid () {
    return this.content.sid
  }

  public get payload () {
    return this.content.payload
  }

  public get command () {
    return this.content.command
  }

  /**
   * 构造信息对象
   * @param {MessageTransport} transport 终端
   * @param {MessageContent} content 
   */
  constructor (transport: MessageTransport, content: MessageContent) {
    this.transport = transport
    this.content = content
  }

  /**
   * 发送指令
   * @param {MessageContent} content 
   * @returns {Promise<Messager>}
   */
  send (content: MessageContent) {
    return this.transport.send({ ...content, sid: this.id })
  }

  /**
   * 回复指令
   * @param {MessageContent} content 
   */
  reply (content: MessageContent) {
    if (this.state === MessageOwnerState.Active) {
      this.state = MessageOwnerState.Replied
      this.send({ ...content, command: MessageTransportCommands.Callback })
    }
  }

  /**
   * 回复收到指令
   */
  receive () {
    if (this.state === MessageOwnerState.Active) {
      this.state = MessageOwnerState.Replied
      this.send({ command: MessageTransportCommands.Received })
    }
  }
}


export enum MessageTransportState {
  // 销毁
  Destroyed = 0,
  // 未授权
  Active = 2,
  // 空闲的
  Idlling = 4,
  // 正在运行
  // 未授权
  Unauthorized = 8,
  // 已授权
  Authorized = 16,
  // 调试
  Inspecting = 32,
}

/**
 * 终端
 */
export abstract class MessageTransport<
  T extends MessageTransportPort = MessageTransportPort, 
  S extends MessageTransportState = MessageTransportState,
  Command extends MessageTransportCommands = MessageTransportCommands,
> extends EventEmitter<'message' | string> {
  public state: S
  public transport: T | null = null
  
  // 指令集
  public commands: Map<Command, MessageHandle> | null = new Map()

  /**
   * 激活状态
   */
  public get isActive () {
    return this.compare(MessageTransportState.Active)
  }

  constructor () {
    super()
    this.state = MessageTransportState.Active as S
  }

  /**
   * 状态比较
   * @param state 
   * @returns 
   */
  protected compare (state: MessageTransportState) {
    return (this.state & state) == state
  }

  /**
   * 注册指令
   * @param {MessageCommands} command
   * @param {MessageHandle} handle 
   * @returns 
   */
  command (command: Command, handle: MessageHandle) {
    this.commands?.set(command, async (messager: MessageOwner) => {
      const resp = await handle(messager)

      if (messager.command !== MessageTransportCommands.Received) {
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
  protected registerCommands () {
    [
      MessageTransportCommands.Callback, 
      MessageTransportCommands.Received, 
      MessageTransportCommands.Except
    ].forEach(command => this.command(command as Command, async messager => { this.emit(messager.sid as string, messager)}))
  }
  
  connect (transport: T): void {
    this.transport = transport
    this.registerCommands()
  }

  /**
   * 指令异常
   * @param sid 
   * @param error 
   */
  except (sid: string, error: any) {
    this.send({
      sid,
      command: MessageTransportCommands.Except,
      payload: {
        message: error.message,
        stack: error.stack
      }
    })
  }

  abstract send (content: MessageContent): Promise<MessageOwner>

  /**
   * 关闭终端
   */
  close () {
    this.transport?.close()
  }
}