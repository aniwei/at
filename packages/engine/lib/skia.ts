import { invariant } from 'ts-invariant'
import { Equalable, UnimplementedError } from '@at/basic'
import { At } from '@at/core'

//// => Skia
export type {
  BlendMode,
  Canvas,
  ClipOp,
  FillType,
  FilterOptions,
  Font,
  Image,
  Path,
  Paint,
  PaintStyle,
  PathEffect,
  PathOp,
  StrokeCap,
  StrokeJoin,
  Typeface,
  TypefaceFontProvider
} from 'canvaskit-wasm'

//// => SkiaRef
// WASM 数据结构
export abstract class SkiaRef<T extends SkiaRef<T>> {
  abstract clone (): T
  abstract delete (): void
  abstract deleteLater (): void
  abstract isAliasOf (other: any): boolean
  abstract isDeleted (): boolean
}

//// => ManagedSkiaRef
// WASM 对象管理，对象垃圾回收
export interface ManagedSkiaRefFactory<T extends SkiaRef<T>>{
  new (...rests: unknown[]) : ManagedSkiaRef<T>
  create (...rests: unknown[]): ManagedSkiaRef<T>
  resurrect (...rests: unknown[]): T
}

export abstract class ManagedSkiaRef<T extends SkiaRef<T>> extends Equalable<ManagedSkiaRef<T>> {
  /**
   * 
   * @param skia 
   */
  static create <M extends ManagedSkiaRef<T>, T extends SkiaRef<T>> (...rests: unknown[]): M
  static create <M extends ManagedSkiaRef<T>, T extends SkiaRef<T>> (skia: T): M {
    const Factory = this as unknown as ManagedSkiaRefFactory<T>
    return new Factory(skia) as unknown as M
  }

  static resurrect <T extends SkiaRef<T>> (...rests: unknown[]): T {
    throw new UnimplementedError()
  }

  protected ref: T | null

  // => skia
  get skia () {
    invariant(this.ref !== null, `The ref cannot be null.`)
    return this.ref as T
  }
  set skia (skia: T | null) {
    if (skia !== null) {
      At.refs.register(this, skia)
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
    super()
    this.ref = skia ?? this.resurrect() ?? null
  }

  /**
   * 构建 WASM 对象
   * @returns {T}
   */
  resurrect (): T {
    throw new UnimplementedError()
  }

  /**
   * 是否相等
   * @param {T | null} object 
   * @returns {boolean} 
   */
  equal (object: ManagedSkiaRef<T> | null) {
    return object?.skia === this.skia
  }

  /**
   * 是否相等
   * @param {T | null} object 
   * @returns 
   */
  notEqual (object: ManagedSkiaRef<T> | null) {
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

//// => SkiaRefBox
// 引用计数箱子
export class SkiaRefBox<R, T extends SkiaRef<T>> {
  // 引用计数
  protected count: number = 0
  protected referrers: Set<R> = new Set()
  protected isDeletedPermanently = false
  
  // skia ref
  protected _ref: T | null = null

  // => skia
  public get skia (): T {
    return this._ref as T
  }
  public set skia (skia: T | null) {
    this._ref = skia
  }
  
  /**
   * 构造函数
   * @param {T} skia 
   */
  constructor (skia: T) {
    this.skia = skia
    At.refs.register(this, skia)
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
        At.refs.cleanUp(this.skia)
      }

      this.delete()
      this.isDeletedPermanently = true
    }
  }

  /**
   * 释放引用对象
   */
  delete () {
    this.skia?.delete()
    this._ref = null
  }
}
