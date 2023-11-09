import ManifestApiJSON from './manifest.json'
import pkg from '../package.json'

ManifestApiJSON.version = pkg.version

export { ManifestApiJSON }

export * from './transport'
export * from './at'