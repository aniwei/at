import { AtInstance } from './at'

export class App extends AtInstance {
  static create () {
    return new App()
  }
}