import { isNative, invariant } from '@at/utils'


//// => MicroTaskQueue
export type MicroTask<T = unknown> = {
  context: T,
  handler: VoidFunction,
  resolve: (value: unknown) => void
}

export class MicroTaskQueue {
  static isUsingMicroTask = false

  // => microTaskExec
  static _exec: VoidFunction | null = null
  static get exec () {
    invariant(MicroTaskQueue._exec !== null)
    return MicroTaskQueue._exec
  }

  // => q
  // 微任务队列
  static _q: MicroTaskQueue | null = null
  static get q () {
    if (this._q === null) {
      this._q = new MicroTaskQueue()
    }

    return this._q
  }

  protected queue: MicroTask[] = []
  protected pending: boolean = false

  enqueue <T = unknown> (tick: VoidFunction, resolve: (value: unknown) => void, context: T) {
    this.queue.push({
      handler: () => resolve(tick()),
      context,
      resolve
    })

    if (!this.pending) {
      this.pending = true
      MicroTaskQueue.exec()
    }
  }

  flush () {
    this.pending = false
    let q = this.queue.shift() ?? null

    while (q !== null) {
      Reflect.apply(q.handler, q.context, [])
      q = this.queue.shift() ?? null
    }
  }
}

//// => nextTick
export const nextTick = (tick: VoidFunction, context?: unknown) => {
  return new Promise((resolve) => MicroTaskQueue.q.enqueue(tick, resolve, context))
}

const flush = () => MicroTaskQueue.q.flush()

if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const promise = Promise.resolve()
  MicroTaskQueue._exec = () => promise.then(flush)
  MicroTaskQueue.isUsingMicroTask = true
} else {
  MicroTaskQueue._exec = () => setTimeout(flush, 0)
}
