import { AtInstance } from './at'

export class App extends AtInstance {
  static create (...rests: unknown[]) {
    return super.create(...rests) as App
  }

  bindings(): Promise<void> {
    return Promise.resolve()
  }
}