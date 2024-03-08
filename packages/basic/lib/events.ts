// 事件处理器函数类型
type ListenerHandler = (...args: any[]) => void 
// 事件处理对象
type Listener = {
  handler: ListenerHandler, 
  context: unknown, 
  once: boolean
}

//// => EventEmitter
export class EventEmitter<T extends string> {
  protected events: Map<T, Listener[]> = new Map()

  // 获取所有时间名
  eventNames () {
    return Object.entries(this.events).map(([event]) => event)
  }

  // 获取事件处理对象
  listeners (event: T) {
    return this.events.get(event) ?? []
  }

  // 获取事件处理个数
  listenerCount (event: T) {
    const listeners = this.events.get(event) ?? []
    return listeners.length
  }

  // 触发事件
  emit (...rests: unknown[]): boolean
  emit (event: T, ...rests: unknown[]) {
    if (this.events.has(event)) {
      const listeners = this.events.get(event)

      if (listeners) {
        for (const listener of listeners) {
          if (listener.once) {
            this.removeListener(event, listener.handler, undefined, true)
          }

          Reflect.apply(listener.handler, listener.context, rests)
        }
      }
      
      return true
    }

    return false
  }

  // 监听事件
  on (event: T, handler: ListenerHandler, context?: unknown) { 
    return this.addListener(event, handler, context, false)
  }

  // 监听一次性事件
  once (event: T, handler: ListenerHandler, context?: unknown) { 
    return this.addListener(event, handler, context, true)
  }

  // 移除事件
  /**
   * 
   * @param event 
   * @param handler 
   * @param context 
   * @returns 
   */
  off (event: T, handler?: ListenerHandler, context?: unknown) {
    return this.removeListener(event, handler, context)
  }

  // 增加事件
  addListener (
    event: T, 
    handler: ListenerHandler, 
    context: unknown, 
    once: boolean
  ) {
    if (typeof handler !== 'function') {
      throw new TypeError('The listener handler must be a function.')
    }
  
    const listener: Listener = {
      context,
      handler,
      once,
    }
  
    if (this.events.has(event)) {
      this.events.get(event)?.push(listener)
    } else {
      this.events.set(event, [listener])
    }
  
    return this
  }

  // 移除事件
  removeListener (event: T, handler?: ListenerHandler, context?: unknown, once?: boolean) {
    if (this.events.has(event)) {
      if (handler === undefined) {
        this.events.delete(event)
      }
    } else {
      const listeners = this.events.get(event)

      if (listeners) {
        for (const listener of listeners) {
          const index = listeners.findIndex((findListener: Listener) => {
            return (
              listener.handler === handler &&
              listener.context === context &&
              listener.once === once
            )
          })
          
          if (index > -1) {
            listeners.splice(index, 1)
          }
        }

        if (listeners.length === 0) {
          this.events.delete(event)
        }
      }
    } 

    return this
  }

  // 移除所有
  removeAllListeners (event?: T) {
    if (event) {
      this.removeListener(event)
    } else {
      this.events.clear()
    }
  
    return this
  }
}

