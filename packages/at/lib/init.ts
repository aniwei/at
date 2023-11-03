import { invariant } from 'ts-invariant'
import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'

export enum AtStateKind {
  Uninitialized,
  Initializing,
  Initialized,
}

export interface Environments {
  SKIA_URI: string
}

export class AtInit {
  static create () {
    return new AtInit()
  }

  // => skia
  // Skia Runtime 对象
  public _skia: CanvasKit | null = null
  public get skia () {
    invariant(this._skia)
    return this._skia
  }
  public set skia (skia: CanvasKit) {
    this._skia = skia
  }

  // skia 对象加载状态
  public state: AtStateKind = AtStateKind.Uninitialized
  // skia 队列
  protected queue: VoidFunction[] = []
  protected envs: Environments

  constructor () {
    this.envs = process.env as unknown as  Environments
  }

  /// => utility
  env (key: string, defaultEnv?: string) {
    if (Reflect.has(this.envs, key)) {
      return Reflect.get(this.envs, key)
    }

    return defaultEnv
  }

  /**
   * 
   * @param {string} uri 
   * @returns {CanvasKit}
   */
  ensure (uri: string) {
    if (this.state === AtStateKind.Initialized) {
      invariant(this.skia !== null)
      return Promise.resolve(this.skia as CanvasKit)
    } else if (this.state === AtStateKind.Initializing) {
      return new Promise((resolve) => this.queue.push(() => resolve(this.skia as CanvasKit)))
    } else {
      this.state = AtStateKind.Initializing
      return CanvasKitInit({
        locateFile: () => uri
      }).then((skia: CanvasKit) => {
        this.skia = skia
        this.state = AtStateKind.Initialized

        do {
          const callback = this.queue.shift() ?? null
          if (typeof callback === 'function') {
            Reflect.apply(callback, undefined, [])
          }
        } while (this.queue.length > 0)

      }).then(() => this.skia as CanvasKit)
    }
  }

  /// => basic utility
  fetch (uri: RequestInfo, init?: RequestInit) {
    return fetch(uri, init)
  }
}

export const At = AtInit.create()