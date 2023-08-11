export type ListenerHandler = (...args: any[]) => void 
export type Listener<T extends ListenerHandler> = {
  handler: T ,
  context: unknown, 
}

export class Listenable<T extends ListenerHandler> {
  private listeners: Listener<T>[] = []

  addListener (
    handler: T, 
    context?: unknown, 
  ) {
    if (typeof handler !== 'function') {
      throw new TypeError('The listener handler must be a function.')
    }
  
    const listener: Listener<T> = {
      handler,
      context,
    }
  
    this.listeners.push(listener)    
  }

  removeListener (
    handler?: T, 
    context?: unknown
  ) {
  
    for (const listener of this.listeners) {
      const index = this.listeners.findIndex((findListener: Listener<T>) => {
        return (
          listener.handler === handler &&
          listener.context === context
        )
      })
      
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }

    
  }

  trigger (...args: any[]) {
    for (const listener of this.listeners) {
      try {
        Reflect.apply(listener.handler, listener.context, args)
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
        // error
      }
    }
  }

  clearListeners () {
    this.listeners = []
  }
}

