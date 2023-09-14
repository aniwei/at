import invariant from 'ts-invariant'
import { AppProtocol, EventEmitter } from '@at/framework'
import type * as Protocol from './protocol'

const ReflectDefineProperty = Reflect.defineProperty


export class AtInspector extends EventEmitter<string> {
  static create () {
    return new AtInspector()
  }

  // => stage
  private _stage: Protocol.Stage | null = null
  public get stage (): Protocol.Stage {
    invariant(this._stage !== null)
    return this._stage
  }

  // => layer
  private _layer: Protocol.Layer | null = null
  public get layer (): Protocol.Layer {
    invariant(this._layer !== null)
    return this._layer
  }

  // => version
  private _version: string | null = null
  public get version (): string {
    invariant(this._version !== null)
    return this._version
  }
  public set version (value: string) {
    this._version = value
  }

  register (protocol: AppProtocol) {
    this.version = protocol.version

    for (const { domain: name, commands, events } of protocol.domains) {
      const key = `_${name.toLowerCase()}`
      const domain = Object.create(new EventEmitter())

      for (const command of commands) {
        const invoker = (...parameters: unknown[]) => this.emit(`${name}.${command.name}`, parameters)
        
        ReflectDefineProperty(domain, command.name, {
          get: () => invoker
        })  
      }

      ReflectDefineProperty(this, key, {
        get: () => domain
      })
    }
  }
}