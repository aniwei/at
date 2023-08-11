import { At } from '../at'
import { AtManagedSkiaObject } from './skia'
import { listEquals, toFilterQuality, toMatrix } from '../basic/helper'

import type { ArrayLike } from '../at'
import type { AtColorFilter } from './color-filter'
import type { ImageFilter, TileMode, FilterQuality } from './skia'


export abstract class AtManagedSkiaImageFilterConvertible {
  abstract imageFilter: AtManagedSkiaObject<ImageFilter>
}

export abstract class AtImageFilter extends AtManagedSkiaObject<ImageFilter> implements AtManagedSkiaImageFilterConvertible {

  static blur (sigmaX: number, sigmaY: number, tileMode: TileMode) {
    return new AtBlurImageFilter(sigmaX, sigmaY, tileMode)
  }

  static color (colorFilter: AtColorFilter) {
    return new AtColorFilterImageFilter(colorFilter)
  }
  
  static matrix (matrix: ArrayLike<number>, filterQuality: FilterQuality) {
    return new AtMatrixImageFilter(matrix, filterQuality)
  }

  public get imageFilter (): AtManagedSkiaObject<ImageFilter> {
    return this
  }

  abstract resurrect (): ImageFilter
}

/**
 * 模糊滤镜
 */
export class AtBlurImageFilter extends AtImageFilter {
  get mode () {
    switch (this.tileMode) {
      case At.TileMode.Clamp:
        return 'clamp'
      case At.TileMode.Mirror:
        return 'mirror'
      case At.TileMode.Repeat:
        return 'repeated'
      case At.TileMode.Decal:
        return 'decal'
    }
  }

  protected sigmaX: number
  protected sigmaY: number 
  protected tileMode: TileMode

  /**
   * 构造函数
   * @param {number} sigmaX
   * @param {number} sigmaY
   * @param {TileMode} tileMode
   * @return {AtBlurImageFilter}
   */
  constructor (sigmaX: number, sigmaY: number, tileMode: TileMode) {
    super(At.ImageFilter.MakeBlur(sigmaX, sigmaY, tileMode, null))

    this.sigmaX = sigmaX
    this.sigmaY = sigmaY
    this.tileMode = tileMode
  }

  /**
   * 判断模糊滤镜是否相同
   * @param {AtBlurImageFilter} other
   * @return {boolean}
   */  
  equal (other: AtBlurImageFilter) {
    return (
      other instanceof AtBlurImageFilter &&
      other.sigmaX === this.sigmaX &&
      other.sigmaY === this.sigmaY &&
      other.tileMode === this.tileMode
    )
  }

  /**
   * 创建 Skia 对象
   * @return {ImageFilter}
   */  
  resurrect (): ImageFilter {
    return At.ImageFilter.MakeBlur(
      this.sigmaX,
      this.sigmaY,
      this.tileMode,
      null
    )
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `AtImageFilter.blur(${this.sigmaX}, ${this.sigmaY}, ${this.mode})`
  }
}

export class AtMatrixImageFilter extends AtImageFilter {
  /**
   * 创建 Skia 对象
   * @param matrix 
   * @param filterQuality 
   * @returns {ImageFilter}
   */
  static resurrect (matrix: ArrayLike<number>, filterQuality: FilterQuality) {
    return At.ImageFilter.MakeMatrixTransform(
      toMatrix(matrix),
      toFilterQuality(filterQuality)!,
      null,
    )
  }

  protected matrix: ArrayLike<number>
  protected filterQuality: FilterQuality

  constructor (matrix: ArrayLike<number>, filterQuality: FilterQuality) {
    super(AtMatrixImageFilter.resurrect(matrix, filterQuality))

    this.matrix = matrix
    this.filterQuality = filterQuality
  }

  /**
   * 创建 Skia 对象
   * @returns ImageFilter
   */
  resurrect (): ImageFilter {
    return AtMatrixImageFilter.resurrect(this.matrix, this.filterQuality)
  }
  
  /**
   * 判断两个对象是否相同
   * @param {AtMatrixImageFilter} other 
   * @returns {boolean}
   */
  equal (other: AtMatrixImageFilter): boolean {
    
    return (
      other instanceof AtMatrixImageFilter &&
      this.filterQuality === other.filterQuality &&
      listEquals<number>(this.matrix, other.matrix)
    )
  }

  /**
   * 输出字符串
   * @returns 
   */
  toString () {
    return `AtMatrixImageFilter(${this.matrix}, ${this.filterQuality})`
  } 
}


export class AtColorFilterImageFilter extends AtImageFilter {
  protected colorFilter: AtColorFilter
  
  /**
   * 构造函数
   * @param {AtColorFilter} colorFilter
   * @return {ColorFilterImageFilter}
   */  
  constructor (colorFilter: AtColorFilter) {
    super(colorFilter.initRawImageFilter())
    this.colorFilter = colorFilter
  }

  /**
   * @description: 
   * @return {ImageFilter}
   */  
  resurrect(): ImageFilter {
    return this.colorFilter.initRawImageFilter()
  }

  /**
   * 判断滤镜是否相同
   * @param {ColorFilterImageFilter} other
   * @return {boolean}
   */  
  equal (other: AtColorFilterImageFilter | null): boolean {
    return (
      other instanceof AtColorFilterImageFilter &&
      this.colorFilter === other.colorFilter
    )
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  notEqual (other: AtColorFilterImageFilter | null): boolean {
    return !this.equal(other)
  }
  
  /**
   * 输出字符串
   * @return {string}
   */  
  toString () {
    return this.colorFilter.toString()
  } 
}
