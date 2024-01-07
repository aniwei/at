import { invariant } from '@at/utils'
import { Equalable } from '@at/basic'
import { Skia, TextPosition, ParagraphBuilder } from '@at/engine'
import { PlaceholderDimensions } from './text-painter'
import { TextPaintingStyle } from './text-style'

//// => Accumulator
export class Accumulator {
  static create (value: number) {
    return new Accumulator(value)
  }

  public value: number

  constructor (value: number = 0) {
    this.value = value
  }
  
  increment (addend: number) {
    invariant(addend >= 0)
    this.value += addend
  }
}

// => InlineSpanVisitor
// 遍历函数类型
export type InlineSpanVisitor = (span: InlineSpan) => boolean


//// => InlineSpan
// 文本
interface InlineSpanFactory <T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class InlineSpan extends Equalable<InlineSpan> {
  static create <T extends InlineSpan> (...rests: unknown[]): InlineSpan {
    const InlineSpanFactory = this as unknown as InlineSpanFactory<T>
    return new InlineSpanFactory(...rests)
  }

  // 文本样式
  style: TextPaintingStyle | null

  constructor (style: TextPaintingStyle | null) {
    super()
    this.style = style
  }

  abstract build (
    builder: ParagraphBuilder, 
    textScaleFactor: number, 
    dimensions: PlaceholderDimensions[] | null
  ): void

  abstract visit (visitor: InlineSpanVisitor): boolean
  abstract getSpanForPositionVisitor (position: TextPosition, offset: Accumulator): InlineSpan | null
  abstract computeToPlainText (buffer: string, includePlaceholders: boolean): string
  abstract codeUnitAtVisitor (index: number, offset: Accumulator): number | null
  abstract compareTo (other: InlineSpan): Skia.RenderComparison

  getSpanForPosition (position: TextPosition): InlineSpan | null {
    const offset = new Accumulator()
    let result: InlineSpan | null = null
    this.visit((span: InlineSpan) => {
      result = span.getSpanForPositionVisitor(position, offset)
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

    const offset = new Accumulator()
    let result: number | null = null
    
    this.visit((span: InlineSpan) => {
      result = span.codeUnitAtVisitor(index, offset)
      return result === null
    })

    return result
  }
  
  equal (other: InlineSpan | null) {
    return (
      other instanceof InlineSpan &&
      other.style === this.style
    )
  }

  notEqual (other: InlineSpan | null) {
    return !this.equal(other)
  }
}
