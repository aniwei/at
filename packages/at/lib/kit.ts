import { invariant } from '@at/utils'
import { AtEngine } from '@at/engine'

// Manifest
export interface Font {
  family: string,
  dir: string
}

export interface AtManifest {
  protocol: string,
  fonts: Font[],
  theme: {}
}


export enum AtEnvKind {
  Dev = 'development',
  Stage = 'stage',
  Production = 'producation'
}

export interface Environments {
  SKIA_URI: string,
  AT_ENV: AtEnvKind
}

export class AtKit extends AtEngine {
  // 创建 At 全局对象
  static create () {
    return new AtKit() as AtKit
  }

  // => isDev
  public get isDev () {
    return this.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Dev
  }

  // => isStage
  public get isStage () {
    return this.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Stage
  }

  // => isProduction
  public get isProduction () {
    return this.env('AT_ENV', AtEnvKind.Production) === AtEnvKind.Production
  }

  protected environments: Environments

  constructor () {
    const env = process.env

    invariant(env.BASE_URI)
    invariant(env.ROOT_DIR)
    invariant(env.SKIA_URI)

    super(env.SKIA_URI, env.BASE_URI, env.ROOT_DIR)
    this.environments = process.env as unknown as  Environments
  }

  /// => utility
  /**
   * 获取环境变了
   * @param key 
   * @param defaultEnv 
   * @returns 
   */
  env (key: string, defaultEnv?: string) {
    if (Reflect.has(this.environments, key)) {
      return Reflect.get(this.environments, key)
    }

    return defaultEnv
  }

  prepare (): Promise<void> {
    return new Promise((resolve) => {
      this.load('manifest.json')
        .then(res => res.json())
        .then((manifest: AtManifest) => {
          if (!manifest.fonts || manifest.fonts.length === 0) {
            manifest.fonts = []
          }

          return Promise.all(manifest.fonts.map(font => {
            return this.load(font.dir)
              .then(res => res.arrayBuffer())
              .then(data => this.fonts.register(data, font.family))
          }))
        }).then(() => resolve())
    })
  }

  ensure () {
    return super.ensure()
      .then(() => this.prepare())
      .then(() => AtEngine.skia)
  }
}