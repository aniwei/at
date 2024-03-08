import { TextRange } from './text-range'
import { Engine } from './engine'
import { TextPosition } from './text-position'

import * as Skia from './skia'

export interface TextSelectionOptions {
  baseOffset: number,
  extentOffset: number,
  affinity?: Skia.Affinity,
  isDirectional?: boolean
}

export class TextSelection extends TextRange {
  /**
   * 
   * @param {TextSelectionOptions | number} start 
   * @param {number | null?} end 
   * @returns 
   */
  static create (start: TextSelectionOptions | number, end?: number | null) {
    let options: TextSelectionOptions = {
      baseOffset: -1,
      extentOffset: -1
    }

    if (end === undefined || end === null) {
      options = start as TextSelectionOptions
    } else {
      options.baseOffset = start as number
      options.extentOffset = end
    }

    return new TextSelection(
      options.baseOffset,
      options.extentOffset,
      options?.affinity,
      options?.isDirectional
    )
  }


  static collapsed(
    offset: number,
    affinity: Skia.Affinity = Engine.skia.Affinity.Downstream,
  ) {
    return TextSelection.create({
      baseOffset: offset,
      extentOffset: offset,
      isDirectional: false,
      affinity
    })
  }

  static fromPosition (position: TextPosition) {
    return TextSelection.create({
      baseOffset: position.offset,
      extentOffset: position.offset,
      affinity: position.affinity,
      isDirectional: false
    })
  }

  // => base
  public get base (): TextPosition {
    let affinity: Skia.Affinity
    
    if (!this.valid || this.baseOffset === this.extentOffset) {
      affinity = this.affinity
    } else if (this.baseOffset < this.extentOffset) {
      affinity = Engine.skia.Affinity.Downstream
    } else {
      affinity = Engine.skia.Affinity.Upstream
    }

    return TextPosition.create({
      offset: this.baseOffset,
      affinity
    })
  }

  // => extent
  public get extent (): TextPosition {
    let affinity: Skia.Affinity
    if (!this.valid || this.baseOffset === this.extentOffset) {
      affinity = this.affinity
    } else if (this.baseOffset < this.extentOffset) {
      affinity = Engine.skia.Affinity.Upstream
    } else {
      affinity = Engine.skia.Affinity.Downstream
    }
    
    return new TextPosition(this.extentOffset, affinity)
  }

  public baseOffset: number
  public extentOffset: number
  public affinity: Skia.Affinity
  public isDirectional: boolean

  constructor (
    baseOffset: number,
    extentOffset: number,
    affinity = Engine.skia.Affinity.Downstream,
    isDirectional: boolean = false,
  ) {
    super(
      baseOffset < extentOffset ? baseOffset : extentOffset,
      baseOffset < extentOffset ? extentOffset : baseOffset,
    )

    this.baseOffset = baseOffset
    this.extentOffset = extentOffset
    this.affinity = affinity
    this.isDirectional = isDirectional
  }

  /**
   * 
   * @param {TextSelection | null} other 
   * @returns {boolean}
   */
  equal (other: TextSelection | null) {
    return (
      other instanceof TextSelection &&
      other.baseOffset === this.baseOffset &&
      other.extentOffset === this.extentOffset &&
      other.isDirectional === this.isDirectional &&
      (!this.collapsed || other.affinity === this.affinity)
    )
  }

  /**
   * 
   * @param {TextSelection | null} other 
   * @returns {boolean}
   */
  notEqual (other: TextSelection | null) {
    return !this.equal(other)
  }
  
  /**
   * 复制
   * @param { number | null?} baseOffset 
   * @param { number | null?} extentOffset 
   * @param { Skia.Affinity | null?} affinity 
   * @param { boolean | null?} isDirectional 
   * @returns 
   */
  copyWith (
    baseOffset?: number | null,
    extentOffset?: number | null,
    affinity?: Skia.Affinity | null,
    isDirectional?: boolean | null,
  ) {
    return TextSelection.create({
      baseOffset: baseOffset ?? this.baseOffset,
      extentOffset: extentOffset ?? this.extentOffset,
      affinity: affinity ?? this.affinity,
      isDirectional: isDirectional ?? this.isDirectional,
    })
  }

  /**
   * 
   * @param {TextPosition} position 
   * @param {boolean} extentAtIndex 
   * @returns 
   */
  expandTo (
    position: TextPosition, 
    extentAtIndex: boolean = false
  ): TextSelection {
    if (position.offset >= this.start && position.offset <= this.end) {
      return this
    }

    const normalized = this.baseOffset <= this.extentOffset
    if (position.offset <= this.start) {
      if (extentAtIndex) {
        return this.copyWith(
          this.end,
          position.offset,
          position.affinity,
          false
        )
      }
      return this.copyWith(
        normalized ? position.offset : this.baseOffset,
        normalized ? this.extentOffset : position.offset,
        null,
        false
      )
    }
    if (extentAtIndex) {
      return this.copyWith(
        this.start,
        position.offset,
        position.affinity,
        false
      )
    }
    return this.copyWith(
      normalized ? this.baseOffset : position.offset,
      normalized ? position.offset : this.extentOffset,
      null,
      false
    )
  }

  /**
   * 
   * @param {TextPosition} position 
   * @returns {TextSelection}
   */
  extendTo (position: TextPosition): TextSelection {
    if (this.extent === position) {
      return this
    }

    return this.copyWith(
      position.offset,
      null,
      position.affinity,
      false
    )
  }
    
  toString () {
    return `TextSelection(
      [baseOffset]: ${this.baseOffset},
      [extentOffset]: ${this.extentOffset},
      [affinity]: ${this.affinity},
      [isDirectional]: ${this.isDirectional},
    )`
  }
}