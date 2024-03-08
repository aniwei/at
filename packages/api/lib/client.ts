import { ApiSubscribables, EventEmitter } from '@at/basic'

export type ClientApiEvents = (
  'pointer.event' |
  'viewport.resize'
)

// 客户端的指令集
export interface ClientApiCommand extends ApiSubscribables {
}

// 客户端出发事件
export interface ClientApiEvent extends EventEmitter<ClientApiEvents> {
  publish (name: ClientApiEvents, parameters: unknown[]): Promise<void>
}

export interface ClientApiService {
  commands: ClientApiCommand,
  events: ClientApiEvent
}