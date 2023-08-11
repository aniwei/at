export type DocumentProtocolCommandParameter = {
  name: string,
  description: string,
  $ref: string
}

export type DocumentProtocolCommand = {
  name: string,
  description: string,
  experimental?: boolean,
  parameters: DocumentProtocolCommandParameter[]
}

export type DocumentProtocolEvent = {
  name: string,
  description: string,
  experimental: boolean,
  parameters: DocumentProtocolCommandParameter[]
}

export type DocumentProtocolDomain = {
  domain: string,
  description: string,
  dependencies: string[],
  types: [],
  commands: DocumentProtocolCommand[],
  events: DocumentProtocolEvent[]  
}

export type DocumentProtocol = {
  version: string,
  domains: DocumentProtocolDomain[]
}

export declare interface Layer {
  dispatchSelectEvent (layerId: string, ): void
}

export declare interface Stage {
  dispatchDragEvent (type: 'dragStart' | 'dragUpdate' | 'dragEnd', x: number, y: number): void
}

export {}