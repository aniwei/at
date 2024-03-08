import { TextLeadingDistributionKind } from './text-style'

export interface TextHeightBehaviorOptions {
  applyHeightToFirstAscent?: boolean
  applyHeightToLastDescent?: boolean
  leadingDistribution?: TextLeadingDistributionKind
}

export class TextHeightBehavior {
  static create (options?: TextHeightBehaviorOptions) {
    return new TextHeightBehavior(
      options?.applyHeightToFirstAscent,
      options?.applyHeightToLastDescent,
      options?.leadingDistribution,
    )
  }

  public applyHeightToFirstAscent: boolean
  public applyHeightToLastDescent: boolean
  public leadingDistribution: TextLeadingDistributionKind
 
  /**
   * 
   * @param {boolean} applyHeightToFirstAscent 
   * @param {boolean} applyHeightToLastDescent 
   * @param {boolean} leadingDistribution 
   */
  constructor (
    applyHeightToFirstAscent: boolean = true,
    applyHeightToLastDescent: boolean = true,
    leadingDistribution: TextLeadingDistributionKind = TextLeadingDistributionKind.Proportional,
  ) {
    this.applyHeightToFirstAscent = applyHeightToFirstAscent
    this.applyHeightToLastDescent = applyHeightToLastDescent
    this.leadingDistribution = leadingDistribution
  }

  /**
   * @param {TextHeightBehavior} other
   * @returns {boolean}
   */  
  equal (other: TextHeightBehavior | null) {
    
    return (
      other instanceof TextHeightBehavior &&
      other.applyHeightToFirstAscent === this.applyHeightToFirstAscent &&
      other.applyHeightToLastDescent === this.applyHeightToLastDescent &&
      other.leadingDistribution === this.leadingDistribution
    )
  }

  /**
   * 
   * @param {TextHeightBehavior | null} other  
   * @returns {boolean}
   */
  notEqual (other: TextHeightBehavior | null) {
    return !this.equal(other)
  }

  toString () {
    return `TextHeightBehavior(
      [applyHeightToFirstAscent]: ${this.applyHeightToFirstAscent},
      [applyHeightToLastDescent]: ${this.applyHeightToLastDescent},
      [leadingDistribution]: ${this.leadingDistribution},
    )`
  }
}