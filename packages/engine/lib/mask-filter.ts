import { Engine } from './engine'
import * as Skia from './skia'

export class MaskFilter extends Skia.ManagedSkiaRef<Skia.MaskFilter> {
  static resurrect (blurStyle: Skia.BlurStyle, sigma: number) {
    return Engine.skia.MaskFilter.MakeBlur(blurStyle, sigma, true)
  }
  /**
   * 模糊滤镜
   * @param {BlurStyle} blurStyle 
   * @param {number} sigma 
   * @returns {AtMaskFilter}
   */
  static blur (blurStyle: Skia.BlurStyle, sigma: number) {
    return new MaskFilter(blurStyle, sigma)
  }

  protected blurStyle: Skia.BlurStyle
  protected sigma: number

  /**
   * 构造函数 
   * @param blurStyle 
   * @param sigma 
   */
  constructor (blurStyle: Skia.BlurStyle, sigma: number) {
    super(MaskFilter.resurrect(blurStyle, sigma))

    this.blurStyle = blurStyle
    this.sigma = sigma
  }

  /**
   * 创建 MaskFilter Skia 对象
   * @return {Skia.MaskFilter}
   */  
  resurrect (): Skia.MaskFilter {
    return MaskFilter.resurrect(this.blurStyle, this.sigma)
  }

  /**
   * 释放对象
   * @return {void}
   */  
  dispose () {
    this.skia?.delete()
  }
}
