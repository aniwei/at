import { Equalable } from '@at/basic'
import { listEquals } from '@at/utils'
import { TextLeadingDistributionKind } from './text-style'

import * as Skia from './skia'

//// => StructStyle
export interface StructStyleOptions {
  fontFamily: string | null 
  fontFamilyFallback: string[] | null 
  fontSize: number | null 
  height: number | null 
  leadingDistribution: TextLeadingDistributionKind | null 
  leading: number | null 
  fontWeight: Skia.FontWeight | null 
  fontStyle: Skia.FontSlant | null 
  forceStrutHeight: boolean | null 
}

export class StrutStyle implements Equalable<StrutStyle> {
  static create (options?: StructStyleOptions) {
    return new StrutStyle(
      options?.fontFamily,
      options?.fontFamilyFallback,
      options?.fontSize,
      options?.height,
      options?.leadingDistribution,
      options?.leading,
      options?.fontWeight,
      options?.fontStyle,
      options?.forceStrutHeight,
    )
  }

  public fontFamily: string | null
  public fontFamilyFallback: string[] | null
  public fontSize: number | null
  public height: number | null
  public leading: number | null
  public fontWeight: Skia.FontWeight | null
  public fontStyle: Skia.FontSlant | null
  public forceStrutHeight: boolean | null
  public leadingDistribution: TextLeadingDistributionKind | null
  
  /**
   * @param {string} fontFamily
   * @param {string} fontFamilyFallback
   * @param {number} fontSize
   * @param {number} height
   * @param {TextLeadingDistributionKind} leadingDistribution
   * @param {number} leading
   * @param {Skia.FontWeight} fontWeight
   * @param {Skia.FontSlant} fontStyle
   * @param {boolean} forceStrutHeight
   */
  constructor (
    fontFamily: string | null = null,
    fontFamilyFallback: string[] | null = null,
    fontSize: number | null = null,
    height: number | null = null,
    leadingDistribution: TextLeadingDistributionKind | null = null,
    leading: number | null = null,
    fontWeight: Skia.FontWeight | null = null,
    fontStyle: Skia.FontSlant | null = null,
    forceStrutHeight: boolean | null = null,
  ) {
    
    this.fontSize = fontSize
    this.fontFamily = fontFamily
    this.height = height
    this.leading = leading
    this.fontWeight = fontWeight
    this.fontStyle = fontStyle
    this.forceStrutHeight = forceStrutHeight
    this.fontFamilyFallback = fontFamilyFallback
    this.leadingDistribution = leadingDistribution
  }  

  /**
   * 是否相等
   * @param {StrutStyle} other
   * @return {boolean}
   */
  equal (other: StrutStyle | null) {
    return (
      other instanceof StrutStyle &&
      other.fontFamily === this.fontFamily &&
      other.fontSize === this.fontSize &&
      other.height === this.height &&
      other.leading === this.leading &&
      other.leadingDistribution === this.leadingDistribution &&
      other.fontWeight === this.fontWeight &&
      other.fontStyle === this.fontStyle &&
      other.forceStrutHeight === this.forceStrutHeight &&
      listEquals<string>(other.fontFamilyFallback ?? [], this.fontFamilyFallback ?? [])
    )
  }

  /**
   * 是否相等
   * @param {StrutStyle | null} other 
   * @returns {boolean} 
   */
  notEqual (other: StrutStyle | null) {
    return !this.equal(other)
  }
}