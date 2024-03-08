import { invariant, UnimplementedError, listEquals } from '@at/utils'
import { Color, Equalable } from '@at/basic'
import { ColorFilterImageFilter } from './image-filter'
import { Engine } from './engine'

import * as Skia from './skia'


//// => ColorFilter
// 颜色滤镜
// 滤镜类型
export enum ColorFilterKind {
  Mode,
  Matrix,
  LinearToSRGBGamma,
  SRGBToLinearGamma,
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

  createRawColorFilter (): Skia.ColorFilter {
    throw new UnimplementedError(`ColorFilter createRawColorFilter is not unimplmented yet.`)
  }

  createRawImageFilter (): Skia.ImageFilter {
    return Engine.skia.ImageFilter.MakeColorFilter(
      this.createRawColorFilter(), 
      null
    )
  }

  /**
   * 是否相等
   * @param {ColorFilter | null} other 
   * @returns {boolean}
   */
  equal (other: ColorFilter | null): boolean {
    return other instanceof ColorFilter
  }

  /**
   * 是否相等
   * @param {ColorFilter | null} other 
   * @returns {boolean}
   */
  notEqual (other: ColorFilter | null): boolean {
    return !this.equal(other)
  }
}

//// => ManagedSkiaColorFilter

export class ManagedSkiaColorFilter extends Skia.ManagedSkiaRef<Skia.ColorFilter> {
  // => skia
  public get skia () {
    invariant(super.skia)
    return super.skia
  }

  public filter: ColorFilter

  /**
   * 构造函数
   * @param {ColorFilter} filter 
   */
  constructor (filter: ColorFilter) {
    super(filter.createRawColorFilter())
    this.filter = filter
  }

  /**
   * 创建
   * @return {ColorFilter}
   */  
  resurrect () {
    return this.filter.createRawColorFilter()
  }
  
  /**
   * 是否相等
   * @param {ManagedSkiaColorFilter | null} other 
   * @returns {boolean}
   */  
  equal (other: ManagedSkiaColorFilter | null) {
    return (
      other instanceof ManagedSkiaColorFilter &&
      this.filter === other.filter
    )
  }

  /**
   * 是否相等
   * @param {ManagedSkiaColorFilter | null} other 
   * @returns {boolean}
   */
  notEqual (other: ManagedSkiaColorFilter | null) {
    return !this.equal(other)
  }

  toString () {
    return this.filter.toString()
  }
}

//// => BlendModeColorFilter
export class BlendModeColorFilter extends ColorFilter {
  protected color: Color
  protected blendMode: Skia.BlendMode

  createRawColorFilter () {
    return Engine.skia.ColorFilter.MakeBlend(
      this.color,
      this.blendMode
    )
  }

  /**
   * 构造函数
   * @param {Color} color
   * @param {BlendMode} blendMode
   */  
  constructor (color: Color, blendMode: Skia.BlendMode) {
    super()

    this.color = color
    this.blendMode = blendMode
  }

  /**
   * 是否相等
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

  /**
   * 是否相等
   * @param {BlendModeColorFilter} other
   * @return {boolean}
   */  
  notEqual (other: BlendModeColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @return {string}
   */  
  toString () {
    return `BlendModeColorFilter(
      [color]: ${this.color}, 
      [blendMode]: ${this.blendMode}
    )`
  }
}

//// => MatrixColorFilter
export class MatrixColorFilter extends ColorFilter {
  protected matrix: number[]

  /**
   * @param {number[]} matrix
   * @return {*}
   */  
  constructor (matrix: number[]) {
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
    
    return Engine.skia.ColorFilter.MakeMatrix(matrix)
  }

  /**
   * 是否相等
   * @param {MatrixColorFilter} other
   * @return {boolean}
   */  
  equal (other: MatrixColorFilter | null) {
    return (
      other instanceof MatrixColorFilter &&
      listEquals<number>(this.matrix, other.matrix)
    )
  }

  /**
   * 是否相等
   * @param {MatrixColorFilter} other 
   * @returns {boolean}
   */
  notEqual (other: MatrixColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @return {string}
   */  
  toString () {
    return `MatrixColorFilter(${this.matrix})`
  }
}

//// =>LinearToSRGBGammaColorFilter
export class LinearToSRGBGammaColorFilter extends ColorFilter {
  /**
   * @description: 
   * @return {ColorFilterSkiaObject}
   */  
  createRawColorFilter () {
    return Engine.skia.ColorFilter.MakeLinearToSRGBGamma()
  }

  /**
   * 是否相等
   * @param {LinearToSRGBGammaColorFilter | null} other 
   * @returns 
   */
  equal (other: LinearToSRGBGammaColorFilter | null) {
    return (
      other instanceof LinearToSRGBGammaColorFilter &&
      other === this
    )
  }

  notEqual (other: LinearToSRGBGammaColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * @return {string}
   */  
  toString () {
    return `LinearToSRGBGammaColorFilter()`
  }
}

//// => SRGBToLinearGammaColorFilter
export class SRGBToLinearGammaColorFilter extends ColorFilter {
  createRawColorFilter () {
    return Engine.skia.ColorFilter.MakeSRGBToLinearGamma()
  }

  /**
   * 是否相等
   * @param {SRGBToLinearGammaColorFilter | null} other 
   * @returns 
   */
  equal (other: SRGBToLinearGammaColorFilter | null) {
    return (
      other instanceof SRGBToLinearGammaColorFilter &&
      other === this
    )
  }

  /**
   * 是否相等
   * @param {SRGBToLinearGammaColorFilter | null} other 
   * @returns 
   */
  notEqual (other: SRGBToLinearGammaColorFilter | null) {
    return !this.equal(other)
  }
  
  toString () {
    return 'SRGBToLinearGammaColorFilter()'
  }
}

//// => ComposeColorFilter
// 合并滤镜
export class ComposeColorFilter extends ColorFilter {
  protected inner: ManagedSkiaColorFilter
  protected outer: ManagedSkiaColorFilter

   /**
   * @return {ColorFilterSkiaObject}
   */
  createRawColorFilter () {
    return Engine.skia.ColorFilter.MakeCompose(
      this.outer.skia,
      this.inner.skia
    )
  }

  /**
   * 构造函数
   * @param {ManagedSkiaColorFilter} inner
   * @param {ManagedSkiaColorFilter} outer
   */
  constructor (inner: ManagedSkiaColorFilter, outer: ManagedSkiaColorFilter) {
    super()

    this.inner = inner
    this.outer = outer
  }

  /**
   * 判断滤镜是否相同
   * @param {ComposeColorFilter} other
   * @return {boolean}
   */
  equal (other: ComposeColorFilter | null) {
    return (
      other instanceof ComposeColorFilter &&
      this.inner.equal(other.inner) &&
      this.outer.equal(other.outer)
    )  
  }

  notEqual (other: ComposeColorFilter | null) {
    return !this.equal(other)
  }

  /**
   * 输出字符串
   * @return {*}
   */  
  toString () {
    return `ComposeColorFilter(${this.inner}, ${this.outer})`
  }
}