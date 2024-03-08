import { defineReadOnly } from '@at/utils'
import { EventEmitter } from './events'
import { SubscribeHandle } from './subscribable'
import { Subscribable } from './subscribable'
import { nextTick } from './microtask'
import { MessageData, MessageOwner, MessageTransport } from './transport'

//// => Api 类型定义
// Api 参数
export interface ApiParameter {
  name: string,
  description?: string,
  type: string,
  optional?: boolean,
  required?: boolean,
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
  const sliceIndex = parameters.findIndex(parameter => parameter.optional || (parameter.required === false))
  const requires = parameters.slice(0, sliceIndex === -1 ? parameters.length : sliceIndex)

  if (args.length !== requires.length) {
    throw new TypeError(`Incorrect number of parameters.`)
  }

  let i = 0
  for (i; i < args.length; i++) {
    const parameter = requires[i]
    const type = parameter.type

    if (args[i] === undefined) {
      if (parameter.optional) {
        continue
      }
    }

    switch (type.toLowerCase()) {
      case 'any':
        break
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
// 基础 Api 类
export interface BaseApi<T extends string> { }

export abstract class BaseApi<T extends string> extends EventEmitter<T | string> {
  // => port
  // MessagePort 封装，主要抹平 NodeJS / 浏览器 MessagePort 接口
  protected _port: MessageTransport | null = null
  public get port() {
    return this._port
  }
  public set port(port: MessageTransport | null) {
    if (
      this._port === null || 
      this._port !== port
    ) {
      port?.command('message::api', async (message: MessageOwner) => {
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

      this._port = port
    }
  }

  // Api 接口版本
  public version: string
  // Api 指令集
  public commands: ApiSubscribables = new ApiSubscribables()

  /**
   *
   * @param {ApiJSON} api
   * @param {MessageTransport | null} port
   */
  constructor(api: ApiJSON, port: MessageTransport | null = null) {
    super()
    this.port = port

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
   * 定义 Api，通过文件定义接口，详情看 @at/api 包实现
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

        if (isEvent) {
          this.on(api, (api: string, ...rests: unknown[]) => {
            return (proxy as EventEmitter<string>).emit(api, ...rests[0] as unknown[])
          })
        } else {
          this.subscribe(api, (...rests: unknown[]) => {
            return (proxy as ApiSubscribables).publish(action.name, ...rests as unknown[])
          })
        }
        
        const func = async (...parameters: unknown[]) => {
          checkApiParameters(parameters, action.parameters)

          if (isEvent) {
            nextTick(() => (proxy as EventEmitter<string>).emit(...parameters as unknown[]))

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

  /**
   * 抽象 send 方法
   * @param {MessageData} data 
   */
  abstract send(data: MessageData): Promise<MessageOwner>

  /**
   * 订阅 Api 指令
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
   * 取消订阅 Api 指令
   * @param {string} name 
   * @param {Subscribable} subscribeHandle 
   * @returns {this}
   */
  unsubscribe(name: string, subscribeHandle: SubscribeHandle) {
    this.commands.unsubscribe(name, subscribeHandle)
    return this
  }
}
