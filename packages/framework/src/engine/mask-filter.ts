import { At } from '../at'
import { BlurStyle, MaskFilter, AtManagedSkiaObject } from './skia'



export class AtMaskFilter extends AtManagedSkiaObject<MaskFilter> {
  static resurrect (blurStyle: BlurStyle, sigma: number) {
    return At.MaskFilter.MakeBlur(blurStyle, sigma, true)
  }
  /**
   * 
   * @param {BlurStyle} blurStyle 
   * @param {number} sigma 
   * @returns {AtMaskFilter}
   */
  static blur (blurStyle: BlurStyle, sigma: number) {
    return new AtMaskFilter(blurStyle, sigma)
  }

  protected blurStyle: BlurStyle
  protected sigma: number

  /**
   * 构造函数 
   * @param blurStyle 
   * @param sigma 
   */
  constructor (blurStyle: BlurStyle, sigma: number) {
    super(AtMaskFilter.resurrect(blurStyle, sigma))

    this.blurStyle = blurStyle
    this.sigma = sigma
  }

  /**
   * 创建 MaskFilter Skia 对象
   * @return {MaskFilter}
   */  
  resurrect (): MaskFilter {
    return AtMaskFilter.resurrect(this.blurStyle, this.sigma)
  }

  /**
   * 释放对象
   * @return {void}
   */  
  delete () {
    this.skia?.delete();
  }
}
