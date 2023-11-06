import { invariant } from 'ts-invariant'
import { At } from '@at/core'
import { ColorFilterImageFilter } from './image-filter'
import { UnimplementedError } from '@at/basic'
import { listEquals } from '@at/utility'

import * as Skia from './skia'

import { Color, Equalable } from '@at/basic'

export enum ColorFilterKind {
  Mode,
  Matrix,
  LinearToSrgbGamma,
  SrgbToLinearGamma,
}

export abstract class ColorFilter implements Equalable<ColorFilter> {
  /**
   * 获取模式
   * @param color 
   * @param blendMode 
   * @returns 
   */
  static mode (color: Color, blendMode: Skia.BlendMode) {
    return 
  }


  // => image
  // 位图滤镜
  get image () {
    return new ColorFilterImageFilter(this)
  }

  initRawColorFilter (): ColorFilter {
    throw new UnimplementedError(`ColorFilter initRowColorFilter is not unimplmented yet.`)
  }

  initRawImageFilter (): Skia.ImageFilter {
    return At.skia.ImageFilter.MakeColorFilter(
      this.initRawColorFilter(), 
      null
    )
  }

  equal (other: ColorFilter | null): boolean {
    return other instanceof ColorFilter
  }

  notEqual (other: ColorFilter | null): boolean {
    return !this.equal(other)
  }
}

export class ManagedSkiaColorFilter extends Skia.ManagedSkiaRef<Skia.ColorFilter> {
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

export class BlendModeColorFilter extends ColorFilter {
  protected color: Color
  protected blendMode: Skia.BlendMode

  
  
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
  constructor (color: Color, blendMode: Skia.BlendMode) {
    super()

    this.color = color
    this.blendMode = blendMode
  }

  /**
   * 
   * @param {BlendModeColorFilter} other
   * @return {boolean}
   */  
  equal (other: BlendModeColorFilter | null) {
    return (
      other instanceof BlendModeColorFilter &&
      other.blendMode === this.blendMode &&
      other.color.equal(this.color) 
    )
  }

  notEqual (other: BlendModeColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @description: 
   * @return {string}
   */  
  toString () {
    return `ColorFilter.mode(
      [color]: ${this.color}, 
      [blendMode]: ${this.blendMode}
    )`
  }
}

export class MatrixColorFilter extends ColorFilter {
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
  ceateRawColorFilter () {
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
    
    return At.skia.ColorFilter.MakeMatrix(matrix)
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