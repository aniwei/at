import * as Skia from './skia'

export class LineMetrics {
  public skia: Skia.LineMetrics
  // => ascent 
  // 升序
  get ascent () {
    return this.skia.ascent
  } 

  // => descent
  // 降序
  get descent () {
    return this.skia.descent
  }

  get unscaledAscent () {
    return this.skia.ascent
  }

  get hardBreak () {
    return this.skia.isHardBreak
  }

  // => baseline
  // 基线
  get baseline () {
    return this.skia.baseline
  }

  get width () {
    return this.skia.width
  }

  get height () {
    return Math.round(this.skia.ascent + this.skia.descent)
  }

  get left () {
    return this.skia.left
  } 

  get lineNumber () {
    return this.skia.lineNumber
  } 
  
  /**
   * @param {Skia.LineMetrics} lineMetrics
   * @return {*}
   */
  constructor (lineMetrics: Skia.LineMetrics) {
    this.skia = lineMetrics
  }
}