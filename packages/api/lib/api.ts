import { invariant } from '@at/utils'
import { 
  ApiJSON, 
  BaseApi, 
  MessageData, 
  MessageOwner, 
  MessageTransport 
} from '@at/basic'
import ApiProtocolJSON from './protocol.json'

import { ApiTransport } from './transport'
import { EngineApiService } from './engine'
import { ClientApiService } from './client'
import { DocumentApiService } from './document'


export type ApiEventKind = ''

export enum ApiStateKind {
  Created = 1,
  Connecting = 2,
  Connected = 4,
  Ready = 8,
  Disconnected = 16,
  Error = 32,
}

//// => ApiService
// Api 服务
export interface ApiService extends BaseApi<ApiEventKind> {
  engine: EngineApiService,
  client: ClientApiService,
  document: DocumentApiService,
}

export class ApiService extends BaseApi<ApiEventKind> {
  static create (transport?: MessageTransport) {
    return new ApiService(transport)
  }

  // Api 服务状态
  public state: ApiStateKind = ApiStateKind.Created
  // 队列
  public queue: VoidFunction[] = []
  
  constructor (transport?: MessageTransport) {
    super(ApiProtocolJSON as ApiJSON, transport ?? null)

    this.once('connected', () => {
      if (this.queue.length > 0) {
        let q = this.queue.shift() ?? null
        while (q !== null) {
          q()
          q = this.queue.pop() ?? null
        }
      }
    })
  }

  /**
   * 
   * @param {MessageData} content 
   * @returns {Promise<MessageOwner>}
   */
  send (data: MessageData): Promise<MessageOwner> {
    if (this.state & ApiStateKind.Connected) {
      invariant(this.port)
      return this.port.send(data)
    }

    return new Promise((resolve, reject) => {
      this.queue.push(() => {
        this.send(data).then(resolve).catch(reject)
      })
    })
  }

  /**
   * 连接
   * @param {unknown} uri 
   */
  connect (uri: unknown): void
  /**
   * 连接
   * @param {ApiTransport} port 
   * @returns {void}
   */
  connect (port: ApiTransport): void {
    this.state |= ApiStateKind.Created

    port.on('error', () => {
      this.state = ApiStateKind.Error
      this.emit('error', this.state)
    }).on('close', () => {
      this.state = ApiStateKind.Disconnected | ApiStateKind.Connected
      this.emit('disconnected', this.state)
    })

    this.state |= ApiStateKind.Connecting
    this.port = port
  }

  /**
   * 断开
   */
  disconnect () {
    this.port?.close()
  }
}

