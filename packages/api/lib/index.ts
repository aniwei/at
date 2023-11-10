import ManifestApiJSON from './manifest.json'
import pkg from '../package.json'

ManifestApiJSON.version = pkg.version

export { ManifestApiJSON }

export * from './client'
export * from './engine'
export * from './transport'
export * from './at'