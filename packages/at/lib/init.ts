// @ts-nocheck
import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import { Skia } from '@at/engine'
import { invariant } from 'ts-invariant'
import { RefsRegistry } from './refs'


// extend CanvasKit
export interface AtCanvasKit extends CanvasKit {
  FilterQuality: Skia.FilterQuality
}

//// => AtInit
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
  public _skia: AtCanvasKit | null = null
  public get skia () {
    invariant(this._skia)
    return this._skia
  }
  public set skia (skia: AtCanvasKit) {
    skia.FilterQuality = Skia.FilterQuality
    this._skia = skia
  }

  // skia 对象加载状态
  public state: AtStateKind = AtStateKind.Uninitialized
  public refs: RefsRegistry = RefsRegistry.create()
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
        this.skia = skia as AtCanvasKit
        this.state = AtStateKind.Initialized

        do {
          const callback = this.queue.shift() ?? null
          if (typeof callback === 'function') {
            Reflect.apply(callback, undefined, [])
          }
        } while (this.queue.length > 0)

      }).then(() => this.skia)
    }
  }

  /// => basic utility
  /**
   * 
   * @param {VoidFunction} callback 
   */
  idle (callback: VoidFunction) {
    requestIdleCallback(callback)
  }

  /**
   * 
   * @param {RequestInfo} uri 
   * @param {RequestInit?} init 
   * @returns 
   */
  fetch (uri: RequestInfo, init?: RequestInit) {
    return fetch(uri, init)
  }
}