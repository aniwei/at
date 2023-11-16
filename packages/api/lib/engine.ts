import { ApiSubscribables, EventEmitter } from '@at/basic'
import { AtEngineLifecycleKind } from '@at/engine'

export type EngineApiEvents = (
  "runtime.state.change" |
  'runtime.lifecycle.change' |
  'resource.canvaskit.loader.change' |
  'resource.fonts.loader.change' 
)

// => 生命周期事件对象
export interface EngineApiLifecycleEvent {
  state: AtEngineLifecycleKind
}

export interface EngineApiCommand extends ApiSubscribables {
}

export interface EngineApiEvent extends EventEmitter<EngineApiEvents> {
  publish (name: EngineApiEvents, parameters: unknown[]): Promise<void>
}

export interface EngineApiService {
  commands: EngineApiCommand,
  events: EngineApiEvent
}