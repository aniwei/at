import { paddingLeft, invariant } from '@at/utils'
import { EventEmitter } from './events'
import { 
  MessageFiber, 
  MessageReceivers, 
  MessageSender 
} from './message'
import { 
  MessageData, 
  MessageError,
  MessageOwner, 
  MessageTransport, 
  MessageTransportCommands, 
  MessageTransportPort, 
  MessageTransportStateKind 
} from './transport'

//// => 
// 统一 Node / Browser MessagePort 定义
export interface MessagePort {
  onmessage: null | ((data: MessageEvent<unknown>) => void)
  onmessageerror?: null | ((error: any) => void),
  onerror?: null | ((error: any) => void),
  onopen?: null | (() => void),
  onclose?: null | (() => void),
  postMessage?: (value: any, transferList?: ReadonlyArray<any>) => void
  send?: (value: any, transferList?: ReadonlyArray<any>) => void
  close: () => void
}

//// => WorkPort 
// 统一 MessagePort 接口
export interface WorkPortFactory<T> {
  create (...rests: unknown[]): T,
  new (...rests: unknown[]): T,
  create (port: MessagePort): T,
  new (port: MessagePort): T,
}
export class WorkPort<T extends string = string> extends EventEmitter<'open' | 'message' | 'error' | 'close' | 'connected' | T> implements MessageTransportPort {
  static create <T> (...rests: unknown[]): T
  static create <T> (port: MessagePort): T {
    const WorkPortFactory = this as unknown as WorkPortFactory<T>
    return new WorkPortFactory(port)
  }

  // => MessagePort
  protected port: MessagePort

  constructor (port: MessagePort) {
    super()

    port.onmessage = this.handleMessage
    port.onmessageerror = this.handleError
    port.onerror = this.handleError
    port.onclose = this.handleClose
    port.onopen = this.handleOpen

    this.port = port
  }

  handleMessage = (...args: unknown[]) => this.emit('message', ...args)
  handleError = (error: unknown) => this.emit('error', error)
  handleOpen = (...args: unknown[]) => this.emit('open', ...args)
  handleClose = (...args: unknown[]) => this.emit('close', ...args)
  
  // 发送数据
  send (...rests: unknown[]): void
  send (message: unknown) {
    this.port.postMessage 
      ? this.port.postMessage(message as string) 
      : this.port.send ? this.port.send(message as string) : null
  }

  dispose () {
    this.close()
  }

  // 关闭连接
  close () {
    this.port.onmessage = null
    this.port.onmessageerror = null
    this.port.onopen = null
    this.port.close()
  }
}

// => 信息引用
export interface MessageRef {
  id: string | number,
  t: number,
}

//// => WorkTransport
// 封装 MessagePort 
export class WorkTransport<T extends string = string> extends MessageTransport<WorkPort<T>> {
  // concurrently count
  static CONCURRENTLY = 1280
  // 50s
  static TIMEOUT = 15 * 1000

  // => index
  public _index: number = 0
  public get index () {
    let index = (this._index++)
    if (index >= Number.MAX_SAFE_INTEGER) {
      index = this._index = 0
    }
    
    return paddingLeft(index, MessageFiber.ID_LENGTH)
  }

  public timerId: number | null = null
  public refs: Map<string, MessageRef> = new Map()

  async handleMessage (event: MessageEvent) {
    return MessageReceivers.receive(event, async (data) => {
      const message = new MessageOwner(this, data as MessageData<{ [key: string]: unknown} >)
      try {
        const handle = this.commands?.get(message.command as string)

        if (handle) {
          await handle(message)
        } else {
          
        }
      } catch (error: any) {
        if (message?.id) {
          this.except(message.id, error)
        }
      }
    })
  }

  protected clean () {
    const now = Date.now()

    for (const [id, ref] of this.refs) {
      if (now > ref.t) {
        this.emit(id, new MessageOwner(this, {
          id: '',
          sid: id,
          command: 'message::except',
          payload: {
            message: 'Request timeout.'
          }
        }))

        this.unregister(id)
      }
    }
  }

  /**
   * 注册消息
   * @param {string} id 
   */
  protected register (id: string, content: MessageData) {
    if (content && content.command !== 'message::received') {
      if (this.timerId !== null) {
        clearTimeout(this.timerId as number)
        this.timerId = null
      }
  
      this.refs.set(id, {
        id,
        t: Date.now() + WorkTransport.TIMEOUT
      })
  
      this.timerId = setTimeout(() => {
        this.timerId = null
        this.clean()
      }, WorkTransport.TIMEOUT) as unknown as  number
    }
  }

  protected unregister (id: string) {
    if (this.refs.has(id)) {
      this.refs.delete(id)
    }

    if (this.timerId !== null && this.refs.size === 0) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  /**
   * 连接
   * @param {string} port 
   * @param {WorkPort} port 
   */
  connect (port: unknown): void
  connect (port: WorkPort) {
    ;(port as WorkPort).on('message', this.handleMessage.bind(this)).on('error', (error: any) => {
      this.port = null
      this.state = MessageTransportStateKind.Error

      ;(port as WorkPort).removeAllListeners()
      this.emit('error', error)
    }).on('close', () => {
      this.port = null
      this.state = MessageTransportStateKind.Disconnected

      ;(port as WorkPort).removeAllListeners()
      this.emit('close')
    }).on('open', () => {
      this.state = MessageTransportStateKind.Connected
      this.emit('open')
    })

    super.connect(port)
  }

  /**
   * 发送数据
   * @param {MessageData} content 
   * @returns {Promise<unknown>}
   */
  send (...rests: unknown[]): Promise<MessageOwner>
  send (content: MessageData<string | { [key: string]: unknown }, MessageTransportCommands>): Promise<MessageOwner> {
    return new Promise(async (resolve, reject) => {
      const id = `message::id::${this.index}`

      this.once(id, (messager: MessageOwner) => {
        this.unregister(id)

        messager.command === 'message::except' 
          ? reject(new MessageError(messager)) 
          : resolve(messager)
      })

      if (this.refs.size > WorkTransport.CONCURRENTLY) {
        console.warn('Too many concurrent messages.')
      }

      this.register(id, content)

      try {        
        invariant(this.port, 'The "WorkTransport.port" cannot be null')
        const sender = new MessageSender(id, this.port)
        sender.send({
          ...content,
          id,
          state: this.state
        })  
      } catch (error: any) {
        this.unregister(id)

        this.except(content.id!, error)
        reject(error)
      }
    })
  }

  dipose () {
    this.port?.dispose()
    this.removeAllListeners()
  }
}
