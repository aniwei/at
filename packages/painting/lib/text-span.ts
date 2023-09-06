import invariant from 'ts-invariant'
import { AtPointerEvent } from '../gestures/events'
import { AtGestureRecognizer } from '../gestures/recognizer'
import { At, RenderComparison } from '../at'
import { listEquals } from '../basic/helper'
import { AtHitTestEntry } from '../gestures/hit-test'
import { AtPlaceholderDimensions } from './text-painter'
import { AtTextPaintingStyle } from './text-style'
import { AtParagraphBuilder, AtTextPosition } from '../engine/text'
import { PointerEnterEventListener, PointerExitEventListener } from '../gestures/events'
import { Accumulator, InlineSpan, InlineSpanVisitor } from './inline-span'

export type TextSpanOptions = {
  text?: string | null,
  children?: AtInlineSpan[] | null,
  style?: AtTextPaintingStyle | null,
  recognizer?: AtGestureRecognizer | null,
  cursor?: string | null,
  onEnter?: PointerEnterEventListener | null,
  onExit?: PointerExitEventListener | null, 
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
      options.recognizer ?? null,
      options.cursor ?? null,
      options.onEnter ?? null,
      options.onExit ?? null,
      options.spellOut ?? null,
    )
  }

  public cursor: string
  public text: string | null 
  public children: AtInlineSpan[] | null
  public recognizer: AtGestureRecognizer | null
  
  public onEnter: PointerEnterEventListener | null
  public onExit: PointerEnterEventListener | null

  public spellOut: boolean | null
  
  public get validForMouseTracker () {
    return true
  }

  constructor (
    text: string | null,
    children: AtInlineSpan[] | null,
    style: AtTextPaintingStyle | null,
    recognizer: AtGestureRecognizer | null,
    cursor: string | null,
    onEnter: PointerEnterEventListener | null,
    onExit: PointerExitEventListener | null,
    spellOut: boolean | null,
  ) {
    super(style)

    invariant(At.kKindToCSSValue)
    // invariant(text !== null)

    this.text = text
    this.recognizer = recognizer
    this.cursor = cursor ?? recognizer === null 
      ? At.kKindToCSSValue.click
      : At.kKindToCSSValue.click

    this.spellOut = spellOut
    this.onEnter = onEnter
    this.onExit = onExit

    this.children = children    
  }  
  
  handleEvent (event: AtPointerEvent, entry: AtHitTestEntry) {
    if (event instanceof AtPointerEvent) {
      this.recognizer?.addPointer(event)
    }
  }

  build (
    builder: AtParagraphBuilder,
    textScaleFactor: number = 1.0,
    dimensions: AtPlaceholderDimensions[],
  ) {
    const hasStyle = this.style !== null
    if (hasStyle)
      builder.pushStyle(this.style!.getTextStyle(textScaleFactor))
    if (this.text !== null) {
      try {
        builder.addText(this.text!)
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
        builder.addText('\uFFFD')
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
    if (hasStyle) {
      builder.pop()
    }
  }

  visit (visitor: InlineSpanVisitor) {
    if (this.text !== null) {
      if (!visitor(this)) {
        return false
      }
    }

    if (this.children !== null) {
      for (const child of this.children) {
        if (!child.visit(visitor))
          return false
      }
    }

    return true
  }

  
  getSpanForPositionVisitor (position: AtTextPosition, offset: AtAccumulator): AtInlineSpan | null {
    if (this.text === null) {
      return null
    }

    const affinity = position.affinity
    const targetOffset = position.offset
    const endOffset = offset.value + this.text.length
    if (
      offset.value === targetOffset && affinity === At.Affinity.Downstream ||
      offset.value < targetOffset && targetOffset < endOffset ||
      endOffset == targetOffset && affinity == At.Affinity.Upstream
    ) {
      return this
    }
  
    offset.increment(this.text.length)
    return null
  }

  computeToPlainText(
    text: string, 
    includePlaceholders: boolean = true,
  ) {
    if (this.text !== null) {
      text += this.text
    }
    if (this.children !== null) {
      for (const child of this.children) {
        text = child.computeToPlainText(
          text,
          includePlaceholders,
        )
      }
    }

    return text
  }

  codeUnitAtVisitor (index: number, offset: AtAccumulator): number | null {
    if (this.text === null) {
      return null
    }

    if (index - offset.value < this.text.length) {
      return this.text.charCodeAt(index - offset.value)
    }

    offset.increment(this.text.length)
    return null
  }

  compareTo (other: AtInlineSpan): RenderComparison {
    if (other === this) {
      return RenderComparison.Identical
    }

    // if (other.runtimeType != runtimeType)
    //   return RenderComparison.layout;
    const textSpan = other as TextSpan
    if (
      textSpan.text !== this.text ||
      this.children?.length !== textSpan.children?.length ||
      (this.style === null) !== (textSpan.style == null)
    ) {
      return RenderComparison.Layout
    }
      
    let result = this.recognizer === textSpan.recognizer 
      ? RenderComparison.Identical 
      : RenderComparison.Metadata
    
    if (this.style !== null) {
      invariant(textSpan.style)
      const candidate = this.style.compareTo(textSpan.style)
      
      if (candidate > result) {
        result = candidate
      }

      if (result == RenderComparison.Layout) {
        return result
      }
    }

    
    if (this.children !== null) {
      invariant(textSpan.children)
      for (let index = 0; index < this.children.length; index += 1) {
        const candidate = this.children[index].compareTo(textSpan.children[index])
        
        if (candidate > result) {
          result = candidate
        }

        if (result == RenderComparison.Layout)
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
      other.recognizer === this.recognizer &&
      other.onEnter === this.onEnter &&
      other.onExit === this.onExit &&
      other.cursor == this.cursor &&
      listEquals<AtInlineSpan>(other.children, this.children)
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
