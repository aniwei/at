import debug from 'debug'
import { invariant } from 'ts-invariant'
import { EventEmitter } from './events'
import { 
  MessageContent, 
  MessageError, 
  MessageOwner, 
  MessageTransport, 
  MessageTransportPort, 
  MessageTransportKind,
  MessageTransportCommands, 
} from './message-transport'

const worker_print = debug('at:worker')

/**
 * 
 */
export class WorkerMessagePort extends EventEmitter<'message' | 'error' | 'close'> implements MessageTransportPort {
  private port: MessagePort

  constructor (port: MessagePort) {
    super()
    this.port = port
    this.port.onmessage = (event) => {
      this.emit('message', event)
    }
    this.port.onmessageerror = (error) => {
      this.emit('error', error)
    }
  }

  removeAllListeners (event?: string): this {
    return this
  }

  send (message: unknown): void {
    this.port.postMessage(message)
  }

  close () {
    this.removeAllListeners()
    this.port.onmessage = null
    this.port.onmessageerror = null
    this.port.close()
  }
}


/**
 * 
 */
export class WorkerTransport extends MessageTransport<WorkerMessagePort> {
  
  protected index = 0
  protected registerCommands () {
    super.registerCommands()
  }

  /**
   * 
   * @param {WorkerMessagePort} transport 
   */
  connect (transport: WorkerMessagePort) {
    transport.on('message', async event => {
      let content
      
      try {
        content = event.data

        worker_print(`接受数据 %o`, content)
        
        const messager = new MessageOwner(this, content)
        const handle = this.commands?.get(content.command)

        if (handle) {
          await handle(messager)
        }
      } catch (error: any) {
        if (content?.id) {
          this.except(content.id, error)
        }
      }
    }).on('error', (error: any) => {
      this.emit('error', error)
    }).on('close', () => {        
      super.close()
      
      this.transport?.removeAllListeners()
      this.transport = null
      this.commands = null
      this.state = MessageTransportKind.Destroyed

      this.emit('close')
    })

    super.connect(transport)
  }

  /**
   * 
   * @param {MessageContent} content 
   * @returns {Promise<MessageOwner>}
   */
  send (content: MessageContent): Promise<MessageOwner> {
    invariant(this.isActive, `通信管道已销毁，无法发送`)

    return new Promise((resolve, reject) => {
      const id = `id_` + String(this.index++)

      try {
        const data ={ ...content, id }

        worker_print(`发送数据 %o`, content)
        
        this.transport?.send(data)
        this.once(id, messager => {
          messager.command === MessageTransportCommands.Except
          ? reject(new MessageError(messager)) 
          : resolve(messager)
        })
      } catch (error: any) {
        this.except(content.id!, error)
        reject(error)
      }
    })
  }
}

