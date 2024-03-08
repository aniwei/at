import { ApiSubscribables, EventEmitter } from '@at/basic'

export type DocumentApiEvents = (
  'statechange' |
  'progress' |
  'error' |
  'end'
)

export interface DocuemntApiCommand extends ApiSubscribables { 
  load: (uri: string) => Promise<void>
}

export interface DocumentApiEvent extends EventEmitter<DocumentApiEvents> {
  publish (name: DocumentApiEvents, parameters: unknown[]): Promise<void>
}

export interface DocumentApiService {
  commands: DocuemntApiCommand,
  events: DocumentApiEvent
}