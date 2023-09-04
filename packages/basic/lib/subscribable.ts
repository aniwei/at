// 订阅处理器
export type SubscribeHandle = (...rests: unknown[]) => void 
// 订阅器存储结构
export type Subscriber<T extends SubscribeHandle> = {
  handler: T ,
  context: unknown, 
  once: boolean
}

/**
 * 订阅类
 */
export class Subscribable<T extends SubscribeHandle = SubscribeHandle> {
  protected subscribers: Subscriber<T>[] = []

  /**
   * 订阅消息
   * @param {T} handler 
   * @param {unknown} context?
   * @param {boolean} once = false
   */
  subscribe (
    handler: T, 
    context?: unknown, 
    once: boolean = false
  ) {
    if (typeof handler !== 'function') {
      throw new TypeError('The listener handler must be a function.')
    }
  
    this.subscribers.push({ handler, context, once })    
  }

  /**
   * 一次订阅
   * @param {T} handler 
   * @param {unknown} context 
   */
  once ( 
    handler: T, 
    context?: unknown,
  ) {
    this.subscribe(handler, context, true)
  }

  /**
   * 取消订阅
   * @param {T} handler ?
   * @param {unknown} context? 
   */
  unsubscribe (
    handler?: T, 
    context?: unknown,
    once: boolean = false
  ) {
  
    for (const listener of this.subscribers) {
      const index = this.subscribers.findIndex((findListener: Subscriber<T>) => {
        return (
          listener.handler === handler &&
          listener.context === context &&
          listener.once === once
        )
      })
      
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  /**
   * 发布消息
   * @param {unknown[]} rests 
   */
  publish (...rests: unknown[]) {
    for (const listener of this.subscribers) {
      try {
        Reflect.apply(listener.handler, listener.context, rests)
        if (listener.once) {
          this.unsubscribe(listener.handler, listener.context)
        }
      } catch (error: any) {
        throw error
      }
    }
  }

  /**
   * 清除
   */
  clear () {
    this.subscribers = []
  }
}

