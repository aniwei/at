import { invariant, listEquals } from '@at/utils'
import { Skia, ParagraphBuilder, TextPosition, Engine } from '@at/engine'
import { PlaceholderDimensions } from './text-painter'
import { TextPaintingStyle } from './text-style'
import { 
  Accumulator, 
  InlineSpan, 
  InlineSpanVisitor 
} from './inline-span'

//// => TextSpan
// 文本类
export type TextSpanOptions = {
  text?: string | null,
  children?: InlineSpan[] | null,
  style?: TextPaintingStyle | null,
  spellOut?: boolean
}

export class TextSpan extends InlineSpan {
  /**
   * 创建文本
   * @param {TextSpanOptions} options 
   * @returns {TextSpan}
   */
  static create (options: TextSpanOptions) {
    return new TextSpan(
      options.text ?? null,
      options.children ?? null,
      options.style ?? null,
      options.spellOut ?? null,
    )
  }

  public text: string | null 
  public children: InlineSpan[] | null
  public spellOut: boolean | null

  constructor (
    text: string | null,
    children: InlineSpan[] | null,
    style: TextPaintingStyle | null,
    spellOut: boolean | null,
  ) {
    super(style)

    this.text = text
    this.spellOut = spellOut
    this.children = children    
  }  

  build (
    builder: ParagraphBuilder,
    textScaleFactor: number = 1.0,
    dimensions: PlaceholderDimensions[],
  ) {
    
    if (this.style !== null)
      builder.push(this.style.getTextStyle(textScaleFactor))
    if (this.text !== null) {
      try {
        builder.text(this.text)
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
        builder.text('\uFFFD')
      }
    }

    if (this.children !== null) {
      for (const child of this.children) {
        invariant(child !== null)
        child.build(
          builder,
          textScaleFactor,
          dimensions,
        )
      }
    }
    if (this.style !== null) {
      builder.pop()
    }
  }

  visit (visitor: InlineSpanVisitor) {
    // 先遍历自身
    if (this.text !== null) {
      if (!visitor(this)) {
        return false
      }
    }

    if (this.children !== null && this.children.length > 0) {
      for (const child of this.children) {
        if (!child.visit(visitor))
          return false
      }
    }

    return true
  }

  
  getSpanForPositionVisitor (
    position: TextPosition, 
    offset: Accumulator
  ): InlineSpan | null {
    if (this.text === null) {
      return null
    }

    const affinity = position.affinity
    const targetOffset = position.offset
    const endOffset = offset.value + this.text.length

    if (
      offset.value === targetOffset && 
      affinity === Engine.skia.Affinity.Downstream ||
      offset.value < targetOffset && 
      targetOffset < endOffset ||
      endOffset === targetOffset && 
      affinity === Engine.skia.Affinity.Upstream
    ) {
      return this
    }
  
    offset.increment(this.text.length)

    return null
  }

  computeToPlainText (
    text: string, 
    includePlaceholders: boolean = true,
  ) {
    if (this.text !== null) {
      text += this.text
    }
    if (this.children !== null && this.children.length > 0) {
      for (const child of this.children) {
        text = child.computeToPlainText(
          text,
          includePlaceholders,
        )
      }
    }

    return text
  }

  codeUnitAtVisitor (index: number, offset: Accumulator): number | null {
    if (this.text === null) {
      return null
    }

    if (index - offset.value < this.text.length) {
      return this.text.charCodeAt(index - offset.value)
    }

    offset.increment(this.text.length)
    return null
  }

  compareTo (other: InlineSpan): Skia.RenderComparison {
    if (other === this) {
      return Skia.RenderComparison.Identical
    }

    const textSpan = other as TextSpan
    if (
      textSpan.text !== this.text ||
      this.children?.length !== textSpan.children?.length ||
      (this.style === null) !== (textSpan.style === null)
    ) {
      return Skia.RenderComparison.Layout
    }
      
    let result = Skia.RenderComparison.Identical
    
    if (this.style !== null) {
      invariant(textSpan.style)
      const candidate = this.style.compareTo(textSpan.style)
      
      if (candidate > result) {
        result = candidate
      }

      if (result === Skia.RenderComparison.Layout) {
        return result
      }
    }

    
    if (this.children !== null && this.children.length > 0) {
      invariant(textSpan.children)
      for (let index = 0; index < this.children.length; index += 1) {
        const candidate = this.children[index].compareTo(textSpan.children[index])
        
        if (candidate > result) {
          result = candidate
        }

        if (result === Skia.RenderComparison.Layout)
          return result
      }
    }

    return result
  }
  
  /**
   * 
   * @param {TextSpan | null} other 
   * @returns {boolean}
   */
  equal (other: TextSpan | null) {
    return (
      other instanceof TextSpan &&
      other.text === this.text &&
      listEquals<InlineSpan>(other.children, this.children)
    )
  }

  /**
   * 
   * @param {TextSpan | null} other 
   * @returns {boolean}
   */
  notEqual (other: TextSpan | null): boolean {
    return !this.equal(other)
  }
}
