import { Equalable } from '@at/basic'


export type {
  Canvas,
  Path,
  FillType,
} from 'canvaskit-wasm'

export abstract class SkiaRef<T extends SkiaRef<T>> {
  abstract clone (): T
  abstract delete (): void
  abstract deleteLater (): void
  abstract isAliasOf (other: any): boolean
  abstract isDeleted (): boolean
}

export interface ManagedSkiaRefCreate<T>{
  create (...rests: unknown[]): T
  resurrect (...rests: unknown[]): T
}

export abstract class ManagedSkiaRef<T extends SkiaRef<T>> extends Equalable<ManagedSkiaRef<T>> {
  static create <T extends SkiaRef<T>> (skia?: T): T
  static create <T extends SkiaRef<T>> (...rests: unknown[]): T {
    const ManagedSkiaRefCreate = this as unknown as ManagedSkiaRefCreate
    return new ManagedSkiaRefCreate(...rests)
  }

  static resurrect (...rests: unknown[]) {
    const ManagedSkiaRefCreate = this as unknown as ManagedSkiaRefCreate
    return ManagedSkiaRefCreate.resurrect(...rests)
  }

  protected ref: T | null

  // => skia
  get skia () {
    invariant(this.ref !== null, `The ref cannot be null.`)
    return this.ref as T
  }
  set skia (skia: T | null) {
    if (skia !== null) {
      SkiaRefs.registry(this, skia)
    }

    this.delete()
    this.ref = skia
  }

  /**
   * 构造函数
   * @param {T?} skia
   */
  constructor (...rests: unknown[])
  constructor (skia?: T) {
    this.ref = skia ?? this.resurrect() ?? null
  }

  /**
   * 构建 WASM 对象
   * @returns {T}
   */
  abstract resurrect (): T

  /**
   * 
   * @param object 
   * @returns 
   */
  equal (object: T | null) {
    return object.skia === this.skia
  }

  /**
   * 
   * @param object 
   * @returns 
   */
  notEqual (object: T | null) {
    return !this.equal(object)
  }

  /**
   * 判断是否是否 WASM 对象
   * @returns {boolean}
   */
  isDeleted (): boolean {
    return !!this.ref?.isDeleted() as boolean
  }
  
  /**
   * 释放 WASM 对象
   */
  delete () {
    this.ref?.delete()
    this.ref = null
  }
}

export class SkiaRefBox<R, T extends SkiaRef<T>> {
  // 引用计数
  protected count: number = 0
  protected referrers: Set<R> = new Set()
  protected isDeletedPermanently = false
  
  public ref: T | null = null

  public get skia (): T {
    return this.ref as T
  }

  public set skia (skia: T | null) {
    this.ref = skia
  }
  
  /**
   * 构造函数
   * @param {T} skia 
   */
  constructor (skia: T) {
    this.skia = skia
    SkiaRefs.register(this, skia)
  }
  
  /**
   * 引用
   * @param {R} referrer 
   */
  ref (referrer: R) {
    invariant(!this.referrers.has(referrer), `Attempted to increment ref count by the same referrer more than once.`)    
    
    this.referrers.add(referrer)
    this.count += 1
    invariant(this.count === this.referrers.size)
  }

  /**
   * 解引用
   * @param {R} referrer 
   */
  unref (referrer: R) {
    invariant(!this.isDeletedPermanently, `Attempted to unref an already deleted Skia object.`)
    invariant(this.referrers.delete(referrer), `Attempted to decrement ref count by the same referrer more than once.`)

    this.count -= 1
    invariant(this.count === this.referrers.size)

    if (this.count === 0) {
      if (this.skia) {
        AtSkiaObjectFinalization.instance.cleanup(this.skia)
      }

      this.delete()
      this.isDeletedPermanently = true
    }
  }

  /**
   * 释放引用对象
   */
  delete() {
    this.skia?.delete()
    this.ref = null
  }
}

export class SkiaRefs<T extends AtSkiarRef<T>> {
  static _instance: null | unknown = null
  static get instance () {
    SkiaRefs._instance ??= new SkiaRefs()
    return SkiaRefs._instance as unknown as FinalizationRegistry<SkiaRef>
  }

  static register (object: unknown, skia: T) {
    this.finalization.register(object, skia)
  }
  
  
  protected _finalization: FinalizationRegistry<T> | null = null
  protected get finalization () {
    if (this._finalization === null) {
      this._finalization = new FinalizationRegistry(this.cleanUp)
    }

    return this._finalization
  }

  protected queue: T[] = []
  
  /**
   * 监听对象
   * @param {object} object 
   * @param {T} skia 
   */
  registry (object: object, skia: T) {
    this.finalization.register(object, skia)
  }

  /**
   * 清理对象
   * @param {T} ref
   * @return {*}
   */
  cleanUp = (ref: T) => {
    if (!ref.isDeleted()) {
      invariant(!ref.isDeleted(), 'Attempted to delete an already deleted Skia object.')
      this.queue.push(ref)

      idle(() => {
        while (true) {
          const skia = this.queue.pop()
          if (!skia?.isDeleted()) {
            skia?.delete()
          }

          if (this.queue.length === 0) {
            break
          }
        }
      })
    }
  }
}