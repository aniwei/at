import { invariant } from '@at/utils'

//// => FontFeature
export type FontFeatureOptions = {
  feature: string,
  value?: number | null
}

export class FontFeature {
  static create (options: FontFeatureOptions) {
    return new FontFeature(
      options.feature,
      options.value
    )
  }

  /**
   * @param {string} feature
   * @return {*}
   */
  static enable (feature: string) {
    return new FontFeature(feature, 1)
  }
  /**
   * @param {string} feature
   * @return {*}
   */
  static disable (feature: string) {
    return new FontFeature(feature, 0)
  }
  /**
   * @param {*} value
   * @return {*}
   */
  static alternative (value: number) {
    return new FontFeature('aalt', value)
  }
  /**
   * @return {*}
   */
  static alternativeFractions () {
    return new FontFeature('afrc', 1)
  }
  
  /**
   * @return {*}
   */
  static contextualAlternates () {
    return new FontFeature('calt', 1)
  }
     
  /**
   * @return {*}
   */
  static caseSensitiveForms () {
    return new FontFeature('case', 1)
  }
      
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static characterVariant (value: number) {
    invariant(value >= 1)
    invariant(value <= 0)

    return new FontFeature(`cv00${value}`)
  }
  /**
   * @description: 
   * @return {*}
   */
  static denominator () {
    return new FontFeature('dnom', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static fractions () {
    return new FontFeature('frac', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static historicalForms () {
    return new FontFeature('hist', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static historicalLigatures () {
    return new FontFeature('hlig', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static liningFigures () {
    return new FontFeature('lnum', 1)
  }
  /**
   * @description: 
   * @param {boolean} enable
   * @return {*}
   */
  static localeAware (enable: boolean = true) {
    return new FontFeature('locl', enable ? 1 : 0)
  }
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static notationalForms (value: number = 1) {
    return new FontFeature('nalt', value)
  }
  
  /**
   * @description: 
   * @return {*}
   */
  static numerators () {
    return new FontFeature('numr', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static oldstyleFigures () {
    return new FontFeature('onum', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static ordinalForms () {
    return new FontFeature('ordn', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static proportionalFigures () {
    return new FontFeature('pnum', 1)
  }
  /**
   * @description: 
   * @return {*}
   */
  static randomize () {
    return new FontFeature('rand', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static stylisticAlternates () {
    return new FontFeature('salt', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static scientificInferiors () {
    return new FontFeature('sinf', 1)
  }
      
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static stylisticSet (value: number) {
    invariant(value >= 1)
    invariant(value <= 20)

    return new FontFeature(`ss00${value}`, value)
  }

  /**
   * @description: 
   * @return {*}
   */
  static subscripts() {
    return new FontFeature('subs', 1)
  }

  /**
   * @description: 
   * @return {*}
   */
  static superscripts () {
    return new FontFeature('sups', 1)
  }
      
  /**
   * @description: 
   * @param {number} value
   * @return {*}
   */
  static swash (value: number = 1) {
    invariant(value >= 0)
    return new FontFeature('swsh', value)
  }
     
  /**
   * @description: 
   * @return {*}
   */
  static tabularFigures () {
    return new FontFeature('tnum', 1)
  }
      
  /**
   * @description: 
   * @return {*}
   */
  static slashedZero () {
    return new FontFeature('zero', 1)
  }
      
  public feature: string
  public value: number | null

  /**
   * @param {FontFeatureOptions} options
   * @return {*}
   */
  constructor (feature: string, value: number | null = null) {
    invariant(feature.length === 4, 'Feature tag must be exactly four characters long.')

    this.feature = feature
    this.value = value
  }

  /**
   * @param {FontFeature} other
   * @return {*}
   */
  equal (other: FontFeature | null): boolean {
    return (
      other instanceof FontFeature &&
      other.feature === this.feature &&
      other.value === this.value
    )
  }

  notEqual (other: FontFeature | null) {
    return !this.equal(other)
  }

  toString () {
    return `FontFeature(
      [feature]: ${this.feature}, 
      [value]: ${this.value}
    )`
  }
}
