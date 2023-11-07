import { invariant } from '@at/utility'
import { At } from '../at'
import { AtManagedSkiaObject } from './skia'
import { AtColorFilterImageFilter } from './image-filter'
import { UnimplementedError } from '../basic/error'
import { listEquals } from '../basic/helper'

import type { ArrayLike } from '../at'
import type { Color } from '../basic/color'
import type { BlendMode, ColorFilter, ImageFilter } from './skia'

export enum ColorFilterType {
  Mode,
  Matrix,
  LinearToSrgbGamma,
  SrgbToLinearGamma,
}

export abstract class AtColorFilter {
  /**
   * 获取模式
   * @param color 
   * @param blendMode 
   * @returns 
   */
  static mode (color: Color, blendMode: BlendMode) {
    return 
  }

  get imageFilter () {
    return new AtColorFilterImageFilter(this)
  }

  initRawColorFilter (): ColorFilter {
    throw new UnimplementedError(`ColorFilter initRowColorFilter is not unimplmented yet.`)
  }

  initRawImageFilter (): ImageFilter {
    return At.ImageFilter.MakeColorFilter(
      this.initRawColorFilter(), 
      null
    )
  }

  abstract equal (other: AtColorFilter | null): boolean
}

export class AtManagedSkiaColorFilter extends AtManagedSkiaObject<ColorFilter> {
  public colorFilter: AtColorFilter

  /**
   * 构造函数
   * @param {ColorFilter} colorFilter 
   */
  constructor (colorFilter: AtColorFilter) {
    super(colorFilter.initRawColorFilter())
    this.colorFilter = colorFilter
  }

  /**
   * 获取
   * @return {ColorFilter}
   */  
  resurrect () {
    return this.colorFilter.initRawColorFilter()
  }
  
  /**
   * 
   * @param other 
   * @returns 
   */  
  equal (other: AtManagedSkiaColorFilter | null) {
    return (
      other instanceof AtManagedSkiaColorFilter &&
      this.colorFilter === other.colorFilter
    )
  }

  notEqual (other: AtManagedSkiaColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @description: 
   * @return {string}
   */  
  toString () {
    return this.colorFilter.toString()
  }
}

export class AtBlendModeColorFilter extends AtColorFilter {
  protected color: Color
  protected blendMode: BlendMode

  
  initRawColorFilter () {
    return At.ColorFilter.MakeBlend(
      this.color,
      this.blendMode
    )
  }

  /**
   * 构造函数
   * @param {Color} color
   * @param {BlendMode} blendMode
   * @return {AtBlendModeColorFilter}
   */  
  constructor (color: Color, blendMode: BlendMode) {
    super()

    this.color = color
    this.blendMode = blendMode
  }

  /**
   * 
   * @param {AtBlendModeColorFilter} other
   * @return {boolean}
   */  
  equal (other: AtBlendModeColorFilter | null) {
    return (
      other instanceof AtBlendModeColorFilter &&
      other.blendMode === this.blendMode &&
      other.color.equal(this.color) 
    )
  }

  notEqual (other: AtBlendModeColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @description: 
   * @return {string}
   */  
  toString () {
    return `ColorFilter.mode(${this.color}, ${this.blendMode})`
  }
}

export class AtMatrixColorFilter extends AtColorFilter {
  protected matrix: ArrayLike<number>

  /**
   * @param {ArrayLike<number>} matrix
   * @return {*}
   */  
  constructor (matrix: ArrayLike<number>) {
    super()

    this.matrix = matrix
  }

  /**
   * @return {ColorFilterSkiaObject}
   */  
  initRawColorFilter () {
    invariant(this.matrix.length === 20, 'Color Matrix must have 20 entries.')
    const matrix = new Float32Array(20)
    const translationIndices = [4, 9, 14, 19]
    for (let i = 0; i < 20; i++) {
      if (translationIndices.includes(i)) {
        matrix[i] = this.matrix[i] / 255
      } else {
        matrix[i] = this.matrix[i]
      }
    }
    
    return At.ColorFilter.MakeMatrix(matrix)
  }

  /**
   * 
   * @param {AtMatrixColorFilter} other
   * @return {boolean}
   */  
  equal (other: AtMatrixColorFilter | null) {
    return (
      other instanceof AtMatrixColorFilter &&
      listEquals<number>(this.matrix, other.matrix)
    )
  }

  notEqual (other: AtMatrixColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @description: 
   * @return {string}
   */  
  toString () {
    return `ColorFilter.matrix(${this.matrix})`
  }
}


export class AtLinearToSRGBGammaColorFilter extends AtColorFilter {
  /**
   * @description: 
   * @return {ColorFilterSkiaObject}
   */  
  initRawColorFilter () {
    return At.ColorFilter.MakeLinearToSRGBGamma()
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  equal (other: AtLinearToSRGBGammaColorFilter | null) {
    return (
      other instanceof AtLinearToSRGBGammaColorFilter &&
      other === this
    )
  }

  notEqual (other: AtLinearToSRGBGammaColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @description: 
   * @return {string}
   */  
  toString () {
    return `ColorFilter.AtLinearToSRGBGamma()`
  }
}

export class AtSRGBToLinearGammaColorFilter extends AtColorFilter {
  initRawColorFilter () {
    return At.ColorFilter.MakeSRGBToLinearGamma()
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  equal (other: AtSRGBToLinearGammaColorFilter | null) {
    return (
      other instanceof AtSRGBToLinearGammaColorFilter &&
      other === this
    )
  }

  notEqual (other: AtSRGBToLinearGammaColorFilter | null) {
    return !this.equal(other)
  }
  
  toString () {
    return 'ColorFilter.AtSRGBToLinearGamma()'
  }
}

export class AtComposeColorFilter extends AtColorFilter {
  protected innerFilter: AtManagedSkiaColorFilter
  protected outerFilter: AtManagedSkiaColorFilter

   /**
   * @description: 
   * @return {ColorFilterSkiaObject}
   */
  initRawColorFilter () {
    return At.ColorFilter.MakeCompose(
      this.outerFilter.skia!,
      this.innerFilter.skia!
    )
  }

  /**
   * 构造函数
   * @param {AtManagedSkiaColorFilter} innerFilter 
   * @param {AtManagedSkiaColorFilter} outerFilter 
   */
  constructor (innerFilter: AtManagedSkiaColorFilter, outerFilter: AtManagedSkiaColorFilter) {
    super()

    this.innerFilter = innerFilter
    this.outerFilter = outerFilter
  }

  /**
   * 判断滤镜是否相同
   * @param {ComposeColorFilter} other
   * @return {boolean}
   */
  equal (other: AtComposeColorFilter | null) {
    return (
      other instanceof AtComposeColorFilter &&
      this.innerFilter.equal(other.innerFilter) &&
      this.outerFilter.equal(other.outerFilter)
    )  
  }

  notEqual (other: AtComposeColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @return {*}
   */  
  toString () {
    return `ColorFilter.compose(${this.innerFilter}, ${this.outerFilter})`
  }
}