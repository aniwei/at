import invariant from 'ts-invariant'
import { At } from './init'

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
  protected _finalization: FinalizationRegistry<DeletedSkiaRef> | null = null
  protected get finalization () {
    if (this._finalization === null) {
      this._finalization = new FinalizationRegistry(this.cleanUp)
    }

    return this._finalization
  }

  protected queue: DeletedSkiaRef[] = []
  
  /**
   * 监听对象
   * @param {unknown} object 
   * @param {T} skia 
   */
  register (object: object, skia: DeletedSkiaRef) {
    this.finalization.register(object, skia)
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

      At.idle(() => {
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