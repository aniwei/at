import { Equalable } from '@at/basic'
import * as Skia from './skia'

//// => ParagraphPlaceholder
export interface ParagraphPlaceholderOptions {
  width: number
  height: number
  alignment: Skia.PlaceholderAlignment
  baseline: Skia.TextBaseline
  offset: number
}

export class ParagraphPlaceholder extends Equalable<ParagraphPlaceholder> {
  static create (options: ParagraphPlaceholderOptions) {
    return new ParagraphPlaceholder(
      options.width,
      options.height,
      options.alignment,
      options.baseline,
      options.offset,
    )
  }

  public width: number
  public height: number
  public alignment: Skia.PlaceholderAlignment
  public baseline: Skia.TextBaseline
  public offset: number

  constructor (
    width: number,
    height: number,
    alignment: Skia.PlaceholderAlignment,
    baseline: Skia.TextBaseline,
    offset: number
  ) {
    super()

    this.width = width
    this.height = height
    this.alignment = alignment
    this.baseline = baseline
    this.offset = offset
  }

  equal (other: ParagraphPlaceholder | null): boolean {
    return (
      other instanceof ParagraphPlaceholder && 
      other.width === this.width &&
      other.height === this.height &&
      other.alignment === other.alignment &&
      other.baseline === other.baseline &&
      other.offset === other.offset
    )
  }

  notEqual (other: ParagraphPlaceholder | null): boolean {
    return !this.equal(other)
  }
}

/// => PlaceholderSpan
export class PlaceholderSpan extends ParagraphPlaceholder {

  public start: number
  public end: number

  constructor (
    index: number,
    width: number,
    height: number,
    alignment: Skia.PlaceholderAlignment, 
    baselineOffset: number,
    baseline: Skia.TextBaseline,
  ) {
    super(
      width,
      height,
      alignment,
      baseline,
      baselineOffset,
    )

    this.start = index
    this.end = index
  }
}