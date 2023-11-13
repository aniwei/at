import { TextRange } from './text-range'
import { AtEngine } from './engine'
import { TextPosition } from './text-position'

import * as Skia from './skia'

export type TextSelectionOptions = {
  baseOffset: number,
  extentOffset: number,
  affinity?: Skia.Affinity,
  isDirectional?: boolean
}

export class TextSelection extends TextRange {
  static create (start: TextSelectionOptions | number, end?: number) {
    const options = start as TextSelectionOptions

    return new TextSelection(
      options.baseOffset,
      options.extentOffset,
      options?.affinity,
      options?.isDirectional
    )
  }

  constructor (
    baseOffset: number,
    extentOffset: number,
    affinity = AtEngine.skia.Affinity.Downstream,
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
  
  static collapsed(
    offset: number,
    affinity: Skia.Affinity = AtEngine.skia.Affinity.Downstream,
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
  
  public get base (): TextPosition {
    let affinity: Skia.Affinity
    
    if (!this.valid || this.baseOffset === this.extentOffset) {
      affinity = this.affinity
    } else if (this.baseOffset < this.extentOffset) {
      affinity = AtEngine.skia.Affinity.Downstream
    } else {
      affinity = AtEngine.skia.Affinity.Upstream
    }

    return TextPosition.create({
      offset: this.baseOffset,
      affinity
    })
  }

  public get extent (): TextPosition {
    let affinity: Skia.Affinity
    if (!this.valid || this.baseOffset === this.extentOffset) {
      affinity = this.affinity
    } else if (this.baseOffset < this.extentOffset) {
      affinity = AtEngine.skia.Affinity.Upstream
    } else {
      affinity = AtEngine.skia.Affinity.Downstream
    }
    
    return new TextPosition(this.extentOffset, affinity)
  }

  public baseOffset: number
  public extentOffset: number
  public affinity: Skia.Affinity
  public isDirectional: boolean

  equal (other: TextSelection | null) {
    return (
      other instanceof TextSelection &&
      other.baseOffset === this.baseOffset &&
      other.extentOffset === this.extentOffset &&
      other.isDirectional === this.isDirectional &&
      (!this.collapsed || other.affinity === this.affinity)
    )
  }

  notEqual (other: TextSelection | null) {
    return !this.equal(other)
  }
  
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

  expandTo (position: TextPosition, extentAtIndex: boolean = false): TextSelection {
    if (position.offset >= this.start && position.offset <= this.end) {
      return this;
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
    
  toStrin () {
    return `TextSelection(

    )`
  }
}