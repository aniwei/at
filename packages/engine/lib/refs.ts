import { invariant } from '@at/utility'
import { idle } from '@at/basic'

export interface DeletedSkiaRef {
  delete (): void
  deleteLater (): void
  isAliasOf (other: any): boolean
  isDeleted (): boolean
}

//// => RefsRegistry
// 引用管理
export class RefsRegistry {
  static create () {
    return new RefsRegistry()
  }

  // => finalization
  protected _registry: FinalizationRegistry<DeletedSkiaRef> | null = null
  protected get registry () {
    if (this._registry === null) {
      this._registry = new FinalizationRegistry(this.cleanUp)
    }

    return this._registry
  }

  protected queue: DeletedSkiaRef[] = []
  
  /**
   * 监听对象
   * @param {object} obj
   * @param {T} skia 
   */
  register (obj: object, skia: DeletedSkiaRef) {
    this.registry.register(obj, skia)
  }

  /**
   * @param {obj} object 
   */
  unregister (obj: object) {
    this.registry.unregister(obj)
  }

  /**
   * 清理对象
   * @param {T} ref
   * @return {*}
   */
  cleanUp = (ref: DeletedSkiaRef) => {
    if (!ref.isDeleted()) {
      invariant(!ref.isDeleted(), 'Attempted to delete an already deleted Skia object.')
      this.queue.push(ref)

      idle.request(() => {
        while (true) {
          const skia = this.queue.pop() ?? null
          if (skia !== null) {
            if (skia?.isDeleted()) {
              skia?.delete()
            }
          } else {
            break
          }
        }
      })
    }
  }
}