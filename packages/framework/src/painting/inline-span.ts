import { invariant } from '@at/utility'
import { RenderComparison } from '../at'
import { AtTextPaintingStyle } from './text-style'
import { AtPlaceholderDimensions } from './text-painter'
import { AtParagraphBuilder, AtTextPosition } from '../engine/text'


export class AtAccumulator {
  public value: number

  constructor (value: number = 0) {
    this.value = value
  }
  
  increment (addend: number) {
    invariant(addend >= 0)
    this.value += addend
  }
}

export type InlineSpanVisitor = (span: AtInlineSpan) => boolean



export abstract class AtInlineSpan {
  style: AtTextPaintingStyle | null

  constructor (style: AtTextPaintingStyle | null) {
    this.style = style
  }

  abstract build (
    builder: AtParagraphBuilder, 
    textScaleFactor: number, 
    dimensions: AtPlaceholderDimensions[] | null
  ): void

  abstract visit (visitor: InlineSpanVisitor): boolean
  abstract getSpanForPositionVisitor (position: AtTextPosition, offset: AtAccumulator): AtInlineSpan | null
  abstract computeToPlainText (buffer: string, includePlaceholders: boolean): string
  abstract codeUnitAtVisitor (index: number, offset: AtAccumulator): number | null
  abstract compareTo (other: AtInlineSpan): RenderComparison


  getSpanForPosition (position: AtTextPosition): AtInlineSpan | null {
    const offset = new AtAccumulator()
    let result: AtInlineSpan | null = null
    this.visit((span: AtInlineSpan) => {
      result = span.getSpanForPositionVisitor(position, offset)
      return result === null
    })

    return result
  }

  toPlainText (includePlaceholders = true) {
    const text = this.computeToPlainText(``, includePlaceholders)
    return text
  }

  codeUnitAt (index: number): number | null {
    if (index < 0) {
      return null
    }

    const offset = new AtAccumulator()
    let result: number | null = null
    
    this.visit((span: AtInlineSpan) => {
      result = span.codeUnitAtVisitor(index, offset)
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
