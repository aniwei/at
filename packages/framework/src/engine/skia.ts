/*
 * @author: Aniwei
 * @date: 2022-10-21 10:18:49
 */
import { invariant } from 'ts-invariant'
import { At } from '../at'

export type { 
  Affinity,
  AlphaType,
  AngleInDegrees,
  AnimatedImage,
  BlendMode,
  BlurStyle,
  Canvas,
  CanvasKit,
  Camera,
  ClipOp,
  ColorChannel,
  ColorFilter,
  ColorSpace,
  DecorationStyle,
  FillType,
  FilterMode,
  FilterOptions,
  Font,
  FontMgr,
  FontMetrics,
  FontWeight,
  FontSlant,
  FontStyle,
  GlyphRun,
  GrDirectContext,
  Image,
  ImageFilter,
  ImageInfo,
  LineBreakType,
  LineMetrics,
  MaskFilter,
  MipmapMode,
  Paint,
  PaintStyle,
  Paragraph,
  ParagraphBuilder,
  ParagraphStyle,
  PartialImageInfo,
  PathEffect,
  PlaceholderAlignment,
  Path,
  PathOp,
  Range,
  RectHeightStyle,
  RectWidthStyle,
  RectWithDirection,
  PointMode,
  PositionWithAffinity,
  PictureRecorder,
  Shader,
  StrokeCap,
  StrokeJoin,
  StrutStyle,
  TextAlign,
  TextBaseline,
  TextBlob,
  TextDirection,
  TextFontFeatures,
  TextHeightBehavior,
  TextShadow,
  TextStyle,
  TileMode,
  Typeface,
  TypefaceFontProvider,
  WebGLContextHandle,
  WebGLOptions,
  WebGPUCanvasContext,
  WebGPUDeviceContext,
  WebGPUCanvasOptions,
  SkPicture as Picture,
  Surface,
} from 'canvaskit-wasm'


export enum FilterQuality {
  None,
  Low,
  Medium,
  High,
}

export enum ImageByteFormat {
  RawRGBA,
  RawStraightRGBA,
  RawUnmodified,
  PNG
}
export enum Clip {
  None,
  HardEdge,
  AntiAlias,
  AntiAliasWithSaveLayer,
}

/**
 * SkiaObject WASM 对象定义
 */
export abstract class AtSkiaObject<T extends AtSkiaObject<T>> {
  abstract clone (): T
  abstract delete (): void
  abstract deleteLater (): void
  abstract isAliasOf (other: any): boolean
  abstract isDeleted (): boolean
}

/**
 * Skia 封装对象管理
 */
export abstract class AtManagedSkiaObject<T extends AtSkiaObject<T>> {
  protected raw: T | null

  get skia () {
    invariant(this.raw !== null, `The raw cannot be null.`)
    return this.raw as T
  }

  set skia (skia: T | null) {
    if (skia !== null) {
      AtSkiaObjectFinalization.instance.registry(this, skia)
    }

    this.delete()
    this.raw = skia
  }

  /**
   * 构造函数
   * @param {T?} skia
   */
  constructor (skia?: T) {
    this.raw = skia ?? this.resurrect() ?? null
  }

  /**
   * 构建 WASM 对象
   * @returns {T}
   */
  abstract resurrect (): T

  /**
   * 判断是否是否 WASM 对象
   * @returns {boolean}
   */
  isDeleted (): boolean {
    return !!this.raw?.isDeleted() as boolean
  }
  
  /**
   * 释放 WASM 对象
   */
  delete () {
    this.raw?.delete()
    this.raw = null
  }
}

/**
 * WASM 多引用对象封装
 */
export class AtSkiaObjectBox<R, T extends AtSkiaObject<T>> {
  private refCount: number = 0
  private referrers: Set<R> = new Set()
  private isDeletedPermanently = false
  
  public raw: T | null = null

  public get skia (): T {
    return this.raw as T
  }

  public set skia (skia: T | null) {
    this.raw = skia
  }
  
  /**
   * 构造函数
   * @param {T} skia 
   */
  constructor (skia: T) {
    this.skia = skia
    AtSkiaObjectFinalization.instance.registry(this, skia)
  }
  
  /**
   * 引用
   * @param {R} referrer 
   */
  ref (referrer: R) {
    invariant(!this.referrers.has(referrer), `Attempted to increment ref count by the same referrer more than once.`)    
    
    this.referrers.add(referrer)
    this.refCount += 1
    invariant(this.refCount === this.referrers.size)
  }

  /**
   * 解引用
   * @param {R} referrer 
   */
  unref (referrer: R) {
    invariant(!this.isDeletedPermanently, `Attempted to unref an already deleted Skia object.`)
    invariant(this.referrers.delete(referrer), `Attempted to decrement ref count by the same referrer more than once.`)

    this.refCount -= 1
    invariant(this.refCount === this.referrers.size)

    if (this.refCount === 0) {
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
    this.raw = null
  }
}

/**
 * @description: Skia 对象回收
 * @return {*}
 */
 export class AtSkiaObjectFinalization<T extends AtSkiaObject<T>> {
  static _instance: null | unknown = null
  static get instance () {
    AtSkiaObjectFinalization._instance ??= new AtSkiaObjectFinalization()
    return AtSkiaObjectFinalization._instance as any
  }
  
  protected finalization: FinalizationRegistry<T>
  protected queue: T[] = []
  
  constructor () {
    this.finalization = new At.FinalizationRegistry(this.cleanup)
  }

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
   * @param {T} raw
   * @return {*}
   */
  cleanup = (raw: T) => {
    if (!raw.isDeleted()) {
      invariant(!raw.isDeleted(), 'Attempted to delete an already deleted Skia object.')
      this.queue.push(raw)

      At.idle(() => {
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

