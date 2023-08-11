export type SubscribeHandle = (...args: any[]) => void 
export type Subscriber<T extends SubscribeHandle> = {
  handler: T ,
  context: unknown, 
  once: boolean
}

export class Subscribable<T extends SubscribeHandle = SubscribeHandle> {
  private subscribers: Subscriber<T>[] = []

  subscribe (
    handler: T, 
    context?: unknown, 
    once: boolean = false
  ) {
    if (typeof handler !== 'function') {
      throw new TypeError('The listener handler must be a function.')
    }
  
    const listener: Subscriber<T> = {
      handler,
      context,
      once
    }
  
    this.subscribers.push(listener)    
  }

  once ( 
    handler: T, 
    context?: unknown,
  ) {
    this.subscribe(handler, context, true)
  }

  unsubscribe (
    handler?: T, 
    context?: unknown
  ) {
  
    for (const listener of this.subscribers) {
      const index = this.subscribers.findIndex((findListener: Subscriber<T>) => {
        return (
          listener.handler === handler &&
          listener.context === context
        )
      })
      
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }

    
  }

  publish (...args: any[]) {
    for (const listener of this.subscribers) {
      try {
        Reflect.apply(listener.handler, listener.context, args)
        if (listener.once) {
          this.unsubscribe(listener.handler, listener.context)
        }
      } catch (error: any) {
        throw error
      }
    }
  }

  clear () {
    this.subscribers = []
  }
}

