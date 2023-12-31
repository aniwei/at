import { defineReadOnly } from '@at/utils'
import { EventEmitter } from './events'
import { SubscribeHandle } from './subscribable'
import { Subscribable } from './subscribable'
import { nextTick } from './microtask'
import { MessageContent, MessageOwner, MessageTransport } from './transport'

//// => Api 类型定义
// Api 参数
export interface ApiParameter {
  name: string,
  description?: string,
  type: string,
  enum?: string[]
}

// Api Action
export interface ApiAction {
  name: string,
  description?: string,
  parameters: ApiParameter[]
}

export interface ApiCommand extends ApiAction { }
export interface ApiEvent extends ApiAction { }

// Api 域
export interface ApiDomain {
  name: string,
  description?: string,
  dependencies?: string[],
  types: string[],
  commands: ApiCommand[],
  events: ApiEvent[]
}

// Api JSON 结构
export interface ApiJSON {
  version: string,
  domains: ApiDomain[]
}


//// => 
 export class ParameterError extends Error {
  constructor (parameter: ApiParameter) {
    super(`The parameter "${parameter.name}" expected "${parameter.type}" type.`)
  }
 }

/**
 * 检查 API 参数是否合法
 * @param {unknown[]} args
 * @param {ApiParameter[]} parameters
 */
const checkApiParameters = (args: unknown[], parameters: ApiParameter[]) => {
  if (args.length !== parameters.length) {
    throw new TypeError(`Incorrect number of parameters.`)
  }

  let i = 0
  for (i; i < args.length; i++) {
    const parameter = parameters[i]
    const type = parameter.type
    switch (type.toLowerCase()) {
      case 'array':
        if (!Array.isArray(args[i])) {
          throw new ParameterError(parameter)
        }
        break
      case 'enum':
        if (typeof args[i] !== 'string' || !parameter.enum?.includes(args[i] as string)) {
          throw new ParameterError(parameter)
        }
        break
      default:
        if (typeof args[i] !== type) {
          throw new ParameterError(parameter)
        }
        break
    }
  }
}


//// => ApiSubscribables
/**
 * Api 负载
 */
export interface ApiPayload {
  type: 'Command' | 'Event',
  name: string,
  parameters: unknown[]
}

export class ApiSubscribables extends Map<string, Subscribable> {
  /**
  */
  subscribe(name: string, subscribeHandle: SubscribeHandle) {
    if (!this.has(name)) {
      this.set(name, new Subscribable())
    }

    const subscribable = this.get(name) as Subscribable
    subscribable.subscribe(subscribeHandle)
    return this
  }

  /**
  */
  unsubscribe(name: string, subscribeHandle?: SubscribeHandle) {
    if (subscribeHandle === this.unsubscribe) {
      this.delete(name)
    } else {
      const subscribable = this.get(name) as Subscribable ?? null
      if (subscribable !== null) {
        subscribable.unsubscribe(subscribeHandle)

        if (subscribable.size === 0) {
          this.delete(name)
        }
      }
    }

    return this
  }

  async publish(...rests: unknown[]): Promise<unknown>
  async publish(name: string, ...rests: unknown[]) {
    const subscribable = this.get(name) as Subscribable ?? null
    if (subscribable !== null) {
      return await subscribable.publish(...rests)
    }
  }
}

//// => BaseApi
export interface BaseApi<T extends string> { }

export abstract class BaseApi<T extends string> extends EventEmitter<T | string> {
  // => transport
  protected _transport: MessageTransport | null = null
  public get transport() {
    return this._transport
  }
  public set transport(transport: MessageTransport | null) {
    if (this._transport === null || this._transport !== transport) {
      transport?.command('message::api', async (message: MessageOwner) => {
        const payload = message.payload as unknown as ApiPayload

        switch (payload.type) {
          case 'Command':
            return message.reply({
              payload: await this.commands.publish(payload.name as T, ...payload.parameters) as {}
            })
          case 'Event':
            this.emit(payload.name as T, ...payload.parameters)
            break
        }
      })

      this._transport = transport
    }
  }

  public version: string
  public commands: ApiSubscribables = new ApiSubscribables()

  /**
   *
   * @param {ApiJSON} api
   * @param {MessageTransport | null} transport
   */
  constructor(api: ApiJSON, transport: MessageTransport | null = null) {
    super()
    this.transport = transport

    this.version = api.version
    this.registerApi(api.domains)
  }

  /**
   * 定义 Api
   * @param {ApiDomain[]} domains
   */
  private registerApi(domains: ApiDomain[]) {
    for (const domain of domains) {
      this.defineApi(domain)
    }
  }

  /**
   * 定义
   * @param {ApiDomain} domain
   */
  private defineApi(domain: ApiDomain) {
    const defineApiImpl = (
      type: 'Command' | 'Event',
      actions: ApiAction[]
    ) => {
      const isEvent = type === 'Event'

      const proxy = isEvent
        ? new EventEmitter<string>()
        : new ApiSubscribables()

      for (const action of actions) {
        const api = `${domain.name}.${type}.${action.name}`
        
        this.on(api, (api: string, ...rests: unknown[]) => (proxy as EventEmitter<string>).emit(api, ...rests[0] as unknown[]))
        this.subscribe(api, (api, ...rests: unknown[]) => (proxy as ApiSubscribables).publish(api, ...rests[0] as unknown[]))

        const func = async (...parameters: unknown[]) => {
          checkApiParameters(parameters, action.parameters)

          if (isEvent) {
            nextTick(() => (proxy as EventEmitter<string>).emit(...parameters[0] as unknown[]))

            const result = await this.send({
              command: 'message::api',
              payload: {
                name: api,
                type,
                parameters
              }
            })
  
            return result?.payload
          }

          if ((proxy as ApiSubscribables).has(parameters[0] as string)) {
            const result = await nextTick(() => {
              return (proxy as ApiSubscribables).publish(...parameters[0] as unknown[])
            })

            return result
          }
          
          const result = await this.send({
            command: 'message::api',
            payload: {
              name: api,
              type,
              parameters
            }
          })

          return result?.payload
        }

        defineReadOnly(
          proxy, 
          action.name, 
          func
        )
      }

      return proxy
    }

    defineReadOnly(this, domain.name, {
      commands: defineApiImpl('Command', domain.commands),
      events: defineApiImpl('Event', domain.events)
    })
  }

  abstract send(content: MessageContent): Promise<MessageOwner>

  /**
   * 订阅
   * @param {string} name 
   * @param {SubscribeHandle} subscribeHandle 
   * @returns {this}
   */
  subscribe(
    name: string,
    subscribeHandle: SubscribeHandle
  ) {
    this.commands.subscribe(name, subscribeHandle)
    return this
  }

  /**
   * 取消订阅
   * @param {string} name 
   * @param {Subscribable} subscribeHandle 
   * @returns {this}
   */
  unsubscribe(name: string, subscribeHandle: SubscribeHandle) {
    this.commands.unsubscribe(name, subscribeHandle)
    return this
  }
}
