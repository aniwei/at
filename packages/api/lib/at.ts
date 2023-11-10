import { invariant } from '@at/utils'
import { 
  ApiJSON, 
  BaseApi, 
  MessageContent, 
  MessageOwner, 
  MessageTransport 
} from '@at/basic'
import ApiManifestJSON from './manifest.json'

import { ApiTransport } from './transport'
import { EngineApiService } from './engine'
import { ClientApiService } from './client'


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
  Engine: EngineApiService,
  Client: ClientApiService
}

export class ApiService extends BaseApi<ApiEventKind> {
  static create (transport?: MessageTransport) {
    return new ApiService(transport)
  }

  public state: ApiStateKind = ApiStateKind.Created
  public queue: VoidFunction[] = []
  
  constructor (transport?: MessageTransport) {
    super(ApiManifestJSON as ApiJSON, transport ?? null)

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

  send (content: MessageContent): Promise<MessageOwner> {
    if (this.state & ApiStateKind.Connected) {
      invariant(this.transport)
      return this.transport.send(content)
    }

    return new Promise((resolve, reject) => {
      this.queue.push(() => {
        this.send(content).then(resolve).catch(reject)
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
   * @param {ApiTransport} transport 
   * @returns {void}
   */
  connect (transport: ApiTransport): void {
    this.state |= ApiStateKind.Created

    transport.on('error', () => {
      this.state = ApiStateKind.Error
      this.emit('error', this.state)
    }).on('close', () => {
      this.state = ApiStateKind.Disconnected | ApiStateKind.Connected
      this.emit('disconnected', this.state)
    })

    this.state |= ApiStateKind.Connecting
    this.transport = transport
  }

  /**
   * 断开
   */
  disconnect () {
    this.transport?.close()
  }
}

