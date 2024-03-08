import { listEquals } from '@at/utils'
import { ColorFilter } from './color-filter'
import { Engine } from './engine'
import { toFilterQuality, toMatrix } from './to'

import * as Skia from './skia'


//// => ImageFilter
// 图片滤镜
export abstract class ImageFilter extends Skia.ManagedSkiaRef<Skia.ImageFilter> {
  // 模糊
  static blur (sigmaX: number, sigmaY: number, tileMode: Skia.TileMode) {
    return new BlurImageFilter(sigmaX, sigmaY, tileMode)
  }

  // 颜色
  static color (filter: Skia.ColorFilter) {
    return ColorFilterImageFilter.create(filter)
  }
  
  // 矩阵
  static matrix (matrix: number[], filterQuality: Skia.FilterQuality) {
    return new MatrixImageFilter(matrix, filterQuality)
  }

  public get image (): Skia.ManagedSkiaRef<Skia.ImageFilter> {
    return this
  }
}

//// => BlurImageFilter
// 图片模糊滤镜
export class BlurImageFilter extends ImageFilter {
  static create (
    sigmaX: number, 
    sigmaY: number, 
    tileMode: Skia.TileMode
  ) {
    return super.create(
      sigmaX,
      sigmaY,
      tileMode
    ) as BlurImageFilter
  }

  static resurrect<T extends Skia.SkiaRef>(
    sigmaX: number, 
    sigmaY: number, 
    tileMode: Skia.TileMode
  ): Skia.ImageFilter {
    return Engine.skia.ImageFilter.MakeBlur(sigmaX, sigmaY, tileMode, null)
  }

  // => mode 
  // 模糊模式
  get mode () {
    switch (this.tileMode) {
      case Engine.skia.TileMode.Clamp:
        return 'clamp'
      case Engine.skia.TileMode.Mirror:
        return 'mirror'
      case Engine.skia.TileMode.Repeat:
        return 'repeated'
      case Engine.skia.TileMode.Decal:
        return 'decal'
    }
  }

  protected sigmaX: number
  protected sigmaY: number 
  protected tileMode: Skia.TileMode

  /**
   * 构造函数
   * @param {number} sigmaX
   * @param {number} sigmaY
   * @param {TileMode} tileMode
   * @return {AtBlurImageFilter}
   */
  constructor (sigmaX: number, sigmaY: number, tileMode: Skia.TileMode) {
    super(BlurImageFilter.resurrect(sigmaX, sigmaX, tileMode))

    this.sigmaX = sigmaX
    this.sigmaY = sigmaY
    this.tileMode = tileMode
  }

  /**
   * 判断模糊滤镜是否相同
   * @param {BlurImageFilter} other
   * @return {boolean}
   */  
  equal (other: BlurImageFilter | null): boolean {
    return (
      other instanceof BlurImageFilter &&
      other.sigmaX === this.sigmaX &&
      other.sigmaY === this.sigmaY &&
      other.tileMode === this.tileMode
    )
  }

  /**
   * 创建 Skia 对象
   * @return {Skia.ImageFilter}
   */  
  resurrect (): Skia.ImageFilter {
    return BlurImageFilter.resurrect(
      this.sigmaX,
      this.sigmaY,
      this.tileMode,
    )
  }

  /**
   * 输出字符串
   * @returns {string}
   */
  toString () {
    return `ImageFilter.blur(
      [sigmaX]: ${this.sigmaX}, 
      [sigmaY]: ${this.sigmaY}, 
      [mode]: ${this.mode}
      )`
  }
}

//// => MatrixImageFilter
// 矩阵滤镜
export class MatrixImageFilter extends ImageFilter {
  /**
   * 创建 Skia 对象
   * @param {number[]} matrix 
   * @param {Skia.FilterQuality} quality 
   * @returns {ImageFilter}
   */
  static resurrect (matrix: number[], quality: Skia.FilterQuality) {
    return Engine.skia.ImageFilter.MakeMatrixTransform(
      toMatrix(matrix),
      toFilterQuality(quality)!,
      null,
    )
  }

  protected matrix: number[]
  protected quality: Skia.FilterQuality

  constructor (matrix: number[], quality: Skia.FilterQuality) {
    super(MatrixImageFilter.resurrect(matrix, quality))

    this.matrix = matrix
    this.quality = quality
  }

  /**
   * 创建 Skia 对象
   * @returns ImageFilter
   */
  resurrect (): Skia.ImageFilter {
    return MatrixImageFilter.resurrect(this.matrix, this.quality)
  }
  
  /**
   * 判断两个对象是否相同
   * @param {MatrixImageFilter} other 
   * @returns {boolean}
   */
  equal (other: MatrixImageFilter | null): boolean {
    
    return (
      other instanceof MatrixImageFilter &&
      this.quality === other.quality &&
      listEquals<number>(this.matrix, other.matrix)
    )
  }

  /**
   * 输出字符串
   * @returns 
   */
  toString () {
    return `AtMatrixImageFilter(
      [matrix]: ${this.matrix}, 
      [quality]: ${this.quality}
    )`
  } 
}


export class ColorFilterImageFilter extends ImageFilter {
  static create (...rests: unknown[]): ColorFilterImageFilter {
    return super.create(...rests) as ColorFilterImageFilter
  }

  protected color: ColorFilter
  
  /**
   * 构造函数
   * @param {AtColorFilter} colorFilter
   * @return {ColorFilterImageFilter}
   */  
  constructor (color: ColorFilter) {
    super(color.createRawImageFilter())
    this.color = color
  }

  /**
   * @return {ImageFilter}
   */  
  resurrect (): Skia.ImageFilter {
    return this.color.createRawImageFilter()
  }

  /**
   * 判断滤镜是否相同
   * @param {ColorFilterImageFilter} other
   * @return {boolean}
   */  
  equal (other: ColorFilterImageFilter | null): boolean {
    return (
      other instanceof ColorFilterImageFilter &&
      this.color === other.color
    )
  }

  /**
   * 
   * @param other 
   * @returns 
   */
  notEqual (other: ColorFilterImageFilter | null): boolean {
    return !this.equal(other)
  }
  
  /**
   * 输出字符串
   * @return {string}
   */  
  toString () {
    return this.color.toString()
  } 
}
