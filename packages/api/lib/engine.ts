import { ApiSubscribables, EventEmitter } from '@at/basic'

export type EngineApiEvents = (
  'Runtime.Lifecycle.Update' |
  "Runtime.State.Update" |
  'Resource.CanvasKit.Loader.Update' |
  'Resource.Fonts.Loader.Update' 
)

export interface EngineApiCommand extends ApiSubscribables {}
export interface EngineApiEvent extends EventEmitter<EngineApiEvents> {
  publish (name: EngineApiEvents, parameters: unknown[]): Promise<void>
}

export interface EngineApiService {
  commands: EngineApiCommand,
  events: EngineApiEvent
}