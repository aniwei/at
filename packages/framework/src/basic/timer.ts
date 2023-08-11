import invariant from 'ts-invariant'
import { At } from '../at'
import { VoidCallback } from '../at'



export class Timer {
  static periodic (callback: VoidCallback, duration: number) {
    return Timer.create(callback, duration, true)
  }

  static timeout (callback: VoidCallback, timeout: number) {
    return Timer.create(callback, timeout, false)
  }

  static throttle (callback: VoidCallback, duration: number) {
    const timer = Timer.timeout(() => {
      callback()
      timer.cancel()
    }, duration)

    return timer
  }

  static create (callback: VoidCallback, duration: number, periodic: boolean = false) {
    return new Timer(callback, duration, periodic)
  }
  
  protected id: number | null = null
  protected periodic: boolean = false
  
  constructor (
    callback: VoidCallback, 
    duration: number,
    periodic: boolean = false
  ) {
    this.id = periodic 
      ? At.window.setInterval(callback, duration)
      : At.window.setTimeout(callback, duration)

    this.periodic = periodic
  }
  
  cancel () {
    invariant(this.id)
    if (this.id !== null) {
      this.periodic 
        ? At.window.clearInterval(this.id)
        : At.window.clearTimeout(this.id)

      this.id = null
    }
  }
}