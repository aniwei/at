import { invariant, UnimplementedError } from '@at/utils'
import { Equalable } from '@at/basic'
import { AtEngine } from './engine'

import type * as CanvasKit from 'canvaskit-wasm'


//// => SkiaRef
// WASM 数据结构
export abstract class SkiaObj<T extends SkiaObj<T>> {
  abstract clone (): T
  abstract delete (): void
  abstract deleteLater (): void
  abstract isAliasOf (other: any): boolean
  abstract isDeleted (): boolean
}

export abstract class SkiaRef extends SkiaObj<SkiaRef> {}

//// => ManagedSkiaRef
// WASM 对象管理，对象垃圾回收
export interface ManagedSkiaRefFactory<T extends SkiaRef = SkiaRef>{
  new (...rests: unknown[]) : ManagedSkiaRef<T>
  create (...rests: unknown[]): ManagedSkiaRef<T>
  resurrect (...rests: unknown[]): T
}

export abstract class ManagedSkiaRef<T extends SkiaRef = SkiaRef> extends Equalable<ManagedSkiaRef<T>> {
  /**
   * 
   * @param skia 
   */
  static create <T extends SkiaRef = SkiaRef> (...rests: unknown[]): ManagedSkiaRef<SkiaRef>
  static create <T extends SkiaRef = SkiaRef> (skia: T): ManagedSkiaRef<SkiaRef> {
    const Factory = this as unknown as ManagedSkiaRefFactory<T>
    return new Factory(skia) as unknown as ManagedSkiaRef<T>
  }

  static resurrect <T extends SkiaRef> (...rests: unknown[]): SkiaRef {
    throw new UnimplementedError('The "resurrect" method is not implemented.')
  }

  // => skia
  get skia () {
    invariant(this.ref !== null, `The "ref" cannot be null.`)
    return this.ref as T
  }
  set skia (skia: T | null) {
    if (this.ref !== null) {
      AtEngine.refs.unregister(this)
    }

    if (skia !== null) {
      AtEngine.refs.register(this, skia)
    }

    this.delete()
    this.ref = skia
  }
  protected ref: T | null
  protected disposed: boolean = false

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

  dispose () {
    this.delete()
    this.disposed = true
  }
}

//// => SkiaRefBox
// 引用计数箱子
export class SkiaRefBox<R, T extends SkiaRef = SkiaRef> {
   // => skia
   public get skia (): T {
    return this._ref as T
  }
  public set skia (skia: T | null) {
    this._ref = skia
  }

  // 引用计数
  protected count: number = 0
  protected referrers: Set<R> = new Set()
  protected isDeletedPermanently = false
  
  // skia ref
  protected _ref: T | null = null
  // disposed
  protected disposed: boolean = false

  /**
   * 构造函数
   * @param {T} skia 
   */
  constructor (skia: T) {
    this.skia = skia
    AtEngine.refs.register(this, skia)
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
        AtEngine.refs.cleanUp(this.skia)
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

  dispose () {
    this.delete()
    this.disposed = true
  }
}


//// => Skia
export type {
  Affinity,
  AnimatedImage,
  BlendMode,
  BlurStyle,
  Canvas,
  ClipOp,
  ColorFilter,
  DecorationStyle,
  FillType,
  FilterMode,
  FilterOptions,
  Font,
  FontWeight,
  FontSlant,
  FontStyle,
  GrDirectContext,
  Image,
  ImageFilter,
  LineMetrics,
  MallocObj,
  MaskFilter,
  MipmapMode,
  Path,
  Paint,
  PaintStyle,
  Paragraph,
  ParagraphBuilder,
  PathEffect,
  PathOp,
  PlaceholderAlignment,
  SkPicture as Picture,
  StrutStyle,
  PictureRecorder,
  PositionWithAffinity,
  RectHeightStyle,
  RectWidthStyle,
  RectWithDirection,
  Shader,
  StrokeCap,
  StrokeJoin,
  Surface,
  TextAlign,
  TextBaseline,
  TextDirection,
  TextHeightBehavior,
  TileMode,
  Typeface,
  TypefaceFontProvider
} from 'canvaskit-wasm'


export interface ParagraphStyle extends CanvasKit.ParagraphStyle, SkiaRef { }
export interface TextStyle extends CanvasKit.TextStyle, SkiaRef { }

//// => extend Skia
export enum AxisKind {
  Horizontal,
  Vertical
}

// => Clip
// 裁剪方式
export enum ClipKind {
  None,
  HardEdge,
  AntiAlias,
  AntiAliasWithSaveLayer,
}

// => FilterQuality
export enum FilterQualityKind {
  None,
  Low,
  Medium,
  High,
}

// => ImageByteFormatKind
// 位图格式
export enum ImageByteFormatKind {
  RawRGBA,
  RawStraightRGBA,
  RawUnmodified,
  PNG
}

// => RenderComparisonKind
export enum RenderComparisonKind {
  Identical,
  Metadata,
  Paint,
  Layout,
}

// => AxisDirectionKind
export enum AxisDirectionKind {
  Up,
  Right,
  Down,
  Left,
}

// => VerticalDirectionKind
export enum VerticalDirectionKind {
  Up,
  Down,
}

// => ScrollDirectionKind
export enum ScrollDirectionKind {
  Idle,
  Forward,
  Reverse,
}