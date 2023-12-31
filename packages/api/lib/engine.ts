import { ApiSubscribables, EventEmitter } from '@at/basic'
import { EngineLifecycleKind } from '@at/engine'

export type EngineApiEvents = (
  'runtime.state.change' |
  'runtime.lifecycle.change' |
  'resource.canvaskit.loader.change' |
  'resource.fonts.loader.change' |
  'pipeline.flush.start' |
  'pipeline.flush.end' |
  'pipeline.layout.start' |
  'pipeline.layout.end' |
  'pipeline.paint.start' |
  'pipeline.paint.end' |
  'view.composite.start' |
  'view.composite.end'
)

// => 生命周期事件对象
export interface EngineApiLifecycleEvent {
  state: EngineLifecycleKind
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