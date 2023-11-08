import { invariant } from '@at/utils'
import { RenderComparison } from '../at'
import { AtTextPaintingStyle } from './text-style'
import { AtPlaceholderDimensions } from './text-painter'
import { AtParagraphBuilder, AtTextPosition } from '../engine/text'

// 累加器
export class Accumulator {
  // 累加值
  public value: number

  constructor (value: number = 0) {
    this.value = value
  }
  
  increment (addend: number) {
    invariant(addend >= 0)
    this.value += addend
  }
}

export type InlineSpanVisitor = (span: InlineSpan) => boolean

export abstract class InlineSpan extends Equalable<InlineSpan> {  
  static create (style: TextPaintingStyle) {
    return new InlineSpan(style)
  }

  public style: TextPaintingStyle | null

  constructor (style: TextPaintingStyle | null) {
    this.style = style
  }

  abstract build (
    builder: ParagraphBuilder, 
    textScaleFactor: number, 
    dimensions: PlaceholderDimensions[] | null
  ): void

  abstract visit (visitor: InlineSpanVisitor): boolean
  abstract getSpanForPositionVisitor (position: TextPosition, accumulator: Accumulator): InlineSpan | null
  abstract computeToPlainText (buffer: string, includePlaceholders: boolean): string
  abstract codeUnitAtVisitor (index: number, accumulator: Accumulator): number | null
  abstract compareTo (other: InlineSpan): RenderComparison

  getSpanForPosition (position: AtTextPosition): InlineSpan | null {
    const accumulator = new Accumulator()
    let result: InlineSpan | null = null

    this.visit((span: InlineSpan) => {
      result = span.getSpanForPositionVisitor(position, accumulator)
      return result === null
    })

    return result
  }

  toPlainText (includePlaceholders = true) {
    const text = this.computeToPlainText('', includePlaceholders)
    return text
  }

  codeUnitAt (index: number): number | null {
    if (index < 0) {
      return null
    }

    const accumulator = new Accumulator()
    let result: number | null = null
    
    this.visit((span: AtInlineSpan) => {
      result = span.codeUnitAtVisitor(index, accumulator)
      return result === null
    })

    return result
  }
  
  equal (other: AtInlineSpan | null) {
    return (
      other instanceof AtInlineSpan &&
      other.style === this.style
    )
  }

  notEqual (other: AtInlineSpan | null) {
    return !this.equal(other)
  }
}
