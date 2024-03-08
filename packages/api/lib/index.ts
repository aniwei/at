import Protocol from './protocol.json'
import pkg from '../package.json'

Protocol.version = pkg.version

export { Protocol }

export * from './api'
export * from './client'
export * from './document'
export * from './engine'
export * from './transport'