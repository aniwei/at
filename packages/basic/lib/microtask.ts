import { isNative } from './is'
import { VoidCallback } from './global.d'

export type MicroTask<T = unknown> = {
  context: T,
  handler: VoidCallback,
  resolve: (value: unknown) => void
}

export class MicroTaskQueue {
  static isUsingMicroTask = false

  // => microTaskExec
  static _exec: VoidCallback | null = null
  static get exec () {
    invariant(MicroTaskQueue._exec !== null)
    return MicroTaskQueue._exec
  }

  static q = new MicroTaskQueue()

  protected queue: MicroTask[]
  protected pendding: boolean = false

  enqueue <T = unknown> (tick: VoidCallback, resolve, context: T) {
    this.queue.push({
      handler: () => resolve(tick),
      context,
    })

    if (!this.pendding) {
      this.pendding = true
      MicroTaskQueue.microTaskExec()
    }
  }

  flush () {
    this.pending = false
    let q = this.queue.shift() ?? null

    while (q !== null) {
      Reflect.apply(q.handler, [], q.context)
      q = this.queue.shift() ?? null
    }
  }
}

// => nextTick
export const nextTick = (tick: VoidCallback, context?: unknown) => {
  return new Promise((resolve) => MicroTaskQueue.q.enqueue<T>(tick, resolve, context))
}

const flush = () => MicroTaskQueue.q.flush()

if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const promise = Promise.resolve()
  MicroTaskQueue._exec = () => promise.then(flush)
  MicroTaskQueue.isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  MicroTaskQueue._exec = () => setImmediate(flush)
} else {
  MicroTaskQueue._exec = () => setTimeout(flush, 0)
}